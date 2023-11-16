# Mysql视图/存储过程/触发器

## 1. 视图

视图（View）是一种`虚拟存在的表`。视图中的数据并不在数据库中真实存在，行和列数据来自自定义视图的查询中使用的表，并且是在使用视图时动态生成的。

通俗的讲，视图只保存了查询的SQL逻辑，不保存查询结果。所以我们在创建视图时，主要的工作就落在创建这条SQL查询语句上。

### 1.1 基本语法

```sql
-- 创建视图
CREATE [OR REPLACE] VIEW 视图名称[(列名列表)] AS SELECT语句 [WITH [ CASCADED | LOCAL ] CHECK OPTION]

-- 查询视图
-- 查看创建视图语句
show create view 视图名称;
-- 查看视图数据 (视图是一张虚拟表，我们可以像操作表一样操作视图)
select * from 视图名称......;

-- 修改视图
-- 方法一
CREATE [OR REPLACE] VIEW 视图名称[(列表名称)] AS SELECT语句 [WITH[CASCADED | LOCAL] CHECK OPTION]
-- 方法二
ALTER VIEW 视图名称[(列名列表)] AS SELECT语句 [WITH[ CASCADED | LOCAL] CHECK OPTION]

-- 删除
DROP VIEW [IF EXISTS] 视图名称 [,视图名称]...
```

**举个例子**

```sql
-- student
CREATE TABLE `student` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(50) DEFAULT NULL,
  `no` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uni_no` (`no`)
) ENGINE=InnoDB AUTO_INCREMENT=0 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci

-- 创建视图
create or replace view stu_v_1 as select id,name from student where id <= 10;

-- 查询视图
show create view stu_v_1;
-- 可以像操作表一样进行操作，也可以where过滤一下
select * from stu_v_1;
select * from stu_v_1 where id < 3;

-- 修改视图
create or replace view stu_v_1 as select id,name,no from student where id <= 10;
alter view stu_v_1 as select id,name from student where id <= 10;

-- 删除视图
drop view if exists stu_v_1;

-- 向视图中添加数据
insert into stu_v_1 values(default, 'Tom');
insert into stu_v_1 values(30, 'Tom');
-- 由于创建视图的时候指定了id小于10，会导致插入的数据原表中有但视图中没有的情况
-- 为了避免上述的情况发生，mysql提供了`with cascaded check option` 用于在插入时进行检查
create or replace view stu_v_1
as select id,name from student where id <= 10
with cascaded check option;
-- 我们将上述操作叫做视图的检查选项
-- 当使用`with check option` 字句创建视图时，mysql会通过视图检查正在更改的每个行，例如插入、更新、删除，以使其符合视图的定义
-- mysql允许基于另一个视图创建视图，它还会检查依赖视图中的规则以保持一致性。为了确定检查的范围，mysql提供了两个选项：cascaded和local，默认值为cascaded
```

### 1.2 CASCADED | LOCAL的区别

CASCADED 会检查依赖此视图的所有视图，包括依赖它的和它依赖的，并且具有传递性，也就是其余所有视图不管有没有有加with check option，都会进行检查

![image-20231111180534714](https://cdn.fengxianhub.top/resources-master/image-20231111180534714.png)

LOCAL也会检查依赖此视图的依赖的视图，区别就是只会检查添加了with check option的视图

### 1.3 视图的更新

要使视图可更新，视图中的行要与基础表中的行之间存在一对一的关系。如果视图包含以下任何一项，则视图不可更新

1. 聚合函数或窗口函数（SUM、MIN、MAX、COUNT等）
2. DISTINCT
3. GROUP BY
4. HAVING
5. UNION或UNION ALL

### 1.4 视图的作用

- 简单：视图不仅可以简化用户对数据的理解，也可以简化他们的操作。那些被经常使用的查询可以被定义为视图，从而使得用户不必为以后的操作每次指定全部的条件
- 安全：数据库可以授权，但不能授权到数据库指定行和特定的列上。通过视图用户只能查询和修改他们所能见到的数据
- 数据独立：视图可以帮助用户屏蔽真实表结构变化带来的影响

### 1.5 案例

>1. 为了保证数据库表的安全性，开发人员在操作`tb_user`表时，只能看到的用户的基本字段，屏蔽手机号和邮箱两个字段
>2. 查询每个学生所选修的课程（三张表联查），这个功能在很多的业务中都有使用到，为了简化操作可以定义一个视图

第一个案例

```sql
CREATE TABLE `tb_user`(
    `id`    int NOT NULL AUTO_INCREMENT,
    `name`  varchar(50) DEFAULT NULL,
    `phone` varchar(50) DEFAULT NULL,
    `email` varchar(50) default null,
    `age`   int         default -1,
    PRIMARY KEY (`id`)
) ENGINE = InnoDB  DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;
-- 创建视图，之后查询视图即可
create or replace view tb_user_view as
select id, name
from tb_user;
```

第二个

```sql
-- course
create table if not exists `course`
(
    `id`   int primary key NOT NULL AUTO_INCREMENT,
    `name` varchar(50) default null
);
-- student_course
create table if not exists `stu_course`
(
    `id`        int primary key NOT NULL AUTO_INCREMENT,
    `stu_id`    int NOT NULL,
    `course_id` int NOT NULL
);
-- 创建视图
create view tb_user_view as
select id, name, age
from tb_user;
select *
from tb_user_view;

