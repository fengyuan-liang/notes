# MyBatis学习(基础篇)

## 1. 简介

![image-20211015090126917](https://cdn.fengxianhub.top/resources-master/202110150901983.png)



**什么是 MyBatis？**

- MyBatis 是一款优秀的持久层框架，它支持自定义 SQL、存储过程以及高级映射。
- MyBatis 免除了几乎所有的 JDBC 代码以及设置参数和获取结果集的工作。
- MyBatis 可以通过简单的 XML 或注解来配置和映射原始类型、接口和 Java POJO（Plain Old Java Objects，普通老式 Java 对象）为数据库中的记录。

## 2. Mybatis快速入门

### 2.1 环境搭建

- pom.xml环境依赖

  ```xml
  	<!--MySQL数据库连接驱动-->
      <dependency>
        <groupId>mysql</groupId>
        <artifactId>mysql-connector-java</artifactId>
        <version>8.0.25</version>
      </dependency>
  
      <!-- mybatis坐标依赖 -->
      <dependency>
        <groupId>org.mybatis</groupId>
        <artifactId>mybatis</artifactId>
        <version>3.4.6</version>
      </dependency>
  ```

  

- 编写Mybatis的核心配置文件

  ```xml
  <?xml version="1.0" encoding="UTF-8" ?>
  <!DOCTYPE configuration
          PUBLIC "-//mybatis.org//DTD Config 3.0//EN"
          "http://mybatis.org/dtd/mybatis-3-config.dtd">
  <configuration>
      <environments default="development">
          <environment id="development">
              <transactionManager type="JDBC"/>
              <dataSource type="POOLED">
                  <property name="driver" value="com.mysql.jdbc.Driver"/>
                  <property name="url" value="jdbc:mysql://localhost:3306/iot?useUnicode=true&amp;characterEncoding=utf-8&amp;useSSL=false&amp;serverTimezone=Asia/Shanghai"/>
                  <property name="username" value="root"/>
                  <property name="password" value="123456"/>
              </dataSource>
          </environment>
      <!--每一个Mapper.xml都需要在Mybatis核心配置文件中注册-->
      <mappers>
          <mapper resource="mappers/BookMapper.xml"/>
      </mappers>
      </environments>
  </configuration>
  ```

  

- 编写Mybatis的工具类

  ```java
  package com.fx.utils;
  
  import org.apache.ibatis.io.Resources;
  import org.apache.ibatis.session.SqlSession;
  import org.apache.ibatis.session.SqlSessionFactory;
  import org.apache.ibatis.session.SqlSessionFactoryBuilder;
  
  import java.io.InputStream;
  
  /**
   * Description:获取SqlSessionFactory
   * 1. 获取SqlSessionFactory对象
   * 2. 获得 SqlSession 的实例(SqlSession 提供了在数据库执行 SQL 命令所需的所有方法)
   */
  public class MybatisUtils {
      private static SqlSessionFactory sqlSessionFactory;
      static{
          try {
              //获取SqlSessionFactory对象
              String resource = "mybatis-config.xml";
              InputStream inputStream = Resources.getResourceAsStream(resource);
              sqlSessionFactory = new SqlSessionFactoryBuilder().build(inputStream);
          } catch (Exception e) {
          	e.printStackTrace();
          }
      }
      //获得 SqlSession 的实例,SqlSession 提供了在数据库执行 SQL 命令所需的所有方法
      public static SqlSession getSqlSession(){
          return sqlSessionFactory.openSession();
      }
  }
  
  ```

### 2.2 编写代码

- 编写一个JavaBean

  ```java
  public class BookBean {
      private String id;
      private String bookNo;
      private String bookName;
      private String author;
      private String borrower;
      private String borrowDate;
      private String returnDate;
      private String borrowStatus;
      ...提供setter、getter、构造器、toString方法
  }
  ```

  

- Mapper接口

  ```java
  public interface BookMapper {
  
      /**
       * 查询整张表
       * @return 返回整张表的集合
       */
      List<BookBean> queryAll();
  
      /**
       * 根据书籍编号查书籍
       * @param bookNo 书籍的编号
       * @return 返回一个JavaBean的集合
       */
      BookBean queryBookByNO(String bookNo);
  
      /**
       * 根据借书人查记录
       * @param borrower 借阅人
       * @return 返回一个JavaBean的集合
       */
      List<BookBean> queryBookByBorrower(String borrower);
  
      /**
       * 根据借阅的时间查询
       * @param borrowDate 借阅时间
       * @return 返回一个JavaBean的集合
       */
      List<BookBean> queryBookByBorrowDate(String borrowDate);
  
      /**
       * 根据书号、借阅人和起始时间查询一条数据
       * @param args 参数数组
       * @return 返回一个JavaBean
       */
      BookBean queryBookByArgs(Object... args);
  }
  ```

  

- 接口实现类由原来的UserDaoImpl转变成一个Mapper配置文件

  ```xml
  <?xml version="1.0" encoding="UTF-8" ?>
  <!DOCTYPE mapper PUBLIC "-//mybatis.org//DTO Mapper 3.0//EN" "http://mybatis.org/dtd/mybatis-3-mapper.dtd">
  <mapper namespace="com.fx.dao.BookMapper">
      <select id="queryBookByNO" parameterType="String" resultType="com.fx.pojo.bookBean">
          SELECT `id`,`book_no`,`book_name`,`author`,`borrower`,`borrowDate`,`returnDate`,`borrowStatus`
          FROM iot1002_book
          WHERE book_no=#{book_no};
      </select>
  </mapper>
  ```

  



### 2.3 测试

注意：

异常：org.apache.ibatis.binding.BindingException: Type interface com.fx.dao.BookMapper is not known to the MapperRegistry.

**MapperRegistry是什么？**

每一个Mapper.xml都需要在Mybatis核心配置文件中注册

所以要添加：

```xml
<!--每一个Mapper.xml都需要在Mybatis核心配置文件中注册-->
<mappers>
    <mapper resource="mappers/BookMapper.xml"/>
</mappers>
```

测试代码：

```java
    @Test
    public void test01(){
        SqlSession sqlSession = MybatisUtils.getSqlSession();
        BookMapper bookMapper = sqlSession.getMapper(BookMapper.class);
        BookBean bookBean = bookMapper.queryBookByNO("S1001");
        System.out.println(bookBean.toString());
    }
```



## 3. CRUD操作

### 3.1 namespace

namespace中的包名要和Dao/mapper接口的包名一致!

### 3.2 select

选择，查询语句

- id:就是对应的namespace中的方法名;.
- resultType: Sql语句执行的返回值!
-  parameterType :参数类型!



1. 编写接口

   ```java
       /**
        * 根据借书人查记录
        * @param borrower 借阅人
        * @return 返回一个JavaBean的集合
        */
       List<BookBean> queryBookByBorrower(String borrower);
   ```

2. 编写对应的mapper中的sql语句

   ```java
       <select id="queryAll"  resultType="com.fx.pojo.BookBean">
           SELECT `id`,`book_no`,`book_name`,`author`,`borrower`,`borrowDate`,`returnDate`,`borrowStatus`
           FROM iot1002_book;
       </select>
   ```

3. 测试

   ```java
       @Test
       public void test02(){//多条语句查询
           SqlSession sqlSession = MybatisUtils.getSqlSession();
           BookMapper bookMapper = sqlSession.getMapper(BookMapper.class);
           List<BookBean> list = bookMapper.queryAll();
           list.forEach((e)->System.out.println(e.toString()));
           sqlSession.close();
       }
   ```

   

### 3.3  Insert

1. 编写接口

   ```java
       //添加一条记录
       int SaveBookBean(BookBean bookBean);
   ```

2. 编写对应的mapper中的sql语句

   ```java
       <!--对象中的属性可以直接取到-->
       <insert id="SaveBookBean" parameterType="com.fx.pojo.BookBean">
           insert into iot1002_book(book_no,book_name,author,borrower,borrowDate,returnDate,borrowStatus)
           values (#{bookNo},#{bookName},#{author},#{borrower},#{borrowDate},#{returnDate},#{borrowStatus})
       </insert>
   ```

3. 测试

   ```java
   @Test
       public void test03(){//保存一条信息，注意增、删、改需要提交事务
           SqlSession sqlSession = MybatisUtils.getSqlSession();
           BookMapper bookMapper = sqlSession.getMapper(BookMapper.class);
           int status = bookMapper.SaveBookBean(new BookBean(
                   "S1005",
                   "简爱",
                   "夏洛蒂·勃朗特",
                   "子涵",
                   "2021年10月15日19:01:47",
                   null,
                   "已借阅"
           ));
           sqlSession.commit();
           String str=status==1 ? "成功":"失败";
           System.out.println("出入结果为："+ str);
           sqlSession.close();
       }
   ```

   

### 3.4 update

1. 编写接口

   ```java
       //更新一条记录
       int updateBookBean(BookBean bookBean);
   ```

2. 编写对应的mapper中的sql语句

   ```java
       <!--更新一条数据-->
       <update id="updateBookBean" parameterType="com.fx.pojo.BookBean">
           update iot1002_book set borrowDate=#{borrowDate}   where borrower=#{borrower};
       </update>
   ```

3. 测试

   ```java
       @Test
       public void test04(){//更新一条数据
           SqlSession sqlSession = MybatisUtils.getSqlSession();
           BookMapper bookMapper = sqlSession.getMapper(BookMapper.class);
           int status = bookMapper.updateBookBean(new BookBean(
                           "S1005",
                           "简爱",
                           "夏洛蒂·勃朗特",
                           "子涵",
                           "2021年10月16日09:29:26",
                           null,
                           "已借阅")
           );
           sqlSession.commit();
           String str=status==1 ? "成功":"失败";
           System.out.println("出入结果为："+ str);
           sqlSession.close();
       }
   ```

### 3.5 Delete

1. 编写接口

   ```java
       //删除一条数据
       int deleteBookBean(String id);
   ```

2. 编写对应的mapper中的sql语句

   ```java
       <!--删除一条数据-->
       <delete id="deleteBookBean" parameterType="com.fx.pojo.BookBean">
           delete from iot1002_book where id=#{id};
       </delete>
   ```

3. 测试

   ```java
   	@Test
       public void test05(){//删除一条记录
           SqlSession sqlSession = MybatisUtils.getSqlSession();
           BookMapper bookMapper = sqlSession.getMapper(BookMapper.class);
           int status = bookMapper.deleteBookBean("9");
           sqlSession.commit();
           String str=status==1 ? "成功":"失败";
           System.out.println("出入结果为："+ str);
           if(status!=1){
               sqlSession.rollback();
           }
           sqlSession.close();
       }
   ```

### 3.6 常见错误：

- **增删改需要提交事务**，且有必要关闭session：sqlSession.close();

- mapper标签

- 解决Target目录下没有生成Class文件

  在Maven中添加如下代码即可

  ```xml
  <build>
          <resources>
              <resource>
                  <directory>src/main/java</directory>
                  <includes>
                      <include>**/*.xml</include>
                  </includes>
                  <filtering>true</filtering>
              </resource>
          </resources>
  </build>
  ```

  

### 3.7 万能的map

假设，我们的实体类，或者数据库中的表，字段或者参数过多，我们应当考虑使用Map!

- Map传递参数，直接在sql中取出key即可!   parameterType="map"
- 对象传递参数，直接在sql中取对象的属性即可!     parameterType="JavaBean"
- 只有一个基本类型参数的情况下，可以直接在sql中取到!  parameterType="String",一个参数也可以不写

最佳实践：**多个参数用Map或者注解**（注意：注解不能进行复杂SQL语句的实现）

1. 编写接口

   ```java
       //添加一条记录2
       void addBookBean(Map<String,Object> map);
   ```

2. 编写对应的mapper中的sql语句

   ```xml
       <!--
           1. 对象中的属性，可以直接取出来,sql语句中的字段不需要与Bean中的字段保持一致
           2. sql语句中的值是map中的key，可以减少参数的书写
       -->
       <insert id="SaveBookBean" parameterType="map">
           insert into iot1002_book(book_no,book_name,author,borrower,borrowDate,returnDate,borrowStatus)
           values (#{FxbookNo},#{FxbookName},#{Fxauthor},#{Fxborrower},#{FxborrowDate},#{FxreturnDate},#{FxborrowStatus})
       </insert>
   ```

3. 测试

   ```java
       @Test
       public void addBook(){
           SqlSession sqlSession = MybatisUtils.getSqlSession();
           BookMapper bookMapper = sqlSession.getMapper(BookMapper.class);
           Map<String,Object> map=new HashMap<>();
           map.put("FxbookNo","S1006");
           map.put("FxbookName","丰乳肥臀");
           map.put("Fxauthor","莫言");
           map.put("Fxborrower","子路");
           map.put("FxborrowDate","2021年10月16日10:49:35");
           map.put("FxreturnDate",null);
           map.put("FxborrowStatus","已借阅");
           bookMapper.addBookBean(map);
       }
   ```

### 3.8 模糊查询

在传参是用通配符%表示欲忽略的字段，可以防止SQL注入，不建议在SQL语句中拼接

1. 编写接口

   ```xml
       //模糊查询
       List<BookBean> getLikeList(String borrower);
   ```

2. 编写对应的mapper中的sql语句

   ```xml
      <!--模糊查询-->
       <select id="getLikeList" resultType="com.fx.pojo.BookBean">
           SELECT `id`,`book_no`,`book_name`,`author`,`borrower`,`borrowDate`,`returnDate`,`borrowStatus`
           FROM iot1002_book WHERE borrower like #{borrower}
       </select>
   ```

3. 测试

   ```java
       @Test
       public void likeQuery(){//模糊查询
           SqlSession sqlSession = MybatisUtils.getSqlSession();
           BookMapper bookMapper = sqlSession.getMapper(BookMapper.class);
           List<BookBean> likeList = bookMapper.getLikeList("%子%");
           likeList.forEach(System.out::println);
           sqlSession.close();
       }
   ```

   

<hr/>

## 4. 配置解析

### 4.1 核心配置文件

- mybatis-config.xml文件

- MyBatis 的配置文件包含了会深深影响 MyBatis 行为的设置和属性信息

  ```java
  configuration（配置）
  properties（属性）
  settings（设置）
  typeAliases（类型别名）
  typeHandlers（类型处理器）
  objectFactory（对象工厂）
  plugins（插件）
  environments（环境配置）
  environment（环境变量）
  transactionManager（事务管理器）
  dataSource（数据源）
  databaseIdProvider（数据库厂商标识）
  mappers（映射器）
  ```

  

### 4.2 环境配置（environments）

- MyBatis 可以配置成适应多种环境，**可以配置多个环境，但每个 SqlSessionFactory 实例只能选择一种环境**
- 在 MyBatis 中有两种类型的事务管理器（也就是 type="[JDBC|MANAGED]"），默认JDBC
- MyBatis 默认的数据库连接池是POOLED
- 多套配置环境用default="development"切换

### 4.3 属性（properties）

注意：mybatis-config.xml配置文件中的属性要按顺序摆放，否则会报异常

![image-20211016152123791](https://cdn.fengxianhub.top/resources-master/202110161532469.png)



- db.properties文件

  ```properties
  driver=com.mysql.cj.jdbc.Driver
  url=jdbc:mysql://localhost:3306/iot?useUnicode=true&characterEncoding=utf-8&useSSL=false&serverTimezone=Asia/Shanghai
  username=root
  password=123456
  ```

- mybatis-config.xml文件

  ```xml
  <?xml version="1.0" encoding="UTF-8" ?>
  <!DOCTYPE configuration
          PUBLIC "-//mybatis.org//DTD Config 3.0//EN"
          "http://mybatis.org/dtd/mybatis-3-config.dtd">
  <configuration>
      <!--引入配置文件，优先使用外部配置-->
      <properties resource="application.properties"/>
      <!--根据驼峰法将数据库里的book_no字段转换成JavaBean中bookNO的字段-->
      <settings>
          <setting name="mapUnderscoreToCamelCase" value="true"/>
      </settings>
      <environments default="development">
          <environment id="development">
              <transactionManager type="JDBC"/>
              <dataSource type="POOLED">
                  <property name="driver" value="${driver}"/>
                  <property name="url" value="${url}"/>
                  <property name="username" value="${username}"/>
                  <property name="password" value="${password}"/>
              </dataSource>
          </environment>
          <environment id="test">
              <transactionManager type="JDBC"/>
              <dataSource type="POOLED">
                  <property name="driver" value="com.mysql.cj.jdbc.Driver"/>
                  <property name="url" value="jdbc:mysql://localhost:3306/iot?useUnicode=true&amp;characterEncoding=utf-8&amp;useSSL=false&amp;serverTimezone=Asia/Shanghai"/>
                  <property name="username" value="root"/>
                  <property name="password" value="123456"/>
              </dataSource>
          </environment>
      </environments>
      <mappers>
          <mapper resource="mappers/BookMapper.xml"/>
      </mappers>
  </configuration>
  ```

- 可以在properties中增加一个属性配置

- 如果两个文件有同一个字段，优先使用外部配置文件的

### 4.4 类型别名（typeAliases）

第一种别名：typeAlias类型

- 别名是给JavaBean的包路径名设置一个短的名称

- 存在的意义是用来减少类完全限定名的冗余

  ```xml
  <!--可以给标签起一个别名（typeAlias类型）-->
  <typeAliases>
      <typeAlias type="com.fx.pojo.BookBean" alias="BookBean"/>
  </typeAliases>
  ```

第二种别名：package包扫描类型，自动扫描，**默认别名为JavaBean首字母小写**（大写也不报错但不建议写大写）

- ```xml
  <!--可以给标签起一个别名-->
  <typeAliases>
      <package name="com.fx.pojo"/>
  </typeAliases>
  ```



最佳实践：

- 在实体类比较少的时候，使用第一种

- 在实体类比较多的时候，使用第二种

- 第二种扫描包可以通过注解写别名

  ![image-20211016154928971](https://cdn.fengxianhub.top/resources-master/202110161549064.png)



### 4.5 设置（settings）

这是 MyBatis 中极为重要的调整设置，它们会改变 MyBatis 的运行时行为

```xml
<!--根据驼峰法将数据库里的book_no字段转换成JavaBean中bookNO的字段-->
<settings>
    <setting name="mapUnderscoreToCamelCase" value="true"/>
</settings>
```



其他在官网看！！！



### 4.6 映射器（mappers）

- **使用相对于类路径的资源引用**（推荐使用，一个Mapper写一个xml文件实现）

  ```xml
  <!--使用相对于类路径的资源引用-->
  <mappers>
      <mapper resource="mappers/BookMapper.xml"/>
  </mappers>
  ```

- 使用class

  ```xml
  <!-- 使用映射器接口实现类的完全限定类名 -->
  <mappers>
    <mapper class="org.mybatis.builder.AuthorMapper"/>
    <mapper class="org.mybatis.builder.BlogMapper"/>
    <mapper class="org.mybatis.builder.PostMapper"/>
  </mappers>
  ```

  注意：使用Class必须Mapper接口和其实现接口的xml再同一包下，不建议使用

- 使用包扫描器

  ```xml
  <!-- 将包内的映射器接口实现全部注册为映射器 -->
  <mappers>
    <package name="org.mybatis.builder"/>
  </mappers>
  ```

  注意：使用Class必须Mapper接口和其实现接口的xml再同一包下，不建议使用



### 4.7 生命周期

生命周期类别是至关重要的，因为**错误的使用**会导致非常严重的**并发问题**

![image-20211016161725852](https://cdn.fengxianhub.top/resources-master/202110161617956.png)



#### SqlSessionFactoryBuilder

- 这个类可以被实例化、使用和丢弃，一旦创建了 SqlSessionFactory，就不再需要它了
- 最佳作用域是方法作用域（也就是局部方法变量

#### SqlSessionFactory

- 可以理解为数据库连接池
- SqlSessionFactory 一旦被创建就应该在应用的运行期间一直存在，**没有任何理由丢弃它或重新创建另一个实例**
- 因此 SqlSessionFactory 的最佳作用域是应用作用域
- 最简单的就是使用**单例模式**或者**静态单例模式**

#### SqlSession

- 连接到连接池的一个请求

- SqlSession 的实例不是线程安全的，因此是不能被共享的，所以它的最佳的作用域是请求或方法作用域

- 用完之后需要赶紧关闭，否则资源被占用

  ![image-20211016162544088](https://cdn.fengxianhub.top/resources-master/202110161625178.png)

**这里面的每一个Mapper都代表一个具体的业务！！！**



## 5. 解决属性名和字段名不一致的问题

### 5.1问题

![image-20211016164334110](https://cdn.fengxianhub.top/resources-master/202110161643235.png)

- 解决方案一：在SQL语句中用as关键字给数据库字段取别名

  ```xml
      <select id="queryBookByNO" parameterType="String" resultType="BookBean">
          SELECT `id`,`book_no` as `bookNO`
          FROM iot1002_book
          WHERE book_no=#{book_no};
      </select>
  ```

  

### 5.2 resultMap结果集映射

结果集映射

```java
数据库字段：   book_no
JavaBean字段：bookNO
```

![image-20211016165054671](https://cdn.fengxianhub.top/resources-master/202110161650777.png)



- `resultMap` 元素是 MyBatis 中最重要最强大的元素。它可以让你从 90% 的 JDBC `ResultSets` 数据提取代码中解放出来
- 如果这个世界总是这么简单就好了。





## 6. 日志



### 6.1 日志工厂

在Mybatis的核心配置文件中配置我们的日志

```xml
<settings>
    <!--根据驼峰法将数据库里的book_no字段转换成JavaBean中bookNO的字段-->
    <setting name="mapUnderscoreToCamelCase" value="true"/>
    <!--日志输出-->
    <setting name="logImpl" value="STDOUT_LOGGING"/>
</settings>
```

采用Mybatis默认的：STDOUT_LOGGING，无需导包

![image-20211016172643376](https://cdn.fengxianhub.top/resources-master/202110161726525.png)



### 6.2 Log4J

1、Logger：用来输出日志消息的类，它可以输出不同级别的消息，例如错误消息、警告消息等；

2、Appender；通常我们希望日志输出到文件中，以及控制台，也可能希望日志输出数据库，该类就表示一个输出的目标；

3、Layout：对输出的消息进行格式化，例如在消息中添加日期，以及级别等。

- 坐标依赖

  ```xml
      <!--Log4J坐标依赖-->
      <!-- https://mvnrepository.com/artifact/log4j/log4j -->
      <dependency>
        <groupId>log4j</groupId>
        <artifactId>log4j</artifactId>
        <version>1.2.17</version>
      </dependency>
  ```

  

- log4j.properties

  ```properties
  ### 设置###
  log4j.rootLogger = debug,stdout,D,E
   
  ### 输出信息到控制抬 ###
  log4j.appender.stdout = org.apache.log4j.ConsoleAppender
  log4j.appender.stdout.Target = System.out
  log4j.appender.stdout.layout = org.apache.log4j.PatternLayout
  log4j.appender.stdout.layout.ConversionPattern = [%-5p] %d{yyyy-MM-dd HH:mm:ss,SSS} method:%l%n%m%n
   
  ### 输出DEBUG 级别以上的日志到=E://logs/error.log ###
  log4j.appender.D = org.apache.log4j.DailyRollingFileAppender
  log4j.appender.D.File = E://logs/log.log
  log4j.appender.D.Append = true
  log4j.appender.D.Threshold = DEBUG 
  log4j.appender.D.layout = org.apache.log4j.PatternLayout
  log4j.appender.D.layout.ConversionPattern = %-d{yyyy-MM-dd HH:mm:ss}  [ %t:%r ] - [ %p ]  %m%n
   
  ### 输出ERROR 级别以上的日志到=E://logs/error.log ###
  log4j.appender.E = org.apache.log4j.DailyRollingFileAppender
  log4j.appender.E.File =E://logs/error.log 
  log4j.appender.E.Append = true
  log4j.appender.E.Threshold = ERROR 
  log4j.appender.E.layout = org.apache.log4j.PatternLayout
  log4j.appender.E.layout.ConversionPattern = %-d{yyyy-MM-dd HH:mm:ss}  [ %t:%r ] - [ %p ]  %m%n
  ```

- 日志输出

  ```properties
  [INFO ] 2021-10-16 18:02:38,894 method:com.fx.dao.TestLog4J.test01(TestLog4J.java:15)
  info：进入了TestLog4j
  [DEBUG] 2021-10-16 18:02:38,899 method:com.fx.dao.TestLog4J.test01(TestLog4J.java:16)
  debug：进入了TestLog4j
  [ERROR] 2021-10-16 18:02:38,899 method:com.fx.dao.TestLog4J.test01(TestLog4J.java:17)
  error：进入了TestLog4j
  ```



## 7. 分页

作用：

- 减少数据的处理量



### 7.1 使用Limit进行分页

```sql
#语法，参数为从第几条数据开始，一页显示几条
SELECT * FROM iot1002_book limit startIndex,pageSize;
#实例：从第二条数据开始，一页显示两条数据
SELECT * FROM iot1002_book limit 2,2;
#表示从第0条数据一直到第四条数据
SELECT * FROM iot1002_book limit 4;
```

- 编写接口

  ```java
      //分页查询数据
      List<BookBean> getLimitPage(Map<String,Object> map);
  ```

- 编写xml实现文件

  ```xml
  <!--分页查询-->
  <select id="getLimitPage" parameterType="map" resultType="BookBean">
      SELECT `id`,`book_no` ,`book_name`,`author`,`borrower`,`borrowDate`,`returnDate`,`borrowStatus`
      FROM iot1002_book limit #{startIndex},#{pageSize};
  </select>
  ```

- 测试

  ```java
  @Test
  public void TestLimitPage(){
      SqlSession sqlSession = MybatisUtils.getSqlSession();
      BookMapper bookMapper = sqlSession.getMapper(BookMapper.class);
      Map<String,Object> map=new HashMap<>();
      map.put("startIndex",0);//从第0条数据开始
      map.put("pageSize",2);//每页显示两条数据
      List<BookBean> limitPage = bookMapper.getLimitPage(map);
      limitPage.forEach(System.out::println);
      sqlSession.close();
  }
  ```

### 7.2 使用Mybatis(PageHelper)实现分页

- 添加坐标依赖

  ```xml
      <!-- pagehelper -->
      <dependency>
        <groupId>com.github.pagehelper</groupId>
        <artifactId>pagehelper</artifactId>
        <version>5.2.0</version>
      </dependency>
  ```

- 配置PageHelper

  1. 在mybatis-config.xml中配置
  
  2. 在Spring的配置文件中配置
  
  3. 在配置类中配置
  
     

**SpringBoot中使用PageHelper**

后端代码

```java
//使用PageHelper进行分页查询
@RequestMapping( "/queryBookByPage")
public List<BookBean> queryBookByPage(Integer pageNum,Integer pageSize){
    PageHelper.startPage(pageNum,pageSize);//第一个参数表示显示的当前页数，第二个参数表示每页显示几条数据
    //先将数据库里的所有数据查询并放到PageHelper容器
    List<BookBean> lists = bookService.queryAll();
    PageInfo<BookBean> pageInfo=new PageInfo<>(lists);
    return pageInfo.getList();
}
```

前端html分页代码

```html
<div>
    <div id="main" style="width: 600px;height:400px; float: left;margin-top: 20px"></div>
    <div id="main2" style="width: 800px;height: 400px;float: right;margin: 0 30px 0 0">
        <span style="margin-left: 310px">图书馆中书籍信息查询</span>
        <table>
            <thead>
                <tr><td>书籍序号</td><td>书籍编号</td><td>书名</td><td>作者</td>
                    <td>借阅人</td><td>借阅时间</td><td>归还时间</td><td>借阅状态</td>
                </tr>
            </thead>
            <tbody id="tableBody">
                <tr><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td></tr>
                <tr><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td></tr>
                <tr><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td></tr>
                <tr><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td></tr>
                <tr><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td></tr>
                <tr><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td></tr>
                <tr><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td></tr>
                <tr><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td></tr>
                <tr><td colspan=8 id="time">时间：2019-07-19 15:34:24</td></tr>
            </tbody>
        </table>
        <div id="foot">
            <button onclick="previousPage()">上一页</button>
            当前在第:&nbsp;<label id="nowPage">1</label>&nbsp;页&nbsp;&nbsp;
            共:&nbsp;<label id="totalPage">100</label>&nbsp;页&nbsp;&nbsp;&nbsp;&nbsp;
            去往第：
            <label id="goPage">
                <input type="text" style="display: inline-block;width: 50px">
            </label>页
            <button onclick="goPage()">确认</button>&nbsp;&nbsp;
            <button onclick="RefreshData()">刷新</button>
            <button onclick="nextPage()" style="float: right">下一页</button>
        </div>
    </div>
</div>
```

前端js分页代码

```javascript
/*------------分页显示开始-----------------*/
/**
 * 页面加载完毕后先向数据库请求一次分页的数据，包括
 * 1. 数据库中数据的总条数
 * 2. 默认分页中第一页的数据
 */
let nowPageNum=1;//现在所在的页，默认为第一页
let PageNumTotal=100;//数据库中数据的中条数，给个默认值防止异常
let Page=2;//总的页数，给一个默认值，防止报错
let PageSize=8;//每一页要显示数据的条数，在本例中显示八条
$(function () {
    //查询数据空中总的分页数，并显示到前台
    queryPageNumTotal();
    queryBookByPage(1,PageSize);//默认显示第一页,显示8条数据
    //查询数据空中总的分页数，并显示到前台
    queryPageNumTotal();
    //更新此次查询数据库中分页数
    $("#totalPage").text(Page);
})
//上一页按钮
function previousPage() {
    if(nowPageNum <= 1){
        alert("已经在第一页了，不能往前进行翻页！！！");
    }else {
        nowPageNum--;
        queryBookByPage(nowPageNum,PageSize);
        RefreshLocationPage();//刷新当前定位页
    }
}
//下一页
function nextPage() {
    if(nowPageNum >= Page){
        alert("已经在最后一页了，不能往前进行翻页！！！");
    }else if(PageNumTotal%PageSize<PageSize){
        nowPageNum++;
        queryBookByPage(nowPageNum,PageNumTotal%PageSize);
        RefreshLocationPage();//刷新当前定位页
    }else {
        nowPageNum++;
        queryBookByPage(nowPageNum,PageSize);
        RefreshLocationPage();//刷新当前定位页
    }
}
//去往第几页按钮
function goPage() {
    let goPage=$("#goPage input").val();
    if(goPage===""){
        alert("输入不能为空！");
    }else if(goPage<1||goPage>Page){
        alert("输入页数不合法，请输入正确的页码！")
    }else if (PageNumTotal%PageSize<PageSize){
        queryBookByPage(goPage,PageNumTotal%PageSize);//去往第几页，最后一页数据不足一页
        nowPageNum=goPage;
        RefreshLocationPage();//刷新当前定位页
    }else {
        queryBookByPage(goPage,PageSize);//去往第几页，此页要显示多少条数据
        nowPageNum=goPage;
        RefreshLocationPage();//刷新当前定位页
    }
}
//刷新当前在第几页
function RefreshLocationPage() {
    $("#nowPage").text(nowPageNum);
}
//查询数据空中总的分页数,并显示到前台
function queryPageNumTotal() {
    axios.get("queryPageNumTotal")
        .then(function (response) {
            console.log("data==========="+response.data)
            console.log(response)
            PageNumTotal=response.data;
            //默认每页显示8条数据，所以用总条数除以8向上取整
            if(PageNumTotal<PageSize){
                //不足一页仅显示一页
                Page=1;
            }else {
                Page=Math.ceil(PageNumTotal/8);
            }
            $("#totalPage").text(Page);
        },function (err) {
            //将错误信息显示在控制台
            console.log(err);
        })
}
//根据输入的页码查询
function queryBookByPage(pageNum,pageSize) {//参数为显示的当前页面，每一页显示条数
    console.log("=====PageSize====="+pageSize);
    let param=new URLSearchParams();
    param.append("pageNum",pageNum);
    param.append("pageSize",pageSize);//在这里一页显示八条数据
    axios.post("queryBookByPage",param)
        .then(function (response) {
            console.log(response);
            //先清空表格
            $("#tableBody td").text("");
            response.data.forEach((item,index)=>{
                //将查询到的多条数据显示在前端
                let returnData;
                if(item.returnData==null){
                    returnData="未归还";
                }else {
                    returnData=item.returnData;
                }
                /**
                 * js语法中，引号内变量会直接解释为字符串
                 * 因此使用:eq()时参数将被识别为字符串而不是变量指代的内容
                 * 所以采用字符串拼接的方法
                 */
                $("#tableBody tr:eq("+index+")"+" td:eq(0)").text(item.id)
                $("#tableBody tr:eq("+index+")"+" td:eq(1)").text(item.bookNo);
                $("#tableBody tr:eq("+index+")"+" td:eq(2)").text(item.bookName);
                $("#tableBody tr:eq("+index+")"+" td:eq(3)").text(item.author);
                $("#tableBody tr:eq("+index+")"+" td:eq(4)").text(item.borrower);
                $("#tableBody tr:eq("+index+")"+" td:eq(5)").text(item.borrowDate);
                $("#tableBody tr:eq("+index+")"+" td:eq(6)").text(returnData);
                $("#tableBody tr:eq("+index+")"+" td:eq(7)").text(item.borrowStatus);
            })
        },function (err) {
            //将错误信息显示在控制台
            console.log(err);
        })
}
//刷新当前界面中的数据，及向数据库里重新读一次数据
function RefreshData(){
    queryBookByPage(nowPageNum,8);
    queryPageNumTotal();
    RefreshLocationPage();//刷新当前定位页
}

/*------------分页结束开始-----------------*/
```

前端表格css样式

```css
/*table样式*/
table{
    border-collapse:collapse;
    border-radius:5px;
    overflow:hidden;
    margin: 10px auto;
    border:2px solid #70aefb ;
    background-color: #328ef4;
    color: #c7dafb;
    table-layout:fixed;
}
table td,th{
    /* padding: 5px;
    width: 33%; */
    text-align: center;
    border:1px solid #70aefb ;
    vertical-align:middle;
    /* font-size: 15px; */
    width: 200px;
    height: 50px;
}

.table-color-green{
    background-color: green;

}

.table-color-grey{

    background-color:  #696969;
}

.table-color-black{

    background-color: black;
}
```

效果图：

![image-20211020195901410](https://cdn.fengxianhub.top/resources-master/202110201959689.png)



## 8. 使用注解开发

### 8.1面向接口编程

1. 大家之前都学过面向对象编程，也学习过接口，但在真正的开发中，很多时候我们会选择面向接口编程-**根本原因∶解耦，可拓展，提高复用，分层开发中，上层不用管具体的实现，大家都遵守共同的标准使得开发变得容易，规范性更好**
2. 在一个面向对象的系统中，系统的各种功能是由许许多多的不同对象协作完成的。在这种情况下，各个对象内部是如何实现自己的,对系统设计人员来讲就不那么重要了;
3. 而各个对象之间的协作关系则成为系统设计的关键。小到不同类之间的通信，大到各模块之间的交互，在系统设计之初都是要着重考虑的，这也是系统设计的主要工作内容。面向接口编程就是指按照这种思想来编程。



**关于接口的理解**

1. 接口从更深层次的理解，应是定义(规范，约束)与实现(名实分离的原则）的分离。
2. 接口的本身反映了系统设计人员对系统的抽象理解。
3. 接口应有两类:
   - 第一类是对一个个体的抽象，它可对应为一个抽象体(abstract class);
   - 第二类是对一个个体某一方面的抽象，即形成一个抽象面( interface) ;

4. 一个体有可能有多个抽象面。抽象体与抽象面是有区别的。



**三个面向区别**

1. 面向对象是指，我们考虑问题时，以对象为单位，考虑它的属性及方法．
2. 面向过程是指，我们考虑问题时，以一个具体的流程（事务过程）为单位，考虑它的实现.
3. 接口设计与非接口设计是针对复用技术而言的，与面向对象（过程)不是一个问题.更多的体现就是对系统整体的架构



### 8.2使用注解开发

- 注解在接口上实现

  ```java
  //模糊查询
  @Select("SELECT`book_no`,`book_name`,`author`,`borrower`,`borrowDate`\n" +
          "FROM iot1002_book " +
          "WHERE borrower like #{borrower}")
  List<BookBean> getLikeList(String borrower);
  ```

- 需要在核心配置文件中绑定接口(配置扫描器)

  ```xml
  <mappers>
      <mapper class="com.fx.dao.BookMapper"/>
  </mappers>
  ```

- 测试

  ```java
  @Test
  public void likeQuery(){//模糊查询
      SqlSession sqlSession = MybatisUtils.getSqlSession();
      BookMapper bookMapper = sqlSession.getMapper(BookMapper.class);
      List<BookBean> likeList = bookMapper.getLikeList("子%");
      likeList.forEach(System.out::println);
      sqlSession.close();
  }
  ```

  本质：反射机制实现

  底层：动态代理

  

### 8.3 注解完成CRUD

可以在工具类创建的时候实现自动提交事务

![image-20211017093224790](https://cdn.fengxianhub.top/resources-master/202110170932072.png)



注意：注解和xml只能同时使用一种，不然会报错

```log
error:Mapped Statements collection already contains value for dao.BookMapper.addBook
```



## 9. Lombok插件使用

使用：

1. 安装插件

2. 导入坐标依赖

   ```xml
   <!-- lombok -->
   <dependency>
       <groupId>org.projectlombok</groupId>
       <artifactId>lombok</artifactId>
       <version>1.18.20</version>
       <scope>provided</scope>
   </dependency>
   ```

   

lombok作用：通过注解减少代码书写

```java
@Data//自动生成无参构造，所有参构造、setter、getter、toString、hashCode和equals方法
@AllArgsConstructor//生成有参构造
@NoArgsConstructor//生成无参构造
```

相关注解：

```java
@Getter and @Setter
@FieldNameConstants
@ToString
@EqualsAndHashCode
@AllArgsConstructor, @RequiredArgsConstructor and @NoArgsConstructor
@Log, @Log4j, @Log4j2, @Slf4j, @XSlf4j, @CommonsLog, @JBossLog, @Flogger, @CustomLog
@Data
@Builder
@SuperBuilder
@Singular
@Delegate
@Value
@Accessors
@Wither
@With
@SneakyThrows
@val
@var
experimental @var
@UtilityClass
Lombok config system
Code inspections
Refactoring actions (lombok and delombok)
```



























