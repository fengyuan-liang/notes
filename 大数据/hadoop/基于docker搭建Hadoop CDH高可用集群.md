# 基于docker搭建Hadoop CDH高可用集群

首先我们为了之后继续搭建软件，这里没有使用docker-compose，而是通过构建四台centos，再在里面搭建我们所需要的组件

宿主机最好提供10 GB的RAM，硬盘占用大概会在40G以上

本次采用的在线安装方式，cdh为6.3.2版本，系统为centos7.4， docker节点可以为任意多个，下文将以3个docker容器为示例进行展示。此方法也可用在docker swarm上，docker容器能够互连，网络互通即可

离线安装包地址：

链接：https://pan.baidu.com/s/1PVZ3f5a9o1BSGra2KgC84w 
提取码：8wr1 

## 0. docker安装

**卸载（可选）**

如果之前安装过旧版本的Docker，可以使用下面命令卸载：

```shell
yum remove docker \
                  docker-client \
                  docker-client-latest \
                  docker-common \	
                  docker-latest \
                  docker-latest-logrotate \
                  docker-logrotate \
                  docker-selinux \
                  docker-engine-selinux \
                  docker-engine \
                  docker-ce
```

**安装docker**

首先需要大家虚拟机联网，安装yum工具

```shell
yum install -y yum-utils \
           device-mapper-persistent-data \
           lvm2 --skip-broken
```

然后更新本地镜像源：

```shell
# 设置docker镜像源
yum-config-manager \
    --add-repo \
    https://mirrors.aliyun.com/docker-ce/linux/centos/docker-ce.repo
# 第二步     
sed -i 's/download.docker.com/mirrors.aliyun.com\/docker-ce/g' /etc/yum.repos.d/docker-ce.repo
# 第三步
yum makecache fast
```

然后输入命令：

```shell
yum install -y docker-ce
```

docker-ce为社区免费版本。稍等片刻，docker即可安装成功。

## 1. 构建Centos-cdh镜像

宿主机初始化

```java
yum install -y wget   \
&& mkdir -p /etc/yum.repos.d/repo_bak   \
&& mv /etc/yum.repos.d/*.repo /etc/yum.repos.d/repo_bak/  \
&& wget -O /etc/yum.repos.d/CentOS-Base.repo http://mirrors.aliyun.com/repo/Centos-7.repo  \
&& wget -O /etc/yum.repos.d/epel.repo http://mirrors.aliyun.com/repo/epel-7.repo    \
&& yum clean all   \
&& yum makecache   \
&& yum update –y    
```

构建容器的`Dockerfile`文件（创建这个文件）

```shell
FROM docker.io/ansible/centos7-ansible
RUN yum -y install openssh-server
RUN yum -y install bind-utils
RUN yum -y install which
RUN yum -y install sudo
```

在Dockerfile同级目录执行:

```java
docker build -t centos7-cdh .
```

生成要用的基础centos7的镜像

