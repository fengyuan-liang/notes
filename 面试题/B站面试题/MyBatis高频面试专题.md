# 一、介绍下MyBatis中的工作原理

1。介绍MyBatis的基本情况：ORM

2。原理：

* MyBatis框架的初始化操作
* 处理SQL请求的流程

1.系统启动的时候会加载解析全局配置文件和对应映射文件。加载解析的相关信息存储在 Configuration 对象

```
@Test
    public void test1() throws  Exception{
        // 1.获取配置文件
        InputStream in = Resources.getResourceAsStream("mybatis-config.xml");
        // 2.加载解析配置文件并获取SqlSessionFactory对象
        // SqlSessionFactory 的实例我们没有通过 DefaultSqlSessionFactory直接来获取
        // 而是通过一个Builder对象来建造的
        // SqlSessionFactory 生产 SqlSession 对象的  SqlSessionFactory 应该是单例
        // 全局配置文件和映射文件 也只需要在 系统启动的时候完成加载操作
        // 通过建造者模式来 构建复杂的对象  1.完成配置文件的加载解析  2.完成SqlSessionFactory的创建
        SqlSessionFactory factory = new SqlSessionFactoryBuilder().build(in);
        // 3.根据SqlSessionFactory对象获取SqlSession对象
        SqlSession sqlSession = factory.openSession();
        // 4.通过SqlSession中提供的 API方法来操作数据库
        List<User> list = sqlSession.selectList("com.boge.mapper.UserMapper.selectUserList");
        // 获取接口的代码对象  得到的其实是 通过JDBC代理模式获取的一个代理对象
       // UserMapper mapper = sqlSession.getMapper(UserMapper.class);
        //List<User> list = mapper.selectUserList();
        System.out.println("list.size() = " + list.size());

        // 5.关闭会话
        sqlSession.close(); // 关闭session  清空一级缓存

    }
```

SqlSessionFactory: new DefaultSqlSessionFactory  全局配置文件的加载解析【Configuration】，映射文件的加载解析【Configuration，MappedStatement】

SqlSession：new DefaultSqlSession,创建相关的事务工厂，完成Executor的创建，已经二级缓存 CachingExecutor的装饰，同时完成了插件逻辑的植入。

selectOne();  二级缓存 -> 一级缓存 --> 数据库插入

SqlSession.getMapper();

