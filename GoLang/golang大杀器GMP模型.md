# golang 大杀器——GMP模型

>视频地址：<a href="https://www.bilibili.com/video/BV19r4y1w7Nx/?p=3&share_source=copy_web&vd_source=ec1efc27188fd12728ac85b30861f139">Golang深入理解GPM模型</a>

思维导图：

## 1. 发展过程

思维导图：

![image-20230302225012812](https://cdn.fengxianhub.top/resources-master/202303022250106.png)

在单机时代是没有**多线程、多进程、协程**这些概念的。早期的操作系统都是顺序执行

![image-20230223231938741](https://cdn.fengxianhub.top/resources-master/202302232319059.png)

**单进程的缺点有**：

- 单一执行流程、计算机只能一个任务一个任务进行处理
- 进程阻塞所带来的CPU时间的浪费

处于对CPU资源的利用，发展出多线程/多进程操作系统，采用`时间片轮训算法`

![image-20230223232404660](https://cdn.fengxianhub.top/resources-master/202302232324794.png)

宏观上来说，就算只有一个cpu，也能`并发执行`多个进程

这样的好处是充分利用了CPU，但是也带来了一些问题，例如时间片切换需要花费额外的开销

- 进程/线程的数量越多，切换`成本就越大`，也就越`浪费`

![image-20230223232626050](https://cdn.fengxianhub.top/resources-master/202302232326185.png)

对于开发人员来说，尽管线程看起来很美好，但实际上多线程开发设计会变得更加复杂，要考虑很多同步竞争等问题，如`锁`、`竞争冲突`等

进程拥有太多的资源，进程的`创建、切换、销毁`，都会占用很长的时间，CPU虽然利用起来了，但如果进程过多，CPU有很大的一部分都被用来进行`进程调度`了

![image-20230223233029634](https://cdn.fengxianhub.top/resources-master/202302232330760.png)

所以提高cpu的利用率成为我们需要解决的问题

既然问题出现在`线程上下文切换`中，那么首先我们需要好好想一想什么是线程的上下文切换

我们知道操作系统的一些核心接口是不能被进程随意调度的，例如进行`io流的读写操作`，需要将最终的执行权交给操作系统（内核态）进行调度，所以就会有`用户态和内核态`之前的切换

![](https://cdn.fengxianhub.top/resources-master/202206072259157.png)

这个时候我们的线程模型是这样的

<img src="https://cdn.fengxianhub.top/resources-master/202302232339134.png" alt="image-20230223233902015" style="zoom: 33%;" />

一个线程需要在`内核态`与`用户态`之间进行切换，并且切换是受到操作系统控制的，可能这个现在需要等待多个时间片才能切换到内核态再调用操作系统底层的接口

>那么我们是否可以用两个线程分别处理这两种状态呢？两个线程之间再`做好绑定`，当用户线程将任务提交给内核线程后，就可以不用`堵塞`了，可以去执行其他的任务了

<img src="https://cdn.fengxianhub.top/resources-master/202302232343555.png" alt="image-20230223234355428" style="zoom:33%;" />

对于CPU来说（多核CPU），不需要关注线程切换的问题，只需要分配系统资源给`内核线程`进行调度即可

我们来给`用户线程`换个名字——`协程（co-runtine）`

<img src="https://cdn.fengxianhub.top/resources-master/202302232346545.png" alt="image-20230223234654426" style="zoom:33%;" />

如果是`一比一`的关系的话，其实还是可能需要等待内核线程的执行

<img src="https://cdn.fengxianhub.top/resources-master/202302232350840.png" alt="image-20230223235007732" style="zoom:33%;" />

所以可以设计为`N 比 1`的形式，多个协程可以将任务一股脑的交给内核线程去完成，但是这样又有问题，如果其中一个问题在提交任务的过程中，堵塞住了，就会影响其他线程的工作

<img src="https://cdn.fengxianhub.top/resources-master/202302232353517.png" alt="image-20230223235323392" style="zoom:33%;" />

这个就是python的`event-loop`遇到的问题，一个阻塞，其余全阻塞

所以一般为`M 比 N`的关系

<img src="https://cdn.fengxianhub.top/resources-master/202302232355541.png" alt="image-20230223235525408" style="zoom:33%;" />

在`M 比 N`的关系中，大部分的精力都会放在`协程调度器`上，如果调度器效率高就能让协程之间阻塞时间尽可能的少

> 在golang中对`协程调度器`和`协程内存`进行了优化
>
> - 协程调度器：可以支持灵活调度
> - 内存轻量化：可以拥有大量的协程

![image-20230223235853677](https://cdn.fengxianhub.top/resources-master/202302232358800.png)

在golang`早期的协程调度器`中，采用的是`队列`的方式，`M`想要执行、放回`G`都必须访问`全局G队列`，并且`M`有多个，即多线程访问同一资源需要`加锁`进行保证`互斥/同步`，所以`全局G队列`是有`互斥锁`进行保护的

![早期协程调度器](https://cdn.fengxianhub.top/resources-master/202302240008536.gif)

老调度器有几个缺点：

1. 创建、销毁、调度G都需要每个M获取锁，这就形成了`激烈的锁竞争`
2. M转移G会造成`延迟和额外的系统负载`。比如当G中包含创建新协程的时候，M创建了`G'`，为了继续执行`G`，需要把`G'`交给`M'`执行，也造成了`很差的局部性`，因为`G'`和`G`是相关的，最好放在M上执行，而不是其他`M'`
3. 系统调用(CPU在M之间的切换)导致频繁的线程阻塞和取消阻塞操作增加了系统开销

## 2. GMP模型设计思想 

思维导图：

![image-20230302233813630](https://cdn.fengxianhub.top/resources-master/202303022338928.png)

### 2.1 GMP模型

> GMP是goalng的线程模型，包含三个概念：内核线程(M)，goroutine(G)，G的上下文环境（P）
>
> - G：`goroutine协程`，基于协程建立的用户态线程
> - M：`machine`，它直接关联一个os内核线程，用于执行G
> - P：`processor处理器`，P里面一般会存当前goroutine运行的上下文环境（函数指针，堆栈地址及地址边界），P会对自己管理的goroutine队列做一些调度



![image-20230225194655285](https://cdn.fengxianhub.top/resources-master/202302251946637.png)

![image-20230225223650249](https://cdn.fengxianhub.top/resources-master/202302252236582.png)

在Go中，**线程是运行goroutine的实体，调度器的功能是把可运行的goroutine分配到工作线程上**

1. **全局队列**（Global Queue）：存放等待运行的`G`
2. **P的本地队列**：同全局队列类似，存放的也是等待运行的`G`，存的数量有限，不超过`256`个。新建`G'`时，`G'`优先加入到P的本地队列，如果队列满了，则会把本地队列中一半的`G`移动到全局队列
3. **P列表**：所有的`P`都在程序启动时创建，并保存在数组中，最多有`GOMAXPROCS`(可配置)个
4. **M**：线程想运行任务就得获取`P`，从P的本地队列获取`G`，`P`队列为空时，`M`也会尝试从`全局队列`拿一批`G`放到`P`的本地队列，或从其他`P`的本地队列一半放到自己`P`的本地队列。M运行G，G执行之后，M会从P获取下一个G，不断重复下去

> P和M的数量问题
>
> - P的数量：环境变量`$GOMAXPROCS`；在程序中通过`runtime.GOMAXPROCS()`来设置
> - M的数量：GO语言本身限定`一万` (但是操作系统达不到)；通过`runtime/debug`包中的`SetMaxThreads`函数来设置；有一个`M阻塞`，会创建一个`新的M`；如果有`M空闲`，那么就会`回收或者休眠`
>
> M与P的数量没有绝对关系，一个M阻塞，P就会去创建或者切换另一个M，所以，即使P的默认数量是1，也有可能会创建很多个M出来

### 2.2 调度器的设计策略

golang调度器的设计策略思想主要有以下几点：

- 复用线程
- 利用并行
- 抢占
- 全局G队列

#### 2.2.1 复用线程

golang在复用线程上主要体现在`work stealing机制`和`hand off机制`（偷别人的去执行，和自己扔掉执行）

首先我们看`work stealing`，我们在学习java的时候学过fork/join，其中也是通过工作窃取方式来提升效率，`充分利用线程进行并行计算，并减少了线程间的竞争`

![workstealing](https://cdn.fengxianhub.top/resources-master/202302252332719.gif)

**干完活的线程与其等着，不如去帮其他线程干活**，于是它就去其他线程的队列里窃取一个任务来执行。而在这时它们会访问同一个队列，所以为了减少窃取任务线程和被窃取任务线程之间的竞争，通常会使用`双端队列`，`被窃取任务`线程永远从双端队列的`头部`拿任务执行，而`窃取任务`的线程永远从双端队列的`尾部`拿任务执行

>**hand off机制**
>
>当本线程因为G进行系统调用阻塞时，线程释放绑定的P，把P转移给其他空闲的线程执行，此时`M1`如果长时间阻塞，可能会执行`睡眠或销毁`

![handoff](https://cdn.fengxianhub.top/resources-master/202302252342117.gif)

#### 2.2.2 利用并行

我们可以使用`GOMAXPROCS`设置P的数量，这样的话最多有`GOMAXPROCS`个线程分布在多个CPU上同时运行。`GOMAXPROCS`也限制了并发的程度，比如`GOMAXPROCS = 核数/2`，则最多利用了一半的CPU核进行并行

<hr/>

#### 2.2.3 抢占策略

- 1对1模型的调度器，需要等待一个`co-routine`主动释放后才能轮到下一个进行使用
- golang中，如果一个`goroutine`使用10ms还没执行完，CPU资源就会被其他goroutine所抢占

![image-20230225235012511](https://cdn.fengxianhub.top/resources-master/202302252350672.png)

<hr/>

#### 2.2.4 全局G队列

- 全局G队列其实是复用线程的补充，当工作窃取时，**优先从全局队列去取，取不到才从别的p本地队列取**（1.17版本）

- 在新的调度器中依然有全局G队列，但功能已经被弱化了，当M执行work stealing从其他P偷不到G时，它可以从全局G队列获取G

![globalG2](https://cdn.fengxianhub.top/resources-master/202302260001502.gif)

### 2.3 `go func()`经历了那些过程

![18-go-func调度周期.jpeg](https://cdn.nlark.com/yuque/0/2022/jpeg/26269664/1650776333419-50d3a922-bd53-4bff-b0b6-280e6abc5d74.jpeg?x-oss-process=image%2Fwatermark%2Ctype_d3F5LW1pY3JvaGVp%2Csize_55%2Ctext_5YiY5Li55YawQWNlbGQ%3D%2Ccolor_FFFFFF%2Cshadow_50%2Ct_80%2Cg_se%2Cx_10%2Cy_10%2Fresize%2Cw_1125%2Climit_0%2Finterlace%2C1)



1. 我们通过`go func()`来创建一个goroutine
2. 有两个存储`G`的队列，一个是`局部调度器P`的本地队列、一个是`全局G队列`。新创建的G会先保存在P的`本地队列`中，如果P的本地队列已经满了就会保存在`全局的队列`中
3. G只能运行在M中，一个`M`必须持有一个`P`，M与P是`1：1`的关系。M会从P的本地队列弹出一个`可执行状态的G`来执行，如果P的本地队列为空，就会想其他的MP组合偷取一个可执行的G来执行
4. 一个M调度G执行的过程是一个循环机制
5. 当M执行某一个G时候如果发生了`syscall`或者`其他阻塞`操作，M会阻塞，如果当前有一些G在执行，runtime会把这个线程M从P中`摘除(detach)`，然后再创建一个新的操作系统的线程(如果有空闲的线程可用就复用空闲线程)来服务于这个P
6. 当M系统调用结束时候，这个G会尝试获取一个`空闲的P`执行，并放入到这个P的`本地队列`。如果获取不到P，那么这个线程M变成`休眠状态`， 加入到`空闲线程`中，然后这个G会被放入`全局队列`中

### 2.4 调度器的生命周期

> 在了解调度器生命周期之前，我们需要了解两个新的角色`M0`和`G0`
>
> **M0**（跟进程数量绑定，一比一）：
>
> - 启动程序后`编号为0`的主线程
> - 在全局变量`runtime.m0`中，不需要在`heap`上分配
> - 负责执行初始化操作和`启动第一个G`
> - 启动第一个G之后，`M0就和其他的M一样了`
>
> **G0**（每个M都会有一个G0）：
>
> - 每次`启动一个M`，都会`第一个创建的gourtine`，就是`G0`
> - G0仅用于`负责调度G`
> - G0不指向任何`可执行的函数`
> - 每个M都会有一个自己的G0
> - 在调度或系统调用时会使用M切换到G0，再通过G0进行调度
>
> **M0和G0都是放在全局空间的**

具体流程为：

![17-pic-go调度器生命周期.png](https://cdn.nlark.com/yuque/0/2022/png/26269664/1650776346389-ab0ffa04-c707-4ec8-a810-0929533fd00c.png?x-oss-process=image%2Fwatermark%2Ctype_d3F5LW1pY3JvaGVp%2Csize_13%2Ctext_5YiY5Li55YawQWNlbGQ%3D%2Ccolor_FFFFFF%2Cshadow_50%2Ct_80%2Cg_se%2Cx_10%2Cy_10)

我们来分析一段代码：

```go
package main

import "fmt"

func main() {
    fmt.Println("Hello world")
}
```

1. runtime创建最初的线程m0和goroutine g0，并把2者关联。
2. 调度器初始化：初始化**m0、栈、垃圾回收**，以及创建和初始化由**GOMAXPROCS**个`P`构成的`P列表`。
3. 示例代码中的main函数是`main.main`，`runtime`中也有1个main函数——`runtime.main`，代码经过编译后，`runtime.main`会调用`main.main`，程序启动时会为`runtime.main`创建goroutine，称它为main goroutine吧，然后把main goroutine加入到P的本地队列。
4. 启动m0，m0已经绑定了P，会从P的本地队列获取G，获取到main goroutine。
5. G拥有栈，M根据G中的栈信息和调度信息设置运行环境
6. M运行G
7. G退出，再次回到M获取可运行的G，这样重复下去，直到`main.main`退出，`runtime.main`执行Defer和Panic处理，或调用`runtime.exit`退出程序。

>调度器的生命周期几乎占满了一个Go程序的一生，`runtime.main`的goroutine执行之前都是为调度器做准备工作，`runtime.main`的goroutine运行，才是调度器的真正开始，直到`runtime.main`结束而结束

### 2.5 可视化的CMP编程

#### 2.5.1 trace方式

> 在这里我们需要使用trace编程，三步走：
>
> 1. 创建trace文件：f, err := os.Create("trace.out")
> 2. 启动trace：err = trace.Start(f)
> 3. 停止trace：trace.Stop()
>
> 然后再通过`go tool trace`工具打开trace文件
>
> ```go
> go tool trace trace.out
> ```

```go
package main

import (
	"fmt"
	"os"
	"runtime/trace"
)

// trace的编码过程
// 1. 创建文件
// 2. 启动
// 3. 停止
func main() {
	// 1.创建一个trace文件
	f, err := os.Create("trace.out")
	if err != nil {
		panic(err)
	}
	defer func(f *os.File) {
		err := f.Close()
		if err != nil {
			panic(err)
		}
	}(f)
	// 2. 启动trace
	err = trace.Start(f)
	if err != nil {
		panic(err)
	}
	// 正常要调试的业务
	fmt.Println("hello GMP")
	// 3. 停止trace
	trace.Stop()
}

```

打开后我们进入网页点击`view trace`，然后就能看到分析信息

![image-20230226221443485](https://cdn.fengxianhub.top/resources-master/202302262214784.png)

**G的信息**：

![image-20230226221545186](https://cdn.fengxianhub.top/resources-master/202302262215360.png)

**M的信息**：

![image-20230226221738941](https://cdn.fengxianhub.top/resources-master/202302262217061.png)

**P的信息**：

![image-20230226221854150](https://cdn.fengxianhub.top/resources-master/202302262218297.png)

#### 2.5.2 debug方式

使用debug方式可以不需要trace文件

先搞一段代码

```go
package main

import (
	"fmt"
	"time"
)

func main() {
	for i := 0; i < 5; i++ {
		time.Sleep(time.Second)
		fmt.Println("hello GMP")
	}
}
 
```

debug执行一下

```sh
$ GODEBUG=schedtrace=1000 ./debug.exe
SCHED 0ms: gomaxprocs=8 idleprocs=7 threads=6 spinningthreads=0 idlethreads=3 runqueue=0 [0 0 0 0 0 0 0 0]
SCHED 1008ms: gomaxprocs=8 idleprocs=8 threads=6 spinningthreads=0 idlethreads=3 runqueue=0 [0 0 0 0 0 0 0 0]
hello GMP
SCHED 2009ms: gomaxprocs=8 idleprocs=8 threads=6 spinningthreads=0 idlethreads=3 runqueue=0 [0 0 0 0 0 0 0 0]
hello GMP
SCHED 3010ms: gomaxprocs=8 idleprocs=8 threads=6 spinningthreads=0 idlethreads=3 runqueue=0 [0 0 0 0 0 0 0 0]
hello GMP
hello GMP
SCHED 4017ms: gomaxprocs=8 idleprocs=8 threads=6 spinningthreads=0 idlethreads=3 runqueue=0 [0 0 0 0 0 0 0 0]
hello GMP
```

- `SCHED`：调试信息输出标志字符串，代表本行是goroutine调度器的输出；
- `0ms`：即从程序启动到输出这行日志的时间；
- `gomaxprocs`: P的数量，本例有2个P, 因为默认的P的属性是和cpu核心数量默认一致，当然也可以通过GOMAXPROCS来设置；
- `idleprocs`: 处于idle状态的P的数量；通过gomaxprocs和idleprocs的差值，我们就可知道执行go代码的P的数量；
- `threads: os threads/M`的数量，包含scheduler使用的m数量，加上runtime自用的类似sysmon这样的thread的数量；
- `spinningthreads`: 处于自旋状态的os thread数量；
- `idlethread`: 处于idle状态的os thread的数量；
- `runqueue=0`： Scheduler全局队列中G的数量；
- `[0 0]`: 分别为2个P的local queue中的G的数量。





















