# 使用gorutine和channel实现future/promise进行更方便的异步编程

>项目地址：https://github.com/fengyuan-liang/gofuture

Go future提供了一个类似于Java/Scala Futures的实现。

尽管有很多方法可以处理future。

但是这个库对于习惯了Java/Scala Future实现的人来说还是很有用的。

## Import
```go
go get "github.com/fengyuan-liang/gofuture"
```

## 使用

```go
futureFunc := future.FutureFunc[int](Fibonacci, 10)
result, err := futureFunc.Get()

// Fibonacci returns the nth Fibonacci number
func Fibonacci(n int) int {
    if n <= 0 {
       return 0
    }
    if n == 1 {
       return 1
    }
    return Fibonacci(n-1) + Fibonacci(n-2)
}
```
或者这样，可以返回执行中可能出现的错误
```go
futureFunc := future.FutureFunc[int](Add, 10, 20)
result, err := futureFunc.Get()

func Add(a, b int) (int, error) {
    return a + b, errors.New("you can return error")
}
```
堵塞获取等待超时时间
```go
futureFunc := FutureFunc[int](Fibonacci, 100) // This Fibonacci number is too large
result, err := futureFunc.GetWithTimeout(time.Second * 5)
```
当然也可以不使用匿名函数类型(显然匿名形式更加优雅😊)
```go
futureFunc := FutureFunc[int](func() int {
    return Fibonacci(100)
})
```