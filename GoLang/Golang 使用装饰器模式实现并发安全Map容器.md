# Golang 使用装饰器模式实现并发安全Map容器

>项目地址：https://github.com/fengyuan-liang/GoKit （学习使用，请谨慎在生产项目使用）
>
>其他更加完善的项目：https://github.com/emirpasic/gods （这个库数据结构比较完善，但是没有泛型）

在golang中`map`通过关键字给出，是线程不安全的。

这里笔者包装了一层map，并定义了`IMap`的接口，可以选择不同的实现，例如`LinkedHashMap`，`TreeMap`等等

这样我们就可以通过统一的方式，对所有实现`IMap`的Map进行装饰，让其变成线程安全的

```go
// SynchronizedMap is a thread-safe map
type SynchronizedMap[K comparable, V any] struct {
	m  IMap[K, V] // raw map
	mu *sync.RWMutex
}

// NewSynchronizedMap creates a new SynchronizedMap
func NewSynchronizedMap[K comparable, V any](rawMap IMap[K, V]) IMap[K, V] {
	return &SynchronizedMap[K, V]{
		m:  rawMap,
		mu: new(sync.RWMutex),
	}
}

// 下面是在方法中加读写锁进行实现，例如put方法
// Put adds a key-value pair to the map
func (s *SynchronizedMap[K, V]) Put(k K, v V) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.m.Put(k, v)
}

```

使用也非常简单

```go
// 直接使用线程安全的map
syncMap := NewConcurrentHashMap[string, int]()

// 包装需要线程安全的map

// NewConcurrentLinkedHashMap creates a new thread-safe linked hash map.
// It returns an implementation of the IMap interface using a SynchronizedMap that wraps a NewLinkedHashMap.
func NewConcurrentLinkedHashMap[K comparable, V any]() IMap[K, V] {
	return NewSynchronizedMap[K, V](NewLinkedHashMap[K, V]())
}
```

需要声明的是，笔者的库主要是学习使用，读者可以用同样的思路包装https://github.com/emirpasic/gods里面的map，使其变的线程安全