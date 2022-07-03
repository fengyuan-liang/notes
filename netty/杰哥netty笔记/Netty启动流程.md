# Netty服务端启动流程源码分析

### Netty服务端启动代码模板

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
                     p.addLast(new LoggingHandler(LogLevel.INFO));
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

上面是Netty服务端启动的模板代码。首先创建了两个线程组，分别为boss和worker，熟悉netty的都知道boss用来处理客户端连接，worker用来处理io事件。接着创建了启动辅助类ServerBootstrap，通过链式调用进行了一系列的配置。最后通过bind()方法绑定服务器的端口，可以得知服务端启动核心流程是从bind()方法开始。

**在开始分析之前，我们要着重注意一个点，就是主线程和EventLoop线程的执行逻辑，看代码到底是主线程执行还是EventLoop线程执行。搞清楚了这个点，可以对启动流程有很清晰的认识**

### 主线程执行逻辑

进入bind()方法后，可以发现此方法是在AbstractBootstrap类中，下图可以看出服务端和客户端启动类的继承体系。

![](C:\Users\HYWYZ\Desktop\面试资料\源码\Netty\笔记\Netty服务端启动流程图片\AbstractBootStrap类继承图.png)

bind()经过一系列调用后最终来到doBind()，此方法是启动的核心。

```java
	//启动辅助类调用bind()
	public ChannelFuture bind(int inetPort) {
        return bind(new InetSocketAddress(inetPort));
    }

	public ChannelFuture bind(SocketAddress localAddress) {
        validate();
        return doBind(ObjectUtil.checkNotNull(localAddress, "localAddress"));
    }

	private ChannelFuture doBind(final SocketAddress localAddress) {
        final ChannelFuture regFuture = initAndRegister();
        final Channel channel = regFuture.channel();
        if (regFuture.cause() != null) {
            return regFuture;
        }
        if (regFuture.isDone()) {
            ChannelPromise promise = channel.newPromise();
            doBind0(regFuture, channel, localAddress, promise);
            return promise;
        } else {
            final PendingRegistrationPromise promise = new PendingRegistrationPromise(channel);
            regFuture.addListener(new ChannelFutureListener() {
                @Override
                public void operationComplete(ChannelFuture future) throws Exception {
                    Throwable cause = future.cause();
                    if (cause != null) {
                        promise.setFailure(cause);
                    } else {
                        promise.registered();
                        doBind0(regFuture, channel, localAddress, promise);
                    }
                }
            });
            return promise;
        }
    }
```

在doBind()内第一行又是一个方法调用initAndRegister()

```java
	final ChannelFuture initAndRegister() {
        Channel channel = null;
        try {
            //通过channel工厂(#ReflectiveChannelFactory)反射创建出NioServerSocketChannel对象
            //此处channel类型就是在启动类中channel()方法指定的NioServerSocketChannel类型
            //具体细节比较简单自行查看，并且可以在调用构造的流程中，看到#AbstractNioChannel的构造内将通道设置为非阻塞
            //调用链较长，自行查看。
            channel = channelFactory.newChannel();
            //初始化通道
            init(channel);
        } catch (Throwable t) {
            if (channel != null) {
                channel.unsafe().closeForcibly();
                return new DefaultChannelPromise(channel, GlobalEventExecutor.INSTANCE).setFailure(t);
            }
            return new DefaultChannelPromise(new FailedChannel(), GlobalEventExecutor.INSTANCE).setFailure(t);
        }
        ChannelFuture regFuture = config().group().register(channel);
        if (regFuture.cause() != null) {
            if (channel.isRegistered()) {
                channel.close();
            } else {
                channel.unsafe().closeForcibly();
            }
        }
        return regFuture;
    }
```

创建好channel后又调用init(channel)方法，由于我们分析的是服务端，所以看ServerBootStrap中的init()。

