

## 一、概念

- ZooKeeper 是 Apache 软件基金会的一个软件项目，它为大型分布式计算提供开源的分布式配置服务、同步服务和命名注册。
- ZooKeeper 的架构通过冗余服务实现高可用性。
- Zookeeper 的设计目标是将那些复杂且容易出错的分布式一致性服务封装起来，构成一个高效可靠的原语集，并以一系列简单易用的接口提供给用户使用。
- - 一个典型的分布式数据一致性的解决方案，分布式应用程序可以基于它实现诸如数据发布/订阅、负载均衡、命名服务、分布式协调/通知、集群管理、Master 选举、分布式锁和分布式队列等功能。

<img src="https://oss.zhulinz.top//img/1651889273170-fe9f2731-4c71-4768-9f9f-2cb9d8ea07b1.png" alt="image.png" width="50%" />

### CAP理论

  CAP 理论指出对于一个分布式计算系统来说，不可能同时满足以下三点：

- **一致性：**在分布式环境中，一致性是指数据在多个副本之间是否能够保持一致的特性，等同于所有节点访问同一份最新的数据副本。在一致性的需求下，当一个系统在数据一致的状态下执行更新操作后，应该保证系统的数据仍然处于一致的状态。
- **可用性：**每次请求都能获取到正确的响应，但是不保证获取的数据为最新数据。
- **分区容错性**：分布式系统在遇到任何网络分区故障的时候，仍然需要能够保证对外提供满足一致性和可用性的服务，除非是整个网络环境都发生了故障。

  一个分布式系统**最多只能同时**满足**一致性（Consistency）、可用性（Availability）和分区容错性（Partition tolerance）这三项中的两项**。

  在这三个基本需求中，最多只能同时满足其中的两项，P 是必须的，因此只能在 CP 和 AP 中选择，**zookeeper 保证的是 CP（一致性和分区容错性），对比 SpringCloud 系统中的注册中心 eureka 实现的是 AP（可用性和分区容错性）**。

<img src="https://oss.zhulinz.top//img/1651891779818-733bda0d-01cd-450d-9fb9-f507bbe48c5c.png" alt="image.png" width="40%" />

### Base理论

  BASE 是 Basically Available(基本可用)、Soft-state(软状态) 和 Eventually Consistent(最终一致性) 三个短语的缩写。

- **基本可用：在分布式系统出现故障，允许损失部分可用性（服务降级、页面降级）。
- **软状态：允许分布式系统出现中间状态。而且中间状态不影响系统的可用性。这里的中间状态是指不同的 data replication（数据备份节点）之间的数据更新可以出现延时的最终一致性。
- **最终一致性：**data replications 经过一段时间达到一致性。

  BASE 理论是对 CAP 中的一致性和可用性进行一个权衡的结果，理论的核心思想就是：**我们无法做到强一致，但每个应用都可以根据自身的业务特点，采用适当的方式来使系统达到最终一致性**。

### ZAB协议

  ZAB协议是 `ZooKeeper Atomic Broadcast` 的简称，全名叫**原子广播协议**，其核心作用就是**保证分布式系统的数据一致性**，**保证了分布式集群的最终一致性**。

  所有的事务请求都会由一台叫做 `leader` 的服务器来协调处理，集群中余下的服务器则称之为 `Follower` 或 `Observer`，leader 会将客户端的事务请求转换成一个事务 Proposal（提案），并将该提案分发给集群中所有的 Follower 服务器，只有当集群中过半数的服务器对该提案投票通过后，才能执行接下来的 Commit 操作。

  ZAB 协议算法两个核心功能点是**崩溃恢复**和**原子广播**协议。

### 什么是崩溃恢复？

  当集群中的 `leader` 节点宕机，失去了与其它 `Follower` 的联系，那么就会进入崩溃恢复模式。在崩溃恢复过程中，所有的 Follower 会通过投票来决定是否产生新的 leader（关于 leader 选举流程请看第三小节）。崩溃恢复后，就会进入消息广播模式，实现每台节点的数据同步。

  在以下三种情况，ZAB 都会进入 崩溃恢复模式：

- 当 Zookeeper 在启动过程中。
- 当 Leader 服务器出现网络中断崩溃退出与重启等异常情况。
- 当有新 Server 加入到集群中且集群处于正常状态（广播模式），新 Server 会与 leader 进行数据同步，然后进入消息广播模式。

### 什么是原子广播（消息广播）？

  ZAB 协议的**原子广播**也称**消息广播**。leader 服务器针对客户端的请求为其生成对应的事务 Proposal，并将该事务发给集群中所有的节点，然后收集各个节点对该事务的选票，最后收到半数节点的选票，就进行事务提交。具体如下图：

<img src="https://oss.zhulinz.top//img/image.png" alt="image" width="40%"/>

### 广播流程如何保证消息广播过程中消息接收与发送的顺序性？

  首先，消息广播是基于具有 FIFO 特性的 TCP 协议来进行网络通信的，因此可以较好的保证顺序性；<br>其次，在消息广播的过程中，Leader 节点会针对客户端的事务请求生成对应的 Proposal，在广播前会首先为这个事务生成一个全局单调递增的唯一事务 ID ，即 ZXID。ZAB 协议会根据 事务 ID 的先后顺序，将每个事务进行排序与处理。

### 架构与进程职责

  Zookeeper 集群因为有过半机制，所以其结点个数一般为奇数，集群中主要有 Client、Leader、Follower 以及 Observer 几种角色。其基本架构图如下：

<img src="https://oss.zhulinz.top//img/1651889625610-04459520-14e1-413b-8014-1d33820abbde.png" alt="image.png" width="40%" />

**ZK 架构Client：**

- **Client**：就是一个请求的发起方，请求的对象可以是上图中 Zookeeper 的任意角色。
- **Leader**：Leader 负责更新系统的状态，负责进行投票的发起和决议。还有处理事务请求，从图中可以看出，Client 端发起的请求，最终都是由其他角色转发给 Leader 来处理。
- **Follower**：接收并处理客户端读请求，并返回客户端结果；将客户端写请求转发给 Leader 处理；同步 Leader 的状态；在选举的过程中参与投票。
- **Observer**：接收并处理客户端读请求，并返回客户端结果；将客户端写请求转发给 Leader 处理；同步 Leader 的状态；但是在选举的过程中不参与投票。
- 为什么要有 Observer 角色？从上图可知，Observer 只接受客户端的读请求，不参加写请求，因此 Observer 在不影响写性能的情况下提升集群的读性能。

### 数据模型

