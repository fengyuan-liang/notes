# zookeeper操作封装——Apache Curator使用

<a href="https://curator.apache.org/index.html">Apache Curator官网</a>

Apache Curator官网简介：

Apache Curator is a Java/JVM client library for [Apache ZooKeeper](https://zookeeper.apache.org/), a distributed coordination service. It includes a highlevel API framework and utilities to make using Apache ZooKeeper much easier and more reliable. It also includes recipes for common use cases and extensions such as service discovery and a Java 8 asynchronous DSL.

是一个 Java/JVM 客户端库，用于 Apache ZooKeeper 服务，一个分布式协调服务。它包括一个高级的 API 框架和实用工具，使得使用 google Apache ZooKeeper 变得更加容易和可靠。它还包括常见用例和扩展的处方，例如服务发现和 java8异步 DSL。

>`Curator `就是帮我们封装了`zookeeper`的常用操作，节省我们的代码量，例如我们只需要写**不超过五行代码**就可以使用`zookeeper`实现分布式锁，还有session超时重连，主从选举，分布式计数器，等适用于各种复杂的zookeeper场景的API封装，接下来让我们看看如何使用

原生的zkClient操作数据库可以看我的这篇文章：<a href="https://blog.csdn.net/fengxiandada/article/details/124697818?spm=1001.2014.3001.5502">docker安装zookeeper&zookeeper基本使用（非常详细）</a>

首先我们需要导入pom依赖，`Curator`依赖的版本只能比`zookeeper`依赖的版本高

```xml
<properties>
    <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
    <lombok.version>1.18.22</lombok.version>
    <slf4j.version>1.7.36</slf4j.version>
    <junit.version>4.7</junit.version>
    <logback.version>1.2.3</logback.version>
    <zookeeper.version>3.7.0</zookeeper.version>
    <curator-framework.version>4.0.1</curator-framework.version>
    <curator-recipes.version>4.0.1</curator-recipes.version>
</properties>
<dependencies>
    <dependency>
        <groupId>org.projectlombok</groupId>
        <artifactId>lombok</artifactId>
        <version>${lombok.version}</version>
    </dependency>
    <dependency>
        <groupId>org.slf4j</groupId>
        <artifactId>slf4j-api</artifactId>
        <version>${slf4j.version}</version>
    </dependency>
    <dependency>
        <groupId>ch.qos.logback</groupId>
        <artifactId>logback-classic</artifactId>
        <version>${logback.version}</version>
    </dependency>
    <dependency>
        <groupId>junit</groupId>
        <artifactId>junit</artifactId>
        <version>${junit.version}</version>
        <scope>compile</scope>
    </dependency>
    <dependency>
        <groupId>org.apache.zookeeper</groupId>
        <artifactId>zookeeper</artifactId>
        <version>${zookeeper.version}</version>
    </dependency>
    <dependency>
        <groupId>org.apache.curator</groupId>
        <artifactId>curator-framework</artifactId>
        <version>${curator-framework.version}</version>
    </dependency>
    <dependency>
        <groupId>org.apache.curator</groupId>
        <artifactId>curator-recipes</artifactId>
        <version>${curator-recipes.version}</version>
    </dependency>
</dependencies>
```



## 1. 基本操作

### 1.1 建立连接

```java
public class Test01_connection {
    private CuratorFramework client;
    @Before
    public void setUp() {
        String url = "zk的ip地址:端口号";
        /*
         * Create a new client
         *
         * @param connectString       连接url，集群用逗号分割
         * @param sessionTimeoutMs    会话超时时间 单位：毫秒，默认60秒
         * @param connectionTimeoutMs 连接超时时间 单位：毫秒，默认15秒
         * @param retryPolicy         重试策略
         * @return client
         */
        //重试策略，每隔3秒重试一次，最多重试10次
        ExponentialBackoffRetry retryPolicy = new ExponentialBackoffRetry(3000, 10);
        // 第一种：通过构造器构造
//        CuratorFramework client = CuratorFrameworkFactory.newClient(url,
//                60 * 1000, 15 * 1000, retryPolicy);
        // 第二种：builder模式链式编程
        client = CuratorFrameworkFactory.builder()
                .connectString(url)
                .sessionTimeoutMs(60 * 1000)  //会话超时时间
                .connectionTimeoutMs(15 * 1000)
                .retryPolicy(retryPolicy)     //掉线重连策略
                .namespace("Test01_connection") //默认一个根目录，以后的所有创建都会在此目录下进行
                .build();
        client.start();//开启连接
    }

    @After
    public void after(){
        if(client != null){
            client.close();
        }
    }
}
```

### 1.2 建立结点

**普通结点：默认持久无序**

```java
@Test
public void testCreate() throws Exception {
    client.create().forPath("/app1","curator创建的结点".getBytes());
}
```

**创建临时无序结点**：

**CreateMode是一个枚举类型，用来表示创建结点的类型，包括有序、无序、持久、临时**

|          单词          | 中文含义 |
| :--------------------: | :------: |
| PERSISTENT(persistent) |   持久   |
|  EQUENTIAL(ephemeral)  |   临时   |
| SEQUENTIAL(sequential) |   有序   |

```java
public enum CreateMode {
    PERSISTENT(0, false, false, false, false),              //持久
    PERSISTENT_SEQUENTIAL持久(2, false, true, false, false), //持久且有序
    EPHEMERAL(1, true, false, false, false),                //临时
    EPHEMERAL_SEQUENTIAL(3, true, true, false, false),      //临时且有序
    CONTAINER(4, false, false, true, false),                //容器结点
    PERSISTENT_WITH_TTL(5, false, false, false, true),      //带TTL的持久结点
    PERSISTENT_SEQUENTIAL_WITH_TTL(6, false, true, false, true); //带TTL的持久有序结点
}

```

测试代码：

```java
@Test
public void testCreate2() throws Exception {
    client.create()
        .withMode(CreateMode.EPHEMERAL)
        .forPath("/app2", "curator创建的临时结点".getBytes());
}
```

>其他模式的结点同理可创建，这里不再赘述

**创建多级结点**：

在传统的zkClient连接中是无法直接创建多级结点的，`curator`中可以直接创建，但如果多级结点中的父结点不存在会报错，`curator`

也为我们提供了相应的方法，这里我们`app3`本来是没有的，添加`creatingParentsIfNeeded`就自动创建了

```java
@Test
public void testCreate3() throws Exception {
    client.create()
            .creatingParentsIfNeeded()
            .withMode(CreateMode.EPHEMERAL)
            .forPath("/app3/app3_1", "curator递归创建结点".getBytes());
}
```

**设置ACL**

在`curator`中设置ACL也非常方便，ACL的使用可以看我的上篇文章：<a href="https://blog.csdn.net/fengxiandada/article/details/124697818?spm=1001.2014.3001.5502">docker安装zookeeper&zookeeper基本使用（非常详细）</a>

```java
@Test
public void testCreate4() throws Exception {
    client.create()
            .creatingParentsIfNeeded()
            .withMode(CreateMode.EPHEMERAL)
            .withACL(ZooDefs.Ids.CREATOR_ALL_ACL)
            .forPath("/app5", "curator创建的带所有访问权限临时结点".getBytes());
}
```

可以看到相比原生的API，`curator`链式调用的方式非常的优雅，并且在idea中还有提示

### 1.3 查询结点

相应的zkCli操作：

```css
get [-s] [-w] path //查看结点存储的值及其结点状态
stat [-w] path //查看结点状态
ls [-s] [-w] [-R] path //查看某一结点下的子结点
```

#### 查询数据

`get /path`

```java
@Test
public void testQuery() throws Exception {
    byte[] data = client.getData()
            .forPath("/app1");
    System.out.println(new String(data));
}
```

#### 查询子结点

`ls /path`

```java
@Test
public void testQuery2() throws Exception {
    List<String> list = client.getChildren()
            .forPath("/app1");
    list.forEach(System.out::println);
}
```

#### 查看结点信息

`get -s /path`

```java
@Test
public void testQuery3() throws Exception {
    Stat status = new Stat(); //封装一个stat用来存储信息
    client.getData()
            .storingStatIn(status)
            .forPath("/");
    System.out.println(status);
}
```

### 1.4 修改结点

#### 普通修改

```java
@Test
public void testUpdate() throws Exception {
    client.setData()
        .forPath("/","修改数据".getBytes());
}
```

#### 带乐观锁的修改

```java
@Test
public void testUpdateForVersion() throws Exception {
    //先要查出版本号
    Stat status = new Stat();
    client.getData()
            .storingStatIn(status)
            .forPath("/");
    int version = status.getVersion();
    //版本号不一样会导致修改失败
    client.setData()
            .withVersion(version)
            .forPath("/","修改数据".getBytes());
}
```

### 1.5 删除

#### 删除单个结点

```java
@Test
public void testDelete() throws Exception {
    client.delete()
            .forPath("/app1");
}
```

#### 删除带子结点的结点

```java
@Test
public void testDeleteAll() throws Exception {
    client.delete()
            .deletingChildrenIfNeeded()
            .forPath("/app1");
}
```

#### 必须成功的删除

主要是为了防止网络抖动

```java
@Test
public void testDeleteAll() throws Exception {
    client.delete()
        .guaranteed()
        .forPath("/app1");
}
```

#### 带回调函数的删除

```java
@Test
public void testDeleteWithCallback() throws Exception {
    client.delete()
            .guaranteed()
            .inBackground(new BackgroundCallback() {
                @Override
                public void processResult(CuratorFramework client, CuratorEvent event) throws Exception {
                    //删除结点后的业务逻辑代码
                }
            })
            .forPath("/app1");
}
```

## 2. 监听器事件

我们知道在`zookeeper`中，监听器是实现其特性的重要保障，而传统的zkClient代码有些繁琐，通过`Curator`我们可以写出更流畅的代码

Curator引入了Cache来实现对ZooKeeper服务端事件的监听

`Zookeeper`提供了三种`Watcher`：

- NodeCache:只是监听某一个特定的节点
- PathChildrenCache:监控一个ZNode的子节点.
- TreeCache:可以监控整个树上的所有节点，类似于PathChildrenCache和NodeCache的组合

### 2.1 NodeCache单一结点连续监听

在`zkClient`中我们知道，监听事件只能绑定一次（这个是zookeeper的性质），我们为了持续监听一个结点，通常做法是在监听事件完后再给结点绑定一次监听，而`Curator`的`NodeCache`为我们提供了持续监听的方法

```java
@Test
public void testNodeCache() throws Exception {
    //countDownLatch为了堵塞主线程，不然主线程执行完了子线程也会结束
    CountDownLatch countDownLatch = new CountDownLatch(Integer.MAX_VALUE);
    //1. 创建NodeCache对象
    NodeCache nodeCache = new NodeCache(client, "/node1");
    //2. 注册监听
    nodeCache.getListenable()
            .addListener(new NodeCacheListener() {
                //能够监听到结点增、删、改，且可以连续监听
                @Override
                public void nodeChanged() throws Exception {
                    System.out.println("结点修改了");
                    //获取修改后的结点
                    byte[] data = nodeCache.getCurrentData().getData();
                    System.out.println(new String(data));
                    countDownLatch.countDown();
                }
            });
    //3. 开启监听，如果设置为true，则开启监听时，加载缓存数据
    nodeCache.start(true);
    countDownLatch.await();
}
```

这代码真的写的好舒服😘，虽然zookeeper的特性决定监听事件只能监听一次，但是`Curator`自动给我重新绑定了，太棒了

![1](https://cdn.fengxianhub.top/resources-master/202205191940817.gif)

### 2.2 PathChildrenCache监听子结点

注意`PathChildrenCache`只会监听子结点，当前结点的变化是监听不到的

```java
@Test
public void testPathChildrenCache() throws Exception {
    //countDownLatch为了堵塞主线程，不然主线程执行完了子线程也会结束
    CountDownLatch countDownLatch = new CountDownLatch(Integer.MAX_VALUE);
    //第三个参数表示缓存每次结点更新后的数据
    PathChildrenCache pathChildrenCache = new PathChildrenCache(client, "/node2", true);
    //2. 绑定监听器
    pathChildrenCache.getListenable()
            .addListener(new PathChildrenCacheListener() {
                @Override
                public void childEvent(CuratorFramework curatorFramework, PathChildrenCacheEvent event) throws Exception {
                    System.out.println("子结点变化了");
                    System.out.println(event);
                    if (PathChildrenCacheEvent.Type.CHILD_UPDATED == event.getType()) {
                        //更新了子结点
                        System.out.println("子结点更新了");
                        //第一个getData里有很多数据，我们只拿data部分
                        byte[] data = event.getData().getData();
                        System.out.println("更新后的值为：" + new String(data));
                    } else if (PathChildrenCacheEvent.Type.CHILD_ADDED == event.getType()) {
                        //添加了子结点
                        System.out.println("添加了子结点");
                        String path = event.getData().getPath();
                        System.out.println("子结点路径为" + path);
                    } else if (PathChildrenCacheEvent.Type.CHILD_REMOVED == event.getType()) {
                        //删除了子结点
                        System.out.println("删除了子结点");
                        String path = event.getData().getPath();
                        System.out.println("子结点路径为" + path);
                    }
                    countDownLatch.countDown();
                }
            });
    // 3. 开启监听
    pathChildrenCache.start();
    // 堵塞主线程
    countDownLatch.await();
}
```

### 2.3 TreeCache监听当前结点+子结点

TreeCache相当于NodeCache（只监听当前结点）+ PathChildrenCache（只监听子结点）的结合版，即监听当前和子结点

```java
@Test
public void testPathTreeCache() throws Exception {
    //countDownLatch为了堵塞主线程，不然主线程执行完了子线程也会结束
    CountDownLatch countDownLatch = new CountDownLatch(Integer.MAX_VALUE);
    //1. 创建监听器
    TreeCache treeCache = new TreeCache(client, "/node2");
    //2. 注册监听
    treeCache.getListenable()
            .addListener(new TreeCacheListener() {
                @Override
                public void childEvent(CuratorFramework curatorFramework, TreeCacheEvent event) throws Exception {
                    System.out.println("结点变化了");
                    System.out.println(event);
                    if (TreeCacheEvent.Type.NODE_UPDATED == event.getType()) {
                        //更新了子结点
                        System.out.println("结点更新了");
                        //第一个getData里有很多数据，我们只拿data部分
                        byte[] data = event.getData().getData();
                        System.out.println("更新后的值为：" + new String(data));
                    } else if (TreeCacheEvent.Type.NODE_ADDED == event.getType()) {
                        //添加了子结点
                        System.out.println("添加了结点");
                        String path = event.getData().getPath();
                        System.out.println("子结点路径为" + path);
                    } else if (TreeCacheEvent.Type.NODE_REMOVED == event.getType()) {
                        //删除了子结点
                        System.out.println("删除了结点");
                        String path = event.getData().getPath();
                        System.out.println("删除结点路径为" + path);
                    }
                    countDownLatch.countDown();
                }
            });
    //3. 开启监听
    treeCache.start();
    countDownLatch.await();
}
```

## 3. Curator 分布式锁

分布式锁：

- 在我们进行单机应用开发，涉及并发同步的时候，我们往往采用`synchronized`或者`Lock`的方式来解决多线程间的代码同步问题,这时多线程的运行都是在同一个JVM之下，没有任何问题
- 但当我们的应用是分布式集群工作的情况下，属于多VM下的工作环境，跨JVM之间已经无法通过多线程的锁解决同步问题
- 那么就需要一种更加高级的锁机制，来处理种`跨机器的进程之间的数据同步问题`—— 这就是分布式锁

常见的分布式锁实现有：

- 基于缓存实现（redis、Memcache）
- 基于zookeeper（Curator ）
- 数据库层面（悲观锁、乐观锁）

基于缓存虽然性能高，但是不可靠，因为redis集群保证的`AP`，基于数据库层面的性能太低了，不推荐

现在的最优解是基于`zookeeper`，zookeeper保证的`CP`，即强一致性，能够保证锁的功能

### 3.1 zookeeper分布式原理

核心思想（临时、顺序、监听）：

当客户端要获取锁，则创建结点，使用完锁，则删除结点

1. 客户端获取锁时，在lock结点下创建`临时顺序结点`
2. 然后获取lock下面的所有子节点，客户端获取到所有的子节点之后，**如果发现自己创建的子节点序号最小**，那么就认为该客户端获**取到了锁**。**使用完锁后，将该节点删除**。
3. 如果发现自己创建的结点并非`lock`所有子结点中最小的，说明自己还没有获取到锁，此时客户端需要找到比自己小的那个结点，同时对其注册事件监听器，监听删除事件
4. 如果发现比自己小的那个节点**被删除**，则客户端的`Watcher`会收到相应通知，此时再次判断自己创建的节点是否是lock子节点中序号最小的，如果是则获取到了锁,如果不是则重复以上步骤继续获取到比自己小的一个节点并注册监听。

- 

常见面试题：

- 为什么是临时结点？答：防止某个结点宕机而导致锁一直不释放的问题
- 为什么是顺序结点？ 答：公平锁，为了寻找最小结点从而获取锁

### 3.2 Curator 封装的五种分布式锁

`Curator `为我们封装了五种常用的分布式锁

1. InterProcessSemaphoneMutex：分布式排他锁（非可重入锁）
2. InterProcessMutex：分布式可重入排他锁
3. InterProcessReadWriteLock：分布式读写锁
4. InterProcessMultiLock：将多个锁作为单个实体管理的容器
5. InterProcessSemaphoreV2：共享信号量

熟悉JUC的同学看到这些名词应该会感到很熟悉，Curator 只是将单机的锁改成了分布式锁，其作用同样是保证共享变量的安全问题

下面我们结合具体的业务场景来分析一下分布式锁的

### 3.3 模拟12306卖票实现可重入锁

![image-20220519211027529](https://cdn.fengxianhub.top/resources-master/202205192110809.png)

首先我们知道很多用户都会访问12306的同一份共享资源（票），所以我们的分布式锁肯定是加在共享资源上的

我们先封装一个资源类，用来模拟共享资源

```java
public class Ticket12306 implements Runnable{
    private int tickets = 10;//数据库里的票数

    @Override
    public void run() {
        while (tickets > 0){
            System.out.println(Thread.currentThread().getName() + ":" + tickets);
            tickets--;
        }
    }
}
```

当我们的客户端卖票时如果不加锁肯定是会有票超卖的问题的

```java
public class DistributedLock {
    public static void main(String[] args) {
        Ticket12306 ticket12306 = new Ticket12306();
        //创建客户端
        Thread t1 = new Thread(ticket12306, "飞猪");
        Thread t2 = new Thread(ticket12306, "携程");
        Thread t3 = new Thread(ticket12306, "去哪儿");
        //开始抢票
        t1.start();
        t2.start();
        t3.start();
    }
}
```

运行结果

```css
飞猪:10
飞猪:9
飞猪:8
飞猪:7
飞猪:6
飞猪:5
飞猪:4
飞猪:3
飞猪:2
飞猪:1
去哪儿:10
携程:10
```

使用Curator封装好的锁非常简单，我们这里先演示一个` InterProcessMutex：分布式可重入排他锁`的，对应单机中的`Synchronized`和`ReentrantLock`

```java
public class Ticket12306 implements Runnable {
    private int tickets = 10;//数据库里的票数
    private InterProcessMutex lock; //分布式可重入排他锁

    public Ticket12306() {
        String url = "zookeeper的ip地址:端口号";
        //重试策略，每隔3秒重试一次，最多重试10次
        ExponentialBackoffRetry retryPolicy = new ExponentialBackoffRetry(3000, 10);
        CuratorFramework client = CuratorFrameworkFactory.builder()
                .connectString(url)
                .sessionTimeoutMs(60 * 1000)
                .connectionTimeoutMs(15 * 1000)
                .retryPolicy(retryPolicy)
                .build();
        //开启连接zookeeper
        client.start();
        lock = new InterProcessMutex(client,"/lock");
    }

    @Override
    public void run() {
        //获取锁，三秒钟获取一次，如果没有获取到需要等三秒再获取
        try {
            lock.acquire(3, TimeUnit.SECONDS);
            while (tickets > 0) {
                System.out.println(Thread.currentThread().getName() + ":" + tickets);
                tickets--;
            }
        } catch (Exception e) {
            e.printStackTrace();
        } finally {
            //释放锁，注意锁无论如何都要释放掉
            try {
                lock.release();
            } catch (Exception e) {
                e.printStackTrace();
            }
        }
    }
}
```

每一个线程执行其实就对应一个新的`zookeeper连接`，这里其实已经模拟出了多客户端争抢锁的情况，我们从结果来看其实问题已经的到了解决

```css
去哪儿:10
去哪儿:9
去哪儿:8
去哪儿:7
去哪儿:6
去哪儿:5
去哪儿:4
去哪儿:3
去哪儿:2
去哪儿:1
```

但是由于我们设置的是`InterProcessMutex：分布式可重入排他锁`，所以导致由同一个客户端多次抢到锁的现象发生

### 3.4 读写锁InterProcessReadWriteLock

和JUC里面的一样，主要核心思想是`读锁共享，写锁排他`

- 读锁:大家都可以读，要想上读锁的前提:之前的锁没有写锁
- 写锁:只有得到写锁的才能写。要想上写锁的前提是，**之前没有任何锁**。

和JUC里一样使用即可，`Curator `底层都已经封装好了

```java
private InterProcessReadWriteLock readWriterLock;
readWriterLock.readLock().acquire();
readWriterLock.readLock().release();
readWriterLock.writeLock().acquire();
readWriterLock.writeLock().release();
```















































