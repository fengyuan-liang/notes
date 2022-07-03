# Netty ChannelOutboundBuffer出站缓冲区分析

上一期我们分析了Pipeline的内部结构，知道了pipeline中会默认添加HeadContext和TailContext。HeadContext是入站和出站事件都实现的处理器，而TailContext只实现了入站，所以当pipeline中触发write()事件时，数据最终会传播到HeadContext中进行处理。

```java
#HeadContext
@Override
public void write(ChannelHandlerContext ctx, Object msg, ChannelPromise promise) {
    unsafe.write(msg, promise);
}
```

而所有对于内存的操作，Netty统一使用了自定义的Unsafe对象去完成，前面几期也说过，NioServerSocketChannel的unsafe对象是NioMessageUnsafe，而NioSocketChannel的unsafe对象是NioByteUnsafe。但其实大部分的实现都在这两个类的父类AbstractUnsafe中完成的，那我们跟进去看看它的write()实现。

```java
#AbstractUnsafe
//每一个Channel内部都会持有一个出站缓冲区对象
private volatile ChannelOutboundBuffer outboundBuffer = new ChannelOutboundBuffer(AbstractChannel.this);

@Override
public final void write(Object msg, ChannelPromise promise) {
    assert EventLoop();
    //AbstractUnsafe中的成员变量outboundBuffer
    //写缓冲区对象，本期的重点
    ChannelOutboundBuffer outboundBuffer = this.outboundBuffer;
    
    if (outboundBuffer == null) {
        //正常情况下outboundBuffer不可能为null，在channel关闭或者异常情况下才有可能
        safeSetFailure(promise, newClosedChannelException(initialCloseCause));
        //channel都异常了，直接释放当前的消息
        ReferenceCountUtil.release(msg);
        return;
    }
    
    //当前写操作的消息大小
    int size;
    try {
        //ByteBuf分为堆内存和直接内存，这个方法是将堆内存转化为直接内存
        //具体实现在AbstractNioByteChannel中，逻辑很简单
        msg = filterOutboundMessage(msg);
        //计算消息的大小，具体实现在#DefaultMessageSizeEstimator.HandleImpl中
        size = pipeline.estimatorHandle().size(msg);
        if (size < 0) {
            size = 0;
        }
    } catch (Throwable t) {
        safeSetFailure(promise, t);
        ReferenceCountUtil.release(msg);
        return;
    }
    //本期重点，将消息添加到写缓冲区中
    outboundBuffer.addMessage(msg, size, promise);
}
```

Netty写数据，并不会直接将数据写入到Socket缓冲区中，而是将数据统一存放到Netty的缓冲区内，并在调用flush()时才会将数据冲刷到Socket缓冲区中。Netty使用ChannelOutboundBuffer对象封装了出站缓冲区的操作，接下来我们就去看看它的内部结构。

# ChannelOutboundBuffer

## 重要字段

```java
//ThreadLocal，为每一个线程提供了一个ByteBuffer数组
private static final FastThreadLocal<ByteBuffer[]> NIO_BUFFERS = new FastThreadLocal<ByteBuffer[]>() {
    @Override
    protected ByteBuffer[] initialValue() throws Exception {
        return new ByteBuffer[1024];
    }
};
//当前缓冲区对象对应的channel
private final Channel channel;
//Entry链表的指针
//已刷新的指针
private Entry flushedEntry;
//未刷新的指针
private Entry unflushedEntry;
//指向Entry链表尾
private Entry tailEntry;
//缓冲区总容量
private volatile long totalPendingSize;
//待刷新的Entry个数
private int flushed;
//记录一次刷新的ByteBuffer数量
private int nioBufferCount;
//记录一次刷新的ByteBuffer的数据量，和上面区别开来
private long nioBufferSize;
//缓冲区是否可写
private volatile int unwritable;
//传播通道是否可写事件的任务
private volatile Runnable fireChannelWritabilityChangedTask;
```

可以看到，这里由引入了一个新对象Entry，先提一下缓冲区的组成结构。unsafe每调用一次write()，就会在ChannelOutboundBuffer对象内部将write的信息包装成一个Entry对象，Entry内部有next字段，指向下一个Entry，这样就将write()写入的信息包装成了Entry链表。再来看看Entry内部都有哪些属性。

## Entry

Entry是ChannelOutboundBuffer的静态内部类

