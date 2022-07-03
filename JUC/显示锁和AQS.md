# 显示锁和AQS学习

思维导图：

![image-20220502193727031](https://cdn.fengxianhub.top/resources-master/202205021937329.png)

## 1. 锁的类型&锁的分类

>在Java中根据锁的功能可以分为很多类型，看似很多，但其实都是为了解决一些问题才产生的，我们只需要根据特定的需求场景加以运用这些锁，就能够很快理解他们

思维导图：

![image-20220502214404184](https://cdn.fengxianhub.top/resources-master/202205022144382.png)

### 1.1 乐观锁

`乐观锁`是一种乐观思想，假定当前环境是`读多写少`，**遇到并发写的概率比较低**，**读数据时认为别的线程不会正在进行修改**（`所以没有上锁`）。写数据时，判断当前与期望值是否相同，如果相同则进行更新（更新期间加锁，保证是原子性的）。 Java中的乐观锁：CAS，比较并替换，比较当前值（主内存中的值），与预期值（当前线程中的值，主内存中值的一份拷贝）是否一样，一样则更新，否则继续进行CAS操作。 如图所示，可以同时进行读操作，读的时候其他线程不能进行写操作。

![image-20220502214006780](https://cdn.fengxianhub.top/resources-master/202205022140919.png)

### 1.2 悲观锁

`悲观锁`是一种悲观思想，即认为`写多读少`，**遇到并发写的可能性高，每次去拿数据的时候都认为其他线程会修改**，所以每次读写数据都会认为其他线程会修改，所以每次读写数据时都会上锁。其他线程想要读写这个数据时，会被这个线程block，直到这个线程释放锁然后其他线程获取到锁。 **Java中的悲观锁**：`synchronized修饰的方法和方法块`、`ReentrantLock（默认悲观，可以设置）`。 如下图所示，只能有一个线程进行读操作或者写操作，其他线程的读写操作均不能进行。

![image-20220502213951202](https://cdn.fengxianhub.top/resources-master/202205022139307.png)

### 1.3 自旋锁

`自旋锁是一种技术`： 为了让线程等待，我们只须让线程执行一个**忙循环**（自旋）。 现在绝大多数的个人电脑和服务器都是多路（核）处理器系统，如果物理机器有一个以上的处理器或者处理器核心，能让两个或以上的线程同时并行执行，就可以让后面请求锁的那个线程“稍等一会”，但不放弃处理器的执行时间，看看持有锁的线程是否很快就会释放锁。 

`自旋锁的优点`： 避免了线程切换的开销。**挂起线程和恢复线程的操作都需要转入内核态中完成，这些操作给Java虚拟机的并发性能带来了很大的压力**。

` 自旋锁的缺点`： **占用处理器的时间，如果占用的时间很长，会白白消耗处理器资源， 而不会做任何有价值的工作，带来性能的浪费**。因此自旋等待的时间必须有一定的限度，如果自旋超过了限定的次数仍然没有成功获得锁，就应当使用传统的方式去挂起线程。

 `自旋次数默认值：10次`，可以使用参数`-XX:PreBlockSpin`来自行更改。 

**自适应自旋**： 自适应意味着自旋的时间不再是固定的，而是由前一次在同一个锁上的自旋时间及锁的拥有者的状态来决定的。有了自适应自旋，随着程序运行时间的增长及性能监控信息的不断完善，虚拟机对程序锁的状态预测就会越来越精准。

 **Java中的自旋锁**： CAS操作中的比较操作失败后的自旋等待。

![image-20220502213852929](https://cdn.fengxianhub.top/resources-master/202205022138170.png)

### 1.4 可重入锁（递归锁）

`可重入锁是一种技术`： 任意线程在获取到锁之后能够再次获取该锁而不会被锁所阻塞。 

`可重入锁的原理`： 通过组合自定义同步器来实现锁的获取与释放。 

- 再次获取锁：识别获取锁的线程是否为当前占据锁的线程，如果是，则再次成功获取。获取锁后，进行计数自增
- 释放锁：释放锁时，进行计数自减。 

`Java中的可重入锁`： ReentrantLock、synchronized修饰的方法或代码段。 

**可重入锁的作用： 避免死锁**。 

面试题1： 可重入锁如果加了两把，但是只释放了一把会出现什么问题？ 答：程序卡死，线程不能出来，也就是说我们申请了几把锁，就需要释放几把锁。 

面试题2： 如果只加了一把锁，释放两次会出现什么问题？ 答：会报错，java.lang.IllegalMonitorStateException

![image-20220502232801057](https://cdn.fengxianhub.top/resources-master/202205022328238.png)

### 1.5 读写锁

`读写锁是一种技术`： 通过ReentrantReadWriteLock类来实现。为了提高性能， 

Java 提供了读写锁，**在读的地方使用读锁，在写的地方使用写锁**，灵活控制，如果没有写锁的情况下，读是无阻塞的，在一定程度上提高了程序的执行效率。 读写锁分为读锁 和写锁，多个读锁不互斥，读锁与写锁互斥，这是由 jvm 自己控制的。

`读锁`： 允许多个线程获取读锁，同时访问同一个资源。

`写锁`： 只允许一个线程获取写锁，不允许同时访问同一个资源。

![image-20220502235510469](https://cdn.fengxianhub.top/resources-master/202205022355573.png)

### 1.6 公平锁

`公平锁是一种思想`： 多个线程按照申请锁的顺序来获取锁。

在并发环境中，每个线程会先查看此锁维护的等待队列，如果当前等待队列为空，则占有锁，如果等待队列不为空，则加入到等待队列的末尾，按照FIFO的原则从队列中拿到线程，然后占有锁。

![image-20220502235744217](https://cdn.fengxianhub.top/resources-master/202205022357321.png)

### 1.7 非公平锁

`非公平锁是一种思想`： 线程尝试获取锁，如果获取不到，则再采用公平锁的方式。多个线程获取锁的顺序，不是按照先到先得的顺序，有可能后申请锁的线程比先申请的 线程优先获取锁。 

**优点**： 非公平锁的性能高于公平锁。 

**缺点**： 有可能造成线程饥饿（某个线程很长一段时间获取不到锁） 

**Java中的非公平锁**：synchronized是非公平锁，ReentrantLock通过构造函数指定该锁是公平的还是非公平的，默认是非公平的。

![image-20220502235944752](https://cdn.fengxianhub.top/resources-master/202205022359878.png)

### 1.8 共享锁

`共享锁是一种思想`： 可以有多个线程获取读锁，以共享的方式持有锁。和乐观锁、读写锁同义。

 **Java中用到的共享锁**：ReentrantReadWriteLock。

### 1.9 独占锁

`独占锁是一种思想`： 只能有一个线程获取锁，以独占的方式持有锁。和悲观锁、互斥锁同义。 

**Java中用到的独占锁**： synchronized，ReentrantLock

![image-20220503000929571](https://cdn.fengxianhub.top/resources-master/202205030009620.png)

### 1.10 重量级锁

`重量级锁是一种称谓`：synchronized是通过对象内部的一个叫做监视器锁 （**monitor**）来实现的，监视器锁本身依赖底层的操作系统的 `Mutex Lock`来实现。操作系统实现线程的切换需要从用户态切换到核心态，成本非常高。

这种依赖于操作系统 Mutex Lock来实现的锁称为重量级锁。为了优化`synchonized`，引入了轻量级锁， 偏向锁。

 **Java中的重量级锁**： synchronized

![image-20220503001043428](https://cdn.fengxianhub.top/resources-master/202205030010479.png)



### 1.11 轻量级锁

`轻量级锁`是JDK6时加入的一种锁优化机制： 轻量级锁是在无竞争的情况下使用`CAS操作`去消除同步使用的互斥量。轻量级是相对于使用操作系统互斥量来实现的重量级锁而言的。轻量级锁在没有多线程竞争的前提下，减少传统的重量级锁使用操作系统互斥量产生的性能消耗。如果出现两条以上的线程争用同一个锁的情况，那轻量级锁将不会有效，必须膨胀为重量级锁。 

**优点**： 如果没有竞争，通过CAS操作成功避免了使用互斥量的开销。 

**缺点**： 如果存在竞争，除了互斥量本身的开销外，还额外产生了CAS操作的开销，因 此在有竞争的情况下，轻量级锁比传统的重量级锁更慢

![image-20220503001206025](https://cdn.fengxianhub.top/resources-master/202205030012095.png)

### 1.12 偏向锁

`偏向锁是JDK6时加入的一种锁优化机制`： 在无竞争的情况下把整个同步都消除掉， 连CAS操作都不去做了。偏是指偏心，它的意思是这个锁会偏向于第一个获得它的线程，如果在接下来的执行过程中，该锁一直没有被其他的线程获取，则持有偏向锁的线程将永远不需要再进行同步。持有偏向锁的线程以后每次进入这个锁相关的同步块时，虚拟机都可以不再进行任何同步操作（例如加锁、解锁及对Mark Word的更新操作等）。 

**优点**： 把整个同步都消除掉，连CAS操作都不去做了，优于轻量级锁。

**缺点**： 如果程序中大多数的锁都总是被多个不同的线程访问，那偏向锁就是多余的。

![image-20220503001331782](https://cdn.fengxianhub.top/resources-master/202205030013840.png)

### 1.13 分段锁

`分段锁是一种机制`： 最好的例子来说明分段锁是ConcurrentHashMap。

**ConcurrentHashMap原理**：它内部细分了若干个小的 HashMap，称之为段 (Segment)。 默认情况下一个 ConcurrentHashMap 被进一步细分为 16 个段，既 就是锁的并发度。如果需要在 ConcurrentHashMap 添加一项key-value，并不是将 整个 HashMap 加锁，而是首先根据 hashcode 得到该key-value应该存放在哪个段 中，然后对该段加锁，并完成 put操作。在多线程环境中，如果多个线程同时进行 put操作，只要被加入的key-value不存放在同一个段中，则线程间可以做到真正的并 行。 

**线程安全**：ConcurrentHashMap 是一个 Segment 数组， Segment 通过继承 ReentrantLock 来进行加锁，所以每次需要加锁的操作锁住的是一个 segment，这 样只要保证每个 Segment 是线程安全的，也就实现了全局的线程安全

![image-20220503001435107](https://cdn.fengxianhub.top/resources-master/202205030014164.png)

### 1.14 互斥锁

`互斥锁与悲观锁、独占锁同义`，表示某个资源只能被一个线程访问，其他线程不能访问。

- 读-读互斥 
- 读-写互斥 
- 写-读互斥 
- 写-写互斥 

**Java中的同步锁**： synchronized

![image-20220503001546413](https://cdn.fengxianhub.top/resources-master/202205030015477.png)

### 1.15 同步锁

`同步锁与互斥锁同义`，表示并发执行的多个线程，在同一时间内只允许一个线程访问 共享数据。

**Java中的同步锁**： synchronized

![image-20220503001627048](https://cdn.fengxianhub.top/resources-master/202205030016106.png)

### 1.16 死锁、活锁、饥饿

`死锁是一种现象`：如线程A持有资源x，线程B持有资源y，线程A等待线程B释放资源 y，线程B等待线程A释放资源x，两个线程都不释放自己持有的资源，则两个线程都获 取不到对方的资源，就会造成死锁。 Java中的死锁不能自行打破，所以线程死锁后，线程不能进行响应。所以一定要注意程序的并发场景，避免造成死锁。

![image-20220503001703013](https://cdn.fengxianhub.top/resources-master/202205030017067.png)

活锁：活锁出现在两个线程互相改变对方的结束条件，最后谁也无法结束

饥饿：线程因无法访问所需资源而无法执行下去的情况，说白了就是：假设有1万个线程，还没等前面的线程执行完，后面的线程就饿死了

### 1.17 锁粗化

`锁粗化是一种优化技术`： 如果一系列的连续操作都对同一个对象反复加锁和解锁，甚至加锁操作都是出现在循环体之中，就算真的没有线程竞争，频繁地进行互斥同步操作将会导致不必要的性能损耗，所以就采取了一种方案：把加锁的范围扩展（**粗 化**）到整个操作序列的外部，这样加锁解锁的频率就会大大降低，从而减少了性能损耗。

![image-20220503001848796](https://cdn.fengxianhub.top/resources-master/202205030018886.png)

### 1.18 锁消除

`锁消除是一种优化技术`： 就是把锁干掉。当Java虚拟机运行时发现有些共享数据不会被线程竞争时就可以进行锁消除。 

那如何判断共享数据不会被线程竞争？ 

**利用逃逸分析技术**：分析对象的作用域，如果对象在A方法中定义后，被作为参数传递到B方法中，则称为方法逃逸；如果被其他线程访问，则称为线程逃逸。 在堆上的某个数据不会逃逸出去被其他线程访问到，就可以把它当作栈上数据对待， 认为它是线程私有的，同步加锁就不需要了。

![image-20220503002018145](https://cdn.fengxianhub.top/resources-master/202205030020207.png)

### 1.19 synchronized

`synchronized是Java中的关键字`：用来修饰方法、对象实例。属于独占锁、悲观锁、 可重入锁、非公平锁。 

1. 作用于实例方法时，锁住的是对象的实例(this)； 

2. 当作用于静态方法时，锁住的是 Class类，相当于类的一个全局锁，会锁 所有调用该方法的线程； 

3. synchronized 作用于一个非 NULL的对象实例时，锁住的是所有以该对象为锁的代码块。 它有多个队列，当多个线程一起访问某个对象监视器的时候，对象监视器会将这些线程存储在不同的容器中。

每个对象都有个 monitor 对象， 加锁就是在竞争 monitor 对象，代码块加锁是在代码块前后分别加上 monitorenter 和 monitorexit 指令来实现的，方法加锁是通过一 个标记位来判断的。

![image-20220503002122959](https://cdn.fengxianhub.top/resources-master/202205030021011.png)

### 1.20 Lock和synchronized的区别

**Lock： 是Java中的接口，可重入锁、悲观锁、独占锁、互斥锁、同步锁**。 

1. Lock需要手动获取锁和释放锁。就好比自动挡和手动挡的区别 

2. Lock是一个接口，而 synchronized 是 Java 中的关键字， synchronized 是内置的语言实现。 

3. synchronized 在发生异常时，会自动释放线程占有的锁，因此不会导致 死锁 现象发生；而 Lock 在发生异常时，如果没有主动通过 unLock()去释放锁，则很可能造成死锁现象，因此使用 Lock 时需要在 finally 块中释放锁。 

4. Lock 可以让等待锁的线程响应中断，而 synchronized 却不行，使用 synchronized 时，等待的线程会一直等待下去，不能够响应中断。

5. 通过 Lock 可以知道有没有成功获取锁，而 synchronized 却无法办到。 

6. Lock 可以通过实现读写锁提高多个线程进行读操作的效率。 

**synchronized的优势**： 

- 足够清晰简单，只需要基础的同步功能时，用synchronized。 
- Lock应该确保在finally块中释放锁。如果使用synchronized，JVM确保即使出现异常，锁也能被自动释放。 
- 使用Lock时，Java虚拟机很难得知哪些锁对象是由特定线程锁持有的。

### 1.21 ReentrantLock 和synchronized的区别

`ReentrantLock是Java中的类` ： 继承了Lock类，可重入锁、悲观锁、独占锁、互斥锁、同步锁。 

**划重点** 

**相同点**： 

1. 主要解决共享变量如何安全访问的问题 

2. 都是可重入锁，也叫做递归锁，同一线程可以多次获得同一个锁， 

3. 保证了线程安全的两大特性：可见性、原子性。 

**不同点**： 

1. ReentrantLock 就像手动汽车，需要显示的调用lock和unlock方法， synchronized 隐式获得释放锁。 

2. ReentrantLock 可响应中断， synchronized 是不可以响应中断的， ReentrantLock 为处理锁的不可用性提供了更高的灵活性 
3. ReentrantLock 是 API 级别的， synchronized 是 JVM 级别的 

4. ReentrantLock 可以实现公平锁、非公平锁，默认非公平锁， synchronized 是非公平锁，且不可更改。

5. ReentrantLock 通过 Condition 可以绑定多个条件

## 2. 显示锁ReentrantLock API

显示锁常用API：

![image-20220503003158484](https://cdn.fengxianhub.top/resources-master/202205030031669.png)

>在Java 1.5之前，协调对共享对象的访问可以使用的机制只有`synchronized`和`volatile`两种。Java1.5增加了一种新的机制：`ReentrantLock`。但`ReentrantLock`并不是替代内置加锁的方法，而是当内置加[锁机制](https://so.csdn.net/so/search?q=锁机制&spm=1001.2101.3001.7020)不适用时，作为一种可选择的高级功能。

### 2.1 显示锁的概念

显示锁`ReentrantLock`是相对于`synchronized`而言的，因为ReentrantLock加锁减锁都需要手动调用方法进行，所以称之为显示锁，而synchronized则不需要，但是也正因为如此，ReentrantLock提供了更高的灵活性和更强大的功能

显示锁中调用了AQS维护同步状态，所以需要先了解AQS



## 3. AQS抽象队列同步器

思维导图：

![image-20220503121445260](https://cdn.fengxianhub.top/resources-master/202205031214431.png)

在学习了`Unsafe`类后我们知道我们的并发工具类和Atomic原子类都是用`自旋`+`CAS`来保证线程安全的，其中CAS设置的值会用`volatile`修饰，来保证共享变量的可见性和有序性，在`AQS`中，同样也使用了一个变量` volatile int state`来表示共享资源

通过state变量我们可以标记当前资源有没有被其他线程占有，当然我们也可以用bit位来标记被多少个线程占有了（共享锁）

AQS提供了三个方法供调用者操作state对象：

- getState()：获取当前同步状态
- setState()：设置当前同步状态，非安全
- compareAndSetState(int expect, int update)：使用CAS设置状态，保证状态设置的原子性

AQS为我们提供了和`synchronized`的堵塞队列和等待队列，分别为：

- 提供了基于 FIFO 的等待队列，类似于 Monitor 的 EntryList 
- 条件变量来实现等待、唤醒机制，支持多个条件变量，类似于 Monitor 的 WaitSet

### 3.1 AQS中设计

>起源：
>
>早期程序员会自己通过一种同步器去实现另一种相近的同步器，例如用可重入锁去实现信号量，或反之。这显然不够优雅，于是在 JSR166（java 规范提案）中创建了 `AQS`，提供了这种通用的同步器机制

>目标：

AQS 要实现的功能目标：

- 阻塞版本获取锁 acquire 和非阻塞的版本尝试获取锁 tryAcquire 
- 获取锁超时机制
- 通过打断取消机制 
- 独占机制及共享机制 
- 条件不满足时的等待机制

>设计

AQS 的基本思想其实很简单

获取锁的逻辑

```java
while(state 状态不允许获取) {
     if(队列中还没有此线程) {
         入队并阻塞
     }
}
当前线程出队

```

释放锁的逻辑

```java
if(state 状态允许了) {
     恢复阻塞的线程(s)
}

```

要点：

- 原子维护 state 状态 
- 阻塞及恢复线程 
- 维护队列

**state 设计**

- state 使用 volatile 配合 cas 保证其修改时的原子性 
- state 使用了 32bit int 来维护同步状态，因为当时使用 long 在很多平台下测试的结果并不理想

**阻塞恢复设计**

- 早期的控制线程暂停和恢复的 api 有 suspend 和 resume，但它们是不可用的，因为如果先调用的 resume  那么 suspend 将感知不到 
- 解决方法是使用 park & unpark 来实现线程的暂停和恢复，具体原理在之前讲过了，先 unpark 再 park 也没问题 
- park & unpark 是针对线程的，而不是针对同步器的，因此控制粒度更为精细 park 线程还可以通过 interrupt 打断

**队列设计**

- 使用了 FIFO 先入先出队列，并不支持优先级队列 
- 设计时借鉴了 CLH 队列，它是一种单向无锁队列

<img src="https://cdn.fengxianhub.top/resources-master/202205132227216.png" alt="image-20220513222746082" style="zoom: 67%;" />

队列中有 head 和 tail 两个指针节点，都用 volatile 修饰配合 cas 使用，每个节点有 state 维护节点状态 

入队伪代码，只需要考虑 tail 赋值的原子性

```java
do {
     // 原来的 tail
     Node prev = tail;
     // 用 cas 在原来 tail 的基础上改为 node
} while(tail.compareAndSet(prev, node))
```

**出队伪代码**

```java
// prev 是上一个节点
while((Node prev=node.prev).state != 唤醒状态) {
}
// 设置头节点
head = node;
```

**CLH 好处**

- 无锁，使用自旋
- 快速，无阻塞

AQS 在一些方面改进了 CLH

```java
private Node enq(final Node node) {
    for (;;) {
        Node t = tail;
        // 队列中还没有元素 tail 为 null
        if (t == null) {
            // 将 head 从 null -> dummy
            if (compareAndSetHead(new Node()))
                tail = head;
        } else {
            // 将 node 的 prev 设置为原来的 tail
            node.prev = t;
            // 将 tail 从原来的 tail 设置为 node
            if (compareAndSetTail(t, node)) {
                // 原来 tail 的 next 设置为 node
                t.next = node;
                return t;
            }
        }
    }
}
```

**主要用到 AQS 的并发工具类**

![image-20220513222713786](https://cdn.fengxianhub.top/resources-master/202205132227093.png)



### 3.2 AQS中的模板设计模式

在AQS中使用了模板设计模式，通过把不变的行为挪到一个统一的父类，从而达到去除子类中重复代码的目的，同时子类实现模板父类的某些细节，有助于模板父类的扩展

例如我们可以看到`ReentrantLock`中定义了一个抽象类`Sync`，此类派生出了`FairSync`和`NonfairSync`，也就是我们常说的公平锁和非公平锁，默认创建的是NonfairSync非公平锁

### 3.3 AQS使用方式源码分析

思维导图：

![image-20220503193414655](https://cdn.fengxianhub.top/resources-master/202205031934814.png)



**acquire获取锁**

首先我们来分析第一个方法：`void acquire(int arg)`，表示当前线程去获取锁

```java
public final void acquire(int arg) {
    if (!tryAcquire(arg) &&
        acquireQueued(addWaiter(Node.EXCLUSIVE), arg))
        selfInterrupt();
}
```

里面的代码其实分为三步：

```java
tryAcquire(arg)  
acquireQueued(addWaiter(Node.EXCLUSIVE), arg)
selfInterrupt()
```

首先尝试获取锁`tryAcquire`，可以选择阻塞当前线程，底层调用的是LocakSupport类的park unpark方法

tryAcquire方法具体代码为：

```java
protected boolean tryAcquire(int arg) {
    throw new UnsupportedOperationException();
}
```

这个方法并没有实现，这里是典型的模板模式的应用，具体获取锁的方法在父类中定义模板，在子类中具体实现

如果加锁失败，取反即为真，根据`&&`运算符的短路原则，执行`acquireQueued`方法

`acquireQueued(addWaiter(Node.EXCLUSIVE), arg)`，将获取锁失败的线程加到等待队列中

我们查看`addWaiter`具体代码，在AQS中的双端队列底层使用双向链表进行维护的，此方法中先是对链表进行操作

```java
//       结点类型，默认排他Node.EXCLUSIVE
private Node addWaiter(Node mode) {
    Node node = new Node(Thread.currentThread(), mode);
    // Try the fast path of enq; backup to full enq on failure
    Node pred = tail;
    if (pred != null) {
        node.prev = pred;
        //将当前结点设置为链表的最后一个结点
        if (compareAndSetTail(pred, node)) {
            //将当前结点添加到链表中
            pred.next = node;
            return node;
        }
    }
    //如果链表中没有结点，将当前结点设置为链表的第一个结点
    enq(node);
    return node;
}
```

接着调用`acquireQueued`方法，对双端队列进行操作



## 4. AQS实现源码分析

我们可以看到在AQS中定义了很多的模板方法，例如`tryAcquire`、`tryRelease`，需要子类去覆盖父类中的方法，接着我们就研究一下在`ReentrantLock`中是怎么实现AQS中的模板方法的

思维导图：

![image-20220511112641533](https://cdn.fengxianhub.top/resources-master/202205111132407.png)

考虑到源码分析如果没有应用场景的话会很晦涩难懂，而`ReentrantLock`就是`AQS`最好的体现，所以读者可以直接看`ReentrantLock`的源码分析

## 5. ReentrantLock源码分析

ReentrantLock的类继承体系为：

![image-20220513205925660](https://cdn.fengxianhub.top/resources-master/202205132059798.png)

### 5.1 加锁成功流程

源码部分有点难理解，得多看几遍视频，黑马视频直达：<a href="https://www.bilibili.com/video/BV16J411h7Rd?p=239&spm_id_from=pageDriver">黑马ReentrantLock源码分析</a>

因为在`ReentrantLock`中默认使用非公平锁，可以从构造器中看到默认的非公平锁实现

```java
public ReentrantLock() {
     sync = new NonfairSync();
}
```

NonfairSync 继承自 Sync，Sync继承自AQS，但没有线程竞争时：

![image-20220513224443144](https://cdn.fengxianhub.top/resources-master/202205132245483.png)

第一个竞争出现时：

![image-20220513231050386](https://cdn.fengxianhub.top/resources-master/202205132310500.png)

Thread-1 执行了

1. CAS 尝试将 state 由 0 改为 1，结果失败

2.  进入 tryAcquire 逻辑，这时 state 已经是1，结果仍然失败

3. 接下来进入 addWaiter 逻辑，构造 Node 队列

   - 图中黄色三角表示该 Node 的 waitStatus 状态，其中 0 为默认正常状态
   - Node 的创建是懒惰的
   - 其中第一个 Node 称为 Dummy（哑元）或哨兵，用来占位，并不关联线程

   ![image-20220513231342781](https://cdn.fengxianhub.top/resources-master/202205132313886.png)

当前线程进入 acquireQueued 逻辑

1. acquireQueued 会在一个死循环中不断尝试获得锁，失败后进入 park 阻塞

2. 如果自己是紧邻着 head（排第二位），那么再次 tryAcquire 尝试获取锁，当然这时 state 仍为 1，失败

3. 进入 shouldParkAfterFailedAcquire 逻辑，将前驱 node，即 head 的 waitStatus 改为 -1，这次返回 false（**值为-1的结点表示有职责去唤醒自己的后继结点**）

   ![image-20220513232718108](https://cdn.fengxianhub.top/resources-master/202205132327215.png)

4. shouldParkAfterFailedAcquire 执行完毕回到 acquireQueued ，再次 tryAcquire 尝试获取锁，当然这时 state 仍为 1，失败

5. 当再次进入 shouldParkAfterFailedAcquire 时，这时因为其前驱 node 的 waitStatus 已经是 -1，这次返回 true

6.  进入 parkAndCheckInterrupt， Thread-1 park（灰色表示）

   ![image-20220513232954870](https://cdn.fengxianhub.top/resources-master/202205132329965.png)

**如果多个线程经历上述过程竞争失败，就会变成这个样子**

![image-20220513233114061](https://cdn.fengxianhub.top/resources-master/202205132331157.png)

Thread-0 释放锁，进入 tryRelease 流程，如果成功

- 设置 exclusiveOwnerThread 为 null
- state = 0

![image-20220513233428509](https://cdn.fengxianhub.top/resources-master/202205132334598.png)

当前队列不为 null，并且 head 的 waitStatus = -1，进入 unparkSuccessor 流程

找到队列中离 head 最近的一个 Node（没取消的），unpark 恢复其运行，本例中即为 Thread-1

回到 Thread-1 的 acquireQueued 流程

![image-20220513233915731](https://cdn.fengxianhub.top/resources-master/202205132339853.png)

如果加锁成功（没有竞争），会设置

- exclusiveOwnerThread 为 Thread-1，state = 1
- head 指向刚刚 Thread-1 所在的 Node，该 Node 清空 Thread
- 原本的 head 因为从链表断开，而可被垃圾回收

如果这时候有其它线程来竞争（**非公平的体现**），例如这时有 Thread-4 来了

![image-20220513234052895](https://cdn.fengxianhub.top/resources-master/202205132340995.png)

如果不巧又被 Thread-4 占了先

- Thread-4 被设置为 exclusiveOwnerThread，state = 1
- Thread-4 被设置为 exclusiveOwnerThread，state = 1

### 5.2 加/解锁源码分析

**加锁源码**

```java
// Sync 继承自 AQS
static final class NonfairSync extends Sync {
 private static final long serialVersionUID = 7316153563782823691L;
 
 // 加锁实现
final void lock() {
    // 首先用 cas 尝试（仅尝试一次）将 state 从 0 改为 1, 如果成功表示获得了独占锁
    if (compareAndSetState(0, 1))
        setExclusiveOwnerThread(Thread.currentThread());
    else
        // 如果尝试失败，进入 ㈠
        acquire(1);
}

    // ㈠ AQS 继承过来的方法, 方便阅读, 放在此处
    public final void acquire(int arg) {
        // ㈡ tryAcquire 
        if (
            !tryAcquire(arg) &&
            // 当 tryAcquire 返回为 false 时, 先调用 addWaiter ㈣, 接着 acquireQueued ㈤
            acquireQueued(addWaiter(Node.EXCLUSIVE), arg)
        ) {
            selfInterrupt();
        }
    }

    // ㈡ 进入 ㈢
    protected final boolean tryAcquire(int acquires) {
        return nonfairTryAcquire(acquires);
    }

    // ㈢ Sync 继承过来的方法, 方便阅读, 放在此处
    final boolean nonfairTryAcquire(int acquires) {
        final Thread current = Thread.currentThread();
        int c = getState();
        // 如果还没有获得锁
        if (c == 0) {
            // 尝试用 cas 获得, 这里体现了非公平性: 不去检查 AQS 队列
            if (compareAndSetState(0, acquires)) {
                setExclusiveOwnerThread(current);
                return true;
            }
        }
        // 如果已经获得了锁, 线程还是当前线程, 表示发生了锁重入
        else if (current == getExclusiveOwnerThread()) {
            // state++
            int nextc = c + acquires;
            if (nextc < 0) // overflow
                throw new Error("Maximum lock count exceeded");
            setState(nextc);
            return true;
        }
        // 获取失败, 回到调用处
        return false;
    }
    // ㈣ AQS 继承过来的方法, 方便阅读, 放在此处
    private Node addWaiter(Node mode) {
		// 将当前线程关联到一个 Node 对象上, 模式为独占模式
		Node node = new Node(Thread.currentThread(), mode);
        // 如果 tail 不为 null, cas 尝试将 Node 对象加入 AQS 队列尾部
        Node pred = tail;
        if (pred != null) {
        	node.prev = pred;
            if (compareAndSetTail(pred, node)) {
                 // 双向链表
                 pred.next = node;
                 return node;
             }
         }
         // 尝试将 Node 加入 AQS, 进入 ㈥
         enq(node);
         return node;
     }
    // ㈥ AQS 继承过来的方法, 方便阅读, 放在此处
	private Node enq(final Node node) {
        for (;;) {
            Node t = tail;
            if (t == null) {
                // 还没有, 设置 head 为哨兵节点（不对应线程，状态为 0）
                if (compareAndSetHead(new Node())) {
                    tail = head;
                }
            } else {
                // cas 尝试将 Node 对象加入 AQS 队列尾部
                node.prev = t;
                if (compareAndSetTail(t, node)) {
                    t.next = node;
                    return t;
                }
            }
        }
    }
    // ㈤ AQS 继承过来的方法, 方便阅读, 放在此处
    final boolean acquireQueued(final Node node, int arg) {
        boolean failed = true;
        try {
            boolean interrupted = false;
            for (; ; ) {
                final Node p = node.predecessor();
                // 上一个节点是 head, 表示轮到自己（当前线程对应的 node）了, 尝试获取
                if (p == head && tryAcquire(arg)) {
                    // 获取成功, 设置自己（当前线程对应的 node）为 head
                    setHead(node);
                    // 上一个节点 help GC
                    p.next = null;
                    failed = false;
                    // 返回中断标记 false
                    return interrupted;
                }
                if (
                    // 判断是否应当 park, 进入 ㈦
                        shouldParkAfterFailedAcquire(p, node) &&
                                // park 等待, 此时 Node 的状态被置为 Node.SIGNAL ㈧
                                parkAndCheckInterrupt()
                ) {
                    interrupted = true;
                }
            }
        } finally {
            if (failed)
                cancelAcquire(node);
        }
    }
    
    // ㈦ AQS 继承过来的方法, 方便阅读, 放在此处
    private static boolean shouldParkAfterFailedAcquire(Node pred, Node node) {
        // 获取上一个节点的状态
        int ws = pred.waitStatus;
        if (ws == Node.SIGNAL) {
            // 上一个节点都在阻塞, 那么自己也阻塞好了
            return true;
        }
        // > 0 表示取消状态
        if (ws > 0) {
            // 上一个节点取消, 那么重构删除前面所有取消的节点, 返回到外层循环重试
            do {
                node.prev = pred = pred.prev;
            } while (pred.waitStatus > 0);
            pred.next = node;
        } else {
            // 这次还没有阻塞
            // 但下次如果重试不成功, 则需要阻塞，这时需要设置上一个节点状态为 Node.SIGNAL
            compareAndSetWaitStatus(pred, ws, Node.SIGNAL);
        }
        return false;
    }
    // ㈧ 阻塞当前线程
	private final boolean parkAndCheckInterrupt() {
        LockSupport.park(this);
        return Thread.interrupted();
    }
}
```

>注意：是否需要 `unpark `是由当前节点的前驱节点的 `waitStatus == Node.SIGNAL` 来决定，而不是本节点的 `waitStatus `决定

**解锁源码**

```java
// Sync 继承自 AQS
static final class NonfairSync extends Sync {
    // 解锁实现
    public void unlock() {
        sync.release(1);
    }

    // AQS 继承过来的方法, 方便阅读, 放在此处
    public final boolean release(int arg) {
        // 尝试释放锁, 进入 ㈠
        if (tryRelease(arg)) {
            // 队列头节点 unpark
            Node h = head;
            if (
                // 队列不为 null
                    h != null &&
                            // waitStatus == Node.SIGNAL 才需要 unpark
                            h.waitStatus != 0
            ) {
                // unpark AQS 中等待的线程, 进入 ㈡
                unparkSuccessor(h);
            }
            return true;
        }
        return false;
    }

    // ㈠ Sync 继承过来的方法, 方便阅读, 放在此处
    protected final boolean tryRelease(int releases) {
        // state--
        int c = getState() - releases;
        if (Thread.currentThread() != getExclusiveOwnerThread())
            throw new IllegalMonitorStateException();
        boolean free = false;
        // 支持锁重入, 只有 state 减为 0, 才释放成功
        if (c == 0) {
            free = true;
            setExclusiveOwnerThread(null);
        }
        setState(c);
        return free;
    }
    // ㈡ AQS 继承过来的方法, 方便阅读, 放在此处
    private void unparkSuccessor(Node node) {
        // 如果状态为 Node.SIGNAL 尝试重置状态为 0
        // 不成功也可以
        int ws = node.waitStatus;
        if (ws < 0) {
            compareAndSetWaitStatus(node, ws, 0);
     }
     // 找到需要 unpark 的节点, 但本节点从 AQS 队列中脱离, 是由唤醒节点完成的
	    Node s = node.next;
     // 不考虑已取消的节点, 从 AQS 队列从后至前找到队列最前面需要 unpark 的节点
     if (s == null || s.waitStatus > 0) {
         s = null;
         for (Node t = tail; t != null && t != node; t = t.prev)
             if (t.waitStatus <= 0)
                 s = t;
      }
      if (s != null)
         LockSupport.unpark(s.thread);
   }
}
```

### 5.3 可重入原理

```java
static final class NonfairSync extends Sync {
    // ...

    // Sync 继承过来的方法, 方便阅读, 放在此处
    final boolean nonfairTryAcquire(int acquires) {
        final Thread current = Thread.currentThread();
        int c = getState();
        if (c == 0) {
            if (compareAndSetState(0, acquires)) {
                setExclusiveOwnerThread(current);
                return true;
            }
        }
        // 如果已经获得了锁, 线程还是当前线程, 表示发生了锁重入
        else if (current == getExclusiveOwnerThread()) {
            // state++
            int nextc = c + acquires;
            if (nextc < 0) // overflow
                throw new Error("Maximum lock count exceeded");
            setState(nextc);
            return true;
        }
        return false;
    }

    // Sync 继承过来的方法, 方便阅读, 放在此处
    protected final boolean tryRelease(int releases) {
        // state-- 
        int c = getState() - releases;
        if (Thread.currentThread() != getExclusiveOwnerThread())
            throw new IllegalMonitorStateException();
        boolean free = false;
        // 支持锁重入, 只有 state 减为 0, 才释放成功
        if (c == 0) {
            free = true;
            setExclusiveOwnerThread(null);
        }
        setState(c);
        return free;
    }
}
```

>可重入总结：当同一个线程获取锁时让`state++`，当释放锁时`state--`

### 5.4 可打断原理

**不可打断模式**

在此模式下，即使它被打断，仍会驻留在 AQS 队列中，一直要等到获得锁后方能得知自己被打断了

```java
// Sync 继承自 AQS
static final class NonfairSync extends Sync {
    // ...

    private final boolean parkAndCheckInterrupt() {
        // 如果打断标记已经是 true, 则 park 会失效
        LockSupport.park(this);
        // interrupted 会清除打断标记
        return Thread.interrupted();
    }

    final boolean acquireQueued(final Node node, int arg) {
        boolean failed = true;
        try {
            boolean interrupted = false;
            for (;;) {
                final Node p = node.predecessor();
                if (p == head && tryAcquire(arg)) {
                    setHead(node);
                    p.next = null;
                    failed = false;
                    // 还是需要获得锁后, 才能返回打断状态
                    return interrupted;
                }
                if (
                        shouldParkAfterFailedAcquire(p, node) &&
                                parkAndCheckInterrupt()
                ) {
                    // 如果是因为 interrupt 被唤醒, 返回打断状态为 true
                    interrupted = true;
                }
            }
        } finally {
            if (failed)
                cancelAcquire(node);
        }
    }
    
    public final void acquire(int arg) {
        if (
                !tryAcquire(arg) &&
                        acquireQueued(addWaiter(Node.EXCLUSIVE), arg)
        ) {
            // 如果打断状态为 true
            selfInterrupt();
        }
    }

    static void selfInterrupt() {
        // 重新产生一次中断
        Thread.currentThread().interrupt();
    }
}
```

**可打断模式**

```java
static final class NonfairSync extends Sync {
    public final void acquireInterruptibly(int arg) throws InterruptedException {
        if (Thread.interrupted())
            throw new InterruptedException();
        // 如果没有获得到锁, 进入 ㈠
        if (!tryAcquire(arg))
            doAcquireInterruptibly(arg);
    }

    // ㈠ 可打断的获取锁流程
    private void doAcquireInterruptibly(int arg) throws InterruptedException {
        final Node node = addWaiter(Node.EXCLUSIVE);
        boolean failed = true;
        try {
            for (;;) {
                final Node p = node.predecessor();
                if (p == head && tryAcquire(arg)) {
                    setHead(node);
                    p.next = null; // help GC
                    failed = false;
                    return;
                }
                if (shouldParkAfterFailedAcquire(p, node) &&
                        parkAndCheckInterrupt()) {
                    // 在 park 过程中如果被 interrupt 会进入此
                    // 这时候抛出异常, 而不会再次进入 for (;;)
                    throw new InterruptedException();
                }
            }
        } finally {
            if (failed)
                cancelAcquire(node);
        }
    }
}
```

### 5.5  公平锁实现原理

```java
static final class FairSync extends Sync {
    private static final long serialVersionUID = -3000897897090466540L;
    final void lock() {
        acquire(1);
    }

    // AQS 继承过来的方法, 方便阅读, 放在此处
    public final void acquire(int arg) {
        if (
                !tryAcquire(arg) &&
                        acquireQueued(addWaiter(Node.EXCLUSIVE), arg)
        ) {
            selfInterrupt();
        }
    }
    // 与非公平锁主要区别在于 tryAcquire 方法的实现
    protected final boolean tryAcquire(int acquires) {
        final Thread current = Thread.currentThread();
        int c = getState();
        if (c == 0) {
            // 先检查 AQS 队列中是否有前驱节点, 没有才去竞争
            if (!hasQueuedPredecessors() &&
                    compareAndSetState(0, acquires)) {
                setExclusiveOwnerThread(current);
                return true;
            }
        }
        else if (current == getExclusiveOwnerThread()) {
            int nextc = c + acquires;
            if (nextc < 0)
                throw new Error("Maximum lock count exceeded");
            setState(nextc);
            return true;
        }
        return false;
    }
   // ㈠ AQS 继承过来的方法, 方便阅读, 放在此处
    public final boolean hasQueuedPredecessors() {
        Node t = tail;
        Node h = head;
        Node s;
        // h != t 时表示队列中有 Node
        return h != t &&
                (
                        // (s = h.next) == null 表示队列中还有没有老二
                        (s = h.next) == null ||
                                // 或者队列中老二线程不是此线程
                                s.thread != Thread.currentThread()
                );
    }
}
	// ㈢ Sync 继承过来的方法, 方便阅读, 放在此处 --> 非公平锁非公平体现
    final boolean nonfairTryAcquire(int acquires) {
        final Thread current = Thread.currentThread();
        int c = getState();
        // 如果还没有获得锁
        if (c == 0) {
            // 尝试用 cas 获得, 这里体现了非公平性: 不去检查 AQS 队列
            if (compareAndSetState(0, acquires)) {
                setExclusiveOwnerThread(current);
                return true;
            }
        }
        // 如果已经获得了锁, 线程还是当前线程, 表示发生了锁重入
        else if (current == getExclusiveOwnerThread()) {
            // state++
            int nextc = c + acquires;
            if (nextc < 0) // overflow
                throw new Error("Maximum lock count exceeded");
            setState(nextc);
            return true;
        }
        // 获取失败, 回到调用处
        return false;
    }
```

### 5.5 条件变量实现原理

每个条件变量其实就对应着一个等待队列，其实现类是 ConditionObject

**await 流程**

开始 Thread-0 持有锁，调用 await，进入 ConditionObject 的 addConditionWaiter 流程

创建新的 Node 状态为 -2（Node.CONDITION），关联 Thread-0，加入等待队列尾部

![image-20220514093807284](https://cdn.fengxianhub.top/resources-master/202205140938481.png)

接下来进入 AQS 的 fullyRelease 流程（fullyRelease 会将重入的state值归零），释放同步器上的锁

![image-20220514094622399](https://cdn.fengxianhub.top/resources-master/202205140946538.png)

unpark AQS 队列中的下一个节点，竞争锁，假设没有其他竞争线程，那么 Thread-1 竞争成功

![image-20220514094638015](https://cdn.fengxianhub.top/resources-master/202205140946146.png)

park 阻塞 Thread-0

![image-20220514094719940](https://cdn.fengxianhub.top/resources-master/202205140947075.png)

**signal 流程**

![image-20220514094755191](https://cdn.fengxianhub.top/resources-master/202205140947323.png)

进入 ConditionObject 的 doSignal 流程，取得等待队列中第一个 Node，即 Thread-0 所在 Node

![image-20220514094941731](https://cdn.fengxianhub.top/resources-master/202205140949867.png)

执行 transferForSignal 流程，将该 Node 加入 AQS 队列尾部，将 Thread-0 的 waitStatus 改为 0，Thread-3 的 waitStatus 改为 -1

![image-20220514095159540](https://cdn.fengxianhub.top/resources-master/202205141012571.png)

Thread-1 释放锁，进入 unlock 流程，略

```java
public class ConditionObject implements Condition, java.io.Serializable {
    private static final long serialVersionUID = 1173984872572414699L;

    // 第一个等待节点
    private transient Node firstWaiter;

    // 最后一个等待节点
    private transient Node lastWaiter;
    public ConditionObject() { }
    // ㈠ 添加一个 Node 至等待队列
    private Node addConditionWaiter() {
        Node t = lastWaiter;
        // 所有已取消的 Node 从队列链表删除, 见 ㈡
        if (t != null && t.waitStatus != Node.CONDITION) {
            unlinkCancelledWaiters();
            t = lastWaiter;
        }
        // 创建一个关联当前线程的新 Node, 添加至队列尾部
        Node node = new Node(Thread.currentThread(), Node.CONDITION);
        if (t == null)
            firstWaiter = node;
        else
            t.nextWaiter = node;
        lastWaiter = node;
        return node;
    }
    // 唤醒 - 将没取消的第一个节点转移至 AQS 队列
    private void doSignal(Node first) {
        do {
            // 已经是尾节点了
            if ( (firstWaiter = first.nextWaiter) == null) {
                lastWaiter = null;
            }
            first.nextWaiter = null;
        } while (
            // 将等待队列中的 Node 转移至 AQS 队列, 不成功且还有节点则继续循环 ㈢
                !transferForSignal(first) &&
                        // 队列还有节点
                        (first = firstWaiter) != null
        );
    }

    // 外部类方法, 方便阅读, 放在此处
    // ㈢ 如果节点状态是取消, 返回 false 表示转移失败, 否则转移成功
    final boolean transferForSignal(Node node) {
        // 如果状态已经不是 Node.CONDITION, 说明被取消了
        if (!compareAndSetWaitStatus(node, Node.CONDITION, 0))
            return false;
        // 加入 AQS 队列尾部
        Node p = enq(node);
        int ws = p.waitStatus;
        if (
            // 上一个节点被取消
                ws > 0 ||
                        // 上一个节点不能设置状态为 Node.SIGNAL
                        !compareAndSetWaitStatus(p, ws, Node.SIGNAL)
        ) {
            // unpark 取消阻塞, 让线程重新同步状态
            LockSupport.unpark(node.thread);
        }
        return true;
    }
    
    // 全部唤醒 - 等待队列的所有节点转移至 AQS 队列
    private void doSignalAll(Node first) {
        lastWaiter = firstWaiter = null;
        do {
            Node next = first.nextWaiter;
            first.nextWaiter = null;
            transferForSignal(first);
            first = next;
        } while (first != null);
    }

    // ㈡
    private void unlinkCancelledWaiters() {
        // ...
    }
    // 唤醒 - 必须持有锁才能唤醒, 因此 doSignal 内无需考虑加锁
    public final void signal() {
        if (!isHeldExclusively())
            throw new IllegalMonitorStateException();
        Node first = firstWaiter;
        if (first != null)
            doSignal(first);
    }
    // 全部唤醒 - 必须持有锁才能唤醒, 因此 doSignalAll 内无需考虑加锁
    public final void signalAll() {
        if (!isHeldExclusively())
            throw new IllegalMonitorStateException();
        Node first = firstWaiter;
        if (first != null)
            doSignalAll(first);
    }
    // 不可打断等待 - 直到被唤醒
    public final void awaitUninterruptibly() {
        // 添加一个 Node 至等待队列, 见 ㈠
        Node node = addConditionWaiter();
        // 释放节点持有的锁, 见 ㈣
        int savedState = fullyRelease(node);
        boolean interrupted = false;
        // 如果该节点还没有转移至 AQS 队列, 阻塞
        while (!isOnSyncQueue(node)) {
            // park 阻塞
            LockSupport.park(this);
            // 如果被打断, 仅设置打断状态
            if (Thread.interrupted())
                interrupted = true;
        }
        // 唤醒后, 尝试竞争锁, 如果失败进入 AQS 队列
        if (acquireQueued(node, savedState) || interrupted)
            selfInterrupt();
    }
    // 外部类方法, 方便阅读, 放在此处
    // ㈣ 因为某线程可能重入，需要将 state 全部释放
    final int fullyRelease(Node node) {
        boolean failed = true;
        try {
            int savedState = getState();
            if (release(savedState)) {
                failed = false;
                return savedState;
            } else {
                throw new IllegalMonitorStateException();
            }
        } finally {
            if (failed)
                node.waitStatus = Node.CANCELLED;
        }
    }
    // 打断模式 - 在退出等待时重新设置打断状态
    private static final int REINTERRUPT = 1;
    // 打断模式 - 在退出等待时抛出异常
    private static final int THROW_IE = -1;
    // 判断打断模式
    private int checkInterruptWhileWaiting(Node node) {
        return Thread.interrupted() ?
                (transferAfterCancelledWait(node) ? THROW_IE : REINTERRUPT) :
                0;
    }
    // ㈤ 应用打断模式
    private void reportInterruptAfterWait(int interruptMode)
            throws InterruptedException {
        if (interruptMode == THROW_IE)
            throw new InterruptedException();
        else if (interruptMode == REINTERRUPT)
            selfInterrupt();
    }
    // 等待 - 直到被唤醒或打断
    public final void await() throws InterruptedException {
        if (Thread.interrupted()) {
            throw new InterruptedException();
        }
        // 添加一个 Node 至等待队列, 见 ㈠
        Node node = addConditionWaiter();
        // 释放节点持有的锁
        int savedState = fullyRelease(node);
        int interruptMode = 0;
        // 如果该节点还没有转移至 AQS 队列, 阻塞
        while (!isOnSyncQueue(node)) {
            // park 阻塞
            LockSupport.park(this);
            // 如果被打断, 退出等待队列
            if ((interruptMode = checkInterruptWhileWaiting(node)) != 0)
                break;
        }
        // 退出等待队列后, 还需要获得 AQS 队列的锁
        if (acquireQueued(node, savedState) && interruptMode != THROW_IE)
            interruptMode = REINTERRUPT;
        // 所有已取消的 Node 从队列链表删除, 见 ㈡
        if (node.nextWaiter != null)
            unlinkCancelledWaiters();
        // 应用打断模式, 见 ㈤
        if (interruptMode != 0)
            reportInterruptAfterWait(interruptMode);
    }
    // 等待 - 直到被唤醒或打断或超时
    public final long awaitNanos(long nanosTimeout) throws InterruptedException {
        if (Thread.interrupted()) {
            throw new InterruptedException();
        }
        // 添加一个 Node 至等待队列, 见 ㈠
        Node node = addConditionWaiter();
        // 释放节点持有的锁
        int savedState = fullyRelease(node);
        // 获得最后期限
        final long deadline = System.nanoTime() + nanosTimeout;
        int interruptMode = 0;
        // 如果该节点还没有转移至 AQS 队列, 阻塞
        while (!isOnSyncQueue(node)) {
            // 已超时, 退出等待队列
            if (nanosTimeout <= 0L) {
                transferAfterCancelledWait(node);
                break;
            }
            // park 阻塞一定时间, spinForTimeoutThreshold 为 1000 ns
            if (nanosTimeout >= spinForTimeoutThreshold)
                LockSupport.parkNanos(this, nanosTimeout);
            // 如果被打断, 退出等待队列
            if ((interruptMode = checkInterruptWhileWaiting(node)) != 0)
                break;
            nanosTimeout = deadline - System.nanoTime();
        }
        // 退出等待队列后, 还需要获得 AQS 队列的锁
        if (acquireQueued(node, savedState) && interruptMode != THROW_IE)
            interruptMode = REINTERRUPT;
        // 所有已取消的 Node 从队列链表删除, 见 ㈡
        if (node.nextWaiter != null)
            unlinkCancelledWaiters();
        // 应用打断模式, 见 ㈤
        if (interruptMode != 0)
            reportInterruptAfterWait(interruptMode);
        return deadline - System.nanoTime();
    }
    // 等待 - 直到被唤醒或打断或超时, 逻辑类似于 awaitNanos
    public final boolean awaitUntil(Date deadline) throws InterruptedException {
        // ...
    }
    // 等待 - 直到被唤醒或打断或超时, 逻辑类似于 awaitNanos
    public final boolean await(long time, TimeUnit unit) throws InterruptedException {
        // ...
    }
    // 工具方法 省略 ...
}

```













