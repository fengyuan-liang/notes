# sqoop

## 1. 全量导入

将表导入指定文件夹下（将导入文件保存到hdfs://lfy/input/project）

```java
sqoop import --connect jdbc:mysql://localhost:3306/sqoop?serverTimezone=UTC \
--username lijie \
--table user_logs \
--num-mappers 1 \
--target-dir /logs/user_logs/user_log2 \
--delete-target-dir 
```

```java
sqoop import --connect jdbc:mysql://localhost:3306/sqoop?serverTimezone=UTC \
--username lijie \
--table cloud_disk_log \
--num-mappers 1 \
--target-dir /logs/user_logs/cloud_disk_log \
--delete-target-dir 
```

```java
--target-dir /lfy/input/project
```

```java
sqoop import \
--connect jdbc:mysql://single:3306/sqoop_test \
--username root \
--password kb10 \
--table student \
--target-dir /sqooptest/table_all \
--delete-target-dir \
--num-mappers 1 \
--fields-terminated-by ','
```

>-query，

-query不能与--table --column 合用，需要指定$CONDITIONS 表名分区列  -

```java
sqoop import --connect jdbc:mysql://localhost:3306/sqoop?serverTimezone=UTC \
--username lijie \
--table project \
--target-dir /lfy/input/project
```

>执行sql语句导入（mysql到hdfs）

```java
sqoop import \
--connect jdbc:mysql://localhost:3306/sqoop \
--username lijie \
--target-dir  /logs/user_logs/user_log \
--delete-target-dir \
--num-mappers 1 \
--query 'SELECT * FROM user_logs LIMIT 1000 where $CONDITIONS'
```



```java
sqoop import --connect jdbc:mysql://node3:3306/testsqoop?serverTimezone=UTC --username root --password 123456 --table project   --target-dir /zy/input/project

分析：   将导入的文件 保存到 hdfs://zy/input/project

sqoop import --connect jdbc:mysql://node3:3306/testsqoop?serverTimezone=UTC --username root --password 123456 --table project  --warehouse-dir /zy2/input

分析：   将导入的文件 保存到 hdfs://zy2/input/project
           与上面的对比： 在   指定的   /zy2/input下创建一个目录，名字为表名.    此时这个表名就当成了一个数据仓库名  (warehouse )

 sqoop import --connect jdbc:mysql://node3:3306/testsqoop?serverTimezone=UTC --username root --password 123456 --table project  --warehouse-dir /zy3/input  --columns  'id,name,type'  --where 'id>2'  -m 1

 分析：  -m  1  表示只用到一个mapper,  一个mapper对应一个切片，对应一个输出文件. 
             --columns   指定列名
             --where    指定条件
             因为用了  --table, 所以以上会自动地拼装sql 语句. , 不能与    -e or -query 合用. 

sqoop import --connect jdbc:mysql://node3:3306/testsqoop?serverTimezone=UTC --username root --password 123456 --target-dir /zy5/input  --query 'select id,name,type from project where id>2 and  $CONDITIONS'  --split-by project.id -m 1

 分析:    -query 不能与 --table, --column  合用. 
            指定  $CONDITIONS  表明分区列. 
               --target-dir  保存数据的数仓名字. 


sqoop import --connect jdbc:mysql://node3:3306/testsqoop?serverTimezone=UTC --username root --password 123456 --table project --target-dir /zy6/input  --direct   -m 1
   分析:  --direct    使用    mysqldump   命令完成导入工作    因为是集群，map任务是分配到每个节点运行，所以每个节点都要有mysqldump命令.

```

## 2. 增量导入

```java

==================================增量导入===================================
sqoop import --connect jdbc:mysql://node3:3306/testsqoop?serverTimezone=UTC --username root --password 123456  --target-dir /zy7/input  --table project -m 1 --check-column id   --incremental append --last-value 3


insert into project( name,type,description,create_at,status)
values( 'project5',5,'project5 zy','2019-07-25',0);
insert into project( name,type,description,create_at,status)
values( 'project6',5,'project5 zy','2019-07-25',0);
insert into project( name,type,description,create_at,status)
values( 'project7',5,'project5 zy','2019-07-25',0);
insert into project( name,type,description,create_at,status)
values( 'project8',5,'project5 zy','2019-07-25',0);

sqoop import --connect jdbc:mysql://node3:3306/testsqoop?serverTimezone=UTC --username root --password 123456  --target-dir /zy7/input  --table project -m 1 --check-column id   --incremental append --last-value 7

insert into project( name,type,description,create_at,status)
values( 'project6',5,'project5 zy','2019-07-25',0);
insert into project( name,type,description,create_at,status)
values( 'project7',5,'project5 zy','2019-07-25',0);
insert into project( name,type,description,create_at,status)
values( 'project8',5,'project5 zy','2019-07-25',0);
insert into project( name,type,description,create_at,status)
values( 'project9',5,'project5 zy','2019-07-25',0);

   分析：以上运行 增量导入两次，生成了两个文件.   均按  last-value 导入. 


sqoop import   --connect jdbc:mysql://node3:3306/testsqoop?serverTimezone=UTC --username root --password 123456  --target-dir /zy8/input  --table project -m 1 --check-column update_at  --incremental lastmodified  --last-value "2022-06-28 16:45:12" --append

```

## 3. jar包命令

mapreduce命令

```java
hadoop jar sqoopTest.jar com.fx.service.App /logs/user_logs/user_log /logs/user_logs/out 
```

## 4. Azkaban Job编写

先写数据源

在写MapReduce

start：

```java
#执行脚本
# start.job
type=command
command=sqoop import --connect jdbc:mysql://localhost:3306/sqoop?serverTimezone=UTC --username lijie --table user_logs --num-mappers 3 --target-dir /logs/user_logs/user_log2 --delete-target-dir 
```

mapreduce：

```java
#执行脚本
# mapreduce.job
type=command
dependencies=start
command=hadoop jar sqoopTest.jar com.fx.service.App /logs/user_logs/user_log /logs/user_logs/user_log_out 
```

sqoop：

```java
#执行脚本
# mapreduce.job
type=command
dependencies=mapreduce
command=sqoop export --connect jdbc:mysql://hadoop3:3306/sqoop --username lijie -export-dir /logs/user_logs/user_log_out/part-r-00000 --table user_logs_analyse --input-fields-terminated-by '\t' --columns="user_name,user_operate,num"
```

## 5. 启动所有服务的脚本

需要将启动命令发送给其他的主机，要用到``

```java
#!/bin/bash
if $(zkServer.sh);then $(hadoop fs -touchz /root/data/input2/test.txt);
else $(hadoop fs -mkdir -p /root/data/input2 && hadoop fs -touchz /root/data/input2/test.txt);
fi
```



## 一、Sqoop基本原理

原文链接：https://blog.csdn.net/weixin_48482704/article/details/109821541

### 1.1、何为Sqoop？

Sqoop(SQL-to-Hadoop)是一款开源的工具，主要用于在Hadoop(Hive)与传统的数据库(mysql、postgresql…)间进行数据的传递，可以将一个关系型数据库（例如 ： MySQL ,Oracle ,Postgres等）中的数据导入到Hadoop的HDFS中，也可以将HDFS的数据导出到关系型数据库中。









































