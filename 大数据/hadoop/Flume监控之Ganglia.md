# Flume监控之Ganglia

## 1. Ganglia的安装

### 1.1 环境说明

**系统环境：** centos7

**Ganglia版本：** ganglia-3.7.2

### 1.2 注意事项

1. 因为此次安装的系统环境是centos7，其中的yum源和centos6有点不一样，所以不能用在线安装的方式，只能采用`下载ganglia的源码自己编译`安装的方式。
1. 建议按照描述的路径来装，别改路径了，否则很多路径搞得挺迷糊的。

### 1.3 安装流程

**1） 检查是否有Apache软件包**

```shell
[root@localhost ~]# rpm -qa httpd*
```

 如果没有，就什么都不会显示，如果有，那就需要使用下述命令将其删除：

```shell
[root@localhost ~]# rpm -e --nodeps 包名
```

**2）关闭防火墙**

```shell
[root@localhost ~]# systemctl stop firewalld.service
[root@localhost ~]# systemctl disable firewalld.service
```

**3）关闭selinux**	

方式一：临时关闭

```shell
[root@localhost ~]# setenforce 0
```

方式二：永久关闭（修改配置文件）

```shell
[root@localhost ~]# vi /etc/selinux/config
#将改成SELINUX=disabled
```

![image-20220626093135242](https://my-typroa-photos.oss-cn-guangzhou.aliyuncs.com/images/image-20220626093135242.png)

**4）安装gmetad**

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

**解决方法：**  在自己的命令后面 拼接上 --no-check-certificate     意思是不要网站检查，举个例子：

```shell
get https://sourceforge.net/projects/ganglia/files/ganglia-web/3.7.2/ganglia-web-3.7.2.tar.gz   --no-check-certificate
```

5）安装gweb

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

**6）修改启动脚本**

就是修改一个文件，ganglia默认的位置不是下述的样子，因为我们是编译安装，位置是自己定的，

```shell
[root@localhost ganglia]# vi /etc/init.d/gmetad
GMETAD=/usr/sbin/gmetad  #这句话可以自行更改gmetad的命令，当然也能向我们前面做了软连接
start() {
    [ -f /usr/local/ganglia/etc/gmetad.conf  ] || exit 6  #这里将配置文件改成现在的位置，不然启动没反应
```

![image-20220626100800222](https://my-typroa-photos.oss-cn-guangzhou.aliyuncs.com/images/image-20220626100800222.png)

**7）创建rrds目录**

```shell
[root@localhost ganglia]# mkdir /var/lib/ganglia/rrds -p
[root@localhost ganglia]# chown -R nobody:nobody  /var/lib/ganglia/rrds
```

8）修改gmetad配置文件

​	因为我们这里就先让它当一个单纯的gweb节点和gmetad节点，不给其启动gmond服务，假设它没有再哪个多播集群里。

```shell
[root@localhost ganglia]# vi /usr/local/ganglia/etc/gmetad.conf
#这个是文件里面的东西，IP是自己的，得换，因为我要装在两个节点上，所以我的写两个，根据自己的情况来，没法统一  #这也是我们以后经常修改的地方，""里面是组名称  后面是去哪个IP的那个端口去采集gmond数据
data_source "my cluster" 192.168.106.200:8649   192.168.106.203:8649 
```

![image-20220626101405564](https://my-typroa-photos.oss-cn-guangzhou.aliyuncs.com/images/image-20220626101405564.png)

**9）修改配置文件/etc/httpd/conf.d/ganglia.conf**

这里就需要步骤5中记住的那个东西了--/var/www/html/。

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

**10）启动服务**

```shell
[root@localhost ganglia]# mkdir -p /usr/local/ganglia/var/run
[root@localhost ganglia]# /etc/init.d/gmetad restart
[root@localhost ganglia]# systemctl restart httpd
[root@localhost tools]# netstat -luntp
```

注意下述的地方是否一样：
![image-20220626102510283](https://my-typroa-photos.oss-cn-guangzhou.aliyuncs.com/images/image-20220626102510283.png)

**11）访问ganglia**

我的地址，你们换成自己的IP：http://192.168.106.200/ganglia/

![image-20220626102640990](https://my-typroa-photos.oss-cn-guangzhou.aliyuncs.com/images/image-20220626102640990.png)

## 2. 操作Flume测试监控

**1）修改flume安装目录conf下的flume-env.sh**

我的路径是：/usr/local/flume/flume110/conf

