# Spring

![image-20211005230301415](https://cdn.fengxianhub.top/resources-master/202110052303533.png)

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
        border-left: 8px solid #dddfe4;
        background: #eef0f4;
        overflow: auto;
        word-break: break-word!important;
    }
</style>
<blockquote>
    <p>
        <code>Spring</code>框架是一个开源的<code>JavaEE</code>的应用程序
    </p>
    <p>
        主要核心是<code>IOC(控制反转/依赖注入)</code>和<code>AOP(面向切面编程)</code>两大技术
    </p>
</blockquote>



## 1. Spring简介

### 1.1 Spring主要知识点

**Spring的优缺点：**

在学习Spring之前，让我们看看Spring有哪些优点

```css
1.使用Spring的IOC容器，将对象之间的依赖关系交给Spring，降低组件之间的耦合性，让我们更专注于应用逻辑

2.可以提供众多服务，事务管理，WS等。

3.AOP的很好支持，方便面向切面编程。

4.对主流的框架提供了很好的集成支持，如hibernate,Struts2,JPA等

5.Spring DI机制降低了业务对象替换的复杂性。

6.Spring属于低侵入，代码污染极低。

7.Spring的高度可开放性，并不强制依赖于Spring，开发者可以自由选择Spring部分或全部
```



 再来看看Spring有哪些缺点:

```css
1.jsp中要写很多代码、控制器过于灵活，缺少一个公用控制器

2.Spring不支持分布式，这也是EJB仍然在用的原因之一。
```
### 1.2 Spring的作用

<strong>传统项目分层架构：</strong>

<ul>
    <li><code>Dao层</code>:用来与数据库进行一系列JDBC操作,常用框架<code>Mybatis</code></li>
    <li><code>Service层</code>:用来处理业务逻辑,由于业务逻辑的差异性，所以没有主流框架</li>
    <li><code>Controller层</code>:用来接收请求、响应数据、地址配置、页面转发,常用框架<code>Spring MVC</code>,常用技术<code>Servlet</code></li>
</ul>



<hr/>

<blockquote>
    <p>
        <code>Spring定义:</code>Spring是一个基于分布式的框架，是一个轻量级的框架
    </p>
</blockquote>

<Strong>Spring框架的作用：</Strong>

<ul>
    <li>配置管理</li>
    <li><code>IOC技术</code>：Bean对象的实例化</li>
    <li>集成第三方框架，例如<code>Mybatis</code>、Hibernate(SSH中的H，已不流行)<code>Spring MVC</code>、<code>Spring Security权限框架</code>、<code>QUartz时钟框架</code></li>
    <li>自带一系列服务，例如:<code>Mail邮件处理</code>、<code>定时任务处理</code>、<code>异步消息处理</code></li>
</ul>


**Spring模块划分：**

<ul>
    <li><code>Spring IOC模块</code>:Bean对象的实例化</li>	
    <li><code>Spring AOP模块</code>:动态代理，面向切面编程</li>	
    <li><code>Spring JDBC模块</code>:事务处理</li>
    <li><code>Spring web模块</code>:web处理</li>
</ul>

​	



## 2. Spring IOC

### 2.1 思维导图

