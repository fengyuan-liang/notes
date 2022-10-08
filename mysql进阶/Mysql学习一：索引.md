# Mysql学习一：索引

## 1. B+树

如果我们有一条慢sql，该如何优化？加机器？

**我们首先应该看的是这条sql索引走的好不好**

索引是帮助Mysql高效获取数据的排好序的数据结构，而在Mysql中默认的索引数据结构为B+树

![image-20220709123549440](https://cdn.fengxianhub.top/resources-master/202207091235625.png)

**Mysql底层使用的是B+树索引**

>B+树和B树的区别
>
>![image-20220709105520413](https://cdn.fengxianhub.top/resources-master/202207091055621.png)
>
>- 叶子结点有指针指向
>- 叶子结点的父结点数据冗余了一份

在<a href="https://dev.mysql.com/doc/internals/en/innodb-fil-header.html">Mysql官网上</a>也有B+树描述

 To show what they're about, I'll draw a two-level B-tree.

```java
--------
  - root -
  --------
       |
  ----------------------
  |                    |
  |                    |
  --------          --------
  - leaf -  <-->    - leaf -
  --------          --------
```

Everyone has seen a B-tree and knows that the entries in the root page point to the leaf pages. (I indicate those pointers with vertical '|' bars in the drawing.) **But sometimes people miss the detail that leaf pages can also point to each other** (I indicate those pointers with a horizontal two-way pointer '<-->' in the drawing). This feature allows `InnoDB` to navigate from leaf to leaf without having to back up to the root level. This is a sophistication which you won't find in the classic B-tree, which is why `InnoDB` should perhaps be called a B+-tree instead.

所以在Mysql中的B+ tree有以下特点：

- 非叶子结点没有数据，所有的数据都放在叶子结点上（innodb默认的聚簇索引）

- 叶子结点是双向的指针

总之，B+树是基于B树进行修改，升级，并不是所有的B+树都是一样的

那么一个结点可以存储的空间是多少呢 ？我们可以查询看到

```sql
SHOW VARIABLES LIKE	'innodb_page_size'
```

是`16KB`，在Mysql中称其为一页，为数据交换的最小单元，也就是读、写数据都会以此为单位

**一页就是树的一个节点**，在<a href="https://dev.mysql.com/doc/internals/en/innodb-page-overview.html">Mysql官网</a>我们可以看到，页的组成结构由七个部分组成：

- File Header：文件头，总共`38 Bytes`，记录页的`头信息`
- Page Header：页头，总共`56 Bytes`，记录页的`状态信息`
- Infimum + Supremum Records：下确界+上确界记录（每个数据页中都有两个`虚拟的行记录`，用来限定记录（`User Record`）的边界（`Infimum为下界`，`Supremum为上界`））
- User Records：存储`实际插入的行记录`
- Free Space：空闲空间，数据结构是`链表`，在一个记录`被删除`后，该空间会被加入到空闲链表中
- Page Directory：存放着`行记录`（`User Record`）的`相对位置`（不是偏移量）
- File Trailer：文件尾，总共`8 Bytes`，为了`检测页是否已经完整地写入磁盘`

![image-20220709223808781](https://cdn.fengxianhub.top/resources-master/202207092238983.png)

![image-20220709225244133](https://cdn.fengxianhub.top/resources-master/202207092252238.png)

那么一棵高度为3的B+树最多可以存放多少个元素呢，我们可以看到B+树中索引和索引之间存放的是下一级索引的地址（默认6byte，48Bit）

如果我们用bigint（8byte，64Bit）作为主键，第二层可以存放 16KB/(8 + 6)B = 1170个索引地址

如果一个data的内存地址占用1KB，那么第三层可以放：16KB * 1170 / 1KB ，大概两千多万个data，如果是int类型，三层可以存四千万条数据，两层可以存两万六千多条

![image-20220709124502060](https://cdn.fengxianhub.top/resources-master/202207091245213.png)

一般mysql在启动的时候就会把第一层和第二层都会加载到内存中，然后只需要一次IO就能拿到我们想要的数据

## 2. 存储引擎

我们可以查看mysql中的存储引擎：

```sql
#查看支持的搜索引擎类型
mysql> show engines;
##mysql中的引擎有
CSV               
MRG_MYISAM        
MyISAM            
BLACKHOLE         
PERFORMANCE_SCHEMA
MEMORY            
ARCHIVE           
InnoDB            
FEDERATED

#第三方引擎类型
RocksDB  -- 可以解决InnoDB用雪花id做主键性能差的问题
MyRocks 
TokuDB
压缩比较高,数据的插入性能高.其他功能和InnoDB没差

#查看mysql默认的存储引擎
mysql> select @@default_storage_engine;
+--------------------------+
| @@default_storage_engine |
+--------------------------+
| InnoDB                   |
+--------------------------+

#设置存储引擎
[root@mysql ~]# vim /etc/my.cnf
[mysqld]
default_storage_engine=InnoDB

#查看表存储引擎状态
mysql> show create table stu;
mysql> show table status like 'stu'\G
mysql> select table_schema,table_name ,engine from information_schema.tables where table_schema not in ('sys','mysql','information_schema','performance_schema');
```

mysql中常用的存储引擎有：`MyISAM`、`Innodb`、`Memory`，现在主要使用的是前两种，区别有

1. InnoBD支持事物，MyISAM不支持事物

   这也是Mysql将默认存储引擎从MyISAM变成InnoDB的重要原因之一

2. InnoDB支持`外键`，而MyISAM不支持

   对一个包含外键的InnoDB表转为MyISAM会失败

3. InnoDB是聚集索引、MyISAM是非聚集索引

   聚集索引的文件存放在主键索引的叶子结点上，因此InnoDB必须要有主键，通过主键索引效率很高，但是辅助索引需要两次查询（回表），先查到主键，再根据主键索引查到数据，因此，主键不能过大，过大会导致其他索引也会变大

4. InnoDB不保存表的具体行数，执行`select count(*) from table`时需要进行全表扫描。而MyISAM用一个变量保存了整个表的行数，执行上述sql语句时只需要读出该变量即可，速度很快

5. **InnoDB最小的锁粒度是行锁，MyISAM最小的锁粒度为表锁**

   在MyISAM中一个更新语句就会锁住整张表，导致其他查询和更新都会被堵塞，会导致并发受限

**在MyISAM中，一张表分为三个部分进行存储**

![image-20220709200827779](https://cdn.fengxianhub.top/resources-master/202207092008015.png)

>MyISAM索引文件和数据文件是分离的（分聚集）

![image-20220709201057961](https://cdn.fengxianhub.top/resources-master/202207092010135.png)

在MyISAM中根据索引查找元素，查到的是索引的地址，需要根据地址进行寻址

在Innodb中，一张表的分为两个部分进行存储

![image-20220709201526892](https://cdn.fengxianhub.top/resources-master/202207092015034.png)

>InnoDB索引实现是聚簇索引

![image-20220709201727824](https://cdn.fengxianhub.top/resources-master/202207092017998.png)

Innodb叶子结点中存放的是数据，不是数据的地址，这样对比MyISAM少了一次磁盘IO的操作

当我们用非主键索引去查询一条数据时，往往非主键索引里面存的数据不完整，这是需要根据非主键索引存放主键索引（默认会存储一份），会再查找一次主键索引（回表），所以一般非主键索引查询会比主键索引慢（也有快的时候，就是索引覆盖的情况，后面会讲）

![image-20220709202254618](https://cdn.fengxianhub.top/resources-master/202207092022804.png)

如果我们使用Innodb建表但是没有建主键，由于Mysql底层一定会通过B+树来构建表结构，所以Mysql会从我们的字段中挑选一列（唯一）来做隐式的索引

如果找不到满足唯一的索引列，Mysql就会在你的表结构之外建一个隐式的索引`RowID`，帮你维护一个唯一的索引。这样浪费性能，所以我们一般都要建`唯一自增索引`，并且索引最好是int类型，比较好进行比较，自增是为了让B+树维护平衡的开销减少（**一直在叶子结点往后插入，不会出现分裂的现象**）

在Mysql中除了B+树索引外，其实还有Hash索引

![image-20220709203511948](https://cdn.fengxianhub.top/resources-master/202207092035028.png)

什么是Hash呢？其实就是**一维数组 + 二维链表的存储结构**，这个和HashMap底层是一样的

![image-20220709203702860](https://cdn.fengxianhub.top/resources-master/202207092037019.png)

首先我们根据给定字段计算它的hash值，并将hash值对一维数组的容量进行取模，得出这个元素要存放的位置，例如`Alice`的hash值为2，那么它会放到2这个位置，如果后面还有元素也要存放到2这个位置，那么就会在前一个结点后面再添加一个结点（链表）

Hash定位索引的时间复杂度为O(1)，**效率比B+树更高，但是现实生活中基本不用**

原因有：

- hash冲突（次要，链表可以用红黑树优化）
- **不支持范围查询（最主要的原因）**

例如我们要计算name > Tom的所有数据，hash索引就不能满足我们的需求了，显然B+树可以支持

>这也是B+树叶子结点双向指针的作用了，**便于进行范围查询**

![image-20220709204307676](https://cdn.fengxianhub.top/resources-master/202207092043106.png)

## 3. 联合/组合索引

显示开发中，一般我们会使用联合索引，那么联合索引的底层存储结构张什么样呢？

例如我们建立一个联合索引，选取字段`name`、`age`、`positon`作为联合索引，那么Mysql会根据这三个字段为我们创建一棵新的B+树作为索引，该树的叶子结点存放的就是这三个字段的值

![image-20220709205722543](https://cdn.fengxianhub.top/resources-master/202207092057687.png)

**联合索引底层其实就是排好序的B+树索引**，根据索引依次进行排序，例如按照上面的姓名进行排序，如果性能相同，再按照年龄进行排序

### 3.1 最左前缀原则

>什么是最左前缀原则呢？

其实很简单，联合索引本身就是先对第一个字段进行排序，相同再对第二个字段进行排序。如果直接根据第二个字段进行查找，此时该字段很可能就是无序的，就只能进行全表扫描了，所以我们要求要从左往右找，这就是最左前缀原则

结合**最左前缀原则**，我们看下面的sql语句，看那几条走了索引

最左前缀原则就是在查找联合索引的时候，一定要从最左边的索引开始查（右边的不能跳过左边的索引），才会走索引

```sql
KEY `idx_name_age_position` (`name`,`age`,`position`) USING BTREE

EXPLAIN SELECT * FROM employee WHERE name = 'Bill' AND age = 31
EXPLAIN SELECT * FROM employee WHERE age = 31 AND position = 'dev'
EXPLAIN SELECT * FROM employee WHERE position = 'manager'
```

根据**最左前缀原则**显然只有第一条sql会走联合索引，后面两条不会走索引

### 3.2 回表

在InnoDB中的回表是指经过一次查询后找到数据后，再通过这个数据附带的主键id重新去另一颗B+树中找所有的信息。例如这里有一张表

```sql
CREATE TABLE `test_explain`(
	 a int(11) NOT NULL AUTO_INCREMENT COMMENT '索引',
	 b int(11),
	 c int(11),
	 d int(11),
	 e int(11),
	 PRIMARY KEY (`a`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 1 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = COMPACT;
-- 联合索引
CREATE INDEX idx_t1_bcd ON test_explain(b,c,d)
-- 当我们执行这条sql时，由于联合索引中并没有我们想要的所有数据，所以还需要根据查到的结点附带的主键id到主键B+树中查询（非主键索引会携带主键索引），这种多一次查询的操作就被成为回表（InnoDB）
EXPLAIN SELECT * FROM test_explain WHERE b = 1 AND c = 2 AND d = 3
```

### 3.3 索引下推（Using index condition）

所谓的索引下推就是指在走联合索引时，根据索引字段过滤掉部分结果，减少回表次数

```sql
-- 索引下推
EXPLAIN SELECT * FROM test_explain WHERE b = 1 AND d = 3
```

在mysql5.6之前的版本中，这样的sql会现在联合索引中查到所有的`b = 1`的记录，然后根据主键索引进行回表，再查询`d = 3`的记录，这样显然会回表很多次，在后续的版本中，会在联合索引的查询中先对`d = 3`进行过滤，再进行回表，显然这样回表的数次就会减少，即`索引下推`（**非主键索引条件过滤**）

![image-20220710142915478](https://cdn.fengxianhub.top/resources-master/202207101429685.png)

>范围查找导致索引失效

在下面的sql中，会先在联合索引中进行条件过滤（索引下推），再根据主键索引查找

```sql
-- 索引失效
EXPLAIN SELECT * FROM test_explain WHERE b > 3
```

但是对于这样的范围查找，多了回表的步骤，显然不走索引直接遍历主键B+树的第三层其实会更快一些（所以走索引并不一定比不走索引快）

### 3.4 覆盖索引

我们看下面的sql，这次我们不需要查询所有的数据了，显然也不需要回表操作了

```sql
-- 覆盖索引
EXPLAIN SELECT b  FROM test_explain WHERE b > 3
```

![image-20220710143825299](https://cdn.fengxianhub.top/resources-master/202207101438387.png)

`Using index`，**这种sql里面需要的字段在当前索引中能找到，不需要进行回表操作，我们就将称之为覆盖索引**

### 3.5 优化器

**CBO**

基于成本的优化

**RBO**

基于规则的优化

### 3.6 常见sql分析

>索引扫描底层原理

下面的这条sql也会走索引

```sql
-- 索引扫描底层原理
EXPLAIN SELECT b  FROM test_explain 
```

![image-20220710145200110](https://cdn.fengxianhub.top/resources-master/202207101452206.png)

虽然没有索引条件，但是走主键B+树显然代价会比走索引B+树代价高一些，所有mysql底层也会通过索引来进行性能优化

>order by 导致索引失效

```sql
-- order by 导致索引失效
EXPLAIN SELECT * FROM test_explain  ORDER BY b,c,d
```

![image-20220710145413739](https://cdn.fengxianhub.top/resources-master/202207101454845.png)

上面的sql有两种执行方式

- 全表扫描（需要格外的排序，但是在内存中排序非常快）
- 走b、c、d索引（因为b、c、d索引本身已经有序，不需要排序，但是需要回表）

所以下面的走索引更好，因为不需要排序

```sql
EXPLAIN SELECT b FROM test_explain ORDER BY b,c,d
```

![image-20220710145752540](https://cdn.fengxianhub.top/resources-master/202207101457645.png)

### 3.7 Mysql中的隐式类型转换

我们将刚才的表进行修改，增加一列，类型为`varchar`，现在根据`varchar`建立索引

```sql
CREATE TABLE `test_explain`(
	 a int(11) NOT NULL AUTO_INCREMENT COMMENT '索引',
	 b int(11),
	 c int(11),
	 d int(11),
	 e int(11),
	 f VARCHAR(20),
	 PRIMARY KEY (`a`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 1 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = COMPACT;
-- 根据varchar类型字段建立索引
create INDEX index_t1_f ON test_explain(f)
```

我们看下面的sql

```sql
SELECT 'a' = 0 -- 结果为1
SELECT 'b' = 1 -- 结果为0
```

在mysql中，当等式两边的类型不一致时，就会去进行隐式的类型转换

- 当字符为varchar类型时，例如`'a'`、`'b'`，会统统转为数字`0`
- 当本身就为数字时，就会转为对应的数字，例如`'123'`会转为数字123

所有对于下面的sql来说

```sql
EXPLAIN SELECT * FROM test_explain WHERE f = 1 -- 查不到
EXPLAIN SELECT * FROM test_explain WHERE f = 0 -- 查到所有记录
```

将字符全部转为数字0后，会将之前的索引树转换，显然Mysql不能构建这样的索引树

![image-20220710152121570](https://cdn.fengxianhub.top/resources-master/202207101521689.png)

>这里有一个统一的结论，在Mysql中**只要对字符串索引值进行了操作**（包括隐式转换、运算、聚合函数等），就会导致查找时不走索引，而是全表扫描

## 4. Mysql中索引类型

![image-20220710155201256](https://cdn.fengxianhub.top/resources-master/202207101552436.png)

- <a href="https://blog.csdn.net/qq_41453285/article/details/115267538?ops_request_misc=%257B%2522request%255Fid%2522%253A%2522165743929916782390544262%2522%252C%2522scm%2522%253A%252220140713.130102334..%2522%257D&request_id=165743929916782390544262&biz_id=0&utm_medium=distribute.pc_search_result.none-task-blog-2~all~sobaiduend~default-2-115267538-null-null.142^v32^pc_rank_34,185^v2^control&utm_term=fulltext&spm=1018.2226.3001.4187">全文索引相关博客</a>

### 4.1 全文索引

lunce、solr和ElasticSearch就是做全文检索的，里面涉及到了倒排索引的概念，mysql很少使用全文索引。

要用来查找文本中的关键字，不是直接与索引中的值相比较，像是一个搜索引擎，配合 match against 使用，现在只有char，varchar，text上可以创建索引，在数据量比较大时，先将数据放在一个没有全文索引的表里，然后在利用create index创建全文索引，比先生成全文索引在插入数据快很多

### 4.2 普通索引

当我们需要建立索引的字段，既不是主键索引，也不是唯一索引

那么就可以创建一个普通索引

```sql
create index  index_name on table(column)
```

或者创建表时指定

``` sql
create table(..., index index_name column)
```

### 4.3 唯一索引

唯一索引 类似于普通索引，索引列的值必须唯一

唯一索引和主键索引的区别就是，唯一索引允许出现空值，而主键索引不能为空

```sql
create unique index index_name on table(column)
```

或者创建表时指定

```sql
unique index_name column
```

### 4.4 组合/联合索引

目前，在业务不是特别复杂的时候，可能使用一个列作为索引，或者直接采用主键索引即可，但是如果业务变得复杂的时候，就需要用到组合索引，通过对多个列建立索引。

组合索引的用处，假设我现在表有个多个字段：id、name、age、gender，然后我经常使用以下的查询条件

```sql
select * from user where name = 'xx' and age = xx
```

这个时候，我们就可以通过组合 name 和 age 来建立一个组合索引，加快查询效率，建立成组合索引后，我的索引将包含两个key值

在多个字段上创建索引，遵循**最左匹配**原则

```sql
alter table t add index index_name(a,b,c);
```

### 4.5 前缀索引

针对char、varchar的前几个字符建立索引，前缀索引在Mysql中无法进行`order by`、`group by`

### 4.6 三星索引

`对于一个查询而言，一个三星索引，可能是其最好的索引`
如果查询使用三星索引，一次查询通常只需要进行一次磁盘随机读以及一次窄索引片的扫描，因此其相应时间通常比使用一个普通索引的响应时间少几个数量级

- 一个查询相关的索引行是相邻的或者至少相距足够靠近的则获得一星
- 如果索引中的数据顺序和查找中的排列顺序一致则获得二星
- 如果索引中的列包含了查询中需要的全部列则获得三星

三星索引在实际的业务中如果无法同时达到，**一般我们认为第三颗星最重要（不需要回表）**，第一和第二颗星重要性差不多，根据业务情况调整这两颗星的优先度

### 4.7 索引执行计划

![image-20221007160355677](https://cdn.fengxianhub.top/resources-master/202210071603883.png)

```java
id // 选择标识符
select_type // 表示查询的类型
table // 输出结果集的表
partitions // 匹配的分区
type // 表示表的连接类型，
possible_keys // 表示查询时，可能使用的索引
key // 表示实际使用的索引
key_len // 索引字段的长度
ref // 列与索引的比较
rows // 扫描出的行数(估算的行数)
filtered // 按表条件过滤的行百分比
Extra // 执行情况的描述和说明
```

#### 4.7.1 type列

>表示连接类型，类型有ALL、index、range、 ref、eq_ref、const、system、NULL，这几种类型从左到右，性能越来越高。一般一个好的sql语句至少要达到range级别。all级别应当杜绝
>
>阿里开发手册这样规定：
>
>【推荐】SQL 性能优化的目标：至少要达到 `range` 级别，要求是 `ref` 级别，如果可以是 `consts `最好。 
>
>说明： 
>
>- consts 单表中最多只有一个匹配行（主键或者唯一索引），在优化阶段即可读取到数据。 
>- ref 指的是使用普通的索引（normal index）。 
>- range 对索引进行范围检索。 
>
>反例：explain 表的结果，type=index，索引物理文件全扫描，速度非常慢，这个 index 级别比较 range 还低，与全表扫描是小巫见大巫。

```css
ALL：全表扫描，应当避免该类型
index：索引全局扫描，index与ALL区别为index类型只遍历索引树
range：检索索引一定范围的行
ref：非唯一性索引扫描，返回匹配某个单独值的所有行
eq_ref：唯一索引扫描，对于每个索引键，表中只有一条记录与之匹配。常见主键或唯一索引扫描
const：表示通过一次索引就找到了结果，常出现于primary key或unique索引
system：system是const类型的特例，当查询的表只有一行的情况下，使用system
NULL：MySQL在优化过程中分解语句，执行时甚至不用访问表或索引，是最高的登记
```



## 5. 索引选择

### 5.1 索引字段选择

综上所述，我们可以得出索引选择的优先级

```sql
整形  >  date/time  >  enum/char  > varchar  > blob/txt
```

**选用字段长度最小、优先使用定长型、数值型字段中避免使用`ZEROFILL`**

- time ：定长运算快，节省时间，考虑时区，写sql不方便
  enum：能约束值的目的，内部用整形来储存，但与char联查时，内部要经历串与值的转化
- char : 定长，考虑字符集和校对集
  varchar：不定长，要考虑字符集的转换与排序时的校对集，速度慢
- text,blob ：无法使用内存临时表(排序操作只能在磁盘上进行)

>注意: date，time的选择可以直接选择使用时间戳，enum("男""女")内部转成数字来储存，多了一个转换的过程，可以使用tinyint代替最好使用tinyint。

**可选整形就不选字符串**

整型是定长的，没有国家/地区之分，没有字符集差异。例如: tinyint和char(1)从空间上看都是一字节，但是order by排序tinyint 快。原因是后者需要考虑字符集与校对集(就是排序优先集)

**够用就行不要慷慨**

大的字段影响内存影响速度。以年龄为例：`tinyint unsigned not null`可以储存255岁，足够了，用int浪费3个字节。以varchar(10)，varchar(300)储存的内容相同，但在表中查询时，
varhcar(300)要花用更多内存。

**尽量避免使用NULL**

null不能索引和查询

**char与varchar选择**

char是定长的，处理速度会快很多

### 5.2 索引的使用

MySQL每次只使用一个索引，与其说 数据库查询只能用一个索引，倒不如说，和全表扫描比起来，去分析两个索引 B+树更耗费时间，所以where A=a and B=b 这种查询使用（A，B）的组合索引最佳，B+树根据（A，B）来排序。

- 主键，unique字段
- 和其他表做连接的字段需要加索引
- 在where 里使用 >, >=, = , <, <=, is null 和 between等字段。
- 使用不以通配符开始的like，where A like ‘China%’
- 聚合函数里面的 MIN()， MAX()的字段
- order by  和 group by字段

### 5.3 何时不使用索引

- 表记录太少
- 数据重复且分布平均的字段（只有很少数据的列）；
- 经常插入、删除、修改的表要减少索引
- text，image 等类型不应该建立索引，这些列的数据量大（加入text的前10个字符唯一，也可以对text前10个字符建立索引）
- MySQL能估计出全表扫描比使用索引更快的时候，不使用索引

### 5.4 索引何时失效

- 组合索引为使用最左前缀，例如组合索引（A，B），where B = b 不会使用索引
- like未使用最左前缀，where A  like "%China"
- 搜索一个索引而在另一个索引上做 order by， where A = a order by B，只会使用A上的索引，因为查询只使用一个索引。
- or会使索引失效。如果查询字段相同，也可以使用索引。例如  where A = a1 or A = a2（生效），where A=a or B = b （失效）
- 在索引列上的操作，函数upper()等，or、！ = （<>）,not in 等

## 6. 索引优化面试回答

>如何优化索引？关键点：覆盖索引、回表、下推、最左、explain分析执行计划

首先创建索引会考虑一下几个因素：

### 6.1 覆盖索引

`覆盖索引`可以有效减少**回表次数**，其中Mysql5.6之后对`覆盖索引`做了优化，可以支持**索引下推（非主键索引条件过滤）**的一个功能

我们可以把覆盖索引所覆盖的字段进一步进行筛选，尽可能的减少回表次数

此项可以在`explain`中查看执行计划的时候，通过`Extra`字段里面的`Using index Condition`查看到

如果我们的存储介质采用的是机械硬盘，因为机械硬盘不能进行随机读写，有磁盘寻址的开销

这时我们可以把`Mrr`打开，也就是`Multi range read`，它可以在回表之前把我们的ID读到一个`Buffer`里面，并进行一个排序，把原本的随机操作变成一个顺序操作

以上就是覆盖索引做的一些优化，覆盖索引可以避免，例如排序用到的一些临时文件

可以通过最左原则和覆盖索引配合减少一些索引的维护

### 6.2 使用普通索引

针对写多读少且对唯一性要求不高服务（可以通过业务代码保证索引的唯一性），这时我们可以使用普通索引，因为普通索引可以使用`Change Buffer`，`Change Buffer`可以将一些写操作缓存下来，在我们读的时候进行`Merge`操作，这样就可以提高我们写入的速度和内存的命中率

### 6.3 索引未命中的情况

如果我们的索引未命中，首先我们应该看是不是sql写的有问题，例如：

- 我们对索引字段进行了一些函数操作
- 连接表查询的时候，两个表的编码集不一样

如果还是索引未命中，我们可以再进一步排查，有没有可能连接表查询时两个字段的类型不一样，例如说String，赋值给ID时，如果String要跟ID进行比较，在Mysql中会把String自动转成ID，通过隐式函数`cast`进行转换

如果sql并没有问题，可以考虑是不是`索引统计`有问题

如果`索引统计`统计有问题，我们可以去`Analyze table`重新统计所有的信息，因为我们知道索引信息并不是一个准确值，而是一个随机采样的过程，可能会出现问题

此外也有可能是我们的业务表过多，造成内存空洞较多，都可能造成索引选择的问题

### 6.4 explain分析出来的索引一定是最优的吗？

是不一定的，可能会选错，因为我们在索引的时候，可能会涉及到一些回表操作和一些排序操作

### 6.5 索引原因导致慢查询

索引建的不好，索引走的很差，出现查询速度很慢的情况

碰到这种情况，我们首先考虑使用`force index`，强制走索引，但是这样是不太好的，应该作为业务的一个应急预案

因为这种方式如果迁移数据库会导致不支持的情况，并且这种方式还需要做一个代码的重新发布，这种是不太好的

我们其实首先应该考虑的是能不能通过最左原则和覆盖索引把选错的索引删除

## 7. 阿里索引调优规范

1. 单表索引数量控制在5个以内
2. 不允许存在重复索引和冗余索引
3. 防止字段隐式转换导致索引失效
4. sql优化知道达到range级别
5. 利用覆盖索引避免回表
6. 禁止超过三个表的join
	表关联算法：NLJ算法、BNL算法
7. 在varchar上建立索引，需要指定索引长度
8. 索引字段不允许为null，必须要有默认值
9. 单表数量不能超过1000w
10. 字段列数量控制在30以内
11. 不建议使用Mysql分区表
12. 单表行数操作500W或单表容量超过2G建议分库分表



















