# Spring @Import导入Bean的三种类型：Component、ImportSelector、ImportBeanDefinitionRegistrar

>我们通过`@Import`注解的注释可以知道，我们可以在被`Component`标记的类下导入其他的类和实现`ImportSelector`、`ImportBeanDefinitionRegistrar`接口的类

![image-20220212212142514](https://cdn.fengxianhub.top/resources-master/202202122313379.png)

<hr>

## 1.在`Component`标记的类下导入第三方的类

我们知道`@Import`注解最最要的作用是用来批量导入第三方`Jar`包里面的类，因为第三方`Jar`包，并没有我们被我们`Spring`的注解所标记，对于少数的类我们可以通过`@Bean`注解导入`IOC`容器，想要批量导入时就可以用`@Import`注解

**栗子：**

```java
@Configuration
@Import({Apple.class,Orange.class, Banana.class})
public class myConfig {

}
```

测试一下：

```java
@Test
public void test(){
    ApplicationContext context = context = new AnnotationConfigApplicationContext(myConfig.class);
    String[] beanDefinitionNames = context.getBeanDefinitionNames();
    Arrays.asList(beanDefinitionNames).forEach(System.out::println);
}
```

打印结果：

```java
org.springframework.context.annotation.internalConfigurationAnnotationProcessor
org.springframework.context.annotation.internalAutowiredAnnotationProcessor
org.springframework.context.annotation.internalCommonAnnotationProcessor
org.springframework.context.event.internalEventListenerProcessor
org.springframework.context.event.internalEventListenerFactory
myConfig
com.fx.pojo.Apple
com.fx.pojo.Orange
com.fx.pojo.Banana
```

>从这里我们可以看到通过`@Import`注入的类如果通过类名获取需要通过`类的全路径名称`获取，否者会报错

<hr>

## 2. 注入实现了`ImportSelector`接口的类

有的时候我们有这样的业务需求：需要按照操作系统的类型来导入不同的类，例如在`Windows`系统下导入Apple类，在`Linux`系统下导入Banana类

`ImportSelector`字面上的意思就是导入选择器，根据条件导入不同的类。

怎么让不同的类可以通过同一个类名或者类的字节码文件获得呢？我们可以定义一个接口让我们想要分类的类实现这个接口，再利用多态进行转换

**栗子：**

定义一个接口：

```java
public interface Fruit {}
```

让我们想要选择的类实现这个接口：

```java
public class Apple implements Fruit{}
```

```java
public class Banana implements Fruit{}
```

写一个类实现`ImportSelector`接口，并实现里面选择的方法`selectImports`

```java
public class FruitImportSelector implements ImportSelector {
    @Override
    public String[] selectImports(AnnotationMetadata importingClassMetadata) {
        //importingClassMetadata里面保存调用此选择器的类
        System.out.println("在PearImportSelector中"+importingClassMetadata.toString());
        //拿到操作系统名称
        String osName = System.getProperty("os.name");
        if(osName.contains("Windows")){
            //返回Apple类
            return new String[]{Apple.class.getName()};
        }else if(osName.contains("Linux")){
            //返回Banana类
            return new String[]{Banana.class.getName()};
        }
        return null;
    }
}
```

这时候我们要解析类中要导入的就是选择器类了

```java
@Configuration
@Import({FruitImportSelector.class})
public class myConfig {}
```

测试一下，输出的是：

```java
com.fx.pojo.Apple
```

当然我们可以通过注入这两个类的接口类获得具体的类

```java
@Test
public void test(){
    ApplicationContext context = context = new AnnotationConfigApplicationContext(myConfig.class);
    String name = context.getBean(Fruit.class).getClass().getName();
    System.out.println(name);
}
```

输出：

```java
com.fx.pojo.Apple
```

<hr>



## 3. 注入实现了`ImportBeanDefinitionRegistrar`接口的类

>可以看到通过`@Import`注入的类如果我们要通过`类的全路径名`才能从`IOC`容器拿到类的实例，这样比较麻烦，所以`ImportBeanDefinitionRegistrar`接口正是用来给类其别名，简化`IOC`容器中类的名称的

**栗子：**

先定义一个类实现下`ImportBeanDefinitionRegistrar`接口

```java
public class FruitNameImportBeanDefinitionRegistrar implements ImportBeanDefinitionRegistrar {
    @Override
    public void registerBeanDefinitions(AnnotationMetadata importingClassMetadata, BeanDefinitionRegistry beanDefinitionRegistry) {
        //判断下Apple类是否在容器类了,beanDefinitionRegistry保存了IOC容器中所有Bean的定义项
        boolean flag = beanDefinitionRegistry.containsBeanDefinition("com.fx.pojo.Apple");
        if(flag){
            //先拿到bean的定义项，在Spring容器中每个Bean都被包装成了一个RootBeanDefinition
            RootBeanDefinition r = new RootBeanDefinition(Apple.class);
            //将类的访问名字从容器中修改一下
            beanDefinitionRegistry.registerBeanDefinition("Apple",r);
        }
    }
}
```

注入一下这个类：

```java
@Configuration
@Import({Apple.class,FruitNameImportBeanDefinitionRegistrar.class})
public class myConfig {}
```

测试：

```java
@Test
public void test(){
    ApplicationContext context = context = new AnnotationConfigApplicationContext(myConfig.class);
    String[] beanDefinitionNames = context.getBeanDefinitionNames();
    Arrays.asList(beanDefinitionNames).forEach(System.out::println);
}
```

打印结果：

```java
Apple
```

通过这种方式就可以修改通过获得Bean实例的名字了



