# Spring Transaction（事物）学习二、Spring事物管理

>记录一下对`Spring`和`数据库事物`的学习，这里的Spring事物学习使用的是`全注解`的形式

思维导图：

![image-20220226093015462](https://cdn.fengxianhub.top/resources-master/202202260930675.png)



## 1、配置事物管理器

>在Spring注解启动事物的配置中，如果想要启用事物，就需要配置`事物管理器`，就像是不同的数据库需要不同的驱动一样，Spring中也有多种事务管理器，`DataSourceTransactionManager`是JDBC操作数据库使用的事务管理器

先引入Spring事物的Jar包：

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

事物管理器有很多，其中`Mybatis`启用的是`JDBC`的事物管理器，其他框架事物管理器还有：

![image-20220227092620910](https://cdn.fengxianhub.top/resources-master/202202270926966.png)

>通过`DataSourceTransactionManager`的继承树可以看到，它实现了`PlatformTransactionManager`这个接口，这个接口表示与平台相关的事物管理器，在Spring中，`TransactionManager`是一个空接口，事务管理器的顶层接口为`PlatformTransactionManager`

继承树：

![image-20220226094430516](https://cdn.fengxianhub.top/resources-master/202202260944590.png)

>`PlatformTransactionManager`接口一共定义了三个方法，

```java
TransactionStatus getTransaction(@Nullable TransactionDefinition definition)
			throws TransactionException;//获取事务 它还会设置数据属性
void commit(TransactionStatus status) throws TransactionException;//提交事务
void rollback(TransactionStatus status) throws TransactionException;//回滚事务
```

通过这三个方法就可以保证Spring操作数据库时的`原子性`

>如果想要测试Spring事物，我们可以来一个简单的栗子。这里是在数据库中设置字段的插入检查，由于`Mysql8.0.15`以下的版本并不支持`constraint`约束，所以这里的sql脚本为`Oracle`的脚本。`Mysql8.0.15`以上的可以使用约束

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

>查看报错信息可以看到，它抛出异常`org.springframework.jdbc.UncategorizedSQLException`，通过查看其继承结构可以发现，此异常其实继承自`RuntimeException`。报错提示后面一截写到这个异常是`nested exception`嵌套了`Exception`，其实在Spring中，加了`@Repository`注解之后，就会将`Exception`包装成`RuntimeException`抛出，这样做的好处是在业务代码中不用过多的`try catch`进行捕获，并且能够启用事物后事物能够捕获异常并且回滚数据（事物只能捕获`RuntimeException`异常）

我们查看数据库可以发现在不启用事物的情况下，就算抛出了异常，Spring还是会将数据提交

## 2、启用事物

在配置类事物管理器之后，需要在配置类中添加`@EnableTransactionManagement`注解表示启用了事物，然后在对应的`Service`层中通过`@Transactional`注解启用事物，`@Transactional`注解中可以配置很多，分别如下：

![image-20220227091033420](https://cdn.fengxianhub.top/resources-master/202202270910502.png)

这些配置的含义和默认值分别为（`transactionManager`为自己添加的事物管理器，`Mybatis基于JDBC`，可以配置`DataSourceTransactionManager`）

![image-20220227091306288](https://cdn.fengxianhub.top/resources-master/202202270913347.png)

>在`业务层`添加注解`@Transactional(transactionManager = "jdbcTransactionManager")`启用事物，再次进行测试会发现，在数据库抛出异常后Spring会回滚数据，让不合法的数据不能被提交

## 3、@Transactional注解的默认配置

`@Transactional`注解也有一些默认配置，对应数据库中事物的特征：

![image-20220227092201603](https://cdn.fengxianhub.top/resources-master/202202270922668.png)

可以在源码的注解中详细看到每个配置的作用和默认属性，其中`Propagation`传播级别有七个级别，分别是：

![image-20220227092339527](https://cdn.fengxianhub.top/resources-master/202202270923592.png)



































