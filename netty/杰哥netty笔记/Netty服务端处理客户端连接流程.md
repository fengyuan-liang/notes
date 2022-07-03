# Netty服务端处理客户端连接流程

在前面一期我们讲了Netty服务端启动流程，本期就带大家看看服务端是如何处理客户端连接的流程。

我们直接从#NioEventLoop的processSelectedKeys()方法开始，此方法的被调用处在#NioEventLoop的run()方法中，熟悉NioEvetnLoop的朋友应该知道，所有的Io事件和任务队列中的任务，都是在run()方法中被执行到，所以run()是NioEvent Loop的核心方法，不熟悉的朋友也没事，后面会有单独篇章进行讲解，在这里只需要知道run()里面处理了什么即可。

#NioEventLoop的processSelectedKeys()

```java
	private void processSelectedKeys() {
        //selectedKeys表示当前NioEventLoop 的 selector 就绪事件 集合。
        //这时已经有客户端发起连接操作，所以不为null
        if (selectedKeys != null) {
            processSelectedKeysOptimized();
        } else {
            processSelectedKeysPlain(selector.selectedKeys());
        }
    }

	private void processSelectedKeysOptimized() {
        //遍历每一个就绪事件
        for (int i = 0; i < selectedKeys.size; ++i) {
            
            // SelectionKey 表示 就绪事件。
            final SelectionKey k = selectedKeys.keys[i];

            //处理完事件后，将引用指向null，帮助GC
            selectedKeys.keys[i] = null;

            // 附件。 这里会拿到  “注册” 阶段 ，咱们向 selector 提供的 Channel 对象。
            // channel 可能是 NioServerSocketChannel  也可能是 NioSocketChannel。
            //这里可以再去回顾一下#AbstractNioChannel的doRegister()方法
            //注册时将NioServerSocketChannel放在附件上
            final Object a = k.attachment();
			
            //NioServerSocketChannel
            if (a instanceof AbstractNioChannel) {
                // 处理IO事件
                processSelectedKey(k, (AbstractNioChannel) a);

            } else {
                @SuppressWarnings("unchecked")
                NioTask<SelectableChannel> task = (NioTask<SelectableChannel>) a;
                processSelectedKey(k, task);
            }

            if (needsToSelectAgain) {
                selectedKeys.reset(i + 1);

                selectAgain();
                i = -1;
            }
        }
    }

	private void processSelectedKey(SelectionKey k, AbstractNioChannel ch) {
        // NioServerSocketChannel的UnSafe对象是NioMessageUnsafe类型
        //NioMessageUnsafe就是专门用来处理客户端连接的对象
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
                //目前我们关注的是连接，所以去看NioMessageUnsafe
                unsafe.read();
            }
        } catch (CancelledKeyException ignored) {
            unsafe.close(unsafe.voidPromise());
        }
    }
```

#NioMessageUnsafe的read()

```java
		private final List<Object> readBuf = new ArrayList<Object>();

		@Override
        public void read() {
            assert eventLoop().inEventLoop();
            final ChannelConfig config = config();
            final ChannelPipeline pipeline = pipeline();
            final RecvByteBufAllocator.Handle allocHandle = unsafe().recvBufAllocHandle();
            allocHandle.reset(config);
            boolean closed = false;
            Throwable exception = null;
            try {
                try {
                    do {
                        //处理消息，传入readBuf
                        int localRead = doReadMessages(readBuf);
                        if (localRead == 0) {
                            break;
                        }
                        if (localRead < 0) {
                            closed = true;
                            break;
                        }
                        allocHandle.incMessagesRead(localRead);
                    } while (allocHandle.continueReading());
                } catch (Throwable t) {
                    exception = t;
                }
                int size = readBuf.size();
                //遍历readBuf处理消息
                for (int i = 0; i < size; i ++) {
                    readPending = false;
                    //向服务端通道传播channelRead事件
                    //readBuf.get(i)就是NioSocketChannel
                    pipeline.fireChannelRead(readBuf.get(i));
                }
                readBuf.clear();
                allocHandle.readComplete();
                //向服务端通道传播channelReadComplete事件
                pipeline.fireChannelReadComplete();
                if (exception != null) {
                    closed = closeOnReadError(exception);
                    pipeline.fireExceptionCaught(exception);
                }
                if (closed) {
                    inputShutdown = true;
                    if (isOpen()) {
                        close(voidPromise());
                    }
                }
            } finally {
                if (!readPending && !config.isAutoRead()) {
                    removeReadOp();
                }
            }
        }
```

#NioServerSocketChannel的doReadMessages()

