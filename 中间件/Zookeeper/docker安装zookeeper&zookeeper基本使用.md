#  docker安装zookeeper&zookeeper基本使用（非常详细）

简介：

[zookeeper](https://so.csdn.net/so/search?q=zookeeper&spm=1001.2101.3001.7020)是经典的分布式数据一致性解决方案，致力于为分布式应用提供一个高性能，高可用，且具有严格顺序访问控制能力的分布式协调存储服务

Apache Hadoop大数据生态里面的组件的图标大部分都是动物，例如🐘、🐝、🐖、🐬，而zookeeper的图标是一个拿着铲子的👨‍🏭，是管理大数据生态系统各组件的管理员。

![1972306-20210328192107325-998987816](https://cdn.fengxianhub.top/resources-master/202205091340206.png)



zookeeper的详细理论讲解和功能请查看<a href="https://www.runoob.com/w3cnote/zookeeper-tutorial.html">菜鸟教程zookeeper</a>，本篇文章全部为实战

## 1. docker安装zookeeper

下载zookeeper 最新版镜像

```css
docker search zookeeper    
docker pull zookeeper 
docker images              //查看下载的本地镜像
docker inspect zookeeper   //查看zookeeper详细信息
```

新建一个文件夹

```shell
mkdir zookeeper
```

挂载本地文件夹并启动服务

```css
docker run -d -e TZ="Asia/Shanghai" -p 2181:2181 -v /root/docker/zookeeper:/data --name zookeeper --restart always zookeeper
```

参数解释

```shell
-e TZ="Asia/Shanghai" # 指定上海时区 
-d # 表示在一直在后台运行容器
-p 2181:2181 # 对端口进行映射，将本地2181端口映射到容器内部的2181端口
--name # 设置创建的容器名称
-v # 将本地目录(文件)挂载到容器指定目录；
--restart always #始终重新启动zookeeper
```

查看容器

```shell
docker ps
```

进入容器(zookeeper)

第一种方式

```css
 docker run -it --rm --link zookeeper:zookeeper zookeeper zkCli.sh -server zookeeper       //这样的话，直接登录到容器时，进入到 zkCli中
```

第二种方式（推荐）

```css
docker exec -it zookeeper bash      //只登录容器，不登录 zkCli
./bin/zkCli.sh    //执行脚本新建一个Client，即进入容器
```



## 2. zookeeper基本使用（Linux）

思维导图：

![image-20220510202219965](https://cdn.fengxianhub.top/resources-master/202205102022235.png)

>接下来是各命令的使用和演示
>
>其实最重要的命令应该是help命令，可以查看帮助

### 新增结点

```css
格式：create [-s] [-e] [-c] [-t ttl] path [data] [acl]
解释: 
[-s] : 创建有序结点
[-e] : 创建临时结点
[-c] : 创建一个容器结点，容器结点主要用来容纳字结点，如果没有给其创建子结点，容器结点表现和持久化结点一样，如果给容器结点创建了子结点，后续又把子结点清空，容器结点也会被zookeeper删除。定时任务默认 60s 检查一次
[t ttl] : 创建一个TTL结点， -t 时间（单位毫秒）
path: 路径 ，因为没有中括号，所以是必须参数。
[data]：结点的数据，可选，如果不使用时，结点数据就为null
[acl] ：权限相关，后面文章会专门讲
```

演示 : 

创建持久结点: `create /test '测试' `  （默认创建无序持久结点）

![image-20220509195709920](https://cdn.fengxianhub.top/resources-master/202205091957015.png)

创建持久化有序结点：`create -s /1_node 1`

创建有序结点时，Zookeeper会在我们知道的结点名称后面补一个有序的，唯一的递增数字后缀

![image-20220509200755087](https://cdn.fengxianhub.top/resources-master/202205092007167.png)

创建临时结点：`create -e /3_node`

当前客户端和zookeeper连接断开后，临时结点将被清除

![image-20220509201231170](https://cdn.fengxianhub.top/resources-master/202205092012237.png)

当重新连接后：

![image-20220509201342908](https://cdn.fengxianhub.top/resources-master/202205092013006.png)

创建临时有序结点：`create -e -s /node3 "2"`

创建容器结点：`create -c /node4 "容器结点"`

创建TTL结点：`create -t 2000 /node5 "TTL结点"`

### 查看命令

```css
格式: get [-s] [-w] path //查看结点存储的值及其结点状态
解释:
[-s] : 查看结点数据和结点状态(字段含义看下面的stat)
[-w] : 查看结点，并添加一个监听器，当指定的znode或znode的子结点数据更改(set path data)时，监视器会显示通知，但只会显示一次，显示后会将监听删除

格式: stat [-w] path //查看结点状态
解释: 
[-w] :查看结点并为结点添加一个监听，当结点被修改时，该客户端会收到一个回调。之前版本是在path 后面加一个watch实现:stat path watch
结点状态参数解释:
cZxid：创建znode的事务ID（Zxid的值）
mZxid：最后修改znode的事务ID。
pZxid：最后添加或删除子结点的事务ID（子结点列表发生变化才会发生改变）。
ctime：znode创建时间。
mtime：znode最近修改时间。
dataVersion：znode的当前数据版本。
cversion：znode的子结点结果集版本（一个结点的子结点增加、删除都会影响这个版本）。
aclVersion：表示对此znode的acl版本。
ephemeralOwner：znode是临时znode时，表示znode所有者的 session ID。 如果znode不是临时znode，则该字段设置为零。
dataLength：znode数据字段的长度。
numChildren：znode的子znode的数量

格式: ls [-s] [-w] [-R] path //查看某一结点下的子结点
解释:
[-s] : 查看某一结点下的子结点加当前结点的元信息，相当于之前版本的ls2命令
[-w] : 查看结点并为结点添加一个监听，当结点被修改时，该客户端会收到一个回调。之前版本是在path 后面加一个watch实现:ls path watch 
[-R] : 返回当前结点路径，当前结点的子结点，当前结点的子结点的子结点（递归）
```

>get [-s] [-w] path //查看结点存储的值及其结点状态

![image-20220509202817810](https://cdn.fengxianhub.top/resources-master/202205092028956.png)

查看信息并添加监视器：`get -w /test`，注意监视器只会起一次作用并且在此命令中只监视结点数据更新

![image-20220509204100460](https://cdn.fengxianhub.top/resources-master/202205092041527.png)

>stat [-w] path //查看结点状态

![image-20220509205934394](https://cdn.fengxianhub.top/resources-master/202205092059527.png)

>ls [-s] [-w] [-R] path //查看某一结点下的子结点

![image-20220509210209439](https://cdn.fengxianhub.top/resources-master/202205092102575.png)

### 修改命令

```css
格式: set [-s] [-v version] path data
解释:
[-s] :返回修改后结点的元信息
[-v version] :指定数据的版本，版本不符合时修改失败，类似关系型数据库的乐观锁,Java中的CAS机制，当传入数据版本号和当前不一致时拒绝修改，初始版本号dataVersion为0，每次修改后会加1
path :修改结点路径
data ：修改的数据
```

![image-20220509212612042](https://cdn.fengxianhub.top/resources-master/202205092126128.png)

### 删除命令

```css
格式: delete [-v version] path //删除结点，删除的结点必须没有任何子结点，否则会删除失败
解释:
[-v version] :和修改命令一样

deleteall path // 递归结点，会递归删除该结点及其所有子结点，旧版本是rmr path
```

### 其他命令

```css
history 查看当前连接最新的11条历史命令

connect host:port 连接其他Zookeeper服务器

close 关闭客户端连接，把连接设置为关闭状态，实质关闭Socket连接，关闭之后发送命令就会报错
	
printwatches on|off 是否开启watch机制，如果设置为off，则该客户端监听的结点事件都不会生效、默认on

removewatches path 删除在某结点上设置的监听

sync path  把当前Zookeeper服务器的指定结点同步到主从集群中的其他Zookeeper服务器上

```

## 3. zookeeper ACL(Linux)

>此处参考<a href="https://www.runoob.com/w3cnote/zookeeper-acl.html">菜鸟教程Zookeeper 权限控制 ACL</a>

zookeeper 的 ACL（Access Control List，访问控制表）权限在生产环境是特别重要的，所以本章节特别介绍一下。

ACL 权限可以针对结点设置相关读写等权限，保障数据安全性。

permissions 可以指定不同的权限范围及角色。

### ACL 命令行

- **getAcl 命令**：获取某个结点的 acl 权限信息。
- **setAcl 命令**：设置某个结点的 acl 权限信息。
- **addauth 命令**：输入认证授权信息，注册时输入明文密码，加密形式保存。

### ACL 构成

zookeeper 的 acl 通过 **[scheme ：id ：permissions]** 来构成权限列表。

- **scheme**：代表授权的策略，包括 world、auth、digest、ip、super 几种。
- **id**：代表授权的对象，值依赖于schema
- **permissions**：表示授予的权限（权限组合字符串），由 cdrwa 组成，其中每个字母代表支持不同权限， 创建权限 create(c)、删除权限 delete(d)、读权限 read(r)、写权限 write(w)、管理权限admin(a)

### ACL 特性

1. Zookeeper的权限控制是基于znode节点的，需要对每个节点设置权限。
2. 每个znode支持设置多种权限控制方案和多个权限。
3. 子节点不会继承父节点的权限。客户端无法访问某个节点，但是可以访问他的子节点

>scheme ：权限模式

|  模式  |                             描述                             |
| :----: | :----------------------------------------------------------: |
| world  | 这种模式方法的授权对象只有一个anyone，代表登录到服务器的所有客户端都能对该节点执行某种权限 |
|   ip   |           对连接的客户端使用IP地址认证方式进行认证           |
|  auth  |                 使用以添加认证的用户进行认证                 |
| digest |                    使用 用户:密码方式验证                    |

>id ：授权对象

代表授权的对象，值依赖于schema

>permission ：授予的权限

即当前用户对结点的权限，具体有：

|  类型  | ACL简写 |              描述              |
| :----: | :-----: | :----------------------------: |
|  read  |    r    | 读取节点及显示子节点列表的权限 |
| write  |    w    |       设置节点数据的权限       |
| create |    c    |        创建子节点的权限        |
| delete |    d    |        删除子节点的权限        |
| admin  |    a    |    设置该节点ACL权限的权限     |

### world授权模式

授权格式：

```css
setAcl path world:anyone:<acl>   //此模式下只能修改acl
```

我们可以通过`getAcl 结点路径`查看一个结点的访问权限，可以看到创建一个结点的默认访问权限是`world`授权，即任何人都拥有对该结点的所有权限

![image-20220510122646726](https://cdn.fengxianhub.top/resources-master/202205101226939.png)

例如我想设置某个结点只读，可以这样设置：`setAcl /node world:anyone:r`

![image-20220510123229426](https://cdn.fengxianhub.top/resources-master/202205101232522.png)

<hr/>

### ip授权模式

```css
setAcl path ip:<ip>:<acl> //用来限制访问者的ip地址
```

可以看到这里我设置了只能由指定ip有权限操作结点，由于不是指定的ip，所以提示无权限访问

![image-20220510124440546](https://cdn.fengxianhub.top/resources-master/202205101244665.png)

### auth模式

>此模式需要配合`addauth`命令
>
>- 第一步：先添加授权用户 addauth digest username:password
>- 第二步：设置该节点只有登录了该授权用户的客户端连接才能进行操作
>
>- 

```css
格式为:
addauth digest <user>:<password>  //添加认证用户
setAcl <path> auth:<user>:<acl>   //授权指定用户访问结点
```

![image-20220510125511262](https://cdn.fengxianhub.top/resources-master/202205101255348.png)

### digest授权模式

>digest授权模式其实和auth认证模式一样，区别在于auth认证会自动将你的密码加密存储，而digest需要手动加密密码再进行认证
>
>- 在Linux中调用系统库函数手动加密密码
>
>  格式为`echo -n username:password | openssl dgst -binary -sha1 | openssl base64`
>
>- 添加授权用户，这里的密码要用上一步生成的密文
>
>- 给结点赋授权用户（和auth一样）

![image-20220510132436158](https://cdn.fengxianhub.top/resources-master/202205101324282.png)

>当然可以设置多种acl，用`逗号`隔开就行

## 4. IDEA操作Zookeeper

官方文档：<a href="https://zookeeper.apache.org/doc/r3.8.0/apidocs/zookeeper-server/index.html">zookeeper3.8.0官方文档</a>

首先需要添加以下依赖，其实核心就只有`org.apache.zookeeper`这个依赖，这里我是为了打印日志才添加了一些其他的依赖

```xml
<properties>
    <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
    <lombok.version>1.18.22</lombok.version>
    <slf4j.version>1.7.36</slf4j.version>
    <junit.version>4.7</junit.version>
    <logback.version>1.2.3</logback.version>
    <zookeeper.version>3.7.0</zookeeper.version>
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
</dependencies>
```

>这里我的每一个例子都会将常用的方法都写到一个工具类中，这样我们以后就可以复用我们的工具类了

我们先新建一个工具类，我这里叫`ZkHelper`，也可以叫ZkUtils，主要为了封装一些常用的方法

```java
/**
 * zookeeper帮助类
 *
 * <p>创建一个新的帮助类{@code ZookeeperConnection}并添加一个方法{@code connect}
 * connect方法创建一个{@link ZooKeeper}对象，连接到Zookeeper集合，然后返回对象
 *
 * <p>这里通过{@link CountDownLatch}控制主线程，让其等待客户端线程连接之后再进行进行
 *
 * @date: 2022/5/7 15:08
 * @author: 梁峰源
 */
@Slf4j(topic = "ZkHelper")
public class ZkHelper {
    private static final String connectUri = "ip地址:端口号"; 
    private static final int sessionTimeout = 20000; //超时时间
    private static ZooKeeper zkClient = null;//zk的客户端，相当于zkCli.sh
    private static final CountDownLatch connectedSemaphore = new CountDownLatch(1);
    public ZkHelper() {
        try {
            zkClient = connect();
        } catch (IOException | InterruptedException ioException) {
            ioException.printStackTrace();
        }
    }
    public ZkHelper(Watcher watcher){
        try {
            zkClient = new ZooKeeper(connectUri,sessionTimeout,watcher);
        } catch (IOException ioException) {
            ioException.printStackTrace();
        }
    }
    /**
     * 建立一个{@link ZooKeeper}连接
     *
     * @return {@link ZooKeeper}连接
     * @throws IOException          IO异常
     * @throws InterruptedException 中断异常
     */
    private ZooKeeper connect() throws IOException, InterruptedException {
        zkClient = new ZooKeeper(connectUri, sessionTimeout, event -> {
            log.debug("ZooKeeper客户端初始化");
            //收到事件通知后的回调函数（用户的业务逻辑）
            log.debug("事件信息：事件类型{}--事件发生的结点的路径{}--服务器状态{}", event.getType(), event.getPath(), event.getState());
            if (event.getState() == Watcher.Event.KeeperState.SyncConnected) { //只有回调的状态值
                log.debug("客户端建立与服务器的连接");
                connectedSemaphore.countDown();//只有连接建立了才释放锁，让主线程继续运行
            }
        });
        connectedSemaphore.await(); //在主线程中堵塞，等待连接建立好
        log.debug("客户端主线程运行完");
        return zkClient;
    }
    
    /**
     * 关闭连接
     */
    public void close() throws InterruptedException {
        zkClient.close();
    }
    /**
     * 拿到连接uri
     */
    public String getConnectUri() {
        return connectUri;
    }
    /**
     * 拿到zookeeper连接
     *
     * @return zkClient
     */
    public ZooKeeper getZookeeper() {
        return zkClient;
    }
}
```

在上面的代码中已经有连接的方法了，这里有一点需要注意，就是第十七行代码中的`CountDownLatch`，是Java JUC中的一个类，主要作用是让一个或多个线程等待，一直等到其他线程中执行完成一组操作。有countDown方法和await方法，CountDownLatch在初始化时，需要指定用给定一个整数作为计数器。当调用countDown方法时，计数器会被减1；当调用await方法时，如果计数器大于0时，线程会被阻塞，一直到计数器被countDown方法减到0时，线程才会继续执行。计数器是无法重置的，当计数器被减到0时，调用await方法都会直接返回。

我们看一下Zookeeper的构造器：

```java
public ZooKeeper(String connectString, int sessionTimeout, Watcher watcher)
```

他会传入一个监视器，可以想到这里肯定不会只有主线程一个线程，如果我们不用`CountDownLatch`堵塞主线程的话，可能zookeeper还没有初始化话线程就已经执行完了，所以这里我们用CountDownLatch做通知，当`new ZooKeeper`执行完后再通知主线程继续往下执行

### 连接zookeeper

```java
@Slf4j(topic = "Test1_ZkHelper")
public class Test1_ZkHelper {
    public static void main(String[] args) {
        ZkHelper zkHelper = new ZkHelper();
        log.debug("客户端运行完毕，关闭连接成功");
    }
}
```

执行结果：

![image-20220510164138324](https://cdn.fengxianhub.top/resources-master/202205101641426.png)

### 创建结点

这里东西有点多，我们对应着Linux命令一个个实现

```css
格式：create [-s] [-e] [-c] [-t ttl] path [data] [acl]
解释: 
[-s] : 创建有序结点
[-e] : 创建临时结点
[-c] : 创建一个容器结点，容器结点主要用来容纳字结点，如果没有给其创建子结点，容器结点表现和持久化结点一样，如果给容器结点创建了子结点，后续又把子结点清空，容器结点也会被zookeeper删除。定时任务默认 60s 检查一次
[t ttl] : 创建一个TTL结点， -t 时间（单位毫秒）
path: 路径 ，因为没有中括号，所以是必须参数。
[data]：结点的数据，可选，如果不使用时，结点数据就为null
[acl] ：权限相关，后面文章会专门讲
```

我们先看一个zookeeper连接对象里面的`create`方法，一共有三个

```java
public String create(final String path,byte[] data,List<ACL> acl,CreateMode createMode)
public String create(final String path,byte[] data,List<ACL> acl,CreateMode createMode,Stat stat)
public String create(final String path,byte[] data,List<ACL> acl,CreateMode createMode,Stat stat,long ttl) 
```

前面有提过，`Acl`可以设置多个，用逗号隔开，在这里我们传入一个`List<ACL>`集合，表示我们的控制权限

我们来看一下`Acl`的构造函数：

```java
public ACL(int perms,Id id)
```

我们一个个来看具体的参数：

- int perms：其实就是`permission `，文件的权限，取值包括read、write、create、delete、admin（rwcda）这里用数字表示：

  ```css
  READ = 1  //二进制
  WRITE = 10
  CREATE = 100
  DELETE = 1000
  ADMIN = 10000
  READ | WRITE | CREATE | DELETE | ADMIN -> 运算结果为: 11111 即31，表示所有权限
  ```

- Id id：代表授权的对象，值依赖于schema

  ```java
  public Id(String sch,String id) //例如world模式下为 -> Id("world", "anyone")
  ```

综上所示，如果我们想要创造一个默认的结点（无序、持久、任何人都拥有所有权限），我们得这样写：

```java
Linux -> create /node
java中:
ArrayList<ACL> acls = new ArrayList<>(Collections.singletonList(new ACL(31, new Id("world", "anyone"))));
zooKeeper.create("/node","结点".getBytes(),acls, CreateMode.PERSISTENT);
```

看上去有一点点繁琐，所有zookeeper官方为我们封装了一个类`ZooDefs.Ids`，用来表示访问的权限，我们看一下Ids，是一个接口

```java
public interface Ids {
    ANYONE_ID_UNSAFE   //所有用户可以访问，其实就是  -> Id("world", "anyone")
    AUTH_IDS 		   //auth认证 -> new Id("auth", "")
    OPEN_ACL_UNSAFE    //开放所有权限，相当于 -> world:anyone:rwcda
    CREATOR_ALL_ACL    //给创建结点的用户赋予所有权限
    READ_ACL_UNSAFE    //任何人都只能读
}
```

有了这个类上面的代码我们可以这样写：

```java
zooKeeper.create(path, data.getBytes(), ZooDefs.Ids.OPEN_ACL_UNSAFE, CreateMode.PERSISTENT)
```

当然只封装了一些简单的模式，复杂模式还是需要我们自己手动创建`Acl`，但是懂的了原理就很简单了

这里简单封装一下ACL的四种模式：

```java
//world授权模式
ArrayList<ACL> acls = new ArrayList<>(Collections.singletonList(new ACL(31, new Id("world", "anyone"))));
//ip授权模式
ArrayList<ACL> acls = new ArrayList<>(Collections.singletonList(new ACL(31, new Id("ip", "127.0.0.1"))));
//auth模式
zooKeeper.addAuthInfo("digest","用户名:密码".getBytes()) //先添加
ArrayList<ACL> acls = new ArrayList<>(Collections.singletonList(new ACL(31, new Id("auth", ""))));
//digest模式
ArrayList<ACL> acls = new ArrayList<>(Collections.singletonList(new ACL(31, new Id("digest", "用户名:加密后的密码"))));
```



**CreateMode是一个枚举类型，用来表示创建结点的类型，包括有序、无序、持久、临时**

枚举对应取值有：

|          单词          | 中文含义 |
| :--------------------: | -------- |
| PERSISTENT(persistent) | 持久     |
|  EQUENTIAL(ephemeral)  | 临时     |
| SEQUENTIAL(sequential) | 有序     |

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

>讲了很多理论知识，现在开始实践一下

#### 创建无序持久结点

在工具类中添加：

```java
/**
 * 创建结点
 *
 * <p>先复习一下zk中的ACL情况：格式为 schema:id:permission<br/>
 * 对应含义为：<ul>
 * <li>schema可选:world    ip    digest    auth</li>
 * <li>id可选:    anyone   ip地址 用户名:密码 用户</li>
 * <li>permission权限列表: {@code cdrwa}</li></ul>
 *
 * <p>{@link ZooDefs.Ids#ANYONE_ID_UNSAFE}表示[world:anyone]<br/>
 * {@link ZooDefs.Ids#OPEN_ACL_UNSAFE}:ANYONE_ID_UNSAFE +
 * {@link org.apache.zookeeper.ZooDefs.Perms#ALL}[READ | WRITE | CREATE | DELETE | ADMIN]
 *
 * <p>授予权限详情为:<ul>
 * <li>READ = 1 << 0  任为1</li>
 * <li>WRITE = 1 << 1  为10</li>
 * <li>CREATE = 1 << 2  为100</li>
 * <li>DELETE = 1 << 3  为1000</li>
 * <li>ADMIN = 1 << 4  为10000</li>
 * <li>READ | WRITE | CREATE | DELETE | ADMIN -> 运算结果为: 11111 即31，表示所有权限</li></ul>
 *
 * @param path 结点路径
 * @param data 结点中存放的数据
 */
public String create(String path, byte[] data, ArrayList<ACL> aclList, CreateMode createMode){
    //先要拿到连接
    String resultPath = null;
    try {
        resultPath = zkClient.create(path, data, aclList, createMode);
        log.debug("结点[{}]创建成功", resultPath);
    } catch (KeeperException | InterruptedException e) {
        e.printStackTrace();
    }
    return resultPath;
}
/**
 * 创建结点并设置访问默认权限，即world:anyone:rwcda
 *
 * <p>权限设置详情{@link com.fx.utils.ZkHelper#create}
 *
 * @param path 结点路径
 * @param data 结点中存放的数据
 */
public void createAndSetDefaultAcl(String path, byte[] data) {
    create(path, data, ZooDefs.Ids.OPEN_ACL_UNSAFE, CreateMode.PERSISTENT);
}
```

测试一下：

```java
public class Test2_create {
    public static void main(String[] args) throws Exception {
        ZkHelper zkHelper = new ZkHelper();
        zkHelper.createAndSetDefaultAcl("/MyFirstZkNode","This is my first Zookeeper Node!".getBytes());
    }
}
```

![image-20220510182845332](https://cdn.fengxianhub.top/resources-master/202205101828520.png)

#### 常见有序持久结点

无序持久结点是默认的结点类型，其他的结点也可以封装方法，或者直接用最原始的`create`方法，通过`CreateMode`控制就好了

```java
public class Test2_create {
    public static void main(String[] args) throws Exception {
        ZkHelper zkHelper = new ZkHelper();
        zkHelper.create("/node","结点".getBytes(), ZooDefs.Ids.OPEN_ACL_UNSAFE,CreateMode.PERSISTENT_SEQUENTIAL);
    }
}
```

#### 创建auth模式结点

在ZkHelper中添加方法

```java
/**
 * 添加认证信息
 *
 * @param scheme 例如:"digest"
 * @param auth 例如:"用户名:密码"
 */
public void addAuthInfo(String scheme, byte[] auth) {
    zkClient.addAuthInfo(scheme,auth);
}
```

测试：

```java
public class Test2_create {
    public static void main(String[] args) throws Exception {
        ZkHelper zkHelper = new ZkHelper();
        //添加认证信息
        zkHelper.addAuthInfo("digest","lfy:a".getBytes());
        //注意要选CREATOR_ALL_ACL，只有创建者才有权限，创建了有序持久结点
        zkHelper.create("/node","结点".getBytes(), ZooDefs.Ids.CREATOR_ALL_ACL,CreateMode.PERSISTENT_SEQUENTIAL);
    }
}
```

结果：

![image-20220510185713441](https://cdn.fengxianhub.top/resources-master/202205101857547.png)

>其他类型结点可以执行封装工具类

### 查看信息

查看的命令为：

```css
get [-s] [-w] path //查看结点存储的值及其结点状态
stat [-w] path //查看结点状态
ls [-s] [-w] [-R] path //查看某一结点下的子结点
```

这里封装的方法就有点多了，先封装get和stat方法，在`ZkHelper`添加以下方法

```java
/**
 * 获取指定结点的值
 *
 * @param path 结点路径
 * @param watcher 监听器
 * @return 返回byte[]类型的结点信息
 */
public byte[] getData(String path) {
    byte[] data = null;
    try {
        Stat stat;
        if ((stat = zkClient.exists(path, false)) != null) {
            data = zkClient.getData(path, false, stat);
        } else {
            log.error("znode:{}不存在",path);
        }
    } catch (KeeperException | InterruptedException e) {
        throw new RuntimeException("取到znode：" + path + "出现问题！！", e);
    }
    return data;
}

/**
 * 获取指定结点的值
 *
 * @param path 结点路径
 * @return 返回结点信息
 */
public String get(String path) {
    String data = null;
    try {
        Stat stat;
        if ((stat = zkClient.exists(path, false)) != null) {
            byte[] bt = zkClient.getData(path, false, stat);
            if(bt != null){
                data = new String(bt,StandardCharsets.UTF_8);
            }else {
                log.info("该结点{}中没有数据",path);
            }
        } else {
            log.error("znode:{}不存在",path);
        }
    } catch (KeeperException | InterruptedException e) {
        throw new RuntimeException("取到znode：" + path + "出现问题！！", e);
    }
    return data;
}

/**
 * 根据结点路径返回Stat对象
 */
public Stat getStat(String path){
    Stat stat = null;
    try {
        stat = zkClient.exists(path, false);
    } catch (KeeperException | InterruptedException e) {
        e.printStackTrace();
    }
    if (stat == null) {
        throw new RuntimeException("node路径[" + path + "]不存在");
    }
    return stat;
}
/**
 * 获取state格式化的信息
 */
public String getStatInfo(String path){
    Stat stat;
    stat = getStat(path);
    assert stat != null;
    return printZnodeInfo(stat);
}

/**
 * 格式化{@link Stat} 信息
 *
 * @param stat {@link Stat}
 * @return 返回格式化信息
 */
public static String printZnodeInfo(Stat stat) {
    SimpleDateFormat df = new SimpleDateFormat("yyyy年MM月dd日 HH:mm:ss");
    StringBuilder sb = new StringBuilder();
    sb.append("\n*******************************\n");
    sb.append("创建znode的事务id czxid:").append(stat.getCzxid()).append("\n");
    //格式化时间
    sb.append("创建znode的时间 ctime:").append(df.format(stat.getCtime())).append("\n");
    sb.append("更新znode的事务id mzxid:").append(stat.getMzxid()).append("\n");
    sb.append("更新znode的时间 mtime:").append(df.format(stat.getMtime())).append("\n");
    sb.append("更新或删除本节点或子节点的事务id pzxid:").append(stat.getPzxid()).append("\n");
    sb.append("子节点数据更新次数 cversion:").append(stat.getCversion()).append("\n");
    sb.append("本节点数据更新次数 dataVersion:").append(stat.getVersion()).append("\n");
    sb.append("节点ACL(授权信息)的更新次数 aclVersion:").append(stat.getAversion()).append("\n");
    if (stat.getEphemeralOwner() == 0) {
        sb.append("本节点为持久节点\n");
    } else {
        sb.append("本节点为临时节点,创建客户端id为:").append(stat.getEphemeralOwner()).append("\n");
    }
    sb.append("数据长度为:").append(stat.getDataLength()).append("字节\n");
    sb.append("子节点个数:").append(stat.getNumChildren()).append("\n");
    sb.append("\n*******************************\n");
    return sb.toString();
}
```

测试：

```java
@Slf4j(topic = "Test3_Stat")
public class Test3_Stat {
    public static void main(String[] args) {
        ZkHelper zkHelper = new ZkHelper();
        String str1 = zkHelper.get("/MyFirstZkNode");
        log.debug(str1);
        log.debug("==================================================");
        String statInfo = zkHelper.getStatInfo("/MyFirstZkNode");
        log.debug(statInfo);
    }
}
```

![image-20220510211155076](https://cdn.fengxianhub.top/resources-master/202205102111303.png)

接下来是`ls [-s] [-w] [-R] path`

```java
/**
 * 获得子结点路径，只会显示一层
 */
public List<String> getChildren(String path){
    List<String> childrenList = null;
    try {
        childrenList = zkClient.getChildren(path, false);
    } catch (KeeperException | InterruptedException e) {
        e.printStackTrace();
    }
    return childrenList;
}

/**
 * 将当前路径及其子路径呈树状结构递归打印出来
 *
 * <p>打印结果示例：
 *
 * <pre>
 * /
 * ----/node
 * --------/node/node2
 * --------/node/node3
 * --------/node/node1
 * ------------/node/node1/node1_1
 * ----/zookeeper
 * --------/zookeeper/config
 * --------/zookeeper/quota
 * ----/test
 * ----/MyFirstZkNode
 * </pre>
 *
 * @param path  当前结点路径
 * @param level 表示当前路径在第几层,默认第0层
 */
public void showTree(String path, int level) {
    List<String> childList;//子路径
    //每递归一级打印一段占位符
    for (int i = 0; i < level; i++) {
        System.out.print("----");
    }
    //打印已经有的路径
    System.out.println(path);
    //递归打印树状结构
    childList = getChildren(path);
    if(!childList.isEmpty()){
        childList.forEach(sonPath -> {
            if(level == 0){
                //第0层是/, / + xxx
                showTree(path  + sonPath, level + 1);
            }else {
                //其他层为 xxx
                showTree(path + "/" + sonPath, level + 1);
            }
        });
    }
}
```

测试：

```java
public class Test4_showTree {
    public static void main(String[] args) {
        ZkHelper zkHelper = new ZkHelper();
        List<String> children = zkHelper.getChildren("/");
        children.forEach(System.out::println);
        zkHelper.showTree("/",0);
    }
}
```

结果：

![image-20220510195140267](https://cdn.fengxianhub.top/resources-master/202205101951390.png)

其他方法可以执行封装和测试

### 删除结点

```java
/**
 * 删除结点，如果包含 / ,则递归删除
 *
 * @param path 结点
 * @return true 删除键结点成功  false表示结点不存在
 */
public boolean delete(String path) {
    try {
        Stat stat;
        if ((stat = zkClient.exists(path, true)) != null) {
            List<String> subPaths = zkClient.getChildren(path, false);
            if (subPaths.isEmpty()) {
                zkClient.delete(path, stat.getVersion());
                return true;
            } else {
                for (String subPath : subPaths) {
                    delete(path + "/" + subPath);
                }
            }
        }
    } catch (InterruptedException | KeeperException e) {
        throw new RuntimeException("删除znode：" + path + "出现问题！！", e);
    }
    return false;
}
```



更新结点：

```java
/**
 * 更新指定结点的值
 *
 * @param path 结点路径
 * @param data 新的值
 */
public boolean update(String path, String data) {
    //更新源数据最新版本的值，不设置监视器
    try {
        Stat stat;
        if ((stat = zkClient.exists(path, true)) != null) {
            zkClient.setData(path, data.getBytes(), stat.getVersion());
            return true;
        }
    } catch (KeeperException | InterruptedException e) {
        throw new RuntimeException("修改znode：" + path + "出现问题！！", e);
    }
    return false;
}
```

### 设置监视器

>监视器是zookeeper中非常重要的组件，可以说zookeeper所有的特性都离不开监视器！

我们观察API可以发现很多地方都可以传入监视器`Watcher`，但是监视的内容不太一样

```css
stat path[watch]: 对当前结点更新数据起作用
get path[watch]: 对当前结点更新数据起作用
ls path[watch]: 对创建、删除子结点事件起作用
```

这里简单演示一下，在`ZkHelper`中添加

```java
/**
 * 获取结点信息并绑定监听器
 *
 * <p>事件绑定类型：<ul>
 *
 * <li>stat path[watch]: 对当前结点更新数据起作用</li>
 * <li>get path[watch]: 对当前结点更新数据起作用</li>
 * <li>ls path[watch]: 对创建、删除子结点事件起作用</li>
 * <li>ls2 path[watch]: 对创建、删除子结点事件起作用</li></ul>
 *
 * @param path    要访问结点路径
 * @param watcher 监听器
 */
public byte[] getAndSetWatch(String path, Watcher watcher) {
    Stat stat = getStat(path);
    byte[] data = null;
    try {
        data = zkClient.getData(path, watcher, stat);
    } catch (KeeperException | InterruptedException e) {
        e.printStackTrace();
    }
    return data;
}
```

测试

```java
@Slf4j(topic = "Test8_watch")
public class Test8_watch implements Watcher {
    private static final String path = "/node";
    private static final CountDownLatch countDownLatch = new CountDownLatch(1);
    private static ZkHelper zkHelper;

    public static void main(String[] args) throws InterruptedException {
        Test8_watch myWatcher = new Test8_watch();
        zkHelper = new ZkHelper();
        byte[] andSetWatch = zkHelper.getAndSetWatch(path, myWatcher);
        countDownLatch.await();
    }

    @Override
    public void process(WatchedEvent event) {
        //监听结点改变事件
        if (event.getType() == Event.EventType.NodeDataChanged) {
            Stat stat = new Stat();
            byte[] data = null;
            data = zkHelper.getData(path);
            assert data != null;
            String dataStr = new String(data, StandardCharsets.UTF_8);
            log.debug("监听此节点[{}]的新数据[{}]", path, dataStr);
            log.debug("当前结点stat新信息为：\n{}", ZkHelper.printZnodeInfo(stat));
            countDownLatch.countDown();
        } else if (event.getType() == Event.EventType.NodeChildrenChanged) {
            //子结点发生改变
            log.debug("子结点发生改变，类型为[{}]", event.getType());
        }
    }
}

```

结果（可以看到只对更新结点起作用）：

![1](https://cdn.fengxianhub.top/resources-master/202205102021140.gif)



























 

