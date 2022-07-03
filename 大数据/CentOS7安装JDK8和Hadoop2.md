# CentOS7安装JDK8和Hadoop2单机版安装&伪分布式安装

记录一下在**CentOS7**上搭建**Hadoop**环境的过程

我们先要有以下软件安装包：

![image-20220419131820985](https://cdn.fengxianhub.top/resources-master/202204191318149.png)

- centos7镜像（这里是为了用模拟器安装，有云服务器同学可以用云服务器）
- hadoop安装包
- jdk8 Linux版本安装包
- finalshell：用来连接Linux并上传数据

## 1.虚拟机安装Centos7环境(有环境的同学跳到后面)

我使用的是[VMware](https://so.csdn.net/so/search?q=VMware&spm=1001.2101.3001.7020) Workstation 16 Pro，这个的安装教程很多，大家可以自行搜索安装。
官网：https://www.vmware.com/cn/products/workstation-pro.html

>导入镜像后需要先开放网络， 首先在命令行里登录，账号是root，再敲入命令nmtui设置网络

<img src='https://i.loli.net/2021/09/18/5rDBuPR3fMQyaLb.png'>

>再在这个界面设置开放网络

<img src='https://i.loli.net/2021/09/18/UmIt6J1M8iCcal9.png'>

>选择第二个

<img src='https://i.loli.net/2021/09/18/AoyJCHaZNflEcqQ.png'>

>返回

<img src='https://i.loli.net/2021/09/18/AQucCBdGlDV47ES.png'>

> 退出

<img src='https://i.loli.net/2021/09/18/s3rfZmzgjwSEBGa.png'>

>在root模式下敲入命令行<code>ip address</code>查看开放的IP地址

<img src='https://i.loli.net/2021/09/18/i1m5xpNr2wAOz3v.png'>

> 用shell连接(这里选择finalshell，因为上传文件非常方便！！！)

![image-20220419165913559](https://cdn.fengxianhub.top/resources-master/202204191659720.png)

## 2. 配置java环境

在Linux中安装jdk有两种方式：

1. **第一种属于傻瓜式安装，一键安装即可（yum安装）；**
2. **第二种手动安装，需要自己去Oracle官网下载需要的jdk版本，然后解压并配置环境，整个过程其实很简单**

### 2.1 yum安装

>第一种，这种办法简单粗暴，就像盖伦丢技能一样。废话不多说，直接开始操作

首先执行以下命令查看可安装的jdk版本：

```java
yum -y list java*
```

![image-20220419132647623](https://cdn.fengxianhub.top/resources-master/202204191326794.png)

选一个进行安装，一般选择1.8的版本，我这里选择`java-1.8.0-openjdk-devel.x86_64`的版本

```java
yum install -y java-1.8.0-openjdk-devel.x86_64
```

然后就安装完了😁，是不是很简单

查看一下：

```java
java -version
```

![image-20220419132932494](https://cdn.fengxianhub.top/resources-master/202204191329591.png)

jdk会默认安装在`/usr/lib/jvm`目录下：

![image-20220419133622060](https://cdn.fengxianhub.top/resources-master/202204191336327.png)

这种方式的优点就是异常简单，缺点就是我们不知道我们的jdk安装在哪里去了，很多Linux的细节我们无从得知，所以我们一般学习阶段建议尝试用第二种方式安装，其实也很简单滴！

但是这样安装没有配置`JAVA_HOME`，我们需要进一步配置，不然后面安装hadoop会报错

接下来就该配置[环境变量](https://so.csdn.net/so/search?q=环境变量&spm=1001.2101.3001.7020)了，输入以下指令进行配置：

```shell
vim /etc/profile
```

没有装`vim`的同学可以用`vi /etc/profile`，只是一个文本编辑器而已

打开后`shift + G`进入末尾，按`i`进入插入模式，在文件尾部添加如下信息：

JAVA_HOME的位置你要看自己的电脑情况，不要自己copy！

```java
#set java environment
JAVA_HOME=/usr/lib/jvm/jre-1.8.0-openjdk
PATH=$PATH:$JAVA_HOME/bin
CLASSPATH=.:$JAVA_HOME/lib/dt.jar:$JAVA_HOME/lib/tools.jar
export JAVA_HOME CLASSPATH PATH
```

编辑完之后，保存并退出，然后输入以下指令，刷新环境配置使其生效：

```java
source /etc/profile
```

### 2.2 上传安装包手动安装

手动安装的好处就是可以安装到想要安装的目录下，更能加深自己的体会和对Linux文件结构的理解

首先先上传我们下载好的安装包，用`finalShell`很方便，直接拖到对应目录里就好：

![image-20220419134023931](https://cdn.fengxianhub.top/resources-master/202204191340019.png)

然后解压到我们想要放的文件夹，jdk目录需要自己手动创建，也可以叫java，名字自己随意取（见名知意），然后解压该压缩包，输入如下指令：

```sehll
tar zxvf jdk-8u321-linux-x64.tar.gz
```

解压好后就能看到了：

![image-20220419134219284](https://cdn.fengxianhub.top/resources-master/202204191342360.png)

接下来就该配置[环境变量](https://so.csdn.net/so/search?q=环境变量&spm=1001.2101.3001.7020)了，输入以下指令进行配置：

```shell
vim /etc/profile
```

没有装`vim`的同学可以用`vi /etc/profile`，只是一个文本编辑器而已

输入完毕并回车，在文件尾部添加如下信息：

```java
export JAVA_HOME=你的安装包的位置，例如我的是：/root/fengyuan-liang/jdk1.8.0_321
export CLASSPATH=$:CLASSPATH:$JAVA_HOME/lib/
export PATH=$PATH:$JAVA_HOME/bin
```

编辑完之后，然后老规矩，按一下`esc`，输入`:wq`退出vi且保存，然后输入以下指令，刷新环境配置使其生效：

```java
source /etc/profile
```

同样验证一下：

![image-20220419132932494](https://cdn.fengxianhub.top/resources-master/202204191329591.png)



## 3. 安装单机版Hadoop

有了安装java的经验，那我们安装hadoop就可以很顺畅了

### 首先解压压缩包：

```shell
tar zxvf hadoop-2.10.1.tar.gz
```

![image-20220419134943133](https://cdn.fengxianhub.top/resources-master/202204191349234.png)

然后需要检查一下hadoop看能不能用，我们先进入hadoop的目录：

```java
cd hadoop-2.10.1
```

```shell
./bin/hadoop version  
```

![image-20220419140144144](https://cdn.fengxianhub.top/resources-master/202204191401398.png)

### 配置环境变量

`vim /etc/profile`，按`i`进入插入模式，在最后加上：

```shell
#HADOOP_HOME,我的是/root/fengyuan-liang/hadoop-2.10.1
export HADOOP_HOME=你的目录/hadoop-2.10.1
export PATH=$PATH:$HADOOP_HOME/bin 
export PATH=$PATH:$HADOOP_HOME/sbin 
```

`:wq`保存并退出

### 刷新配置

```java
source /etc/profile
```

### 查看一下

```java
hadoop version
```

![image-20220419142251910](https://cdn.fengxianhub.top/resources-master/202204191422013.png)

到此单机版hadoop安装完毕！

### 更换hadoop配置文件中JavaHome

>配置成功了，但是有一点需要注意，在hadoop环境配置文件中需要将JAVA_HOME由原来${JAVA_HOME}换成具体路径，这样在集群环境中才不会出现问题

进入hadoop配置文件：

```java
vim /你的目录/hadoop-2.10.1/etc/hadoop/hadoop-env.sh
```

`shift + g`到文件最后面，增加`JAVA_HOME`

```java
export JAVA_HOME=/你的目录/jdk1.8.0_171
```

![image-20220419144347065](https://cdn.fengxianhub.top/resources-master/202204191443133.png)

### Hadoop目录结构

```css
bin 目录：存放对 Hadoop 相关服务（hdfs，yarn，mapred）进行操作的脚本
etc 目录：Hadoop 的配置文件目录，存放 Hadoop 的配置文件
lib 目录：存放 Hadoop 的本地库（对数据进行压缩解压缩功能）
sbin 目录：存放启动或停止 Hadoop 相关服务的脚本
share 目录：存放 Hadoop 的依赖 jar 包、文档、和官方案例
```

## 4. 伪分布式安装

### 4.1 修改配置文件

前面安装教程和单机模式一模一样，但是需要修改一些配置文件

>所有修改的文件都在：/你的目录/hadoop-2.10.1/etc/hadoop/ 下面，先进入目录！

![image-20220419164403087](https://cdn.fengxianhub.top/resources-master/202204191644212.png)

#### 修改core-site.xml

```xml
<configuration>
    <!-- 指定HDFS中NameNode的地址 -->	
    <property>
         <name>fs.defaultFS</name>
         <!--hadoopmaster是我的主机名，可以换成ip或localhost-->
         <value>hdfs://localhost:9000</value>
    </property>
    <property>
        <!--这个配置是将hadoop的临时目录改成自定义的目录下-->
        <name>hadoop.tmp.dir</name>
        <value>file:/usr/local/hadoop-2.10.1/data/tmp</value>
    </property>
</configuration>
```

#### 修改hdfs-site.xml

对hdfs-site.xml进行同样的替换操作，属性的含义分别为复制的块的数量、DFS管理节点的本地存储路径、DFS数据节点的本地存储路径：

```xml
<configuration>
        <property>
                <name>dfs.replication</name>
                <value>1</value>
        </property>
        <property>
                <name>dfs.namenode.name.dir</name>
                <value>file:/usr/local/hadoop/tmp/dfs/name</value>
        </property>
        <property>
                <name>dfs.datanode.data.dir</name>
                <value>file:/usr/local/hadoop/tmp/dfs/data</value>
        </property>
</configuration>
```

#### 格式化namenode

```shell
hdfs namenode -format
```

![image-20220419164510937](https://cdn.fengxianhub.top/resources-master/202204191645141.png)

### 4.2 启动

>切换到hadoop根目录下的sbin目录中

#### 启动namenode

```java
./hadoop-daemon.sh start namenode
```

![image-20220419152125904](https://cdn.fengxianhub.top/resources-master/202204191521978.png)

#### 查看namenode是否启动

>查看namenode是否启动成功，需要使用jps查看进程：
>有些Openjdk没有带上jps命令，可yum添加依赖：

先查看jdk版本：

```java
 rpm -qa|grep openjdk
```

![image-20220419152400663](https://cdn.fengxianhub.top/resources-master/202204191524737.png)

如果是1.8直接盖伦放大招：

```java
yum install -y  java-1.8.0-openjdk-devel
```

安装好就查看一下：

![image-20220419152451574](https://cdn.fengxianhub.top/resources-master/202204191524665.png)



#### 启动datanode

```java
./hadoop-daemon.sh start datanode
```

![image-20220419152547027](https://cdn.fengxianhub.top/resources-master/202204191525103.png)

jps查看是否已经启动：

![image-20220419152624096](https://cdn.fengxianhub.top/resources-master/202204191526189.png)

### 4.3 操作集群

#### 在文件系统中建立一个创建用户目录input文件夹

我这里图方便直接用root用户登录了，如果你也是root用户就把`user`改为root或者你自己定义的其他用户

```java
hadoop fs -mkdir -p /root/data/input
```

#### 查看本地目录

```java
hadoop fs -ls -R /
```

![image-20220419153033667](https://cdn.fengxianhub.top/resources-master/202204191530748.png)

#### 上传log.txt

将单机模式中的log.txt上传至Hadoop文件系统中input目录：

如果没有找到合适文件也可以创建一个文件 echo My Name is fengyuan-liang >/input/log.txt

这里的目录可以随意创建，没有必要在根目录下创建一个`input`目录，在哪里创建都可以，只要有这个文件就好了

这行命令也很简单 `echo`打印，`>`重定向，也就是把那句话打印到哪里去，`/input/log.txt`表示根目录下的input下的`log.txt`文件

我这里还是在根目录下创建了这个文件

```java
先到根目录下：cd /
创建input目录：mkdir input
将这段文字输出到指定文件中，只要文件夹存在，文件会自动生成
echo My Name is fengyuan-liang >/input/log.txt
```

![image-20220419160340916](https://cdn.fengxianhub.top/resources-master/202204191603003.png)

接下来就是把这个文件上传到我们的hadoop中了（`含有hadoop的命令都要在hadoop根目录下的sbin目录中进行`）

```java
hadoop fs -put /input/log.txt /root/data/input/	
```

查看一下

```java
hadoop fs -ls -R /
```

![image-20220419160648050](https://cdn.fengxianhub.top/resources-master/202204191606136.png)

#### 测试

>测试请切换到`hadoop-2.10.1`的安装目录下进行，我的是：`/root/fengyuan-liang/hadoop-2.10.1`

使用和单机模式一样的测试

```java
 hadoop jar share/hadoop/mapreduce/hadoop-mapreduce-examples-2.10.1.jar wordcount /root/data/input/ /root/data/output
```

输出一大段文字就表示成功了

查看结果：

```java
hadoop fs -ls -R /
```

![image-20220419161126569](https://cdn.fengxianhub.top/resources-master/202204191611686.png)

进入`sbin`目录并输出我们hadoop的输出

```java
hadoop fs -cat /root/data/output/part-r-00000
```

![image-20220419161325562](https://cdn.fengxianhub.top/resources-master/202204191613659.png)

至此伪分布模式搭建成功！

## 5 后记

熟悉Linux的同学应该知道在Linux中变量一般放在三个位置，在这三个位置里的所有变量在任何地方都可以访问到

```java
/bin
/sbin
/usr/bin or sbin
```

![image-20220419161820097](https://cdn.fengxianhub.top/resources-master/202204191618190.png)

其实都一样，我们发现我们现在每次操纵集群的时候都需要进入`hadoop根目录`下的`sbin`中，其实原因是我们只有在`sbin`目录下执行`hadoop`才能调用`hadoop`给我们提供的sh命令，如果我们想在其他地方调用，我们可以把添加一个环境变量，让我们可以在任意地方调用hadoop的命令

我们也可以通过`type`命令查看命令所在位置，例如我们常用的`sh`命令：

![image-20220419162423654](https://cdn.fengxianhub.top/resources-master/202204191624728.png)

可以看到`sh脚本`都是放到`usr/bin`之下

那我们的`hadoop的变量呢？`

![image-20220419162630621](https://cdn.fengxianhub.top/resources-master/202204191626686.png)

现在我们将其添加到环境变量中，`ln -s` 表示创建软连接，跟windows上面快捷方式一样

```java
ln -s /root/fengyuan-liang/hadoop-2.10.1/bin/hadoop /usr/local/bin/
```

![image-20220419163543069](https://cdn.fengxianhub.top/resources-master/202204191635174.png)

现在你就可以在任意文件夹下调用我们的`hadoop`的命令了

下一篇文章我们将探究如何用三台或者更多台Linux主机搭建真正意义上的分布式集群

## 参考文章

- <a href="https://blog.csdn.net/m0_53786284/article/details/120442472?ops_request_misc=%257B%2522request%255Fid%2522%253A%2522165035098516780265415628%2522%252C%2522scm%2522%253A%252220140713.130102334..%2522%257D&request_id=165035098516780265415628&biz_id=0&utm_medium=distribute.pc_search_result.none-task-blog-2~all~top_positive~default-1-120442472.142^v9^control,157^v4^control&utm_term=hadoop%E4%BC%AA%E5%88%86%E5%B8%83%E5%BC%8F%E5%AE%89%E8%A3%85&spm=1018.2226.3001.4187">Hadoop安装搭建伪分布式教程（全面）吐血整理</a>
- <a href="https://blog.csdn.net/qq_42815754/article/details/82968464?ops_request_misc=%257B%2522request%255Fid%2522%253A%2522165035834216780271538986%2522%252C%2522scm%2522%253A%252220140713.130102334..%2522%257D&request_id=165035834216780271538986&biz_id=0&utm_medium=distribute.pc_search_result.none-task-blog-2~all~top_positive~default-3-82968464.142^v9^control,157^v4^control&utm_term=Linux%E5%AE%89%E8%A3%85jdk&spm=1018.2226.3001.4187">Linux系统下安装jdk及环境配置（两种方法）</a>