```java
//使用对象池对Entry进行管理，这样不用每次write()都要new出Entry，实现Entry对象的复用
private static final ObjectPool<Entry> RECYCLER = ObjectPool.newPool(new ObjectCreator<Entry>() {
    @Override
    public Entry newObject(Handle<Entry> handle) {
        return new Entry(handle);
    }
});
//帮助Entry对象归还到对象池中
private final Handle<Entry> handle;
//下一个Entry的指针
Entry next;
//真正的数据信息
Object msg;
//在msg被写入channel前，会将msg转成jdk的ByteBuffer对象
ByteBuffer[] bufs;
ByteBuffer buf;
//每一次write()可以注册一个promise，用来判断是否完成当前操作
ChannelPromise promise;
//进度，可能一次flush只刷新了当前Entry的一部分数据
long progress;
long total;
//真实数据量+Entry字段所占的字节数
int pendingSize; 
//在write()时，msg对象一般都是ByteBuf
//count表示ByteBuf底层管理的ByteBuffer个数
int count = -1;
//是否取消，可以通过promise设置取消
boolean cancelled;

//获取Entry
static Entry newInstance(Object msg, int size, long total, ChannelPromise promise) {
    //从对象池取出Entry
    Entry entry = RECYCLER.get();
    entry.msg = msg;
    //pendingSize 包含两部分大小：1. msg数据量大小   2. entry对象自身字段占用的空间大小。
    entry.pendingSize = size + CHANNEL_OUTBOUND_BUFFER_ENTRY_OVERHEAD;
    entry.total = total;
    entry.promise = promise;
    return entry;
}

//取消
int cancel() {
    if (!cancelled) {
        //将当前Entry设置为取消状态
        cancelled = true;
        int pSize = pendingSize;
        //取消后需要释放当前的msg
        ReferenceCountUtil.safeRelease(msg);
        //重置Entry，但是并未更新next字段，也就是说，cancel后当前Entry还在链表内
        msg = Unpooled.EMPTY_BUFFER;
        pendingSize = 0;
        total = 0;
        progress = 0;
        bufs = null;
        buf = null;
        return pSize;
    }
    return 0;
}

//归还Entry到对象池
void recycle() {
    //将Entry重置
    next = null;
    bufs = null;
    buf = null;
    msg = null;
    promise = null;
    progress = 0;
    total = 0;
    pendingSize = 0;
    count = -1;
    cancelled = false;
    //归还到对象池
    handle.recycle(this);
}
```

Entry内部的操作还是比较简单的，Netty在这使用了内存池进行优化，避免new和GC带来的性能问题。接下来回到主逻辑ChannelOutboundBuffer中。

## addMessage添加消息到缓冲区

```java
public void addMessage(Object msg, int size, ChannelPromise promise) {
    //将msg包装成一个Entry对象  total(msg)会计算msg的大小，逻辑和前面计算size差不多
    Entry entry = Entry.newInstance(msg, size, total(msg), promise);
    
    //如果tail为null
    if (tailEntry == null) {
        //将flushedEntry设为null
        flushedEntry = null;
    }
    else {
        //tail不为null，说明已经有链表了
        //追加当前的entry
        Entry tail = tailEntry;
        tail.next = entry;
    }
    //将tail更新为当前entry
    tailEntry = entry;
    
    //判断未刷新的指针是否为null
    if (unflushedEntry == null) {
        //将未刷新的指针指向当前entry
        unflushedEntry = entry;
    }
    //更新写缓冲区的容量
    //entry.pendingSize：包括了entry本身字段的大小和msg真实数据的大小
    //这里会修改unwritable的值，可以通过channel.isWritable()进行判断当前channel是否可以写数据
    //channel是否可写需要手动调用isWritable()进行判断，如果没有调用，这个unwritable值并没有意义
    incrementPendingOutboundBytes(entry.pendingSize, false);
}

private void incrementPendingOutboundBytes(long size, boolean invokeLater) {
    if (size == 0) {
        return;
    }
    //原子更新当前缓冲区总的数据容量
    long newWriteBufferSize = TOTAL_PENDING_SIZE_UPDATER.addAndGet(this, size);
    //如果当前容量超过配置的高水位时，也就是当前缓冲区容量已经到上限了，不可以再写数据
    if (newWriteBufferSize > channel.config().getWriteBufferHighWaterMark()) {
        //将channel设置为不可写
        setUnwritable(invokeLater);
    }
}

private void setUnwritable(boolean invokeLater) {
    for (;;) {
        final int oldValue = unwritable;
        final int newValue = oldValue | 1;
        if (UNWRITABLE_UPDATER.compareAndSet(this, oldValue, newValue)) {
            if (oldValue == 0 && newValue != 0) {
                //向通道传播事件
                fireChannelWritabilityChanged(invokeLater);
            }
            break;
        }
    }
}

private void fireChannelWritabilityChanged(boolean invokeLater) {
    final ChannelPipeline pipeline = channel.pipeline();
    if (invokeLater) {
        Runnable task = fireChannelWritabilityChangedTask;
        if (task == null) {
            //第一次进来task为null，然后用fireChannelWritabilityChangedTask缓存任务
            fireChannelWritabilityChangedTask = task = new Runnable() {
                @Override
                public void run() {
                    //向通道传播事件
                    pipeline.fireChannelWritabilityChanged();
                }
            };
        }
        channel.eventLoop().execute(task);
    } else {
        pipeline.fireChannelWritabilityChanged();
    }
}
```

