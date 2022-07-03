# sqoop

## 1. 全量导入

将表导入指定文件夹下（将导入文件保存到hdfs://lfy/input/project）

```java
sqoop import --connect jdbc:mysql://localhost:3306/mysql?serverTimezone=UTC \
--username lijie \
--table general_log \
--target-dir /logs/mysql-log/general_log
```

```java
--target-dir /lfy/input/project
```



>-query，

-query不能与--table --column 合用，需要指定$CONDITIONS 表名分区列  -

```java
sqoop import --connect jdbc:mysql://localhost:3306/sqoop?serverTimezone=UTC \
--username root \
--password 123456 \
--table project \
--target-dir /lfy/input/project
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













