![image-20220708104952611](https://cdn.fengxianhub.top/resources-master/202207081049704.png)

接着我们给镜像创建一个网桥

```shell
docker network create --subnet=172.10.0.0/16 hadoop_net && docker network ls
```

**启动容器**

```shell
docker run -d  \
--add-host cm.hadoop:172.10.0.2 \
--net hadoop_net \
--ip 172.10.0.2 \
-h cm.hadoop \
-p 10022:22 \
-p 7180:7180 \
--restart always \
--name cm.hadoop \
--privileged \
centos7-cdh \
/usr/sbin/init \
&& docker ps  
```

参数解释：

```shell
run -d  # 后台启动
--add-host cm.hadoop:172.10.0.2  # 给容器分配一个固定的ip，主机名为：cm.hadoop
--net hadoop_net # 将容器加入到上一步创建的网桥中
-p # 端口映射
--restart always # docker重启后会自动开启此容器
--name cm.hadoop # 给容器起名字，在docker中可以用主机名代替ip镜像访问
--privileged # 声明此容器可以定制化，例如使container内的root拥有真正的root权限等
```

## 2. 容器安装ClouderaManager

### 2.1 初始化环境

我们进入容器，配置一些东西

```java
docker exec -it cm.hadoop bash
```

**将root的登录密码改为root**

```shell
$ su root
$ passwd
$ root
$ root
```

**安装基础环境**

```shell
yum install -y kde-l10n-Chinese telnet reinstall glibc-common vim wget ntp net-tools && yum clean all
```

此步如果出错，请尝试容器是否可以正常联网，检查docker网桥设置

### 2.2 配置中文环境变量

`vim ~/.bashrc`  ，在末尾添加

```shell
export LC_ALL=zh_CN.utf8   
export LANG=zh_CN.utf8    
export LANGUAGE=zh_CN.utf8  
```

**执行**

```shell
localedef -c -f UTF-8 -i zh_CN zh_CN.utf8 \
&& source ~/.bashrc \
&& echo $LANG
```

![image-20220708111852683](https://cdn.fengxianhub.top/resources-master/202207081118763.png)

### 2.3 设置NTP时间同步服务

这一步是必须要做的，因为hadoop集群如果时间不同步会出现通讯失败的情况

安装ntp

```shell
yum install ntp -y
```

同步时间

```shell
ntpdate -u ntp1.aliyun.com 
```

修改时区

```shell
ln -sf /usr/share/zoneinfo/Asia/Shanghai /etc/localtime
```

再创建一个定时任务，用于定时同步时间（防止虚拟机停止后时间异常）

```shell
crontab  -e
# 添加
0 */2 * * * /usr/sbin/ntpdate ntp1.aliyun.com 
```

**启动ntp服务**

```shell
systemctl start ntpd && \
systemctl enable ntpd &&  \
date
```

### 2.4 安装mysql

使用wget安装（也可以单独部署，单独部署这里不再赘述）：

```shell
mkdir -p /root/hadoop__CHD/mysql \
&& wget -O /root/hadoop_CHD/mysql/mysql-5.7.27-1.el7.x86_64.rpm-bundle.tar \
https://dev.mysql.com/get/Downloads/MySQL-5.7/mysql-5.7.27-1.el7.x86_64.rpm-bundle.tar \
&& ls /root/hadoop_CHD/mysql
```

使用wget会非常的慢，我们可以上传给宿主机，然后通过docker命令拷贝给centos-chd

```shell
# 前提是容器的/root/hadoop_CHD/mysql目录必须事先创建。
docker cp mysql-5.7.27-1.el7.x86_64.rpm-bundle.tar {容器ID}:/root/hadoop_CHD/mysql
```

**准备MySQL JDBC驱动**

```shell
mkdir -p /root/hadoop_CHD/mysql-jdbc \
&& wget -O /root/hadoop_CHD/mysql-jdbc/mysql-connector-java-5.1.48.tar.gz \
https://dev.mysql.com/get/Downloads/Connector-J/mysql-connector-java-5.1.48.tar.gz  \
&& ls /root/hadoop_CHD/mysql-jdbc
```

### 2.5 准备Cloudera-Manager安装包

这样下载很慢，建议用finalshell等工具直接从自己的电脑上上传到虚拟机中，直接连接宿主机的10022端口即可

```shell
mkdir -p /root/hadoop_CHD/cloudera-repos \
&& wget -O /root/hadoop_CHD/cloudera-repos/allkeys.asc \
https://archive.cloudera.com/cm6/6.3.0/allkeys.asc \
&& wget -O /root/hadoop_CHD/cloudera-repos/cloudera-manager-agent-6.3.0-1281944.el7.x86_64.rpm \
https://archive.cloudera.com/cm6/6.3.0/redhat7/yum/RPMS/x86_64/cloudera-manager-agent-6.3.0-1281944.el7.x86_64.rpm \
&& wget -O /root/hadoop_CHD/cloudera-repos/cloudera-manager-daemons-6.3.0-1281944.el7.x86_64.rpm \
https://archive.cloudera.com/cm6/6.3.0/redhat7/yum/RPMS/x86_64/cloudera-manager-daemons-6.3.0-1281944.el7.x86_64.rpm \
&& wget -O /root/hadoop_CHD/cloudera-repos/cloudera-manager-server-6.3.0-1281944.el7.x86_64.rpm \
https://archive.cloudera.com/cm6/6.3.0/redhat7/yum/RPMS/x86_64/cloudera-manager-server-6.3.0-1281944.el7.x86_64.rpm \
&& wget -O /root/hadoop_CHD/cloudera-repos/cloudera-manager-server-db-2-6.3.0-1281944.el7.x86_64.rpm \
https://archive.cloudera.com/cm6/6.3.0/redhat7/yum/RPMS/x86_64/cloudera-manager-server-db-2-6.3.0-1281944.el7.x86_64.rpm \
&& wget -O /root/hadoop_CHD/cloudera-repos/enterprise-debuginfo-6.3.0-1281944.el7.x86_64.rpm \
https://archive.cloudera.com/cm6/6.3.0/redhat7/yum/RPMS/x86_64/enterprise-debuginfo-6.3.0-1281944.el7.x86_64.rpm \
&& wget -O /root/hadoop_CHD/cloudera-repos/oracle-j2sdk1.8-1.8.0+update181-1.x86_64.rpm \
https://archive.cloudera.com/cm6/6.3.0/redhat7/yum/RPMS/x86_64/oracle-j2sdk1.8-1.8.0+update181-1.x86_64.rpm \
&& ll /root/hadoop_CHD/cloudera-repos
```

**准备Parcel包**

```shell
mkdir -p /root/hadoop_CHD/parcel \
&& wget -O /root/hadoop_CHD/parcel/ CDH-6.3.2-1.cdh6.3.2.p0.1605554-el7.parcel \
https://archive.cloudera.com/cdh6/6.3.2/parcels/CDH-6.3.2-1.cdh6.3.2.p0.1605554-el7.parcel \
&& wget -O /root/hadoop_CHD/parcel/manifest.json \
https://archive.cloudera.com/cdh6/6.3.2/parcels/manifest.json \
&& ll /root/hadoop_CHD/parcel
```

 **搭建本地yum源**

```shell
 yum -y install httpd createrepo  \
&& systemctl start httpd \
&& systemctl enable httpd \
&& cd /root/hadoop_CHD/cloudera-repos/ && createrepo . \
&& mv /root/hadoop_CHD/cloudera-repos /var/www/html/ \
&& yum clean all \
&& ll /var/www/html/cloudera-repos
```

### 2.6 安装jdk

```java
yum install -y java-1.8.0-openjdk-devel.x86_64
```

查看一下：

```java
java -version
```

![image-20220708132218023](https://cdn.fengxianhub.top/resources-master/202207081322200.png)

jdk会默认安装在`/usr/lib/jvm`目录下：

![image-20220419133622060](https://cdn.fengxianhub.top/resources-master/202204191336327.png)

这样安装没有配置`JAVA_HOME`，我们需要进一步配置，不然后面安装会报错

```java
(
cat <<EOF
#set java environment
JAVA_HOME=/usr/lib/jvm/jre-1.8.0-openjdk
PATH=$PATH:$JAVA_HOME/bin
CLASSPATH=.:$JAVA_HOME/lib/dt.jar:$JAVA_HOME/lib/tools.jar
export JAVA_HOME CLASSPATH PATH
EOF
) >> /etc/profile && source /etc/profile && java -version
```

### 2.7 启动前准备

**安装配置MySQL数据库(采用docker独立安装跳过此步)**

```shell
cd /root/hadoop_CHD/mysql/ \
&& tar -xvf mysql-5.7.27-1.el7.x86_64.rpm-bundle.tar \
&& yum install -y libaio numactl \
&& rpm -ivh mysql-community-common-5.7.27-1.el7.x86_64.rpm \
&& rpm -ivh mysql-community-libs-5.7.27-1.el7.x86_64.rpm   \
&& rpm -ivh mysql-community-client-5.7.27-1.el7.x86_64.rpm \
&& rpm -ivh mysql-community-server-5.7.27-1.el7.x86_64.rpm \
&& rpm -ivh mysql-community-libs-compat-5.7.27-1.el7.x86_64.rpm \
&& echo character-set-server=utf8 >> /etc/my.cnf \
&& rm -rf /root/hadoop_CHD/mysql/ \
&& yum clean all \
&& rpm -qa |grep mysql
```

**建数据库表**

```sql
(
cat <<EOF
set password for root@localhost = password('123456Aa.');
grant all privileges on *.* to 'root'@'%' identified by '123456Aa.';
flush privileges;
CREATE DATABASE scm DEFAULT CHARACTER SET utf8 DEFAULT COLLATE utf8_general_ci;
CREATE DATABASE amon DEFAULT CHARACTER SET utf8 DEFAULT COLLATE utf8_general_ci;
CREATE DATABASE rman DEFAULT CHARACTER SET utf8 DEFAULT COLLATE utf8_general_ci;
CREATE DATABASE hue DEFAULT CHARACTER SET utf8 DEFAULT COLLATE utf8_general_ci;
CREATE DATABASE metastore DEFAULT CHARACTER SET utf8 DEFAULT COLLATE utf8_general_ci;
CREATE DATABASE sentry DEFAULT CHARACTER SET utf8 DEFAULT COLLATE utf8_general_ci;
CREATE DATABASE nav DEFAULT CHARACTER SET utf8 DEFAULT COLLATE utf8_general_ci;
CREATE DATABASE navms DEFAULT CHARACTER SET utf8 DEFAULT COLLATE utf8_general_ci;
CREATE DATABASE oozie DEFAULT CHARACTER SET utf8 DEFAULT COLLATE utf8_general_ci;
GRANT ALL ON scm.* TO 'scm'@'%' IDENTIFIED BY '123456Aa.';
GRANT ALL ON amon.* TO 'amon'@'%' IDENTIFIED BY '123456Aa.';
GRANT ALL ON rman.* TO 'rman'@'%' IDENTIFIED BY '123456Aa.';
GRANT ALL ON hue.* TO 'hue'@'%' IDENTIFIED BY '123456Aa.';
GRANT ALL ON metastore.* TO 'hive'@'%' IDENTIFIED BY '123456Aa.';
GRANT ALL ON sentry.* TO 'sentry'@'%' IDENTIFIED BY '123456Aa.';
GRANT ALL ON nav.* TO 'nav'@'%' IDENTIFIED BY '123456Aa.';
GRANT ALL ON navms.* TO 'navms'@'%' IDENTIFIED BY '123456Aa.';
GRANT ALL ON oozie.* TO 'oozie'@'%' IDENTIFIED BY '123456Aa.';
SHOW DATABASES;
EOF
) >> /root/c.sql
```

保存为：`/root/c.sql`

获取MySQL初始密码

```shell
systemctl start mysqld && grep password /var/log/mysqld.log | sed 's/.*(............)$/1/'
```

执行SQL脚本

```
mysql -u root -p
```

输入查询出的默认密码，然后执行：

```
source /root/c.sql  
```

**配置mysql jdbc驱动**

```shell
$ mkdir -p /usr/share/java/
$ cd /root/hadoop_CHD/mysql-jdbc/   
$ tar -zxvf mysql-connector-java-5.1.48.tar.gz 
$ cp  /root/hadoop_CHD/mysql-jdbc/mysql-connector-java-5.1.48/mysql-connector-java-5.1.48-bin.jar /usr/share/java/mysql-connector-java.jar 
$ rm -rf /root/hadoop_CHD/mysql-jdbc/ 
$ ls /usr/share/java/
```

这里有坑，就是这个驱动版本不能太高，刚开始我的是5.1.47的驱动，然后就会报错，换了5.1.6的就好了（手动上传），还有就是驱动不能带版本号

名字要为`mysql-connector-java.jar`

**安装Cloudera Manager**

```shell
(
cat <<EOF
[cloudera-manager]
name=Cloudera Manager 6.3.0
baseurl=http://172.10.0.2/cloudera-repos/
gpgcheck=0
enabled=1
EOF
) >> /etc/yum.repos.d/cloudera-manager.repo \
&& yum clean all \
&& yum makecache \
&& yum install -y cloudera-manager-daemons cloudera-manager-agent cloudera-manager-server \
&& yum clean all \
&& rpm -qa | grep cloudera-manager
```

**配置parcel库**

```shell
cd /opt/cloudera/parcel-repo/;mv /root/hadoop_CHD/parcel/* ./   \
&& sha1sum CDH-6.3.2-1.cdh6.3.2.p0.1605554-el7.parcel | awk '{ print $1 }' > CDH-6.3.2-1.cdh6.3.2.p0.1605554-el7.parcel.sha \
&& rm -rf /root/hadoop_CHD/parcel/  \
&& chown -R cloudera-scm:cloudera-scm /opt/cloudera/parcel-repo/*  \
&& ll /opt/cloudera/parcel-repo/
```

**初始化scm库**

```shell
/opt/cloudera/cm/schema/scm_prepare_database.sh mysql scm scm 123456Aa.
```

接着上面的，如果驱动没有问题

![image-20220708153459862](https://cdn.fengxianhub.top/resources-master/202207081535066.png)

**启动cloudera-server服务**

```shell
systemctl start cloudera-scm-server.service \
&& sleep 2 \
&& tail -f /var/log/cloudera-scm-server/cloudera-scm-server.log | grep "INFO WebServerImpl:com.cloudera.server.cmf.WebServerImpl: Started Jetty server"
```

这里如果出错，请多看错误日志，一般为驱动未找到，或者是bean构建失败等等，如果失败不要反复重启服务，因为`scm`数据库里面的数据很可能会出现问题，应该删除该数据库再重新启动

到这里如果没有什么问题，你可以在你的浏览器里面看到页面，[http://IP:7180/cmf/login](http://ip:7180/cmf/login) 账号密码：admin/admin

![image-20220708153736490](https://cdn.fengxianhub.top/resources-master/202207081537706.png)

>先别急着操作，先配置两个slave结点

## 3. 配置CDH的worker节点

以下为worker容器的准备方式，若为多个时，重复执行以下步骤，创建多个worker节点

### 3.1 创建多个worker容器

创建2个work容器

Worker-1:

```shell
docker run -d  \
--add-host cm.hadoop:172.10.0.2 \
--add-host cdh01.hadoop:172.10.0.3 \
--net hadoop_net \
--ip 172.10.0.3 \
-h cdh01.hadoop \
-p 20022:22 \
--restart always \
--name cdh01.hadoop \
--privileged \
centos7-cdh \
/usr/sbin/init \
&& docker ps
```

Worker-2:

```shell
docker run -d \
--add-host cm.hadoop:172.10.0.2 \
--add-host cdh02.hadoop:172.10.0.4 \
--net hadoop_net \
--ip 172.10.0.4 \
-h cdh02.hadoop \
-p 30022:22 \
--restart always \
--name cdh02.hadoop \
--privileged \
centos7-cdh \
/usr/sbin/init \
&& docker ps
```

到这里正常的话我们就有三台主机了

![image-20220708145930784](https://cdn.fengxianhub.top/resources-master/202207081459967.png)

和之前的操作一样，先安装基本工具

上一步创建的所有容器均执行，修改root的登录密码改为root

```shell
$ su root
$ passwd
$ root
$ root
```

**然后执行**

配置中文环境

```shell
yum install -y kde-l10n-Chinese telnet reinstall glibc-common vim wget ntp net-tools && yum clean all
```

### 3.2 环境配置

**配置中文环境变量**

```shell
(
cat <<EOF
export LC_ALL=zh_CN.utf8
export LANG=zh_CN.utf8
export LANGUAGE=zh_CN.utf8
EOF
) >> ~/.bashrc  \
&& localedef -c -f UTF-8 -i zh_CN zh_CN.utf8   \
&& source ~/.bashrc   \
&& echo $LANG
```

这一步是必须要做的，因为hadoop集群如果时间不同步会出现通讯失败的情况

安装ntp

```shell
yum install ntp -y
```

同步时间

```shell
ntpdate -u ntp1.aliyun.com 
```

修改时区

```shell
ln -sf /usr/share/zoneinfo/Asia/Shanghai /etc/localtime
```

再创建一个定时任务，用于定时同步时间（防止虚拟机停止后时间异常）

```shell
crontab  -e
# 添加
0 */2 * * * /usr/sbin/ntpdate ntp1.aliyun.com 
```

**启动ntp服务**

```shell
systemctl start ntpd && \
systemctl enable ntpd &&  \
date
```

**配置MySQL JDBC**

这里为了防止出错，建议配置和master结点一样的驱动，且不要带版本号

```shell
mkdir -p /usr/share/java/ 
```

上传驱动即可

**修改CM主机的host文件**

这样我们可以很方便的使用后面的名字访问这些主机

```shell
echo "172.10.0.3      cdh01.hadoop cdh01" >> /etc/hosts
echo "172.10.0.4      cdh02.hadoop cdh02" >> /etc/hosts
```

这里我们还可以配置一下免密码登录

## 4. CM管理平台创建CDH集群

### 4.1 登陆CM管理平台

[http://IP:7180/cmf/login](http://ip:7180/cmf/login) 账号密码：admin/admin

**欢迎界面**：

![image-20220708162530795](https://cdn.fengxianhub.top/resources-master/202207081625156.png)

>此面一直点击`继续`，需要同意条款的同意条款

**然后就可以来到集群安装的欢迎界面**

![image-20220708162832884](https://cdn.fengxianhub.top/resources-master/202207081628141.png)

我们来安装集群

选择继续，并给集群起一个名字

![image-20220708163111030](https://cdn.fengxianhub.top/resources-master/202207081631236.png)

设置主机地址: `172.10.0.[2-4]`

![image-20220708163249326](https://cdn.fengxianhub.top/resources-master/202207081632564.png)

**选择存储**

自定义存储库：http://172.10.0.2/cloudera-repos

![image-20220708163339956](https://cdn.fengxianhub.top/resources-master/202207081633158.png)

**Jdk安装**

![image-20220708163410577](https://cdn.fengxianhub.top/resources-master/202207081634809.png)

SSH凭据，密码为容器root用户的登录密码，此处为root

![image-20220708163449320](https://cdn.fengxianhub.top/resources-master/202207081634541.png)

**安装代理**

![image-20220708164802475](https://cdn.fengxianhub.top/resources-master/202207081648679.png)

**安装大数据组件**

![image-20220708235239034](https://cdn.fengxianhub.top/resources-master/202207082352699.png)

**集群状态检查**

![image-20220708235815444](https://cdn.fengxianhub.top/resources-master/202207082358709.png)

**集群设置**

选择你要安装的组件

![image-20220709000014421](https://cdn.fengxianhub.top/resources-master/202207090000678.png)

选择好你要安装的大数据组件，然后点继续

![image-20220709000143380](https://cdn.fengxianhub.top/resources-master/202207090001611.png)

这里如果选择了hive之类的组件，需要在cm结点上创建一个数据库，可以用组件名命名

```sql
CREATE DATABASE scm DEFAULT CHARACTER SET utf8 DEFAULT COLLATE utf8_general_ci;
CREATE DATABASE hive DEFAULT CHARACTER SET utf8 DEFAULT COLLATE utf8_general_ci;
grant all privileges on scm.* to scm@'localhost' identified by '密码';
grant all privileges on scm.* to scm@'%' identified by '密码';
grant all privileges on hive.* to hive@'localhost' identified by '密码';
grant all privileges on hive.* to hive@'%' identified by '密码';
CREATE DATABASE hue DEFAULT CHARACTER SET utf8 DEFAULT COLLATE utf8_general_ci;
grant all privileges on hue.* to hue@'%' identified by '密码';
grant all privileges on hue.* to hue@'localhost' identified by '密码2';
CREATE DATABASE rm DEFAULT CHARACTER SET utf8 DEFAULT COLLATE utf8_general_ci;
grant all privileges on rm.* to rm@'localhost' identified by '密码';
grant all privileges on rm.* to rm@'%' identified by '密码';
flush privileges;
```

![image-20220709001239482](https://cdn.fengxianhub.top/resources-master/202207090012730.png)

红色表示必填的项目

![image-20220709001347369](https://cdn.fengxianhub.top/resources-master/202207090013624.png)

>Datanode-> /dfs/datanode
>
>Namenode-> /dfs/namenode
>
>HDFS检查点-> /dfs/checkpoint
>
>NodeManager 本地目录-> /dfs/nodemanager

然后就等待集群构建完成！

![image-20220709082145341](https://cdn.fengxianhub.top/resources-master/202207090821605.png)

