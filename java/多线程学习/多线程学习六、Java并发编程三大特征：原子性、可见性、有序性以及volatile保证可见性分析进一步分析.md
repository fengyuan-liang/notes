# 多线程学习六、Java并发编程三大特征：原子性、可见性、有序性以及volatile保证可见性分析进一步分析

>🚩**Java并发编程三大特征：**
>
>- 操作的<code>原子性</code>
>
>- 操作结果的<code>可见性</code>
>- 指令的<code>有序性</code>

## 1. 操作的原子性

**定义：**

原子性：是指一个操作或多个操作要么全部执行，且执行的过程不会被任何因素打断，要么就都不执行。

**解释：**

这个很好理解，类比数据库里面的原子性。举个例子，你给别人付钱，那么你的账户减少钱，别人的账户增加钱，这就是一个<code>原子操作</code>，要么都成功要么都不成功，不能你的账户金额减少但是别人的账户金额却不增加。

**如何实现操作的<code>原子性</code>？**

我们上文中已经知道了在操作系统层面其实已经有很多的措施来保证原子性了，例如通过加<code>缓存锁的方式</code>。<code>JMM</code>对基本类型多线程操作有以下特点：

- int等<code>不大于32位的基本类型</code>的操作都是具有原子性，对于long和double变量，把它们作为2个原子性的32位值来对待，而不是一个原子性的64位值， 这样将一个long型的值保存到内存的时候，可能是2次32位的写操作， 2个竞争线程想写不同的值到内存的时候，可能导致内存中的值是不正确的结果，所以对<code>long和double</code>的操作不是原子性的
- 在Java并发编程里面只有简单的<code>读取</code>、<code>赋值</code>（而且必须是将数字赋值给某个变量，变量之间的相互赋值不是原子操作）才是原子操作。

其实也很好理解，结合上文讲的<code>JMM</code>和现代操作系统的解决多处理器带来并发问题知识，我们就可以知道线程读写都会通过缓存从主内存中读写，线程数一上来就不能保证<code>缓存的一致性</code>

我们来看下面几个栗子：

```java
i =666；//原子性, 线程执行这个语句时，直接将数值666写入到工作内存中
```

```java
i = j;
```

🚩看起来也是原子性的，但是它实际上涉及两个操作，先去读j的值，再把j的值写入工作内存，两个操作分开都是原子操作，但是合起来就不满足原子性了

```java
i = i+1;//非原子性
```

```java
i++;//非原子性
```



## 2. 操作结果的<code>可见性</code>

**定义：**

当一个线程修改了共享变量的值时，其他线程能够立即得知这个修改

**解释：**

- <code>JMM</code>通过在变量修改后将新值同步回主内存，在变量读取前从主内存刷新变量值这种依赖主内存作为传递媒介的方式来实现可见性的，无论是普通变量还是volatile变量都是如此
- <code>volatile变量</code>，保证新值能立即同步回主内存，以及每次使用前立即从主内存刷新，所以我们说volatile保证了多线程操作变量的可见性
- synchronized和Lock也能够保证可见性，<code>线程在释放锁之前，会把共享变量值都刷回主存</code>。final也可以实现可见性（因为final值本身就不能变）



## 3. 指令的<code>有序性</code>

**指令的有序性在JMM中的定义:**  

如果在本线程内观察，所有的操作都是有序的（ as-if-serial )；如果在一个线程中，观察另一个线程，所有的操作都是无序的. 

**解释：**

- 前半句意思就是as-if-serial的语义，即不管怎么重排序（编译器和处理器为了提高并行度），（单线程）程序的执行结果不会被改变
- 后半句的意思即  允许编译器和处理器对指令进行重排序, 会影响到多线程并发执行的正确性

**两个栗子：**

第一个栗子🌰：

```java
double pi  = 3.14;    //A
double r   = 1.0;     //B
double area = pi * r * r; //C
```

执行过程: 步骤C依赖于步骤A和B，因为指令重排的存在，程序执行顺讯可能是A->B->C,也可能是B->A->C,但是C不能在A或者B前面执行，这将违反as-if-serial语义

