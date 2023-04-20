# golang for range指针操作取到同一个值（填坑）

>最近写了一个批量查询，结果转成Map[id]bean的方法，上线后有问题，发现每次所有的`k`都指向同一个`value`，最后背上一个`基础不牢`的骂名😭

我来还原一下案发现场

![image-20230404103843095](https://cdn.fengxianhub.top/resources-master/image-20230404103843095.png)

其实问题很简单

- for range循环其实这是普通for循环的语法糖，在for循环里面，`b`这个指针其实`只创建了一次`，之后每一次遍历其实都只是将这个指针指向新的地址
- 最后遍历的时候由于我们存的都是同一个指针，取到的当然也是同一个值

解决方式：

- 设置中间值，用来保存每次遍历出来的值

  ```go
  // 组装成map返回 k：userId v：v
  m := make(map[uint]*entity.Bottom)
  for _, b := range bottoms {
    // 中间变量指向对应的地址空间，并且每次都会重新创建一次，不会产生干扰
    tmp := b
    m[b.Id] = &tmp
  }
  ```

- 直接取值

  ```go
  // 不存放指针了，直接存值
  m := make(map[uint]entity.Bottom)
  for _, b := range bottoms {
    m[b.Id] = b
  }
  for k, v := range m {
    fmt.Println("k:", k, "v:", v)
  }
  ```

![image-20230404103926973](https://cdn.fengxianhub.top/resources-master/image-20230404103926973.png)