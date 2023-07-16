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
    le吧 t x = 5;
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









