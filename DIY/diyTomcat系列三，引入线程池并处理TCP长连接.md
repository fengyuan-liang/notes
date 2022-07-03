# diyTomcat系列三，引入线程池并处理TCP长连接



![image-20211227164819753](https://cdn.fengxianhub.top/resources-master/202201220907063.png)

本节欲解决的几个问题：

```java
线程的频繁创建和销毁、每一次HTTP请求都会产生一个新的Socket连接，当请求数过多时开销较大
```

解决方案：

```java
引入线程池、利用Connection=keep-alive、连接超时时间控制TCP长连接来处理http请求
```

## 1. 引入线程池

在正常的网络请求中，需要同时处理大量的http请求，如果每个http请求都交给一个单独的线程来处理，这个线程处理完后马上又会被销毁掉，这样将会消耗掉性能，造成不必要的开销，所以我们引入<code>线程池</code>来处理请求

```java
//我们先来看一下线程池构造方法要传入那些参数
ThreadPoolExecutor(corePoolSize,maxPoolSize,keepAliveTime,unit,workQueue,threadFactory,handler);
//参数依次为：
/核心线程池的大小，获取服务器处理器的核心数
int corePoolSize = Runtime.getRuntime().availableProcessors();
//核心线程池的最大线程数
int maxPoolSize=corePoolSize * 2;
//线程最大空闲时间
long keepAliveTime=10;
//时间单位 设置为秒
TimeUnit unit=TimeUnit.SECONDS;
//阻塞队列 容量为 maxPoolSize * 4，最多允许放入 maxPoolSize * 4 个空闲任务
BlockingQueue<Runnable> workQueue=new ArrayBlockingQueue<>(maxPoolSize * 4);
//线程创建工厂
ThreadFactory threadFactory = new NameThreadFactory();
//线程池拒绝策略
RejectedExecutionHandler handler = new MyIgnorePolicy();
```

​		如果连接数不大的情况下使用线程池其实更浪费资源，所有<code>Tomcat</code>默认情况下是不使用线程池的，等到了一定的请求数再使用线程池，当然，基于<code>高内聚低耦合</code>的设计思路，我们也可以在<code>server.xml</code>第74行的配置文件中手动进行设置，设置默认启动线程池

![image-20220122233328801](https://cdn.fengxianhub.top/resources-master/202201222333927.png)

## 2. 处理TCP长连接

​		首先我们要知道，<code>HTTP协议</code>是一个<code>应用层的协议</code>，<code>应用层的协议</code>协议是定义消息对话，确保正在发送的消息得到<code>期待的响应</code>，并且在传输数据时调用<code>正确的服务</code>。HTTP协议是基于<code>请求/响应</code>模式的。我们平时讨论的长连接是<code>TCP长连接</code>，<code>应用层</code>不关注是长连接还是短连接，只要服务端给了<code>响应</code>，本次HTTP连接就结束了，或者更准确的说，是本次HTTP请求就结束了，下一次又是一个新的请求和新的响应，因此根本没有长连接这一说。那么自然也就没有短连接这一说了。

对应到代码上来看TCP长连接也就是<code>socket</code>一直没有被关闭，一直处于连接状态。

**那怎么设置长连接呢？**

​		我们只需要在请求头里设置<code>Connection:keep-alive</code>就可以了，这样当我们的服务器接收到这个请求时，就不会主动去关闭<code>socket连接</code>，当一个网页打开完成后，客户端和服务器之间用于传输HTTP数据的 <code>TCP连接</code>不会关闭，如果客户端再次访问这个服务器上的网页，会继续使用这一条已经建立的连接。当然设置为<code>Keep-Alive</code>的服务器也不会永久保持连接，它有一个<code>保持时间</code>，可以在不同的服务器软件（如Tomcat）中设定这个时间，如果客户端在规定的时间里没有进行<code>http</code>请求，就好断开连接，落实到代码里也就是关闭<code>socket</code>。实现长连接要客户端和服务端都支持长连接。HTTP协议的长连接和短连接，实质上是TCP协议的长连接和短连接。

Tomcat中设置连接超时时间可以在<code>server.xml</code>中第69行<code>Connector</code>里进行配置，可以看到Tomcat长连接的默认的时间是20s

![image-20220122221203798](https://cdn.fengxianhub.top/resources-master/202201222212862.png)



在笔者的第二篇文章中没有处理<code>长连接</code>，可以看到每一次<code>http</code>请求后都关闭了连接，然后又会进行一次新的连接

![image-20220122221546658](https://cdn.fengxianhub.top/resources-master/202201222215780.png)

接下来我们去优化他(其实也很简单，就是不关掉socket连接并设置超时时间就可以了)：

主体代码是在第二篇文章中<code>TaskService</code>里面进行修改的，这里先贴修改和代码，完整代码在文章最后面后贴出，笔者这里还对连接次数进行了限制，防止一个线程处理过多的请求造成异常，配合线程池可以增加活跃状态的<code>线程数</code>来处理请求。

其中<code>HttpServletRequest</code>和<code>HttpServletResponse</code>里都不能关闭流的连接，因为关闭通过<code>socket</code>获得的流，<code>socket</code>也会关闭，这样就会造成异常。

```java
public void run() {
    long connectionTime = 0L;//记录连接时间
    while (flag){
        try {
            connectionCount++;
            logger.info(Thread.currentThread().getName()+",此长连接处理了"+connectionCount+"次请求");
            if(connectionCount > MAX_REQUEST_COUNT){
                connection = "close";
            }
            //http请求封装，如果没有请求会在这里堵塞
            HttpServletRequest req = new HttpServletRequest(socket);
            //根据请求做出响应
            HttpServletResponse resp = new HttpServletResponse(req, socket);
        } catch (Exception e) {
            logger.error("线程运行错误",e);
            connection = "close";
        }finally {
            //超时关闭连接
            if(connectionTime == 0){
                connectionTime = System.currentTimeMillis();
            }else {
                connectionTime = System.currentTimeMillis() - connectionTime;
                if(connectionTime > 20000){//超时时间可以从xml配置文件中读取
                    flag = false;
                    connection = "close";//关闭连接
                }
            }
            //超过连接次数关闭连接
            if("close".equals(connection)){
                flag = false;
                //不是长链接即关闭资源
                try {
                    if(socket != null){
                        socket.close();
                    }
                } catch (IOException ioException) {
                    logger.error(ioException.getMessage());
                }
                try {
                    if(in != null){
                        in.close();
                    }
                } catch (IOException ioException) {
                    logger.error(ioException.getMessage());
                }
                try {
                    if(out != null){
                        out.close();
                    }
                } catch (IOException ioException) {
                    logger.error(ioException.getMessage());
                }
            }
        }
    }
}
```

## 3. 项目完整代码

参照第二期的代码，这里只做了少许修改。

这里要切记<code>HttpServletRequest</code>和<code>HttpServletResponse</code>里都不能关闭流的连接，因为关闭通过<code>socket</code>获得的流，<code>socket</code>也会关闭，这样就很造成异常，关闭<code>Socket</code>连接在<code>TaskService</code>进行处理

### 3.1 MyCatServer

```java
package com.fx.tomcat;


import org.apache.log4j.Logger;
import org.dom4j.Document;
import org.dom4j.DocumentException;
import org.dom4j.Element;
import org.dom4j.io.SAXReader;

import javax.xml.parsers.DocumentBuilderFactory;
import javax.xml.parsers.ParserConfigurationException;
import java.io.*;
import java.net.ServerSocket;
import java.net.Socket;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * @author:fengxian
 * @date: 2022/1/17 17:02
 * Description:
 */
public class MyCatServer {
    private final static Logger logger = Logger.getLogger(MyCatServer.class);
    private static Map<String, Map<String,String>> map;//用来包装配置文件
    private static boolean flag=true;
    public static void main(String[] args) {
        MyCatServer myCatServer = new MyCatServer();
        //从配置文件中获得服务的端口
        int tomcatServicePort = Integer.parseInt(map.get("Connector").get("port"));
        //根据配置文件使用不同的多线程策略
        if("true".equalsIgnoreCase(map.get("Connector").get("executor"))){
            myCatServer.startServerByThreadPool(tomcatServicePort);
        }else {
            myCatServer.startServerByThread(tomcatServicePort);
        }
    }

    /**
     * 不通过线程池
     */
    private void startServerByThread(int port){
        try (ServerSocket ss = new ServerSocket(port)) {
            while (flag){
                Socket socket = ss.accept();
                logger.debug("有用户进行请求,他是"+socket.getLocalSocketAddress());
                new Thread(new TaskService(socket)).start();
            }
        } catch (Exception e) {
            logger.error("服务器启动异常"+e);
        }
    }

    /**
     * 线程池开启线程
     */
    private void startServerByThreadPool(int port) {
        //核心线程池的大小，获取服务器处理器的核心数
        int corePoolSize = Runtime.getRuntime().availableProcessors();
        //核心线程池的最大线程数
        int maxPoolSize=corePoolSize * 2;
        //线程最大空闲时间
        long keepAliveTime=10;
        //时间单位
        TimeUnit unit=TimeUnit.SECONDS;
        //阻塞队列 容量为2 最多允许放入两个空闲任务
        BlockingQueue<Runnable> workQueue=new ArrayBlockingQueue<>(maxPoolSize * 4);
        //线程创建工厂
        ThreadFactory threadFactory = new NameThreadFactory();
        //线程池拒绝策略
        RejectedExecutionHandler handler = new MyIgnorePolicy();
        //线程池执行者
        ThreadPoolExecutor executor;
        //不允许无节制的创建线程，必须使用线程池
        executor = new ThreadPoolExecutor(corePoolSize,maxPoolSize,keepAliveTime,unit,workQueue,threadFactory,handler);
        //预启动所有核心线程，提升效率
        executor.prestartAllCoreThreads();
        try (ServerSocket ss = new ServerSocket(port)) {
            while(flag){
                Socket socket = ss.accept();
                logger.debug("有用户进行请求,他是"+socket.getLocalSocketAddress());
                //执行任务
                executor.submit(new TaskService(socket));
            }
        } catch (Exception e) {
        	logger.error("服务器启动异常：{}",e);
        } finally {
            //线程池关闭
            executor.shutdown();
        }
    }

    /**
     * 线程工厂
     */
    static class NameThreadFactory implements ThreadFactory {
        Logger logger = Logger.getLogger(NameThreadFactory.class);
        //线程id， AtomicInteger 原子类
        private final AtomicInteger threadId=new AtomicInteger(1);
        @Override
        public Thread newThread(Runnable r) {
            Thread t = new Thread(r, "线程" + threadId.getAndIncrement());//相当于i++
            logger.info(t.getName()+"已经被创建了");
            return t;
        }
    }

    /**
     * 线程池BlockingQueue满后的拒绝策略
     */
    public static class MyIgnorePolicy implements RejectedExecutionHandler {
        @Override
        public void rejectedExecution(Runnable r, ThreadPoolExecutor e) {
            logger.error("线程池+"+ e.toString()+r.toString()+"被拒绝");
        }
    }

    //dom4j 解析 xml
    static {
        map = new ConcurrentHashMap<>();
        Map<String,String> sonMap = new HashMap<>();
        SAXReader saxReader = new SAXReader();
        Document document = null;
        try {
            document = saxReader.read("conf/server.xml");
        } catch (DocumentException e) {
            logger.error("配置文件解析失败{}",e);
        }
        assert document != null;
        Element root = document.getRootElement();
        Element connector = root.element("Service").element("Connector");
        sonMap.put("port",connector.attributeValue("port"));
        sonMap.put("protocol",connector.attributeValue("protocol"));
        sonMap.put("connectionTimeout",connector.attributeValue("connectionTimeout"));
        sonMap.put("redirectPort",connector.attributeValue("redirectPort"));
        sonMap.put("executor",connector.attributeValue("executor"));
        map.put("Connector",sonMap);
    }
}

```

### 3.2 TaskService

```java
package com.fx.tomcat;

import org.apache.log4j.Logger;

import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.Socket;
import java.time.Duration;
import java.time.Instant;

/**
 * @author: fengxian
 * @date: 2022/1/18 9:09
 * Description:
 */
public class TaskService implements Runnable{
    private final Logger logger = Logger.getLogger(TaskService.class);
    private Socket socket;
    private InputStream in = null;
    private OutputStream out = null;
    private String connection="keep-alive";
    private boolean flag;
    private final int MAX_REQUEST_COUNT = 30;
    private int connectionCount;//连接次数
    public TaskService(Socket socket){
        this.socket=socket;
        flag = true;
    }
    @Override
    public void run() {
        long connectionTime = 0L;
        while (flag){
            try {
                connectionCount++;
                logger.info(Thread.currentThread().getName()+",此长连接处理了"+connectionCount+"次请求");
                if(connectionCount > MAX_REQUEST_COUNT){
                    connection = "close";
                }
                //http请求封装，如果没有请求会在这里堵塞
                HttpServletRequest req = new HttpServletRequest(socket);
                //根据请求做出响应
                HttpServletResponse resp = new HttpServletResponse(req, socket);
            } catch (Exception e) {
                logger.error("线程运行错误",e);
                connection = "close";
            }finally {
                //超时关闭连接
                if(connectionTime == 0){
                    connectionTime = System.currentTimeMillis();
                }else {
                    connectionTime = System.currentTimeMillis() - connectionTime;
                    if(connectionTime > 20000){//超时时间可以从xml配置文件中读取
                        flag = false;
                        connection = "close";//关闭连接
                    }
                }
                //超过连接次数关闭连接
                if("close".equals(connection)){
                    flag = false;
                    //不是长链接即关闭资源
                    try {
                        if(socket != null){
                            socket.close();
                        }
                    } catch (IOException ioException) {
                        logger.error(ioException.getMessage());
                    }
                    try {
                        if(in != null){
                            in.close();
                        }
                    } catch (IOException ioException) {
                        logger.error(ioException.getMessage());
                    }
                    try {
                        if(out != null){
                            out.close();
                        }
                    } catch (IOException ioException) {
                        logger.error(ioException.getMessage());
                    }
                }
            }
        }
    }
}

```

HttpServletResponse和HttpServletRequest只是将关闭流的代码全部剔除了，其他未进行修改

## 4. 项目演示效果和新问题思考

![image-20220122234040199](https://cdn.fengxianhub.top/resources-master/202201222340334.png)

>这里又有一个有意思的点

**为什么设置了长连接还是会产生这么多新的socket连接呢？**是不是超时了？

我们将超时时间设置为天长和地久再测试一遍

![image-20220122234313036](https://cdn.fengxianhub.top/resources-master/202201222343145.png)

测试结果：

![image-20220122234857290](https://cdn.fengxianhub.top/resources-master/202201222348396.png)

我们会发现还是会产生6个<code>socket</code>连接，但是我们多测试几次后就会发现，每次都会产生6个<code>socket</code>连接

**这是为什么呢？**

![image-20220122235218520](https://cdn.fengxianhub.top/resources-master/202201222352805.png)



​		那是因为浏览器在请求资源的时候不可能只是一个线程进行资源请求，这样请求的话会导致速度很慢，所以浏览器都会对同一个服务器设置有默认的<code>HTTP最大并发连接数</code>,主流浏览器默认并发数如下：

|  Browser   | HTTP/1.1 | HTTP/1.0 |
| :--------: | :------: | :------: |
|   IE 8,9   |    6     |    6     |
|   IE 6,7   |    2     |    4     |
| Firefox 17 |    6     |    6     |
| Firefox 3  |    6     |    6     |
| Firefox 2  |    2     |    8     |
| Safari 3,4 |    4     |    4     |
| Chrome 1,2 |    6     |    ?     |
|  Chrome 3  |    4     |    4     |
| Chrome 4+  |    6     |    ?     |



​		我们都知道在Tomcat中可以使用<code>@WebServlet</code>代替<code>xml</code>文件来进行地址映射，下一篇文章笔者将自定义这个注解并实现<code>Servlet动态资源</code>的访问。自定义注解的过程可以看下笔者的文章，<a href="https://blog.csdn.net/fengxiandada/article/details/122630389">注解学习一、Java内置注解及注解书写</a>和<a href="https://blog.csdn.net/fengxiandada/article/details/122642795">注解学习二、使用注解仿写junit测试框架</a>，先尝试着写几个注解。

下一篇：<a href="https://blog.csdn.net/fengxiandada/article/details/122660110">diyTomcat系列四，自定义注解并实现Servlet动态资源访问</a>























