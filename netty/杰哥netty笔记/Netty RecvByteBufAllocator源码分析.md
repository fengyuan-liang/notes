# Netty RecvByteBufAllocator源码分析

在前面Netty系列的文章中，我们在客户端消息处理的时候埋下了一个问题，就是#NioByteUnsafe的read()方法中，有一个预测内存分配大小的组件还没有分析

#NioByteUnsafe

```java
public final void read() {
	//......
    //缓冲区分配器
	final ByteBufAllocator allocator = config.getAllocator();
    //预测分配多大内存
	final RecvByteBufAllocator.Handle allocHandle = recvBufAllocHandle();
    //......
}
```

这一期就来带大家分析一下内存分配器的原理。

首先我们要知道这几个接口对应的具体类型是什么，在recvBufAllocHandle()方法内也是通过config()对象拿到的，所以我们需要先找到config()指的对象是谁？

```java
@Override
public RecvByteBufAllocator.Handle recvBufAllocHandle() {
    if (recvHandle == null) {
        recvHandle = config().getRecvByteBufAllocator().newHandle();
    }
    return recvHandle;
}
```

由于目前是客户端通道处理的读消息，那么从NioSocketChannel内部去分析，可以发现其中有一个构造对config对象进行了实例化

```java
#NioSocketChannel
public NioSocketChannel(Channel parent, SocketChannel socket) {
    super(parent, socket);
    //继续跟进
    config = new NioSocketChannelConfig(this, socket.socket());
}

//最终跟到#DefaultChannelConfig的构造里
public DefaultChannelConfig(Channel channel) {
    //AdaptiveRecvByteBufAllocator类型
    this(channel, new AdaptiveRecvByteBufAllocator());
}

protected DefaultChannelConfig(Channel channel, RecvByteBufAllocator allocator) {
    //set设置，最终将RecvByteBufAllocator rcvBufAllocator赋值
    setRecvByteBufAllocator(allocator, channel.metadata());
    this.channel = channel;
}
```

所以RecvByteBufAllocator的类型是AdaptiveRecvByteBufAllocator，而上面的ByteBufAllocator allocator使用了一个默认值，可以根据平台和配置进行选取，一般都是使用PooledByteBufAllocator类型的，可以自行跟一下源码。

## RecvByteBufAllocator接口分析

先来看看RecvByteBufAllocator接口

```java
public interface RecvByteBufAllocator {
    //创建一个内存预测器
    Handle newHandle();
    
    //用来预测需要分配多大的内存
    @Deprecated
    interface Handle {
        //通过缓冲区分配器分配内存，真正分配内存的是ByteBufAllocator
        ByteBuf allocate(ByteBufAllocator alloc);
        //猜测需要分配多大的内存，只负责提供大小，不负责分配内存
        int guess();
        //重置属性
        void reset(ChannelConfig config);
        //增加当前读循环已读取的消息数量
        void incMessagesRead(int numMessages);
        //设置最后一次读取的字节数
        void lastBytesRead(int bytes);
        //获取最后一次读取的字节数
        int lastBytesRead();
        //设置尝试读取的字节数或已经读取的字节数
        void attemptedBytesRead(int bytes);
        //获取尝试读取的字节数或已经读取的字节数
        int attemptedBytesRead();
        //是否继续读
        boolean continueReading();
        //读取完成
        void readComplete();
    }
}
```

以上接口方法，实现基本在AdaptiveRecvByteBufAllocator和DefaultMaxMessagesRecvByteBufAllocator两个类中，并且后者是前者的父类，所以我们综合分析这两个类的实现。

## AdaptiveRecvByteBufAllocator分析

