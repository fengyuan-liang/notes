# golang 大杀器——GMP模型

>视频地址：<a href="https://www.bilibili.com/video/BV19r4y1w7Nx/?p=3&share_source=copy_web&vd_source=ec1efc27188fd12728ac85b30861f139">Golang深入理解GPM模型</a>

思维导图：



## 1. 发展过程

思维导图：

![image-20230224001527616](https://cdn.fengxianhub.top/resources-master/202302240015813.png)

在单机时代是没有多线程、多进程、协程这些概念的。早期的操作系统都是顺序执行

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

我们知道操作系统的一些核心接口是不能被进程随意调度的，例如进行`io流的读写操作`，需要将最终的执行权交给操作系统（内核态）进行调度

![](https://cdn.fengxianhub.top/resources-master/202206072259157.png)

这个时候我们的线程模型是这样的

<img src="https://cdn.fengxianhub.top/resources-master/202302232339134.png" alt="image-20230223233902015" style="zoom: 33%;" />

一个线程需要在`内核态`与`用户态`之间进行切换，并且切换是受到操作系统控制的，可能这个现在需要等待多个时间片的时间才能切换到内核态再调用操作系统底层的接口

>那么我们是否可以用两个线程分别处理这两种状态呢？两个线程之间再`做好绑定`，当用户线程将任务提交给内核线程后，就可以不用`堵塞`了，可以去执行其他的任务了

<img src="https://cdn.fengxianhub.top/resources-master/202302232343555.png" alt="image-20230223234355428" style="zoom:33%;" />

对于CPU来说（多核CPU），不需要关注线程切换的问题，只需要分配系统资源给`内核线程`进行调度即可

我们来给`用户线程`换个名字——`协程（co-rutine）`

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

