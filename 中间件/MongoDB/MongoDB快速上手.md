# MongoDB简单上手

思维导图：

![](https://cdn.fengxianhub.top/resources-master/20220729100641.png)

**课程目标**

MongoDB的副本集: 操作, 主要概念, 故障转移, 选举规则 MongoDB的分片集群：概念, 优点, 操作, 分片策略, 故障转移 MongoDB的安全认证

- 理解 MongoDB 的业务场景, 熟悉 MongoDB 的简介, 特点和体系结构, 数据类型等.
- 能够在 Windows 和 Linux 下安装和启动 MongoDB, 图形化管理界面 Compass 的安装使用
- 掌握 MongoDB 基本常用命令实现数据的 CRUD
- 掌握 MongoDB 的索引类型, 索引管理, 执行计划

## 1. MongoDB 相关概念

### 1.1 业务场景

传统的关系型数据库 (比如 MySQL), 在数据操作的”三高”需求以及对应的 Web 2.0 网站需求面前, 会有”力不从心”的感觉

所谓的三高需求:

**高并发, 高性能, 高可用**, 简称三高

- High Performance: 对数据库的高并发读写的要求
- High Storage: 对海量数据的高效率存储和访问的需求
- High Scalability && High Available: 对数据的高扩展性和高可用性的需求

**而 MongoDB 可以应对三高需求**

具体的应用场景:

- 社交场景, 使用 MongoDB 存储用户信息, 以及用户发表的朋友圈信息, 通过地理位置索引实现附近的人, 地点等功能.
- 游戏场景, 使用 MongoDB 存储游戏用户信息, 用户的装备, 积分等直接以内嵌文档的形式存储, 方便查询, 高效率存储和访问.
- 物流场景, 使用 MongoDB 存储订单信息, 订单状态在运送过程中会不断更新, 以 MongoDB 内嵌数组的形式来存储, 一次查询就能将订单所有的变更读取出来.
- 物联网场景, 使用 MongoDB 存储所有接入的智能设备信息, 以及设备汇报的日志信息, 并对这些信息进行多维度的分析.
- 视频直播, 使用 MongoDB 存储用户信息, 点赞互动信息等.

这些应用场景中, 数据操作方面的共同点有:

1. 数据量大
2. 写入操作频繁
3. 价值较低的数据, 对**事务性**要求不高

对于这样的数据, 更适合用 MongoDB 来实现数据存储

那么我们**什么时候选择 MongoDB 呢?**

除了架构选型上, 除了上述三个特点之外, 还要考虑下面这些问题:

- 应用不需要事务及复杂 JOIN 支持
- 新应用, 需求会变, 数据模型无法确定, 想快速迭代开发
- 应用需要 2000 - 3000 以上的读写QPS（更高也可以）
- 应用需要 TB 甚至 PB 级别数据存储
- 应用发展迅速, 需要能快速水平扩展
- 应用要求存储的数据不丢失
- 应用需要 `99.999%` 高可用
- 应用需要大量的地理位置查询, 文本查询

如果上述有1个符合, 可以考虑 MongoDB, 2个及以上的符合, 选择 MongoDB 绝不会后悔.

> 如果上述业务场景使用用MySQL呢?
> 
> 显然相对于MySQL, MongoDB可以以更低的成本解决问题（包括学习, 开发, 运维等成本）

### 1.2 MongoDB 简介

> MongoDB是一个开源, 高性能, 无模式的文档型数据库, 当初的设计就是用于简化开发和方便扩展, 是NoSQL数据库产品中的一种.是最 像关系型数据库（MySQL）的非关系型数据库. 它支持的数据结构非常松散, 是一种类似于 JSON 的 格式叫BSON, 所以它既可以存储比较复杂的数据类型, 又相当的灵活. MongoDB中的记录是一个文档, 它是一个由字段和值对（ﬁeld:value）组成的数据结构.MongoDB文档类似于JSON对象, 即一个文档认 为就是一个对象.字段的数据类型是字符型, 它的值除了使用基本的一些类型外, 还可以包括其他文档, 普通数组和文档数组.

**“最像关系型数据库的 NoSQL 数据库”**. MongoDB 中的记录是一个文档, 是一个 key-value pair. 字段的数据类型是字符型, 值除了使用基本的一些类型以外, 还包括其它文档, 普通数组以及文档数组

> Mongo和Mysql对比

![image-20220726231623672](https://cdn.fengxianhub.top/resources-master/202207271003671.png)

![](https://cdn.fengxianhub.top/resources-master/20220727145225.png)

MongoDB 数据模型是面向文档的, 所谓文档就是一种类似于 JSON 的结构, 简单理解 MongoDB 这个数据库中存在的是各种各样的 JSON（BSON）

- 数据库 (database)
  - 数据库是一个仓库, 存储集合 (collection)
- 集合 (collection)
  - 类似于数组, 在集合中存放文档
- 文档 (document)
  - 文档型数据库的最小单位, 通常情况, 我们存储和操作的内容都是文档

在 MongoDB 中, 数据库和集合都不需要手动创建, 当我们创建文档时, 如果文档所在的集合或者数据库不存在, **则会自动创建数据库或者集合**

#### 1.2.1 数据库 (databases) 管理语法

| 操作                          | 语法                              |
| --------------------------- | ------------------------------- |
| 查看所有数据库                     | `show dbs;` 或 `show databases;` |
| 查看当前数据库                     | `db;`                           |
| 切换到某数据库 (**若数据库不存在则创建数据库**) | `use <db_name>;`                |
| 删除当前数据库                     | `db.dropDatabase();`            |

#### 1.2.2 集合 (collection) 管理语法

| 操作     | 语法                                          |
| ------ | ------------------------------------------- |
| 查看所有集合 | `show collections;`                         |
| 创建集合   | `db.createCollection("<collection_name>");` |
| 删除集合   | `db.<collection_name>.drop()`               |

### 1.3. 数据类型

MongoDB的最小存储单位就是文档(document)对象。文档(document)对象对应于关系型数据库的行。数据在MongoDB中以 BSON（Binary-JSON）文档的格式存储在磁盘上。 

BSON（Binary Serialized Document Format）是一种类json的一种二进制形式的存储格式，简称Binary JSON。BSON和JSON一样，支持 内嵌的文档对象和数组对象，但是BSON有JSON没有的一些数据类型，如`Date`和`BinData`类型。 

BSON采用了类似于 C 语言结构体的名称、对表示方法，支持内嵌的文档对象和数组对象，具有轻量性、可遍历性、高效性的三个特点，可以有效描述非结构化数据和结构化数据。这种格式的优点是灵活性高，但它的缺点是空间利用率不是很理想。

Bson中，除了基本的JSON类型：string,integer,boolean,double,null,array和object，mongo还使用了特殊的数据类型。这些类型包括 date,object id,binary data,regular expression 和code。每一个驱动都以特定语言的方式实现了这些类型，查看你的驱动的文档来获取详细信息。

![MongoDB数据类型](https://cdn.fengxianhub.top/resources-master/20220727142908.png)

> 提示： shell默认使用64位浮点型数值。{“x”：3.14}或{“x”：3}。对于整型值，可以使用NumberInt（4字节符号整数）或NumberLong（8字节符 号整数），{“x”:NumberInt(“3”)}{“x”:NumberLong(“3”)}

### 1.4 MongoDB 的特点

#### 1.4.1 高性能

MongoDB 提供高性能的数据持久化

- 嵌入式数据模型的支持减少了数据库系统上的 I/O 活动
- 索引支持更快的查询, 并且可以包含来自嵌入式文档和数组的键 (文本索引解决搜索的需求, TTL 索引解决历史数据自动过期的需求, 地理位置索引可以用于构件各种 O2O 应用)
- mmapv1, wiredtiger, mongorocks (rocksdb) in-memory 等多引擎支持满足各种场景需求
- Gridfs 解决文件存储需求

#### 1.4.2 高可用

MongoDB 的复制工具称作**副本集** (replica set) 可以提供自动故障转移和数据冗余

#### 1.4.3 高扩展

水平扩展是其核心功能一部分

分片将数据分布在一组集群的机器上 (海量数据存储, 服务能力水平扩展)

MongoDB 支持基于**片键**创建数据区域, 在一个平衡的集群当中, MongoDB 将一个区域所覆盖的读写**只定向**到该区域的那些片    

#### 1.4.4 丰富的查询支持

MongoDB支持丰富的查询语言, 支持读和写操作(CRUD), 比如数据聚合, 文本搜索和地理空间查询等.

#### 1.4.5 其他

无模式（动态模式）, 灵活的文档模型

## 2. 基本常用命令

MongoDB安装请看本文的第八点

### 2.1 数据库操作

| 操作                          | 语法                              |
| --------------------------- | ------------------------------- |
| 查看所有数据库                     | `show dbs;` 或 `show databases;` |
| 查看当前数据库                     | `db;`                           |
| 切换到某数据库 (**若数据库不存在则创建数据库**) | `use <db_name>;`                |
| 删除当前数据库                     | `db.dropDatabase();`            |

默认保留的数据库

- **admin**: 从权限角度考虑, 这是 `root` 数据库, 如果将一个用户添加到这个数据库, 这个用户自动继承所有数据库的权限, 一些特定的服务器端命令也只能从这个数据库运行, 比如列出所有的数据库或者关闭服务器
- **local**: 数据永远不会被复制, 可以用来存储限于本地的单台服务器的集合 (部署集群, 分片等)
- **config**: Mongo 用于分片设置时, `config` 数据库在内部使用, 用来保存分片的相关信息
  
  ```shell
  > show dbs
  admin   0.000GB
  config  0.000GB
  local   0.000GB
  > use articledb
  switched to db articledb
  > show dbs
  admin   0.000GB
  config  0.000GB
  local   0.000GB
  ```

当我们创建了一个数据库后再进行查看会发现，我们创建的数据库并没有显示出来，这是由于`MongoDD的存储机制决定的`

> 当使用 `use articledb` 的时候. `articledb` 其实存放在内存之中, 当 `articledb` 中存在一个 collection 之后, mongo 才会将这个数据库持久化到硬盘之中.

![](https://cdn.fengxianhub.top/resources-master/20220727195810.png)

```javascript
> show dbs
admin   0.000GB
config  0.000GB
local   0.000GB
> use articledb
switched to db articledb
> show dbs
admin   0.000GB
config  0.000GB
local   0.000GB
> db.articledb.insertOne({"a": 3})
{
        "acknowledged" : true,
        "insertedId" : ObjectId("62e128b6a70e7344a5139207")
}
> show dbs
admin      0.000GB
articledb  0.000GB
config     0.000GB
local      0.000GB
```

另外： 数据库名可以是满足以下条件的任意UTF-8字符串。 

- 不能是空字符串（"")。 
- 不得含有`' '`空格)、`.`、`$`、`/`、`\` 和 `\0` (空字符)。 
- 应全部小写。 
- 最多64字节。

> 集合操作与数据库操作类似，这里不再单独演示

![](https://cdn.fengxianhub.top/resources-master/20220727201035.png)

### 2.2 文档基本 CRUD

> 官方文档: https://docs.mongodb.com/manual/crud/

#### 2.2.1 创建 Create

> Create or insert operations add new [documents](https://docs.mongodb.com/manual/core/document/#bson-document-format) to a [collection](https://docs.mongodb.com/manual/core/databases-and-collections/#collections). If the collection does **not** currently exist, insert operations will create the collection automatically.

文档的数据结构和 JSON 基本一样。

所有存储在集合中的数据都是 BSON 格式。

BSON 是一种类似 JSON 的二进制形式的存储格式，是 Binary JSON 的简称

- 使用 `db.<collection_name>.insertOne()` 向集合中添加*一个文档*, 参数一个 json 格式的文档
  -db.collection.insertOne() 用于向集合插入一个新文档，语法格式如下：
  
  ```java
  db.collection.insertOne(
   <document>,
   {
      writeConcern: <document>
   }
  )
  ```
- 使用 `db.<collection_name>.insertMany()` 向集合中添加*多个文档*, 参数为 json 文档数组
  db.collection.insertMany() 用于向集合插入一个多个文档，语法格式如下：

```java
db.collection.insertMany(
   [ <document 1> , <document 2>, ... ],
   {
      writeConcern: <document>,
      ordered: <boolean>
   }
)
```

参数说明：

- document：要写入的文档。
- writeConcern：写入策略，默认为 1，即要求确认写操作，0 是不要求。
- ordered：指定是否按顺序写入，默认 true，按顺序写入

> 我们平时使用最多的只有`document`这一个字段

![](https://cdn.fengxianhub.top/resources-master/20220727153030.png)

```javascript
#  插入单条数据

> var document = db.collection.insertOne({"a": 3})
> document
{
        "acknowledged" : true,
        "insertedId" : ObjectId("571a218011a82a1d94c02333")
}

#  插入多条数据
> var res = db.collection.insertMany([{"b": 3}, {'c': 4}])
> res
{
        "acknowledged" : true,
        "insertedIds" : [
                ObjectId("571a22a911a82a1d94c02337"),
                ObjectId("571a22a911a82a1d94c02338")
        ]
}
```

还可以通过js函数方式批量插入文档：

1、先创建数组
2、将数据放在数组中
3、一次 insert 到集合中

```javascript
var arr = [];

for(var i=1 ; i<=20000 ; i++){
    arr.push({num:i});
}

db.numbers.insert(arr);
```

注：当我们向 `collection` 中插入 `document` 文档时, 如果没有给文档指定 `_id` 属性, 那么数据库会为文档自动添加 `_id` field, 并且值类型是 `ObjectId(blablabla)`, 就是文档的唯一标识, 类似于 relational database 里的 `primary key`

> - mongo 中的数字, 默认情况下是 double 类型, 如果要存整型, 必须使用函数 `NumberInt(整型数字)`, 否则取出来就有问题了
> - 插入当前日期可以使用 `new Date()`

如果某条数据插入失败, 将会终止插入, 但已经插入成功的数据**不会回滚掉**. 因为批量插入由于数据较多容易出现失败, 因此, 可以使用 `try catch` 进行异常捕捉处理, 测试的时候可以不处理.如：

```java
try {
// 插入多条记录
db.comment.insertMany([
{"_id":"1","articleid":"100001","content":"我们不应该把清晨浪费在手机上，健康很重要，一杯温水幸福你我他。","userid":"1002","nickname":"相忘于江湖","createdatetime":new Date("2019-08-05T22:08:15.522Z"),"likenum":NumberInt(1000),"state":"1"},
{"_id":"2","articleid":"100001","content":"我夏天空腹喝凉开水，冬天喝温开水","userid":"1005","nickname":"伊人憔悴","createdatetime":new Date("2019-08-05T23:58:51.485Z"),"likenum":NumberInt(888),"state":"1"},
{"_id":"3","articleid":"100001","content":"我一直喝凉开水，冬天夏天都喝。","userid":"1004","nickname":"杰克船长","createdatetime":new Date("2019-08-06T01:05:06.321Z"),"likenum":NumberInt(666),"state":"1"},
{"_id":"4","articleid":"100001","content":"专家说不能空腹吃饭，影响健康。","userid":"1003","nickname":"凯撒","createdatetime":new Date("2019-08-06T08:18:35.288Z"),"likenum":NumberInt(2000),"state":"1"},
{"_id":"5","articleid":"100001","content":"研究表明，刚烧开的水千万不能喝，因为烫嘴。","userid":"1003","nickname":"凯撒","createdatetime":new Date("2019-08-06T11:01:02.521Z"),"likenum":NumberInt(3000),"state":"1"}
]);

} catch (e) {
  print (e);
}
```

#### 2.2.2 查询 Read

更多查询可以看2.4节和2.5节

- 使用 `db.<collection_name>.find()` 方法对集合进行查询, 接受一个 json 格式的查询条件. 返回的是一个**数组**
- `db.<collection_name>.findOne()` 查询集合中符合条件的第一个文档, 返回的是一个**对象**

![](https://cdn.fengxianhub.top/resources-master/20220727153747.png)

```java
// 插入多条记录
> db.comment.insertMany([
{"_id":"1","articleid":"100001","content":"我们不应该把清晨浪费在手机上，健康很重要，一杯温水幸福你我他。","userid":"1002","nickname":"相忘于江湖","createdatetime":new Date("2019-08-05T22:08:15.522Z"),"likenum":NumberInt(1000),"state":"1"},
{"_id":"2","articleid":"100001","content":"我夏天空腹喝凉开水，冬天喝温开水","userid":"1005","nickname":"伊人憔悴","createdatetime":new Date("2019-08-05T23:58:51.485Z"),"likenum":NumberInt(888),"state":"1"},
{"_id":"3","articleid":"100001","content":"我一直喝凉开水，冬天夏天都喝。","userid":"1004","nickname":"杰克船长","createdatetime":new Date("2019-08-06T01:05:06.321Z"),"likenum":NumberInt(666),"state":"1"},
{"_id":"4","articleid":"100001","content":"专家说不能空腹吃饭，影响健康。","userid":"1003","nickname":"凯撒","createdatetime":new Date("2019-08-06T08:18:35.288Z"),"likenum":NumberInt(2000),"state":"1"},
{"_id":"5","articleid":"100001","content":"研究表明，刚烧开的水千万不能喝，因为烫嘴。","userid":"1003","nickname":"凯撒","createdatetime":new Date("2019-08-06T11:01:02.521Z"),"likenum":NumberInt(3000),"state":"1"}
]);
{
        "acknowledged" : true,
        "insertedIds" : [
                "1",
                "2",
                "3",
                "4",
                "5"
        ]
}

// 只返回查询到的第一条数据
> db.comment.findOne({"articleid":"100001"})
{
        "_id" : "1",
        "articleid" : "100001",
        "content" : "我们不应该把清晨浪费在手机上，健康很重要，一杯温水幸福你我他。",
        "userid" : "1002",
        "nickname" : "相忘于江湖",
        "createdatetime" : ISODate("2019-08-05T22:08:15.522Z"),
        "likenum" : 1000,
        "state" : "1"
}
// 等价于
db.comment.find({"articleid":"100001"}).limit(1)
```

如果我们不需要那么多的字段，我们可以在查询条件后面再跟上需要查询的字段，`1`表示显示指定的字段，其中`_id`是默认显示的，我们指定`0`表示强制不显示

```javascript
// 只显示articleid字段
> db.comment.find({"articleid":"100001"},{"articleid":1}).limit(1)
{ "_id" : "1", "articleid" : "100001" }
// 强制_id不显示
> db.comment.find({"articleid":"100001"},{"articleid":1,"_id":0}).limit(1)
{ "articleid" : "100001" }
```

可以使用 `$in` 操作符表示*范围查询*

```java
db.inventory.find( { status: { $in: [ "A", "D" ] } } )
```

多个查询条件用逗号分隔, 表示 `AND` 的关系

```java
db.inventory.find( { status: "A", qty: { $lt: 30 } } )
```

等价于下面 sql 语句

```mysql
SELECT * FROM inventory WHERE status = "A" AND qty < 30
```

使用 `$or` 操作符表示后边数组中的条件是OR的关系

```java
db.inventory.find( { $or: [ { status: "A" }, { qty: { $lt: 30 } } ] } )
```

等价于下面 sql 语句

```mysql
SELECT * FROM inventory WHERE status = "A" OR qty < 30
```

联合使用 `AND` 和 `OR` 的查询语句

```java
db.inventory.find( {
     status: "A",
     $or: [ { qty: { $lt: 30 } }, { item: /^p/ } ]
} )
```

在 terminal 中查看结果可能不是很方便, 所以我们可以用 `pretty()` 来帮助阅读

```
db.inventory.find().pretty()
```

匹配内容

```java
db.posts.find({
  comments: {
    $elemMatch: {
      user: 'Harry Potter'
    }
  }
}).pretty()

// 正则表达式
db.<collection_name>.find({ content : /once/ })
```

创建索引

```javascript
db.posts.createIndex({
  { title : 'text' }
})

// 文本搜索
// will return document with title "Post One"
// if there is no more posts created
db.posts.find({
  $text : {
    $search : "\"Post O\""
  }
}).pretty()
```

#### 2.2.3 更新 Update

- 使用 `db.<collection_name>.updateOne(<filter>, <update>, <options>)` 方法修改一个匹配 `<filter>` 条件的文档
- 使用 `db.<collection_name>.updateMany(<filter>, <update>, <options>)` 方法修改所有匹配 `<filter>` 条件的文档
- 使用 `db.<collection_name>.replaceOne(<filter>, <update>, <options>)` 方法**替换**一个匹配 `<filter>` 条件的文档
- `db.<collection_name>.update(查询对象, 新对象)` 默认情况下会使用新对象替换旧对象

其中 `<filter>` 参数与查询方法中的条件参数用法一致

> 覆盖修改，会将其他的值清除

```javascript
// nModified1表示有一条记录被修改
> db.comment.update({"_id":"1"}, {"likenum":NumberInt(1001)})
WriteResult({ "nMatched" : 1, "nUpserted" : 0, "nModified" : 1 })
// 可以看到其他字段的值不见了
> db.comment.find()
{ "_id" : "1", "likenum" : 1001 }
{ "_id" : "2", "articleid" : "100001", "content" : "我夏天空腹喝凉开水，冬天喝温开水", "userid" : "1005", "nickname" : "伊人憔悴", "createdatetime" : ISODate("2019-08-05T23:58:51.485Z"), "likenum" : 888, "state" : "1" }
{ "_id" : "3", "articleid" : "100001", "content" : "我一直喝凉开水，冬天夏天都喝。", "userid" : "1004", "nickname" : "杰克船长", "createdatetime" : ISODate("2019-08-06T01:05:06.321Z"), "likenum" : 666, "state" : "1" }
{ "_id" : "4", "articleid" : "100001", "content" : "专家说不能空腹吃饭，影响健康。", "userid" : "1003", "nickname" : "凯撒", "createdatetime" : ISODate("2019-08-06T08:18:35.288Z"), "likenum" : 2000, "state" : "1" }
{ "_id" : "5", "articleid" : "100001", "content" : "研究表明，刚烧开的水千万不能喝，因为烫嘴。", "userid" : "1003", "nickname" : "凯撒", "createdatetime" : ISODate("2019-08-06T11:01:02.521Z"), "likenum" : 3000, "state" : "1" }
```

> 局部修改，只修改我们修改的部分，其他字段不受影响

如果需要修改指定的属性, 而不是替换需要用“修改操作符”来进行修改

- `$set` 修改文档中的制定属性

```java
// 发现局部修改后其他字段并不受影响
> db.comment.update({ "_id": "2" }, {$set:{ "likenum": NumberInt(1001) }})
WriteResult({ "nMatched" : 1, "nUpserted" : 0, "nModified" : 0 })
> db.comment.find()
{ "_id" : "1", "likenum" : 1001 }
{ "_id" : "2", "articleid" : "100001", "content" : "我夏天空腹喝凉开水，冬天喝温开水", "userid" : "1005", "nickname" : "伊人憔悴", "createdatetime" : ISODate("2019-08-05T23:58:51.485Z"), "likenum" : 1001, "state" : "1" }
{ "_id" : "3", "articleid" : "100001", "content" : "我一直喝凉开水，冬天夏天都喝。", "userid" : "1004", "nickname" : "杰克船长", "createdatetime" : ISODate("2019-08-06T01:05:06.321Z"), "likenum" : 666, "state" : "1" }
{ "_id" : "4", "articleid" : "100001", "content" : "专家说不能空腹吃饭，影响健康。", "userid" : "1003", "nickname" : "凯撒", "createdatetime" : ISODate("2019-08-06T08:18:35.288Z"), "likenum" : 2000, "state" : "1" }
{ "_id" : "5", "articleid" : "100001", "content" : "研究表明，刚烧开的水千万不能喝，因为烫嘴。", "userid" : "1003", "nickname" : "凯撒", "createdatetime" : ISODate("2019-08-06T11:01:02.521Z"), "likenum" : 3000, "state" : "1" }
```

其中最常用的修改操作符即为`$set`和`$unset`，分别表示**赋值**和**取消赋值**.

```java
db.inventory.updateOne(
    { item: "paper" },
    {
        $set: { "size.uom": "cm", status: "P" },
        $currentDate: { lastModified: true }
    }
)

db.inventory.updateMany(
    { qty: { $lt: 50 } },
    {
        $set: { "size.uom": "in", status: "P" },
        $currentDate: { lastModified: true }
    }
)
```

> - uses the [`$set`](https://docs.mongodb.com/manual/reference/operator/update/set/#up._S_set) operator to update the value of the `size.uom` field to `"cm"` and the value of the `status` field to `"P"`,
> - uses the [`$currentDate`](https://docs.mongodb.com/manual/reference/operator/update/currentDate/#up._S_currentDate) operator to update the value of the `lastModified` field to the current date. If `lastModified` field does not exist, [`$currentDate`](https://docs.mongodb.com/manual/reference/operator/update/currentDate/#up._S_currentDate) will create the field. See [`$currentDate`](https://docs.mongodb.com/manual/reference/operator/update/currentDate/#up._S_currentDate) for details.

`db.<collection_name>.replaceOne()` 方法替换除 `_id` 属性外的**所有属性**, 其`<update>`参数应为一个**全新的文档**.

```
db.inventory.replaceOne(
    { item: "paper" },
    { item: "paper", instock: [ { warehouse: "A", qty: 60 }, { warehouse: "B", qty: 40 } ] }
)
```

**批量修改**

在后面添加`{multi: true}`即可

```
// 默认会修改第一条
db.commnet.update({ userid: "30", { $set {username: "guest"} } })

// 修改所有符合条件的数据
db.commnet.update( { userid: "30", { $set {username: "guest"} } }, {multi: true} )
```

![](https://cdn.fengxianhub.top/resources-master/20220727212238.png)

![](https://cdn.fengxianhub.top/resources-master/20220727212446.png)

**列值增长的修改**

如果我们想实现对某列值在原有值的基础上进行增加或减少, 可以使用 `$inc` 运算符来实现

```
db.commnet.update({ _id: "3", {$inc: {likeNum: NumberInt(1)}} })
```

![](https://cdn.fengxianhub.top/resources-master/20220727212929.png)

> 修改操作符

| Name                                                                                                       | Description                                                                                                                                   |
|:---------------------------------------------------------------------------------------------------------- |:--------------------------------------------------------------------------------------------------------------------------------------------- |
| [`$currentDate`](https://docs.mongodb.com/manual/reference/operator/update/currentDate/#up._S_currentDate) | Sets the value of a field to current date, either as a Date or a Timestamp.                                                                   |
| [`$inc`](https://docs.mongodb.com/manual/reference/operator/update/inc/#up._S_inc)                         | Increments the value of the field by the specified amount.                                                                                    |
| [`$min`](https://docs.mongodb.com/manual/reference/operator/update/min/#up._S_min)                         | Only updates the field if the specified value is less than the existing field value.                                                          |
| [`$max`](https://docs.mongodb.com/manual/reference/operator/update/max/#up._S_max)                         | Only updates the field if the specified value is greater than the existing field value.                                                       |
| [`$mul`](https://docs.mongodb.com/manual/reference/operator/update/mul/#up._S_mul)                         | Multiplies the value of the field by the specified amount.                                                                                    |
| [`$rename`](https://docs.mongodb.com/manual/reference/operator/update/rename/#up._S_rename)                | Renames a field.                                                                                                                              |
| [`$set`](https://docs.mongodb.com/manual/reference/operator/update/set/#up._S_set)                         | Sets the value of a field in a document.                                                                                                      |
| [`$setOnInsert`](https://docs.mongodb.com/manual/reference/operator/update/setOnInsert/#up._S_setOnInsert) | Sets the value of a field if an update results in an insert of a document. Has no effect on update operations that modify existing documents. |
| [`$unset`](https://docs.mongodb.com/manual/reference/operator/update/unset/#up._S_unset)                   | Removes the specified field from a document.                                                                                                  |

#### 2.2.4 删除 Delete

- `db.collection.remove()`通过添加删除规则进行删除 
- 使用 `db.collection.deleteMany()` 方法删除所有匹配的文档.
- 使用 `db.collection.deleteOne()` 方法删除单个匹配的文档.
- `db.collection.drop()`
- `db.dropDatabase()`

> 只删除一条记录

![](https://cdn.fengxianhub.top/resources-master/20220727214323.png)

如果不加后面的限制会删除所有匹配的记录

以下语句可以将数据全部删除，请慎用

```javascript
db.comment.remove({})
```

> Delete operations **do not drop indexes**, even if deleting all documents from a collection.
> 
> 一般数据库中的数据都不会真正意义上的删除, 会添加一个字段, 用来表示这个数据是否被删除

### 2.3 文档排序和投影 (sort & projection)

#### 2.3.1 排序 Sort

在查询文档内容的时候, 默认是按照 `_id` 进行排序

我们可以用 `$sort` 更改文档排序规则

```
{ $sort: { <field1>: <sort order>, <field2>: <sort order> ... } }
```

For the field or fields to sort by, set the sort order to `1` or `-1` to specify an *ascending* or *descending* sort respectively, as in the following example:

```
db.users.aggregate(
   [
     { $sort : { age : -1, posts: 1 } }
     // ascending on posts and descending on age
   ]
)
```

 `$sort` Operator and Memory

 `$sort` + `$limit` Memory Optimization

When a [`$sort`](https://docs.mongodb.com/manual/reference/operator/aggregation/sort/index.html#pipe._S_sort) precedes a [`$limit`](https://docs.mongodb.com/manual/reference/operator/aggregation/limit/#pipe._S_limit) and there are no intervening stages that modify the number of documents, the optimizer can coalesce the [`$limit`](https://docs.mongodb.com/manual/reference/operator/aggregation/limit/#pipe._S_limit) into the [`$sort`](https://docs.mongodb.com/manual/reference/operator/aggregation/sort/index.html#pipe._S_sort). This allows the [`$sort`](https://docs.mongodb.com/manual/reference/operator/aggregation/sort/index.html#pipe._S_sort) operation to **only maintain the top `n` results as it progresses**, where `n` is the specified limit, and ensures that MongoDB only needs to store `n` items in memory. This optimization still applies when `allowDiskUse` is `true` and the `n` items exceed the [aggregation memory limit](https://docs.mongodb.com/manual/core/aggregation-pipeline-limits/#agg-memory-restrictions).

Optimizations are subject to change between releases.

> 有点类似于用 heap 做 topK 这种问题, 只维护 k 个大小的 heap, 会加速 process

举个栗子:

```
db.posts.find().sort({ title : -1 }).limit(2).pretty()
```

#### 2.3.2 投影 Projection

有些情况, 我们对文档进行查询并不是需要所有的字段, 比如只需要 id 或者 用户名, 我们可以对文档进行“投影”

- `1` - display
- `0` - dont display

```
> db.users.find( {}, {username: 1} )

> db.users.find( {}, {age: 1, _id: 0} )
```

### 2.4 分页查询

#### 2.4.1 统计查询

统计查询使用count()方法，语法如下：

```javascript
db.collection.count(query, options)
```

参数：

![](https://cdn.fengxianhub.top/resources-master/20220727215535.png)

提示： 可选项暂时不使用。

【示例】 

（1）统计所有记录数： 统计comment集合的所有的记录数：

![](https://cdn.fengxianhub.top/resources-master/20220727215729.png)

（2）按条件统计记录数：例如：统计userid为1003的记录条数

![](https://cdn.fengxianhub.top/resources-master/20220727215831.png)

提示： 默认情况下 count() 方法返回符合条件的全部记录条数。

#### 2.4.2 分页列表查询

可以使用limit()方法来读取指定数量的数据，使用skip()方法来跳过指定数量的数据

基本语法如下所示：

```java
db.COLLECTION_NAME.find().limit(NUMBER).skip(NUMBER)
```

![](https://cdn.fengxianhub.top/resources-master/20220728100755.png)

#### 2.4.3 排序查询

sort() 方法对数据进行排序，sort() 方法可以通过参数指定排序的字段，并使用 1 和 -1 来指定排序的方式，其中 1 为升序排列，而 -1 是用 于降序排列。

语法如下所示：

```java
db.COLLECTION_NAME.find().sort({KEY:1}) 
或 
db.集合名称.find().sort(排序方式)
```

例如： 对userid降序排列，并对访问量进行升序排列

![](https://cdn.fengxianhub.top/resources-master/20220728101408.png)

提示： skip(), limilt(), sort()三个放在一起执行的时候，执行的顺序是先 sort(), 然后是 skip()，最后是显示的 limit()，和命令编写顺序无关。

### 2.5 其他查询方式

#### 2.5.1 正则表达式（模糊查询）

MongoDB的模糊查询是通过正则表达式的方式实现的。格式为

```
$ db.collection.find({field:/正则表达式/})

$ db.collection.find({字段:/正则表达式/})
```

提示：正则表达式是js的语法，直接量的写法。 例如，我要查询评论内容包含“开水”的所有文档，代码如下：

![](https://cdn.fengxianhub.top/resources-master/20220728103158.png)

如果要查询评论的内容中以“专家”开头的，代码如下：

![](https://cdn.fengxianhub.top/resources-master/20220728103546.png)

附录：常用的正则表达式

![](https://cdn.fengxianhub.top/resources-master/20220728103817.png)

![](https://cdn.fengxianhub.top/resources-master/20220728103823.png)

![](https://cdn.fengxianhub.top/resources-master/20220728103828.png)

#### 2.5.2 比较查询

`<`, `<=`, `>`, `>=` 这些操作符也是很常用的, 格式如下:

其实这些字符就是对应JS里面的：gt（great than）、lt（less than）、gte（great than equal ）、lte（less than equal ）、ne（not equal）

```
db.collection.find({ "field" : { $gt: value }}) // 大于: field > value
db.collection.find({ "field" : { $lt: value }}) // 小于: field < value
db.collection.find({ "field" : { $gte: value }}) // 大于等于: field >= value
db.collection.find({ "field" : { $lte: value }}) // 小于等于: field <= value
db.collection.find({ "field" : { $ne: value }}) // 不等于: field != value
```

示例：查询评论点赞数量大于700的记录

![](https://cdn.fengxianhub.top/resources-master/20220728110833.png)

#### 2.5.3 包含查询

包含使用 `$in` 操作符. 示例：查询评论的集合中 `userid` 字段包含 `1003` 或 `1004`的文档

```
db.comment.find({userid:{$in:["1003","1004"]}})
```

![](https://cdn.fengxianhub.top/resources-master/20220728112350.png)

不包含使用 `$nin` 操作符. 示例：查询评论集合中 `userid` 字段不包含 `1003` 和 `1004` 的文档

```
db.comment.find({userid:{$nin:["1003","1004"]}})
```

![查询评论集合中 `userid` 字段不包含 `1003` 和 `1004` 的文档](https://cdn.fengxianhub.top/resources-master/20220728112453.png)

#### 2.5.4 条件连接查询

我们如果需要查询同时满足两个以上条件，需要使用$and操作符将条件进行关联。（相当于SQL的and） 格式为：

```javascript
$and:[ { },{ },{ } ]
```

示例：查询评论集合中likenum大于等于700 并且小于2000的文档：

```java
db.comment.find({$and:[{likenum:{$gte:NumberInt(700)}},{likenum:{$lt:NumberInt(2000)}}]})
```

![](https://cdn.fengxianhub.top/resources-master/20220728113021.png)

如果两个以上条件之间是或者的关系，我们使用 操作符进行关联，与前面 and的使用方式相同 格式为：

```java
$or:[ { },{ },{ } ]
```

示例：查询评论集合中userid为1003，或者点赞数小于1000的文档记录

```java
db.comment.find({$or:[ {userid:"1003"} ,{likenum:{$lt:1000} }]})
```

![](https://cdn.fengxianhub.top/resources-master/20220728113102.png)

#### 2.5.5 foreach查询

我们知道这些查询语句其实就是`js`的语法格式，所有在查询得到结果后我们也可以通过`forEach`函数对结果进行遍历

```java
db.posts.find().forEach(
    fucntion(doc) { 
        print('Blog Post: ' + doc.title) 
    })
// 也可以通过箭头函数简化一下
db.comment.find().forEach((it)=> { 
      print(it._id)
});
```

![](https://cdn.fengxianhub.top/resources-master/20220728114314.png)

#### 2.5.6 地理位置查询

请查看MongoDB中文文档：[地理空间查询 - MongoDB-CN-Manual (mongoing.com)](https://docs.mongoing.com/mongodb-crud-operations/geospatial-queries)

## 2.6 常用命令小结

```javascript
选择切换数据库：use articledb
插入数据：db.comment.insert({bson数据})
查询所有数据：db.comment.find();
条件查询数据：db.comment.find({条件})
查询符合条件的第一条记录：db.comment.findOne({条件})
查询符合条件的前几条记录：db.comment.find({条件}).limit(条数)
查询符合条件的跳过的记录：db.comment.find({条件}).skip(条数)

修改数据：db.comment.update({条件},{修改后的数据})
        或
        db.comment.update({条件},{$set:{要修改部分的字段:数据})

修改数据并自增某字段值：db.comment.update({条件},{$inc:{自增的字段:步进值}})

删除数据：db.comment.remove({条件})
统计查询：db.comment.count({条件})
模糊查询：db.comment.find({字段名:/正则表达式/})
条件比较运算：db.comment.find({字段名:{$gt:值}})
包含查询：db.comment.find({字段名:{$in:[值1, 值2]}})
        或
        db.comment.find({字段名:{$nin:[值1, 值2]}})

条件连接查询：db.comment.find({$and:[{条件1},{条件2}]})
           或
           db.comment.find({$or:[{条件1},{条件2}]})
```

## 3. 文档间的对应关系

- 一对一 (One To One)
- 一对多/多对一(one to many / many to one)
- 多对多 (Many To Many)

### 3.1 一对一

在MongoDB中可以通过内嵌文档的形式体现出一对一的关系，比如夫妻：

```javascript
{
    name:'黄蓉',
    husband:{
        name:'郭靖'
    }
}
```

> 一个文档对象一旦被嵌入到另一个文档对象中就绝不可能再被嵌入到其他文档对象中，因此可以体现出一对一的关系

### 3.2 一对多/多对一

一对多的关系在实际开发中是非常常用的，也是现实世界中出现频率比较高的关系

有两种方式可以体现一对多(或多对一)的关系，以客户和订单为例：  

一：关系在一的一方维护，直接通过内嵌数组，在数组中存放整个对象的方式：这种方式不好，因为如果对应的对象比较多的话，文档就会看起来很复杂，不易查询

```javascript
{
    cust_id:ObjectId("5d272c817f2dc9e6986d82fb"),
    cust_name:"黑宋江",
    orders:[
        {
            _id: ObjectId("5d2614c42b1a4fdfd82bfda3"),
            type:"牛肉",
            count:2
        },
        {
            _id:ObjectId("5d272c817f2dc9e6986d82fa"),
            type:"酒",
            count:6
        }
    ]
}
```

二：一对多，用户：constom/订单orders

举个例子, 比如“用户-订单”这个一对多的关系中, 我们想查询某一个用户的所有或者某个订单, 我们可以在用户中添加订单的主键

**先创建用户集合**

```javascript
db.constom.insert([
    {username:'孙悟空'},
    {username:'猪八戒'}
])
```

**再创建订单集合(添加一个userid属性，该订单是谁的就给userid属性添加谁的_id)**

```javascript
db.orders.insert({
    list:["辣椒","花椒","油"],
    userid:ObjectId("5ebcfe39bc5756d0fed31ff3")//这个是孙悟空的_id代表该订单就是孙悟空的。
})
```

**通过userid再去查找每个人对应的订单**

```javascript
var userid = db.constom.findOne({username:'孙悟空'})._id;
db.orders.find({userid:userid})
```

![](https://cdn.fengxianhub.top/resources-master/20220728141516.png)

### 3.3 多对多

在关系型数据库中我们处理多对多关系的时候采用的方法一般是将两张表的主键抽取出来，放到一张单独的关系表中，将两张表的主键作为这张关系表的外键，每次做关联查询的时候都要先到这张关系表中找出对应表的主键

在MongoDB中多对多采用的其实是类似与`一对多`的情况，也是通过`增加一些冗余的字段`来记录关系

举个例子，我们在关系型数据库中一般会以学生和老师作为例子，这里同样我们也举这个：

```javascript
//多对多
// 先插入一些老师的信息
db.teachers.insertMany([
    {name:"洪七公"},
    {name:"黄药师"},
    {name:"龟仙人"}
]);
db.teachers.find();
// 插入一些学生的信息，并且将老师的id进行记录
db.students.insertMany([
    {
        name:"郭靖",
        teachers_ids:[
        ObjectId("5d7f018b162f56aeed8aedda"),
        ObjectId("5d7f018b162f56aeed8aeddb"),
        ObjectId("5d7f018b162f56aeed8aeddc")
        ]
    },{
        name:"黄蓉",
        teachers_ids:[
        ObjectId("5d7f018b162f56aeed8aedda"),
        ObjectId("5d7f018b162f56aeed8aeddb"),
        ObjectId("5d7f018b162f56aeed8aeddc")
        ]

    }
]);
db.students.find();
```

## 4. MongoDB 的索引

### 4.1 概述

索引支持在 MongoDB 中高效地执行查询.如果没有索引, MongoDB 必须执行全集合扫描, 即扫描集合中的每个文档, 以选择与查询语句 匹配的文档.这种扫描全集合的查询效率是非常低的, 特别在处理大量的数据时, 查询可以要花费几十秒甚至几分钟, 这对网站的性能是非常致命的.

如果查询存在适当的索引, MongoDB 可以使用该索引限制必须检查的文档数.

索引是特殊的数据结构, 它以易于遍历的形式存储集合数据集的一小部分.索引存储特定字段或一组字段的值, 按字段值排序.索引项的排 序支持有效的相等匹配和基于范围的查询操作.此外, MongoDB 还可以使用索引中的排序返回排序结果.

**MongoDB 和MySQL 一样使用的都是是 B+ Tree**

在之前的版本中Mongo使用的是B树，但是现在都是使用B+树了

- <a href="http://source.wiredtiger.com/3.2.1/tune_page_size_and_comp.html">Mongo官方文档</a>
- <a href="https://blog.csdn.net/weixin_41987908/article/details/105255119?ops_request_misc=%257B%2522request%255Fid%2522%253A%2522165898988316782390577084%2522%252C%2522scm%2522%253A%252220140713.130102334.pc%255Fall.%2522%257D&request_id=165898988316782390577084&biz_id=0&utm_medium=distribute.pc_search_result.none-task-blog-2~all~first_rank_ecpm_v1~rank_v31_ecpm-2-105255119-null-null.142^v35^experiment_2_v1,185^v2^tag_show&utm_term=MongoDB%E4%B8%BA%E4%BB%80%E4%B9%88%E4%BD%BF%E7%94%A8B%E6%A0%91%E4%BD%9C%E4%B8%BA%E7%B4%A2%E5%BC%95&spm=1018.2226.3001.4187">为什么Mongo选择过B树？</a>

索引常用命令：

```java
// create index
db.<collection_name>.createIndex({ userid : 1, username : -1 })

// retrieve indexes
db.<collection_name>.getIndexes()

// remove indexes
db.<collection_name>.dropIndex(index)

// there are 2 ways to remove indexes:
// 1. removed based on the index name
// 2. removed based on the fields

db.<collection_name>.dropIndex( "userid_1_username_-1" )
db.<collection_name>.dropIndex({ userid : 1, username : -1 })

// remove all the indexes, will only remove non_id indexes
db.<collection_name>.dropIndexes()
```

### 4.2 索引的类型

#### 4.2.1 单字段索引

MongoDB 支持在文档的单个字段上创建用户定义的**升序/降序索引**, 称为**单字段索引**（Single Field Index）

对于单个字段索引和排序操作, 索引键的排序顺序（即升序或降序）并不重要, 因为 MongoDB 可以在任何方向上遍历索引.

![](https://cdn.fengxianhub.top/resources-master/20220728152612.png)

#### 4.2.2 复合索引

MongoDB 还支持多个字段的用户定义索引, 即复合索引 Compound Index，这个其实非常类似`MySQL`中的联合索引，因为底层都是B+树，所有联合索引可能也有`最左原则`这种东西

复合索引中列出的字段顺序具有重要意义.例如, 如果复合索引由 `{ userid: 1, score: -1 }` 组成, 则索引首先按 `userid` 正序排序, 然后 在每个 `userid` 的值内, 再在按 `score` 倒序排序.

![](https://cdn.fengxianhub.top/resources-master/20220728152633.png)

#### 4.2.3 其他索引

- 地理空间索引 Geospatial Index
- 文本索引 Text Indexes
- 哈希索引 Hashed Indexes

##### 地理空间索引（Geospatial Index）

为了支持对地理空间坐标数据的有效查询, MongoDB 提供了两种特殊的索引: 返回结果时使用平面几何的二维索引和返回结果时使用球面几何的二维球面索引.

##### 文本索引（Text Indexes）

MongoDB 提供了一种文本索引类型, 支持在集合中搜索字符串内容.这些文本索引不存储特定于语言的停止词（例如 “the”, “a”, “or”）, 而将集合中的词作为词干, 只存储根词.

##### 哈希索引（Hashed Indexes）

为了支持基于散列的分片, MongoDB 提供了散列索引类型, 它对字段值的散列进行索引.这些索引在其范围内的值分布更加随机, 但只支持相等匹配, 不支持基于范围的查询.

### 4.3 索引的管理操作

#### 4.3.1 索引的查看

语法

```
db.collection.getIndexes()
```

提示：该语法命令运行要求是MongoDB 3.0+

【示例】 查看comment集合中所有的索引情况

![](https://cdn.fengxianhub.top/resources-master/20220728153750.png)

结果中显示的是默认 _id 索引。

默认 `_id` 索引： MongoDB 在创建集合的过程中, 在 `_id` 字段上创建一个唯一的索引, 默认名字为 `_id` , 该索引可防止客户端插入两个具有相同值的文 档, 不能在 `_id` 字段上删除此索引.

注意：该索引是**唯一索引**, 因此值不能重复, 即 `_id` 值不能重复的.

在分片集群中, 通常使用 `_id` 作为**片键**.

#### 4.3.2 索引的创建

语法

```
db.collection.createIndex(keys, options)
```

参数

![](https://cdn.fengxianhub.top/resources-master/20220728154015.png)

options（更多选项）列表

![](https://cdn.fengxianhub.top/resources-master/20220728154041.png)

注意在 3.0.0 版本前创建索引方法为 `db.collection.ensureIndex()` , 之后的版本使用了 `db.collection.createIndex()` 方法, `ensureIndex()` 还能用, 但只是 `createIndex()` 的别名.

举个🌰

`userid:1` 表示由`userid`按照升序创建索引，`userid:1,nickname:-1}`表示先按userid升序，如果userid相等再按照nickname降序创建索引，这里和MySQL一摸一样

```java
// 先由userid按照升序创建索引
$  db.comment.createIndex({userid:1})
{
  "createdCollectionAutomatically" : false,
  "numIndexesBefore" : 1,
  "numIndexesAfter" : 2,
  "ok" : 1
}
// 先按userid升序，如果userid相等再按照nickname降序创建索引
$ db.comment.createIndex({userid:1,nickname:-1})
...
```

![](https://cdn.fengxianhub.top/resources-master/20220728155655.png)

![](https://cdn.fengxianhub.top/resources-master/20220728160447.png)

#### 4.3.3 索引的删除

语法

```
# 删除某一个索引
$ db.collection.dropIndex(index)

# 删除全部索引
$ db.collection.dropIndexes()
```

其中`index`类型为：string or document，表示指定要删除的索引。可以通过索引名称或索引规范文档指定索引。若要删除文本索引，请指定索引名称。

提示:

`_id` 的字段的索引是无法删除的, 只能删除非 `_id` 字段的索引

示例

```
# 删除 comment 集合中 userid 字段上的升序索引
$ db.comment.dropIndex({userid:1})
```

![](https://cdn.fengxianhub.top/resources-master/20220728161546.png)

### 4.4 索引使用

#### 4.4.1 执行计划

分析查询性能 (Analyze Query Performance) 通常使用执行计划 (解释计划 - Explain Plan) 来查看查询的情况

```
$ db.<collection_name>.find( query, options ).explain(options)
```

比如: 查看根据 `user_id` 查询数据的情况

**未添加索引之前**

`"stage" : "COLLSCAN"`, 表示全集合扫描

![](https://cdn.fengxianhub.top/resources-master/20220728162349.png)

**添加索引之后**

`"stage" : "IXSCAN"`, 基于索引的扫描

![](https://cdn.fengxianhub.top/resources-master/20220728162419.png)

#### 4.4.2 覆盖索引查询（Covered Queries）

这里如果直接看的话其实还是满难理解的，但是如果我们结合`MySQL`来看就会发现，这不就是MySQL里面的覆盖索引吗？覆盖索引不就是减少了回表操作吗？这样的话其实一下就能理解下面的介绍，看来知识都是相通的，还是应该多学底层，应用层的东西会变，但是底层的东西大部分都不会改变，你看`AVL`树、`红黑树`这些数据结构，都是上个世纪中期产生的，现在用的还是这一套

当查询条件和查询的投影仅包含索引字段时， MongoDB 直接从索引返回结果, 而不扫描任何文档或将文档带入内存, 这些覆盖的查询十分有效

![](https://cdn.fengxianhub.top/resources-master/20220728162801.png)

> https://docs.mongodb.com/manual/core/query-optimization/#covered-query

例如我们查询下面的索引执行计划：

![](https://cdn.fengxianhub.top/resources-master/20220728165358.png)

## 5. SpringBoot整合MongoDB

### 5.1 需求分析

这里会结合一个具体的业务场景（小案例），对用户评论进行`CRUD`

![](https://cdn.fengxianhub.top/resources-master/20220728185247.png)

在这个案例中主要的需求是：

- 基本增删改查API 
- 根据文章id查询评论 
- 评论点赞

文章示例参考：早晨空腹喝水，是对还是错？https://www.toutiao.com/a6721476546088927748/

### 5.2 表结构分析

数据库：articledb，集合就用我们上面一直在使用的`comment`

![](https://cdn.fengxianhub.top/resources-master/20220728194643.png)

### 5.3 技术选型

#### 5.3.1 mongodb-driver（了解）

mongodb-driver是mongo官方推出的java连接mongoDB的驱动包，相当于JDBC驱动。我们通过一个入门的案例来了解mongodb-driver 的基本使用。

- 官方驱动说明和下载：http://mongodb.github.io/mongo-java-driver/ 
- 官方驱动示例文档：http://mongodb.github.io/mongo-java-driver/3.8/driver/getting-started/quick-start/

#### 5.3.2 SpringDataMongoDB

SpringData家族成员之一，用于操作MongoDB的持久层框架，封装了底层的mongodb-driver。

官网主页： https://projects.spring.io/spring-data-mongodb/ 

#### 5.4 文章微服务模块搭建

（1）搭建项目工程article，pom.xml引入依赖：

```xml
<?xml version="1.0" encoding="UTF-8"?>  
<project xmlns="http://maven.apache.org/POM/4.0.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"  
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 https://maven.apache.org/xsd/maven-4.0.0.xsd">  
    <modelVersion>4.0.0</modelVersion>  
    <parent>  
        <groupId>org.springframework.boot</groupId>  
        <artifactId>spring-boot-starter-parent</artifactId>  
        <version>2.7.2</version>  
        <relativePath/> <!-- lookup parent from repository -->  
    </parent>  
    <groupId>com.fx</groupId>  
    <artifactId>article</artifactId>  
    <version>0.0.1-SNAPSHOT</version>  
    <name>article</name>  
    <description>Demo project for Spring Boot</description>  
    <properties>  
        <java.version>1.8</java.version>  
    </properties>  
    <dependencies>  
        <dependency>  
            <groupId>org.springframework.boot</groupId>  
            <artifactId>spring-boot-starter-data-mongodb</artifactId>  
        </dependency>  
        <dependency>  
            <groupId>org.projectlombok</groupId>  
            <artifactId>lombok</artifactId>  
            <optional>true</optional>  
        </dependency>  
        <dependency>  
            <groupId>org.springframework.boot</groupId>  
            <artifactId>spring-boot-starter-test</artifactId>  
            <scope>test</scope>  
        </dependency>  
    </dependencies>  

    <build>  
        <plugins>  
            <plugin>  
                <groupId>org.springframework.boot</groupId>  
                <artifactId>spring-boot-maven-plugin</artifactId>  
                <configuration>  
                    <excludes>  
                        <exclude>  
                            <groupId>org.projectlombok</groupId>  
                            <artifactId>lombok</artifactId>  
                        </exclude>  
                    </excludes>  
                </configuration>  
            </plugin>  
        </plugins>  
    </build>  

</project>
```

（2）创建application.yml

```yaml
spring:  
  #数据源配置  
  data:  
    mongodb:  
      # 主机地址  
      host: localhost  
      # 数据库  
      database: articledb  
      # 默认端口是27017  
      port: 27017  
      # 也可以使用uri连接  
      #uri: mongodb://192.168.40.134:27017/articledb
```

（3）创建启动类

com.fx.article.ArticleApplication

```java
package com.fx.article;  

import org.springframework.boot.SpringApplication;  
import org.springframework.boot.autoconfigure.SpringBootApplication;  

@SpringBootApplication  
public class ArticleApplication {  

    public static void main(String[] args) {  
        SpringApplication.run(ArticleApplication.class, args);  
    }  

}
```

我们启动一下空项目，看`Mongo`连接是否正常，一般就可以正常连接了

![](https://cdn.fengxianhub.top/resources-master/20220728195910.png)

#### 5.5 文章评论实体类的编写

创建实体类 创建包com.fx.article，包下建包po用于存放实体类，创建实体类

这里有一点需要注意，因为`Mongo`是可以进行横向拓展的，所以可能会出现一个集合对应多个实体类的情况

```java
package com.fx.article.po;  

import lombok.Data;  
import org.springframework.data.annotation.Id;  
import org.springframework.data.mongodb.core.index.CompoundIndex;  
import org.springframework.data.mongodb.core.index.Indexed;  
import org.springframework.data.mongodb.core.mapping.Document;  

import java.io.Serializable;  
import java.time.LocalDateTime;  
import java.util.Date;  

/**  
 * <p>  
 * 文档评论实体类<br/>  
 * 把一个Java类生命为mongodb的文档，可以通过collection参数指定这个类对应的文档  
 * </p>  
 *  
 * @since 2022-07-28 20:19  
 * @author 梁峰源  
 **/  
@Data  
// 若未添加@Document注解，则该bean save到mongo的comment collection  
@Document(collection = "comment")//指定对应的集合，如果省略则默认为类名小写进行集合映射  
@CompoundIndex(def = "{'userid': 1, 'nickname' : -1}") // 添加复合索引，先按userid排，再按nickname降序排  
public class Comment implements Serializable {  
    private static final long serialVersionUID = 21218312631312334L;  
    // 主键标识，该属性的值会自动对应mongodb的主键字段`_id`, 如果该属性名叫做 `id`, 则该注解可以省略，否者必须写  
    @Id  
    private String id;//主键  
    private String content;//吐槽内容  
    private Date publishtime;//发布日期  
    // 添加了一个单子段的索引  
    @Indexed  
    private String userid;//发布人的ID  
    private String nickname;//用户昵称  
    private LocalDateTime createdatetime;//评论的日期时间  
    private Integer likenum;//点赞数  
    private Integer replaynum;//回复数  
    private String state;//状态  
    private String parentid;//上级ID  
    private String articleid;//文章id  
}
```

说明： 索引可以大大提升查询效率，一般在查询字段上添加索引，索引的添加可以通过Mongo的命令来添加，也可以在Java的实体类中通过注解添加。`一般我们为了项目的可拓展性，会在命令行进行添加`

1）单字段索引注解@Indexed 

org.springframework.data.mongodb.core.index.Indexed.class 

声明该字段需要索引，建索引可以大大的提高查询效率。 

Mongo命令参考：

```javascript
db.comment.createIndex({"userid":1})
```

2）复合索引注解@CompoundIndex

org.springframework.data.mongodb.core.index.CompoundIndex.class

复合索引的声明，建复合索引可以有效地提高多字段的查询效率。

Mongo命令参考：

```javascript
db.comment.createIndex({"userid":1,"nickname":-1})
```

#### 5.6 文章评论的基本增删改查

（1）创建数据访问接口 cn.itcast.article包下创建dao包，包下创建接口

com.fx.article.dao.CommentRepository

![](https://cdn.fengxianhub.top/resources-master/20220728203752.png)

```java
package com.fx.article.dao;  

import com.fx.article.po.Comment;  
import org.springframework.data.mongodb.repository.MongoRepository;  

/**  
 * <p>  
 *  
 * </p>  
 *  
 * @author 梁峰源  
 * @since 2022-07-28 20:34  
 **/public interface CommentRepository extends MongoRepository<Comment, String> {  
}
```

（2）创建业务逻辑类 cn.itcast.article包下创建service包，包下创建类

com.fx.article.service.CommentService

```java
package com.fx.article.service;  

import com.fx.article.dao.CommentRepository;  
import com.fx.article.po.Comment;  
import org.springframework.beans.factory.annotation.Autowired;  
import org.springframework.stereotype.Service;  

import java.util.List;  

/**  
 * <p>  
 * 评论service方法  
 * </p>  
 *  
 * @since 2022-07-28 20:36  
 * @author 梁峰源  
 **/  
@Service  
public class CommentService {  
    //注入dao  
    @Autowired  
    private CommentRepository commentRepository;  

    /**  
     * 保存一个评论  
     */  
    public void saveComment(Comment comment) {  
        //如果需要自定义主键，可以在这里指定主键；如果不指定主键，MongoDB会自动生成主键  
        //设置一些默认初始值。。。  
        //调用dao  
        commentRepository.save(comment);  
    }  

    /**  
     * 更新评论  
     */  
    public void updateComment(Comment comment) {  
        //调用dao  
        commentRepository.save(comment);  
    }  

    /**  
     * 根据id删除评论  
     */  
    public void deleteCommentById(String id) {  
        //调用dao  
        commentRepository.deleteById(id);  
    }  

    /**  
     * 查询所有评论  
     */  
    public List<Comment> findCommentList() {  
        //调用dao  
        return commentRepository.findAll();  
    }  

    /**  
     * 根据id查询评论  
     */  
    public Comment findCommentById(String id) {  
        //调用dao  
        return commentRepository.findById(id).get();  
    }  

}
```

（3）新建Junit测试类，测试保存和查询所有：

com.fx.itcast.article.service.CommentServiceTest

```java
package com.fx.article.service;  


import com.fx.article.po.Comment;  
import org.junit.jupiter.api.Test;  
import org.springframework.beans.factory.annotation.Autowired;  
import org.springframework.boot.test.context.SpringBootTest;  

import java.time.LocalDateTime;  
import java.util.List;  

/**  
 * @author Eureka  
 * @version 1.0  
 * @since 2022年7月28日20:56:33  
 */@SpringBootTest  
public class CommentServiceTest {  

    @Autowired  
    private CommentService commentService;  

    /**  
     * 保存一条记录  
     */  
    @Test  
    public void testSaveComment() throws Exception {  
        Comment comment = new Comment();  
        comment.setArticleid("100000");  
        comment.setContent("测试添加的数据");  
        comment.setCreatedatetime(LocalDateTime.now());  
        comment.setUserid("1003");  
        comment.setNickname("凯撒大帝");  
        comment.setState("1");  
        comment.setLikenum(0);  
        comment.setReplynum(0);  
        commentService.saveComment(comment);  
        // 在查询一下这条记录，这里获取id的方式和Mybatis Plus一样，直接从实体类中获取即可  
        Comment commentById = commentService.findCommentById(comment.getId());  
        System.out.println(commentById);  
    }  

    /**  
     * 更新一条记录  
     */  
    @Test  
    public void testUpdateComment() throws Exception {  
//        Comment comment = new Comment();  
//        comment.setId("1");  
//        comment.setNickname("张三");  
        // 上面的方式会将其他字段变为空，所以可以先查询出来再更新对应字段  
        Comment comment = commentService.findCommentById("1");  
        comment.setNickname("张三");  
        // 更新这条记录  
        commentService.updateComment(comment);  
        // 打印一下这条记录  
        Comment commentById = commentService.findCommentById(comment.getId());  
        System.out.println(commentById);  
    }  

    /**  
     * Method: deleteCommentById(String id)     */    @Test  
    public void testDeleteCommentById() throws Exception {  
        commentService.deleteCommentById("1");  
    }  

    /**  
     * Method: findCommentList()     */    @Test  
    public void testFindCommentList() throws Exception {  
        List<Comment> commentList = commentService.findCommentList();  
        System.out.println(commentList);  
    }  

    /**  
     * 通过id查询一条记录  
     */  
    @Test  
    public void testFindCommentById() throws Exception {  
        Comment commentById = commentService.findCommentById("1");  
        System.out.println(commentById);  
    }  


}
```

这里需要注意如果是`MongoDB 6`以上的版本可能打印不出来，这里可能有像MySQL中MVCC之类的同学，我换成4版本后就可以正常打印出来了

![](https://cdn.fengxianhub.top/resources-master/20220728212121.png)

#### 5.7 根据上级ID查询文章评论的分页列表

（1）CommentRepository新增方法定义

```java
/**  
 * 分页查询，这里的名字要根据提示来，不能写错不然会生成失败  
 */  
Page<Comment> findByUserid(String userid, Pageable pageable);
```

（2）CommentService新增方法

```java
/**  
 * 根据父id查询分页列表  
 * @param userid  
 * @param page 页码  
 * @param size 页数  
 */  
public Page<Comment> findCommentListPageByUserid(String userid,int page ,int size){  
    return commentRepository.findByUserid(userid, PageRequest.of(page-1,size));  
}
```

测试

```java
@Test  
void testFindCommentListPageByParentid() {  
    Page<Comment> pages = commentService.findCommentListPageByUserid("1003", 1, 3);  
    // 打印有多少条记录  
    System.out.println(pages.getTotalElements());  
    List<Comment> contentList = pages.getContent();  
    // 将所有的记录都打印出来  
    contentList.forEach(System.out::println);  
}
```

#### 5.8 MongoTemplate实现评论点赞

我们看一下以下点赞的临时示例代码： CommentService 新增updateThumbup方法

```java
/**  
 * 点赞-效率低  
 * @param id  
 */  
public void updateCommentThumbupToIncrementingOld(String id){  
    Comment comment = commentRepository.findById(id).get();  
    comment.setLikenum(comment.getLikenum()+1);  
    commentRepository.save(comment);  
}
```

以上方法虽然实现起来比较简单，但是执行效率并不高，因为我只需要将点赞数加1就可以了，没必要查询出所有字段修改后再更新所有字 段。(蝴蝶效应)

我们可以使用MongoTemplate类来实现对某列的操作。 

（1）修改CommentService

```java
//注入MongoTemplate  
@Autowired  
private MongoTemplate mongoTemplate;

/**  
 * 点赞数+1  
 * @param id  
 */  
public void updateCommentLikenum(String id) {  
    //查询对象  
    Query query = Query.query(Criteria.where("_id").is(id));  
    //更新对象  
    Update update = new Update();  
    //局部更新，相当于$set  
    // update.set(key,value)    //递增$inc  
    // update.inc("likenum",1);    update.inc("likenum");  
    //参数1：查询对象  
    //参数2：更新对象  
    //参数3：集合的名字或实体类的类型Comment.class  
    mongoTemplate.updateFirst(query, update, "comment");  

    }
```

（2）测试用例：

```java
@Test  
void testupdateCommentLikenum() {  
    // 更新之前  
    System.out.println(commentService.findCommentById("2"));  
    commentService.updateCommentLikenum("2");  
    // 更新之后  
    System.out.println(commentService.findCommentById("2"));  
}
```

测试结果，可以看到数据已经增长了

![](https://cdn.fengxianhub.top/resources-master/20220729094629.png)

更多的命令可以自行进行查看，这里贴一下API的地址：

- <a href="https://www.runoob.com/mongodb/mongodb-java.html">菜鸟教程</a>
- <a href="https://docs.spring.io/spring-data/mongodb/docs/2.1.5.RELEASE/api/">Spring-data MongoDB官方文档</a>

## 6. 在 Nodejs 中使用 MongoDB - mongoose

mongoose 是一个对象文档模型（ODM）库

> https://mongoosejs.com/

- 可以为文档创建一个模式结构（Schema）
- 可以对模型中的对象/文档进行验证
- 数据可以通过类型转换转换为对象模型
- 可以使用中间件应用业务逻辑

### 6.1 mongoose 提供的新对象类型

- Schema
  - 定义约束了数据库中的文档结构
  - 个人感觉类似于 SQL 中建表时事先规定表结构
- Model
  - 集合中的所有文档的表示, 相当于 MongoDB 数据库中的 collection
- Document
  - 表示集合中的具体文档, 相当于集合中的一个具体的文档

### 6.2 简单使用 Mongoose

> https://mongoosejs.com/docs/guide.html

使用 mongoose 返回的是一个 `mogoose Query object`, mongoose 执行 query 语句后的结果会被传进 callback 函数 `callback(error, result)`

> A mongoose query can be executed in one of two ways. First, if you pass in a `callback` function, Mongoose will execute the query asynchronously and pass the results to the `callback`.
> 
> A query also has a `.then()` function, and thus can be used as a promise.

```
const q = MyModel.updateMany({}, { isDeleted: true }, function() {
  console.log("Update 1");
}));

q.then(() => console.log("Update 2"));
q.then(() => console.log("Update 3"));
```

上面这一段代码会执行三次 `updateMany()` 操作, 第一次是因为 callback, 之后的两次是因为 `.then()` (因为 `.then()` 也会调用 `updatemany()`)

**连接数据库并且创建 Model 类**

```
const mongoose = require('mongoose');
// test is the name of database, will be created automatically
mongoose.connect('mongodb://localhost:27017/test', {useNewUrlParser: true});

const Cat = mongoose.model('Cat', { name: String });

const kitty = new Cat({ name: 'Zildjian' });
kitty.save().then(() => console.log('meow'));
```

**监听 MongoDB 数据库的连接状态**

在 mongoose 对象中, 有一个属性叫做 `connection`, 该对象就表示数据库连接.通过监视该对象的状态, 可以来监听数据库的连接和端口

```
mongoose.connection.once("open", function() {
  console.log("connection opened.")
});

mongoose.connection.once("close", function() {
  console.log("connection closed.")
});
```

### 6.3 Mongoose 的 CRUD

首先定义一个 `Schema`

```
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const blogSchema = new Schema({
    title:  String, // String is shorthand for {type: String}
    author: String,
    body:   String,
    comments: [{ body: String, date: Date }],
    date: { type: Date, default: Date.now },
    hidden: Boolean,
    meta: {
        votes: Number,
        favs:  Number
    }
});
```

然后在 `blogSchema` 基础上创建 `Model`

```
const Blog = mongoose.model('Blog', blogSchema);
// ready to go!

module.exports = Blog;
```

当调用上面这一行代码时, MongoDB 会做如下操作

1. 是否存在一个数据库叫做 `Blog` 啊? 没的话那就创建一个
2. 每次用到 Blog 库的时候都要注意内部数据要按照 `blogSchema` 来规定

向数据库中插入文档数据

```
Blog.create({
  title: "title"
  ...
}, function (err){
  if (!err) {
    console.log("successful")
  }
});
```

简单的查询一下下

```
// named john and at least 18 yo
MyModel.find({ name: 'john', age: { $gte: 18 }});
```

mongoose 支持的用法有:

- [`Model.deleteMany()`](https://mongoosejs.com/docs/api.html#model_Model.deleteMany)
- [`Model.deleteOne()`](https://mongoosejs.com/docs/api.html#model_Model.deleteOne)
- [`Model.find()`](https://mongoosejs.com/docs/api.html#model_Model.find)
- [`Model.findById()`](https://mongoosejs.com/docs/api.html#model_Model.findById)
- [`Model.findByIdAndDelete()`](https://mongoosejs.com/docs/api.html#model_Model.findByIdAndDelete)
- [`Model.findByIdAndRemove()`](https://mongoosejs.com/docs/api.html#model_Model.findByIdAndRemove)
- [`Model.findByIdAndUpdate()`](https://mongoosejs.com/docs/api.html#model_Model.findByIdAndUpdate)
- [`Model.findOne()`](https://mongoosejs.com/docs/api.html#model_Model.findOne)
- [`Model.findOneAndDelete()`](https://mongoosejs.com/docs/api.html#model_Model.findOneAndDelete)
- [`Model.findOneAndRemove()`](https://mongoosejs.com/docs/api.html#model_Model.findOneAndRemove)
- [`Model.findOneAndReplace()`](https://mongoosejs.com/docs/api.html#model_Model.findOneAndReplace)
- [`Model.findOneAndUpdate()`](https://mongoosejs.com/docs/api.html#model_Model.findOneAndUpdate)
- [`Model.replaceOne()`](https://mongoosejs.com/docs/api.html#model_Model.replaceOne)
- [`Model.updateMany()`](https://mongoosejs.com/docs/api.html#model_Model.updateMany)
- [`Model.updateOne()`](https://mongoosejs.com/docs/api.html#model_Model.updateOne)

## 7. 使用 Mocha 编写测试 “Test Driven Development”

Mocha 是一个 js 测试的包, 编写测试有两个关键字 `describe` 和 `it`

- `describe` 是一个”统领块”, 所有的 test functions 都会在它”名下”
- `it` 表示每一个 test function

```java
create_test.js
const assert = require('assert')
// assume we have a User model defined in src/user.js
const User = require('../src/user')

// after installing Mocha, we have global access
// to describe and it keywords
describe('Creating records', () => {
  it('saves a user', () => {
    const joe = new User({ name: "Joe" });
    joe.save();
    assert()
  });
});
```

> NoSQL Databases

**Benefits of NoSQL**

- Easy for inserting and retrieving data, since they are contained in one block, in one json object
- Flexible schema, if a new attribute added, it is easy to just add / append to the object
- Scalability, horizontally partition the data (availability > consistency)
- Aggregation, find metrics and etc

**Drawbacks of NoSQL**

- Update = Delete + Insert, not built for update
- Not consistent, ACID is not guaranteed, do not support transactions
- Not read optimized. Read entire block find the attribute. But SQL, just need one column (read time compartively slow)
- Relations are not implicit
- JOINS are hard to accomplish, all manually

## 8. MongoDB单机部署(win + docker)

### 8.1 Windows系统中的安装启动

第一步：下载安装包

MongoDB 提供了可用于 32 位和 64 位系统的预编译二进制包，你可以从MongoDB官网下载安装，MongoDB 预编译二进制包下载地址：[Install MongoDB — MongoDB Manual](https://www.mongodb.com/try/download/community)

这里建议下载`4.0.12`版本的，高版本的有些命令用不了

![](https://cdn.fengxianhub.top/resources-master/20220727154742.png)

根据上图所示下载 zip 包。 

提示：版本的选择： MongoDB的版本命名规范如：x.y.z； 

y为奇数时表示当前版本为开发版，如：1.5.2、4.1.13； 

y为偶数时表示当前版本为稳定版，如：1.6.3、4.0.10； z是修正版本号，数字越大越好。

详情：http://docs.mongodb.org/manual/release-notes/#release-version-numbers

第二步：解压安装启动 

将压缩包解压到一个目录中。 进入bin目录，使用`mongod -version`查看版本

![](https://cdn.fengxianhub.top/resources-master/20220727161207.png)

在解压目录中，手动建立一个目录用于存放数据文件，如 data/db

方式1：命令行参数方式启动服务 

在 bin 目录中打开命令行提示符，输入如下命令：

```java
mongod --dbpath=..\data\db
```

![](https://cdn.fengxianhub.top/resources-master/20220727161631.png)

我们在启动信息中可以看到，mongoDB的默认端口是27017，如果我们想改变默认的启动端口，可以通过--port来指定端口。 

为了方便我们每次启动，可以将安装目录的bin目录设置到环境变量的path中， bin 目录下是一些常用命令，比如 `mongod` 启动服务用的， `mongo` 客户端连接服务用的。

![](https://cdn.fengxianhub.top/resources-master/20220727160240.png)

方式2：配置文件方式启动服务 

在解压目录中新建 config 文件夹，该文件夹中新建配置文件 mongod.conf ，内如参考如下：

```java
storage: 
    #The directory where the mongod instance stores its data.Default Value is "\data\db" on Windows. 
    dbPath: D:\Environment\MongoDB\mongodb-6.0.0\data
```

详细配置项内容可以参考官方文档:  https://docs.mongodb.com/manual/reference/configuration-options/

【注意1】配置文件中如果使用双引号，比如路径地址，自动会将双引号的内容转义

解决： a. 对 \ 换成 / 或 \\ b. 如果路径中没有空格，则无需加引号。 

【注意2】配置文件中不能以Tab分割字段

解决： 将其转换成空格。

启动方式：

```java
mongod -f ../config/mongod.conf 或 mongod --config ../config/mongod.conf
```

更多参数配置：

```java
systemLog:  
  destination: file  
  #The path of the log file to which mongod or mongos should send all diagnostic logging information  
  path: "D:/02_Server/DBServer/mongodb-win32-x86_64-2008plus-ssl-4.0.1/log/mongod.log"  
  logAppend: true  
storage:  
  journal:  
  enabled: true  
  #The directory where the mongod instance stores its data.Default Value is "/data/db".  
  dbPath: "D:/02_Server/DBServer/mongodb-win32-x86_64-2008plus-ssl-4.0.1/data"  
  net:  
  #bindIp: 127.0.0.1  
  port: 27017  
setParameter:  
  enableLocalhostAuthBypass: false
```

### 8.2 Shell连接(mongo命令)

如果你需要进入MongoDB后台管理，你需要先打开mongodb装目录的下的bin目录，然后执行mongo.exe文件，MongoDB Shell是MongoDB自带的交互式Javascript shell,用来对MongoDB进行操作和管理的交互式环境。

```java
./mongo 或 ./mongo --host=127.0.0.1 --port=27017
```

这里高版本的Mongo bin目录下没有mongo.exe文件，这里我换成4.0.12版本的了

![](https://cdn.fengxianhub.top/resources-master/20220727164815.png)

当你进入mongoDB后台后，它默认会链接到 test 文档（数据库）：

可以测试一下常用的Mongo命令

```javascript
> show databases
admin   0.000GB
config  0.000GB
local   0.000GB
```

查看当前的数据库：

```javascript
> db
test
```

由于它是一个JavaScript shell，您可以运行一些简单的算术运算:

```javascript
> 2 + 2
4
```

### 8.3 docker安装启动

<a href="https://blog.csdn.net/qq_51726114/article/details/123184602?ops_request_misc=%257B%2522request%255Fid%2522%253A%2522165891219116782388089283%2522%252C%2522scm%2522%253A%252220140713.130102334..%2522%257D&request_id=165891219116782388089283&biz_id=0&utm_medium=distribute.pc_search_result.none-task-blog-2~all~baidu_landing_v2~default-2-123184602-null-null.142^v35^experiment_2_v1,185^v2^tag_show&utm_term=docker%E5%AE%89%E8%A3%85mogodb&spm=1018.2226.3001.4187">参考安装地址</a>

### 8.4 Compass-图形化界面客户端

 到MongoDB官网下载MongoDB Compass

 地址：https://www.mongodb.com/download-center/v2/compass?initial=true 

 如果是下载安装版，则按照步骤安装；如果是下载加压缩版，直接解压，执行里面的 `MongoDBCompassCommunity.exe` 文件即可。 

 在打开的界面中，输入主机地址、端口等相关信息，点击连接：

![](https://cdn.fengxianhub.top/resources-master/20220727170059.png)

我司使用的工具是`noSqlBooster`，感觉也挺好用的：https://www.nosqlbooster.com/

## References

- https://mongoosejs.com/docs/guides.html
- https://docs.mongodb.com/
- https://www.bilibili.com/video/av59604756
- https://www.bilibili.com/video/BV1bJ411x7mq
- https://www.youtube.com/watch?v=-56x56UppqQ
