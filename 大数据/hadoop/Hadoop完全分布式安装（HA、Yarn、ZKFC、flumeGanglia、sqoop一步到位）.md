# Hadoop完全分布式安装（HA、Yarn、ZKFC、flume/Ganglia、sqoop一步到位）

完整拓扑图：



首先你需要有四台虚拟机，也可以是四台云服务器（笔者的是四台云服务器），这里是完全分布式，不是HA集群，后面会修改拓扑

| 主机名  | IP             | NameNode | SecondNameNode | DataNode |
| ------- | -------------- | -------- | -------------- | -------- |
| hadoop1 | 124.70.180.175 | 是       |                |          |
| hadoop2 | 121.37.176.40  |          | 是             | 是       |
| hadoop3 | 121.36.215.98  |          |                | 是       |
| hadoop4 | 123.60.58.108  |          |                | 是       |

如果使用的是虚拟机你需要：

1. <a href="https://blog.csdn.net/zhangyingchengqi/article/details/103566600">配置虚拟机启用网卡, 并设置固定IP地址（防止集群通信时IP地址变动）</a>
2. 为了上传文件到虚拟机系统中，请在centos中安装 sftp服务
3. 打开端口（或者关闭防火墙）

## 1. 基础环境安装

我们需要先安装一些基础的环境，包括：

- 时间同步（如果不同步时间，后面的很多组件会出问题！！）
- 安装jdk
- 配置 hosts文件（为了让集群正常通讯）
- 免密钥设置（为了让集群正常通讯）

### 1.1 时间同步

在这之前先更新yum（yum update），yum的镜像源也需要换成国内（自行百度）

这里建议使用`xshell`进行连接，xshell里面可以同时操作多台主机，非常方便