<img src="https://oss.zhulinz.top//img/1651889702250-13d67f05-eab4-4324-91df-82cfd95a255b.png" alt="image.png" width="40%" />

  Zookeeper 路径如上图所示，是 ZooKeeper 的数据节点的示意图，Zookeeper 采用的是树形层次结构，其中树中的每个节点称之为 Znode。Znode 可以作为路径标识的一部分，并且使用斜杠分割，同时维护着**数据**、**元信息**、**ACL**、**时间戳**等数据结构。每个 Znode 由 3 部分组成:

- **stat 状态信息：**描述该 Znode 的**版本, 权限**等信息。Znode 中存储的数据可以有多个版本，也就是一个访问路径中可以存储多份数据。每一个节点都拥有自己的 ACL(访问控制列表)，这个列表规定了用户的权限，即限定了特定用户对目标节点可以执行的操作。Stat 对象状态属性如下表所示：

	<img src="https://oss.zhulinz.top//img/1651889712992-b08bec95-00ca-4a3c-9156-1faee0f3c64e.png" alt="image.png" width="50%" />

- **data：**与该 Znode 关联的数据(配置文件信息、状态信息、汇集位置)，数据大小至多 1M。
- **children**：每个 Znode 下可以有子节点，需要注意的是 EPHEMERAL 类型的目录节点没有子节点。

## 二、Session机制

### Session基本原理

  在 ZooKeeper 中，客户端通过与服务器建立一个**基于TCP 长连接**进行通信，服务器的服务端口默认为 2181。自从 Session 建立开始，该生命周期也开始了。

**其作用概括如下：**

- ZK Server 执行任何请求之前，都需要 Client 与 Server 先建立 Session。
- Client 提交给 Server 的任何请求，都必须关联在 Session 上，命令根据 Session 的连接顺序来执行。
- 临时节点的生命周期，Session 终止时，关联在 Session 上的临时数据节点都会自动消失。
- Watcher 通知机制也要基于 Session 来实现。

### Session的状态

- **connecting**：连接中，session 一旦建立，状态就是 connecting 状态，时间很短。
- **connected**：已连接，连接成功之后的状态。
- **closed**：已关闭，发生在 session 过期，一般由于网络故障客户端重连失败，服务器宕机或者客户端主动断开。

### Session 连接中断的处理流程

- Client 在未收到任何消息的情况下，每 t/3（t 为会话超时时间）向 server 发送一次心跳。
- Server 若 t 秒后仍然没有收到心跳则判定会话超时。
- Client 经过 2t/3 后，会尝试连接其他 Server 节点。
- Client 尝试连接其他 Server 时，要保证新的 Server 能看到的最新事务比之前的连接的 Server 要新；若不符合条件，则尝试连接到另一个 Server。

### 会话超时管理（分桶策略+会话激活）

  zookeeper 的 leader 服务器再运行期间定时进行会话超时检查，时间间隔是 ExpirationInterval，单位是毫秒，默认值是 tickTime，每隔 tickTime 进行一次会话超时检查。

<img src="https://oss.zhulinz.top//img/1651892173357-38a134ea-f394-4b9f-b547-65e03cd1aee8.png" alt="image.png" width="50%" />

- $$
	- ExpirationTime 的计算方式:
	- ExpirationTime = CurrentTime + SessionTimeout; 
	- ExpirationTime = (ExpirationTime / ExpirationInterval + 1) * ExpirationInterval;
	$$

	

  在 zookeeper 运行过程中，客户端会在**会话超时过期范围内**向服务器发送请求（包括读和写）或者 ping 请求，俗称**心跳检测完成会话激活**，从而来保持会话的有效性。

会话激活流程：

<img src="https://oss.zhulinz.top//img/1651892215013-fad55b39-9810-4092-9fd7-fd10860f6dbb.png" alt="image.png" width="30%" />

激活后进行迁移会话的过程，然后开始新一轮：

<img src="https://oss.zhulinz.top//img/1651892225707-9efbd3a0-0ffb-48fc-a548-1ec7f7bf755e.png" alt="image.png" width="40%" />

## 三、节点类型

  ZooKeeper 中的节点有三种，分别为`临时节点`、`永久节点`以及`顺序节点`。节点的类型在创建时即被确定，并且不能改变，通过组合可以分为以下四类：

- **永久节点（persistent）：** 该节点的生命周期不依赖于会话，被创建后会一值存在，并且只有在客户端显示执行删除操作的时候，它们才能被删除。
- **永久有序节点：** 创建永久有序节点时，父节点会维护一份时序，用于记录子节点创建的先后顺序。在创建节点过程中，ZK 会自动为给定节点名加上一个数字后缀，作为新的节点名。这个数字后缀的范围是整型的最大值。
- **临时节点（ephemeral）：** 该节点的生命周期依赖于创建它们的会话。一旦会话(Session)结束，临时节点将被自动删除，当然可以也可以手动删除。虽然每个临时的 Znode 都会绑定到一个客户端会话，但他们对所有的客户端还是可见的。另外，ZooKeeper 的临时节点不允许拥有子节点。
- **临时有序节点：** 和永久有序节点类似，就不赘述了，临时有序节点可以用来实现分布式锁，下面会有分布式锁的详细说明。

## 四、选举

  zookeeper 的 leader 选举存在两个阶段，一个是**服务器启动时 leader 选举**，另一个是**运行过程中 leader 服务器宕机**。在分析选举原理前，先介绍几个重要的参数。

- 服务器 ID(myid)：编号越大在选举算法中权重越大
- 事务 ID(zxid)：值越大说明数据越新，权重越大
- 逻辑时钟(epoch-logicalclock)：同一轮投票过程中的逻辑时钟值是相同的，每投完一次值会增加

### 选举状态

- LOOKING：处于无主或寻找 Leader 状态，或者 Leader 选举状态。**竞选状态**
- FOLLOWING：表明当前节点为 Follower 角色，跟随者状态，可直接参与投票。**随从状态**
- LEADING：表明当前节点为 Leader 角色，**领导者状态**
- OBSERVING：表明当前节点为 Observer 角色，**观察者状态**，不参与投票，只处理客户端读请求

### 票据结构

  ZooKeeper 中的票据结构是由 vote 进行封装的，内容包含以下两部分：

- myid：服务节点自身的 id，在部署时由配置文件指定，从 1 开始累加。
- zxid：ZAB 协议中的事务编号是一个 64 位的数字。其中低 32 位是一个单调递增的计数器，每产生一个新的事务 Proposal 时，该计数器加1；高 32 位代表了 leader 周期的 epoch 编号，每次筛选出新的 leader ，epoch 会累加 1。
- 注意：ZooKeeper 把 epoch 和事务 id 合在一起，每次 epoch 变化，都将低 32 位的序号重置，这样做是为了方便对比出最新的数据，保证了 zxid 的全局递增性。

