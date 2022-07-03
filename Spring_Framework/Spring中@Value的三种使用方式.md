# Spring中@Value的三种使用方式

`@Value`的作用是什么？我们可以从<a href="https://docs.spring.io/spring-framework/docs/current/reference/html/core.html#beans-factory-nature">Spring官方文档</a>里面找到这样的一句话：

![image-20220212232240207](https://cdn.fengxianhub.top/resources-master/202202122322284.png)

接下来我们看下`@Value`注入外部属性的三种方式：

## 1. 注入普通属性

`@Value`注解可以注入一些字段的普通属性，并且会自动进行`类型转换`

![image-20220212233940485](https://cdn.fengxianhub.top/resources-master/202202122339594.png)

**栗子：**

```java
@Repository
public class ConnectionPool {
    @Value("jdbc:mysql://localhost:3306/test")
    private String url;
    @Value("com.mysql.jdbc.Driver")
    private String driveName;
    @Value("Scott")
    private String userName;
    @Value("10")
    private int no;
    //重写下toString方法
}
```

定义配置类，用于扫描bean

```java
@Configuration
@ComponentScan("com.fx.dao")
public class myConfig2 { }
```

测试一下：

```java
@Test
public void test01(){
    ApplicationContext context = new AnnotationConfigApplicationContext(myConfig2.class);
    ConnectionPool connectionPool = context.getBean("connectionPool", ConnectionPool.class);
    System.out.println(connectionPool.toString());
}
```

输出：

````java
ConnectionPool{url='jdbc:mysql://localhost:3306/test', driveName='com.mysql.jdbc.Driver', userName='Scott',no=10}
````



## 2.注入配置文件

可以通过`@Value("${}")`来注入配置文件里面的信息

**栗子：**

```java
@Repository
public class ConnectionPool {
    @Value("jdbc:mysql://localhost:3306/test")
    private String url;
    @Value("com.mysql.jdbc.Driver")
    private String driveName;
    @Value("Scott")
    private String userName;
    @Value("10")
    private int no;
    @Value("${mysql.pwd}")
    //重写下toString方法
}
```

修改下配置类，扫描配置文件：

```java
@Configuration
@ComponentScan("com.fx.dao")
@PropertySource({"classpath:db.properties"})
public class myConfig2 { }
```

`db.properties`配置文件放在`resources`目录下，使用`@PropertySource`注解扫描的`classpath`就是此路径

```java
mysql.pwd=123456
```

测试代码和上面一样我们输出下结果：

```java
ConnectionPool{url='jdbc:mysql://localhost:3306/test', driveName='com.mysql.jdbc.Driver', userName='Scott', no=10, pwd='123456'}
```

<hr>

## 3. 注入表达式并运算

![image-20220212234040749](https://cdn.fengxianhub.top/resources-master/202202122340831.png)

`SpEl`(Spring Expression Language )，是`Spring`的表达式语言，很多框架中都有自己的`El表达式`，Spring中El表达式支持的功能有很多，在<a href="https://docs.spring.io/spring-framework/docs/current/reference/html/core.html#expressions">官方文档</a>里面有详细的介绍和用例。

**栗子：**

例如我想动态获得运行机器的核心数作为参数注入

```java
@Repository
public class ConnectionPool {
    @Value("jdbc:mysql://localhost:3306/test")
    private String url;
    @Value("com.mysql.jdbc.Driver")
    private String driveName;
    @Value("Scott")
    private String userName;
    @Value("10")
    private int no;
    @Value("${mysql.pwd}")
    private String pwd;
    @Value("#{T(java.lang.Runtime).getRuntime().availableProcessors()}")
    private int minCons;
    @Value("#{T(java.lang.Runtime).getRuntime().availableProcessors() * 2}")
    private int maxCons;
    //toString方法
}
```

测试用例和配置类不变，我们输出一下结果:

```java
ConnectionPool{url='jdbc:mysql://localhost:3306/test', driveName='com.mysql.jdbc.Driver', userName='Scott', no=10, pwd='123456', minCons=8, maxCons=16}
```

可以看到`SpEl`里执行了我们想要运行的代码

当然我们还可以用`@Value`执行更多更厉害的EL表达式，<a href="https://docs.spring.io/spring-framework/docs/current/reference/html/core.html#expressions">官方文档</a>

![image-20220212235845224](https://cdn.fengxianhub.top/resources-master/202202122358315.png)





