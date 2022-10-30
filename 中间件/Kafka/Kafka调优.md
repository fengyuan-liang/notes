# Kafka调优

## 1. 提高生吞吐量

### 1.1 提高生产者吞吐量

我们知道在send线程发送消息的时候不会马上发送，这里面有几个参数可以设置

- batch.size：批次大小，默认16k
- linger.ms：等待时间，默认为0，需要修改为5-100ms
- compression.type：压缩方式使用snappy（可选：gzip、snappy、lz4、zstd）
- RecordAccumulator：缓存区大小，如果分区数量过多（假设有一万个）可以调大一些，例如64M

**API方式调整**

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

- 设置压缩方式

```java
// 设置压缩方式为snappy
props.put(ProducerConfig.COMPRESSION_TYPE_CONFIG, "snappy");
```

SpringBoot配置文件调整

```yaml
spring:
  kafka:
    bootstrap-servers: 172.16.253.38:9092,172.16.253.38:9093,172.16.253.38:9094
    producer: # 生产者
      retries: 3 # 设置大于0的值，则客户端会将发送失败的记录重新发送
      batch-size: 16384 # 每次发送时多少一批次 这里设置的是16kb
      buffer-memory: 33554432 # 设置内存缓存区32Mb
      linger.ms: 10 # 这个配置好像没有提示，可能是笔者kafka版本比较低
      compression-type: snappy # 使用snappy压缩发送的数据
      acks: 1 # leader收到消息后就返回ack
      # 指定消息key和消息体的编解码方式
      key-serializer: org.apache.kafka.common.serialization.StringSerializer
      value-serializer: org.apache.kafka.common.serialization.StringSerializer
```

### 1.2 提高消费者吞吐量

这里也有两个参数可以设置

- max.poll.records：每一次poll拉取条数，默认500条
- 长轮询时间，默认1秒
- poll消费时间，默认30s，可以适当设置大一些，防止消费者被踢出集群导致rebalance
- 消费者心跳时间，默认一秒，可以适当调大一些
- 设置并发数：concurrency = "3" ，concurrency就是同组下的消费者个数，就是并发消费数，建议小于等于分区总数

**API方式**

```java
//一次poll最大拉取消息的条数，可以根据消费速度的快慢来设置
props.put(ConsumerConfig.MAX_POLL_RECORDS_CONFIG, 500);
// 设置长轮询时间为1s
ConsumerRecords<String, String> records = consumer.poll(Duration.ofMillis(1000));
// 如果两次poll的时间如果超出了30s的时间间隔，kafka会认为其消费能力过弱，将其踢出消费组。将分区分配给其他消费者。即rebalance
props.put(ConsumerConfig.MAX_POLL_INTERVAL_MS_CONFIG, 30 * 1000);
// 心跳时间
 props.put(ConsumerConfig.HEARTBEAT_INTERVAL_MS_CONFIG, 1000);
```

**SpringBoot方式**

```yaml
spring:
  kafka:
    bootstrap-servers: 172.16.253.38:9092,172.16.253.38:9093,172.16.253.38:9094
    # 消费者
    consumer:
      group-id: default-group # 组内单播，组间广播
      enable-auto-commit: false # 关闭消费自动提交
      auto-offset-reset: earliest # 新消费组启动会从头信息消费
      key-deserializer: org.apache.kafka.common.serialization.StringDeserializer
      value-deserializer: org.apache.kafka.common.serialization.StringDeserializer
      max-poll-records: 500 # 每次长轮询拉取多少条消息
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
```

```java
@KafkaListener(groupId = "testGroup",
               topicPartitions = {
                   @TopicPartition(topic = "topic1", partitions = {"0", "1"}),
                   @TopicPartition(topic = "topic2", partitions = "0", partitionOffsets = @PartitionOffset(partition = "1", initialOffset = "100"))
               }, concurrency = "3") //concurrency就是同组下的消费者个数，就是并发消费数，建议小于等于分区总数
public void listenGroupPro(ConsumerRecord<String, String> record, Acknowledgment ack) {
    String value = record.value();
    System.out.println(value);
    System.out.println(record);
    //手动提交offset
    ack.acknowledge();
}
```



## 2. 数据可靠性

### 2.1 防止丢数据

- 生产者：1）使用同步发送 2）把ack设成1或者all，并且设置同步的分区数>=2
- 消费者：把自动提交改成手动提交

### 2.2 如何防止重复消费

在防止消息丢失的方案中，如果生产者发送完消息后，因为网络抖动，没有收到ack，但实际上broker已经收到了。

此时生产者会进行重试，于是broker就会收到多条相同的消息，而造成消费者的重复消费。

怎么解决：

- 生产者关闭重试：会造成丢消息（不建议）

- 消费者解决非幂等性消费问题：

  所谓的幂等性：多次访问的结果是一样的。对于rest的请求（get（幂等）、post（非幂等）、put（幂等）、delete（幂等））

  解决方案：

  - 在数据库中创建联合主键，防止相同的主键 创建出多条记录
  - 使用分布式锁，以业务id为锁。保证只有一条记录能够创建成功

### 2.3 保证消息的顺序消费

其实我们知道在发送消息的时候我们可以通过设置key来指定发送的分区，所以首先我们一定要指定key然后发到同一个分区

![image-20221030160545934](https://cdn.fengxianhub.top/resources-master/202210301605482.png)

- 生产者：使用同步的发送，并且通过设置key指定路由策略，只发送到一个分区中；ack设置成非0的值。
- 消费者：主题只能设置一个分区，消费组中只能有一个消费者；不要设置异步线程防止异步导致的乱序，或者设置一个阻塞队列进行异步消费

kafka的顺序消费使用场景不多，因为牺牲掉了性能，但是比如rocketmq在这一块有专门的功能已设计好。

### 2.4 如何解决消息积压问题

#### 2.4.1 消息积压问题的出现

消息的消费者的消费速度远赶不上生产者的生产消息的速度，导致kafka中有大量的数据没有被消费。随着没有被消费的数据堆积越多，消费者寻址的性能会越来越差，最后导致整个kafka对外提供的服务的性能很差，从而造成其他服务也访问速度变慢，造成服务雪崩。

#### 2.4.2 消息积压的解决方案

- 在这个消费者中，使用多线程，充分利用机器的性能进行消费消息。
- 通过业务的架构设计，提升业务层面消费的性能。
- 创建多个消费组，多个消费者，部署到其他机器上，一起消费，提高消费者的消费速度
- 创建一个消费者，该消费者在kafka另建一个主题，配上多个分区，多个分区再配上多个消费者。该消费者将poll下来的消息，不进行消费，直接转发到新建的主题上。此时，新的主题的多个分区的多个消费者就开始一起消费了。——不常用

![截屏2021-08-24 下午2.43.04](https://cdn.fengxianhub.top/resources-master/202210260102530.png)









## 附录：Kafka常用配置

![Kafka常用配置](https://cdn.fengxianhub.top/resources-master/202210301651683.png)