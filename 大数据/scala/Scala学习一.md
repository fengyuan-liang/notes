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

`JDK5.0`和`JDK8.0`的编译器就是马丁·奥德斯基写的，因此马丁·奥德斯基一个人的战斗力抵得上一个Java开发团队

![快速学习 Scala语言简介](https://cdn.fengxianhub.top/resources-master/20200219115944546.png)

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
- Scala在设计时，马丁·奥德斯基是参考了Java的设计思想，可以说Scala是源于Java，同时马丁·奥德斯基也加入了自己的思想，`将函数式编程语言的特点融合到JAVA中`, 因此，对于学习过Java的同学， 只要在学习Scala的过程中，搞清楚Scala和Java相同点和不同点，就可以快速的掌握Scala这门语言

### 1.4 命令行简单使用

```scala
fengyuan-liang@fengyuan-liangdeMacBook-Pro ~ % scala
Welcome to Scala 2.12.0 (Java HotSpot(TM) 64-Bit Server VM, Java 1.8.0_351).
Type in expressions for evaluation. Or try :help.

scala> val a = 1
a: Int = 1

scala> var b = 10
b: Int = 10

scala> a + b
res0: Int = 11

scala> hello world
<console>:12: error: not found: value hello
       hello world
       ^
<console>:12: warning: postfix operator world should be enabled
by making the implicit value scala.language.postfixOps visible.
This can be achieved by adding the import clause 'import scala.language.postfixOps'
or by setting the compiler option -language:postfixOps.
See the Scaladoc for value scala.language.postfixOps for a discussion
why the feature should be explicitly enabled.
       hello world
             ^

scala> System.out.println("hello world")
hello world

scala> println("hello world")
hello world

scala>
```

### 1.5 Scala Hello World

我们用scala进行hello world

```scala
object HelloScala {
	def main(args: Array[String]): Unit = {
		println("hello scala")
	}
}
```

编译后会发现对比java会多一个`xxx$.class`

```shell
fengyuan-liang@fengyuan-liangdeMacBook-Pro demo01 % vim HelloScala.scala   
fengyuan-liang@fengyuan-liangdeMacBook-Pro demo01 % scalac HelloScala.scala
fengyuan-liang@fengyuan-liangdeMacBook-Pro demo01 % ll -h
total 40
13273246 -rw-r--r--  1 fengyuan-liang  staff   422B  7  6 17:20 HelloJava.class
13273243 -rw-r--r--  1 fengyuan-liang  staff   108B  7  6 17:20 HelloJava.java
13273445 -rw-r--r--  1 fengyuan-liang  staff   669B  7  6 17:22 HelloScala$.class
13273444 -rw-r--r--  1 fengyuan-liang  staff   608B  7  6 17:22 HelloScala.class
13273433 -rw-r--r--  1 fengyuan-liang  staff    91B  7  6 17:22 HelloScala.scala
fengyuan-liang@fengyuan-liangdeMacBook-Pro demo01 % scala HelloScala
hello scala
```

如果我们使用java执行scala生成的字节码文件，会发生报错

```shell
fengyuan-liang@fengyuan-liangdeMacBook-Pro demo01 % java HelloScala
Exception in thread "main" java.lang.NoClassDefFoundError: scala/Predef$
	at HelloScala$.main(HelloScala.scala:3)
	at HelloScala.main(HelloScala.scala)
Caused by: java.lang.ClassNotFoundException: scala.Predef$
	at java.net.URLClassLoader.findClass(URLClassLoader.java:387)
	at java.lang.ClassLoader.loadClass(ClassLoader.java:418)
	at sun.misc.Launcher$AppClassLoader.loadClass(Launcher.java:355)
	at java.lang.ClassLoader.loadClass(ClassLoader.java:351)
	... 2 more
fengyuan-liang@fengyuan-liangdeMacBook-Pro demo01 % java HelloScala$
错误: main 方法不是类 HelloScala$ 中的static, 请将 main 方法定义为:
   public static void main(String[] args)
```

我们反编译`HelloScala.class`

```java
import scala.reflect.ScalaSingnature;

public final class HelloScala {
  public static void main(String[] paramArrayOfString) {
    HelloScala$.MODULE$.main(paramArrayOfString);
  }
}
```

我们反编译`HelloScala$.class`

```java
import scala.PreDef.;

public final class HelloScala$ {
  public static MODULE$;
  static {
    new();
  }
  public void main(String[] args) {
    Predef$.MODULE$.println("hello scala");
  }
  private HelloScala$() {
    MODULE$ = this;
  }
}
```

>我们会发现`HelloScala.class`里面调用的是`HelloScala$`里面单例的对象，这其实对应着我们scala代码中写的是的`object HelloScala`，而不是`class HelloScala`，我们生命的并不是类，而是对象，我们将这种对象称之为`伴生对象`

那为什么`scala`为什么要设计的这么复杂呢？因为之前的Java并不是完全面向对象的，scala比java更加的面向对象，scala认为一切皆为对象，所以不应该有`HelloScala.main(...)`这种静态方法存在，因为这里是对象点出来的，而不是对象，scala绕了一圈，实现了单例模式，然后定义了一个对象`MODULE$`，让我们可以通过对象执行方法`Predef$.MODULE$.println("hello scala")`

其实我们完全也可以通过`java`命令执行scala生成的class文件，但是需要引入scala的库文件，值得注意的是在mac上是用`:`分割路径的，在win上是`;`

```shell
fengyuan-liang@fengyuan-liangdeMacBook-Pro demo01 % java -cp $SCALA_HOME/scala-2.12.0/lib/scala-library.jar: HelloScala
hello scala
```

### 1.6 伴生类&所属类

在上面的例子中，我们将`HelloScala`称之为`伴生对象的伴生类`；将`HelloScala$`称之为`伴生对象的所属类`

### 1.7 java&scala 面向对象

在java面向对象的设计中，我们看下面的代码

![image-20230706182546609](https://cdn.fengxianhub.top/resources-master/image-20230706182546609.png)

在上面的代码中我们定义了一个`static`的属性`school`，此时这个属性其实就已经不属于对象了，而是属于类，之后无论我们如何`new`对象，这个属性都不会改变，其实这样并不完全面向对象，面向对象的设计中，要求属性应该属于对象，而不是类；如果我们定义来static的方法，我们也无法通过对象来调用这个方法，我们称这样并不是完全的面向对象。

scala是比java更加面向对象的语言，所以scala取消了`static`关键字，通过伴生类（object对象）将所有的属性和方法都划给了对象

>让我们来看看`scala`的面向对象

![image-20230706185151190](https://cdn.fengxianhub.top/resources-master/image-20230706185151190.png)

## 2. 变量和数据类型

### 2.1 注释

scala的注释和java完全一样，不多赘述

### 2.2 变量和常量

 在java中是这样生命变量和常量的

```java
int a = 10;
final int b = 20;
```

java这样设计是将`常量声明成变量`，因为就加了final修饰

scala是这样做的

```scala
var i:Int = 10 // 变量
val j:Int = 20 // 常量
// scala建议能使用常量的地方就不要使用变量（函数式编程思想）
```

除此之外，在scala中还有以下的操作

```scala
import demo01.Student

object Test02_Variable {
  def main(args: Array[String]): Unit = {
    // 声明一个变量的通用语法
    // 1. 类型可以省略（自动推断）
    var a1 = 10
    val b1 = 23
    // 2. 类型确认后，就不能修改
    // a1 = "hello"
    // 3. 变量声明时，必须有初始值
    // var a3: Int
    // 4. var修饰为变量 val是常量
    a1 = 20
    // b1 = 20
    // 5. 引用类型可以修改，跟java一样
    var bob = new Student("Bob", 18)
    bob.showInfo()
    bob = new Student("Alice", 23)
    bob.showInfo()
    bob.age = 24
    bob.showInfo()
  }
}
// 输出
name:Bob age:18 school:school
name:Alice age:23 school:school
name:Alice age:24 school:school
```

### 2.3 命名规范

1. 以字母或者下划线开头，后接字母、数字、下划线
2. 以操作符开头，且只包含操作符（+ - * / # !等）
3. 用反引号【\`....\`】包括的任意字符串，即使是 Scala 关键字（39 个）也可以
   - package, import, class, `object`, trait, extends, `with`, type, for
   -  private, protected, abstract, sealed, final, implicit, lazy, override
   -  try, catch, finally, throw
   - if, else, match, case, do, while, for, return, yield
   - `def, val, var`
   -  this, super
   - new
   - true, false, null

```scala
package demo02

object Test03_Identifier {
  def main(args: Array[String]): Unit = {
    // 1. 以字母或者下划线开头，后接字母、数字、下划线
    val hello = " "
    var hello123 = ""
    var _abc = 123
    // 2. 以操作符开头，且只包含操作符（+ - * / # ! 等）
    val --++-# = "hello"
    println(--++-#)
    // 3. 用反引号`......`包括任意字符（包括39个关键字）
    // var if = "if"
    val `if` = "if"
    println(`if`)
  }
}
```

### 2.4 字符串输出

```scala
package demo02

object Test04_string {
  def main(args: Array[String]): Unit = {
    // 1. 字符串可以通过+号连接
    val name = "alice"
    val age = 18
    println("name:" + name + ", age:" + age)
    // *号表示字符串复制多次并拼接
    println(name * 3)
    // 2. printf格式化输出
    printf("%s今年%d岁了", name, age)
    // 3. 模版字符串（插值字符串）s"", 通过$获取变量值
    println(s"${name}今年${age}岁了")
    // 格式化模版字符串
    val num = 2.36642 // double类型；%2.2f 保留两位整数、两位小数
    println(f"num is ${num}%2.2f")
    // 三引号模版字符串
    val sql = s"""
       |select *
       |from
       |  student
       |where
       |  name = ${name}
       |and
       |  age > ${age}
       |""".stripMargin
    println(sql)
  }
}
// 输出
name:alice, age:18
alicealicealice
alice今年18岁了alice今年18岁了
num is 2.37

select *
from
  student
where
  name = alice
and
  age > 18
```

### 2.5 标准键盘输入&输出

```scala
import scala.io.StdIn

object Test05_stdin {
  def main(args: Array[String]): Unit = {
    println(s"我是${StdIn.readLine()}, 今年${StdIn.readInt()}岁")
  }
}
// 输出
张三
12
我是张三, 今年12岁
```



```scala
import java.io.{File, PrintWriter}
import scala.io.Source

object Test06_FileIO {
  def main(args: Array[String]): Unit = {
    // 1. 从文件里面读取
    val source = Source.fromFile("data.txt")
    source.foreach(print)
    source.close()
    // 2. 将数据写入文件，java方式
    val writer = new PrintWriter(new File("out.txt"))
    writer.write("hello scala from java writer")
    writer.close()
  }
}
```

### 2.6 数据类型

在java里面有基本数据类型和引用类型，在scala中更加面向对象，并没有基本数据类型

1. 在scala中一切数据都是对象，都是`Any的子类`
2. scala中数据类型分为两大类：数值类型（AnyVal）、引用类型（AnyRef），`不管是值类型还是引用类型都是对象`
3. scala数据类型仍然遵守，`低精度的值类型向高精度值类型，自动转换（隐式转换）`
4. scala中的`StringOps`是对Java中的`String`的增强
5. Unit：对应Java中的void，用于方法返回值的位置，表示方法没有返回值。`Unit`是一个数据类型，只有一个对象就是`()`；Void不是数据类型，只是一个关键字
6. `Null是一个类型`，只有一个对象就是null。`它是所有引用类型（AnyRef）的子类`
6. `Nothing`，是所有数据类型的子类，主要用在一个函数没有明确返回值时使用，因为这样我们可以把抛出的返回值，返回给任何的变量和函数

![Scala 的类层次关系_w3cschool](https://cdn.fengxianhub.top/resources-master/16.png)

### 2.7 Unit类型、Null类型和Noting类型

基本说明：

| 数据类型 | 描述                                                         |
| -------- | ------------------------------------------------------------ |
| Unit     | 表示无值，和其他语言中的`void`等同。用作不返回任何结果的方法的结果类型。Unit只有一个实例值，可以写作`()` |
| Null     | null，Null类型只有一个实例值`null`                           |
| Noting   | Noting类型在Scala的类层级最底端；它是任何其他类型的子类型。当一个函数，我们确定没有返回正常的返回值，可以用`Noting`来指定返回类型，这样有一个好处，就是我们可以把返回的值（异常）赋给其他的函数或者变量（兼容性） |

```scala
object Test07_DateType {
  def main(args: Array[String]): Unit = {
    // 1. byte
    val a1: Byte = 127
    val a2: Byte = -128

    // 5.1 Unit
    def m1(): Unit = {
      println("m1被调用执行")
    }

    val a: Unit = m1()
    println("a: " + a) // a: () 查看`Unit`的源码，toString输出的就是括号
    // 5.2 空引用Null
    // val n: Int = null // error
    // println(n)
    var student = new Student("alice", 20)
    student = null
    println(student) // null

    // 5.3 noting
    // noting也是Int的子类，所以抛出异常其实是返回的Noting
    def m2(n: Int): Int = {
      if (n == 0)
        throw new NullPointerException
      else
        n
    }

    val b = m2(2)
    println("b: " + b) // b: 2
  }
}

```

### 2.8 自动类型转换

scala自动类型转换的规则和java相似

- 自动提升原则：有多种类型的数据混合运算时，系统首先`自动将所有数据转换成精度大的那种数据类型`，然后再进行计算
- `把精度大的数值类型赋值给精度小的数值类型时，就会报错`，反之就会进行自动类型转换
- （byte、short）和char之间不会相互自动转换
- byte、short、char他们三者可以计算，在计算时首先转换为int类型

### 2.9 scala运算符的本质

scala运算符和java基本上差不多，但是scala是更加面向对象的语言，scala的运算符本质上其实是`对象的方法调用`

```scala
object Test01_operator {
  def main(args: Array[String]): Unit = {
    // 运算符的本质
    val n1: Int = 12
    val n2: Int = 37
    // 调用n1这个对象的`+`方法
    println(n1.+(n2))
    // 可以简写为
    println(n1 + n2)
    // toString也可以简写，方便链式调用
    println(7.5 toString)
  }
}
```

## 3. Loop

### 3.1 遍历

```scala
object Test02_for_loop {
  def main(args: Array[String]): Unit = {
    // 1. 范围遍历, `to`其实就是方法调用，to有到达的意思，当然包含10
    for (i <- 1 to 10) {
      println(i + ". hello world")
    }
    // 本质上是这样的
    for (i <- Range.inclusive(1, 10)) {
      println(i + ". hello world")
    }
    // 不包含的写法
    for (i <- 1 until 10) {
      println(i + ". hello world")
    }
    println("=================")
    // 2. 数组遍历
    for (i <- Array(1,4,6)) {
      println(i)
    }
    println("=================")
    for (i <- List(1, 4, 6)) {
      println(i)
    }
    println("=================")
    for (i <- Set(1, 4, 6)) {
      println(i)
    }
  }
}
```

### 3.2 循环守卫

在scala中没有关键字`continue`

```scala
// 3. 循环守卫
for (i <- 1 to 10 if i != 5) {
  println(i)
}
```

### 3.3 循环步长

```scala
// 4. 循环步长 `by`是range的一个方法
for (i <- 1 to 10 by 2) {
  println(i + ". hello world")
}
println("=================")
for (i <- 1 to 10 reverse) {
  println(i + ". hello world")
}
```

### 3.4 循环变量

```scala
object Test04_practice_pyramid {
  def main(args: Array[String]): Unit = {
    for (i <- 1 to 9) {
      val stars = 2 * i - 1
      val spaces = 9 - i
      println(" " * spaces + "*" * stars)
    }
    // 使用循环变量
    for (i <- 1 to 9; stars = 2 * i - 1; spaces = 9 - i) {
      println(" " * spaces + "*" * stars)
    }
  }
}
```

### 3.5 循环返回值

注意这里`yield`是一个关键字，跟java里面线程控制的那个方法不一样

```scala
val r1: immutable.IndexedSeq[Int] = for (i <- 1 to 10) yield i
println(r1)
// 输出
Vector(1, 2, 3, 4, 5, 6, 7, 8, 9, 10)
```

### 3.6 退出循环

在scala里面为了配合`函数式编程`和`更加面向对象`，没有`break`和`continue`这两个关键字

```scala
package demo04

import scala.util.control.Breaks

object Test06_break {
  def main(args: Array[String]): Unit = {
    // 1. 采用抛出异常的方式退出循环
    try {
      for (i <- 1 to 10) {
        if (i == 3) {
          throw new RuntimeException
        }
        println(s"s=$i")
      }
    } catch {
      case e => // 在scala中catch是通过模式匹配
    }
    // 2. 使用scala中的Breaks类的break方法，实现异常的抛出和捕获
    // 其实底层就是使用try catch实现的
    Breaks.breakable(
      for (i <- 0 until 5) {
        if (i == 3) {
          Breaks.break()
        }
        println(s"s=$i")
      }
    )
  }
}

```

## 4. 函数式编程🤩

首先回顾一下面相对象编程：

- 解决问题，分解对象、行为、属性，然后通过对象的关系以及行为的调用来解决问题
- 对象：用户
- 行为：登陆、连接JDBC、读取数据库
- 属性：用户名、密码

> Scala语言是一个完全面相对象编程语言，万物皆对象
>
> 对象的本质：对数据和行为的一个封装

函数式编程：

面向过程和面向对象其实都是`命令式编程`，关注的点`计算机执行问题的命令`

函数式编程关注的点是`数据的映射关系`（有点云里雾里 😂）

举个例子🤪：

- 在命令式编程里面`int a = 1`，就是定义了一个变量并且赋值为1，接下来还可以`a = 2`，再赋值
- 在函数式编程里面，函数其实就是数学里面的函数，例如`x = 1`，就是一条直线，就不能`x = 2`了

区别：命令式编程更适合计算机进行理解（命令式），函数式编程更加适合人来理解

- 函数编程拥有更好的不可变性
- 函数式编程的不可变性更加适合大数据`分布式并行计算`的场景（不可变意味着没有副作用）

### 4.1 函数基础

#### 4.1.1 基础语法

![image-20230709234032232](https://cdn.fengxianhub.top/resources-master/image-20230709234032232.png)

来个🌰

```scala
object Test01_function_method {
  def main(args: Array[String]): Unit = {
    // 定义函数(狭义的函数)
    def sayHi(name: String): Unit = {
      println(s"Hi $name")
    }
    // 函数调用
    sayHi("alice")
    // 方法调用
    Test01_function_method sayHi "alice"

    // 获取方法的返回值
    val str = Test01_function_method sayHello "bob"
    println(str)
  }

  // 定义对象的方法
  def sayHi(name:String): Unit = {
    println(s"Hiiiii $name")
  }

  def sayHello(name: String): String = {
    println(s"Hello $name")
    "Hello"
  }
}
```



#### 4.1.2 函数和方法的区别

核心概念：

- 为完成某一功能的程序语句的集合，称为函数
- 类中的函数称之方法

#### 4.1.3 可变参数

```scala
package demo05

object Test03_function_parameter {
  def main(args: Array[String]): Unit = {
    // 1. 可变参数定义规则
    def f1(str: String*): Unit = {
      println(str)
    }

    f1("alice") // WrappedArray(alice)
    f1("alice", "bob", "eureka") // WrappedArray(alice, bob, eureka)

    // 2. 如果是普通参数和可变参数在一起，可变参数一定放置在最后
    def f2(str1: String, str2: String*): Unit = {
      println(s"str1:$str1, str2:$str2")
    }

    f2("alice", "bob", "eureka") // str1:alice, str2:WrappedArray(bob, eureka)

    // 3. 参数默认值
    def f3(str: String = "default"): Unit = {
      println(s"str:$str")
    }

    f3()

    // 4. 带名参数
    def f4(name: String = "tom", age: Int = 18): Unit = {
      println(s"name:$name, age:$age")
    }

    f4()
    f4(name = "bob")
    f4(name = "bob", age = 19)
  }
}
```

#### 4.1.4 函数至简原则

1. return 可以省略，Scala 会使用函数体的最后一行代码作为返回值

   ```scala
   def sayHello(name: String): String = {
     println(s"Hello $name")
     "Hello"
   }
   ```

2. 如果函数体只有一行代码，可以省略花括号

   ```scala
   def f2(name:String):String = name
   ```

3. 返回值类型如果能够推断出来，那么可以省略（:和返回值类型一起省略）

   ```scala
   def f2(name:String) = name
   ```

4. 如果有 return，则不能省略返回值类型，必须指定

5. 如果函数明确声明 unit，那么即使函数体中使用 return 关键字也不起作用

6. Scala 如果期望是无返回值类型，可以省略等号

7. 如果函数无参，但是声明了参数列表，那么调用时，小括号，可加可不加

   ```scala
   def f7(): Unit = {
   
   }
   
   f7()
   // 可以省略小括号
   f7
   ```

8. 如果函数没有参数列表，那么小括号可以省略，调用时小括号必须省略

9. 如果不关心名称，只关心逻辑处理，那么函数名（def）可以省略

   ```scala
   (name:String) => name
   ```

#### 4.1.5 Lambda

匿名函数至简原则

```scala
val fun = (name: String) => println(name)

// 定义一个函数，以函数作为参数输入
def f(func: String => Unit): Unit = {
  func("hello world")
}
```

1. 参数的类型可以省略，会根据形参进行自动的推导

2. 类型省略之后，发现只有一个参数，则圆括号可以省略；其他情况：没有参数和参数超过 1 的永远不能省略圆括号

3. 匿名函数如果只有一行，则大括号也可以省略

   ```scala
   f(name => println(name)) // hello world
   ```

4. 如果参数只出现一次，则参数省略且后面参数可以用_代替

   ```scala
   f(println(_)) // hello world
   ```

5. 可以直接传入操作，省略下划线

   ```scala
   f(println) // hello world
   ```

举个例子

```scala
// 实例
def dualFunctionOneAndTwo(func: (Int, Int) => Int): Int = {
  func(1, 2)
}

val add = (a: Int, b: Int) => a + b
val minus = (a: Int, b: Int) => a - b
// 匿名函数简化
println(dualFunctionOneAndTwo(add))
println(dualFunctionOneAndTwo(minus))
// 进一步简化
println(dualFunctionOneAndTwo((a, b) => a + b))
// 再简化，体现的是大数据里面传运算过程而不是数据的思想
println(dualFunctionOneAndTwo(_ + _))
println(dualFunctionOneAndTwo(_ - _))
```

### 4.2 函数高级

#### 4.2.1 高阶函数

函数可以作为值进行传递

```scala
// 1. 函数可以作为值进行传递
def f(n: Int): Int = {
  println("f 被调用")
  n + 1
}
println(f(123))
// 1. 函数可以作为值进行传递
val f1: Int => Int = f
// 可以简写为空格+下划线的形式，表示要的是一个函数
val f2 = f _
println(f1) // 对象地址
println(f1(12)) // 13
println(f2) // 对象地址
println(f2(35)) // 36
// 没有参数的时候可以省略括号，表示调用这个函数
def fun(): Int = {
  println("f 被调用")
  1
}
val f3 = fun
val f4 = fun _
println(f3) // 1
println(f4) // 对象地址
```

函数作为参数进行传递

```scala
// 2. 函数作为参数进行传递
// 定义二元计算函数
def dualEval(op: (Int, Int) => Int, a: Int, b: Int): Int = {
  op(a, b)
}
def add(a: Int, b: Int): Int = {
  a + b
}
println(dualEval(add, 12, 35))
println(dualEval((a, b) => a + b, 12, 35))
println(dualEval(_ + _, 12, 35))
```

函数作为函数的返回值返回（函数嵌套）

```scala
// 3. 函数作为函数的返回值返回（函数嵌套）
def f5(): Int => Unit = {
  def f6(a: Int): Unit = {
    println(s"f6调用:$a")
  }
  f6 // 将函数直接返回
}
println(f5()) // lambda表达式对象地址
val f6 = f5()
println(f6) // lambda表达式对象地址
println(f6(25)) // f6调用:25 ()
println(f5()(25)) // f6调用:25 ()
```

#### 4.2.2 高阶函数实现map

在大数据处理中，map和reduce都是非常常见的操作，现在我们来实现一个

```scala
object Test07_Practice_CollectionOperation {
  def main(args: Array[String]): Unit = {
    // 对数组进行处理，将操作抽象出来，处理完毕之后的结果返回一个新的数组
    def arrayOperation(array: Array[Int], op: Int => Int): Array[Int] = {
      for (elem <- array) yield op(elem)
    }

    val arr = Array(2, 4, 54, 1, 22)

    // 定义一个加一的操作
    def addOne(elem: Int): Int = {
      elem + 1
    }

    // 调用函数
    val newArr:Array[Int] = arrayOperation(arr, addOne)
    println(newArr.mkString(", "))

    // 简写 传入匿名函数  实现元素的翻倍
    val newArr2: Array[Int] = arrayOperation(arr, _ * 2)
    println(newArr2.mkString(", "))
  }
}
// 输出
3, 5, 55, 2, 23
4, 8, 108, 2, 44
```

#### 4.2.4 练习

```scala
object Test08_practice {
  def main(args: Array[String]): Unit = {
    // 练习1， 传入三个参数，返回!(i == 0 && s == "" && c == '0')
    val f1 = (i: Int, s: String, c: Char) => !(i == 0 && s == "" && c == '0')

    println(f1(0, "", '0'))
    println(f1(0, "", '1'))
    println(f1(22, "", '0'))
    println(f1(0, "hello", '0'))

    // 练习2， 使用函数嵌套分别传入三个参数，返回!(i == 0 && s == "" && c == '0')
    // 外层函数的参数传入内层函数 => 闭包 => 可以使用柯里化简化
    val func = (i: Int) => (s: String) => (c: Char) => !(i == 0 && s == "" && c == '0')
    println(func(0)("")('0'))
    println(func(0)("")('1'))
    println(func(22)("")('0'))
    println(func(0)("hello")('0'))

    // 柯里化
    def func2(i: Int)(s: String)(c: Char) = {
      !(i == 0 && s == "" && c == '0')
    }

    println(func2(0)("")('0'))
    println(func2(0)("")('1'))
    println(func2(22)("")('0'))
    println(func2(0)("hello")('0'))
  }
}
```

#### 4.2.4 函数柯里化&闭包

>首先我们需要知道：`闭包`是函数式编程的标配
>
>- 闭包：如果一个函数，访问到了它的外部（局部）变量的值，那么这个函数和它所处的环境，称之为`闭包`
>
>- 函数柯里化：把一个参数列表的多个参数，变成多个参数列表

举个闭包的例子

```scala
// 下面的调用中，当f1函数执行完后，在栈空间里面的变量`i`应该就会被释放掉，f2应该就访问不到了
// 但是f2却可以访问，同理f3也可以访问到f2中被释放的变量`s`
// 这就是闭包，其实就是栈内内存逃逸
def f1(i:Int): String => Char => Boolean = {
  def f2(s: String): Char => Boolean = {
    def f3(c: Char): Boolean = {
      !(i == 0 && s == "" && c == '0')
    }
    f3
  }
  f2
}

println(f1(0)("")('0'))
println(f1(0)("")('1'))
println(f1(22)("")('0'))
println(f1(0)("hello")('0'))
```

#### 4.2.5 递归

我们来写一段递归的代码，作用是计算阶乘

```java
public class TestRecursion {
    public static void main(String[] args) {
        System.out.println(factorial(10));
    }

    public static int factorial(int n) {
        if (n == 1) {
            return 1;
        }
        return factorial(n - 1) * n;
    }
}
```

这样的缺点是大大的浪费栈空间

在函数式编程语言中对这种情况会做优化，尾递归不需要一层一层的进行压栈，而是直接覆盖

```scala
package com.fx.chapter05

import scala.annotation.tailrec

object Test10_Recursion {
  def main(args: Array[String]): Unit = {
    println(fact(10))
    println(tailFact(10))
  }

  // 普通递归实现 缺点：空间复杂度高
  def fact(n: Int): Int = {
    if (n == 0) return 1
    fact(n - 1) * n
  }

  // 尾递归实现
  def tailFact(n: Int): Int = {
    @tailrec
    def loop(n: Int, currentResult: Int): Int = {
      if (n == 0) {
        return currentResult
      }
      loop(n - 1, currentResult * n)
    }
    loop(n, 1)
  }
}

```







