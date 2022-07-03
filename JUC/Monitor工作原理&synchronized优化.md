# Monitor工作原理&synchronized优化

详情见：<a href="https://www.bilibili.com/video/BV16J411h7Rd?p=85&spm_id_from=pageDriver">黑马JUC</a>

## 1. Java对象头

我们先来看一下对象头的组成（以32位虚拟机为例）：

普通对象：

```ruby
|----------------------------------------------------------------------|
|                       Object Header(64 bits)                         |
|--------------------------------|-------------------------------------| 
|      Mark Word(32 bits)        |              Klass Word(32 bits)    |
|--------------------------------|-------------------------------------| 
```

数组类型：

```ruby
|------------------------------------------------------------------------------------------|
|                       Object Header(96 bits)                                             |
|--------------------------------|----------------------------|----------------------------| 
|      Mark Word(32 bits)        |     Klass Word(32 bits)    |   array length(32 bits)    |
|--------------------------------|----------------------------|----------------------------| 
```

其中32位虚拟机Mark Word结构为

```ruby
|-------------------------------------------------------|--------------------|
|                 Mark Word (32 bits)                   |       State        |
|-------------------------------------------------------|--------------------|
| hashcode:25         | age:4 | biased_lock:0 | 01      |       Normal       |
|-------------------------------------------------------|--------------------|
| thread:23 | epoch:2 | age:4 | biased_lock:1 | 01      |       Biased       |
|-------------------------------------------------------|--------------------|
|             ptr_to_lock_record:30           | 00      | Lightweight Locked |
|-------------------------------------------------------|--------------------|
|             ptr_to_heavyweight_monitor:30   | 10      | Heavyweight Locked |
|-------------------------------------------------------|--------------------|
|                                             | 11      |    Marked for GC   |
|-------------------------------------------------------|--------------------|
```

64位虚拟机Mark Word结构为

```ruby
|--------------------------------------------------------------------|--------------------|
|                        Mark Word (64 bits)                         |       State        |
|--------------------------------------------------------------------|--------------------|
| unused:25 | hashcode:31 | unused:1 | age:4 | biased_lock:0 | 01    |       Normal       |
|--------------------------------------------------------------------|--------------------|
| thread:54 | epoch:2     | unused:1 | age:4 | biased_lock:1 | 01    |       Biased       |
|--------------------------------------------------------------------|--------------------|
|           ptr_to_lock_record:62                            | 00    | Lightweight Locked |
|--------------------------------------------------------------------|--------------------|
|           ptr_to_heavyweight_monitor:62                    | 10    | Heavyweight Locked |
|--------------------------------------------------------------------|--------------------|
|                                                            | 11    |    Marked for GC   |
|--------------------------------------------------------------------|--------------------|
```

**Object的对象头，分为两部分**:

第一部分是`Mark Word`，用来存储对象的运行时数据比如：hashcode，GC分代年龄，锁状态，持有锁信息，偏向锁的thread ID等等。

在64位的虚拟机中，Mark Word是64bits，如果是在32位的虚拟机中Mark Word是32bits

第二部分就是`Klass Word`，Klass Word是一个类型指针，指向class的元数据，JVM通过Klass Word来判断该对象是哪个class的实例。

我们可以看到对象头中的Mark Word根据状态的不同，存储的是不同的内容。

其中锁标记的值分别是：无锁=001，偏向锁=101，轻量级锁=000，重量级锁=010

## 2. Monitor(锁)

Monitor被翻译为`监视器`或`管程`，其实就是我们在使用synchronized时一直提的锁

每个Java对象都可以关联一个Monitor对象，如果使用synchronized给对象上锁（重量级）之后，该对象头的Mark Word中就被设置指向Monitor对象的指针

Monitor结构如下：

