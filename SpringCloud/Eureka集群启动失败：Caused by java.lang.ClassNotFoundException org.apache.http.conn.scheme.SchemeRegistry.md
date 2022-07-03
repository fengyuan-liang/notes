# Eureka集群启动失败：Caused by: java.lang.ClassNotFoundException: org.apache.http.conn.scheme.SchemeRegistry

cloud与boot的版本有冲突，换成指定版本或者稳定版本就可以了

```xml
<properties>
<spring.cloud.version>Hoxton.SR12</spring.cloud.version>
<spring.boot.version>2.2.1.RELEASE</spring.boot.version>
</properties>

<dependencies>
    <dependency> 
        <!-- 进行SpringCloud依赖包的导入处理 -->
        <groupId>org.springframework.cloud</groupId>
        <artifactId>spring-cloud-dependencies</artifactId>
        <version>${spring.cloud.version}</version>
        <type>pom</type>
        <scope>import</scope>
    </dependency>
    <dependency> 
        <!-- SpringCloud离不开SpringBoot，所以必须要配置此依赖包 -->
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-dependencies</artifactId>
        <version>${spring.boot.version}</version>
        <type>pom</type>
        <scope>import</scope>
    </dependency>
</dependencies>
```

cloud与boot的版本对应关系可以查看<a href="https://spring.io/projects/spring-cloud">官网</a>，一般Hoxton.SR12的包冲突会少一些

![image-20220402101852260](https://cdn.fengxianhub.top/resources-master/202204021018591.png)

更改后就正常了

![image-20220402104944415](https://cdn.fengxianhub.top/resources-master/202204021049644.png)