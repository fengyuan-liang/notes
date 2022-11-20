# Spring Transaction（事务）学习一、数据库事务、隔离级别

> 记录一下对`Spring`和`数据库事务`的学习，这里的Spring事务学习使用的是`全注解`的形式，再此之前需要先学习一下数据库的

## 1、数据库事务

思维导图：

![image-20220225190617969](https://cdn.fengxianhub.top/resources-master/202202251906200.png)

### 1.1 事务的四个特点

> 事务的定义很严格，它必须同时满足四个特性，即`原子性`、`一致性`、`隔离性`和`持久性`，也就是人们俗称的 ACID 特性，具体如下：

- 原子性（Atomic）
  
  表示将事务中所进行的操作捆绑成一个不可分割的单元，即对事务所进行的数据修改等操作，要么全部执行，要么全都不执行
  
  **数据库是如何保证事务的原子性的？**通过三个`关键字`
  
  ```java
  commit提交
  rollback回滚
  savepoint保存点
  ```
  
  **Java是如何保证事务的原子性的？**通过三个`方法`
  
  ```java
  connection.setAutoCommit(false)//关闭自动事务提交，因为JDBC中隐式事务提交的，即默认提交
  connection.commit()//手动提交事务
  connetion.rollback()//回滚
  ```

- 一致性（Consistency）
  
  表示事务完成时，必须使所有的数据都保持一致状态。比如转账，有人转出就必须要保证有人转入

- 隔离性（Isolation）
  
  指一个事务的执行不能被其他事务干扰，即一个事务内部的操作及使用的数据对并发的其他事务是隔离的，并发执行的各个事务之间不能互相干扰。
  
  **多个线程访问数据库中如何保证数据库中数据的可见性？**
  
  Java多线程下有可见性问题，操作系统多核开发时也有可见性问题，数据库里这样的问题用`隔离性`描述，其实道理都是相通的，每个线程访问数据库时，都有一份复制的临时数据，数据库对此设置了`四种事务的隔离级别`，分别是：`Read Uncommitted（读未提交）`、`Read Committed（读已提交）`、`Repeatable Read（可重复读取）`、`Serializable（可串行化）`。在下面会专门来描述一下。

- 持久性（Durability）
  
  持久性也称永久性（permanence），指一个事务一旦提交，它对数据库中的数据的改变就应该是永久性的。提交后的其他操作或故障不会对其有任何影响。

<hr>

### 1.2 数据库并发带来的问题

> 在实际应用中，数据库中的数据是要被多个用户共同访问的，在多个用户同时操作相同的数据时，可能就会出现一些事务的并发问题，具体如下

- 脏读
  
  指一个事务读取到另一个事务未提交的数据。例如`t2`读了数据库中的一条数据，修改后并没有提交，这时`t1`线程去读同一条数据，但是读到是未刷新的数据，即读到了`脏数据`
  
  ![image-20220128133049942](https://cdn.fengxianhub.top/resources-master/202201281330003.png)

![image-20220128132046122](https://cdn.fengxianhub.top/resources-master/202201281320185.png)

- 不可重复读
  
  指一个事务对同一行数据重复读取两次，但得到的结果不同。例如A线程两次读取同一条数据，但是在第二次读取前，其他线程对其进行了修改，这就导致A线程两次读取数据的不一致。这里其他线程的操作是`update`更新

- 虚读/幻读
  
  指一个事务执行两次查询，`但第二次查询的结果包含了第一次查询中未出现的数据`。这里其他线程的操作是`insert`插入

- 丢失更新
  
  指两个事务同时更新一行数据，后提交（或撤销）的事务将之前事务提交的数据覆盖了
  
  丢失更新可分为两类，分别是`第一类丢失更新`和`第二类丢失更新`。
  
  - 第一类丢失更新是指两个事务同时操作同一个数据时，当第一个事务`撤销`时，把已经提交的第二个事务的更新数据覆盖了，第二个事务就造成了数据丢失。
  - 第二类丢失更新是指当两个事务同时操作同一个数据时，第一个事务将修改结果成功`提交`后，对第二个事务已经提交的修改结果进行了覆盖，对第二个事务造成了数据丢失。

### 1.3 数据库的四种隔离级别

> 为了避免上述事务并发问题的出现，在标准的 SQL 规范中定义了`四种事务隔离级别`，不同的隔离级别对事务的处理有所不同。这四种事务的隔离级别如下(其安全性由低到高、效率由高到低):

#### Read Uncommitted（读未提交）

一个事务在执行过程中，既可以访问其他事务未提交的新插入的数据，又可以访问未提交的修改数据。如果一个事务已经开始写数据，则另外一个事务不允许同时进行写操作，但允许其他事务读此行数据。`此隔离级别可防止丢失更新，不能防止其他三种异常`

#### Read Committed（读已提交）

一个事务在执行过程中，既可以访问其他事务成功提交的新插入的数据，又可以访问成功修改的数据。读取数据的事务允许其他事务继续访问该行数据，但是未提交的写事务将会禁止其他事务访问该行。`此隔离级别可有效防止脏读`

#### Repeatable Read（可重复读取）

一个事务在执行过程中，可以访问其他事务成功提交的新插入的数据，但不可以访问成功修改的数据。读取数据的事务将会禁止写事务（但允许读事务），写事务则禁止任何其他事务。`此隔离级别可有效防止不可重复读和脏读`

#### Serializable（可串行化）

提供严格的事务隔离。它要求事务序列化执行，事务只能一个接着一个地执行，不能并发执行。`此隔离级别可有效防止脏读、不可重复读和幻读`。但这个级别可能导致大量的超时现象和锁竞争，在实际应用中很少使用

> Serializable 是一致性最好的，性能最差的，Read uncommitted是一致性（隔离性）最差的，性能最好的。一般不会使用` Serializable` 和`Read uncommitted` 这两种隔离级别。一般来说，事务的隔离级别越高，越能保证数据库的完整性和一致性，但相对来说，隔离级别越高，对并发性能的影响也越大。因此，通常将数据库的隔离级别设置为 `Read Committed`，即读已提交数据，它既能防止脏读，又能有较好的并发性能。虽然这种隔离级别会导致不可重复读、幻读和第二类丢失更新这些并发问题，但可通过在应用程序中采用悲观锁和乐观锁加以控制

### 1.4 常用数据库的默认隔离级别

- oracle、sqlServer 读已提交（READ COMMITTED ）
- mysql 可重复读（REPEATABLE-READ）

mysql 可以通过下面的语句来查询数据库的默认隔离级别（查询了全局事务隔离级别和会话事务隔离级别）：

```sql
 select @@global.transaction_isolation,@@transaction_isolation;
```

![image-20220225200822652](https://cdn.fengxianhub.top/resources-master/202202252008734.png)

当然也可以手动修改数据库的事务隔离级别

### 1.5事务处理的两种情况

- 不同数据库（跨数据源）之间统一事务管理，使用`JTA`处理
- 相同数据库（但数据源）管理事务，使用`JDBC`



# Spring Transaction（事务）学习二、Spring事务管理

> 记录一下对`Spring`和`数据库事务`的学习，这里的Spring事务学习使用的是`全注解`的形式

思维导图：

![image20220226093015462](https://cdn.fengxianhub.top/resources-master/202202260930675.png)

## 1、配置事务管理器

> 在Spring注解启动事务的配置中，如果想要启用事务，就需要配置`事务管理器`，就像是不同的数据库需要不同的驱动一样，Spring中也有多种事务管理器，`DataSourceTransactionManager`是JDBC操作数据库使用的事务管理器

先引入Spring事务的Jar包：

```xml
<dependency>
    <groupId>org.springframework</groupId>
    <artifactId>spring-tx</artifactId>
    <version>5.3.12</version>
</dependency>
```

将事务管理器注册成bean交给Spring容器管理：

```java
/**
  * 配置数据库数据源
  */
@Bean
@Primary//此注解的作用是如果一个接口有多个实现类，用@Primary标记的实现类级别更高，优先使用
public DataSource druidDataSource(){
    DruidDataSource druidDataSource = new DruidDataSource();
    druidDataSource.setUrl(url);
    druidDataSource.setUsername(userName);
    druidDataSource.setPassword(password);
    return druidDataSource;
}

/**
  * 添加Spring事务支持
  */
@Bean
public DataSourceTransactionManager jdbcTransactionManager(DataSource dataSource){
    //事务管理器和数据源有关
    DataSourceTransactionManager jdbcTransactionManager = new DataSourceTransactionManager();
    jdbcTransactionManager.setDataSource(dataSource);
    return jdbcTransactionManager;
}
```

事务管理器有很多，其中`Mybatis`启用的是`JDBC`的事务管理器，其他框架事务管理器还有：

![image20220227092620910](https://cdn.fengxianhub.top/resources-master/202202270926966.png)

> 通过`DataSourceTransactionManager`的继承树可以看到，它实现了`PlatformTransactionManager`这个接口，这个接口表示与平台相关的事务管理器，在Spring中，`TransactionManager`是一个空接口，事务管理器的顶层接口为`PlatformTransactionManager`

继承树：

![image20220226094430516](https://cdn.fengxianhub.top/resources-master/202202260944590.png)

> `PlatformTransactionManager`接口一共定义了三个方法，

```java
TransactionStatus getTransaction(@Nullable TransactionDefinition definition)
            throws TransactionException;//获取事务 它还会设置数据属性
void commit(TransactionStatus status) throws TransactionException;//提交事务
void rollback(TransactionStatus status) throws TransactionException;//回滚事务
```

通过这三个方法就可以保证Spring操作数据库时的`原子性`

> 如果想要测试Spring事务，我们可以来一个简单的栗子。这里是在数据库中设置字段的插入检查，由于`Mysql8.0.15`以下的版本并不支持`constraint`约束，所以这里的sql脚本为`Oracle`的脚本。`Mysql8.0.15`以上的可以使用约束

```sql
-- auto_increment去掉
create table account
(
   accountid int primary key ,
   balance   numeric(10,2)
);
--  时间和日期类型  date
create table oprecord
(
   id int primary key ,
   accountid int,
   opmoney numeric(10,2),
   optime date
);

alter table oprecord 
  add constraint fk_oprecord_accountid
     foreign key(accountid) references account(accountid);

alter table account
   add constraint ck_account_balance
   check(balance>=0);
 -- 用序列生成主键  
 create sequence seq_account;
 create sequence seq_oprecord;

 insert into account(accountid,balance) values(seq_account.nextval,100);
 insert into account(accountid,balance) values(seq_account.nextval,1000);

 -- oracle对约束起作用,  抛出异常 ->  mybatis  (dao层的注解  @Repository-> 将exception转换异常RuntimeException )  -> biz   
 --   ->  spring做事务管理 -> spring的事务管理会bu捉到异常 (  RuntimeException起作用 ) -> 可以自动完成事务 rollback()
 insert into account(accountid,balance) values(seq_account.nextval,-10);

 commit;


select * from account;
select * from oprecord;
```

然后我们往有约束的表里插入一条不合法的数据：

```java
public Integer openAccount(double money) {
        String sql = "insert into account values(default,?)";
        KeyHolder keyHolder = new GeneratedKeyHolder();
        jdbcTemplate.update(connection -> {
            PreparedStatement psmt = connection.prepareStatement(sql, new String[]{"accountid"});
            psmt.setString(1,String.valueOf(money));
            return psmt;
        },keyHolder);
        //要返回开户后用户的账号
        return Objects.requireNonNull(keyHolder.getKey()).intValue();
}

@Test
public void testOpen() throws Exception {
    Account open = accountBiz.open(-10.0);
    System.out.println(open);
}
```

然后就会报错：

```java
org.springframework.jdbc.UncategorizedSQLException: PreparedStatementCallback; uncategorized SQLException for SQL [update account set balance = ? where accountid = ?]; SQL state [HY000]; error code [3819]; Check constraint 'account_chk_1' is violated.; nested exception is java.sql.SQLException: Check constraint 'account_chk_1' is violated.
```

> 查看报错信息可以看到，它抛出异常`org.springframework.jdbc.UncategorizedSQLException`，通过查看其继承结构可以发现，此异常其实继承自`RuntimeException`。报错提示后面一截写到这个异常是`nested exception`嵌套了`Exception`，其实在Spring中，加了`@Repository`注解之后，就会将`Exception`包装成`RuntimeException`抛出，这样做的好处是在业务代码中不用过多的`try catch`进行捕获，并且能够启用事务后事务能够捕获异常并且回滚数据（事务只能捕获`RuntimeException`异常）

我们查看数据库可以发现在不启用事务的情况下，就算抛出了异常，Spring还是会将数据提交

## 2、启用事务

在配置类事务管理器之后，需要在配置类中添加`@EnableTransactionManagement`注解表示启用了事务，然后在对应的`Service`层中通过`@Transactional`注解启用事务，`@Transactional`注解中可以配置很多，分别如下：

![image20220227091033420](https://cdn.fengxianhub.top/resources-master/202202270910502.png)

这些配置的含义和默认值分别为（`transactionManager`为自己添加的事务管理器，`Mybatis基于JDBC`，可以配置`DataSourceTransactionManager`）

![image20220227091306288](https://cdn.fengxianhub.top/resources-master/202202270913347.png)

> 在`业务层`添加注解`@Transactional(transactionManager = "jdbcTransactionManager")`启用事务，再次进行测试会发现，在数据库抛出异常后Spring会回滚数据，让不合法的数据不能被提交

## 3、@Transactional注解的默认配置

`@Transactional`注解也有一些默认配置，对应数据库中事务的特征：

![image20220227092201603](https://cdn.fengxianhub.top/resources-master/202202270922668.png)

可以在源码的注解中详细看到每个配置的作用和默认属性，其中`Propagation`传播级别有七个级别，分别是：

![image20220227092339527](https://cdn.fengxianhub.top/resources-master/202202270923592.png)

# Spring事务失效场景

## 1. 方法自调用

>第一类，`@Transactional`注解未生效情况，其实这种并不是事物失效，仅仅是注解失效，注解写了更没写一样
>
>解决方案：
>
>- 将被调用的方法拆到单独的bean中，让切面起作用
>- 自己注入自己获取代理类
>- `@EnableAspectJAutoProxy(exposeProxy = true)`  + `UserService userService = (UserService) AopContext.currentProxy();`

Spring事务是基于AOP的，只有当代理对象调用某个方法时，Spring的事务才会生效，而在一个方法中调用`this.xxx()`方法时，由于`this`并不是代理对象，所以会导致事务失效

```java
@Transactional
public void a(){
    jdbcTemplate.execute("insert into t1 values(1)");
    throw new RuntimeException();
}

// 自调用
public void b(){
    // 由于调用者并不是代理对象，所以切面失败导致事物失效
    a();
}
```

还有一种情况

```java
// 此时相当于`a`方法上面根本就没贴事物注解一样
@Transactional(propagation = Propagation.NEVER)
public void a(){
    jdbcTemplate.execute("insert into t1 values(1)");
    throw new RuntimeException();
}

// 调用方法也加了事物注解，此时会进行回滚，但是是由b方法的事物就行回滚的
@Transactional
public void b(){
    // 由于调用者并不是代理对象，所以切面失败导致事物失效
    a();
}
```

所以解决方案就是用代理对象调用即可

```java
public class UserService {
    @Autowired // 自己注入自己
    private UserService userService;
    @Transactional
    public void a(){
        jdbcTemplate.execute("insert into t1 values(1)");
        throw new RuntimeException();
    }

    // 事物生效
    public void b(){
        userService.a();
    }
}
```

或者可以通过代理上下文获取当前类的代理对象，但是这种需要我们在配置类上面设置属性`@EnableAspectJAutoProxy(exposeProxy = true)`

```java
public class UserService {
    @Transactional
    public void a(){
        jdbcTemplate.execute("insert into t1 values(1)");
        throw new RuntimeException();
    }

    // 事物生效
    public void b(){
        // 获取当前类的代理对象
        UserService userService = (UserService) AopContext.currentProxy();
        userService.a();
    }
}
```

## 2. 方法修饰符为private

>- cglib代理是基于父子类的，如果方法私有无法在子类中获取到，无法重写，只能执行父类的方法，但是父类中没有`jdbcTemplate`，会抛出`NPE`
>- 多态口诀：new谁调用谁的方法，谁创建使用谁的属性

```java
public class UserService {
    // cglib代理是基于父子类的，如果方法私有无法在子类中获取到，只能执行父类的方法，但是父类中没有`jdbcTemplate`，`NPE`
    @Transactional
    private void a(){
        jdbcTemplate.execute("insert into t1 values(1)");
        throw new RuntimeException();
    }
}
```

## 3. 方法是final的

>同上，代理类无法重写代理的方法

## 4. 单独的线程调用

>当`Mybatis`或者`JdbcTemplate`执行SQL时，会从`ThreadLocal`中去获取数据库连接对象，如果开启事物的线程和执行SQL的线程不是同一个线程，就拿不到数据库连接对象，这样，`Mybatis`或者`JdbcTemplate`就会重新创建一个数据库连接用来执行SQL，如果这个事物自动事物提交`autocommit`默认开启的话，就不会因为异常而进行回滚

```java
public class UserService {
    // 事物失效
    @Transactional
    private void a(){
        new Thread(() -> {
            jdbcTemplate.execute("insert into t1 values(1)");
        	throw new RuntimeException();
        }).start();
    }
}
```

## 5. Spring中没加@Configuration注解

>在Spring中，由于`Mybatis`或`JdbcTemplate`会从ThreadLocal中获取数据库连接，但是ThreadLocal里面存的是map，即`ThreadLocal<Map<DateSource, Connection>>`的结构
>
>如果没有添加`@Configuration`注解，会导致Map中存的DateSource和`Mybatis`或`JdbcTemplate`对象不相等，从而拿不到数据库连接，导致自己会新建一个，从而导致事物失效
>
>**注意：在SpringBoot中由于自动装箱，不会出现这种问题**

## 6. 异常被吃掉

>Spring默认只会对`RuntimeException`和`Error`进行回滚

## 7. 类没有被Spring管理

## 8. 数据库没有开启事物