![image-20220630130015396](https://cdn.fengxianhub.top/resources-master/202206301300560.png)

安装ntp

```shell
yum install ntp -y
```

同步时间

```shell
ntpdate -u ntp1.aliyun.com 
```

再创建一个定时任务，用于定时同步时间（防止虚拟机停止后时间异常）

```shell
crontab  -e
0 */2 * * * /usr/sbin/ntpdate ntp1.aliyun.com 
```

修改时区

```shell
ln -sf /usr/share/zoneinfo/Asia/Shanghai /etc/localtime
```

### 1.2 安装jdk

```shell
yum install -y java-1.8.0-openjdk-devel.x86_64
```

jdk会默认安装在`/usr/lib/jvm`目录下，我们还需要配置环境变量

```shell
vim /etc/profile
```

没有装`vim`的同学可以用`vi /etc/profile`，也可以`yum install -y vim`安装，只是一个文本编辑器而已

打开后`shift + G`进入末尾，按`i`进入插入模式，在文件尾部添加如下信息：

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

### 1.3 配置 hosts文件

```shell
vim /etc/hosts
```

输入（相当于可以用hadoop1代替前面的ip）

```shell
124.70.180.175 hadoop1 
121.37.176.40 hadoop2 
123.60.58.108 hadoop3 
121.36.215.98 hadoop4 
```

在windows中的 `C:\Windows\System32\drivers\etc\hosts`中设置

```java
124.70.180.175 hadoop1 
121.37.176.40 hadoop2 
123.60.58.108 hadoop3 
121.36.215.98 hadoop4 
```

### 1.4 修改主机名 

```java
vi /etc/hostname
```

依次填入对应的主机，重启系统就可以显示出来

### 1.5 免密钥设置

这一步非常重要，如果不设置后面集群通信会失败

我们先产生本机的RSA密钥

```java
ssh-keygen -t rsa -P '' -f    ~/.ssh/id_rsa
```

密钥产生后会出现在` ~/.ssh/id_rsa`目录中

![image-20220630131646251](https://cdn.fengxianhub.top/resources-master/202206301316296.png)

解释一下这三个文件：

- **authorized_keys**：就是为了让不同机器之间使用ssh不需要用户名和密码。采用了数字签名[RSA](https://so.csdn.net/so/search?q=RSA&spm=1001.2101.3001.7020)或者DSA来完成这个操作，我们只需要将其他机器的id_rsa.pub放到此目录下，其他机器ssh访问本机器时就不需要账号密码了
- **id_rsa**：即RSA算法生成的私钥
- **id_rsa.pub**：即RSA算法生成的公钥（上面有密钥和最后面的用户标识）

我们需要将将不同主机的公钥和自己的公钥放到本机中受信列表中（authorized_keys）

```shell
cat ~/.ssh/id_rsa.pub >> ~/.ssh/authorized_keys //添加自己的，试下自己登录自己是否免密
```

将主机1（hadoop1）的公钥添加到其他三台主机的authorized_keys中

同理每台主机都应该有其他三台主机的id_rsa.pub，加上自己的（弄好一个复制就行），应该有四个，笔者这里还加上了Windows上的，在`~/.ssh`目录下

![image-20220630152239080](https://cdn.fengxianhub.top/resources-master/202206301522153.png)

添加之后看能不能面密码登录其他主机：

![image-20220630152729453](https://cdn.fengxianhub.top/resources-master/202206301527503.png)



## 2. hadoop完全分布式安装

我们将hadoop上传到服务器（四台）的`/usr/local`目录下（笔者上传的是2.10.1的，读者可以上传3版本的）

或者在Linux机器中用wget，下载源是清华大学镜像源

```java
wget https://mirrors.tuna.tsinghua.edu.cn/apache/hadoop/common/hadoop-2.10.1/hadoop-2.10.1.tar.gz
```

之后解压并删除掉安装包（以下命令在四台主机间同步执行）

```shell
tar -zvxf hadoop-2.10.1.tar.gz && rm -rf hadoop-2.10.1.tar.gz
```

添加hadoop的环境变量

```shell
vim /etc/profile
```

这里在对应位置添加即可，不要依葫芦画瓢

```shell
#set java environment
JAVA_HOME=/usr/lib/jvm/jre-1.8.0-openjdk
#set hadoop environment
HADOOP_HOME=/usr/local/hadoop-2.10.1
#set path
PATH=$PATH:$JAVA_HOME/bin:$HADOOP_HOME/bin:$HADOOP_HOME/sbin
#set classpath
CLASSPATH=.:$JAVA_HOME/lib/dt.jar:$JAVA_HOME/lib/tools.jar
export JAVA_HOME CLASSPATH PATH HADOOP_HOME
```

刷新环境变量`source /etc/profile`后使用`hadoop version`查看

![image-20220630154649631](https://cdn.fengxianhub.top/resources-master/202206301546684.png)

 接下来在`/usr/local/hadoop-2.10.1/etc/hadoop/hadoop-env.sh`中配置JAVA_HOME，这一步也非常重要，不配会出错

注意是修改不是添加，原本就有

```shell
export JAVA_HOME=/usr/lib/jvm/jre-1.8.0-openjdk/
```

配置两个核心配置文件

- core-site.xml
- hdfs-site.xml

设置core-site.xml，这里设置了hadoop1主机为master结点，9000端口标识的是函数编程接口，并将自己的`/opt/hadoopdata`设置为文件存储的地址

```xml
<property> 
	<name>fs.defaultFS</name> 
	<value>hdfs://hadoop1:9000/</value> 
 </property> 
<property> 
	<name>hadoop.tmp.dir</name>
	<value>/opt/hadoopdata</value> 
 </property> 
```

设置hdfs-site.xml，设置集群之间文件备份的副本数为3份，下面的端口标识可以通过50090端口访问hadoop的web管理端口

```xml
 <property>
        <name>dfs.replication</name>
        <value>3</value>
</property>
 <property>
        <name>dfs.namenode.secondary.http-address</name>
        <value>hadoop2:50090</value>
</property>
```

在`/etc/hadoop/slaves` 中 指定 三台 DN（datanode）

```java
hadoop2
hadoop3
hadoop4
```

手动创建masters文件,  指定 SNN（即secondNameNode、如不指定，则namenode所在的机器为 snn）

格式化 NN（namenode，这里值格式化hadoop1）

```java
hdfs namenode -format
```

开启端口50070和9000，如果是虚拟机可以关闭防火墙，如果是云服务器请打开安全组

```java
systemctl status firewalld.service //查看防火墙状态
systemctl stop firewalld.service    //关闭运行的防火墙
systemctl disable firewalld.service //禁止防火墙服务器
```

打开指定端口（例如在防火墙中打开8080端口）

```java
firewall-cmd --zone=public --add-port=8080/tcp --permanent
firewall-cmd --reload
firewall-cmd --list-port     #查看开放的端口列表
```

 启动hadoop集群，在hadoop1上，即namenode上

```shell
start-all.sh
```

使用jps查看任务情况

![image-20220630162033042](https://cdn.fengxianhub.top/resources-master/202206301620091.png)

>有些Openjdk没有带上jps命令，可yum添加依赖

```java
yum install -y  java-1.8.0-openjdk-devel
```

访问网页

<img src="https://cdn.fengxianhub.top/resources-master/202206301620464.png" alt="image-20220630162009378" style="zoom:67%;" />

## 3. hadoop HA高可用集群搭建

上面的集群只有一个namenode，一旦namenode崩溃，整个集群就会处于不可用的状态，所以我们需要搭建HA集群，配置两个namenode

拓扑图：

![image-20220630162410980](https://cdn.fengxianhub.top/resources-master/202206301624052.png)

### 3.1 安装zookeeper

上传zookeeper 3.3.6到  `/usr/local`（分别上传到四台主机，读者可以上传新的版本）

![image-20220630162842387](https://cdn.fengxianhub.top/resources-master/202206301628444.png)

解压

```shell
tar -zvxf zookeeper-3.3.6.tar.gz && rm -rf zookeeper-3.3.6.tar.gz
```

重命名   

```shell
mv zookeeper-3.3.6 zk336
```

配置环境变量 `/etc/profile`

```shell
#set java environment
JAVA_HOME=/usr/lib/jvm/jre-1.8.0-openjdk
#set hadoop environment
HADOOP_HOME=/usr/local/hadoop333
#set Zookeeper enviroment
ZOOKEEPER_HOME=/usr/local/zk336
#set path
PATH=$PATH:$JAVA_HOME/bin:$HADOOP_HOME/bin:$HADOOP_HOME/sbin:$ZOOKEEPER_HOME/bin
#set classpath
CLASSPATH=.:$JAVA_HOME/lib/dt.jar:$JAVA_HOME/lib/tools.jar
export JAVA_HOME CLASSPATH PATH HADOOP_HOME ZOOKEEPER_HOME
```

刷新环境变量

```shell
source /etc/profile
```

修改配置文件` /usr/local/zk336/conf/zoo.cfg`

```shell
cp zoo_sample.cfg zoo.cfg
```

注意：请添加的时候不要带中文，会出现问题，请复制下面不带中文的版本

```shell
tickTime=2000   #zk工作的基本单位时间  ms
dataDir=/opt/zookeeper
clientPort=2181
#配置初始化时间(leader被选举出来的时候)连接时，leader和follower最小的心跳时间(连接时间).如果超过这个时间
#有一半以上的follower与leader已连接，此时leader被选出来了。 5*2000ms
initLimit=5
#配置leader与follower之间请求和应答的最长时间 2*2000
syncLimit=2
#server.X=A:B:C    X代表server序号   A代表主机名    B:代表follower与leader通信端口    c:代表选举leader端口
server.1=hadoop1:2888:3888
server.2=hadoop2:2888:3888
server.3=hadoop3:2888:3888
```

```shell
tickTime=2000
dataDir=/opt/zookeeper
clientPort=2181
initLimit=5
syncLimit=2
server.1=hadoop1:2888:3888
server.2=hadoop2:2888:3888
server.3=hadoop3:2888:3888
```

在 `dataDir` （/opt/zookeeper）指定的目录中创建一个  myid  文件，写入这台服务器的id ,即上面  zoo.cfg中的  server后面的数字

```shell
mkdir zookeeper
vi myid 
分别输入 1 2 3 
```

开放端口（2181、2888、3888）并在三台主机上启动

```java
zkServer.sh start
```

`zkServer.sh start`查看结点状态

![image-20220630170059058](https://cdn.fengxianhub.top/resources-master/202206301700125.png)

### 3.2 配置HA配置文件

先关闭集群

```java
stop-all.sh
```

删除掉每台结点的`masters`文件，因为现在master不能直接指定，需要依靠Zookeeper指定

删除原来的  `/opt/hadoopdata` 目录，要重新格式化

修改core-site.xml

- 这里的  lfy   是一个服务名， 因为用了HA机制，  这个名字即不能是node1,也不能是node2
- 保证每台服务器    `/opt/hadoopdata`   目录为空,   这个目录将来是  namenode, datanode, journalnode等存数据的公共目录 

```xml
<property>
   <name>fs.defaultFS</name>
    <!--这里的值指的是默认的HDFS路径，该值来自hdfs-site.xml文件中的配置项，由于只能有一个Namenode所在主机名被HDFS集群使用，因此这里即不能是master又不能是master0，我们先选择一个配置名称为lfy,而不是具体的某一个Namenode的主机地址，关于ns1将在后续hdfs-site.xml配置文件中进行具体说明-->	
   <value>hdfs://lfy</value>
</property>
<property>
   <name>hadoop.tmp.dir</name>
   <value>/opt/hadoopdata</value>
</property>
<property>
    <name>ha.zookeeper.quorum</name>
    <value>hadoop1:2181,hadoop2:2181,hadoop3:2181</value>
</property>
```

修改hdfs-site.xml

```xml
<configuration>
     	<property>
        		<name>dfs.replication</name>
        		<value>3</value>
     	</property>
    	<!--权限配置， 可以控制各用户之间的权限，这里先关掉 -->
        <property>
        		<name>dfs.permissions</name>
        		<value>false</value>
        </property>
        <property>
                <name>dfs.permissions.enabled</name>
                <value>false</value>
        </property>
    	<!-- 与前面core-site.xml中一样 -->
        <property>
                <name>dfs.nameservices</name>
                <value>lfy</value>
        </property>
    	<!-- 两个namenode的逻辑名 -->
        <property>
                <name>dfs.ha.namenodes.lfy</name>
                <value>nn1,nn2</value>
        </property>
    	<!-- 这是client访问HDFS的RPC请求的端口，及函数编程端口，之前是9000 -->
        <property>
                <name>dfs.namenode.rpc-address.lfy.nn1</name>
                <value>hadoop1:8020</value>
        </property>
        <property>
                <name>dfs.namenode.rpc-address.lfy.nn2</name>
                <value>hadoop2:8020</value>
        </property>
        <property>
                <name>ipc.client.connect.max.retries</name>
                <value>100</value>
        </property>
        <property>
              <name>ipc.client.connect.retry.interval</name>
              <value>10000</value>
        </property>
    	<!-- web管理端口 -->
        <property>
                <name>dfs.namenode.http-address.lfy.nn1</name>
                 <value>hadoop1:50070</value>
        </property>
        <property>
                <name>dfs.namenode.http-address.lfy.nn2</name>
                <value>hadoop2:50070</value>
        </property>
    	<!-- 它是hadoop自带的共享存储系统，主要用于两个namenode间数据的共享和同步，即指定 lfy 下的两个nn共享edits文件目录时，使用jn集群信息  -->
        <property>
                <name>dfs.namenode.shared.edits.dir</name>
             	<value>qjournal://hadoop2:8485;hadoop3:8485;hadoop4:8485/lfy</value>
        </property>
    	<!-- 自动故障迁移负责执行的类 -->
        <property>
                <name>dfs.client.failover.proxy.provider.lfy</name>
                <value>org.apache.hadoop.hdfs.server.namenode.ha.ConfiguredFailoverProxyProvider</value>
        </property>
    	<!-- 需要nn切换时，使用sshfence方式，所以要配置免密钥 -->
        <property>
                <name>dfs.ha.fencing.methods</name>
                <value>sshfence</value>
        </property>
        <property>
                <name>dfs.ha.fencing.ssh.private-key-files</name>
                <value>/root/.ssh/id_rsa</value>
        </property>
    	<!-- 指定jn集群对nn的目录进行共享时，自己存储数据的磁盘路径，它会生成一个journal目录到此位置 -->
        <property>
                <name>dfs.journalnode.edits.dir</name>
                <value>/opt/journal/node/local/data</value>
        </property>
    	<!-- 自动故障转移 -->
        <property>
                <name>dfs.ha.automatic-failover.enabled</name>
                <value>true</value>
        </property>
</configuration>
```

配置  automatic failover（自动故障转移）

hdfs-site.xml中的最后一行已经加入了这个配置

```java
<!-- 自动故障转移 -->
<property>
    <name>dfs.ha.automatic-failover.enabled</name>
    <value>true</value>
</property>
```

在core-site.xml 中加入配置

```java
<property>
   <name>ha.zookeeper.quorum</name>
   <value>hadoop1:2181,hadoop2:2181,hadoop3:2181</value>
</property>
```

开放端口8020（HA集群结点函数编程端口）、8485（JN通信端口）

在hadoop2、3、4上启动journalnode

```css
hadoop-daemon.sh start journalnode
```

>下面的步骤有个大坑，就是如果你是云服务器搭建的集群，请将地址改为内网地址！再在hdfs-size.xml配置文件中添加
>
>http://www.javashuo.com/article/p-fdpavfhx-be.html
>
>```xml
><!-- 若是是经过公网IP访问阿里云上内网搭建的集群 -->
><property>
>    <name>dfs.client.use.datanode.hostname</name>
>    <value>true</value>
>    <description>only cofig in clients</description>
></property>
>```

```java
java.net.SocketException: Call From lfy to null:0 failed on socket exception: java.net.SocketException: Unresolved address; For more details see:  http://wiki.apache.org/hadoop/SocketException
	at sun.reflect.NativeConstructorAccessorImpl.newInstance0(Native Method)
	at sun.reflect.NativeConstructorAccessorImpl.newInstance(NativeConstructorAccessorImpl.java:62)
	at sun.reflect.DelegatingConstructorAccessorImpl.newInstance(DelegatingConstructorAccessorImpl.java:45)
	at java.lang.reflect.Constructor.newInstance(Constructor.java:423)
	at org.apache.hadoop.net.NetUtils.wrapWithMessage(NetUtils.java:827)
	at org.apache.hadoop.net.NetUtils.wrapException(NetUtils.java:800)
	at org.apache.hadoop.ipc.Server.bind(Server.java:623)
	at org.apache.hadoop.ipc.Server$Listener.<init>(Server.java:1189)
	at org.apache.hadoop.ipc.Server.<init>(Server.java:3004)
	at org.apache.hadoop.ipc.RPC$Server.<init>(RPC.java:1003)
	at org.apache.hadoop.ipc.ProtobufRpcEngine$Server.<init>(ProtobufRpcEngine.java:425)
	at org.apache.hadoop.ipc.ProtobufRpcEngine.getServer(ProtobufRpcEngine.java:346)
	at org.apache.hadoop.ipc.RPC$Builder.build(RPC.java:844)
	at org.apache.hadoop.hdfs.server.namenode.NameNodeRpcServer.<init>(NameNodeRpcServer.java:449)
	at org.apache.hadoop.hdfs.server.namenode.NameNode.createRpcServer(NameNode.java:811)
	at org.apache.hadoop.hdfs.server.namenode.NameNode.initialize(NameNode.java:738)
	at org.apache.hadoop.hdfs.server.namenode.NameNode.<init>(NameNode.java:961)
	at org.apache.hadoop.hdfs.server.namenode.NameNode.<init>(NameNode.java:940)
	at org.apache.hadoop.hdfs.server.namenode.NameNode.createNameNode(NameNode.java:1714)
```

在一台namenode( namenode1或namenode2)中执行格式化命令，然后启动

```css
hdfs namenode -format
```

```css
hadoop-daemon.sh start namenode
```

在另一台namenode上同步数据

在没有格式化的nn上执行  （只有一台哦，别全部执行了）

```css
hdfs namenode -bootstrapStandby
```

格式化 zk，在一台NN上执行

```css
hdfs zkfc -formatZK
```

测试zk是否成功格式，且启动，格式化zk的目的是在zk上建立HA的hadoop-ha节点，这是zk注册HA的znode,,通过zk集群监控两个NN的实时状态，如果ActivenameNode宕机，则通过zk通知standbyNameNode准备切换为Active状态. 

```css
zkCli.sh   -server   hadoop1:2181
```

正常情况下可以就会启动成功

![image-20220630173334848](https://cdn.fengxianhub.top/resources-master/202206301733933.png)

启动所有服务，在hadoop1上面输入

```css
start-all.sh 
```

用jps命令检查一下各服务启动的情况（那个wrapperSimpleApp不是的）

如果没有启动zkFC  `hadoop-daemon.sh start zkfc`

![image-20220630231845189](https://cdn.fengxianhub.top/resources-master/202206302318568.png)

访问网页界面

```css
http://hadoop1:50070
http://hadoop2:50070
```

## 4.配置YARN(单节的resousemanager)

**以下只需要在hadoop1上配置即可**

修改  etc/hadoop/mapred-site.xml

```java
mv mapred-site.xml.template mapred-site.xml
vim  mapred-site.xml
```

```xml
<configuration>
    <property>
        <name>mapreduce.framework.name</name>
        <value>yarn</value>
    </property>
</configuration> 
```

修改etc/hadoop/yarn-site.xml:

```xml
<configuration>
    <property>
        <name>yarn.nodemanager.aux-services</name>
        <value>mapreduce_shuffle</value>
    </property>
</configuration>
```

至此，yarn就配好了，下面我们可以启动yarn集群，并查看nodemanager

1. 启动
   	start-yarn.sh
   		启动后，可以观察到  node2,3,4上都有nodemanager进程了，这是因为 datanode默认就是nodemanager

2. 关闭
	stop-yarn.sh

3. web UI
	http://hadoop1:8088/

以上配置完成后，可以看到只有一个 ResourceManager，会有单点故障的问题. 所以接下来完成HA配置. 	

### 4.2 对Resource Manager做HA配置

在yarn-site.xml中加入以下配置

```java
<property>
   <name>yarn.resourcemanager.ha.enabled</name>
   <value>true</value>
 </property>
 <property>
   <name>yarn.resourcemanager.cluster-id</name>
   <value>yc2yarn</value>
 </property>
 <property>
   <name>yarn.resourcemanager.ha.rm-ids</name>
   <value>rm1,rm2</value>
 </property>
 <property>
   <name>yarn.resourcemanager.hostname.rm1</name>
   <value>node3</value>
 </property>
 <property>
   <name>yarn.resourcemanager.hostname.rm2</name>
   <value>node4</value>
 </property>
 <property>
   <name>yarn.resourcemanager.zk-address</name>
   <value>node1:2181,node2:2181,node3:2181</value>
 </property>
```

### 4.3 启动集群

确保zk先启动（node1和node2结点），如果没有启动先启动

```css
zkServer.sh start
```

在node1上启动所有结点：`start-all.sh`

## 5. flume安装

>注意：这里建议下载1.9版本，不然会出现后面Ganglia监控不到的情况

```shell
#下载地址
http://archive.apache.org/dist/flume/
#下载文件解压，上传至服务器目录 /usr/local/ 下
$ wget http://archive.apache.org/dist/flume/
#将flume/conf下的flume-env.sh.template文件修改为flume-env.sh，并配置flume-env.sh文件
$ mv flume-env.sh.template flume-env.sh
$ vim flume-env.sh
    export JAVA_HOME=/usr/java/jdk8
    
#Flume要想将数据输出到HDFS，必须持有Hadoop相关jar包
    commons-configuration-1.6.jar、
    hadoop-auth-2.7.2.jar、
    hadoop-common-2.7.2.jar、
    hadoop-hdfs-2.7.2.jar、
    commons-io-2.4.jar、
    htrace-core-3.1.0-incubating.jar
    #拷贝到/flume190/lib文件夹下。
```

## 6. httpd /Ganglia安装（编译安装）

**系统环境：** centos7

**Ganglia版本：** ganglia-3.7.2

Ganglia要有三个组件才能启动，分别是gmetad、gmond和httpd，其中gmond是用来采集系统数据的、gmetad是服务端，负责收集各个结点的数据，httpd 是一个web工具，用来想用户展示工具

根据我们的拓扑图我们应该在node3上面装`gmetad和httpd`，在其他结点（node1、2、4）上面装`gmond`即可

### 服务端监控（安装gmetad和httpd）

**安装gemtad**

这个就按照下述步骤一步一步来就好了，重点是，看提示，一定要看每一步都执行成功没有，看有没有error ：

```shell
[root@localhost ~]# yum -y install apr-devel apr-util check-devel cairo-devel pango-devel libxml2-devel rpm-build glib2-devel dbus-devel freetype-devel fontconfig-devel gcc gcc-c++ expat-devel python-devel libXrender-devel

[root@localhost ~]# yum install -y libart_lgpl-devel pcre-devel libtool

[root@localhost ~]# yum install  -y rrdtool rrdtool-devel
#创建文件夹
    [root@localhost ~]# mkdir /tools
#单纯为了看看创建成功没有
[root@localhost ~]# cd  /tools/

[root@localhost ~]# wget http://www.mirrorservice.org/sites/download.savannah.gnu.org/releases/confuse/confuse-2.7.tar.gz 

[root@localhost ~]# tar zxvf confuse-2.7.tar.gz

[root@localhost ~]# cd confuse-2.7

[root@localhost ~]# ./configure  --prefix=/usr/local/ganglia-tools/confuse CFLAGS=-fPIC --disable-nls --libdir=/usr/local/ganglia-tools/confuse/lib64

[root@localhost ~]# make && make install

[root@localhost ~]# cd /tools/

[root@localhost ~]# wget https://sourceforge.net/projects/ganglia/files/ganglia%20monitoring%20core/3.7.2/ganglia-3.7.2.tar.gz  --no-check-certificate

[root@localhost ~]# tar zxf ganglia-3.7.2.tar.gz

[root@localhost ~]# cd ganglia-3.7.2
#编译     enable-gexec是gmond节点
[root@localhost ~]# ./configure --prefix=/usr/local/ganglia --enable-gexec --enable-status --with-gmetad --with-libconfuse=/usr/local/ganglia-tools/confuse  

[root@localhost ~]# make && make install

[root@localhost ~]# cp gmetad/gmetad.init /etc/init.d/gmetad

[root@localhost ~]# ln -s /usr/local/ganglia/sbin/gmetad /usr/sbin/gmetad
```

`遇到问题：` 当我们下载一个资源时下载不成功，会被当成爬虫拦截掉，下面截图只是一个代表，遇到类似的都可以通过下述方式解决

![image-20220626095251653](https://my-typroa-photos.oss-cn-guangzhou.aliyuncs.com/images/image-20220626095251653.png)

**解决方法：**  在自己的命令后面 拼接上 `--no-check-certificate`     意思是不要网站检查，举个例子：

```shell
wget https://sourceforge.net/projects/ganglia/files/ganglia-web/3.7.2/ganglia-web-3.7.2.tar.gz   --no-check-certificate
```

**安装gweb**

还是一样，照着做，就行，注意一下上面提到的问题，如果被拦截，就加--no-check-certificate  

```shell
[root@localhost x86_64]# yum install httpd httpd-devel php -y
[root@localhost x86_64]# yum -y install rsync
[root@localhost x86_64]# cd /tools/
[root@localhost tools]# wget https://sourceforge.net/projects/ganglia/files/ganglia-web/3.7.2/ganglia-web-3.7.2.tar.gz --no-check-certificate
[root@localhost tools]# tar zxvf /tools/ganglia-web-3.7.2.tar.gz -C /var/www/html/
#这个目录很重要，记下来，等会儿要用
[root@localhost tools]# cd /var/www/html/
#重命名
[root@localhost html]# mv ganglia-web-3.7.2 ganglia
[root@localhost html]# cd /var/www/html/ganglia/
#创建了一个用户
[root@localhost ganglia]# useradd -M -s /sbin/nologin www-data
#执行这步，会创建相关的目录
[root@localhost ganglia]# make install  
#修改权限
[root@localhost ganglia]# chown apache:apache -R /var/lib/ganglia-web/
```

**修改启动脚本**

就是修改一个文件，ganglia默认的位置不是下述的样子，因为我们是编译安装，位置是自己定的

```shell
[root@localhost ganglia]# vi /etc/init.d/gmetad
GMETAD=/usr/sbin/gmetad  #这句话可以自行更改gmetad的命令，当然也能向我们前面做了软连接
start() {
    [ -f /usr/local/ganglia/etc/gmetad.conf  ] || exit 6  #这里将配置文件改成现在的位置，不然启动没反应
```

![image-20220626100800222](https://my-typroa-photos.oss-cn-guangzhou.aliyuncs.com/images/image-20220626100800222.png)

**修改gmetad配置文件**

因为我们这里就先让它当一个单纯的gweb节点和gmetad节点，不给其启动gmond服务，假设它没有再哪个多播集群里

```shell
[root@localhost ganglia]# vi /usr/local/ganglia/etc/gmetad.conf
#这个是文件里面的东西，IP是自己的，得换，因为我要装在两个节点上，所以我的写两个，根据自己的情况来，没法统一  #这也是我们以后经常修改的地方，""里面是组名称  后面是去哪个IP的那个端口去采集gmond数据，我这里做了hosts映射，可以用主机名代替ip地址
data_source "my cluster" hadoop3:8649

#修改web界面时间
$ cd /var/www/html/ganglia
$ vim header.php
    <?php
    session_start();
    ini_set('date.timezone','PRC');  #加入这条
```

![image-20220626101405564](https://my-typroa-photos.oss-cn-guangzhou.aliyuncs.com/images/image-20220626101405564.png)

**修改配置文件/etc/httpd/conf.d/ganglia.conf**

这里就需要步骤5中记住的那个东西了--/var/www/html/

```shell
cd  /etc/httpd/conf.d/
# 看看有没有ganglia.conf，如果没装错，就应该有
ll  
#没有vim 的就用vi
vim /etc/httpd/conf.d/ganglia.conf
```

添加如下配置：

```shell
# Ganglia monitoring system php web frontend
Alias /ganglia /var/www/html/ganglia
<Location /ganglia>
  Order deny,allow
  Deny from all
  Allow from all
  # Allow from 127.0.0.1
  # Allow from ::1
  # Allow from .example.com
</Location>
```

![image-20220626102123055](https://my-typroa-photos.oss-cn-guangzhou.aliyuncs.com/images/image-20220626102123055.png)

### 客户端安装（gmond）

客户端只需要安装gmond即可

```shell
$ yum -y install apr-devel apr-util check-devel cairo-devel pango-devel libxml2-devel rpm-build glib2-devel dbus-devel freetype-devel fontconfig-devel gcc gcc-c++ expat-devel python-devel libXrender-devel

$ yum install -y libart_lgpl-devel pcre-devel libtool
$ mkdir /usr/local/tools
$ cd /usr/local/tools
$ wget http://www.mirrorservice.org/sites/download.savannah.gnu.org/releases/confuse/confuse-2.7.tar.gz
$ tar zxvf confuse-2.7.tar.gz
$ cd confuse-2.7
$ ./configure  --prefix=/usr/local/ganglia-tools/confuse CFLAGS=-fPIC --disable-nls --libdir=/usr/local/ganglia-tools/confuse/lib64
$ make && make install
$ cd /usr/local/tools
$ wget https://sourceforge.net/projects/ganglia/files/ganglia%20monitoring%20core/3.7.2/ganglia-3.7.2.tar.gz
$ tar zxvf ganglia-3.7.2.tar.gz
$ cd ganglia-3.7.2
$ ./configure --prefix=/usr/local/ganglia --enable-gexec --enable-status  --with-libconfuse=/usr/local/ganglia-tools/confuse
$ make && make install
$ /usr/local/ganglia/sbin/gmond -t >/usr/local/ganglia/etc/gmond.conf
$ cp /tools/ganglia-3.7.2/gmond/gmond.init /etc/init.d/gmond
$ mkdir -p /usr/local/ganglia/var/run
$ /etc/init.d/gmond restart
```

**启动**

```shell
#服务端启动
$ systemctl restart httpd
$ systemctl start gmetad 
$ systemctl start gmond

#客户端启动
$ systemctl start gmond
```

**flume运行命令**

需要指定flume要监听的日志

```shell
$ nohup flume-ng agent --conf conf/ --conf-file /usr/local/flume/jobs/cloudDiskLog/cloudDiskLogs-hdfs.conf --name d2 -Dflume.monitoring.type=ganglia -Dflume.monitoring.hosts=172.168.0.10:8649 &
```

## 7. azkaban安装

将Azkaban Web服务器、Azkaban执行服务器、Azkaban的sql执行脚本及MySQL安装包拷贝到`master`虚拟机/user/local/azkaban目录下

**安装**

```shell
#解压路径下的安装包
$ tar -xvf azkaban-executor-server-2.5.0.tar.gz
$ tar -xvf azkaban-sql-script-2.5.0.tar.gz
$ tar -xvf azkaban-web-server-2.5.0.tar.gz

#对解压后的文件改名
$ mv azkaban-web-2.5.0/ web
$ mv azkaban-executor-2.5.0/ executor

#azkaban脚本导入 进入mysql，创建azkaban数据库，并将解压的脚本导入到azkaban数据库
$ mysql -uroot -p
$ mysql> create database azkaban;
$ mysql> use azkaban;
$ mysql> source /usr/local/azkaban/azkaban-2.5.0/create-all-sql-2.5.0.sql

```

**生成密钥库**

- Keytool是java数据证书的管理工具，使用户能够管理自己的公/私钥对及相关证书。
- -keystore 指定密钥库的名称及位置(产生的各类信息将不在.keystore文件中)
- -genkey 在用户主目录中创建一个默认文件".keystore"
- -alias 对我们生成的.keystore 进行指认别名；如果没有默认是mykey
- -keyalg 指定密钥的算法 RSA/DSA 默认是DSA

```shell
#生成 keystore的密码及相应信息的密钥库
$ keytool -keystore keystore -alias jetty -genkey -keyalg RSA
What is your first and last name?
  [Unknown]:  zhulin
What is the name of your organizational unit?
  [Unknown]:  hnit
What is the name of your organization?
  [Unknown]:  hnit
What is the name of your City or Locality?
  [Unknown]:  hy
What is the name of your State or Province?
  [Unknown]:  ch
What is the two-letter country code for this unit?
  [Unknown]:  ch
Is CN=zhulin, OU=hnit, O=hnit, L=hy, ST=ch, C=ch correct?
  [no]:  y
Enter key password for <jetty>
    (RETURN if same as keystore password):  
Re-enter new password:
#注意：
#密钥库的密码至少必须6个字符，可以是纯数字或者字母或者数字和字母的组合等等
#密钥库的密码最好和<jetty> 的密钥相同，方便记忆

#将keystore 拷贝到 azkaban web服务器根目录中
$ mv keystore web/
```

**时间同步配置**

```shell
#先配置好服务器节点上的时区
#如果在/usr/share/zoneinfo/这个目录下不存在时区配置文件Asia/Shanghai，就要用 tzselect 生成。
$ tzselect
Please identify a location so that time zone rules can be set correctly.
Please select a continent or ocean.
 1) Africa
 2) Americas
 3) Antarctica
 4) Arctic Ocean
 5) Asia
 6) Atlantic Ocean
 7) Australia
 8) Europe
 9) Indian Ocean
10) Pacific Ocean
11) none - I want to specify the time zone using the Posix TZ format.
#? 5
Please select a country.
 1) Afghanistan          18) Israel            35) Palestine
 2) Armenia          19) Japan            36) Philippines
 3) Azerbaijan          20) Jordan            37) Qatar
 4) Bahrain          21) Kazakhstan        38) Russia
 5) Bangladesh          22) Korea (North)        39) Saudi Arabia
 6) Bhutan          23) Korea (South)        40) Singapore
 7) Brunei          24) Kuwait            41) Sri Lanka
 8) Cambodia          25) Kyrgyzstan        42) Syria
 9) China          26) Laos            43) Taiwan
10) Cyprus          27) Lebanon            44) Tajikistan
11) East Timor          28) Macau            45) Thailand
12) Georgia          29) Malaysia            46) Turkmenistan
13) Hong Kong          30) Mongolia            47) United Arab Emirates
14) India          31) Myanmar (Burma)        48) Uzbekistan
15) Indonesia          32) Nepal            49) Vietnam
16) Iran          33) Oman            50) Yemen
17) Iraq          34) Pakistan
#? 9
Please select one of the following time zone regions.
1) Beijing Time
2) Xinjiang Time
#? 1

The following information has been given:

    China
    Beijing Time

Therefore TZ='Asia/Shanghai' will be used.
Local time is now:    Thu Jun 30 09:27:16 CST 2022.
Universal Time is now:    Thu Jun 30 01:27:16 UTC 2022.
Is the above information OK?
1) Yes
2) No
#? 1

You can make this change permanent for yourself by appending the line
    TZ='Asia/Shanghai'; export TZ
to the file '.profile' in your home directory; then log out and log in again.

Here is that TZ value again, this time on standard output so that you
can use the /usr/bin/tzselect command in shell scripts:
Asia/Shanghai

#拷贝该时区文件，覆盖系统本地时区配置
$ cp /usr/share/zoneinfo/Asia/Shanghai /etc/localtime
#集群时间同步（同时发给三个窗口）
$ sudo date -s '2018-10-18 16:39:30'

```

**配置文件**

**Web服务器配置**

```shell
#进入azkaban web服务器安装目录 conf目录，打开azkaban.properties文件
$ cd /usr/local/azbakan/web/conf/
$ vim azkaban.properties

#按照如下配置修改azkaban.properties文件。
    ##Azkaban Personalization Settings
    ##服务器UI名称,用于服务器上方显示的名字
    azkaban.name=Test
    ##描述
    azkaban.label=My Local Azkaban
    ##UI颜色
    azkaban.color=#FF3601
    azkaban.default.servlet.path=/index
    ##默认web server存放web文件的目录
    web.resource.dir=/usr/local/azkaban/web/web/
    ##默认时区,已改为亚洲/上海 默认为美国
    default.timezone.id=Asia/Shanghai

    ##Azkaban UserManager class
    user.manager.class=azkaban.user.XmlUserManager
    ##用户权限管理默认类（绝对路径）
    user.manager.xml.file=/usr/local/azkaban/web/conf/azkaban-users.xml

    ##Loader for projects
    ##global配置文件所在位置（绝对路径）
    executor.global.properties=/usr/local/azkaban/executor/conf/global.properties
    azkaban.project.dir=projects

    ##数据库类型
    database.type=mysql
    ##端口号
    mysql.port=3306
    ##数据库连接IP
    mysql.host=node1
    ##数据库实例名
    mysql.database=azkaban?useSSL=false&serverTimezone=UTC&characterEncoding=utf-8
    ##数据库用户名
    mysql.user=root
    ##数据库密码
    mysql.password=aaaa
    ##最大连接数
    mysql.numconnections=100

    ## Velocity dev mode
    velocity.dev.mode=false

    # Azkaban Jetty server properties.
    # Jetty服务器属性.
    #最大线程数
    jetty.maxThreads=25
    #Jetty SSL端口
    jetty.ssl.port=8443
    #Jetty端口
    jetty.port=8081
    #SSL文件名（绝对路径）
    jetty.keystore=/usr/local/azkaban/web/keystore
    #SSL文件密码
    jetty.password=aaaaaa
    #Jetty主密码与keystore文件相同
    jetty.keypassword=aaaaaa
    #SSL文件名（绝对路径）
    jetty.truststore=/usr/local/azkaban/web/keystore
    #SSL文件密码
    jetty.trustpassword=aaaaaa

    # Azkaban Executor settings
    executor.port=12321

    # mail settings
    mail.sender=
    mail.host=
    job.failure.email=
    job.success.email=

    lockdown.create.projects=false

    cache.directory=cache
    
#在azkaban web服务器安装目录 conf目录，按照如下配置修改azkaban-users.xml 文件，增加管理员用户,配置两种角色 admin, metrics。 
$  vim azkaban-users.xml
<azkaban-users>
    <user username="azkaban" password="azkaban" roles="admin" groups="azkaban" />
    <user username="metrics" password="metrics" roles="metrics"/>
    <user username="admin" password="admin" roles="admin,metrics" />
    <role name="admin" permissions="ADMIN" />
    <role name="metrics" permissions="METRICS"/>
</azkaban-users>

```

**执行服务器executor配置**

```shell
#进入执行服务器executor安装目录conf，打开azkaban.properties
$ cd /usr/local/azkaban/executor/conf
$ vim azkaban.properties

#按照如下配置修改azkaban.properties文件。
    #Azkaban
    #时区
    default.timezone.id=Asia/Shanghai

    # Azkaban JobTypes Plugins
    #jobtype 插件所在位置
    azkaban.jobtype.plugin.dir=plugins/jobtypes

    #Loader for projects
    executor.global.properties=/usr/local/azkaban/executor/conf/global.properties
    azkaban.project.dir=projects

    database.type=mysql
    mysql.port=3306
    mysql.host=node1
    mysql.database=azkaban?useSSL=false&serverTimezone=UTC&characterEncoding=utf-8
    mysql.user=root
    mysql.password=aa
    mysql.numconnections=100

    # Azkaban Executor settings
    #最大线程数
    executor.maxThreads=50
    #端口号(如修改,请与web服务中一致)
    executor.port=12321
    #线程数
    executor.flow.threads=30
```

**启动executor服务器**

```shell
#在executor服务器目录下执行启动命令
$ cd /usr/local/azkaban/executor/bin
$ azkaban-executor-start.sh
#配置环境变量
$ vim /etc/profile
    #Azkaban
    export AZKABAN_EXECUTRO_HOME=/usr/local/azkaban/executor
    export PATH=$PATH:$AZKABAN_EXECUTRO_HOME/bin

#启动/关闭命令
$ azkaban-executor-start.sh
$ azkaban-executor-shutdown.sh
```

**启动web服务器**

```shell
#在azkaban web服务器目录下执行启动命令
$ azkaban-web-start.sh 
$ cd /usr/local/azkaban/web/bin
$ azkaban-web-start.sh
#配置环境变量
$ vim /etc/profile
    #Azkaban
    export AZKABAN_WEB_HOME=/usr/local/azkaban/web
    export PATH=$PATH:$AZKABAN_WEB_HOME/bin
```

## 8. 其他组件安装

这里是笔者做的一个Hadoop云盘的项目，设计到其他一些组件（mysql、nginx、redis）的安装，先贴一张拓扑图

![image-20220707171129116](https://cdn.fengxianhub.top/resources-master/202207071711541.png)

### 8.1 Mysql安装

**编译安装：**

```shell
#下载安装包，将压缩包上传至 /opt/mysql，并解压
$ https://dev.mysql.com/downloads/file/?id=511379
$ tar -xf mysql-8.0.29-1.el7.x86_64.rpm-bundle.tar

#添加用户组
$ groupadd mysql
#添加用户
$ useradd -g mysql mysql
#查看用户信息。
$ id mysql

#卸载MariaDB
$ rpm -qa | grep mariadb #查询是否有该软件
#如果有，就卸载：rpm -e mariadb-libs-这里是你的版本，如果不能卸载（或报错）则采用强制卸载：rpm -e --nodeps mariadb-libs-这里是你的版本

#安装Mysql
$ rpm -ivh *.rpm
#安装过程要按照如下顺序（必须）进行：
    mysql-community-common-8.0.29-1.el7.x86_64.rpm
    mysql-community-client-plugins-8.0.29-1.el7.x86_64.rpm
    mysql-community-libs-8.0.29-1.el7.x86_64.rpm             --（依赖于common）
    mysql-community-client-8.0.29-1.el7.x86_64.rpm          --（依赖于libs）
    mysql-community-icu-data-files-8.0.29-1.el7.x86_64.rpm
    mysql-community-server-8.0.29-1.el7.x86_64.rpm         --（依赖于client、common）
    按照以上顺序进行一个个的安装，脚本如下：
    rpm -ivh mysql-community-server-5.7.16-1.el7.x86_64.rpm 
#期间缺少啥组件，安装啥
#libaio.so.1()(64bit) is needed by mysql-community-embedded-compat-8.0.29-1.el7.x86_64
$ yum -y install libaio
#libnuma.so.1()(64bit) is needed by mysql-community-embedded-compat-8.0.29-1.el7.x86_64
$ yum -y install numactl

#mysql安装软件在/usr/share/mysql目录下
#Mysql数据库创建在/var/lib/mysql目录下

#进入到mysql这个目录中，更改一下权限
$ cd /usr/share/mysql/
$ chown -R mysql:mysql .

#启动mysql
$ service mysqld restart
#登录
    -mysql
    -报错：ERROR 1045 (28000): Access denied for user 'root'@'localhost' (using password: NO)  需添加权限
    -在/ect/my.cnf 的最后面加上一行：skip-grant-tables
$ service mysqld restart

#初始化数据库
$ sudo mysqld --initialize --user=mysql
#查看临时生成的root用户密码
$ sudo cat /var/log/mysqld.log
#修改密码
$ mysql> ALTER USER USER() IDENTIFIED BY 'Admin2022!';
#查看当前密码规则
$ mysql> SHOW VARIABLES LIKE 'validate_password%';
#调整密码规则
$ mysql> set global validate_password.policy=0;
$ mysql>  set global validate_password.length=1;
#修改简单密码
$ mysql> ALTER USER USER() IDENTIFIED BY 'aaaa';
#登录
$ mysql> mysql -uroot -p

#修改配置，进行远程连接
#登录
$ mysql> mysql -uroot -p
#进入MySQL库
$ mysql> use mysql;
#查询user表
$ mysql> select user, host from user;
#修改user表，把Host表内容修改为%
$ mysql> update user set host="%" where user="root";
```

**docker安装**

```shell
docker run  -p 3308:3306 --name mysql -e MYSQL_ROOT_PASSWORD=你的密码 -d  mysql:8 --character-set-server=utf8mb4 --collation-server=utf8mb4_unicode_ci
```

### 8.2 nginx安装

```shell
#安装相关依赖包
$ sudo yum -y install openssl openssl-devel pcre pcre-devel zlib zlib-devel gcc gcc-c++

#将nginx文件上传到 /tmp/nginx
Ngnix下载地址：http://nginx.org/en/download.html

#进入nginx目录下，执行以下命令
$ ./configure   --prefix=/usr/local/nginx
$ make && make install

#启动nginx
#在/usr/local/nginx/sbin目录下执行  
$ ./nginx
#查看启动情况
$ ps -ef |grep nginx
```

这里贴一个我的nginx配置（nginx.conf），解决了跨域问题

```shell

#user  nobody;
worker_processes  1;

#error_log  logs/error.log;
#error_log  logs/error.log  notice;
#error_log  logs/error.log  info;

#pid        logs/nginx.pid;


events {
    worker_connections  1024;
}

 

http {
    include       mime.types;
    default_type  application/octet-stream;
	client_max_body_size 100m;
	proxy_hide_header X-Frame-Options;
    add_header X-Frame-Options ALLOWALL;
    #log_format  main  '$remote_addr - $remote_user [$time_local] "$request" '
    #                  '$status $body_bytes_sent "$http_referer" '
    #                  '"$http_user_agent" "$http_x_forwarded_for"';

    #access_log  logs/access.log  main;

    sendfile        on;
    #tcp_nopush     on;

    #keepalive_timeout  0;
    keepalive_timeout  65;

    #gzip  on;
	 upstream nodeserver{
		  server hadoop1001:8080 weight=8;
		  server hadoop1002:8080 weight=8;
		  server hadoop1003:8080 weight=8;
		  server hadoop1004:8080 weight=8;
		}
		
	

    server {
        listen       80;
        client_max_body_size 100M;
		server_name localhost; #证书绑定的域名。
		#允许跨域请求的域，* 代表所有
		#add_header 'Access-Control-Allow-Origin' *;
		#允许带上cookie请求
		add_header 'Access-Control-Allow-Credentials' 'true';
		#允许请求的方法，比如 GET/POST/PUT/DELETE
		add_header 'Access-Control-Allow-Methods' *;
		#允许请求的header
		add_header 'Access-Control-Allow-Headers' *;
        #charset koi8-r;
		autoindex on; #Nginx默认是不允许列出整个目录       
		charset utf-8; #设置字符集

        #access_log  logs/host.access.log  main;

        location /api/{
			#add_header access-control-allow-origin *;
			#proxy_set_header X-Forwarded-Host $host:$server_port;
			#proxy_set_header  X-Real-IP  $remote_addr;
			#proxy_set_header    Origin        $host:$server_port;
			#proxy_set_header    Referer       $host:$server_port;
			#rewrite ^/api/(.*)$ /$1 break;
			
			proxy_pass http://nodeserver;
        }
		
		
		
		
		   location ~ .*\.(htm|html|gif|jpg|jpeg|png|bmp|swf|ioc|rar|zip|txt)|(js|css)$
	    {
		    root html;  		    
			expires 1h;  # h 、d    #用户缓存设置，用户在1小时内下次请求都只会访问到浏览中的缓存
	    }
		location /nmNode{
                add_header Content-Security-Policy "default-src 'self' http://hadoop1 'unsafe-inline' 'unsafe-eval' blob: data: ;";
                add_header X-Xss-Protection "1;mode=block";
                add_header X-Content-Type-Options nosniff;
                proxy_pass http://hadoop1:50070/dfshealth.html#tab-overview;
        }
        #error_page  404              /404.html;

        # redirect server error pages to the static page /50x.html
        #
        error_page   500 502 503 504  /50x.html;
        location = /50x.html {
            root   html;
        }
    }
	# https放在另一个文件里面了
    include conf.d/*.conf;
}
```

`ssl.conf`配置https，需要下载域名的证书

```shell

#以下属性中，以ssl开头的属性表示与证书配置有关。
server {
    listen 443;
	client_max_body_size 100M;
    ssl on;
    #配置HTTPS的默认访问端口为443。
    #如果未在此处配置HTTPS的默认访问端口，可能会造成Nginx无法启动。
    #如果您使用Nginx 1.15.0及以上版本，请使用listen 443 ssl代替listen 443和ssl on。
    server_name hadoop.fengxianhub.top; #证书绑定的域名。
    charset utf-8;
    ssl_certificate cert/8047301_hadoop.fengxianhub.top.pem; #需要添加（这里是你的.pem文件地址）
    ssl_certificate_key cert/8047301_hadoop.fengxianhub.top.key; #需要添加（这里是你的.key文件地址）
    ssl_session_timeout 5m;
    ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE:ECDH:AES:HIGH:!NULL:!aNULL:!MD5:!ADH:!RC4;
    #表示使用的加密套件的类型。
    ssl_protocols TLSv1.1 TLSv1.2 TLSv1.3; #表示使用的TLS协议的类型。
    ssl_prefer_server_ciphers on;

	
    
    # 请求API
    		location /api/{
			#add_header access-control-allow-origin *;
			#proxy_set_header X-Forwarded-Host $host:$server_port;
			#proxy_set_header  X-Real-IP  $remote_addr;
			#proxy_set_header    Origin        $host:$server_port;
			#proxy_set_header    Referer       $host:$server_port;
			#rewrite ^/api/(.*)$ /$1 break;
			
			proxy_pass http://nodeserver;
        	}
		
		   location ~ .*\.(htm|html|gif|jpg|jpeg|png|bmp|swf|ioc|rar|zip|txt)|(js|css)$
	    	{
		    root html;  		    
			expires 1h;  # h 、d    #用户缓存设置，用户在1小时内下次请求都只会访问到浏览中的缓存
	    	}
    		error_page 404 /404.html;
    		error_page 500 502 503 504 /50x.html;
}
```

### 8.3 redis安装

 其实上面的都是通过编译安装，为了熟悉linux的环境，如果用docker会很方便

```shell
docker run -p 6500:6379 --name redis -v /root/docker/redis/conf/redis.conf:/etc/redis/redis.conf  -v /root/docker/redis/data:/data -d redis redis-server /etc/redis/redis.conf --appendonly yes
```

参数解释：

```java
-p 6500:6379:把容器内的6500端口映射到宿主机6379端口
-v /data/redis/redis.conf:/etc/redis/redis.conf：把宿主机配置好的redis.conf放到容器内的这个位置中
-v /data/redis/data:/data：把redis持久化的数据在宿主机内显示，做数据备份
redis-server /etc/redis/redis.conf：这个是关键配置，让redis不是无配置启动，而是按照这个redis.conf的配置启动
–appendonly yes：redis启动后数据持久化
```

## 9. 集群脚本

TODO











