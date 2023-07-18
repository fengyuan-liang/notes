# rust基础

>rust的优点有：高效、安全性、无所畏惧的并发
>
>参考资料：
>
>- rust程序设计语言：https://rust.bootcss.com/title-page.html
>- rust权威指南：https://kaisery.github.io/trpl-zh-cn/foreword.html

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
  - crate名宇package名相同
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

#### 9.2.4 trait的默认实现

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











