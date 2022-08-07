# Dubbo

我们来回顾一下不断演进的服务架构

```java
单体架构 -> 分布式架构 -> 微服务
```

**单体架构**：将业务的所有功能集中在一个项目中开发，打成一个包部署

![image-20210713202807818](https://cdn.fengxianhub.top/resources-master/202205142114901.png)

>**优点：**
>
>- 架构简单
>- 部署成本低
>
>**缺点：**
>
>- 耦合度高（维护困难、升级困难）

**分布式架构**：根据业务功能对系统做拆分，每个业务功能模块作为独立项目开发，称为一个服务

![image-20210713203124797](https://cdn.fengxianhub.top/resources-master/202205142114100.png)

>**优点：**
>
>- 降低服务耦合
>- 有利于服务升级和拓展
>
>**缺点：**
>
>- 服务调用关系错综复杂

分布式架构虽然降低了服务耦合，但是服务拆分时也有很多问题需要思考：

- 服务拆分的粒度如何界定？
- 服务之间如何调用？
- 服务的调用关系如何管理？

人们需要制定一套行之有效的标准来约束分布式架构，进而有了我们现在的微服务，微服务的上述特性其实是在给分布式架构制定一个标准，进一步降低服务之间的耦合度，提供服务的独立性和灵活性。做到高内聚，低耦合。

因此，可以认为**微服务**是一种经过良好架构设计的**分布式架构方案** 。

![image-20210713203753373](https://cdn.fengxianhub.top/resources-master/202205142114523.png)

>微服务的架构特征：
>
>- 单一职责：微服务拆分粒度更小，每一个服务都对应唯一的业务能力，做到单一职责
>- 自治：团队独立、技术独立、数据独立，独立部署和交付
>- 面向服务：服务提供统一标准的接口，与语言和技术无关
>- 隔离性强：服务调用做好隔离、容错、降级，避免出现级联问题

现在国内用的最多的微服务就是`SpringCloud`，它的核心组件包括：

![image-20210713204155887](https://cdn.fengxianhub.top/resources-master/202205142114972.png)

## 1. 什么是Dubbo

我们在学习SpringCloud的时候，为了调用其他微服务里面的接口，经常会使用`Feign`来调用，其实这就是一种远程过程调用（RPC），是基于Http协议的远程服务调用

`Dubbo`其实也是干类似的事情的，即`Dubbo`是一款高性能的RPC框架，用来解决微服务中各个模块调用的问题，那我们既然有了`Feign`，为什么还要有`Dubbo`呢？那是因为对于微服务模块来说`HTTP`协议还是太重了，`HTTP`协议在设计之处为了许多的安全性，设置了许多健壮性的设计，对于微服务模块来说，其实完全可以采用更加轻量级的通讯协议来完成远程服务调用，`Dubbo`应运而生

Dubbo主要从一下两个方面来加快远程调用的速度，这两个方面同时也是我们进行网络IO最耗时的方面：

- 序列化

  我们在学习Java网络编程的时候知道，一个对象要想在网络中传输，就必须要实现`Serializable`接口进行序列化，一般序列化的方式有：xml、json、二进制流等，其中效率最高的就是二进制流（因为网络传输的本质就是通过二进制传输的），`Dubbo`采用的就是效率最高的二进制方式进行序列化

- 网络通信

  Dubbo采用Socket通信，自定义一套高效的通讯协议，提升了通信效率，并且可以建立长连接，不用反复连接，极大的提升了传输的效率

现在市面上还有很多的RPC框架，如：gRPC、Thrift、HSF等等

`Dubbo`除了提供远程服务调用的功能之外，还有服务注册发现的功能，我们来看一下官方的`Dubbo`架构图：

![image-20220806232532540](https://s2.loli.net/2022/08/06/7OfSTKqnkPcN95p.png)

可以看到在`Dubbo`中主要有五个角色：

- Container： 服务运行容器，负责加载、运行服务提供者。必须。

- Provider： 暴露服务的服务提供方，会向注册中心注册自己提供的服务。必须。
- Consumer： 调用远程服务的服务消费方，会向注册中心订阅自己所需的服务。必须。
- Registry： 服务注册与发现的注册中心。注册中心会返回服务提供者地址列表给消费者。非必须。
- Monitor： 统计服务的调用次数和调用时间的监控中心。服务消费者和提供者会定时发送统计数据到监控中心。 非必须。

读者可能会感觉这些服务好像`Nacos`也提供叭，或者说是`SpringCloud`也提供，是的，其实`Dubbo`和`SpringCloud`在某种程度上是竞争关系

`Dubbo`为我们提供的主要功能有：

1. 面向接口代理的高性能 RPC 调用
2. 智能容错和负载均衡。
3. 服务自动注册和发现
4. 高度可扩展能力
5. 运行期流量调度
6. 可视化的服务治理与运维

我们总结一下`Dubbo`的作用：` Dubbo是一站式的微服务解决方案`

## 2. Dubbo快速上手

因为Dubbo是使用Zookeeper进行服务注册发现，所以我们需要安装一个zk，后续可以使用`Nacos`作为注册中心

我们可以在Linux环境下搭建一个Zookeeper，这里笔者采用的方式是Docker的方式

如果读者对Zookeeper的使用还比较陌生，可以看笔者的这篇文章：<a href="https://blog.csdn.net/fengxiandada/article/details/124697818?ops_request_misc=&request_id=&biz_id=102&utm_term=docker%E5%AE%89%E8%A3%85zookeeper&utm_medium=distribute.pc_search_result.none-task-blog-2~all~sobaiduweb~default-2-124697818.nonecase&spm=1018.2226.3001.4187">docker安装zookeeper&zookeeper基本使用（非常详细）</a>

```java
docker run -d -e TZ="Asia/Shanghai" \
-p 2181:2181 \
--name zookeeper \
--restart always zookeeper
```

### 2.1 各模块的配置文件

我们这里来新建一个项目用来演示一下`Dubbo`的使用过程：

![image-20220807224017838](https://s2.loli.net/2022/08/07/HpbUfPF68AEwhd7.png)

父模块的依赖如下，采用的都是现在最新的版本，如果版本发生冲突可以试着降低版本

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>

    <groupId>cn.hnit</groupId>
    <artifactId>dubbo-demo</artifactId>
    <packaging>pom</packaging>
    <version>1.0-SNAPSHOT</version>
    <modules>
        <module>dubbo-provider</module>
        <module>dubbo-comsumer</module>
        <module>dubbo-provider2</module>
        <module>dubbo-api</module>
    </modules>

    <parent>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-parent</artifactId>
        <version>2.7.2</version>
    </parent>
    <properties>
        <java.version>1.8</java.version>
        <dubbo-boot.version>3.0.8</dubbo-boot.version>
        <zkclient.version>5.2.1</zkclient.version>
    </properties>

    <dependencyManagement>
        <dependencies>
            <!-- apache 官方 3.0 starter依赖 -->
            <dependency>
                <groupId>org.apache.dubbo</groupId>
                <artifactId>dubbo-spring-boot-starter</artifactId>
                <version>${dubbo-boot.version}</version>
            </dependency>
            <!-- zookeeper客户端  只需引入此依赖curator-framework curator-recipes 都有 -->
            <dependency>
                <groupId>org.apache.curator</groupId>
                <artifactId>curator-x-discovery</artifactId>
                <version>5.1.0</version>
            </dependency>
            <dependency>
                <groupId>org.springframework.boot</groupId>
                <artifactId>spring-boot-starter-web</artifactId>
                <version>2.6.4</version>
            </dependency>
        </dependencies>
    </dependencyManagement>
</project>
```

`dubbo-api`依赖：

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <parent>
        <artifactId>dubbo-demo</artifactId>
        <groupId>cn.hnit</groupId>
        <version>1.0-SNAPSHOT</version>
    </parent>
    <modelVersion>4.0.0</modelVersion>

    <artifactId>dubbo-api</artifactId>

    <dependencies>
        <dependency>
            <groupId>org.projectlombok</groupId>
            <artifactId>lombok</artifactId>
        </dependency>
    </dependencies>
</project>
```

接着在这两个子模块添加依赖

![](https://s2.loli.net/2022/08/07/rR5fmwYMW8UFQqk.png)

`dubbo-provider`

```xml
<dependencies>
    <!-- 不需要对外暴露接口，仅需要给其他模块进行RPC调用 -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter</artifactId>
    </dependency>
    <dependency>
        <groupId>org.apache.curator</groupId>
        <artifactId>curator-x-discovery</artifactId>
    </dependency>
    <dependency>
        <groupId>cn.hnit</groupId>
        <artifactId>dubbo-api</artifactId>
        <version>1.0-SNAPSHOT</version>
    </dependency>
</dependencies>
```

配置文件：

```yaml
# 这里的配置属性只是基础配置，如需更多功能配置，请自行扩展
dubbo:
  application:
    name: dubbo-provider
  registry:
    address: zookeeper://volunteer.fengxianhub.top:20016
  protocol:
    name: dubbo
    port: 20880
```

第二个`dubbo-provider`和上面一样，只是要将dubbo通信的端口修改一下，例如改为`20881`

`dubbo-comsumer`

```xml
<dependencies>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>

        <dependency>
            <groupId>org.apache.dubbo</groupId>
            <artifactId>dubbo-spring-boot-starter</artifactId>
        </dependency>

        <dependency>
            <groupId>org.apache.curator</groupId>
            <artifactId>curator-x-discovery</artifactId>
        </dependency>

        <dependency>
            <groupId>cn.hnit</groupId>
            <artifactId>dubbo-api</artifactId>
            <version>1.0-SNAPSHOT</version>
        </dependency>

        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-test</artifactId>
            <scope>test</scope>
        </dependency>
```

配置文件：

```yaml
server:
  port: 8080   #Tomcat端口
# 这里的配置属性只是基础配置，如需更多功能配置，请自行扩展
dubbo:
  application:
    name: dubbo-provider
  registry:
    address: zookeeper://volunteer.fengxianhub.top:20016
  protocol:
    name: dubbo
    port: 20882
```

接着我们在`API`中写几个需要进行RPC的接口，这个包一般用来定义接口，提供给其他包进行实现，读者也可以不写这个包![image-20220807225117481](https://s2.loli.net/2022/08/07/ZQ85SWprLDtvJqw.png)

User类

```java
@Data
@NoArgsConstructor
@AllArgsConstructor
public class User implements Serializable {

    private static final long serialVersionUID = 8728327146677888239L;

    private Integer userId;

    private String  userName;
}
```

接口`UserService`

```java
public interface UserService {
    User getByUserId(Integer userId);
}
```

### 2.2 对外暴露接口

接着我们写调用逻辑和对外暴露的接口，对外暴露的接口仅写在`dubbo-consumer`模块中，在此之前我们需要先写服务中心的RPC调用逻辑，也就是`dubbo-provider`模块中，写一个类来实现之前我们`dubbo-api`中定义的接口

```java
@Slf4j
@DubboService
public class UserServiceImpl implements UserService {
    // 模拟数据
    private static final List<User> USERS = Arrays.asList(
            new User(1, "张三"),
            new User(2, "李四")
    );
    // 用来记录被调用的次数
    private final AtomicInteger sum = new AtomicInteger(0);

    @Override
    public User getByUserId(Integer userId) {
        // 打印一下被调用情况，dubbo-provider2中这里填dubbo-provider2被调用
        log.info("dubbo-provider被调用【{}】次", sum.incrementAndGet());
        for (User user : USERS) {
            if (user.getUserId().equals(userId)) {
                return user;
            }
        }
        return null;
    }
}
```

当然在启动类上我们需要加上`@EnableDubbo`注解表示启动`Dubbo RPC`

```java
@EnableDubbo
@SpringBootApplication
public class ProviderApplication {
    public static void main(String[] args) {
        SpringApplication.run(ProviderApplication.class, args);
    }
}
```

### 2.3 查看调用情况

接下来我们启动`dubbo-consumer`、`dubbo-provider`、`dubbo-provider2`三个服务，注意我们这里要先启动后面两个RPC提供的服务，再启动第一个对外暴露接口的服务

![image-20220807235348409](https://s2.loli.net/2022/08/07/Q3k7PKw1yUZofmj.png)

我们来测试一下，发现可以完成调用：

![image-20220807235601326](https://s2.loli.net/2022/08/07/dshNM3DT2XfjzIY.png)

>我们再来做一万次压测，看看两个`provider`服务的负载情况

这里压测笔者使用`AB`压力测试，启用100个线程共发送一万个请求

![image-20220808000426373](https://s2.loli.net/2022/08/08/oxWeMakTQiRZrXu.png)

来看看两个`provider`的负载，`provider1`:

![image-20220808000459914](https://s2.loli.net/2022/08/08/SO8TekRQw2Niny1.png)

`provider2`:

![image-20220808000532278](https://s2.loli.net/2022/08/08/QyCAwuijOVRnExh.png)

可以看到请求被平均发到两个服务上了，起到了负载均衡的作用

我们再来看看`ZooKeeper`上的结点情况：

![image-20220808001808645](https://s2.loli.net/2022/08/08/gYhoZ3dmFOVkLCl.png)



## 3. 使用nacos作为注册中心

在上面的快速入门中，我们知道了`Dubbo`进行`RPC`调用的过程，我们可以想注入一个普通`Bean`一样，注入一个远程的`Bean`，并且还可以配置负载均衡策略，到这里`Dubbo`中的五个核心组件我们已经见识过四个了，其中`Container`容器就是我们的Spring容器，现在只有最后一个组件：`Monitor`没有见过了，接下来我们就开始学习它

`Monitor`是监视器的意思，用来监视整个`Dubbo`组件的状态，它提供了一个web界面让我们更清楚在查看我们的`Dubbo`使用情况，由于`Monitor`本身存在一些问题，一般我们会使用`dubbo-admin`进行管理，但是 **dubbo-2.6.1以后的版本不再有dubbo-admin**了

现在一般我们会使用`Nacos`作为注册中心和配置管理中心，接下来，我们使用`Nacos`重复一遍上面的过程

Nacos的使用可以看笔者的另一篇文章：<a href="https://blog.csdn.net/fengxiandada/article/details/125021232">eureka&nacos学习一</a>



![image-20220808003201046](https://s2.loli.net/2022/08/08/k6RweFtyT7E1x9B.png)

这里我在docker上面安装一下：

```java
docker run -d \
-e MODE=standalone \
--privileged=true \
--restart=always \
-e JVM_XMS=256m \
-e JVM_XMX=256m \
-e MODE=standalone \
-e PREFER_HOST_MODE=hostname \
-p 8848:8848  \
--name nacos \
--restart=always \
nacos/nacos-server:1.4.1        
```

