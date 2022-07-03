# Netty客户端消息处理流程

本期算是上一篇章的续篇，分析的是客户端连接上服务端后，向服务端发送消息，服务端是如何处理的。由于客户端通道是用来处理业务的，所以下面展示一个小demo，方便后面对客户端pipeline有个具体的实例分析。

Netty服务端启动代码

```java
		EventLoopGroup bossGroup = new NioEventLoopGroup();
        EventLoopGroup workerGroup = new NioEventLoopGroup();
        try {
            ServerBootstrap b = new ServerBootstrap();
            //设置线程组
            b.group(bossGroup, workerGroup)
              //设置通道类型
             .channel(NioServerSocketChannel.class)
              //设置相关属性
             .option(ChannelOption.SO_BACKLOG, 100)
              //设置服务端通道处理器
             .handler(new LoggingHandler(LogLevel.INFO))
              //设置客户端通道处理器
             .childHandler(new ChannelInitializer<SocketChannel>() {
                 @Override
                 public void initChannel(SocketChannel ch) throws Exception {
                     ChannelPipeline p = ch.pipeline();
                     p.addLast(new DemoHandler());
                 }
             });
            //绑定端口并同步
            ChannelFuture f = b.bind(10000).sync();
            //同步等待关闭
            f.channel().closeFuture().sync();
        } finally {
            //优雅关闭线程组
            bossGroup.shutdownGracefully();
            workerGroup.shutdownGracefully();
        }
```

#DemoHandler

```java
public class DemoHandler extends ChannelInboundHandlerAdapter{
    @Override
    public void channelRead(ChannelHandlerContext ctx,Object msg){
        System.out.println(msg);
    }
}
```

在这个demo中，我们只添加了一个业务处理器，并且该处理器只负责将消息打印在控制台。对前两章比较熟悉的朋友，应该很快能知道这时的客户端通道内有哪些处理器。下面用示意图展示。

![](C:\Users\HYWYZ\Desktop\面试资料\源码\Netty\笔记\Netty客户端消息处理流程图片\NioSocketChannel内部结构.png)

由于我们只分析入站操作，所以出站箭头未画出。

知道这些前提后，我们开始看源码吧。还是和上期一样，入口在NioEventLoop中，不过要记住这时的NioEventLoop是从workerGroup中选出来的。下面的方法和上期是一样的，流程忘记的朋友可以再看看上期的分析

\#NioEventLoop的processSelectedKey()

```java
	private void processSelectedKey(SelectionKey k, AbstractNioChannel ch) {
        //因为我们分析的是客户端消息处理，所以这时的channel是NioSocketChannel
        //NioSocketChannel的UnSafe对象是NioByteUnsafe类型
        //NioByteUnsafe就是专门用来处理客户端消息的对象
        final AbstractNioChannel.NioUnsafe unsafe = ch.unsafe();
		
        //......

        try {

            int readyOps = k.readyOps();
            if ((readyOps & SelectionKey.OP_CONNECT) != 0) {
                int ops = k.interestOps();
                ops &= ~SelectionKey.OP_CONNECT;
                k.interestOps(ops);
                unsafe.finishConnect();
            }
            if ((readyOps & SelectionKey.OP_WRITE) != 0) {
                ch.unsafe().forceFlush();
            }
            
    		//有读事件或连接事件
            if ((readyOps & (SelectionKey.OP_READ | SelectionKey.OP_ACCEPT)) != 0 || readyOps == 0) {
                //目前我们关注的是Read，所以去看NioByteUnsafe
                unsafe.read();
            }
        } catch (CancelledKeyException ignored) {
            unsafe.close(unsafe.voidPromise());
        }
    }
```

#NioByteUnsafe的read()