### Leader 选举

  选举无非就是一个投票、处理选票以及得出结果（领导走马上任）这么一个过程，现实生活中也比较常见。在 ZooKeeper 中，Leader 的选举又分为 2 类：整个集群刚启动时的选举和运行过程中 Leader 宕机后的选举。简单选举流程如下图所示：

<img src="https://oss.zhulinz.top//img/1651889766540-ef70aadc-0382-4344-81e2-265075d29a55.png" alt="image.png" width="50%" />

  集群启动时的选举可以分为三个步骤：**投票**、**唱票**以及**得出结果**。

  当集群在启动初始化阶段，只有一台服务器启动，因为存在过半机制，无法完成leader 选举，只有当第二台服务器启动后，两台服务器都试图寻找一位 leader，此时才进入 leader 选举流程：

- （1）每台 server 发出一个投票，由于是初始情况，server1 和 server2 都将自己作为 leader 服务器进行投票，每次投票包含所推举的服务器myid、zxid、epoch，使用（myid，zxid）表示，此时 server1 投票为（1,0），server2 投票为（2,0），然后将各自投票发送给集群中其他机器。
- （2）接收来自各个服务器的投票。集群中的每个服务器收到投票后，首先判断该投票的有效性，如检查是否是本轮投票（epoch）、是否来自 LOOKING 状态的服务器。
- （3）分别处理投票。针对每一次投票，服务器都需要将其他服务器的投票和自己的投票进行对比，对比规则如下：

- - a. 优先比较 epoch
	- b. 检查 zxid，zxid 比较大的服务器优先作为 leader
	- c. 如果 zxid 相同，那么就比较 myid，myid 较大的服务器作为 leader 服务器

- （4）统计投票。每次投票后，服务器统计投票信息，判断是都有过半机器接收到相同的投票信息。server1、server2 都统计出集群中有两台机器接受了（2,0）的投票信息，此时已经选出了 server2 为 leader 节点。
- （5）改变服务器状态。一旦确定了 leader，每个服务器响应更新自己的状态，如果是 follower，那么就变更为 FOLLOWING，如果是 Leader，变更为 LEADING。此时 server3继续启动，直接加入变更自己为 FOLLOWING。

### ZooKeeper Wacter 机制

  zookeeper 的 watcher 机制，可以分为四个过程：

- 客户端注册 watcher。
- 服务端处理 watcher。
- 服务端触发 watcher 事件。
- 客户端回调 watcher。

  在 ZooKeeper 中，引入了 watcher 机制，即事件监听，它允许客户端向服务端注册一个 Watcher 监听，当服务端一些事件发生改变后（如 exists()、getChildren() 及 getData()），都会触发 Watcher ，该服务端会向指定的客户端发送一个事件通知，注意 Watcher 只能被触发一次。

  当节点发生增、删、改都会触发 Watcher 所对应的操作。其过程如下图所示：

<img src="https://oss.zhulinz.top//img/1651889779709-f0448093-e1a0-4757-92cc-13049cb80325.png" alt="image.png" width="40%"/>

## 五、应用场景的实现

  结合实际的使用场景来融会贯通。关于 集群管理与 Master 高可用，ZooKeeper 的以下两个特性是实现 HA 的关键。

- **临时有序节点：**每个 Master 的备选节点都会创建一个临时有序节点，集群会选择序号最小的节点为 Master，若 session 断开，节点删除。
- **Watcher 机制：**集群会在 master 的节点上注册一个 Watcher，那么如果 master 节点发生变化，会重新选择序号最小的节点

### 分布式锁

  分布式锁，主要得益于Zookeeper保证了数据的强一致性。用户可以完全相信每时每刻，zk集群中任意节点上的相同的znode的数据是一定相同的。锁服务可以分为两类：

- **保持独占：**就是所有试图来获取这个锁（znode)的客户端，最终只有一个可以成功获得这把锁。通常的做法是把zk上的一个znode看作是一把锁，通过create znode的方式来实现。所有客户端都去创建 /distribute_lock 节点，最终成功创建的那个客户端也即拥有了这把锁。
- **控制时序：**
  1. 客户端在/locks根节点下面创建**临时有序节点**（这个可以通过节点的属性控制：CreateMode.EPHEMERAL_SEQUENTIAL来指 定）。
  2. client调用getChildren("/root/lock_",watch)来获取所有已经创建的子节点，并同时在这个节点上注册子节点变更通知的Watcher。
  3. 客户端获取到所有子节点Path后，如果发现自己在步骤1中创建的节点是所有节点中最小的(排序），那么就认为这个客户端获得了锁。
  4. 如果在步骤3中，发现不是最小的，那么等待，直到下次子节点变更通知的时候，在进行子节点的获取，判断是否获取到锁。
  5. 释放锁也比较容易，就是删除自己创建的那个节点即可


#### 自定义实现分布式锁流程

1. client调用create()方法创建“/root/lock_”节点，注意节点类型是**EPHEMERAL_SEQUENTIAL（临时有序节点）**

2. client调用getChildren("/root/lock_",false)来获取所有已经创建的子节点，这里并不注册任何Watcher

3. 客户端获取到所有子节点Path后（ getChildren(),排序，看自己是否为最小节点, )，如果发现自己在步骤1中创建的节点是所有节点中最小的，那么就认为这个客户端获得了锁( 操作redis中的数据)

4. 如果在步骤3中，发现不是最小的，那么找到比自己小的那个节点，然后对其调用exist()方法注册事件监听