```java
//默认内存大小最小值
static final int DEFAULT_MINIMUM = 64;
//默认内存大小初始值
static final int DEFAULT_INITIAL = 1024;
//默认内存大小最大值
static final int DEFAULT_MAXIMUM = 65536;
//下标增量
private static final int INDEX_INCREMENT = 4;
//下标减量
private static final int INDEX_DECREMENT = 1;
//用来存储内存分配大小的数组
private static final int[] SIZE_TABLE;
static {
    List<Integer> sizeTable = new ArrayList<Integer>();
    
    //16 32 48 64 ..... 496
    //每一轮循环都+16，直到添加了496为止
    for (int i = 16; i < 512; i += 16) {
        //向集合添加这些数字
        sizeTable.add(i);
    }
    
    //i > 0 为什么条件是这样的？ 因为超过了Integer.MAX_VALUE就溢出为负数了
    //i <<= 1 每一次左移一位 相当于*2
    //512 1024 2048 ...... Integer.MAX_VALUE
    for (int i = 512; i > 0; i <<= 1) {
        sizeTable.add(i);
    }
    
    //将集合中添加的数全部赋值到SIZE_TABLE中
    SIZE_TABLE = new int[sizeTable.size()];
    for (int i = 0; i < SIZE_TABLE.length; i ++) {
        SIZE_TABLE[i] = sizeTable.get(i);
    }
    //此时数组内的值为
    //16 32 48 64 .... 496 512 1024 .... Integer.MAX_VALUE
    //这些就是以后分配内存大小的数值
}

//最小内存分配下标
private final int minIndex;
//最大内存分配下标
private final int maxIndex;
//内存初始值
private final int initial;
```

再来看看构造，在NioSocketChannel的构造流程内使用的是无参构造

```java
public AdaptiveRecvByteBufAllocator() {
    //使用了上面的静态属性
    this(DEFAULT_MINIMUM, DEFAULT_INITIAL, DEFAULT_MAXIMUM);
}

public AdaptiveRecvByteBufAllocator(int minimum, int initial, int maximum) {
    //校验属性值
    checkPositive(minimum, "minimum");
    if (initial < minimum) {
        throw new IllegalArgumentException("initial: " + initial);
    }
    if (maximum < initial) {
        throw new IllegalArgumentException("maximum: " + maximum);
    }
    //根据容量来获取到对应的下标
    int minIndex = getSizeTableIndex(minimum);
    //进行冗余判断，不够的话需要向后移
    if (SIZE_TABLE[minIndex] < minimum) {
        this.minIndex = minIndex + 1;
    } else {
        this.minIndex = minIndex;
    }
    //同上
    int maxIndex = getSizeTableIndex(maximum);
    if (SIZE_TABLE[maxIndex] > maximum) {
        this.maxIndex = maxIndex - 1;
    } else {
        this.maxIndex = maxIndex;
    }
    //赋值初始值
    this.initial = initial;
}

//获取当前size对应的数组下标
private static int getSizeTableIndex(final int size) {
    //这里的算法是二分法，不懂的朋友可以多练练算法。
    for (int low = 0, high = SIZE_TABLE.length - 1;;) {
        if (high < low) {
            return low;
        }
        if (high == low) {
            return high;
        }
        int mid = low + high >>> 1;
        int a = SIZE_TABLE[mid];
        int b = SIZE_TABLE[mid + 1];
        if (size > b) {
            low = mid + 1;
        } else if (size < a) {
            high = mid - 1;
        } else if (size == a) {
            return mid;
        } else {
            return mid + 1;
        }
    }
}
```

以上的计算出来的参数也只是为了提供给Handle使用

```java
public Handle newHandle() {
    return new HandleImpl(minIndex, maxIndex, initial);
}

#AdaptiveRecvByteBufAllocator的内部类
private final class HandleImpl extends MaxMessageHandle {
    private final int minIndex;
    private final int maxIndex;
    private int index;
    //下一次接收的缓冲区大小
    private int nextReceiveBufferSize;
    //是否要减少内存
    private boolean decreaseNow;
    HandleImpl(int minIndex, int maxIndex, int initial) {
        //一系列赋值操作
        this.minIndex = minIndex;
        this.maxIndex = maxIndex;
        //通过初始内存大小找到数组中对应的下标
        index = getSizeTableIndex(initial);
        //赋值给nextReceiveBufferSize
        nextReceiveBufferSize = SIZE_TABLE[index];
    }
    
    //设置最后一次读取的字节数
    @Override
    public void lastBytesRead(int bytes) {
        //attemptedBytesRead()是父类方法，等会分析
        if (bytes == attemptedBytesRead()) {
            //记录属性
            record(bytes);
        }
        //调用父类
        super.lastBytesRead(bytes);
    }
    
    //返回下一次内存分配大小
    @Override
    public int guess() {
        return nextReceiveBufferSize;
    }
    
    //动态分配内存的关键
    //actualReadBytes真实读取的大小
    private void record(int actualReadBytes) {
        //判断真实读取的数量是否太小
        if (actualReadBytes <= SIZE_TABLE[max(0, index - INDEX_DECREMENT)]) {
            //判断是否需要减少，默认是false
            if (decreaseNow) {
                //选择出两者之间大的
                index = max(index - INDEX_DECREMENT, minIndex);
                //将下一次读取大小重新赋值
                nextReceiveBufferSize = SIZE_TABLE[index];
                //不用减少
                decreaseNow = false;
            } else {
                //将decreaseNow设置为true
                decreaseNow = true;
            }
            
            //如果真实读取大小>=下一次读取的大小
        } else if (actualReadBytes >= nextReceiveBufferSize) {
            //选择出两者之间小的
            index = min(index + INDEX_INCREMENT, maxIndex);
            //将下一次读取大小重新赋值
            nextReceiveBufferSize = SIZE_TABLE[index];
            //不用减少
            decreaseNow = false;
        }
    }
    
    //读取完毕
    @Override
    public void readComplete() {
        //记录一些属性
        record(totalBytesRead());
    }
}
```