-- 查询学生选修的课程（三表联查）
select s.name student_name, c.name course_name from student s, course c, stu_course sc
where s.id = sc.stu_id and c.id = sc.course_id;

-- 封装到视图中
create view tb_stu_course_view as
select s.name student_name, c.name course_name from student s, course c, stu_course sc
where s.id = sc.stu_id and c.id = sc.course_id;
-- 只需要查询视图即可
select * from tb_stu_course_view;
```

## 2. 存储过程

>在了解存储过程之前我们先查看一个场景：
>
>例如我要多次操作数据库，比如我需要先查询一张表A，然后根据表A的结果决定是否要操作表B、C

存储过程就是为了解决上述问题的

存储过程是**事先经过编译并存储在数据库中的一段sql语句的集合**，调用存储过程可以简化应用开发人员的很多工作，减少数据在数据库和应用服务器之间的传输，对于提高数据处理的效率是有好处的

存储过程思想上很简单，就是数据库sql语言层面的`代码封装和重用`

### 2.1 基本语法

```sql
-- 创建
CREATE PROCEDURE 存储过程名称([参数列表])
BEGIN
	-- sql语句
END;
```

调用很简单

```sql
CALL 名称([参数])
```

查看和调用存储过程

```sql
-- 查询指定数据库得存储过程及其状态信息
SELECT * FROM INFORMATION_SCHEMA_ROUTINES WHERE ROUTINE_SCHEMA='xxx';
-- 查询默认存储过程的定义
SHOW CREATE PROCEDURE 存储过程名称;
-- 查询指定前缀
show procedure status like 'p%';

-- 删除
DROP PROCEDURE [ IF EXISTS ] 存储过程名称;
```

举个例子

```sql
-- 通过通配符的方式查看所有数据库里的存储过程
show procedure status like 'p%';
-- 查看一个数据库里的所有存储过程
select * from information_schema.ROUTINES where ROUTINE_SCHEMA = 'test';
-- 查询具体的存储过程
select * from information_schema.Routines
where routine_name = 'p1';
-- 查看存储过程定义语句
show create procedure p1;
-- 删除存储过程
drop procedure if exists p1;
```

在命令行中，需要使用`delimiter`作为存储过程的结束语句，不然命令行终端会认为`;`会作为结束语句从而报错

![image-20231111205941453](https://cdn.fengxianhub.top/resources-master/image-20231111205941453.png)

使用`delimiter`指定后命令行终端会以`$$`作为结束符

![image-20231111210109870](https://cdn.fengxianhub.top/resources-master/image-20231111210109870.png)

当然你也可以指定其他符号，一般是`$$`或者是`//`

![image-20231111211945752](https://cdn.fengxianhub.top/resources-master/image-20231111211945752.png)

### 2.2 存储过程参数

#### 2.2.1 变量

系统变量是MySQL服务器提供的，不是用户定义的，属于服务器层面。分为全局和会话级别

**查看系统变量**

```sql
show [session|global] variables; -- 查看所有系统变量
show [session|global] variables like 'xx%'; -- 模糊匹配
select @@[session|global] 系统变量名； -- 查看指定变量的值
```

**设置系统变量**

```sql
set [session|global] 系统环境变量名 = 值;
set @@[session|global] 系统变量名 = 值;
```

**用户变量**

用户定义变量语法`@变量名`

```sql
SET @var_name = expr[, @var_name=expr];
SET @var_name := expr[, @var_name=expr];
```

使用

```sql
select @var_name;
```

局部变量

需要使用`DECLARE`声明。可作为存储过程内局部变量和输入参数，作用域在`BEGIN...END`块中

```sql
DECLARE 变量名 变量类型[DEFAULT...]
```

赋值

```sql
select xxx into 局部变量 from xxx
-- 例如
create procedure p1()
begin
    declare stu_count int default 0;
    select count(1) into stu_count from student;
    select stu_count;
end;
```



17670459756











