5. 之后一旦这个被关注的节点移除，客户端会收到相应的通知，这个时候客户端需要再次调用getChildren("/root/lock_",false)来确保自己是最小的节点，然后进入步骤3

   ```java
   public class MyDistruvtuedLock {
       private final ZooKeeper zk;
       private final int sessionTimeout = 20000;
       /** 根节点 */
       private final String LOCK = "/locks";
       /** zk连接等待 */
       private CountDownLatch connectLatch = new CountDownLatch(1);
       /** 等待节点删除 */
       private CountDownLatch waitLatch = new CountDownLatch(1);
       /** 监听上一个节点的路径 */
       private String waitPath;
       /** 当前节点 */
       private String currentNode;
   
       /**
        * 构造方法：创建zk的联接
        * @param connectionUrl
        * @throws IOException
        */
       public MyDistruvtuedLock(String connectionUrl) throws Exception {
           zk = new ZooKeeper(connectionUrl, sessionTimeout, event -> {
               //连接上zk，释放连接等待锁
               if (event.getState() == Watcher.Event.KeeperState.SyncConnected) {
                   //计数  -1
                   connectLatch.countDown();
               }
               if (event.getType() == Watcher.Event.EventType.NodeDeleted && event.getPath().equals(waitPath)) {
                   //释放锁
                   waitLatch.countDown();
               }
           });
           //等待zk正常连接后，程序往下执行  在计数器为0之前一直等待
           connectLatch.await();
           //判断根节点是否存在  不存在则创建  false-不监听
           Stat stat = zk.exists(LOCK, false);
           if (stat == null) {
               //创建一个根节点（持久节点）
               zk.create(LOCK, "locks".getBytes(), ZooDefs.Ids.OPEN_ACL_UNSAFE, CreateMode.PERSISTENT);
           }
       }
   
       /**
        * 记录哪个节点    currentNode; 加入锁,
        */
       public void lock() {
           try {
               //1.创建临时有序的节点到  /locks下.
               currentNode = zk.create(LOCK + "/seq-", null, ZooDefs.Ids.OPEN_ACL_UNSAFE,CreateMode.EPHEMERAL_SEQUENTIAL);
               //2. 获取  /locks下所有的子节点列表 /
               List<String> children = zk.getChildren(LOCK, false);
               //3.如果children只有一个值，说明就是自己，直接获取锁；如果有多个，需要判断谁最小
               if (children.size() != 1) {
                   //排序
                   Collections.sort(children);
                   //获取节点名称  currentNode
                   String thisNode = currentNode.substring((LOCK + "/").length());
                   //通过seq-00000000获取该节点在children集合的位置
                   int index = children.indexOf(thisNode);
                   if (index != 0) {
                       //需要监听前一个节点的变化  不监听父节点的子节点列表变化的原因 在于防止羊群效应
                       waitPath = LOCK + "/" + children.get(index - 1);
                       zk.getData(waitPath, true, new Stat());
                       //当前的线程阻塞  等待监听
                       waitLatch.await();
                   }
               }
               return;
           } catch (KeeperException e) {
               throw new RuntimeException(e);
           } catch (InterruptedException e) {
               throw new RuntimeException(e);
           }
       }
   
       /**
        * 解锁
        */
       public void unlock() {
           try {
               //删除当前获取到锁的节点
               zk.delete(currentNode, -1);
           } catch (InterruptedException e) {
               throw new RuntimeException(e);
           } catch (KeeperException e) {
               throw new RuntimeException(e);
           }
       }
   }
   ```

   

### 配置管理

  zookeeper的内存数据模型是树结构，在内存中存储了整个树的内容，既然是树结构对应单个树节点信息包括节点路径、节点数据、ACL信息等。zookeeper对节点提供了watch监听功能，当我们使用zookeeper客户端操作内存中节点时，就会实时获取监听的事件如：新增节点、删除节点、更新节点，以及节点变化后的值。在分布式服务中，我们把配置信息存储到zookeeper节点中，为每个应用服务添加zookeeper节点监听后，一旦相关配置属性有变化，所有用用服务节点都能及时监听到配置属性的变化事件以及变化后的值。

**数据中心**

```java
public class DataSources {
    /**
     * zk服务器地址
     */
    public final static String ZK_URL = "zhulinz.top:2184";

    /**
     * 数据库相关配置
     */
    public final static String DB_URL = "jdbc:mysql://zhulinz.top:3306/bookshop?serverTimezone=UTC&useSSL=false";
    public final static String DB_USERNAME = "zhulin";
    public final static String DB_PASSWORD = "zhulin0804";

    /**
     * zk服务器存储数据节点路劲
     */
    public final static String ROOT = "/zbookmysql";
    public final static String URL_NODE = ROOT + "/url";
    public final static String PASSWORD_NODE = ROOT + "/password";
    public final static String USERNAME_NODE = ROOT + "/username";

    /**
     * 加密规则
     */
    public final static String AUTH_TYPE = "digest";
    public final static String AUTH_PASSWORD = "zhulin:123456";
}
```

**zk客户端**

```java
@Component
@Slf4j
public class CreateInZk {
    private ZooKeeper zk = null;

    @PostConstruct
    public void zkInit() throws IOException, InterruptedException, KeeperException {
        if (zk == null) {
            //连接zk服务器
            zk = new ZooKeeper(DataSources.ZK_URL, 10000, event -> {
                log.warn("事件更新-----" + event.getType());
            });
        }
        while (zk.getState() != ZooKeeper.States.CONNECTED) {
            Thread.sleep(3000);
        }
        //添加加密规则
        zk.addAuthInfo(DataSources.AUTH_TYPE, DataSources.AUTH_PASSWORD.getBytes());

        //初始化节点信息
        if (zk.exists(DataSources.ROOT, true) == null) {
            //创建节点
            if (existsNode(DataSources.ROOT)) {
                createNode(DataSources.ROOT, "zBook项目数据库配置".getBytes());
            }
            if (existsNode(DataSources.URL_NODE)) {
                createNode(DataSources.URL_NODE, DataSources.DB_URL.getBytes());
            }
            if (existsNode(DataSources.USERNAME_NODE)) {
                createNode(DataSources.USERNAME_NODE, DataSources.DB_USERNAME.getBytes());
            }
            if (existsNode(DataSources.PASSWORD_NODE)) {
                createNode(DataSources.PASSWORD_NODE, DataSources.DB_PASSWORD.getBytes());
            }
        }
        //关闭zk连接
        zk.close();
    }

    /**
     * 判断节点存在
     * @param path
     * @return
     * @throws InterruptedException
     * @throws KeeperException
     */
    public boolean existsNode(String path) throws InterruptedException, KeeperException {
        if (zk.exists(path, true) == null) {
            return true;
        }
        return false;
    }

    /**
     * zk服务器创建节点
     * @param path
     * @param data
     * @throws InterruptedException
     * @throws KeeperException
     */
    public void createNode(String path, byte[] data) throws InterruptedException, KeeperException {
        zk.create(path, data, ZooDefs.Ids.CREATOR_ALL_ACL, CreateMode.PERSISTENT);
    }
}
```

**节点监听**

