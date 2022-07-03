# Hadoop完全分布式安装（HA、Yarn、ZKFC、flume/Ganglia、sqoop一步到位）

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

同步时间$A200516123a$

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

- 

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
hdfs namenode -b	ootstrapStandby
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

以下只需要在hadoop1上配置即可. 

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

至此,yarn就配好了，下面我们可以启动yarn集群，并查看nodemanager

1. 启动
   	start-yarn.sh
   		启动后，可以观察到  node2,3,4上都有nodemanager进程了，这是因为 datanode默认就是nodemanager

2. 关闭
	stop-yarn.sh

3. web UI
	http://node1:8088/

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

确保zk先启动

```css
zkServer.sh start
```

在node1上start-all.sh，或者

```java
或是  start-dfs.sh    start-yarn.sh
```



```java
flume-ng agent --conf conf/ --name a1 --conf-file /usr/local/flume190/jobs/t2/flume-file-hdfs.conf
```

​	

## 附录：踩坑日记

要记得开50010端口，不然文件上传会失败！！

nginx路径带 / 和不带   带/ 不会有代理地址   不带 会有代理地址 ！！！

![image-20220702182402191](https://cdn.fengxianhub.top/resources-master/202207021824532.png)



![image-20220702182449705](https://cdn.fengxianhub.top/resources-master/202207021824838.png)



- 
- 

```java
auto ens33
iface ens33 inet static
address 192.168.2.150   # IP地址， 要根据自己网段下IP的使用设置，不能和别的IP相冲突
netmask 255.255.255.0
gateway 192.168.2.1   #网关，我的ip地址是15.150，所以这里的网关设置为15.1
iface ens33  inet6 auto   #IPV6 这个可要可不要
```











