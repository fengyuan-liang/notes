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

|       | **RabbitMQ**         | **ActiveMQ**                  | **RocketMQ** | **Kafka**  |
| ----- | -------------------- | ----------------------------- | ------------ | ---------- |
| 公司/社区 | Rabbit               | Apache                        | 阿里           | Apache     |
| 开发语言  | Erlang               | Java                          | Java         | Scala&Java |
| 协议支持  | AMQP，XMPP，SMTP，STOMP | OpenWire,STOMP，REST,XMPP,AMQP | 自定义协议        | 自定义协议      |
| 可用性   | 高                    | 一般                            | 高            | 高          |
| 单机吞吐量 | 一般                   | 差                             | 高            | 非常高        |
| 消息延迟  | 微秒级                  | 毫秒级                           | 毫秒级          | 毫秒以内       |
| 消息可靠性 | 高                    | 一般                            | 高            | 一般         |

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

| **名称**        | **解释**                                                                                               |
| ------------- | ---------------------------------------------------------------------------------------------------- |
| Broker        | 消息中间件处理节点，一个Kafka节点就是一个broker，一个或者多个Broker可以组成一个Kafka集群                                              |
| Topic         | Kafka根据topic对消息进行归类，发布到Kafka集群的每条消息都需要指定一个topic                                                      |
| Producer      | 消息生产者，向Broker发送消息的客户端                                                                                |
| Consumer      | 消息消费者，从Broker读取消息的客户端                                                                                |
| ConsumerGroup | 每个Consumer属于一个特定的Consumer Group，一条消息可以被多个不同的Consumer Group消费，但是一个Consumer Group中只能有一个Consumer能够消费该消息 |
| Partition     | 物理上的概念，一个topic可以分为多个partition，每个partition内部消息是有序的                                                    |
| Replica（副本）   | 一个 topic 的每个分区都有若干个副本，一个 Leader 和若干个 Follower                                                        |
| Leader：       | 每个分区多个副本的“主”，生产者发送数据的对象，以及消费者消费数 据的对象都是 Leader                                                       |
| Follower      | 每个分区多个副本中的“从”，实时从 Leader 中同步数据，保持和 Leader 数据的同步。Leader 发生故障时，某个 Follower 会成为新的 Leader。               |

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
  
  > 注意：这里请不要填`localhost:9092   `，localhost表示只能通过本机连接，可以设置为`0.0.0.0`或本地局域网地址
  
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

| **Property**               | **Default**                    | **Description**                                                                                                                                      |
| -------------------------- | ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| broker.id                  | 0                              | 每个broker都可以用一个唯一的非负整数id进行标识；这个id可以作为broker的“名字”，你可以选择任意你喜欢的数字作为id，只要id是唯一的即可。                                                                        |
| log.dirs                   | /tmp/kafka-logs                | kafka存放数据的路径。这个路径并不是唯一的，可以是多个，路径之间只需要使用逗号分隔即可；每当创建新partition时，都会选择在包含最少partitions的路径下进行。                                                             |
| listeners                  | PLAINTEXT://192.168.65.60:9092 | server接受客户端连接的端口，ip配置kafka本机ip即可                                                                                                                     |
| zookeeper.connect          | localhost:2181                 | zooKeeper连接字符串的格式为：hostname:port，此处hostname和port分别是ZooKeeper集群中某个节点的host和port；zookeeper如果是集群，连接方式为 hostname1:port1, hostname2:port2, hostname3:port3 |
| log.retention.hours        | 168                            | 每个日志文件删除之前保存的时间。默认数据保存时间对所有topic都一样。                                                                                                                 |
| num.partitions             | 1                              | 创建topic的默认分区数                                                                                                                                        |
| default.replication.factor | 1                              | 自动创建topic的默认副本数量，建议设置为大于等于2                                                                                                                          |
| min.insync.replicas        | 1                              | 当producer设置acks为-1时，min.insync.replicas指定replicas的最小数目（必须确认每一个repica的写数据都是成功的），如果这个数目没有达到，producer发送消息会产生异常                                          |
| delete.topic.enable        | false                          | 是否允许删除主题                                                                                                                                             |

