# SpringBoot打包docker镜像并桥接mysql容器发布(windows版)



## docker建立桥bridge

>由于docker内的容器都是相互隔离不能通讯的，所以我们需要建立桥让容器之间可以互相通讯

思维导图：

![image-20220319104333309](https://cdn.fengxianhub.top/resources-master/202203191043378.png)

**bridge存在的意义：**

- 隔离各个容器，使得每个容器的端口号都是隔离的。如果不隔离开来，那么容器将和宿主机，容器和容器间都会发生`端口占用`的情况
- docker的桥接网络使用`虚拟网桥`，bridge网络用于同一主机上的docker容器相互通信，连接到同一个网桥的docker容器可以相互通信，当我们启动docke时，会自动创建一个默认bridge网络，除非我们进行另外的配置，新创建的容器都会自动连接到这个网络，我们也可以自定义自己的bridge网络，docker文档建议使用自定义bridge网络
- 连接到同一bridge网络的容器可以相互访问彼此任意一个端口，如果不发布端口，外界将无法访问这些容器，在创建容器时，通过-p或是--publish指令发布端口

常用命令：

- 查看所有网络：`docker network ls`
- 创建bridge网络：`docker network create -d bridge  网桥名字`
- 查看某个网络详情：`docker network inspect 网络ID`
- 删除某个网络：`docker network remove 网络id`
- 让某个镜像加入到bridge中：`docker network connect 网络id    容器名`

建立网桥，将我们需要连接的mysql容器加入，如果没有mysql容器可以通过一下命令拉取并创建一个

**拉取镜像(默认下载最新版，可以通过mysql:版本号指定版本)：**

```java
docker pull mysql
```

**创建一个mysql容器**（并指定了登录的root密码，这里设置的是a，可以自行调整）

```java
docker run  -p 3308:3306 --name testmysql -e MYSQL_ROOT_PASSWORD=a -d  mysql:8 --character-set-server=utf8mb4 --collation-server=utf8mb4_unicode_ci
```

**参看一下：**

![image-20220319084850179](https://cdn.fengxianhub.top/resources-master/202203190848246.png)

**创建一个网桥：**

![image-20220319085317029](https://cdn.fengxianhub.top/resources-master/202203190853072.png)

**查看：**

![image-20220319085347928](https://cdn.fengxianhub.top/resources-master/202203190853984.png)

**将mysql容器加入到网桥中：**

![image-20220319085550235](https://cdn.fengxianhub.top/resources-master/202203190855302.png)

记住这个ip地址，这个ip是docker容器内部访问的内部ip地址

## SpringBoot项目配置文件调整

>首先需要调整配置文件，需要调整测试`配置文件`和实际`生产环境`的配置文件

由于docker打镜像之前我们需要使用maven插件打jar包，而maven package之前又会先clear和test，所以我们需要保证所有的测试代码都是可以正常运行的，不然待会打包会出错

**修改测试类配置文件**

这里一定要特别注意！！！`测试文件测试的时候还没有被我们打成镜像，所以是通过容器外访问的，这里连接mysql的 ip和端口号应该我们从容器外面访问的`

我上面设置的是将本机的3310端口映射到容器内的3306端口，所以我这里的测试文件是这样的：

![image-20220319090625168](https://cdn.fengxianhub.top/resources-master/202203190906224.png)

弄完之后先将测试文件跑几遍，确保没有问题出现，不然后面打镜像会报错，切记

**修改生产环境的配置文件**

这里也要特别注意！！！我们最终会将项目打成镜像，会从docker容器里以内部ip和端口访问容器里的mysql容器，`所以这里我们填的ip和端口号应该是容器内部访问的`

在上面查看网桥的时候我们已经看到容器内部ip了，端口号也应该是容器内部访问的，非映射端口

所以我的配置文件是这样的：

![image-20220319091158506](https://cdn.fengxianhub.top/resources-master/202203190911558.png)



## idea增加插件

首先我们需要先将我们SpringBoot测试的start中的`vintage`引擎排除掉，`vintage`是junit5之前的测试引擎，5的换掉了，我们使用starter会默认使用junit5，注意junit的测试依赖只要加starter就可以了，不要再单独加一个junit的测试依赖

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-test</artifactId>
    <!-- vintage是junit5之前的日志引擎，5换了，所以排除掉 -->
    <exclusions>
        <exclusion>
            <groupId>org.junit.vintage</groupId>
            <artifactId>junit-vintage-engine</artifactId>
        </exclusion>
    </exclusions>
    <scope>test</scope>
</dependency>
```

然后我们需要添加两个打包插件，一个maven打包插件和一个docker打镜像插件，这里又有一个注意点，docker打镜像的插件里的`dockerfile`的路径就写Dockerfile就好，不要写带文件夹的路径，例如docker/Dockerfile，这个是这个打镜像插件1.4版本后的一个坑，实测dockerfile写带路径的地址会出错

```xml
<plugins>
    <!--用于解决boot-package no main manifest attribute,in /app.jar 错误-->
    <plugin>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-maven-plugin</artifactId>
        <executions>
            <execution>
                <goals>
                    <goal>
                        repackage
                    </goal>
                </goals>
            </execution>
        </executions>
    </plugin>
    <!-- 根据dockerfile生成docker镜像 -->
    <plugin>
        <groupId>com.spotify</groupId>
        <artifactId>dockerfile-maven-plugin</artifactId>
        <version>1.4.13</version>
        <executions>
            <execution>
                <id>default</id>
                <goals>
                    <goal>build</goal>
                    <goal>push</goal>
                </goals>
            </execution>
        </executions>
        <configuration>
            <repository>javastack/${project.name}</repository>
            <tag>${project.version}</tag>
            <buildArgs>
                <JAR_FILE>${project.build.finalName}.jar</JAR_FILE>
            </buildArgs>
            <dockerfile>Dockerfile</dockerfile>
        </configuration>
    </plugin>
</plugins>
```

## 增加Dockerfile文件

Dockerfile文件放的地方在这里，和pom.xml一级

![image-20220319092839079](https://cdn.fengxianhub.top/resources-master/202203190928138.png)

Dockerfile文件：

```css
# 添加 Java 8 镜像来源
FROM java:8

# 添加参数
ARG JAR_FILE

# 添加 Spring Boot 包
ADD target/${JAR_FILE} app.jar

# 执行启动命令  就是java启动命令
ENTRYPOINT ["java","-Dspring.profiles.active=prod","-Djava.security.egd=file:/dev/./urandom","-jar","/app.jar"]
```

解释一下：

`FROM java:8`是指这个镜像依赖于java8的环境，在打镜像的时候就会将java8的环境加到镜像中

`ARG JAR_FILE`：这个指令可以进行一些宏定义，比如我定义`ARG JAR_FILE`，会将jar文件的名字添加到下面的`${JAR_FILE}`中

`ADD target/${JAR_FILE} app.jar`：添加SpringBoot打好的jar包，并在打镜像的时候将其名称为app.jar进行打包

`ENTRYPOINT`启动命令，类似于我们java命令行启动SpringBoot项目的命令，例如我们一般启动打好的jar包会这样

```java
java -jar xxx.jar
```

有的时候我们还需要添加命令行参数指定配置文件

```java
java -jar xxx.jar -Dspring.profiles.active=prod
```

这里的`ENTRYPOINT`启动命令也就是类似作用，作为启动镜像的命令，每条命令都用双引号包裹起来，命令最后面的app.jar就是我们上一步指定的名字，我这里将启动的配置文件改成了application-prod



## docker上管理端口的暴露

我这里采用的是windows上的图像化界面	

![image-20220319094531968](https://cdn.fengxianhub.top/resources-master/202203190945080.png)

![image-20220319094621568](https://cdn.fengxianhub.top/resources-master/202203190946677.png)

## idea连接docker

先将我们idea中Service面板调出来

![image-20220319094824258](https://cdn.fengxianhub.top/resources-master/202203190948380.png)

添加连接：

![image-20220319094904158](https://cdn.fengxianhub.top/resources-master/202203190949239.png)

![image-20220319095019128](https://cdn.fengxianhub.top/resources-master/202203190950190.png)

**连接一下本地的Docker：**

![image-20220319095103402](https://cdn.fengxianhub.top/resources-master/202203190951459.png)

然后我们就可以看到我们的docker里放的镜像和容器了

![image-20220319095159737](https://cdn.fengxianhub.top/resources-master/202203190951898.png)

## 构建 Docker 镜像

直接package，插件会按照我们定义好的Dockerfile进行构建镜像，打包的过程中会下载依赖可能会比较慢，如果报错了先检查下配置文件中桥接的地址，再看下测试类是否都能通过

打好后，插件里可以看到你构建好的镜像

![image-20220319101813438](https://cdn.fengxianhub.top/resources-master/202203191018527.png)	

>现在需要生成一下容器

![image-20220319101859715](https://cdn.fengxianhub.top/resources-master/202203191018782.png)

![image-20220319101903332](https://cdn.fengxianhub.top/resources-master/202203191019398.png)



![image-20220319101944298](https://cdn.fengxianhub.top/resources-master/202203191019372.png)

>配置一下容器的端口

![image-20220319102010795](https://cdn.fengxianhub.top/resources-master/202203191020852.png)



![image-20220319102608667](https://cdn.fengxianhub.top/resources-master/202203191026757.png)

>**将容器加到网桥中**

​	idea里Service面板下面有Connection选项，可以用图形化界面进行连接，我这里用命令行连接一下

![image-20220319103435982](https://cdn.fengxianhub.top/resources-master/202203191034031.png)

查看一下，一定要将mysql容器和自己boot的容器放到一个网桥下

![image-20220319103658848](https://cdn.fengxianhub.top/resources-master/202203191036930.png)

## 测试网站

启动所有容器，然后访问网站，连接mysql容器成功！

![image-20220319104053754](https://s2.loli.net/2022/03/19/2yCTENGQxsjlm53.png)