![image-20220129225322889](https://cdn.fengxianhub.top/resources-master/202201292325264.png)

第二个栗子🌰：

```java
bool flag = false;
int b = 0;

public void read() {
   b = 1;              //1
   flag = true;        //2
}

public void add() {
   if (flag) {         //3
       int sum =b+b;   //4
       System.out.println("bb sum is"+sum); 
   } 
}
```

**假设程序先执行read方法，再执行add方法，结果一定是输出sum=2嘛？**

- 单线程，没有问题，  sum=2

- 多线程情况下不一定

  在多线程下，如果线程t1对步骤1和2进行了指令重排序呢？结果sum就不是2了，而是0

  我们假设系统对1和2进行了指令重排序，把2放到了1的前面，然后现在有两个线程同时执行read和add方法，当线程t1执行到<code>flag = true</code>时，b还没来得及赋值线程t2就已经往下执行了，这时候3和4执行结果就会为0

  ![image-20220129230651955](https://cdn.fengxianhub.top/resources-master/202201292306108.png)

**重排序类型和重排序执行过程**：

![image-20220129231309091](https://cdn.fengxianhub.top/resources-master/202201292325361.png)

>可以给变量加上volatile关键字，来保证有序性。当然，也可以通过synchronized和Lock来保证有序性。synchronized和Lock保证某一时刻是只有一个线程执行同步代码，相当于是让线程顺序执行程序代码了，自然就保证了有序性

除此之外，Java语言中有一个<code>先行发生原则</code>( happens-before ) 来保证<code>JMM</code>的有序性。 (  不加这些关键的情况下，默认情况 jvm规范是如何保证编译指令顺序  ） ,   这个原则是定义在了 <code>JSR 133</code>规范中。 

```css
程序次序规则：在一个线程内，按照控制流顺序，书写在前面的操作先行发生于书写在后面的操作
管程锁定规则：一个unLock操作先行发生于后面对同一个锁的lock操作（）
volatile变量规则：对一个volatile变量的写操作先行发生于后面对这个变量的读操作
线程启动规则：Thread对象的start()方法先行发生于此线程的每个一个动作
线程终止规则：线程中所有的操作都先行发生于线程的终止检测，我们可以通过Thread.join()方法结束、Thread.isAlive()的返回值手段检测到线程已经终止执行
线程中断规则：对线程interrupt()方法的调用先行发生于被中断线程的代码检测到中断事件的发生
对象终结规则：一个对象的初始化完成先行发生于他的finalize()方法的开始
传递性：如果操作A先行发生于操作B，而操作B又先行发生于操作C，则可以得出操作A先行发生于操作C
```

**使用volatile修改上面的例子并分析**：

```java
volatile bool flag = false;
int b = 0;

public void read() {
   b = 1;              //1
   flag = true;        //2
}

public void add() {
   if (flag) {         //3
       int sum =b+b;   //4
       System.out.println("bb sum is"+sum); 
   } 
}
```

>按<code> happens-before原则</code>分析: 
>	1.  flag加上volatile关键字，那就禁止了指令重排，也就是1 happens-before 2了
>	2.  根据volatile变量规则( <code>volatile变量的写先于读</code>)，2 happens-before 3
>	3.  由<code>程序次序规则</code>，得出 3 happens-before 4
>	4.  由传递性，1 -> 2  -> 3  -> 4   ,   得出1 happens-before 4，因此妥妥的输出sum=2



## 4. volatile保证可见性分析



看到这里我们重新来分析一下上一节中提到的<code>volatile</code>是如何保证指令的<code>可见性</code>的（代码还是上面的那个栗子🌰）

>假设flag变量的初始值false，现在有两条线程t1和t2要访问它

![image-20220129234801131](https://cdn.fengxianhub.top/resources-master/202201292350306.png)

>如果线程t1执行以下代码语句，并且flag没有volatile修饰的话；t1刚修改完flag的值，还没来得及刷新到主内存，t2又跑过来读取了，很容易就数据flag不一致了

![image-20220129235435829](https://cdn.fengxianhub.top/resources-master/202201292354893.png)

>如果flag变量是由volatile修饰的话，就不一样了，如果线程t1修改了flag值，volatile能保证修饰的flag变量后，<code>可以立即同步回主内存</code>

![image-20220129235505521](https://cdn.fengxianhub.top/resources-master/202201292355590.png)

>volatile还有一个保证，就是每次使用前立即先从主内存<code>刷新最新的值</code>，线程t1修改完后，线程t2的变量副本会过期了

![image-20220129235600124](https://cdn.fengxianhub.top/resources-master/202201292356185.png)

>实际上volatile保证可见性和禁止指令重排都跟内存屏障有关，我们编译volatile相关代码看看, 下面以一个<code>DCl单例模式</code>为例来反编译代码学习内存屏障的相关知识，DCL单例模式（Double Check Lock，双重检查锁）比较常用，它是需要volatile修饰的

```java
public class Singleton {
    private volatile static Singleton instance;

    private Singleton() {
    }

    public static Singleton getInstance() {
        if (instance == null) {
            synchronized (Singleton.class) {
                if (instance == null) {
                    instance = new Singleton();
                }
            }
        }
        return instance;
    }
} 
```

>我们反汇编一下这段代码的字节码文件

```java
0x01a3de0f: mov    $0x3375cdb0,%esi   ;...beb0cd75 33  
                                        ;   {oop('Singleton')}  
0x01a3de14: mov    %eax,0x150(%esi)   ;...89865001 0000  
0x01a3de1a: shr    $0x9,%esi          ;...c1ee09  
0x01a3de1d: movb   $0x0,0x1104800(%esi)  ;...c6860048 100100  
0x01a3de24: lock addl $0x0,(%esp)     ;...f0830424 00  
                                        ;*putstatic instance  
                                        ; - 
Singleton::getInstance@24
```

编译这段代码后，观察有volatile关键字和没有volatile关键字时的instance所生成的汇编代码发现，有volatile关键字修饰时，会多出一个<code>lock addl $0x0,(%esp)</code>，即多出一个<code>lock前缀指令</code>

>lock指令相当于一个<code>内存屏障</code>，它保证以下这几点：
>
>- 重排序时不能把后面的指令重排序到内存屏障之前的位置
>- 将本处理器的缓存写入内存 
>- 如果是写入动作，会导致其他处理器中对应的缓存无效。
>
>小结:  <code>第2、3点不就是volatile保证可见性的体现嘛，第1点就是禁止指令重排列的体现</code>

**内存屏障：**

在JMM中内存屏障分为四种，它们是：

![image-20220130000521822](https://cdn.fengxianhub.top/resources-master/202201300005881.png)

>为了实现volatile的内存语义，Java内存模型采取以下的保守策略
>
>- 在每个volatile写操作的前面插入一个<code>StoreStore</code>屏障
>- 在每个volatile写操作的后面插入一个<code>StoreLoad</code>屏障
>- 在每个volatile读操作的前面插入一个<code>LoadLoad</code>屏障
>- 在每个volatile读操作的后面插入一个<code>LoadStore</code>屏障

上述第二个栗子🌰中加了volatile关键字后：

![image-20220130000827689](https://cdn.fengxianhub.top/resources-master/202201300008753.png)

内存屏障保证前面的指令先执行，所以这就保证了禁止了指令重排啦，同时内存屏障保证缓存写入内存和其他处理器缓存失效，这也就保证了可见性



**经典面试题**

```java
1. 谈谈volatile的特性
```

保证变量对所有线程的可见性 ，禁止指令重排，不保证原子性

	2. volatile的内存语义
  - 当写一个 volatile 变量时，JMM 会把该线程对应的本地内存中的共享变量值刷新到主内存  ( 强制刷新)
  - 当读一个 volatile 变量时，JMM 会把该线程对应的本地内存置为无效。线程接下来将从主内存中读取共享变量  (强制过期)

```java
3. 并发编程的3大特性
```

- 原子性
- 可见性
- 有序性

```java
4. 什么是内存可见性，什么是指令重排序？
```

可见性就是指当一个线程修改了共享变量的值时，其他线程能够立即得知这个修改
指令重排是指JVM在编译Java代码的时候，或者CPU在执行JVM字节码的时候，对现有的指令顺序进行重新排序, 这种指令重新遵循一些规则   happens-before

```java
5. volatile是如何解决java并发中可见性的问题
```

底层是通过内存屏障实现的哦，volatile能保证修饰的变量后，可以立即同步回主内存，每次使用前立即先从主内存刷新最新的值

```java
6. volatile如何防止指令重排？
```

  - 内存屏障

  - Java内存的保守策略 

    ```java
    在每个volatile写操作的前面插入一个StoreStore屏障。 
    在每个volatile写操作的后面插入一个StoreLoad屏障。 
    在每个volatile读操作的前面插入一个LoadLoad屏障。 
    在每个volatile读操作的后面插入一个LoadStore屏障。 volatile保证在重排序时不能把内存屏障后面的指令重排序到内存屏障之前的位置
    ```

  - volatile保证在重排序时不能把内存屏障后面的指令重排序到内存屏障之前的位置

```java
7. volatile可以解决原子性嘛？为什么
```

  不可以，可以直接举i++ 

  解决措施：

  ```java
  粗粒度:   原子性需要synchronzied或者lock保证
  	synchronzied:  虚拟机级别 , 重 
  	lock:java语言级别的锁, 轻
  		java.util.concurrent.ReentrantLock
  原子类对象
  	AtomicInteger.....
  		轻量级(无锁编程) ：  CompareAndSet
  ```

	8. volatile底层的实现机制，volatile如何保证可见性和禁止指令重排？

  需要解释内存屏障，内存屏障 ( Load 代表读取指令，Store代表写入指令 )，然后就是四大类、为了实现volatile的内存语义，Java内存模型采取的那些保守策略，在上面有

	9. volatile和synchronized, threadlocal 的区别？

- volatile修饰的是变量，synchronized一般修饰代码块或者方法, Class对象
- volatile保证可见性、禁止指令重排，但是不保证原子性；synchronized都可以
- volatile不会造成线程阻塞，synchronized可能会造成线程的阻塞，所以后面才有锁优化和无锁编程

  