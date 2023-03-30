# golang最佳实践

## 1. interface的正确用法

go官方使用案例：https://github.com/golang/go/wiki/CodeReviewComments#interfaces

![image-20230330215947466](https://cdn.fengxianhub.top/resources-master/202303302159754.png)

下面的例子是我们很容易写错的，我们很容易用面向对象语言的写法写出面向接口编程的代码，也就是`构造器返回接口`，而不是实现

```go
// DO NOT DO IT!!!
package producer

type Thinger interface { Thing() bool }

type defaultThinger struct{ … }
func (t defaultThinger) Thing() bool { … }

func NewThinger() Thinger { return defaultThinger{ … } }
```

官方建议这样写

```go
package producer

type Thinger struct{ … }
func (t Thinger) Thing() bool { … }

func NewThinger() Thinger { return Thinger{ … } }
```

### 1.1 问题原因

>可以看上去有点懵，在面向对象的语言中，面向接口编程是为了实现`多态`，为什么golang官方提示`DO NOT DO IT!!!`呢？接下来以一个例子来演示

例如我现在有一个`CourseClient`，表示要学习那些课程，面向接口的写法是这样的

```go
type CourseClient interface {
	learnGO()
	learnJAVA()
	learnCPP()
}

type DefaultCourseClient struct {
}

func NewDefaultCourseClient() CourseClient {
	return &DefaultCourseClient{}
}

func (c *DefaultCourseClient) learnGO() {
	fmt.Println("DefaultCourseClient learnGO")
}
func (c *DefaultCourseClient) learnJAVA() {
	fmt.Println("DefaultCourseClient learnJAVA")

}
func (c *DefaultCourseClient) learnCPP() {
	fmt.Println("DefaultCourseClient learnCPP")
}

func main() {
	client := NewDefaultCourseClient()
	client.learnJAVA()
}

```

这样的好处当然是可以通过`多态`，将具体的实现类注入，之后如果想要一个其他的实现类，只需要添加对应的结构体并且为其绑定方法即可

```go
type OtherCourseClient struct {
}

func NewOtherCourseClient() CourseClient {
	return &OtherCourseClient{}
}

func (c *OtherCourseClient) learnGO() {
	fmt.Println("OtherCourseClient learnGO")
}
func (c *OtherCourseClient) learnJAVA() {
	fmt.Println("OtherCourseClient learnJAVA")

}
func (c *OtherCourseClient) learnCPP() {
	fmt.Println("OtherCourseClient learnCPP")
}

func main() {
	client := NewDefaultCourseClient()
	client.learnJAVA() // DefaultCourseClient learnJAVA
	client = NewOtherCourseClient()
	client.learnJAVA() // OtherCourseClient learnJAVA
}
```

>这样看起来很美好，但是这也引出了编程界著名的`想要一片绿叶却给我整片森林`的问题，即如果我只想要`learnJAVA`这个方法，但是我为了实现多态，需要实现所有的接口，在Java中是通过`抽象类`来解决的，而在`Go`中没有抽象类的概念，官方建议：
>
>- 将接口改为结构体（对应的实体类）



### 1.2 最佳实践

![img](https://cdn.fengxianhub.top/resources-master/202303310041136.avif)

## 2. 测试最佳实践

### 2.1 gomock使用



### 2.2 gomonkey使用





