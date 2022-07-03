# MapReduce原理剖析

在上一篇文章我们已经做了非常多的`MapReduce`案例，你可能惊叹MapReduce的功能，对其完成分布式计算的细节充满了好奇，接下来这篇文章让我们剖析`MapReduce`的实现过程（知识点总结自官方文档和尚硅谷大海哥hadoop）

首先我们要注意一下在MapReduce中的这一行代码

```java
/* 0表示正常退出，1表示错误退出 */
System.exit(job.waitForCompletion(true) ? 0 : 1);
```

这是我们做好了所有准备工作后，执行方法`org.apache.hadoop.mapreduce.job#waitForCompletion`，接下来让我们以此进行研究

我们知道`MapReduce`是一个分布式计算框架，在Hadoop集群中有很多的结点，他们扮演着不同的角色

| 实体名称                                     | 功能                                                         |
| -------------------------------------------- | ------------------------------------------------------------ |
| 客户端（client）                             | client负责提交MapReduce作业                                  |
| YARN资源管理器（JobTracker/resourcemanager） | 它负责协调集群上计算机资源的分配                             |
| YARN节点管理器（TaskTracker/nodemanager）    | 它负责启动和监视集群中机器上的计算容器（Container）          |
| MapReduce的application master                | 它负责协调运行MapReduce作业的所有任务，它和MapReduce任务都在容器中运行，这些容器由资源管理器分配并且由节点管理器进行管理 |
| 分布式文件系统（一般是HDFS）                 | 它主要用于与其他实体之间共享作业文件                         |

在`MapReduce`中采用的是主从架构：

- 主节点只有一个（位于Master节点）：JobTracker/resourcemanager
  - 接收客户提交的计算任务
  - 把计算任务分给TaskTracker执行
  - 监控TaskTracker的执行情况
- 从节点有很多个（位于Slave节点）：TaskTracker/nodemanager
  - 执行JobTracker分配的计算任务，实列化用户程序，在本地执行任务，并周期性地向JobTracker汇报状态

>`JobTracker`详解：
>
>- 一个MR集群只有一个JobTracker，一般运行在可靠的硬件上。TaskTracker通过周期心跳来通知JobTracker其当前的健康状态，每一次心跳包含了可用的map和reduce任务数目，占用的数目以及运行中的任务详细信息
>-  JobTracker利用一个线程池来同时处理心跳和客户请求。当一个任务被提交时，组成作业的每一个任务的信息都会存储在内存中，在任务运行的时候，这些任务会伴随着TaskTracker的心跳而更新，因此可以实时地反映任务进度和健康状况
>
>`TaskTracker`详解：
>
>- 在每一个工作节点上只会有一个TaskTracker
>- TaskTracker和DataNode运行在一台机器上，从而使得每一台物理机器既是计算节点，也是一个存储节点
>- 每一个TaskTracker能够配置的map和reduce的任务片数(TaskSlot)就代表每一种任务能被并行执行的数目.

下面的图是`MapReduce`的大致执行流程，下面的每一步都会在后面进行解析：

