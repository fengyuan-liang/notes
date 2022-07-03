# 熟悉常用的HDFS操作(附录HDFS常用命令)

## 1. 学习目的

1、理解HDFS在Hadoop体系结构中的角色；

2、熟练使用HDFS操作常用的Shell命令；

3、熟悉HDFS操作常用的Java API

## 2. 学习内容

1、编程实现指定功能，并利用Hadoop提供的Shell命令完成相同任务：

2、编程实现一个类“MyFSDataInputStream”，该类继承“org.apache.hadoop.fs.FSDataInputStream”。

## 3. 实验一

编程实现以下指定功能，并利用Hadoop提供的Shell命令完成相同任务

### 3.1 追加文本

向HDFS中上传任意文本文件，如果指定的文件在HDFS中已经存在，由用户指定是追加到原有文件末尾还是覆盖原有的文件

**首先我们启动我们hadoop的所有结点**(`此命令需在sbin目录下进行`)，命令：

```shell
sh start-all.sh
```

其中如果你是用管理员权限创建的目录，系统启动读取时需要你输入密码，输入即可

![image-20220426213609612](https://cdn.fengxianhub.top/resources-master/202204262136869.png)

当然如果之前已经运行了nameNode和DataNode会显示运行失败，可以使用`jps`查看进程，用`kill -9 进程号`鲨掉进程再启动

![image-20220426213351446](https://cdn.fengxianhub.top/resources-master/202204262133849.png)

>可以看到其实通过`start-all.sh`启动时，会启动很多服务，我们可以看一下这个脚本里面的内容

```shell
vim start-all.sh
```

核心内容如下：

```shell
# Start all hadoop daemons.  Run this on master node.

echo "This script is Deprecated. Instead use start-dfs.sh and start-yarn.sh"

bin=`dirname "${BASH_SOURCE-$0}"`
bin=`cd "$bin"; pwd`

DEFAULT_LIBEXEC_DIR="$bin"/../libexec
HADOOP_LIBEXEC_DIR=${HADOOP_LIBEXEC_DIR:-$DEFAULT_LIBEXEC_DIR}
. $HADOOP_LIBEXEC_DIR/hadoop-config.sh

# start hdfs daemons if hdfs is present
if [ -f "${HADOOP_HDFS_HOME}"/sbin/start-dfs.sh ]; then
  "${HADOOP_HDFS_HOME}"/sbin/start-dfs.sh --config $HADOOP_CONF_DIR
fi

# start yarn daemons if yarn is present
if [ -f "${HADOOP_YARN_HOME}"/sbin/start-yarn.sh ]; then
  "${HADOOP_YARN_HOME}"/sbin/start-yarn.sh --config $HADOOP_CONF_DIR
fi

```

可以看到它启动了`start-dfs.sh`和`start-yarn.sh`两个脚本

这两个脚本在`start-all.sh`的同级目录下，请自行研究，主要内容就是为了启动hadoop的组件

>上传本地文件到HDFS

上一次实验我们其实就已经上传过一个文件到hadoop中了，我们可以通过`hadoop fs -ls -R /`命令查看（**请在hadoop目录下进行**）

- `-ls 显示目录信息`
- `-R`递归      所以：  `-ls -R 递归显示文件信息`

![image-20220426215803421](https://cdn.fengxianhub.top/resources-master/202204262158571.png)

查看一下文件内容，命令：

```shell
hadoop fs -cat /root/data/input/log.txt
```

![image-20220426221422634](https://cdn.fengxianhub.top/resources-master/202204262214709.png)

我们现在直接来修改这个文件，由于上次实验我们是在`/input`目录下建了`log.txt`文件，这次我们依旧在这里建文件，当然文件建在哪里并不重要，请读者随意，echo打印，`>`重定向，这里将打印内容输出到指定目录的文件中，文件不存在会自动创建

![image-20220426221258618](https://cdn.fengxianhub.top/resources-master/202204262212742.png)

追加到文件末尾的命令(`这里最好用绝对路径`)：

```shell
hadoop fs -appendToFile /input/test2.txt /root/data/input/log.txt
```

![image-20220426221710959](https://cdn.fengxianhub.top/resources-master/202204262217051.png)

>当然我们也可以重新上传一份

命令很简单，就是把源文件上传到hadoop的目标目录中，前提是hadoop中要有这个目录，没有请使用`hadoop fs -mkdir -p /root/data/input`创建

```shell
hadoop fs -put /input/test2.txt /root/data/input/	
```

![image-20220426222502230](https://cdn.fengxianhub.top/resources-master/202204262225383.png)

### 3.2 覆盖文本

覆盖文本和追加文本一样，只是要注意本地文件和hadoop中的目录都要存在

命令：

```shell
hadoop fs -copyFromLocal -f 本地文件路径 hadoop中文件路径
```

我这里在之前的`test2.txt`中覆盖一行文本，`>>`表示重定向并追加，`>`表示重定向并覆盖

![image-20220426223659890](https://cdn.fengxianhub.top/resources-master/202204262237006.png)

所以我的命令就是：

```shell
hadoop fs -copyFromLocal -f /input/test2.txt /root/data/input/test2.txt
```

![image-20220426223735290](https://cdn.fengxianhub.top/resources-master/202204262237380.png)

### 3.3 脚本完成

其实脚本也就是一段能够执行的代码，在windows平台上是以`.bat`的后缀名出现的，在Linux上是以`.sh`后缀名出现的

```shell
if $(hadoop fs -test -e /root/data/input/test2.txt);then $(hadoop fs -appendToFile /input/test2.txt /root/data/input/test2.txt);
else $(hadoop fs -copyFromLocal -f /input/test2.txt /root/data/input/test2.txt);
fi
```

我们先来分析一下这三行脚本，在Linux的shell脚本中`if`和`fi`是要成对出现的，表示判断语句

`$()`是用来做命令替换用的，表示括号内的是一串可以运行的执行，而不是字符串，我们还经常采用反撇号**``**来做命令替换

`then`、`else`就更好理解了，就是分支语句

>Hadoop fs –test –[ezd] PATH     对PATH进行如下类型的检查：-e PATH是否存在，如果PATH存在，返回0，否则返回1；-z 文件是否为空，如果长度为0，返回0，否则返回1； -d 是否为目录，如果PATH为目录，返回0，否则返回1

综上所示，脚本的作用就是判断一下你有没有中hadoop中已经存在test2.txt这个文件了，存在就追加，不存在就覆盖(会默认创建)

接下来我们演示一下，在演示之前我们先将之前hadoop中的`test2.txt`文件删除掉

![image-20220426230438584](https://cdn.fengxianhub.top/resources-master/202204262304804.png)

我们就在当前目录下创建这个脚本，起名为`test.sh`

```shell
vim test.sh
```

输入脚本(**这里你要填你的路径哦**！)

![image-20220426230808331](https://cdn.fengxianhub.top/resources-master/202204262308478.png)

执行一下(sh表示用shell脚本执行)

```shell
sh test.sh
```

![image-20220426230851912](https://cdn.fengxianhub.top/resources-master/202204262308987.png)

查看一下，可以看到没有文件，所以追加了文本

![image-20220426231015271](https://cdn.fengxianhub.top/resources-master/202204262310426.png)

然后再运行一次`sh test.sh`，可以看到因为文件已经存在了，所以这一次是追加文本了

![image-20220426231127871](https://cdn.fengxianhub.top/resources-master/202204262311992.png)

## 4. 实验二

### 4.1 下载文件脚本

>从HDFS中下载指定文件，如果本地文件与要下载的文件名称相同，则自动对下载的文件重命名

上面的脚本会写了，下面的脚本就很容易理解了

```shell
if $(hadoop fs -test -e /input/test2.txt);then $(hadoop fs -copyToLocal /root/data/input/test2.txt /input/test3.txt); 
else $(hadoop fs -copyToLocal /root/data/input/test2.txt /input/test2.txt); 
fi
```

先判断一下在本地中有没有`test2.txt`这个文件了，有就执行下面的代码也就是下载文件为`test3.txt`，没有就下载为`test2.txt`

这里我们先把之前`/input/test2.txt`这个文件删掉，命令为`rm -f` -f表示强制删除

接下来我们继续创建一个脚本，也在当前目录下

```shell
vim test2.sh
```

![image-20220426235803240](https://cdn.fengxianhub.top/resources-master/202204262358411.png)

我们执行一次：

```
sh test2.sh
```

![image-20220426232856258](https://cdn.fengxianhub.top/resources-master/202204262328400.png)

可以看到没有该文件，所以下载文件文件名为`test2.txt`

我们再执行一次，可以看到生成的是`test3.txt`

![image-20220426234619037](https://cdn.fengxianhub.top/resources-master/202204262346141.png)

这里可能也会有问题，可能是由于hadoop版本或者是权限问题不支持判断本地文件，这里我们知道脚本含义就可以了

### 4.2 输出文件内容脚本

>将HDFS中指定文件的内容输出到终端中

命令：

```shell
hadoop fs -cat /root/data/input/test2.txt
```

其实直接执行也可以的，这里直接用简单的方式将其作为脚本执行，读者也可以自行像上面一样建个xxx.sh再执行

其实脚本不也就是一段可以执行的代码吗

![image-20220427000203051](https://cdn.fengxianhub.top/resources-master/202204270002166.png)

### 4.3 显示单个文件信息脚本

>显示HDFS中指定的文件的读写权限、大小、创建时间、路径等信息

```shell
hadoop fs -ls -h /root/data/input/test2.txt
```

![image-20220427000308627](https://cdn.fengxianhub.top/resources-master/202204270003704.png)

### 4.4 显示目录信息脚本

>给定HDFS中某一个目录，输出该目录下的所有文件的读写权限、大小、创建时间、路径等信息，如果该文件是目录，则递归输出该目录下所有文件相关信息

```shell
hadoop fs -ls -R -h /root/data/input
```

![image-20220427000502416](https://cdn.fengxianhub.top/resources-master/202204270005513.png)

### 4.5 自动创建目录脚本

>提供一个HDFS内的文件的路径，对该文件进行创建和删除操作。如果文件所在目录不存在，则自动创建目录

```shell
#!/bin/bash
if $(hadoop fs -test -d /root/data/input2);then $(hadoop fs -touchz /root/data/input2/test.txt);
else $(hadoop fs -mkdir -p /root/data/input2 && hadoop fs -touchz /root/data/input2/test.txt);
fi
```

- `hadoop fs -touchz` 递归的创建一个文件

这个和之前的太类似了，这里就不赘述了

### 4.6 追加文件脚本

>向HDFS中指定的文件追加内容，由用户指定内容追加到原有文件的开头或结尾； 

```shell
hadoop fs -appendToFile 本地目录/文件 hadoop目录/文件
```

### 4.7 删除文件脚本

>删除HDFS中指定的文件

```shell
hadoop fs -rm /root/data/input/test2.txt
```

![image-20220427001256471](https://cdn.fengxianhub.top/resources-master/202204270012656.png)

### 4.8 移动路径

>在HDFS中，将文件从源路径移动到目的路径

**mv命令详解**

使用方法：hadoop fs -mv URI [URI …] <dest>

将文件从源路径移动到目标路径。这个命令允许有多个源路径，此时目标路径必须是一个目录。不允许在不同的文件系统间移动文件。
示例：

- hadoop fs -mv /user/hadoop/file1 /user/hadoop/file2
- hadoop fs -mv hdfs://host:port/file1 hdfs://host:port/file2 hdfs://host:port/file3 hdfs://host:port/dir1

返回值：

成功返回0，失败返回-1

**我们将input下面的log.txt移动到output目录下**

```shell
hadoop fs -mv /root/data/input/log.txt /root/data/output/log.txt 
```

![image-20220427001705985](https://cdn.fengxianhub.top/resources-master/202204270017239.png)

## 5. 实验三编写Java代码

>编程实现一个类“MyFSDataInputStream”，该类继承“org.apache.hadoop.fs.FSDataInputStream”，要求如下：实现按行读取HDFS中指定文件的方法“readLine()”，如果读到文件末尾，则返回空，否则返回文件一行的文本

### 5.1 远程运行

其实我们在3.1节中启动hadoop中所有组件的时候启动了`nodeMange`，nodeMange提供了一个网页来供我们管理我们的结点和集群，默认端口`9000`，我们可以在配置文件中找到

![image-20220501192823333](https://cdn.fengxianhub.top/resources-master/202205011928759.png)

管理界面：http://localhost:8088

NameNode界面：http://localhost:50070

HDFS NameNode界面：http://localhost:8042

我这里访问我的nameNode管理界面，由于我用的是云服务器，所以地址隐藏了，默认端口50070，在这里你可以对你的集群进行管理

![image-20220427002811843](https://cdn.fengxianhub.top/resources-master/202204270028180.png)

>我们可以通过一些端口来获取hadoop的信息，接下来我们用`Java`通过hadoop暴露的一些端口来获取信息
>
>在远程我们需要使用Maven导入以下jar包。或者你可以去<a href="https://mvnrepository.com/artifact/org.apache.hadoop/hadoop-common/3.2.1">maven的中央仓库</a>中找到（注意要和你的hadoop版本相匹配）

```xml
<dependency>
    <groupId>org.apache.hive</groupId>
    <artifactId>hive-jdbc</artifactId>
    <version>2.1.1</version>
</dependency>
<dependency>
    <groupId>org.apache.hbase</groupId>
    <artifactId>hbase-it</artifactId>
    <version>1.2.6</version>
</dependency>
<dependency>
    <groupId>org.apache.hadoop</groupId>
    <artifactId>hadoop-client</artifactId>
    <version>2.7.3</version>
</dependency>

<dependency>
    <groupId>org.apache.hadoop</groupId>
    <artifactId>hadoop-common</artifactId>
    <version>2.7.3</version>
</dependency>
```



```java
import org.apache.hadoop.conf.Configuration;
import org.apache.hadoop.fs.FSDataInputStream;
import org.apache.hadoop.fs.FileSystem;
import org.apache.hadoop.fs.Path;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.net.URI;
import java.net.URISyntaxException;

public class demo {

    public static void main(String[] args) throws URISyntaxException, IOException, InterruptedException {
        
        // 下面的地址是hadoop的地址
        FileSystem fs=FileSystem.get(
                new URI("hdfs://192.168.153.129:9000"), new Configuration(), "root");
        
        // 下面的地址是hadoop的地址，后面的路径是你要读取的文件
        FSDataInputStream in = fs.open(new Path(
                "hdfs://192.168.153.129:9000/你的文件名路径"));

        BufferedReader d = new BufferedReader(new InputStreamReader(in));
        System.out.println("读取文件："+remoteFilePath);
        String line;
        while ((line = d.readLine()) != null) { 
        	System.out.println(line)
        } 
        d.close();
        in.close();
        fs.close();
    }
}


```

这里你执行的话会报一个错

![image-20220427114202499](https://cdn.fengxianhub.top/resources-master/202204271142819.png)

>原因是**缺少winutils.exe程序**，我们需要在自己的电脑上安装一下这个插件
>
>**注意：winutils.exe的版本号一定要和使用的hadoop版本号保持一致！！！**

<a href="https://blog.csdn.net/qq_35139965/article/details/106796850?ops_request_misc=%257B%2522request%255Fid%2522%253A%2522165140541016782425161166%2522%252C%2522scm%2522%253A%252220140713.130102334.pc%255Fall.%2522%257D&request_id=165140541016782425161166&biz_id=0&utm_medium=distribute.pc_search_result.none-task-blog-2~all~first_rank_ecpm_v1~rank_v31_ecpm-9-106796850.142^v9^pc_search_result_cache,157^v4^control&utm_term=winutils.exe&spm=1018.2226.3001.4187">下载地址</a>

现在我们来安装一下(两种方式)

- 未配置环境变量-->配置环境变量HADOOP_HOME，然后重启电脑。
- 或者代码中设置System.setProperty("hadoop.home.dir", "hadoop安装路径")。

我这里采用方式二

```java
System.setProperty("hadoop.home.dir","D:\\Environment\\Hadoop\\hadoop-common-2.2.0-bin-master\\bin");
```

完整代码为：

```java
import org.apache.hadoop.conf.Configuration;
import org.apache.hadoop.fs.FSDataInputStream;
import org.apache.hadoop.fs.FileStatus;
import org.apache.hadoop.fs.FileSystem;
import org.apache.hadoop.fs.Path;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.net.URI;
import java.util.Arrays;

/**
 * @author: Eureka
 * @date: 2022/4/27 12:06
 * @Description: 
 */
public class demo {
    public static void main(String[] args) throws Exception {
        System.setProperty("hadoop.home.dir","D:\\Environment\\Hadoop\\hadoop-common-2.2.0-bin-master");
        System.setProperty("HADOOP_USER_NAME","root"); //设置访问的用户
        FileSystem fs = FileSystem.get(new URI("hdfs://你的hadoop访问地址+端口号"), new Configuration(),"root");
        Path homeDirectory = fs.getHomeDirectory(); //拿到hdfs的根路径
        System.out.println(homeDirectory);
        FileStatus[] fileStatuses = fs.listStatus(new Path("/root/data/input")); //查看指定路径下文件状态
        System.out.println(Arrays.toString(fileStatuses));//打印文件
        Path path = new Path("/root/data/input/log.txt");
        FSDataInputStream fsDataInputStream = fs.open(path);
        BufferedReader bufferedReader = new BufferedReader(new InputStreamReader(fsDataInputStream));
        String line;
        while ((line = bufferedReader.readLine()) != null) {
            System.out.println(line);//打印指定文件
        }
        bufferedReader.close();//关闭流
        fsDataInputStream.close();
    }
}

```

运行结果：

![image-20220501195845148](https://cdn.fengxianhub.top/resources-master/202205011958439.png)

### 5.2 Linux端运行

在Linux端运行需要自己手动导入jar包，都在hadoop的目录下，我们可以将依赖放入jdk的lib目录下就可以使用了

```shell
hadoop-2.10.1/share/hadoop/common
hadoop-2.10.1/share/hadoop/common/bin
hadoop-2.10.1/share/hadoop/hdfs
hadoop-2.10.1/share/hadoop/hdfs/bin
```

这里我们只需要使用改包进行编译运行`hadoop-common-2.10.1.jar`

我们先找到自己jar包的路径，我的在：

![image-20220501201845815](https://cdn.fengxianhub.top/resources-master/202205012018030.png)

现在我们可以执行以下代码了

```java
import org.apache.hadoop.conf.Configuration;
import org.apache.hadoop.fs.FSDataInputStream;
import org.apache.hadoop.fs.FileStatus;
import org.apache.hadoop.fs.FileSystem;
import org.apache.hadoop.fs.Path;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.net.URI;
import java.util.Arrays;
public class demo {
    public static void main(String[] args) throws Exception {
        FileSystem fs = FileSystem.get(new URI("hdfs://127.0.0.1:9000"), new Configuration(),"root");
        Path path = new Path("/root/data/input/log.txt");
        FSDataInputStream fsDataInputStream = fs.open(path);
        BufferedReader bufferedReader = new BufferedReader(new InputStreamReader(fsDataInputStream));
        System.out.println("读取文件：" + path);
        String line;
        while ((line = bufferedReader.readLine()) != null) {
            System.out.println(line);
        }
        bufferedReader.close();
        fsDataInputStream.close();
    }
}
```

先建立demo.java文件

```shell
vim demo.java
```

```java
import org.apache.hadoop.conf.Configuration;
import org.apache.hadoop.fs.FSDataInputStream;
import org.apache.hadoop.fs.FileStatus;
import org.apache.hadoop.fs.FileSystem;
import org.apache.hadoop.fs.Path;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.net.URI;
import java.util.Arrays;

/**
 * @author: 梁峰源
 * @date: 2022/4/27 12:06
 * @Description: TODO
 */
public class demo {

    public static void main(String[] args) throws Exception {
        System.setProperty("HADOOP_USER_NAME","root");
        FileSystem fs = FileSystem.get(new URI("hdfs://127.0.0.1:9000"), new Configuration(),"root");
        Path homeDirectory = fs.getHomeDirectory(); //获得根文件夹
        System.out.println(homeDirectory); //打印根文件夹
        FileStatus[] fileStatuses = fs.listStatus(new Path("/root/data/input"));
        System.out.println(Arrays.toString(fileStatuses)); //打印根文件夹下面的东西
        Path path = new Path("/root/data/input/log.txt");
        FSDataInputStream fsDataInputStream = fs.open(path);
        BufferedReader bufferedReader = new BufferedReader(new InputStreamReader(fsDataInputStream));
        System.out.println("读取文件："+path);
        String line;
        while ((line = bufferedReader.readLine()) != null) {
            System.out.println(line);
        }
        bufferedReader.close();
        fsDataInputStream.close();
    }
}


```

![image-20220503144029112](https://cdn.fengxianhub.top/resources-master/202205031441477.png)

保存退出

这里需要加载四个路径下的jar，用extCLassLoader进行加载

```java
/root/fengyuan-liang/hadoop-2.10.1/share/hadoop/common
/root/fengyuan-liang/hadoop-2.10.1/share/hadoop/hdfs
/root/fengyuan-liang/hadoop-2.10.1/share/hadoop/common/lib:
/usr/lib/jvm/jre-1.8.0-openjdk/lib
```

你要找到自己的jar路径然后像我下面一下拼接起来

使用编译命令

```java
javac -Djava.ext.dirs=/root/fengyuan-liang/hadoop-2.10.1/share/hadoop/common:/root/fengyuan-liang/hadoop-2.10.1/share/hadoop/hdfs:/root/fengyuan-liang/hadoop-2.10.1/share/hadoop/common/lib:/usr/lib/jvm/jre-1.8.0-openjdk/lib   demo.java

```

![image-20220503144551421](https://cdn.fengxianhub.top/resources-master/202205031445544.png)

运行

```java
java -Djava.ext.dirs=/root/fengyuan-liang/hadoop-2.10.1/share/hadoop/common:/root/fengyuan-liang/hadoop-2.10.1/share/hadoop/hdfs:/root/fengyuan-liang/hadoop-2.10.1/share/hadoop/common/lib:/usr/lib/jvm/jre-1.8.0-openjdk/lib   demo
```

![image-20220503144639706](https://cdn.fengxianhub.top/resources-master/202205031446797.png)



## 附录 hadoop常用命令

更多命令请看hadoop官方中文文档！！！！！

<a href="https://hadoop.apache.org/docs/r1.0.4/cn/hdfs_shell.html">hadoop官方中文文档</a>

```css
1 hadoop fs -ls <path>

   列出指定目录下的内容，支持pattern匹配。输出格式如filename（full path）<r n>size.n代表备份数。

2 hadoop fs -lsr <path>

   递归列出该路径下所有子目录信息

3 hadoop fs -du<path>

显示目录中所有文件大小，或者指定一个文件时，显示此文件大小

4 hadoop fs -dus<path>

显示文件大小 相当于 linux的du -sb s代表显示只显示总计，列出最后的和 b代表显示文件大小时以byte为单位

5 hadoop fs -mv <src> <dst> 

将目标文件移动到指定路径下，当src为多个文件，dst必须为目录

6 hadoop fs -cp <src> <dst>

拷贝文件到目标位置，src为多个文件时，dst必须是个目录

7 hadoop fs -rm [skipTrash] <src>

删除匹配pattern的指定文件

8 hadoop fs -rmr [skipTrash] <src>

递归删除文件目录及文件

9 hadoop fs -rmi [skipTrash] <src>

为了避免误删数据，加了一个确认

10 hadoop fs -put <> ... <dst>

从本地系统拷贝到dfs中

11 hadoop fs -copyFromLocal<localsrc>...<dst>

从本地系统拷贝到dfs中,与-put一样

12 hadoop fs -moveFromLocal <localsrc>...<dst>

从本地系统拷贝文件到dfs中，拷贝完删除源文件

13 hadoop fs -get [-ignoreCrc]  [-crc] <src> <localdst>

 从dfs中拷贝文件到本地系统，文件匹配pattern，若是多个文件，dst必须是个目录

14 hadoop fs -getmerge  <src> <localdst>

从dfs中拷贝多个文件合并排序为一个文件到本地文件系统

15 hadoop fs -cat <src>

输出文件内容

16 hadoop fs -copyTolocal [-ignoreCre] [-crc] <src> <localdst>

与 -get一致

17 hadoop fs -mkdir <path>

在指定位置创建目录

18 hadoop fs -setrep [-R] [-w] <rep> <path/file>

设置文件的备份级别，-R标志控制是否递归设置子目录及文件

19 hadoop fs -chmod [-R] <MODE[,MODE]...|OCTALMODE>PATH

修改文件权限， -R递归修改 mode为a+r,g-w,+rwx ,octalmode为755

20 hadoop  fs -chown [-R] [OWNER][:[GROUP]] PATH

递归修改文件所有者和组

21 hadoop fs -count[q] <path>

统计文件个数及占空间情况，输出表格列的含义分别为：DIR_COUNT.FILE_COUNT.CONTENT_SIZE.FILE_NAME，如果加-q 的话，还会列出QUOTA,REMAINING_QUOTA,REMAINING_SPACE_QUOTA

Hadoop fs –test –[ezd] PATH     对PATH进行如下类型的检查：-e PATH是否存在，如果PATH存在，返回0，否则返回1；-z 文件是否为空，如果长度为0，返回0，否则返回1； -d 是否为目录，如果PATH为目录，返回0，否则返回1

```



















