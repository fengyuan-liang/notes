# SpringBoot自动装箱原理

>之前面试被问到这个题目，只会答一些spi、@AutoConfigration注解、@Import之类的，感觉面试官并不是很满意，自己也还停留在八股文的水平，最近有时间了，仔细总结一下

## 1. 从调用SpringApplication构造器方法开始

首先一切的开始都是从这个方法开始的`SpringApplication.run()`，所以说自动装箱的核心就是这个`run`方法的执行过程

首先我们应该带着问题看这个方法的执行

- 是否需要创建IOC容器，需要创建那些Bean
- 创建Bean之前的准备工作

最好的看源码的方式是通过`debug`的方式，我们在`SpringApplication.run()`上面打一个断点，然后一步一步的分析

![image-20221111230725572](https://cdn.fengxianhub.top/resources-master/202211112307869.png)

首先第一步，`SpringApplication.run()`方法需要传入两个参数，第一个参数就是启动类本身，用于在之后解析启动类（解析标记的注解、启动类作为一个配置类，也需要解析），后面那个`args`是传入的虚拟机参数

再往下一层能够看到`new SpringApplication(primarySources).run(args)`，当我们看到`new`关键字的时候我们处了知道创建了一个对象之外，还应该注意到他调用了`SpringApplication`这个类的构造器，构造器一般会用来加载一些配置

![image-20221111235509417](https://cdn.fengxianhub.top/resources-master/202211112355672.png)

启动类里面的这一行其实在表示当前Spring要用什么web方式，在JavaWeb开发中一般常用的就是`Servlet`程序，其实就对应着SpringMVC，Spring还提供了`SpringWebflux`来进行响应式响应式编程

![image-20221112000300822](https://cdn.fengxianhub.top/resources-master/202211120003894.png)

```java
/**
 * The application should not run as a web application and should not start an
 * embedded web server.
 */
NONE,
/**
 * The application should run as a servlet-based web application and should start an
 * embedded servlet web server.
 */
SERVLET,
/**
 * The application should run as a reactive web application and should start an
 * embedded reactive web server.
 */
REACTIVE;
```

接下来就是非常重要的两行代码了，这里就涉及到了`spring.factories`文件到底是怎么加载的问题了

![image-20221112000816135](https://cdn.fengxianhub.top/resources-master/202211120008215.png)

一看名字就能看出来

- 设置初始化器
- 设置监听器

这里面的`getSpringFactoriesInstances`就是去加载`spring.factories`带给我们自动装箱的bean实例的

![image-20221112001616730](https://cdn.fengxianhub.top/resources-master/202211120016841.png)

通过`org.springframework.context.ApplicationContextInitializer`来加载自动装箱文件

![image-20221112001827828](https://cdn.fengxianhub.top/resources-master/202211120018903.png)

再然后获取`spring.factories`文件的资源路径

![image-20221112002246735](https://cdn.fengxianhub.top/resources-master/202211120022809.png)

其实这个资源文件`FACTORIES_RESOURCE_LOCATION`也早已经定义好了

![image-20221112002326264](https://cdn.fengxianhub.top/resources-master/202211120023332.png)

然后就到了加载配置文件里面配置好的bean了

![image-20221112002847601](https://cdn.fengxianhub.top/resources-master/202211120028693.png)

接下来就是通过反射创建实例并返回的操作

>到目前为止，其实还没有牵涉到自动装配的东西

## 2. 解析启动类

我们继续debug，直接到解析启动类的地方

```java
org.springframework.boot.SpringApplication#prepareContext
```

看这里，就是去加载启动类

![image-20221112005418594](https://cdn.fengxianhub.top/resources-master/202211120054750.png)

一路进入到这里

```java
org.springframework.boot.BeanDefinitionLoader#load()
```

![image-20221112005642511](https://cdn.fengxianhub.top/resources-master/202211120056593.png)

开始加载我们的启动类，可以看到其实我们的启动类可以定义不止一个，进入load方法

![image-20221112010055876](https://cdn.fengxianhub.top/resources-master/202211120100944.png)

这里看到一个方法`isEligible(source)`，即有资格的的bean，这个方法在低版本的boot中是`isComponent(source)`，很好理解，即这个bean必须要被`@Component`标记才能被注册

准备工作完成之后接下来进入到我们非常重要的一个方法`refreshContext(context)`方法

![image-20221112102518397](https://cdn.fengxianhub.top/resources-master/202211121025600.png)

接下来会落到这个方法里面

![image-20221112102749762](https://cdn.fengxianhub.top/resources-master/202211121027379.png)

当我们在Spring源码中看到`refresh`方法的时候，其实我们应该知道这肯定跟SpringIOC容器有关了，我们在`org.springframework.context.support.AbstractApplicationContext#refresh`中其实能够看到13个方法，在Spring中所有带有refresh方法最终的实现基本上都是在这里

![image-20221112103044669](https://cdn.fengxianhub.top/resources-master/202211121030758.png)

我们看到其中的一个方法`postProcessBeanFactory(beanFactory)`

这个方法就是做增强的，在Spring中看到`postProcessBean`开头的方法，我们一般喜欢将其称之为后置增强器

我们来到这里，其中`configCandidates`用来存放启动类

```java
org.springframework.context.annotation.ConfigurationClassPostProcessor#processConfigBeanDefinitions
```

在这里会去找到所有匹配的能够被解析的类，可以看到已经拿到我们的启动类了

![image-20221113155249642](https://cdn.fengxianhub.top/resources-master/202211131552863.png)

![image-20221113155444972](https://cdn.fengxianhub.top/resources-master/202211131554055.png)

![image-20221113155648133](https://cdn.fengxianhub.top/resources-master/202211131556230.png)

>**继续往下，我们就能看到解析启动类的地方**
>
>```java
>-> org.springframework.context.annotation.ConfigurationClassParser#processConfigurationClass
>-> org.springframework.context.annotation.ConfigurationClassParser#doProcessConfigurationClass
>```

![image-20221113160220051](https://cdn.fengxianhub.top/resources-master/202211131602170.png)

我们来看一下解析`@Import`注解的地方，因为在实际开发中自动装箱我们用这个注解比较多

```java
    org.springframework.context.annotation.ConfigurationClassParser#collectImports
```

在这里的方法中递归解析

![image-20221113160624860](https://cdn.fengxianhub.top/resources-master/202211131606975.png)

拿到import注解后我们在来到这里`org.springframework.boot.autoconfigure.AutoConfigurationImportSelector.AutoConfigurationGroup#process`

![image-20221113162737875](https://cdn.fengxianhub.top/resources-master/202211131627087.png)

然后再到这里面就会去加载`spring.factories`文件了

```java
org.springframework.core.io.support.SpringFactoriesLoader#loadSpringFactories
```

比较精彩的一点是他会去拿一下之前已经加载过的缓存，避免重复加载

![image-20221113163547837](https://cdn.fengxianhub.top/resources-master/202211131635929.png)

当然也不会全部加载进去，如果项目中没有依赖，会将这些bean排除掉

![image-20221113163824676](https://cdn.fengxianhub.top/resources-master/202211131638771.png)

## 3. 面试答法

首先自动装配中最重要的三个类，回答的时候要沿着这三个方法去回答

- BFPP: **BeanFactoryPostProcessor**
- BPP: **BeanPostProcessor**
- BDRPP：**BeanDefinitionRegistryPostProcessor**

第一步：自动装配是什么？解决了那些问题

第二步：自动装配的过程

1. 当启动springboot应用程序的时候，会先创建`SpringApplication`的对象，在对象的构造方法中会进行某些参数的初始化工作，最主要的是判断当前应用程序的类型以及初始化器和监听器，在这个过程中会加载整个应用程序中的`spring.factories`文件，将文件的内容放到缓存对象中，方便后续获取。

2. SpringApplication对象创建完成之后，开始执行run方法，来完成整个启动，启动过程中最主要的有两个方法，第一个叫做`prepareContext`，第二个叫做`refreshContext`,在这两个关键步骤中完整了自动装配的核心功能，前面的处理逻辑包含了上下文对象的创建，banner的打印，异常报告期的准备等各个准备工作，方便后续来进行调用。

3. 在prepareContext方法中主要完成的是对上下文对象的初始化操作，包括了属性值的设置，比如环境对象，在整个过程中有一个非常重要的方法，叫做load，load主要完战一件事，将当前启动类做为一个`beanDefinition`注册到`registry`中，方便后续在进行`BeanFactoryPostProcessor`调用执行的时候，找到对应的主类，来完成`@SpringBootApplicaiton`，`@EnableAutoConfiguration`等注解的解析工作

4. 在refreshContext方法中会进行整个容器刷新过程，会调用中spring中的refresh方法，refresh中有13个非常关键的方法，来完成整个spring应用程序的启动，在自动装配过程中，会调用invokeBeanFactoryPostProcessor方法，在此方法中主要是对ConfigurationClassPostProcessor类的处理，这次是BFPP的子类也是BDRPP的子类，在调用的时候会先调用BDRPP中的postProcessBeanDefinitionRegistry方法，然后调用postProcessBeanFactory方法，在执行postProcesskeanDefinitionRegistry的时候回解析处理各种注解，包含@PropertySource，@ComponentScan，@ComponentScans，@Bean，@lmport等注解，最主要的是import注解的解析

5. 在解析@lmport注解的时候，会有一个getlmports的方法，从主类开始递归解析注解，把所有包含@lmport的注解都解析到，然后在processlmport方法中对Import的类进行分类，此处主要识别的时候AutoConfigurationlmportSelect归属于ImportSelect的子类，在后续过程中会调用`deferredlmportSelectorHandler`中的process方法，来完整`EnableAutoConfiguration`的加载。

   