![image-20220504153413835](https://cdn.fengxianhub.top/resources-master/202205041534049.png)

Monitor属性含义：

- WaitSet：线程调用带时间Wait方法，存放被堵塞的线程
- EntryList：阻塞队列，用来存放没有争抢到锁的线程
- Owner：用来标记是哪个线程持有当前Monitor

Monitor调用步骤：

- 刚开始Monitor中Owner为null，即不被任何对象获取
- 当Thread-2执行synchronized(obj)就会将Monitor的所有者Owner置为Thread-2，Monitor中只能有一个`Owner`
- 在Thread-2上锁的过程中，如果Thread-3、Thread-4、Thread-5也来执行Synchronized(obj)，就会进入`EntryList`并 BLOCKED
- Thread-2执行完同步代码块的内容，然后唤醒`EntryList`中等待的线程来竞争锁，竞争是非公平的
- 图中WaitSet中的Thread-0、Thread-1是之前获得过锁，但条件不满足WAITING状态的线程，该条件在后面会详解

>注意：
>
>- synchronized必须是进入同一个对象的monitor才有上述的效果
>- 不加synchronized的对象不会关联监视器，不遵从以上规则

我们知道synchronized在调用的时候，不管是锁方法还是锁代码块，其实本质上都是锁住了一个对象，当这个对象上锁时，就会关联一个`Monitor`对象，Monitor是操作系统给我们提供的，我们在Java层面是看不到这个对象

此时我们加锁对象对象头中的`Mark Word`就指向这个`Monitor`对象

![image-20220504213359130](https://cdn.fengxianhub.top/resources-master/202205042133255.png)

此时对象头中`Mark Word`就会进行更改，锁标记位会由`无锁(01)`   -----> ` 重量级锁(10)`，而前面的比特位都会丢弃，变为62位的`ptr_to_heavyweight_monitor`指针，用来指向`Monitor`对象的地址

```java
|--------------------------------------------------------------------|--------------------|
|                        Mark Word (64 bits)                         |       State        |
|--------------------------------------------------------------------|--------------------|
| unused:25 | hashcode:31 | unused:1 | age:4 | biased_lock:0 | 01    |       Normal       |
|--------------------------------------------------------------------|--------------------|
| thread:54 | epoch:2     | unused:1 | age:4 | biased_lock:1 | 01    |       Biased       |
|--------------------------------------------------------------------|--------------------|
|           ptr_to_lock_record:62                            | 00    | Lightweight Locked |
|--------------------------------------------------------------------|--------------------|
|           ptr_to_heavyweight_monitor:62                    | 10    | Heavyweight Locked |
|--------------------------------------------------------------------|--------------------|
|                                                            | 11    |    Marked for GC   |
|--------------------------------------------------------------------|--------------------|
```

## 3. 从字节码层面分析Monitor

我们先来看一段使用synchronized加锁的代码：

```java
public class Monitor {
    static final Object lock = new Object();
    static int counter = 0;

    public static void main(String[] args) {
        synchronized (lock) {
            counter++;
        }
    }
}
```

对应字节码指令：

```java
public class com/fx/Synchronized/Monitor {

  // compiled from: Monitor.java

  // access flags 0x18
  final static Ljava/lang/Object; lock

  // access flags 0x8
  static I counter

  // access flags 0x1
  public <init>()V
   L0
    LINENUMBER 8 L0
    ALOAD 0
    INVOKESPECIAL java/lang/Object.<init> ()V
    RETURN
   L1
    LOCALVARIABLE this Lcom/fx/Synchronized/Monitor; L0 L1 0
    MAXSTACK = 1
    MAXLOCALS = 1

  // access flags 0x9
  public static main([Ljava/lang/String;)V
    TRYCATCHBLOCK L0 L1 L2 null
    TRYCATCHBLOCK L2 L3 L2 null
   L4
    LINENUMBER 13 L4
    GETSTATIC com/fx/Synchronized/Monitor.lock : Ljava/lang/Object;  //拿到锁，lock应用
    DUP                   //复制了一份
    ASTORE 1              //存储到临时变量 -> slot1中（为了解锁时使用）
    MONITORENTER          //进入同步块（临界区），将lock对象MarkWord置为Monitor指针
   L0
    LINENUMBER 14 L0
    GETSTATIC com/fx/Synchronized/Monitor.counter : I    // <- i
    ICONST_1                                             //  准备常量1
    IADD                                                 //  +1
    PUTSTATIC com/fx/Synchronized/Monitor.counter : I    // -> i
   L5
    LINENUMBER 15 L5
    ALOAD 1               //拿到复制的lock引用
    MONITOREXIT           //离开同步块，将lock对象MarkWord重置（恢复hashcode、age等），唤醒EntryList
   L1
    GOTO L6               //goto L6代码段，即来到第54行
   L2                     //异常处理开始
   FRAME FULL [[Ljava/lang/String; java/lang/Object] [java/lang/Throwable]
    ASTORE 2              // e -> slot 2
    ALOAD 1               // <- lock引用
    MONITOREXIT           // 将lock对象MarkWord重置，唤醒EntryList
   L3
    ALOAD 2               // <- slot 2 (e)
    ATHROW                // 将处理不了的异常抛出
   L6
    LINENUMBER 16 L6
   FRAME CHOP 1
    RETURN
   L7
    LOCALVARIABLE args [Ljava/lang/String; L4 L7 0
    MAXSTACK = 2
    MAXLOCALS = 3

  // access flags 0x8
  static <clinit>()V
   L0
    LINENUMBER 9 L0
    NEW java/lang/Object
    DUP
    INVOKESPECIAL java/lang/Object.<init> ()V
    PUTSTATIC com/fx/Synchronized/Monitor.lock : Ljava/lang/Object;
   L1
    LINENUMBER 10 L1
    ICONST_0
    PUTSTATIC com/fx/Synchronized/Monitor.counter : I
    RETURN
    MAXSTACK = 2
    MAXLOCALS = 0
}
```

## 4. synchronized——轻量级锁

轻量级锁的使用场景：如果一个对象虽然有多线程访问，但多线程访问的时间是错开的（也就是没有竞争），那么可以使用轻量级锁来优化

**轻量级锁对使用者是透明的，即语法仍然是synchronized**

假设有两个方法同步块，利用同一个对象加锁

```java
static final Object obj = new Object();
public static void method1(){
    synchronized(obj){
        //同步块A
        method2();
    }
}
public static void method2(){
    synchronized(obj){
        //同步块B
    }
}
```

>轻量级锁的上锁过程

1. 创建锁记录（Lock Record）对象，每个线程的栈帧都会包含一个锁记录的结构，内部可以存储锁定对象的Mark Word

![image-20220505164546254](https://cdn.fengxianhub.top/resources-master/202205051645453.png)

2. 让锁记录中Object reference 指向锁对象，并尝试用cas替换Object的Mark Word，将Mark Word的值存入锁记录

![image-20220505164847780](https://cdn.fengxianhub.top/resources-master/202205051650777.png)

3. 如果cas替换成功，对象头中存储了`锁记录地址和状态00`，表示由该线程给对象加锁，这时图示如下：

![image-20220505165246689](https://cdn.fengxianhub.top/resources-master/202205051652790.png)

4. 如果cas失败，有两种情况

- 如果是其他线程已经持有了该Object的轻量级锁，这是表明有竞争，进入锁膨胀过程
- 如果是自己执行了synchronized锁重入，那么再添加一条Lock Record作为重入的计数

![image-20220505165852342](https://cdn.fengxianhub.top/resources-master/202205051658438.png)

5. 当退出synchronized代码块（解锁时）如果有取值为null的锁记录，表示有重入，这时重置锁记录，表示重入计数减一

![image-20220505170139263](https://cdn.fengxianhub.top/resources-master/202205051701374.png)

6. 当退出synchronized代码块（解锁时）锁记录的值不为null，这时使用cas将Mark Word的值恢复给对象头

- 成功，即解锁成功
- 失败，说明轻量级锁进行了锁膨胀或已经升级为重量级锁，进入重量级锁解锁流程

## 5. synchronized——锁膨胀

如果在尝试加轻量级锁的过程中，cas操作无法成功，这是有一种情况就是其它线程已经为这个对象加上了轻量级锁，这是就要进行锁膨胀，将轻量级锁变成重量级锁。

1. 当 Thread-1 进行轻量级加锁时，Thread-0 已经对该对象加了轻量级锁

![image-20220505170855262](https://cdn.fengxianhub.top/resources-master/202205051709364.png)

2. 这时 Thread-1 加轻量级锁失败，进入锁膨胀流程

   - 即为对象申请Monitor锁，让Object指向重量级锁地址
   - 然后自己进入Monitor 的`EntryList` 变成BLOCKED状态

   ![image-20220505181558659](https://cdn.fengxianhub.top/resources-master/202205051815816.png)

3. 当Thread-0 退出`synchronized`同步块时，使用`cas`将Mark Word的值恢复给对象头；失败，那么会进入重量级锁的解锁过程，即按照Monitor的地址找到Monitor对象，将Owner设置为null，唤醒EntryList 中的Thread-1线程

## 6. synchronized——自旋优化

重量级锁竞争的时候，还可以使用自旋来进行优化，如果当前线程自旋成功（即在自旋的时候持锁的线程释放了锁），那么当前线程就可以不用进行上下文切换就获得了锁

**自旋重试成功的情况**：

![image-20220505184601013](https://cdn.fengxianhub.top/resources-master/202205051846143.png)

>可以看到，线程2在尝试获取锁失败后并没有立刻进入堵塞状态，而是进行自旋尝试重新获取锁，如果在自旋的过程中，线程1释放了锁，那么线程2就能成功获取锁，这样就避免了线程2进入堵塞态，因为堵塞态需要上下文切换，比较消耗资源

**自旋重试失败的情况**：

![image-20220505185104818](https://cdn.fengxianhub.top/resources-master/202205051851925.png)

>当多次自旋失败后，线程就会进入堵塞态，并进入`Monitor`的EntryList队列
>
>这里需要注意的是：
>
>- 在`Java6`之后自旋锁是自适应的，比如对象刚刚自旋成功过，那么认为这次自旋成功的可能性会高一些，就多自旋几次；反之，如果自旋失败次数过多，就减少自旋甚至不自旋； `自旋次数默认值：10次`，可以使用参数`-XX:PreBlockSpin`来自行更改
>- 自旋会占用CPU时间，单核CPU自旋没有意义，多核CPU自旋才能发挥优势
>- Java7之后不能控制是否开启自旋功能

## 7. synchronized——偏向锁

轻量级锁在没有竞争时（就自己这个线程），每次重入仍然需要执行CAS操作

`Java6`中引入了偏向锁来做进一步优化：只有第一次使用CAS将线程ID设置到对象的Mark Word头，之后**发现这个线程ID是自己的就表示没有竞争，不用重新CAS**。以后只要不发生竞争，这个对象就归该线程所有

例如：

```java
static final Object obj = new Object();
public static void m1(){
    synchronized(obj){
        //同步块A
        m2();
    }
}
public static void m2(){
    synchronized(obj){
        //同步块B
        m3();
    }
}
public static void m3(){
    synchronized(obj){
        //同步块C
    }
}
```

**轻量级锁加锁过程：**

![image-20220505202311000](https://cdn.fengxianhub.top/resources-master/202205052023224.png)

**偏向锁加锁过程：**![image-20220505202501723](https://cdn.fengxianhub.top/resources-master/202205052027446.png)

### 7.1 偏向状态

当锁由无锁变为偏向锁时，其对象头中的Mark World字段会发生变化：

![image-20220505202837086](https://cdn.fengxianhub.top/resources-master/202205052028201.png)

一个对象的创建过程

1. 如果开启了偏向锁（默认是开启的），那么对象刚创建之后，Mark Word 最后三位的值为`101`，并且这是它的Thread，epoch，age都是0，在加锁的时候进行设置这些的值.

2. 偏向锁默认是延迟的，不会在程序启动的时候立刻生效，如果想避免延迟，可以添加虚拟机参数来禁用延迟来禁用延迟

   ```java
   -XX:BiasedLockingStartupDelay=0
   ```

3. 注意：处于偏向锁的对象解锁后，线程 id 仍存储于对象头中


>我们可以测试一下看开启偏向锁后其Mark Word 最后三位的值会不会变为`101`
>
>详细分析过程请看：https://www.cnblogs.com/LemonFive/p/11246086.html

想看到对象的Mark World，我们需要借助下面的第三方Jar包

```xml
<dependency>
    <groupId>org.openjdk.jol</groupId>
    <artifactId>jol-core</artifactId>
    <version>0.2</version>
</dependency>	
```

测试代码：

```java
public class Biased {
    public static void main(String[] args) throws InterruptedException {
        Dog dog = new Dog();
        //true表示只打印2进制信息
        log.debug(ClassLayout.parseClass(dog.getClass()).toPrintable(true));
    }
    static class Dog{
    }
}	
```

输出结果：

![image-20220505222132364](https://cdn.fengxianhub.top/resources-master/202205052221620.png)

输出的第一行内容和锁状态内容对应

```java
unused:1 | age:4 | biased_lock:1 | lock:2

   0       0000       0       01   代表A对象正处于无锁状态
```

第三行中表示的是被指针压缩为32位的klass pointer

第四行则是我们创建的对象属性信息 4字节

第五行则代表了对象的对齐字段 为了凑齐64位的对象，对齐字段占用了4个字节，32bit

>接下来我们演示一段神奇的代码

```java
public class Biased {
    public static void main(String[] args) throws InterruptedException {
        Dog dog = new Dog();
        //true表示只打印2进制信息
        log.debug(ClassLayout.parseClass(dog.getClass()).toPrintable(true));
        //休眠五秒钟，将Dog对象由无锁状态改变成为偏向锁
        Thread.sleep(5000);
        log.debug(ClassLayout.parseClass(dog.getClass()).toPrintable(true));
    }
    static class Dog{
    }
}
```

输出结果：

![image-20220505225032619](https://cdn.fengxianhub.top/resources-master/202205052250861.png)

添加虚拟机参数消除延迟之后：

测试代码：

```java
// 添加虚拟机参数 -XX:BiasedLockingStartupDelay=0 
public static void main(String[] args) throws IOException {
    Dog d = new Dog();
    ClassLayout classLayout = ClassLayout.parseInstance(d);
    new Thread(() -> {
        log.debug("synchronized 前");
        System.out.println(classLayout.toPrintableSimple(true));
        synchronized (d) {
            log.debug("synchronized 中");
            System.out.println(classLayout.toPrintableSimple(true));
        }
        log.debug("synchronized 后");
        System.out.println(classLayout.toPrintableSimple(true));
    }, "t1").start();
}
```

打印结果：

```java
11:08:58.117 c.TestBiased [t1] - synchronized 前
00000000 00000000 00000000 00000000 00000000 00000000 00000000 00000101 
11:08:58.121 c.TestBiased [t1] - synchronized 中
00000000 00000000 00000000 00000000 00011111 11101011 11010000 00000101 
11:08:58.121 c.TestBiased [t1] - synchronized 后
00000000 00000000 00000000 00000000 00011111 11101011 11010000 00000101
```

 >注意 处于偏向锁的对象解锁后，线程 id 仍存储于对象头中

**测试禁用**

在上面测试代码运行时在添加 VM 参数` -XX:-UseBiasedLocking` 禁用偏向锁

输出：

```java
11:13:10.018 c.TestBiased [t1] - synchronized 前
00000000 00000000 00000000 00000000 00000000 00000000 00000000 00000001 
11:13:10.021 c.TestBiased [t1] - synchronized 中
00000000 00000000 00000000 00000000 00100000 00010100 11110011 10001000 
11:13:10.021 c.TestBiased [t1] - synchronized 后
00000000 00000000 00000000 00000000 00000000 00000000 00000000 00000001
```

 **测试 hashCode**

- 正常状态对象一开始是没有 hashCode 的，第一次调用才生成

### 7.2 撤销 - 调用对象 hashCode

调用了对象的 hashCode，但偏向锁的对象 MarkWord 中存储的是线程 id，**如果调用 hashCode 会导致偏向锁被撤销** 

- 轻量级锁会在锁记录中记录 hashCode 
- 重量级锁会在 Monitor 中记录 hashCode

在调用 hashCode 后使用偏向锁，记得去掉 -XX:-UseBiasedLocking

输出：

```java
11:22:10.386 c.TestBiased [main] - 调用 hashCode:1778535015 
11:22:10.391 c.TestBiased [t1] - synchronized 前
00000000 00000000 00000000 01101010 00000010 01001010 01100111 00000001 
11:22:10.393 c.TestBiased [t1] - synchronized 中
00000000 00000000 00000000 00000000 00100000 11000011 11110011 01101000 
11:22:10.393 c.TestBiased [t1] - synchronized 后
00000000 00000000 00000000 01101010 00000010 01001010 01100111 00000001
```

### 7.3 撤销 - 其它线程使用对象

当有其它线程使用偏向锁对象时，会将偏向锁升级为轻量级锁

### 7.4 撤销 - 调用 wait/notify

当调用wait/notify时会撤销偏向锁，并膨胀为重量级锁

### 7.5 批量重偏向

如果对象虽然被多个线程访问，但没有竞争，这时偏向了线程 T1 的对象仍有机会重新偏向 T2，重偏向会重置对象 的 Thread ID 

当撤销偏向锁阈值超过 `20` 次后，jvm 会这样觉得，我是不是偏向错了呢，于是会在给这些对象加锁时重新偏向至 加锁线程

### 7.6 批量撤销

当撤销偏向锁阈值超过 `40` 次后，jvm 会这样觉得，自己确实偏向错了，根本就不该偏向。于是整个类的所有对象 都会变为不可偏向的，新建的对象也是不可偏向的

>参考资料 
>
>- https://github.com/farmerjohngit/myblog/issues/12 
>- https://www.cnblogs.com/LemonFive/p/11246086.html 
>- https://www.cnblogs.com/LemonFive/p/11248248.html 
>- <a href="https://www.oracle.com/technetwork/java/biasedlocking-oopsla2006-wp-149958.pdf">Oracle偏向锁论文</a>

## 8. synchronized——锁消除

这里执行需要将项目打成一个jar包

锁消除前：

java -jar benchmarks.jar

```java
Benchmark Mode Samples Score Score error Units 
c.i.MyBenchmark.a avgt 5 1.542 0.056 ns/op 
c.i.MyBenchmark.b avgt 5 1.518 0.091 ns/op
```

锁消除后：

java -XX:-EliminateLocks -jar benchmarks.jar

```java
Benchmark Mode Samples Score Score error Units 
c.i.MyBenchmark.a avgt 5 1.507 0.108 ns/op 
c.i.MyBenchmark.b avgt 5 16.976 1.572 ns/op
```

## 9. synchronized——锁粗化

 对相同对象多次加锁，导致线程发生多次重入，可以使用锁粗化方式来优化，这不同于之前讲的细分锁的粒度

## 10. 总结

综上，我们发现偏向锁，轻量级锁（又称自旋锁或无锁），重量级锁都是synchronized锁锁实现中锁经历的几种不同的状态。
三种锁状态的场景总结：

只有一个线程进入临界区 -------偏向锁
多个线程交替进入临界区--------轻量级锁
多个线程同时进入临界区-------重量级锁