看完这些方法大家肯定很蒙，还不知道到底做了什么事情，我们先分析完HandleImpl的父类MaxMessageHandle后再回来举例分析这些方法。

## DefaultMaxMessagesRecvByteBufAllocator的内部类MaxMessageHandle

```java
public abstract class MaxMessageHandle implements ExtendedHandle {
    //channel的config
    private ChannelConfig config;
    //当前evenLoop，可循环读事件的次数，即可连续几次doReadMessages从底层获取IO数据
    //会在DefaultMaxMessagesRecvByteBufAllocator构造中赋值
    private int maxMessagePerRead;
    //读取消息个数，不是字节数
    private int totalMessages;
    //读取的字节总量
    private int totalBytesRead;
    //本次读操作期望读取的字节数
    private int attemptedBytesRead;
    //最后一次读操作读取的字节数
    private int lastBytesRead;
    private final boolean respectMaybeMoreData = DefaultMaxMessagesRecvByteBufAllocator.this.respectMaybeMoreData;
    
    //判断是否可读取更多消息的Supplier，会在continueReading操作中使用
    //如果‘最后一次读操作所期望读取的字节数’与‘最后一次读操作真实读取的字节数’一样，则表示当前的缓冲区容量已经被写满了，可能还有数据等待着被读取。
    private final UncheckedBooleanSupplier defaultMaybeMoreSupplier = new UncheckedBooleanSupplier() {
        @Override
        public boolean get() {
            return attemptedBytesRead == lastBytesRead;
        }
    };
    
    //重新设置config成员变量，并将totalMessages、totalBytesRead重置为0。重置maxMessagePerRead。
    @Override
    public void reset(ChannelConfig config) {
        this.config = config;
        maxMessagePerRead = maxMessagesPerRead();
        totalMessages = totalBytesRead = 0;
    }
    
    //根据给定的缓冲区分配器，以及guess()所返回的预测的缓存区容量大小，构建一个新的缓冲区。
    @Override
    public ByteBuf allocate(ByteBufAllocator alloc) {
        //#HandleImpl的guess()
        return alloc.ioBuffer(guess());
    }
    
    //增加消息读取次数
    @Override
    public final void incMessagesRead(int amt) {
        totalMessages += amt;
    }
  	
  	//设置最后一次读操作的读取字节数。这里只有当bytes>0时才会进行totalBytesRead的累加。
  	//因为当bytes<0时，1. 0表示读取完毕  2. -1表示channel关闭
    @Override
    public void lastBytesRead(int bytes) {
        lastBytesRead = bytes;
        if (bytes > 0) {
            totalBytesRead += bytes;
        }
    }
    
    //返回最后一次读取的字节数
    @Override
    public final int lastBytesRead() {
        return lastBytesRead;
    }
    
    //是否需要继续读取
    @Override
    public boolean continueReading() {
        return continueReading(defaultMaybeMoreSupplier);
    }
    
    @Override
    public boolean continueReading(UncheckedBooleanSupplier maybeMoreDataSupplier) {
        //如果返回true，要满足以下条件
        //1.config.isAutoRead() 设置为自动读取
        //2.maybeMoreDataSupplier.get() 在上面分析过
        //3.totalMessages < maxMessagePerRead 已经读取的消息次数 < 一个读循环最大能读取消息的次数
        //4.totalBytesRead > 0 说明totalBytesRead最多只能读取Integer.MAX_VALUE的字节数
        return config.isAutoRead() &&
               (!respectMaybeMoreData || maybeMoreDataSupplier.get()) &&
               totalMessages < maxMessagePerRead &&
               totalBytesRead > 0;
    }
    
    //子类实现
    @Override
    public void readComplete() {
    }
    
    //返回本次期望读取的字节数
    @Override
    public int attemptedBytesRead() {
        return attemptedBytesRead;
    }
    
    //设置本次期望读取的字节数
    @Override
    public void attemptedBytesRead(int bytes) {
        attemptedBytesRead = bytes;
    }
    
   	//返回已经读取的字节数
    protected final int totalBytesRead() {
        //防止溢出
        return totalBytesRead < 0 ? Integer.MAX_VALUE : totalBytesRead;
    }
}
```