![image-20220622125444039](https://cdn.fengxianhub.top/resources-master/202206221254211.png)

我们可以大致将`MapReduce`的操作划分为以下六步：

1. 提交任务
2. 初始化作业
3. 任务分配
4. 任务执行
5. 进度和状态更新
6. 作业完成

## 1. 概述

### 1.1 提交任务

>在哪个节点上提交作业时，就在这个节点 开启一个`JobClient`客户端对象，并调用其`submitjob()`方法提交作业, 之后，`JobClient`对象的`runjob()`方法会每秒轮询作业的进度，如发现作业自上次报告后有所改变，就把作业运行进度报告到控制台。作业完成后，如成功，就显示作业计数器，进而显示作业执行所花费的时间等相关信息，如失败，就会把导致作业失败的错误信息记录到控制台

我们提交`MapReduce`任务是通过`org.apache.hadoop.mapreduce.Job`进行提交，有两种提交方法：

```java
- org.apache.hadoop.mapreduce.Job#submit()
- org.apache.hadoop.mapreduce.Job#waitForCompletion(boolean verbose)
```

区别在于：

- `submit()` 是通过一个简单的方式法调用来运行MR作业Job对象上的`submit()`，直接将作业提交到Hadoop集群的平台，而客户端没有任何日志输出，**任务提交后会立即返回**
- `waitForCompletion(boolean verbose)`用于提交之前没有处理过的作业，并等待它的完成，客户端会时刻打印作业执行的进度信息，如出现异常，也会立刻将异常信息打印出来，**任务提交后会等待执行完毕会再返回**

我们通过查看对应源码可以发现其实`waitForCompletion()`内部是调用了`submit()` 方法的

### 1.2 初始化作业

JobTracker接收到Job对象对其submitJob()方法的调用后，就会把这个调用放入一个 ***内部队列***  中，交由作业调度器(Job Scheduler)进行调度,并对其进行初始化

**作业调度器种类有：**

- 先进先出调度器
- 容量调度器
- 公平调度器

**初始化工作：**

创建一个表示正在运行作业的对象(它封装任务和记录信息，以便跟踪任务的状态和进程)

<hr/>

当初始化好之后就会**创建任务运行列表**，包括map和reduce任务。

1. 作业调度器从HDFS中获取JobClient已计算好的输入分片信息，然后为每个分片创建一个map任务，并且创建Reduce任务
   - reduce任务数量的确认方法：
     - 由job的mapred.reduce.task属性决定
     - 通过显式编程方式调用Job的setNumReduceTasks()方法设置reduce任务的个数
2. 除了map和reduce任务，还有setupJob和cleanupJob需要建立（**MapReduce的生命周期钩子函数**）
   - setupJob用于MapReduce框架在执行map之前进行资源的集中初始化工作
   - cleanupJob方法是在map任务执行完后，用以进行相关变量或资源的释放工作
   - ***以上方法都只被MapReduce框架执行一次***

### 1.3 任务分配

1. TaskTracker定期通过`心跳`与JobTracker进行通信，主要是告知JobTracker自身是否还存活，以及是否已经准备好运行新的任务等
2.   JobTracker在为TaskTracker选择任务之前，必须先通过作业调度器选定任务所在的作业
3. 每个TaskTracker都有固定数量的map和reduce`任务槽`，数量取决于TaskTracker节点的CPU内核数量和内存大小，JobTracker会先将TaskTracker的map槽填满，再填此TaskTracker的reduce槽，任务槽限定了在某一个TaskTracker所在的节点上最多能运行多少个map任务. 
4.  JobTracker分配map任务时会选取与输入分片最近的TaskTracker(任务本地化).分配reduce任务时不考虑

### 1.4 任务执行

1. TaskTracker分配到一个任务后，通过从HDFS把作业的Jar文件复制到TaskTracker所在的文件系统（Jar本地化用来启动JVM），同时TaskTracker将应用程序所需要的全部文件从分布式缓存复制到本地磁盘
2. TaskTracker为任务新建一个本地工作目录，并把Jar文件中的内容解压到这个文件夹中
3. TaskTracker新建军一个TaskRunner实例来启动一个新的JVM来运行每个Task（包括MapTask和ReduceTask），子进程通过`umbilical`接口与父进程进行通信，Task的子进程每隔几秒便告知父进程它的进度，直到任务完成

### 1.5 进度和状态更新

1. 一个作业和它的每个任务都有一个状态信息，包括作业或任务的运行状态，Map和Reduce的进度，计数器值，状态消息或描述（可以由用户代码来设置）。这些状态信息在作业期间不断改变
2. Child JVM有独立的线程，每隔3秒检查一次任务更新标志，如有更新则报告给此TaskTracker,TaskTracker`每隔5秒`给JobTracker发一次心跳信息。而JobTracker将合并这些更新，产生一个表明所有运行作业及其任务状态的全局视图
3. 同时JobClient通过每秒查询JobTracker来获得最新状态，并且输出到控制台上

### 1.6 作业完成

当JobTracker收到作业最后一个任务已完成的通知后，便把作业的状态设置为`成功`。然后，在JobClient查询状态时，便知道作业已成功完成，于是JobClient打印一条消息告知用户，最后从runJob()方法返回。最后，JobTracker清空作业的工作状态，指示TaskTracker也清空作业的工作状态

## 2. 提交任务&切片源码分析

### 2.1 提交任务源码分析

在源码中添加注释的方式请看笔者的另一篇博客：<a href="https://blog.csdn.net/fengxiandada/article/details/125042628">超简单方式在IDEA的源码中添加注释（不影响debug）</a>

我们可以沿着提交任务的两种方法往下分析：

```java
- org.apache.hadoop.mapreduce.Job#submit()
- org.apache.hadoop.mapreduce.Job#waitForCompletion(boolean verbose)
```

![image-20220622113709831](https://cdn.fengxianhub.top/resources-master/202206221137138.png)

接下来让我们看`submit()`的源码：

![image-20220622192056179](https://cdn.fengxianhub.top/resources-master/202206221920432.png)

继续进入`connect()`方法中：

![image-20220622192157545](https://cdn.fengxianhub.top/resources-master/202206221921608.png)

进入` new Cluster(getConfiguration())`中：

![image-20220622192415974](https://cdn.fengxianhub.top/resources-master/202206221924045.png)

这里其实就是创建了一个提交任务给集群的客户端，由于在Hadoop中有集群模式也有单机模式，所以这里有两种客户端：

```java
- org.apache.hadoop.mapred.LocalClientProtocolProvider
- org.apache.hadoop.mapred.YarnClientProtocolProvider
```

![image-20220622194411045](https://cdn.fengxianhub.top/resources-master/202206221944104.png)

让我们回到`submit()`函数的这一行中`submitter.submitJobInternal(Job.this, cluster)`中，这里就是执行任务的地方了

![image-20220622194835033](https://cdn.fengxianhub.top/resources-master/202206221948130.png)

后面是一些缓存操作，重要的在190行`copyAndConfigureFiles(job, submitJobDir);`中，我们进入其中：

![image-20220622195753486](https://cdn.fengxianhub.top/resources-master/202206221957564.png)

这里向集群提交了一些配置文件和jar包，在下面的代码中我们可以清楚的看到，如果是集群模式会提交`JobJar`，如果是本地模式则不会提交

我们接着往下找：

![image-20220622205151387](https://cdn.fengxianhub.top/resources-master/202206222051481.png)

在writeSplits方法中设置了切片数量，此外我们需要观察提交文件的临时目录（笔者是在E盘下的temp目录下），我们可以通过debug看到临时的目录：

![image-20220622210822084](https://cdn.fengxianhub.top/resources-master/202206222108635.png)

当执行到`writeConf(conf, submitJobFile);`时，我们会发现临时目录会多两个文件

![image-20220622212726919](https://cdn.fengxianhub.top/resources-master/202206222127096.png)

高亮的是程序之前生成的，其余的两个是程序执行到上面的方法时生成的，重点在这个 ***job.xml*** 文件中

里面存放着MapReduce运行的所有参数，此外 ***job.split*** 文件也非常重要，如果我们是在集群环境下，还有有一个job.jar的文件，这三个文件会统一提交给集群

如果有人问我们是否看过MapReduce的源码，我们要如何证明？

我们可以说通过查看源码返现客户端提交了这三个文件给集群：

- job.xml
- job.split
- job.jar

### 2.2 提交核心之切片流程源码分析

让我们来重点分析一下这一行代码：（在org.apache.hadoop.mapreduce.JobSubmitter下）

```java
int maps = writeSplits(job, submitJobDir);
```

![image-20220622223723477](https://cdn.fengxianhub.top/resources-master/202206222237647.png)

![image-20220622223802592](https://cdn.fengxianhub.top/resources-master/202206222238686.png)

继续进入`input.getSplits(job)`中，选择实现类`FileInputFormat`，此类继承自`InputFormat`

我们可以看到我们最为熟悉的两种切片方式：

![image-20220622224825176](https://cdn.fengxianhub.top/resources-master/202206222248299.png)

切片源码：

![image-20220622230555094](https://cdn.fengxianhub.top/resources-master/202206222305238.png)

可能这些源码太多了太杂了，所以我挑重点的部分展示一下：

他的流程如下：

1. 程序先找到你数据存储的目录

2. 开始遍历处理（规划切片）目录下的每一个文件

3. 遍历第一个文件ss.txt

   1. 获取文件大小fs.sizeOf(ss.txt)

   2. 计算切片大小

      ```java
      computeSplitSize(Math.max(minSize,Math.min(maxSize,blocksize))) // 默认blocksize=128M
      ```

   3. 默认情况下，切片大小=blocksize

   4. 开始切，形成第1个切片：ss.txt—0:128M 第2个切片ss.txt—128:256M 第3个切片ss.txt—256M:300M（***每次切片时，都要判断切完剩下的部分是否大于块的1.1倍，不大于1.1倍就划分一块切片***）

   5. 将切片信息写到一个切片规划文件中（job.split）

   6. 整个切片的核心过程在`getSplit()`方法中完成

   7. ***InputSplit只记录了切片的元数据信息***，比如起始位置、长度以及所在的节点列表等

4. 提交切片规划文件到YARN上，YARN上的MrAppMaster就可以根据切片规划文件计算开启MapTask个数

### 2.3 FileInputFormat 切片机制

>MapReduce中的切片机制是非常重要的，所以我们重点分析一下

#### 2.3.1 切片机制

- 简单地按照文件的内容长度进行切片
- 切片大小，默认等于Block大小
- ***切片时不考虑数据集整体，而是逐个针对每一个文件单独切片***

#### 2.3.2 案例分析

例如现在有两个文件需要计算：

```java
- file1.txt 320M 
- file2.txt 10M
```

经过FileInputFormat的切片机制运算后，形成的切片信息如下:

```java
- file1.txt.split1 -- 0~128
- file1.txt.split2 -- 128~256
- file1.txt.split3 -- 256~320
- file2.txt.split1 -- 0~10M
```

这里记住如果超过分片默认大小128M但是小于其1.1倍，也就是140.8M

#### 2.3.3 源码中计算切片大小的公式

源码如下：

```java
long splitSize = computeSplitSize(blockSize, minSize, maxSize);
```

此方法如下：

```java
Math.max(minSize, Math.min(maxSize, blockSize)); // 计算切片大小
```

因为

```java
mapreduce.input.fileinputformat.split.minsize=1 默认值为1
mapreduce.input.fileinputformat.split.maxsize= Long.MAXValue 默认值Long.MAXValue    
```

因此，默认情况下，***切片大小 = blocksize***

**切片大小设置**

- maxsize（切片最大值）：参数如果调得比blockSize小，则会让切片变小，而且就等于配置的这个参数的值
- minsize（切片最小值）：参数调的比blockSize大，则可以让切片变得比blockSize还大

**获取切片信息API**

```java
// 获取切片的文件名称
String name = inputSplit.getPath().getName();
// 获取切片的文件名称
String name = inputSplit.getPath().getName();
```

### 2.4 FileInputFormat 实现类

读者可能有这样的疑问，我输入的文件不一定是文本，也可能是二进制文件，那到底如何切片呢？

其实在运行 MapReduce 程序时，输入的文件格式支持：

`基于行的日志文件`、`二进制格式文件`、`数据库表`等

那么，针对不同的数据类型，MapReduce 是如何读取这些数据的呢

FileInputFormat 常见的接口实现类包括（在1.2中源码分析截图中可以看到，下面只是常见的）：

- TextInputFormat
- KeyValueTextInputFormat
-  NLineInputFormat
- CombineTextInputFormat 
- 自定义 InputFormat 

#### 2.4.1 TextInputFormat

TextInputFormat 是默认的 FileInputFormat 实现类。按行读取每条记录。键是存储该行在整个文件中的起始字节偏移量， 

`LongWritable` 类型。值是这行的内容，不包括任何行终止 符（换行符和回车符），`Text` 类型

```java
public class TextInputFormat extends FileInputFormat<LongWritable, Text> 
```

例如下面的文件：

```java
Rich learning form
Intelligent learning engine
Learning more convenient
From the real demand for more close to the enterprise
```

会被切分为（换行符\n占用两个偏移量）：

```java
(0,Rich learning form)
(20,Intelligent learning engine)
(49,Learning more convenient)
(74,From the real demand for more close to the enterprise)
```

#### 2.4.2 CombineTextInputFormat 切片机制

框架默认的 TextInputFormat 切片机制是对 ***任务按文件规划切片***，不管文件多小，都会是一个单独的切片，都会交给一个 ***MapTask***，这

样如果有大量小文件，就会产生大量的 MapTask，**处理效率极其低下**

这时候我们可能需要先将小文件合并一下再进行切片，所以就有了下面的切片方式

**应用场景：**

CombineTextInputFormat 用于小文件过多的场景，**它可以将多个小文件从逻辑上规划到 一个切片中**，这样，多个小文件就可以交给一个 MapTask 处理

>我们需要先了解Combine切片的过程和一些设置

生成切片过程包括：***虚拟存储过程***  和 ***切片过程*** 二部分，在真正的分片之前，有一个虚拟存储切片的过程

**我们需要设置虚拟存储切片最大值**

```java
CombineTextInputFormat.setMaxInputSplitSize(job, 4194304); // 4m
```

**虚拟存储过程如下：**	

​		将输入目录下所有文件大小，依次和设置的 setMaxInputSplitSize 值比较，如果不大于设置的最大值，逻辑上划分一个块。如果输入文件大于设置的最大值且大于两倍， 那么以最大值切割一块；**当剩余数据大小超过设置的最大值且不大于最大值 2 倍，此时 将文件均分成 2 个虚拟存储块**（防止出现太小切片）

​		例如 setMaxInputSplitSize 值为 4M，输入文件大小为 8.02M，则先逻辑上分成一个 4M。剩余的大小为 4.02M，如果按照 4M 逻辑划分，就会出现 0.02M 的小的虚拟存储 文件，所以将剩余的 4.02M 文件切分成（2.01M 和 2.01M）两个文件

**切片过程如下：**

- 判断虚拟存储的文件大小是否大于 setMaxInputSplitSize 值，大于等于则单独 形成一个切片
- 如果不大于则跟下一个虚拟存储文件进行合并，共同形成一个切片

例如有 4 个小文件大小分别为 1.7M、5.1M、3.4M 以及 6.8M 这四个小文件，则虚拟存储之后形成 6 个文件块，大小分别为：

1.7M，（2.55M、2.55M），3.4M 以及（3.4M、3.4M）

最终会形成 3 个切片，大小分别为：

（1.7+2.55）M，（2.55+3.4）M，（3.4+3.4）M

这样做的好处非常明显，就是防止小文件单独成为一个切片，导致系统资源额外的开销

实现也非常简单，在主方法里添加即可：

```java
// 如果不设置 InputFormat，它默认用的是 TextInputFormat.class
job.setInputFormatClass(CombineTextInputFormat.class);
//虚拟存储切片最大值设置 4m
CombineTextInputFormat.setMaxInputSplitSize(job, 4194304);
```

### 2.3 源码小结

![image-20220622222641262](https://cdn.fengxianhub.top/resources-master/202206222226779.png)

对应源码追踪为：

```java
waitForCompletion()
    submit();
// 1 建立连接
connect();
    // 1）创建提交 Job 的代理
    new Cluster(getConfiguration());
        // （1）判断是本地运行环境还是 yarn 集群运行环境
        initialize(jobTrackAddr, conf);
// 2 提交 job
submitter.submitJobInternal(Job.this, cluster)
    // 1）创建给集群提交数据的 Stag 路径
    Path jobStagingArea = JobSubmissionFiles.getStagingDir(cluster, conf);
    // 2）获取 jobid ，并创建 Job 路径
    JobID jobId = submitClient.getNewJobID();
    // 3）拷贝 jar 包到集群
    copyAndConfigureFiles(job, submitJobDir);
    rUploader.uploadFiles(job, jobSubmitDir);
    // 4）计算切片，生成切片规划文件
    writeSplits(job, submitJobDir);
    maps = writeNewSplits(job, jobSubmitDir);
    input.getSplits(job);
    // 5）向 Stag 路径写 XML 配置文件
    writeConf(conf, submitJobFile);
    conf.writeXml(out);
    // 6）提交 Job,返回提交状态
    status = submitClient.submitJob(jobId, submitJobDir.toString(),
```

## 3. shuffle分析

这里我们贴一张更加详细的MapReduce原理流程图：

![image-20220624164802350](https://cdn.fengxianhub.top/resources-master/202206241648434.png)

![image-20220624164819774](https://cdn.fengxianhub.top/resources-master/202206241648996.png)

前面切片的逻辑是在Map的过程中执行的，切片的数量决定集群中MapTask的数量

接下来我们具体研究 ***shuffle*** 的流程，Shuffle 过程只是从第 7 步开始到第 16 步结束，具体过程如下

1. MapTask 收集我们的 map()方法输出的 kv 对，放到内存缓冲区中
2. 从内存缓冲区不断溢出本地磁盘文件，可能会溢出多个文件
3. 多个溢出文件会被合并成大的溢出文件
4. 在溢出过程及合并的过程中，都要调用 Partitioner 进行分区和针对 key 进行排序
5. ReduceTask 根据自己的分区号，去各个 MapTask 机器上取相应的结果分区数据
6. ReduceTask 会抓取到同一个分区的来自不同 MapTask 的结果文件，ReduceTask 会将这些文件再进行合并（***归并排序*** ）
7. 合并成大文件后，Shuffle 的过程也就结束了，后面进入 ReduceTask 的逻辑运算过 程（从文件中取出一个一个的键值对 Group，调用用户自定义的 reduce()方法）

**注意：**

- Shuffle 中的缓冲区大小会影响到 MapReduce 程序的执行效率，原则上说，缓冲区 越大，磁盘 io 的次数越少，执行速度就越快
- 缓冲区的大小可以通过参数调整，参数：mapreduce.task.io.sort.mb 默认 100M

### 3.1 Shuffle 机制

**我们知道Map 方法之后，Reduce 方法之前的数据处理过程称之为 Shuffle**

![image-20220624165510188](https://cdn.fengxianhub.top/resources-master/202206241655376.png)

### 3.2 环形缓存区

![image-20220624172335096](https://cdn.fengxianhub.top/resources-master/202206241723328.png)

从上图可以看到，map之后的数据会先进入一个环形缓冲区（MapOutputBuffer），`MapOutputBuffer`内部使用了一个缓冲区暂时存储用户输出数据，当缓冲区使用率达到一定阈值后，再将缓冲区中的数据写到磁盘上

MapOutputBuffer的作用为：

- 可以利用这块内存区域，减少数据溢写时Map的停止时间
- 数据可以循环写到硬盘，不用担心OOM的问题
- 在有效的空间内，能够更加高效的在内存中执行操作

MapOutputBuffer默认大小100M，其左侧存储的是索引和索引元数据，右侧存储的是map输出的kv结构的数据，当Map的数据源源不断的被缓存区缓存，当缓存区达到 ***80%*** 时，就会发生 ***反向溢写***

所谓的**反向溢写就是当数据达到阈值后，开始向外将数据溢写到硬盘**，溢写的时候还有20M的空间可以被使用，效率并不会被减缓，这里其实很好理解，例如一个水池装了80%的水后就应该放水了，留下一些空间进行容错处理

这里贴一下默认环形缓存区源码的地址，源码有点复杂，且牵涉到很多数学运输，有兴趣的同学可以读一下：

```java
- org.apache.hadoop.mapred#collect(K key, V value, final int partition)
```

### 3.3 Partition 分区

环形缓存区之后就会进行分区（Partition ），分区的概念需要结合具体的业务场景，例如，要求将统计结果按照条件输出到不同文件中（分区）。具体一点的需求例如将统计结果按照手机归属地不同省份输出到不同文件中（分区）

```java
org.apache.hadoop.mapreduce.Partitioner
```

默认Partitioner实现类为HashPartitioner，对应源码为：

```java
public class HashPartitioner<K, V> extends Partitioner<K, V> {

  /** Use {@link Object#hashCode()} to partition. */
  public int getPartition(K key, V value,
                          int numReduceTasks) {
    return (key.hashCode() & Integer.MAX_VALUE) % numReduceTasks;
  }

}
```

`key.hashCode() & Integer.MAX_VALUE`：对最大值进行与运算 的作用是为了去负号、取绝对值

与运算的规则是：0&0=0; 0&1=0; 1&0=0; 1&1=1;

所以任意的int 数值对 Integer.MAX_VALUE进行 &（与运算时）会得到其 **绝对值**

`% numReduceTasks`是为了进行分区，也就是将数据进行分隔

这里的numReduceTasks我们可以设置，设置为2，最后的输出目录就会有两个

```java
- job1.setNumReduceTasks(2);
```

接下来我们看下源码：

由于分区是发生在map之后，所有我们在map输出`context.write(word, one);`的这里打一个断点

一直往下，我们可以先看到环形缓存区：

调用的是：

```java
- org.apache.hadoop.mapred.MapTask#write(K key, V value)
```

![image-20220625190714387](https://cdn.fengxianhub.top/resources-master/202206251907533.png)

再往下就走到分区的代码中了：

![image-20220624175126530](https://cdn.fengxianhub.top/resources-master/202206241751655.png)

如果我们不设置分区数，使用默认值，就不会走HashPartitioner，而是进入

```java
- org.apache.hadoop.mapred.MapTask.NewOutputCollector#NewOutputCollector()
```

![image-20220624175932174](https://cdn.fengxianhub.top/resources-master/202206241759269.png)

>默认分区是根据key的hashCode对ReduceTasks个数取模得到的。用户没法控制哪个 key存储到哪个分区

那我们可以自定义分区吗？按我们自己的想法进行分区，当然是可以的

**自定义Partitioner步骤：**

1. 自定义类继承Partitioner，重写getPartition()方法

   ```java
   public class MyPartition extends Partitioner<IntWritable, IntWritable> {
       /**
        * @param IntWritable 
        * @param intWritable 
        * @param numPartitions 由numPartitions框架传给你，但是由程序job.setNumReduceTasks(3) 参数决定
        */
       @Override
       public int getPartition(IntWritable key, IntWritable intWritable, int numPartitions) {
           /*
            * 计算hash
            */
           return key % numPartitions;
       }
   }
   ```

2. 在Job驱动中，设置自定义Partitioner

   ```java
   /* 设置分区规则 */
   job.setPartitionerClass(MyPartition.class);
   ```

3. 自定义Partition后，要根据自定义Partitioner的逻辑设置相应数量的ReduceTask，注意，这里是一定要设计的，看什么的源码，如果不设置他不会调用我们写的分区方法！！！

   ```java
   /* 设置reduce任务数 */
   job.setNumReduceTasks(3);
   ```

**分区总结：**

1. 如果ReduceTask的数量> getPartition的结果数，则会多产生几个空的输出文件part-r-000xx
2. 如果1<ReduceTask的数量<getPartition的结果数，则有一部分分区数据无处安放，会Exception
2. 如 果ReduceTask的数量=1，则不管MapTask端输出多少个分区文件，最终结果都交给这一个 ReduceTask，最终也就只会产生一个结果文件 part-r-00000
2. 分区号必须从零开始，逐一累加

案例分析：

例如：假设自定义分区数为5，则

```java
job.setNumReduceTasks(1); //会正常运行，只不过会产生一个输出文件
job.setNumReduceTasks(2); //会报错 大于5
job.setNumReduceTasks(6); //大于5程序会正常运行，会产生空文件
```

### 3.4 分区排序

分区之后紧接着就是排序了，排序是MapReduce框架中最重要的操作之一

MapTask和ReduceTask均会对数据按照	 ***key*** 进行排序。该操作属于 ***Hadoop的默认行为***。任何应用程序中的数据均会被排序，而不管逻辑上是否需要

**默认排序是按照字典顺序排序，且实现该排序的方法是快速排序**

>让我们回忆一下在整个MapReduce的生命周期，排序是发生在 shuffle和reduce中的（map阶段两次快排和归并、reduce阶段一次归并）

排序的时机：

- 对于MapTask，它会将处理的结果暂时放到环形缓冲区中，***当环形缓冲区使 用率达到一定阈值后***，再对缓冲区中的数据进行一次***快速排序（在内存中完成）***，并将这些有序数据溢写到磁盘上，而当数据处理完毕后，它会对磁盘上***所有文件进行归并排序***
- 对于ReduceTask，它从每个MapTask上远程拷贝相应的数据文件，如果文件大 小超过一定阈值，则溢写磁盘上，否则存储在内存中。如果磁盘上文件数目达到 一定阈值，则进行一次归并排序以生成一个更大文件；如果内存中文件大小或者 数目超过一定阈值，则进行一次合并后将数据溢写到磁盘上。当所有数据拷贝完毕后，***ReduceTask统一对内存和磁盘上的所有数据进行一次归并排序***

为什么一定要排序呢？是为了提升reduce阶段的效率，这个后面在看源码的时候会重点分析

如果我们要自定义排序，其实是加在这个地方的，系统自带的是我们无法掌握的：

![image-20220624223252698](https://cdn.fengxianhub.top/resources-master/202206242232926.png)

### 3.5 排序分类

1. **部分排序**

   MapReduce根据输入记录的键对数据集排序。***保证输出的每个文件内部有序***

2. **全排序**

   ***最终输出结果只有一个文件，且文件内部有序***。实现方式是只设置一个ReduceTask。但该方法在 处理大型文件时效率极低，因为一台机器处理所有文件，完全丧失了MapReduce所提供的并行架构

   注意：这种方式会将所有数据放到一个reduce中处理，一般不会使用

3. **辅助排序**：（GroupingComparator分组）

   在Reduce端对key进行分组。应用于：在接收的key为bean对象时，想让一个或几个字段相同（全部字段比较不相同）的key进入到同一个reduce方法时，可以采用分组排序

4. **二次排序（自定义排序）**

   在自定义排序过程中，如果compareTo中的判断条件为两个即为二次排序

这里其实就可以看出，在MapReduce程序中 ***key*** 是一定要能够排序的，所以如果我们自定义key，一定要实现`WritableComparable`接口，bean 对象做为 key 传输，需要实现 WritableComparable 接口重写 compareTo 方法，就可以实现排序

具体栗子可以看笔者的另一篇文章：

### 3.6 Combine

首先我们回顾一下Combine的位置，一共有两个地方可以发生Combine：

- 环形缓存区溢写之前可以进行一次Combine（在 ***Map阶段*** ）
- 收集mapTask提交的数据合并压缩前可以进行一次Combine（ ***Reduce阶段*** ）

![image-20220625141852402](https://cdn.fengxianhub.top/resources-master/202206251418511.png)

Combine的特点有：

1. Combiner是MR程序中Mapper和Reducer之外的一种组件

2. Combiner组件的父类就是Reducer

3. Combiner和Reducer的区别在于运行的位置

   - ***Combiner是在每一个MapTask所在的节点运行***
   - ***Reducer是接收全局所有Mapper的输出结果***

4. Combiner的意义就是对每一个MapTask的输出进行局部汇总，以减小网络传输量

5. Combiner能够应用的前提是不能影响最终的业务逻辑，而且，Combiner的输出kv 应该跟Reducer的输入kv类型要对应起来

   例如在求平均值的场景里，如果使用Combiner会出现错误：

   ```java
       Mapper                          	Reducer
   Mapper1：3 5 7 ->(3+5+7)/3=5            (3+5+7+2+6)/5 != (5+4)/2 
   Mapper2：2 6 ->(2+6)/2=4
   ```

   当然求和是可以的，但是不能影响最终的业务逻辑

## 4. OutputFormat数据输出

我们首先看一下OutputFormat 所处的位置，可以看到是出于reduce做完之后，结果输出到磁盘之前的这一个阶段

由一个核心的类`RecordWriter`做具体的实现，例如是写到文件中还是写到数据库

OutputFormat是MapReduce输出的基类，所有实现MapReduce输出都实现了 OutputFormat 接口，默认使用的是`TextOutputFormat`实现，按行写出到一个文件中

![image-20220625150004675](https://cdn.fengxianhub.top/resources-master/202206251500889.png)

OutputFormat 一共有四个实现类：

![image-20220625150625816](https://cdn.fengxianhub.top/resources-master/202206251506953.png)

其中的`FileOutputFormat`又是一个抽象类，它有三个具体的实现：

![image-20220625150801323](https://cdn.fengxianhub.top/resources-master/202206251508470.png)

默认使用的是TextOutputFormat进行实现

FileOutputFormat里面最重要的抽象方法是：

```java
public abstract RecordWriter<K, V> getRecordWriter(TaskAttemptContext job) throws IOException, InterruptedException;
```

虽然OutputFormat 有很多的实现类，但是并不能满足所有的生产环境，往往需要我们自己实现`RecordWriter`方法，接下来我们就自己实现一个

### 4.1 自定义OutputFormat 

我们现在有以下数据集：

```java
boy 张三
girl 小莉
boy 李四
girl 静静
boy 王五
girl 乐乐    
```

现在我们要将其分别输出到 `boy.txt` 和 `girl.txt` 中，显然之前我们所学的不能满足我们的要求

这里需要自定义一个OutputFormat类并创建一个类LogRecordWriter继承RecordWriter

- 创建两个文件的输出流：boyOut、girlOut
- 如果输入数据包含boy，输出到boyOut流，反之输出到girlOut中去
- 将自定义的输出格式组件设置到job中 `job.setOutputFormatClass(LogOutputFormat.class)`

mapper：

```java
public class OutMapper extends Mapper<LongWritable, Text, Text, Text> {
    @Override
    protected void map(LongWritable key, Text value, Context context) throws IOException, InterruptedException {
        String[] strs = value.toString().split("\t");
        context.write(new Text(strs[0]), new Text(strs[1]));
    }
}
```

reduce：

```java
public class OutReduce extends Reducer<Text, Text,Text, NullWritable> {
    @Override
    protected void reduce(Text key, Iterable<Text> values, Context context) throws IOException, InterruptedException {
        for(Text text : values){
            context.write(new Text(key.toString() + text.toString()),NullWritable.get());
        }
    }
}
```

自定义OutputFormat：

```java
public class MyOutputFormat extends FileOutputFormat<Text, NullWritable> {
    @Override
    public RecordWriter<Text, NullWritable> getRecordWriter(TaskAttemptContext job) throws IOException, InterruptedException {
        // 先创建RecordWriter
        MyRecordWriter myRecordWriter = new MyRecordWriter(job);
        return myRecordWriter;
    }
}
```

```java
public class MyRecordWriter extends RecordWriter<Text, NullWritable> {

    Path boyOut = new Path("E:\\workspacesJ2SE_idea\\bigData\\MapReduceDemo\\11_input\\inputword\\hello.txt");
    Path girlOut = new Path("E:\\workspacesJ2SE_idea\\bigData\\MapReduceDemo\\output");
    FSDataOutputStream boyOutStram;
    FSDataOutputStream girlOutStram;

    public MyRecordWriter(TaskAttemptContext job) {
        // 创建流 boyOut 和 girlOut
        try {
            FileSystem fs = FileSystem.get(job.getConfiguration());
            boyOutStram = fs.create(boyOut);
            girlOutStram = fs.create(girlOut);
        } catch (IOException ioException) {
            ioException.printStackTrace();
        }
    }

    @Override
    public void write(Text key, NullWritable value) throws IOException, InterruptedException {
        // 具体写
        if (key.toString().contains("boy")) {
            boyOutStram.writeBytes(str + "\n");
        } else if (key.toString().contains("girl")) {
            girlOutStram.writeBytes(str + "\n");
        }
    }

    @Override
    public void close(TaskAttemptContext context) throws IOException, InterruptedException {
        // 关闭流
        IOUtils.closeStream(boyOutStram);
        IOUtils.closeStream(girlOutStram);
    }
}
```

然后再写驱动类即可：

```java
public class OutApp {
    public static void main(String[] args) throws Exception {
        Configuration conf = new Configuration();
        /* yarn-site.xml 中的配置 */
        Job job = Job.getInstance(conf, "MyOutputFormat");
        /* mapper操作 */
        job.setMapperClass(OutMapper.class);
        job.setMapOutputKeyClass(Text.class);
        job.setMapOutputValueClass(Text.class);
        /* reduce操作，合并不同结点中的数据 */
        job.setReducerClass(OutReduce.class);
        /* 设置输出的类型 */
        job.setOutputKeyClass(Text.class);
        job.setOutputValueClass(NullWritable.class);

        /* 设置输入、输出目录，输出目录不能存在 */
        /* 设置输入输出的目录 */
        Path inputpath = new Path("E:\\workspacesJ2SE_idea\\bigData\\MapReduceDemo\\input\\outputFormat.txt");
        Path outpath = new Path("E:\\workspacesJ2SE_idea\\bigData\\MapReduceDemo\\output");
        /* 设置需要计算的文件 */
        FileInputFormat.addInputPath(job, inputpath);
        // 设置自定义的outPutFormat
        job.setOutputFormatClass(MyOutputFormat.class);
        /* 设置输出目录 */
        FileOutputFormat.setOutputPath(job, outpath);
        /* 0表示正常退出，1表示错误退出 */
        System.exit(job.waitForCompletion(true) ? 0 : 1);
    }
}
```

## 5. MapReduce 内核源码解析

### 5.1 MapTask 工作机制

首先我们应该知道mapTask应该分为五个阶段：

read（1-5）、map（6）、collect（7-8）、溢写阶段（9）、Merge阶段（10）

![image-20220625163021334](https://cdn.fengxianhub.top/resources-master/202206251630628.png)

- **Read 阶段**：MapTask 通过 InputFormat 获得的 RecordReader，从输入 InputSplit 中 解析出一个个 key/value

- **Map 阶段**：该节点主要是将解析出的 key/value 交给用户编写 map()函数处理，并 产生一系列新的 key/value

- **Collect 收集阶段**：在用户编写 map()函数中，当数据处理完成后，一般会调用 OutputCollector.collect()输出结果。在该函数内部，它会将生成的 key/value 分区（调用 Partitioner），并写入一个环形内存缓冲区中

- **Spill 阶段**：即“溢写”，当环形缓冲区满后，MapReduce 会将数据写到本地磁盘上， 生成一个临时文件。需要注意的是，将数据写入本地磁盘之前，先要对数据进行一次本地排序，并在必要时对数据进行合并、压缩等操作

  溢写阶段详情：

  - 步骤 1：利用快速排序算法对缓存区内的数据进行排序，排序方式是，先按照分区编号 Partition 进行排序，然后按照 key 进行排序。这样，经过排序后，数据以分区为单位聚集在 一起，且同一分区内所有数据按照 key 有序
  - 步骤 2：按照分区编号由小到大依次将每个分区中的数据写入任务工作目录下的临时文 件 output/spillN.out（N 表示当前溢写次数）中。如果用户设置了 Combiner，则写入文件之 前，对每个分区中的数据进行一次聚集操作
  - 步骤 3：将分区数据的元信息写到内存索引数据结构 SpillRecord 中，其中每个分区的元信息包括在临时文件中的偏移量、压缩前数据大小和压缩后数据大小。如果当前内存索引大小超过 1MB，则将内存索引写到文件 output/spillN.out.index 中

- **Merge 阶段**：当所有数据处理完成后，MapTask 对所有临时文件进行一次合并， 以确保最终只会生成一个数据文件

当所有数据处理完后，MapTask 会将所有临时文件合并成一个大文件，并保存到文件 output/file.out 中，同时生成相应的索引文件 output/file.out.index

在进行文件合并过程中，MapTask 以分区为单位进行合并。对于某个分区，它将采用多 轮递归合并的方式。每轮合并 mapreduce.task.io.sort.factor（默认 10）个文件，并将产生的文 件重新加入待合并列表中，对文件排序后，重复以上过程，直到最终得到一个大文件

让每个 MapTask 最终只生成一个数据文件，可避免同时打开大量文件和同时读取大量 小文件产生的随机读取带来的开销

### 5.2 ReduceTask工作机制

ReduceTask可以分为三个阶段：copy阶段、Sort阶段、Reduce阶段

![image-20220625165041707](https://cdn.fengxianhub.top/resources-master/202206251650843.png)

1. Copy 阶段：ReduceTask 从各个 MapTask 上远程拷贝一片数据，并针对某一片数 据，如果其大小超过一定阈值，则写到磁盘上，否则直接放到内存中
2. Sort 阶段：在远程拷贝数据的同时，ReduceTask 启动了两个后台线程对内存和磁盘上的文件进行合并，以防止内存使用过多或磁盘上文件过多。按照 MapReduce 语义，用 户编写` reduce()`函数输入数据是按 key 进行聚集的一组数据。为了将 key 相同的数据聚在一 起，Hadoop 采用了基于排序的策略。由于各个 MapTask 已经实现对自己的处理结果进行了 局部排序，因此，ReduceTask 只需对所有数据进行一次归并排序即可
3. Reduce 阶段：reduce()函数将计算结果写到 HDFS 上

### 5.3 ReduceTask 并行度决定机制

我们知道**MapTask 并行度由切片个数决定，切片个数由输入文件和切片规则决定**，那么ReduceTask 并行度由谁决定？

首先我们可以手动设置 ReduceTask 并行度（个数）

ReduceTask 的并行度同样影响整个 Job 的执行并发度和执行效率，但与 MapTask 的并 发数由切片数决定不同，ReduceTask 数量的决定是可以直接手动设置：

```java
// 默认值是 1，手动设置为 4
job.setNumReduceTasks(4);
```

设置的时候我们同样有一些注意事项：

1. ReduceTask=0，表示没有Reduce阶段，输出文件个数和Map个数一致
2. ReduceTask默认值就是1，所以输出文件个数为一个
3. 如果数据分布不均匀，就有可能在Reduce阶段产生**数据倾斜**
4. ReduceTask数量并不是任意设置，还要考虑业务逻辑需求，有些情况下，需要计算全局汇总结果，就只能有1个ReduceTask
5. **具体多少个ReduceTask，需要根据集群性能而定**
6. 如果分区数不是1，但是ReduceTask为1，是否执行分区过程。答案是：***不执行分区过程***（看上面分区的源码分区）。因为在MapTask的源码中，执行分区的前提是先判断ReduceNum个数是否大于1。不大于1 肯定不执行

### 5.4 MapTask源码解析

这里我们从Map后进入到环形缓存区的源码看起（map阶段的源码前面分析过了，重点在切片）：

![image-20220625211214013](https://cdn.fengxianhub.top/resources-master/202206252112226.png)

我们可以在mapper里context.writer()这里打一个断点，然后按红色的向下箭头进行debug，我们在这里停下

```java
- org.apache.hadoop.mapred.MapTask#write(K key,V value)
```

![image-20220625211653144](https://cdn.fengxianhub.top/resources-master/202206252116240.png)

这里就是我们的环形缓存区，继续进入，会进入当前类的方法中：

```java
public synchronized void collect(K key, V value, final int partition) throws IOException {...}
```

`collect`就是这个环形缓存区，我们知道环形缓冲区一共有三部分，索引+元数据、数据、20%缓存区

**kv数据从缓冲区头往后写，元数据从缓冲区尾部往前写**

![image-20220625212123590](https://cdn.fengxianhub.top/resources-master/202206252121696.png)

前面是一些程序健壮性的检查，我们直接到这里，这里出现了**keystart**和**valstart**：

![image-20220625212855735](https://cdn.fengxianhub.top/resources-master/202206252128848.png)

继续往下走：

![image-20220625213436963](https://cdn.fengxianhub.top/resources-master/202206252134070.png)

>这里我们要注意，缓存区默认为100M，如果达到了80%才会发生溢写，但是在map写出文件完之后也会进行一次溢写

这里就很需要debug功力了，重点在这一行代码：

```java
- org.apache.hadoop.mapred.MapTask#runNewMapper(...){...}
```

![image-20220625215312941](https://cdn.fengxianhub.top/resources-master/202206252153047.png)

在进去就到了这个方法：

```java
- org.apache.hadoop.mapred.MapTask#close(...){...}
```

这一行代码很关键：

```java
collector.flush();//将环形缓存区所有的数据强制写出
```

进入后来到这个方法：

```java
- org.apache.hadoop.mapred.MapTask#flush(...){...}
```

重点在这一行：

```java
sortAndSpill();//排序和溢写
```

进入其中：

```java
sorter.sort(MapOutputBuffer.this, mstart, mend, reporter);//排序
```

进入，到达：

```java
- org.apache.hadoop.util.QuickSort#sort(final IndexedSortable s, int p, int r,
      final Progressable rep)
```

在`sortInternal(s, p, r, rep, getMaxDepth(r - p));`就可以看到我们熟悉的快排算法，这里不得不感慨，这快排写的相当优美：

![image-20220625220439602](https://cdn.fengxianhub.top/resources-master/202206252204742.png)

我们往下走，来到溢写的地方，就是上面排序之后：

![image-20220625221605148](https://cdn.fengxianhub.top/resources-master/202206252216301.png)

当`sortAndSpill();`执行完之后继续往下走，来到`mergeParts();`，这个函数中就是合并分区的实现，我们的溢写文件在快排之后还会进行一次归并排序

我们来到归并分区的函数中

```java
private void mergeParts() throws IOException, InterruptedException, 
                                     ClassNotFoundException {...}
```

可以进去看一下详细的过程：

![image-20220625222653783](https://cdn.fengxianhub.top/resources-master/202206252226902.png)

前面有提过一个溢写文件，当我们的归并排序做完之后又会再产生一个文件：

![image-20220625222749298](https://cdn.fengxianhub.top/resources-master/202206252227393.png)

前面的就是溢写文件了，后面的是用来索引分区信息的索引（类似于数据库中的非聚族索引）

可以沿着debug一直往下，到这里我们可以提前打一个断点，不然抓不到对应的信息

```java
- org.apache.hadoop.mapred.ReduceTask#run(JobConf job, final TaskUmbilicalProtocol umbilical)
```

![image-20220625225152219](https://cdn.fengxianhub.top/resources-master/202206252251352.png)

看到copy、sort和reduce不知道是不是感觉非常熟悉

![image-20220625225304599](https://cdn.fengxianhub.top/resources-master/202206252253713.png)

###  5.5 ReduceTask 源码解析

reduceTask的源码也比较复杂，直接来到这里：

```java
- org.apache.hadoop.mapreduce.task.reduce.MergeManagerImpl#MergeManagerImpl(...)
```

我们知道，在reduce阶段，会提前准备好内存空间，在去拉取map完的数据

![image-20220626112137653](https://cdn.fengxianhub.top/resources-master/202206261121879.png)

这一段的源码都是为了后面reduce抓取map的数据做准备，现在可以看这里：

```java
- org.apache.hadoop.mapreduce.task.reduce.Shuffle#run()
```

`eventFetcher.start();`就是开始去抓取map的数据，`eventFetcher.shutDown();`表示抓取完毕

然后reduce的第一个阶段copy就已经完成了

![image-20220626112801181](https://cdn.fengxianhub.top/resources-master/202206261128303.png)

接着就进行sort阶段，底层调用的是归并排序

![image-20220626113102225](https://cdn.fengxianhub.top/resources-master/202206261131331.png)

接着来到这一行，进入到reduce阶段：

```java
runNewReducer(job, umbilical, reporter, rIter, comparator, keyClass, valueClass);
```

我们继续往下走就会发现拉取数据并排序之后就会进入到我们自己写的reduce的逻辑中，然后写出。写出的部分上面已经分析过了，这里不再分析

### 5.6 源码小结

map

```java
context.write(k, NullWritable.get()); //自定义的 map 方法的写出，进入
    output.write(key, value); 
        //MapTask727 行，收集方法，进入两次
        collector.collect(key, value,partitioner.getPartition(key, value, partitions));
            HashPartitioner(); //默认分区器
        collect() //MapTask1082 行 map 端所有的 kv 全部写出后会走下面的 close 方法
            close() //MapTask732 行
                collector.flush() // 溢出刷写方法，MapTask735 行，提前打个断点，进入
                    sortAndSpill() //溢写排序，MapTask1505 行，进入
                        sorter.sort() QuickSort //溢写排序方法，MapTask1625 行，进入
                    mergeParts(); //合并文件，MapTask1527 行，进入
                collector.close(); //MapTask739 行,收集器关闭,即将进入 ReduceTask
```

reduce：

```java
if (isMapOrReduce()) //reduceTask324 行，提前打断点
    initialize() // reduceTask333 行,进入
    init(shuffleContext); // reduceTask375 行,走到这需要先给下面的打断点
         totalMaps = job.getNumMapTasks(); // ShuffleSchedulerImpl 第 120 行，提前打断点
         merger = createMergeManager(context); //合并方法，Shuffle 第 80 行
            // MergeManagerImpl 第 232 235 行，提前打断点
            this.inMemoryMerger = createInMemoryMerger(); //内存合并
            this.onDiskMerger = new OnDiskMerger(this); //磁盘合并
    rIter = shuffleConsumerPlugin.run();
        eventFetcher.start(); //开始抓取数据，Shuffle 第 107 行，提前打断点
        eventFetcher.shutDown(); //抓取结束，Shuffle 第 141 行，提前打断点
        copyPhase.complete(); //copy 阶段完成，Shuffle 第 151 行
        taskStatus.setPhase(TaskStatus.Phase.SORT); //开始排序阶段，Shuffle 第 152 行
    sortPhase.complete(); //排序阶段完成，即将进入 reduce 阶段 reduceTask382 行
reduce(); //reduce 阶段调用的就是我们自定义的 reduce 方法，会被调用多次
    cleanup(context); //reduce 完成之前，会最后调用一次 Reducer 里面的 cleanup 方法
```





















































































