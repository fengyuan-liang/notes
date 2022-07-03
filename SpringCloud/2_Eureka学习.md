## Eureka学习

SpringCloud与boot对应版本

![image-20220402101852260](https://cdn.fengxianhub.top/resources-master/202204021018591.png)

eureka开启监视器

```yaml
spring boot acurator:临控器

1. 
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-actuator</artifactId>
        </dependency>
    刷新
2. application.yml中:
#打开actuator中的端口， 默认情况，springboot 2之后，这些端点都没有开放
management:
   endpoints:
     web:
       exposure:
         include: "*"      # 在yml中* 有关键字，这里要加  "  "  

eureka:
  client:
    service-url:
      defaultZone: http://localhost:8101/eureka/
  instance:
    instance-id: microservice-provider-product_1    #实例名，它是一个应用下的多个微服务的名字
    metadata-map:
      management:
        context-path: ${server.servlet.context-path}/actuator  #因为程序 配置了 content-path,所以在这里要重新映射一下actuator的路径.

```



关闭服务器自我保护机制，实时刷新服务列表

```java
关闭服务器自我保停机制，让它能实时刷新服务列表:
eureka服务端的配置： 
eureka:
  server:
    eviction-interval-timer-in-ms: 1000   #清理服务注册列表( 默认情况 60s )
    enable-self-preservation: false    #是否启用自我保护模式，关闭.

服务提供端的配置:
eureka:
  client:
    service-url:
      defaultZone: http://localhost:8101/eureka/
  instance:
    instance-id: microservice-provider-product_1    #实例名，它是一个应用下的多个微服务的名字
    metadata-map:
      management:
        context-path: ${server.servlet.context-path}/actuator  #因为程序 配置了 content-path,所以在这里要重新映射一下actuator的路径.
    lease-renewal-interval-in-seconds:  2   #设置客户端向服务端发送心跳信息的时间间隔( 默认: 30s )
    lease-expiration-duration-in-seconds: 6 # 设置服务器如果6秒都没有接到心跳，则将此客户端的租约设为超期

```

>要在eureka的客户端了解一些eureka服务器的信息，如何做？
>
>要用到一个DiscoveryClient对象
>
>- netflix  -> EurekaClient
>- SpringCloud -> DiscoveryClient

具体实现步骤:

1. 在application中添加注解，启用discovery服务

   ```java
   @EnableEurekaClient   //启用eureka的客户端
   @EnableDiscoveryClient   //启用  spring cloud的   discoveryClient
   ```

2. 通过对应的对象和方法获取服务列表中服务器的信息

   ```java
   @Autowired
   private EurekaClient eurekaClient;
   @Autowired
   private DiscoveryClient discoveryClient;
   @GetMapping("eurekaDiscovery")
   public Result discovery(){
       log.info("Eureka客户端的配置信息:{}",eurekaClient.getEurekaClientConfig());
       log.info("服务端应用列表:{}",eurekaClient.getEurekaClientConfig());
       //将客户端所有信息输出
       return ResultGenerator.getSuccessResult(eurekaClient.getAllKnownRegions());
   }
   @GetMapping("discoveryClient")
   public Result discoveryClient(){
       log.info("discoveryClient客户端描述:{}",discoveryClient.description());
       log.info("服务端应用列表:{}",discoveryClient.getServices());
       return ResultGenerator.getSuccessResult(discoveryClient.getServices());
   }
   ```

>服务器信息非常隐私，需要做保护

导入坐标依赖

```java
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-security</artifactId>
    <version>2.0.0.RELEASE</version>
</dependency>
```

配置登录的账号密码：

```yaml
spring:
  application:
    name: eureka-server
  security:
    user:
      name: admin
      password: a
```

但是我们通过服务结点登录注册中心时可能会有csrf，也就是cookie劫持的危险，security默认会开启csrf防护，但是这样我们的服务器就不能登录注册中心了，所以需要取消掉csrf防护

参考文章：https://www.cnblogs.com/hyddd/archive/2009/04/09/1432744.html

eureka配置类配置

```java
@EnableWebSecurity
public class WebSecurityConfig extends WebSecurityConfigurerAdapter {

    @Override
    protected void configure(HttpSecurity http) throws Exception {
        http.csrf().disable();   //取消   csrf()
        super.configure(http);
    }
}
```

服务结点每次请求都要携带账号密码：

```yaml
eureka:
    client:
        service-url:
            defaultZone: http://admin:a@localhost:8101/eureka/
```

eureka设计到的模块

- 



## eureka集群配置

先在`C:\Windows\System32\drivers\etc`的host文件中做一下域名映射，模拟集群配置

加入配置

```xml
# yc-SpringCloud-demo
127.0.0.1 eureka1
127.0.0.1 eureka2
127.0.0.1 eureka3
```

推荐配置奇数台注册服务器，我这里配置三台

复制一下配置文件

![image-20220402095421882](https://cdn.fengxianhub.top/resources-master/202204020954217.png)

```yaml
server:
  port: 8102

eureka:
  instance:
    hostname: eureka2

spring:
  application:
    name: eureka-server2
```

由于集群之间需要互相进行注册，所以需要再导入一个包



## eureka  ribbon负载均衡策略

- 全局

首先需要在消费端的pom里面添加依赖：

```xml
<dependency>
    <groupId>org.springframework.cloud</groupId>
    <artifactId>spring-cloud-starter-netflix-eureka-client</artifactId>
</dependency>
<dependency>
    <groupId>org.springframework.cloud</groupId>
    <artifactId>spring-cloud-commons</artifactId>
</dependency>
```

ribbon负载均衡的策略

- **轮寻负载均衡**，在添加restTemplate的配置类中加入注解`@LoadBalanced`

  ```java
  @Bean
  @LoadBalanced //加入负载均衡 此处负载均衡为全局配置
  public RestTemplate  restTemplate(){
      return new RestTemplate();
  }
  ```

- 

## feign替代restTemplate和ribbon并进行负载均衡

面向接口编程，feign会自动生成动态代理进行实现

```java
@FeignClient(name = "MICROCLOUD-PROVIDER-PRODUCT",configuration = FeignClientAuthConfig.class) //name里面写服务名
public interface IProductFeignInterface {
    @RequestMapping("/product/get/{pid}")
    Result getProduct(@PathVariable("pid") Integer pid);
    @RequestMapping("/product/findList")
    Result list();
    @RequestMapping("/product/delete/{id}")
    Result delete(@PathVariable("id")Integer pid);
    @RequestMapping("/product/add")
    Result add(@RequestBody Product product);
}
```

```java
/**
 * 因为在product加入security，需要在每个请求头中加入authentication认证信息
 */
@Configuration
public class FeignClientAuthConfig {
    /**
     * 拦截器，当请求发出时，会自动加入认证
     */
    @Bean
    public BasicAuthenticationInterceptor getBaseAuthRequestInterceptor(){
        return new BasicAuthenticationInterceptor("product","a");
    }
}
```



小结：

eureka服务注册发现

security http Base认证

RestTemplate：客户端

ribbon负载均衡

feign：整合了RestTemplate和ribbon