addMessage这个方法只完成了消息添加到缓冲区，并且更新了缓冲区的总容量，判断是否需要改变channel可写状态。接下来去看看flush的逻辑。

## flush

用户的业务handler中调用flush()，最终会传播到HeadContext中，然后由unsafe进行处理

```java
#HeadContext
@Override
public void flush(ChannelHandlerContext ctx) {
    unsafe.flush();
}

#AbstractUnsafe
@Override
public final void flush() {
    assertEventLoop();
    //获取当前channel的缓冲区
    ChannelOutboundBuffer outboundBuffer = this.outboundBuffer;
    if (outboundBuffer == null) {
        return;
    }
    //逐步分析这两个方法
    outboundBuffer.addFlush();
    flush0();
}
```

### addFlush()

```java
public void addFlush() {
    //获取未刷新的指针
    Entry entry = unflushedEntry;
    if (entry != null) {
        //执行到这，说明有数据需要刷新
        if (flushedEntry == null) {
            //将已刷新的指针指向未刷新的指针
            flushedEntry = entry;
        }
        do {
            //将待刷新的Entry个数++
            flushed ++;
            //判断当前entry是否在flush前被取消，通过entry绑定的promise取消
            if (!entry.promise.setUncancellable()) {
                //取消当前entry，返回值为当前entry的pendingsize
                int pending = entry.cancel();
                //和incrementPendingOutboundBytes类似，将总容量减去当前entry的这一部分
                decrementPendingOutboundBytes(pending, false, true);
            }
            entry = entry.next;
            //循环条件，遍历到链表尾
        } while (entry != null);
        //将未刷新的指针指向null
        unflushedEntry = null;
    }
}

private void decrementPendingOutboundBytes(long size, boolean invokeLater, boolean notifyWritability) {
    if (size == 0) {
        return;
    }
    //原子更新totalPendingSize
    long newWriteBufferSize = TOTAL_PENDING_SIZE_UPDATER.addAndGet(this, -size);
    //如果当前容量小于低水位
    if (notifyWritability && newWriteBufferSize < channel.config().getWriteBufferLowWaterMark()) {
        //设置为可写状态，和前面逻辑差不多，不贴出来了
        setWritable(invokeLater);
    }
}
```

addFlush主要是将链表的全局指针更新了一下，将flushedEntry指向原来的unflushedEntry，然后遍历链表将取消的entry都处理一下，最后将unflushedEntry指向null。

### flush0()

flush0()的实现在AbstractNioUnsafe中，不过内部使用super调用了AbstractUnsafe的flush0()，具体的逻辑还是在父类中，所以直接看父类的。

