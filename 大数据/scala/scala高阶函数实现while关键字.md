# scala高阶函数实现while关键字

这里使用的高阶函数有：

- 函数柯里化&闭包
- 递归
- 控制抽象

我们先来写一段正常的`while`代码

```scala
object MyWhile {
  def main(args: Array[String]): Unit = {
    var n = 3

    // 1. 常规的while循环
    while (n >= 1) {
      println(n)
      n -= 1
    }
  }
}
// 输出
3
2
1
```

## 1. 使用闭包实现

接下来我们要实现`while`关键字

```scala
object MyWhile {
  def main(args: Array[String]): Unit = {
    var n = 3

    // 1. 常规的while循环
    while (n >= 1) {
      println(n)
      n -= 1
    }

    // 2. 使用闭包实现一个函数 将代码块作为参数传入 递归调用
    // 抽象控制
    def myWhile(condition: => Boolean): (=> Unit) => Unit = {
      // 内层函数需要递归调用 参数就是循环体
      def doLoop(op: => Unit): Unit = {
        if (condition) {
          // 执行一次函数体
          op
          // 递归进行下一次执行
          myWhile(condition)(op)
          // 还可以写出尾递归的形式
          //  doLoop(op)
        }
      }
      // `_` 省略传入代码块参数，函数 空格 下划线表示返回的就是这个函数本身
      doLoop _
    }
    println("===========")


    n = 3
	// 如果传入的是代码块 柯里化的()也可以省略
    myWhile(n >= 1) {
      println(n)
      n -= 1
    }
  }
}
// 输出
3
2
1
===========
3
2
1
```

## 2. 匿名函数进行实现

```rust
// 3. 使用匿名函数实现
def myWhile2(condition: => Boolean): (=> Unit) => Unit = {
  // 内层函数使用递归调用 参数就是循环体
  op => {
    if (condition) {
      op
      myWhile(condition)(op)
    }
  }
```

## 3. 函数柯里化进行实现

```scala
// 4. 使用柯里化实现
@tailrec
def myWhile3(condition: => Boolean)(op: => Unit): Unit = {
  if (condition) {
    op
    myWhile3(condition)(op)
  }
}
```

