```java
		@Override
        public final void read() {
            //获取客户端Channel的config对象。
            final ChannelConfig config = config();
            if (shouldBreakReadReady(config)) {
                clearReadPending();
                return;
            }
            //获取客户端的pipeline (上面有结构图)
            final ChannelPipeline pipeline = pipeline();
            //获取一个缓冲区分配器。PooledByteBufAllocator 池化内存管理的缓冲区分配器。
            final ByteBufAllocator allocator = config.getAllocator();
            // 控制读循环，以及预测下次创建的ByteBuf容量大小。 
            //(后面会有篇章讲解，此处只要知道是用来分配内存的就行)
            final RecvByteBufAllocator.Handle allocHandle = recvBufAllocHandle();
            //重置
            allocHandle.reset(config);
            //JDK ByteBuffer的包装。 
            //缓冲区内存，将SocketChannel内的数据读取并保存
            ByteBuf byteBuf = null;
            boolean close = false;
            try {
                //循环内就是一直在处理消息读取
                do {
                    //为byteBuf分配内存
                    byteBuf = allocHandle.allocate(allocator);
                    
                    // 读取当前Socket读缓冲区的数据 到 byteBuf 对象。
                    // doReadBytes(byteBuf) 返回从SocketChannel内读取的数据量
                    allocHandle.lastBytesRead(doReadBytes(byteBuf));

                    //条件成立有两种可能：
                    // 1. channel 底层socket读缓冲区 已经完全读取完毕，返回0
                    // 2. channel 关闭返回 -1
                    if (allocHandle.lastBytesRead() <= 0) {
                        //用完byteBuf后释放
                        byteBuf.release();
                        byteBuf = null;
                        close = allocHandle.lastBytesRead() < 0;
                        if (close) {
                            readPending = false;
                        }
                        break;
                    }

                    // 更新缓存区预测分配器 读取的消息数量(后面篇章讲解)
                    allocHandle.incMessagesRead(1);
                    readPending = false;
                    
                    //向客户端pipeline传播channelRead事件
                    //DemoHandler重写了channelRead()
                    pipeline.fireChannelRead(byteBuf);
                    byteBuf = null;

                } while (allocHandle.continueReading());
				
                allocHandle.readComplete();

                //向pipeline传播channelReadComplete事件
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

#NioSocketChannel的doReadBytes()

```java
	@Override
    protected int doReadBytes(ByteBuf byteBuf) throws Exception {
        final RecvByteBufAllocator.Handle allocHandle = unsafe().recvBufAllocHandle();
        allocHandle.attemptedBytesRead(byteBuf.writableBytes());
        //将底层SocketChannel的数据读取到byteBuf中
        return byteBuf.writeBytes(javaChannel(), allocHandle.attemptedBytesRead());
    }
```

客户端消息处理流程大致就是这样，先分配内存，再循环读取socket缓冲区里的数据，读取到数据向通道发起channelRead事件，读取完毕后传播channelReadComplete事件。按照上面给出的demo，客户端发送的消息会经过HeadContext，然后到达DemoHandler并打印在控制台上，但是由于DemoHandler拿到消息后，并没有调用fireChannelRead()向后传播，所以消息是不会到TailContext的。

并且大家可以去看看#TailContext实现的channelRead()

```java
	@Override
    public void channelRead(ChannelHandlerContext ctx, Object msg) {
        onUnhandledInboundMessage(ctx, msg);
    }

	protected void onUnhandledInboundMessage(ChannelHandlerContext ctx, Object msg) {
        onUnhandledInboundMessage(msg);
        if (logger.isDebugEnabled()) {
            logger.debug("Discarded message pipeline : {}. Channel : {}.",
                         ctx.pipeline().names(), ctx.channel());
        }
    }

	protected void onUnhandledInboundMessage(Object msg) {
        try {
            logger.debug(
                    "Discarded inbound message {} that reached at the tail of the pipeline. " +
                            "Please check your pipeline configuration.", msg);
        } finally {
            //释放内存
            ReferenceCountUtil.release(msg);
        }
    }
```

所以说如果业务处理器没有继承SimpleChannelInboundHandler，就需要在业务处理完毕后手动调用ReferenceCountUtil.release(msg)去释放内存，要不就在处理业务后一直调用ctx.fireChannelRead(msg)将内存释放交给TailContext去做。在这里简单的看下为什么SimpleChannelInboundHandler不需要手动释放内存。

#SimpleChannelInboundHandler的channelRead0()

```java
protected abstract void channelRead0(ChannelHandlerContext ctx, I msg) throws Exception;
```

在处理器继承它后，需要重写的是这个方法，而我们再看看channelRead()做了什么

```java
	@Override
    public void channelRead(ChannelHandlerContext ctx, Object msg) throws Exception {
        boolean release = true;
        try {
            //如果消息是指定的类型，则为true
            //这里的消息类型是继承SimpleChannelInboundHandler<T>的泛型
            if (acceptInboundMessage(msg)) {
                @SuppressWarnings("unchecked")
                I imsg = (I) msg;
                //调用用户自己实现的channelRead0()
                channelRead0(ctx, imsg);
            } else {
                //不是该处理器处理的类型，传到下一个处理器
                release = false;
                ctx.fireChannelRead(msg);
            }
        } finally {
            //最终会释放内存
            if (autoRelease && release) {
                ReferenceCountUtil.release(msg);
            }
        }
    }
```

所以处理器继承SimpleChannelInboundHandler，就无需担心内存泄漏的问题了。

以上就是Netty处理客户端消息的流程，如果掌握了前两章的内容，这期还是很容易理解的，末尾顺便提了一下用户什么时候该释放内存，什么时候无需释放内存，这对应用开发是一个比较重要的点，希望大家能用的上。