到这里相关的方法都已经分析完成了，接下来让我们代入到#NioByteUnsafe的read()里再进行分析。

## NioByteUnsafe的read()再分析

接下来只注释和内存分配相关的代码

```java
public final void read() {
    final ChannelConfig config = config();
    if (shouldBreakReadReady(config)) {
        clearReadPending();
        return;
    }
    final ChannelPipeline pipeline = pipeline();
    //获取池化内存分配器，真正分配内存的对象
    final ByteBufAllocator allocator = config.getAllocator();
    //获取预测内存大小处理器，AdaptiveRecvByteBufAllocator类型
    final RecvByteBufAllocator.Handle allocHandle = recvBufAllocHandle();
    //设置一下相关属性，#MaxMessageHandle的reset()
    allocHandle.reset(config);
    ByteBuf byteBuf = null;
    boolean close = false;
    try {
        do {
            //分配内存
            byteBuf = allocHandle.allocate(allocator);
            //doReadBytes()内部会返回读取到的字节数，并且会调用attemptedBytesRead()方法
            //将真实读取到的字节数设置为最后一次读取字节数
            allocHandle.lastBytesRead(doReadBytes(byteBuf));
            //获取最后一次读取字节数，以下两种情况
            //1. 0 说明读取完毕
            //2. -1 说明channel关闭
            if (allocHandle.lastBytesRead() <= 0) {
                byteBuf.release();
                byteBuf = null;
                //通过最后一次读取字节数判断是否关闭
                close = allocHandle.lastBytesRead() < 0;
                if (close) {
                    readPending = false;
                }
                break;
            }
            //增加一次读取消息次数
            allocHandle.incMessagesRead(1);
            readPending = false;
            pipeline.fireChannelRead(byteBuf);
            byteBuf = null;
            //循环条件continueReading()
        } while (allocHandle.continueReading());
        //读取完成
        allocHandle.readComplete();
        pipeline.fireChannelReadComplete();
        if (close) {
            closeOnRead(pipeline);
        }
    } catch (Throwable t) {
        handleReadException(pipeline, byteBuf, t, close, allocHandle);
    } finally {
        if (!readPending && !config.isAutoRead()) {
            removeReadOp();
        }
    }
}
```

在上面整个流程中，我们总结一下，由continueReading()来控制读循环，每一轮循环首先由allocate()进行内存分配，而在allocate()内部，内存大小是由guess()完成。接着将真实的读取字节数传入lastBytesRead()进行设置，并且通过最后一次读取字节数来判断是否读取数据完毕。最后就是incMessagesRead()增加一次读取的消息次数，然后一轮循环就完成了。

allocHandle就是通过每一轮读取的字节数来进行动态调整下一次的内存该分配多大，具体实现就在

AdaptiveRecvByteBufAllocator的lastBytesRead()内，会调用record()进行调整。

## Netty动态调整内存大小案例分析

现在我们就构造几个虚拟的值来帮助我们再次分析record()是如何调整内存分配大小的。