```java
	@Override
	//channel是服务端channel，NioServerSocketChannel
    void init(Channel channel) {
        //设置属性
        setChannelOptions(channel, options0().entrySet().toArray(EMPTY_OPTION_ARRAY), logger);
        setAttributes(channel, attrs0().entrySet().toArray(EMPTY_ATTRIBUTE_ARRAY));
		//创建出NioServerSocketChannel的pipeline
        ChannelPipeline p = channel.pipeline();
		//workerGroup
        final EventLoopGroup currentChildGroup = childGroup;
        //客户端通道处理器
        final ChannelHandler currentChildHandler = childHandler;
        //相关属性
        final Entry<ChannelOption<?>, Object>[] currentChildOptions =
                childOptions.entrySet().toArray(EMPTY_OPTION_ARRAY);
        final Entry<AttributeKey<?>, Object>[] currentChildAttrs = childAttrs.entrySet().toArray(EMPTY_ATTRIBUTE_ARRAY);
		//重点，此时执行p.addLast()代码的是主线程!!!
        //这时主线程向NioServerSocketChannel中添加了一个ChannelInitializer处理器，该方法流程结束
        p.addLast(new ChannelInitializer<Channel>() {
            //以下是回调，后面会说到
            @Override
            public void initChannel(final Channel ch) {
                final ChannelPipeline pipeline = ch.pipeline();
                ChannelHandler handler = config.handler();
                if (handler != null) {
                    pipeline.addLast(handler);
                }
                ch.eventLoop().execute(new Runnable() {
                    @Override
                    public void run() {
                        pipeline.addLast(new ServerBootstrapAcceptor(
                                ch, currentChildGroup, currentChildHandler, currentChildOptions, currentChildAttrs));
                    }
                });
            }
        });
    }
```

我们打开ChannelInitializer类，发现它继承了ChannelInboundHandlerAdapter，说明是一个入站处理器，此类里有一个方法

```java
/**
     * This method will be called once the {@link Channel} was registered. After the method returns this instance
     * will be removed from the {@link ChannelPipeline} of the {@link Channel}.
     *
     * @param ch            the {@link Channel} which was registered.
     * @throws Exception    is thrown if an error occurs. In that case it will be handled by
     *                      {@link #exceptionCaught(ChannelHandlerContext, Throwable)} which will by default close
     *                      the {@link Channel}.
     */
    protected abstract void initChannel(C ch) throws Exception;
```

看注释可知，该方法会在通道被注册后调用，并且会从通道中移除此处理器(ChannelInitializer)。由此可以得知，ChannelInitializer就像一个压缩包，可以在initChannel方法中向通道添加多个业务处理器，由ChannelInitializer保管好，最后向通道添加ChannelInitializer即可。在通道被注册后，ChannelInitializer又会被回调initChannel方法，将它保管多个业务处理器拿出来按顺序再注册到通道中，并把自己从通道里移除，这样就完成了业务处理器的添加。

所以#ServerBootStrap的init()方法里，**主线程**只是向NioServerSocketChannel添加了一个ChannelInitializer，这个方法就执行完成了。

接着回到#AbstractBootStrap的initAndRegister()方法

```java
	final ChannelFuture initAndRegister() {
        Channel channel = null;
        try {
            //通过channel工厂(#ReflectiveChannelFactory)反射创建出NioServerSocketChannel对象
            //此处channel类型就是在启动类中channel()方法指定的NioServerSocketChannel类型
            //具体细节比较简单自行查看
            channel = channelFactory.newChannel();
            //初始化通道
            //这时上面方法的返回点!!!
            init(channel);
        } catch (Throwable t) {
            if (channel != null) {
                channel.unsafe().closeForcibly();
                return new DefaultChannelPromise(channel, GlobalEventExecutor.INSTANCE).setFailure(t);
            }
            return new DefaultChannelPromise(new FailedChannel(), GlobalEventExecutor.INSTANCE).setFailure(t);
        }
        //还是主线程在执行
        //关键！开始真正的注册逻辑
        //通过config()拿到ServerBootstrapConfig配置对象，group()拿到bossGroup
        //通过bossGroup调用register()方法，这里的register方法是SingleThreadEventLoop中实现的，具体流程自行查看
        ChannelFuture regFuture = config().group().register(channel);
        if (regFuture.cause() != null) {
            if (channel.isRegistered()) {
                channel.close();
            } else {
                channel.unsafe().closeForcibly();
            }
        }
        return regFuture;
    }
```

