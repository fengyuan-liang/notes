# Spring Bean生命周期

官方文档：[ Lifecycle Callbacks (spring.io)](https://docs.spring.io/spring-framework/docs/current/reference/html/core.html#beans-factory-lifecycle)

![image-20220213114944142](https://cdn.fengxianhub.top/resources-master/202202131149329.png)



![image-20230209234519601](https://cdn.fengxianhub.top/resources-master/202302092345925.png)



![image-20230209234928633](https://cdn.fengxianhub.top/resources-master/202302092349844.png)



![image-20230210001236101](https://cdn.fengxianhub.top/resources-master/202302100012268.png)

## 2. 面试答法

- [Spring Bean生命周期，好像人的一生。。_三分恶的博客-CSDN博客](https://blog.csdn.net/sinat_40770656/article/details/123498761)

首先spring会用`BeanDefinitionReader`读取我们的`XML`文件，封装成`BeanDefinitionMap`这么一个线程安全的集合，默认情况下k为bean的Name，v为bean的定义信息。`Bean`生命周期可以分为四个关键的步骤

- 实例化 Instantiation
- 属性赋值 Populate
- 初始化 Initialization
- 销毁 Destruction

上述的步骤针对的是`非懒加载的单例bean`，才会走完这四个流程

如果是Bean的作用域（scope）为`prototype`，即多例bean（懒加载）的情况，Bean不会在IOC容器初始化时就加载，而是在使用时才加载，并且这样的bean只会走完前三个步骤，销毁步骤由调用者自己决定

除此之外，在这四个步骤之间还加入了许多`拓展点`给我们，分为两类

- 容器级别的声明周期方法：对于IOC容器中所有的Bean都会生效
- 

`容器级别`可以分为前置和后置处理，由`InstantiationAwareBeanPostProcessor`、`BeanPostProcessor`接口方法进行相关处理

```java
// InstantiationAwareBeanPostProcessor 回调
- postProcessBeforeInstantiation // 实例Bean前置处理
- postProcessAfterInstantiation // 实例Bean后置处理
// BeanPostProcessor 回调
- postProcessBeforeInitialization // 初始化bean前置处理
- postProcessAfterInitialization // 初始化bean后置处理
```

`Bean`级别有`xxxAware`一样的接口，例如`BeanNameAware`、`BeanFactoryAware`等接口，也是在bean初始化之前进行回调的，但是是在`BeanPostProcessor`的`postProcessBeforeInitialization`之前的

![Bean生命周期](https://img-blog.csdnimg.cn/img_convert/54021abea9a968bf20e621f75660a173.png)