![image-20211002084358136](https://i.loli.net/2021/10/02/pLg3do8URm9zVIi.png)

### 2.2 Spring IOC核心技术

<ul>
    <li><code>工厂设计模式</code>:简单工厂、工厂方法、抽象工厂</li>	
    <li><code>XML解析</code>:DOM4J</li>	
    <li><code>反射技术</code>:实例化对象、反射获取方法、反射获取属性、反射获取构造器、反射调用方法</li>
    <li><code>策略模式</code>:加载资源</li>
    <li><code>单例</code>:IOC创建实例化对象</li>
</ul>

<hr/>

### 2.3 Spring框架环境搭建

#### 2.3.1 环境要求

<ul>
    <li>JDK版本1.7以上</li>
    <li>Spring版本5.x</li>
</ul>



#### 2.3.2 新建Maven项目

1.创建Maven的普通Java项目

![image-20211002085810572](https://i.loli.net/2021/10/02/4asKzCYyfkciFRI.png)





2.设置工作空间

![image-20211002090253390](https://cdn.fengxianhub.top/resources-master/202110020902509.png)



3.设置项目的Maven环境

![image-20211002090451491](https://cdn.fengxianhub.top/resources-master/202110020904600.png)



#### 2.3.3 调整项目环境

1.修改JDK版本

```xml
  <properties>
    <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
    <maven.compiler.source>1.8</maven.compiler.source>
    <maven.compiler.target>1.8</maven.compiler.target>
  </properties>
```

2.修改单元测试版本

```xml
  <dependencies>
    <dependency>
      <groupId>junit</groupId>
      <artifactId>junit</artifactId>
      <version>4.12</version>
      <scope>test</scope>
    </dependency>
  </dependencies>
```

3.删除多余的插件

```xml
<!--删除build标签中的pluginManagement标签-->
  <build>

  </build>
```



#### 2.3.4 添加Spring框架的依赖坐标

Maven仓库：https://mvnrepository.com/

```xml
	<!--添加Spring的依赖坐标-->
    <!-- https://mvnrepository.com/artifact/org.springframework/spring-context -->
    <dependency>
      <groupId>org.springframework</groupId>
      <artifactId>spring-context</artifactId>
      <version>5.3.9</version>
    </dependency>
```



#### 2.3.5 编写Bean对象





#### 2.3.6 添加Spring配置文件

1.再项目的src下创建文件夹resource(Alt+insert)

2.将resource标记为资源目录

![image-20211002102140683](https://cdn.fengxianhub.top/resources-master/202110021021126.png)

3.在src\main\resources目录下新建spring.xml文件，并拷贝官网文档提供的模板内容到xml中

   配置bean到xml中，把对应的bean纳入Spring容器中来管理

   spring.xml

```xml
<?xml version="1.0" encoding="UTF-8"?>
<beans xmlns="http://www.springframework.org/schema/beans"
    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
    xsi:schemaLocation="http://www.springframework.org/schema/beans
        https://www.springframework.org/schema/beans/spring-beans.xsd">

    <bean id="..." class="...">  
        <!-- collaborators and configuration for this bean go here -->
    </bean>

    <bean id="..." class="...">
        <!-- collaborators and configuration for this bean go here -->
    </bean>

    <!-- more bean definitions go here -->

</beans>
```

4.spring.xml中配置Bean对象

```xml
<!--
		id:bean对象的唯一标识，一般为bean对象的名称的首字母小写
		class：bean对象的类路径
-->
<!--按住CTRL能够点进去说明类路径配置成功-->
<bean id="userService" class="com.xxx.service.UserService"></bean>
```

#### 2.3.7 加载配置文件，获取实例化对象

<blockquote>
    <p>
        加载单个配置文件
    </p>
</blockquote>

![image-20211002102255657](https://cdn.fengxianhub.top/resources-master/202110021022863.png)

<blockquote>
    <p>
        加载多个配置文件
    </p>
</blockquote>

```java
//Java
//多配置文件加载，通过总的配置文件import其他配置文件，只需要加载总配置文件即可
ApplicationContext ac=new ClassPathXmlApplicationContext("All.xml");
```

```xml
<?xml version="1.0" encoding="UTF-8"?>
<beans xmlns="http://www.springframework.org/schema/beans"
       xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
       xsi:schemaLocation="http://www.springframework.org/schema/beans
        https://www.springframework.org/schema/beans/spring-beans.xsd">
    <!--通过import导入其他配置文件，避免名字写错-->
    <import resource="Beans.xml"></import>
    <import resource="spring.xml"></import>
</beans>
```





### 2.4 Spring IOC容器Bean对象实例化模拟

<blockquote>
    <p>
        思路
    </p>
</blockquote>

<ol>
    <li>定义Bean工厂接口，提供获取Bean方法</li>
    <li>定义Bean工厂接口实现类，解析配置文件，实例化Bean对象</li>
    <li>实现获取Bean方法</li>
</ol>


<blockquote>
    <p>
        定义bean
    </p>
</blockquote>

```xml
<?xml version="1.0" encoding="utf-8" ?>
<beans>
    <!--设置JavaBean对应的Bean标签-->
    <bean id="userDao" class="com.fx.dao.UserDao"> </bean>
    <bean id="userService" class="com.fx.service.UserService"> </bean>
</beans>
```

<blockquote>
    <p>
        第一步：定义Bean工厂接口，提供获取Bean方法
    </p>
</blockquote>

```java
/**
 * Bean工厂接口定义
 */
public interface MyFactory {
    //通过Id属性值获取对象
    public Object getBean(String id);
}

```

<blockquote>
    <p>
        第二步：定义Bean工厂接口实现类，解析配置文件，实例化Bean对象
    </p>
</blockquote>

<Strong>Maven配置：</Strong>

```xml
    <!--引入dom4j的依赖-->
    <dependency>
      <groupId>dom4j</groupId>
      <artifactId>dom4j</artifactId>
      <version>1.6.1</version>
    </dependency>
    <!--引入XPath的依赖-->
    <dependency>
      <groupId>jaxen</groupId>
      <artifactId>jaxen</artifactId>
      <version>1.1.6</version>
    </dependency>
```

<Strong>栗子：</Strong>

```java
package com.fx.Spring;

import org.dom4j.Document;
import org.dom4j.Element;
import org.dom4j.XPath;
import org.dom4j.io.SAXReader;

import java.net.URL;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * @author: 梁峰源
 * @date: 2021/10/2 17:48
 * Description:模拟Spring的实现
 * 1.通过带参构造器到对应的配置文件
 * 2.通过dom4j解析我们的xml配置文件，得到一个list集合(存放Bean标签id和class属性)
 * 3.通过反射得到对应的实例化对象，放置在Map中(遍历list集合，获得对应的class属性利用
 *																	Class.forName(class).newInstance))
 * 4.通过id属性值得到指定的实例化属性值
 */
public class MyClassPathXmlApplicationContext implements MyFactory {

    private List<MyBean> beanList;//存放从配置文件中获取到的bean标签的信息（MyBean代表的就是每一个bean标签）
    private Map<String, Object> beanMap = new HashMap<>();//存放实例化好的对象，通过id获取对应的对象

    /**
     * 第一步：通过带参构造器到对应的配置文件
     *
     * @param fileName 配置文件路径
     */
    public MyClassPathXmlApplicationContext(String fileName) {
        //第二步：通过dom4j解析我们的xml配置文件，得到一个list集合
        this.parseXml(fileName);
        //通过反射得到对应的实例化对象，放置在map对象中
        this.instanceBean();
    }

    /**
     * 通过dom4j解析我们的xml配置文件，得到一个list集合
     * 1. 获取解析器
     * 2. 获取配置文件的URL
     * 3. 通过解析器解析配置文件（xml文件）
     * 4. 通过xpath语法解析，获取beans标签下的所有bean标签
     * 5. 通过指定的解析语法解析文档对象，返回元素集合
     * 6. 判断元素集合是否为空
     * 7. 如果元素集合不为空，遍历集合
     * 8. 获取bean标签元素的属性（id和class属性值）
     * 9. 获取MyBean对象，将id和class属性值设计到对象中，再将对象设置到MyBean的集合中
     *
     * @param fileName 配置文件的地址
     */
    private void parseXml(String fileName) {
        // 1. 获取解析器
        SAXReader saxReader = new SAXReader();
        // 2. 获取配置文件的URL
        URL url = this.getClass().getClassLoader().getResource(fileName);
        try {
            // 3. 通过解析器解析配置文件（xml文件）
            Document document = saxReader.read(url);
            // 4. 通过xpath语法解析，获取beans标签下的所有bean标签
            XPath xPath = document.createXPath("beans/bean");
            // 5. 通过指定的解析语法解析文档对象，返回元素集合
            List<Element> elementList = xPath.selectNodes(xPath);
            // 6. 判断元素集合是否为空
            if (null != elementList && elementList.size() > 0) {
                //实例化beanList
                beanList = new ArrayList<>();
                // 7. 如果元素集合不为空，遍历集合
                for(Element el : elementList){
                    // 8. 获取bean标签元素的属性（id和class属性值）
                    String id=el.attributeValue("id");//id属性值
                    String clazz=el.attributeValue("class");//class属性值
                    // 9. 获取MyBean对象，将id和class属性值设计到对象中，再将对象设置到MyBean的集合中
                    MyBean myBean = new MyBean(id, clazz);
                    beanList.add(myBean);
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    /**
     * 通过反射得到对应的实例化对象，放置在Map中
     * 1. 判断对象集合是否为空，如果不为空，则遍历集合，获取对象的id和class属性
     * 2. 通过类的全路径名，发射得到实例化对象  Class.forName(class).newInstance()
     * 3. 将对应的id和实例化好的bean对象设置到map对象中
     */
    private void instanceBean() {
        // 1. 判断对象集合是否为空，如果不为空，则遍历集合，获取对象的id和class属性
        if(null!=beanList&&beanList.size()>0){
            for(MyBean myBean : beanList){
                String id=myBean.getId();
                String clazz=myBean.getClazz();
                try {
                	// 2. 通过类的全路径名，反射得到实例化对象  Class.forName(class).newInstance()
                    Object object = Class.forName(clazz).newInstance();
                    // 3. 将对应的id和实例化好的bean对象设置到map对象中
                    beanMap.put(id,object);
                } catch (Exception e) {
                	e.printStackTrace();
                }
            }
        }
    }

    /**
     * 通过id获取对应map中的value（实例化好的bean对象）
     *
     * @param id map的key
     * @return 实例化好的bean对象
     */
    @Override
    public Object getBean(String id) {
        Object obj = beanMap.get(id);
        return obj;
    }
}

```



### 2.5 Spring IOC容器Bean对象实例化

#### 2.5.1 构造器实例化

<blockquote>
    <p>
        注意：<code>通过默认构造器创建，空构造方法必须存在，否则创建失败</code>
    </p>
</blockquote>

1.设置配置文件spring.xml

```xml
<?xml version="1.0" encoding="UTF-8"?>
<beans xmlns="http://www.springframework.org/schema/beans"
       xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
       xsi:schemaLocation="http://www.springframework.org/schema/beans
        https://www.springframework.org/schema/beans/spring-beans.xsd">

        <!--必须要提供空构造器-->
        <bean id="typeDao" class="com.fx.dao.TypeDao"></bean>
</beans>
```

2.代码实现

```java
BeanFactory factory=new ClassPathXmlApplicationContext("spring02.xml");
//空构造器实例化
TypeDao typeDao= (TypeDao) factory.getBean("typeDao");
typeDao.test();
```



#### 2.5.2 静态工厂实例化

1.设置配置文件Spring.xml

```xml
<?xml version="1.0" encoding="UTF-8"?>
<beans xmlns="http://www.springframework.org/schema/beans"
       xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
       xsi:schemaLocation="http://www.springframework.org/schema/beans
        https://www.springframework.org/schema/beans/spring-beans.xsd">
        <!--
            静态工厂实例化
                1. 定义工厂类及对应的构造方法
                2. 配置bean对象对应的工厂类及静态方法

                id：需要被实例化的bean对象的id
                class：静态工厂类的路径
                factory-method：静态工厂类中实例化bean对象的静态方法
        -->
        <bean id="typeService" class="com.fx.factory.StaticFactory" factory-method="createService"></bean>
</beans>
```

2.代码实现

bean实例：

```java
public class TypeService {
    public void test(){
        System.out.println("这是TypeService里的test方法");
    }

}
```

静态工厂：

bean实例：

```java
public class TypeService {
    public void test(){
        System.out.println("这是TypeService里的test方法");
    }

}
```



```java
/**
 * 定义一个静态工厂类
 */
public class StaticFactory {

    /**
     * 定义对应的静态方法
     * @return TypeService
     */
    public static TypeService createService(){
        return new TypeService();
    }
}
```



```java
BeanFactory factory=new ClassPathXmlApplicationContext("spring02.xml");        
//静态工厂实例化
TypeService typeService= (TypeService) factory.getBean("typeService");
typeService.test();
```



#### 2.5.3 实例化工厂实例化

1.配置xml文件

```xml
<?xml version="1.0" encoding="UTF-8"?>
<beans xmlns="http://www.springframework.org/schema/beans"
       xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
       xsi:schemaLocation="http://www.springframework.org/schema/beans
        https://www.springframework.org/schema/beans/spring-beans.xsd">
            <!--
            实例化工厂实例化
                1. 定义工厂类及对应的方法
                2. 配置工厂对象
                3. 配置bean对象对应的工厂对象及工厂方法

                factory-bean：工厂对象对应的id属性值
                factory-method：工厂类中的方法
       		 -->
        <!--工厂对象-->
        <bean id="instanceFactory" class="com.fx.factory.InstanceFactory"></bean>
        <!--bean对象-->
        <bean id="typeController" factory-bean="instanceFactory" factory-method="createTypeController"></bean>
</beans>
```

2.代码实现

```java
//实例化工厂实例化
TypeController typeController= (TypeController) factory.getBean("typeController");
typeController.test();
```



#### 2.5.4 三种实例化方法比较

● 方式一：通过bean的缺省构造函数创建， 当各个bean的业务逻辑相互比较独立的时候或者和外界关联较少的
时候可以使用。
● 方式二：利用静态factory方法创建，可以统一管理各 个bean的创建，如各个bean在创建之前需要相同的初始
化处理，则可用这个factory方法险进行统- -的处理等等。
● 方式三：利用实例化factory方法创建，即将factory方法也作为了业务bean来控制，1可用于集成其他框架的
bean创建管理方法, 2能够使bean和factory的角色互换。

​	**开发中项目一般使用一种方式实例化bean,项目开发基本采用第一种方式， 交给Spring托管,使用时直接拿**
**来使用即可。另外两种了解**



### 2.6 Spring IOC注入

<hr/>

<blockquote>
    <p>
        手动实例化与外部引入
    </p>
</blockquote>

图一：

![image-20211005142256355](https://cdn.fengxianhub.top/resources-master/202110051422655.png)

图二：

![image-20211005142423424](https://cdn.fengxianhub.top/resources-master/202110051424528.png)

​	

<blockquote>
    <p>
       <strong> 对比发现:图二中对于UserDao对象的创建并没有像图-那样主动的去实例化，而是通过带参方法形式将
		UserDao传入过来,从而实现UserService对UserDao类的依赖。</strong>
        <code>而实际创建对象的幕后对象即是交给了外部来创建</code></p>
</blockquote>

​       

#### 2.6.1 Spring IOC手动装配（注入）

Spring支持的注入方式有四种：set注入、构造器注入、静态工厂注入、实例化工厂注入

注：

<ul>
    <li>属性字段需要提供set方法</li>
    <li>四种手动注入方法，推荐使用<code>set注入</code></li>
</ul>

<hr/>

##### 2.6.1.1 set方法注入

类型有：

<ol>
    <li>业务对象JavaBean</li>
    <li>常用对象和基本类型</li>
    <li>集合类型和属性对象</li>
</ol>

<blockquote>
    <p>
        第一种Set注入：业务对象JavaBean注入
	</p>
</blockquote>

1.属性字段提供set方法

```java
    //业务逻辑对象 JavaBean对象，set方法注入
    private UserDao userDao;

    public void setUserDao(UserDao userDao) {
        this.userDao = userDao;
    }

    public void test(){
        System.out.println("UserService Test...");
        userDao.test();
    }
```

2.配置文件bean标签中中配置property标签

```xml
<?xml version="1.0" encoding="UTF-8"?>
<beans xmlns="http://www.springframework.org/schema/beans"
       xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
       xsi:schemaLocation="http://www.springframework.org/schema/beans
        https://www.springframework.org/schema/beans/spring-beans.xsd">

        <!--
            Set方法注入：
                通过property属性注入
                name：JavaBean对象中属性字段的名称，这里指的是UserService中private UserDao userDao的字段
                ref：指定bean标签的id属性值
        -->
        <bean id="userService" class="com.fx.service.UserService">
                <property name="userDao" ref="userDao"/>
        </bean>

        <bean id="userDao" class="com.fx.dao.UserDao"></bean>

</beans>
```

<blockquote>
    <p>
        第二种，常用对象和基本类型
	</p>
</blockquote>

1.属性字段提供set方法

```java
    //常用类型String（日期类型）
    private String host;

    public void setHost(String host) {
        this.host = host;
    }

    //基本类型Integer
    private Integer port;

    public void setPort(Integer port) {
        this.port = port;
    }
```

2.配置文件bean标签中中配置property标签

```xml
<!--常用类型String-->
<property name="host" value="127.0.0.1"/>
<!--基本类型-->
<property name="port" value="8080"/>
```

<blockquote>
    <p>
        第三种，集合类型和属性对象
	</p>
</blockquote>

1.属性字段提供set方法

```java
    //List集合
    private List<String> list;

    public void setList(List<String> list) {
        this.list = list;
    }
    //Set集合
    private Set<String> set;

    public void setSet(Set<String> set) {
        this.set = set;
    }
    //Map集合
    private Map<String,Object> map;

    public void setMap(Map<String, Object> map) {
        this.map = map;
    }
    //properties属性对象
    private Properties properties;

    public void setProperties(Properties properties) {
        this.properties = properties;
    }
```

2.配置文件bean标签中中配置property标签

```xml
<!--List集合-->
<property name="list">
    <list>
        <value>北京</value>
        <value>上海</value>
        <value>广州</value>
        <value>深圳</value>
    </list>
</property>
<!--Set集合-->
<property name="set">
    <set>
        <value>北京</value>
        <value>上海</value>
        <value>广州</value>
        <value>深圳</value>
    </set>
</property>
<!--Map集合-->
<property name="map">
    <map>
        <entry>
            <key><value>周杰伦</value></key>
            <value>晴天</value>
        </entry>
        <entry>
            <key><value>林俊杰</value></key>
            <value>江南</value>
        </entry>
        <entry>
            <key><value>陈奕迅</value></key>
            <value>浮夸</value>
        </entry>
    </map>
</property>
<!--properties属性集合-->
<property name="properties">
    <props>
        <prop key="beijing">北京</prop>
        <prop key="shanghai">上海</prop>
        <prop key="shenzhen">深圳</prop>
    </props>
</property>
```



##### 2.6.1.2 构造器注入

类型有：

<ol>
    <li>单个Bean对象作为参数</li>
    <li>多个Bean对象作为参数</li>
    <li>Bean对象和常用对象作为参数</li>
</ol>

构造器注入会产生的问题：循环依赖问题

<blockquote>
    <p>
        第一种：单个Bean对象作为参数
	</p>
</blockquote>

java代码：

```java
    private UserDao03 userDao03;
    //构造器构造
    public UserService03(UserDao03 userDao03) {
        this.userDao03 = userDao03;
    }
```

xml配置：

```xml
<?xml version="1.0" encoding="UTF-8"?>
<beans xmlns="http://www.springframework.org/schema/beans"
       xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
       xsi:schemaLocation="http://www.springframework.org/schema/beans
        https://www.springframework.org/schema/beans/spring-beans.xsd">

        <!--
           构造器注入：
                1.设置构造器所需要的参数
                2.通过constructor-arg标签设置构造器的参数

                name:属性名称
                ref：要注入的bean对象对应的bean标签的id属性值
                value：数据具体的值
                index：设置的参数的构造器中的位置，从下标0开始，一般不写
        -->
        <bean id="userService03" class="com.fx.service.UserService03">
                <constructor-arg name="userDao03" ref="userDao03" index="0"></constructor-arg>

        </bean>
        <bean id="userDao03" class="com.fx.dao.UserDao03"></bean>
</beans>
```



<blockquote>
    <p>
        第二种：多个Bean对象作为参数
	</p>
</blockquote>

java代码：

```java
    private UserDao02 userDao02;
    public UserService03(UserDao03 userDao03, UserDao02 userDao02) {
        this.userDao03 = userDao03;
        this.userDao02 = userDao02;
    }
```

xml配置：

```xml
<?xml version="1.0" encoding="UTF-8"?>
<beans xmlns="http://www.springframework.org/schema/beans"
       xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
       xsi:schemaLocation="http://www.springframework.org/schema/beans
        https://www.springframework.org/schema/beans/spring-beans.xsd">

        <!--
           构造器注入：
                1.设置构造器所需要的参数
                2.通过constructor-arg标签设置构造器的参数

                name:属性名称
                ref：要注入的bean对象对应的bean标签的id属性值
                value：数据具体的值
                index：设置的参数的构造器中的位置，从下标0开始，一般不写
        -->
        <bean id="userService03" class="com.fx.service.UserService03">
                <constructor-arg name="userDao02" ref="userDao02" index="1"></constructor-arg>
        </bean>
        <bean id="userDao02" class="com.fx.dao.UserDao02"></bean>
</beans>
```

<blockquote>
    <p>
        Bean对象和常用对象作为参数
	</p>
</blockquote>

java代码：

```java
    //常用对象、数据类型构造器注入
    private String uName;

    public UserService03(UserDao03 userDao03, UserDao02 userDao02, String uName) {
        this.userDao03 = userDao03;
        this.userDao02 = userDao02;
        this.uName = uName;
    }

```

xml配置文件：

```xml
<?xml version="1.0" encoding="UTF-8"?>
<beans xmlns="http://www.springframework.org/schema/beans"
       xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
       xsi:schemaLocation="http://www.springframework.org/schema/beans
        https://www.springframework.org/schema/beans/spring-beans.xsd">

        <!--
           构造器注入：
                1.设置构造器所需要的参数
                2.通过constructor-arg标签设置构造器的参数

                name:属性名称
                ref：要注入的bean对象对应的bean标签的id属性值
                value：数据具体的值
                index：设置的参数的构造器中的位置，从下标0开始，一般不写
        -->
        <bean id="userService03" class="com.fx.service.UserService03">
                <constructor-arg name="userDao02" ref="userDao02" index="1"></constructor-arg>
                <!--String注入-->
                <constructor-arg name="uName" value="你好先森" index="2"></constructor-arg>
        </bean>
        <bean id="userDao02" class="com.fx.dao.UserDao02"></bean>
</beans>
```



##### 2.6.1.3 静态工厂注入

先欠着，后面再看叭<a href="https://www.bilibili.com/video/BV1A54y1p7ya?p=10&spm_id_from=pageDriver">静态工厂注入</a>



##### 2.6.1.4 实例化工厂注入

同上

##### 2.6.1.5 💖注入方式选择

​	**开发项目中set方式注入首选**

​	使用构造注入可以在构建对象的同时一并完成依赖关系的建立,对象-建立则所有的一 切也就准备好了，但.
如果要建立的对象关系很多，使用构造器注入会在构建函数上留下一长串的参数,且不易记忆，这时使用Set注入会是
个不错的选择。
​	使用Set注入可以有明确的名称，可以了解注入的对象会是什么，像setXXX(这样的名称会比记忆Constructor
上某个参数的位置代表某个对象更好。



**p名称空间的使用**

​	spring2.5以后，为了简化setter方法属性注入,引用p名称空间的概念，可以将<property>子元素,简化
为<bean>元素属性配置。

第一步：在xml文件中引入p命名空间

```java
       xmlns:p="http://www.springframework.org/schema/p"
```

xml完整配置：

```xml
<?xml version="1.0" encoding="UTF-8"?>
<beans xmlns="http://www.springframework.org/schema/beans"
       xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
       xmlns:p="http://www.springframework.org/schema/p"
       xsi:schemaLocation="http://www.springframework.org/schema/beans
        https://www.springframework.org/schema/beans/spring-beans.xsd">
        <!--
            p名称空间：
            spring2.5以后，为了简化setter方法属性注入,引用p名称空间的概念，可以将<property>子元素,简化为<bean>元素属性配置。
        -->
        <bean id="userDao" class="com.fx.dao.UserDao"></bean>
        <bean id="userService04" class="com.fx.service.UserService04"
              p:host="127.0.0.1"
              p:userDao-ref="userDao"
        >
        </bean>
</beans>
```

第二步：Java配置

```java
//业务逻辑对象 JavaBean对象，set方法注入
    private UserDao userDao;

    public UserService04() {
    }

    public void setUserDao(UserDao userDao) {
        this.userDao = userDao;
    }


    //常用类型String（日期类型）
    private String host;

    public void setHost(String host) {
        this.host = host;
    }


    public void test() {
        System.out.println("UserService Test...");
        userDao.test();

        //常用对象
        System.out.println(host);

    }
```



#### 2.6.2 💖Spring IOC自动装配（注入）

**注解方式注入Bean** 

​	对于bean的注入，除了使用xml配置以外，可以使用注解配置。注解的配置，可以简化配置文件，提高开
发的速度,使程序看上去更简洁。对于注解的解释，Spring对于注解有专 的解释器，对定义的注解进行解析,实
现对应bean对象的注入。通过**反射技术实现。**

##### 2.6.2.1 准备环境

1.修改配置环境

```xml
<?xml version="1.0" encoding="UTF-8"?>
<beans xmlns="http://www.springframework.org/schema/beans"
       xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
       xmlns:context="http://www.springframework.org/schema/context"
       xsi:schemaLocation="http://www.springframework.org/schema/beans
       https://www.springframework.org/schema/beans/spring-beans.xsd
       http://www.springframework.org/schema/context
       http://www.springframework.org/schema/context/spring-context.xsd">

</beans>
```

2.开启自动化装配环境

```xml
    <!--开启自动化注入（装配）-->
    <context:annotation-config/>
```



##### 2.6.2.2 @Resource注解

@Resource注解实现自动注入(反射)

●  默认根据属性字段名称查找对应的bean对象(属性字段的名称 与bean标签的id属性值相等)
●  如果属性字段名称未找到，则会通过类型(Class类型) 查找
●  属性可以提供set方法，也可以不提供set方法
●  注解可以声明在属性级别或set方法级别
●  可以设置name属性, name属性值必须与bean标签的id属性值一致;如果设置了name属性值，就只会按照
name属性值查找bean对象
●  当注入接口时，如果接口只有一-个实现则正常实例化;如果接口存在多个实现，则需要使用name属性指定需
要被实例化的bean对象

1.xml配置

```xml
    <!--开启自动化注入（装配）-->
    <context:annotation-config/>
    <!--配置bean对象-->
    <bean id="userService" class="com.fx.service.UserService"></bean>
    <bean id="userDao" class="com.fx.dao.UserDao"></bean>
    <!--接口的实现类-->
    <bean id="userDaoImpl01" class="com.fx.Interface.impl.UserDaoImpl01"></bean>
    <bean id="userDaoImpl02" class="com.fx.Interface.impl.UserDaoImpl02"></bean>
```

2.Java代码

```java
/**
 * @Resource注解实现自动注入（反射）
 *  1. 注解默认通过属性字段名称查找对应的bean对象（属性字段名称与bean标签的id属性值一致）
 *  2. 如果属性字段名称不一样，则会通过类型（Class）类型
 *  3. 属性字段可以提供set方法，也可以不提供
 *  4. 注解可以声明在属性字段上，或者set方法上
 *  5. 可以设置注解的name属性，name属性值要与bean标签的id属性值一致（如果设置了name属性，则可以使用name属性，这可以使用
 *																					name属性查询bean对象）
 *  6. 当注入接口时，如果接口有多个实现类，需要使用name属性指定需要被实例化的bean对象
 */
public class UserService {

    //注入JavaBean对象
    @Resource
    private UserDao userDao;
    //set方法注入
    public UserService(UserDao userDao) {
        this.userDao = userDao;
    }
    //接口注入
    @Resource(name = "userDaoImpl02")
    private com.fx.Interface.UserDao iUserDao;


    public void test(){
        System.out.println("UserService Test...");
        userDao.test();
        iUserDao.test();
    }
}
```

##### 2.6.2.3 @Autowired注解

**@Autowired注解实现自动化注入:**

●	默认通过类型(Class类型) 查找bean对象 与属性字段的名称无关
●	属性可以提供set方法，也可以不提供set方法
●	注解可以声明在属性级别或set方法级别
●	可以添加@Qualifier结合使用，通过value属性值查找bean对象(value属性值必须要设置，且值要与bean标签的id属性值对应)

<hr/>

1.默认通过类型（Class类型）查找bean对象，与属性字段的名称无关

```java
/**
 * @Autowired注解实现自动化注入
 * 1. 注解默认使用类型（Class类型）查找bean对象，与属性字段名称没有关系
 * 2. 属性字段可以提供set方法，也可以不提供
 * 3. 注解可以声明在属性级别，也可以是set方法级别
 * 4. 如果想要通过指定名称查找bean对象，需要结合@Qualifier使用（通过设置value属性值查找，value属性值要与bean标签的id属
 *    性值保持一致）
 */
public class AccountService {

    @Autowired
    @Qualifier(value = "accountDao")
    private AccountDao accountDao;

    public void test(){
        System.out.println("AccountService Test...");
        accountDao.test();
    }
}
```

2.xml配置

```xml
<!--引入bean对象通过@Autowired注解-->
<bean id="accountService" class="com.fx.service.AccountService"></bean>
<bean id="accountDao" class="com.fx.dao.AccountDao"></bean>
```

#### 2.6.3 完全基于注解实现注入

1.配置注解类

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

相当于xml注解里的：

```xml
<bean id="userService" class="com.fx.service.UserService"></bean>
```

方法名就是`id`

2.测试

```java
ApplicationContext context = new AnnotationConfigApplicationContext(myConfig.class);
@Test
public void shouldAnswerWithTrue(){
    String[] beanDefinitionNames = context.getBeanDefinitionNames();
    Arrays.asList(beanDefinitionNames).forEach(System.out::println);
}
```

但是`bean`很多的话还是很麻烦，所以`@Bean`一般用来标记第三方Jar包里面的类，自己定义的类用注解解析器扫描

```java
@ComponentScan("com.fx.service")
```

例如在上面的config里面配置：

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



### 2.7 💖Spring IOC扫描器

<hr/>

​	实际的开发中，bean的数量非常多，采用手动配置bean的方式已无法满足生产需要, Spring这时候同样提供
了扫描的方式，对扫描到的bean对象统一进行管理， 简化开发配置,提高开发效率。

#### 2.7.1 Spring IOC扫描器的配置

```xml
Spring IOC 扫描器
    作用: bean对象统-进行管理，简化开发配置，提高开发效率
        
    1、设置自动化扫描的范围
    	如果bean对象未在指定包范围，即使声明了注解，也无法实例化
    2、使用指定的注解(声明在类级别)
        bean对象的id属性默认是类的首字母小写
        Dao层:
        	@Repository
        Service层:
        	@Service
        Controller层:
        	@Controller
    	任意类:
    		@Component
    注:开发过程中建议按照指定规则声明注解

```

1.设置自动扫描的范围

```xml
<!--设置自动化扫描的范围-->
<context:component-scan base-package="com.fx"/>
```

2.在java中配置相应的加载关系

```java
    @Resource
    private TypeService typeService;
    public void test(){
        System.out.println("TypeController Test...");
        typeService.test();
    }
```



### 2.8 Bean的作用域与生命周期

#### 2.8.1 Bean的作用域

​	默认情况下，我们从Spring容器中拿到的对象均是**单例**的，对于Bean的作用域如下

<blockquote>
    <p>
       Singleton的作用域
    </p>
</blockquote>

![image-20211006231556205](https://cdn.fengxianhub.top/resources-master/202110062315496.png)

​	**注意: lazy-init是懒加载,如果等于true时作用是指Spring容器启动的时候不会去实例化这个bean,而是在程**
**序调用时才去实例化.默认是false即Spring容器启动时实例化**

​	默认情况下，被管理的bean只会IOC容器中存在一个实例， 对于所有获取该Bean的操作Spring容器将只返回
同一个Bean。

​	**容器在启动的情况下就实例化所有singleton的bean对象，并缓存与容器中**



**lazy-init属性(懒加载)**
	如果为false,则在IOC容器启动时会实例化bean对象，默认false
	如果为true,则I0C容器启动时不会实例化Bean对象，在使用bean对象时才会实例化
**lazy-init设置为false有什么好处?**
	1.可以提前发现潜在的配置问题

​	2.Bean 对象存在于缓存中，使用时不用再去实例化bean,加快程序运行效率
**什么对象适合作为单例对象?**

​	一般来说对于无状态或状态不可改变的对象适合使用单例模式。(不存在会改变对象状态的成员变量)
比如: controller层、 service层、 dao层

**什么是无状态或状态不可改变的对象?**
	实际上对象状态的变化往往均是由于属性值的变化而引起的，比如user类姓名属性会有变化，属性姓名的变
化一般会引起user对象状态的变化。对于我们的程序来说，无状态对象没有实例变量的存在，保证了线程的安全
性，service层业务对象即是无状态对象。线程安全的。

#### 2.8.2 Prototype作用域

![image-20211007093734493](https://cdn.fengxianhub.top/resources-master/202110070937809.png)

​	

​	通过scope="prototype"设置bean的类型，每次向Spring容器请求获取Bean都返回一个全新的Bean,相对于"singleton"来说就是不缓存Bean,每次都是一个根据Bean定义 创建的全新Bean。

```xml
<bean id="userDao05" class="com.fx.dao.UserDao05" scope="prototype"></bean>
```

​	

作用域演示xml代码：

```xml
<?xml version="1.0" encoding="UTF-8"?>
<beans xmlns="http://www.springframework.org/schema/beans"
       xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
       xsi:schemaLocation="http://www.springframework.org/schema/beans
        https://www.springframework.org/schema/beans/spring-beans.xsd">
        <!--
            Bean的作用域：
                scope属性：
                        1. Singleton单例作用域（默认的）
                        2. Prototype原型作用域
                Singleton作用域（单例作用域）
                    Spring IOC容器在启动时，会将所有在singleton作用域中的bean对象实例化，并设置到单例缓存池中

                    lazy-init属性（懒加载）
                        1. 如果设置为true，表示懒加载，容器在启动时，不会实例化bean对象，在程序调用时才会实例化
                        2. 如果设置为false（默认），表示不懒加载，容器启动则会实例化bean对象
                    lazy-init属性为什么要设置为false ?
                        1. 可以提前发现潜在的配置文件中存在的问题
                        2. bean对象在启动时就会设置在单例缓存池中，使用不需要再去实例化bean对象，提高程序的运行效率
                    什么对象适合作为单例对象（什么对象适合交给IOC容器实例化）
                        1. 无状态对象（不存在改变当前对象状态的成员变量）
                        2. 使用对象，如：controller层、service层、dao层
                Prototype作用域（原型作用域）
                Spring IOC容器在启动时，不会将bean对象实例化设置到单例缓存池中，每次实例化对象都会创建一个新实例
        -->
        <!--一般我们不设置懒加载-->
        <bean id="userDao05" class="com.fx.dao.UserDao05" lazy-init="true"></bean>
</beans>
```

#### 2.8.3 Web应用中的作用域

1. **request作用域**

  表示每个请求需要容器创建一个全新Bean。 比如提交表单的数据必须是对每次请求新建一个Bean来保持这些表单数据，请求结束释放这些数据。

2. **session作用域**

  表示每个会话需要容器创建一个全新Bean。 比如对于每个用户-般会有一个会话，该用户的用户信息需要存储到会话中，此时可以将该Bean作用域配置为session级别。

3. **globalSession作用域**

  类似于session作用域，其用于portlet(Portlet是基 于Java的Web组件,由Portlet容器管理，并由容器处理请求，生产动态内容)环境的web应用。如果在非portlet环境将视为session作用域。

  

  **配置方式和基本的作用域相同，只是必须要有web环境支持，并配置相应的容器监听器或拦截器从而能应用**

  

#### 2.8.4 Bean的生命周期

​	对比已经学过的servlet生命周期(容器启动装载并实例化servlet类，初始化servlet, 调用service方法，销毁servlet)

​	同样对于Spring容器管理的bean也存在生命周期的概念

​	在Spring中，Bean的生命周期包括**Bean的定义、初始化、使用和销毁**4个阶段

<blockquote>
    <p>
        Bean的定义
    </p>
</blockquote>

- 在Spring中，通常是通过配置文档的方式来定义Bean的。
- 在一个配置文档中，可以定义多个Bean。

<blockquote>
    <p>
       初始化
    </p>
</blockquote>

默然在IOC容器加载时，实例化对象

Spring Bean初始化有两种方式：

方式一：在配置文件中通过init-method属性来完成

<blockquote>
    <p>
       使用
    </p>
</blockquote>

先欠着，后面在看<a href="https://www.bilibili.com/video/BV1A54y1p7ya?p=18&spm_id_from=pageDriver">Bean生命周期</a>

<blockquote>
    <p>
       销毁
    </p>
</blockquote>

同上

### 2.9 Spring IOC总结

IOC/DI -控制反转和依赖注入
将对象实例化的创建过程转交给外部容器(IOC容器充当工厂角色)去负责;属性赋值的操作

## 3. Spring AOP

### 3.1 思维导图

![image-20211007104304176](https://cdn.fengxianhub.top/resources-master/202110071043342.png)

### 3.2 代理模式

<blockquote>
    <p>
       代理模式
    </p>
</blockquote>

​	**代理模式在Java开发中是一种比较常 见的设计模式。**设计目的旨在为服务类与客户类之间插入其他功能,插入的功能对于调用者是透明的，起到伪装控制的作用。如租房的例子:房客、中介、房东。对应于代理模式中即:客户类、代理类、委托类(被代理类)。

​	为某一个对象(委托类)提供一个代理(代理类)，用来控制对这个对象的访问。委托类和代理类有一个共同的父类或父接口。代理类会对请求做预处理、过滤，将请求分配给指定对象。

生活中常见的代理情况: 租房中介、婚庆公司等
![image-20211007104823599](https://cdn.fengxianhub.top/resources-master/202110071048734.png)

**常用的代理模式：**

​	1.静态代理

​	2.动态代理

<hr/>

### 3.2 静态代理

#### 3.2.1 代理三要素（以结婚为例）

1.有共同的行为（结婚）	定义接口

2.目标角色（新人）	实现接口

3.代理角色（婚庆公司）	实现接口，增强用户行为

#### 3.2.2 静态代理的特点

1.目标角色固定

2.在程序应用前就得知目标角色

3.代理对象会增强目标对象的行为

4.**可能产生大量代理的情况，导致“类爆炸”**

<hr/>

### 3.3 动态代理

<blockquote>
    <p>
       动态代理，可以根据需要，通过反射机制在程序运行期，动态的为目标对象创建代理对象
    </p>
</blockquote>



**动态代理的两种实现方式：**

1. JDK动态代理
2. CGLIB动态代理

#### 3.3.1 动态代理的特点

1. 目标对象不固定
2. 在程序运行时，动态创建目标对象
3. 代理对象会增强目标对象的行为

#### 3.3.2 JDK动态代理实现

<blockquote>
    <p>
       JDK动态代理
    </p>
</blockquote>



注意：JDK动态代理的目标对象必须有接口实现

1. **newProxyInstance**类

Proxy类：Proxy类是专门完成代理的操作类，可以通过此类为一个或多个接口动态地生成实现类，此类提供了如下操作方法

```java
/**
 * 返回一一个指定接口的代理类的实例方法调用分派到指定的调用处理程序。(返回代理对象)
 * 	loader: 一个ClassLoader对象，定义了由哪个ClassLoader对象来对生成的代理对象进行加载
 * 	interfaces:一个Interface对象的数组，表示的是我将要给我需要代理的对象提供一组什么接口，如果我提供了-组接口给它，那么这
 * 个代理对象就宣称实现了该接口(多态)，这样我就能调用这组接口中的方法了
 * 	h:一个InvocationHandler接口，表示代理实例的调用处理程序实现的接口。每个代理实例都具有一一个关联的调用处理程序。对代理实例调用方法时，将对方法调用进行编码并将其指派到它的调用处理程序的invoke 方法(传入InvocationHandler接口的子类)
 */
        
public static object new ProxyInstace(ClassLoader loader,
                                     Class<?>[] interfaces,
                                     InvocationHandler h)
```



**2.动态代理实现栗子：**

```java
/**
 * jdk动态代理类
 *      每一个代理类都需要实现InvocationHandler接口
 */
public class JdkHandler implements InvocationHandler {
    //设置动态代理的目标对象,目标对象的类型不固定，创建时动态生成
    private Object target;
    //通过带参构造器传递目标对象
    public JdkHandler(Object target) {
        this.target = target;
    }

    /**
     * 1. 调用目标对象的方法，返回一个Object
     * 2. 增强目标对象的行为
     * @param proxy 调用该方法的代理实例
     * @param method 目标对象的方法
     * @param args 目标对象的方法所需要的参数
     * @return 返回Object
     * @throws Throwable 异常抛给系统处理
     */
    @Override
    public Object invoke(Object proxy, Method method, Object[] args) throws Throwable {
        //调用用户方法前的增强行为
        System.out.println("调用用户方法前的增强行为");
        //调用目标对象中的方法（返回Object）
        Object object=method.invoke(target,args);
        //调用用户方法后的增强行为
        System.out.println("调用用户方法后的增强行为");
        return null;
    }
    /**
     * 获取代理对象
     * newProxyInstance的参数：
     *      1. ClassLoader loader：类加载器
     *      2. Class<?>[] interfaces:目标对象的接口数组
     *          target.getClass().getInterfaces()就是一个目标对象的接口数组
     *      3. InvocationHandler h:需要传入一个InvocationHandler接口的实现类
     * @return 返回代理对象
     */
    public Object getProxy(){
        Object object= Proxy.newProxyInstance(this.getClass().getClassLoader(),target.getClass().getInterfaces(),this);
        return object;
    }

}
```

3.测试

```java
//目标对象
Jack jack=new Jack();
//得到代理类
JdkHandler jdkHandler=new JdkHandler(jack);
Marry marry= (Marry) jdkHandler.getProxy();
        /**
         * 输出：
         * 调用用户方法前的增强行为
         * Jack is getting married
         * 调用用户方法后的增强行为
         */
```

欠着JDK动态代理的源码解析： <a href="https://www.bilibili.com/video/BV1A54y1p7ya?p=23&spm_id_from=pageDriver">JDK动态代理源码解析</a>

#### 3.3.3CGLIB动态代理

​	**JDK的动态代理机制只能代理实现了接口的类**,而不能实现接口的类就不能使用DK的动态代理，cglib是针对
类来实现代理的，它的原理是对指定的目标类生成一个子类, 并覆盖其中方法实现增强,但因为采用的是继承，所
以不能对final修饰的类进行代理。

##### 3.3.3.1 添加依赖

在pom.xml文件中引入cglib的相关依赖

```xml
<!-- https://mvnrepository.com/artifact/cglib/cglib -->
<dependency>
    <groupId>cglib</groupId>
    <artifactId>cglib</artifactId>
    <version>2.2.2</version>
</dependency>

```

##### 3.3.3.1 定义类

实现MethodInterceptor接口

```java
public class CglibInterceptor implements MethodInterceptor {

    //目标对象
    private Object target;
    //通过构造器传入目标对象
    public CglibInterceptor(Object target) {
        this.target = target;
    }

    /**
     * 获得代理对象
     * @return 返回一个代理对象
     */
    public Object getProxy(){
        //1. 通过Enhancer对象中的create()方法生成一个类，用于生成代理对象
        Enhancer enhancer=new Enhancer();
        //2. 设置父类（将目标类作为代理类的父类）
        enhancer.setSuperclass(target.getClass());
        //3. 设置拦截器，回调对象为本身对象
        enhancer.setCallback(this);
        //4. 生成代理类对象，并返回给调用者
        return enhancer.create();
    }

    /**
     * 拦截器：
     *      1. 目标对象的方法调用
     *      2. 行为增强
     * @param o cglib生成的动态代理类的实例
     * @param method 实体类被调用的被代理的方法的应用
     * @param objects 参数列表
     * @param methodProxy 生成的代理类，对方法的代理应用
     * @return 返回行为增强后的代理对象
     * @throws Throwable 抛出异常给系统
     */
    @Override
    public Object intercept(Object o, Method method, Object[] objects, MethodProxy methodProxy) throws Throwable {

        //增强行为
        System.out.println("intercept方法执行前的增强行为");
        //调用目标类中的方法
        Object object = methodProxy.invoke(target, objects);
        //增强行为
        System.out.println("intercept方法执行后的增强行为");
        return object;
    }
}
```



##### 3.3.3.2 调用方法

```java
public class TestCglibInterceptor {
    public static void main(String[] args) {
        //1. 得到目标对象
        Jack jack=new Jack();
        //2. 得到拦截器
        CglibInterceptor cglibInterceptor=new CglibInterceptor(jack);
        //3. 得到代理对象
        Marry marry= (Marry) cglibInterceptor.getProxy();
        //4. 通过代理对象调用目标对象中的方法
        marry.toMarry();

        //没有继承接口也能实现cglib动态代理
        User user=new User();
        CglibInterceptor cglibInterceptor02=new CglibInterceptor(user);
        User user1= (User) cglibInterceptor02.getProxy();
        user1.test();
    }
}
```

#### 3.3.4 JDK动态代理和CGLIB代理的区别

- **JDK动态代理实现接口，Cglib动态代理继承思想**
- JDK动态代理( 目标对象存在接口时)执行效率高于Ciglib
- 如果目标对象有接口实现，选择JDK代理, 如果没有接口实现选择Cglib代理

最优选择：如果目标对象存在接口实现，优先选择JDK动态代理，反之这选择cglib动态代理



### 3.4 💖Spring AOP

#### 3.4.1 问题引入

<blockquote>
    <p>
       引入一个问题，如果没有代理模式如何处理下面的业务需求
    </p>
</blockquote>



![image-20211007220631337](https://cdn.fengxianhub.top/resources-master/202110072206669.png)



![image-20211007220855298](https://cdn.fengxianhub.top/resources-master/202110072208474.png)





![image-20211007221728816](https://cdn.fengxianhub.top/resources-master/202110072217152.png)

​	但这样两个方法就是强耦合的，假如此时我们不需要这个功能了，或者想换成其他功能，那么就必须一个个修改。

<blockquote>
    <p>
       通过代理模式，可以在指定位置执行对应流程。这样就可以将一些横向的功能抽离出来形成一个独立的模块,然后
在指定位置插入这些功能。这样的思想，被称为<code>面向切面编程</code>，即<code>AOP</code>。
    </p>
</blockquote>



![image-20211007223126326](https://cdn.fengxianhub.top/resources-master/202110072231663.png)



#### 3.4.2 第二个栗子（装饰器模式解决）

<blockquote>
    <p>
       第二个栗子：日志处理带来的问题
    </p>
</blockquote>

1.日志处理带来的问题

​	我们有一个Pay(接口)然后两个实现类DollarPay和RmbPay,都需要重写pay()方法, 这时我们需要对pay方法进行性能监控，日志的添加等等怎么做?



![image-20211007223457336](https://cdn.fengxianhub.top/resources-master/202110072234678.png)

2.最容易想到的方法

对每个字符方法均做日志代码的编写处理，如下面方式

![image-20211007224324557](https://cdn.fengxianhub.top/resources-master/202110072243023.png)



缺点:**代码重复太多,添加的日志代码耦合度太高**(如果需要更改日志记录代码功能需求,类中方法需要全部改动，工程量浩大)



<blockquote>
    <p>
       可以使用<code>装饰器模式/代理模式</code>改进解决方案
    </p>
</blockquote>

<ul>
    <li><code>装饰器模式</code>:动态地给一个对象添加一些额外的职能</li>
    <li><code>代理模式</code>：在不影响用户行为的前提下，做用户行为的增强，可以看3.3.1节。可以得出以下结构</li>
</ul>

![image-20211007225233578](https://cdn.fengxianhub.top/resources-master/202110072252005.png)



​	仔细考虑过后发现虽然对原有内部代码没有进行改动，**对于每个类做日志处理,并引用目标类,但是如果待添加日志的业务类的数量很多，此时手动为每个业务类实现-个装饰器或创建对应的代理类，同时代码的耦合度也加大，需求一旦改变，改动的工程量也是可想而知的。**

有没有更好的解决方案，只要写一次代码,对想要添加日志记录的地方能够实现代码的复用，达到松耦合的同时,又能够完美完成功能?

​	答案是肯定的，存在这样的技术，**aop已经对其提供了完美的实现!**

<blockquote>
    <p>
       <code>AOP</code>要做的事情就是将重复的实现功能代码提取出来，并在所有需要用的地方都可以去使用它
    </p>
</blockquote>

<hr/>

#### 3.4.3 AOP的特点

##### 3.4.3.1 什么是AOP

​	Aspect Oriented Programing 面向切面编程，相比较oop面向对象编程来说，Aop关注的不再是程序代码中某个类，某些方法,而aop考虑的更多的是一种面到面的切入，即层与层之间的一种切入，所以称之为切面。联想大家吃的汉堡(中间夹肉)。那么aop是怎么做到拦截整个面的功能呢?考虑前面学到的servlet filter /* 的配置，实际上也是aop的实现。

##### 3.4.3.2 AOP能做什么？

AOP主要的应用方向有：<code>性能统计</code>、<code>事物处理</code>、<code>日志记录</code>、<code>事物处理</code>、<code>实现公共功能性的重复使用</code>



##### 3.4.3.3 AOP的特点

1. 降低模块与模块之间的耦合度，提高业务代码的聚合度。(高内聚低耦合)

2. 提高了代码的复用性。

3. 提高系统的扩展性。(高版本兼容低版本)

4. 可以在不影响原有的功能基础上添加新的功能

   

##### 3.4.3.4 AOP底层代码实现

动态代理（JDK动态代理+CGLIB动态代理）

<hr/>

#### 3.4.4 AOP基本概念

##### 3.4.4.1 Joinpoint (连接点)

被拦截到的每个点，spring中指被拦截到的每一个方法， spring aop一个连接点即代表一个方法的执行。

##### 3.4.4.2 Pointcut (切入点)

对连接点进行拦截的定义(匹配规则定义规定拦截哪些方法,对哪些方法进行处理)，spring 有专门]的表达式语言定义。

**3.4.4.3 Advice（通知）**

拦截到每一一个连接点即 (每一 个方法)后所要做的操作

1. 前置通知(前置增强) - before() 执行方法前通知
2. 返回通知(返回增强) - afterReturn 方法正常结束返回后的通知
3. 异常抛出通知(异常抛出增强)一afetrThrow()
4. 最终通知一after无论方法是否发生异常，均会执行该通知。
5. 环绕通知——around包围一一个连接点(join point)的通知，如方法调用。这是最强大的一种通知类型。环绕通知可以在方法调用前后完成自定义的行为。它也会选择是否继续执行连接点或直接返回它们自己的返回值或

##### 3.4.4.4 Aspect (切面)

切入点与通知的结合，决定了切面的定义,切入点定义了要拦截哪些类的哪些方法，通知则定义了拦截过方法后要做什么，切面则是横切关注点的抽象，与类相似,类是对物体特征的抽象，切面则是横切关注点抽象。

##### 3.4.4.5 Target ( 目标对象)

被代理的目标对象
**3.4.4.6  Weave (织入)**
将切面应用到目标对象并生成代理对象的这个过程即为织入

##### 3.4.4.7  Introduction (引入)

在不修改原有应用程序代码的情况下，在程序运行期为类动态添加方法或者字段的过程称为引入

<hr/>

#### 3.4.5 💖Spring AOP的实现

##### 3.4.5.1 Spring环境搭建

<blockquote>
    <p>
       坐标依赖的引入
    </p>
</blockquote>

```xml
        <!--Spring AOP依赖环境-->
        <!-- https://mvnrepository.com/artifact/org.aspectj/aspectjweaver -->
        <dependency>
            <groupId>org.aspectj</groupId>
            <artifactId>aspectjweaver</artifactId>
            <version>1.9.6</version>
        </dependency>
```



<blockquote>
    <p>
       配置spring.xml文件
    </p>
</blockquote>

添加命名空间

```xml
xmlns:aop="http://www.springframework.org/schema/aop"
```

添加依赖

```xml
       http://www.springframework.org/schema/aop
       http://www.springframework.org/schema/aop/spring-aop.xsd
```



##### 3.4.5.2 注解实现AOP

<blockquote>
    <p>
       定义切面和定义切入点
    </p>
</blockquote>

```java
/**
 * 切面的组成：
 *      切入点h和通知的抽象：定义切入点和通知
 *          1. 切入点：定义要拦截那些类的那些方法
 *          2. 通知：定义拦截之后要做什么事情
 */
@Component//表示将任意对象交给IOC容器处理
@Aspect
public class LogCut {
    /**
     * 定义一个切入点
     *      1. 定义要拦截那些类，那些方法
     *      2. 定义匹配规则，用以拦截方法
     *
     *      定义切入点：@Pointcut("匹配规则")
     *
     *      匹配规则（AOP切入点表达式）：
     *          格式：execution("指定修饰符类型 指定包名.指定类名.指定方法(指定参数列表)")，*表示所有
     *          1. 执行所有的公共方法：execution("public *(..)")
     *          2. 执行所有的set方法：execution("* set*(..)")
     *          3. 设置指定包(com.fx.service包)下的任意类下的任意方法：execution("* com.fx.service.*.*(..)")
     *          4. 设置指定包(com.fx.service包)下以及其子包下的的任意类下的任意方法：
     *             execution("* com.fx.service..*.*(..)")
     *
     *      以@Pointcut("execution(* com.fx.service..*.*(..))")为例：
     *          1. 表达式中的第一个*，代表的是方法的修饰范围（*表示任意范围，即public、private、protected）
     *          2. 表达式中第二个*前面的..表示找该包及其所有子包
     *          3. 表达式中的第二个*，代表的是任意类
     *          4. 表达式中的三个*，代表的是任意方法
     *          5. 表达式中的(..)，代表的是任意参数列表，为固定写法
     *          总结：查找任意修饰符限制，com.fx.service包及其子类下的任意类的任意方法
     */
    @Pointcut("execution(* com.fx.service..*.*(..))")
    public void cut(){

    }
}
```



<blockquote>
    <p>
       声明<code>前置通知</code>、<code>返回通知</code>、<code>异常抛出通知</code>、<code>最终通知</code>、<code>环绕通知</code>、
    </p>
</blockquote>

<ul>
    <li><code>@Before</code>:前置通知</li>
    <li><code>@AfterReturning</code>:返回通知</li>
    <li><code>@AfterThrowing</code>:异常抛出通知</li>
    <li><code>@After</code>:最终通知</li>
    <li><code>@Around</code>:环绕通知</li>
</ul>



```java
	/**
     * 声明一个前置通知，并将通知应用到指定的切入点上
     * 执行时间：在目标类的方法执行前执行这个通知
     */
    @Before(value = "cut()")
    public void before(){
        System.out.println("前置通知...");
    }

    /**
     * 声明一个返回通知，并将通知应用到指定的切入点上
     * 执行时间：目标类的方法在无异常执行后，执行该通知
     */
    @AfterReturning(value = "cut()")
    public void afterReturn(){
        System.out.println("返回通知...");
    }

    /**
     * 声明最终通知，并将通知应用到指定的切入点上
     * 执行时间：目标类的方法在执行后，执行该通知（有无异常都会执行）
     */
    @After(value = "cut()")
    public void after(){
        System.out.println("最终通知...");
    }

    /**
     * 声明异常通知，并将通知应用到指定的切入点上
     * 执行时间：目标类的方法在执行异常时，执行该通知
     */
    @AfterThrowing(value = "cut()")
    public void afterThrow(){
        System.out.println("发生异常后执行的通知...");
    }

    /**
     * 声明环绕通知，并将通知应用到指定的切入点上
     * 执行时间：目标类的方法执行前后都可以通过环绕通知定义相应的处理
     * 注意：1. 需要通过显示调用的方法，否则无法访问指定方法pjp.proceed();
     * @param pjp
     * @return
     */
    @Around(value = "cut()")
    public Object around(ProceedingJoinPoint pjp){
        System.out.println("环绕里的前置通知...");
        Object obj=null;

        try {
        	//显示的去调用对应的方法
            obj=pjp.proceed();
            System.out.println(pjp.getTarget());
            System.out.println("环绕通知里的返回通知...");
        } catch (Throwable throwable) {
            throwable.printStackTrace();
            System.out.println("环绕通知里的异常通知...");
        }
        System.out.println("环绕通知中的最终通知...");
        return obj;
    }
```



<blockquote>
    <p>
       在xml文件中配置AOP代理
    </p>
</blockquote>

```xml
    <!--配置AOP代理-->
    <aop:aspectj-autoproxy/>
```



##### 3.4.5.3 xml实现AOP

欠着欠着 <a href="https://www.bilibili.com/video/BV1A54y1p7ya?p=31&spm_id_from=pageDriver">xml实现AOP</a>



##### 3.4.5.4 Spring AOP总结

1. **代理模式实现三要素**
   1.1  接口定义

   1.2  目标对象与代理对象必须实现统一接口

   1.3  代理对象持有目标对象的引用增强目标对象行为

2. **代理模式实现分类以及对应区别**
   2.1  静态代理:手动为目标对象制作代理对象，即在程序编译阶段完成代理对象的创建

   2.2  动态代理:在程序运行期动态创建目标对象对应代理对象。

   2.3  jdk动态代理:被代理目标对象必须实现某一-或某一 组接口实现方式通过回调创建代理对象。

   2.4  cglib动态代理:被代理目标对象可以不必实现接口，继承的方式实现。

   **动态代理相比较静态代理，提高开发效率，可以批量化创建代理，提高代码复用率。**

3. **Aop理解**

   3.1  面向切面，相比oop关注的是代码中的层或面 

   3.2  解耦，提高系统扩展性 3.提高代码复用.

   3.3  提高代码的复用率

4. AOP关键字

   1.连接点:每一个方法

   2.切入点:匹配的方法集合

   3.切面:连接点与切入点的集合决定了切面，横切关注点的抽象

   4.通知:五种通知（前置、返回、异常、最终、环绕）

   5.目标对象:被代理对象

   6.织入:程序运行期将切面应用到目标对象并生成代理对象的过程

   7.引入:在不修改原始代码情况下，在程序运行期为程序动态引入方法或字段的过程



## 4. Spring MVC

### 4.1 知识点概览

思维导图：

![image-20211009204215678](https://cdn.fengxianhub.top/resources-master/202110092042040.png)

<hr/>

### 4.2 MVC思想&SpringMVC框架概念与特点

#### 4.2.1 什么是MVC？

​	模型-视图-控制器(MVC) 是一个众所周知的以设计界面应用程序为基础的设计思想。它主要通过分离模型、视图及控制器在应用程序中

的角色将业务逻辑从界面中解耦。通常，模型负责封装应用程序数据在视图层展示。视图仅仅只是展示这些数据，不包含任何业务逻辑。

控制器负责接收来自用户的请求，并调用后台服务(service或者dao)来处理业务逻辑。处理后，后台业务层可能会返回了- -些数据在视图

层展示。控制器收集这些数据及准备模型在视图层展示。MVC模式的核心思想是将业务逻辑从界面中分离出来，允许它们单独改变而不会相互影响。



![image-20211009204830607](https://cdn.fengxianhub.top/resources-master/202110092048778.png)



#### 4.2.2 常见MVC框架开发效率比较

<blockquote>
    <p>
        Jsp+servlet > struts1 > spring mvc > struts2+freemarker > struts2,ognl,值栈。
    </p>
</blockquote>
​	开发效率上,基本正好相反。值得强调的是，spring mvc开发效率和struts2不相上下，但从目前来看，springmvc的流行度已远远超过

struts2。



#### 4.2.3 SpringMVC是什么？

​	Spring MVC是Spring家族中的一个web成员，它是一种基于Java的实现了Web MVC设计思想的请求驱动类型的轻量级Web框架，即

使用了MVC架构模式的思想，将web层进行职责解耦，基于请求驱动指的就是使用请求-响应模型，框架的目的就是帮助我们简化开

发，Spring MVC也是要简化我们日常Web开发的。Spring MVC是服务到工作者思想的实现。**前端控制器是DispatcherServlet**; 

应用控制器拆为处理器映射器(Handler Mapping)进行处理器管理和视图解析器(View Resolver)进行视图管理;支持本地化/国际化(Locale)

解析及文件上传等;提供了非常灵活的数据验证、格式化和数据绑定机制;提供了强大的**约定大于配置**(惯例优先原则)的契约式编程支持。



#### 4.2.4 SpringMVC能帮我们做什么？

1. 让我们能非常简单的设计出干净的Web层;
2. 进行更简洁的Web层的开发;
3. 天生与Spring框架集成(如IoC容器、 AOP等) ; 
4. 提供强大的约定大于配置的**契约式编程支持**;
5. 能简单的进行Web层的单元测试;
6. 支持灵活的URL到页面控制器的映射;
7. 非常容易与其他视图技术集成，如jsp、 Velocity、 FreeMarker等等 ，因为模型数据不放在特定的API里，而是放在一个Model里(Map数据结构实现，因此很容易被其他框架使用) ;
8. 非常灵活的数据验证、格式化和数据绑定机制，能使用任何对象进行数据绑定，不必实现特定框架的API; 
9. 支持灵活的本地化等解析;
10. 更加简单的异常处理;
11. 对静态资源的支持
12. 支持Restful风格。

<hr/>

### 4.3 SpringMVC请求流程&环境搭建

#### 4.3.1 SpringMVC请求处理流程分析

![image-20211009214413188](https://cdn.fengxianhub.top/resources-master/202110092144379.png)

​	Spring MVC框架也是一个基于请求驱动的Web框架，并且使用了前端控制器模式(是用来提供一个集中的请求处理机制，所有的请求都

将由一一个单一的处理程序处理来进行设计,再根据请求映射规则分发给相应的页面控制器(动作/处理器)进行处理。首先让我们整体看一下

Spring MVC处理请求的流程:

1. 首先用户发送请求，请求被SpringMvc前端控制器(DispatherServlet) 捕获;
2. 前端控制器(DispatherServlet)对请求URL解析获取请求URI,根据URI,调用HandlerMapping;
3. 前端控制器(DispatherServlet)获得返回的HandlerExecutionChain (包括Handler对象以及 Handler对象对应
   的拦截器) ;

4. DispatcherServlet根据获得的HandlerExecutionChain,选择-个合适的HandlerAdapter。(附注: 如果成
    功获得HandlerAdapter后，此时将开始执行拦截器的preHandrlr...)方法) ;

5. HandlerAdapter根据请求的Handler适配并执行对应的Handler; HandlerAdapter(提取Request中的模型数
    据，填充Handler入参,开始执行Handler (Controller)。 在填充Handler的入参过程中， 根据配置，Spring
    将做一些额外的工作:

  HttpMessageConveter:将请求消息(如Json. xml等数据)转换成一个对象, 将对象转换为指定的响应信息。

  数据转换:对请求消息进行数据转换。如String转换成Integer. Double等数据格式化:

  数据格式化。如将字符串转换成格式数字或格式化日期等

  数据验证:验证数据的有效性(长度、格式等) , 验证结果存储到BindingResult或Error中)

6. Handler执行完毕，返回一-个ModelAndView(即模型和视图)给HandlerAdaptor

7. HandlerAdaptor适配器将执行结果ModelAndView返回给前端控制器。

8. 前端控制器接收到ModelAndView后，请求对应的视图解析器。

9. 视图解析器解析ModelAndView后返回对应View;

10. 渲染视图并返回渲染后的视图给前端控制器。

11.  最终前端控制器将渲染后的页面响应给用户或客户端



<hr/>

### 4.4 Spring MVC环境搭建

##### 4.4.1 开发环境

<blockquote>
    <p>
        idea+Maven+Jdk1.8+Jetty
    </p>
</blockquote>



##### 4.4.2 pom.xml坐标添加

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
	<plugins>
      <!-- 编译环境插件 -->
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

      <!-- jetty插件 -->
      <plugin>
        <groupId>org.eclipse.jetty</groupId>
        <artifactId>jetty-maven-plugin</artifactId>
        <version>9.4.27.v20200227</version>
        <configuration>
          <scanIntervalSeconds>10</scanIntervalSeconds>
          <!-- 设置端⼝ -->
          <httpConnector>
            <port>8080</port>
          </httpConnector>
          <!-- 设置项⽬路径 -->
          <webAppConfig>
            <contextPath>/springMVC1001</contextPath>
          </webAppConfig>
        </configuration>
      </plugin>

    </plugins>
```



##### 4.4.3 配置web.xml

```xml
<?xml version="1.0" encoding="UTF-8"?>
<web-app id="WebApp_ID" version="3.0"
         xmlns="http://java.sun.com/xml/ns/javaee"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://java.sun.com/xml/ns/javaee
		 http://java.sun.com/xml/ns/javaee/web-app_3_0.xsd">
  <!-- 编码过滤 utf-8 -->
  <filter>
    <description>char encoding filter</description>
    <filter-name>encodingFilter</filter-name>
    <filter-class>org.springframework.web.filter.CharacterEncodingFilter</filter-class>
    <init-param>
      <param-name>encoding</param-name>
      <param-value>UTF-8</param-value>
    </init-param>
  </filter>
  <filter-mapping>
    <filter-name>encodingFilter</filter-name>
    <url-pattern>/*</url-pattern>
  </filter-mapping>
  <!-- servlet请求分发器 -->
  <servlet>
    <servlet-name>springMVC</servlet-name>
    <servlet-class>org.springframework.web.servlet.DispatcherServlet</servlet-class>
    <init-param>
      <param-name>contextConfigLocation</param-name>
      <!--classpath指代的是resources目录-->
      <param-value>classpath:servlet-context.xml</param-value>
    </init-param>
    <!-- 表示启动容器时初始化该Servlet -->
    <load-on-startup>1</load-on-startup>
  </servlet>
  <servlet-mapping>
    <servlet-name>springMVC</servlet-name>
    <!-- 这是拦截请求， "/"代表拦截所有请求，"*.do"拦截所有.do请求 -->
    <url-pattern>/</url-pattern>
    <!--    <url-pattern>*.do</url-pattern>-->
  </servlet-mapping>
</web-app>

```



##### 4.4.4 servlet-context.xml配置

```xml
<beans xmlns="http://www.springframework.org/schema/beans"
       xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
       xmlns:mvc="http://www.springframework.org/schema/mvc"
       xmlns:context="http://www.springframework.org/schema/context"
       xsi:schemaLocation="
        http://www.springframework.org/schema/mvc
        http://www.springframework.org/schema/mvc/spring-mvc.xsd
        http://www.springframework.org/schema/beans
        http://www.springframework.org/schema/beans/spring-beans.xsd
        http://www.springframework.org/schema/context
        http://www.springframework.org/schema/context/spring-context.xsd">
    <!-- 开启扫描器 -->
    <context:component-scan base-package="com.fx.springMVC.controller"/>
    <!-- 使⽤默认的 Servlet 来响应静态⽂件 -->
    <mvc:default-servlet-handler/>
    <!-- 开启注解驱动-->
    <mvc:annotation-driven/>
    <!-- 配置视图解析器 -->
    <bean class="org.springframework.web.servlet.view.InternalResourceViewResolver"
          id="internalResourceViewResolver">
        <!-- 前缀：在WEB-INF⽬录下的jsp⽬录下 -->
        <property name="prefix" value="/WEB-INF/jsp/"/>
        <!-- 后缀：以.jsp结尾的资源 -->
        <property name="suffix" value=".jsp"/>
    </bean>
</beans>

```



##### 4.4.5 配置jsp文件

在webapp/WEB-INF下建立jsp文件夹，并在jsp中配置

```jsp
<%--
  Created by IntelliJ IDEA.
  User: 13390
  Date: 2020/9/13
  Time: 14:20
  To change this template use File | Settings | File Templates.
--%>
<%@ page language="java" import="java.util.*" pageEncoding="utf-8" %>
<%
    String path=request.getContextPath();
    String basePath=
    request.getScheme()+"://"+request.getServerName()+":"+request.getServerPort()+path+"/";
%>
<!DOCTYPE HTML>
<html>
<head>
    <base href="<%=basePath%>">
    <title>My first hello.jsp starting</title>
</head>
<body>
<%--获取数据模型--%>
<%--el表达式接受参数值--%>
    ${hello}
</body>
</html>


```

##### 4.4.6 页面控制器

```java
/**
 * 页面控制器
 */
@Controller
public class HelloController {
    /**
     * 请求地址的映射:/hello.do
     * @return
     */
    @RequestMapping("/hello")
    public ModelAndView hello(){
        ModelAndView modelAndView = new ModelAndView();
        //设置数据
        modelAndView.addObject("hello","hello SpringMVC");
        //设置视图名称
        modelAndView.setViewName("hello");
        //返回
        return modelAndView;
    }
}
```

### 4.5 💖URL地址映射配置&参数绑定

#### 4.5.1 URL地址映射配置之@RequestMapping

​	通过注解@RequestMapping将请求地址与方法进行绑定，可以在类级别和方法级别声明。类级别的注解负
责将一个特定的请求路径映射到一个控制器上，**将url和类绑定**;通过方法级别的注解可以细化映射，能够将一个
特定的请求路径映射到某个具体的方法上，**将url和类的方法绑定**。

##### 4.5.1.1 映射单个URL

@RequestMapping（"/请求路径"）

```java
/**
 * @RequestMapping简介：
 *      通过注解@RequestMapping可以将请求路径和方法进行绑定，可以声明在方法级别和类级别
 *      使用方法：
 *          1. @RequestMapping（"/请求路径"）
 *          2. @RequestMapping(value = "/请求路径")
 *          3. 路径开头是否添加"/"均可，一般加上
 *      声明级别：
 *          1. 方法级别
 *          2. 类级别+方法级别
 */
@Controller
public class URLController {
    /**
     * 声明在方法上，映射单个RUL
     * 访问地址为：http://localhost:8080/springMVC1001/test
     * @return
     */
    @RequestMapping("/test01")
    public ModelAndView test01(){
        ModelAndView modelAndView = new ModelAndView();
        //可以在resources目录下配置key
        modelAndView.addObject("hello","test01");
        //设置视图
        modelAndView.setViewName("hello");
        return modelAndView;
    }

    /**
     * 访问路径：http://localhost:8080/springMVC1001/test02
     * @return
     */
    @RequestMapping("test02")
    public ModelAndView test02(){
        ModelAndView modelAndView = new ModelAndView();
        //可以在resources目录下配置key
        modelAndView.addObject("hello","test02");
        //设置视图
        modelAndView.setViewName("hello");
        return modelAndView;
    }
}
```



##### 4.5.1.2 映射多个URL

实质上是访问一个数组：@RequestMapping({"/访问路径一","/访问路径二"})

```java
	/**
     * 声明在方法上，映射多个URL
     *      支持一个方法绑定多个URL的操作
     *      使用方法：
     *          1. @RequestMapping({"/访问路径一","/访问路径二"})
     *          2. @RequestMapping(value = {"/访问路径一","/访问路径二"})
     *       访问地址：
     *          1. http://localhost:8080/springMVC1001/访问地址一
     *          2. http://localhost:8080/springMVC1001/访问地址二
     * @return
     */
    @RequestMapping({"/test03_01","/test03_02"})
    public ModelAndView test03(){
        ModelAndView modelAndView = new ModelAndView();
        //可以在resources目录下配置key
        modelAndView.addObject("hello","test03");
        //设置视图
        modelAndView.setViewName("hello");
        return modelAndView;
    }
```



##### 4.5.1.3 映射URL在控制器上

用于类上，表示类中的所有响应请求的方法都是以改地址作为父路径

栗子中的访问地址变为：http://localhost:8080/springMVC1001/url/test01

```java
@Controller
@RequestMapping("/url")
public class URLController {
    /**
     * 声明在方法上，映射单个RUL
     * 访问地址为：http://localhost:8080/springMVC1001/test
     * 注意：如果类上也声明了@RequestMapping注解，则需要在方法路径前添加类路径
     * @return
     */
    @RequestMapping("/test01")
    public ModelAndView test01(){
        ModelAndView modelAndView = new ModelAndView();
        //可以在resources目录下配置key
        modelAndView.addObject("hello","test01");
        //设置视图
        modelAndView.setViewName("hello");
        return modelAndView;
    }
}
```

##### 4.5.1.4 设置URL映射的请求方式

​	默认没有设置请求方式，在HTTP请求中最常用的请求方法是GET、POST，还有其他的一些方法，如：DELET、PUT、HEAD等

可以通过method属性设置支持的请求方式，如method=RequestMethod.POST;如设置多种请求方式，以大括号包围，逗号隔开即可

```java
	/**
     * 设置请求方式
     *      通过method属性设置方法支持的请求方式，默认GET请求和POST等请求都支持
     *      设置了请求方式，则只能按照指定的请求方式请求
     *      访问地址：（设置了只能使用POST请求）：http://localhost:8080/springMVC1001/url/test05
     *
     * @return
     */
    @RequestMapping(value = "/test05",method = RequestMethod.POST)
    public ModelAndView test05(){
        ModelAndView modelAndView = new ModelAndView();
        //可以在resources目录下配置key
        modelAndView.addObject("hello","test05");
        //设置视图
        modelAndView.setViewName("hello");
        return modelAndView;
    }
```



##### 4.5.1.5 通过参数名称映射URL

访问路径：http://localhost:8080/springMVC1001/url?test06



```java
	/**
     * 通过参数名称进行访问
     *      1. 通过参数的形式进行访问
     *      2. 访问地址：http://localhost:8080/springMVC1001/url?test06
     *
     * @return
     */
    @RequestMapping(params = "test06")
    public ModelAndView test06(){
        ModelAndView modelAndView = new ModelAndView();
        //可以在resources目录下配置key
        modelAndView.addObject("hello","test06");
        //设置视图
        modelAndView.setViewName("hello");
        return modelAndView;
    }
```



#### 4.5.2 参数绑定

##### 4.5.2.1 基本数据类型

<blockquote>
    <p>
        基本数据类型
    </p>
</blockquote>

@RequestParam注解注解的使用

```java
	/**
     * 基本数据类型绑定
     *      1. 参数值必须存在，如果不存在且没有设置默认值，则会报500异常
     * @param age 参数一
     * @param money 参数二
     */
    @RequestMapping("/data01")//给一个映射的地址
    public void data01(int age,double money){
        System.out.println("age="+age+"money="+money);
    }

    /**
     * @RequestParam注解
     *      1. 通过注解@RequestParam标记一个形参作为请求参数，该注解声明在形参前面
     *      2. 可以通过@RequestParam注解的defaultValue属性设置默认值，避免参数为空时报500异常
     * @param age
     * @param money
     */
    @RequestMapping("/data02")
    public void data02(@RequestParam(defaultValue = "18") int age,
                       @RequestParam(defaultValue = "25.5") double money){
        System.out.println("age="+age+"，money="+money);
    }

    /**
     * 可以通过name属性设置参数的别名
     *      1. 如果设置了别名，此时客户端访问的参数要与别名保持一致
     * @param age
     * @param money
     */
    @RequestMapping("/data03")
    public void data03(@RequestParam(defaultValue = "18",name = "userAge") int age,
                       @RequestParam(defaultValue = "25.5",name="userMoney") double money){
        System.out.println("age="+age+"，money="+money);
    }
```



##### 4.5.2.2 包装数据类型

包装类的默认值为null，可以避免请求参数为空时报500异常的情况

```java
	/**
     * 包装类型数据绑定
     *      1. 在未设置别名的情况下，请求的参数要与形参名保持一致
     *      2. 包装类的默认值为null，可以避免请求参数为空时报500异常的情况
     *      3. 同样可以@RequestParam注解设置默认值和别名
     * @param age
     * @param money
     */
    @RequestMapping("/data04")
    public void data04(Integer age,Double money){
        System.out.println("age="+age+"，money="+money);
    }
```



##### 4.5.2.3 字符串类型

```java
	/**
     * 字符串数据类型数据绑定
     *      1. 在未设置别名的情况下，请求的参数要与形参名保持一致
     *      2. 默认值为null，可以通过@RequestParam注解设置默认值和别名
     * @param UserName
     * @param UserPwd
     */
    @RequestMapping("/data05")
    public void data05(String UserName,String UserPwd){
        System.out.println("UserName="+UserName+"，UserPwd="+UserPwd);
    }
```



##### 4.5.2.4 数组类型

```java
	/**
     * 数组类型数据绑定
     *      1. 客户端传递参数形式：hobbys=sing&hobbys=dance&hobbys=rap
     * @param hobbys
     */
    @RequestMapping("/data06")
    public void data06(String[] hobbys){
        System.out.println(Arrays.toString(hobbys));
    }
```



##### 4.5.2.5 JavaBean类型

```java
	/**
     * JavaBean数据数据绑定
     *      1. 客户端请求的参数名与JavaBean对象中属性字段名保持一致
     *      2. 当有大量参数时可以通过JavaBean简化参数列表
     * @param user
     */
    @RequestMapping("/data07")
    public void data07(User user){
        System.out.println(user.toString());
    }
```



##### 4.5.2.6 List集合

此时User实体需要定义对应list属性（对于集合的参数绑定，一般需要使用JavaBean对象进行包装）

Java控制器代码：

```java
	/**
     * List集合类型进行数据绑定
     * 注意：集合类型的数据，需要使用JavaBean对象进行包装
     * @param user
     */
    @RequestMapping("/data08")
    public void data08(User user){
        System.out.println(user.toString());
    }
```

JSP代码：

```jsp
<%@ page contentType="text/html;charset=UTF-8" language="java" %>
<html>
<head>
    <title>List集合数据绑定</title>
</head>
<body>
    <form action="data08" method="post">
        <input name="ids[0]" value="123456" />
        <input name="ids[1]" value="1234567" />
        <input name="phoneList[0].num" value="12345678" />
        <input name="phoneList[1].num" value="1234567890" />
        <button type="submit">提交</button>
    </form>
</body>
</html>
```

Javabean代码：

```java
public class User {
    //优先使用包装类型，防止接收为null参数时报异常
    private Integer id;
    private String UserName;
    private String UserPwd;
    private List<Integer> ids;
    private List<Phone> phoneList;
  	...提供构造器、setter&getter方法、toString方法
}

public class Phone {
    private String num;
	...提供构造器、setter&getter方法、toString方法
}
```



##### 4.5.2.7 Set集合

和上面的List类似，只是Set集合不允许有重复元素出现



##### 4.5.2.8 Map类型

Map最为灵活，它也需要绑定在对象上，而不能直接写在Controller方法的参数上

```jsp
			<%--Map集合--%>
            <input name="map[shanghai]" value="上海" />
            <input name="map[beijing]" value="北京" />
            <input name="map[shenzhen]" value="深圳" />
```

#### 4.5.3 请求域对象

请求域对象一共有五种

1. ModelAndView
2. Model
3. ModelMap
4. Map
5. HttpServletRequest

```java
/**
 * 五种设置请求域的方式：
 *      1. ModelAndView
 *      2. Model
 *      3. ModelMap
 *      4. Map
 *      5. HttpServletRequest
 */
@Controller
public class ModelController {

    @RequestMapping("/model01")
    public ModelAndView model01(){
        ModelAndView modelAndView = new ModelAndView();
        //设置数据模型（请求域对象的数据）
        modelAndView.addObject("hell0","hello model01");
        //设置视图
        modelAndView.setViewName("hello");
        //返回modelAndView
        return modelAndView;
    }

    /**
     * modelMap
     * @param modelMap
     * @return
     */
    @RequestMapping("/model02")
    public String model02(ModelMap modelMap){
        //设置请求域对象
        modelMap.addAttribute("hello","hello model02");
        //返回视图
        return "hello";
    }

    /**
     * Model
     * @param model
     * @return
     */
    @RequestMapping("/model03")
    public String model03(Model model){
        //设置请求域对象
        model.addAttribute("hello","hello model03");
        //返回视图
        return "hello";
    }

    /**
     * Map
     * @param map
     * @return
     */
    @RequestMapping("/model04")
    public String model04(Map map){
        //设置请求域对象
        map.put("hello","hello Model04");
        //返回视图
        return "hello";
    }


    /**
     * HttpServletRequest
     * @param request
     * @return
     */
    @RequestMapping("/model05")
    public String model05(HttpServletRequest request){
        //设置请求域对象
        request.setAttribute("hello","hello Model05");
        //返回视图
        return "hello";
    }
}

```



### 4.6 请求转发与重定向的问题

SpringMVC默认采用服务器内部转发的形式展示页面信息。同样也支持重定向页面

#### 4.6.1 重定向

重定向是发一个302的状态码给浏览器，浏览器自己去请求跳转的网页。地址栏会发生改变。

**重定向以redirect：开头**

```java
/**
 * 请求转发与重定向
 */
@Controller
public class ViewController {
    /**
     * 重定向到指定的JSP页面
     * @return
     */
    @RequestMapping("/view01")
     public String view01(){
         return "redirect:view.jsp";
     }

    /**
     * 重定向到指定的JSP页面并传递参数
     * @return
     */
    @RequestMapping("/view02")
     public String view02(){
         return "redirect:view.jsp?uname=zhangsan&upwd=123456";
     }

    /**
     * 重定向到指定的JSP页面并传递中文参数
     * 通过使用RedirectAttributes设置参数的方式解决乱码问题
     * @return
     */
    @RequestMapping("/view04")
     public String view04(RedirectAttributes attributes){
        //设置参数
        attributes.addAttribute("uname","张三");
        attributes.addAttribute("upwd","123456");
        attributes.addAttribute("hobby","篮球");
        return "redirect:view.jsp";
     }

    /**
     * 通过ModelAndView重定向
     * @param modelAndView
     * @return
     */
     @RequestMapping("/view05")
     public ModelAndView view05(ModelAndView modelAndView){
        //设置参数
         modelAndView.addObject("uname","张三");
         modelAndView.addObject("upwd","123456");
         modelAndView.addObject("hobby","篮球");
         //设置视图
         modelAndView.setViewName("redirect:view.jsp");
         return modelAndView;
     }

    /**
     * 请求重定向到Controller控制层，返回modelAndView对象
     * @param modelAndView
     * @return
     */
     @RequestMapping("/view06")
     public ModelAndView view06(ModelAndView modelAndView){
        //设置参数
         modelAndView.addObject("uname","张三");
         modelAndView.addObject("upwd","123456");
         modelAndView.addObject("hobby","篮球");
         //设置视图
         modelAndView.setViewName("redirect:test");
         return modelAndView;
     }


}

```

请求转发用forward:开头

```java
/**
 * 请求转发到JSP页面
 * @return
 */
 @RequestMapping("/view07")
 public String view07(){
    return "forward:view.jsp";
 }

/**
 * 请求转发到JSP页面，并传递参数
 * 注意：请求转发属于服务器内部的转发，不会出现中文乱码问题
 * @return
 */
 @RequestMapping("/view08")
 public String view8(){
    return "forward:view.jsp?uname=张三&upwd=123";
 }

/**
 * 请求转发到JSP页面并传递参数
 * @param model
 * @return
 */
 @RequestMapping("/view09")
 public String view9(Model model){
     model.addAttribute("name","管理员");
    return "forward:view.jsp?uname=张三&upwd=123";
 }


/**
 * 请求转发一般（默认）写法，程序会自动去找view.jsp页面
 * 路径在Resources目录下的xml文件中配置：
 *      <!-- 前缀：在WEB-INF⽬录下的jsp⽬录下 -->
 *      <property name="prefix" value="/WEB-INF/jsp/"/>
 * @param model
 * @return
 */
 @RequestMapping("/view10")
 public String view10(Model model){
     model.addAttribute("name","管理员");
     return "../../view";
 }

/**
 * 请求转发到Controller
 * @param modelAndView
 * @return
 */
 @RequestMapping("/view11")
 public ModelAndView view11(ModelAndView modelAndView){
     modelAndView.setViewName("forward:test");
     return modelAndView;
 }

/**
 * 请求转发到Controller并拼接参数
 * @param modelAndView
 * @return
 */
 @RequestMapping("/view12")
 public ModelAndView view12(ModelAndView modelAndView){
     modelAndView.setViewName("forward:test?uname=张三&upwd=123456");
     return modelAndView;
 }
```



#### 4.6.2 请求转发

**请求转发在浏览器中是一个默认的方式**（浏览器中地址不发生改变）

请求转发，直接调用跳转的页面，让它返回。对于浏览器来说，它无法感觉服务器有没有forward。地址栏不发生改变。可以获取请求域中的数据。

**请求转发以forward:开头**







### 4.7 SpringMVC之JSON数据开发

#### 4.7.1 基本概念

​	Json在企业开发中已经作为通用的接口参数类型，在页面（客户端）解析很方便。SpringMVC对于jsor提供
了良好的支持，这里需要修改相关配置，添加json 数据支持功能

##### 4.7.1.1 @ResponseBody简介

该注解用于将Controller的方法返回的对象，通过适当的 HttpMessageConverter转换为指定格式后，写入到 Response对象的body 数据区。
返回的数据不是 html标签的页面，而是其他某种格式的数据时（如json、xml等）使用（通常用于ajax请求)

##### **4.7.1.2 @RequestBody**简介

该注解用于读取Request请求的body部分数据，使用系统默认配置的HttpMessageConverter进行解析，然后把相应的数据绑定到要返回的对象上，再把 HttpMessageConverter返回的对象数据绑定到controller中方法的参数上。

#### 4.7.2 使用配置

##### 4.7.2.1 在pom.xml中添加json坐标

<blockquote>
    <p>
        pom.xml添加json坐标
    </p>
</blockquote>

```xml
<!-- https://mvnrepository.com/artifact/com.fasterxml.jackson.core/jackson-core -->
<dependency>
    <groupId>com.fasterxml.jackson.core</groupId>
    <artifactId>jackson-core</artifactId>
    <version>2.12.3</version>
</dependency>
<!-- https://mvnrepository.com/artifact/com.fasterxml.jackson.core/jackson-databind -->
<dependency>
    <groupId>com.fasterxml.jackson.core</groupId>
    <artifactId>jackson-databind</artifactId>
    <version>2.12.4</version>
</dependency>
<!-- https://mvnrepository.com/artifact/com.fasterxml.jackson.core/jackson-annotations -->
<dependency>
    <groupId>com.fasterxml.jackson.core</groupId>
    <artifactId>jackson-annotations</artifactId>
    <version>2.12.3</version>
</dependency>

```

4.7.4.2 修改resources目录下的xml配置文件

```xml
   <!-- mvc 请求映射 处理器与适配器配置 --> 
	<mvc:annotation-driven>
        <mvc:message-converters>
            <bean class="org.springframework.http.converter.StringHttpMessageConverter"/>
            <bean class="org.springframework.http.converter.json.MappingJackson2HttpMessageConverter"/>
        </mvc:message-converters>
    </mvc:annotation-driven>
```



#### 4.7.3 注解使用

##### 4.7.3.1 @ResponseBody

```java
	/**
     * 注解@ResponseBody，表示返回的数据格式是JSON格式（返回JavaBean对象）
     *      1. 注解设置在方法体上
     * @return
     */
    @RequestMapping("/query01")
    @ResponseBody
    public User queryUser01(){
        User user=new User();
        user.setId(1);
        user.setUserName("张三");
        user.setUserPwd("123456");
        //返回User对象
        return user;
    }

    // @ResponseBody也可以设置在方法返回值的前面
    @RequestMapping("/query02")
    public @ResponseBody User queryUser02(){
        User user=new User();
        user.setId(2);
        user.setUserName("李四");
        user.setUserPwd("123456");
        //返回User对象
        return user;
    }

    @RequestMapping("/query03")
    public @ResponseBody List<User> queryUser03(){
        List<User> list=new ArrayList<>();
        User user=new User();
        user.setId(2);
        user.setUserName("李四");
        user.setUserPwd("123456");

        User user02=new User();
        user02.setId(1);
        user02.setUserName("张三");
        user02.setUserPwd("123456");

        list.add(user);
        list.add(user02);
        //返回User对象
        return list;
    }

    /**
     * 当ajax请求时，@ResponseBody会将数据转化成JSON格式，响应给ajax的回调函数
     * @return
     */
    @RequestMapping("/query04")
    @ResponseBody
    public User queryUser04(){
        User user=new User();
        user.setId(3);
        user.setUserName("张三");
        user.setUserPwd("123456");
        //返回User对象
        return user;
    }
```



##### 4.7.3.2 @RequestBody

​	@RequestBody注解常用来处理content-type **不是默认的application/x-www-form-urlcoded**类型的内容.

比如说: application/json或者是application/xml等。一般情况下来说常用其来处理application/json类型。@RequestBody接受的是一个

json格式的字符串，一定是一个字符串。通过@RequestBody可以将请求体中的JSON字符串绑定到相应的bean上，当然，也可以将其分

别绑定到对应的字符串上。

java代码：

```java
	/**
     * 1. 注解：@RequestBody 规定请求的参数必须是JSON格式的字符串
     * 2. 注解形式为在形参前面
     * 3. @RequestBody处理不是默认类型（application/x-www-form-urlcoded类型）的内容
     * 4. 请求的参数一定要是JSON格式的字符串
     * @param user
     * @return
     */
    @RequestMapping("/query05")
    @ResponseBody
    public User queryUser05(@RequestBody User user){
        System.out.println(user);
        return user;
    }
```

jsp文件配置：

```jsp
<input type="button" value="请求JSON格式" onclick="test02()">
<script type="text/javascript">
    /**
     * 传递JSON格式的字符串
     */
    function test02() {
        //发送ajax请求
        $.ajax({
            //请求方式 GET|POST
            type:"post",
            //请求路径
            url:"User/query05",
            //设置服务器请求参数的类型为：application/json
            contentType:"application/json",
            //设置参数，请求的参数一定要是JSON格式的字符串
            data:'{"userName":"张三", "userPwd":"123456"}',
            //回调函数，接收服务端返回的结果（函数中的形参用来接收返回的数据）
            success:function (data) {
                console.log(data);
            }
        })
    }
</script>
```





### 4.8 课程总结&SpringMVC常用注解



@Controller
负责注册一个bean 到spring 上下文中。
@Service  
声明Service组件，例如@Service("myMovieLister") 
@Repository 
声明Dao组件。
@Component   
泛指组件, 当不好归类时使用此注解。
@Resource  
用于注入，( j2ee提供的 ) 默认按名称装配，@Resource(name="beanName") 。
@Autowired 
用于注入，(srping提供的) 默认按类型装配 。
@Transactional( rollbackFor={Exception.class}) 
事务管理。
@Scope("prototype")   
设定bean的作用域。
@RequestMapping
注解为控制器指定可以处理哪些 URL 请求。
@RequestBody
该注解用于读取Request请求的body部分数据，使用系统默认配置的HttpMessageConverter进行解析，然后把相应的数据绑定到要返回的对象上 ,再把HttpMessageConverter返回的对象数据绑定到 controller中方法的参数上。
@ResponseBody
该注解用于将Controller的方法返回的对象，通过适当的HttpMessageConverter转换为指定格式后，写入到Response对象的body数据区。
@ModelAttribute 　　　
在方法定义上使用 @ModelAttribute 注解：Spring MVC 在调用目标处理方法前，会先逐个调用在方法级上标注了@ModelAttribute 的方法。
在方法的入参前使用 @ModelAttribute 注解：可以从隐含对象中获取隐含的模型数据中获取对象，再将请求参数 –绑定到对象中，再传入入参将方法入参对象添加到模型中 。
@RequestParam　
在处理方法入参处使用 @RequestParam 可以把请求参 数传递给请求方法。
@PathVariable
绑定 URL 占位符到入参。
@ExceptionHandler
注解到方法上，出现异常时会执行该方法。
@ControllerAdvice
使一个Contoller成为全局的异常处理类，类中用@ExceptionHandler方法注解的方法可以处理所有Controller发生的异常。

