```java
	@Override
    protected int doReadMessages(List<Object> buf) throws Exception {
        //原生jdk处理accept事件
        SocketChannel ch = SocketUtils.accept(javaChannel());

        try {
            if (ch != null) {
                //将客户端通道存放到readBuf中
                //this指当前服务端通道，在NioSocketChannel的构造中可以看到
                //指定当前服务端通道为NioSocketChannel的parent
                buf.add(new NioSocketChannel(this, ch));
                return 1;
            }
        } catch (Throwable t) {
            logger.warn("Failed to create a new channel from an accepted socket.", t);

            try {
                ch.close();
            } catch (Throwable t2) {
                logger.warn("Failed to close a socket.", t2);
            }
        }

        return 0;
    }
```

通过查看#NioMessageUnsafe的read()方法可以很清楚的知道，首先处理了接收事件，并将原生的SocketChannel包装为NioSocketChannel存放到readBuf中，然后向服务端通道(NioServerSocketChannel)传播channelRead事件。

这里一定要弄清楚服务端通道(NioServerSocketChannel)和客户端通道(NioSocketChannel)的区别，目前我们是处理客户端连接事件，用的是bossGroup，并且在NioServerSocketChannel中传播了正在连接的NioSocketChannel。

在服务端启动流程那一章里面，NioEventLoop执行的第二个任务大家还有印象吗？

```java
ch.eventLoop().execute(new Runnable() {
       @Override
       public void run() {
             //向管道内添加了一个ServerBootstrapAcceptor处理器，这个处理器是在NioServerSocketChannel中
             pipeline.addLast(new ServerBootstrapAcceptor(ch, currentChildGroup, currentChildHandler, currentChildOptions, currentChildAttrs));
       }
});
```

这里用示意图来描述(由于ServerBootstrapAcceptor是入站处理器，此处没有画出站箭头)

![](C:\Users\HYWYZ\Desktop\面试资料\源码\Netty\笔记\Netty客户端连接流程图片\NioServerSocket内部结构.png)

NioServerSocketChannel内部有一个pipeline，pipeline中有默认的HeadContext和TailContext，后来由NioEventLoop向pipeline中添加了一个处理器。

再回到#NioMessageUnsafe的read()方法，处理完accept事件后向通道传播channelRead事件，这是一个入站类型的事件，所以处理流程是HeadContext->ServerBootstrapAcceptor->TailContext，分别看这三个类的channelRead()，可以知道处理客户端连接事件的逻辑在ServerBootstrapAcceptor中。

#ServerBootstrapAcceptor的channelRead()

```java
		@Override
        @SuppressWarnings("unchecked")
        public void channelRead(ChannelHandlerContext ctx, Object msg) {
            //msg就是NioSocketChannel，内部包装了jdk的SocketChannel
            final Channel child = (Channel) msg;
			
            //向NioSocketChannel的pipeline中添加业务处理器
            //childHandler就是启动模板代码里 .childHandler() 配置的处理器
            child.pipeline().addLast(childHandler);
			
            //设置客户端通道属性
            setChannelOptions(child, childOptions, logger);
            setAttributes(child, childAttrs);

            try {
                //重点!!!
                //childGroup就是workerGroup
                //在这里完成了客户端通道注册到workerGroup的NioEvetnLoop中
                childGroup.register(child).addListener(new ChannelFutureListener() {
                    @Override
                    public void operationComplete(ChannelFuture future) throws Exception {
                        if (!future.isSuccess()) {
                            forceClose(child, future.cause());
                        }
                    }
                });
            } catch (Throwable t) {
                forceClose(child, t);
            }
        }
```

看到这里，我们可以明白为什么说boss是处理客户端连接，worker是处理客户端消息的原因了。

childGroup.register(child)的流程和第一章的注册流程大致相同，在这里就简单的梳理一下。这个register最终调用到了#AbstractUnsafe的register()方法中，对服务端启动流程比较熟悉的朋友肯定有印象了，这里和客户端通道注册到workerGroup的NioEventLoop中是一样的。

