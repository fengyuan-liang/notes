# GoLang基础语法

我们首先来看一下GO语言概述：

- Go语言是谷歌2009年发布的第二款开源编程语言,它专门针对多处理器系统应用程序的编程进行了优化，它是一种系统语言其非常有用和强大，其程序可以媲美C或C++代码的速度，而且更加安全、支持并行进程。
- Go支持面向对象，而且具有真正的闭包(closures)和反射 (reflection)等功能。
- Go可以在不损失应用程序性能的情况下降低代码的复杂性

>值得一提的是Go的logo并不是`土拨鼠`，而是一只`金花鼠`，这只金花鼠叫做`gordon`，是golang创始人之一的`Rob Pike`妻子`Renee French`设计的

![image-20221217010625323](https://cdn.fengxianhub.top/resources-master/202212170106455.png)

这里放一些比较好的学习资料

- [煎鱼 (eddycjy.com)](https://eddycjy.com/)

- [Go 教程_w3cschool](https://www.w3cschool.cn/go/)
- [Go语言入门教程，Golang入门教程（非常详细） (biancheng.net)](http://c.biancheng.net/golang/)

在安装完GO的环境之后需要设置一些环境

我们可以先查看自己的环境

```go
$ go env
set GO111MODULE=on
set GOARCH=amd64
set GOBIN=
set GOCACHE=C:\Users\hw\AppData\Local\go-build
set GOENV=C:\Users\hw\AppData\Roaming\go\env
set GOEXE=.exe
set GOEXPERIMENT=
set GOFLAGS=
set GOHOSTARCH=amd64
set GOHOSTOS=windows
set GOINSECURE=
set GOMODCACHE=D:\Environment\Go\go1.17.7\pkg\mod
set GONOPROXY=
set GONOSUMDB=
set GOOS=windows
set GOPATH=D:\Environment\Go\go1.17.7
set GOPRIVATE=
set GOPROXY=https://proxy.golang.org,direct
set GOROOT=D:\Environment\Go\go1.17.7
set GOSUMDB=sum.golang.org
set GOTMPDIR=
set GOTOOLDIR=D:\Environment\Go\go1.17.7\pkg\tool\windows_amd64
set GOVCS=
set GOVERSION=go1.17.7
set GCCGO=gccgo
set AR=ar
set CC=gcc
set CXX=g++
set CGO_ENABLED=1
set GOMOD=NUL
set CGO_CFLAGS=-g -O2
set CGO_CPPFLAGS=
set CGO_CXXFLAGS=-g -O2
set CGO_FFLAGS=-g -O2
set CGO_LDFLAGS=-g -O2
set PKG_CONFIG=pkg-config
set GOGCCFLAGS=-m64 -mthreads -fno-caret-diagnostics -Qunused-arguments -fmessage-length=0 -fdebug-prefix-map=C:\Users\hw\AppData\Local\Temp\go-build404222129=/tmp/go-build -gno-record-gcc-switches
```

需要设置以下两个（win用户请使用`powershell`）

```go
# 使用go module管理依赖 1.19后默认开启
go env -w GO111MODULE=on
# 设置代理，防止墙导致下不到包
go env -w GOPROXY="http://goproxy.cn"
```



## 1. Go相关命令

直接在终端中输入 `go help` 即可显示所有的 go 命令以及相应命令功能简介，主要有下面这些:

- build: 编译包和依赖
- clean: 移除对象文件
- doc: 显示包或者符号的文档
- env: 打印go的环境信息
- bug: 启动错误报告
- fix: 运行go tool fix
- fmt: 运行gofmt进行格式化

## 2. 基础语法

### 2.1 常量之iota

iota，特殊常量，可以认为是一个可以被编译器修改的常量。

在每一个`const`关键字出现时，被重置为0，然后再下一个`const`出现之前，每出现一次`iota`，其所代表的数字会自动增加1

```go
const (
    a = iota
    b = iota
    c = iota
)
fmt.Printf("a: %v\n", a)
fmt.Printf("b: %v\n", b)
fmt.Printf("c: %v\n", c)
// 输出
a: 0
b: 1
c: 2
```

第一个 iota 等于 0，每当 iota 在新的一行被使用时，它的值都会自动加 1；所以 a=0, b=1, c=2 可以简写为如下形式：

```go
const (
    a = iota
    b
    c
)
```

再看一下下面的操作（中间插队）

```go
const (
    a = iota   //0
    b          //1
    c          //2
    d = "ha"   //独立值，iota += 1
    e          //"ha"   iota += 1
    f = 100    //iota +=1
    g          //100  iota +=1
    h = iota   //7,恢复计数
    i          //8
)
fmt.Println(a,b,c,d,e,f,g,h,i) // 0 1 2 ha ha 100 100 7 8
```

当然当常量出现但是我们不想要自增的时候可以用下划线`_`来避免自增

```go
const (
	a1 = iota
	_ // 下划线可以跳过一次自增
	a2 = iota
)
fmt.Printf("a1: %v\n", a1)
fmt.Printf("a2: %v\n", a2)
// a1: 0 a2: 2
```

### 2.2 数据类型

```go
package main

import "fmt"

func main() {
	// 基本类型
	var name string = "eureka"
	age := 20
	b := true
	fmt.Printf("%T\n", name) // string
	fmt.Printf("%T\n", age) // int
	fmt.Printf("%T\n", b) // bool

	// 指针类型
	a := 100
	p := &a
	fmt.Printf("%T\n", p) // *int

	// 数组类型
	arr := [2]int {1, 2}
	fmt.Printf("%T\n", arr) // [2]int

	// 切片类型
	arr2 := []int {1, 2}
	fmt.Printf("%T\n", arr2) // []int

	// 函数类型
	fmt.Printf("%T\n", func1) // func() (string, int)
}

func func1() (name string , age int) {
	return "张三", 18
}
```

### 2.3 number类型

uint 无符号int













### 2.4 string类型

```go
package main

import (
	"bytes"
	"fmt"
	"strings"
)

func main() {
	var s string = "hello world"
	var s1 = "hello world"
	s3 := "hello world"
	fmt.Printf("s: %v\n", s)
	fmt.Printf("s1: %v\n", s1)
	fmt.Printf("s3: %v\n", s3)

	// 多行字符串
	s4 := `
		line 1
		line 2
		line 3
	`
	fmt.Printf("s4: %v\n", s4)

	// 字符串的连接
	s5 := "tom"
	s6 := "20"
	s7 := s5 + s6
	fmt.Printf("s7: %v\n", s7)

	// 使用strings.Join进行连接
	s2 := strings.Join([]string{s5, s6}, ",")
	fmt.Printf("s2: %v\n", s2)

	// 使用buffer进行连接，效率比较高
	var buffer bytes.Buffer
	buffer.WriteString("tom")
	buffer.WriteString(",")
	buffer.WriteString("20")
	fmt.Printf("buffer.String(): %v\n", buffer.String())

	// 转义字符
	s8 := "hello \n world"
	fmt.Printf("s8: %v\n", s8)

	// =========   字符串切片   =========
	str := "hello-world"
	n1 := 3
	n2 := 5
	fmt.Printf("str[n1]: %c\n", str[n1])
	fmt.Printf("str[n2]: %c\n", str[n2])
	// 输出前闭后开的区间
	fmt.Printf("str[n1:n2]: %v\n", str[n1:n2])
	// 从n1到结束，左开
	fmt.Printf("str[a:]: %v\n", str[n1:])
	// 从0到n2，右闭
	fmt.Printf("str[:n2]: %v\n", str[:n2])

	// ===========  字符串常用函数  ===========
	// 查看字符串的长度
	fmt.Printf("len(str): %v\n", len(str))
	// 分割数组
	fmt.Printf("strings.Split(str, \"\"): %v\n", strings.Split(str, ""))
	// 是否包含某个串
	fmt.Printf("strings.Contains(str, \"hello\"): %v\n", strings.Contains(str, "hello"))
	// 大小写转换
	fmt.Printf("strings.ToLower(str): %v\n", strings.ToLower(str))
	fmt.Printf("strings.ToUpper(str): %v\n", strings.ToUpper(str))
	// 以什么开头，以什么结尾
	fmt.Printf("strings.HasPrefix(str, \"hello\"): %v\n", strings.HasPrefix(str, "hello"))
	fmt.Printf("strings.HasSuffix(s, \"world\"): %v\n", strings.HasSuffix(s, "world"))
	
}
```

```go
[Running] go run "e:\workSpace_goLand\study\mypro\test_string.go"
s: hello world
s1: hello world
s3: hello world
s4: 
		line 1
		line 2
		line 3
	
s7: tom20
s2: tom,20
buffer.String(): tom,20
s8: hello 
 world
str[n1]: l
str[n2]: -
str[n1:n2]: lo
str[a:]: lo-world
str[:n2]: hello
len(str): 11
strings.Split(str, ""): [h e l l o - w o r l d]
strings.Contains(str, "hello"): true
strings.ToLower(str): hello-world
strings.ToUpper(str): HELLO-WORLD
strings.HasPrefix(str, "hello"): true
strings.HasSuffix(s, "world"): true
```

### 2.5 格式化输出

```go
package main

import "fmt"

// 定义一个结构体
type WebSite struct {
	Name string
}

func main() {
	// 使用结构体
	site := WebSite{Name: "douke360"}
	// %v 表示val，任意类型输出
	fmt.Printf("site: %v\n", site)
	// %#v输出时带包名
	fmt.Printf("site: %#v\n", site)
	// %T表示输出类型
	fmt.Printf("site: %T\n", site)
	// bool类型占位符%t
	b := true
	fmt.Printf("b: %t\n", b)
}
```

### 2.6 运算符

在golang中自增`i++`和自减`i--`是单独的语句，需要单独成一行

![image-20221231163153423](https://cdn.fengxianhub.top/resources-master/202212311631719.png)

### 2.7 for循环

```go
package main

import (
	"fmt"
	"time"
)

// go中只有for循环，没有while和do while循环
func main() {
	f4()
}

// 普通的for循环
func f1() {
	for i := 0; i < 10; i++ {
		fmt.Printf("i:%v\n", i)
	}
}

// 缺省的for循环

func f2() {
	i := 0
	for ; i < 10; i++ {
		fmt.Printf("i:%v\n", i)
	}
}

// 可以当做while来使用
func f3() {
	var i int = 0
	for i < 10 {
		fmt.Printf("i:%v\n", i)
		i++
	}
}

// 死循环
func f4 () {
	for {
		fmt.Printf("一直循环，Now is %v\n", time.Now())
	}
}

```

>类似于Java的forEach循环的`for range`循环

```go
package main

import "fmt"

func main() {
	f1()
}

func f1() {
	// 先定义一个数组，可以加点省略长度
	var arr = [...]int{1, 2, 3}
	// 进行for range循环，类似于java的forEach
	// i为索引 v为每次循环的值
	for i, v := range arr {
		fmt.Printf("i: %v，v：%v\n", i, v)
	}
}
// 当我们不想要一个变量时可以用下划线 _ 表示是一个匿名变量
func f2() {
	var arr = [...]int{1, 2, 3}
	// 使用匿名变量
	for _, v := range arr {
		fmt.Printf("v：%v\n", v)
	}
}
// 声明切片
func f3() {
	var s = []int {1, 2, 3}
	for _, v := range s {
		fmt.Printf("v：%v\n", v)
	}
}

// 使用标签和goto语句
func f4() {
    // 申明跳转的标签
	MYLABEL:
	for i := 0; i < 10; i++ {
		if i >= 5 {
            // 跳出后不会再进入循环了
			break MYLABEL
		}
	}
	fmt.Println("END...")
}

// goto 语句
func f4() {
	for i := 0; i < 100; i++ {
		if i == 5 {
			fmt.Printf("i: %v\n", i)
			goto END
		}
	}
	END:
	fmt.Println("END ...")
}
```

### 2.8 数组

```go
package main

import "fmt"

func main() {
	f1()
}

func f1() {
	var a1 [2]int
	var a2 [3]string
	var a3 [2]bool
	fmt.Printf("a1: %T\n", a1) // a1: [2]int
	fmt.Printf("a2: %T\n", a2) // a2: [3]string
	fmt.Printf("a3: %v\n", a3) // a3: [false false]
	// 初始化列表，如果缺了会补默认值
	var a4 = [3]int{0, 1, 2}
	fmt.Printf("a4:%v\n", a4) // a4:[0 1 2]
	// 数组的长度可以省略
	var a5 = [...]bool {true, false}
	fmt.Printf("a5: %v\n", a5) // a5: [true false]
	// 可以通过下标进行初始化，其他的会取默认值
	var a6 = [...]int {0: 1, 3:5}
	fmt.Printf("a6: %v\n", a6) // a6: [1 0 0 5]
}

```

数组的遍历

```go
package main

import "fmt"

func main() {
	f2()
}

func f2() {
	// 数组的遍历 1. 根据长度和下标
	var a1 = [3]int {1, 2, 3}
	for i := 0; i < len(a1); i++ {
		// 1. 通过下标进行访问
		fmt.Printf("a1[%v]: %v\n", i, a1[i])
	}
	// 2. 通过for range进行遍历
	for i,v := range a1 {
		fmt.Printf("i: %v，v：%v\n", i, v)
	}
}

func f1() {
	var a1 [2]int
	a1[0] = 100
	a1[1] = 200
	fmt.Println("-----------")
	// 数组越界问题
	fmt.Printf("a1[1]: %v\n", a1[1])
	// 编译器会进行报错
	// fmt.Printf("a1[3]: %v\n", a1[3])
	// 打印数组的长度
	fmt.Printf("len(a1): %v\n", len(a1))
}
```

### 2.9 切片

```go
package main

import "fmt"

func main() {
	f1()
}

// 数组和切片一样，也拥有以下的特性
func f2() {
	var s1 = []int{0, 1, 2, 3, 4}
	// 进行切片
	fmt.Printf("s1[0:3]: %v\n", s1[0:3]) // s2: [0 1 2]
	// 切片是左开右闭
	fmt.Printf("s1[3:]: %v\n", s1[3:]) // s1[3:]: [3 4]
	fmt.Printf("s1[2:5]: %v\n", s1[2:5]) // s1[2:5]: [2 3 4]
	// 全切
	fmt.Printf("s1[:]: %v\n", s1[:]) // s1[:]: [0 1 2 3 4]
}

// 可以通过指定下标进行切片
func f1() {
	var s1 = []int{0, 1, 2, 3, 4}
	// 进行切片
	fmt.Printf("s1[0:3]: %v\n", s1[0:3]) // s2: [0 1 2]
	// 切片是左开右闭
	fmt.Printf("s1[3:]: %v\n", s1[3:]) // s1[3:]: [3 4]
	fmt.Printf("s1[2:5]: %v\n", s1[2:5]) // s1[2:5]: [2 3 4]
	// 全切
	fmt.Printf("s1[:]: %v\n", s1[:]) // s1[:]: [0 1 2 3 4]
}
```

>切片的`CRUD`

```go
package main

import "fmt"

func main() {
	f3()
}

// 深拷贝和浅拷贝
func f3() {
	var s1 = []int {1, 2, 3, 4}
	var s2 = []int {}
	// 引用传递 浅拷贝
    s2 = s1
	s1[1] = 100
	fmt.Printf("s2: %v\n", s2) // s2: [1 100 3 4]
	// 深拷贝，需要先分配内存空间
	var s3 = make([]int, 4)
	// copy(目标，源)
	copy(s3, s1)
	s1[1] = 200
	fmt.Printf("s2: %v\n", s3)
}

// query
func query() {
	var s1 = []int {1, 2, 3, 4}
	for i := 0; i < len(s1); i++ {
		fmt.Printf("s1[i]: %v\n", s1[i])
	}
}

// update
func update() {
	var s1 = []int {1, 2, 3, 4}
	s1[1] = 100
	fmt.Printf("s1: %v\n", s1)
}

// del
// 删除公式：a = append(a[:index], a[index + 1]...)
func f2 () {
	var s1 = []int {1, 2, 3, 4}
	var s2 = []int {}
	// ...是展开符，作用是将切片打散成个一个个元素，减少了代码量
	s2 = append(s2, s1[:2]...)
	s2 = append(s2, s1[3:]...)
	fmt.Printf("s1: %v\n", s2)
}

// 可以通过append添加元素
func f1() {
	var s1 = []int{}
	// 添加
	s1 = append(s1, 100)
	s1 = append(s1, 200)
	s1 = append(s1, 300)
	fmt.Printf("s1: %v\n", s1)
}
```

### 2.10 map相关

```go
package main

import "fmt"

func main() {
	test4()
}

// for Range遍历map
func test4() {
	var m1 = map[string]string {"name":"liang", "age":"20", "email":"liang@foxmail.com"}
	for index, v := range m1 {
		fmt.Printf("index: %v\n", index)
		fmt.Printf("v: %v\n", v)
	}
}

func test3() {
	var m1 = map[string]string {"name":"liang", "age":"20", "email":"liang@foxmail.com"}
	key := "name"
	// 通过key获取value
	fmt.Printf("m1[key]: %v\n", m1[key])
	// 如果存在返回true 反之返回false
	k1 := "name2"
	v, ok := m1[k1]
	fmt.Printf("v: %v\n", v)
	fmt.Printf("ok: %v\n", ok)
	fmt.Println("---------------------")
	k2 := "name"
	v, ok = m1[k2]
	fmt.Printf("v: %v\n", v)
	fmt.Printf("ok: %v\n", ok)
}

func testMap2() {
	// 添加元素
	// 1. 在声明的时候进行赋值
	var m1 = map[string]string {"name":"liang", "age":"20", "email":"liang@foxmail.com"}
	fmt.Printf("m1: %v\n", m1)
	// 2. make分配内存之后再赋值
	m2 := make(map[string]string)
	m2["name"] = "tom"
	m2["age"] = "20"
	m2["email"] = "liang@foxmail.com"
	fmt.Printf("m2: %v\n", m2)
}

func testMap1() {
	var m1 map[string]string
	m1 = make(map[string]string)
	fmt.Printf("m1: %v\n", m1)
	fmt.Printf("m1: %T\n", m1)
}
```

### 2.11 函数

>函数的go语言中的`一级公民`，我们把所有的功能单元都定义在函数中，可以重复使用。函数包含函数的`名称`、`参数列表`和返`回值`类型，这些构成了`函数的签名(signature)`

#### 2.11.1 golang中函数特性

1. go语言中有3种函数：**普通函数**、**匿名函数(没有名称的函数)**、**方法(定义在struct 上的函数)**。
2. go语言中不允许函数重载(overload)，也就是说不允许函数同名。
3. go语言中的函数不能嵌套函数，但可以嵌套匿名函数。
4. 函数是一个值，可以将函数赋值给变量，使得这个变量也成为函数。
5. 函数可以作为参数传递给另一个函数。
6. 函数的返回值可以是一个函数。
7. 函数调用的时候，如果有参数传递给函数，则先拷贝参数的副本，再将副本传递给函数。
8. 函数参数可以没有名称。

#### 2.11.2 函数的定义

函数在使用之前必须先定义，可以调用函数来完成某个任务。函数可以重复调用，从而达到代码重用。

```go
// go中支持多返回值，所以返回参数放到后面了
func function_name([parameter list]) [return_types] {
    // 函数体
}
```

**语法解析：**

- `func`：函数由`func`声明
- `function_name`：函数名称，函数名和参数列表一起构成了函数签名
- `[parameter list]`：参数列表，参数就像一个占位符，当函数被调用时，你可以将值传递给参数，这个值被称为实际参数。参数列表指定的是参数类型、顺序以及参数个数。参数是可选的，也可以说函数也可以不包含参数
- `[return_types]`：返回类型，函数返回一列值。`return_types`是该列值的数据类型。有些功能不需要返回值，这种情况下`return_types`就不是必须的了

**举个栗子：**

```go
package main

import "fmt"

func main() {
	r := sum(3, 4)
	fmt.Printf("r: %v\n", r)
}

// 定义一个求和函数
func sum(a int, b int) (returnValue int) {
	returnValue = a + b
	return returnValue
}

// 定义一个比较两个数大小的函数
func compare(a int, b int) (max int) {
	if a > b {
		max = a
	} else {
		max = b
	}
	return max
}
// 没有返回值
func f1() {
	fmt.Println("没有返回值的函数...")
}
// 有一个返回值
func sum2(a int, b int) (ret int) {
	return a + b
}
// 多个返回值
func f2() (name string, age int) {
	return "张三", 18
}
// 有多个返回值，但是返回值名称没有被使用
func f3()(name string, age int) {
	name = "张三"
	age = 18
	return // 相当于 return name, age
}
// return覆盖返回值 返回值名称没有被使用
func f4() (name string, age int) {
	n := "张三"
	a := 18
	return n,a
}

```

>- GO中经常会使用其中一个返回值作为函数是否执行成功，是否有错误信息的判断条件。例如`return value, exists`、`return value, ok`、`return value, err`等
>- 当函数的返回值过多时，例如有四个以上的返回值，应该将这些返回值收集到`容器`中，然后以返回容器的方式去返回。例如，同类型的返回值可以放到`splice`中，不同类型的返回值可以放到`map`中
>- 当函数由多个返回值时，如果其中某个或某几个返回值不想使用，可以通过下划线`_`来丢弃这些返回值

#### 2.11.3 函数的参数

- go语言函数可以有0或多个参数，参数需要指定数据类型。
- 声明函数时的参数列表叫做形参，调用时传递的参数叫做实参。
- go语言是通过传值的方式传参的，意味着传递给函数的是拷贝后的副本，所以函数内部访问、修改的也是这个副本。

>go语言可以使用变长参数，有时候并不能确定参数的个数，可以使用变长参数，可以在函数定义语句的参数部分使用`ARGS ...TYPE`的方式。这时会将`...`代表的参数全部保存到一个名为`ARGS`的`slice`中，注意这些参数的数据类型都是`TYPE`。

```go
package main

import "fmt"

func main() {
	// 这里的sum就是实参
	sum := sum(1, 9)
	fmt.Printf("sum: %v\n", sum)
	// 形参不会改变实参
	cnt := 100
	f1(cnt)
	fmt.Printf("cnt: %v\n", cnt) // 100
	// 引用类型会改变实参
	var m1 = map[string]string{"name": "张三"}
	f2(m1)
	fmt.Printf("m1: %v\n", m1) // map[name:李四]
	// 可变参数
	f3(1, 2, 3, 4, 5)
	// 多种类型可变长参数
	f4("张三", false, 1, 2, 3, 4, 5)
}

// 返回值的名称可以省略
func sum(a int, b int) int {
	// 这里的a b就是形参
	return a + b
}

func f1(a int) {
	// 修改基本数据类型的形参的值并不会改变实参，这里和java不一样，java中只有值传递(传内存地址)
	a = 200
}

// map slice interface channel这些数据类型本身就是指针类型，所以就算是拷贝值也是拷贝指针
// 拷贝后的参数任然指向底层的数据结构，所以可能会影响实参
func f2(m1 map[string]string) {
	m1["name"] = "李四"
}

// 可变长参数传递
func f3(args ...int) {
	for _, v := range args {
		fmt.Printf("v: %v\n", v)
	}
}

// 多种类型的可变长参数传递
func f4(name string, ok bool, args ...int) {
	fmt.Printf("name: %v\n", name)
	fmt.Printf("ok: %v\n", ok)
	for _, v := range args {
		fmt.Printf("v: %v\n", v)
	}
}

```

#### 2.11.4 函数类型和变量

```go
package main

import "fmt"

func main() {
	// ff:=sum 就没有函数类型的事了，属于函数调用，你仔细想想这其实就是多态的思想
	type f1 func(int, int) int
	var ff f1
	ff = sum
	i := ff(1, 2)
	fmt.Printf("i: %v\n", i)
	// 也可以赋值给max，因为函数签名是一样的
	ff = max
	i2 := ff(1, 2)
	fmt.Printf("i2: %v\n", i2)
}

func sum(a int, b int) int {
	return a + b
}
func max(a int, b int) int {
	if a > b {
		return a
	}
	return b
}
func test01() {

}
```

#### 2.11.5 go高阶函数

**go语言的函数，可以作为函数的参数，传递给另外一个函数，作为另外一个函数的返回值返回**

```go
package main

import "fmt"

func main() {
	test("张三", sayHello)
	ff := cal("+")
	i := ff(1, 2)
	fmt.Printf("i: %v\n", i) // i: 3
}

func sayHello(name string) {
	fmt.Printf("Hello,%s\n", name)
}

// 函数作为参数
func test(name string, f func(string)) {
	f(name)
}
func add(a int, b int) int {
	return a + b
}

func sub(a int, b int) int {
	return a - b
}
// 函数作为返回值
func cal(operator string) func(int, int) int {
	switch operator {
	case "+":
		return add
	case "-":
		return sub
	default:
		return nil
	}
}

```

#### 2.11.6 匿名函数

go语言函数不能嵌套，但是在函数内部可以定义匿名函数，实现一下简单功能调用。所谓匿名函数就是，没有名称的函数。

语法格式如下：

```go
func (参数列表) (返回值)
```

>当然可以既没有参数也没有返回值

```go
package main

import "fmt"

func main() {
	// 匿名函数
	max := func(a int, b int) int {
		if a > b {
			return a
		}
		return b
	}
	fmt.Printf("max(1, 2): %v\n", max(1, 2))
	// 自己调用自己
	r := func(a int, b int) int {
		if a > b {
			return a
		}else {
			return b
		}
	}(1, 2)
	fmt.Printf("r: %v\n", r)
}
// 匿名函数的作用是在函数内部做一些运算
func test() {
	name := "张三"
	age := "20"
	f1 := func() string {
		return name + age
	}
	msg := f1()
	fmt.Printf("msg: %v\n", msg)
}
```

#### 2.11.7 闭包

闭包可以理解成定义在一个函数内部的函数。在本质上，闭包是将函数内部和函数外部连接起来的桥梁。或者说是函数和其引用环境的组合体。

闭包指的是一个**函数和与其相关的引用环境组合而成的实体**。简单来说，`闭包 = 函数 + 引用环境`。

```go
package main

import "fmt"

func main() {
	f := add()
	r := f(10)
	fmt.Printf("r: %v\n", r) // r: 10
	r = f(20)
	fmt.Printf("r: %v\n", r) // r: 30
}

func add() func(y int) int {
	var x int
    // 其实这里提升了变量x的作用域，从栈空间到堆空间了
	return func(y int) int {
		x += y
		return x
	}
}
```

### 2.12 递归

函数内部调用函数自身的函数称为递归函数。

**使用递归函数最重要的三点**:

>1. 递归就是自己调用自己。
>2. 必须先定义函数的退出条件，没有退出条件，递归将成为死循环。
>3. go语言递归函数很可能会产生一大堆的`goroutine`，也很可能会出现`栈空间内存溢出`问题。

```go
package main

import "fmt"

func main() {
	fmt.Println(f1())
	fmt.Printf("fibonacciSequence(10): %v\n", fibonacciSequence(10))
}
func f1() int {
	s := 1
	for i := 1; i <= 5; i++ {
		s *= i
	}
	return s
}

func fibonacciSequence(n int) int {
	// 断点判断
	if n < 2 {
		return 1
	}else {
		return fibonacciSequence(n - 1) + fibonacciSequence(n - 2)
	}
}
```

### 2.13 def

go语言中的`defer`语句会将其后面跟随的语句进行延迟处理。在`defer`归属的函数即将返回时，将延迟处理的语句按`defer`定义的逆序进行执行，也就是说，先被`defer`的语句最后被执行，最后被`defer`的语句，最先被执行。stack

#### 2.13.1 defer特性

1. 关键字`defer`用于注册延迟调用
2. 这些调用直到`return`前才会被执行，因此，可以用来做资源清理
3. 多个`defer`语句，按照先进后出的方式执行
4. `defer`语句中的变量，在`defer`声明时就决定了

#### 2.13.2 defer用途

1. 关闭文件句柄
2. 锁资源释放
3. 数据库连接释放

**举个栗子：**

```go
package main

import "fmt"

func main() {
	fmt.Println("start...")
	defer fmt.Println("step1...")
	defer fmt.Println("step2...")
	defer fmt.Println("step3...")
	defer fmt.Println("step4...")
	fmt.Println("end...")
}
```

运行结果（类似于栈，先进入的后执行）：

```go
start...
end...
step4...
step3...
step2...
step1...
```

### 2.14 init函数

golang有一个特殊的函数init函数，先于main函数执行，实现包级别的一些初始化操作。

#### 2.14.1 init函数特点

**init函数的特点有：**

1. `init`函数先于`main`函数**自动执行**，不能被其他函数调用
2. `init`函数没有输入参数、返回值
3. 每个包可以有多个`init`函数
4. 包的每个源文件也可以有多个`init`函数，这点比较特殊
5. 同一个包的`init`执行顺序，golang没有明确定义，编程时要注意程序不要依赖这个执行顺序
6. 不同包的`init`函数按照包导入的依赖关系决定执行顺序

#### 2.14.2 golang初始化顺序

```go
变量初始化  ->  init()  ->  main()
```

举个栗子：

```go
package main

import "fmt"

var i int = initVar()
func main() {
	fmt.Println("main...")
}

func init() {
	fmt.Println("init...")
}

func initVar() int {
	fmt.Println("initVar...")
	return 100
}
```

执行结果：

```go
initVar...
init...
main...
```

### 2.15 🎯golang指针

Go语言中的函数传参都是**值拷贝**，当我们想要修改某个变量的时候，我们可以创建一个指向该变量地址的指针变量。**传递数据使用指针，而无须拷贝数据**。

类型指针不能进行偏移和运算。

Go语言中的指针操作非常简单，只需要记住两个符号：`&`（取地址）和`*`（根据地址取值）

#### 2.15.1 指针地址和指针类型

- 每个变量在运行时都拥有一个地址，这个地址代表变量在内存中的位置，GO使用`&`取地址符在变量前面对变量进行`取地址`操作
- Go中值的类型，如`int、float、bool、string、array、struct`都有对应的指针类型`*int、*int64、*string`等等

#### 2.15.2 指针语法

一个指针变量指向了一个值的内存地址（也就是说声明了一个指针只有，可以像变量赋值一样，把一个值的内存地址放入到指针当中）

类似于变量和常量，在使用指针前你需要声明指针，格式如下：

```go
var var_name *var_type
```

- `var_type`：指针类型
- `var_name`：指针变量名
- `*`：用于指定变量是作为一个指针

```go
package main

import "fmt"

func main() {
	var ip *int
	fmt.Printf("ip: %v\n", ip) // ip: <nil>
	fmt.Printf("ip: %T\n", ip) // ip: *int
	// 给指针赋值
	var i int = 100
	ip = &i
	fmt.Printf("ip: %v\n", ip) // ip: 0xc0000140e0
	// 取值
	fmt.Printf("ip: %v\n", *ip) // ip: 100
	// 字符串
	var sp *string
	s := "hello"
	sp = &s
	fmt.Printf("sp: %v\n", sp) // sp: 0xc00004c230
	fmt.Printf("sp: %v\n", *sp)  // sp: hello
	// bool类型
	var bp *bool
	var b bool = true
	fmt.Printf("bp: %v\n", bp) // bp: <nil>
	bp = &b
	fmt.Printf("bp: %v\n", bp) // bp: 0xc0000140e8
	fmt.Printf("bp: %v\n", *bp) // bp: true
}
```

#### 2.15.3 指向数组的指针

定义语法：

```go
// 数组里面的元素的类型是指针
var ptr [MAX]*int 
```

举个栗子：

```go
package main

import "fmt"

func main() {
	a := [3]int{1, 2, 3}
	var pa [3]*int
	fmt.Printf("pa: %v\n", pa)
	for i := 0; i < len(a); i++ {
		pa[i] = &a[i]
	}
	fmt.Printf("pa: %v\n", pa)
	// 打印指针数组的值
	for _, v := range pa {
		fmt.Printf("v: %v\n", v)
		fmt.Printf("v: %v\n", *v)
	}
}
```

>注意：在`golang`中并不能想`c`语言一样进行指针运算，例如：`point ++`

### 2.16 golang类型定义和类型别名

在介绍`结构体`之前，我们需要先看看什么是**类型定义**和**类型别名**

1. 类型定义相当于定义了**一个全新的类型**，与之前的类型不同；但是类型别名并没有定义一个新的类型，而是使用一个别名来替换之前的类型
2. 类型别名只会在**代码**中存在，在编译完成之后并**不会存在该别名**
3. 因为类型别名和原来的类型是一致的，所以原来类型所拥有的方法，类型别名中也可以调用，但是如果是重新定义的一个类型，那么**不可以**调用之前的任何方法

**golang类型定义的语法：**

```go
type NewType Type
```

**golang类型别名的语法：**

```go
type NewType = Type
```

栗子：

```go
package main

import "fmt"

func main() {
	// 类型定义
	type MyInt int
	var i MyInt
	i = 100
	fmt.Printf("i: %T\n", i) // i: main.MyInt
	fmt.Printf("i: %v\n", i) // i: 100
	// 类型别名
	type MyInt2 = int
	var i2 MyInt2
	i2 = 100
	fmt.Printf("i2: %T\n", i2) // i2: int
	fmt.Printf("i2: %v\n", i2) // i2: 100
}
```

### 2.17 🎯golang结构体

golang中没有`面向对象`的概念了，但是可以使用结构体类实现面向对象的一些特性，例如：继承、多态等

#### 2.17.1 golang结构体的定义

结构体的定义和类型定义类似，只不过多了一个`struct`关键字，语法如下：

```go
type struct_variable_type struct {
    member definition;
    member definition;
    ...
    member definition;
}
```

- `type`：结构体定义关键字
- `struct_variable_type`：结构体类型名称
- `struct`：结构体定义关键字
- `member definition`：成员定义

举个栗子：

下面我们定义一个人的结构体Person

```go
type Person struct {
    id int
    name string
    age int
    email string
}
```

相同类型也可以**合并到一行**，例如：

```go
type Person struct {
    id, age int
    name, email string 
}
```

声明一个结构体变量和声明一个普通变量相同，例如：

```go
var tom Person
```

当然还可以申明匿名结构体

```go
package main

import "fmt"

func main() {
	var tom Person
    // 未初始化的结构体，成员都是类型的默认值
	fmt.Printf("tom: %v\n", tom) // tom: {0 0  }
	// 可以通过 . 运算符进行访问
	tom.id = 101
	tom.name = "tom"
	tom.age = 20
	tom.email = "xxx@xxx.com"
	fmt.Printf("tom: %v\n", tom) // tom: {101 20 tom xxx@xxx.com}
	// 定义匿名结构体
	var eureka struct {
		id int
		name string
		age int
	}
	eureka.id = 102
	eureka.name = "eureka"
	eureka.age = 18
	fmt.Printf("eureka:%v\n", eureka) //  eureka:{102 eureka 18}
}

// 定义一个结构体
type Person struct {
	id, age     int
	name, email string
}
```

#### 2.17.2 结构体初始化

- 使用值的列表进行初始化
- 省略列表初试化
- 部分初始化

```go
package main

import "fmt"

func main() {
	type Person struct {
		id, age     int
		name, email string
	}
	var tom Person
	// 要和结构体成员定义顺序一样
	tom = Person {
		101, 18,
		"tom", "xxx@xxx.com",
	}
	fmt.Printf("tom: %v\n", tom) // tom: {101 18 tom xxx@xxx.com}
	// 通过列表的方式初始化
	var jack = Person {
		id : 101,
		name : "name",
		age : 20,
		email : "xxx@xxx.com",
	}
	fmt.Printf("jack: %v\n", jack) // jack: {101 20 name xxx@xxx.com}
	// 可以部分初始化，未初始化的为默认值
	marry := Person {
		id : 101,
		name : "tom",
	}
	fmt.Printf("marry: %v\n", marry) // marry: {101 0 tom }
}
```

### 2.18 结构体

**结构体指针**

结构体指针和普通的变量指针相同，我们可以先回顾一下普通变量的指针，例如：

```go
package main

import "fmt"

func main() {
	test2()
}

func test2() {
	type Person struct {
		id, age int
		name string
	}
	tom := Person {
		id : 101,
		age : 18,
		name: "tom",
	}
	var p_person *Person
	p_person = &tom 
	fmt.Printf("tom: %v\n", tom) // tom: {101 18 tom}
	fmt.Printf("p_person: %T\n", p_person) // p_person: *main.Person
	fmt.Printf("p_person: %v\n", p_person) // p_person: &{101 18 tom}
}

func test1() {
	var name string
	name = "tom"
	var p_name *string
	p_name = &name
	fmt.Printf("name: %v\n", name) // name: tom
	fmt.Printf("p_name: %T\n", p_name) // p_name: *string
	fmt.Printf("p_name: %v\n", *p_name) // p_name: tom
}
```

#### 2.18.1 new关键字创建结构体指针

我们可以通过`new`关键字创建一个结构体指针（有时候不想创建一个有名字的结构体变量，此时用new）

```go
type Person struct {
	id, age int
	name string
}

func main() {
	test3()
}

func test3() {
	var tom = new(Person)
	tom.id = 101
	fmt.Printf("tom: %v\n", tom) // tom: &{101 0 }
}
```

#### 2.18.2 golang结构体作为函数参数

- 值传递
- 引用传递（传递指针）

举个栗子：

```go
package main

import "fmt"

type Person struct {
	id   int
	name string
}

func main() {
	tom := Person {
		id : 100,
		name : "tom",
	}
	fmt.Printf("tom: %v\n", tom) // person: {101 张三}
	fmt.Println("---------------")
	// 值传递，拷贝了一份副本，不会改变之前的值
	showPersion(tom)
	fmt.Printf("tom: %v\n", tom) // tom: {100 tom}
	fmt.Println("---------------")
	per := &tom
	// 引用传递，会改变之前的值
	showPerson2(per)
	fmt.Printf("per: %v\n", *per) // per: {100 李四}
}

// 值传递，拷贝了一份副本，不会改变之前的值
func showPersion(person Person) {
	person.id = 101
	person.name = "张三"
	fmt.Printf("person: %v\n", person) // tom: {100 tom}
}

func showPerson2(person *Person) {
	person.id = 100
	person.name = "李四"
}
```

#### 2.18.3 golang嵌套结构体

go语言没有面向对象编程思想，也没有继承关系，但是可以通过结构体嵌套来实现这种效果。

下面通过实例演示如何实现结构体嵌套，加入有一个人`Person`结构体，这个人还养了一个宠物`Dog`结构体

```go
package main

import "fmt"

type Dog struct {
	name, color string
	age         int
}

type Person struct {
	dog  Dog
	name string
	age  int
}

func main() {
	dog := Dog{
		name:  "花花",
		age:   2,
		color: "black",
	}

	person := Person{
		dog:  dog,
		name: "tom",
		age:  20,
	}
	fmt.Printf("person: %v\n", person) // person: {{花花 black 2} tom 20}
}

```

### 2.19 go方法接收

**go语言没有面向对象的特性**，也没有**类对象**的概念。但是，可以使用`结构体`来模拟这些特性，我们都知道面向对象里面有类方法等概念。我们也可以声明一些方法，属于某个结构体。

#### 2.19.1 go方法接收语法

Go中的方法，是一种特殊的函数，定义于`struct`之上(与`struct`关联、绑定)，被称为`struct`的接收者（`receiver`）。通俗的讲，**方法就是有接收者的函数**。

语法格式如下：

```go
type mytype struct{}

func (recv mytype) my_method(para) return_type {}
func (recv *mytype) my_method(para) return_type {}
```

- `mytype`：定义一个结构体
- `recv`：接收该方法的结构体（receiver）
- `my_method`：方法名称
- `para`：参数列表
- `return_type`：返回值类型

从语法格式可以看出，一个方法和一个函数非常类似，多了一个**接收类型**

举个栗子：

```go
package main

import "fmt"

type Person struct {
	name string
}

// 属性和方法分开来写
// (per Person) 接受者 receiver
func (per Person) eat() {
	fmt.Printf("%v eat...\n", per)
}

func (per Person) sleep() {
	fmt.Printf("%v sleep...\n", per)
}

type Customer struct {
	name string
}

func (customer Customer) login(name string, password int) bool {
	fmt.Printf("%v 登陆...\n", customer.name)
	return name == "tom" && password == 123
}

func main() {
	per := Person{name: "tom"}
	per.eat()
	per.sleep()
	fmt.Printf("------------------")
	cus := Customer{name: "tom"}
	// 登陆
	fmt.Printf("登陆成功【%v】\n", cus.login("tom", 123))
}

```

输出：

```go	
{tom} eat...
{tom} sleep...
------------------tom 登陆...
登陆【true】
```

#### 2.19.2 go语言方法的注意事项

1. 方法的`receive type`并非一定是一个`struct`类型，`type`定义的类型别名、`slice`、`map`、`channel`、`func`类型都可以
2. `struct`结合它的方法就等价于面向对象中的`类`，只不过struct可以和他的方法分开，不一定在同一个文件中，但一定在同一个包中
3. 方法有两种接受类型：`(T type) `和`(T *Type)`，他们之间有区别
4. 方法就是函数，所以golang没有方法重载（overload）的概念，也就是说同一个类型中的所有方法名必须是唯一的
5. 如果`receive`是一个指针类型，会自动解除引用
6. 方法和type是分开的，意味着实例的行为`behavior`和数据存储`field`是分开的，它们通过`receive`建立起关联联系

### 2.20 go方法接收类型

结构体实例，有值类型和引用类型。当方法的接受者也是结构体时，也会有值类型和引用类型。区别就是接受者是否复制结构体副本，值类型复制，指针类型不复制

#### 2.20.1 值类型结构体和指针类型结构体

栗子：

```go
package main

import "fmt"

func main() {
	type Person struct {
		name string
	}

	p1 := Person{name: "tom"}
	p2 := &Person{name: "tom"}
	fmt.Printf("p1: %T \n", p1) // p1: main.Person
	fmt.Printf("p2: %T \n", p2) // p2: *main.Person
}
```

从运行结果来看，p1是值类型，p2是指针类型

如果是方法接收呢？也是一样的，值类型不会修改，指针会修改

```go
package main

import "fmt"

type Person struct {
	name string
}

func main() {
	per := Person{name: "tom"}
	showPerson1(per)
	fmt.Printf("%v \n", per.name) // tom
	fmt.Printf("-----")
	showPerson2(&per)
	fmt.Printf("%v \n", per.name) // tom...
	// 方法接收者测试
	per2 := Person{name: "tom2"}
	per3 := Person{name: "tom3"}
	per2.showPerson3()
	fmt.Printf("%v \n", per2.name) // tom2
	per3.showPerson4()
	fmt.Printf("%v \n", per3.name) // tom...

}

func showPerson1(per Person) {
	// 值传递拷贝的是副本，不会对之前的值进行改变
	per.name = "tom..."
}

func showPerson2(per *Person) {
	// 引用传递会对之前的值进行改变
	// 自动解引用，本来应该写的是 (*per).name = "tom..."，自动解引用可以进行简化
	per.name = "tom..."
}

func (per Person) showPerson3() {
	// 值传递拷贝的是副本，不会对之前的值进行改变
	per.name = "tom..."
}

func (per *Person) showPerson4() {
	// 引用传递会对之前的值进行改变
	// 自动解引用，本来应该写的是 (*per).name = "tom..."，自动解引用可以进行简化
	per.name = "tom..."
}

func test01() {
	p1 := Person{name: "tom"}
	p2 := &Person{name: "tom"}
	fmt.Printf("p1: %T \n", p1) // p1: main.Person
	fmt.Printf("p2: %T \n", p2) // p2: *main.Person
}
```

### 2.21 接口

虽然go并不是oop的语言，但是可以通过接口的结构体实现

接口我们都很熟悉了，它定义了一套准则和规范

go的接口，是一种新的`类型定义`，它把所有具有共性的方法定义在一起，任何其他类型只要实现了这些方法就是实现了这个接口

语法和方法接收非常类似

#### 2.21.1 接口定义的格式

```go
/* 定义接口 */
type interface_name interface {
  method_name1 [return_type]
  ...
  method_namen [return_type]
}
/* 定义结构体 */
type struct_name struct {
  /* variables */
}
/* 实现接口方法 */
func (struct_name_variable struct_name) method_name1() {
  /* 方法实现 */
}
...
/* 实现接口方法 */
func (struct_name_variable struct_name) method_namen() {
  /* 方法实现 */
}
```

注意：在接口中定义的方法应该具有通用性

接口主要用在函数传参上，可以把接口作为函数参数，实现了改接口的结构体都可以作为函数参数进行调用

**接口栗子**

下面我们定义一个usb接口，有读read写和write两个方法

```go
package main

import "fmt"

// 接口要以er结尾
type USBER interface {
	read()
	write()
}

// 定义结构体
type Computer struct {
	name string
}

func (c Computer) read() {
	fmt.Printf("c.name:%v \n", c.name)
	fmt.Printf("read...")
}

func (c Computer) write() {
	fmt.Printf("write...")
}

func main() {
	c := Computer{name: "联想"}
	c.read()
	c.write()
}

```

#### 2.21.2 多态实现

golang中多态的实现是 `接口 + 结构体 + 方法接收者`实现的，具体步骤为：

- 定义一个接口，并且定义接口方法
- 声明结构体
- 为结构体绑定方法接收者，方法接收者直接实现接口中的接口方法即可
- 定义实现多态的方法，方法的传参为该接口，传入具体实现的结构体（结构体绑定了方法接收者）

```go
package main

import "fmt"

func main() {
	w := &WechatNotifier{name: "微信", message: "微信消息"}
	q := &QQNotifier{name: "QQ", message: "qq消息"}
	e := &EmailNotifier{name: "email", message: "email消息"}
	// 接受微信消息
	sendNotify(w)
	// 接受qq类型
	sendNotify(q)
	// 接受email消息
	sendNotify(e)
}

// 定义发送通知的方法，入参为Notifier，等需要调用的时候，需要传入实现了Notifier中的接口的类型
func sendNotify(notifier Notifier) {
	// 调用具体的实现
	notifier.notify()
}

// Notifier 定义一个通知接口
type Notifier interface {
	// 通知方法，可以由具体的类进行实现
	notify()
}

type WechatNotifier struct {
	name    string
	message string
}

// 绑定方法接收
func (w *WechatNotifier) notify() {
	fmt.Printf("%v notify %v\n", w.name, w.message)
}

type QQNotifier struct {
	name    string
	message string
}

// 绑定方法接收
func (q *QQNotifier) notify() {
	fmt.Printf("%v notify %v\n", q.name, q.message)
}

type EmailNotifier struct {
	name    string
	message string
}

func (e *EmailNotifier) notify() {
	fmt.Printf("%v notify %v\n", e.name, e.message)
}
```

#### 2.21.3 接口嵌套

接口可以通过嵌套形成新的接口

例如飞鱼既可以飞、也可以游泳，我们就可以组合飞和游泳这两个接口形成一个新的接口

```go
type Flyer interface {
  fly()
}
type Swimmer interface {
  swim()
}
// 组合上面的两个接口
type FlyFish interface {
  fly()
  swim()
}
// 创建一个结构体Fish
type Fish struct {
  
}
// 实现这个组合接口
func (fish *Fish) fly() {
  fmt.Println("fly...")
}
func (fish *Fish) swim() {
  fmt.Println("swim...")
}
```

测试：

```go
package main

func main() {
  var ff FlyFish
	// 向上类型转换
	ff = &Fish{}
  ff.fly() // fly...
  ff.swim() // swim...
}
```





#### 2.21.4 golang接口与类型的关系

- 一个类型可以实现多个接口
- 多个类型可以实现同一个接口（多态）

>一个类型实现多个接口

一个类型可以实现多个接口，例如：有一个Player接口可以播放音乐，有一个video接口可以播放视频，有一个mobilePhone实现了两个接口，既可以播放音乐也可以播放视频

定义一个Player接口：

```go
type Player interface {
  playMusic()
}
```

定义一个video接口：

```go
type Video interface {
  playVideo()
}
```

定义mobilePhone结构体：

```go
type MobilePhone struct {
  
}
```

结构体实现两个接口：

```go
func (m MobilePhone) playMusic() {
  fmt.Println("正在播放音乐...")
}
func (m MobilePhone) playVideo() {
  fmt.Println("正在播放视频...")
}
```

测试：

```go
package main

func main() {
  m := MobilePhone{}
  m.playMusic() // 正在播放音乐...
  m.playVideo() // 正在播放视频...
}
```

多个类型实现同一个接口（多态），多态请看2.21.2小节

### 2.22 golang面向对象

golang并不是面向对象的语言，但是我可以通过go本身的一些特性来模拟面向对象的特征

#### 2.22.1 golang通过接口嵌套实现OCP原则（多态）

ocp原则即`开闭原则`（Open-Closed Principle，常缩写为OCP），是`面向对象的可复用设计`的第一块基石。虽然go不是面向对象的语言，但是也可以模拟实现这个原则

**OCP设计原则实例**：

```go
// 定义一个宠物接口
type Pet interface {
  eat()
  sleep()
}
// 定义dog结构体
type Dog struct {
  name string 
  age int
}
// Dog实现接口方法
func (dog *Dog) eat() {
  fmt.Println("dog eat...")
}
func (dog *Dog) sleep() {
  fmt.Println("dog sleep...")
}
// 定义cat结构体
type Cat struct {
  name string 
  age int
}
// cat 实现接口方法
func (cat *Cat) eat() {
  fmt.Println("cat eat...")
}
func (cat *Cat) sleep() {
  fmt.Println("cat sleep...")
}
// 定义Person结构体
type Person struct {
  
}
// 定义实现多态的方法，为Person添加一个养宠物的方法
func (per Person) care(pet Pet) {
  pet.eat()
  pet.sleep()
}
```

测试一下：

```go
package main

func main() {
  dog := Dog{}
  cat := Cat{}
  per := Person{}
  // 多态方法实现
  per.care(dog) // dog eat... dog sleep...
  per.care(cat) // cat eat... cat sleep...
}
```

#### 2.22.2 golang继承

golang不是面向对象的语言，所以没有继承的概念，但是可以通过`结构体嵌套`来实现继承

举个栗子：

```go
package main

import "fmt"

func main() {
	// 嵌套实现继承
	dog := Dog{
		animal: Animal{name: "花花", age: 2},
		color:  "黑色",
	}
	dog.animal.eat()   // eat...
	dog.animal.sleep() // sleep...
	cat := Cat{animal: Animal{name: "小猫", age: 3}, name: "喵喵"}
	cat.animal.eat() // eat...
	cat.animal.sleep() // sleep...
}

type Animal struct {
	name string
	age  int
}

func (animal *Animal) eat() {
	fmt.Println("eat...")
}

func (animal *Animal) sleep() {
	fmt.Println("sleep...")
}

// Dog dog也应该拥有Animal的特性（方法），通过嵌套实现继承
type Dog struct {
	animal Animal
	color  string
}

type Cat struct {
	animal Animal
	name   string
}


```

#### 2.22.3 golang构造函数

golang中其实是没有构造函数的概率的，但是我们可以模拟出构造函数

```go
package main

import "fmt"

func main() {
	// 调用结构体的构造函数生成对象
	person, _ := NewPerson("张三", 18)
	fmt.Println(person) // &{张三 18}
	// 错误情况
	newPerson, err := NewPerson("张三", -1)
	fmt.Println(newPerson) // <nil>
	fmt.Println(err)       // 参数异常
}

type Person2 struct {
	name string
	age  int
}

// NewPerson 模拟实现构造函数
func NewPerson(name string, age int) (person *Person2, err error) {
	if name == "" || age < 0 {
		return nil, fmt.Errorf("参数异常")
	}
	return &Person2{name: name, age: age}, nil
}

```

### 2.22 异常

GO通过内置的错误接口提供了非常简单的错误处理机制

error类型是一个接口类型，这是它的定义

```go
type error interface {
  Error() string
}
```

我们可以在编码中通过实现error接口类型来生成错误信息

函数通常在最后的返回值中返回错误信息，使用`errors.New`可以返回一个错误信息

```go
func Sqrt(f float64) (float64, error) {
  if f < 0 {
    return 0, errors.New("math：square root of negative number")
  }
  // 具体实现代码
}
```

在下面的例子中，我们在调用Sqrt的时候传递的一个负数，然后就得到了`non-nil`的`error`对象，将此对象与`nil`比较，结果为`true`，所以`fmt.Println`(fmt包在处理error时会调用Error方法)被调用，以输出错误，请看下面调用的示例代码：

```go
result, err:= Sqrt(-1)

if err != nil {
   fmt.Println(err)
}
```

>一个异常处理的完整例子

```go
package main

import (
	"errors"
	"fmt"
)

func main() {
	// 正常情况
	if result, errorMsg := Divide(100, 10); errorMsg == "" {
		fmt.Printf("100 / 10 = %v \n", result)
	}
	// 当被除数为零的时候会返回错误信息
	if _, errorMsg := Divide(100, 0); errorMsg != "" {
		fmt.Println("errorMsg is:", errorMsg)
	}
}

// DivideError 定义一个DivideError结构
type DivideError struct {
	dividee int
	divider int
}

// error是一个接口类型，需要结构体实现这个接口
func (de *DivideError) Error() string {
	strFormat := `
	Cannot proceed，the divider is zero.
	dividee: %d
	divider: %d
`
	return fmt.Sprintf(strFormat, de.dividee)
}

// Divide 定义 `int` 类型除法运算的函数
func Divide(varDividee int, varDivider int) (result int, errorMsg string) {
	if varDivider == 0 {
		dData := DivideError{dividee: varDividee, divider: varDivider}
		errorMsg = dData.Error()
		return
	} else {
		return varDividee / varDivider, ""
	}

}
```

### 2.23 Reflect反射

golang提供了一种机制，在不知道具体类型的情况下，可以使用发射来更新变量值、或者查看变量类型

#### 2.23.1 获取值的类型Typeof

**Typeof**

`Typeof`返回接口中保存的值的类型，Typeof(nil)会返回`nil`

栗子：

```go
package main

import (
	"fmt"
	"reflect"
)

func main() {
	var bookNum float32 = 6
	var isBook bool = true
	bookAuthor := "fengyuan-liang"
	bookDetail := make(map[string]string)
	bookDetail["k1"] = "v1"
	fmt.Println(reflect.TypeOf(bookNum))    // float32
	fmt.Println(reflect.TypeOf(isBook))     // bool
	fmt.Println(reflect.TypeOf(bookAuthor)) // string
	fmt.Println(reflect.TypeOf(bookDetail)) // map[string]string
}
```

#### 2.23.2 获取值ValueOf

**ValueOf**

ValueOf返回一个初始化为`interface`接口保管的具体值的`value`，ValueOf(nil)返回Value零值

**通过反射获取值**

```go
package main

import (
	"fmt"
	"reflect"
)

func main() {
	var bookNum float32 = 6
	var isBook bool = true
	bookAuthor := "fengyuan-liang"
	bookDetail := make(map[string]string)
	bookDetail["k1"] = "v1"
	// 通过反射获取属性的值
	fmt.Println(reflect.ValueOf(bookNum))    // 6
	fmt.Println(reflect.ValueOf(isBook))     // true
	fmt.Println(reflect.ValueOf(bookAuthor)) // fengyuan-liang
	fmt.Println(reflect.ValueOf(bookDetail)) // mak[k1:v1]
}
```

#### 2.23.3 通过反射设置值

```go
package main

import (
	"fmt"
	"reflect"
)

func main() {
	address := "I am fengyuan-liang"
	// 错误反射设置值
	// reflectSetValue1(address)
	// 反射修改值必须通过传递变量地址来修改。若函数传递的参数是值拷贝，则会报以下错误
	// panic: reflect: reflect.Value.SetString using unaddressable value
	// 正确反射设置值
	fmt.Printf("反射之前：%v \n", address) // 反射之前：I am fengyuan-liang
	reflectSetValue2(&address)
	fmt.Printf("反射之后：%v \n", address) // 反射之后：通过elem方法发射设置值 
}

func reflectSetValue1(x interface{}) {
	value := reflect.ValueOf(x)
	if value.Kind() == reflect.String {
		value.SetString("通过反射设置值")
	}
}

func reflectSetValue2(x interface{}) {
	value := reflect.ValueOf(x)
	// 反射中使用了Elem()方法获取了指针所指向的值
	if value.Elem().Kind() == reflect.String {
		value.Elem().SetString("通过elem方法发射设置值")
	}
}

```

### 2.24 golang包

包可以区分命名空间（一个文件夹中不能有两个同名文件），也可以更好的管理项目。go中创建一个包，一般是创建一个文件夹，在该文件夹里面的go文件中，使用`package`关键字申明包名称，通常，文件夹名称和包名称相同。并且，同一个文件下面只有一个包

**创建包**

**倒入包**

**包注意事项**

和Java差不多

#### 2.24.1 go module包管理工具

go modeule是golang在1.11后添加的包管理工具

**基本命令**：

- 初始化模块：`go mod init<项目模块名称>`

- 处理依赖关系，根据go.mod文件：`go mod tidy`

- 将依赖包复制到项目下的`vendor`目录：`go mod vendor`

  ⚠️：如果包被墙，可以使用这个命令，随后使用`go build -mod=vendor`编译

- 显示依赖关系：`go list -m all`

- 显示详细的依赖关系：`go list -m -json all`

- 下载依赖：`go mod download [path@version]` （[path@version]是非必写的）

**栗子**：

- 使用go mod管理包；go build发布包使其他模块可以进行导包

![image-20230114133121655](https://cdn.fengxianhub.top/resources-master/image-20230114133121655.png)

- 其他模块进行到包使用

![image-20230114133311930](https://cdn.fengxianhub.top/resources-master/image-20230114133311930.png)

- 除了可以调用自己写的包之外，还可以调用远程包

  - 我们先进入`https://pkg.go.dev/`寻找我们想要的包

    ![image-20230114133829425](https://cdn.fengxianhub.top/resources-master/image-20230114133829425.png)

  - 通过上面的`go get`命令进行下载，下载的包全部在`go1.19.4/pkg/mod/`目录下

  - 再通过`go mod tidy`命令处理依赖，可以看到`go.mod`里面的依赖包都没有了，因为项目现在并没有使用到这些包

  - ![image-20230114143904346](https://cdn.fengxianhub.top/resources-master/image-20230114143904346.png)

  

## 3. golang标准库

对应文档：

- [Standard library - Go Packages](https://pkg.go.dev/std)

思维导图：



### 3.1 os模块-文件目录相关

os标准库实现了平台（操作系统）无关的编程接口

```go
package main

import (
	"fmt"
	"os"
)

func main() {
	createFile()
}

// 创建文件
func createFile() {
	create, err := os.Create("a.txt")
	if err != nil {
		return
	}
	fmt.Println(create.Name())
	defer create.Close()
	// 往文件里面写点东西
	n, err := create.Write([]byte("hello world"))
	fmt.Println("写入的字节数，", n)
}

// 创建目录
func mkDir() {
	// 创建一个目录，os.ModePerm表示777权限
	err := os.Mkdir("test", os.ModePerm)
	if err != nil {
		fmt.Println(err)
	}
	// 创建级连目录
	os.MkdirAll("a/b/c", os.ModePerm)
	// 删除目录下的所有东西
	os.RemoveAll("test")
}

// 获取工作目录
func wd() {
	dir, _ := os.Getwd()
	fmt.Println(dir)
	// 获取临时目录
	tempDir := os.TempDir()
	fmt.Println(tempDir)
	// 修改工作目录
	os.Chdir("/usr/local")
	dir, _ = os.Getwd()
	fmt.Println(dir)
}

// 文件读写
func writeRead() {
	file, _ := os.ReadFile("a.txt")
	fmt.Println(string(file))
	// 写文件
	os.WriteFile("a.txt", []byte("hello world"), os.ModePerm)
}

```

### 3.2 os模块-File文件相关

读相关操作

```go
package main

import (
	"fmt"
	"io"
	"os"
)

func main() {
	readBuff()
}

func openClose() {
	file, err := os.Open("a.txt")
	if err != nil {
		fmt.Println(err)
	}
	fmt.Println(file.Name())
	file.Close()
	// 或者调用这个，如果没有指定的文件就好创建一个
	openFile, err := os.OpenFile("a.txt", os.O_RDWR|os.O_CREATE, 755)
	if err != nil {
		fmt.Println(err)
	}
	fmt.Println(openFile)
	openFile.Close()
}

// 带缓冲区的读取
func readBuff() {
	open, _ := os.Open("a.txt")
	// 创建一个字节缓冲去
	buffer := make([]byte, 10)
	for true {
		// 读取文件到缓冲区中
		n, err := open.Read(buffer)
		if err == io.EOF {
			fmt.Println("已经读完了...")
			break
		}
		fmt.Println(n)
		fmt.Println("缓冲区的文件，", string(buffer))
	}
}

// 遍历目录
func rangeDir() {
	dir, _ := os.ReadDir("os")
	for _, value := range dir {
		fmt.Println("是目录吗？", value.IsDir())
		fmt.Println(value.Name())
	}
}
// 随机读readCharAt()
```

写相关操作

```go
package main

import (
	"fmt"
	"os"
)

func main() {
	write()
}

func write() {
	// O_APPEND表示追加、O_TRUNC表示覆盖
	file, _ := os.OpenFile("a.txt", os.O_RDWR|os.O_TRUNC, 0755)
	// 写入一些共享
	_, err := file.Write([]byte("hello golang"))
	// 或者可以直接写入字符串
	_, err2 := file.WriteString("hello hello")
	if err != nil || err2 != nil {
		fmt.Println(err, err2)
	}
}
```

### 3.3 os模块-进程相关

用的不多...

### 3.4 os模块-环境变量相关

```go
package main

import (
	"fmt"
	"os"
)

func main() {
	// 获取所有环境变量
	fmt.Println(os.Environ())
	// 获取指定环境变量 k -> v
	envValue := os.Getenv("GOBIN")
	fmt.Println(envValue)
	// 检查环境变量是否存在
	env, ok := os.LookupEnv("GOBIN")
	if ok {
		fmt.Println(env)
	}
	// 设置环境变量
	err := os.Setenv("GOBIN", "xxx")
	if err != nil {
		fmt.Println(err)
	}
	// 用环境变量的值进行替换
	os.ExpandEnv("$JAVA_HOME and ${GOROOT} ")
	// 清空所有环境变量
	os.Clearenv()
}
```

### 3.5 IO包

Go语言中，为了方便开发者使用，将IO操作封装在了几个包中：

- io为IO原语（I/O primitives）提供基本的接口
- io/ioutil 封装了一些常用的IO函数
- fmt实现格式化IO，类似c中的printf和scanf
- bufio实现带缓冲IO

**io - 基本的io接口**

在io包中最重要的是两个接口：`Reader`和`Writer`接口，只要实现了这两个接口，就能拥有IO的功能

> Reader接口

```go
type Reader interface {
  Read(p []byte) (n int, err error)
}
```

>Writer接口

```go
type Writer interface {
  Write(p []byte) (n int, err error)
}
```



```go
func testCopy() {
	// reader
	reader := strings.NewReader("hello world")
	written, err := io.Copy(os.Stdout, reader)
	if err != nil {
		fmt.Println(err)
	}
	log.Fatal(written)
}
```

其他直接看api即可

- https://pkg.go.dev/io#CopyBuffer

### 3.6 ioutil包

| 名称      | 作用                                                       |
| --------- | ---------------------------------------------------------- |
| ReadAll   | 读取数据，返回读到的字节slice                              |
| ReadDir   | 读取一个目录，返回目录入口数组[]os.FileInfo                |
| ReadFile  | 读一个文件，返回文件内容（字节slice）                      |
| WriteFile | 根据文件路径，写入字节slice                                |
| TempDir   | 在一个目录中创建指定前缀名的临时目录，返回新临时目录的路径 |
| TempFile  | 在一个目录中创建指定前缀名的临时目录，返回os.File          |

### 3.7 bufio

> buffio包实现了有缓冲的io。它包装一个`io.Reader`或者`io.Writer`接口对象，创建另一个也实现了该接口，且同时还提供了缓冲和一些文本IO的帮助函数的对象

**常量**

```go
// 默认缓冲区大小
const (
	defaultBufSize = 4096  
)
```

**变量**

```go
// 缓冲区异常提升
var (
  ErrInvalidUnreadByte = errors.New("bufio: invalid use of UnreadByte")
  ErrInvalidUnreadRune = errors.New("bufio: invalid use of UnreadRune")
  ErrBufferFull 			 = errors.New("bufio: buffer full")
  ErrNegativeCount     = errors.New("bufio: negative count")
)
```

#### 3.7.1 建立带缓冲区的buffer Reader

```go
  open, _ := os.Open("a.txt")
	defer open.Close()
	// 默认缓冲区大小为4096，可以通过`bufio.NewReaderSize(open, 1024)`指定
	bufferReader := bufio.NewReaderSize(open, 1024)
	readString, _ := bufferReader.ReadString('\n')
	fmt.Println(readString)
```

#### 3.7.2 for循环读取

```go
  reader := strings.NewReader("ABCDEFGHIZKLMNOPQRSTUVWXYZ0123456789")
	bufferReader := bufio.NewReader(reader)
	// 缓冲区
	buffer := make([]byte, 10)
	for true {
		// 读到缓冲区内，n表示这一次实际读取到的字节数
		n, err := bufferReader.Read(buffer)
		if err == io.EOF {
			break
		}
		// 将读到的打印出来，需要注意可能没有满一个buffer，需要切片
		fmt.Println(string(buffer[0:n]))
	}
```

#### 3.7.3 其他Reader api

- `ReadSlice(',')`：按照某个字符切片读取

#### 3.7.4 Writer

```go
  file, _ := os.OpenFile("a.txt", os.O_RDWR, 0777)
	defer file.Close()
	writer := bufio.NewWriter(file)
	// 带缓冲区的writer可以直接写入字符串
	writer.WriteString("hello world")
	// 必须强制将缓冲区的数据刷新到磁盘中
	writer.Flush()
```

#### 3.7.5 scanner

键盘扫描器

```go
reader := strings.NewReader("ABC DEF GHI")
scanner := bufio.NewScanner(reader)
// bufio.ScanWords 表示以空格作为分割
scanner.Split(bufio.ScanWords)
for scanner.Scan() {
	fmt.Println(scanner.Text())
}
// 输出
ABC
DEF
GHI
```

还可以以字符作为分割

```go
reader := strings.NewReader("hello 世界")
scanner := bufio.NewScanner(reader)
// bufio.ScanRunes 表示以字符作为分割
scanner.Split(bufio.ScanRunes)
for scanner.Scan() {
	fmt.Println(scanner.Text())
}
// 输出
h
e
l
l
o
 
世
界
```

### 3.8 log标准库

golang内置了`log`包，实现简单的日志服务。通过调用`log`包的函数，可以实现简单的日志打印功能

**log使用**

log包中有三个系列的日志打印函数，分别是`print`、`panic`、`fatal`

| 函数类型 | 作用                                                         |
| -------- | ------------------------------------------------------------ |
| print    | 单纯打印日志                                                 |
| panic    | 打印日志，并抛出panic异常（异常之后的代码块不会执行，defer会执行） |
| fatal    | 打印日坠，强制结束程序（使用`os.Exit(1)`，`defer`函数也不会执行） |

### 3.9 标准库之builtin

这个包提供了一些类型声名、变量和常量声名，还有一些遍历函数，这个包不需要导入，这些变量和函数就可以直接使用

#### 3.9.1 常用函数

- append：直接在slice后面添加单个元素，元素类型可以和slice相同，也可以不同

  ```go
  func append(slice []Type, elems ...Type) []Type
  // 直接在slice后面添加单个元素，元素类型可以和slice相同，也可以不同
  slice = append(slice, elem1, elem2)
  // 直接将另外一个slice添加到slice后面，但其本质还是将anotherSlice中的元素一个一个添加到slice中，和第一种方式类似
  slice = append(slice, anotherSlice...)
  
  ```

- len：计算数组的长度

演示：

```go
s := []int{1, 2, 3}
i := append(s, 1)
fmt.Println(i)
s2 := []int{1, 2, 3}
// ...是结构运算符，表示在编译期将数组中的元素解构出来，变成上面的样子
i2 := append(s, s2...)
fmt.Println(i2)
fmt.Println("长度：", len(i2))
// 打印
print("builtin包中print")
println("builtin包中println")
```

#### 3.9.2 常用函数之`new`和`make`

`new`和`make`的区别为：

1. `make`只能用来分配初始化类型为`slice`、`map`、`chan`的数据，`new`可以分配任意类型的数据
2. `new`分配返回的是指针，即类型`*T`；`make`返回引用，即`T`
3. `new`分配的空间被清零，`make`分配后，会进行初始化

**举个栗子**：

>new

```go
// 使用new初始化的都是一些默认值
b := new(bool)
fmt.Printf("%T \n", b)  // *bool
fmt.Printf("%v \n", *b) // false
```

>make
>
>内建函数make(T, args)与new(T)的用途不一样。它只用来创建`slice`、`map`、`channel`，并且返回一个初始化的（并不是默认值或者说是零值），类型为T的值（而不是*T）。之所以有所不同，是因为这三个类型的背后引用了使用前必须初始化的数据结构。例如，slice是一个三元描述符，包含了一个指向数据（在数组中）的指针，长度已经容量。在这些项被初始化前，slice都是`nil`的/对于`slice`、`map`、`chan`，make初始化这些内部数据结构，并注备好可用的值

```go
make([]int, 10, 100)
```

分配了一个有100个int的数组，然后创建一个长度为10，容量为100的slice结构，该slice引用包含前10个元素的数组

对应的，`new([]int)`返回一个指向新分配的，被置零的slice结构体的指针，即指向值为`nil`的`slice`的指针

```go
p := new([]int) // new出来的都是指针，并没有初始化
fmt.Println(p) // &[]
p2 := make([]int, 10) // make的时候已经提前分配空间了，既然有了空间也就有零值了
fmt.Println(p2) // [0 0 0 0 0 0 0 0 0 0]
```

### 3.10 标准库之bytes

bytes包提供了对**字节切片**进行读写操作的一系列函数，字节切片处理的函数比较多，可以分为：

- 基本处理函数
- 比较函数：bytes.Contains(b1, b2)
- 计数函数：bytes.Count(b1, b2)， 返回b2在b1中出现的次数
- 后缀检查函数
- 索引函数
- 分割函数
- 大小写处理函数
- 子切片处理函数
- 等等

### 3.12 标准库之buffer

跟上面io包的差不多

### 3.13 标准库之errors

errors包实现了操作错误的函数。语言使用`error`类型来返回函数执行过程中遇到的错误，如果返回的error值为nil，则表示未遇到错误，否则error会返回一个字符串，用于说明遇到了什么错误

**error结构**

```go
type error interface {
  Error() string
}
```

你可以用任何类型去实现它（只需要绑定一个Error方法即可），也就是说，error可以是任意类型，这意味着，函数返回的error值实际可以包含任意信息，不一定是字符串

error不一定表示一个错误，他可以表示任意信息，比如io包中就用error类型的`io.EOF`表示数据读取结束，而不是遇到了什么错误

error包实现了一个最简单的error类型，只包含一个字符串，它可以记录大多数情况下遇到的错误信息。errors包的用法也很简单，只有一个`New`函数，用于生成一个最简单的error对象

>我们封装一个自定义的异常来演示一下

```go
package main

import (
	"errors"
	"fmt"
	"time"
)

func main() {
	if err := oops(); err != nil {
		fmt.Println(err) // 异常时间：【2023-01-18 18:12:59.325815 +0800 CST m=+0.000114982】，异常提示：【throw an bizError...】
	}
}

// BizError 自定义错误
type BizError struct {
	when time.Time
	what string
}

// 绑定一个方法
func (bizError *BizError) Error() string {
	return fmt.Sprintf("异常时间：【%v】，异常提示：【%v】", bizError.when, bizError.what)
}

// 产生一个错误
func oops() error {
	return &BizError{time.Now(), "throw an bizError..."}
}
```

### 3.14 标准库之sort包

sort包提供了排序切片和用户自定义数据集以及相关功能的函数

sort包主要针对`[]int`、`[]float64`、`[]string`，以及其他**自定义切片**的排序

**结构体**

```go
type IntSlice struct
type Float64Slice
type StringSlice
```

**一些函数**：

![image-20230118185036583](https://cdn.fengxianhub.top/resources-master/image-20230118185036583.png)

**接口 type Interface**

自定义的接口如果需要排序以下三个接口

```go
type MyInterface interface {
  Len() int // Len方法返回集合中的元素个数
  Less(i, j int) bool // i > j，该方法返回索引i的元素是否比索引j的元素小
  Swap(i, j int) // 交换i，j的值
}
```

举个例子

#### 3.14.1 排序自定义类型

主要需要实现三个方法

```go
package main

import (
	"fmt"
	"sort"
)

func main() {
	// 产生几个对象
	b1 := Person{age: 18, name: "张三"}
	b2 := Person{age: 14, name: "李四"}
	b3 := Person{age: 20, name: "王五"}
	pArray := []Person{b1, b2, b3}
	// 排序
	sort.Sort(PersonArray(pArray))
	fmt.Println(pArray) // [{14 李四} {18 张三} {20 王五}]
}

type PersonArray []Person

type Person struct {
	age  int
	name string
}

// Len 实现Len方法，返回长度
func (b PersonArray) Len() int {
	return len(b)
}

// Less 判断指定索引的两个数字的大小
func (b PersonArray) Less(i, j int) bool {
	fmt.Println(i, j, b[i].age < b[j].age, b)
	return b[i].age < b[j].age
}

// Swap 交换两个索引位置的值
func (b PersonArray) Swap(i, j int) {
	b[i], b[j] = b[j], b[i]
}

```

#### 3.14.2 排序map

```go
package main

import (
	"fmt"
	"sort"
)

type mapArray []map[string]float64

// Len 实现三个方法
func (m mapArray) Len() int           { return len(m) }
func (m mapArray) Swap(i, j int)      { m[i], m[j] = m[j], m[i] }
func (m mapArray) Less(i, j int) bool { return m[i]["a"] < m[j]["a"] } // 按照"a"对应的值来排序

func main() {
	maps := mapArray{
		{"a": 4, "b": 12},
		{"a": 3, "b": 11},
		{"a": 5, "b": 10},
	}
	fmt.Println(maps) // [map[a:4 b:12] map[a:3 b:11] map[a:5 b:10]]
	sort.Sort(maps)
	fmt.Println(maps) // [map[a:3 b:11] map[a:4 b:12] map[a:5 b:10]]
}

```

### 3.15 标准库之time包

time包提供测量和现实时间的功能

#### 3.15.1基本使用

打印出现在的时间，基本示例如下：

其中now为`time.Time`类型，Month为`time.Month`类型

```go
package main

import (
	"fmt"
	"time"
)

func main() {
	now := time.Now() // 获取当前时间
	year := now.Year()
	month := now.Month()
	day := now.Day()
	hour := now.Hour()
	minute := now.Minute()
	second := now.Second()
	// 2023-01-18 23:07:55
	fmt.Printf("%d-%02d-%02d %02d:%02d:%02d\n", year, month, day, hour, minute, second)
	// int time.Month int int int int
	fmt.Printf("%T %T %T %T %T %T\n", year, month, day, hour, minute, second)
}

```

**时间戳**

10位毫秒时间戳

```go
// timeStamp type:int64, timeStamp value:1674054652
fmt.Printf("timeStamp type:%T, timeStamp value:%v \n", now.Unix(), now.Unix())
```

19位纳秒时间戳

```go
// timeStamp type:int64, timeStamp value:1674054740084953000
fmt.Printf("timeStamp type:%T, timeStamp value:%v \n", now.UnixNano(), now.UnixNano())
```

#### 3.15.2 操作时间

**Add**

```go
package main

import (
	"fmt"
	"time"
)

func main() {
	// 现在的时间 2023-01-19 10:30:03
	fmt.Println(formatDate(time.Now()))
	// 增加后的时间 2023-01-19 13:34:08
	t := add(3, 4, 5, 6, 7, 8)
	fmt.Println(formatDate(t))
}

// 增加时间
func add(h, m, s, mls, msc, ns time.Duration) time.Time {
	now := time.Now()
	return now.Add(time.Hour*h + time.Minute*m + time.Second*s + time.Millisecond*mls + time.Microsecond*msc + time.Nanosecond*ns)
}

func formatDate(now time.Time) string {
	year := now.Year()
	month := now.Month()
	day := now.Day()
	hour := now.Hour()
	minute := now.Minute()
	second := now.Second()
	// 2023-01-18 23:07:55
	return fmt.Sprintf("%d-%02d-%02d %02d:%02d:%02d\n", year, month, day, hour, minute, second)
}

```

>注意这里并不能增加`年月日`，仅仅能增加时分秒，也就是以下才被允许

```go
const (
	Nanosecond  Duration = 1
	Microsecond          = 1000 * Nanosecond
	Millisecond          = 1000 * Microsecond
	Second               = 1000 * Millisecond
	Minute               = 60 * Second
	Hour                 = 60 * Minute
)
```

**sub**

sub需要注意，谁的sub就以谁为参考

```go
func sub() {
	now := time.Now()
	targetTime := now.Add(time.Hour)
	// 目标时间与此时相比相差1h0m0s
	fmt.Println(targetTime.Sub(now))
}
```

**Equal**

判断两个时间是否相同，会考虑时区的影响，因此不同时区标准的时间也可以正确进行比较

```go
func (t Time) Equal(u Time) bool
```

**Before**

如果`t`表示的时间点在`u`之前，返回真；否则返回假

```go
func (t Time) Before(u Time) bool
```

**定时器time.Tick**

使用`time.Tick(时间间隔)`来设置定时器，定时器的本质上是一个`channel`

```go
func tick() {
  ticker := time.Tick(time.Second) // 定义一个1秒间隔的定时器
  for i := range ticker {
    fmt.Println(i) // 每秒都会执行的任务
  }
}
```

#### 3.15.3 时间格式化

时间类型有一个自带的方法`Format`进行格式化，需要注意的是GO中格式化的时间模版不是常见的`Y-m-d H:M:S`，而是使用Go诞生时间`2006年1月2号15点04分`，记忆口诀为`2006 1 2 3 4`

需要注意的是如果需要格式化为12小时格式的，需要加上`PM`

```go
now := time.Now()
// 格式化的模版为Go的出生时间2006 1/2 15：04 Mon Jan
// 24小时制 2023-01-19 11:02:41.404 Thu Jan
fmt.Println(now.Format("2006-01-02 15:04:05.000 Mon Jan"))
// 12小时制 2023-01-19 11:02:41.404 AM Thu Jan
fmt.Println(now.Format("2006-01-02 03:04:05.000 PM Mon Jan"))
// 2023/01/19 11:02
fmt.Println(now.Format("2006/01/02 15:04"))
// 11:02 2023/01/19
fmt.Println(now.Format("15:04 2006/01/02"))
// 2023/01/19
fmt.Println(now.Format("2006/01/02"))
```

**解析字符串格式**

```go
now := time.Now()
// 加载时区
location, err := time.LoadLocation("Asia/Shanghai")
if err != nil {
	fmt.Println("加载时区出错", err)
	return
}
// 要解析的时间
str := "2023/01/19 11:02:02"
// 按照指定时区和指定格式解析字符串时间
timeObj, err2 := time.ParseInLocation("2006/01/02 15:04:05", str, location)
if err2 != nil {
	fmt.Println("解析时间出错", err)
	return
}
fmt.Println(timeObj) // 2023-01-19 11:02:02 +0800 CST
fmt.Println(timeObj.Sub(now)) // -9m41.431133s
```

### 3.16 标准库之encoding/json

#### 3.16.1 基本使用

这个包可以实现`json`的编码和解码，就是将jso`json`字符串转换为`struct`，或者将`struct`转换为`json`

**两个核心函数**

将`struct`编码成`json`，可以接受任意类型

```go
func marshal(v interface{}) ([]byte, error)
```

将`json`转码为`struct`结构体

```go
func Unmarshal(data []byte, v interface{}) error
```

**两个核心结构体**

从输入流读取并解析json

```go
type Decoder struct {
  // contains filtered or unexported fields
}
```

写json到输出流

```go
type Encoder struct {
  // contains filtered or unexported fields
}
```

**举个例子**：

```go
package main

import (
	"encoding/json"
	"fmt"
)

func main() {
	UnMarshal()
}
// 字符串转结构体
func UnMarshal() {
	b1 := []byte(`{"Name":"张三","Age":18,"Email":"zhangsan@xxx.com"}`)
	var m Person
	json.Unmarshal(b1, &m)
	fmt.Println(m) // {张三 18 zhangsan@xxx.com}
}
// 结构体转字符串
func Marshal() {
	p := Person{Name: "张三", Age: 18, Email: "zhangsan@xxx.com"}
	fmt.Println(p)
	// 转换为json
	marshal, _ := json.Marshal(p)
	// 返回的是一个byte[]，需要转成字符串
	fmt.Println(string(marshal)) // {"Name":"张三","Age":18,"Email":"zhangsan@xxx.com"}
}

type Person struct {
	Name  string
	Age   int
	Email string
}
```

#### 3.16.2 io流之网络编程

io流`Reader Writer`可以拓展到`http websocket`等场景

```go
// 可以从网络中获取json
f, _ := os.Open("a.json")
defer f.Close()
d := json.NewDecoder(f)
var v map[string]interface{}
d.Decode(&v)
fmt.Println(v) // map[Age:18 Email:zhangsan@xxx.com Name:张三]
```

将对象解析为json存储到文本中（也可以送到网络io里面）

```go
p := Person{Name: "张三", Age: 18, Email: "zhangsan@xxx.com"}
file, _ := os.OpenFile("a.json", os.O_WRONLY, 0777)
defer file.Close()
encoder := json.NewEncoder(file)
encoder.Encode(p)
```

### 3.17 标准库之encoding/xml

xml包实现xml解析

**两个核心函数**

将`struct`编码成xml，可以接受任意类型

```go
func Marshal(v interface{}) ([]byte, error)
```

将xml转换为`struct`

```go
func Unmarshal(data []byte, v interface{}) error
```

**举个例子**：

>结构体转xml

```go
package main

import (
	"encoding/xml"
	"fmt"
)

func main() {
	person := Person{Name: "张三", Age: 18, Email: "张三@xxx.com"}
	// 这样是没有对齐格式的
	marshal, _ := xml.Marshal(person)
	// 这样是有对齐格式的，第二个参数表示前缀，第三个表示缩紧
	indent, _ := xml.MarshalIndent(person, "", "  ")
	// 返回的是一个字节数组，需要转成字符串
	fmt.Println(string(marshal))
	// 有缩进的格式
	fmt.Println(string(indent))
}

type Person struct {
	XmlName xml.Name `xml:"person"`
	Name    string   `xml:"name"`
	Age     int      `xml:"age"`
	Email   string   `xml:"email"`
}
```

输出：

```xml
<Person><person></person><name>张三</name><age>18</age><email>张三@xxx.com</email></Person>
<Person>
  <person></person>
  <name>张三</name>
  <age>18</age>
  <email>张三@xxx.com</email>
</Person>
```

> xml转结构体

```go
str := "<Person><person></person><name>张三</name><age>18</age><email>张三@xxx.com</email></Person>"
b := []byte(str)
var p Person
xml.Unmarshal(b, &p)
fmt.Println(p) // {{ person} 张三 18 张三@xxx.com}
```

文件或者网络io读写

```go
// 读
file, _ := os.OpenFile("a.xml", os.O_RDONLY, 0777)
defer file.Close()
decoder := xml.NewDecoder(file)
var p Person
decoder.Decode(&p)
fmt.Println(p) // {{ person} 张三 18 张三@xxx.com}
```

```go
// 写
file, _ := os.OpenFile("a.xml", os.O_WRONLY, 0777)
defer file.Close()
encoder := xml.NewEncoder(file)
person := Person{Name: "张三", Age: 18, Email: "张三@xxx.com"}
// 转换为xml
encoder.Encode(person)
```

### 3.17 标准库之math

math包包含了一些常量和一些有用的数学计算函数，例如：三角函数、随机数、绝对值、平方根等

**相关常量**

![image-20230119142527992](https://cdn.fengxianhub.top/resources-master/image-20230119142527992.png)

**常用方法**：

- Abs：绝对值

- Pow(a, b)：取a的b次方

- Aqrt(x)：取x的开平方

- Cbrt(x)：取x的开立方

- Ceil(x)：向上取整

- Floor(x)：向下取整

- Mod(a, b)：取余数，等价于 a % b

- Mods(x)：取x的整数和小数

  ```go
  modf, frac := math.Modf(3.14)
  fmt.Println(modf) // 3
  fmt.Println(frac) // 0.14000000000000012
  ```

- math.rand.Int()：取一个int类型的随机数。可以设置随机数的种子`rand.Seed(time.Now().UnixMicro())`

- rand.Intn(n)：小于n的随机数，取不到n

















































