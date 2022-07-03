# Nacos安装指南



# 1.Windows安装

开发阶段采用单机安装即可。

## 1.1.下载安装包

在Nacos的GitHub页面，提供有下载链接，可以下载编译好的Nacos服务端或者源代码：

GitHub主页：https://github.com/alibaba/nacos

GitHub的Release下载页：https://github.com/alibaba/nacos/releases

如图：

![image-20210402161102887](https://cdn.fengxianhub.top/resources-master/202205142118045.png)



本课程采用1.4.1.版本的Nacos，课前资料已经准备了安装包：

![image-20210402161130261](https://cdn.fengxianhub.top/resources-master/202205142118684.png)

windows版本使用`nacos-server-1.4.1.zip`包即可。



## 1.2.解压

将这个包解压到任意非中文目录下，如图：

![image-20210402161843337](https://cdn.fengxianhub.top/resources-master/202205142118347.png)

目录说明：

- bin：启动脚本
- conf：配置文件



## 1.3.端口配置

Nacos的默认端口是8848，如果你电脑上的其它进程占用了8848端口，请先尝试关闭该进程。

**如果无法关闭占用8848端口的进程**，也可以进入nacos的conf目录，修改配置文件中的端口：

![image-20210402162008280](https://cdn.fengxianhub.top/resources-master/202205142118782.png)

修改其中的内容：

![image-20210402162251093](https://cdn.fengxianhub.top/resources-master/202205142119883.png)



## 1.4.启动

启动非常简单，进入bin目录，结构如下：

![image-20220528182414104](https://cdn.fengxianhub.top/resources-master/202205281824209.png)

然后执行命令即可：

- windows命令：

  ```
  startup.cmd -m standalone
  ```


执行后的效果如图：

![image-20220528182435346](https://cdn.fengxianhub.top/resources-master/202205281824483.png)



## 1.5.访问

在浏览器输入地址：http://127.0.0.1:8848/nacos即可：

![image-20210402162630427](https://cdn.fengxianhub.top/resources-master/202205150928865.png)

默认的账号和密码都是nacos，进入后：

![image-20210402162709515](https://cdn.fengxianhub.top/resources-master/202205150928453.png)





# 2.Linux安装

Linux或者Mac安装方式与Windows类似。

## 2.1.安装JDK

Nacos依赖于JDK运行，索引Linux上也需要安装JDK才行。

上传jdk安装包：

![image-20210402172334810](https://cdn.fengxianhub.top/resources-master/202205150927548.png)

上传到某个目录，例如：`/usr/local/`



然后解压缩：

```sh
tar -xvf jdk-8u144-linux-x64.tar.gz
```

然后重命名为java



配置环境变量：

```sh
export JAVA_HOME=/usr/local/java
export PATH=$PATH:$JAVA_HOME/bin
```

设置环境变量：

```sh
source /etc/profile
```





## 2.2.上传安装包

如图：

![image-20210402161102887](https://cdn.fengxianhub.top/resources-master/202205150927875.png)

也可以直接使用课前资料中的tar.gz：

![image-20210402161130261](https://cdn.fengxianhub.top/resources-master/202205150927895.png)

上传到Linux服务器的某个目录，例如`/usr/local/src`目录下：

![image-20210402163715580](https://cdn.fengxianhub.top/resources-master/202205150927462.png)



## 2.3.解压

命令解压缩安装包：

```sh
tar -xvf nacos-server-1.4.1.tar.gz
```

然后删除安装包：

```sh
rm -rf nacos-server-1.4.1.tar.gz
```

目录中最终样式：

![image-20210402163858429](https://cdn.fengxianhub.top/resources-master/202205150927217.png)

目录内部：

![image-20210402164414827](https://cdn.fengxianhub.top/resources-master/202205150927764.png)



## 2.4.端口配置

与windows中类似



## 2.5.启动

在nacos/bin目录中，输入命令启动Nacos：

```sh
sh startup.sh -m standalone
```



# 3. docker安装

```css
docker search nacos
docker pull nacos/nacos-server
//推荐下载稳定版
docker  pull nacos/nacos-server:1.4.1
docker run -v  --env MODE=standalone --name nacos -d -p 8848:8848 nacos/nacos-server
```



![image-20220514212855775](https://cdn.fengxianhub.top/resources-master/202205142128921.png)









# 4.Nacos的依赖

父工程：

```xml
<dependency>
    <groupId>com.alibaba.cloud</groupId>
    <artifactId>spring-cloud-alibaba-dependencies</artifactId>
    <version>2.2.5.RELEASE</version>
    <type>pom</type>
    <scope>import</scope>
</dependency>
```



客户端：

```xml
<!-- nacos客户端依赖包 -->
<dependency>
    <groupId>com.alibaba.cloud</groupId>
    <artifactId>spring-cloud-starter-alibaba-nacos-discovery</artifactId>
</dependency>

```