```java
@Component
@Slf4j
@Data
@DependsOn
public class GetZkNode implements Watcher, ApplicationContextAware {
    private ApplicationContext applicationContext;
    private ZooKeeper zk;
    private String dbUrl;
    private String dbUserName;
    private String dbPassWord;

    @Override
    public void process(WatchedEvent event) {
        //zk服务器连接信息回调
        Event.EventType eventType = event.getType();
        if (eventType == Event.EventType.None) {
            log.warn("获取数据--连接zk服务器成功");
        } else if (eventType == Event.EventType.NodeCreated) {
            log.warn("获取数据--节点创建成功");
        } else if (eventType == Event.EventType.NodeChildrenChanged) {
            log.warn("获取数据--子节点更新成功");
        } else if (eventType == Event.EventType.NodeDataChanged) {
            log.warn("获取数据--节点更新成功");
            try {
                getNode();
                //重新设置DruidDataSource的值
                DruidDataSource dataSource = (DruidDataSource) applicationContext.getBean("druidDataSource");
                //重启数据源
                dataSource.resetStat();
                dataSource.setUsername(this.getDbUserName());
                dataSource.setUrl(this.getDbUrl());
                dataSource.setPassword(this.getDbPassWord());
            } catch (Exception e) {
                throw new RuntimeException(e);
            }
        } else if (eventType == Event.EventType.NodeDeleted) {
            log.warn("获取数据--节点删除成功");
        }
    }

    @Override
    public void setApplicationContext(ApplicationContext applicationContext) throws BeansException {
        this.applicationContext = applicationContext;
    }

    /**
     * 获取节点数据
     * @throws IOException
     */
    @PostConstruct
    public void getNode() throws IOException, InterruptedException {
        if (zk == null) {
            //连接zk服务器
            zk = new ZooKeeper(DataSources.ZK_URL, 3000, GetZkNode.this);
        }
        log.warn("获取节点数据---开始连接zk服务器");
        while (zk.getState() != ZooKeeper.States.CONNECTED) {
            Thread.sleep(3000);
        }
        log.warn("获取节点数据---连接zk服务器成功");

        //添加加密规则
        zk.addAuthInfo(DataSources.AUTH_TYPE, DataSources.AUTH_PASSWORD.getBytes());

        try {
            dbUrl = getNodeMsg(DataSources.URL_NODE);
            dbUserName = getNodeMsg(DataSources.USERNAME_NODE);
            dbPassWord = getNodeMsg(DataSources.PASSWORD_NODE);
        } catch (KeeperException e) {
            throw new RuntimeException(e);
        }
    }

    public String getNodeMsg(String path) throws InterruptedException, KeeperException, UnsupportedEncodingException {
        Stat stat = zk.exists(path, true);
        byte[] data = zk.getData(path, true, stat);
        return new String(data, "UTF-8");
    }
}
```



### 命名服务

  命名服务也是分布式系统中比较常见的一类场景。在分布式系统中，通过使用命名服务，客户端应用能够根据指定名字来**获取资源**、**服务的地址**、**提供者**等信息。被命名的实体通常可以是**集群中的机器**、**提供的服务地址**、**远程对象**等等。比如 HBase 会把 .META. 的地址信息存储在 Zookeeper，Client 会根据地址找到对应的 .META. 位置，再定位到操作数据具体所在的 RegionServer 来进行数据的操作。

### 负载均衡

  比如 Kafka 中发布者和订阅者的负载均衡

- **生产者负载均衡：**首先 Kafka 会把所有的分区信息发不到 Zookeeper 上有序排列，发送消息的时候，生产者会按照 brokerId 和 partition 的顺序排列组织成一个有序的分区列表，然后从头到尾循环往复地选择一个分区来发送消息。
- **消费负载均衡：**在消费过程中同一个 group，一个消费者会消费一个或多个分区中的消息，但是一个分区只会由的一个消费者来消费。在某个消费者故障或者重启等情况下，其他消费者通过 Watch 机制会知道这个变化，然后重新进行负载均衡，保证所有的分区都有消费者进行消费。

## 六、面试题

### zookeeper 是一个原子广播协议，哪里体现了原子性？

  **原子性：**一个事务包含多个操作，这些操作要么全部执行，要么全都不执行。实现事务的原子性，要支持回滚操作，在某个操作失败后，回滚到事务执行之前的状态。

**Zookeeper的特性**

1. 顺序一致性（Sequential Consistency）：来自相同客户端提交的事务，ZooKeeper 将按照其提交顺序依次执行；

2. 原子性（Atomicity）：于 ZooKeeper 集群中提交事务，事务将 “全部完成” 或 “全部未完成”，不存在 “部分完成”；

3. 单一系统镜像（Single System Image）：客户端连接到 ZooKeeper 集群的任意节点，其获得的数据视图都是相同的；

4. 可靠性（Reliability）：事务一旦完成，其产生的状态变化将永久保留，直到其他事务进行覆盖；

5. 实时性（Timeliness）：事务一旦完成，客户端将于限定的时间段内，获得最新的数据。

### 什么是脑裂（Split-Brain）？