#SingleThreadEventLoop的register(channel)方法

```java
	@Override
    public ChannelFuture register(Channel channel) {
        return register(new DefaultChannelPromise(channel, this));
    }

	@Override
    public ChannelFuture register(final ChannelPromise promise) {
        ObjectUtil.checkNotNull(promise, "promise");
        //看register()方法，最终调用到AbstractChannel的一个抽象内部类，AbstractUnsafe中的register()方法
        //this：就是当前SingleThreadEventLoop对象
        promise.channel().unsafe().register(this, promise);
        return promise;
    }
```

#AbstractUnsafe的register()方法

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
			//将eventLoop赋值给该channel的属性
            AbstractChannel.this.eventLoop = eventLoop;
			//inEventLoop()方法是用来判断执行此处代码的是否为eventLoop线程，很显然现在还是主线程在执行
            if (eventLoop.inEventLoop()) {
                register0(promise);
            } else {
                //主线程执行此处代码
                //向eventLoop提交了第一个任务register0(promise)
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
```

主线程执行到此处，#AbstractBootStrap的doBind()方法的第一行initAndRegister()方法就执行完成了，并且获得了一个ChannelFuture对象，这个对象正是#AbstractUnsafe的register()方法中，主线程提交register0(promise)的promise对象，在doBind()中会用到。

```java
private ChannelFuture doBind(final SocketAddress localAddress) {
    	//该方法调用完成，获得一个注册相关得future对象
        final ChannelFuture regFuture = initAndRegister();
    	//获取future对象的channel，NioServerSocketChannel
        final Channel channel = regFuture.channel();
   		//判断是否有异常
        if (regFuture.cause() != null) {
            return regFuture;
        }
		//注意：在前面主线程向eventLoop提交了一个注册任务，此时不能保证注册任务何时才能完成
    	//所以通过future对象判断任务是否完成
        if (regFuture.isDone()) {
            //注册任务完成，说明通道已经注册完毕，可以绑定端口
            ChannelPromise promise = channel.newPromise();
            //真正的绑定逻辑
            doBind0(regFuture, channel, localAddress, promise);
            //返回绑定相关的future
            return promise;
        } else {
            //注册任务没有完成，说明通道还未注册完毕，不能进行绑定端口
            final PendingRegistrationPromise promise = new PendingRegistrationPromise(channel);
            //这时添加监听，在注册任务完成后，又eventLoop线程回调此处的监听器，完成绑定相关的任务
            regFuture.addListener(new ChannelFutureListener() {
                @Override
                public void operationComplete(ChannelFuture future) throws Exception {
                    Throwable cause = future.cause();
                    if (cause != null) {
                        promise.setFailure(cause);
                    } else {
                        promise.registered();
                        //真正的绑定逻辑
                        doBind0(regFuture, channel, localAddress, promise);
                    }
                }
            });
            //返回绑定相关的future
            return promise;
        }
    }
```

```java
//此方法不管是主线程调用，还是eventLoop线程回调监听，最终都是向eventLoop再提交一个bind()任务，后面会讲
private static void doBind0(
            final ChannelFuture regFuture, final Channel channel,
            final SocketAddress localAddress, final ChannelPromise promise) {
        channel.eventLoop().execute(new Runnable() {
            @Override
            public void run() {
                if (regFuture.isSuccess()) {
                    channel.bind(localAddress, promise).addListener(ChannelFutureListener.CLOSE_ON_FAILURE);
                } else {
                    promise.setFailure(regFuture.cause());
                }
            }
        });
    }
```

到这里doBind()方法就已经执行完成，并且向上层返回了一个doBind()的future对象

```java
//绑定端口并同步
ChannelFuture f = b.bind(10000).sync();
```

如果绑定未完成的话，就会在sync()里被阻塞。

以上就是服务端启动流程里，主线程做的所有事情。

我们再来梳理一遍流程

![](C:\Users\HYWYZ\Desktop\面试资料\源码\Netty\笔记\Netty服务端启动流程图片\主线程执行流程.png)

接下来我们就要关注EventLoop线程都做了什么事。

### EventLoop线程

EventLoop线程的逻辑我们从主线程提交的第一个任务register0()开始看起。

还记得这个任务是在#AbstractChannel的内部类#AbstractUnsafe中的register()方法里面吗?

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

            AbstractChannel.this.eventLoop = eventLoop;

            if (eventLoop.inEventLoop()) {
                register0(promise);
            } else {
                try {
                    //主线程提交的第一个异步任务
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

```

#AbstractUnsafe的register0()

```java
private void register0(ChannelPromise promise) {
            try {
                if (!promise.setUncancellable() || !ensureOpen(promise)) {
                    return;
                }
                boolean firstRegistration = neverRegistered;
                //注册，此处逻辑在#AbstractNioChannel内部实现
                doRegister();
                neverRegistered = false;
                registered = true;
                
                pipeline.invokeHandlerAddedIfNeeded();

                safeSetSuccess(promise);
                pipeline.fireChannelRegistered();
                if (isActive()) {
                    if (firstRegistration) {
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
                //关键点来了，在这里我们终于看到了原生jdk的channel执行了register
                //系统层面完成ServerSocketChannel注册到多路复用器上，并且设置没有感兴趣的事件
                //nio四种事件
                //OP_READ:1  OP_WRITE:100  OP_CONNECT:1000  OP_ACCEPT:10000
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

doRegister()方法执行完成后，执行pipeline.invokeHandlerAddedIfNeeded();进去后可以看到一段注释

```java
final void invokeHandlerAddedIfNeeded() {
        assert channel.eventLoop().inEventLoop();
        if (firstRegistration) {
            firstRegistration = false;
            // We are now registered to the EventLoop. It's time to call the callbacks for the ChannelHandlers,
            // that were added before the registration was done.
            //我们现在已注册到 EventLoop。现在是调用 ChannelHandler 的回调的时候了，这些回调是在注册完成之前添加的。
            callHandlerAddedForAllHandlers();
        }
    }
```

意思就是说执行到这里时，开始回调ChannelHandler，这个回调链路非常复杂，在这里我简单写出来，供大家自行查看。

#DefaultChannelPipeline的invokeHandlerAddedIfNeeded()  -->  #DefaultChannelPipeline的callHandlerAddedForAllHandlers()，内部task.execute();  -->   #PendingHandlerAddedTask的execute()，内部callHandlerAdded0(ctx);  -->  #DefaultChannelPipeline的callHandlerAdded0()，内部ctx.callHandlerAdded();  -->  #AbstractChannelHandlerContext的callHandlerAdded()，内部handler().handlerAdded(this);  -->  #ChannelInitializer的handlerAdded()，最后在这个方法内部可以看到initChannel()被回调。

大家还对ChannelInitializer有印象吗？就是前面说到的像一个压缩包一样。在这时就会将压缩包解压出来，把业务处理器添加到通道内，最后将自己移除

#ChannelInitializer的initChannel

```java
private boolean initChannel(ChannelHandlerContext ctx) throws Exception {
        if (initMap.add(ctx)) { 
            try {
                //调用子类重写的方法，添加处理器
                initChannel((C) ctx.channel());
            } catch (Throwable cause) {
                exceptionCaught(ctx, cause);
            } finally {
                ChannelPipeline pipeline = ctx.pipeline();
                if (pipeline.context(this) != null) {
                    //移除自己
                    pipeline.remove(this);
                }
            }
            return true;
        }
        return false;
    }
```

上面调用的子类重写就在这，就是分析主线程执行逻辑时，#ServerBootStrap的init()方法内添加了这个处理器，在这时被回调

```java
p.addLast(new ChannelInitializer<Channel>() {
            @Override
            public void initChannel(final Channel ch) {
                //添加业务处理器
                final ChannelPipeline pipeline = ch.pipeline();
                ChannelHandler handler = config.handler();
                if (handler != null) {
                    pipeline.addLast(handler);
                }
                //这时是EventLoop线程在执行，又提交给自己执行的第二个任务
                ch.eventLoop().execute(new Runnable() {
                    @Override
                    public void run() {
                        //向管道内添加了一个ServerBootstrapAcceptor处理器，这个处理器是在NioServerSocketChannel中
                        pipeline.addLast(new ServerBootstrapAcceptor(
                                ch, currentChildGroup, currentChildHandler, currentChildOptions, currentChildAttrs));
                    }
                });
            }
        });
```

执行到这里，回调完成。回到#AbstractUnsafe的register0()中，pipeline.invokeHandlerAddedIfNeeded();也就执行完成。

```java
private void register0(ChannelPromise promise) {
            try {
                if (!promise.setUncancellable() || !ensureOpen(promise)) {
                    return;
                }
                boolean firstRegistration = neverRegistered;
                //注册，此处逻辑在#AbstractNioChannel内部实现
                doRegister();
                neverRegistered = false;
                registered = true;
                //回调处理器的事件方法
                pipeline.invokeHandlerAddedIfNeeded();
				//将注册相关的future对象设置success，并且回调注册在此future上的监听器
                safeSetSuccess(promise);
                //在通道内传播注册成功事件
                pipeline.fireChannelRegistered();
                if (isActive()) {
                    if (firstRegistration) {
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

到这里EventLoop的第一个任务register()就已经完成了，并且回调了注册相关的future上的监听器。大家还记得在#AbstractBootStrap的doBind()里注册的那个监听吗？在这里调用了doBind0()

```java
regFuture.addListener(new ChannelFutureListener() {
                @Override
                public void operationComplete(ChannelFuture future) throws Exception {
                    Throwable cause = future.cause();
                    if (cause != null) {
                        promise.setFailure(cause);
                    } else {
                        promise.registered();
                        //真正的绑定逻辑
                        doBind0(regFuture, channel, localAddress, promise);
                    }
                }
            });
```

```java
private static void doBind0(
            final ChannelFuture regFuture, final Channel channel,
            final SocketAddress localAddress, final ChannelPromise promise) {
    	//提交第三个任务
        channel.eventLoop().execute(new Runnable() {
            @Override
            public void run() {
                if (regFuture.isSuccess()) {
                    //绑定服务器端口，并且注册了服务器关闭监听
                    channel.bind(localAddress, promise).addListener(ChannelFutureListener.CLOSE_ON_FAILURE);
                } else {
                    promise.setFailure(regFuture.cause());
                }
            }
        });
    }
```

到这里注册任务register0()就完成了，这也是EventLoop执行的第一个任务，并且在这里又提交了第三个任务bind()。

接下来EventLoop该执行第二个任务，向NioServerSocketChannel内添加一个处理器

```java
                ch.eventLoop().execute(new Runnable() {
                    @Override
                    public void run() {
                        //向管道内添加了一个ServerBootstrapAcceptor处理器，这个处理器是在NioServerSocketChannel中
                        pipeline.addLast(new ServerBootstrapAcceptor处理器(
                                ch, currentChildGroup, currentChildHandler, currentChildOptions, currentChildAttrs));
                    }
                });
```

这个处理器的作用会在后面的篇章讲解，此处第二个任务就执行完成。

这时开始执行第三个任务bind()。

```java
private static void doBind0(
            final ChannelFuture regFuture, final Channel channel,
            final SocketAddress localAddress, final ChannelPromise promise) {
    	//第三个任务
        channel.eventLoop().execute(new Runnable() {
            @Override
            public void run() {
                if (regFuture.isSuccess()) {
                    //绑定服务器端口，并且注册了服务器关闭监听
                    channel.bind(localAddress, promise).addListener(ChannelFutureListener.CLOSE_ON_FAILURE);
                } else {
                    promise.setFailure(regFuture.cause());
                }
            }
        });
    }
```

此处的bind()方法内部调用流程也非常复杂，不过核心点在#AbstractChannel的内部类#AbstractUnsafe的bind()里

```java
		@Override
        public final void bind(final SocketAddress localAddress, final ChannelPromise promise) {
            //......
            boolean wasActive = isActive();
            try {
                //绑定端口，最终会调用到#NioServerSocketChannel的doBind()方法，
                //内部会拿到原生jdk的channel进行bind操作，没有难点，自行查看
                doBind(localAddress);
            } catch (Throwable t) {
                safeSetFailure(promise, t);
                closeIfClosed();
                return;
            }

            if (!wasActive && isActive()) {
                //这里提交了EventLoop的最后一个任务，任务4
                invokeLater(new Runnable() {
                    @Override
                    public void run() {
                        //向通道内传播channelActive事件
                        pipeline.fireChannelActive();
                    }
                });
            }
            //将绑定相关的future设置完成
            safeSetSuccess(promise);
        }
```

到这里绑定工作(任务3)就完成了，回到启动类中，主线程就在这行代码阻塞住了。

```
//同步等待关闭
f.channel().closeFuture().sync();
```

此时EventLoop该处理最后一个任务，传播channelActive事件(任务4)

对netty比较了解的朋友可能知道，整个pipeline中除了我们自己添加的业务处理器以外，在pipeline两端分别有一个HeadContext和TailContext，HeadContext实现了入站和出站，而TailContext只实现了入站。不过在#TailContext中，channelActive(下图)方法仅是一个空实现，

```java
@Override
public void channelActive(ChannelHandlerContext ctx) {
    onUnhandledInboundChannelActive();
}
```

所以我们要看HeadContext的channelActive()方法

```java
	@Override
    public void channelActive(ChannelHandlerContext ctx) {
    	ctx.fireChannelActive();
        readIfIsAutoRead();
    }
```

再进入到readIfIsAutoRead()中

```java
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

由于现在还是服务端的启动流程，readInterestOp可以在#NioServerSocketChannel的构造中找到赋值

```java
public NioServerSocketChannel(ServerSocketChannel channel) {
    //感兴趣的事件为Accept
	super(null, channel, SelectionKey.OP_ACCEPT);
	config = new NioServerSocketChannelConfig(this, javaChannel().socket());
}
```

到这里EventLoop在服务端启动时的4个任务都已经执行完成。并且通道也已经注册完成，还设置了对Accept事件感兴趣。至此，Netty服务端启动流程已完全分析完毕。

让我们再梳理一遍EventLoop线程都做了哪些事情

![](C:\Users\HYWYZ\Desktop\面试资料\源码\Netty\笔记\Netty服务端启动流程图片\EventLoop线程执行流程.png)

在这里稍微注意一下，就是在#AbstractBootStrap的doBind()方法中，判断注册任务是否完成会执行不同的流程，已完成就由主线程提交任务3，未完成就由EventLoop回调监听器提交任务3。

以上就是Netty服务端启动的大致分析，总体来说有难度，涉及到了两种线程的执行流程，并且在内部涉及了各种回调。不过只要理清楚两种线程的执行顺序，还是能弄懂整体流程的。