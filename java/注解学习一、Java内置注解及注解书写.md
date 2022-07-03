# 注解学习一、Java内置注解及简单注解书写

## 1. Java中的内置注解

Java 定义了一套注解，共有 7 个，3 个在 java.lang 中，剩下 4 个在 java.lang.annotation 中。

- @Override - 检查该方法是否是重写方法。如果发现其父类，或者是引用的接口中并没有该方法时，会报编译错误。
- @Deprecated - 标记过时方法。如果使用该方法，会报编译警告。
- @SuppressWarnings - 指示编译器去忽略注解中声明的警告。

作用在其他注解的注解(或者说<code>元注解</code>)是:

- @Retention - 标识这个注解怎么保存，是只在代码中，还是编入class文件中，或者是在运行时可以通过反射访问。
- @Documented - 标记这些注解是否包含在用户文档中。
- @Target - 标记这个注解应该是哪种 Java 成员。
- @Inherited - 标记这个注解是继承于哪个注解类(默认 注解并没有继承于任何子类)

从 Java 7 开始，额外添加了 3 个注解:

- @SafeVarargs - Java 7 开始支持，忽略任何使用参数为泛型变量的方法或构造函数调用产生的警告。
- @FunctionalInterface - Java 8 开始支持，标识一个匿名函数或函数式接口。
- @Repeatable - Java 8 开始支持，标识某注解可以在同一个声明上使用多次。

>下面介绍几个常用的注解

### 1.1 Retention注解

 标识这个注解怎么保存，是只在代码中，还是编入class文件中，或者是在运行时可以通过反射访问。

- source：注解只保留在源文件，当Java文件编译成class文件的时候，注解被遗弃；被编译器忽略
- class：注解被保留到class文件，但jvm加载class文件时候被遗弃，这是默认的生命周期
- runtime：注解不仅被保存到class文件中，jvm加载class文件之后，仍然存在

```java
@Retention(RetentionPolicy.RUNTIME)  //source  <   class   <   runtime(runtime级别最高)
```

### 1.2 Target注解

标记这个注解应该是哪种 Java 成员使用。

-  TYPE,    类、接口（包括注释类型）或枚举声明
-  FIELD,   字段声明（包括枚举常量）
-  METHOD,    方法声明
-  PARAMETER,   参数声明 
-  CONSTRUCTOR,   构造方法声明
-  LOCAL_VARIABLE, 局部变量声明
-  ANNOTATION_TYPE,  释类型声明 
-  PACKAGE  包声明

```java
@Target(ElementType.CONSTRUCTOR)//在构造器上声明
```

用括号<code>{}</code>，写多个值，其实是传入一个<code>ElementType[] value()</code>数组：

```java
@Target({ElementType.CONSTRUCTOR,ElementType.METHOD,ElementType.TYPE})//表示可以在构造器，方法和类上使用
```

也可以通过导包进行简写：

```java
import static java.lang.annotation.ElementType.*;
@Target({CONSTRUCTOR,METHOD,TYPE})
```

### 1.3 SuppressWarnings注解

源码定义:

```java
@Target({TYPE, FIELD, METHOD, PARAMETER, CONSTRUCTOR, LOCAL_VARIABLE})
@Retention(RetentionPolicy.SOURCE)
public @interface SuppressWarnings {
    String[] value();
}
```

- String[] value(); 意味着，SuppressWarnings 能指定参数
- <code>SuppressWarnings</code> 的作用是，让编译器对<code>它所标注的内容</code>的某些警告<code>保持静默</code>。例如，"@SuppressWarnings(value={"deprecation", "unchecked"})" 表示对"它所标注的内容"中的 "SuppressWarnings 不再建议使用警告"和"未检查的转换时的警告"保持沉默。

### 1.4 @FunctionalInterface

​		函数式接口注解，这个是 Java 1.8 版本引入的新特性。函数式编程很火，所以 Java 8 也及时添加了这个特性。被标记为函数式接口的方法可以使用Lambda表达式。例如我们经常用的Runnable接口

![image-20220121220303166](https://cdn.fengxianhub.top/resources-master/202201212203304.png)



## 2. 自定义简单注解

我们可以定义一个<code>DbConnection</code>的注解，用来代替数据库连接配置文件<code>db.properties</code>

**注意**：所有的注解都必须要带两个注解：<code>@Retention()</code>、<code>@Target()</code>

```java
/**
 * DbHelper 连接注解
 */
@Retention(RetentionPolicy.RUNTIME)//表示在运行时有，这样在源码，字节码和运行期都有
@Target(ElementType.METHOD)//作用在方法上面
public @interface DbConnection {
    public String userName();
    public String password();
    public String driverName() default "com.mysql.cj.jdbc.Driver";
    public String url() default "jdbc:mysql://localhost:3306/iot?useUnicode=true&characterEncoding=utf-8&useSSL=false&serverTimezone=Asia/Shanghai";
}
```

每一个属性对应的是一个方法，方法有返回值：

```java
 public String userName();
```

也可以给属性添加默认值，在使用注解时就可以不用填了

```java
public String driverName() default "com.mysql.cj.jdbc.Driver";
```

然后我们可以在方法上面进行使用这个注解：

```java
@DbConnection(userName = "root",password = "123456")
private Connection getConn(){

}
```

但此时是没有用的，因为还没有配置<code>注解解析器</code>

注解解析器其实就是利用反射将反射对象里的每个方法拿到，在根据拿到的方法拿到上面的注解，再对注解进行解析

注解解析器：

```java
@DbConnection(userName = "root",password = "123456")
public Connection getConn() throws Exception{
    //1. 取出这个方法对应的类的对象的反射实例
    Method method = this.getClass().getMethod("getConn");
    //取上面的注解
    Annotation[] ans = method.getDeclaredAnnotations();
    //可能有多个注解，循环取值
    for(Annotation an : ans){
        if(an instanceof DbConnection){
            //类型转换
            DbConnection dbConn = (DbConnection) an;
            //取到注解里面的值
            String userName = dbConn.userName();
            String password = dbConn.password();
            String url = dbConn.url();
            String driverName = dbConn.driverName();
            //注册驱动
            Class.forName(driverName);
            //获得连接
            Connection conn = DriverManager.getConnection(url, userName, password);
            return conn;
        }
    }
    return null;
}
```

测试：

```java
public static void main(String[] args) throws Exception {
    DbHelper dbHelper = new DbHelper();
    Connection conn = dbHelper.getConn();
    System.out.println(conn);
}
```

![image-20220121154707674](https://cdn.fengxianhub.top/resources-master/202201211547753.png)



**下一节笔者会模仿一个现在非常优秀的测试框架<code>Junit</code>用注解进行简单实现**

