# Java字符串拼接技术奥秘

在java中进行字符串拼接，一般有以下几种方法

>`+`， `join`，`StringBuffer`，`StringBuilder`或`String.concat()`

在一些古老的技术文章或者博客里面会说在Java中使用`+`做字符串拼接性能不好，但是实际情况是在`jdk9`之后的版本中，使用`+`会比使用`StringBuilder`更快

![image-20240822003908691](https://cdn.fengxianhub.top/resources-master/image-20240822003908691.png)

先说结论：在早期的 JDK 版本中，使用 `+` 进行字符串拼接可能会导致性能问题，因为每次拼接都会创建一个新的 `String` 对象，在 JDK 6 和 7 中，JVM 开始引入了一些优化措施，比如内联缓存（inline caching）和字符串拼接优化，这些优化使得使用 `+` 进行字符串拼接的性能得到了显著改善。到了 JDK 9 及以后的版本，这些优化更加完善

- jdk8：对于较小的字符串和少量的拼接操作，JVM 会尝试使用 `StringBuilder` 或者其他高效的内部方法来减少对象创建
- jdk9：

```shell
docker run -v /home/lfy/workspace/config:/config \
           -e "SPRING_CONFIG_LOCATION=/config/application.yml" \
           
           registry.cn-hangzhou.aliyuncs.com/fengyuan-liang/springbootnativedemo:v0.0.1 


```



