# JVM常见面试题

## 常见面试题一

> **jdk、jre、jvm的关系**

jdk是java开发工具包，包括了jre和jvm；jre是java运行时环境，为java程序运行的最小单元；jvm是java字节码运行的环境

> **未来jdk发展的新技术有哪些**

`Graal VM虚拟机`，号称`Run Programs Faster Anywhere`，是一款跨语言全栈虚拟机。如果有虚拟机能够取代`HotSpot`成为新的武林盟主，那么一定是`Graal VM`，并且虚拟机的切换对使用者是完全兼容的

`Substrate VM`，Substrate VM的出现，算是满足了人们心中对Java提前编译的全部期待，运行在Substrate VM上的小规模应用， 其内存占用和启动时间与运行在HotSpot上相比有**5倍到50倍**的下降

> **jvm的种类，我们常用的是哪一种，特点为**

不同的厂商，有不同的JVM的实现。我们采用的是`HotSpot`，名称中的HotSpot指的就是它的**热点代码探测技术**

- 通过计数器找到最具编译价值代码，触发即时编译或栈上替换
- 通过编译器与解释器协同工作，在最优化的程序响应时间与最佳执行性能中取得平衡

> **为什么叫java虚拟机，它和vmware的区别**

**虚拟机**

所谓虚拟机（Virtual Machine），就是一台虚拟的计算机。它是一款软件，用来执行一系列虚拟计算机指令。大体上，虚拟机可以分为系统虚拟机和程序虚拟机。

- 大名鼎鼎的Visual Box，VMware就属于系统虚拟机，它们完全是对物理计算机的仿真，提供了一个可运行完整操作系统的软件平台
- 程序虚拟机的典型代表就是Java虚拟机，它专门为执行单个计算机程序而设计，在Java虚拟机中执行的指令我们称为Java字节码指令

无论是系统虚拟机还是程序虚拟机，在上面运行的软件都被限制于虚拟机提供的资源中。

**Java虚拟机**

Java虚拟机是一台执行Java字节码的虚拟计算机，它拥有独立的运行机制，其运行的Java字节码也未必由Java语言编译而成。

JVM平台的各种语言可以共享Java虚拟机带来的跨平台性、优秀的垃圾回器，以及可靠的即时编译器。

Java技术的核心就是Java虚拟机（JVM，Java Virtual Machine），因为所有的Java程序都运行在Java虚拟机内部。

Java虚拟机就是二进制字节码的运行环境，负责装载字节码到其内部，解释/编译为对应平台上的机器指令执行。每一条Java指令，Java虚拟机规范中都有详细定义，如怎么取操作数，怎么处理操作数，处理结果放在哪里。

特点：

- 一次编译，到处运行
- 自动内存管理
- 自动垃圾回收功能

> **java虚拟机的整体架构**

主要包括三个部分：

- 类加载子系统
- 运行时数据区
- 执行引擎