```java
		@Override
        public final void register(EventLoop eventLoop, final ChannelPromise promise) {
            ObjectUtil.checkNotNull(eventLoop, "eventLoop");
            if (isRegistered()) {
                promise.setFailure(new IllegalStateException("registered to an event loop already"));
                return;
            }
            if (!isCompatible(eventLoop)) {
                promise.setFailure(
                        new IllegalStateException("incompatible event loop type: " + eventLoop.getClass().getName()));
                return;
            }
			//这时的AbstractChannel是NioSocketChannel
            //eventLoop是worker中的
            AbstractChannel.this.eventLoop = eventLoop;
			
            if (eventLoop.inEventLoop()) {
                //注册
                register0(promise);
            } else {
                try {
                    eventLoop.execute(new Runnable() {
                        @Override
                        public void run() {
                            register0(promise);
                        }
                    });
                } catch (Throwable t) {
                    logger.warn(
                            "Force-closing a channel whose registration task was not accepted by an event loop: {}",
                            AbstractChannel.this, t);
                    closeForcibly();
                    closeFuture.setClosed();
                    safeSetFailure(promise, t);
                }
            }
        }

		private void register0(ChannelPromise promise) {
            try {
                if (!promise.setUncancellable() || !ensureOpen(promise)) {
                    return;
                }
                boolean firstRegistration = neverRegistered;
                
                //注册，在#AbstractNioChannel内部实现
                doRegister();
                neverRegistered = false;
                registered = true;

                //回调处理器的事件方法，这里回调的是 .childHandler()
                //配置的ChannelInitializer的initChannel()
                pipeline.invokeHandlerAddedIfNeeded();
				
                //注册的future设为success，并回调在此future上的监听器
                safeSetSuccess(promise);
                
                //在通道(NioSocketChannel)内传播注册成功事件
                pipeline.fireChannelRegistered();
                
                //客户端注册会进入此逻辑
                if (isActive()) {
                    if (firstRegistration) {
                        //向客户端通道传播channelActive事件
                        pipeline.fireChannelActive();
                    } else if (config().isAutoRead()) {
                        beginRead();
                    }
                }
            } catch (Throwable t) {
                closeForcibly();
                closeFuture.setClosed();
                safeSetFailure(promise, t);
            }
        }
```

#AbstractNioChannel的doRegister()

```java
@Override
protected void doRegister() throws Exception {
    boolean selected = false;
    for (;;) {
        try {
            //将SocketChannel注册到多路复用器上，设置没有感兴趣的事件，附件为当前客户端通道
            selectionKey = javaChannel().register(eventLoop().unwrappedSelector(), 0, this);
            return;
        } catch (CancelledKeyException e) {
            if (!selected) {
                eventLoop().selectNow();
                selected = true;
            } else {
                throw e;
            }
        }
    }
}
```

到这里就完成了worker与NioSocketChannel的绑定。然后向NioSocketChannel传播注册成功事件和channelActive事件。

在上一章服务端启动流程里，在NioServerSocketChannel中传播channelActive事件是提交了一个任务，在NioSocketChannel中是直接执行。

在客户端的pipeline里，还是看HeadContext的channelActive()。

```java
		@Override
        public void channelActive(ChannelHandlerContext ctx) {
            ctx.fireChannelActive();

            readIfIsAutoRead();
        }

		private void readIfIsAutoRead() {
            if (channel.config().isAutoRead()) {
                //可以看到这时又发起了一次read事件
                channel.read();
            }
        }
```

再回到HeadContext的read()方法中

```java
@Override
public void read(ChannelHandlerContext ctx) {
	unsafe.beginRead();
}
```

beginRead()最终会调用到#AbstractUnsafe里面

```java
@Override
public final void beginRead() {
	assertEventLoop();
	if (!isActive()) {
		return;
	}
	try {
        //核心方法
		doBeginRead();
	} catch (final Exception e) {
		invokeLater(new Runnable() {
			@Override
			public void run() {
				pipeline.fireExceptionCaught(e);
			}
		});
		close(voidPromise());
	}
}
```

doBeginRead()方法也会有一系列的调用流程，最终来到#AbstractNioChannel的doBeginRead()

```java
	@Override
    protected void doBeginRead() throws Exception {
        final SelectionKey selectionKey = this.selectionKey;
        if (!selectionKey.isValid()) {
            return;
        }
        readPending = true;
        final int interestOps = selectionKey.interestOps();
        //还记得最开始注册通道的时候吗，那时候设置的感兴趣的事件为0，条件成立
        if ((interestOps & readInterestOp) == 0) {
            //设置感兴趣的事件
            selectionKey.interestOps(interestOps | readInterestOp);
        }
    }
```

由于现在是客户端连接流程，readInterestOp可以在#NioServerSocketChannel的父类构造中找到赋值

```java
	public NioSocketChannel(Channel parent, SocketChannel socket) {
        super(parent, socket);
        config = new NioSocketChannelConfig(this, socket.socket());
    }
    
    #AbstractNioByteChannel
    protected AbstractNioByteChannel(Channel parent, SelectableChannel ch) {
        //设置感兴趣的事件为read
        super(parent, ch, SelectionKey.OP_READ);
    }
```

到这里客户端的连接流程就已经分析完毕，在这一章里主要是要弄清服务端通道和客户端通道的区别，在找到boss与worker交互的地方，后面的客户端注册逻辑就和服务端注册逻辑基本一致，下面还是给个流程图来方便大家理解。

![](C:\Users\HYWYZ\Desktop\面试资料\源码\Netty\笔记\Netty客户端连接流程图片\Netty客户端连接流程.png)

以上就是Netty服务端处理客户端连接的整体流程，后续还会继续更新Netty相关的知识。