![image.png](https://fynotefile.oss-cn-zhangjiakou.aliyuncs.com/fynote/1462/1646630135000/d6faa6faa9b44d909d1f678a605695ba.png)

源码结构

![image.png](https://fynotefile.oss-cn-zhangjiakou.aliyuncs.com/fynote/fyfile/1462/1671192125034/7d88accaceae4398ac0e42bd437fbe61.png)

# 二、介绍下MyBatis中的缓存设计

1。缓存的作用

```
缓存的作用：减低数据源的访问频率。从而提高数据源的处理能力。或者提高服务器的响应速度
```

2。MyBatis中的缓存设计

* MyBatis中的缓存的架构设计：装饰器模式
* MyBatis中的一级缓存和二级缓存
* 一级缓存：session级别
* 二级缓存：SqlSessionFactory级别

**缓存的设计**

```
	通过装饰模式实现缓存功能扩展
```

**缓存的应用**

```
	一级缓存和二级缓存
```

一级缓存和二级缓存的顺序问题：先二级缓存再一级缓存

为什么会先走二级缓存再走一级缓存？

二级缓存的作用域是SqlSessionFactory级别-90%找到

一级缓存是SqlSession级别的-5%找到

1  2

2 1

一级缓存开关

二级缓存开关

# 三、聊下MyBatis中如何实现缓存的扩展

1。考察你的MyBatis中缓存架构的理解

2。考察你对MyBatis缓存的扩展。实际动手能力

* 创建Cache接口的实现。重新getObject和putObject方法
* 怎么让我们自定义的实现：在cache标签中通过type属性关联我们自定义的Cache接口的实现

# 四、MyBatis中涉及到的设计模式

1。从MyBatis的整体架构设计来分析

基础模块：

缓存模块：装饰器模式

日志模块：适配器模式【策略模式】代理模式

反射模块：工厂模式，装饰器模式

Mapping:代理模式

SqlSessionFactory  ：SqlSessionFactoryBuilder 建造者模式

模板方法模式：

# 五、谈谈你对SqlSessionFactory的理解

SqlSessionFactory是MyBatis中非常核心的一个API。是一个SqlSessionFactory工厂。目的是创建SqlSession对象。SqlSessionFactory应该是单例。SqlSessionFactory对象的创建是通过SqlSessionFactoryBuilder来实现。在SqlSessionFactoryBuilder即完成了SqlSessionFactory对象的创建。也完成了全局配置文件和相关的映射文件的加载和解析操作。相关的加载解析的信息会被保存在Configuration对象中。

而且涉及到了两种涉及模式：工厂模式，建造者模式

# 六、谈谈你对SqlSession的理解

SqlSession是MyBatis中非常核心的一个API：作用是通过相关API来实现对应的数据库数据的操作。

SqlSession对象的获取需要通过SqlSessionFactory来实现。是一个会话级别的。当一个新的会话到来的时候。我们需要新建一个SqlSession对象来处理。当一个会话结束后我们需要关闭相关的会话资源。处理请求的方式：

1. 通过相关的增删改查的API直接处理
2. 可以通过getMapper(xxx.class) 来获取相关的mapper接口的代理对象来处理

# 七、谈谈你对MyBatis的理解

MyBatis应该是我们在工作中使用频率最高的一个ORM框架。持久层框架

1. 提供非常方便的API来实现增删改查操作
2. 支持灵活的缓存处理方案，一级缓存、二级缓存，三级缓存
3. 还支持相关的延迟数据加载的处理
4. 还提供了非常多的灵活标签来实现复杂的业务处理，if forech where trim set bind ...
5. 相比于Hibernate会更加的灵活

# 八、谈谈MyBatis中的分页原理

1。谈谈分页的理解：数据太多。用户并不需要这么多。我们的内存也放不下这么多的数据

```
SQL：
    MySQL：limit
    Oracle：rowid
```

2。谈谈MyBatis中的分页实现

在MyBatis中实现分页有两种实现

1. 逻辑分页：RowBounds
2. 物理分页：拦截器实现

# 九、Spring中是如何解决DefaultSqlSession的数据安全问题的

DefaultSqlSession是线程非安全的。也就意味着我们不能够把DefaultSqlSession声明在成员变量中。

在Spring中提供了一个SqlSessionTemplate来实现SqlSession的相关的定义。然后在SqlSessionTemplate中的每个方法都通过SqlSessionProxy来操作。这个是一个动态代理对象。然后在动态代理对象中通过方法级别的DefaultSqlSession来实现相关的数据库的操作

# 十、谈谈你对MyBatis中的延迟加载的理解

延迟加载：等一会加载。在多表关联查询操作的时候可以使用到的一种方案。如果是单表操作就完全没有延迟加载的概念。比如。查询用户和部门信息。如果我们仅仅只是需要用户的信息。而不需要用户对应的部门信息。这时就可以使用延迟加载机制来处理。

1。需要开启延迟加载

![image.png](https://fynotefile.oss-cn-zhangjiakou.aliyuncs.com/fynote/fyfile/1462/1671192125034/0098862c439a4302a478abf04a31f195.png)

2。需要配置多表关联

* association 一对一的关联配置
* collection 一对多的关联配置

延迟加载的原理：代理对象

# 十一、谈谈对MyBatis中插件的原理理解

MyBatis中的插件设计的目的是什么：方便我们开发人员实现对MyBatis功能的增强

设计中允许我们对：

* Executor
* ParameterHandler
* ResultSetHandler
* StatementHandler

这四个对象的相关方法实现增强

要实现自定义的拦截器：

1. 创建自定义的Java类。通过@Interceptors注解来定义相关的方法签名
2. 我们需要在对应的配置文件中通过plugins来注册自定义的拦截器

我们可以通过拦截器做哪些操作？

1. 检查执行的SQL。比如 sql 中有select * . delete from 。。。
2. 对执行的SQL的参数做处理
3. 对查询的结果做装饰处理
4. 对查询SQL的分表处理

# 十二、使用MyBatis的mapper接口调用时有哪些要求？

MyBatis中的Mapper接口实现的本质是代理模式

1. Mapper映射文件的namespace的值必须是Mapper接口对应的全类路径的名称
2. Mapper接口中的方法名必须在mapper的映射文件中有对应的sql的id
3. Mapper接口中的入参类型必须和mapper映射文件中的每个sql 的parameterType类型相同
4. Mapper接口中的出参类型必须和mapper映射文件中的么个sql的resultType类型相同
5. 接口名称和Mapper映射文件同名

# 十三、如何获取MyBatis中自增的主键

需要获取自增的主键：在同一个事务中操作多表。我们需要关联的id信息。

```xml
<insert id="xxx" useGeneratedKeys="true" keyProperty="id">
```

```java
User user = new User();
userMapper.insert(user);
System.out.println("自增的主键:id" + user.getId());
```

# 十四、不同Mapper中的id是否可以相同？

可以相同：每一个映射文件的namespace都会设置为对应的mapper接口的全类路径名称。也就是保证了每一个Mapper映射文件的namespace是惟一的。那么我们只需要满足在同一个映射文件中的id是不同的就可以了

UserMapper.xml: com.boge.mapper.UserMapper  #selectList

RoleMapper.xml com.boge.mapper.RoleMapper   #selectList

# 十五、谈谈你对MyBatis的架构设计的理解

1. 接口层：面向开发者。提供相关的API
2. 核心层：MyBatis的核心功能的实现：增删改查操作
3. 基础模块：由很多相互之间没用关联的模块组成。作用是支持核心层来完成核心的功能

![image.png](https://fynotefile.oss-cn-zhangjiakou.aliyuncs.com/fynote/fyfile/1462/1671192125034/631ce69a7429463b801afc088a84e7e0.png)

# 十六、传统JDBC的不足和MyBatis的解决方案

1. 我们需要频繁的创建和释放数据库库的连接对象。会造成系统资源的浪费。从而影响系统的性能，针对这种情况我们的解决方案是数据库连接池。然后在MyBatis中的全局配置文件中我们可以设置相关的数据库连接池。当然和Spring整合后我们也可以配置相关的数据库连接。
2. SQL语句我们是直接添加到了代码中了，造成维护的成本增加。所以对应SQL的动态性要求比较高。这时我们可以考虑把SQL和我们的代码分离，在MyBatis中专门提供了映射文件。我们在映射文件中通过标签来写相关的SQL
3. 向SQL中传递参数也很麻烦，因为SQL语句的where条件不一定。可能有很多值也可能很少。占位符和参数需要一一对应。在MyBatis中自动完成java对象和sql中参数的映射
4. 对于结果集的映射也很麻烦，主要是SQL本身的变化会导致解析的难度。我们的解决方案。在MyBatis中通过ResultSetHandler来自动把结果集映射到对应的Java对象中。
5. 传统的JDBC操作不支持事务。缓存。延迟加载等功能。在MyBatis中都提供了相关的实现

# 十七、MyBatis编程步骤是怎么样的？

1. 创建SqlSessionFactory--》SqlSessionFactoryBuilder --》建造成模式 --》Configuration
2. 通过创建的SqlSessionFactory对象来获取SqlSession对象 --》 Executor
3. 通过SqlSession对象执行数据库操作 --》API和Mapper接口代理对象  --》缓存 --》装饰者模式
4. 调用SqlSession中的commit方法来显示的提交事务 --》 数据源和事务模块 --》 JDBC和Managed
5. 调式SqlSession中的close方法来关闭会话

# 十八、当实体中的属性和表中的字段不一致的情况下怎么办？

1. 我们可以在对应的SQL语句中通过别名的方式来解决这个问题
2. 我们通过自定义resultMap标签来设置属性和字段的映射关系

# 十九、谈谈你对MyBatis中的Executor的理解

Executor的类型有三类：

* SIMPLE:默认  SimpleExecutor：每次操作都是一个新的Statement对象
* REUSE： ReuseExecutor，会根据SQL缓存Statement对象。实现Statement对象的复用
* BATCH： BatchExecutor 批处理

# 二十、如何设置MyBatis的Executor类型

Executor的类型有三类：

* SIMPLE:默认  SimpleExecutor：每次操作都是一个新的Statement对象
* REUSE： ReuseExecutor，会根据SQL缓存Statement对象。实现Statement对象的复用
* BATCH： BatchExecutor 批处理

如何指定我们需要使用的类型呢？

1. 可以通过SqlSessionFactory的openSession方法中来指导对应的处理器类型
2. 可以通过全局配置文件中的settings来配置默认的执行器

# 二十一、MyBatis中如何实现多个传参

## 1.循序传值

```java
public void selectUser(String name,int deptId);
```

```xml
<select id="selectUser" resultMap="baseResultMap">
    select * from t_user where user_name = #{0} and dept_id= #{1}
</select>
```

#{}里面的数字代表的是入参的顺序

但是这种方法不建议使用，SQL层次表达不直观，而且一旦循序错了很难找到。

## 2. @Param注解传值

```java
public void selectUser(@Param("name")String name,@Param("deptId")int deptId);
```

```xml
<select id="selectUser" resultMap="baseResultMap">
    select * from t_user where user_name = #{name} and dept_id= #{deptId}
</select>
```

#{}里面的名称对应的就是@Param注解中修饰的名称。

这种方案我们是非常推荐使用的。因为很直观。

## 3. 通过Map传值

```java
public void selectUser(Map<String,Object> map);
```

```xml
<select id="selectUser" parameterType="java.util.Map" resultMap="baseResultMap">
    select * from t_user where user_name = #{name} and dept_id= #{deptId}
</select>
```

#{}里面的名称就是Map中对应的Key

这种方案适合传递多个参数，且参数灵活应变值得推荐

## 4.通过自定义对象传递

```java
public void selectUser(User user);
```

```xml
<select id="selectUser" parameterType="com.boge.bean.User" resultMap="baseResultMap">
    select * from t_user where user_name = #{name} and dept_id= #{deptId}
</select>
```

#{} 中的名称就是自定义对象的属性名称

这种方案很直观。但是需要创建一个实体类。扩展不容易。需要添加属性。但是代码的可读性很高。业务逻辑处理也非常方便。值得推荐

# 二十二、谈谈你对日志模块的理解

1。MyBatis中的日志模块使用了适配器模式

2。如果我们需要适配MyBatis没有提供的日志框架。那么对应的需要添加相关的适配类

3。在全局配置文件中设置日志的实现

4。在MyBatis的日志框架中提供了一个 jdbc 这个包。里面实现了JDBC相关操作的日志记录

# 二十三、谈谈MyBatis中能够记录SQL执行的原理

在MyBatis中对执行JDBC操作的日志记录的本质是创建了相关核心对象的代理对象

* Connection -- ConnectionLogger
* PreparedStatement -- PreparedStatementLogger
* ResultSet --ResultSetLogger

本质就是通过代理对象来实现的。代理对象中完成相关的日志操作。然后再调用对应的目标对象完成相关的数据库的操作处理。

# 二十四、MyBatis中数据源模块的设计

在MyBatis中单独设计了DataSource这个数据源模块

![image.png](https://fynotefile.oss-cn-zhangjiakou.aliyuncs.com/fynote/fyfile/1462/1671192125034/94755457bba749548579c9a3f5eebded.png)

在使用MyBatis的时候我们都需要单独的设置DataSource

![image.png](https://fynotefile.oss-cn-zhangjiakou.aliyuncs.com/fynote/fyfile/1462/1671192125034/1ae318fce0644756a534a4e2d3fa17f9.png)

完成相关的DataSource节点的解析

![image.png](https://fynotefile.oss-cn-zhangjiakou.aliyuncs.com/fynote/fyfile/1462/1671192125034/94ecbfe0962d48ff8c6243cf8326101d.png)

UnpooledDataSource：非数据库连接池的实现

PooledDataSource：数据库连接池的实现

* 从连接池中获取连接对象：如果有空闲连接直接返回。活跃连接数是否超过了最大连接数。是否有连接超时的连接
* 数据库连接池关闭连接。如果空闲连接没有超过最大连接数那么就放回空闲队列中。否则关闭真实的连接

![image.png](https://fynotefile.oss-cn-zhangjiakou.aliyuncs.com/fynote/fyfile/1462/1671192125034/b258dfe88261442f954de49823d4f6d7.png)

![image.png](https://fynotefile.oss-cn-zhangjiakou.aliyuncs.com/fynote/fyfile/1462/1671192125034/7f38f03dcf3543b0b3aaf756e30ec490.png)

# 二十五、MyBatis中事务模块的设计

1。谈谈你对事务的理解【ACID】

2。MyBatis中的事务的管理

![image.png](https://fynotefile.oss-cn-zhangjiakou.aliyuncs.com/fynote/fyfile/1462/1671192125034/3aa22b9eba384621b0c4c7d7327ea34a.png)

事务接口的定义：定义了事务的基本行为

![image.png](https://fynotefile.oss-cn-zhangjiakou.aliyuncs.com/fynote/fyfile/1462/1671192125034/1a39993c73404131b8cecd6eeb4990a3.png)

3。在MyBatis的事务管理中有两个选择

* jdbc：在MyBatis中自己处理事务的管理
* Managed：在MyBatis中没有处理任何的事务操作。这种情况下事务的处理会交给Spring容器来管理

4。如何设置事务管理的方式

![image.png](https://fynotefile.oss-cn-zhangjiakou.aliyuncs.com/fynote/fyfile/1462/1671192125034/044691a29e9b48bf92ad43071b803c4b.png)

5。在MyBatis中执行DML操作事务的处理逻辑

SqlSession.commit();

# 二十六、谈谈你对Mapper接口的设计理解

1。谈下MyBatis中Mapper接口对应的规则

2。谈下MyBatis中的Mapper接口的设计原理--代理模式的使用

3。代理对象执行的逻辑的本质还是会执行SqlSession中相关的DML操作的方法

![image.png](https://fynotefile.oss-cn-zhangjiakou.aliyuncs.com/fynote/fyfile/1462/1671192125034/3b7a7d0f5ea1496eb5a117613275ddc5.png)

4。为什么会多一个代理对象的处理

# 二十七、谈谈你对Reflector模块的理解

Reflector是MyBatis中提供的一个针对反射封装简化的模块：简化反射的相关操作。MyBatis是一个ORM框架。表结构的数据和Java对象中数据的映射。那么不可避免的会存在非常多的反射操作。

Reflector是一个独立的模块。我们是可以把这个模块单独抽取出来直接使用的。

反射模块的具体的设计

![image.png](https://fynotefile.oss-cn-zhangjiakou.aliyuncs.com/fynote/fyfile/1462/1671192125034/bb3363afde0d4d52bebb46fa9c7b2515.png)

# 二十八、谈谈你对MyBatis中的类型转换模块的理解

MyBatis中是如何解决Java中的类型和数据库中字段类型的映射。

![image.png](https://fynotefile.oss-cn-zhangjiakou.aliyuncs.com/fynote/fyfile/1462/1671192125034/cbd82436d6f348cc8cf16427bce5545d.png)

类型转换处理器的设计

TypeHandler --》 BaseTypeHandler---》具体的TypeHandler

预处理占位符赋值

![image.png](https://fynotefile.oss-cn-zhangjiakou.aliyuncs.com/fynote/fyfile/1462/1671192125034/0caac35005724ca9816fdacc67a9234a.png)

# 二十九、谈谈MyBatis和Spring的整合的理解

1。回答的比较简单些。梳理下MyBatis和Spring整合的步骤

* 单纯的Spring和MyBatis的整合
* 在SpringBoot项目中的整合

![image.png](https://fynotefile.oss-cn-zhangjiakou.aliyuncs.com/fynote/fyfile/1462/1671192125034/6eee74cee53143aea9e52ad4123727f7.png)

2。重点分析下整合的jar包的原理

MybatisSqlSessionFactoryBean--》 这个就是我们需要关注的重点了。

# 三十、谈谈你对MyBatis的理解

MyBatis是一个非常主流的半自动的ORM框架。非常简便的帮助我们完成相关的数据库操作。

提供动态SQL，缓存和延迟加载等高级功能。

然后整体的架构非常简单

* 外层接口
* 核心处理层
* 基础模块
