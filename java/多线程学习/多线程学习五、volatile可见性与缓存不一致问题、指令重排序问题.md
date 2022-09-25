# 多线程学习五、volatile可见性与现代计算机的内存模型



## 1. volatile

思维导图：

![image-20220128113453822](https://cdn.fengxianhub.top/resources-master/202201281135923.png)

>先通过一个小栗子来演示一下<code>volatile</code>的作用

```java
public class _18_volatile {
    public static void main(String[] args) {
        Task task = new Task();
        Thread t1 = new Thread(task, "线程t1");
        t1.start();
        new Thread(()->{
            try {
                Thread.sleep(1000);
                System.out.println("开始通知线程停止");
                task.isStop=true;//修改另外一个线程里面的变量值
            } catch (InterruptedException e) {
                e.printStackTrace();
            }
        }, "线程t2").start();
    }
}

class Task implements Runnable{
    boolean isStop = false;
    int i = 0;

    @Override
    public void run() {
        Instant start = Instant.now();
        while(!isStop){
            i++;
        }
        Instant end = Instant.now();
        System.out.println("线程退出，共耗时："+ Duration.between(start,end).toMillis()+"毫秒");
    }
}
```

在这个栗子里面，共有两个线程，线程一处于<code>堵塞状态</code>，线程二通过修改线程一的isStop属性来改变线程一的堵塞状态，但结果是<code>线程一仍然处于堵塞状态</code>，线程二并没能修改线程一里面的属性。

🚩原因：线程之间变量的修改并不能实时感知到，这就造成了修改其他线程里面变量失败的情况。

🚩分析：首先线程在修改变量前，都会向主内存先申请这个变量，然后放到自己的内存地址，在修改了变量后会将这个变量重新刷回到主内存中去，但是此时其他线程中的变量的值已经确定了，这就造成了变量修改不了的情况

![image-20220128133049942](https://cdn.fengxianhub.top/resources-master/202201281330003.png)

![image-20220128132046122](https://cdn.fengxianhub.top/resources-master/202201281320185.png)

🚩解决方案：引入<code>volatile</code>关键字，给共享变量加上这个关键字。<code>volatile</code>关键字的作用是保证共享变量在多线程之间的可见性，能让每个线程实时感知到这个变量，加了这个关键字的变量，其他线程向主内存写数据时，会先检查该数据和之前取的是否一致，一致即写入，如果不一致会将主内存中的数据重新写入并进行处理，处理完再重复上述操作。这就保证了多线程下的数据一致性问题。

```java
volatile boolean isStop = false;
```

>🧐要想深度理解<code>volatile</code>是怎么解决这个问题的，我们得先从<code>现代计算机的内存模型</code>讲起

## 2. 现代计算机的内存模型

思维导图：

![image-20220128132600054](https://cdn.fengxianhub.top/resources-master/202201281326123.png)



### 2.1 缓存不一致问题

首先，我们知道计算机在运行一条指令的时候，指令需要在CPU中处理，但是数据却是存放在主内存中的，这里就一定会牵涉到两件事情：<code>读数据</code>和<code>写数据</code>

>**这里牵涉到两个问题：**
>
>1. <code>CPU处理数据的速度是很快的</code>，但是我们知道<code>I/O</code>操作是很慢的，不论是从磁盘上读写还是内存中都跟不上CPU处理数据的速度,如何解决速度不匹配的问题？
>2. 每个线程都有自己的<code>缓存</code>，也就是说其实它们只是拿到主内存中数据的一个<code>副本</code>，那么其中一个副本数据变化怎么包装其他副本里面的数据也要保存一直呢？这就是经典的<code>缓存一致性问题</code>

**第一个问题解决措施**：在CPU里面设缓存，用来处理<code>I/O</code>操作速度不匹配的问题。

![image-20220128133810373](https://cdn.fengxianhub.top/resources-master/202201281338459.png)

>现在的CPU都是多核的，每个核心都会有自己的缓存，这些缓存可能还会分为多级，比如一级缓存L1、二级缓存L2、三级缓存L3，在这些缓存中，<code>一级和二级缓存是每个核心私有的</code>，而<code>三级缓存是所有核心所共有的</code>![image-20220128135711286](https://cdn.fengxianhub.top/resources-master/202201281357352.png)

这里又有两个注意点：

- 缓存系统以<code>缓存行</code>(cache Line)为单位存储，它的存储空间是2的整数幂连续字节，一般在32-256个字节，常见的为64字节. CPU每次将一条内存指令所在的缓存行中的内容从主内存加载到cpu缓存中。
- cpu只与<code>自己对应的缓存</code>发生作用，当cpu发生数据更新运算时，通过<code>直写</code>或<code>回写</code>将缓存中更新后的数据写到下一级缓存。

![image-20220128135153293](https://cdn.fengxianhub.top/resources-master/202201281351358.png)

读到这里我们好像能够窥探到上面栗子中一个线程修改另一个线程里面的变量失败的一些原因了，我们继续往下看。

🚩那当CPU里的某一个核心处理完数据之后，是怎么写回主内存的呢？

>这里涉及了cache的写操作， cache的写操作方式最早可以追溯到古老的大学教程<code>《计算机组成原理》</code>一书😜

- write through（<code>直写</code>）：每次CPU修改了cache中的内容，<code>立即更新到内存</code>，由<code>处理器</code>直接从<code>L1写到L2</code>、<code>L2写到L3</code>，最后再由L3写到<code>主内存中</code>，当然这也意味着每次CPU写共享数据，都会导致总线事务，因此这种方式常常会引起总线事务的竞争，高一致性，但是<code>效率非常低</code>；
-  write back（<code>回写</code>）：每次CPU修改了cache中的数据，<code>不会立即更新到内存</code>，这种策略，<code>不会将数据直接一级一级的写回到主内存中</code>，而是在CPU修改过的缓存中设置一个<code>脏位</code>（dirty bit），所谓的<code>脏位</code>，或者说是<code>脏数据</code>是指当前缓存中的数据，和主内存中的数据是<code>不一致</code>的。当CPU又需要写回该数据时，这里会多一步<code>同步脏数据</code>的动作，也就是会把<code>脏数据写到主内存</code>中，再从主内存中通过一级一级的缓存重新写到CPU中。可以看到如果我们有大量的命令是需要从CPU写数据到主内存时，我们不需要一级一级的往下修改，只需要修改<code>脏数据</code>，这样也就避免了频繁从主内存中<code>读写数据</code>，自然效率会比直写高出不少。

当然更多细节可以去翻看大学时我们学过的那本古老的教程，这里不做深究。

<hr>

**第二个问题，缓存一致性问题：**

思维导图：

![image-20220128151653675](https://cdn.fengxianhub.top/resources-master/202201281516907.png)

>解决方案一：通过在总线加<code>锁</code>来解决

也就是当一个CPU核心在总线上进行数据传输时，不允许其他CPU在总线上传送数据。但这种方式可想而知，<code>效率也太低了</code>，一般也不会采用这种方式解决缓存一致性问题。😝

>解决方案二：窥探技术+缓存一致性协议

**总线窥探技术：**

所有的数据传输都发生在一条<code>共享的总线</code>上，每个处理器通过<code>嗅探</code>在总线上传播的数据来检查自己的缓存值是不是过期了，如果处理器发现自己缓存行对应的内存地址被修改，就会将当前处理器的缓存行设置无效状态，当处理器对这个数据进行修改操作的时候，会重新从系统内存中把数据读到处理器缓存中。简单的来讲，就是<code>处理器</code>处理完数据回写的时候先判断这个数据是不是<code>自己上次读到的数据</code>，如果发现不是，把将该数据读到<code>处理器</code>中。

**缓存一致性协议：**

缓存一致性协议有很多，现在最常用到的缓存一致性协议是<code>MESI（IllinoisProtocol）协议</code>，这个协议支持<code>回写</code>。我们知道缓存的最小操作单位是<code>缓存行</code>，而缓存行有四种<code>缓存状态</code>，他们分别是。。。看下面，<code>MESI</code>是这四种缓存状态的首字母缩写

>` MESI`(缓存一致性)：在多核CPU中，内存中的数据会在多个核心中存在数据副本，某一个核心发生修改操作，就产生了数据不一致的问题。而一致性协议正是用于保证多个CPU cache之间缓存共享数据的一致。

🚩它的核心是:  当CPU写数据时，如果发现操作的变量是<code>共享变量</code>，即在其他<code>CPU中也存在该变量的副本</code>，会发出信号通知其他CPU将该变量的缓存行置为无效状态，因此当其他CPU需要读取这个变量时，发现自己缓存中缓存该变量的缓存行是无效的，那么它就会从内存重新读取

![image-20220128153714367](https://cdn.fengxianhub.top/resources-master/202201281537515.png)

>小结一下:<code>总线窥探技术</code>用来判断该数据是否被修改过，<code>缓存一致性协议</code>用来对修改过的数据进行处理

<hr>

### 2.2 指令重排序问题


思维导图：

![image-20220128172216374](https://cdn.fengxianhub.top/resources-master/202201281722484.png)

​		 指令重排序是指通过对指令的重新排序来达到<code>提高运行性能</code>的作用。在<code>单线程情况下</code>，指令重排序并不会有影响，但在<code>多线程情况下</code>，指令重排序可能就会造成一些问题，产生的问题这里不过多赘述，我们重点讨论怎么解决这些问题。

有两个方向解决：	

- 操作系统层面解决
- Java层面解决

操作系统提供了一些内存屏障以解决这种问题. 内存屏障是硬件层的技术，它分为两种: <code>Load Barrier </code>和 <code>Store Barrier</code>即<code>读屏障</code>和<code>写屏障</code>. 但不同的硬件提供的内存屏障不同。怎么办?我们的<code>JVM</code>也会提供屏障技术：

![image-20220128173523766](https://cdn.fengxianhub.top/resources-master/202201281735850.png)

通过这些屏蔽技术可以保证我们的指令不会被从新排序，从而保存多线程下数据的一致性

指令重排序参考文章：

- https://blog.csdn.net/yjp198713/article/details/78839698?ops_request_misc=%257B%2522request%255Fid%2522%253A%2522164335638716780265487623%2522%252C%2522scm%2522%253A%252220140713.130102334..%2522%257D&request_id=164335638716780265487623&biz_id=0&utm_medium=distribute.pc_search_result.none-task-blog-2~all~sobaiduend~default-2-78839698.first_rank_v2_pc_rank_v29&utm_term=%E6%8C%87%E4%BB%A4%E9%87%8D%E6%8E%92%E5%BA%8F&spm=1018.2226.3001.4187
- http://www.cs.umd.edu/~pugh/java/memoryModel/jsr133.pdf 
- https://www.cs.umd.edu/users/pugh/java/memoryModel/jsr-133-faq.html 
- http://www.infoq.com/cn/articles/java-memory-model-2

当然<code>volatile</code>的神秘面纱我们还没有完全揭开，别着急，我们得继续往下看

<hr>

## 3 JMM（Java内存模型）

思维导图：

![image-20220128175145968](https://cdn.fengxianhub.top/resources-master/202201281751132.png)

原理图：

![image-20220128175604437](https://cdn.fengxianhub.top/resources-master/202201281756572.png)

>可以看到，Java内存模型和操作系统得内存模型具有惊人的相识之处

Java中一个<code>线程</code>从内存中取出数据，也会在自己的工作内存中创建一个副本，这个线程直接操作的对象其实是这个<code>副本</code>

我们再来举个栗子，通过这个栗子我们就会明白<code>volatile</code>是怎么保证在Java中多个线程同时访问一个数据并保证其一致性的

```java
public class _18_volatile {
    static int i=0;
    public static void main(Strinig[] args) {
        for (int j = 0; j < 2; j++) {
            new Thread(()->{
                i++;
            }).start();
        }
        System.out.println(i);
    }
}
```

```java
输出的结果是：1
```

图示一下这个过程：

![image-20220128180918419](https://cdn.fengxianhub.top/resources-master/202201281809599.png)

>但在多线程环境下，<code>t1</code>和<code>t2</code>都会把<code>i=0</code>这个变量先读到工作内存中，当<code>线程一</code>完成了<code>i++</code>的操作并将结果刷新到内存中时，其实<code>线程t2</code>的本地工作内存还没过期（已经读到之前i=0的数据了），那么它读到的数据就是<code>脏数据</code>了，<code>t2线程</code>处理完后又会将<code>i=1</code>再写到内存中，从而导致了问题

🚩操作系统会通过<code>窥探技术</code>和<code>缓存一致性协议</code>来解决上述问题

>那我们伟大的<code>Java</code>如何解决呢？ Java内存模型是围绕着如何在并发过程中如何处理<code>原子性</code>、<code>可见性</code>和<code>有序性</code>这3个特征来解决的，其实这也对应上述操作系统的解决过程。

🚩**Java并发编程三大特征：**

- 操作的<code>原子性</code>

- 操作结果的<code>可见性</code>
- 指令的<code>有序性</code>

感觉文章有点长了，下一节再详细解读！

























































