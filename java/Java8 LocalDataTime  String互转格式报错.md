# Java8 LocalDataTime  String互转格式报错，附LocalDataTime  String 13位时间戳互转代码

>这几天做项目，需要将`Java`的`LocalDataTime`和`String`类型互相转换，调用`LocalDataTime`的`now`再toString，发现格式里们的毫秒值有时有有时无，当毫秒数为0时就没有显示，如下：

```java
2022-02-24T13:29:44.991
2022-02-24T13:29:44.993
2022-02-24T13:29:44.994
2022-02-24T13:29:44.995
2022-02-24T13:29:44.998
2022-02-24T13:29:45
2022-02-24T13:29:45.001
2022-02-24T13:29:45.002
2022-02-24T13:29:45.004
2022-02-24T13:29:45.005
```

但是我在进行`String`转`LocalDataTime`时我是这样转的：

```java
String str = "2022-02-24T13:29:44.990";
DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss.SSS");
LocalDateTime borrowTime = LocalDateTime.parse(str, formatter);
```

这就导致，当没有毫秒值的`String`转`LocalDataTime`会报错，所以可以采用这种方式进行互转：

```java
String str = "2022-02-24T13:29:44";
DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss[.SSS]");
LocalDateTime borrowTime = LocalDateTime.parse(str, formatter);
```

将可能没有的格式用`[]`包起来就不会报错了，这样无论有没有毫秒数都不会报错了



<hr>

## 附录一下常用转换格式的代码，防止忘记

**LocalDataTime  String互转:**

```java
//String 转 LocalDataTime
String str = "2022-02-24T13:29:44";
DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss[.SSS]");
LocalDateTime borrowTime = LocalDateTime.parse(str, formatter);
```

```java
//LocalDataTime 转 String,输出格式：yyyy-MM-dd'T'HH:mm:ss[.SSS]
String str = LocalDataTime.now().toString();
```

**LocalDataTime  13位时间戳互转：**

```java
long milli = LocalDateTime.now().toInstant(ZoneOffset.of("+8")).toEpochMilli();//输出13位毫秒值
```

```java
long milli = 1645682330403L;
LocalDateTime localDateTime = LocalDateTime.ofInstant(Instant.ofEpochMilli(milli), ZoneOffset.of("+8"));
```

















