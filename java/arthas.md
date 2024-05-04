# Arthas学习&实战

>线上有一个项目，一般内存占用在`700MB`左右，我通过加了`异步队列`和`线程池`优化处理核心链路逻辑后内存占用到了`1.5G`左右，这波实属反向优化了😂（ps：处理速度还是快了很多的）
>
>![image-20230319121739074](https://cdn.fengxianhub.top/resources-master/202303191217255.png)

首先我们要大致了解一下处理的逻辑

![image-20230319114944984](https://cdn.fengxianhub.top/resources-master/202303191149261.png)

业务场景是要解析一段视频，进行人脸、OCR、语音、场景识别，其实也就是调第三方的接口，其中人脸和OCR调用第三方接口后会返回一个`taskId`，然后再去查询结果（非阻塞）；语音、场景识别会将视频按照一定频率截成图片（帧）然后请求接口（阻塞）

现在的处理逻辑是：

- 异步任务（非阻塞）：放入`延时队列`中，由一个单独的线程每过一秒去查询结果，如果有结果了，提交给线程池执行
- 同步任务（阻塞）：直接放入线程池（线程池拒绝策略为`CallerRunsPolicy`，当线程池队列满后会阻塞调用线程）

诊断之前我们看一下项目运行的虚拟机参数（`基于jdk1.8`）：

```sh
nohup java -Xms512M -Xmx2048M -Xss1M \
-XX:MetaspaceSize=256M \
-XX:+UseConcMarkSweepGC \
-XX:CMSInitiatingOccupancyFraction=70 \
-XX:+PrintGCApplicationStoppedTime \
-XX:+PrintGCDateStamps \
-XX:+CMSParallelRemarkEnabled \
-XX:+CMSScavengeBeforeRemark \
-XX:+UseCMSCompactAtFullCollection \
-XX:CMSFullGCsBeforeCompaction=0 \
-XX:-OmitStackTraceInFastThrow \
-XX:+HeapDumpOnOutOfMemoryError \
-verbosegc \
-XX:+PrintGCDetails \
-XX:ErrorFile=/var/tmp/springboot/vhost/logs/jvm_error.log \
-Dfastjson.parser.safeMode=true \
-jar $PKG_NAME \
>  /var/tmp/springboot/vhost/logs/material-web-0.log 2>&1 &
```

## 1.jdk原生工具诊断

### 1.1 jmap查看堆空间

查看堆空间dump日志

```shell
[root@liang ]# jmap -heap 26539
Attaching to process ID 26539, please wait...
Debugger attached successfully.
Server compiler detected.
JVM version is 25.362-b08

using parallel threads in the new generation.
using thread-local object allocation.
Concurrent Mark-Sweep GC

Heap Configuration:
   MinHeapFreeRatio         = 40
   MaxHeapFreeRatio         = 70
   MaxHeapSize              = 2147483648 (2048.0MB)
   NewSize                  = 178913280 (170.625MB)
   MaxNewSize               = 697892864 (665.5625MB)
   OldSize                  = 357957632 (341.375MB)
   NewRatio                 = 2
   SurvivorRatio            = 8
   MetaspaceSize            = 268435456 (256.0MB)
   CompressedClassSpaceSize = 1073741824 (1024.0MB)
   MaxMetaspaceSize         = 17592186044415 MB
   G1HeapRegionSize         = 0 (0.0MB)

Heap Usage:
New Generation (Eden + 1 Survivor Space):  ## 新生代
   capacity = 161021952 (153.5625MB)
   used     = 30471040 (29.0594482421875MB)
   free     = 130550912 (124.5030517578125MB)
   18.92353161884412% used
Eden Space:                                ## Eden区
   capacity = 143130624 (136.5MB)
   used     = 13032264 (12.428535461425781MB)
   free     = 130098360 (124.07146453857422MB)
   9.105154184194712% used
From Space:                                ## 幸存区from
   capacity = 17891328 (17.0625MB)
   used     = 17438776 (16.63091278076172MB)
   free     = 452552 (0.43158721923828125MB)
   97.47055109603937% used
To Space:                                  ## 幸存区to
   capacity = 17891328 (17.0625MB)
   used     = 0 (0.0MB)
   free     = 17891328 (17.0625MB)
   0.0% used
concurrent mark-sweep generation:
   capacity = 533991424 (509.25390625MB)
   used     = 342340136 (326.48099517822266MB)
   free     = 191651288 (182.77291107177734MB)
   64.10966929686121% used

41950 interned Strings occupying 4666592 bytes.
```

### 1.2 jmap -histo查看对象数量

```shell
[root@liang ]# jmap -histo 26539 | head -n 20

 num     #instances         #bytes  class name
----------------------------------------------
   1:         43882      286427984  [B
   2:        217889       32203912  [C
   3:         81028       13315112  [Ljava.lang.Object;
   4:         29131       13038736  [I
   5:        148892        4764544  java.util.HashMap$Node
   6:        170678        4096272  java.lang.String
   7:         44559        3921192  java.lang.reflect.Method
   8:        111150        2667600  java.util.LinkedList$Node
   9:         82945        2654240  java.util.concurrent.ConcurrentHashMap$Node
  10:         25505        2507680  [Ljava.util.HashMap$Node;
  11:         22605        2492176  java.lang.Class
  12:         52485        2099400  java.util.LinkedHashMap$Entry
  13:         71404        1713696  com.taobao.text.util.Pair
  14:         60432        1450368  java.util.ArrayList
  15:         25461        1425816  java.util.LinkedHashMap
  16:         31416        1256640  java.security.cert.TrustAnchor
  17:         18409        1178176  com.taobao.arthas.core.command.model.ThreadVO
```

查看GC情况

```shell
2023-03-19T12:54:51.355+0800: [GC (Allocation Failure) 2023-03-19T12:54:51.355+0800: [ParNew: 140079K->17472K(157248K), 0.0649288 secs] 348858K->298325K(506816K), 0.0650645 secs] [Times: user=0.42 sys=0.05, real=0.07 secs]
2023-03-19T12:54:51.422+0800: [GC (CMS Initial Mark) [1 CMS-initial-mark: 280853K(349568K)] 314709K(506816K), 0.0035826 secs] [Times: user=0.02 sys=0.00, real=0.00 secs]
2023-03-19T12:54:56.595+0800: [GC (CMS Final Remark) [YG occupancy: 40188 K (157248 K)]2023-03-19T12:54:56.596+0800: [G
 (CMS Final Remark) 2023-03-19T12:54:56.596+0800: [ParNew: 40188K->7036K(157248K), 0.0242637 secs] 321041K->320435K(506816K), 0.0243589 secs] [Times: user=0.14 sys=0.01, real=0.03 secs]
2023-03-19T12:56:10.410+0800: [GC (Allocation Failure) 2023-03-19T12:56:10.411+0800: [ParNew: 146812K->1803K(157248K), 0.0128073 secs] 459697K->331071K(678724K), 0.0129401 secs] [Times: user=0.10 sys=0.01, real=0.01 secs]
2023-03-19T12:56:30.722+0800: [GC (Allocation Failure) 2023-03-19T12:56:30.722+0800: [ParNew: 141579K->2285K(157248K), 0.0050544 secs] 470847K->331554K(678724K), 0.0052019 secs] [Times: user=0.03 sys=0.00, real=0.00 secs]
2023-03-19T12:56:57.568+0800: [GC (Allocation Failure) 2023-03-19T12:56:57.568+0800: [ParNew: 142054K->6983K(157248K), 0.0086751 secs] 471323K->336252K(678724K), 0.0088217 secs] [Times: user=0.04 sys=0.00, real=0.01 secs]
2023-03-19 12:56:59.010  INFO 26539 --- [  eventPool-1-2] c.y.m.m.third..MediaUtils      : authorization:【{Authorization= DkawmEAF0x70rZEq4sTmZGVzGTPNmgwjy4KxhFXu:q0jZS5ZKLvYenqdx7Y1DhkGCpvk=, Content-Type=application/x-www-form-urlencoded}】
2023-03-19 12:56:59.010  INFO 26539 --- [  eventPool-1-2] com.yima.common.utils.HttpUtils          : headerMap:【{Authorization= DkawmEAF0x70rZEq4sTmZGVzGTPNmgwjy4KxhFXu:q0jZS5ZKLvYenqdx7Y1DhkGCpvk=, Content-Type=application/x-www-form-urlencoded}】
2023-03-19T12:57:50.214+0800: [GC (Allocation Failure) 2023-03-19T12:57:50.215+0800: [ParNew: 146759K->9193K(157248K), 0.0091186 secs] 476028K->338462K(678724K), 0.0093436 secs] [Times: user=0.05 sys=0.00, real=0.01 secs]
2023-03-19T13:00:11.470+0800: [GC (Allocation Failure) 2023-03-19T13:00:11.470+0800: [ParNew: 148969K->16274K(157248K), 0.0107459 secs] 478238K->345543K(678724K), 0.0109635 secs] [Times: user=0.08 sys=0.00, real=0.02 secs]
2023-03-19T13:06:17.970+0800: [GC (Allocation Failure) 2023-03-19T13:06:17.970+0800: [ParNew: 156050K->17030K(157248K), 0.0343616 secs] 485319K->351346K(678724K), 0.0345865 secs] [Times: user=0.11 sys=0.00, real=0.03 secs]
```

可以看出`ParNew垃圾回收器`（新生代）`CMS垃圾回收器`（老年代）都在正常工作

## 2. Arthas诊断

启动arthas

```shell
curl -O https://arthas.aliyun.com/arthas-boot.jar
java -jar arthas-boot.jar
```

选择你要监控的java程序（启动arthas的用户和需要监控的用户必须是同一个）

![image-20230319182618465](https://cdn.fengxianhub.top/resources-master/202303191826616.png)

安装idea插件`arthas idea`

可以选中方法复制命令

![image-20230319182216722](https://cdn.fengxianhub.top/resources-master/202303191822074.png)

常用的方法

### 2.1 dashboard实时监控面板

dashboard：打开实时监控面板（  具体含义见：[dashboard | arthas (aliyun.com)](https://arthas.aliyun.com/doc/dashboard.html#数据说明)  ）

![image-20230319182916225](https://cdn.fengxianhub.top/resources-master/202303191829366.png)

### 2.2 thread查看线程情况

![image-20230319183141616](https://cdn.fengxianhub.top/resources-master/202303191831735.png)

-  thread -b：查看死锁情况
-  thread -n 1 ：查看消耗cpu资源最多的【1个】线程

### 2.3 jad反编译查看线上代码

通过`jad`可以反编译正在运行的代码，我们去idea里面粘贴一下全类名

![image-20230319183556791](https://cdn.fengxianhub.top/resources-master/202303191835928.png)

使用命令`jad 全类名`就可以反编译正在执行的代码了，查看自己的代码是否和线下不一样

![image-20230319183719132](https://cdn.fengxianhub.top/resources-master/202303191837268.png)

### 2.4 watch观察函数入/出参

通过watch命令可以观察函数的入参、出参、异常信息等

我们在`idea`里面用插件复制一下命令

![image-20230319185608128](https://cdn.fengxianhub.top/resources-master/202303191856367.png)

执行一下，可以看到能够抓取到方法的参数

![image-20230319185835244](https://cdn.fengxianhub.top/resources-master/202303191858378.png)





### 2.5 trace耗时统计

通过trace命令我们可以对指定方法及其调用方法进行耗时统计，并且会将耗时最长的方法进行高亮

这里一样我们用插件复制要抓取的方法的命令

![image-20230319190234382](https://cdn.fengxianhub.top/resources-master/202303191902504.png)

### 2.6 stack查看调用栈

stack命令可以看到方法的调用过程，例如我们写了条件分支，通过`stack`就可以看到走了哪里

![image-20230319235426366](https://cdn.fengxianhub.top/resources-master/202303192354635.png)

### 2.7 monitor 查看执行成功次数

在压测的时候可以用来看接口的成功率

![image-20230319235629309](https://cdn.fengxianhub.top/resources-master/202303192356393.png)

### 2.8 tt时空隧道

tt命令可以重放之前的请求，用来诊断具体的请求情况

![image-20230320000429251](https://cdn.fengxianhub.top/resources-master/202303200004352.png)

可以看到已经记录了前五次方法调用，现在我们就可以去分析之前的调用，命令后面接`index`

![image-20230320000647544](https://cdn.fengxianhub.top/resources-master/202303200006662.png)

如果我们想要回放这次请求只需要`tt -i 1000 p`，就能调用指定方法再按照之前的参数再执行一次

### 2.9 profiler热力图

![image-20230320001320764](https://cdn.fengxianhub.top/resources-master/202303200013844.png)

![image-20230320001420859](https://cdn.fengxianhub.top/resources-master/202303200014044.png)