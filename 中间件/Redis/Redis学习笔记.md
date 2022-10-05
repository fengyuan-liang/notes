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

## 2. 在Linux上安装Redis

docker安装

```java
docker run -d \
--restart=always \
--log-opt max-size=100m \
--log-opt max-file=2 \
-p 6379:6379 \
--name redis \
-d redis \
--appendonly yes  \
--requirepass 114d0143b2c447ca975647ddcf81f6b0
```

requirepass表示设置密码

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

- 后台启动redis
  
  ```java
   redis-server /etc/redis.conf &
  ```

关闭 ***redis***

- ***kill*** 进程
- 命令 ***shutdown***

## 3. Redis value的五大基本数据类型

> 在Redis中存储的```key```都是```String```类型，在Redis中```key```和```value```长度最大均为```512M```

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

> String 类型是`二进制安全`的。意味着 Redis 的 `string` 可以包含任何数据。比如 jpg 图片 或者序列化的对象。

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

> String 的数据结构为`简单动态字符串`(Simple Dynamic String,缩写 SDS)。是可以修改的字符串，内部结构实现上类似于 ***Java*** 的 ***ArrayList***，采用预分配冗余空间的方式来减少内存的频繁分配.

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

> **第一种**：`将对象转换成一个JSON字符串`，例如上图所示：user={id=1,name="张三",age=20}

**缺点**：无法直接操作这个对象，例如想将age加一，需要先反序列化 改好后再序列化回去。开销较大。太复杂，一般不用

