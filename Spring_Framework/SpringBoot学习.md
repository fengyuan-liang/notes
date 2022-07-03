# SpringBoot学习一

![image-20211010154432784](https://cdn.fengxianhub.top/resources-master/202110101544891.png)

<style>
    @font-face {
            font-family: 'Monaco';
            src: url('https://cdn.fengxianhub.top/resources-master/202109201607602.woff2') 		                                                                                                 format('woff2'),
            url('https://cdn.fengxianhub.top/resources-master/202109201608370.woff') format('woff');
            font-weight: normal;
            font-style: normal;
            font-display: swap;
        }
    dl{
        font-family: Monaco;
    }
    code {
        color: #c7254e;
        background-color: #f9f2f4;
        border-radius: 2px;
        padding: 2px 4px;
        font-family: Monaco;
    }
    blockquote{
        display: block;
        padding: 16px;
        margin: 0 0 24px;
        border-left: 8px solid #62ca38!important;
        background: #eef0f4;
        overflow: auto;
        word-break: break-word!important;
    }
</style>
<blockquote>
    <p>
        SpringBoot基于Spring4.0设计，不仅继承了Spring框架原有的优秀特性，而且还通过简化配置来进一步简化了Spring应用的整个搭建和开发过程。另外SpringBoot通过集成大量的框架使得依赖包的版本冲突，以及引用的不稳定性等问题得到了很好的解决。
    </p>
</blockquote>


SpringBoot的优点：

<ul>
    <li>可以创建独立的<code>Spring</code>应用程序，并且基于其<code>Maven</code>或<code>Gradle</code>插件，可以创建可执行的<code>JARs</code>和<code>WARs</code>；</li>
    <li>内嵌<code>Tomcat</code>或<code>Jetty</code>等<code>Servlet</code>容器；</li>
    <li>提供自动配置的<code>starter</code>项目对象模型（POMS）以简化Maven配置；</li>
    <li>尽可能自动配置Spring容器；</li>
    <li>提供准备好的特性，如指标、健康检查和外部化配置；</li>
    <li>绝对没有代码生成，不需要<code>XML</code>配置。</li>
</ul>


## 1. 学习目标&思维导图

![image-20211010155027091](https://cdn.fengxianhub.top/resources-master/202110101550236.png)

## 2. Spring框架发展史



### 2.1.Spring1.x时代

在Spring1.x时代，都是通过xml文件配置bean，随着项目的不断扩大，需要将xml配置分放到不同的配置文件中，需要频繁的在java类和xml配置文件中切换。

### 2.2.Spring2.x时代

​	随着JDK1.5带来的注解支持，Spring2.x可以使用注解对Bean进行申明和注入，大大的减少了xml配置文件，同时也大大简化了项目的开发。
那么，问题来了，究竟是应该使用xml还是注解呢?

最佳实践:

1. **应用的基本配置用xml**，比如:数据源、资源文件等;

2. **业务开发用注解**，比如: Service 中注入bean等;

### 2.3.Spring3.x到Spring4.x再到Spring5.x

​	从Spring3.x开始提供了Java配置方式，使用Java配置方式可以更好的理解你配置的Bean，现在我们就处于这个时代，并且 Spring4.x、Spring5.x和Spring Boot都推荐使用java配置的方式。



## 3. 💖Spring 5.X 应用零配置开发

​	Spring框架从5.x版本推荐使用注解形式来对java应用程序进行开发与配置，并且可以完全替代原始的XML+注解形式的开发，在使用注

解形式进行项目开发与环境配置时，Spring框架提供了针对环境配置与业务bean开发相关注解。

### 3.1 注解

#### 3.1.1 💖声明Bean注解

```properties
注意：这些方法都只能作用在自己写的类上，要想依赖注入第三方的类需要用@Bean注解

@component:组件没有明确规定其角色，作用在类级别上声明当前类为一个业务组件，被Spring Ioc容器维护

@service:在业务逻辑层(Service 层)类级别进行声明

@Repository:在数据访问层(dao层)类级别声明

@contro1ler:在展现层(MVC)使用标注当前类为一个控制器
```

#### 3.1.2 注入Bean注解（只能注入自己的bean，也就是被ComponentScan扫描的）

```properties
@Autowired: spring官方提供注解

@Inject: ]SR-330提供注解（标准制定方)

@Resource: JSR-250提供注解
```

​	以上三种注解在Set方法或属性上声明，一般情况下通用一般开发中更习惯**声明在属性上**，代码简洁清晰。基于5.x注解配置方式简化了xml配置，应用程序开发与xml环境配置均通过相应注解来实现。



#### 3.1.3 Spring5.X中配置与获取Bean注解

```properties
@configuration:作用与类上，将当前类声明为一个配置类，相当于一个xml配置文件

@comporentscan:自动扫描指定包下标注有@Repository ,@service,@controller

@component:注解的类并由Ioc容器进行实例化和维护

@Bean:作用于方法上,相当于xml文件中<bean>声明当前方法返回值为一个bean,方法名就是bean的id，返回类型就是组件类型。返回的值就是组件在IOC容器里的实例

@value:获取properties文件指定key value值

@Import:获取第三方库的bean

@ImportResource:用于进原生的bean.xml文件转换成bean对象注入到IOC容器
```

#### 3.1.4 注入第三方库的Bean

- 使用@Bean注解

  ```java
      @Bean
      public DBHelper get(){
          return new DBHelper();
      }
  ```

- 使用Import注解：默认返回的类名是类的全类名地址

![image-20211109205757021](https://cdn.fengxianhub.top/resources-master/202111092057164.png)

### 3.2 栗子1-IOC中Bean的实例化与获取

#### 3.2.1 创建普通Spring工程

在pom.xml中添加Spring坐标相关配置

```xml
		<!--添加Spring的依赖坐标-->
        <!-- https://mvnrepository.com/artifact/org.springframework/spring-context -->
        <dependency>
            <groupId>org.springframework</groupId>
            <artifactId>spring-context</artifactId>
            <version>5.3.9</version>
        </dependency>
```

在pom.xml添加编译环境插件

```xml
<plugins>
    <!-- 编译环境插件 -->
    <plugin>
        <groupId>org.apache.maven.plugins</groupId>
        <artifactId>maven-compiler-plugin</artifactId>
        <version>2.3.2</version>
        <configuration>
            <!--源代码使用的JDK版本-->
            <source>1.8</source>
            <!--需要生成的目标class文件的编译版本-->
            <target>1.8</target>
            <!--设置字符集编码-->
            <encoding>UTF-8</encoding>
        </configuration>
    </plugin>
</plugins>
```



#### 3.2.2 创建Bean对象

```java
@Repository
public class UserDao {
    public void test(){
        System.out.println("UserDao Test...");
    }
}

@Service
public class UserService {
    //注入对象
    @Resource
    private UserDao userDao;
    public void test(){
        System.out.println("UserService Test...");
        userDao.test();
    }
}
```



#### 3.2.3 创建IocConfig配置类

```java
//将当前类声明为一个配置类
@Configuration
//设置扫描包的范围
@ComponentScan("com.fx.springboot")
public class IocConfig {

}
```



#### 3.2.4 创建启动类执行测试

```java
public class Test01 {
    public static void main(String[] args) {
        //基于Java的配置类加载Spring的应用的上下文环境
        AnnotationConfigApplicationContext ac = new AnnotationConfigApplicationContext(IocConfig.class);
        //得到指定的bean对象
        UserService userService = ac.getBean(UserService.class);
        //调用方法
        userService.test();
    }
}
```

​	此时启动Spring lOC容器，通过实例化**AnnotationConfigApplicationContext**类，接收配置参数类locConfig，并获取UserService Bean实现方法调用，此时应用环境不存在xml配置文件，简化了应用的xml配置



### 3.3 栗子2-@Bean注解使用

使用@Bean注解声明在方法(注意:方法名一般为bean对象名称) 级别用于返回实例化的Bean对象。

#### 3.3.1 创建Bean对象

```java
//Bean对象
public class AccountDao {
    public void test(){
        System.out.println("AccountDao Test...");
    }
}
```

#### 3.3.2 声明配置类

```java
//将当前类声明为一个配置类
@Configuration
//设置扫描包的范围
@ComponentScan("com.fx.springboot")
public class IocConfig02 {
    //@Bean注解：通常用于整合第三方的Bean对象，比如：数据源、第三方组件等（只需要实例化的Bean对象）
    @Bean //将方法的返回值交给IOC容器维护
    public AccountDao accountDao(){
        return new AccountDao();
    }
}
```

#### 3.3.3 测试

```java
//基于Java的配置类加载Spring应用的上下文环境
AnnotationConfigApplicationContext ac = new AnnotationConfigApplicationContext(IocConfig02.class);
//获取配置类对象
IocConfig02 iocConfig02 = ac.getBean(IocConfig02.class);
//返回Boolean类型，true表示是单例，false表示不是单例
System.out.println(ac.isSingleton("iocConfig02"));
AccountDao accountDao = iocConfig02.accountDao();
accountDao.test();
```



<hr/>

### 3.4 栗子3-读取外部配置文件

​		在开发Java web应用时，配置文件是比较常见的，比如xml，properties, yml等文件，在Spring应用中对于配置文件的读取同样提供支持。对于配置文件读取,我们可以通过@PropertySource注解声明到类级别来指定读取相关配置。

​		Spring EI表达式语言,支持在Xml和注解中使用表达式,类似于JSP中EL表达式，Spring 框架借助该表达式实现资源注入，主要通过**@Value**注解来使用表达式，通过@Value注解，可以实现普通字符串，表达式运算结果，Bean属性文件内容，属性文件等参数注入。具体使用如下:

##### 3.4.1 准备配置文件

src/main/resources目录下添加user.properties,jdbc.properties文件

```properties
# user.properties
user.userName=admin
user.password=admin

#jdbc.properties
jdbc.driver=com.mysql.jdbc.Driver
jdbc.url=jdbc:mysql://127.0.0.1:3306/hr?useUnicode=true&characterEncoding=utf8
jdbc.username=root
jdbc.password=123456
```





##### 3.4.2 @PropertySource加载配置资源

通过@PropertySource加载Property配置文件

```java
//将当前类声明为一个配置类
@Configuration
//设置扫描包的范围
@ComponentScan("com.fx.springboot")
@PropertySource(value = {"classpath:jdbc.properties","classpath:jdbc.properties"})
public class IocConfig03 {
    //获取jdbc.properties文件中属性的值
    @Value("${jdbc.driver}")
    private String driver;
    @Value("${jdbc.url}")
    private String url;
    @Value("${jdbc.username}")
    private String username;
    @Value("${jdbc.password}")
    private String password;
}
```

配置文件：

```java
//加载上下文环境
AnnotationConfigApplicationContext ac = new AnnotationConfigApplicationContext(IocConfig03.class);
//获取配置类对象
IocConfig03 iocConfig03 = ac.getBean(IocConfig03.class);
System.out.println(iocConfig03.toString());
```



##### 3.4.3 其他的Bean对象获取Properties文件内容

一次加载，然后在其他类中能够通过@Value属性获取

```java
@Service
public class UserService {
    //注入对象
    @Resource
    private UserDao userDao;
    @Value("${jdbc.username}")
    private String username;
    @Value("${jdbc.password}")
    private String password;
    public void test(){
        System.out.println("UserService Test...");
        userDao.test();
        //获取配置文件中的属性
        System.out.println("姓名："+username+"，密码"+password);
    }
}

```



### 3.5 组合注解与元注解

​		Spring从2.x版本开始引入注解支持(目的是jdk1.5中推出注解功能),通过引入注解来消除大量xml配置,Spring引入注解主要用来注入bean以及aop切面相关配置，但由于注解大量使用，就会造成大量重复注解代码出现，代码出现了重复, Spring 为了消除重复注解,在元注解上引入了组合注解，实可以理解为对代码的重构，相当于注解的注解,拥有元注解的原始功能，比如在定义配置类时用到的@Configuration注解就是组合注解，拥有@Component注解功能，即配置类本身也是一个被IOC维护的单例Bean。

![](https://cdn.fengxianhub.top/resources-master/202110101957453.png)



##### 3.5.1 自定义组合注解

定义MyCompScan注解，拥有@ComponentScan扫描器注解功能

自定义注解是对注解的一种重构，简化注解

```java
@Target({ElementType.TYPE})
@Retention(RetentionPolicy.RUNTIME)
@Documented
@ComponentScan
public @interface MyCompScan {
    String[] value() default {};
}
```



## 4. SpringMVC零配置创建&部署

​		基于Spring Mvc 5.X使用Maven搭建SpringMvc Web项目,通过Spring提供的注解与相关配置来对项目进行创建与部署。

### 4.1 创建SpringMVC web工程

创建Maven的web工程

![image-20211010205109218](https://cdn.fengxianhub.top/resources-master/202110102051387.png)



### 4.2 pom.xml添加坐标相关配置

```xml
<!--Spring web坐标依赖-->
<!-- https://mvnrepository.com/artifact/org.springframework/spring-web -->
<dependency>
    <groupId>org.springframework</groupId>
    <artifactId>spring-web</artifactId>
    <version>5.3.9</version>
</dependency>

<!--Spring-webmvc坐标依赖-->
<!-- https://mvnrepository.com/artifact/org.springframework/spring-webmvc -->
<dependency>
    <groupId>org.springframework</groupId>
    <artifactId>spring-webmvc</artifactId>
    <version>5.3.9</version>
</dependency>

<!--web servlet-->
<!-- https://mvnrepository.com/artifact/javax.servlet/javax.servlet-api -->
<dependency>
    <groupId>javax.servlet</groupId>
    <artifactId>javax.servlet-api</artifactId>
    <version>3.1.0</version>
    <scope>provided</scope>
</dependency>
```

插件：

```xml
<build>
    <finalName>SpringBoot1002</finalName>
    <pluginManagement><!-- lock down plugins versions to avoid using Maven defaults (may be moved to parent pom) -->
        <plugins>
            <plugin>
                <groupId>org.apache.maven.plugins</groupId>
                <artifactId>maven-compiler-plugin</artifactId>
                <version>2.3.2</version>
                <configuration>
                    <source>1.8</source>
                    <target>1.8</target>
                    <encoding>UTF-8</encoding>
                </configuration>
            </plugin>
        </plugins>
    </pluginManagement>
</build>
```



### 4.3 添加源代码

```java
@Controller
public class HelloController {

    @RequestMapping("/index")
    public String index(){
        return "index";
    }
}
```



### 4.4 添加视图

在WEB-INF/views目录下创建index.jsp(这里以jsp为模板)

```xml
<%@ page contentType="text/html;charset=UTF-8" language="java" %>
<html>
<head>
    <title>Title</title>
</head>
<body>
    <h2>hello MVC</h2>
</body>
</html>
```



### 4.5 SpringMVC配置类添加

​		Spring Mvc配置信息MvcConfig文件添加，作为Mvc框架环境，原来是通过xml来进行配置(视图解析器、Json转换器、文件上传解析器等)，这里基于注解通过继承WebMvcConfigurerAdapter类并重写相关方法来进行配置(注意通过@EnableWebMvc注解来启动MVC环境)。

```java
	/**
     * 配置JSP视图解析器
     * @return
     */
    @Bean//将方法返回值交给IOC容器取维护
    public InternalResourceViewResolver viewResolver(){
        //获取视图解析器
        InternalResourceViewResolver viewResolver = new InternalResourceViewResolver();
        //设置前缀
        viewResolver.setPrefix("/WEB-INF/views/");
        //设置后缀
        viewResolver.setPrefix(".jsp");
        //返回视图解析器（交给IOC容器维护）
        return viewResolver;
    }
```

​			MvcConfig类定义好了，那么问题来了，怎么加载MvcConfig类呢，原来在构建Mvc应用时是通过容器启动应用时加载web.xml文件实现配置文件加载,现在的环境web.xml文件不存在，此时基于注解方式构建的Mvc应用，定义WebInitializer实现WebApplicationInitializer接口(该接口用来配置Servlet3.0+配置的接口，用于替代web.xml配置)，当servlet容器启动Mvc应用时会通过SpringServletContainerlntalizer接口进行加载，从而加载Mvc应用信息配置。**实现该接口onStartup方法**，加载应用信息配置。

### 4.6 入口文件代码添加

```java
public class WebInitializer implements WebApplicationInitializer {
    @Override
    public void onStartup(ServletContext servletContext) throws ServletException {
        //得到Spring应用的上下文环境
        AnnotationConfigWebApplicationContext ac = new AnnotationConfigWebApplicationContext();
        //注册MVC的配置类
        ac.register(MvcConfig.class);
        //设置ServletContext的上下文信息
        ac.setServletContext(servletContext);
        //配置转发器
        ServletRegistration.Dynamic servlet=servletContext.addServlet("dispatcher",new DispatcherServlet(ac));
        //设置映射路径
        servlet.addMapping("/");
        //启动时去实例化Bean
        servlet.setLoadOnStartup(1);
    }
}
```

### 4.7 部署与测试

在Tomcat上部署测试



## 5. SpringBoot概念和特点

![image-20211010215904920](https://cdn.fengxianhub.top/resources-master/202110102159128.png)

### 5.1 框架概念

​		随着动态语言流行(Ruby、Scala、 NodeJs等), Java 开发变得相对笨重，配置繁琐,开发效率低下，部署流程复杂，以及第三方集成难度也相对较大,针对该环境，Spring Boot被开发出来,其使用**“习惯大于配置目标”**,借助Spring Boot能够让项目快速运行起来，同时借助Spring Boot可以快速创建web应用并独立进行部署(jar包war包方式，内嵌servlet容器)，同时借助Spring Boot在开发应用时可以不用或很少去进行相关xml环境配置,简化了开发,大大提高项目开发效率。

​		Spring Boot是由Pivotal团队提供的全新框架，其设计目的是用来简化Spring应用的初始搭建以及开发过程。该框架使用了特定的方式来进行配置，从而使开发人员不再需要定义样板化的配置。通过这种方式,让Spring Boot在蓬勃发展的快速应用开发领域(rapid application development)成为领导者。

### 5.2 框架特点

​		创建独立Spring应用程序、嵌入式Tomcat、Jetty 容器、无需部署WAR包、简化Maven及Gradle配置、尽可能自动化配置Spring.直接植入产品环境下的实用功能，比如度量指标、健康检查及扩展配置、无需代码生成及XML配置等,同时Spring Boot不仅对web应用程序做了简化，还提供一系列的依赖包来把其它一些 工作做成开箱即用。



### 5.3 Spring Boot快速入门

#### 5.3.1 环境准备

Idea、Maven、Jdk1.8、Spring Boot2.0x

#### 5.3.2 创建项目

创建一个普通的Maven项目

#### 5.3.3 添加依赖坐标

```xml
<parent>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-parent</artifactId>
    <version>2.5.2</version>
    <relativePath/> <!-- lookup parent from repository -->
  </parent>
    
    
  <dependency>
      <groupId>org.springframework.boot</groupId>
      <artifactId>spring-boot-starter-web</artifactId>
    </dependency>
```

​	Spring Boot的项目必须要将parent设置为Spring Boot的parent,该parent包含了大量默认的配置，简化程序的开发



#### 5.3.4 导入Spring Boot的web坐标与相关插件

```xml
	  <plugins>
        <plugin>
          <groupId>org.springframework.boot</groupId>
          <artifactId>spring-boot-maven-plugin</artifactId>
        </plugin>
      </plugins>
```

#### 5.3.5 添加源代码

```java
@Controller
public class HelloController {

    @RequestMapping("/hello")
    @ResponseBody
    public String hello(){
        return "hello SpringBoot";
    }
}
```



#### 5.3.6 创建启动程序

```java
@SpringBootApplication
public class Test01Application {
    public static void main(String[] args) {
        SpringApplication.run(Test01Application.class);
    }
}
```



#### 5.3.7 启动Spring Boot应用并测试









## 6.Spring Boot核心配置

### 6.1 设置Banner图标

![image-20211011092004481](https://cdn.fengxianhub.top/resources-master/202110110920700.png)



​		在搭建 Spring Boot项目环境时，程序启动后会在控制台打印醒目的SpringBoot图标，图标描述了SpringBoot 版本信息，这是Spring Boot项目与Spring项目启动区别较大的地方，Spring Boot通过默认Banner在程序启动时显示应用启动图标，当然图标我们也可以进行自定义。



#### 6.1.1 Banner图标自定义

​		Spring Boot项目启动时默认加载src/main/resources日录下的 banner.txt图标文件，如果该目录文件未提供，，则使用Spring Boot默认。在main目录下新建resources资源目录，并在该目录下新建banner.txt 文本文件，可以设置自定义图标。

在线生成Banner图标网址：<a herf="http://patorjk.com/software/taag/#p=display&f=Graffiti&t=fengxian">banner图标</a>

​		在resources目录下创建自己的Banner.txt图标

![image-20211011093239992](https://cdn.fengxianhub.top/resources-master/202110110932353.png)



#### 6.1.2 Banner图标

​		如果启动时不想要看到启动图标，这里也可以通过代码进行关闭操作，修改StarterApplication设置BannerMode值Banner.Mode.OFF，启动Spring Boot应用关闭图标输出功能即可

```java
		SpringApplication springApplication = new SpringApplication(Test01Application.class);
        //设置Banner图标关闭
        springApplication.setBannerMode(Banner.Mode.OFF);
        //启动SpringBoot
        springApplication.run();
```



### 6.2 Spring Boot配置文件

​		Spring Boot默认会读取全局配置文件，配置**文件名固定**为: application.properties或 application.yml，放置在src/main/resources资源目录下，使用配置文件来修改SpringBoot自动配置的默认值。

在resources资源目录下添加application.properties文件,配置信息如下:



application.properties：

```properties
#设置项目启动的端口号
server.port=8899
#设置项目的访问路径（上下文换将/站点名）
server.servlet.context-path=/mvc/
##数据源配置
spring.datasource.driver-class-name=com. mysq1.cj.jdbc.Driver
spring.datasource.ur1=jdbc:mysql://127.0.0.1:3306/hr?
useUnicode=true&characterEncodi ng=utf8
spring.datasource.username=root
spring.datasource.password=root
```



application.yml:

```properties
#设置项目的端口号
server:
  port: 8866
  #设置项目的访问路径
  servlet:
    context-path: /mvc02
```



### 6.3 Starter坐标&自动化配置

#### 6.3.1 Starter坐标配置

​		Spring Boot引入了全新的Starter坐标体系,简化企业项目开发大部分场景的Starter pom,应用程序引入指定场景的Start pom相关配置就可以消除，通过Spring Boot就可以得到自动配置的Bean。

##### 6.3.1.1 web Starter

使用Spring MVC来构造RESTful Web应用，并使用Tomcat作为默认内嵌容器

```xml
	<dependency>
      <groupId>org.springframework.boot</groupId>
      <artifactId>spring-boot-starter-web</artifactId>
    </dependency>
```



##### 6.3.1.2 freemarker&thymeleaf Starter

在MVC应用中使用Thymeleaf渲染视图

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-freemarker</artifactId>
</dependency>
```

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-thymeleaf</artifactId>
</dependency>
```

##### 6.3.1.3 附录，常用Starter

| 名称                                   | 描述                                                         |
| -------------------------------------- | ------------------------------------------------------------ |
| spring-boot-starter-thymeleaf          | 使MVC Web applications 支持Thymeleaf                         |
| spring-boot-starter-mail               | 使用Java Mail、Spring email发送支持                          |
| spring-boot-starter-data-redis         | 通过Spring Data Redis 、Jedis client使用Redis键值存储数据库  |
| spring-boot-starter-web                | 构建Web，包含RESTful风格框架SpringMVC和默认的嵌入式容器Tomcat |
| spring-boot-starter-activemq           | 为JMS使用Apache ActiveMQ                                     |
| spring-boot-starter-data-elasticsearch | 使用Elasticsearch、analytics engine、Spring Data Elasticsearch |
| spring-boot-starter-aop                | 通过Spring AOP、AspectJ面向切面编程                          |
| spring-boot-starter-security           | 使用 Spring Security                                         |
| spring-boot-starter-data-jpa           | 通过 Hibernate 使用 Spring Data JPA                          |
| spring-boot-starter                    | Core starter,包括 自动配置支持、 logging and YAML            |
| spring-boot-starter-freemarker         | 使MVC Web applications 支持 FreeMarker                       |
| spring-boot-starter-batch              | 使用Spring Batch                                             |
| spring-boot-starter-data-solr          | 通过 Spring Data Solr 使用 Apache Solr                       |
| spring-boot-starter-data-mongodb       | 使用 MongoDB 文件存储数据库、Spring Data MongoDB             |



#### 6.3.2 SpringBoot自动化配置

##### 6.3.2.1 SpringBoot Starter坐标版本查看

​		前面介绍了SpringBoot Starter相关坐标，引入Starter坐标来简化应用环境的配置。这里以环境搭建spring- boot-starter-web坐标来简单分析SpringBoot自动化配置过程。

![image-20211011103922909](https://cdn.fengxianhub.top/resources-master/202110111039110.png)



##### 6.3.2.2 自动化配置

​		Spring Boot的项目一般都会有*Application的入口类,入口类中提供main方法，这是一个标准的Java应用程序的入口方法。@SpringBootApplication 注解是Spring Boot的核心注解，它其实是一个组合注解:

- @SpringBootApplication

  ![image-20211011104203247](https://cdn.fengxianhub.top/resources-master/202110111042409.png)

可以看出该注解也是一个组合注解, 组合了@Configuration注解,对于Spring Boot应用，
@SpringBootConfiguration注解属于Boot项目的配置注解也是属于一个组合注解， Spring Boot项目中推荐使用
@SpringBootConfiguration注解，因为其组合了@Configuration注解。

- @EnableAutoConfiguration

  ![image-20211011104404818](https://cdn.fengxianhub.top/resources-master/202110111044989.png)

@EnableAutoConfiguration注解组合了@AutoConfigurationPackage、
@Import(AutoConfigurationlmportSelector.class)注解。
@AutoConfigurationPackage底层也是一个@lmport(AutoConfigurationPackages.Registrar.class),其会
把启动类的包下组件都扫描到Spring容器中。



### 6.4 Profile配置

​		Profile是Spring用来针对不同环境对不同配置提供支持的全局Profile配置使用application-{profile}.yml,
比如application-dev.yml , application-test.yml。

通过在application.yml中设置spring.profiles.active=test |dev| prod来动态切换不同环境，具体配置如下:

![image-20211011105900170](https://cdn.fengxianhub.top/resources-master/202110111059367.png)



### 6.5 日志配置

​		在开发企业项目时，日志的输出对于系统bug定位无疑是一种比较有效的方式,也是项目后续进入生产环境后快速发现错误解决错误的一种有效手段,所以日志的使用对于项目也是比较重要的一块功能。

​		Spring Boot默认使用LogBack日志系统，如果不需要更改为其他日志系统如Log4j2等，则无需多余的配置，LogBack 默认将日志打印到控制台上。如果要使用LogBack,原则上是需要添加dependency依赖的。

​		因为新建的Spring Boot项目-般都会引用spring-boot-starter或者spring-boot-starter-web,而这两个起步依赖中都已经包含了对于spring-boot-starter-logging的依赖,所以，**无需额外添加依赖。**

#### 6.5.1 日志输出

用的是这两个包，别导错包了

```java
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
```

![image-20211011111027680](https://cdn.fengxianhub.top/resources-master/202110111110880.png)



#### 6.5.2 日志输出格式配置

​		修改application.yml文件添日志输出格式信息配置，可以修改application.yml文件来控制控制台日志输出格式，同时可以设置日志信息输出到外部文件。

```yml
#日志输出
logging:
  pattern:
    console: "%d{yyyy-MM-dd HH:mm:ss} [%thread] %-5level %logger- %msg%n"
    level: debug
  file:
    path: "."
    name: "springboot.log"
```





## 7.Freemarker&Thymeleaf视图技术集合

### 7.1 Freemarker视图集合

​		SpringBoot内部支持Freemarker视图技术的集成，并提供了自动化配置类FreeMarkerAutoConfiguration,借助自动化配置可以很方便的集成Freemarker基础到 SpringBoot环境中。这里借助入门]项目引入Freemarker环境配置。

- Starter坐标引入

  ```xml
  <!--freemarker坐标依赖-->
      <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-freemarker</artifactId>
      </dependency>
  ```

- 添加freemarker的配置信息

  ​		Freemarker默认默认视图路径文resources/templates目录(由自动化配置类FreemarkerProperties决定)，该目录可以进行在application.yml中进行修改。

  ```yml
  #动态环境切换
  spring:
    profiles:
      active: dev
    #freemarker配置
    freemarker:
      suffix: .ftl
      content-type: text/html
      charset: utf-8
      template-loader-path: classpath:/views/
  ```



### 7.2 Thymeleaf视图集合

​		SpringBoot支持多种视图技术集成，并且**SpringBoot官网推荐使用Thymeleaf**作为前端视图页面，这里实现Thymeleaf视图集成，借助入门项目引入Thymeleaf环境配置。

- Starter坐标引入

  ```xml
  <!--thymeleaf坐标依赖-->
  <dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-thymeleaf</artifactId>
  </dependency>
  ```

- 添加 Thymeleaf 配置信息

  ​		Thymeleaf默认默认视图路径文resources/templates目录(由自动化配置类Thymeleaf Properties类决定),该目录可以进行在application.yml中进行修改。

![image-20211011121232470](https://cdn.fengxianhub.top/resources-master/202110111212587.png)



```yml
#Thymeleaf配置
thymeleaf:
prefix: classpath:/html/
#关闭缓存
cache: false
```



- 准备控制器转发视图

  ```java
  //Thymeleaf视图
  @RequestMapping("/index")
  public String index(Model model){
      //设置请求域的数据
      model.addAttribute("msg","Thymeleaf视图 Test...");
      //转发视图
      return "index";
  }
  ```



- 修改HTML页面的设置

  ```html
  <html lang="en" xmlns:th="http://www.thymeleaf.org">
  ```

  

- 编写index.html文件

  修改默认访问的目录，在resources目录下创建html目录

  ```html
  <!DOCTYPE html>
  <html lang="en" xmlns:th="http://www.thymeleaf.org">
  <head>
      <meta charset="UTF-8">
      <title>Thymeleaf视图</title>
  </head>
  <body>
      <h2 th:text="${msg}"></h2>
  </body>
  </html>
  ```
  




## 8. SpringBoot静态资源访问

从入门项目中可以看到:对于Spring Mvc请求拦截规则为'/'，Spring Boot默认静态资源路径如下:

![image-20211011124137550](https://cdn.fengxianhub.top/resources-master/202110111241697.png)



**即:我们可以在resources资源目录下存放web应用静态资源文件。**



### 8.1 默认静态资源路径

<blockquote>
    <p>
       在<code>resources</code>目录下创建<code>static</code>或者<code>public</code>目录,存放images、js、css等静态资源文件
    </p>
</blockquote>

![image-20211011125658304](https://cdn.fengxianhub.top/resources-master/202110111256404.png)



### 8.2 自定义静态资源路径

​	在spring.resources.static-locations后面追加一个配置classpath:/os/

```yml
  #设置静态资源的默认访问路径 多个路径之间用逗号隔开
  web:
    resources:
      #设置多个访问路径
      static-locations: classpath:/static/,classpath:/public/,classpath:/os/
```



## 9.SpringBoot项目打包和部署

​		当项目开发完毕进行部署.上线时，需要对项目进行打包操作，入门中构建的项目属于普通应用，由于SpringBoot内嵌Tomcat容器,所有打包后的jar包默认可以自行运行。

### 9.1 jar包部署

#### 9.1.1 配置打包命令

在对应的Maven窗口配置打包命令

<blockquote>
    <p>
        clean compile package -Dmaven.test.skip=true
    </p>
</blockquote>

![image-20211011131540834](https://cdn.fengxianhub.top/resources-master/202110111315976.png)



或者在mavenLifecycle里面打（选中运行）：

![image-20211109172326888](https://cdn.fengxianhub.top/resources-master/202111091723217.png)



然后在命令行里运行即可：

![](https://cdn.fengxianhub.top/resources-master/202111091729794.png)

### 9.2war包部署

​		War包形式部署Web项目在生产环境中是比较常见的部署方式，也是目前大多数web应用部署的方案，这里对于Spring Boot Web项目进行打包部署步骤如下

先欠着



# SpringBoot学习二

## 1.学习目标

![image-20211011142736306](https://cdn.fengxianhub.top/resources-master/202110111427448.png)



## 2. Mybatis整合&数据访问

​		使用SpringBoot开发企业项目时,持久层数据访问是前端页面数据展示的基础，SpringBoot支持市面 上常见的关系库产品(Oracle、Mysql、SqlServer、DB2等)对应的相关持久层框架，当然除了对于关系库访问的支持,也支持当下众多的非关系库(Redis、Solr、 MongoDB等) 数据访问操作，这里主要介绍SpringBoot集成Mybatis并实现持久层数据基本增删改查操作。

### 2.1 SpringBoot整合Mybatis

#### 2.1.1环境整合配置



相关坐标依赖：

```xml
<!-- mybatis集成-->
<dependency>
    <groupId>org.mybatis.spring.boot</groupId>
        <artifactId>mybatis-spring-boot-starter</artifactId>
    <version>2.1.1</version>
</dependency>
<!-- springboot 分页插件-->
<dependency>
    <groupId>com.github.pagehelper</groupId>
        <artifactId>pagehelper-spring-boot-starter</artifactId>
    <version>1.2.13</version>
</dependency>
<!-- mysql驱动-->
<dependency>
    <groupId>mysql</groupId>
    <artifactId>mysql-connector-java</artifactId>
</dependency>
<!-- c3p0数据源-->
<dependency>
    <groupId>com.mchange</groupId>
    <artifactId>c3p0</artifactId>
    <version>0.9.5.5</version>
</dependency>

```



设置配置项(application.yml)：

```yml
server:
  #设置端口号
  port: 8080
  #设置访问地址
  servlet:
    context-path: /
spring:
  #数据库配置
  datasource:
    username: root
    password: 123456
    url: jdbc:mysql://localhost:3306/iot?useUnicode=true&characterEncoding=utf-8&useSSL=false&serverTimezone=Asia/Shanghai
    type: com.mchange.v2.c3p0.ComboPooledDataSource
##  Mybatis配置
mybatis:
  mapper-locations: classpath:/mappers/*.xml
  type-aliases-package: com.fx.pojo
  configuration:
    #下划线转驼峰配置
    map-underscore-to-camel-case: true
## pageHelper
pagehelper:
  helper-dialect: mysql
##显示dao，执行SQL语句
logging:
  level:
    com:
      fx:
        dao: debug

```



