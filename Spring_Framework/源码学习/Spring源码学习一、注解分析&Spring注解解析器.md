# Spring源码学习二、注解分析&Spring注解解析器

>我们知道，注解的作用其实只有`标记`和`记录属性`两个作用，注解具体的工作还是得依靠`注解解析器`来完成，在本节中我们研究一下Spring中的注解解析器是怎么完成相应注解功能的

首先我们回顾一下Spring中`xml方式`是怎么拿到一个`Bean`实例的

第一步：写xml文件，写上bean的id和bean的包路径名称，例如这种：

```xml
<bean id="typeService" class="com.fx.service.TypeService">
```

第二步：拿到对应的实例

```java
ApplicationContext context = new ClassPathXmlApplicationContext("xxx.xml");
UserService userService= (UserService) ac.getBean("userService");
```

当然我们还有`基于注解`方式拿到`Bean`实例的方式：

配置类：

```java
@Configuration
public class myConfig {
    //声明bean
    @Bean
    public UserService userService(){
        return new UserService();
    }
}
```

然后我们可以通过`Spring`中另外一个context拿到对应实例：

```java
ApplicationContext context = new AnnotationConfigApplicationContext(myConfig.class);
context = new AnnotationConfigApplicationContext(myConfig.class);
UserService bean = context.getBean(UserService.class);
```

这是一个注解形式的context，传入的要解析的配置类字节码文件

我们还可以通过配置注解扫描器来扫描对应包下的带`@Component`注解的类

配置类：

```java
@Configuration
@ComponentScan("com.fx.service")
public class myConfig {
    //声明bean
    @Bean
    public UserService userService(){
        return new UserService();
    }
}
```

打印一下扫描到的`Bean`实例

```java
String[] beanDefinitionNames = context.getBeanDefinitionNames();
Arrays.asList(beanDefinitionNames).forEach(System.out::println);
```

`Spring`基于注解的解析器主有以下几种：

![image-20220211131641948](https://cdn.fengxianhub.top/resources-master/202202111316123.png)