```java
#AbstractUnsafe
protected void flush0() {
    if (inFlush0) {
        return;
    }
    final ChannelOutboundBuffer outboundBuffer = this.outboundBuffer;
    if (outboundBuffer == null || outboundBuffer.isEmpty()) {
        return;
    }
    inFlush0 = true;
    //......
    try {
        //核心逻辑
        doWrite(outboundBuffer);
    } catch (Throwable t) {
        //......
    } finally {
        inFlush0 = false;
    }
}

#NioSocketChannel
protected void doWrite(ChannelOutboundBuffer in) throws Exception {
    //获取jdk的channel对象
    SocketChannel ch = javaChannel();
    //自旋次数,默认16
    int writeSpinCount = config().getWriteSpinCount();
    
    //循环内部，就是从写缓冲区内获取一部分的ByteBuffer，然后将这些数据写入socket缓冲区
    do {
        
        //判断写缓冲区是否还有数据
        if (in.isEmpty()) {
            //这个方法会将selector绑定的OP_WRITE给清除，因为写缓冲区的数据已经写完了
            clearOpWrite();
            //正常情况，将写缓冲区的数据刷新到socket中就会从这退出
            return;
        }
        
        //执行到这，说明写缓冲区内还有数据
        
        //动态调整的参数，控制每次从写缓冲区刷新的数据量
        int maxBytesPerGatheringWrite = ((NioSocketChannelConfig) config).getMaxBytesPerGatheringWrite();
        
        //在写缓冲区内保存的Entry中，数据是ByteBuf类型的，而最终需要的底层jdk类型是ByteBuffer
        //这个方法会将ByteBuf转为ByteBuffer数组
        ByteBuffer[] nioBuffers = in.nioBuffers(1024, maxBytesPerGatheringWrite);
        //获取刚刚转换的ByteBuffer对象数量
        int nioBufferCnt = in.nioBufferCount();
        switch (nioBufferCnt) {
                
            //可能是写缓冲区没有数据  
            case 0:
                writeSpinCount -= doWrite0(in);
                break;
                
            //一般都会到这，业务一般都是使用writeAndFlush()进行写数据的，所以添加一个Entry就会被刷新
            case 1: {
                //因为只有一个ByteBuffer，所以取数组的第一个元素就行
                ByteBuffer buffer = nioBuffers[0];
                //buffer中的数据量
                int attemptedBytes = buffer.remaining();
                //ch是jdk的SocketChannel
                //write会返回真实写入的数据量，可能并不是写完buffer的全部内容
                //这取决于socket缓冲区的容量
                final int localWrittenBytes = ch.write(buffer);
                //如果返回 -1，说明socket缓冲区已经满了，不能写本次的buffer
                if (localWrittenBytes <= 0) {
                    //设置selector关心OP_WRITE事件，等到socket缓冲区有空间时，会继续处理写缓冲区的数据
                    incompleteWrite(true);
                    return;
                }
                
                //调整每次从写缓冲区刷新的数据量
                adjustMaxBytesPerGatheringWrite(attemptedBytes, localWrittenBytes, maxBytesPerGatheringWrite);
                
                //从写缓冲区中移除掉已写入的数据
                in.removeBytes(localWrittenBytes);
                //自旋次数--
                --writeSpinCount;
                break;
            }
            
            //逻辑和 1 差不多
            default: {
                long attemptedBytes = in.nioBufferSize();
                final long localWrittenBytes = ch.write(nioBuffers, 0, nioBufferCnt);
                if (localWrittenBytes <= 0) {
                    incompleteWrite(true);
                    return;
                }
                adjustMaxBytesPerGatheringWrite((int) attemptedBytes, (int) localWrittenBytes,
                        maxBytesPerGatheringWrite);
                in.removeBytes(localWrittenBytes);
                --writeSpinCount;
                break;
            }
        }
    } while (writeSpinCount > 0);
    
    //执行到这，说明执行了16次写入数据的循环，可能写缓冲区的数据还未刷新完成
    //通过writeSpinCount判断是否刷新了16次数据
    
    //对未写完的数据进行一些处理
    incompleteWrite(writeSpinCount < 0);
}
```

这个方法内部整体涉及了几个方法调用，1.转换ByteBuffer；2.动态调整刷新数据量；3.移除已经写入socket缓冲区的数据；4.对未写完的数据进行处理。我们按照重要顺序一个个的分析。

#### 转换ByteBuffer

