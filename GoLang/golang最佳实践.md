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

![img](https://cdn.fengxianhub.top/resources-master/202305042113604.avif)



![image-20230504211407049](https://cdn.fengxianhub.top/resources-master/202305042114298.png)

## 2. 测试最佳实践

### 2.1 gomock使用



### 2.2 gomonkey使用





## 3. context

在golang里面context的定义如下

```go
type Context interface {
    Deadline(deadline time.Time, ok bool)
    Done() <- chan struct{}
    Err() error
    Value(key any) any
}
```

首先全三个是一起的

- Deadline：记录超时时间
- Done()：返回一个**只读管道**
- Err()：返回管道关闭的错误信息

当我们把context当作一个map使用的时候，可以使用第四个参数取出map里面的值，并且值都是`any`类型

在golang里面有默认的实现

```go
type emptyCtx int

func (*emptyCtx) Deadline() (deadline time.Time, ok bool) {
	return
}

func (*emptyCtx) Done() <-chan struct{} {
	return nil
}

func (*emptyCtx) Err() error {
	return nil
}

func (*emptyCtx) Value(key any) any {
	return nil
}
```

emptyCtx以小写开头，包外不可见，所以golang又提供了Background和TODO这2个函数让我们能获取到emptyCtx 

```go
var (
        background = new(emptyCtx)
        todo       = new(emptyCtx)
)
func Background() Context {
        return background
}
func TODO() Context {
        return todo
}
```

context的作用主要有：

![image-20230808210104526](https://cdn.fengxianhub.top/resources-master/image-20230808210104526.png)

### 3.1 传递参数

```go
func Test01(t *testing.T) {
	ctx := context.Background()
	childCtx := context.WithValue(ctx, "k1", "v1")
	t.Logf("%v", childCtx.Value("k1")) // v1
}
```

### 3.2 超时

```go
func Test01(t *testing.T) {
	t1 := time.Now()
	ctx, cancel := context.WithTimeout(context.TODO(), time.Millisecond*100)
	defer cancel()
	select {
	case <-ctx.Done():
		t.Logf("Time consumption:%v\n", time.Now().Sub(t1).Milliseconds()) // Time consumption:100
		t.Logf("%v\n", ctx.Err())                                          // context deadline exceeded
	}
}
```

如果父子ctx都有超时时间，并且父短子长，父接受后子也会结束

















