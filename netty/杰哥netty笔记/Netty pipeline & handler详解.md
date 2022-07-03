# Netty pipeline & handler详解

Netty系列文章:
[Netty服务端启动流程源码分析](https://blog.csdn.net/weixin_45271492/article/details/121543945?spm=1001.2014.3001.5501)
[Netty服务端处理客户端连接流程](https://blog.csdn.net/weixin_45271492/article/details/121593075?spm=1001.2014.3001.5501)
[Netty客户端消息处理流程](https://blog.csdn.net/weixin_45271492/article/details/121612030?spm=1001.2014.3001.5501)
[NioEventLoop源码分析](https://blog.csdn.net/weixin_45271492/article/details/121651926?spm=1001.2014.3001.5501)
[Netty RecvByteBufAllocator源码分析](https://blog.csdn.net/weixin_45271492/article/details/121777606?spm=1001.2014.3001.5501)

学习过Netty的朋友都知道，Netty有几大核心组件，本期就带大家来一起分析一下Netty pipeline，和pipeline内部handler运行的原理。

我们先来分析handler的内部原理，因为pipeline内部就是在对handler进行操作，所以我们自底向上的进行分析会更好。

平常在编写Handler的时候，一般有两种方式, 继承SimpleChannelInboundHandler，或者继承ChannelInboundHandlerAdapter /ChannelOutboundHandlerAdapter，前者是不需要关心资源的释放问题，不过它也是继承了适配器类，所以我们从适配器类来看看Handler的继承体系。

# ChannelHandler继承体系

![](C:\Users\HYWYZ\Desktop\面试资料\源码\Netty\笔记\Netty pipeline & handler图片\handler继承图.png)

先来看看ChannelHandler都定义了哪些方法

```java
public interface ChannelHandler {
    //处理器添加时回调
    void handlerAdded(ChannelHandlerContext ctx) throws Exception;
    //处理器移除时回调
    void handlerRemoved(ChannelHandlerContext ctx) throws Exception;
    //异常回调
    @Deprecated
    void exceptionCaught(ChannelHandlerContext ctx, Throwable cause) throws Exception;
    
    //如果当前处理器无并发问题的话，可以让多个channel共享这一个处理器实例
    //@ChannelHandler.Sharable
    @Inherited
    @Documented
    @Target(ElementType.TYPE)
    @Retention(RetentionPolicy.RUNTIME)
    @interface Sharable {
        // no value
    }
}
```

顶层接口只定义了处理器生命周期的方法，再看看两个子接口

```java
public interface ChannelInboundHandler extends ChannelHandler {
    void channelRegistered(ChannelHandlerContext ctx) throws Exception;
    void channelUnregistered(ChannelHandlerContext ctx) throws Exception;
    void channelActive(ChannelHandlerContext ctx) throws Exception;
    void channelInactive(ChannelHandlerContext ctx) throws Exception;
    void channelRead(ChannelHandlerContext ctx, Object msg) throws Exception;
    void channelReadComplete(ChannelHandlerContext ctx) throws Exception;
    void userEventTriggered(ChannelHandlerContext ctx, Object evt) throws Exception;
    void channelWritabilityChanged(ChannelHandlerContext ctx) throws Exception;
    @Override
    @SuppressWarnings("deprecation")
    void exceptionCaught(ChannelHandlerContext ctx, Throwable cause) throws Exception;
}

public interface ChannelOutboundHandler extends ChannelHandler {
    void bind(ChannelHandlerContext ctx, SocketAddress localAddress, ChannelPromise promise) throws Exception;
    void connect(
            ChannelHandlerContext ctx, SocketAddress remoteAddress,
            SocketAddress localAddress, ChannelPromise promise) throws Exception;
    void disconnect(ChannelHandlerContext ctx, ChannelPromise promise) throws Exception;
    void close(ChannelHandlerContext ctx, ChannelPromise promise) throws Exception;
    void deregister(ChannelHandlerContext ctx, ChannelPromise promise) throws Exception;
    void read(ChannelHandlerContext ctx) throws Exception;
    void write(ChannelHandlerContext ctx, Object msg, ChannelPromise promise) throws Exception;
    void flush(ChannelHandlerContext ctx) throws Exception;
}
```

这两个接口的方法相信大家很熟悉了，就是平常编写handler时会去重写的方法，具体用法自行查阅api。再看看两个适配器的实现

```java
public class ChannelInboundHandlerAdapter extends ChannelHandlerAdapter implements ChannelInboundHandler {
    @Skip
    @Override
    public void channelRead(ChannelHandlerContext ctx, Object msg) throws Exception {
        ctx.fireChannelRead(msg);
    }
    //...... 篇幅原因，所有方法都是模板
}

public class ChannelOutboundHandlerAdapter extends ChannelHandlerAdapter implements ChannelOutboundHandler {
    @Skip
    @Override
    public void bind(ChannelHandlerContext ctx, SocketAddress localAddress,
            ChannelPromise promise) throws Exception {
        ctx.bind(localAddress, promise);
    }
    //......
}

```

可以发现这两个适配器类都使用了模板方法模式，平常我们在使用的时候，只需要继承这些适配器类，然后重写我们需要的方法即可，这样最终会调用到子类中的具体实现。并且在适配器类中的默认实现，都是将消息向pipeline中继续传播，还有就是默认实现方法都加了一个注解**@Skip**，后面会分析。下面画一个实例来展示一下处理过程。

定义了A，B，C三个入站处理器，A和C实现了channelRead()，A和B实现了channelActive()，那么当pipeline中传播channelRead()时，A会执行用户自定义逻辑，**如果A的channeRead()调用了ctx.fireChannelRead(msg)，那么会跳过B，继续传播到C进行处理。如果没有调用，那么chanelRead()就会在A处断开。**channelActive()同理。为什么说会跳过B，后面分析。

![](C:\Users\HYWYZ\Desktop\面试资料\源码\Netty\笔记\Netty pipeline & handler图片\handler事件处理.png)

但仔细看下适配器类的方法入参，都是ChannelHandlerContext类型，在这里稍微解释一下，用户在编写Handler，并向pipeline中添加的时候，会将Handler包装成ChannelHandlerContext类型（后面分析pipeline时可以看到），真正的逻辑都是由ChannelHandlerContext来完成的，所以接下来重点分析ChannelHandlerContext。



# ChannelHandlerContext继承体系

![](C:\Users\HYWYZ\Desktop\面试资料\源码\Netty\笔记\Netty pipeline & handler图片\handlerContext继承图.png)

顶层的两个接口留到后面分析pipeline时再说，我们先看ChannelHandlerContext

```java
public interface ChannelHandlerContext extends AttributeMap, ChannelInboundInvoker, ChannelOutboundInvoker {
    //当前Context对应的channel实例
    Channel channel();
    //如果为Handler配置了执行器，那么在执行Handler中的方法逻辑时，由指定的执行器处理，否则使用EventLoop
    //返回执行器
    EventExecutor executor();
    //Context的名称
    String name();
    //Context内部包装的handler实例
    ChannelHandler handler();
    //当前Context是否被移除
    boolean isRemoved();
    //当前Context对应的pipeline实例
    ChannelPipeline pipeline();
    //......省略了父接口的重写
}
```

从这些方法可以看出，ChannelHandlerContext内部持有了channel，executor，handler，pipeline这些实例，并且提供了对应的方法去获取这些实例。接下来先看看默认实现类，因为比较简单，并且具体实现都是由抽象类完成，所以先看这个

## DefaultChannelHandlerContext分析

```java
final class DefaultChannelHandlerContext extends AbstractChannelHandlerContext {
	//Context包装的handler
    private final ChannelHandler handler;

    DefaultChannelHandlerContext(
            DefaultChannelPipeline pipeline, EventExecutor executor, String name, ChannelHandler handler) {
        //父类构造
        //注意传递的参数就是上面提到的Context持有的那些对象
        super(pipeline, executor, name, handler.getClass());
        this.handler = handler;
    }

    //返回handler
    @Override
    public ChannelHandler handler() {
        return handler;
    }
}
```

## AbstractChannelHandlerContext分析

### 重要的字段

```java
//next和prev将pipeline中的Context构成双向链表
//Context后置引用
volatile AbstractChannelHandlerContext next;
//Context前置引用
volatile AbstractChannelHandlerContext prev;
//原子修改Context状态，对应最下面的handlerState属性
private static final AtomicIntegerFieldUpdater<AbstractChannelHandlerContext> HANDLER_STATE_UPDATER =
        AtomicIntegerFieldUpdater.newUpdater(AbstractChannelHandlerContext.class, "handlerState");
//Context状态值
private static final int ADD_PENDING = 1;
private static final int ADD_COMPLETE = 2;
private static final int REMOVE_COMPLETE = 3;
private static final int INIT = 0;
//pipeline实例
private final DefaultChannelPipeline pipeline;
private final String name;
//掩码，用来优化性能，后面分析原理
private final int executionMask;
//执行器
final EventExecutor executor;
//初始状态为INIT
private volatile int handlerState = INIT;
```

### 构造

```java
AbstractChannelHandlerContext(DefaultChannelPipeline pipeline, EventExecutor executor,
                              String name, Class<? extends ChannelHandler> handlerClass) {
    //赋值
    this.name = ObjectUtil.checkNotNull(name, "name");
    this.pipeline = pipeline;
    this.executor = executor;
    //创建掩码
    this.executionMask = mask(handlerClass);
}
```

此处我们先要搞清楚mask是用来做什么的。还记得前面举例时说为什么channelRead()会跳过B处理器，而不是执行B的父类适配器中的默认实现吗？还有默认实现上都带有的注解@Skip？这些就和mask有关。

## ChannelHandlerMask详解

mask具体原理在ChannelHandlerMask类中，我们来分析一下这个类中的一些属性和方法

```java
final class ChannelHandlerMask {
	
    //具体看常量名可以发现，每一个入站和出站事件都对应了一个二进制值
    
    // 1
    static final int MASK_EXCEPTION_CAUGHT = 1;
    // 10
    static final int MASK_CHANNEL_REGISTERED = 1 << 1;
    // 100
    static final int MASK_CHANNEL_UNREGISTERED = 1 << 2;
    // 1000
    static final int MASK_CHANNEL_ACTIVE = 1 << 3;
    // 10000
    static final int MASK_CHANNEL_INACTIVE = 1 << 4;
    // 100000
    static final int MASK_CHANNEL_READ = 1 << 5;
    // 1000000
    static final int MASK_CHANNEL_READ_COMPLETE = 1 << 6;
    // 10000000
    static final int MASK_USER_EVENT_TRIGGERED = 1 << 7;
    // 100000000
    static final int MASK_CHANNEL_WRITABILITY_CHANGED = 1 << 8;
    // 1000000000
    static final int MASK_BIND = 1 << 9;
    // 10000000000
    static final int MASK_CONNECT = 1 << 10;
    // 100000000000
    static final int MASK_DISCONNECT = 1 << 11;
    // 1000000000000
    static final int MASK_CLOSE = 1 << 12;
    // 10000000000000
    static final int MASK_DEREGISTER = 1 << 13;
    // 100000000000000
    static final int MASK_READ = 1 << 14;
    // 1000000000000000
    static final int MASK_WRITE = 1 << 15;
    // 10000000000000000
    static final int MASK_FLUSH = 1 << 16;

    //以下分别用入站或出站事件进行与运算，并且还要和MASK_EXCEPTION_CAUGHT进行与运算
    //计算出入站掩码和出站掩码
    
    // 0 0000 0001 1111 1111
    private static final int MASK_ALL_INBOUND = MASK_EXCEPTION_CAUGHT | MASK_CHANNEL_REGISTERED |
            MASK_CHANNEL_UNREGISTERED | MASK_CHANNEL_ACTIVE | MASK_CHANNEL_INACTIVE | MASK_CHANNEL_READ |
            MASK_CHANNEL_READ_COMPLETE | MASK_USER_EVENT_TRIGGERED | MASK_CHANNEL_WRITABILITY_CHANGED;
    
    // 1 1111 1110 0000 0001
    private static final int MASK_ALL_OUTBOUND = MASK_EXCEPTION_CAUGHT | MASK_BIND | MASK_CONNECT | MASK_DISCONNECT |
            MASK_CLOSE | MASK_DEREGISTER | MASK_READ | MASK_WRITE | MASK_FLUSH;
```

计算出这些掩码具体有什么用，我们看看mask()方法就知道了

```java
//clazz就是用户自定义的Handler的类型
static int mask(Class<? extends ChannelHandler> clazz) {
    //ThreadLocal缓存
    Map<Class<? extends ChannelHandler>, Integer> cache = MASKS.get();
    Integer mask = cache.get(clazz);
    if (mask == null) {
        //跟进去
        mask = mask0(clazz);
        cache.put(clazz, mask);
    }
    return mask;
}

private static int mask0(Class<? extends ChannelHandler> handlerType) {
    //获取异常掩码  1
    int mask = MASK_EXCEPTION_CAUGHT;
    try {
        //判断处理器类型，入站或出站
        if (ChannelInboundHandler.class.isAssignableFrom(handlerType)) {
            
            //感觉这一步多余，因为MASK_ALL_INBOUND已经 | MASK_EXCEPTION_CAUGHT 计算过了了，重点在下面
            mask |= MASK_ALL_INBOUND;
            
            //isSkippable()内部会判断当前Handler是否实现了对应的入站方法
            //如果实现了，就返回false，否则为true
            //判断handler是否实现了channelRegistered()方法
            if (isSkippable(handlerType, "channelRegistered", ChannelHandlerContext.class)) {
                //进入这说明未实现
                //MASK_CHANNEL_REGISTERED == 10
                //~MASK_CHANNEL_REGISTERED == 1111 1111 1111 1111 1111 1111 1111 1101
                //                    mask == 0000 0000 0000 0000 0000 0001 1111 1111
                // & 运算后                 == 0000 0000 0000 0000 0000 0001 1111 1101
                //计算后，mask在MASK_CHANNEL_REGISTERED的位上就为0了
                //说明当前handler没有实现channelRegistered()方法，那么对应的mask位为0
                //实现了方法，对应的位就是1
                mask &= ~MASK_CHANNEL_REGISTERED;
            }
            if (isSkippable(handlerType, "channelUnregistered", ChannelHandlerContext.class)) {
                mask &= ~MASK_CHANNEL_UNREGISTERED;
            }
            //...... 和上面一样的处理方式
        }
        if (ChannelOutboundHandler.class.isAssignableFrom(handlerType)) {
            mask |= MASK_ALL_OUTBOUND;
            //...... 篇幅问题，和入站是一样的
        }
        
        //最终到这里，会计算出当前handler的mask
        //mask为1的位，就说明handler实现了对应的方法
        
        //判断是否实现了exceptionCaught()
        if (isSkippable(handlerType, "exceptionCaught", ChannelHandlerContext.class, Throwable.class)) {
            mask &= ~MASK_EXCEPTION_CAUGHT;
        }
    } catch (Exception e) {
        PlatformDependent.throwException(e);
    }
    //返回mask
    return mask;
}

private static boolean isSkippable(
        final Class<?> handlerType, final String methodName, final Class<?>... paramTypes) throws Exception {
    return AccessController.doPrivileged(new PrivilegedExceptionAction<Boolean>() {
        @Override
        public Boolean run() throws Exception {
            Method m;
            try {
                //反射获取method，入站对应的method就是channelRead()等
                m = handlerType.getMethod(methodName, paramTypes);
            } catch (NoSuchMethodException e) {
                logger.debug(
                    "Class {} missing method {}, assume we can not skip execution", handlerType, methodName, e);
                return false;
            }
            //如果method上有@Skip注解，就返回true
            return m != null && m.isAnnotationPresent(Skip.class);
        }
    });
}
```

到这可以总结一下mask的作用。每一个ChannelHandlerContext都包含一个mask值，mask是根据当前Context包装的Handler中实现的入站或出站方法计算出来的二进制值，每一位表示一个父类的模板方法，如果子类重写了，那么mask对应的位就为1，否则为0。现在我们仅仅是计算了mask，但还没有进行使用，现在让我们回到AbstractChannelHandlerContext中，去看看mask是怎样使用的。



## AbstractChannelHandlerContext事件传播流程

前面说过Context才是事件处理的逻辑实现类，它的内部实现了入站和出站所有事件的传播过程，这里我们就以channelRead()来分析（其他的处理都是这样完成的）

```java
//所有的channelRead()都是由HeadContext完成的，具体可以自行查看一下，前面篇章分析过，在此就不说了
@Override
public ChannelHandlerContext fireChannelRead(final Object msg) {
    //findContextInbound(MASK_CHANNEL_READ) 会返回一个实现了channelRead()方法的Context
    invokeChannelRead(findContextInbound(MASK_CHANNEL_READ), msg);
    return this;
}

//mask==MASK_CHANNEL_READ
private AbstractChannelHandlerContext findContextInbound(int mask) {
    //获取当前Context对象
    AbstractChannelHandlerContext ctx = this;
    do {
        //跳过当前Context
        ctx = ctx.next;
        
        //循环条件 (ctx.executionMask & mask) == 0
        //用ctx的mask & MASK_CHANNEL_READ
        //为0说明ctx内部的handler并未实现channelRead()方法
        //条件成立，让ctx指向ctx.next，跳过当前的ctx
    } while ((ctx.executionMask & mask) == 0);
    
    //执行到这，说明该ctx实现了channelRead()
    return ctx;
}

//ctx：实现了channelRead()方法
static void invokeChannelRead(final AbstractChannelHandlerContext next, Object msg) {
    final Object m = next.pipeline.touch(ObjectUtil.checkNotNull(msg, "msg"), next);
    //获取执行器
    EventExecutor executor = next.executor();
    //是否是EventLoop线程
    if (executor.inEventLoop()) {
        //EventLoop直接执行
        next.invokeChannelRead(m);
    } else {
        //使用业务线程池异步执行
        executor.execute(new Runnable() {
            @Override
            public void run() {
                next.invokeChannelRead(m);
            }
        });
    }
}

private void invokeChannelRead(Object msg) {
    //handler是否添加完毕
    if (invokeHandler()) {
        try {
            //执行ctx中handler的channelRead()
            //也就是调用用户实现的channelRead()
            ((ChannelInboundHandler) handler()).channelRead(this, msg);
        } catch (Throwable t) {
            notifyHandlerException(t);
        }
    } else {
        //否则向后传播
        fireChannelRead(msg);
    }
}

private boolean invokeHandler() {
    int handlerState = this.handlerState;
    //判断当前context的状态是否能执行业务逻辑
    return handlerState == ADD_COMPLETE || (!ordered && handlerState == ADD_PENDING);
}
```

通过channelRead()的传播过程，可以看到mask可以跳过pipeline中未实现该方法的处理器，这也是Netty的一个性能优化点。关于context的状态设置，留一个小疑问，在pipeline中进行讲解。

到这里，ChannelHandler的执行原理就搞清楚了 ，接下来分析ChannelPipeline。



# ChannelPipeline继承体系

首先来看一下pipeline的继承体系

![](C:\Users\HYWYZ\Desktop\面试资料\源码\Netty\笔记\Netty pipeline & handler图片\pipeline继承图.png)

pipeline体系中有两个顶层接口，分别对应了入站和出站类型，下面简单看一下这两个接口方法

```java
public interface ChannelInboundInvoker {
    ChannelInboundInvoker fireChannelRegistered();
    ChannelInboundInvoker fireChannelUnregistered();
    ChannelInboundInvoker fireChannelActive();
    ChannelInboundInvoker fireChannelInactive();
    ChannelInboundInvoker fireExceptionCaught(Throwable cause);
    ChannelInboundInvoker fireUserEventTriggered(Object event);
    ChannelInboundInvoker fireChannelRead(Object msg);
    ChannelInboundInvoker fireChannelReadComplete();
    ChannelInboundInvoker fireChannelWritabilityChanged();
}

public interface ChannelOutboundInvoker {
    ChannelFuture bind(SocketAddress localAddress);
    ChannelFuture connect(SocketAddress remoteAddress);
    ChannelFuture connect(SocketAddress remoteAddress, SocketAddress localAddress);
    ChannelFuture disconnect();
    ChannelFuture close();
    ChannelFuture deregister();
    ChannelFuture bind(SocketAddress localAddress, ChannelPromise promise);
    ChannelFuture connect(SocketAddress remoteAddress, ChannelPromise promise);
    ChannelFuture connect(SocketAddress remoteAddress, SocketAddress localAddress, ChannelPromise promise);
    ChannelFuture disconnect(ChannelPromise promise);
    ChannelFuture close(ChannelPromise promise);
    ChannelFuture deregister(ChannelPromise promise);
    ChannelOutboundInvoker read();
    ChannelFuture write(Object msg);
    ChannelFuture write(Object msg, ChannelPromise promise);
    ChannelOutboundInvoker flush();
    ChannelFuture writeAndFlush(Object msg, ChannelPromise promise);
    ChannelFuture writeAndFlush(Object msg);
    //......
}
```

可以看到，顶层接口分别定义了传播入站和出站事件的一些方法。再看看ChannelPipeline

```java
public interface ChannelPipeline
        extends ChannelInboundInvoker, ChannelOutboundInvoker, Iterable<Entry<String, ChannelHandler>> {
    ChannelPipeline addFirst(String name, ChannelHandler handler);
    ChannelPipeline addLast(String name, ChannelHandler handler);
    ChannelPipeline addBefore(String baseName, String name, ChannelHandler handler);
    ChannelPipeline addAfter(String baseName, String name, ChannelHandler handler);
    ChannelPipeline addFirst(ChannelHandler... handlers);
    ChannelPipeline remove(ChannelHandler handler);
    ChannelHandler removeFirst();
    ChannelHandler removeLast();
    ChannelPipeline replace(ChannelHandler oldHandler, String newName, ChannelHandler newHandler);
    ChannelHandler first();
    ChannelHandlerContext firstContext();
    ChannelHandler last();
    ChannelHandlerContext lastContext();
    //......
}
```

这个接口主要增加了一些对处理器进行增删改的方法，具体实现都在DefaultChannelPipeline中了。

为什么Channel中创建的pipeline类型是DefaultChannelPipeline，看看#AbstractChannel的构造就明白了

```java
protected AbstractChannel(Channel parent) {
    this.parent = parent;
    id = newId();
    unsafe = newUnsafe();
    pipeline = newChannelPipeline();
}

protected DefaultChannelPipeline newChannelPipeline() {
    return new DefaultChannelPipeline(this);
}
```

接下来就去分析DefaultChannelPipeline的源码。

## DefaultChannelPipeline分析

### 重要的字段

```java
//下面这两个处理器在前面的篇章有提到过，pipeline中默认会带有head和tail的处理器
//HeadContext
final AbstractChannelHandlerContext head;
//TailContext
final AbstractChannelHandlerContext tail;
//当前pipeline对应的channel
private final Channel channel;
//是否第一次注册
private boolean firstRegistration = true;
//回调，后面分析
private PendingHandlerCallback pendingHandlerCallbackHead;
//是否已注册
private boolean registered;
```

### 构造

```java
protected DefaultChannelPipeline(Channel channel) {
    this.channel = ObjectUtil.checkNotNull(channel, "channel");
    //......
    //创建TailContext和HeadContext
    tail = new TailContext(this);
    head = new HeadContext(this);
    //形成双向链表
    head.next = tail;
    tail.prev = head;
}
```

### 接口方法实现

首先ChannelPipeline做为ChannelInboundInvoker和ChannelOutboundInvoker的子接口，我们来分析一下这两个接口的方法实现

```java
@Override
public final ChannelPipeline fireChannelRead(Object msg) {
    //通过ctx去传播事件
    AbstractChannelHandlerContext.invokeChannelRead(head, msg);
    return this;
}

@Override
public final ChannelFuture bind(SocketAddress localAddress) {
    //出站事件从TailContext开始传播
    return tail.bind(localAddress);
}
```

DefaultChannelPipeline的fireChannelRead()是谁调用的还有印象吗？在前面的分析客户端连接和客户端消息接收的篇章有分析过，它们分别在#NioMessageUnsafe的read()方法和#NioByteUnsafe的read()通过pipeline传播channelRead()事件。

然后就是ChannelPipeline接口自身的方法，我们分析一个addLast()。

```java
//有几个重载方法，最终都调用到这
@Override
public final ChannelPipeline addLast(EventExecutorGroup group, String name, ChannelHandler handler) {
    final AbstractChannelHandlerContext newCtx;
    synchronized (this) {
        checkMultiplicity(handler);
        //filterName()就是给Context生成name
        //newContext()内部就new DefaultChannelHandlerContext()
        newCtx = newContext(group, filterName(name, handler), handler);
        //内部就是双向链表插入节点
        addLast0(newCtx);
        //判断pipeline是否注册到EventLoop上
        if (!registered) {
            //前面留的疑点，给Context设置状态为ADD_PENDING
            newCtx.setAddPending();
            //因为此时还未注册，所以添加一个回调，等到pipeline注册时会触发
            callHandlerCallbackLater(newCtx, true);
            return this;
        }
        //执行到这说明已经注册完成
        EventExecutor executor = newCtx.executor();
        if (!executor.inEventLoop()) {
            //不是EventLoop，异步提交任务callHandlerAdded0(newCtx)，和下面一样
            callHandlerAddedInEventLoop(newCtx, executor);
            return this;
        }
    }
    //执行到这说明已经完成注册，并且当前线程为EventLoop线程
    callHandlerAdded0(newCtx);
    return this;
}
```

由于这里涉及到了pipeline是否注册成功，我们先分析已经注册完成的情况，并且线程是EventLoop。

```java
private void callHandlerAdded0(final AbstractChannelHandlerContext ctx) {
    try {
        //handler add 回调
        ctx.callHandlerAdded();
    } catch (Throwable t) {
        //......
    }
}

final void callHandlerAdded() throws Exception {
    //将Context的状态设置为ADD_COMPLETE
    if (setAddComplete()) {
        //调用handler的handlerAdded()
        handler().handlerAdded(this);
    }
}
```

看到这里可以明白handlerAdded()就是在Handler添加到pipeline，并且pipeline需要注册完毕才会回调。接下来看看pipeline如果还未注册就添加了处理器是怎么执行的。

```java
//这时pipeline还未注册
//added：true
private void callHandlerCallbackLater(AbstractChannelHandlerContext ctx, boolean added) {
    assert !registered;
    //封装了一个PendingHandlerAddedTask任务
    PendingHandlerCallback task = added ? new PendingHandlerAddedTask(ctx) : new PendingHandlerRemovedTask(ctx);
    //pendingHandlerCallbackHead，前面说过是用来处理回调
    PendingHandlerCallback pending = pendingHandlerCallbackHead;
    if (pending == null) {
        //如果head为null，就将当前任务做为head
        pendingHandlerCallbackHead = task;
    } else {
        //head不为null，就让后面来的回调任务形成一条链表
        while (pending.next != null) {
            pending = pending.next;
        }
        pending.next = task;
    }
}
```

这里可以看到，如果pipeline还未注册，就添加了处理器，那么会封装一个PendingHandlerAddedTask类型的任务形成单项链表，并由pendingHandlerCallbackHead字段持有头节点的引用。既然回调任务都添加完成了，那在什么时候会回调呢？结合addLast()中的判断，可以得知应该是pipeline注册之后会回调，那么我们就去看注册的逻辑。还记得前面的篇章分析的注册逻辑吗？最后会到#AbstractUnsafe的register0()完成注册任务。

```java
#AbstractUnsafe
private void register0(ChannelPromise promise) {
    try {
        if (!promise.setUncancellable() || !ensureOpen(promise)) {
            return;
        }
        boolean firstRegistration = neverRegistered;
        //注册
        doRegister();
        neverRegistered = false;
        registered = true;
        //这行代码会执行pipeline的回调任务
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
        //......
    }
}

#DefaultChannelPipeline
final void invokeHandlerAddedIfNeeded() {
    assert channel.eventLoop().inEventLoop();
    //判断是否为第一次注册
    if (firstRegistration) {
        firstRegistration = false;
        //回调
        callHandlerAddedForAllHandlers();
    }
}

#DefaultChannelPipeline
private void callHandlerAddedForAllHandlers() {
    final PendingHandlerCallback pendingHandlerCallbackHead;
    synchronized (this) {
        assert !registered;
        registered = true;
        //pendingHandlerCallbackHead头节点，保存了回调链表
        pendingHandlerCallbackHead = this.pendingHandlerCallbackHead;
        this.pendingHandlerCallbackHead = null;
    }
    //循环向后执行回调
    PendingHandlerCallback task = pendingHandlerCallbackHead;
    while (task != null) {
        task.execute();
        task = task.next;
    }
}
```

到这里可以发现，和前面分析的一些内容全都串起来了，整个处理过程也都分析完了，如果还有不太理解的，可以自行debug多走几遍流程，并且一定要结合前面的内容综合分析，Netty源码的难点主要就是几个点，1.主线程和EventLoop线程的切换；2.回调；3.pipeline的事件传播。只要弄清楚这些，相信大家很快能吃透Netty。