```java
//SIZE_TABLE=={16,32,48,64,80......}
//我们假设每一轮读取的真实字节数为  20,50,60,50
//假设index为0，nextReceiveBufferSize的初始值就是16
//INDEX_INCREMENT为4，INDEX_DECREMENT为1，decreaseNow为false
//maxIndex为SIZE_TABLE的长度，minIndex为0
//按以上条件进行分析

//第一轮
//actualReadBytes==20
private void record(int actualReadBytes) {
    //max(0, 0 - 1)==0   SIZE_TABLE[0]==16
    if (actualReadBytes <= SIZE_TABLE[max(0, index - INDEX_DECREMENT)]) {
        if (decreaseNow) {
            index = max(index - INDEX_DECREMENT, minIndex);
            nextReceiveBufferSize = SIZE_TABLE[index];
            decreaseNow = false;
        } else {
            decreaseNow = true;
        }
        
        //条件成立  20>16
    } else if (actualReadBytes >= nextReceiveBufferSize) {
        //min(0 + 4, maxIndex)==4
        index = min(index + INDEX_INCREMENT, maxIndex);
        //nextReceiveBufferSize赋值为80
        nextReceiveBufferSize = SIZE_TABLE[index];
        //真实读取的字节数超过了预测值，下一次可能还会更大，所以就不用减少内存
        decreaseNow = false;
    }
}

//第二轮
//上一轮参数 index==4，nextReceiveBufferSize==80，decreaseNow==false
//actualReadBytes==50
private void record(int actualReadBytes) {
    //SIZE_TABLE[4-1]==64
    //条件成立 50<64
    if (actualReadBytes <= SIZE_TABLE[max(0, index - INDEX_DECREMENT)]) {
        if (decreaseNow) {
            index = max(index - INDEX_DECREMENT, minIndex);
            nextReceiveBufferSize = SIZE_TABLE[index];
            decreaseNow = false;
        } else {
            //说明上一轮预测的内存偏大，下一轮需要进行减少
            decreaseNow = true;
        }
        
    } else if (actualReadBytes >= nextReceiveBufferSize) {
        index = min(index + INDEX_INCREMENT, maxIndex);
        nextReceiveBufferSize = SIZE_TABLE[index];
        decreaseNow = false;
    }
}

//第三轮
//上一轮参数 index==4，nextReceiveBufferSize==80，decreaseNow==true
//actualReadBytes==60
private void record(int actualReadBytes) {
    //SIZE_TABLE[4-1]==64
    //条件成立  60<64
    if (actualReadBytes <= SIZE_TABLE[max(0, index - INDEX_DECREMENT)]) {
        //上一轮预测需要减少
        if (decreaseNow) {
            //max(3, 0)==3
            index = max(index - INDEX_DECREMENT, minIndex);
            //nextReceiveBufferSize赋值为64
            nextReceiveBufferSize = SIZE_TABLE[index];
            //本轮已经减少过，下一轮暂时不减少
            decreaseNow = false;
        } else {
            decreaseNow = true;
        }
        
    } else if (actualReadBytes >= nextReceiveBufferSize) {
        index = min(index + INDEX_INCREMENT, maxIndex);
        nextReceiveBufferSize = SIZE_TABLE[index];
        decreaseNow = false;
    }
}

//第四轮
//上一轮参数 index==3，nextReceiveBufferSize==64，decreaseNow==false
//actualReadBytes==50
private void record(int actualReadBytes) {
    //SIZE_TABLE[3-1]==48
    //条件不成立  50>48
    if (actualReadBytes <= SIZE_TABLE[max(0, index - INDEX_DECREMENT)]) {
        if (decreaseNow) {
            index = max(index - INDEX_DECREMENT, minIndex);
            nextReceiveBufferSize = SIZE_TABLE[index];
            decreaseNow = false;
        } else {
            decreaseNow = true;
        }
        //条件不成立  50<64
    } else if (actualReadBytes >= nextReceiveBufferSize) {
        index = min(index + INDEX_INCREMENT, maxIndex);
        nextReceiveBufferSize = SIZE_TABLE[index];
        decreaseNow = false;
    }
    //说明上一轮预测的内存大小在这次适用，不需要调整
}

```

上面的分析大家可以自己假设一些数值推导一下，应该会对动态调整内存有更深的理解。这也是Netty的高性能原因之一，通过前一轮读取的数据量，来对本轮内存大小进行调整，用户不用担心内存分配太大或太小的原因。

以上就是RecvByteBufAllocator的源码分析，并且带大家推导了一下Netty是如何实现预测内存大小的，主要涉及到了一点算法，并不是很难，大家最好看完后再跟着源码自行分析一下，这样能更好的掌握。