# Redis学习笔记

![](https://cdn.fengxianhub.top/resources-master/202202072257657.png)

***Redis*** 是典型的 ***NoSQL*** 数据库。

***redis官网***：https://redis.io/download 

## 1. Redis简介

***Redis*** 是一个开源的 ***key-value*** 存储系统。

和 ***Memcached*** 类似，它支持存储的 ***value*** 类型相对更多，包括 ***string、list、set、zset、sorted set、hash***。

这些数据类型都支持 ***push/pop、add/remove*** 及取交集并集和差集及更丰富的操作，而且这些操作都是原子性的。

在此基础上，***Redis*** 支持各种不同方式的排序。

与 ***memcached***一样，为了保证效率，数据都是缓存在内存中。

区别的是 ***Redis*** 会周期性的把更新的数据写入磁盘或者把修改操作写入追加的记录文件。

并且在此基础上实现了***master-slave*** （主从）同步和单线程 + ***IO*** 多路复用。

## 2.在Linux上安装Redis

安装 ***C*** 语言的编译环境

```css
 yum install centos-release-scl scl-utils-build
 yum install -y devtoolset-8-toolchain
 scl enable devtoolset-8 bash
```

通过 ***wget*** 下载

```css
 wget https://download.redis.io/releases/redis-6.2.6.tar.gz
 
 // 下载路径：/opt
```

解压至当前目录

```shell
 tar -zxvf redis-6.2.6.tar.gz 
```

解压完成后进入目录

```shell
 cd redis-6.2.6
```

在当前目录下执行 ***make***

```shell
 make && make install
```

默认安装在 `/usr/local/bin`

![img](https://cdn.fengxianhub.top/resources-master/202202072318970.png)

```css
 redis-benchmark：性能测试工具，可以在自己本子运行，看看自己本子性能如何
 redis-check-aof：修复有问题的AOF文件，rdb和aof后面讲
 redis-check-dump：修复有问题的dump.rdb文件
 redis-sentinel：Redis集群使用
 redis-server：Redis服务器启动命令
 redis-cli：客户端，操作入口
```



前台启动：***/usr/local/bin*** 目录下启动 ***redis***

```css
 redis-server(前台启动)
```

ab -c 100 -n 2000 -k 

后台启动：

- 安装 ***redis*** 的目录 ***/opt/redis-6.2.6*** 中将 ***redis.conf*** 复制到任意一个文件夹下

  ```css
   cp redis.conf /etc/redis.conf
   // 将redis.conf复制到/etc/下
  ```

- 修改 ***/etc/redis.conf*** 配置文件

  ```css
   vim redis.conf
   
   # daemonize no 修改为 daemonize yes
  ```

  ![img](https://cdn.fengxianhub.top/resources-master/202202072318890.png)

- ***/usr/local/bin*** 目录下启动 ***redis***

  ```css
   redis-server /etc/redis.conf
  ```

```java
docker run --name nginx -p 80:80 -v D:\dockercontainers\nginx\nginx.conf:/etc/nginx/nginx.conf   -v D:\dockercontainers\nginx\html:/usr/share/nginx/html -d nginx

```



关闭 ***redis***

- ***kill*** 进程
- 命令 ***shutdown***



## 3. Redis value的五大基本数据类型

>在Redis中存储的```key```都是```String```类型，在Redis中```key```和```value```长度最大均为```512M```

**key操作：**

- `keys *`：查看当前库所有 ***key***  
- `exists key`：判断某个 ***key*** 是否存在

- `type key`：查看你的 ***key*** 是什么类型

- `del key` ：删除指定的 ***key*** 数据

- `unlink key`：根据 ***value*** 选择非阻塞删除，仅将 ***keys*** 从 ***keyspace*** 元数据中删除，真正的删除会在后续异步操作

- `expire key 10` ：为给定的 ***key*** 设置过期时间

- `ttl key`：查看还有多少秒过期，-1表示永不过期，-2表示已过期
- `select`：命令切换数据库

- `dbsize`：查看当前数据库的 ***key*** 的数量
- `flushdb`：清空当前库

- `flushall`：通杀全部库

<hr>

### 3.1 String类型

>String 类型是`二进制安全`的。意味着 Redis 的 `string` 可以包含任何数据。比如 jpg 图片 或者序列化的对象。

**常用操作：**

- `set <key><value>`：添加键值对
- `get <key>`：查询对应键值
- `append <key><value>`：将给定的 ***\<value>*** 追加到原值的末尾
- `strlen <key>`：获得值的长度
- `setnx <key><value>`：只有在 ***key*** 不存在时，设置 ***key*** 的值
- `incr <key>`：将 ***key*** 中储存的数字值增 1，只能对数字值操作，如果为空，新增值为 1（**<u>具有原子性</u>**）
- `decr <key>`：将 ***key*** 中储存的数字值减 1，只能对数字值操作，如果为空，新增值为 -1
- `incrby/decrby <key><步长>`：将 ***key*** 中储存的数字值增减。自定义步长
- `mset <key1><value1><key2><value2>` ：同时设置一个或多个 ***key-value*** 对 
- `mget <key1><key2><key3>...`：同时获取一个或多个 ***value*** 
- `msetnx <key1><value1><key2><value2>... `：同时设置一个或多个 ***key-value*** 对，当且仅当所有给定 ***key*** 都不存在	
- `getrange <key><起始位置><结束位置>`：获得值的范围
- `setrange <key><起始位置><value>`：用 ***\<value>*** 覆写 ***\<key>*** 所储存的字符串值
- `setex <key><过期时间><value>`：设置键值的同时，设置过期时间，单位秒。
- `getset <key><value>`：以新换旧，设置了新值同时获得旧值。



**原子性**

所谓 **原子** 操作是指不会被线程调度机制打断的操作；

这种操作一旦开始，就一直运行到结束，中间不会有任何 ***context switch*** （切换到另一个线程）。

- 在单线程中， 能够在单条指令中完成的操作都可以认为是"原子操作"，因为中断只能发生于指令之间。

- 在多线程中，不能被其它进程（线程）打断的操作就叫原子操作。

***Redis*** 单命令的原子性主要得益于 ***Redis*** 的单线程。



**String数据结构**

>String 的数据结构为`简单动态字符串`(Simple Dynamic String,缩写 SDS)。是可以修改的字符串，内部结构实现上类似于 ***Java*** 的 ***ArrayList***，采用预分配冗余空间的方式来减少内存的频繁分配.

<img src="https://cdn.fengxianhub.top/resources-master/202202081021017.png" style="zoom:50%;" />

<hr>

### 3.2 列表（List）

***Redis*** 列表是简单的字符串列表，按照插入顺序排序。你可以添加一个元素到列表的头部（左边）或者尾部（右边）。

它的底层实际是个双向链表，对两端的操作性能很高，通过索引下标的操作中间的节点性能会较差。

<img src="https://cdn.fengxianhub.top/resources-master/202202081035132.png" style="zoom:50%;" />

**常用命令：**

- `lpush/rpush <key><value1><value2><value3> ....`： 从左边/右边插入一个或多个值。

  ```css
  lpush k1 v1 v2 v3
  lrange k1 0 -1
  输出：v3 v2 v1
  
  rpush k1 v1 v2 v3
  rrange k1 0 -1
  输出：v1 v2 v3
  ```

- `lpop/rpop <key>`：从左边/右边吐出一个值。`值在减少`，值在键在，值光键亡。
- `rpoplpush <key1><key2>`：从 ***\<key1>*** 列表右边吐出一个值，插到 ***\<key2>*** 列表左边。
- `lrange <key><start><stop>`：按照索引下标获得元素（从左到右），`lrange key 0 -1`表示查看所有值
- `lrange mylist 0 -1  0`：左边第一个，-1右边第一个，（0 -1表示获取所有）

- `lindex <key><index>`：按照索引下标获得元素（从左到右）
- `llen <key>`：获得列表长度  

- `linsert <key> before/after <value><newvalue>`：在 ***\<value>*** 的前面/后面插入 ***\<newvalue>*** 插入值

- `lrem <key><n><value>`：从左边删除 ***n*** 个 ***value***（从左到右）

- `lset<key><index><value>`：将列表 ***key*** 下标为 ***index*** 的值替换成 ***value***



**Redis List 数据结构:**

***List*** 的数据结构为快速链表 ***quickList***。

首先在`列表元素较少`的情况下会使用一块连续的内存存储，这个结构是 ***ziplist***，也即是`压缩列表`。

它将所有的元素紧挨着一起存储，分配的是一块连续的内存。

当数据量比较多的时候才会改成 ***quicklist***。

因为普通的链表需要的附加指针空间太大，会比较浪费空间。比如这个列表里存的只是 ***int*** 类型的数据，结构上还需要两个额外的指针 ***prev*** 和 ***next***。

***Redis*** 将链表和 ***ziplist*** 结合起来组成了 ***quicklist***。也就是将多个 ***ziplist*** 使用双向指针串起来使用。这样既满足了快速的插入删除性能，又不会出现太大的空间冗余。

<img src="https://cdn.fengxianhub.top/resources-master/202202081044777.png" style="zoom:50%;" />



<hr>

### 3.3 集合（set）

***Set*** 对外提供的功能与 ***List*** 类似列表的功能，特殊之处为：`set为无序、无重`

当需要存储一个列表数据，又不希望出现重复数据时，***Set*** 是一个很好的选择，并且 ***Set*** 提供了判断某个成员是否在一个 ***Set*** 集合内的重要接口，这个也是 ***List*** 所不能提供的。

***Redis*** 的 ***Set*** 是 ***String*** 类型的无序集合。它底层其实是一个 ***value*** 为 ***null*** 的 ***hash*** 表，所以添加，删除，查找的复杂度都是 ***O(1)***。

一个算法，随着数据的增加，执行时间的长短，如果是 ***O(1)***，数据增加，查找数据的时间不变。

**常用命令：**

- `sadd <key><value1><value2> ..... `：将一个或多个 ***member*** 元素加入到集合 ***key*** 中，已经存在的 ***member*** 元素将被忽略

- `smembers <key>`：取出该集合的所有值。

- `sismember <key><value>`：判断集合 ***\<key>*** 是否为含有该 ***\<value>*** 值，有返回 1，没有返回 0

- `scard<key>`：返回该集合的元素个数。

- `srem <key><value1><value2> ....`：删除集合中的某个元素

- `spop <key>`：随机从该集合中吐出一个值
- `srandmember <key><n>`：随机从该集合中取出 ***n*** 个值，不会从集合中删除 

- `smove <source><destination>value`：把集合中一个值从一个集合移动到另一个集合

- `sinter <key1><key2>`：返回两个集合的交集元素

- `sunion <key1><key2>`：返回两个集合的并集元素
- `sdiff <key1><key2>`：返回两个集合的差集元素（***key1*** 中的，不包含 ***key2*** 中的）



**数据结构**

***Set*** 数据结构是字典，字典是用哈希表实现的。

Java 中 HashSet 的内部实现使用的是 `HashMap`，只不过所有的 value 都指向同一个对象。 Redis 的 set 结构也是一样，它的内部也使用 hash 结构，所有的 value 都指向同一个内部值。

<hr>

### 3.4 ⭐哈希（hash）

***Redis hash*** 是一个键值对集合。

***Redis hash*** 是一个 ***String*** 类型的 ***field*** 和 ***value*** 的映射表，***hash*** `特别适合用于存储对象`。类似 Java 里面的 Map<String,Object>

![image-20220208112708716](https://cdn.fengxianhub.top/resources-master/202202081127594.png)

<h2>如何将对象存到Redis中呢？</h2>

>**第一种**：`将对象转换成一个JSON字符串`，例如上图所示：user={id=1,name="张三",age=20}

**缺点**：无法直接操作这个对象，例如想将age加一，需要先反序列化 改好后再序列化回去。开销较大。太复杂，一般不用

>**第二种**：通过用户key：id+对象属性标签，value：属性的方式存储
>
>![image-20220208113436681](https://cdn.fengxianhub.top/resources-master/202202081134748.png)

**优点**：方便对对象中的属性进行操作

**缺点**：数据太过分散，数据一多就显得十分混乱，一般我们也不用

>🚀**第三种**：通过hash映射存储，key：id，value：<field,value>的形式
>
>![image-20220208115418767](https://cdn.fengxianhub.top/resources-master/202202081154843.png)

第三种方式是最适合存储对象的

![image-20220208121355632](https://cdn.fengxianhub.top/resources-master/202202081213693.png)



**常用命令：**

- `hset <key><field><value>`：给 ***\<key>*** 集合中的 ***\<field>*** 键赋值 ***\<value>***
- `hget <key1><field>`：从 ***\<key1>*** 集合 ***\<field>*** 取出 ***value*** 
- `hgetall key`:拿到所有的域和值
- `hmset <key1><field1><value1><field2><value2>...`： 批量设置 ***hash*** 的值
- `hexists <key1><field>`：查看哈希表 ***key*** 中，给定域 ***field*** 是否存在
- `hkeys <key>`：列出该 ***hash*** 集合的所有 ***field***
- `hvals <key>`：列出该 ***hash*** 集合的所有 ***value***
- `hincrby <key><field><increment>`：为哈希表 ***key*** 中的域 ***field*** 的值加上增量 1  -1
- `hsetnx <key><field><value>`：将哈希表 ***key*** 中的域 ***field*** 的值设置为 ***value*** ，当且仅当域 ***field*** 不存在

**数据结构**:

***Hash*** 类型对应的数据结构是两种：***ziplist***（压缩列表），***hashtable***（哈希表）。

当 ***field-value*** 长度较短且个数较少时，使用 ***ziplist***，否则使用 ***hashtable***。

<hr>

### 3.5 Zset（有序集合）

***Redis*** 有序集合 ***zset*** 与普通集合 ***set*** 非常相似，是一个`没有重复元素`的字符串集合。

不同之处是有序集合的每个成员都关联了一个评分（***score***）,这个评分（***score***）被用来按照从最低分到最高分的方式排序集合中的成员。集合的成员是唯一的，但是评分可以是重复的。

因为元素是有序的，所以可以很快的根据评分（***score***）或者次序（***position***）来获取一个范围的元素。

访问有序集合的中间元素也是非常快的，因此能够使用有序集合作为一个没有重复成员的智能列表。

**举个栗子：**

![image-20220208122038372](https://cdn.fengxianhub.top/resources-master/202202081220461.png)

**常用命令：**

- `zadd <key><score1><value1><score2><value2>…`：将一个或多个 ***member*** 元素及其 ***score*** 值加入到有序集 ***key*** 当中
- `zrange <key><start><stop> [WITHSCORES]  `：返回有序集 ***key*** 中，下标在 ***\<start>\<stop>*** 之间的元素

- 当带 ***WITHSCORES***，可以让分数一起和值返回到结果集

- `zrangebyscore key min max [withscores] [limit offset count]`：返回有序集 ***key*** 中，所有 ***score*** 值介于 ***min*** 和 ***max*** 之间（包括等于 ***min*** 或 ***max*** ）的成员。有序集成员按 ***score*** 值递增（从小到大）次序排列。

- `zrevrangebyscore key max min [withscores] [limit offset count] `：同上，改为从大到小排列

- `zincrby <key><increment><value>`：为元素的 ***score*** 加上增量
- `zrem <key><value>`：删除该集合下，指定值的元素

- `zcount <key><min><max>`：统计该集合，分数区间内的元素个数 

- `zrank <key><value>`：返回该值在集合中的排名，从 0 开始。



**数据结构**

***SortedSet（zset）***是 ***Redis*** 提供的一个非常特别的数据结构，一方面它等价于 ***Java*** 的数据结构 ***Map<String, Double>***，可以给每一个元素 ***value*** 赋予一个权重 ***score***，另一方面它又类似于 ***TreeSet***，内部的元素会按照权重 ***score*** 进行排序，可以得到每个元素的名次，还可以通过 ***score*** 的范围来获取元素的列表。

***zset*** 底层使用了两个数据结构

- ***hash***，***hash*** 的作用就是关联元素 ***value*** 和权重 ***score***，保障元素 ***value*** 的唯一性，可以通过元素 ***value*** 找到相应的 ***score*** 值
- 跳跃表，跳跃表的目的在于给元素 ***value*** 排序，根据 ***score*** 的范围获取元素列表

<hr>

## 4.Redis6新数据类型

### 4.1 Bitmaps

现代计算机用二进制（位） 作为信息的基础单位， 1 个字节等于 8 位， 例如“abc” 字符串是由 3 个字节组成， 但实际在计算机存储时将其用二进制表示， “abc”分别 对应的 ASCII 码分别是 97、 98、 99， 对应的二进制分别是 01100001、 01100010 和 01100011，如下图

<img src="https://cdn.fengxianhub.top/resources-master/202202081244134.png" alt="" style="zoom:40%;" />

合理地使用操作位能够有效地提高内存使用率和开发效率。

Redis 提供了 Bitmaps 这个“数据类型”可以实现对位的操作： 

（1） Bitmaps 本身不是一种数据类型， 实际上它就是字符串（key-value） ， 但是它可以对字符串的位进行操作。 

（2） Bitmaps 单独提供了一套命令， 所以在 Redis 中使用Bitmaps 和使用字 符串的方法不太相同。 可以把 Bitmaps 想象成一个以位为单位的数组， 数组的每个单元只能存储 0 和 1， 数组的下标在 Bitmaps 中叫做偏移量

![image-20220208124729044](https://cdn.fengxianhub.top/resources-master/202202081247112.png)

**常用命令：**

- `setbit`设置 Bitmaps 中某个偏移量的值（0 或 1)
- `getbit`获取 Bitmaps中某个偏移量的值
- `bitcount[start end]` 统计字符串从 start 字节到 end 字节比特值为 1 的数量
- `bitop and(or/not/xor)  [key…]`，bitop 是一个复合操作， 它可以做多个 Bitmaps 的 and（交集） 、 or（并集） 、 not （非） 、 xor（异或） 操作并将结果保存在 destkey

### 4.2 HyperLogLog

Redis HyperLogLog 是用来做基数统计的算法，HyperLogLog 的优点是，在输 入元素的数量或者体积非常非常大时，计算基数所需的空间总是固定的、并且是很小 的。

### 4.3 Geospatial

Redis 3.2 中增加了对 GEO 类型的支持。GEO，Geographic，地理信息的缩写。 该类型，就是元素的 2 维坐标，在地图上就是经纬度。redis 基于该类型，提供了经纬 度设置，查询，范围查询，距离查询，经纬度 Hash 等常见操作

## 5. Redis的发布与订阅



***Redis*** 发布订阅（ ***pub/sub*** ）是一种消息通信模式：发送者（ ***pub*** ）发送消息，订阅者（ ***sub*** ）接收消息。

***Redis*** 客户端可以订阅任意数量的频道。



1. ​	客户端可以订阅频道

<img src="https://cdn.fengxianhub.top/resources-master/202202081238467.png" alt="" style="zoom:50%;" />



2. 当给这个频道发布消息后，消息就会发送给订阅的客户端

<img src="https://gitee.com/tsuiraku/typora/raw/master/img/截屏2021-10-22 14.21.40.png" style="zoom:50%;" />

```css
subscribe channel # 订阅频道

publish channel hello # 频道发送信息
```



## 6.Java操作Redis——Jedis

>Jedis是Java操作Redis的一种方式，就像JDBC一样

我们这里直接SpringBoot整合Redis，一步到位！

### 6.1 引入坐标依赖

```xml
<!-- redis -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-data-redis</artifactId>
</dependency>
<!-- 对象池，使用redis存储Object时必须引入 -->
<dependency>
    <groupId>org.apache.commons</groupId>
    <artifactId>commons-pool2</artifactId>
</dependency>
```

### 6.2 yml配置文件

```yaml
spring:
  #Redis
  redis:
    host: 你的IP地址
    port: 端口号
    password: volunteer
    jedis:
      pool:
      	#连接池最大连接数（使用负值表示没有限制）
        max-active: 8
        #最大阻塞等待时间(负数表示没限制)
        max-wait: -1
        #连接池中的最大空闲连接
        max-idle: 500
        #连接池中的最小空闲连接
        min-idle: 0
```

### 6.3 添加配置文件