```java
#ChannelOutboundBuffer
//maxCount：最多获取该参数个ByteBuffer对象
//maxBytes：本次转换ByteBuf数据量的限制
public ByteBuffer[] nioBuffers(int maxCount, long maxBytes) {
    assert maxCount > 0;
    assert maxBytes > 0;
    
    //ByteBuf转换ByteBuffer的总数据量
    long nioBufferSize = 0;
    //转换成ByteBuffer对象的总个数
    int nioBufferCount = 0;
    
    //前面分析字段时说过，用ThreadLocal为每个线程分配ByteBuffer数组
    final InternalThreadLocalMap threadLocalMap = InternalThreadLocalMap.get();
    //默认是1024长度
    ByteBuffer[] nioBuffers = NIO_BUFFERS.get(threadLocalMap);
    
    //获取已刷新的指针
    Entry entry = flushedEntry;
    
    //isFlushedEntry() 判断entry是否是unflushedEntry
    //在前面addFlush()时，已经将flushedEntry指向了unflushedEntry，而把unflushedEntry设置为null
    while (isFlushedEntry(entry) && entry.msg instanceof ByteBuf) {
        //取消的entry会跳过
        if (!entry.cancelled) {
            
            //获取entry内部的真实数据msg
            ByteBuf buf = (ByteBuf) entry.msg;
            //buf的读索引
            final int readerIndex = buf.readerIndex();
            //计算buf可读的数据量
            final int readableBytes = buf.writerIndex() - readerIndex;
            
            //判断buf是否有可读数据
            if (readableBytes > 0) {
                
                //把maxBytes - readableBytes < nioBufferSize转化一下
                //maxBytes < readableBytes+nioBufferSize 
                //转换ByteBuffer的总量加上这一轮的buf的可读数据是否超过限制
                if (maxBytes - readableBytes < nioBufferSize && nioBufferCount != 0) {
                    break;
                }
                
                //更新总容量大小
                nioBufferSize += readableBytes;
                
                //entry.count默认是-1
                int count = entry.count;
                if (count == -1) {
                    //计算当前ByteBuffer由几个ByteBuffer组成
                    //CompositeByteBuf是可以组合多个的
                    entry.count = count = buf.nioBufferCount();
                }
                
                //表示需要多大的ByteBuffer数组，扩容ByteBuffer数组会用这个变量
                int neededSpace = min(maxCount, nioBufferCount + count);
                if (neededSpace > nioBuffers.length) {
                    //扩容数组
                    nioBuffers = expandNioBufferArray(nioBuffers, neededSpace, nioBufferCount);
                    //将新数组放入ThreadLocal
                    NIO_BUFFERS.set(threadLocalMap, nioBuffers);
                }
                
                //一般都是1
                if (count == 1) {
                    //entry.buf默认是null
                    ByteBuffer nioBuf = entry.buf;
                    if (nioBuf == null) {
                        //将ByteBuf转换成ByteBuffer，自行查看下逻辑，就是设置limit，position等
                        entry.buf = nioBuf = buf.internalNioBuffer(readerIndex, readableBytes);
                    }
                    //将ByteBuffer存入数组
                    nioBuffers[nioBufferCount++] = nioBuf;
                } else {
                    //将多个ByteBuf一起转换
                    nioBufferCount = nioBuffers(entry, buf, nioBuffers, nioBufferCount, maxCount);
                }
                // 条件成立：说明转换的ByteBuffer 已经达到maxCount，跳出循环。
                if (nioBufferCount == maxCount) {
                    break;
                }
            }
        }
        //遍历下一个entry
        entry = entry.next;
    }
    //本次flush转换的ByteBuffer的数量，记录在写缓冲区对象的字段中
    this.nioBufferCount = nioBufferCount;
    //本次flush转换的ByteBuffer数据量
    this.nioBufferSize = nioBufferSize;
    //返回ByteBuffer数组
    return nioBuffers;
}
```

#### 动态调整刷新数据量

```java
//attempted：buffer中可写的数据量
//written：实际写的数据量
private void adjustMaxBytesPerGatheringWrite(int attempted, int written, int oldMaxBytesPerGatheringWrite) {
    //如果写入了所有的数据量
    if (attempted == written) {
        //预测socket缓冲区还能写入较多数据
        if (attempted << 1 > oldMaxBytesPerGatheringWrite) {
            //将下一轮的最大限制调高
            ((NioSocketChannelConfig) config).setMaxBytesPerGatheringWrite(attempted << 1);
        }
    } else if (attempted > MAX_BYTES_PER_GATHERING_WRITE_ATTEMPTED_LOW_THRESHOLD && written < attempted >>> 1) {
        //将下一轮的最大限制降低
        ((NioSocketChannelConfig) config).setMaxBytesPerGatheringWrite(attempted >>> 1);
    }
}
```

