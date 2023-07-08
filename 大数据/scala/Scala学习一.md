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

























