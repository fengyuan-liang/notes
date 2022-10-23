# Kafka

## 1. 初识MQ

### 1.1.同步和异步通讯

微服务间通讯有同步和异步两种方式：

同步通讯：就像打电话，需要实时响应。

异步通讯：就像发邮件，不需要马上回复。

![image-20210717161939695](https://cdn.fengxianhub.top/resources-master/202205152108011.png)

两种方式各有优劣，打电话可以立即得到响应，但是你却不能跟多个人同时通话。发送邮件可以同时与多个人收发邮件，但是往往响应会有延迟。

#### 1.1.1 同步通讯

我们之前学习的Feign调用就属于同步方式，虽然调用可以实时得到结果，但存在下面的问题：

![image-20210717162004285](https://cdn.fengxianhub.top/resources-master/202205152108732.png)

总结：

同步调用的优点：

- 时效性较强，可以立即得到结果

同步调用的问题：

- 耦合度高
- 性能和吞吐能力下降
- 有额外的资源消耗
- 有级联失败问题

#### 1.1.2 异步通讯

异步调用则可以避免上述问题：

我们以购买商品为例，用户支付后需要调用订单服务完成订单状态修改，调用物流服务，从仓库分配响应的库存并准备发货。

在事件模式中，支付服务是`事件发布者（publisher）`，在支付完成后只需要发布一个支付成功的事件（event），事件中带上订单id。

订单服务和物流服务是`事件订阅者（Consumer）`，订阅支付成功的事件，监听到事件后完成自己业务即可。

为了解除事件发布者与订阅者之间的耦合，两者并不是直接通信，而是有一个中间人（Broker）。发布者发布事件到Broker，不关心谁来订阅事件。订阅者从Broker订阅事件，不关心谁发来的消息。

![image-20210422095356088](https://cdn.fengxianhub.top/resources-master/202205251725227.png)

Broker 是一个像数据总线一样的东西，所有的服务要接收数据和发送数据都发到这个总线上，这个总线就像协议一样，让服务间的通讯变得标准和可控。

好处：

- 吞吐量提升：无需等待订阅者处理完成，响应更快速

- 故障隔离：服务没有直接调用，不存在级联失败问题
- 调用间没有阻塞，不会造成无效的资源占用
- 耦合度极低，每个服务都可以灵活插拔，可替换
- 流量削峰：不管发布事件的流量波动多大，都由Broker接收，订阅者可以按照自己的速度去处理事件

缺点：

- 架构复杂了，业务没有明显的流程线，不好管理
- 需要依赖于Broker的可靠、安全、性能

好在现在开源软件或云平台上 Broker 的软件是非常成熟的，比较常见的一种就是我们今天要学习的MQ技术。

### 1.2 技术对比

MQ，中文是消息队列（MessageQueue），字面来看就是存放消息的队列。也就是事件驱动架构中的Broker。

比较常见的MQ实现：

- ActiveMQ
- RabbitMQ
- RocketMQ
- Kafka

几种常见MQ的对比：

|            | **RabbitMQ**            | **ActiveMQ**                   | **RocketMQ** | **Kafka**  |
| ---------- | ----------------------- | ------------------------------ | ------------ | ---------- |
| 公司/社区  | Rabbit                  | Apache                         | 阿里         | Apache     |
| 开发语言   | Erlang                  | Java                           | Java         | Scala&Java |
| 协议支持   | AMQP，XMPP，SMTP，STOMP | OpenWire,STOMP，REST,XMPP,AMQP | 自定义协议   | 自定义协议 |
| 可用性     | 高                      | 一般                           | 高           | 高         |
| 单机吞吐量 | 一般                    | 差                             | 高           | 非常高     |
| 消息延迟   | 微秒级                  | 毫秒级                         | 毫秒级       | 毫秒以内   |
| 消息可靠性 | 高                      | 一般                           | 高           | 一般       |

追求可用性：Kafka、 RocketMQ 、RabbitMQ

追求可靠性：RabbitMQ、RocketMQ

追求吞吐能力：RocketMQ、Kafka

追求消息低延迟：RabbitMQ、Kafka

### 1.3 MQ的两种模式

- 点对点模式
- 发布/订阅模式

![image-20221023153407811](https://cdn.fengxianhub.top/resources-master/202210231534000.png)

## 2. 初识Kafka

![image-20221023131053300](https://cdn.fengxianhub.top/resources-master/202210231310547.png)

Kafka是最初由**Linkedin公司**开发，是一个分布式、支持分区的（partition）、多副本的（replica），基于zookeeper协调的分布式消息系统，它的最大的特性就是可以实时的处理大量数据以满足各种需求场景：比如基于hadoop的批处理系统、低延迟的实时系统、Storm/Spark流式处理引擎，web/nginx日志、访问日志，消息服务等等，用**scala语言**编写，Linkedin于2010年贡献给了Apache基金会并成为顶级开源项目。

### 2.1 Kafka的使用场景

- 日志收集：一个公司可以用Kafka收集各种服务的log，通过kafka以统一接口服务的方式开放给各种consumer，例如hadoop、Hbase、Solr等。
- 消息系统：解耦和生产者和消费者、缓存消息等。
- 用户活动跟踪：Kafka经常被用来记录web用户或者app用户的各种活动，如浏览网页、搜索、点击等活动，这些活动信息被各个服务器发布到kafka的topic中，然后订阅者通过订阅这些topic来做实时的监控分析，或者装载到hadoop、数据仓库中做离线分析和挖掘。
- 运营指标：Kafka也经常用来记录运营监控数据。包括收集各种分布式应用的数据，生产各种操作的集中反馈，比如报警和报告。

### 2.2 Kafka基本概念

kafka是一个分布式的，分区的消息(官方称之为commit log)服务。它提供一个消息系统应该具备的功能，但是确有着独特的设计。可以这样来说，Kafka借鉴了JMS规范的思想，但是确并**没有完全遵循JMS规范。**

首先，让我们来看一下基础的消息(Message)相关术语：

| **名称**        | **解释**                                                     |
| --------------- | ------------------------------------------------------------ |
| Broker          | 消息中间件处理节点，一个Kafka节点就是一个broker，一个或者多个Broker可以组成一个Kafka集群 |
| Topic           | Kafka根据topic对消息进行归类，发布到Kafka集群的每条消息都需要指定一个topic |
| Producer        | 消息生产者，向Broker发送消息的客户端                         |
| Consumer        | 消息消费者，从Broker读取消息的客户端                         |
| ConsumerGroup   | 每个Consumer属于一个特定的Consumer Group，一条消息可以被多个不同的Consumer Group消费，但是一个Consumer Group中只能有一个Consumer能够消费该消息 |
| Partition       | 物理上的概念，一个topic可以分为多个partition，每个partition内部消息是有序的 |
| Replica（副本） | 一个 topic 的每个分区都有若干个副本，一个 Leader 和若干个 Follower |
| Leader：        | 每个分区多个副本的“主”，生产者发送数据的对象，以及消费者消费数 据的对象都是 Leader |
| Follower        | 每个分区多个副本中的“从”，实时从 Leader 中同步数据，保持和 Leader 数据的同步。Leader 发生故障时，某个 Follower 会成为新的 Leader。 |

![image-20221023160845899](https://cdn.fengxianhub.top/resources-master/202210231608025.png)

服务端(brokers)和客户端(producer、consumer)之间通信通过**TCP协议**来完成。

### 2.3 Topic与Partition

在Kafka中，Topic就是一个主题，生产者往topic里面发送消息，消费者从topic里面捞数据进行消费

假设现在有一个场景，如果我们现在有`100T`的数据需要进行消费，但是现在我们一台主机上面并不能存储这么多数据该怎么办呢

![image-20221023153602249](https://cdn.fengxianhub.top/resources-master/202210231536402.png)

其实做法很简单，就是将海量的数据进行切割，并且在Topic中添加分区的概念，每一个分区都对应一台主机，并且存储切分到的数据

![image-20221023153944358](https://cdn.fengxianhub.top/resources-master/202210231539565.png)

当然为了实现高可用，其实分区可以实现主从架构，这个后面再了解

这样做的好处是：

- 分区存储，可以解决一个topic中文件过大无法存储的问题
- 提高了读写的吞吐量，读写可以在多个分区中同时进行

## 3. Kafka基本使用

### 3.1 部署前的准备

- 安装jdk

  ```shell
  yum install -y java-1.8.0-openjdk-devel.x86_64 \
  && (
  cat <<EOF
  #set java environment
  JAVA_HOME=/usr/lib/jvm/jre-1.8.0-openjdk
  PATH=$PATH:$JAVA_HOME/bin
  CLASSPATH=.:$JAVA_HOME/lib/dt.jar:$JAVA_HOME/lib/tools.jar
  export JAVA_HOME CLASSPATH PATH
  EOF
  ) >> /etc/profile && source /etc/profile && java -version
  ```

- 安装zk

  ```java
  docker run -d \
  -e TZ="Asia/Shanghai" \
  -p 2181:2181 \
  -v /home/docker/zookeeper/data:/data \
  --name zookeeper \
  --restart always zookeeper
  ```

- 官网下载kafka的压缩包:http://kafka.apache.org/downloads 

  这里使用清华大学镜像源下载，这里推荐用旧版本的，不然后面搭集群容易出错

  ```java
  mkdir /usr/local/kafka \
  && cd /usr/local/kafka \
  && wget https://mirrors.tuna.tsinghua.edu.cn/apache/kafka/2.8.2/kafka_2.13-2.8.2.tgz  \
  && tar -zvxf kafka_2.13-2.8.2.tgz \
  && rm -rf kafka_2.13-2.8.2.tgz
  ```

- 解压缩至如下路径

  ```java
  /usr/local/kafka/
  ```

- 修改配置文件：/usr/local/kafka/kafka_2.13-2.8.2/config/server.properties

  >注意：这里请不要填`localhost:9092   `，localhost表示只能通过本机连接，可以设置为`0.0.0.0`或本地局域网地址

  ```shell
  #broker.id属性在kafka集群中必须要是唯一
  broker.id=0
  #kafka部署的机器ip和提供服务的端口号
  listeners=PLAINTEXT://localhost:9092   
  #kafka的消息存储文件
  log.dir=/usr/local/data/kafka-logs
  #kafka连接zookeeper的地址，/kafka表示所有文件创建在/kafka下，便于管理
  zookeeper.connect=localhost:2181/kafka
  ```

- 添加kafka环境变量

  ```shell
  (
  #KAFKA_HOME
  export KAFKA_HOME=/usr/local/kafka/kafka_2.13-2.8.2
  export PATH=$PATH:$KAFKA_HOME/bin
  EOF
  ) >> /etc/profile && source /etc/profile 
  ```

### 3.2 启动kafka服务器

进入到bin目录下。使用命令来启动

```shell
./kafka-server-start.sh -daemon ../config/server.properties
```

验证是否启动成功：

进入到zk中的节点看id是0的broker有没有存在（上线）

```shell
ls /brokers/ids/
```

![image-20221023141059262](https://cdn.fengxianhub.top/resources-master/202210231410386.png)

**server.properties核心配置详解：**

| **Property**               | **Default**                    | **Description**                                              |
| -------------------------- | ------------------------------ | ------------------------------------------------------------ |
| broker.id                  | 0                              | 每个broker都可以用一个唯一的非负整数id进行标识；这个id可以作为broker的“名字”，你可以选择任意你喜欢的数字作为id，只要id是唯一的即可。 |
| log.dirs                   | /tmp/kafka-logs                | kafka存放数据的路径。这个路径并不是唯一的，可以是多个，路径之间只需要使用逗号分隔即可；每当创建新partition时，都会选择在包含最少partitions的路径下进行。 |
| listeners                  | PLAINTEXT://192.168.65.60:9092 | server接受客户端连接的端口，ip配置kafka本机ip即可            |
| zookeeper.connect          | localhost:2181                 | zooKeeper连接字符串的格式为：hostname:port，此处hostname和port分别是ZooKeeper集群中某个节点的host和port；zookeeper如果是集群，连接方式为 hostname1:port1, hostname2:port2, hostname3:port3 |
| log.retention.hours        | 168                            | 每个日志文件删除之前保存的时间。默认数据保存时间对所有topic都一样。 |
| num.partitions             | 1                              | 创建topic的默认分区数                                        |
| default.replication.factor | 1                              | 自动创建topic的默认副本数量，建议设置为大于等于2             |
| min.insync.replicas        | 1                              | 当producer设置acks为-1时，min.insync.replicas指定replicas的最小数目（必须确认每一个repica的写数据都是成功的），如果这个数目没有达到，producer发送消息会产生异常 |
| delete.topic.enable        | false                          | 是否允许删除主题                                             |

### 3.3 Kafka核心概念之Topic

>在`Kafka`中，Topic是一个非常重要的概念，topic可以实现消息的分类，不同消费者订阅不同的topic

![Kafka Topic](https://cdn.fengxianhub.top/resources-master/202210231415682.png)

partition(分区)是`kafka`的一个核心概念，kafka将1个topic分成了一个或多个分区，每个分区在物理上对应一个目录，分区目录下存储的是该分区的日志段(segment)，包括日志的数据文件和两个索引文件

执行以下命令创建名为`test`的topic，这个topic只有一个partition，并且备份因子也设置为1：

```shell
./kafka-topics.sh --bootstrap-server localhost:9092 --create --topic test --partitions 1
```

查看当前kafka内有哪些topic

```shell
./kafka-topics.sh --bootstrap-server localhost:9092 --list 
```

![image-20221023143325382](https://cdn.fengxianhub.top/resources-master/202210231433535.png)

### 3.4 发送消息

kafka自带了一个`producer`命令客户端，可以从本地文件中读取内容，或者我们也可以以命令行中直接输入内容，并将这些内容以消息的形式发送到kafka集群中。在默认情况下，每一个行会被当做成一个独立的消息。使用kafka的发送消息的客户端，指定发送到的kafka服务器地址和topic

```java
./kafka-console-producer.sh --broker-list localhost:9092 --topic test
```

### 3.5 消费消息

对于consumer，kafka同样也携带了一个命令行客户端，会将获取到内容在命令中进行输出，**默认是消费最新的消息**。使用kafka的消费者消息的客户端，从指定kafka服务器的指定topic中消费消息

- 方式一：从最后一条消息的偏移量+1开始消费

```shell
./kafka-console-consumer.sh --bootstrap-server localhost:9092 --topic test
```

![image-20221023144527011](https://cdn.fengxianhub.top/resources-master/202210231445111.png)

- 方式二：从头开始消费

```shell
./kafka-console-consumer.sh --bootstrap-server localhost:9092 --from-beginning --topic test
```

![image-20221023144627460](https://cdn.fengxianhub.top/resources-master/202210231446570.png)

几个注意点：

- 消息会被存储
- 消息是顺序存储
- 消息是有偏移量的
- 消费时可以指明偏移量进行消费

### 3.6 消费者偏移量

在上面我们展示了两种不同的消费方式，根据偏移量消费和从头开始消费，其实这个偏移量可以我们自己进行维护

我们进入我们在`server.properties`里面配置的日志文件地址`/usr/local/data/kafka-logs`

我们可以看到默认一共有五十个偏移量地址，里面就记录了当前消费的偏移量。我们先关注`test-0`这个文件

![image-20221023145537363](https://cdn.fengxianhub.top/resources-master/202210231455526.png)

我们进入这个文件，可以看到其中有个log文件，里面就保存了`Topic`发送的数据

![image-20221023150727318](https://cdn.fengxianhub.top/resources-master/202210231507470.png)

- 生产者将消息发送给broker，broker会将消息保存在本地的日志文件中

  ```java
  /usr/local/kafka/kafka-logs/主题-分区/00000000.log
  ```

- 消息的保存是有序的，通过offset偏移量来描述消息的有序性
- 消费者消费消息时也是通过offset来描述当前要消费的那条消息的位置

![](https://cdn.fengxianhub.top/resources-master/202210231506804.png)

### 3.7 单播消息

我们现在假设有一个场景，有一个生产者，两个消费者，问：生产者发送消息，是否会同时被两个消费者消费？

我们可以实践一下

创建一个topic

```java
./kafka-topics.sh --bootstrap-server localhost:9092 --create --topic test2 --partitions 1
```

创建一个生产者

```java
./kafka-console-producer.sh --broker-list localhost:9092 --topic test2
```

分别在两个终端上面创建两个消费者

```java
./kafka-console-consumer.sh --bootstrap-server localhost:9092 --topic test2
```

![image-20221023151525771](https://cdn.fengxianhub.top/resources-master/202210231515875.png)

>这里就要引申出一个概念：`消费组`，当我们配置多个消费者在一个消费组里面的时候，其实只会有一个消费者进行消费
>
>这样其实才符合常理，毕竟一条消息被消费一次就够了

我们可以通过命令`--consumer-property group.id=testGroup`在设置消费者时将其划分到一个消费组里面

```java
./kafka-console-consumer.sh --bootstrap-server localhost:9092  --consumer-property group.id=testGroup --topic test2
```

![image-20221023152216831](https://cdn.fengxianhub.top/resources-master/202210231522927.png)

这个时候，如果`消费组`里面有一个消费者挂掉了，就会由其他消费者来进行消费

![image-20221023152409328](https://cdn.fengxianhub.top/resources-master/202210231524437.png)

>小结一下：**两个消费者在同一个组，只有一个能接到消息，两个在不同组或者未指定组则都能收到**

### 3.8 多播消息

当多个消费组同时订阅一个Topic时，那么不同的消费组中只有一个消费者能收到消息。实际上也是多个消费组中的多个消费者收到了同一个消息

```java
// 消费组1
./kafka-console-consumer.sh --bootstrap-server localhost:9092  --consumer-property group.id=testGroup1 --topic test2
// 消费组2
./kafka-console-consumer.sh --bootstrap-server localhost:9092  --consumer-property group.id=testGroup2 --topic test2
```

![image-20221023155032874](https://cdn.fengxianhub.top/resources-master/202210231550992.png)

![](https://cdn.fengxianhub.top/resources-master/202210231554588.png)

### 3.9 查看消费组的详细信息

通过以下命令可以查看到消费组的相信信息：

```shell
# 查看当前所有的消费组
./kafka-consumer-groups.sh --bootstrap-server localhost:9092 --list
# 查看指定消费组具体信息，比如当前偏移量、最后一条消息的偏移量、堆积的消息数量
./kafka-consumer-groups.sh --bootstrap-server localhost:9092 --describe --group testGroup
```

![image-20221023160242494](https://cdn.fengxianhub.top/resources-master/202210231602679.png)

### 3.10 创建分区

我们在上面已经了解了`Topic与Partition`的概念，现在我们可以通过以下命令给一个topic创建多个分区

```shell
# 创建两个分区的主题
./kafka-topics.sh --bootstrap-server localhost:9092 --create --topic test3 --partitions 2
# 查看下创建的topic
./kafka-topics.sh --bootstrap-server localhost:9092 --list 
```

现在我们再进到日志文件中看一眼，可以看到日志是以分区来命名的

![image-20221023162414028](https://cdn.fengxianhub.top/resources-master/202210231624214.png)

### 3.11 分区细节

我们知道分区文件中

- 00000.log： 这个文件中保存的就是消息

- __consumer_offsets-49:

  kafka内部自己创建了`__consumer_offsets`主题包含了50个分区。这个主题用来存放消费者消费某个主题的偏移量。因为每个消费者都会自己维护着消费的主题的偏移量，也就是说**每个消费者会把消费的主题的偏移量自主上报给kafka中的默认主题**：consumer_offsets。因此kafka为了提升这个主题的并发性，默认设置了50个分区。

  - 提交到哪个分区：通过hash函数：`hash(consumerGroupId) % __consumer_offsets`主题的分区数

  - 提交到该主题中的内容是：key是`consumerGroupId + topic + 分区号`，value就是当前offset的值

- 文件中保存的消息，默认保存7天。七天到后消息会被删除。

### 3.12 docker一键部署

```java
docker-compose -f docker-compose-kafka.yml -p kafka up -d
```

```yaml
version: '3'
services:
  # 可以不单独创建
  zookepper:
    image: wurstmeister/zookeeper                    # 原镜像`wurstmeister/zookeeper`
    container_name: zookeeper                        # 容器名为'zookeeper'
    restart: unless-stopped                          # 指定容器退出后的重启策略为始终重启，但是不考虑在Docker守护进程启动时就已经停止了的容器
    volumes:                                         # 数据卷挂载路径设置,将本机目录映射到容器目录
      - "/etc/localtime:/etc/localtime"
    ports:                                           # 映射端口
      - "2181:2181"
  kafka:
    image: wurstmeister/kafka                                # 原镜像`wurstmeister/kafka`
    container_name: kafka                                    # 容器名为'kafka'
    restart: unless-stopped                                  # 指定容器退出后的重启策略为始终重启，但是不考虑在Docker守护进程启动时就已经停止了的容器
    volumes:                                                 # 数据卷挂载路径设置,将本机目录映射到容器目录
      - "/etc/localtime:/etc/localtime"
    environment:                                             # 设置环境变量,相当于docker run命令中的-e
      KAFKA_ADVERTISED_HOST_NAME: localhost                  # TODO 本机IP，请输入网卡ip，而不是回环口ip
      KAFKA_ADVERTISED_PORT: 9092                            # 端口
      KAFKA_BROKER_ID: 0                                     # 在kafka集群中，每个kafka都有一个BROKER_ID来区分自己
      KAFKA_ADVERTISED_LISTENERS: PLAINTEXT://localhost:9092 # TODO 将kafka的地址端口注册给zookeeper
      KAFKA_LISTENERS: PLAINTEXT://0.0.0.0:9092                        # 配置kafka的监听端口
      KAFKA_ZOOKEEPER_CONNECT: localhost:2181                # TODO zookeeper地址
      KAFKA_CREATE_TOPICS: "hello_world"
    ports:                              # 映射端口
      - "9092:9092"
    depends_on:                         # 解决容器依赖启动先后问题
      - zookepper

  kafka-manager:
    image: sheepkiller/kafka-manager                         # 原镜像`sheepkiller/kafka-manager`
    container_name: kafka-manager                            # 容器名为'kafka-manager'
    restart: unless-stopped                                          # 指定容器退出后的重启策略为始终重启，但是不考虑在Docker守护进程启动时就已经停止了的容器
    environment:                        # 设置环境变量,相当于docker run命令中的-e
      ZK_HOSTS: localhost:2181  # TODO zookeeper地址
      APPLICATION_SECRET: zhengqing
      KAFKA_MANAGER_AUTH_ENABLED: "true"  # 开启kafka-manager权限校验
      KAFKA_MANAGER_USERNAME: admin       # 登陆账户
      KAFKA_MANAGER_PASSWORD: 123456      # 登陆密码
    ports:                              # 映射端口
      - "9000:9000"
    depends_on:                         # 解决容器依赖启动先后问题
      - kafka
```

### 3.13 docker部署单kafka

```java
docker-compose -f docker-compose-kafka.yml -p kafka up -d
```

```yaml
version: '3'
services:
  kafka:
    image: wurstmeister/kafka                                # 原镜像`wurstmeister/kafka`
    container_name: kafka                                    # 容器名为'kafka'
    restart: unless-stopped                                  # 指定容器退出后的重启策略为始终重启，但是不考虑在Docker守护进程启动时就已经停止了的容器
    volumes:                                                 # 数据卷挂载路径设置,将本机目录映射到容器目录
      - "/etc/localtime:/etc/localtime"
    environment:                                             # 设置环境变量,相当于docker run命令中的-e
      KAFKA_ADVERTISED_HOST_NAME: localhost        # TODO 本机IP
      KAFKA_ADVERTISED_PORT: 9092                            # 端口
      KAFKA_BROKER_ID: 0                                     # 在kafka集群中，每个kafka都有一个BROKER_ID来区分自己
      KAFKA_ADVERTISED_LISTENERS: PLAINTEXT://localhost:9092 # TODO 将kafka的地址端口注册给zookeeper
      KAFKA_LISTENERS: PLAINTEXT://0.0.0.0:9092              # 配置kafka的监听端口
      KAFKA_ZOOKEEPER_CONNECT: localhost:2181                # TODO zookeeper地址
      KAFKA_CREATE_TOPICS: "hello_world"
    ports:                              # 映射端口
      - "9092:9092"
  kafka-manager:
    image: sheepkiller/kafka-manager                         # 原镜像`sheepkiller/kafka-manager`
    container_name: kafka-manager                            # 容器名为'kafka-manager'
    restart: unless-stopped                                  # 指定容器退出后的重启策略为始终重启，但是不考虑在Docker守护进程启动时就已经停止了的容器
    environment:                        # 设置环境变量,相当于docker run命令中的-e
      ZK_HOSTS: localhost:2181  # TODO zookeeper地址
      APPLICATION_SECRET: zhengqing
      KAFKA_MANAGER_AUTH_ENABLED: "true"  # 开启kafka-manager权限校验
      KAFKA_MANAGER_USERNAME: admin       # 登陆账户
      KAFKA_MANAGER_PASSWORD: 123456      # 登陆密码
    ports:                              # 映射端口
      - "9100:9000"
    depends_on:                         # 解决容器依赖启动先后问题
      - kafka
```

## 4. Kafka命令

我们来将命令汇总总结一下

### 4.1 Topic相关命令

在上面我们简单使用kafka后，我们来小结一下kafka中的命令，其实主要有三类：

- topic命令：对应脚本`kafka-topics.sh`
- 生产者命令：对应脚本`kafka-console-producer.sh `
- 消费者命令：对应脚本`kafka-console-consumer.sh`

首先我们想要的所有命令都可以通过`sh kafka-topics.sh`看到，主要的命令有：

| 参数                                               | 描述                                 |
| -------------------------------------------------- | ------------------------------------ |
| --bootstrap-server <String: server to  connect to> | 连接的 Kafka Broker 主机名称和端口号 |
| --topic <String: topic>                            | 操作的 topic 名称                    |
| --create                                           | 创建主题                             |
| --delete                                           | 删除主题                             |
| --alter                                            | 修改主题                             |
| --list                                             | 查看所有主题                         |
| --describe                                         | 查看主题详细描述                     |
| --partitions <Integer: # of partitions>            | 设置分区数                           |
| --replication-factor <Integer: replication factor> | 设置分区副本                         |
| --config <String: name=value>                      | 更新系统默认的配置                   |

### 4.2 producer相关命令

| 参数                                               | 描述                                 |
| -------------------------------------------------- | ------------------------------------ |
| --bootstrap-server <String: server to  connect to> | 连接的 Kafka Broker 主机名称和端口号 |
| --topic <String: topic>                            | 操作的 topic 名称                    |

### 4.3 consumer相关命令

| 参数                                               | 描述                                 |
| -------------------------------------------------- | ------------------------------------ |
| --bootstrap-server <String: server to  connect to> | 连接的 Kafka Broker 主机名称和端口号 |
| --topic <String: topic>                            | 操作的 topic 名称                    |
| --from-beginning                                   | 从头开始消费                         |
| --group <String: consumer group id>                | 指定消费者组名称                     |

## 5. Kafka集群

### 5.1 伪分布式搭建

- 创建三个server.properties文件

```
 # 0 1 2
 broker.id=2
 // 9092 9093 9094
 listeners=PLAINTEXT://192.168.65.60:9094
 //kafka-logs kafka-logs-1 kafka-logs-2
 log.dir=/usr/local/data/kafka-logs-2
```

- 通过命令来启动三台broker

```
 ./kafka-server-start.sh -daemon ../config/server.properties \
 ./kafka-server-start.sh -daemon ../config/server2.properties \
 ./kafka-server-start.sh -daemon ../config/server3.properties 
```

- 校验是否启动成功

进入到zk中查看/brokers/ids中过是否有三个znode（0，1，2）

### 5.2 分布式搭建

首先我们要有三台主机（或者修改端口号，伪分布式搭建）

| 主机名 | IP          |
| ------ | ----------- |
| liang  | 172.16.1.7  |
| dd1    | 172.16.1.4  |
| dd2    | 172.16.1.12 |

将上面的主机信息分别配置到每台机器的`/etc/hosts`目录下

```java
172.16.1.7 liang
172.16.1.4 dd1
172.16.1.12 dd2
```

**修改主机名**

```java
vi /etc/hostname
```

依次填入对应的主机，使用`bash`立即生效

**免密钥设置**

这一步非常重要，如果不设置后面集群通信会失败

我们先产生本机的RSA密钥

```shell
ssh-keygen -t rsa -P '' -f    ~/.ssh/id_rsa
```

密钥产生后会出现在` ~/.ssh/id_rsa`目录中

![image-20220630131646251](https://cdn.fengxianhub.top/resources-master/202206301316296.png)

解释一下这三个文件：

- **authorized_keys**：就是为了让不同机器之间使用ssh不需要用户名和密码。采用了数字签名[RSA](https://so.csdn.net/so/search?q=RSA&spm=1001.2101.3001.7020)或者DSA来完成这个操作，我们只需要将其他机器的id_rsa.pub放到此目录下，其他机器ssh访问本机器时就不需要账号密码了
- **id_rsa**：即RSA算法生成的私钥
- **id_rsa.pub**：即RSA算法生成的公钥（上面有密钥和最后面的用户标识）

我们需要将每台机器上的公钥添加到其他主机的authorized_keys中

![image-20221023175433840](https://cdn.fengxianhub.top/resources-master/202210231754029.png)

将第一台主机上的kafka传给其他两台主机，反撇号加pwd表示传到对应主机的当前目录下

```java
scp -r kafka/ dd2:`pwd`
scp -r kafka/ dd1:`pwd`
```

### 5.2 修改kafka配置

我们需要在每台机器上修改一下配置文件

```shell
#这里的id不能重复
broker.id=0
#kafka部署的机器ip和提供服务的端口号
listeners=PLAINTEXT://liang:9092   
#kafka的消息存储文件
log.dir=/usr/local/kafka/data/kafka-logs
#kafka连接zookeeper的地址
zookeeper.connect=liang:2181
```

我们写一个脚本来批量启动kafka

```shell
#! /bin/bash
case $1 in
"start"){
 for i in liang dd1 dd2
 do
 echo " --------启动 $i Kafka-------"
 ssh $i "sh /usr/local/kafka/kafka_2.13-2.8.2/bin/kafka-server-start.sh -daemon /usr/local/kafka/kafka_2.13-2.8.2/config/server.properties"
 done
};;
"stop"){
 for i in liang dd1 dd2
 do
 echo " --------停止 $i Kafka-------"
 ssh $i "sh /usr/local/kafka/kafka_2.13-2.8.2/bin/kafka-server-stop.sh"
 done
};;
esac

```

![image-20221023183101611](https://cdn.fengxianhub.top/resources-master/202210231831825.png)

我们在zk中已经可以看到三台kafka上线了

![image-20221023183405902](https://cdn.fengxianhub.top/resources-master/202210231834024.png)

### 5.3 副本的概念

在创建主题时，除了指明了主题的分区数以外，还指明了副本数，那么副本是一个什么概念呢？

我们现在创建`一个主题、两个分区、三个副本`的topic（注意：副本只有在集群下才有意义）

```shell
./kafka-topics.sh \
--bootstrap-server localhost:9092 \
--create --topic my-replicated-topic \
--partitions 2 \
--replication-factor 3   
```

描述：

```shell
sh kafka-topics.sh \
# 指定启动的机器
--bootstrap-server localhost:9092 \ 
# 创建一个topic
--create --topic my-replicated-topic \   
# 设置分区数为1
--partitions 2         \   
# 设置副本数为3
--replication-factor 3    
```

我们查看一下分区的详细信息

```shell
# 查看topic情况
./kafka-topics.sh --describe --zookeeper localhost:2181 --topic my-replicated-topic
```

![](https://cdn.fengxianhub.top/resources-master/202210232036846.png)

- leader

  kafka的写和读的操作，都发生在leader上。leader负责把数据同步给follower。当leader挂了，经过主从选举，从多个follower中选举产生一个新的leader

- follower

  接收leader的同步的数据

- isr

  可以同步和已同步的节点会被存入到isr集合中。这里有一个细节：如果isr中的节点性能较差，会被提出isr集合。

>**（重点～！）**此时，broker、主题、分区、副本 这些概念就全部展现了，大家需要把这些概念梳理清楚：
>
>集群中有多个broker，创建主题时可以指明主题有多个分区（把消息拆分到不同的分区中存储），可以为分区创建多个副本，不同的副本存放在不同的broker里。

### 5.4 集群消费

#### 5.4.1 向集群发送消息

```shell
./kafka-console-producer.sh --broker-list localhost:9092,localhost:9093,localhost:9094 --topic my-replicated-topic
```

#### 5.4.2 从集群中消费消息

```shell
# 伪分布式
./kafka-console-consumer.sh --bootstrap-server node1:9092,node1:9093,node1:9094 --from-beginning --consumer-property group.id=testGroup1 --topic my-replicated-topic
# 分布式
./kafka-console-consumer.sh --bootstrap-server liang:9092,dd1:9092,dd2:9092 --from-beginning --consumer-property group.id=testGroup1 --topic my-replicated-topic
```

#### 5.4.3 指定消费组来消费消息

```shell
./kafka-console-consumer.sh --bootstrap-server localhost:9092,localhost:9093,localhost:9094 --from-beginning --consumer-property group.id=testGroup1 --topic my-replicated-topic
```

>这里有一个细节，结合上面的`单播消息`我们很容易可以想到下面的这种情况，因为一个`Partition`只能被一个`consumer Group`里面的一个`consumer`，所有很容易就可以形成`组内单播`的现象，即：
>
>- 多Partition与多consumer一一对应
>
>这样的好处是：
>
>- 分区存储，可以解决一个topic中文件过大无法存储的问题
>- **提高了读写的吞吐量，读写可以在多个分区中同时进行**

<img src="https://cdn.fengxianhub.top/resources-master/202210232139754.jpg" alt="kafka集群消费" style="zoom:50%;" />

>**Kafka这种通过分区与分组进行并行消费的方式，让kafka拥有极大的吞吐量**

![image-20221023214517761](https://cdn.fengxianhub.top/resources-master/202210232145931.png)

小结一下：

- 一个partition只能被一个消费组中的一个消费者消费，目的是为了保证消费的顺序性，但是多个partion的多个消费者消费的总的顺序性是得不到保证的，那怎么做到消费的总顺序性呢？这个后面揭晓答案

- partition的数量决定了消费组中消费者的数量，建议同一个消费组中消费者的数量不要超过partition的数量，否则多的消费者消费不到消息

- 如果消费者挂了，那么会触发rebalance机制（后面介绍），会让其他消费者来消费该分区

- kafka通过partition 可以保证每条消息的原子性，但是不会保证每条消息的顺序性

## 6. SpringBoot整合kafka

```xml
<dependency>
      <groupId>org.apache.kafka</groupId>
      <artifactId>kafka-clients</artifactId>
      <version>2.4.1</version>
</dependency>
```

### 6.1 生产者核心概念

>在消息发送的过程中，涉及到了两个线程
>
>- main 线程
>- Sender 线程
>
>在 main 线程中创建了一个双端队列 `RecordAccumulator`。main 线程将消息发送给 `RecordAccumulator`， Sender 线程不断从 RecordAccumulator 中拉取消息发送到 `Kafka Broker`

在main线程中，消息的生产，要经历拦截器、序列化器和分区器，其中一个分区就会创建一个队列，这样方便数据的管理

其中队列默认是`32M`，而存放到队列里面的数据也会经过压缩为`16k`再发往send线程进行发送，但是这样也会有问题，就是如果只有一条消息，难道就不发送了吗？其实还有一个参数`linger.ms`，用来表示一条消息如果超过这个时间就会直接发送，不用管大小，其实可以类比坐车的场景，`人满或者时间到了 都发车`

![image-20221023235243343](https://cdn.fengxianhub.top/resources-master/202210232352864.png)

>send线程发送给kafka集群的时候，我们需要联系到上面的`Topic与Partition已经消费组`，形成一个`Partition`对应`consumer Group`里面的一个`consumer`这种`组内单播的效果`，进行并发读写

### 6.2 生产者代码编写

这里我们用了上面集群状态下创建的分区`my-replicated-topic`

这里如果显示连接失败，可以看一下配置文件里面的`listeners=PLAINTEXT://host:9092  `是不是写了localhost

```java
import org.apache.kafka.clients.producer.*;
import org.apache.kafka.common.serialization.StringSerializer;

import java.util.Properties;
import java.util.concurrent.ExecutionException;

/**
 *
 * @author Eureka
 * @since 2022/10/23 23:03
 */
public class MySimpleProducer {
    private final static String TOPIC_NAME = "my-replicated-topic";
    public static void main(String[] args) throws ExecutionException, InterruptedException {
        // 1. 设置参数
        Properties props = new Properties();
        props.put(ProducerConfig.BOOTSTRAP_SERVERS_CONFIG, "192.168.2.2:9092,192.168.2.2:9093,192.168.2.2:9094");
        // 把发送的key从字符串序列化为字节数组，这里不采用jdk的序列化，而是自定义序列化方式
        props.put(ProducerConfig.KEY_SERIALIZER_CLASS_CONFIG, StringSerializer.class.getName());
        //把发送消息value从字符串序列化为字节数组
        props.put(ProducerConfig.VALUE_SERIALIZER_CLASS_CONFIG, StringSerializer.class.getName());
        // 2. 创建生产消息的客户端，传入参数
        Producer<String, String> producer = new KafkaProducer<>(props);
        // 3.创建消息
        // key：作用是决定了往哪个分区上发，value：具体要发送的消息内容
        ProducerRecord<String, String> producerRecord = new ProducerRecord<>(TOPIC_NAME, "mykeyvalue", "hellokafka");
        //4. 发送消息,得到消息发送的元数据并输出
        RecordMetadata metadata = producer.send(producerRecord).get();
        System.out.println("同步方式发送消息结果：" + "topic-" + metadata.topic() + "|partition-"
                + metadata.partition() + "|offset-" + metadata.offset());
    }
}
```

#### 6.2.1 同步发送

我们在上面代码中是这样发送消息的

```java
RecordMetadata metadata = producer.send(producerRecord).get();
System.out.println("同步方式发送消息结果：" + "topic-" + metadata.topic() + "|partition-"
                   + metadata.partition() + "|offset-" + metadata.offset());
```

可以看到消息发出后有一个`get()`，其实这里有一个过程，就是`Broker`需要在收到消息后回复一个`ACK`表示确认收到

如果生产者发送消息没有收到ack，生产者会阻塞，阻塞到3s的时间，如果还没有收到消息，会进行重试。重试的次数3次

这里的应答ack有三个取值

- 0：生产者发送过来的数据，不需要应答
- 1：生产者发送过来的数据，Leader收到数据后会应答
- -1（all），生产者发送过来的数据，Leader和ISR队列里面所有的结点收齐数据后应答，-1与

#### 6.2.2 异步发送

异步发送的代码如下

```java
//5.异步发送消息
producer.send(producerRecord, new Callback() {
    public void onCompletion(RecordMetadata metadata, Exception exception) {
        if (exception != null) {
            System.err.println("发送消息失败：" + exception.getStackTrace());

        }
        if (metadata != null) {
            System.out.println("异步方式发送消息结果：" + "topic-" + metadata.topic() + "|partition-"
                               + metadata.partition() + "|offset-" + metadata.offset());
        }
    }
});
```

如果我们直接执行，是看不到异步回调代码执行的，我们需要让主线程暂停下来

```java
CountDownLatch countDownLatch = new CountDownLatch(1);
producer.send(producerRecord, (metadata, exception) -> {
    if (exception != null) {
        System.err.println("发送消息失败：" + Arrays.toString(exception.getStackTrace()));
    }
    if (metadata != null) {
        System.out.println("异步方式发送消息结果：" + "topic-" + metadata.topic() + "|partition-"
                           + metadata.partition() + "|offset-" + metadata.offset());
    }
    countDownLatch.countDown();
});
countDownLatch.await();
```

观察结果，这样确实是进行异步回调了

![image-20221024005145700](https://cdn.fengxianhub.top/resources-master/202210240051198.png)

#### 6.2.3 生产者中的ack的配置

在同步发送的前提下，生产者在获得集群返回的ack之前会一直阻塞。那么集群什么时候返回ack呢？此时ack有3个配置：

- ack = 0   kafka-cluster不需要任何的broker收到消息，就立即返回ack给生产者，最容易丢消息的，效率是最高的

- ack=1（默认）： 多副本之间的leader已经收到消息，并把消息写入到本地的log中，才会返回ack给生产者，性能和安全性是最均衡的

- ack=-1/all。里面有默认的配置`min.insync.replicas=2`(默认为1，推荐配置大于等于2)，此时就需要leader和一个follower同步完后，才会返回ack给生产者（此时集群中有2个broker已完成数据的接收），这种方式最安全，但性能最差。