#### 移除已经写入socket缓冲区的数据

```java
//writtenBytes：真实写入socket缓冲区的数据量
public void removeBytes(long writtenBytes) {
    for (;;) {
        //current()返回flushedEntry指向的entry的msg
        Object msg = current();
        if (!(msg instanceof ByteBuf)) {
            assert writtenBytes == 0;
            break;
        }
        //msg转为ByteBuf
        final ByteBuf buf = (ByteBuf) msg;
        //获取读索引
        final int readerIndex = buf.readerIndex();
        //计算出有效数据量
        final int readableBytes = buf.writerIndex() - readerIndex;
        
        //判断当前Entry的数据是否 <= 已写入的数据量
        if (readableBytes <= writtenBytes) {
            //说明当前的Entry所有数据都已写入
            if (writtenBytes != 0) {
                //更新当前Entry的进度，其实这里是将进度拉满了
                progress(readableBytes);
                //更新writtenBytes，表示还有多少数据未从写缓冲区移除
                writtenBytes -= readableBytes;
            }
            //移除当前flushedEntry指向的 entry 节点
            remove();
        }
        
        //执行到这，说明当前Entry只刷新了一部分的数据，不能移除当前Entry
        else {
            if (writtenBytes != 0) {
                //更新读索引
                buf.readerIndex(readerIndex + (int) writtenBytes);
                //更新进度
                progress(writtenBytes);
            }
            break;
        }
    }
    //将ThreadLocal中的ByteBuffer数组清空
    clearNioBuffers();
}

public boolean remove() {
    Entry e = flushedEntry;
    if (e == null) {
        clearNioBuffers();
        return false;
    }
    Object msg = e.msg;
    ChannelPromise promise = e.promise;
    int size = e.pendingSize;
    //移除Entry
    removeEntry(e);
    if (!e.cancelled) {
        ReferenceCountUtil.safeRelease(msg);
        safeSuccess(promise);
        decrementPendingOutboundBytes(size, false, true);
    }
    //回收当前的Entry
    e.recycle();
    return true;
}

private void removeEntry(Entry e) {
    //flushed在addFLush中进行累加，表示当前需要刷新的Entry的数量
    if (-- flushed == 0) {
        //执行到这说明已经刷新完了，清空这些指针
        flushedEntry = null;
        if (e == tailEntry) {
            tailEntry = null;
            unflushedEntry = null;
        }
    }
    else {
        //执行到这说明还未刷新完成，将flushedEntry指向下一个
        flushedEntry = e.next;
    }
}
```

#### 对未写完的数据进行处理

```java
protected final void incompleteWrite(boolean setOpWrite) {
    if (setOpWrite) {
        //socket缓冲区写满了，暂时不能继续刷新
        //将selector设置OP_WRTIE感兴趣
        setOpWrite();
    } else {
        //写入了16次的数据，可能写缓冲区还剩余了数据
        //先清除掉OP_WRITE
        clearOpWrite();
        //向eventLoop提交一个flushTask
        eventLoop().execute(flushTask);
    }
}

private final Runnable flushTask = new Runnable() {
    @Override
    public void run() {
        //执行flush0()
        ((AbstractNioUnsafe) unsafe()).flush0();
    }
};
```

思考一下这里为什么要这样做？因为一个EventLoop管理了多个channel，当前EventLoop写了16次数据，这个channel的写缓冲区还没有刷新完，我们不能让这一个channel占用了大部分的时间，而不去处理其他channel上的事件，所以提交了一个刷新的任务，让EventLoop先处理完其他的channel，最后再来处理这个channel的刷新任务。而且这里还要注意，整个flush()是分为了两个步骤，addFlush()和flush0()，前者已经设置好了需要刷新的区域，而后者才是真正刷新这块区域数据，所以这里提交的任务是去执行flush0()，就算上一轮flush()没有完成，但并不会影响flushedEntry指针，还是会从上一轮没刷完的数据开始继续刷新。

到这里，整个出站缓冲区的核心逻辑就分析完了，这里一定要搞清楚写缓冲区和socket缓冲区的区别，前者是Netty的，后者是操作系统的，总体逻辑不是很难，不明白的可以举几个实例跟着源码计算一下就会理解的。