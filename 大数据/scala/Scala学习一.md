# Scala学习一

## 1. Scala概述

Scala具有什么特性？我们为什么要学习Scala呢？

- Scala是Java++，基于JVM，和Java完全兼容，同样具有跨平台、可移植性好、方便的垃圾回收等性质
- Scala比Java更加面向对象，同时是一门函数式编程语言
- Scala对集合 类型数据处理有非常好的支持，因此Scala非常适合进行大数据处理

- Spark—新一代内存级大数据计算框架，是大数据的重要内容
- Spark就是使用Scala编写的。因此为了更好的学习Spark, 需要掌握Scala这门语言。
- Spark的兴起，带动Scala语言的发展！

因此如果读者要学习大数据，那么必须先要学习好`Scala`这门语言

### 1.1 Scala发展历史

联邦理工学院的马丁·奥德斯基（Martin Odersky）于`2001年开始设计Scala`。

`马丁·奥德斯基`是编译器及编程的狂热爱好者，长时间的编程之后，希望发明一种语言，能够让写程序这样的基础工作变得高效，简单。所以当接触到JAVA语言后，对 JAVA这门便携式，运行在网络，且存在`垃圾回收`的语言产生了极大的兴趣，所以决定将函数式编程语言的特点融合到JAVA中，`由此发明了两种语言（Pizza & Scala）`。 Pizza和Scala极大地推动了Java编程语言的发展。 

- JDK5.0 的泛型、增强for循 环、自动类型转换等，都是从Pizza引入的新特性
- JDK8.0 的类型推断、Lambda表达式就是从Scala引入的特性

`JDK5.0`和`JDK8.0`的编辑器就是马丁·奥德斯基写的，因此马丁·奥德斯基一个人的战斗力抵得上一个Java开发团队

![快速学习 Scala语言简介](https://img-blog.csdnimg.cn/20200219115944546.png)

### 1.2 Scala和Java的关系

一般来说，学 Scala 的人，都会 Java，而 Scala 是基于 Java 的，因此我们需要将 Scala 和 Java 以及 JVM 之间的关系搞清楚，否则学习 Scala 你会蒙圈

我们知道Java语言编写的代码最后都是要编译成字节码文件，再交给`JVM`去执行的，而我们的`Scala`语言，编译出来的同样也是字节码文件，因此`Scala`可以直接调用`Java`的类库，`Java`也可以直接调用`Scala`的类库，两种语言都是建立在`JVM`之上的

![image-20200704183048061](https://cdn.fengxianhub.top/resources-master/202207091519757.png)

我们来看一段`Scala`代码（看不懂没关系，只是阐述一下`Scala`兼容Java的类库）

```java
object ScalaService {
  def main(args: Array[String]): Unit = {
    // 可以使用Java的语法（部分）
    println("hello world") // Scala 语法
    System.out.println("hello world") // Java 语法
  }
}
```

### 1.3 Scala的语言特点

Scala是一门以Java虚拟机（JVM）为运行环境并将`面向对象`和`函数式编程`的最佳特性结合在一起的`静态类型编程语言`（静态语言需要提前编译的如：Java、c、c++等，动态语言如：js）

- Scala是一门`多范式`的编程语言，Scala支持`面向对象和函数式编程`。（多范式，就是多种编程方法的意思。有面向过程、面向对象、泛型、函数式四种程序设计方法。）
- Scala源代码（.scala）会被编译成Java字节码（.class），然后运行于JVM之上，`并可以调用现有的Java类库，实现两种语言的无缝对接`
- Scala单作为一门语言来看，非常的`简洁高效`
- Scala在设计时，马丁·奥德斯基是参考了Java的设计思想，可以说Scala是源于Java，同时马丁·奥 德斯基也加入了自己的思想，`将函数式编程语言的特点融合到JAVA中`, 因此，对于学习过Java的同学， 只要在学习Scala的过程中，搞清楚Scala和Java相同点和不同点，就可以快速的掌握Scala这门语言



