![image-20220531143854437](https://cdn.fengxianhub.top/resources-master/202205311438599.png)

> **字节码的加载流程**

加载、链接、初始化

https://blog.fengxianhub.top/#/JVM/5-%E7%B1%BB%E5%8A%A0%E8%BD%BD%E8%BF%87%E7%A8%8B%E5%92%8C%E7%BC%96%E8%AF%91%E5%99%A8%E4%BC%98%E5%8C%96

> **java的编译器输入的指令流是一种基于栈的指令集架构，它有什么优点**

Java编译器输入的指令流基本上是一种基于栈的指令集架构，另外一种指令集架构则是基于寄存器的指令集架构。具体来说：这两种架构之间的区别：

**基于栈式架构的特点**

- 设计和实现更简单，适用于资源受限的系统；
- 避开了寄存器的分配难题：使用零地址指令方式分配。
- 指令流中的指令大部分是零地址指令，其执行过程依赖于操作栈。指令集更小，编译器容易实现。
- 不需要硬件支持，可移植性更好，更好实现跨平台

**基于寄存器架构的特点**

- 典型的应用是x86的二进制指令集：比如传统的PC以及Android的Davlik虚拟机。
- 指令集架构则完全依赖硬件，可移植性差
- 性能优秀和执行更高效
- 花费更少的指令去完成一项操作。
- 在大部分情况下，基于寄存器架构的指令集往往都以一地址指令、二地址指令和三地址指令为主，而基于栈式架构的指令集却是以零地址指令为主方水洋

**栈的特点**：

- 跨平台性
- 指令集小
- 指令多
- 执行性能比寄存器差

> **jvm可以编译其他语言的字节码吗**

可以，凡是能够编译成字节码文件的语言都可以使用JVM

> **java虚拟机规范有哪些？**

试想？如果我们要自己开发一个JVM，要如何开发，我们应该要遵循JVM开发规范

> **jvm在什么情况下会加载一个类?**

在JVM中所有的类都是懒加载的，初试、链接、初始化，在类加载的最后一个阶段会执行`<cinit>()V 方法`

初始化即调用`<cinit>()V 方法` ，虚拟机会保证这个类的『构造方法』的线程安全

**发生的时机**

- 概括得说，类初始化是【懒惰的】
- main 方法所在的类，总会被首先初始化 
- 首次访问这个类的静态变量或静态方法时 
- 子类初始化，如果父类还没初始化，会引发 
- 子类访问父类的静态变量，只会触发父类的初始化 
- Class.forName 
- new 会导致初始化

不会导致类初始化的情况

- 访问类的 static final 静态常量（基本类型和字符串）不会触发初始化 (在类链接的准备阶段就完成)
- 类对象.class 不会触发初始化 
- 创建该类的数组不会触发初始化 
- 类加载器的 loadClass 方法 
- Class.forName 的参数 2 为 false 时

> **类加载到jvm中的过程 ? 每个阶段的工作 ?**

加载链接初始化

https://blog.fengxianhub.top/#/JVM/5-%E7%B1%BB%E5%8A%A0%E8%BD%BD%E8%BF%87%E7%A8%8B%E5%92%8C%E7%BC%96%E8%AF%91%E5%99%A8%E4%BC%98%E5%8C%96

> **jvm中的类加载器的类型及它加载的目标路径?如何自定义一个类加载器加载一个指定目录下的class文件?**

以 JDK 8 为例：

| 名称                      | 加载哪的类                 | 说明                     |
| ----------------------- | --------------------- | ---------------------- |
| Bootstrap ClassLoader   | JAVA_HOME/jre/lib     | 无法直接访问                 |
| Extension ClassLoader   | JAVA_HOME/jre/lib/ext | 上级为 Bootstrap，显示为 null |
| Application ClassLoader | classpath             | 上级为 Extension          |
| 自定义类加载器                 | 自定义                   | 上级为 Application        |

> **什么是双亲委派模型，有什么作用 ?**

所谓的双亲委派，就是指调用类加载器的 loadClass 方法时，查找类的规则

注意：这里的双亲，翻译为上级似乎更为合适，因为它们并没有继承关系

```java
protected Class<?> loadClass(String name, boolean resolve)
    throws ClassNotFoundException {
    synchronized (getClassLoadingLock(name)) {
        // 1. 检查该类是否已经加载
        Class<?> c = findLoadedClass(name);
        if (c == null) {
            long t0 = System.nanoTime();
            try {
                if (parent != null) {
                    // 2. 有上级的话，委派上级 loadClass
                    c = parent.loadClass(name, false);
                } else {
                    // 3. 如果没有上级了（ExtClassLoader），则委派
                    BootstrapClassLoader
                        c = findBootstrapClassOrNull(name);
                }
            } catch (ClassNotFoundException e) {
            }
            if (c == null) {
                long t1 = System.nanoTime();
                // 4. 每一层找不到，调用 findClass 方法（每个类加载器自己扩展）来加载
                c = findClass(name);
                // 5. 记录耗时
                sun.misc.PerfCounter.getParentDelegationTime().addTime(t1 - t0);
                sun.misc.PerfCounter.getFindClassTime().addElapsedTimeFrom(t1);
                sun.misc.PerfCounter.getFindClasses().increment();
            }
        }
        if (resolve) {
            resolveClass(c);
        }
        return c;
    }
}
```

> **类加载器是如何确定一个类在jvm中的唯一性的? 两个类来源于同一个Class文件，被同一个虚拟机加载，这两个类一定相等吗?**

通过魔术字来确定是不是class文件。被同一个JVM加载两个类不一定相等，在JVM规范中是这样定义的，两个类及其类加载器相同才能说这两个类相同

**沙箱隔离，隔离多个用户的类文件，防止产生干扰**

```java
ClassFile { // u4表示字节数
    u4 magic; // 魔术字
    u2 minor_version; // 小版本号
    u2 major_version; // 主版本号
    u2 constant_pool_count; // 常量池信息
    cp_info constant_pool[constant_pool_count-1];
    u2 access_flags; // 类的访问权限
    u2 this_class; // 类名信息
    u2 super_class; // 父类信息
    u2 interfaces_count; // 接口数量
    u2 interfaces[interfaces_count]; // 接口信息
    u2 fields_count; // 属性数量
    field_info fields[fields_count];  // 属性信息
    u2 methods_count; // 方法数量
    method_info methods[methods_count]; // 方法信息
    u2 attributes_count; // 属性信息
    attribute_info attributes[attributes_count];
}
```

0~3 字节，表示它是否是【class】类型的文件

0000000 ***ca fe ba be*** 00 00 00 34 00 23 0a 00 06 00 15 09

> **Tomcat的类加载器有哪些?**

Tomcat的[类加载](https://so.csdn.net/so/search?q=类加载&spm=1001.2101.3001.7020)器在Java的类加载器上 新增了5个类加载器，3个基础类，一个web应用类加载器 + 一个jsp加载器

- commonClassLoader    
- CatalinaClassLoader   
- shareClassLoader   
- webappClassLoader   
- JspClassLoader

> **Tomcat为什么打破了双亲委派机制**

1. 部署在用一个Tomcat上的两个web应用所使用的类库要相互隔离

2. 部署在同一个Tomcat上的两个web应用所使用的java类库要相互共享

3. 保证Tomcat服务器自身的安全不受部署的web应用程序影响

4. 需要支持jsp页面的热部署和热加载

> **双亲委派模型最大问题是什么**

底层的类加载器无法加载底层的类, 比如如下情况:
`javax.xml.parsers`包中定义了xml解析的类接口, Service Provider Interface SPI 位于rt.jar 
即接口在启动ClassLoader中,  而SPI的实现类，通常是由用户实现的， 由AppLoader加载。 

以下是`javax.xmlparsers.FactoryFinder`中的解决代码:  

```java
static private Class getProviderClass(String className, ClassLoader cl,
 boolean doFallback, boolean useBSClsLoader) throws ClassNotFoundException
{
  try {
 if (cl == null) {
   if (useBSClsLoader) {
     return Class.forName(className, true, FactoryFinder.class.getClassLoader());
   } else {
     cl = ss.getContextClassLoader();      //获取上下文加载器
     if (cl == null) {
       throw new ClassNotFoundException();
     }
     else {
       return cl.loadClass(className);   //使用上下文ClassLoader
     }
   }
 }
 else {
   return cl.loadClass(className);
 }
  }
  catch (ClassNotFoundException e1) {
 if (doFallback) {
   // Use current class loader - should always be bootstrap CL
   return Class.forName(className, true, FactoryFinder.class.getClassLoader());
 }
   // https://blog.csdn.net/syh121/article/details/120274044
  ClassLoader cl = Thread.currentThread().getContextClassLoader();
  return ServiceLoader.load(service, cl);
```

> 双亲委派模式是默认的模式，但并非必须. 还有以下几个例 子，它实际上是破坏了双亲委派模式的. 
> 
> a. Tomcat的WebappClassLoader 就会先加载自己的Class，找不到再委托parent
> b. OSGi的ClassLoader形成网状结构，根据需要自由加载Class

> 请完成一个热替换的例子，并解释什么是热替换?

> `<clinit>()` 是类构造器方法,它与类的构造方法有什么区别?

对于一个类，编译器会按从上至下的顺序，收集所有 static 静态代码块和静态成员赋值的代码，合并为一个特殊的方法`<cinit>()V`

```java
public class Demo {
    static int i = 10;
    static {
        i = 20;
    }
    static {
        i = 30;
    }
}
```

```java
0: bipush 10
2: putstatic #2 // Field i:I
5: bipush 20
7: putstatic #2 // Field i:I
10: bipush 30
12: putstatic #2 // Field i:I
15: return
```

**编译器会按从上至下的顺序，收集所有 {} 代码块和成员变量赋值的代码，形成新的构造方法，但原始构造方法内的代码总是在最后！**

## 常见面试题二

> jvm运行时数据区的划分?

![image-20220531143854437](https://cdn.fengxianhub.top/resources-master/202205311438599.png)

> 根据jvm规范，这些数据区中哪些会出现内存溢出异常，分别是什么场景下出现?

只是程序计数器是不会存在内存溢出（java中唯一不用考虑内存溢出的地方）

- 栈空间：java.lang.StackOverflowError
  
  以下情况可能会导致栈内存溢出：
  
  - 栈帧过多导致栈内存溢出（例如不合理的递归调用）
  - 栈帧过大导致栈帧溢出
  - 类的循环引用导致内存溢出

- 堆内存溢出：java.lang.OutOfMemoryError: Java heap space
  
  堆空间申请过多

> 这些数据区哪些是线程独有的，哪些是线程共享区?

![image-20220531144228815](https://cdn.fengxianhub.top/resources-master/202205311442898.png)

> 每个区存储的数据的特点?

> 程序计数器是什么，它是线程独有的吗? 它是否有内存溢出问题.

在java中使用CPU寄存器作为程序计数器

作用：是记住下一条JVM指令的执行地址

特点：

1. 是线程私有的，每个线程都有自己的程序计数器，用来记录程序运行到了那个位置
2. 不会存在内存溢出（java中唯一不用考虑内存溢出的地方）

> 虚拟机栈上保存哪些数据?怎么放?虚拟机栈是线程独有的吗，它是否有内存溢出问题?虚拟机栈的优点?

Java Virtual Machine Stacks（Java虚拟机栈）

- 每个线程运行时所需要的内存，称为虚拟机栈
- 每个栈由多个栈帧（Frame）组成，对应着每次方法调用时所占用的内存
- 每个线程只能有一个活动栈帧，对应着当前正在执行的那个方法
- 活动栈帧就是栈顶的栈帧

虚拟机栈式线程独有的，存在内存溢出的问题

**基于栈式架构的特点**

- 设计和实现更简单，适用于资源受限的系统；
- 避开了寄存器的分配难题：使用零地址指令方式分配。
- 指令流中的指令大部分是零地址指令，其执行过程依赖于操作栈。指令集更小，编译器容易实现。
- 不需要硬件支持，可移植性更好，更好实现跨平台

> 虚拟机栈的大小是否可动?是否会有异常出现?

> 如何设置虚拟机栈大小?

我可以通过JVM指令来分配栈空间，如果不指定会默认分配。<a href="https://docs.oracle.com/en/java/javase/11/tools/java.html#GUID-3B1CE181-CD30-4178-9602-230B800D4FAE">Java官方文档</a>

![image-20220531151856031](https://cdn.fengxianhub.top/resources-master/202205311518196.png)

> 什么叫本地方法? 是否可以写一个例子来实现本地方法，以输出一个hello world?

> 什么叫本地方法栈?有什么作用?

> jvm规范一定强制要求实现本地方法栈吗?

> jvm规范一定强制要求实现本地方法栈吗

> 方法区是线程独有的吗?它是否有异常?它的作用?

不是，是线程共享的

1.8 以前会导致永久代（PermGen）内存溢出

```css
 演示永久代内存溢出 java.lang.OutOfMemoryError: PermGen space
 -XX:MaxPermSize=8m
```

1.8 之后会导致元空间内存溢出

```css
 演示元空间内存溢出 java.lang.OutOfMemoryError: Metaspace
 -XX:MaxMetaspaceSize=8m
```

> 方法区的演进, jdk7及以前，它叫什么? jdk8开始，这又叫什么

> 方法区或永久代的大小如何设置?

1.8 以前会导致永久代（PermGen）内存溢出

```css
 演示永久代内存溢出 java.lang.OutOfMemoryError: PermGen space
 -XX:MaxPermSize=8m
```

1.8 之后会导致元空间内存溢出

```css
 演示元空间内存溢出 java.lang.OutOfMemoryError: Metaspace
 -XX:MaxMetaspaceSize=8m
```

## 常见面试题三

## 大厂JVM一

### 大厂面试题

#### 蚂蚁金服

- 你知道哪几种垃圾回收器，各自的优缺点，重点讲一下cms和G1？
- JVM GC算法有哪些，目前的JDK版本采用什么回收算法？
- G1回收器讲下回收过程GC是什么？为什么要有GC？
- GC的两种判定方法？CMS收集器与G1收集器的特点

#### 百度

- 说一下GC算法，分代回收说下
- 垃圾收集策略和算法

#### 天猫

- JVM GC原理，JVM怎么回收内存
- CMS特点，垃圾回收算法有哪些？各自的优缺点，他们共同的缺点是什么？

#### 滴滴

Java的垃圾回收器都有哪些，说下g1的应用场景，平时你是如何搭配使用垃圾回收器的

#### 京东

- 你知道哪几种垃圾收集器，各自的优缺点，重点讲下cms和G1，
- 包括原理，流程，优缺点。垃圾回收算法的实现原理

#### 阿里

- 讲一讲垃圾回收算法。
- 什么情况下触发垃圾回收？
- 如何选择合适的垃圾收集算法？
- JVM有哪三种垃圾回收器？

#### 字节跳动

- 常见的垃圾回收器算法有哪些，各有什么优劣？
- System.gc（）和Runtime.gc（）会做什么事情？
- Java GC机制？GC Roots有哪些？
- Java对象的回收方式，回收算法。
- CMS和G1了解么，CMS解决什么问题，说一下回收的过程。
- CMS回收停顿了几次，为什么要停顿两次?

## 大厂面试题二

> CMS和G1的异同

> G1什么时候引发Full GC

> 聊下垃圾回收算法，各有什么利弊

> 垃圾回收器背一下，特点和应用场景

垃圾回收器主要分为三类

> 怎么判断内存泄露

> CMS垃圾回收的流程

> 为什么要有压缩指针？超过多少会失效？为什么超过会失效？

1. 在64位平台的HotSpot中使用32位指针，内存使用会多出1.5倍左右，使用较大指针在主内存和缓存之间移动数据，***占用较大带宽，同时GC也会承受较大的压力***
2. 为了***减少64位*** 平台下***内存*** 的***消耗***，启用指针压缩功能
3. 在JVM中，32位地址最大支持4G内存（2的32次方），可以通过对对象指针的压缩编码、解码方式进行优化，使得JVM只用32位地址就可以支持更大的内存配置（小于等于32G）
4. 堆空间小于4G时，不需要启用指针压缩，JVM会直接去除高32位地址，即使用低虚拟地址空间
5. ***堆内存大于32G时，压缩指针会失效***，会强制使用64位（即8字节）来对Java对象寻址，这就会出现1中的问题，所以堆内存不要大于32G为好

> 怎么解决线上OOM问题，你是如何进行GC调优的

> ThreadLocal有没有内存泄露问题

> G1两个Region不是连续的，而且之间没有可达的引用，我现在要回收一个，另一个要如何处理

> JVM堆内存管理（对象分配过程）

> 讲一下CMS的并发预处理和并发可中断预处理

> 多大的内存会直接晋升到老年代

> ZGC的m0和m1模式分别是什么？