> **第二种**：通过用户key：id+对象属性标签，value：属性的方式存储
> 
> ![image-20220208113436681](https://cdn.fengxianhub.top/resources-master/202202081134748.png)

**优点**：方便对对象中的属性进行操作

**缺点**：数据太过分散，数据一多就显得十分混乱，一般我们也不用

> 🚀**第三种**：通过hash映射存储，key：id，value：<field,value>的形式
> 
> ![image-20220208115418767](https://cdn.fengxianhub.top/resources-master/202202081154843.png)

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

**跳跃表**

简介

有序集合在生活中比较常见，例如根据成绩对学生排名，根据得分对玩家排名等。对于有序集合的底层实现，可以用数组、平衡树、链表等。数组不便元素的插入、删除；平衡树或红黑树虽然效率高但结构复杂；链表查询需要遍历所有效率低。Redis 采用的是跳跃表，跳跃表效率堪比红黑树，实现远比红黑树简单。

实例

对比有序链表和跳跃表，从链表中查询出 51：

> 有序链表

![image-20220716085414884](https://cdn.fengxianhub.top/resources-master/202207160855961.png)

要查找值为 51 的元素，需要从第一个元素开始依次查找、比较才能找到。共需要 6 次比较。

> 跳跃表

![image-20220716085414884](https://cdn.fengxianhub.top/resources-master/202207160854432.png)

- 从第 2 层开始，1 节点比 51 节点小，向后比较
- 21 节点比 51 节点小，继续向后比较，后面就是 NULL 了，所以从 21 节点向下到第 1 层
- 在第 1 层，41 节点比 51 节点小，继续向后，61 节点比 51 节点大，所以从 41 向下
- 在第 0 层，51 节点为要查找的节点，节点被找到，共查找 4 次

**从此可以看出跳跃表比有序链表效率要高**

<hr>

## 4.Redis6新数据类型

### 4.1 Bitmaps

现代计算机用二进制（位） 作为信息的基础单位， 1 个字节等于 8 位， 例如“abc” 字符串是由 3 个字节组成， 但实际在计算机存储时将其用二进制表示， “abc”分别 对应的 ASCII 码分别是 97、 98、 99， 对应的二进制分别是 01100001、 01100010 和 01100011，如下图

<img src="https://cdn.fengxianhub.top/resources-master/202202081244134.png" alt="" style="zoom:40%;" />

合理地使用操作位能够有效地提高内存使用率和开发效率。

Redis 提供了 Bitmaps 这个“数据类型”可以实现对位的操作： 

（1） Bitmaps 本身不是一种数据类型， 实际上它就是字符串（key-value） ， 但是它可以对字符串的位进行操作。 

（2） Bitmaps 单独提供了一套命令， 所以在 Redis 中使用Bitmaps 和使用字符串的方法不太相同。 可以把 Bitmaps 想象成一个以位为单位的数组， 数组的每个单元只能存储 0 和 1， 数组的下标在 Bitmaps 中叫做偏移量

![image-20220208124729044](https://cdn.fengxianhub.top/resources-master/202202081247112.png)

**常用命令：**

- `setbit`设置 Bitmaps 中某个偏移量的值（0 或 1)
- `getbit`获取 Bitmaps中某个偏移量的值
- `bitcount[start end]` 统计字符串从 start 字节到 end 字节比特值为 1 的数量
- `bitop and(or/not/xor)  [key…]`，bitop 是一个复合操作， 它可以做多个 Bitmaps 的 and（交集） 、 or（并集） 、 not （非） 、 xor（异或） 操作并将结果保存在 destkey

> Bitmaps 与 set 对比

假设网站有 1 亿用户， 每天独立访问的用户有 5 千万， 如果每天用集合类型和 Bitmaps 分别存储活跃用户可以得到表：

```java
# set 和 Bitmaps 存储一天活跃用户对比
数据类型    每个用户 id 占用空间    需要存储的用户量    全部内存量
集合          64 位                  50000000            64 位 * 50000000 = 400MB
Bitmaps       1 位                   100000000         1 位 * 100000000 = 12.5MB
```

很明显， 这种情况下使用 Bitmaps 能节省很多的内存空间， 尤其是随着时间推移节省的内存还是非常可观的。

```java
# set 和 Bitmaps 存储独立用户空间对比
数据类型    一天        一个月        一年
集合         400MB       12GB        144GB
Bitmaps      12.5MB    375MB      4.5GB
```

但 Bitmaps 并不是万金油， 假如该网站每天的独立访问用户很少， 例如只有 10 万（大量的僵尸用户） ， 那么两者的对比如下表所示， 很显然， 这时候使用 Bitmaps 就不太合适了， 因为基本上大部分位都是 0

```java
# set 和 Bitmaps 存储一天活跃用户对比（用户比较少）
数据类型    每个 userid 占用空间         需要存储的用户量        全部内存量
集合         64 位                      100000              64 位 * 100000 = 800KB
Bitmaps      1 位                       100000000           1 位 * 100000000 = 12.5MBa
```

### 4.2 HyperLogLog

Redis HyperLogLog 是用来做基数统计的算法，HyperLogLog 的优点是，在输入元素的数量或者体积非常非常大时，计算基数所需的空间总是固定的、并且是很小的。

在工作当中，我们经常会遇到与统计相关的功能需求，比如**统计网站 PV**（PageView 页面访问量），可以使用 Redis 的 `incr、incrby` 轻松实现。但像 UV（UniqueVisitor 独立访客）、独立 IP 数、搜索记录数等需要去重和计数的问题如何解决？这种求集合中不重复元素个数的问题称为基数问题。

解决基数问题有很多种方案：

- 数据存储在 MySQL 表中，使用 distinct count 计算不重复个数。
- 使用 Redis 提供的 hash、set、bitmaps 等数据结构来处理。

以上的方案结果精确，但随着数据不断增加，导致占用空间越来越大，对于非常大的数据集是不切实际的。能否能够降低一定的精度来平衡存储空间？Redis 推出了 HyperLogLog。

- Redis HyperLogLog 是用来做基数统计的算法，HyperLogLog 的优点是：**在输入元素的数量或者体积非常非常大时，计算基数所需的空间总是固定的、并且是很小的。**
- 在 Redis 里面，每个 HyperLogLog 键只需要花费 12 KB 内存，就可以计算接近 2^64 个不同元素的基数。这和计算基数时，元素越多耗费内存就越多的集合形成鲜明对比。
- 但是，因为 HyperLogLog 只会根据输入元素来计算基数，而不会储存输入元素本身，所以 HyperLogLog 不能像集合那样，返回输入的各个元素。

> 什么是基数？

比如数据集 {1, 3, 5, 7, 5, 7, 8}，那么这个数据集的基数集为 {1, 3, 5 ,7, 8}，基数个数 (不重复元素) 为 5。 基数估计就是在误差可接受的范围内，快速计算基数。

### 4.3 Geospatial

Redis 3.2 中增加了对 GEO 类型的支持。GEO，Geographic，地理信息的缩写。 该类型，就是元素的 2 维坐标，在地图上就是经纬度。redis 基于该类型，提供了经纬度设置，查询，范围查询，距离查询，经纬度 Hash 等常见操作

## 5. Redis的发布与订阅

***Redis*** 发布订阅（ ***pub/sub*** ）是一种消息通信模式：发送者（ ***pub*** ）发送消息，订阅者（ ***sub*** ）接收消息。

***Redis*** 客户端可以订阅任意数量的频道。

1. ​    客户端可以订阅频道

<img src="https://cdn.fengxianhub.top/resources-master/202202081238467.png" alt="" style="zoom:50%;" />

2. 当给这个频道发布消息后，消息就会发送给订阅的客户端

![image-20220716090939025](https://cdn.fengxianhub.top/resources-master/202207160909123.png)

```css
subscribe channel # 订阅频道
publish channel hello # 频道发送信息
```

### 5.1 发布订阅的简单实现

>订阅命令： subscribe `频道key` ，可以订阅多个频道，用空格隔开
>
>例如：定订阅一个key为channel1的频道，`subscribe channel1`

![image-20221002155040631](https://cdn.fengxianhub.top/resources-master/202210021550964.png)

订阅成功后当前客户端就会一直监听`channel`里面值的变化，当有消息时就会进行反馈

>推送消息命令： publish channel名称 消息 ，返回值表示有几个订阅者
>
>例如：给`channel1`发送消息hello，`publish channel1 hello`

![image-20221002155632203](https://cdn.fengxianhub.top/resources-master/202210021556407.png)

>当然我们还可以用命令`psubscribe`给多个`channel`发送消息，redis支持通配符`*`来匹配channel进行发送
>
>例如：
>
>- ` it*` 匹配所有以 it 开头的频道( it.news 、 it.blog 、it.tweets 等等)
>- `news.*` 匹配所有以 news. 开头的频道( news.it 、 news.global.today 等等)

总结一下：Redis提供了如下6个命令来支持该功能

| **序号** | **命令**                                  | **描述**                         |
| -------- | ----------------------------------------- | -------------------------------- |
| 1        | PSUBSCRIBE pattern [pattern …]            | 订阅一个或多个符合给定模式的频道 |
| 2        | PUBSUB subcommand [argument [argument …]] | 查看订阅与发布系统状态           |
| 3        | PUBLISH channel message                   | 将消息发送到指定的频道           |
| 4        | PUNSUBSCRIBE [pattern [pattern …]]        | 退订所有给定模式的频道           |
| 5        | SUBSCRIBE channel [channel …]             | 订阅给定的一个或多个频道的信息   |
| 6        | UNSUBSCRIBE [channel [channel …]]         | 指退订给定的频道                 |



## 6. Java操作Redis——Jedis

> Jedis是Java操作Redis的一种方式，就像JDBC一样

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

## 7. Redis 事务、锁机制秒杀

### 7.1 Redis 事务定义

Redis 事务是一个单独的隔离操作：事务中的所有命令都会序列化、按顺序地执行。事务在执行的过程中，不会被其他客户端发送来的命令请求所打断。

Redis 事务的主要作用就是**串联多个命令**防止别的命令插队。

### 7.2 Multi、Exec、discard

Redis 事务中有 Multi、Exec 和 discard 三个指令，在 Redis 中，**从输入 Multi 命令开始，输入的命令都会依次进入命令队列中，但不会执行，直到输入 Exec 后，Redis 会将之前的命令队列中的命令依次执行**。而组队的过程中可以通过 discard 来放弃组队

![image-20220716091014569](https://cdn.fengxianhub.top/resources-master/202207160910704.png)

> 案例说明

**组队成功，提交成功**

<img src="https://cdn.fengxianhub.top/resources-master/202207160959447.png" alt="image-20220716095904330" style="zoom: 50%;" />

**组队阶段报错，提交失败**

<img src="https://cdn.fengxianhub.top/resources-master/202207161000980.png" alt="img" style="zoom:50%;" />

**组队成功，提交有成功有失败情况**

<img src="https://cdn.fengxianhub.top/resources-master/202207161006707.png" alt="image-20220716100608556" style="zoom: 33%;" />

### 7.3 事务的错误处理

组队中某个命令出现了报告错误，执行时整个的所有队列都会被取消

![img](https://cdn.fengxianhub.top/resources-master/202207161007387.png)

如果执行阶段某个命令报出了错误，则只有报错的命令不会被执行，而其他的命令都会执行，不会回滚

![img](https://cdn.fengxianhub.top/resources-master/202207161010635.png)

### 7.4 事务冲突解决措施

栗子：

- 一个请求想给金额减 8000

- 一个请求想给金额减 5000

- 一个请求想给金额减 1000

最终我们可以发现，总共金额是 10000，如果请求全部执行，那最后的金额变为 - 4000，很明显不合理。

![img](https://cdn.fengxianhub.top/resources-master/202207161016037.png)

> 悲观锁解决
> 
> 悲观锁 (Pessimistic Lock)，顾名思义，就是很悲观，每次去拿数据的时候都认为别人会修改，所以每次在拿数据的时候都会上锁，这样别人想拿这个数据就会 block 直到它拿到锁。传统的关系型数据库里边就用到了很多这种锁机制，比如行锁，表锁等，读锁，写锁等，都是在做操作之前先上锁

![img](https://cdn.fengxianhub.top/resources-master/202207161016162.png)

> 乐观锁
> 
> 乐观锁 (Optimistic Lock)，顾名思义，就是很乐观，每次去拿数据的时候都认为别人不会修改，所以不会上锁，但是在更新的时候会判断一下在此期间别人有没有去更新这个数据，可以使用版本号等机制。乐观锁适用于多读的应用类型，这样可以提高吞吐量。Redis 就是利用这种 check-and-set 机制实现事务的

![image-20220716102528834](https://cdn.fengxianhub.top/resources-master/202207161025988.png)

> WATCH / unwatch
> 
> 在执行 multi 之前，先执行 watch key1 [key2]，可以监视一个 (或多个) key ，如果在事务执行之前这个 (或这些) key 被其他命令所改动，那么事务将被打断
> 
> unwatch，取消 WATCH 命令对所有 key 的监视。如果在执行 WATCH 命令之后，EXEC 命令或 DISCARD 命令先被执行了的话，那么就不需要再执行 UNWATCH 了

<img src="https://cdn.fengxianhub.top/resources-master/202207161024126.png" alt="image-20220716102457923" style="zoom: 33%;" />

### 7.5 Redis 事务三特性

- 单独的隔离操作 ：事务中的所有命令都会序列化、按顺序地执行。事务在执行的过程中，不会被其他客户端发送来的命令请求所打断。

- 没有隔离级别的概念 ：队列中的命令没有提交之前都不会实际被执行，因为事务提交前任何指令都不会被实际执行。

- 不保证原子性 ：事务中如果有一条命令执行失败，其后的命令仍然会被执行，没有回滚 

### 7.6 Redis秒杀代码

```java
public class SecKill_redis {

    public static void main(String[] args) {
        Jedis jedis =new Jedis("192.168.44.168",6379);
        System.out.println(jedis.ping());
        jedis.close();
    }

    //秒杀过程
    public static boolean doSecKill(String uid,String prodid) throws IOException {
        //1 uid和prodid非空判断
        if(uid == null || prodid == null) {
            return false;
        }

        //2 连接redis
        //Jedis jedis = new Jedis("192.168.44.168",6379);
        //通过连接池得到jedis对象
        JedisPool jedisPoolInstance = JedisPoolUtil.getJedisPoolInstance();
        Jedis jedis = jedisPoolInstance.getResource();

        //3 拼接key
        // 3.1 库存key
        String kcKey = "sk:"+prodid+":qt";
        // 3.2 秒杀成功用户key
        String userKey = "sk:"+prodid+":user";

        //监视库存
        jedis.watch(kcKey);

        //4 获取库存，如果库存null，秒杀还没有开始
        String kc = jedis.get(kcKey);
        if(kc == null) {
            System.out.println("秒杀还没有开始，请等待");
            jedis.close();
            return false;
        }

        // 5 判断用户是否重复秒杀操作
        if(jedis.sismember(userKey, uid)) {
            System.out.println("已经秒杀成功了，不能重复秒杀");
            jedis.close();
            return false;
        }

        //6 判断如果商品数量，库存数量小于1，秒杀结束
        if(Integer.parseInt(kc)<=0) {
            System.out.println("秒杀已经结束了");
            jedis.close();
            return false;
        }

        //7 秒杀过程
        //使用事务
        Transaction multi = jedis.multi();

        //组队操作
        multi.decr(kcKey);
        multi.sadd(userKey,uid);

        //执行
        List<Object> results = multi.exec();

        if(results == null || results.size()==0) {
            System.out.println("秒杀失败了....");
            jedis.close();
            return false;
        }

        //7.1 库存-1
        //jedis.decr(kcKey);
        //7.2 把秒杀成功用户添加清单里面
        //jedis.sadd(userKey,uid);

        System.out.println("秒杀成功了..");
        jedis.close();
        return true;
    }
}
```

## 8. Redis持久化与高可用

请看笔者的另一篇文章：

Redis有两种持久化方案：

- RDB持久化
- AOF持久化

## 9. Redis源码分析

你可能想redis不是c语言写的吗？怎么源码分析，难道c语言就不能分析了吗😏

请看笔者的另一篇文章