### 3.3 Kafka核心概念之Topic

> 在`Kafka`中，Topic是一个非常重要的概念，topic可以实现消息的分类，不同消费者订阅不同的topic

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

> 这里就要引申出一个概念：`消费组`，当我们配置多个消费者在一个消费组里面的时候，其实只会有一个消费者进行消费
> 
> 这样其实才符合常理，毕竟一条消息被消费一次就够了

我们可以通过命令`--consumer-property group.id=testGroup`在设置消费者时将其划分到一个消费组里面

```java
./kafka-console-consumer.sh --bootstrap-server localhost:9092  --consumer-property group.id=testGroup --topic test2
```

![image-20221023152216831](https://cdn.fengxianhub.top/resources-master/202210231522927.png)

这个时候，如果`消费组`里面有一个消费者挂掉了，就会由其他消费者来进行消费

![image-20221023152409328](https://cdn.fengxianhub.top/resources-master/202210231524437.png)

> 小结一下：**两个消费者在同一个组，只有一个能接到消息，两个在不同组或者未指定组则都能收到**

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

| 参数                                                 | 描述                        |
| -------------------------------------------------- | ------------------------- |
| --bootstrap-server <String: server to  connect to> | 连接的 Kafka Broker 主机名称和端口号 |
| --topic <String: topic>                            | 操作的 topic 名称              |
| --create                                           | 创建主题                      |
| --delete                                           | 删除主题                      |
| --alter                                            | 修改主题                      |
| --list                                             | 查看所有主题                    |
| --describe                                         | 查看主题详细描述                  |
| --partitions <Integer: # of partitions>            | 设置分区数                     |
| --replication-factor <Integer: replication factor> | 设置分区副本                    |
| --config <String: name=value>                      | 更新系统默认的配置                 |

### 4.2 producer相关命令

| 参数                                                 | 描述                        |
| -------------------------------------------------- | ------------------------- |
| --bootstrap-server <String: server to  connect to> | 连接的 Kafka Broker 主机名称和端口号 |
| --topic <String: topic>                            | 操作的 topic 名称              |

### 4.3 consumer相关命令

| 参数                                                 | 描述                        |
| -------------------------------------------------- | ------------------------- |
| --bootstrap-server <String: server to  connect to> | 连接的 Kafka Broker 主机名称和端口号 |
| --topic <String: topic>                            | 操作的 topic 名称              |
| --from-beginning                                   | 从头开始消费                    |
| --group <String: consumer group id>                | 指定消费者组名称                  |

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
 sh kafka-server-start.sh -daemon ../config/server.properties \
 && sh kafka-server-start.sh -daemon ../config/server2.properties \
 && sh kafka-server-start.sh -daemon ../config/server3.properties 
```

- 校验是否启动成功

进入到zk中查看/brokers/ids中过是否有三个znode（0，1，2）

### 5.2 分布式搭建

首先我们要有三台主机（或者修改端口号，伪分布式搭建）

| 主机名   | IP          |
| ----- | ----------- |
| liang | 172.16.1.7  |
| dd1   | 172.16.1.4  |
| dd2   | 172.16.1.12 |

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

> **（重点～！）**此时，broker、主题、分区、副本 这些概念就全部展现了，大家需要把这些概念梳理清楚：
> 
> 集群中有多个broker，创建主题时可以指明主题有多个分区（把消息拆分到不同的分区中存储），可以为分区创建多个副本，不同的副本存放在不同的broker里。

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

> 这里有一个细节，结合上面的`单播消息`我们很容易可以想到下面的这种情况，因为一个`Partition`只能被一个`consumer Group`里面的一个`consumer`，所有很容易就可以形成`组内单播`的现象，即：
> 
> - 多Partition与多consumer一一对应
> 
> 这样的好处是：
> 
> - 分区存储，可以解决一个topic中文件过大无法存储的问题
> - **提高了读写的吞吐量，读写可以在多个分区中同时进行**

<img src="https://cdn.fengxianhub.top/resources-master/202210232139754.jpg" alt="kafka集群消费" style="zoom:50%;" />

> **Kafka这种通过分区与分组进行并行消费的方式，让kafka拥有极大的吞吐量**

![image-20221023214517761](https://cdn.fengxianhub.top/resources-master/202210232145931.png)

小结一下：

- 一个partition只能被一个消费组中的一个消费者消费，目的是为了保证消费的顺序性，但是多个partion的多个消费者消费的总的顺序性是得不到保证的，那怎么做到消费的总顺序性呢？这个后面揭晓答案

- partition的数量决定了消费组中消费者的数量，建议同一个消费组中消费者的数量不要超过partition的数量，否则多的消费者消费不到消息

- 如果消费者挂了，那么会触发rebalance机制（后面介绍），会让其他消费者来消费该分区

- kafka通过partition 可以保证每条消息的原子性，但是不会保证每条消息的顺序性

## 6. Kafka API基本使用

```xml
<dependency>
      <groupId>org.apache.kafka</groupId>
      <artifactId>kafka-clients</artifactId>
      <version>2.4.1</version>
</dependency>
```

### 6.1 生产者核心概念

> 在消息发送的过程中，涉及到了两个线程
> 
> - main 线程
> - Sender 线程
> 
> 在 main 线程中创建了一个双端队列 `RecordAccumulator`。main 线程将消息发送给 `RecordAccumulator`， Sender 线程不断从 RecordAccumulator 中拉取消息发送到 `Kafka Broker`

在main线程中，消息的生产，要经历拦截器、序列化器和分区器，其中一个分区就会创建一个队列，这样方便数据的管理

其中队列默认是`32M`，而存放到队列里面的数据也会经过压缩为`16k`再发往send线程进行发送，但是这样也会有问题，就是如果只有一条消息，难道就不发送了吗？其实还有一个参数`linger.ms`，用来表示一条消息如果超过这个时间就会直接发送，不用管大小，其实可以类比坐车的场景，`人满或者时间到了 都发车`

![image-20221023235243343](https://cdn.fengxianhub.top/resources-master/202210232352864.png)

> send线程发送给kafka集群的时候，我们需要联系到上面的`Topic与Partition已经消费组`，形成一个`Partition`对应`consumer Group`里面的一个`consumer`这种`组内单播的效果`，进行并发读写

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

>- ack = 0   kafka-cluster不需要任何的broker收到消息，就立即返回ack给生产者，**最容易丢消息的，效率是最高的**
>
>- **ack=1（默认**）： 多副本之间的leader已经收到消息，并把消息写入到本地的log中，才会返回ack给生产者，性能和安全性是最均衡的s
>
>- ack=-1/all。里面有默认的配置`min.insync.replicas=2`(默认为1，推荐配置大于等于2)，此时就需要leader和一个follower同步完后，才会返回ack给生产者（此时集群中有2个broker已完成数据的接收），这种方式最安全，但性能最差。

下面是关于ack和重试（如果没有收到ack，就开启重试）的配置

```java
props.put(ProducerConfig.ACKS_CONFIG, "1");
/*
 发送失败会重试，默认重试间隔100ms，重试能保证消息发送的可靠性，但是也可能造成消息重复发送，比如网络抖动，所以需要在
 接收者那边做好消息接收的幂等性处理
*/
props.put(ProducerConfig.RETRIES_CONFIG, 3); 
//重试间隔设置
props.put(ProducerConfig.RETRY_BACKOFF_MS_CONFIG, 300);
```



## 5.关于消息发送的缓冲区

<img src="https://cdn.fengxianhub.top/resources-master/202210260102471.png" alt="截屏2021-08-23 下午3.13.09" style="zoom:33%;" />

- kafka默认会创建一个消息缓冲区，用来存放要发送的消息，缓冲区是32m

```java
props.put(ProducerConfig.BUFFER_MEMORY_CONFIG, 33554432);
```

- kafka本地线程会去缓冲区中一次拉16k的数据，发送到broker

```java
props.put(ProducerConfig.BATCH_SIZE_CONFIG, 16384);
```

- 如果线程拉不到16k的数据，间隔10ms也会将已拉到的数据发到broker

```java
props.put(ProducerConfig.LINGER_MS_CONFIG, 10);
```

# 七、Java客户端消费者的实现细节

## 1.消费者的基本实现

```java
package com.qf.kafka;

import org.apache.kafka.clients.consumer.ConsumerConfig;
import org.apache.kafka.clients.consumer.ConsumerRecord;
import org.apache.kafka.clients.consumer.ConsumerRecords;
import org.apache.kafka.clients.consumer.KafkaConsumer;
import org.apache.kafka.common.serialization.StringDeserializer;

import java.time.Duration;
import java.util.Arrays;
import java.util.Properties;

public class MySimpleConsumer {


  private final static String TOPIC_NAME = "my-replicated-topic";
  private final static String CONSUMER_GROUP_NAME = "testGroup";

  public static void main(String[] args) {
    Properties props = new Properties();
    props.put(ConsumerConfig.BOOTSTRAP_SERVERS_CONFIG, "172.16.253.38:9092,172.16.253.38:9093,172.16.253.38:9094");
    // 消费分组名
    props.put(ConsumerConfig.GROUP_ID_CONFIG, CONSUMER_GROUP_NAME);
    props.put(ConsumerConfig.KEY_DESERIALIZER_CLASS_CONFIG, StringDeserializer.class.getName());
    props.put(ConsumerConfig.VALUE_DESERIALIZER_CLASS_CONFIG, StringDeserializer.class.getName());
    //1.创建一个消费者的客户端
    KafkaConsumer<String, String> consumer = new KafkaConsumer<String, String>(props);
    //2. 消费者订阅主题列表
    consumer.subscribe(Arrays.asList(TOPIC_NAME));

    while (true) {
      /*
       * 3.poll() API 是拉取消息的长轮询
       */
      ConsumerRecords<String, String> records = consumer.poll(Duration.ofMillis(1000));
      for (ConsumerRecord<String, String> record : records) {
        //4.打印消息
        System.out.printf("收到消息：partition = %d,offset = %d, key = %s, value = %s%n", record.partition(),
          record.offset(), record.key(), record.value());
      }
    }
  }

}

```

## 2.关于消费者自动提交和手动提交offset

### 1）提交的内容

消费者无论是自动提交还是手动提交，都需要把所属的消费组+消费的某个主题+消费的某个分区及消费的偏移量，这样的信息提交到集群的_consumer_offsets主题里面。

### 2）自动提交

消费者poll消息下来以后就会自动提交offset

```java
// 是否自动提交offset，默认就是true
props.put(ConsumerConfig.ENABLE_AUTO_COMMIT_CONFIG, "true");
// 自动提交offset的间隔时间
props.put(ConsumerConfig.AUTO_COMMIT_INTERVAL_MS_CONFIG, "1000");
```

注意：自动提交会丢消息。因为消费者在消费前提交offset，有可能提交完后还没消费时消费者挂了。

### 3）手动提交

需要把自动提交的配置改成false

```java
props.put(ConsumerConfig.ENABLE_AUTO_COMMIT_CONFIG, "false");
```

手动提交又分成了两种：

- 手动同步提交

  在消费完消息后调用同步提交的方法，当集群返回ack前一直阻塞，返回ack后表示提交成功，执行之后的逻辑

  ```java
   while (true) {
        /*
         * poll() API 是拉取消息的长轮询
         */
        ConsumerRecords<String, String> records = consumer.poll(Duration.ofMillis(1000));
        for (ConsumerRecord<String, String> record : records) {
          System.out.printf("收到消息：partition = %d,offset = %d, key = %s, value = %s%n", record.partition(),
            record.offset(), record.key(), record.value());
        }
        //所有的消息已消费完
        if (records.count() > 0) {//有消息
          // 手动同步提交offset，当前线程会阻塞直到offset提交成功
          // 一般使用同步提交，因为提交之后一般也没有什么逻辑代码了
          consumer.commitSync();//=======阻塞=== 提交成功
        }
      }
    }
  ```

  

- 手动异步提交

  在消息消费完后提交，不需要等到集群ack，直接执行之后的逻辑，可以设置一个回调方法，供集群调用

  ```java
   while (true) {
        /*
         * poll() API 是拉取消息的长轮询
         */
        ConsumerRecords<String, String> records = consumer.poll(Duration.ofMillis(1000));
        for (ConsumerRecord<String, String> record : records) {
          System.out.printf("收到消息：partition = %d,offset = %d, key = %s, value = %s%n", record.partition(),
            record.offset(), record.key(), record.value());
        }
        //所有的消息已消费完
        if (records.count() > 0) {
  
          // 手动异步提交offset，当前线程提交offset不会阻塞，可以继续处理后面的程序逻辑
          consumer.commitAsync(new OffsetCommitCallback() {
            @Override
            public void onComplete(Map<TopicPartition, OffsetAndMetadata> offsets, Exception exception) {
              if (exception != null) {
                System.err.println("Commit failed for " + offsets);
                System.err.println("Commit failed exception: " + exception.getStackTrace());
              }
            }
          });
  
        }
      }
    }
  ```

  

## 3.长轮询poll消息

- 默认情况下，消费者一次会poll500条消息。

```java
//一次poll最大拉取消息的条数，可以根据消费速度的快慢来设置
props.put(ConsumerConfig.MAX_POLL_RECORDS_CONFIG, 500);
```

- 代码中设置了长轮询的时间是1000毫秒

```java
 while (true) {
      /*
       * poll() API 是拉取消息的长轮询
       */
      ConsumerRecords<String, String> records = consumer.poll(Duration.ofMillis(1000));
      for (ConsumerRecord<String, String> record : records) {
        System.out.printf("收到消息：partition = %d,offset = %d, key = %s, value = %s%n", record.partition(),
          record.offset(), record.key(), record.value());
      }
```

意味着：

- - 如果一次poll到500条，就直接执行for循环
  - 如果这一次没有poll到500条。且时间在1秒内，那么长轮询继续poll，要么到500条，要么到1s
  - 如果多次poll都没达到500条，且1秒时间到了，那么直接执行for循环
- 如果两次poll的间隔超过30s，集群会认为该消费者的消费能力过弱，该消费者被踢出消费组，触发rebalance机制，rebalance机制会造成性能开销。可以通过设置这个参数，让一次poll的消息条数少一点

```java
  //一次poll最大拉取消息的条数，可以根据消费速度的快慢来设置
    props.put(ConsumerConfig.MAX_POLL_RECORDS_CONFIG, 500);
    //如果两次poll的时间如果超出了30s的时间间隔，kafka会认为其消费能力过弱，将其踢出消费组。将分区分配给其他消费者。-rebalance
    props.put(ConsumerConfig.MAX_POLL_INTERVAL_MS_CONFIG, 30 * 1000);
```



## 4.消费者的健康状态检查

消费者每隔1s向kafka集群发送心跳，集群发现如果有超过10s没有续约的消费者，将被踢出消费组，触发该消费组的rebalance机制，将该分区交给消费组里的其他消费者进行消费。

```java
//consumer给broker发送心跳的间隔时间
    props.put(ConsumerConfig.HEARTBEAT_INTERVAL_MS_CONFIG, 1000);
    //kafka如果超过10秒没有收到消费者的心跳，则会把消费者踢出消费组，进行rebalance，把分区分配给其他消费者。
    props.put(ConsumerConfig.SESSION_TIMEOUT_MS_CONFIG, 10 * 1000);
```



## 5.指定分区和偏移量、时间消费

- 指定分区消费

```java
consumer.assign(Arrays.asList(new TopicPartition(TOPIC_NAME, 0)));
```

- 从头消费

```java
consumer.assign(Arrays.asList(new TopicPartition(TOPIC_NAME, 0)));
consumer.seekToBeginning(Arrays.asList(new TopicPartition(TOPIC_NAME, 0)));
```

- 指定offset消费

```java
consumer.assign(Arrays.asList(new TopicPartition(TOPIC_NAME, 0)));
consumer.seek(new TopicPartition(TOPIC_NAME, 0), 10);
```

- 指定时间消费

根据时间，去所有的partition中确定该时间对应的offset，然后去所有的partition中找到该offset之后的消息开始消费。

```java
List<PartitionInfo> topicPartitions = consumer.partitionsFor(TOPIC_NAME);
        //从1小时前开始消费
        long fetchDataTime = new Date().getTime() - 1000 * 60 * 60;
        Map<TopicPartition, Long> map = new HashMap<>();
        for (PartitionInfo par : topicPartitions) {
            map.put(new TopicPartition(TOPIC_NAME, par.partition()), fetchDataTime);
        }
        Map<TopicPartition, OffsetAndTimestamp> parMap = consumer.offsetsForTimes(map);
        for (Map.Entry<TopicPartition, OffsetAndTimestamp> entry : parMap.entrySet()) {
            TopicPartition key = entry.getKey();
            OffsetAndTimestamp value = entry.getValue();
            if (key == null || value == null) continue;
            Long offset = value.offset();
            System.out.println("partition-" + key.partition() + "|offset-" + offset);
            System.out.println();
            //根据消费里的timestamp确定offset
            if (value != null) {
                consumer.assign(Arrays.asList(key));
                consumer.seek(key, offset);
            }
        }

```

## 6.新消费组的消费offset规则

新消费组中的消费者在启动以后，默认会从当前分区的最后一条消息的offset+1开始消费（消费新消息）。可以通过以下的设置，让新的消费者第一次从头开始消费。之后开始消费新消息（最后消费的位置的偏移量+1）

- Latest:默认的，消费新消息
- earliest：第一次从头开始消费。之后开始消费新消息（最后消费的位置的偏移量+1）

```java
props.put(ConsumerConfig.AUTO_OFFSET_RESET_CONFIG, "earliest");
```



# 八、Springboot中使用Kafka

## 1.引入依赖

```xml
<dependency>
      <groupId>org.springframework.kafka</groupId>
      <artifactId>spring-kafka</artifactId>
    </dependency>
```

## 2.编写配置文件

```yml
server:
  port: 8080

spring:
  kafka:
    bootstrap-servers: 172.16.253.38:9092,172.16.253.38:9093,172.16.253.38:9094
    producer: # 生产者
      retries: 3 # 设置大于0的值，则客户端会将发送失败的记录重新发送
      batch-size: 16384
      buffer-memory: 33554432
      acks: 1
      # 指定消息key和消息体的编解码方式
      key-serializer: org.apache.kafka.common.serialization.StringSerializer
      value-serializer: org.apache.kafka.common.serialization.StringSerializer
    consumer:
      group-id: default-group
      enable-auto-commit: false
      auto-offset-reset: earliest
      key-deserializer: org.apache.kafka.common.serialization.StringDeserializer
      value-deserializer: org.apache.kafka.common.serialization.StringDeserializer
      max-poll-records: 500
    listener:
      # 当每一条记录被消费者监听器（ListenerConsumer）处理之后提交
      # RECORD
      # 当每一批poll()的数据被消费者监听器（ListenerConsumer）处理之后提交
      # BATCH
      # 当每一批poll()的数据被消费者监听器（ListenerConsumer）处理之后，距离上次提交时间大于TIME时提交
      # TIME
      # 当每一批poll()的数据被消费者监听器（ListenerConsumer）处理之后，被处理record数量大于等于COUNT时提交
      # COUNT
      # TIME |　COUNT　有一个条件满足时提交
      # COUNT_TIME
      # 当每一批poll()的数据被消费者监听器（ListenerConsumer）处理之后, 手动调用Acknowledgment.acknowledge()后提交
      # MANUAL
      # 手动调用Acknowledgment.acknowledge()后立即提交，一般使用这种
      # MANUAL_IMMEDIATE
      ack-mode: MANUAL_IMMEDIATE
  redis:
    host: 172.16.253.21

```



## 3.编写消息生产者

```java
package com.qf.kafka.spring.boot.demo.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/msg")
public class MyKafkaController {

  private final static String TOPIC_NAME = "my-replicated-topic";

  @Autowired
  private KafkaTemplate<String,String> kafkaTemplate;

  @RequestMapping("/send")
  public String sendMessage(){

    kafkaTemplate.send(TOPIC_NAME,0,"key","this is a message!");

    return "send success!";

  }




}

```



## 4.编写消费者

```java
package com.qf.kafka.spring.boot.demo.consumer;

import org.apache.kafka.clients.consumer.ConsumerRecord;
import org.apache.kafka.clients.consumer.ConsumerRecords;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.support.Acknowledgment;
import org.springframework.stereotype.Component;

@Component
public class MyConsumer {

  @KafkaListener(topics = "my-replicated-topic",groupId = "MyGroup1")
  public void listenGroup(ConsumerRecord<String, String> record, Acknowledgment ack) {
    String value = record.value();
    System.out.println(value);
    System.out.println(record);
    //手动提交offset
    ack.acknowledge();
  }

}

```

## 5.消费者中配置消费主题、分区和偏移量

```java
  @KafkaListener(groupId = "testGroup", topicPartitions = {
    @TopicPartition(topic = "topic1", partitions = {"0", "1"}),
    @TopicPartition(topic = "topic2", partitions = "0",
      partitionOffsets = @PartitionOffset(partition = "1", initialOffset = "100"))
  },concurrency = "3")//concurrency就是同组下的消费者个数，就是并发消费数，建议小于等于分区总数
  public void listenGroupPro(ConsumerRecord<String, String> record, Acknowledgment ack) {
    String value = record.value();
    System.out.println(value);
    System.out.println(record);
    //手动提交offset
    ack.acknowledge();
  }

```



# 九、kafka集群中的controller、rebalance、HW

## 1.controller

- 集群中谁来充当controller

每个broker启动时会向zk创建一个临时序号节点，获得的序号最小的那个broker将会作为集群中的controller，负责这么几件事：

- 当集群中有一个副本的leader挂掉，需要在集群中选举出一个新的leader，选举的规则是从isr集合中最左边获得。
- 当集群中有broker新增或减少，controller会同步信息给其他broker
- 当集群中有分区新增或减少，controller会同步信息给其他broker



## 2.rebalance机制

- 前提：消费组中的消费者没有指明分区来消费

- 触发的条件：当消费组中的消费者和分区的关系发生变化的时候

- 分区分配的策略：在rebalance之前，分区怎么分配会有这么三种策略

  - range：根据公示计算得到每个消费消费哪几个分区：前面的消费者是分区总数/消费者数量+1,之后的消费者是分区总数/消费者数量
  - 轮询：大家轮着来
  - sticky：粘合策略，如果需要rebalance，会在之前已分配的基础上调整，不会改变之前的分配情况。如果这个策略没有开，那么就要进行全部的重新分配。建议开启。

  

## 3.HW和LEO

LEO是某个副本最后消息的消息位置（log-end-offset）

HW是已完成同步的位置。消息在写入broker时，且每个broker完成这条消息的同步后，hw才会变化。在这之前消费者是消费不到这条消息的。在同步完成之后，HW更新之后，消费者才能消费到这条消息，这样的目的是防止消息的丢失。

![截屏2021-08-24 上午11.33.41](https://cdn.fengxianhub.top/resources-master/202210260102524.png)



# 十、Kafka中的优化问题

## 1.如何防止消息丢失

- 生产者：1）使用同步发送 2）把ack设成1或者all，并且设置同步的分区数>=2
- 消费者：把自动提交改成手动提交



## 2.如何防止重复消费

在防止消息丢失的方案中，如果生产者发送完消息后，因为网络抖动，没有收到ack，但实际上broker已经收到了。

此时生产者会进行重试，于是broker就会收到多条相同的消息，而造成消费者的重复消费。

怎么解决：

- 生产者关闭重试：会造成丢消息（不建议）

- 消费者解决非幂等性消费问题：

  所谓的幂等性：多次访问的结果是一样的。对于rest的请求（get（幂等）、post（非幂等）、put（幂等）、delete（幂等））

  解决方案：

  - 在数据库中创建联合主键，防止相同的主键 创建出多条记录
  - 使用分布式锁，以业务id为锁。保证只有一条记录能够创建成功

![截屏2021-08-24 上午11.48.06](https://cdn.fengxianhub.top/resources-master/202210260102527.png)

## 3.如何做到消息的顺序消费

- 生产者：保证消息按顺序消费，且消息不丢失——使用同步的发送，ack设置成非0的值。
- 消费者：主题只能设置一个分区，消费组中只能有一个消费者

kafka的顺序消费使用场景不多，因为牺牲掉了性能，但是比如rocketmq在这一块有专门的功能已设计好。



## 4.如何解决消息积压问题

![截屏2021-08-24 下午2.30.44](https://cdn.fengxianhub.top/resources-master/202210260102574.png)

### 1）消息积压问题的出现

消息的消费者的消费速度远赶不上生产者的生产消息的速度，导致kafka中有大量的数据没有被消费。随着没有被消费的数据堆积越多，消费者寻址的性能会越来越差，最后导致整个kafka对外提供的服务的性能很差，从而造成其他服务也访问速度变慢，造成服务雪崩。

### 2）消息积压的解决方案

- 在这个消费者中，使用多线程，充分利用机器的性能进行消费消息。
- 通过业务的架构设计，提升业务层面消费的性能。
- 创建多个消费组，多个消费者，部署到其他机器上，一起消费，提高消费者的消费速度
- 创建一个消费者，该消费者在kafka另建一个主题，配上多个分区，多个分区再配上多个消费者。该消费者将poll下来的消息，不进行消费，直接转发到新建的主题上。此时，新的主题的多个分区的多个消费者就开始一起消费了。——不常用

![截屏2021-08-24 下午2.43.04](https://cdn.fengxianhub.top/resources-master/202210260102530.png)





## 5.实现延时队列的效果

### 1）应用场景

订单创建后，超过30分钟没有支付，则需要取消订单，这种场景可以通过延时队列来实现



### 2）具体方案

![截屏2021-08-24 下午2.43.04](https://cdn.fengxianhub.top/resources-master/202210260102578.png)

- kafka中创建创建相应的主题
- 消费者消费该主题的消息（轮询）
- 消费者消费消息时判断消息的创建时间和当前时间是否超过30分钟（前提是订单没支付）
  - 如果是：去数据库中修改订单状态为已取消
  - 如果否：记录当前消息的offset，并不再继续消费之后的消息。等待1分钟后，再次向kafka拉取该offset及之后的消息，继续进行判断，以此反复。

# 十一、Kafka-eagle监控平台

## 1.搭建

- 去kafka-eagle官网下载压缩包

http://download.kafka-eagle.org/

- 分配一台虚拟机
- 虚拟机中安装jdk
- 解压缩kafka-eagle的压缩包
- 给kafka-eagle配置环境变量

```shell
export KE_HOME=/usr/local/kafka-eagle
export PATH=$PATH:$KE_HOME/bin
```

- 需要修改kafka-eagle内部的配置文件：`vim system-config.properties` 

  修改里面的zk的地址和mysql的地址

- 进入到bin中，通过命令来启动

```shell
./ke.sh start
```

## 2.平台的使用

![截屏2021-08-24 下午3.51.40](https://cdn.fengxianhub.top/resources-master/202210260102080.png)



