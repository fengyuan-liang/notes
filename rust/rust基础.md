# rust基础

>rust的优点有：高效、安全性、无所畏惧的并发
>
>参考资料：
>
>- rust程序设计语言：https://rust.bootcss.com/title-page.html
>- rust权威指南：https://kaisery.github.io/trpl-zh-cn/foreword.html
>- rust语言圣经：https://course.rs/about-book.html

![rust-analyzer 成为 Rust 官方项目 - 知乎](https://cdn.fengxianhub.top/resources-master/v2-04b522fa2e503a42ec48155fd70e6927_720w.jpg)

## 1. cargo

常用命令：

```rust
cargo build
cargo run
cargo update
```

### 1.1 猜数游戏

```rust
use rand::Rng; // trait 相当于java里的接口
use std::cmp::Ordering;
use std::io; // prelude

fn main() {
    println!("猜数！！");

    // 默认i32类型
    let secret_number = rand::thread_rng().gen_range(0..=100);

    println!("神秘数字是:{}", secret_number);
    
    loop {
        println!("猜测一个数");

        let mut guess = String::new();

        // io:Result Ok, Err err会返回失败的结果
        io::stdin().read_line(&mut guess).expect("无法读取行");
        // shadow
        let guess: u32 = match guess.trim().parse() {
            Ok(num) => num,
            Err(_) => continue,
        };

        println!("你猜的数是：{}", guess);

        match guess.cmp(&secret_number) {
            Ordering::Less => println!("Too small!"), // arm
            Ordering::Greater => println!("To big"),
            Ordering::Equal => {
                println!("You win!!");
                break;
            }
        }
    }
}
```

## 2. rust基础概念

### 2.1 变量与可变性

在rust里面声明变量使用的是`let`关键字，默认情况下，变量是不可变的`lmmutable`

如果需要可变，可以添加`mut`这个关键字

**变量与常量**

常量（constant），常量在绑定值之后也是不可变的，但是它与不可变的变量有很多区别

- 不可以使用`mut`，常量永远都是不可变的
- 声明常量使用`const`关键字，它的类型必须被标注
- 常量可以在任何作用域内进行声明，包括全局作用域

常量在程序运行期间，其声名的作用域内一直有效；在`rust`中常量使用全大写字母，每个单词之间使用下划线分割开，例如：`MAX_POINTS`

**shadowing(隐藏)**

```rust
fn main() {
    let x = 5;
    let x = x + 1;
    let x = x + 1;
    println!("x is {}", x) // x is 7
}
```

类型也可以不一样，如果使用mut是不可以的

```rust
fn main() {
    let spaces = "    ";
    let spaces = spaces.len();
    println!("spaces is {}", spaces) // spaces is 4
}
```

### 2.2 数据类型

#### 2.2.1 标量类型

rust有四个主要的标量类型：

- 整数类型
- 浮点类型
- 布尔类型
- 字符类型

rust的整数类型如下图：

| Length  | Signed | Unsigned |
| ------- | ------ | -------- |
| 8-bit   | i8     | u8       |
| 16-bit  | i16    | u16      |
| 32-bit  | i32    | u32      |
| 64-bit  | i64    | u64      |
| 128-bit | i128   | u128     |
| arch    | isize  | usize    |

#### 2.2.2 复合类型

所谓的复合类型就是可以将多个值放在一个类型里面

rust提供了两种基础的复合类型：元组（Tuple）、数组

**Tuple（元组）**

- Tuple可以将多个类型的多个值放到一个类型里
- **Tuple的长度是固定的**，一旦声明就无法改变

```rust
fn main() {
    // define Tuple
    let tup: (i32, f64, u8) = (500, 6.4, 1);
    // destructure tuple
    let (x, y, z) = tup;

    println!("{},{},{}", x, y, z) // 500,6.4,1
}
```

可以使用`点标记法`来访问`Tuple`里面的元素

```rust
fn main() {
    // define Tuple
    let tup: (i32, f64, u8) = (500, 6.4, 1)
    println!("{},{},{}", tup.0, tup.1, tup.2) // 500,6.4,1
}
```

**数组**

```rust
fn main() {
    let months = [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December",
    ];
    println!("{}", months[0]) // January
}
```

一般数组以`[类型;长度]`来表示

```rust
let a: [i32; 5] = [1, 2, 3, 4, 5];
```

如果数组中的值都相等，也可以这样进行声明

```rust
fn main() {
    let arr = [3; 5];
    println!("{:?}", arr); // [3, 3, 3, 3, 3]
}
```

### 2.3 函数

在rust中函数使用`fn`关键字

按照惯例，针对函数和变量名，rust使用`snake case`命名规范：所有字母都是小写，单词之间使用下划线分开

```rust
fn main() {
    println!("hello world");
    another_function()
}

// specification of snake case
fn another_function() {
    println!("another function")
}
```

#### 2.3.1 函数的参数

- parameter（形参）、argument（实参）
- 在函数签名里，必须声明每个参数的类型

```rust
fn main() {
    println!("hello world");
    another_function(5) // argument
}

fn another_function(x: i32) { // parameter
    println!("the value of x is {}", x)
}
```

#### 2.3.2 函数体中的语句与表达式

- 函数体由一系列语句组成，可选的由一个表达式结束
- rust是一个基于表达式的语言
- 语句是执行一些动作的指令
- **表达式会计算产生一个值**
- 函数的定义也是语句
- 语句不返回值，所以不可以使用`let`将一个语句赋给一个变量

这一块有一点玄学，得仔细看看

```rust
fn main() {
   let y = {
    let x = 1;
    x + 3 // 没有加分号，`x + 3`是一个表达式，可以作为语句的一部分，表达式会计算产生一个值作为返回
   };
   println!("The value of y is {}", y) // The value of y is 4
}
```

如果我们加上分号，就变成`语句`了，语句没有返回（其实准确一点，语句的返回值是一个`空的Tuple`，也就是`()`）

![image-20230715143313665](https://cdn.fengxianhub.top/resources-master/image-20230715143313665.png)

#### 2.3.3 函数的返回值

- 在`->`符号后边声明函数返回值的类型，但是不可以为返回值命名
- 在rust里面，返回值就是函数体里面**最后一个表达式的值**
- 如果想要提前返回，需要使用`return`关键字，并且指定一个值

```rust
fn main() {
    let x = plus_five(6);

    println!("The value of x is: {}", x) // The value of x is: 11
}

fn plus_five(x:i32) -> i32 {
    5 + x
}
```

### 2.4 控制流

#### 2.4.1 if表达式

- `if表达式`运行您根据条件执行不同的代码分支
- if表达中，与条件相关联的代码块就叫做分支（arm）
- 可选的，在后面可以加上一个`else表达式`

```rust
fn main() {
    let number = 3;

    if number < 5 {
        println!("condition was true");
    } else {
        println!("condition was false");
    }
}
```

当然也可以用我们之前学的`match`来完成`if分支`

```rust
fn main() {
    let number = 3;

    match number {
        n if n < 5 => {
            println!("condition was true");
        }
        _ => {
            println!("condition was false");
        }
    }
}
```

#### 2.4.2 loop

在rust中loop一共有三种：`loop`、`while`和`for`

**loop**

```rust
fn main() {
    let mut cnt = 0;

    let result = loop {
        if cnt < 10 {
            cnt += 1;
        } else {
            break cnt;
        }
    };
    println!("The result is: {}", result) // The result is: 10
}
```

**while**

```rust
fn main() {
    let mut cnt = 0;

    while cnt < 10 {
        cnt +=1
    }
    println!("The result is: {}", cnt) // The result is: 10
}
```

**for**

```rust
fn main() {
    let arr = [10, 20, 30, 40, 50];
    // arr.iter() Returns an iterator over the slice
    for element in arr.iter() {
        println!("the value is:{}", element)
    }
}
```

**range**

在rust中可以使用`..`符号表示这是一个可遍历的`range`

```rust
fn main() {
   for number in (1..4).rev() {
    println!("The value of number is: {}", number)
   }
}
```

#### 2.4.3 match

在rust中提供了一个极为强大的控制流运算符`match`，由于`match`和`Option`合在一起更加好理解一些，所以可以看`5.4小节`

## 3. rust所有权

所有权是`Rust`最独特的特性，它让`Rust`无需`GC`就可以保证内存安全

### 3.1 所有权概念

- Rust的核心概念就是所有权
- 所有程序在运行时都必须管理它们使用计算机内存的方式
  - 有些语言有垃圾收集机制，在程序运行时，它们会不断地寻找不再使用的内存
  - 在其他语言中，必须显式的分配和释放内存
- Rust既不需要垃圾收集器，也不需要显式的分配和释放内存
  - 内存是通过一个所有权系统来管理的，其中包含一组编译器在编译时检查的规则
  - 在程序运行时，所有权特性不会减慢程序的运行速度（因为在编译时就处理好了）

### 3.2 Stack&Heap

在rust中，一个值是在`Stack`上还是在`Heap`上对语言的行为和你为什么要做某些决定是有非常大的影响的

在我们的代码运行的时候，Stack&Heap的结构非常不同

>`Stack`按值的接受顺序来存储，按照相反的顺序将它们移除（后进先，LIFO）
>
>- 添加数据叫做`压入栈`
>- 移除数据叫做`弹出栈`
>
>所有存储在`Stack`上的数据必须拥有已知的的固定的大小
>
>- 编译时大小未知的数据或运行时大小可能发生变化的数据必须存放在`heap`上 
>
>`Heap`内存组织性差一些：
>
>- 当你把数据放入heap时，我们需要申请一定数量的空间
>- 操作系统在heap内找到一块足够大的空间，把它标记为`在用`，并返回一个`指针`，也就是这个空间的地址
>- 这个过程叫做在heap上进行分配，有时仅仅称为`分配`

在stack和heap上分配空间并不相同

>把值压到stack上不叫分配
>
>因为指针是固定大小的，可以把指正存放到stack上，再通过指针来找数据
>
>把数据压到stack上要比heap上分配快的多
>
>- 因为操作系统不需要寻找用来存储新数据的空间，那个位置永远都在stack的顶端
>
>在heap上分配空间需要做更多的工作
>
>- 操作系统首先需要找到一个足够大的空间来存放数据，然后要做好记录方便下次分配

### 3.3 所有权存在的原因

所有权解决的问题：

- 跟踪代码的那些部分正在使用heap的哪些数据
- 最小化heap上的重复数据量
- 清理heap上未使用的数据以避免空间不足

>一旦我们理解了`所有权`，就不需要经常去想`stack`或`heap`了
>
>但是知道管理heap数据是所有权存在的原因，这有助于解释它为什么会这样工作

### 3.4 所有权规则

- 每个值都有一个变量，这个变量是该值的所有者
- 每个值同时只能有一个所有者
- 当所有者超出作用域`scope`时，该值将被删除

#### 3.4.1 变量作用域

`Scope`就是程序中一个项目的有效范围，这里跟其他语言类似

```rust
fn main() {
   // s不可用
   let s = "hello"; // s 可用 
                          // 可以对s进行相关操作
} // s 作用域到此结束，s不再可用

```

#### 3.4.2 内存与分配

这里我们用rust中比较特殊的一种数据结构`String`为例来研究研究

>字符串字面值，在编译时就知道它的内容了，其文本内容直接被硬编码到最终的可执行文件中
>
>- 这里的好处是速度快、高效（因为字符串的`不可变性`）
>
>`String`类型，为了支持可变性，需要在heap上分配内存来保证编译时未知的文本内容
>
>- 操作系统必须在运行时来申请内存（通过`String::from`来实现）
>- 当用完`String`之后，需要使用某种方式将内存返回给操作系统
>  - 如果是在有`GC`的语言中，`GC`会跟踪并清理不再使用的内存
>  - 没有`GC`，就需要我们去识别内存何时不再使用，并调用代码将它返回
>    - 如果忘了，就是浪费内存（内存泄露）
>    - 如果提前做了，变量就会变成非法的
>    - 如果做了两次，也会有问题。必须一次分配对应一次释放

rust采用了不同的方式：对于某个值来说，当拥有它的变量走出作用范围时，内存会立即自动的交还给操作系统

```rust
fn main() {
   let mut str = String::from("Hello");

   str.push_str(" world");

   println!("{}", str) // Hello world
}
// 当程序执行完之后会自动的调用`drop()`来清理heap的内存
```

#### 3.4.3 变量与数据交互之move

在其他语言中，如果这样做会出现`double free`的bug

```rust
let mut s1 = String::from("Hello");
let s2 = s1;
```

![image-20230715204544602](https://cdn.fengxianhub.top/resources-master/image-20230715204544602.png)

在rust中为了保证内存安全，并没有尝试复制被分配的内容

- rust的做法是让`s1`失效，当`s1`离开作用域时，也就不需要释放任何东西了
- 如果在作用域内使用`s1`，就会报错

![image-20230715204807880](https://cdn.fengxianhub.top/resources-master/image-20230715204807880.png)

这里要补充两个概念

- 浅拷贝（shallow copy）
- 深拷贝（deep copy）

我们也许可能认为上述复制`指针、长度、容量`是`浅拷贝`，但由于`rust`让`s1`失效了，所以这里我们用一个新的术语`移动（Move）`

这里隐含的一个设计原则：Rust不会自动创建数据的深拷贝

- 就运行时性能而言，任何自动赋值的操作都是廉价的

当然如果我们不想进行`move`，而想深拷贝的话可以使用`clone`方法，此方法主要针对的是`heap`上的数据

```rust
fn main() {
    let s1 = String::from("Hello");

    let s2 = s1.clone();

    println!("{} {}", s1, s2)
}
```

在stack上的数据我们只需要进行`复制`就可以了

```rust
fn main() {
    // 标量在声明的时候就可以确定大小了，所以分配在stack上
    // 对于这些值的操作永远都是非常快速的，所以没有深拷贝和浅拷贝的区别
    let x = 5;
    let y = x;
    println!("{} {}", x, y)
}

```

#### 3.4.4 所有权与函数

在语义上，将值传递给函数和把值赋给变量是类似的

- 将值传递给函数将发生`移动`或`复制`

```rust
fn main() {
    let s = String::from("hello world");
    // s的值进行了move，再后续作用域中就失效了
    take_ownership(s);

    let x = 5;
    // x是i32类型的，实现了copy这个trait，所以这里传入的是x的副本
    makes_copy(x);

    println!("x:{}", x) // x:5
}
// 当some_string执行完后rust就会调用drop释放其内存
fn take_ownership(some_string: String) {
    println!("{}", some_string)
}

fn makes_copy(some_number: i32) {
    println!("{}", some_number)
}
```

#### 3.4.5 返回值与作用域

函数在返回值的过程中同样也会发生所有权的转移

```rust
fn main() {
    let s1 = gives_ownership();
    println!("s1:{}", s1); // s1:hello worl
    let s2 = String::from("hello");
    println!("s2:{}", s2); // s2:hello
    let s3 = takes_and_gives_back(s2);
    // println!("s2:{}", s2); // s2已经move了，所以这里会报错
    println!("s3:{}", s3); // s3:hello
}

// 返回值所有权进行移动
fn gives_ownership() -> String {
    return String::from("hello world");
}

// move
fn takes_and_gives_back(a_string: String) -> String {
    a_string
}
```

一个变量的所有权总是遵循同样的模式

- 把一个值赋给其他变量时就会发生移动
- 当一个包含`heap`数据的变量离开作用域时，它的值就会被`drop`函数清理，除非数据的所有权移动到另一个函数上了

>那么如何让函数使用某个值，但是不获得其所有权呢？

```rust
fn main() {
    let s1 = String::from("hello");
    // 第一种方法是将其所有权传入函数，再由函数返回值将所有权返回
    let (s2, len) = calculate_length(s1);

    println!("The length of '{}' is {}.", s2, len)
}


fn calculate_length(s:String) -> (String, usize) {
    let length = s.len();

    (s, length)
}
```

>上面的方式太笨了，在rust中有一个特性`引用（Reference）`，可以解决上述的问题

#### 3.4.6 引用和借用

在上述例子中我们可以使用rust提供的reference进行传递，这样所有权就不会进行转移

```rust
fn main() {
    let s1 = String::from("hello");
    // 第二种方式，传入的是引用
    let len = calculate_length(&s1);

    println!("The length of '{}' is {}.", s1, len) // The length of 'hello' is 5.
}


fn calculate_length(s: &String) -> usize {
    let length = s.len();

    length
}
```

具体来说

- 参数的类型是`&String`而不是`String`
- `&`符号就表示引用：允许你引用某些值而不取得其所有权

这里我们马上可以引出第二个概念`借用`

- 我们把引用作为函数参数的行为称之为`借用`

那么我们是否可以修改借用的东西呢？答案是不行，`引用`和`变量`一样，默认是不可变的

![image-20230715213627906](https://cdn.fengxianhub.top/resources-master/image-20230715213627906.png)

我们可以给`引用`添加`mut`关键字让其`可变`

![image-20230715213827875](https://cdn.fengxianhub.top/resources-master/image-20230715213827875.png)

>注意☢：可变引用有一个重要的限制，在特定作用域内，对某一块数据，只能有`一个可变的引用`

![image-20230715214244447](https://cdn.fengxianhub.top/resources-master/image-20230715214244447.png)

这样的好处是可以在编译时防止数据竞争

但是以下三种行为下还是会发生数据竞争

- 两个或多个指针同时访问同一个数据
- 至少有一个指针用于写入数据
- 没有使用任何机制来同步对数据的访问

当然我们也可以通过创建新的作用域，来允许非同时的`创建多个可变引用`

```rust
fn main() {
    let mut s = String::from("Hello");
    {
      // s1的作用域和s2不一样，所以可以创建同一个变量的多个引用
      let s1 = &mut s;
    }
    let s2 = &mut s;
}
```

>注意☢：这里还有另外的一个限制
>
>- 不可以同时拥有一个可变引用和一个不变的引用
>- 多个不变的引用是可以的

![image-20230715221742641](https://cdn.fengxianhub.top/resources-master/image-20230715221742641.png)

#### 3.4.7 悬空引用（Dangline References）

悬空指针（Dangline  Pointer）：一个指针引用了内存中的某个地址，而这块内存可能已经释放并分配给其他人使用了

在Rust中，编译器可以保证引用永远都不是`悬空引用`

- 如果你引用了某些数据，编译器将保证在引用离开作用域之前数据不会离开作用域

![image-20230715222214492](https://cdn.fengxianhub.top/resources-master/image-20230715222214492.png)

#### 3.4.8 总结引用的规则

小结一下在rust中引用的规则

- 在任何给定的时刻，只能满足下列条件之一
  - 一个可变的引用
  - 任意数量不可变的引用
- 引用必须一直有效

### 3.5 切片

在rust中提供了一种不持有所有权的数据类型：切片（slice）

我们有一个案例来演示一下，在这个案例中我们要编写一个函数

- 它接受字符串作为参数
- 返回它在这个字符串里找到的第一个单词
- 如果函数没找到任何空格，那么整个字符串就会被返回

```rust
fn main() {
    let mut s = String::from("Hello world");
    let worldIndex = first_world(&s);

    println!("index {}", worldIndex) // index 5
}

fn first_world(s: &String) -> usize {
    let bytes = s.as_bytes();
    // enumerate会保证迭代器结果并保证为元组返回
    for (i, &item) in bytes.iter().enumerate() {
        if item == b' ' {
            return i;
        } 
    }
    return s.len();
}
```

但是这样写其实是有一些问题的，因为当索引返回后我们修改了字符串，索引不会对应进行改变

```rust
fn main() {
    let mut s = String::from("Hello world");
    let worldIndex = first_world(&s);
	s.clear(); // 清理字符串
    println!("index {}", worldIndex) // index 5 
}

```

针对这些问题rust提供了`字符串切片`

```rust
fn main() {
    let mut s = String::from("Hello world");
    // 字符串切片通过[开始索引..结束索引]
    let hello = &s[0..5]; // 左开右闭 可以使用语法糖简写为 `&s[..5]`
    let world = &s[6..11]; // 简写为 `&s[6..]` 还有 &s[..]; // 全切
    println!("{}{}", hello, world)
}
```

我们使用字符串切片改写下上面的案例

```rust
fn main() {
    let mut s = "Hello world    ";
    let worldIndex = first_world(s);

    s.trim();

    println!("{}", worldIndex);
}

// 返回值str表示返回一个切片
fn first_world(s: &str) -> &str {
    let bytes = s.as_bytes();
    // enumerate会保证迭代器结果并保证为元组返回
    for (i, &item) in bytes.iter().enumerate() {
        if item == b' ' {
            return &s[..i];
        }
    }
    &s[..]
}
```

#### 3.5.1 字符串切片作为参数传递

在上面的例子中我们使用`s: &String`作为参数，对于有经验的rust开发者会使用`&str`类型的参数

这样的好处是既可以传入`String`也可以传入`str切片`

## 4. struct

### 4.1 struct使用

直接上例子

```rust
fn main() {
    let u1 = User {
        username: String::from("张三"),
        email: String::from("zhangsan@gmail.com"),
        sign_in_count: 556,
        active: true,
    };
    println!("{:?}", u1); // 使用 {:?} 格式化标记，我们打印了结构体的调试表示
}

// 使用 #[derive(Debug)] 注解来自动实现 Debug trait
#[derive(Debug)]
struct User {
    username: String,
    email: String,
    sign_in_count: u64,
    active: bool,
}
```

当字段名和接收的参数名一样时可以简写

```rust
fn build_user(email: String, username: String) -> User {
    User {
        email, // 本来是email: email,可以简写为email
        username,
        active: true,
        sign_in_count: 0,
    }
}
```

>注意：这里需要注意的一点是，`struct`里面的字段要么全部声明为可变的，要么全部不可变

下面的例子中，就是声明了不可变的`struct`

![image-20230716112042845](https://cdn.fengxianhub.top/resources-master/image-20230716112042845.png)

### 4.2 struct更新语法

当我们想要基于某个struct实例来创建一个新实例的时候，可以使用struct更新语法

举个例子，下面的`user2`里面的`active`和`sign_in_count`字段是和`user1`里面一样

```rust
let u2 = User {
    username: String::from("张三"),
    email: String::from("zhangsan@gmail.com"),
    sign_in_count: u1.sign_in_count,
    active: u1.active,
};
```

这个时候我们就可以简写为

```rust
let u2 = User {
    username: String::from("张三"),
    email: String::from("zhangsan@gmail.com"),
    ..u1
};
```

### 4.3 Tuple struct

我们可以定义类似`Tuple`的`Struct`，叫做`Tuple struct`

- `Tuple struct`整体有个名，但里面的元素没有名
- 适用于想给整个`tuple`起名，并让它不同于其他`tuple`，而且又不需要给每个元素起名

我们可以这样定义`Tuple struct`：struct关键字 名字  元素类型

```rust
struct Color(i32, i32, i32);
struct Point(i32, i32, i32);
let black = Color(0, 0, 0);
let origin = Point(0, 0, 0);
```

注意：这里的`black`和`origin`是不同的类型，是不同的`Tuple struct`实例

### 4.4 Unit-Like Struct

我们可以定义没有任何字段的struct，叫做`Unit-Like struct`（因为与空元组`()`，单元类型类似）

`Unit-Like Struct`适用于需要在某个类型上实现某个`trait`，但是在里面又没有想要存储的数据

### 4.5 struct数据的所有权

我们的struct

```rust
struct User {
    username: String,
    email: String,
    sign_in_count: u64,
    active: bool,
}
```

这里的字段使用的是`String`而不是`&str`

- 该struct实例拥有其所有的数据
- 只要struct实例是有效的，那么里面的字段数据也是有效的

struct里也可以存放引用，但是需要使用到`生命周期`

- 生命周期可以保证只要struct实例是有效的，那么里面的引用也是有效的
- 如果struct里面存储引用，而不使用生命周期，就会报错

![image-20230716113629101](https://cdn.fengxianhub.top/resources-master/image-20230716113629101.png)

**小例子**

我们使用struct来完成一个计算长方形面积的小例子

```rust
fn main() {
   let rect = &Rectangle { width: 30, length: 50 };
   
   println!("{}", area(rect));
   // `{:?}` 打印简单的格式化内容 `{:#?}` 打印详细的格式化内容
   println!("{:?}", rect); // Rectangle { width: 30, length: 50 }
}

#[derive(Debug)]
struct Rectangle {
    width:u32,
    length:u32,
}

// 长方形的长和宽是有关联的
fn area(rect: &Rectangle) -> u32 {
    rect.width * rect.length
}
```

### 4.6 struct的方法

方法和函数类似：`fn`关键字、名称、参数、返回值

方法和函数的不同：

- 方法是在`struct(或enum、trait对象)`的上下文中定义
- 第一个参数是`self`，表示方法被调用的`struct`实例

那么如何定义方法呢？

- 在`impl`块里定义方法
- 方法的第一个参数可以是`&self`，也可以获得其所有权或可变借用。和其他参数一样

```rust
fn main() {
    let rect = &Rectangle {
        width: 30,
        length: 50,
    };

    println!("{}", rect.area());

    println!("{:?}", rect); // Rectangle { width: 30, length: 50 }
}

#[derive(Debug)]
struct Rectangle {
    width: u32,
    length: u32,
}

impl Rectangle {
    // 长方形的长和宽是有关联的
    fn area(&self) -> u32 {
        self.width * self.length
    }
}

```

**方法调用的运算符**

在rust中会自动引用和解引用，在调用方法时就会发生这种行为

在调用方法时，rust根据情况自动添加`&`、`&mut`或`*`，以便`object`可以匹配方法的签名

下面两行代码的效果是相同的

```rust
// 第一种
p1.distance(&p2);
// 第二种
(&p1).distance(&p2);
```

**方法参数**

方法可以有多个参数

```rust
fn main() {
    let rect = &Rectangle {
        width: 30,
        length: 50,
    };
    let rect2 = &Rectangle {
        width: 30,
        length: 50,
    };
    let rect3 = &Rectangle {
        width: 30,
        length: 50,
    };

    println!("rect 可以容纳 rect2 {}", rect.can_hold(&rect2));
    println!("rect 可以容纳 rect3 {}", rect.can_hold(&rect3));
}

#[derive(Debug)]
struct Rectangle {
    width: u32,
    length: u32,
}

impl Rectangle {
    // 长方形的长和宽是有关联的
    fn area(&self) -> u32 {
        self.width * self.length
    }

    fn can_hold(&self, other:&Rectangle) -> bool {
        self.width > other.width && self.length > other.length
    }
}

```

### 4.7 关联函数

可以在`impl`块里定义不把`self`作为第一个参数的函数，它们叫`关联函数（不是方法）`

- 例如：`String::from()`

关联函数通常用于构造器

```rust
fn main() {
    // 使用关联函数创建
    let rect = Rectangle::square(20);
    let rect2 = &Rectangle {
        width: 30,
        length: 50,
    };
    let rect3 = &Rectangle {
        width: 30,
        length: 50,
    };

    println!("rect 可以容纳 rect2 {}", rect.can_hold(&rect2));
    println!("rect 可以容纳 rect3 {}", rect.can_hold(&rect3));
}

#[derive(Debug)]
struct Rectangle {
    width: u32,
    length: u32,
}

impl Rectangle {
    // 长方形的长和宽是有关联的
    fn area(&self) -> u32 {
        self.width * self.length
    }

    fn can_hold(&self, other:&Rectangle) -> bool {
        self.width > other.width && self.length > other.length
    }

    // 关联函数
    fn square(size: u32) -> Rectangle {
        Rectangle { width: size, length: size }
    }
}
```

>每个函数可以拥有多个`impl`块

## 5. 枚举与模式匹配

### 5.1 枚举的使用

我们直接看枚举的例子

```rust
fn main() {
    // 使用枚举创建枚举值
    let four = IpAddrKind::IPV4;
    let six = IpAddrKind::IPV6;

    println!("{:?}", four); // IPV4
    println!("{:?}", six); // IPV6
}

// 我们将枚举类型里面的值称之为枚举的变体
#[derive(Debug)]
enum IpAddrKind {
    IPV4,
    IPV6
}
```

**我们可以将枚举嵌入到结构体中**

```rust
fn main() {
    let addr1 = IpAddr::new(IpAddrKind::IPV4, String::from("127.0.0.1"));

    println!("{:?}", addr1); // IpAddr { kind: IPV4, address: "127.0.0.1" }
}

// 我们将枚举类型里面的值称之为枚举的变体
#[derive(Debug)]
enum IpAddrKind {
    IPV4,
    IPV6
}

#[derive(Debug)]
struct IpAddr {
    kind: IpAddrKind,
    address: String
}

impl IpAddr {
    fn new(kind: IpAddrKind, address: String) -> IpAddr {
        IpAddr { kind: kind, address: address }
    }
}
```

**我们也可以将数据附加到枚举的变体中**

这样做的好处有

- 不需要额外使用`struct`
- 每个变体可以拥有不同的类型以及关联的数据量

```rust
fn main() {
    let addr1 = IpAddr::new(
        IpAddrKind::IPV4(127, 0, 0, 1), 
        String::from("127.0.0.1")
    );

    println!("{:?}", addr1); // IpAddr { kind: IPV4(127, 0, 0, 1), address: "127.0.0.1" }
}

// 我们将枚举类型里面的值称之为枚举的变体
#[derive(Debug)]
enum IpAddrKind {
    IPV4(u8, u8, u8, u8),
    IPV6(String)
}

#[derive(Debug)]
struct IpAddr {
    kind: IpAddrKind,
    address: String
}

impl IpAddr {
    fn new(kind: IpAddrKind, address: String) -> IpAddr {
        IpAddr { kind: kind, address: address }
    }
}
```

标准库里面的`IpAddr`也是使用枚举实现的

### 5.2 枚举的方法

枚举的方法和结构体的方法一样

```rust
// 我们将枚举类型里面的值称之为枚举的变体
#[derive(Debug)]
enum IpAddrKind {
    IPV4(u8, u8, u8, u8),
    IPV6(String),
}

impl IpAddrKind {
    fn newIpV4(u1 :u8, u2: u8,u3: u8,u4: u8) -> IpAddrKind {
        IpAddrKind::IPV4(u1, u2, u3, u4)
    }
}
```

### 5.3 Option枚举

- 定义在标准库中
- 在`Prelude(预导入模块)`中
- 描述了：某个值可能存在（某种类型）或不存在的情况

我们知道rust中没有`Null`，在其他语言中：

- `Null`是一个值，它表示`没有值`
- 一个变量可以处于两种状态：`空值(null)`、`非空`

>Null的作者在2009年的一次演讲称Null引用是`Billion Dollar Mistake`
>
>[文献链接](https://www.infoq.com/presentations/Null-References-The-Billion-Dollar-Mistake-Tony-Hoare/)
>
>- Null的问题在于：当你尝试像使用非`Null`值那样使用`Null`值的时候，就会引起某种错误（例如java中的NPE）
>- Null的概念还是有用的：因某种原因而变为无效或缺失的值

在Rust中提供了类似`Null`概念的枚举——`Option<T>`

在标准库中的定义是这样的

```rust
enum Option<T> {
    Some(T),
    None,
}
```

举个栗子叭

```rust
fn main() {
    // 前两个值是有效的值
    let some_number = Some(5);
    let some_string = Some("A String");
    // None表示这是一个无效的值
    let absent_number: Option<i32> = None;
}
```

>那么`Option<T>`比`Null`的设计好在哪呢?
>
>- `Option<T>`和`T`是不同的类型，不可以把`Option<T>`直接当做`T`进行使用
>- 如果想要使用`Option<T>`中的`T`，必须要将它转换为`T`。这样我们就可以在转换的过程中处理为`None`的情况，而不是像其他语言（例如Java的NPE）一样出现问题
>
>总结一下就是我们需要主动去处理`Null`的情况，不会出现`Null值泛滥`的情况

### 5.4 match

#### 5.4.1 match使用

在rust中提供了一个极为强大的控制流运算符`match`

- `match`允许一个值与一系列模式进行匹配，并执行匹配的模式对应的代码
- 这些模式可以是`子面值`、`变量名`、`通配符`等等

来个例子

```rust
fn main() {
    println!("penny {}", value_in_cents(Coin::Penny)) // penny 1
}

enum Coin {
    Penny,
    Nickel,
    Dime,
    Quarter,
}

fn value_in_cents(coin: Coin) -> u8 {
    match coin {
        Coin::Penny => 1,
        Coin::Nickel => 5,
        Coin::Dime => 10,
        Coin::Quarter => {
            println!("多行的情况需要加上花括号");
            25
        },
    }
}

```

**绑定值的模式**

匹配的分支可以绑定到被匹配对象的部分值，因此我们可以从`enum`变体中获取值

```rust
fn main() {
    println!("penny {}", value_in_cents(Coin::Quarter(UsState::Alabama))) // State quarter from Alabama\n penny 25 
}

#[derive(Debug)]
enum UsState {
    Alabama,
    Alaska,
}

enum Coin {
    Penny,
    Nickel,
    Dime,
    Quarter(UsState),
}

fn value_in_cents(coin: Coin) -> u8 {
    match coin {
        Coin::Penny => 1,
        Coin::Nickel => 5,
        Coin::Dime => 10,
        // 绑定值的模式匹配
        Coin::Quarter(state) => {
            println!("State quarter from {:?}", state);
            25
        },
    }
}

```

>在rust的match匹配中，必须要穷举所有的变体

但是如果`match`要匹配的`变体`太多了，我们不想处理那么多该怎么办呢？

- 可以使用通配符`_`来替代其余没列出的值

```rust
fn main() {
    let v = 0u8;
    match v {
        1 => println!("one"),
        2 => println!("two"),
        3 => println!("three"),
        // 其他的不想匹配了，可以使用`_`替代，下换线通配符只能放到最后一行
        _ => println!("other")
    }
}
```

#### 5.4.2 if let

上述的例子可以使用`if let`控制流进行改写

```rust
fn main() {
    let v = 0u8;
    match v {
        1 => println!("one"),
        2 => println!("two"),
        3 => println!("three"),
        // 其他的不想匹配了，可以使用`_`替代，下换线通配符只能放到最后一行
        _ => println!("other"),
    }
    // 可以使用let进行简写
    if let 3 = v {
        println!("three");
    } else {
        println!("other")
    }
}

```

小结一下`if let`的作用

- 处理只关心一种匹配二忽略其他匹配的情况
- 更少的代码、更少的缩进、更少的模板代码
- 放弃了穷举的可能
- 我们可以把`if let`当做是`match`的语法糖

#### 5.4.3 while let

一个与 `if let` 结构类似的是 `while let` 条件循环，它允许只要模式匹配就一直进行 `while` 循环。下面是展示了一个使用 `while let` 的例子，它使用 vector 作为栈并以先进后出的方式打印出 vector 中的值：

```rust
let mut stack = Vec::new();

stack.push(1);
stack.push(2);
stack.push(3);

while let Some(top) = stack.pop() {
    println!("{}", top);
}
```

这个例子会打印出 3、2 接着是 1。`pop` 方法取出 vector 的最后一个元素并返回 `Some(value)`。如果 vector 是空的，它返回 `None`。`while` 循环只要 `pop` 返回 `Some` 就会一直运行其块中的代码。一旦其返回 `None`，`while` 循环停止。我们可以使用 `while let` 来弹出栈中的每一个元素

### 5.5 匹配Option\<T>

```rust
fn main() {
    let five = Some(5);
    let six = plus_one(five);
    let none = plus_one(None);
    // 使用模式匹配和Option可以避免其他语言出现NPE的问题
    match six {
        Some(value) => println!("six: {}", value),
        None => println!("six: None"),
    }

    match none {
        Some(value) => println!("none: {}", value),
        None => println!("none: None"),
    }
}

fn plus_one(x: Option<i32>) -> Option<i32> {
    match x {
        None => None,
        Some(i) => Some(i + 1)
    }
}
```

## 6. package、crate、module

### 6.1 package、crate、定义module

首先我们来看一下rust的代码组织

- 哪些细节可以暴露，哪些细节是私有的
- 作用域内哪些名称有效
- 等等

我们也将代码组织称为`模块组织`，在rust中有以下的模块组织：

- Package(包)：Cargo的特性，让我们在构建、测试、共享crate
- Crate(单元包)：一个模块树，它可以产生一个`library`或可执行文件
- Module(模块)、use：让我们可以控制代码的组织、作用域、私有路径
- Path(路径)：为`struct`、`function`、或`module`等项命名的方式

>首先我们来看一下` Package、Crate`的结构:
>
>**crate的类型有**：
>
>- binary
>- library
>
>**Crate root**：
>
>- 是源代码文件
>- rust编译器从这里开始，组成你的`Crate`的根`Module`
>
>**一个Package可以有**：
>
>- 包含一个`Cargo.toml`，它描述了如何构建这些`Crates`
>- 只能包含0-1个`library crate`
>- 可以包含任意数量的`Binary crate`
>- 但必须至少包含一个`crate (library 或 binary)`

我们使用`cargo`构建一个新的`package`

![image-20230716165610914](https://cdn.fengxianhub.top/resources-master/image-20230716165610914.png)

在生成的文件中目录结构如下：

```shell
$  tree
|   .gitignore
|   Cargo.toml
|
\---src
        main.rs 
```

在cargo中有一些惯例：

- `src/main.rs`
  - 是`binary crate`的`crate root`
  - crate名字与package名相同
- `src/lib.rs`
  - package包含一个`library crate`
  - 这个文件也就是library crate的crate root
  - crate名与package名相同
- 一个package可以同时包含`src/main.rs`和`src/lib.rs`
  - 其实就是一个binary crate和一个library crate
  - 名称与package名相同
- 一个package可以有多个binary crate
  - 文件放在`src/bin`
  - 每个文件都是单独的`binary crate`

>Crate的作用
>
>- 将相关的功能组合到一个作用域内，便于在项目间进行分享（防止命名的冲突）
>  - 例如我们有一个叫做`rand`的crate，访问它的功能需要通过它的名字`rand`进行访问

**定义module来控制作用域和私有性**

>Module的作用有:
>
>- 在一个`crate`内，将代码进行分组
>- 增加可读性，易于复用
>- 控制项目（item）的私有性，例如public、private

那么如何创建`module`呢，其实使用`mod`关键字就可以了

- 使用mod关键字
- 可以嵌套
- 可以包含其他项（struct、enum、常量、trait、函数等）的定义

举个例子

```rust
mod front_of_house {
    mod hosting {
        fn add_to_waitlist(){}
        fn seat_at_table(){}
    }

    mod serving {
        fn take_order(){}
        fn serve_order(){}
        fn take_payment(){}
    }
}
```

这些`mod`是定义在`lib.rs`这个`crate`里面的，如果要看他们的层级结构，是这样的

```shell
crate(lib.rs)
|
\---front_of_house
	|
    \---hosting
    |	\---add_to_waitlist
    |	\---seat_at_table
    \---serving
    	|
   		 \---take_order
   		 \---serve_order
   		 \---take_payment
```

>`src/main.rs`和`src/lib.rs`叫做`crate roots`，这两个文件（任意一个）的内容形成了名为`crate`的模块，位于整个模块树的根部

### 6.2 路径（path）

#### 6.2.1 path使用

为了在rust的模块中找到某个条目，需要使用`路径`

路径有两种表示方式：

- 绝对路径：从`crate root`开始，使用crate名或字面值crate
- 相对路径：从当前模块开始，使用`self`、`super`或当前模块的标识符

路径至少由一个标识符组成，标识符之间使用`::`

举个例子（下面的代码在`lib.rs`这个crate下面）：

```rust
mod front_of_house {
    mod hosting {
        fn add_to_waitlist(){}
        fn seat_at_table(){}
    }

    mod serving {
        fn take_order(){}
        fn serve_order(){}
        fn take_payment(){}
    }
}

pub fn eat_at_restaurant() {
    // 绝对路径从crate开始(优先选择)
    crate::front_of_house::hosting::add_to_waitlist();
    // 相对路径
    front_of_house::hosting::add_to_waitlist();
}
```

如果我们build上面的代码其实是会报错的

![image-20230716173237727](https://cdn.fengxianhub.top/resources-master/image-20230716173237727.png)

这里引出一个知识点：私有边界（privacy boundary）

- 模块不仅可以组织代码，还可以定义私有边界
- 如果想把函数或struct等设为私有，可以将它放到某个模块中
- rust中所有的条目（函数、方法、struct、enum、模块、常量）默认都是私有的
- 父级模块无法访问子模块中的私有条目
- 子模块里可以使用所有祖父模块中的条目

我们修改下上面的代码后编译就可以正常通过了

```rust
pub mod front_of_house {
    pub mod hosting {
        pub fn add_to_waitlist(){}
        fn seat_at_table(){}
    }

    mod serving {
        fn take_order(){}
        fn serve_order(){}
        fn take_payment(){}
    }
}

pub fn eat_at_restaurant() {
    // 绝对路径从crate开始(优先选择)
    crate::front_of_house::hosting::add_to_waitlist();
    // 相对路径
    front_of_house::hosting::add_to_waitlist();
}
```

>使用pub关键字就可以将这些资源定义为公共的了
>
>rust中属性大部分都是默认私有的，需要加上pub关键字来暴露
>
>但是枚举只需要在枚举前加上pub其所有变体就都是公共的了
>
>```rust
>mod back_of_house {
>    // 只需要在枚举定义时加上pub，其变体就都是pub的了
>    pub enum Appetizer {
>        Soup,
>        Salad
>    }
>}
>```

我们在文件系统里面经常使用`..`来表示上级目录，在rust中使用的是`super`关键字

- super：用来访问父级模块路径中的内容，类似与文件系统中的`..`

  ```rust
  fn serve_order() {}
  
  mod back_of_house {
      fn fix_incorrent_order() {
          cook_order();
          // 使用super关键字调用上级
          super::serve_order();
          // 如果是绝对路径
          crate::serve_order()
      }
  
      fn cook_order(){}
  }
  ```

#### 6.2.2 use

use关键字可以将路径导入到作用域中

```rust
pub mod front_of_house {
    pub mod hosting {
        pub fn add_to_waitlist(){}
        fn seat_at_table(){}
    }
}
// 使用use关键字，但此时use的内容只能在当前作用域内访问
use crate::front_of_house::hosting;
// 如果加上pub关键字后，相当于把use的内容导出了，其他作用域也可以使用 (重导出)
// pub use crate::front_of_house::hosting;

pub fn eat_at_restaurant() {
    // 通过`use`导入可以直接使用
    hosting::add_to_waitlist();
}
```

use的习惯用法

- 函数：将函数的父级模块引入作用域（指定到父级）

  ```rust
  use std::collections::HashMap;
  
  fn main() {
      let mut map = HashMap::new();
      map.insert(1, 2);
  }
  ```

- struct、enum，其他：指定完整路径（指定到本身）

- 同名条目：指定到父级

#### 6.2.3 as关键字

as关键字可以为引入的路径指定本地的别名

```rust
use std::fmt;
use std::io;

fn f1() -> fmt::Result {}

fn f2() -> io::Result {}
```

可以使用as改写为

```rust
use std::fmt::Result;
use std::io::Result as ioResult;

fn f1() -> Result {}

fn f2() -> ioResult {}
```

#### 6.2.4 使用嵌套路径清理大量use语句

```rust
use std::cmp::Ordering;
use std::io;
// 可以写成下面的形式
use std::{io, cmp::Ordering}
```

还有一种情况是同级目录

```rust
use std::io;
use std::io::Write;
// 可以写成下面的形式
use std::{self, write};
```

我们可以使用`*`号将路径中所有的公共条目都引入到作用域（谨慎使用， 一般不用）

## 7. 常用的集合

在这里我们主要学习以下几种常用的集合类型

- Vector
- String
- HashMap

### 7.1 Vector

#### 7.1.1 Vector基本使用

`Vec<T>`叫做vector

- 由标准库提供
- 可以存储多个值
- 只能存储相同类型的数据
- 值在内存中连续存放

```rust
fn main() {
    // 创建vector
    let v:Vec<i32> = Vec::new();
    // 可以使用宏`vec!`来创建
    let mut v = vec![1, 2, 3];
    // 添加元素
    v.push(4);
    for ele in v.iter() {
        println!("{}", ele) // 打印v中的元素
    }
    // 删除vector
    // 当v离开作用域后，就会自动删除，堆里面的空间也会被回收
}
```

我们可以通过以下方法进行访问

```rust
fn main() {
    // 可以使用宏`vec!`来创建
    let v = vec![1, 2, 3];
    // 使用索引访问元素，如果越界就会发生panic
    let third = &v[2];
    println!("The third element is {}", third);
    // 也可以使用get来获取，越界会返回None这个变体，我们会进行处理
    match v.get(2) {
        Some(third) => println!("The third element is {}", third),
        None => println!("There is no third element"),
    }
}
```

**所有权和借用规则**

- 不能在同一作用域内同时拥有可变和不可变引用

举个例子：

![image-20230716193451099](https://cdn.fengxianhub.top/resources-master/image-20230716193451099.png)

**遍历**

```rust
fn main() {
    // 申明了一个可变的变量
    let  v = vec![1, 2, 3];
    for ele in v {
        println!("{}", ele)
    }
}
```

我们也可以在遍历的过程中修改里面的值

```rust
fn main() {
    // 申明了一个可变的变量
    let mut v = vec![1, 2, 3];
    for ele in &mut v {
        // 解引用
        *ele += 50;
    }
    // 再次打印
    for ele in v {
        print!("{} ", ele) // 51 52 53
    }
}

```

#### 7.1.2 使用enum来存储多种数据类型

我们知道vector只能存储同类型的数据，我们也知道枚举的变体是可以附加数据的

所以我们可以通过enum来让`vector`来存储多种数据类型

```rust
fn main() {
    // 通过可附加数据的枚举可以让vector存放不同的数据
    let row = vec![
        SpreadsheetCell::Int(3),
        SpreadsheetCell::Text(String::from("blue")),
        SpreadsheetCell::Float(10.12),
    ];
    println!("{:?}", row) // [Int(3), Text("blue"), Float(10.12)]
}

#[derive(Debug)]
enum SpreadsheetCell {
    Int(i32),
    Float(f64),
    Text(String),
}
```

### 7.2 String

在rust的核心语言层面，只有一个字符串类型：字符串切片`str (或 &str)`

字符串切片：是对存储在其他地方、utf-8编码的字符串的引用

- 字符串字面值：存储在二进制文件中，也是字符串切片

我们来看看`String`类型

- 来着`标准库`而不是核心语言
- 可增长、可修改、可以获得所有权

#### 7.2.1 字符串（String）基本操作

**创建**

```rust
fn main() {
    // 可以使用String自带的方法创建
    let s1 = String::from("hello world");

    // 可以通过字符串切片进行转换
    let s2 = "hello world".to_string();

    println!("{}", s2);
}
```

**更新**

- `put_str()`：可以把一个字符串切片附加到String

  ```rust
  fn main() {
      // 可以使用String自带的方法创建
      let mut s1 = String::from("hello");
      let s2 = "world".to_string();
      // push_str方法不会获得所有权，在后续作用域中还是可以使用
      s1.push_str(&s2);
  
      println!("{} {}", s1, s2); // helloworld world
  }
  ```

- `push()`：可以将单个字符附加到String

  ```rust
  fn main() {
      let mut s1 = String::from("hell");
      s1.push('o');
      println!("{}", s1); // hello
  }
  
  ```

- `+`：拼接字符串

  ```rust
  fn main() {
      let s1 = String::from("hello");
      let s2 = String::from(" world");
      // + 运算符前面要是一个String 后面是字符串切片或者字符串引用
      let s3 = s1 + &s2;
      println!("{}", s3); // hello world
      // s1不能使用了
      // 其实 + 运算符使用的是类似`fn add(self, s: &str) -> String {...}`的方法
      // 那为什么我们传入字符串引用也可以呢，rust这里使用解引用强制转换(deref coercion), 保持了作用域
      // 第一个参数并没有保存作用域，所以在`+`运算符之后使用就会报错
      println!("{}", s1);
      println!("{}", s2);
  }
  ```

- `format!`：我们也可以使用这个宏来拼接字符串（推荐使用，更加灵活）

  ```rust
  fn main() {
      let s1 = String::from("a");
      let s2 = String::from("b");
      let s3 = String::from("c");
  
      // let s3 = s1 + "-" + &s2 + "-" + &s3;
  
      // println!("{}", s3);
  
      // 我们可以使用宏format!，不会取得所有权
      let s3 = format!("{}-{}-{}", s1, s2, s3);
      println!("{}", s3); // a-b-c
      println!("{}", s1); // a
      println!("{}", s2); // b
  } 
  ```

  >String的内部结构：
  >
  >String其实是对`Vec<u8>`的包装，所以也可以使用Vec的一些API，例如`len()`方法

#### 7.2.2 字节、标量值、字形簇

字节（Bytes）、标量值（Scalar Values）、字形簇（Grapheme Clusters）

在rust中有三种看待字符串的方式：

- 字节：使用`bytes`
- 标量值：使用`chars()`
- 字形簇（最接近所谓的`字母`）：很复杂，标准库没有提供

>我们可以切割字符串，切割如果有问题就会panic

### 7.3 hashMap

#### 7.3.1 基本的CRUD操作

```rust
use std::collections::HashMap;

fn main() {
    // 创建
    let mut scores = HashMap::new();
    // 也可以使用两个Vector创建
    // let kVec = vec![String::from("blue"), String::from("yellow")];
    // let vVec= vec![10, 50];
    // let scores2 = kVec.iter().zip(vVec.iter()).collect();
    // 增
    let blue = String::from("blue");
    // 增
    // 如果传String，其所有权就会改变，所以这里借用所有权
    scores.insert(&blue, 10);
    // 查 返回的是option
    let score = scores.get(&blue);
    match score {
        Some(s) => println!("the score of blue is {}", s), // 10
        None => println!("cannot find score"),
    }
    // 遍历hashMap
    for (k, v) in &scores {
        println!("k:{} v:{}", k, v) // k:blue v:10
    }
    // 改 如果传入同样的k，后一次会覆盖前面的value
    scores.insert(&blue, 100);
    match scores.get(&blue) {
        Some(v) => println!("{}", v), // 100
        _ => println!("cannot find"),
    }
    // 删
    scores.remove(&blue);
    match scores.get(&blue) {
        Some(v) => println!("{}", v),
        _ => println!("cannot find"), // cannot find
    }
}
```

我们在插入的时候如果`传入同样的k，后一次会覆盖前面的value`

如果我们想要只在`K`不对应任何值的情况下，才插入`V`，可以使用`entry`方法

>**entry方法**：检查指定的`K`是否对应一个`V`
>
>- 参数为`K`
>- 返回`enum Entry`：表示值是否存在

```rust
use std::collections::HashMap;

fn main() {
    let mut scores = HashMap::new();

    scores.insert(String::from("blue"), 10);

    scores.entry(String::from("yellow")).or_insert(50);
    scores.entry(String::from("blue")).or_insert(100);

    for (k, v) in scores {
        println!("k:{}, v:{}", k, v) // k:yellow, v:50 k:blue, v:10
    }
}
```

我们分解一下上述过程，然后打印一下` scores.entry`的值

我们可以看到`entry`的两个变体`VacantEntry`和`OccupiedEntry`，这两个变体执行的逻辑并不一样

```rust
use std::collections::HashMap;

fn main() {
    let mut scores = HashMap::new();

    scores.insert(String::from("blue"), 10);

    let entry = scores.entry(String::from("yellow"));
    println!("entry:{:?}", entry); // entry:Entry(VacantEntry("yellow"))
    entry.or_insert(50);
    // scores.entry(String::from("blue")).or_insert(100);
    let entry = scores.entry(String::from("blue"));
    println!("entry:{:?}", entry); // entry:Entry(OccupiedEntry { key: "blue", value: 10, .. })
    entry.or_insert(100);
    for (k, v) in scores {
        println!("k:{}, v:{}", k, v) // k:yellow, v:50 k:blue, v:10
    }
}

```

>`Entry`的`or_insert()`方法返回：
>
>- 如果`K`存在，返回到对应的`V`的一个可变引用
>- 如果`K`不存在，将方法参数作为`K`的新值插入，返回到这个值的可变引用

我们来看个例子

```rust
use std::collections::HashMap;

fn main() {
    let text = "hello world   wonderful world";

    let mut map = HashMap::new();
    // split_whitespace 根据空格分割
    for word in text.split_whitespace() {
        let count = map.entry(word).or_insert(0);
        // 如果存在会返回value的可变引用 所以这里我们可以对value进行操作
        *count += 1;
    }

    println!("{:?}", map) // {"world": 2, "hello": 1, "wonderful": 1}
}

```

#### 7.3.2 Hash函数

在默认情况下，`hashMap`使用加密功能强大的`hash函数`，可以抵抗`DOS`攻击

- 不是可用的最快的Hash算法
- 但具有更好的安全性

我们可以通过指定不同的`hasher`来切换到另一个函数，这里的`hasher`是实现了`BuildHasher trait`的类型

## 8. 错误处理

Rust的可靠性很大程度上是依靠rust强大的错误处理来完成的

在Rust中错误可以分为两类：

- 可恢复的错误：例如文件未找到，可以再次尝试
- 不可恢复（bug）：例如访问的索引超出范围

在Rust中没有类似异常捕获的机制

- 可恢复的错误：`Result<T, E>`
- 不可恢复：提供宏`panic!`进行处理

### 8.1 panic!

当`panic!`宏执行的时候，会发生：

- 你的程序会答应一个错误信息
- 展开（unwind）、清理调用栈（Stack）
- 退出程序

我们为了应对panic，可以展开或者中止（abort）调用栈

默认情况下档panic发生时，我们可以选择

- 展开调用栈（工作量大）
  - rust沿着调用栈往回走
  - 清理每个遇到的函数中的数据
- 立即终止调用栈
  - 不进行清理，直接停止程序
  - 内存需要OS进行清理

>如果我们想要让二进制文件更小，可以设置将`展开`改为`中止`
>
>- 在`Cargo.toml`中设置`profile`的设置：`panic = 'abort'`

![image-20230717220429351](https://cdn.fengxianhub.top/resources-master/image-20230717220429351.png)

这里我们直接来一波测试

```rust
fn main() {
    panic!("crash and burn")
}
```

![image-20230717221124327](https://cdn.fengxianhub.top/resources-master/image-20230717221124327.png)

如果这个`panic!`不是发生在我们写的代码中，并且我们想要查看详细的堆栈信息的话可以`设置环境变量来查看panic！的回溯信息`来查看

测试代码：

```rust
fn main() {
   let arr =  vec![1,2,3];
   arr[1000];
}
```

设置环境变量并且运行

```shell
RUST_BACKTRACE=1
```

为了获取带有调试信息的回溯，必须启用调试符号（不带 `--release`）

### 8.2 Result与可恢复的错误

#### 8.2.1 Result处理错误

通常我们处理的错误都不会引起`panic`，针对这种错误，我们可以使用`Result`枚举处理

```rust
enum Result<T, E> {
    Ok(T),
    Err(E),
}
```

我们可以使用`match表达式`来处理

```rust
use std::{fs::File, io::ErrorKind};

fn main() {
   let f = File::open("hello.txt");
   let f = match f {
        Ok(file) => file,
        Err(error) => match error.kind() {
            ErrorKind::NotFound => match File::create("hello.txt") {
                Ok(fc) => fc,
                Err(e) => panic!("Error creating file: {:?}", e)
            }
            ohter_error => panic!("Error opening the file: {:?}", ohter_error)
        }
   };
}
```

上面的代码中我们使用许多`match`来处理错误，这种方式其实比较麻烦并且原始，我们可以闭包`closure`来简化

- `Result<T, E>`有很多方法，它们接受闭包作为参数
- 使用match实现

我们改良一下上面的代码

```rust
use std::{fs::File, io::ErrorKind};

fn main() {
    let f = File::open("hello.txt").unwrap_or_else(|error| {
        if error.kind() == ErrorKind::NotFound {
            File::create("hello.txt")
                .unwrap_or_else(|error| panic!("Error creating file: {:?}", error))
        } else {
            panic!("Error opening file: {:?}", error)
        }
    });
}

```

#### 8.2.2 unwrap&expect

在上面我们就使用`unwrap`来简化了`match`操作

`unwrap`的作用其实就是如果`Result`返回的结果是`Ok`就执行`Ok`里面的部分，如果不是就会`panic`

但是这样也不好，因为`panic`的信息可能并不是我们想要的，这个时候就可以使用`expect`来自定义信息

```rust
use std::fs::File;

fn main() {
    let f = File::open("test.txt").expect("无法打开文件");
}
```

![image-20230717224159667](https://cdn.fengxianhub.top/resources-master/image-20230717224159667.png)

### 8.3 传播错误

#### 8.3.1 基本处理

我们有的时候遇到了错误，但是不想自己处理，而是想要给程序调用者进行处理，这个时候就要用到传播错误

我们可以手动进行错误的传递

```rust
use std::{fs::File, io::{self, Read}};

fn main() {
    let r = read_username_from_file();
}

fn read_username_from_file() -> Result<String, io::Error> {
    let f = File::open("hello.txt");

    let mut f = match f {
        Ok(file) => file,
        Err(e) => return Err(e),
    };

    let mut s = String::new();

    match f.read_to_string(&mut s) {
        Ok(_) => Ok(s),
        Err(e) => Err(e)
    }
}

```

#### 8.3.2 ?运算符

上面的代码我们也可以进行简写

```rust
use std::{fs::File, io::{self, Read}};

fn main() {
    let r = read_username_from_file();
}

fn read_username_from_file() -> Result<String, io::Error> {
    let mut f = File::open("hello.txt")?;

    let mut s = String::new();

     f.read_to_string(&mut s)?;

     Ok(s)
}
```

这里`?`的作用我们总结一下：

- 如果`Result`是`Ok`：`Ok`中的值就是表达式的结果，然后继续执行程序
- 如果`Result`是`Err`：`Err`就是`整个函数`的返回值，就像使用了`return`一样

#### 8.3.3 ？与from函数

其实上面`？`运算符隐式的使用了`from`函数

- `Trait std::convert::From::from(value)`函数被用于错误的转换
- 被`?`所处理的错误，会隐式的被`from`函数所处理
- 当`?`调用`from`函数时，它所接收的错误类型会被转化为当前函数返回类型所定义的错误类型
- 针对不同错误原因，返回同一种错误类型（只要每个错误类型实现了转换为所返回的错误类型的from函数）

#### 8.3.4 ?与链式调用

上述的代码我们还可以进行链式调用

```rust
use std::{
    fs::File,
    io::{self, Read},
};

fn main() {
    let r = read_username_from_file();
}

// 进行链式调用
fn read_username_from_file() -> Result<String, io::Error> {
    let mut s = String::new();
    File::open("hello.txt")?.read_to_string(&mut s)?;
    Ok(s)
}

```

>最后一点需要注意的是：`？`运算符只能处理`Result`的类型

在`main`方法中也可以使用`？`运算符，只需要改写一下返回值就行

```rust
use std::{fs::File, error::Error};

fn main() -> Result<(), Box<dyn Error>> {
    let f = File::open("hello.txt")?;
    Ok(())
}
```

这里`Box<dyn Error>>`是`trait`对象，可以简单理解为：任何可能的错误类型

### 8.4 什么时候应该panic

总体原则：

- 在定义一个可能失败的函数时，优先考虑返回`Result`
- 否则就`panic!`

![image-20230717233203059](https://cdn.fengxianhub.top/resources-master/image-20230717233203059.png)



## 9. 泛型、Trait、生命周期

### 9.1 泛型

泛型在很多语言里都有，主要是为了提高抽象代码的能力，我们来看一段代码，比如我要找出`Vector`里面的最大值

```rust
fn main()   {
    let arr1 = vec![1,4,5,6,7,7];
    match max(&arr1) {
        Some(max_num) => println!("max num is {}", max_num), // max num is 
        None => println!("cannot find")
    }
    let arr2 = vec!['a', 'u', 's', 'e'];
    match max(&arr2) {
        Some(max_num) => println!("max num is {}", max_num), // max num is u
        None => println!("cannot find")
    }
}

// 泛型限制符，传入的类型必须实现这两个trait
fn max<T: PartialOrd + Copy>(arr: &Vec<T>) -> Option<T> {
    if arr.is_empty() {
        return None;
    }
    let mut max_num = arr[0];
    for &ele in arr.iter() {
        if ele > max_num {
            max_num = ele;
        }
    }
    Some(max_num)
}

```

**在结构体中定义泛型**

```rust
fn main() {
    let p1 = Point { x: 5, y: 5 };

    let p2 = Point { x: 5.5, y: 5.5 };
}

struct Point<T> {
    x: T,
    y: T,
}

```

**在枚举中定义泛型**

我们在之前已经见过很多枚举使用泛型的案例了

```rust
enum Option<T> {
    Some(T),
    None,
}

enum Result<T, E> {
    Ok(T),
    Err(E),
}
```

**方法定义中的泛型**

为`struct`或`enum`实现方法的时候，可在定义中使用泛型

注意：

- 把`T`放在`impl`关键字后，表示在类型`T`上实现方法：例如 `impl<T> Point<T>`
- 只针对具体类型实现方法（其余类型没实现方法）：例如`impl Point<f32>`

>此外：`struct`里泛型类型参数可以和方法的泛型类型参数不同

```rust
fn main() {
    let p1 = Point { x: 5, y: 5 };

    let p2 = Point { x:"Hello", y: 'c' };

    let p3 = p1.mixup(p2);

    println!("p3.x = {}, p3.y = {}", p3.x, p3.y) // p3.x = 5, p3.y = c
}

struct Point<T, U> {
    x: T,
    y: U,
}

impl<T, U> Point<T, U> {
    fn mixup<V, W>(self, other: Point<V, W>) -> Point<T, W> {
        Point {
            x: self.x,
            y: other.y,
        }
    }
}

```

**泛型代码的性能**

在rust中使用泛型不会影响性能，原因是rust使用的`单态化（monomorphization）`，在编译时就将泛型替换为具体的类型了

### 9.2 Trait

#### 9.2.1 定义和实现trait

```rust
fn main() {
   let artice = NewsArticle {
        headline:String::from("headline"),
        location: String::from("location"),
        author: String::from("author"),
        content: String::from("content"),
   };

   println!("NewsArticle: {} ", artice.summarize()) // NewsArticle: headline, by author (location
}


pub trait Summary {
    fn summarize(&self) -> String;
}

pub struct NewsArticle {
    pub headline: String,
    pub location: String,
    pub author: String,
    pub content: String,
}

// 实现trait
impl Summary for NewsArticle {
    fn summarize(&self) -> String {
        format!("{}, by {} ({})", self.headline, self.author, self.location)
    }
}
```

#### 9.2.2 实现trait的约束

可以在某个类型上实现某个`trait`的前提条件是：这个类型或这个`trait`是在本地`crate`里定义的

无法为外部类型来实现外部的`trait`：

- 这个限制是程序属性的一部分（也就是`一致性`）
- 更具体的说是`孤儿规则`：之所以这样命名是因为父类型不存在
- 此规则确保其他人的代码不能破坏你的代码，反之亦然
- 如果没有这个规则，两个`crate`可以为同一类型实现同一个`trait`，Rust就不知道应该使用那个实现了

#### 9.2.3 trait的默认实现

我们可以在trait中默认进行实现，只要不重写该方法，就可以使用默认方法

```rust
fn main() {
   let artice = NewsArticle {
        headline:String::from("headline"),
        location: String::from("location"),
        author: String::from("author"),
        content: String::from("content"),
   };

   println!("NewsArticle: {} ", artice.summarize()) // NewsArticle: default imp
}


pub trait Summary {
    fn summarize(&self) -> String {
        String::from("default impl")
    }
}

pub struct NewsArticle {
    pub headline: String,
    pub location: String,
    pub author: String,
    pub content: String,
}

// 实现trait
impl Summary for NewsArticle {
    // 使用默认实现
    // fn summarize(&self) -> String {
    //     format!("{}, by {} ({})", self.headline, self.author, self.location)
    // }
}
```

#### 9.2.4 trait的实现

这里一共有两种情况

第一种：`impl trait`语法，适用于简单情况

```rust
fn main() {
   let artice = NewsArticle {
        headline:String::from("headline"),
        location: String::from("location"),
        author: String::from("author"),
        content: String::from("content"),
   };

   println!("NewsArticle: {} ", artice.summarize()); // NewsArticle: default imp

   summarize(artice) // default impl
}


pub trait Summary {
    fn summarize(&self) -> String {
        String::from("default impl")
    }
}

pub struct NewsArticle {
    pub headline: String,
    pub location: String,
    pub author: String,
    pub content: String,
}

// 实现trait
impl Summary for NewsArticle {
    // 使用默认实现
    // fn summarize(&self) -> String {
    //     format!("{}, by {} ({})", self.headline, self.author, self.location)
    // }
}
// `impl trait`语法，适用于简单情况
fn summarize(s: impl Summary) {
   println!("{}",  s.summarize())
}
```

第二种：`Trait Bound语法`，可用于复杂情况。其实`impl trait`是`Trait Bound`的语法糖

```rust
fn summarize<T: Summary>(s: T) {
   println!("{}",  s.summarize())
}
```

#### 9.2.5 +号指定多个Trait

使用`+`可以约束必须实现多个`Trait`

```rust
fn summarize<T: Summary + Display>(s: T) {
   println!("{}",  s.summarize())
}
```

如果我们`Trait`约束比较多，我们就可以使用`where`来简化

```rust
fn summarize<T: Summary + Display, U: Clone + Dubug>(s: T, b: U) {
   println!("{}",  s.summarize())
}
```

简化为

```rust
fn summarize<T, U (s: T, b: U) 
    where 
        T:Summary + Display,
        U: Clone + Debug 
{
   println!("{}",  s.summarize())
}
```

#### 9.2.6 实现Trait作为返回类型

我们可以约束返回类型必须实现Trait，但是如果出现分支语句就可以能报错

这样是可以的

```rust
fn summarize<T: Summary>(s: T) -> impl Summary {
    println!("{}",  s.summarize());
    NewsArticle {
        headline:String::from("headline"),
        location: String::from("location"),
        author: String::from("author"),
        content: String::from("content"),
   }
 }
```

这样是不行的，返回的类型必须是确定的，是同一种类型

![image-20230718223540834](https://cdn.fengxianhub.top/resources-master/image-20230718223540834.png)

#### 9.2.7 使用Trait Bound有条件的实现方法

在使用泛型参数的`impl`块上使用`Trait Bound`，我们可以有条件的为实现了特定`Trait`的类型来实现方法

```rust
struct Pair<T> {
    x: T,
    y:T
}

impl <T> Pair<T> {
    fn new(x: T, y: T) -> Self {
        Self {x, y}
    }
}


// 使用`cmp_display`方法，传入的参数必须实现这两个trait
impl <T: Display + PartialOrd> Pair<T> {
    fn cmp_display(&self) {
        if self.x >= self.y {
            println!("The largest member is x = {}", self.x)
        } else {
            println!("The largest member is y = {}", self.y)
        }
    }
}
```

为满足`Trait Bound`的所有类型上实现`Trait`叫做覆盖实现`blanket implementations`

![image-20230718225206069](https://cdn.fengxianhub.top/resources-master/image-20230718225206069.png)

例如所有的数字都实现了`Display`这个`Trait`，所以可以使用`to_string`方法

```rust
fn main() {
    let str = 2.to_string();
}
```

### 9.3 生命周期

>- 在rust中每个引用都有自己的生命周期
>
>- 生命周期：引用保持有效的作用域
>- 大多数情况：生命周期是隐式的、可被推断的
>- 当引用的生命周期可能以不同的方式互相关联时：需要手动标注生命周期

这里我们得知道生命周期存在的意义是为了避免 **悬垂引用**（dangling reference）

我们来看一个关于生命周期的例子

![image-20230719201936165](https://cdn.fengxianhub.top/resources-master/image-20230719201936165.png)

这里就是因为`x`的生命周期没有`r`长所导致的

#### 9.3.1 生命周期标注语法

生命周期的标注不会改变引用的生命周期长度

当指定了泛型生命周期参数，函数可以接受带有任何生命周期的引用

生命周期的标注：描述了多个引用的生命周期间的关系，但不会影响生命周期

>生命周期参数名：
>
>- 以`'`开头
>- 通常全小写且非常短
>- 很多人使用`'a`
>
>生命周期标注的位置：
>
>- 在引用的`&`符号
>- 使用空格将标注和引用类型分开
>
>我们来看一些例子
>
>```rust
>&i32  // 一个引用
>&'a i32 // 带有显式生命周期的引用
>&'a mut i32 // 带有显式生命周期的可变引用
>```
>
>这里我们需要注意的是：单个生命周期标注本身没有意义

我们来看一个例子

![image-20230719205955477](https://cdn.fengxianhub.top/resources-master/image-20230719205955477.png)

上面的代码我们只需要添加上生命周期的标注即可

```rust
fn main() {
    let s1 = String::from("abcd");
    let s2 = "xyz";

    let result = longest(s1.as_str(), s2);

    println!("The longest string is {}", result);
}

fn longest<'a>(x: &'a str, y: &'a str) -> &'a str {
    if x.len() > y.len() {
        x
    } else {
        y
    }
}  
```

这里需要注意的是，rust默认返回的值的生命周期是参数中生命周期较短的那个

比如下面的代码就会报错，原因是`s2`生命周期较短，但是在作用域后还可能会调用

![image-20230719215910978](https://cdn.fengxianhub.top/resources-master/image-20230719215910978.png)

让我们深入进行理解生命周期

- 从函数返回引用时，返回类型的生命周期参数需要与其中一个参数的生命周期匹配，如果返回的引用没有指向任何参数，那么它只能引用函数内创建的值（这就是悬垂引用：改值在函数结束时就走出了作用域）

我们举个`悬垂引用`的例子，当我们返回的引用指向的内存已经被清理的时候，当然就会出问题

![image-20230719220710385](https://cdn.fengxianhub.top/resources-master/image-20230719220710385.png)

针对上面的代码我们可以直接返回变量本身，将所有权转移出去即可

![image-20230719220854406](https://cdn.fengxianhub.top/resources-master/image-20230719220854406.png)

#### 9.3.2 结构体中生命周期标注

struct里可以包括

- 自持有的类型
- 引用：需要在每个引用上添加生命周期标准

**输入、输出生命周期**

生命周期在：

- 函数/方法的参数：输入生命周期
- 函数/方法的返回值：输出生命周期

#### 9.3.3 生命周期省略的三个规则

编译器使用三个规则在没有显式标注生命周期的情况下，来确定引用的生命周期

- 规则一：应用于输入生命周期
- 规则二三应用于输出生命周期
- 如果编译器应用完三个规则之后，任然有无法确定生命周期的引用，**就会报错**
- 这些规则同样适用于`fn`定义和`impl`块

>规则一：每个引用类型的参数都有自己的生命周期
>
>规则二：如果只有一个输入生命周期参数，那么该生命周期被赋给所有的输出生命周期参数
>
>规则三：如果有多个输入生命周期参数，但其中一个是`&self`或`&mut self`（是方法），那么`self`的生命周期会被赋给所有的输出生命周期参数

我们针对上面的三条规则来举几个例子，这里需要假设我们是编译器

```rust
// 原代码
fn first_world(s: &str) -> &str { ... }
// 编译器运用第二条规则 添加输入生命周期
fn first_world<'a>(s: &'a str) -> &str { ... }
// 编译器运用第三条规则，添加输出生命周期
fn first_world<'a>(s: &'a str) -> &'a str { ... }
// 这样就是没啥问题的 编译通过
```

我们再来看个例子

```rust
// 原代码
fn longest(x: &str, y: &str) -> &str { ... }
// 编译器运用第一条规则，给每个参数都添加了生命周期
fn longest<'a, 'b>(x: &'a str, y: &'b str) -> &str { ... }
```

#### 9.3.4 方法定义中的生命周期标注

在`struct`上使用生命周期实现方法，语法和泛型参数的语法一样

在哪声明和使用生命周期参数，依赖于：

- 生命周期参数是否和字段、方法的参数或返回值有关

struct字段的生命周期名：

- 在`impl`后声明
- 在`struct`名后使用
- 这些生命周期是`struct`类型的一部分

impl块内的方法签名中：

- `引用`必须绑定与struct字段引用的生命周期，或者`引用`是独立的也可以
- 生命周期省略规则经常使得方法中的生命周期标注不是必须的

```rust
fn main() {
    let novel = String::from("Call me Ishmael, Some years age...");
    let first_sentence = novel.split('.')
        .next()
        .expect("Could not found a 'a'");
    let i = ImportantExcerpt{ part: first_sentence };
}


struct ImportantExcerpt<'a> {
    part: &'a str,
}

impl<'a> ImportantExcerpt<'a> {
    // 根据第一条省略规则可以不为self添加省略规则
    fn level(&self) -> i32 {
        3
    }
    // 根据第一条规则为self添加生命周期
    // 根据第三条规则，当输入生命周期有self时，输出生命周期将拥有self的生命周期
    fn announce_and_return_part(&self, annoucement: &str) -> &str {
        println!("Attention please: {}", annoucement);
        self.part
    }
}
```

#### 9.3.5 静态生命周期

`static`是一个特殊的生命周期：整个程序的持续时间

- 例如：所有字符串字面值都拥有`static`生命周期

  ```rust
  let s: &'static str = "I have a static lifetime"
  ```

为引用指定`static`生命周期前要三思：是否需要引用在程序整个生命周期内都存活

### 9.4 综合例子

我们来看一个泛型参数类型、Trait Bound、生命周期的例子

```rust
fn longest_with_an_announcement<'a, T> (x: &'a str, y: &'a str, ann: T) -> &'a str where T: Display {
    println!("Announcement! {}", ann);
    if x.len() > y.len() {
        x
    } else {
        y
    }
}
```

## 10. 自动化测试

测试通常需要执行三个操作（3A操作 Arrange, Act, Assert）

- 准备数据/状态 
- 运行被测试的代码
- 断言结果

测试函数需要使用`test`属性（attribute）进行标注

- Attribute就是一段Rust代码的元数据
- 在函数上加`#[test]`，可以把函数变成测试函数
- 使用`cargo test`命令来运行所有测试函数
- 默认使用cargo创造的`Library`项目，默认会有一个`test module`，当然我们可以自己再进行添加

**举个例子**

```shell
$ cargo new test-project --lib
     Created library `test-project` package

$ cd test-project/src/

$ cat lib.rs
pub fn add(left: usize, right: usize) -> usize {
    left + right
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn it_works() {
        let result = add(2, 2);
        assert_eq!(result, 4);
    }
}

$ cargo test
   Compiling test-project v0.1.0 (E:\workspacesJ2SE_VSCode\rust\rustStudy\test-project)
    Finished test [unoptimized + debuginfo] target(s) in 2.50s                                                          
     Running unittests src\lib.rs (target\debug\deps\test_project-9a1280a4860686ce.exe)

running 1 test
test tests::it_works ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

   Doc-tests test-project

running 0 tests

test result: ok. 0 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s
```

### 10.1 测试常用宏

![image-20230719233539762](https://cdn.fengxianhub.top/resources-master/image-20230719233539762.png)

### 10.2 自定义错误信息

![image-20230719233843610](https://cdn.fengxianhub.top/resources-master/image-20230719233843610.png)

### 10.3 验证错误处理的情况

我们可以使用`should_panic`属性来验证待测试 代码是否会panic，如果panic则测试通过

![image-20230719234200436](https://cdn.fengxianhub.top/resources-master/image-20230719234200436.png)

可以在属性中添加期待的panic信息

![image-20230719234402486](https://cdn.fengxianhub.top/resources-master/image-20230719234402486.png)

### 10.4 使用Result枚举进行测试

如果不会发生panic，可以使用`Result<T, E>`作为返回类型编写测试

- 返回OK：通过
- 返回Err：失败

### 10.5 测试参数

我们可以通过添加测试参数来控制测试的行为

```rust
cargo test --help // 查看帮助
cargo test -- --help // 查看可以在--后的参数 针对二进制文件使用 -- --的形式
```

### 10.6 并行运行测试

运行多个测试，默认使用多个线程并行运行，要确保好线程安全性

```rust
cargo test -- --test-threads=1 // 控制运行线程的为1
```

### 10.7 显示函数输出

默认测试通过是不会打印`println!`里面的内容，如果测试失败会看到里面的内容

```rust
cargo test -- --show-output // 成功的例子中也要打印
```

### 10.8 指定测试用例

```rust
cargo test 测试名称 // 指定测试用例 只能指定一个
cargo test test   // 会执行所有以 test开头的测试用例
```

**忽略测试**

![image-20230719235954078](https://cdn.fengxianhub.top/resources-master/image-20230719235954078.png)

只执行ignore的测试

```rust
cargo test -- --ignored // 注意有个d
```

### 10.9 测试分类

在rust中测试分为单元测试和集成测试

#### 10.9.1 单元测试

![image-20230720000348363](https://cdn.fengxianhub.top/resources-master/image-20230720000348363.png)



![image-20230720000423433](https://cdn.fengxianhub.top/resources-master/image-20230720000423433.png)

#### 10.9.2 集成测试

在rust中集成测试完全位于被测试库的外部

目的：是测试被测试库的 多个部分是否能正确的一起工作

- 只会在`cargo test`的时候才会编译

![image-20230720000936462](https://cdn.fengxianhub.top/resources-master/image-20230720000936462.png)

## 11. 闭包

>闭包：可以捕获其所在环境的匿名函数
>
>- 是匿名函数
>- 保存为变量、作为参数
>- 可在一个地方创建闭包，然后在另一个上下文中调用闭包来完成运算
>- 可从其定义的作用域捕获值

为了搞懂闭包的作用，我们来看一段例子

```rust
fn main() {
    let add = |a, b| a + b;
    let result = add(2, 3);
    println!("Result: {}", result);
}
```

这里的闭包省略的返回值，因为编译器会自动进行返回，但是这种绑定是一次性的，如果下次再传入不一样类型的值就会报错

![image-20230726220216054](https://cdn.fengxianhub.top/resources-master/image-20230726220216054.png)

这里我们来一个小案例（运动计划）来看看闭包的作用以及一些使用的最佳实践，这里我们也是通过`闭包`来实现了一个运动计划的小案例

```rust
use std::{thread, time::Duration};

fn main() {
   let simulated_user_specified_value = 10;
   let simulated_random_number = 7;

   generate_workout(simulated_user_specified_value, simulated_random_number);
}


fn generate_workout(intensity:u32, random_number:u32) {
    // 闭包
    let expensive_closure = |num| {
        println!("calculating slowly...");
        thread::sleep(Duration::from_secs(2));
        num
    };
    if intensity < 25 {
        // 再后续编译器可以推断出闭包能够返回的类型
        println!("Today, do {} pushups!", expensive_closure(intensity));
        println!("Next, do {} situps!", expensive_closure(intensity));
    } else {
        if random_number == 3 {
            println!("Take a break today! Remember to stay hydrated");
        } else {
            println!("Today, run for {} minutes", expensive_closure(intensity));
        }
    }
}

```

### 11.1 使用泛型参数和Fn Trait来存储闭包

在我们上面运动计划的小案例中，我们看到闭包其实被调用了两次，执行了多次比较耗时的操作

其实我们可以创建一个`struct`，它持有闭包及其调用结果（第一次调用的时候就缓存起来）

这种模式通常叫做`记忆化 (memoization)`或`延迟计算(lazy evaluation)`

>如果让struct持有闭包
>
>- struct的定义需要知道所有字段的类型，需要指明闭包的类型
>- 每个闭包实例都有自己唯一的匿名类型，即使两个闭包签名完全一样
>- 所以需要使用：泛型和`Trait Bound`

在标准库中提供了许多`Fn Trait`，所有的闭包都至少实现了以下`Trait`之一：

- Fn
- FnMut
- FnOnce

我们这里修改一下上面的案例

```rust
use std::{thread, time::Duration};

fn main() {
    let simulated_user_specified_value = 10;
    let simulated_random_number = 7;

    generate_workout(simulated_user_specified_value, simulated_random_number);
}

struct Cacher<F>
where
    F: Fn(u32) -> u32,
{
    calculation: F,
    value: Option<u32>,
}

impl<F> Cacher<F>
where
    F: Fn(u32) -> u32,
{
    fn new(calculation: F) -> Cacher<F> {
        Cacher {
            calculation,
            value: None,
        }
    }

    fn value(&mut self, arg: u32) -> u32 {
        match self.value {
            Some(v) => v,
            None => {
                let v = (self.calculation)(arg);
                self.value = Some(v);
                v
            }
        }
    }
}

fn generate_workout(intensity: u32, random_number: u32) {
    // 闭包
    let mut expensive_closure = Cacher::new(|num| {
        println!("calculating slowly...");
        thread::sleep(Duration::from_secs(2));
        num
    });
    if intensity < 25 {
        // 再后续编译器可以推断出闭包能够返回的类型
        println!("Today, do {} pushups!", expensive_closure.value(intensity));
        println!("Next, do {} situps!", expensive_closure.value(intensity));
    } else {
        if random_number == 3 {
            println!("Take a break today! Remember to stay hydrated");
        } else {
            println!(
                "Today, run for {} minutes",
                expensive_closure.value(intensity)
            );
        }
    }
}

#[cfg(test)]
mod tests {
    #[test]
    fn call_with_defferent_values() {
        let mut c = super::Cacher::new(|a| a);
        let v1 = c.value(1);
        let v2 = c.value(2);
        assert_eq!(v2, 2)
    }
}

```

但是如果我们执行test会发现会失败，因为我们没有比较传入的值，而是直接将结果缓存

现在我们用`HashMap`进行优化

- key：arg参数
- value：执行闭包的结果

```rust
use std::{thread, time::Duration, collections::HashMap, hash::Hash};

fn main() {
    let simulated_user_specified_value = 10;
    let simulated_random_number = 7;

    generate_workout(simulated_user_specified_value, simulated_random_number);
}

struct Cacher<F>
where
    F: Fn(u32) -> u32,
{
    calculation: F,
    value: HashMap<u32, u32>,
}

impl<F> Cacher<F>
where
    F: Fn(u32) -> u32,
{
    fn new(calculation: F) -> Cacher<F> {
        Cacher {
            calculation,
            value: HashMap::new(),
        }
    }

    fn value(&mut self, arg: u32) -> u32 {
        match self.value.get(&arg) {
            Some(v) => *v,
            None => {
                let v = (self.calculation)(arg);
                self.value.insert(arg, v);
                v
            },
        }
    }
}

fn generate_workout(intensity: u32, random_number: u32) {
    // 闭包
    let mut expensive_closure = Cacher::new(|num| {
        println!("calculating slowly...");
        thread::sleep(Duration::from_secs(2));
        num
    });
    if intensity < 25 {
        // 再后续编译器可以推断出闭包能够返回的类型
        println!("Today, do {} pushups!", expensive_closure.value(intensity));
        println!("Next, do {} situps!", expensive_closure.value(intensity));
    } else {
        if random_number == 3 {
            println!("Take a break today! Remember to stay hydrated");
        } else {
            println!(
                "Today, run for {} minutes",
                expensive_closure.value(intensity)
            );
        }
    }
}

#[cfg(test)]
mod tests {
    #[test]
    fn call_with_defferent_values() {
        let mut c = super::Cacher::new(|a| a);
        let v1 = c.value(1);
        let v2 = c.value(2);
        assert_eq!(v2, 2)
    }
}

```

### 11.2 使用闭包捕获环境

闭包可以访问定义它作用域内的变量，函数不可以

```rust
fn main() {
    let x = 4;
    let equal_to_x = |z| z == x;
    
    let y = 4;
    assert!(equal_to_x(y)); // true
}
```

闭包从所在环境捕获值的方式有（与函数获得参数的三种方式一样）：

- 获得所有权：FnOnce（值捕获）
- 可变借用：FnMut（引用捕获）
- 不可变借用：Fn

创建闭包时，通过闭包对环境值的使用，Rust推断出具体使用哪个`Trait`

- 所有的闭包都实现了`FnOnce`
- 没有移动捕获变量的实现了`FnMut`
- 无需可变访问捕获变量的闭包实现了`Fn`

所有实现了`Fn`的都实现了`FnMut`，所有实现了`FnMut`的都实现了`FnOnce`，即`FnOnce{ FnMut { Fn } }`

>move关键字
>
>在参数列表前使用`move`关键字，可以强制闭包取得它所使用的环境值的所有权
>
>- 当将闭包传递给新县城以移动数据使其归新线程所有时，此技术最为有用

![image-20230726234648106](https://cdn.fengxianhub.top/resources-master/image-20230726234648106.png)

我们来看一下最佳实践

- 当指定`Fn trait bound`之一时，首先用`Fn`，基于闭包体的情况，如果需要`FnOnce`或`FnMut`，编译器会再告诉你

### 11.3 迭代器

迭代器：对一系列执行某些任务

迭代器负责：

- 遍历每个项
- 确定序列（遍历）何时完成

Rust的迭代器

- 懒惰的：除非调用消费迭代器的方法，否则迭代器本身没有任何效果



#### 11.3.1 Iterator trait和next方法

所有的迭代器都实现了`Iterator trait`，`Iterator trait`定义于标准库，定义大致如下：

```rust
pub trait Iterator {
    type Item;
    
    fn next(&mut self) -> Option<Self::Item>;
}
```

`type Item`和`Self::Item`定义了与此该`trait`关联的类型，实现`Iterator trait`需要定义一个`Item`类型，它用于`next`方法的返回类型（迭代器的返回类型）

- `Iterator trait`仅要求实现一个方法：`next`
- next：
  - 每次返回迭代器中的一项
  - 返回结果包裹在`Some`里
  - 迭代结束，返回`None`
- 所以可以直接在迭代器上调用`Next`方法

```rust
#[test]
fn iterator_demonstration() {
    let v1 = vec![1, 2, 3];
    let mut v1_iter = v1.iter();
    assert_eq!(v1_iter.next(), Some(&1));
    assert_eq!(v1_iter.next(), Some(&2));
    assert_eq!(v1_iter.next(), Some(&3));
}
```

`for in` 循环其实是语法糖，本质也是通过获取到迭代器的所有权，然后通过`match result`，直到遇到`None` ，`IntoIterator`是个`tarit`，它的`into_iter`方法会取得 `for .. in ..`中 `in` 右边的东西

>**我们总结一下这几种迭代方法**
>
>- `iter`方法：在不可变引用上创建迭代器
>- `into_iter`方法：创建的迭代器会获得所有权

#### 11.3.2 消耗迭代器的方法

在标准库中，`Iterator trait`有一些带默认实现的方法，其中有一些方法会调用`next`方法

- 实现`Iterator trait`时必须实现`next`方法的原因之一
- 调用`next`的方法叫做`消耗性适配器`

定义在`Iterator trait`上的另外一些方法叫做`迭代器适配器`，即 **把迭代器转换为不同种类的迭代器**

可以通过链式调用使用多个迭代器是配置来执行复杂的操作，这种调用可读性较高

例如：**map**

- 接受一个闭包，闭包作用于每个元素
- 产生一个新的迭代器

```rust
#[test]
fn iterator_sum() {
    let v1 = vec![1, 2, 3];
    // collect就是一个消耗性的方法
    let v2: Vec<_> = v1.iter().map(|x| x + 1).collect();
    println!("{:?}", v2) // [2, 3, 4]
}
```

#### 11.3.3 创建自定义迭代器

我们自定义一个迭代器并且实现`next`方法

```rust
struct Counter {
    count: u32,
}

impl Counter {
    fn new() -> Counter {
        Counter { count: 0 }
    }
}

impl Iterator for Counter {
    type Item = u32;

    fn next(&mut self) -> Option<Self::Item> {
        if self.count < 5 {
            self.count += 1;
            Some(self.count)
        } else {
            None
        }
    }
}

#[test]
fn calling_next_directly() {
    let mut counter = Counter::new();

    assert_eq!(counter.next(), Some(1));
    assert_eq!(counter.next(), Some(2));
    assert_eq!(counter.next(), Some(3));
    assert_eq!(counter.next(), Some(4));
    assert_eq!(counter.next(), Some(5));
    assert_eq!(counter.next(), None);
}

#[test]
fn using_other_iterator_trait_methods() {
    let sum: u32 = Counter::new()
        .zip(Counter::new().skip(1))
        .map(|(a, b)| a * b)
        // 2、6、12、20
        .filter(|x| x % 3 == 0)
        // 6、12
        .sum();
    assert_eq!(18, sum);
}

```

#### 11.3.4 循环&迭代器性能对比

迭代器其实在底层编译之后会编程for循环的形式，我们将其称之为`零开销抽象(Zero-Cost Abstraction)`，即使用抽象时不会引入额外的运行时开销

## 12. cargo、crates.io

在这里我们主要学习：

- 通过`release profile`来自定义构建
- 在`https://crates.io`上发布库
- 通过`workspaces`组织大工程
- 从`https://crates.io/`来安装库
- 使用自定义命令扩展`cargo`

### 12.1 通过release profile自定义构建

release profile：

- 是预定义的
- 可自定义，可使用不同的配置，对代码编译拥有更多的控制

每个`profile`的配置都独立于其他的`profile`

>Cargo主要的两个profile：
>
>- dev profile：适用于开发，`cargo build`
>- release profile：适用于发布，`cargo build --release`

那么如何自定义profile呢？

- 针对每个profile，Cargo都提供了默认的配置
- 如果想自定义`xxx profile`的配置，可以在`Cargo.toml`里添加`[profile.xxxx]`区域，在里面覆盖默认配置的子集

![image-20230730130956144](https://cdn.fengxianhub.top/resources-master/image-20230730130956144.png)

>更多的命令可以在这里看到：https://doc.rust-lang.org/stable/cargo/

### 12.2 发布crate到crates.io

#### 12.2.1 文档注释

我们先了解一下rust的文档注释

使用`///`进行注释，举个例子

![image-20230730131535544](https://cdn.fengxianhub.top/resources-master/image-20230730131535544.png)

我们可以使用`cargo doc`命令生成文档，它会运行`rustdoc`工具（rust安装包会自带）

```shell
$ cargo doc --open
 Documenting rustDemo01 v0.1.0 (E:\workspace\vscode\rustStudy\rustDemo01)
    Finished dev [unoptimized + debuginfo] target(s) in 0.29s
     Opening E:\workspace\vscode\rustStudy\rustDemo01\target\doc\rustDemo01\index.html
```

![image-20230730134413907](https://cdn.fengxianhub.top/resources-master/image-20230730134413907.png)

上面的例子中`# Examples`表示的是章节，还有几个其他的常用章节：

- Panics：函数可能发生`panic`的场景
- Errors：如果函数返回`Result`，描述可能的错误种类，以及可导致错误的条件
- Safety：如果函数处于`unsafe`调用，就应该解释函数`unsafe`的原因，以及调用者确保的使用前提

>文档注释作为测试：
>
>示例代码块的附加值：
>
>- 运行`cargo test`：将把文档注释中的示例代码作为测试来运行
>
>再上面的例子中我们就写过一个`Example`，当我们`cargo test`的时候就会执行里面的测试的代码
>
>![image-20230730133624560](https://cdn.fengxianhub.top/resources-master/image-20230730133624560.png)

#### 12.2.2 为包含注释的项添加文档注释

使用符号`//!`来对crate进行描述注释（注意这种注释只能出现在最前面）

![image-20230730134950905](https://cdn.fengxianhub.top/resources-master/image-20230730134950905.png)

我们再生成文档

![image-20230730134935356](https://cdn.fengxianhub.top/resources-master/image-20230730134935356.png)

#### 12.2.3 pub use简化路径

我们来看下下面的注释生成的文档

![image-20230730135544661](https://cdn.fengxianhub.top/resources-master/image-20230730135544661.png)

![image-20230730135620984](https://cdn.fengxianhub.top/resources-master/image-20230730135620984.png)

这个时候我们就可以使用`pub use`将文档导出到首页（其实就是简化了路径）

![image-20230730135811687](https://cdn.fengxianhub.top/resources-master/image-20230730135811687.png)

![image-20230730135909714](https://cdn.fengxianhub.top/resources-master/image-20230730135909714.png)

#### 12.2.4 创建并设置Crates.io账号

发布crate前，需要先在`crates.io`创建账号并获得`API token`

![image-20230730142530353](https://cdn.fengxianhub.top/resources-master/image-20230730142530353.png)

运行命令`cargo login [你的API token]`，这个命令会通知`cargo`，将你的API token 存储在本地`~/.cargo/credientials.toml`上

在发布`crate`之前，需要在`cargo.toml`的`[package]`区域为`crate`添加一些元数据

- crate需要唯一的名称：name
- description：一两句话即可，会出现在crate搜索的结果里
- license：需提供许可证标识值（可到`http://spdx.org/licenses/`查找），可以使用`OR`指定多个
- version
- author

使用`cargo publish`命令发布

>注意：crate一旦发布，就是永久性的，该版本无法覆盖，代码也无法删除（为了让依赖该版本的项目可以继续正常工作）
>
>可以使用`cargo yank --vers 1.0.1`命令标记当前版本不可使用（之前依赖的还可以继续使用，但是新创建的依赖就不能依赖了），可以使用`cargo yank --vers 1.0.1 --undo`命令取消撤回

#### 12.2.5 cargo工作空间（Workspace）

创建工作空间的方式有很多种，我们来举个创建一个二进制crate，两个库crate的例子

![image-20230730144705653](https://cdn.fengxianhub.top/resources-master/image-20230730144705653.png)

![image-20230730144648131](https://cdn.fengxianhub.top/resources-master/image-20230730144648131.png)

#### 12.2.6 cargo install

我们可以使用`cargo install`来安装在`cargo.io`上的`binary crate`并且进行执行，并且可以添加到我们的环境变量中

## 13. 智能指针

智能指针是这样一些数据结构：

- 行为和指针相似
- 有额外的元数据和功能

### 13.1 引用计数智能指针

引用计数（reference counting）智能指针类型

- 通过记录所有者的数量，使一份数据被多个所有者同时持有
- 并在没有任何所有者时自动清理数据

>引用和智能指针的其他不同
>
>- 引用：只借用数据
>- 智能指针：很多时候拥有它所指向的数据

智能指针的例子：

- String和`Vec<T>`
- 都拥有一片内存区域，且运行用户对其操作
- 用于元数据（例如容量等）
- 提供额外的功能或保障（String保障其数据是合法的`UTF-8`编码）

### 13.2 智能指针的实现

智能指针通常使用`struct`实现，并且实现了`Deref`和`Drop`这两个`trait`

- Deref trait：允许智能指针struct的实例像引用一样使用
- Drop trait：允许你自定义当智能指针实例走出作用域时的代码

### 13.3 使用Box\<T>来执行Heap上的数据

Box\<T>是最简单的智能指针：

- 允许你在heap上存储数据（而不是stack）
- stack上是指向heap数据的指针
- 没有性能开销，但是也没有其他额外的功能

**Box\<T>的常用场景**：

- 在编译时，某类型的大小无法确定。但使用该类型时，上下文却需要知道它的确切大小
- 当你有大量数据，想移交所有权，但需要确保在操作时数据不会被复制

举个例子

```rust
fn main() {
    // 使用box在堆上分配内存
    let b = Box::new(5);
    println!("b = {}", b)
} // b的生命周期在作用域结束后也会结束，在堆上的空间会被释放掉
```

使用Box\<T>赋能递归类型

- 在编译时，Rust需要知道一个类型所占空间的大小
- 而递归类型的大小无法在编译时确定
- 但Box类型的大小是确定的，在递归类型中使用Box就可以解决上述问题（例如`Cons list`）

**关于Cons list**

- Cons List是来自`lisp`语言的一种数据结构
- Cons List里每个成员由两个元素组成
  - 当前项的值
  - 下一个元素
- Cons List里最后一个成员只包含一个`Nil`值，没有下一个元素

**举个例子**

![image-20230730152640632](https://cdn.fengxianhub.top/resources-master/image-20230730152640632.png)

那我们用Box优化一下

![image-20230730152907919](https://cdn.fengxianhub.top/resources-master/image-20230730152907919.png)

### 13.4 Deref Trait

实现`Deref Trait`使我们可以自定义解引用运算符`*`的行为，通过实现`Deref Trait`，智能指针可以像常`规引用一样来处理`

```rust
fn main() {
    let x = 5;
    let y = &x;
    assert_eq!(5, x);
    assert_eq!(5, *y);
} 
```

```rust
fn main() {
    let x = 5;
    let y = Box::new(x);
    assert_eq!(5, x);
    assert_eq!(5, *y);
} 
```

**定义自己的智能指针**

Box\<T>被定义成拥有一个元素的`tuple struct`，我们现在定义一个`MyBox<T>`，也是拥有一个元素的`tuple struct`

标准库中的`Deref trait`要求我们实现一个`deref`方法：

- 该方法借用`self`
- 返回一个指向内部数据的引用

```rust
use std::ops::Deref;

fn main() {
    let x = 5;
    let y = MyBox::new(x);
    assert_eq!(5, x);
    assert_eq!(5, *y); // 等价于 `*(y.deref())`
}

struct MyBox<T>(T);

impl <T> MyBox<T> {
    fn new(x: T) -> MyBox<T> {
        MyBox(x)
    }
}

impl<T> Deref for MyBox<T> {
    type Target = T;
    fn deref(&self) -> &Self::Target {
        &self.0
    }
}
```

**函数和方法的隐式解引用转化（Deref Coercion）**

- 隐式解引用转化（Deref Coercion）是为函数和方法提供的一种便捷特性
- 假设`T`实现了`Deref trait`，`Deref Coercion`可以把`T`的引用转化为`T`经过`Deref`操作后生成的引用
- 当把某类型的引用传递给函数或方法时，但它的类型和定义的参数类型不匹配
  - `Deref Coercion`就会自动发生
  - 编译器会对`deref`进行一系列调用，来把它转为所需的参数类型
  - 在编译时就以及完成了，没有额外的性能开销

**解引用与可变性**

- 可使用`DerefMut trait`重载可变引用的`*`运算符
- 在类型和trait在下列三种情况发生时，Rust会执行`deref coercion`：
  - 当`T:Deref<Target=U>`，允许`&T`转换为`&U`
  - 当`T:DerefMut<Target=U>`，允许`&mut T`转换为`&mut U`
  - 当`T:Deref<Target=U>`，允许`&mut T`转换为`&mut U`

### 13.5 Drop Trait

实现Drop Trait，可以让我们自定义**当值将要离开作用域时发生的动作**

- 例如：文件、网络资源释放等
- 任何类型都可以实现`Drop trait`

Drop trait只要求你实现drop方法

- 参数：对self的可变引用
- Drop trait在预导入模块中（prelude）

我们看个例子：

```rust
fn main() {
   let c = CustomSmartPointer {data: String::from("my stuff") };
   let d = CustomSmartPointer {data: String::from("other stuff")};

   println!("CustomSmartPointers created.")
}


struct CustomSmartPointer {
    data: String
}

impl Drop for CustomSmartPointer {
    fn drop(&mut self) {
        println!("Dropping CustomSmartPointer with data `{}`!", self.data)
    }
}
```

我们看下输出

```shell
$ cargo run
    Finished dev [unoptimized + debuginfo] target(s) in 0.29s
     Running `target\debug\rustDemo01.exe`
CustomSmartPointers created.
Dropping CustomSmartPointer with data `other stuff`!
Dropping CustomSmartPointer with data `my stuff`!
```

我们发现刚好与输入的顺序相反，是**后进先出**，这里可以结合之前的生命周期就明白为啥了，我能保持和self一样长的寿命，但是self是后出，所以我比self先出，self都没了,我的寿命也早就没了

**使用std::mem::drop来提前drop值**

- 很难直接禁用自动的`drop`功能，也没必要，因为`Drop trait`的目的就是进行自动的释放处理逻辑
- Rust不允许手动调用`Drop trait`的`drop`方法
- 但可以调用标准库的`std::mem::drop`函数，来提前`drop`值
- `drop`即使写了多次也不会出现`double free`的情况

我们在上面的例子中试下：

![image-20230730194642316](https://cdn.fengxianhub.top/resources-master/image-20230730194642316.png)

```shell
$ cargo run
    Finished dev [unoptimized + debuginfo] target(s) in 0.29s
     Running `target\debug\rustDemo01.exe`
Dropping CustomSmartPointer with data `my stuff`!
CustomSmartPointers created.
Dropping CustomSmartPointer with data `other stuff`!
```

### 13.6 Rc\<T>引用计数智能指针

有时一个值会有多个所有者，例如下面的`6`就有多个变量同时引用它

![image-20230730220635460](https://cdn.fengxianhub.top/resources-master/image-20230730220635460.png)

为了支持多重所有权可以使用`Rc<T>`（reference couting引用计数），即可以追踪所有到值的引用，如果是`0`个引用，该值可能被清理掉

> **Rc\<T>的使用场景**：
>
>- 需要在heap上分配数据，这些数据被程序的多个部分读取（只读），但在编译时无法确定哪个部分最后使用完这些数据
>-  Rc\<T>只适合单线程的场景（14章会研究多线程的场景）

我们用一个例子来使用一下

![image-20230730195730941](https://cdn.fengxianhub.top/resources-master/image-20230730195730941.png)

我们看下面的代码，其实会报错

![image-20230731211057192](https://cdn.fengxianhub.top/resources-master/image-20230731211057192.png)

这个时候我们就可以使用`Rc<T>`这个数据类型了

```rust
use std::rc::Rc;

fn main() {
   let a = Rc::new(Cons(5, 
        Rc::new(Cons(10,
            Rc::new(Nil) )))); 
	// 这里可以通过clone获得引用，而不是所有权
    let b = Cons(3, Rc::clone(&a)); // 计数器加一
    let c = Cons(3, Rc::clone(&a)); // 计数器加一
}


enum List {
    Cons(i32, Rc<List>),
    Nil
}
```

使用`Rc::clone(&a)`可以获得不可变的引用，并且引用计数器会加一，等该引用结束（离开其作用域后）计数器将减一

```rust
use crate::List::{Cons, Nil};
use std::rc::Rc;

fn main() {
   let a = Rc::new(Cons(5, 
        Rc::new(Cons(10,
            Rc::new(Nil) )))); 
    println!("count after creating a = {}", Rc::strong_count(&a)); // 1
	// 这里可以通过clone获得引用，而不是所有权
    let b = Cons(3, Rc::clone(&a)); // 计数器加一
    println!("count after creating b = {}", Rc::strong_count(&a)); // 2
    {
        let c = Cons(3, Rc::clone(&a)); // 计数器加一
        println!("count after creating c = {}", Rc::strong_count(&a)); // 3
    }
   println!("count after c goes out of scope = {}", Rc::strong_count(&a)); // 2
}


enum List {
    Cons(i32, Rc<List>),
    Nil
}
```

>`Rc::clone()` 与 类型的`clone()` 方法
>
>- `Rc::clone()` ：增加引用，不会执行数据的深度拷贝操作
>- 类型的clone方法：很多都会深拷贝
>
>`Rc<T>`通过**不可变引用**，使你可以在程序不同部分之间共享只读数据
>
>`Rc<T>`为了防止悬垂引用，不允许`&`多引用。而Rc里维护了一个引用计数器，会在没有引用时析构。**防止一段内存多次free**

### 13.7 RefCell\<T>和内部可变性

内部可变性（interior mutability）

- 内部可变性是Rust的设计模式之一
- 它允许你在只持有不可变引用的前提下对数据进行修改
  - 数据结构中使用了`unsafe`代码来绕过Rust正常的可变性和借用规则

**RefCell\<T>**

- 与Rc\<T>不同，RefCell\<T>类型代表了其持有数据的唯一所有权
- 与`Rc<T>`相似，只能用于`单线程`场景

>这里我们回忆一下借用规则：
>
>- 在任何给定的时间里，你**要么只能拥有一个可变引用**，要么只能**拥有任意数量的不可变引用**
>- 引用总是有效的

![image-20230730202404654](https://cdn.fengxianhub.top/resources-master/image-20230730202404654.png)

![image-20230730202455134](https://cdn.fengxianhub.top/resources-master/image-20230730202455134.png)

![image-20230730203115882](https://cdn.fengxianhub.top/resources-master/image-20230730203115882.png)

>内部可变性：允许可变的借用一个不可变的值 （rust所有权规则是不允许的）
>
>如果没有内部可变性，下面的代码就无法修改
>
>![image-20230730203421874](https://cdn.fengxianhub.top/resources-master/image-20230730203421874.png)

我们来看一下详细一点的例子

```rust
/// 这里简单说就是有一个trait规定了只能是对结构体的不可变引用<br/>
/// 但我们希望实现这个trait的时候能对结构体进行修改<br/>
/// 就可以把希望修改的字段用智能指针包装一下
pub trait Messenger {
    fn send(&self, msg: &str);
}

pub struct LimitTracker<'a, T: 'a + Messenger> {
    messenger: &'a T,
    value: usize,
    max: usize,
}

impl <'a, T> LimitTracker<'a, T> 
where
    T: Messenger,
{
    pub fn new(messenger: &T, max: usize) -> LimitTracker<T> {
        LimitTracker { messenger, value: 0, max }
    }

    pub fn set_value(&mut self, value: usize) {
        self.value = value;
        let percentage_of_max = self.value as f64 / self.max as f64;
        if percentage_of_max >= 1.0 {
            self.messenger.send("Error: You are over your quota!");
        } else if percentage_of_max >= 0.9 {
            self.messenger.send("Urgent warning: You've used up over 90% of your");
        } else if percentage_of_max >= 0.75 {
            self.messenger.send("Warning: You've used up over 75% of your quota");
        }
    }
}

mod tests {
    use super::*;

    struct MockMessenger {
        sent_messages: Vec<String>,
    }

    impl MockMessenger {
        fn new() -> MockMessenger {
            MockMessenger { sent_messages: vec![] }
        }
    }

    impl Messenger for MockMessenger {
        // 2. 确实需要改变实参的状态(需要的是可变引用），但又不能修改接口定义
        // 3. 这时就可以用不安全的refcell方法，传入不可变引用，以改变值
        fn send(&mut self, msg: &str) {
            self.sent_messages.push(String::from(msg));
        }
    }

    #[test]
    fn it_sends_an_over_75_percent_warning_message() {
        let mock_messager = MockMessenger::new();
        let mut limit_tracker = LimitTracker::new(&mock_messager, 100);
        limit_tracker.set_value(80);
        assert_eq!(mock_messager.sent_messages.len(), 1);
    }
}
```

使用`RefCell<T>`修改后逻辑如下：

```rust
/// 这里简单说就是有一个trait规定了只能是对结构体的不可变引用<br/>
/// 但我们希望实现这个trait的时候能对结构体进行修改<br/>
/// 就可以把希望修改的字段用智能指针包装一下
pub trait Messenger {
    fn send(&self, msg: &str);
}

pub struct LimitTracker<'a, T: 'a + Messenger> {
    messenger: &'a T,
    value: usize,
    max: usize,
}

impl <'a, T> LimitTracker<'a, T> 
where
    T: Messenger,
{
    pub fn new(messenger: &T, max: usize) -> LimitTracker<T> {
        LimitTracker { messenger, value: 0, max }
    }

    pub fn set_value(&mut self, value: usize) {
        self.value = value;
        let percentage_of_max = self.value as f64 / self.max as f64;
        if percentage_of_max >= 1.0 {
            self.messenger.send("Error: You are over your quota!");
        } else if percentage_of_max >= 0.9 {
            self.messenger.send("Urgent warning: You've used up over 90% of your");
        } else if percentage_of_max >= 0.75 {
            self.messenger.send("Warning: You've used up over 75% of your quota");
        }
    }
}

mod tests {
    use super::*;
    use std::cell::RefCell;
    struct MockMessenger {
        sent_messages: RefCell<Vec<String>>,
    }

    impl MockMessenger {
        fn new() -> MockMessenger {
            MockMessenger { sent_messages: RefCell::new(vec![])}
        }
    }

    impl Messenger for MockMessenger {
        // 2. 确实需要改变实参的状态(需要的是可变引用），但又不能修改接口定义
        // 3. 这时就可以用不安全的refcell方法，传入不可变引用，以改变值
        fn send(&self, msg: &str) {
            self.sent_messages.borrow_mut().push(String::from(msg));
        }
    }

    #[test]
    fn it_sends_an_over_75_percent_warning_message() {
        let mock_messager = MockMessenger::new();
        let mut limit_tracker = LimitTracker::new(&mock_messager, 100);
        limit_tracker.set_value(80);
        assert_eq!(mock_messager.sent_messages.borrow().len(), 1);
    }
}
```

**我们来看下修改的内容**：

![image-20230801230545879](https://cdn.fengxianhub.top/resources-master/image-20230801230545879.png)

>上面的修改中，我们将不可变的引用套在`RefCell<T>`中

![image-20230730204716906](https://cdn.fengxianhub.top/resources-master/image-20230730204716906.png)

![image-20230730204808395](https://cdn.fengxianhub.top/resources-master/image-20230730204808395.png)

### 13.8 使用Rc\<T>和RefCell\<T>结合实现一个拥有多重所有权的可变数据

我们直接看例子

```rust
use crate::List::{Cons, Nil};
use std::{rc::Rc, cell::RefCell};

fn main() {
   let value = Rc::new(RefCell::new(5));
   let a = Rc::new(Cons(Rc::clone(&value), Rc::new(Nil)));
   let b = Cons(Rc::new(RefCell::new(6)), Rc::clone(&a));
   let c = Cons(Rc::new(RefCell::new(10)), Rc::clone(&a));

   *value.borrow_mut() += 10;

   println!("a after = {:?}", a);
   println!("b after = {:?}", b);
   println!("c after = {:?}", c);
}

#[derive(Debug)]
enum List {
    Cons(Rc<RefCell<i32>>, Rc<List>),
    Nil
}
```

输出

```shell
$ cargo run
   Compiling refdemo v0.1.0 (E:\workspace\vscode\rustStudy\refdemo)
    Finished dev [unoptimized + debuginfo] target(s) in 0.36s
     Running `target\debug\refdemo.exe`
a after = Cons(RefCell { value: 15 }, Nil)
b after = Cons(RefCell { value: 6 }, Cons(RefCell { value: 15 }, Nil))
c after = Cons(RefCell { value: 10 }, Cons(RefCell { value: 15 }, Nil))
```

**其他可实现内部可变性的类型**

- Cell\<T>：通过复制来访问数据
- Mutex\<T>：用于实现跨线程情况下的内部可变性模式

### 13.9 循环引用导致内存泄漏

当我们使用`Rc<T>`和`Rcell<T>`就可能创造出循环引用，从而发生内存泄漏

那么如何防止内存泄漏呢

- 依靠开发者来保障
- 重新组织数据结构，一些引用来表达所有权，一些引用不表达所有权
  - 循环引用中的一部分具有所有权关系，另一部分不涉及所有权关系
  - 而只有所有权关系才影响值的清理

我们来看个例子

```rust
use std::{rc::Rc, cell::RefCell};
use crate::List::{Cons, Nil};

fn main() {
    let a = Rc::new(Cons(5, RefCell::new(Rc::new(Nil))));

    println!("a initial rc count = {}", Rc::strong_count(&a));
    println!("a next item = {:?}", a.tail());

    let b = Rc::new(Cons(10, RefCell::new(Rc::clone(&a))));

    println!("a rc count after b creation = {}", Rc::strong_count(&a));
    println!("b initial rc count = {}", Rc::strong_count(&b));
    println!("b next item = {:?}", b.tail());

    if let Some(link) = a.tail() {
        *link.borrow_mut() = Rc::clone(&b);
    }

    println!("b rc count after changing a = {}", Rc::strong_count(&b));
    println!("a rc count after changing a = {}", Rc::strong_count(&a));

    // cycle, it will overflow the stack
    println!("a next item = {:?}", a.tail())
}


#[derive(Debug)]
enum List {
    Cons(i32, RefCell<Rc<List>>),
    Nil
}

impl List {
    fn tail(&self) -> Option<&RefCell<Rc<List>>> {
        match self {
            Cons(_, item) => Some(item),
            Nil => None,
        }
    }
}
```

我们允许一下

```shell
$ cargo run
   Compiling demo03 v0.1.0 (E:\workspace\vscode\rustStudy\demo03)
    Finished dev [unoptimized + debuginfo] target(s) in 0.23s
     Running `target\debug\demo03.exe`
a initial rc count = 1
a next item = Some(RefCell { value: Nil })
a rc count after b creation = 2
b initial rc count = 1
b next item = Some(RefCell { value: Cons(5, RefCell { value: Nil }) })
b rc count after changing a = 2
a rc count after changing a = 2
a next item = Some(RefCell { value: Cons(10, RefCell ...省略很多
thread 'main' has overflowed its stack
error: process didn't exit successfully: `target\debug\demo03.exe` (exit code: 0xc00000fd, STATUS_STACK_OVERFLOW)
```

>为了防止循环引用可以将`Rc<T>`换成`Weak<T>`
>
>- `Rc::clone`为`Rc<T>`实例的`strong_count`加1，`Rc<T>`的实例只有在`strong_count`为0的时候才会被清理
>- `Rc<T>`实例通过调用`Rc::downgrade`方法可以创建值的`Weak Reference (弱引用)`
>  - 返回的类型是`Weak<T> (智能指针)`
>  - 调用`Rc::downgrade会为weak_count`加1
>  - `Rc<T>`使用`weak_count`来追踪存在多少`Weak<T>`
>  - `weak_count`不为0并不影响`Rc<T>`实例的清理

![image-20230730212235562](https://cdn.fengxianhub.top/resources-master/image-20230730212235562.png)

### 13.9 小结

在本章介绍了标准库中常见的智能指针

- `Box<T>`：在heap内存上分配值
- `Rc<T>`：启用多重所有权的引用计数类型
- `Ref<T>`和`RefMut<T>`，通过`RefCell<T>`访问：在运行时而不是编译时强制借用规则的类型

此外：

- 内部可变模式（interior mutability pattern）：不可变类型暴露出可修改其内布值的API
- 引用循环（reference cycles）：它们如何泄露内层，以及如何防止其发生

## 14. 无畏并发

在大部分OS里，代码允许在`进程(process)`中，OS同时管理多个进程。在我们的程序中，各独立部分可以同时运行，运行这些独立部分的就是线程`Thread`

多线程运行一般：

- 提高性能
- 增加复杂性，无法保障各线程的执行顺序

多线程会带来一些问题：

- 竞争状态，线程以不一致的顺序访问数据或资源
- 死锁
- 线程可见性带来的bug

在常见的实现线程的方式有：

- 通过调用OS的API来创建线程：`1:1模型`，需要比较小的运行时
- 语言自己实现的线程（绿色线程）：`M:N模型`，需要更大的运行时

>rust为了权衡运行时的支持，标准库仅提供`1:1`模型的线程

### 14.1 创建多线程

在rust中可以通过`spawn`创建新线程

```rust
use std::{thread, time::Duration};

fn main() {
    thread::spawn(|| {
        for i in 1..10 {
            println!("hi number {} from the spawned thread!", i);
            thread::sleep(Duration::from_millis(1));
        }
    });

    for i in 1..5 {
        println!("hi number {} from the main thread!", i);
        thread::sleep(Duration::from_millis(1));
    }
}
```

我们运行一下

```shell
$ cargo run
   Compiling threadStudy v0.1.0 (E:\workspace\vscode\rustStudy\threadStudy)
    Finished dev [unoptimized + debuginfo] target(s) in 0.47s
     Running `target\debug\threadStudy.exe`
hi number 1 from the main thread!
hi number 1 from the spawned thread!
hi number 2 from the spawned thread!
hi number 2 from the main thread!
hi number 3 from the main thread!
hi number 3 from the spawned thread!
hi number 4 from the main thread!
hi number 4 from the spawned thread!
```

当然也可以`join`一下，通过`join Handle`来等待所有线程的完成

- `thread::spawn`函数的返回值类型是  **JoinHandle**
- JoinHandle持有值的所有权，调用其join方法，可以等待对应的其他线程完成
- join方法：调用handle的join方法会组织当前运行线程的执行，直到handle所表示的这些线程终结

```rust
use std::{thread, time::Duration};

fn main() {
    let handle = thread::spawn(|| {
        for i in 1..10 {
            println!("hi number {} from the spawned thread!", i);
            thread::sleep(Duration::from_millis(1));
        }
    });

    for i in 1..5 {
        println!("hi number {} from the main thread!", i);
        thread::sleep(Duration::from_millis(1));
    }

    handle.join().unwrap();
}
```

```shell
$ cargo run
   Compiling threadStudy v0.1.0 (E:\workspace\vscode\rustStudy\threadStudy)
    Finished dev [unoptimized + debuginfo] target(s) in 0.47s
     Running `target\debug\threadStudy.exe
hi number 1 from the main thread!
hi number 1 from the spawned thread!
hi number 2 from the spawned thread!
hi number 2 from the main thread!
hi number 3 from the main thread!
hi number 3 from the spawned thread!
hi number 4 from the main thread!
hi number 4 from the spawned thread!
hi number 5 from the spawned thread!
hi number 6 from the spawned thread!
hi number 7 from the spawned thread!
hi number 8 from the spawned thread!
hi number 9 from the spawned thread!
```

**使用move闭包**

- move闭包通常和`thread::spawn`函数一起使用，它允许你使用其他线程的数据
- 创建线程时，把值的所有权从一个线程转移到另一个线程

我们看下面的代码

```rust
mod tests {
    use std::thread;
    #[test]
    fn test01() {
        let v = vec![1, 2, 3];
        let handle = thread::spawn(|| {
            println!("Here's a vector:{:?}", v);
        });


        handle.join().unwrap();
    }
}
```

如果允许会报错，因为在闭包里使用的`v`，不确定什么时候会被回收

```shell
error[E0373]: closure may outlive the current function, but it borrows `v`, which is owned by the current function
  --> src\main.rs:25:36
   |
25 |         let handle = thread::spawn(|| {
   |                                    ^^ may outlive borrowed value `v`
26 |             println!("Here's a vector:{:?}", v);
   |                                              - `v` is borrowed here
   |
note: function requires argument type to outlive `'static`
  --> src\main.rs:25:22
   |
25 |           let handle = thread::spawn(|| {
   |  ______________________^
26 | |             println!("Here's a vector:{:?}", v);
27 | |         });
   | |__________^
help: to force the closure to take ownership of `v` (and any other referenced variables), use the `move` keyword
   |
25 |         let handle = thread::spawn(move || {
   |                                    ++++
```

所以我们可以使用`move`关键字将`v`的所有权移入到闭包里面

```rust
mod tests {
    use std::thread;
    #[test]
    fn test01() {
        let v = vec![1, 2, 3];
        let handle = thread::spawn(move || {
            println!("Here's a vector:{:?}", v);
        });


        handle.join().unwrap();
    }
}
```

### 14.2 线程通信

线程之间通信的方式有很多种，例如Java中使用共享内存的方式进行通信，比如常见的`ReentrantLock`里面为了记录锁重入次数，使用的`volatile`关键字修饰的共享内存：`state`

现在有一种很流行且能保证安全并发的技术是：`消息传递`

线程（或Actor）通过彼此发送消息（数据）来进行通信

>GO的名言就是：不要用共享内存来通信，要用通信来共享内存

#### 14.2.1 channel

- channel包含：发送端、接收端
- 调用发送端的方法，发送数据
- 接受端会检查和接受到达的数据
- 如果发送端、接收端中任何一端被丢弃了，那么channel就关闭了

创建channel可以使用`mpsc::channel`函数来创建channel

- mpsc表示：multiple producer，single consumer（多个生产者、一个消费者）
- 返回一个tuple：里面元素分别是发送端、接受端

**举个例子**

```rust
#[test]
fn test02() {
    let (tx, rx) = mpsc::channel();
    thread::spawn(move || {
        let val = String::from("hello");
        tx.send(val).unwrap();
    });
    let received = rx.recv().unwrap();
    println!("Got: {}", received); // Got: hello
}
```

>发送端的`send`方法
>
>- 参数：想要发送的数据
>- 返回：Result<T, E>，如果有问题（例如接收端已经被丢弃），就返回一个错误
>
>接收端的`recv`方法
>
>- `recv`方法：阻塞当前线程执行，直到channel中有值被送来，收到后返回`Result<T, E>`，如有问题返回错误
>- `try_recv`方法：不会阻塞
>  - 立刻返回Result<T, E>
>    - 有数据到达，返回OK，里面包裹着数据
>    - 否则，返回错误
>  - 通常会使用循环调用来检查`try_recv`的结果

#### 14.2.2 channel所有权转移

所有权在消息系统中传递时非常重要的，可以帮助我们编写安全、并发的代码

上面的例子中如果我们想要把已经发送到channel里面的值再打印一下的话，就会报错

![image-20230803230148213](https://cdn.fengxianhub.top/resources-master/image-20230803230148213.png)

可以不断的向channel中发送元素，然后进行接收

```rust
#[test]
fn test04() {
    let (tx, rx) = mpsc::channel();
    thread::spawn(move || {
        let vals = vec![
            String::from("hello"),
            String::from("hello"),
            String::from("hello"),
            String::from("hello"),
        ];
        for val in vals {
            tx.send(val).unwrap();
            thread::sleep(Duration::from_millis(100));
        }
    });
    for received in rx {
        println!("Got: {}", received)
    }
}
```

#### 14.2.3 多生产者

我们可以使用clone来创建多个生产者

```rust
#[test]
fn test05() {
    let (tx, rx) = mpsc::channel();
    let txcopy = mpsc::Sender::clone(&tx);
    thread::spawn(move || {
        let vals = vec![
            String::from("sendCopy: hello"),
            String::from("sendCopy: hello"),
            String::from("sendCopy: hello"),
            String::from("sendCopy: hello"),
        ];
        for val in vals {
            txcopy.send(val).unwrap();
            thread::sleep(Duration::from_millis(100));
        }
    });
    thread::spawn(move || {
        let vals = vec![
            String::from("send: hello"),
            String::from("send: hello"),
            String::from("send: hello"),
            String::from("send: hello"),
        ];
        for val in vals {
            tx.send(val).unwrap();
            thread::sleep(Duration::from_millis(100));
        }
    });
    for received in rx {
        println!("Got: {}", received)
    }
}
// 输出
Got: sendCopy: hello
Got: send: hello    
Got: send: hello
Got: sendCopy: hello
Got: send: hello
Got: sendCopy: hello
Got: send: hello
Got: sendCopy: hello
```

### 14.3 共享状态的并发

上一节讲的是使用channel的方法进行并发，这里要使用`共享内存`的方式进行并发

channel类似单所有权，一旦将值的所有权转移至`channel`，就无法使用它了

共享内存并发类似多所有权：多个线程可以同时访问同一块内存

#### 14.3.1 Mutex锁

既然有共享内存，那么保障线程安全的方式最简单的就是加锁，rust提供了`Mutex`

Mutex是mutual exclusion（互斥锁）的简写

- 在同一时刻，Mutex只允许一个线程来访问某些数据
- 想要访问数据
  - 线程必须先获取互斥锁（lock）：lock数据结构是mutex的一部分，它能跟踪谁对数据拥有独占访问权
  - mutex通常被描述为：通过锁定系统来保护它所持有的数据

>Mutex的两条规则
>
>- 在使用数据之前，必须尝试获取锁（lock）
>- 使用完mutex所保护的数据，必须对数据进行解锁，以便其他线程可以获取锁

Mutex\<T>常用的API：

- 通过Mutex::new(数据)来创建Mutex\<T>，Mutex\<T>是一个智能指针
- 访问数据前，通过lock方法来获取锁
  - 会阻塞当前线程
  - lock可能会失败
  - 返回的是MutexGuard（智能指针，实现了Deref和Drop）

举个例子

```rust
#[test]
fn test06() {
    let m = Mutex::new(5);
    {
        let mut num = m.lock().unwrap();
        *num = 6;
        // mutex 实现了drop trait，所以作用域完之后会自动解锁
    }
}
```

我们再看一段代码

![image-20230803232708439](https://cdn.fengxianhub.top/resources-master/image-20230803232708439.png)

这里因为`counter`在第一次循环的时候所有权已经被移动过了，所以后面的线程获取不到所有权

这里我们要用到**多线程的多重所有权**这个概念了

上面的例子我们可以使用`Arc<T>`来进行原子引用计数，跟Rc不同的是可以用于并发场景

- A：atomic，原子的

```rust
#[test]
fn test07() {
    let counter = Arc::new( Mutex::new(0));
    let mut handles = vec![];
    for _ in 0..10 {
        let counter = Arc::clone(&counter);
        let handle = thread::spawn(move || {
            let mut num = counter.lock().unwrap();
            *num += 1;
        });
        handles.push(handle);
    }
    for handle in handles {
        handle.join().unwrap();
    }
    println!("Result: {}", *counter.lock().unwrap()); // 10
}
```

>RefCell\<T> / Rc\<T>  VS  Mutex\<T> / Arc\<T>
>
>- Mutex\<T>提供了内部可变性，和Cell家族一样
>- 我们使用RecCell \<T>来改变Rc\<T>里面的内容
>- 我们使用Mutex\<T>来改变Arc\<T>里面的内容
>- 注意：Mutex\<T>有死锁的风险

### 13.4 通过Send/Sync trait来拓展并发

rust语言的并发特性是比较少的，目前的并发都是来自标准库的（而不是语言本身）

我们无需局限于标准库的并发 ，可以自己实现并发

在rust中有两个并发的概念：

- `std::marker:Sync`和`std::marker::Send`这两个trait

>**Send是一个Trait**
>
>- `Send trait`：允许线程间转移所有权，Rust里几乎所有的类型都实现了Send（Rc\<T>没有实现，只能用于单线程的场景）
>- 任何完全由Send类型组成的类型也被标记为Send
>- 除了原始指针之外，几乎所有的基础类型都是Send
>
>**Sync：允许从多线程访问**
>
>- 实现Sync的类型可以安全的被多个线程引用
>- 也就是说：如果T是Sync，那么&T也是Send（引用可以被安全的送往另一个线程）
>- 基础类型都是Sync
>- 完全有Sync类型组成的类型也是Sync
>  - 但是，Rc\<T>不是Sync的
>  - RefCell\<T>和Cell\<T>家族也不是Sync的
>  - Mutex\<T>是Sync的
>
>最后📢注意：如果我们自己手动实现Send和Sync是及其不安全的，我们很难保证线程安全！

## 15. rust面向对象

### 15.1 面向对象

rust在设计的时候收到很多编程范式的影响，包括面向对象，面向对象通常包含以下特征：封装、继承、多态

《设计模式》作者GOF四人帮中给面向对象的定义：

- 面向对象的程序由对象组成
- 对象包装了数据和操作这些数据的过程，这些过程通常被称作方法或操作

基于此定义，Rust是面向对象的

- struct、enum包含数据
- impl块为之提供了方法
- 但带有方法的struct、enum并没有被称之为对象

我们对面向对象的三个特征进行分析：

- 在rust中用`pub`关键字，并且struct里面的结构体默认就是私有的，所以rust是满足封装的特性的
- rust没有继承
  - 代码复用：继承主要是为了进行代码复用，在rust中代码复用使用`trait`来进行代码分享
  - 多态：泛型和trait约束（限定参数化多态 bounded parametric）

### 15.2 使用trait对象来存储不同类型的值

我们现在有一个需求，创建一个GUI工具：

- 它会遍历某个元素的列表，依次调用元素的draw方法进行绘制
- 例如：Button、TextField等元素

在面向对象的语言中，做法通常是这样的：

- 定义一个Component父类，里面定义了draw方法
- 定义Button、TextField等类，继承Component

在Rust中是这样做的，**为公有行为定义一个trait**：

- 在rust中避免将struct或enum称之为对象，因为它们与impl块是分开的
- 但是trait对象有些类似其他语言中的对象
  - 它们某种程度上组合了数据和行为
- trait对象与传统对象不同的地方
  - 无法为trait对象添加数据
- trait对象被专门用于抽象某些共有行为，它没其他语言中的对象那么通用

可以用个小例子来理解一下：

```rust
pub trait Draw {
    fn draw(&self);
}

pub struct Screen {
    // 只要实现了Draw就可以放到里面
    pub components: Vec<Box<dyn Draw>>
}


impl Screen {
    pub fn run(&self) {
        for component in self.components.iter() {
            component.draw();
        }
    }
}

pub struct Button {
    pub width: u32,
    pub height: u32,
    pub label: String,
}

impl Draw for Button {
    fn draw(&self) {
        // 绘制一个按钮
        println!("Button draw")
    }
}

// --------------------------------------------------------

struct SelectBox {
    width: u32,
    height: u32,
    options: Vec<String>,
}

impl Draw for SelectBox {
    fn draw(&self) {
        // 绘制一个选择框
        println!("SelectBox draw")
    }
}

mod tests {
    use crate::{Screen, SelectBox, Button};


    #[test]
    fn test01() {
        let screen = Screen {
            components: vec![
                Box::new(SelectBox {
                    width: 75,
                    height: 10,
                    options: vec![
                        String::from("Yes"),
                        String::from("Maybe"),
                        String::from("No"),
                    ]
                }),
                Box::new(Button {
                    width: 50,
                    height: 10,
                    label: String::from("OK"),
                })
            ]
        };
        screen.run(); // SelectBox draw \n Button draw  
    }
}
```

>Trait对象执行的是动态派发
>
>- 将trait约束作用于泛型时，Rust编译器会执行单态化
>  - 编译器会为我们用来替换泛型类型参数的每一个具体类型生成对应函数和方法的非泛型实现
>- 通过单态化生成的代码会执行`静态派发（static dispatch）`，在编译过程中确定调用的具体方法
>- 动态派发
>  - 无法在编译过程中确定你调用的究竟是哪一种方法
>  - 编译器会产生额外的代码以便于在运行时找出希望调用的方法
>
>我们使用trait对象，会执行动态派发：
>
>- 产生运行时开销
>- 阻止编译器内联方法代码，使得部分优化操作无法进行
>
>Trait对象必须保证对象安全
>
>- 只能把满足对象安全（object-safe）的trait转化为trait对象
>- rust采用一系列规则来判定某个对象是否安全，我们只需要记住两条
>  - 方法的返回类型不是`Self`（如果返回Self，则指实现了该Trait的实例，大小是不确定的）
>  - 方法中不包含任何泛型类型参数（泛型同理）
>
>![image-20230805005111275](https://cdn.fengxianhub.top/resources-master/image-20230805005111275.png)

### 15.3 面向对象设计模式

接下来我们用rust实现一些常见的设计模式

- 状态模式（state pattern）是一种面向对象设计模式
  - 一个值拥有的内部状态由数个状态对象（state object）表达而成，而值的行为则随着内部状态的改变而改变
- 使用状态模式意味着：
  - 在业务需求变化时，不需要修改持有状态的值的代码，或者使用这个值的代码
  - 只需要更新状态对象内部的代码，以便改变其规则。或者增加一些新的状态对象

## 16. 模式匹配

模式是Rust中的一种特殊语法，用于匹配复杂和简单类型的结构

将模式与匹配表达式和其他构造结合使用，可以更好的控制程序的控制流

模式由以下元素（的一些组合）组成：

- 字面值
- 解构的数组、enum、struct和tuple
- 变量
- 通配符
- 占位符

想要使用模式，需要将其与某个值进行比较，如果模式匹配，就可以在代码中使用这个值的相应部分

### 16.1 使用模式

模式出现在 Rust 的很多地方。你已经在不经意间使用了很多模式！本部分是一个所有有效模式位置的参考

- match分支
- if let
- while let
- for循环
  - `for` 循环是 Rust 中最常见的循环结构，不过还没有讲到的是 `for` 可以获取一个模式。在 `for` 循环中，模式是 `for` 关键字直接跟随的值，正如 `for x in y` 中的 `x
- let语句
- 函数参数

### 16.2 可辨驳性

这里我们主要`了解模式是否会无法匹配`。模式分为两种：

- refutable（可辨驳的）
  - 例如：if let *Some(x)* = a_value，这里如果右边为`None`就会匹配失败，也就是可辨驳的，可失败的
- irrefutable（不可辨驳的）
  - 例如：let *x* = 5;  x不可能匹配失败，因为x可以匹配任何类型

>函数参数、`let`语句、`for`循环只接受无可辩驳的模式（也就是不能匹配失败）
>
>`if let`和`while let`接受**可辨驳**和**无可辩驳**的模式

### 16.3 模式语法

#### 16.3.1 匹配字面值

```rust

#![allow(unused_variables)]
fn main() {
let x = 1;

    match x {
        1 => println!("one"),
        2 => println!("two"),
        3 => println!("three"),
        _ => println!("anything"),
    }
}
```

#### 16.3.2 匹配命名变量

**命名变量是匹配任何值的不可反驳模式**，这在之前已经使用过数次。然而当其用于 `match` 表达式时情况会有些复杂。因为 `match` 会开始一个新作用域，`match` 表达式中作为模式的一部分声明的变量会覆盖 `match` 结构之外的同名变量，与所有变量一样。在示例 18-11 中，声明了一个值为 `Some(5)` 的变量 `x` 和一个值为 `10` 的变量 `y`。接着在值 `x` 上创建了一个 `match` 表达式。观察匹配分支中的模式和结尾的 `println!`，并在运行此代码或进一步阅读之前推断这段代码会打印什么

```rust
fn main() {
    let x = Some(5);
    let y = 10;

    match x {
        Some(50) => println!("Got 50"),
        // 这里的y并不是外面的变量，而是一个命名变量，所以输出5
        Some(y) => println!("Matched, y = {:?}", y),
        _ => println!("Default case, x = {:?}", x),
    }
	// 此作用域下的y是变量y
    println!("at the end: x = {:?}, y = {:?}", x, y);
}
```

最后的输出是

```shell
Matched, y = 5
at the end: x = Some(5), y = 10
```

#### 16.3.3 多重模式

在match表达式中，使用`|`语法（就是或的意思），可以匹配多种模式

```rust
#![allow(unused_variables)]
fn main() {
let x = 1;

    match x {
        1 | 2 => println!("one or two"),
        3 => println!("three"),
        _ => println!("anything"),
    }
}

```

**通过 `..=` 匹配值的范围**

`..=` 语法允许你匹配一个闭区间范围内的值。在如下代码中，当模式匹配任何在此范围内的值时，该分支会执行：

```rust
#![allow(unused_variables)]
fn main() {
let x = 5;

    match x {
        1..=5 => println!("one through five"),
        _ => println!("something else"),
    }
}
```

范围只允许用于数字或 `char` 值，因为编译器会在编译时检查范围不为空。`char` 和 数字值是 Rust 仅有的可以判断范围是否为空的类型。

```rust
#![allow(unused_variables)]
fn main() {
let x = 'c';

    match x {
        'a'..='j' => println!("early ASCII letter"),
        'k'..='z' => println!("late ASCII letter"),
        _ => println!("something else"),
    }
}
// Rust 知道 c 位于第一个模式的范围内，并会打印出 early ASCII letter。
```

**解构结构体**

```rust
#[test]
fn test03() {
    struct Point {
        x: u32,
        y: u32,
    }
    let p = Point { x: 0, y: 7 };
    // 解构结构体，这样相当于对变量a、b进行赋值
    let Point { x: a, y: b } = p;
    assert_eq!(0, a);
    assert_eq!(7, b);
    // 上面的写法有些麻烦，可以简写为
    let Point { x, y} = p;
    assert_eq!(0, x);
    assert_eq!(7, y);
    // 也可以更加灵活的使用
    match p {
        Point {x, y: 0} => println!("On the x axis at {}", x),
        Point {x:0, y} => println!("On the x axis at {}", y),
        Point {x, y} => println!("On neither axis:({}, {})", x, y),
    }
}
```

**结构枚举**

```rust
enum Message {
    Quit,
    Move { x: i32, y: i32 },
    Write(String),
    ChangeColor(i32, i32, i32),
}

fn main() {
    let msg = Message::ChangeColor(0, 160, 255);

    match msg {
        Message::Quit => {
            println!("The Quit variant has no data to destructure.")
        }
        Message::Move { x, y } => {
            println!(
                "Move in the x direction {} and in the y direction {}",
                x,
                y
            );
        }
        Message::Write(text) => println!("Text message: {}", text),
        Message::ChangeColor(r, g, b) => {
            println!(
                "Change the color to red {}, green {}, and blue {}",
                r,
                g,
                b
            )
        }
    }
}

```

**解构嵌套的结构体和枚举**

```rust
enum Color {
   Rgb(i32, i32, i32),
   Hsv(i32, i32, i32),
}

enum Message {
    Quit,
    Move { x: i32, y: i32 },
    Write(String),
    ChangeColor(Color),
}

fn main() {
    let msg = Message::ChangeColor(Color::Hsv(0, 160, 255));

    match msg {
        Message::ChangeColor(Color::Rgb(r, g, b)) => {
            println!(
                "Change the color to red {}, green {}, and blue {}",
                r,
                g,
                b
            )
        }
        Message::ChangeColor(Color::Hsv(h, s, v)) => {
            println!(
                "Change the color to hue {}, saturation {}, and value {}",
                h,
                s,
                v
            )
        }
        _ => ()
    }
}

```

**解构结构体和元组**

甚至可以用复杂的方式来混合、匹配和嵌套解构模式。如下是一个复杂结构体的例子，其中结构体和元组嵌套在元组中，并将所有的原始类型解构出来

```rust

#![allow(unused_variables)]
fn main() {
    struct Point {
        x: i32,
        y: i32,
    }
    let ((feet, inches), Point {x, y}) = ((3, 10), Point { x: 3, y: -10 });
}

```

**忽略模式中的值**

有时忽略模式中的一些值是有用的，比如 `match` 中最后捕获全部情况的分支实际上没有做任何事，但是它确实对所有剩余情况负责。有一些简单的方法可以忽略模式中全部或部分值：使用 `_` 模式（我们已经见过了），在另一个模式中使用 `_` 模式，使用一个以下划线开始的名称，或者使用 `..` 忽略所剩部分的值。让我们来分别探索如何以及为什么要这么做

**使用 _ 忽略整个值**

我们已经使用过下划线（`_`）作为匹配但不绑定任何值的通配符模式了。虽然 `_` 模式作为 `match` 表达式最后的分支特别有用，也可以将其用于任意模式，包括函数参数中

```rust
fn foo(_: i32, y: i32) {
    println!("This code only uses the y parameter: {}", y);
}

fn main() {
    foo(3, 4);
}
```

**使用嵌套的 _ 忽略部分值**

```rust
#![allow(unused_variables)]
fn main() {
    let mut setting_value = Some(5);
    let new_setting_value = Some(10);

    match (setting_value, new_setting_value) {
        // 只要是Some类型就行，里面是啥值不在乎
        (Some(_), Some(_)) => {
            println!("Can't overwrite an existing customized value");
        }
        _ => {
            setting_value = new_setting_value;
        }
    }

    println!("setting is {:?}", setting_value);
}
```

还可以匹配想要的数据

```rust
#[test]
fn test04() {
    let numbers = (2, 4, 8, 16, 32);
    match numbers {
        (first, _, third, _, fifth) => {
            println!("Some numbers:{}, {}, {}", first, third, fifth)
        }
    }
}
```

**通过在名字前以一个下划线开头来忽略未使用的变量**

解构也会转移所有权

![image-20230805172901241](https://cdn.fengxianhub.top/resources-master/image-20230805172901241.png)

**用 .. 忽略剩余值**

```rust
#![allow(unused_variables)]
fn main() {
    struct Point {
        x: i32,
        y: i32,
        z: i32,
    }

    let origin = Point { x: 0, y: 0, z: 0 };

    match origin {
        Point { x, .. } => println!("x is {}", x),
    }
    // 还可以这样
    let numbers = (2, 4, 8, 16, 32);
    match numbers {
        (first, .., fifth) => {
            println!("Some numbers:{}, {}, {}", first, third, fifth)
        }
    }
}
```

**匹配守卫提供的额外条件**

**匹配守卫**（*match guard*）是一个指定于 `match` 分支模式之后的额外 `if` 条件，它也必须被满足才能选择此分支。匹配守卫用于表达比单独的模式所能允许的更为复杂的情况。

这个条件可以使用模式中创建的变量。下面 展示了一个 `match`，其中第一个分支有模式 `Some(x)` 还有匹配守卫 `if x < 5`

```rust
#![allow(unused_variables)]
fn main() {
    let num = Some(4);

    match num {
        Some(x) if x < 5 => println!("less than five: {}", x),
        Some(x) => println!("{}", x),
        None => (),
    }
}
```

```rust
#![allow(unused_variables)]
fn main() {
    let x = 4;
    let y = false;

    match x {
        4 | 5 | 6 if y => println!("yes"),
        _ => println!("no"),
    }
}
```

**@ 绑定**

*at* 运算符（`@`）允许我们在创建一个存放值的变量的同时测试其值是否匹配模式

```rust
#![allow(unused_variables)]
fn main() {
    enum Message {
        Hello { id: i32 },
    }

    let msg = Message::Hello { id: 5 };

    match msg {
        Message::Hello { id: id_variable @ 3..=7 } => {
            println!("Found an id in range: {}", id_variable)
        },
        Message::Hello { id: 10..=12 } => {
            println!("Found an id in another range")
        },
        Message::Hello { id } => {
            println!("Found some other id: {}", id)
        },
    }
}
```

## 17. rust 高阶编程

这节包含的内容有：

- 不安全rust
- 高级trait
- 高级类型
- 高级函数和闭包
- 宏

### 17.1 rust unsafe

许多语言里面都有unsafe，在rust中隐藏了太多的内存安全保障

但是在rust中还隐藏这`Unsafe rust`，它没有强制内存安全保证，但是提供了许多黑魔法

unsafe rust存在的原因有：

- 静态分析是保守的，我们可以使用unsafe rust，并且承担相应的风险
- 计算机硬件本身就是不安全的，Rust需要能够进行底层系统编程

**unsafe超能力**

使用unsafe关键字来切换到unsafe rust，可以开启一个代码块，里面存放unsafe的代码

unsafe rust里可以执行四个动作（**unsafe超能力**）

- 解引用原始指针
- 调用unsafe函数或方法
- 访问或修改可变的静态变量
- 实现`unsafe trait`

>注意：
>
>- unsafe并没有关闭借用检查或停用其他安全检查
>- 任何内存安全相关的错误必须留在unsafe块中
>- 尽可能隔离unsafe代码，最好将其封装在安全的抽象里，提供安全的API

#### 17.1.1 解引用原始指针

 原始指针

- 可变的：`*mut T`
- 不可变的：`*const T`。意味着指针在解引用后不能直接对其进行赋值
- 注意：这里的`*`不是解引用符号，它是类型名的一部分

与引用不同，原始指针：

- 允许通过同时具有不可变和可变指针或多个指向同一位置的可变指针来忽略借用规则
- 无法保证能指向合理的内存
- 允许为null
- 不实现任何自动清理

放弃保证的安全，换取更好的性能/与其他语言或硬件接口的能力

我们来看一个原始指针的例子

```rust
#[test]
fn test05() {
    let mut num = 5;
    let r1 = &num as *const i32;
    let r2 = &mut num as *mut i32;
    // 不会报错
    unsafe {
        println!("r1: {}", *r1);
        println!("r2: {}", *r2);
    }
    // 声明了一个未知的内存地址，取不到想要的i32类型，所以会报错
    let address = 0x012345usize;
    let r = address as *const i32;
    unsafe {
        println!("r: {}", *r);
    }
}
```

那么我们为什么要使用原始指针呢？

- 与c语言进行接口
- 构建借用检查器无法理解的安全抽象

**调用unsafe函数或方法**

- unsafe函数或方法：在定义前加了unsafe关键字
  - 调用前需手动满足一些条件（主要靠看文档），因为rust无法对这些条件进行校验
  - 需要在unsafe块里进行调用

![image-20230805194500743](https://cdn.fengxianhub.top/resources-master/image-20230805194500743.png)

**创建unsafe代码的安全抽象**

函数包含unsafe代码并不意味着需要将整个函数标记为unsafe

将unsafe代码包裹在安全函数中是一个常见的抽象

**使用extern函数调用外部代码**

有时你的 Rust 代码可能需要与其他语言编写的代码交互。为此 Rust 有一个关键字，`extern`，有助于创建和使用 **外部函数接口**（*Foreign Function Interface*， FFI）。外部函数接口是一个编程语言用以定义函数的方式，其允许不同（外部）编程语言调用这些函数。

- extern关键字：简化创建和使用外部函数接口（FFI，*Foreign Function Interface*）的过程
- 外部函数接口（FFI）：它允许一种编程语言定义函数，并让其他编程语言能调用这些函数

下面展示了如何集成 C 标准库中的 `abs` 函数。`extern` 块中声明的函数在 Rust 代码中总是不安全的。因为其他语言不会强制执行 Rust 的规则且 Rust 无法检查它们，所以确保其安全是程序员的责任：

```rust
extern "C" {
    fn abs(input: i32) -> i32;
}

fn main() {
    unsafe {
        println!("Absolute value of -3 according to C: {}", abs(-3));
    }
}
```

在 `extern "C"` 块中，列出了我们希望能够调用的另一个语言中的外部函数的签名和名称。`"C"` 部分定义了外部函数所使用的 **应用程序接口**（*application binary interface*，ABI） —— ABI 定义了如何在汇编语言层面调用此函数。`"C"` ABI 是最常见的，并遵循 C 编程语言的 ABI

**从其他语言调用rust函数**

- 可以使用extern创建接口，其他语言通过它们可以调用rust的函数
- 在fn前添加extern关键字，并指定ABI
- 还需要添加`#[no_mangle]`注解，避免rust在编译时改变它的名称

在如下的例子中，一旦其编译为动态库并从 C 语言中链接，`call_from_c` 函数就能够在 C 代码中访问：

```rust
fn main() {
    #[no_mangle]
    pub extern "C" fn call_from_c() {
        println!("Just called a Rust function from C!");
    }
}
```

`extern` 的使用无需 `unsafe`

**访问或修改一个可变静态变量**

- rust支持全局变量，但因为所有权机制可能产生某些问题，例如数据竞争
- 在rust中全局变量叫做静态（static）变量

```rust
static HELLO_WORLD: &str = "Hello, world!";

fn main() {
    println!("name is: {}", HELLO_WORLD);
}
```

**静态变量**

- 静态变量与常量类似
- 命名：SCREAMING_SNAKE_CASE写法，即使用下划线作为分隔符，大写单词，例如`const MAX_NUM: u32 = 100`
- 必须标注类型
- 静态变量只能存储`'static`生命周期的引用，无需显示标注
- 访问不可变静态变量是安全的

```rust
static mut COUNTER: u32 = 0;

fn add_to_count(inc: u32) {
    unsafe {
        COUNTER += inc;
    }
}

fn main() {
    add_to_count(3);

    unsafe {
        println!("COUNTER: {}", COUNTER); // COUNTER: 3
    }
}
```

**实现不安全（unsafe）trait**

- 当某个trait中存在至少一个方法拥有编译器无法校验的不安全因素时，就称这个trait是不安全的
- 声明unsafe trait：在定义前加unsafe关键字

```rust
#![allow(unused_variables)]
fn main() {
    unsafe trait Foo {
        // methods go here
    }

    unsafe impl Foo for i32 {
        // method implementations go here
    }
}
```

**何时使用不安全代码**

使用 `unsafe` 来进行这四个操作（超级力量）之一是没有问题的，甚至是不需要深思熟虑的，不过使得 `unsafe` 代码正确也实属不易，因为编译器不能帮助保证内存安全。当有理由使用 `unsafe` 代码时，是可以这么做的，通过使用显式的 `unsafe` 标注使得在出现错误时易于追踪问题的源头

### 17.2 高级Trait

在trait定义中使用关联类型来指定占位类型

- 关联类型（associated type）是Trait中的类型占位符，它可以用于Trait的方法签名
- 可以定义出包含某些类型的trait，而在实现前无需知道这些类似是什么

举个例子

```rust
pub trait Iterator {
    type Item
    
    fn next(&mut self) -> Option<Self::Item>;
}

fn main() {
    println!("hello world")
}
```

看起来我们使用泛型也可以达到同样的效果，但是如果我们使用泛型的话就不得不在每一个实现中标注类型

```rust

fn main() {
    pub trait Iterator<T> {
        fn next(&mut self) -> Option<T>;
    }
}
```

当 trait 有泛型参数时，可以多次实现这个 trait，每次需改变泛型参数的具体类型。接着当使用 `Counter` 的 `next` 方法时，必须提供类型注解来表明希望使用 `Iterator` 的哪一个实现。

通过关联类型，则无需标注类型因为不能多次实现这个 trait。对于上面例子中使用关联类型的定义，我们只能选择一次 `Item` 会是什么类型，因为只能有一个 `impl Iterator for Counter`。当调用 `Counter` 的 `next` 时不必每次指定我们需要 `u32` 值的迭代器

![image-20230805204818435](https://cdn.fengxianhub.top/resources-master/image-20230805204818435.png)

**默认泛型参数和运算符重载**

- 可以在使用泛型参数时为泛型指定一个默认的具体类型
- 语法：`<PlaceholderType=ConcreteType>`
- 这种技术常用于运算符重载（operator overloading）
- rust不允许创建自己的运算符及重载任意的运算符
- 但可以通过实现`std::ops`中列出的那些trait来重载一部分相应的运算符

举个例子

```rust
use std::ops::Add;

#[derive(Debug, PartialEq)]
struct Point {
    x: i32,
    y: i32,
}

impl Add for Point {
    type Output = Point;

    fn add(self, other: Point) -> Point {
        Point {
            x: self.x + other.x,
            y: self.y + other.y,
        }
    }
}

fn main() {
    // 这里实现了运算符重载
    assert_eq!(Point { x: 1, y: 0 } + Point { x: 2, y: 3 },
               Point { x: 3, y: 3 });
}
```

上面的例子中实现 `Add` trait 重载 `Point` 实例的 `+` 运算符

`add` 方法将两个 `Point` 实例的 `x` 值和 `y` 值分别相加来创建一个新的 `Point`。`Add` trait 有一个叫做 `Output` 的关联类型，它用来决定 `add` 方法的返回值类型。

这里默认泛型类型位于 `Add` trait 中。这里是其定义：

```rust
fn main() {
    trait Add<RHS=Self> {
        type Output;

        fn add(self, rhs: RHS) -> Self::Output;
    }
}
```

这看来应该很熟悉，这是一个带有一个方法和一个关联类型的 trait。比较陌生的部分是尖括号中的 `RHS=Self`：这个语法叫做 **默认类型参数**（*default type parameters*）。`RHS` 是一个泛型类型参数（“right hand side” 的缩写），它用于定义 `add` 方法中的 `rhs` 参数。如果实现 `Add` trait 时不指定 `RHS` 的具体类型，`RHS` 的类型将是默认的 `Self` 类型，也就是在其上实现 `Add` 的类型。

当为 `Point` 实现 `Add` 时，使用了默认的 `RHS`，因为我们希望将两个 `Point` 实例相加。让我们看看一个实现 `Add` trait 时希望自定义 `RHS` 类型而不是使用默认类型的例子

这里有两个存放不同单元值的结构体，`Millimeters` 和 `Meters`。我们希望能够将毫米值与米值相加，并让 `Add` 的实现正确处理转换。可以为 `Millimeters` 实现 `Add` 并以 `Meters` 作为 `RHS`

举个例子

```rust
fn main() {
    use std::ops::Add;

    struct Millimeters(u32);
    struct Meters(u32);

    impl Add<Meters> for Millimeters {
        type Output = Millimeters;

        fn add(self, other: Meters) -> Millimeters {
            Millimeters(self.0 + (other.0 * 1000))
        }
    }
}
```

为了使 `Millimeters` 和 `Meters` 能够相加，我们指定 `impl Add<Meters>` 来设定 `RHS` 类型参数的值而不是使用默认的 `Self`。

默认参数类型主要用于如下两个方面：

- 扩展类型而不破坏现有代码。
- 在大部分用户都不需要的特定情况进行自定义。

标准库的 `Add` trait 就是一个第二个目的例子：大部分时候你会将两个相似的类型相加，不过它提供了自定义额外行为的能力。在 `Add` trait 定义中使用默认类型参数意味着大部分时候无需指定额外的参数。换句话说，一小部分实现的样板代码是不必要的，这样使用 trait 就更容易了。

第一个目的是相似的，但过程是反过来的：如果需要为现有 trait 增加类型参数，为其提供一个默认类型将允许我们在不破坏现有实现代码的基础上扩展 trait 的功能。

**完全限定语法（Fully Qualified Syntax）与消歧义：调用相同名称的方法**

我们先看下下面的代码，看会输出什么

```rust
fn main() {
    trait Pilot {
        fn fly(&self);
    }

    trait Wizard {
        fn fly(&self);
    }

    struct Human;

    impl Pilot for Human {
        fn fly(&self) {
            println!("This is your captain speaking.");
        }
    }

    impl Wizard for Human {
        fn fly(&self) {
            println!("Up!");
        }
    }

    impl Human {
        fn fly(&self) {
            println!("*waving arms furiously*");
        }
    }
    
    let person = Human;
    person.fly(); // *waving arms furiously*
}
```

那么怎么调用对应trait里面的方法呢？

```rust
Pilot::fly(&person);
Wizard::fly(&person);
```

但是如果我们在定义`trait`的时候没有把`self`那该怎么办呢？这个时候就可以使用完全限定语法了

完全限定语法：`<Type as Trait>::function(receiver_if_method, next_arg, ...);`

- 可以在任何调用函数或方法的地方使用
- 允许忽略那些从其他上下文能推到出来的部分
- 当rust无法区分你期望调用哪个具体实现的时候，才需要使用这种语法

举个例子

```rust
trait Animal {
    fn baby_name() -> String;
}

struct Dog;

impl Dog {
    fn baby_name() -> String {
        String::from("Spot")
    }
}

impl Animal for Dog {
    fn baby_name() -> String {
        String::from("puppy")
    }
}

fn main() {
    println!("A baby dog is called a {}", Dog::baby_name());
    // 使用完全限定语法
    println!("A baby dog is called a {}", <Dog as Animal>::baby_name());
}
```

**使用supertrait来要求trait附带其他trait的功能**

有时候我们需要在一个trait中使用其他trait的功能

- 需要被依赖的trait也被实现
- 那个被间接依赖的trait就叫做这个trait的`supertrait`

举个例子

```rust
use std::fmt;

fn main() {
    trait OutlinePrint: fmt::Display {
        fn outline_print(&self) {
            let output = self.to_string();
            let len = output.len();
            println!("{}", "*".repeat(len + 4));
            println!("*{}*", " ".repeat(len + 2));
            println!("* {} *", output);
            println!("*{}*", " ".repeat(len + 2));
            println!("{}", "*".repeat(len + 4));
        }
    }
}
```

**newtype 模式用以在外部类型上实现外部 trait**

- 孤儿规则：只有当trait或类型定义在本地包时，才能为该类型实现这个trait
- 可以通过`newtype`模式来绕过这一规则
  - 利用tuple struct构建一个新的类型

```rust
use std::fmt;

struct Wrapper(Vec<String>);

impl fmt::Display for Wrapper {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        write!(f, "[{}]", self.0.join(", "))
    }
}

fn main() {
    let w = Wrapper(vec![String::from("hello"), String::from("world")]);
    println!("w = {}", w); // w = [hello, world]
}
```

### 17.3 高级类型

使用`newtype`模式实现类型安全和抽象，我们先总结一下`newtype`模式的作用：

- 用来静态的保证各种值之间不会混淆并表明值的单位
- 为类型的某些细节提供抽象能力
- 通过轻量级的封装来隐藏内部实现的细节

**使用类型别名创建类型的同义词**

rust提供了类型别名的功能（主要用途是为了减少代码字符重复）：

- 为现有类型类型生产另外得名称（同义词）
- 并不是一个独立得类型
- 使用`type`关键字

```rust
fn main() {
    type Kilometers = i32;

    let x: i32 = 5;
    let y: Kilometers = 5;

    println!("x + y = {}", x + y);
}
```

**Never类型**

有一个名为`!`的特殊类型，其实是rust为了类型一致性引入的概念

- 它没有任何值，经常被称为空类型（empty type）
- 我们更倾向于称之为`never`类型，因为它在不返回的函数中充当返回类型

不返回值的函数也被称作发散函数（diverging function）

**动态大小和Sized Trait**

- rust需要在编译时确定为一个特定类型的值分配多少空间
- 动态大小的类型（Dynamically Sized Types，DST）
  - 在编写代码的时候使用在运行时才能确定大小的值
  - 比如类型`str`，就是只能在运行时才能确定字符串的长度（动态空间）

Rust 需要知道应该为特定类型的值分配多少内存，同时所有同一类型的值必须使用相同数量的内存。如果允许编写这样的代码，也就意味着这两个 `str` 需要占用完全相同大小的空间，不过它们有着不同的长度。这也就是为什么不可能创建  一个存放动态大小类型的变量的原因

**Rust使用动态大小类型的通用方式**

通过`&str`我们可以知道rust在存储动态大小类型时候的做法为：

- 附带一些额外的元数据来存储动态信息的大小
- 即使用动态大小类型时总会把它的值放到某种指针后面

**另外一种动态大小的类型：trait**

- 每个trait都是一个动态大小得类型，可以通过名称对其进行引用
- 为了将trait用作trait对象，必须将它放置再某种指针之后。例如`&dyn Trait`或`Box<dyn Trait>（Rc<dyn Trait>）`之后

**Sized trait**

为了处理动态大小得类型，Rust提供了一个`Sized trait`来确定一个类型的大小在编译时是否已知

- 编译时可计算出大小的类型会自动实现这一trait
- rust还会为每一个泛型函数隐式的添加Sized约束

对于如下泛型函数定义：

```rust
fn generic<T>(t: T) {
    // --snip--
}
```

实际上被当作如下处理：

```rust
fn generic<T: Sized>(t: T) {
    // --snip--
}
```

**泛型函数默认只能用于在编译时已知大小的类型。然而可以使用如下特殊语法来放宽这个限制**

```rust
fn generic<T: ?Sized>(t: &T) {
    // --snip--
}
```

`?Sized` trait bound 与 `Sized` 相对；也就是说，它可以读作 “`T` 可能是也可能不是 `Sized` 的”。这个语法只能用于 `Sized` ，而不能用于其他 trait。

另外注意我们将 `t` 参数的类型从 `T` 变为了 `&T`：因为其类型可能不是 `Sized` 的，所以需要将其置于某种指针之后。在这个例子中选择了引用

### 17.4 高级函数和闭包

函数指针

- 可以将函数传递给其他函数
- 函数在传递过程中会被强制转换为`fn`类型
- fn类型就是`函数指针（function pointer）`

```rust
fn add_one(x: i32) -> i32 {
    x + 1
}

fn do_twice(f: fn(i32) -> i32, arg: i32) -> i32 {
    f(arg) + f(arg)
}

fn main() {
    let answer = do_twice(add_one, 5);

    println!("The answer is: {}", answer); // The answer is: 12
}
```

函数指针与闭包的不同

- fn是一个类型，不是一个trait。可以直接指定fn为参数类型，不用声明一个以`Fn trait`为约束的泛型参数
- 函数指针实现了全部三种闭包trait（Fn、FnMut、FnOnce）
  - 总是可以把函数指针用作参数传递给一个接受闭包的函数
  - 所以，更加倾向于搭配闭包`trait`的泛型来编写函数：可以同时接受闭包和普通函数
- 某些情景下，只想接受`fn`而不接受闭包
  - 与外部不支持闭包的函数交互（例如c语言）

```rust
#[test]
fn test07() {
    let list_of_numbers = vec![1, 2, 3];
    let list_of_strings:Vec<String> = list_of_numbers.iter()
    									.map(|i| i.to_string())
    									.collect();
    // 可以写成这样
    let list_of_numbers = vec![1, 2, 3];
    let list_of_strings:Vec<String> = list_of_numbers.iter()
    									.map(ToString::to_string)
    									.collect();
}
```

**返回闭包**

闭包使用trait进行表达，无法在函数中直接返回一个闭包，可以将一个实现了该trait的具体类型作为返回值

![image-20230806140820732](https://cdn.fengxianhub.top/resources-master/image-20230806140820732.png)

### 17.5 宏

宏 macro：宏在rust里指的是一组相关特性的集合称谓

- 使用`macro_rules!`构建的声明宏（declarative macro）
- 三种过程宏
  - 自定义`#[derive]宏`，用于`struct`或`enum`，可以为其指定随`derive`属性添加的代码
  - 类似属性的宏，在任何条目上添加自定义属性
  - 类似函数的宏，看起来像函数调用，对其指定为参数的token进行操作

**函数与宏的差别**

- 本质上，宏是用来编写可以生成其他代码的代码（元编程，metaprogramming）
- 函数在定义签名时，必须声明参数的个数和类型，宏可处理可变的参数
- 编译器会在解释代码前展开宏
- 宏的定义比函数复杂得多，难以阅读、理解、维护
- 在某个文件调用宏时，必须提前定义宏或将宏引入当前作用域
- 函数可以在任何位置定义并在任何位置使用

**macro_rules! 申明宏（可能马上要弃用了）**

rust中最常见得宏形式：声明宏

- 类似match得模式匹配
- 需要使用`macro_rules!`

我们看看`vec!`这个宏

```rust
#[macro_export]
macro_rules! vec {
    ( $( $x:expr ),* ) => {
        {
            let mut tmp_vec = Vec::new();
            $(
                temp_vec.push($x);
            )*
            temp_vec
        }
    };
}
```

**基于属性来生成代码得过程宏**

这种形式更像函数（某种形式得过程）一些

- 接受并操作输入得rust代码
- 生成另外一些rust代码作为结果

一共有三种过程宏

- 自定义派生
- 属性宏
- 函数宏

创建过程宏时：

- 宏定义必须单独放在它们自己的包中，并使用特殊的包类型

**自定义derive宏**

现在有个需求，需要创建一个`hello_macro`包，定义一个拥有关联函数`hello_macro`的`HelloMacro trait`

- 需要提供一个能自动实现trait的过程宏
- 在它们的类型上标注`#[derive(HelloMacro)]`，进而得到`hello_macro`的默认实现

**类似属性的宏**

属性宏与自定义derive宏类似

- 允许创建新的属性
- 但不是为derive属性生成代码

属性宏更加灵活

- derive只能用于struct和enum
- 属性宏可以用于任何条目，例如函数

## 18. 构建多线程web服务器

在这里我们会把之前学习到的知识点都穿起来

- 在socket上监听TCP连接
- 解析少量的HTTP请求
- 创建一个合适的HTTP相应
- 使用线程池改进服务器的吞吐量

首先是`main.rs`，这里需要添加一个包`num_cpus = "1.0"`，用来获取CPU的核心数

```rust
use std::{
    fs,
    io::{Read, Write},
    net::{TcpListener, TcpStream},
};

use httpServer::ThreadPool;
use num_cpus;

fn main() {
    let listener = TcpListener::bind("127.0.0.1:8080").unwrap();
    // 创建一个线程池
    let pool = ThreadPool::new(num_cpus::get()); // 使用 num_cpus 库获取 CPU 核心数
    for stream in listener.incoming() {
        match stream {
            Ok(stream) => {
                // 使用多线程处理每个连接
                pool.execute(|| {
                    handle_client(stream);
                })
            }
            Err(e) => {
                eprintln!("Error accepting connection: {}", e);
            }
        }
    }
}

fn handle_client(mut stream: TcpStream) {
    // 获取客户端的IP地址和端口号
    let client_address = stream.peer_addr().unwrap();
    println!("Client connected: {}", client_address);

    // 读取客户端发送的数据
    let mut buffer = [0; 1024];
    stream.read(&mut buffer).unwrap();

    // 解析请求数据，获取请求的 Host
    let request = String::from_utf8_lossy(&buffer[..]);
    let host = extract_host_from_request(&request);

    // 打印请求的 Host 和 IP 信息
    println!("========= 新的请求开始 ===========");
    println!("Request Host: {}", host);
    println!("Client IP: {}", client_address.ip());
    // 构造响应
    let response = read_file();
    // 给客户端发送响应数据
    let response_headers = format!(
        "HTTP/1.1 200 OK\r\nContent-Type: text/html\r\nContent-Length: {}\r\n\r\n",
        response.len()
    );
    let combined_response = format!("{}{}", response_headers, response);
    stream.write(combined_response.as_bytes()).unwrap();
}

fn extract_host_from_request(request: &str) -> &str {
    // 简化的从请求中提取 Host 的逻辑，实际情况可能更复杂
    let host_start = request.find("Host: ").unwrap() + 6;
    let host_end = request[host_start..].find("\r\n").unwrap() + host_start;
    &request[host_start..host_end]
}

/// 缓存一下读取的文件 防止大量重复的磁盘IO
static mut RESPONSE: Option<String> = None;

fn read_file() -> &'static str {
    unsafe {
        if let Some(ref content) = RESPONSE {
            return content;
        }

        let content = fs::read_to_string("hello.html").unwrap();
        RESPONSE = Some(content.clone());
        RESPONSE.as_ref().unwrap()
    }
}
```

其次是`lib.rs`，主要写的是自定义线程池的逻辑

```rust
use std::sync::{mpsc, Arc, Mutex};
use std::thread;

pub struct ThreadPool {
    workers: Vec<Worker>,
    /// thread: thread::JoinHandle<()> 是一个线程句柄，用于管理工作线程的生命周期。
    /// JoinHandle 是一个类型，它可以在线程完成执行后进行线程的清理操作。
    /// 这里的 <()> 表示线程执行完成后不返回任何结果
    ///  mpsc（多个生产者，单个消费者）通道，。每个工作线程都通过循环等待接收任务，然后执行任务
    sender: mpsc::Sender<Job>,
}

impl ThreadPool {
    pub fn new(size: usize) -> ThreadPool {
        assert!(size > 0);

        let (sender, receiver) = mpsc::channel();
        let receiver = Arc::new(Mutex::new(receiver));

        let mut workers = Vec::with_capacity(size);
        for id in 0..size {
            workers.push(Worker::new(id, Arc::clone(&receiver)));
        }

        ThreadPool { workers, sender }
    }

    pub fn execute<F>(&self, f: F)
    where
        F: FnOnce() + Send + 'static,
    {
        let job = Box::new(f);
        self.sender.send(job).unwrap();
    }
}

struct Worker {
    id: usize,
    thread: thread::JoinHandle<()>,
}

type Job = Box<dyn FnOnce() + Send + 'static>;

impl Worker {
    fn new(id: usize, receiver: Arc<Mutex<mpsc::Receiver<Job>>>) -> Worker {
        let thread = thread::spawn(move || loop {
            let job = receiver.lock().unwrap().recv().unwrap();

            println!("Worker {} got a job; executing.", id);

            job();
        });

        Worker { id, thread }
    }
}

```

压测一把

![image-20230806164438755](https://cdn.fengxianhub.top/resources-master/image-20230806164438755.png)

相比之下如果使用golang原生的`http`库压测能到1w＋的qps，主要是原生就已经支持io多路复用了

这里我们再使用`actix-web`库起一个io多路复用的服务器压测试试

```toml
actix-web = "3.0"
```

```rust
use actix_web::{web, App, HttpServer, Responder};

async fn hello() -> impl Responder {
    "Hello, World!"
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    HttpServer::new(|| {
        App::new()
            .route("/hello", web::get().to(hello))
    })
        .bind("127.0.0.1:8080")?
        .run()
        .await
}
```

最后压测结果也能达到1w的qps

![image-20230806173924915](https://cdn.fengxianhub.top/resources-master/image-20230806173924915.png)