- 假死：由于心跳超时（网络原因导致的）认为 leader 死了，但其实 leader 还存活着。
- 脑裂：由于假死会发起新的 leader 选举，选举出一个新的 leader，但旧的 leader 网络又通了，导致出现了两个 leader ，有的客户端连接到老的 leader，而有的客户端则连接到新的 leader。

  一般脑裂都是出现在集群环境中的。指的是一个集群环境中出现了多个`master`节点（类似[zookeeper](https://so.csdn.net/so/search?q=zookeeper&spm=1001.2101.3001.7020)的master、elasticsearch的master节点），导致严重数据问题，数据不一致等等。

  出现的原因：可能就是网络环境有问题如断开，假死等等，导致一部分slave节点会重新进入崩坏恢复模式，重新选举新的master节点，然后对外提供事务服务。

  **Zookeeper脑裂原因：**

  主要原因是 Zookeeper 集群和 Zookeeper client 判断超时并不能做到完全同步，也就是说可能一前一后，如果是集群先于 client 发现，那就会出现上面的情况。同时，在发现并切换后通知各个客户端也有先后快慢。一般出现这种情况的几率很小，需要 leader 节点与 Zookeeper 集群网络断开，但是与其他集群角色之间的网络没有问题，还要满足上面那些情况，但是一旦出现就会引起很严重的后果，数据不一致。

### ZooKeeper 时如何解决脑裂问题的？

#### Quorums (法定人数) 方式（过半机制）

  比如3个节点的集群，Quorums = 2, 也就是说集群可以容忍1个节点失效，这时候还能选举出1个 lead，集群还可用。比如4个节点的集群，它的 Quorums = 3，Quorums 要超过3，相当于集群的容忍度还是1，如果2个节点失效，那么整个集群还是无效的。这是 zookeeper 防止"脑裂"默认采用的方法。

- 集群中最少的节点数用来选举 leader 保证集群可用。
- 通知客户端数据已经安全保存前集群中最少数量的节点数已经保存了该数据。一旦这些节点保存了该数据，客户端将被通知已经安全保存了，可以继续其他任务。而集群中剩余的节点将会最终也保存了该数据。

#### 采用 Redundant communications (冗余通信)方式

  集群中采用多种通信方式，防止一种通信方式失效导致集群中的节点无法通信。

#### Fencing (共享资源) 方式

  比如能看到共享资源就表示在集群中，能够获得共享资源的锁的就是 Leader，看不到共享资源的，就不在集群中。

  要想避免 zookeeper"脑裂"情况其实也很简单，在 follower 节点切换的时候不在检查到老的 leader 节点出现问题后马上切换，而是在休眠一段足够的时间，确保老的 leader 已经获知变更并且做了相关的 shutdown 清理工作了然后再注册成为 master 就能避免这类问题了，这个休眠时间一般定义为与 zookeeper 定义的超时时间就够了，但是这段时间内系统可能是不可用的，但是相对于数据不一致的后果来说还是值得的。

#### 预防措施：

- 添加冗余的心跳线，例如双线条线，尽量减少“裂脑”发生机会。
- 启用磁盘锁。正在服务一方锁住共享磁盘，“裂脑"发生时，让对方完全"抢不走"共享磁盘资源。但使用锁磁盘也会有一个不小的问题，如果占用共享盘的一方不主动"解锁”，另一方就永远得不到共享磁盘。现实中假如服务节点突然死机或崩溃，就不可能执行解锁命令。后备节点也就接管不了共享资源和应用服务。于是有人在 HA 中设计了"智能"锁。即正在服务的一方只在发现心跳线全部断开（察觉不到对端）时才启用磁盘锁。平时就不上锁了。
- 设置仲裁机制。例如设置参考 IP（如网关 IP），当心跳线完全断开时，2个节点都各自 ping 一下 参考 IP，不通则表明断点就出在本端，不仅"心跳"、还兼对外"服务"的本端网络链路断了，即使启动（或继续）应用服务也没有用了，那就主动放弃竞争，让能够 ping 通参考 IP 的一端去起服务。更保险一些，ping 不通参考 IP 的一方干脆就自我重启，以彻底释放有可能还占用着的那些共享资源。

### Zookeeper 有哪几种几种部署模式？

1. 单机模式：zoo.cfg 中只配置一个 server.id 就是单机模式了，此模式一般用在**测试环境**，如果当前主机宕机，那么所有依赖于当前 ZooKeeper 服务工作的其他服务器都不能进行正常工作；

2. 伪分布式模式：在一台机器启动不同端口的 ZooKeeper，配置到 zoo.cfg 中，和单击模式相同，此模式一般用在测试环境；

3. 分布式模式：多台机器各自配置 zoo.cfg 文件，将各自互相加入服务器列表，上面搭建的集群就是这种完全分布式。

### 四种类型的数据节点 Znode

- **持久节点（persistent）：** 该节点的生命周期不依赖于会话，被创建后会一值存在，并且只有在客户端显示执行删除操作的时候，它们才能被删除。
- **永久有序节点：** 创建永久有序节点时，父节点会维护一份时序，用于记录子节点创建的先后顺序。在创建节点过程中，ZK 会自动为给定节点名加上一个数字后缀，作为新的节点名。这个数字后缀的范围是整型的最大值。
- **临时节点（ephemeral）：** 该节点的生命周期依赖于创建它们的会话。一旦会话(Session)结束，临时节点将被自动删除，当然可以也可以手动删除。虽然每个临时的 Znode 都会绑定到一个客户端会话，但他们对所有的客户端还是可见的。另外，ZooKeeper 的临时节点不允许拥有子节点。
- **临时有序节点：** 和永久有序节点类似，就不赘述了，临时有序节点可以用来实现分布式锁，下面会有分布式锁的详细说明。

### zookeeper 节点宕机如何处理？

- Zookeeper 也提供集群部署方式，同时提供leader选举机制，集群部署推荐配置不少于 3 个服务器。
- Zookeeper 自身也要保证当一 个节点宕机时， 其他节点会继续提供服务。
- 如果是一个 Follower 宕机， 还有 2 台服务器提供访问， 因为 Zookeeper 上的数据是 有多个副本的， 数据并不会丢失；
- 如果是一个 Leader 宕机， Zookeeper 会选举出新的 Leader。 ZK 集群的机制是只要超过半数的节点正常， 集群就能正常提供服务。只有在 ZK 节点挂得太多， 只剩一半或不到一半节点能工作， 集群才失效。 所以3 个节点的 cluster 可以挂掉 1 个节点(leader 可以得到 2 票>1.5) 2 个节点的 cluster 就不能挂掉任何 1 个节点了

### 为什么有了 Follower 还需要 Observer ？

  当 ZooKeeper 集群的规模变大，集群中 Follow 服务器数量逐渐增多的时候，ZooKeeper 处理创建数据节点等事务性请求操作的性能就会逐渐下降。这是因为 ZooKeeper 集群在处理事务性请求操作时，要在 ZooKeeper 集群中对该事务性的请求发起投票，只有超过半数的 Follow 服务器投票一致，才会执行该条写入操作。<br>  正因如此，随着集群中 Follow 服务器的数量越来越多，一次写入等相关操作的投票也就变得越来越复杂，并且 Follow 服务器之间彼此的网络通信也变得越来越耗时，导致随着 Follow 服务器数量的逐步增加，事务性的处理性能反而变得越来越低。

  Observer 可以处理 ZooKeeper 集群中的非事务性请求，并且不参与 Leader 节点等投票相关的操作。这样既保证了 ZooKeeper 集群性能的扩展性，又避免了因为过多的服务器参与投票相关的操作而影响 ZooKeeper 集群处理事务性会话请求的能力。

  而且在实际部署的时候，因为 Observer 不参与 Leader 节点等操作，并不会像 Follow 服务器那样频繁的与 Leader 服务器进行通信。因此，可以将 Observer 服务器部署在不同的网络区间中，这样也不会影响整个 ZooKeeper 集群的性能，也就是所谓的跨域部署。 

### zookeeper 是如何保证事务的顺序一致性的？

  Zookeeper采用了递增的事务Id来标识，所有的proposal（提议）都在被提出时加上了zxid，zxid实际上是一个64位的数字，高32位是epoch（纪元）用来标识leader是否发生改变，如果有新的leader产生出来，epoch会自增，低32位用来递增计数。当新产生proposal时，会依赖数据库的两阶段过程，首先会向其他的server发出事务执行请求，如果超过半数的机器都能执行并且能够成功，那么久开始执行。

### 说说 Zookeeper 的 CAP 问题上做的取舍？

  zookeeper通过ZAB协议（过半机制）保证了数据的强一致性，其主要分为两个方面：
 1）leader选举原理（myid，zxid）
 2）集群消息广播（类似2PC-两阶段提交，无需全部节点ack，过半即发起commit）

  leader选举耗时较长，此时集群不可用，所以zk难易保证集群的可用性。

  当作为注册中心时，需要保证的是服务的可用性，确保服务能够正确的注册和发现，而dubbo通过本地缓存的方式解决zk选举时集群不可用的问题。

### 集群支持动态添加机器吗？

- 其实就是水平扩容了，Zookeeper 在这方面不太好。两种方式：

- 全部重启：关闭所有 Zookeeper 服务，修改配置之后启动。不影响之前客户端的会话。

- 逐个重启：在过半存活即可用的原则下，一台机器重启不影响整个集群对外提供服务。这是比较常用的方式。

- 3.5 版本开始支持动态扩容。6

### 说一说 ZAB 协议？

  ZAB协议是 `ZooKeeper Atomic Broadcast` 的简称，全名叫**原子广播协议**，其核心作用就是**保证分布式系统的数据一致性**，**保证了分布式集群的最终一致性**。

  所有的事务请求都会由一台叫做 `leader` 的服务器来协调处理，集群中余下的服务器则称之为 `Follower` 或 `Observer`，leader 会将客户端的事务请求转换成一个事务 Proposal（提案），并将该提案分发给集群中所有的 Follower 服务器，只有当集群中过半数的服务器对该提案投票通过后，才能执行接下来的 Commit 操作。

  ZAB 协议算法两个核心功能点是**崩溃恢复**和**原子广播**协议。

### Zookeeper是什么？

  ZooKeeper 是一个开源的分布式协调服务。它是一个为分布式应用提供**一致性服务**的软件，分布式应用程序可以基于 Zookeeper 实现诸如数据发布/订阅、负载均衡、命名服务、分布式协调/通知、集群管理、Master 选举、分布式锁和分布式队列等功能。

### Zookeeper提供了什么？

  Zookeeper提供了三个核心功能：**文件系统、通知机制和集群管理机制**。

### Zookeeper文件系统

- Zookeeper存储数据的结构，类似于一个文件系统。每个节点称之为znode，每个znode都是类似于K-V的结构，每个节点的名字相当于key，每个节点中都保存了对应的数据，类似于key-value中的value。
- Zookeeper 提供一个多层级的节点命名空间（节点称为 znode）。与文件系统不同的是，这些节点都可以设置关联的数据，而文件系统中只有文件节点可以存放数据而目录节点不行。

- Zookeeper 为了保证高吞吐和低延迟，在内存中维护了这个树状的目录结构，这种特性使得 Zookeeper 不能用于存放大量的数据，每个节点的存放数据上限为1M。

### Zookeeper通知机制

  客户端可以监听某个节点，当该节点发生变化时，zookeeper就会**通知**监听该节点的客户端，后续根据客户端的处理逻辑进行处理。

### Zookeeper做什么？

  命名服务、配置管理、集群管理、分布式锁和队列管理。

### zk的命名服务（文件系统）

  在分布式系统中，Zookeeper会在自己的文件系统上（树结构的文件系统）创建一个以路径为名称的节点，它可以指向**提供的服务的地址，远程对象**等。例如Dubbo使用zookeeper来维护全局的服务地址列表。

### zk的配置管理（文件系统、通知机制）

  发布与订阅模型，即所谓的配置中心，顾名思义就是发布者将数据发布到 ZooKeeper 节点上，供订阅者动态获取数据，实现配置信息的集中式管理和动态更新。例如全局的配置信息，服务式服务框架的服务地址列表等就非常适合使用。

  应用中用到的一些配置信息放到 ZooKeeper 上进行集中管理。这类场景通常是这样：应用在启动的时候会主动来获取一次配置，同时在节点上注册一个 Watcher。这样一来，以后每次配置有更新的时候，都会实时通知到订阅的客户端，从来达到获取最新配置信息的目的。

  分布式搜索服务中，索引的元信息和服务器集群机器的节点状态存放在 ZooKeeper 的一些指定节点，供各个客户端订阅使用。

### Zookeeper集群管理（文件系统、通知机制）

  zookeeper本身是一个集群结构，有一个leader节点，负责写请求，多个follower节点负责相应读请求。并且在leader节点故障的时候，会根据选举机制从剩下的follower中选举出新的leader。

### Zookeeper分布式锁（文件系统、通知机制）

  分布式锁主要得益于 ZooKeeper 为我们保证了数据的强一致性。锁服务可以分为两类：一类是保持独占，另一类是控制时序。

  所谓保持独占，就是所有试图来获取这个锁的客户端，最终只有一个可以成功获得这把锁。通常的做法是把 ZooKeeper 上的一个 Znode 看作是一把锁，通过 create znode的方式来实现。所有客户端都去创建 /distribute_lock 节点，最终成功创建的那个客户端也即拥有了这把锁。

  控制时序，就是所有视图来获取这个锁的客户端，最终都是会被安排执行，只是有个全局时序了。做法和上面基本类似，只是这里 /distribute_lock 已经预先存在，客户端在它下面创建临时有序节点（这个可以通过节点的属性控制：CreateMode.EPHEMERAL_SEQUENTIAL 来指定）。ZooKeeper 的父节点（/distribute_lock）维持一份 sequence，保证子节点创建的时序性，从而也形成了每个客户端的全局时序。

1. 由于同一节点下子节点名称不能相同，所以只要在某个节点下创建 Znode，创建成功即表明加锁成功。注册监听器监听此 Znode，只要删除此 Znode 就通知其他客户端来加锁。
2. 创建临时顺序节点：在某个节点下创建节点，来一个请求则创建一个节点，由于是顺序的，所以序号最小的获得锁，当释放锁时，通知下一序号获得锁。

### 获取分布式锁的流程

### Zookeeper队列管理（文件系统、通知机制）

  队列方面，简单来说有两种：一种是常规的先进先出队列，另一种是等队列的队员聚齐以后才按照顺序执行。对于第一种的队列和上面讲的分布式锁服务中控制时序的场景基本原理一致，这里就不赘述了。

  第二种队列其实是在 FIFO 队列的基础上作了一个增强。通常可以在 /queue 这个 Znode 下预先建立一个 /queue/num 节点，并且赋值为 n（或者直接给 /queue 赋值 n）表示队列大小。之后每次有队列成员加入后，就判断下是否已经到达队列大小，决定是否可以开始执行了。

  这种用法的典型场景是：分布式环境中，一个大任务 Task A，需要在很多子任务完成（或条件就绪）情况下才能进行。这个时候，凡是其中一个子任务完成（就绪），那么就去 /taskList 下建立自己的临时时序节点（CreateMode.EPHEMERAL_SEQUENTIAL）。当 /taskList 发现自己下面的子节点满足指定个数，就可以进行下一步按序进行处理了。

### Zookeeper数据复制

- 写主
- 写分离

### Zookeeper工作原理

  Zookeeper的核心是原子广播，这个机制保证了各个Server之前的同步。实现这个机制的协议叫做Zab协议。Zab协议有两种模式，分别是恢复模式（选主）和广播模式（同步）。当服务启动或者在leader崩溃后，Zab就进入了恢复模式，当leader被选举出来，且大多数Server完成了和leader的状态同步后，恢复模式就结束了。状态同步保证了leader和server具有相同的系统状态。之后进入广播模式，如果这个时候当一个server加入到Zookeeper服务中，它会在恢复模式下启动，发现leader，并和leader进行状态同步。等同步结束，它也参与消息广播。Zookeeper服务一直维持在Broadcast状态，直到leader崩溃或者leader失去了大部分followers的支持。

### Zookeeper下Server工作状态

  服务器具有四种状态，分别是 LOOKING、FOLLOWING、LEADING、OBSERVING。

（1）LOOKING：寻 找 Leader 状态。当服务器处于该状态时，它会认为当前集群中没有 Leader，因此需要进入 Leader 选举状态。

（2）FOLLOWING：跟随者状态。表明当前服务器角色是 Follower。

（3）LEADING：领导者状态。表明当前服务器角色是 Leader。

（4）OBSERVING：观察者状态。表明当前服务器角色是 Observer。

### Zookeeper是如何选取主leader

  当leader崩溃或者leader失去大多数的follower，这时Zookeeper集群进入恢复模式，恢复模式需要重新选举一个leader，让所有的Server都恢复到一个正确的状态。Zookeeper的选举算法有两种：一种是基于basic paxos实现的，另一种是基于fast paxos算法实现的。系统默认的选举算法为fast paxos。Zookeeper集群选举leader节点，有两种情况：①集群刚刚启动时；②当原有的leader节点崩溃时。

### Zookeeper同步流程

### 分布式通知和协调

  ZooKeeper 中特有 Watcher 注册与异步通知机制，能够很好的实现分布式环境下不同系统之间的通知与协调，实现对数据变更的实时处理。使用方法通常是不同系统都对 ZooKeeper 上同一个 Znode 进行注册，监听 Znode 的变化（包括 Znode 本身内容及子节点的），其中一个系统 Update 了 Znode，那么另一个系统能够收到通知，并作出相应处理。

  另一种心跳检测机制：检测系统和被检测系统之间并不直接关联起来，而是通过 ZooKeeper 上某个节点关联，大大减少系统耦合。

  另一种系统调度模式：某系统有控制台和推送系统两部分组成，控制台的职责是控制推送系统进行相应的推送工作。管理人员在控制台作的一些操作，实际上是修改了 ZooKeeper 上某些节点的状态，而 ZooKeeper 就把这些变化通知给它们注册 Watcher 的客户端，即推送系统。于是，作出相应的推送任务。

  另一种工作汇报模式：一些类似于任务分发系统。子任务启动后，到 ZooKeeper 来注册一个临时节点，并且定时将自己的进度进行汇报（将进度写回这个临时节点）。这样任务管理者就能够实时知道任务进度。 

### 集群中为什么会有leader？

  在分布式环境中，有些业务逻辑只需要集群中的某一台机器执行，其他的机器可以共享这个结果，这样可以大大减少重复计算，提高性能，于是就需要进行leader选举。

### Zookeeper负载均衡和nginx负载均衡区别

- zk 的负载均衡是可以调控，nginx 只是能调权重，其他需要可控的都需要自己写插件；但是 nginx 的吞吐量比 zk 大很多，应该说按业务选择用哪种方式。

### Zookeeper watch机制

- Zookeeper 允许客户端向服务端的某个 Znode 注册一个 Watcher 监听，当服务端的一些指定事件触发了这个 Watcher，服务端会向指定客户端发送一个事件通知来实现分布式的通知功能，然后客户端根据 Watcher 通知状态和事件类型做出业务上的改变。

- 工作机制：

	1. 客户端注册 watcher
	2. 服务端处理 watcher
	3. 客户端回调 watcher
		

## 七、zkCli命令

```tex
1.下载zookeeper 最新版镜像
docker search zookeeper 

docker pull zookeeper

docker images              //查看下载的本地镜像

docker inspect zookeeper

2. 在windows下d盘中创建一个文件夹。 
d:
mkdir dockercontainers
cd dockercontainers
mkdir zookeeper
3. 启动服务
docker run -d -e TZ="Asia/Shanghai" -p 2181:2181 -v d:\dockercontainers\zookeeper:/data --name zookeeper --restart always zookeeper

-e TZ="Asia/Shanghai" # 指定上海时区 
-d # 表示在一直在后台运行容器
-p 2181:2181 # 对端口进行映射，将本地2181端口映射到容器内部的2181端口
--name # 设置创建的容器名称
-v # 将本地目录(文件)挂载到容器指定目录；
--restart always #始终重新启动zookeeper
4. 查看
docker ps
5. 通过 Docker 的 link 机制来对这个 ZK 容器进行访问
docker run -it --rm --link zookeeper:zookeeper zookeeper zkCli.sh -server zookeeper          //这样的话，直接登录到容器时，进入到 zkCli中

  docker exec -it zookeeper bash      //**** 只登录容器，不登录 zkCli
```

```tex
1. get -s /节点路径

重点 -s 表示显示  stat的信息列表
2. ls /节点路径   列出这个节点下的字节点
3. create -s -e /节点路径 '节点数据内容'
  -s:有序 只在一个父节点下有序
  -e:临时节点 客户端断开连接则失效
4. set /节点路径 新值
5. stat /节点路径   只看节点状态值，不看数据
6. delete /节点路径
7.列表
ls -s /节点路径		-s:显示当前节点的stat
ls -R /节点路径		-R:递归显示此目录下的所有
8. history:查看历史命令

================事件：
printwatches: 打开或关闭监听器 第一步
当指定的znode或znode的子数据更改时，监视器会显示通知，显示后将监听删除
命令中设置watch
stat path [watch] 	对当前节点更新数据起作用
get path [watch] 		对当前节点更新数据（set 路径 新内容）起作用
ls path [watch]			对创建，删除子节点事件起作用
ls2 path [watch]		对创建，删除子节点事件起作用
```

### 基于docker-compose部署zookeeper集群

```

```

### 