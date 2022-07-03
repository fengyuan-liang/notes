# Java注解学习二、使用注解仿写Junit测试框架

## 1. 原生junit测试框架注解解析

><code>junit</code>是一个非常优秀的测试框架，里面给我们提供了大量的注解

常用的有：

```java
@BeforeClass //针对所有测试，只执行一次，且必须为static void
@Before	//初始化方法
@Test	//测试方法，在这里可以测试期望异常和超时时间
@Ignore	//忽略的测试方法
@After	//释放资源
@AfterClass	//针对所有测试，只执行一次，且必须为static void
```

执行顺序（ <code>Junit</code>生命周期）：

```java
一个测试类单元测试的执行顺序为：

@BeforeClass –> @Before –> @Test –> @After –> @AfterClass

每一个测试方法的调用顺序为：

@Before –> @Test –> @After
```

我们可以简单测试一下：

```java
public class TestJunit {

    static Calculator calculator;
    
    @BeforeClass
    public static void BeforeClass(){
        System.out.println("BeforeClass");
        calculator = new Calculator();
    }

    @Before
    public void before(){
        System.out.println("before");
    }

    @Test
    public void testAdd(){
        Assert.assertEquals(3,calculator.add(1,2));
        System.out.println("add测试成功");
    }

    @Test
    public void testSub(){
        Assert.assertEquals(-1,calculator.sub(1,2));
        System.out.println("sub测试成功");
    }
    
    @Ignore
    public void Ignore(){
        System.out.println("myIgnore");
    }

    @After
    public void After(){
        System.out.println("After");
    }

    @AfterClass
    public static void AfterClass(){
        System.out.println("AfterClass");
    }
}

class Calculator{
    public int add(int a,int b){
        return a + b;
    }
    public int sub(int a,int b){
        return a - b;
    }
}
```

运行结果：

![image-20220121183545371](https://cdn.fengxianhub.top/resources-master/202201211835448.png)



## 2. DiyJunit测试框架仿写注解

### 2.1 先定义我们自己的注解

![image-20220121192340307](https://cdn.fengxianhub.top/resources-master/202201211923456.png)

​		我们从上一期可以知道每个注解它必须要带两个注解：<code>@Retention()</code>、<code>@Target()</code>，在这里我们声明的注解仅仅是用来标记一个方法，且必须要让字节码文件能被我们的启动器加载到，所以所有的注解都可以定义为：

```java
//其他注解也是一样，不需要带属性
@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.METHOD)
public @interface myAfter {
}
```

其实我们通过<code>Junit</code>的源码可以看到，它里面的绝大部分注解也没有属性，仅仅起到标记作用

![image-20220121192047229](https://cdn.fengxianhub.top/resources-master/202201211920371.png)



### 2.2 将自己定义的注解加到测试类上



```java
public class TestDiyJunit {

    static Calculator calculator;

    @myBeforeClass
    public static void BeforeClass(){
        System.out.println("myBeforeClass");
        calculator = new Calculator();
    }

    @myBefore
    public void before(){
        System.out.println("mybefore");
    }

    @myTest
    public void testAdd(){
        System.out.println("add测试："+calculator.add(1,2));
    }

    @myTest
    public void testSub(){
        System.out.println("sub测试："+calculator.sub(1,2));
    }

    @myIgnore
    public void Ignore(){
        System.out.println("myIgnore");
    }

    @myAfter
    public void After(){
        System.out.println("myAfter");
    }

    @myAfterClass
    public static void AfterClass(){
        System.out.println("myAfterClass");
    }
}

class Calculator{
    public int add(int a,int b){
        return a + b;
    }
    public int sub(int a,int b){
        return a - b;
    }
}

```



### 2.3 注解解析器

```java
public class myRunner {
    public static void run(Class cls){
        //1. 取出类的反射实例里的所有方法
        Method[] methods = cls.getMethods();
        List<Method> myBeforeClassMethod = new ArrayList<>();
        List<Method> myBeforeMethod = new ArrayList<>();
        List<Method> myTestMethod = new ArrayList<>();
        List<Method> myAfterMethod = new ArrayList<>();
        List<Method> myAfterClassMethod = new ArrayList<>();
        //2. 遍历所有的方法
        for(Method m : methods){
            Annotation[] ans = m.getDeclaredAnnotations();
            //遍历注解，将注解标记的方法放到对应的集合中
            for(Annotation an : ans){
                if(an instanceof myBeforeClass){
                    myBeforeClassMethod.add(m);
                }else if(an instanceof myBefore){
                    myBeforeMethod.add(m);
                }else if(an instanceof myTest){
                    myTestMethod.add(m);
                }else if(an instanceof myAfter){
                    myAfterMethod.add(m);
                }else if(an instanceof myAfterClass){
                    myAfterClassMethod.add(m);
                }
            }
        }
        //3. 按照Junit生命周期激活方法
        try {
            //通过无参构造得到一个反射实例
            Object obj = cls.newInstance();
        	//1. 先执行@myBeforeClass标记的方法，这个方法只能标记在静态方法上面，且只执行一次
            for(Method m : myBeforeClassMethod){
                /*
                 * 实例方法反射激活： m.invoke(对象名，参数)
                 * 静态方法反射激活： m.invoke(null，参数)
                 */
                m.invoke(null);
            }
            //2. 根据Junit生命周期我们可以知道，每次@Test执行前后都会执行@myBefore和@myAfter注解的方法
            for(Method testMethod : myTestMethod){
                //激活所有的@Before方法
                for(Method m : myBeforeMethod){
                    m.invoke(obj);
                }
                //激活@Test方法
                for(Method m : myTestMethod){
                    m.invoke(obj);
                }
                //激活所有的@myAfter方法
                for(Method m : myAfterMethod){
                    m.invoke(obj);
                }
            }
            //3. 最后执行@myAfterClassMethod方法，这个方法只能标记在静态方法上面，且只执行一次
            for(Method m : myAfterClassMethod){
                //静态方法反射激活： m.invoke(null，参数)
                m.invoke(null);
            }
        } catch (Exception e) {
        	e.printStackTrace();
        }
    }
}

```

>小细节

​		在实现<code>@myBeforeClass</code>注解标记的方法时笔者并没有对其进行检查，因为<code>Junit</code>官方注解要求其其添加的方法必须为static void，这里牵涉到Java反射中比较有意思的几个点，单独拿出来写一下

首先就是在Java反射中：

```java
实例方法反射激活： m.invoke(实例对象，参数)
静态方法反射激活： m.invoke(null，参数)
```

**那么我们怎么判断一个注解修饰的方法是不是静态的呢？**

可以通过：

```java
int modifiers = m.getModifiers();//m是反射拿到的方法
```

这里返回的是一个int类型的值，此方法返回值的规定为：

```java
什么都不加 是0 ， public  是1 ，private 是 2 ，protected 是 4，static 是 8 ，final 是 16。
```

所以我们可以通过 

```java
modifiers & 8 == 8
```

来判断是不是被<code>static</code>修饰的方法

```java
	00001000	00001000
&   00001000	00000001
=   00001000    00000000
```

当然 Java也给我包装好了方法，底层也是通过逻辑<code>&</code>实现的

![image-20220122195135393](https://cdn.fengxianhub.top/resources-master/202201221951706.png)

**怎么判断一个方法的返回值类型呢？**

```java
Type type = m.getReturnType();
String typeName = type.getTypeName();
```

所以完整代码为：

```java
//这里要判断这个方法是否为静态且返回值为空的
int modifiers = m.getModifiers();
Type type = m.getReturnType();
String typeName = type.getTypeName();
if(Modifier.isStatic(modifiers) && "void".equals(typeName)){
    myBeforeClassMethod.add(m);
}
```

到这里不得不感叹一句<code>Java反射</code>的强大之处！！！

### 2.4 手动注入我们要加载的类

```java
/**
 * 程序的入口类，在集成化的IDE中，通常使用插件的形式实现这个类，并可以通过鼠标右键点击直接启动
 * 它会自动解析这个类（这个类必须要有Junit的注解），且注解上的@Retention注解一般都是RUNTIME，
 * 这意味着IDE可以分析单元测试的源码并将其字节码文件加载到IDE的vm环境中运行（字节码加载->双亲委派模型）
 */
public class TestMain {
    //我们这里手动实现
    public static void main(String[] args) {
        //通过注解解析器myRunner加载我们需要解析的响应注解或者类
        myRunner.run(TestDiyJunit.class);
    }
}
```

### 2.5 测试

![image-20220121200707584](https://cdn.fengxianhub.top/resources-master/202201212007748.png)



### 2.6 总结

​	通过上面的小栗子我们可以知道注解有很多作用，例如对某一事物进行添加<code>注释说明</code>，可以存放一些<code>信息</code>等等，其实笔者觉得任何东西上手实操后才能更加的理解深刻，读者可以多自定义一些注解，并进行使用，遇到疑问在带有目的性的学习，这样能够理解更加深刻，笔者的另一篇文章DiyTomcat里面也防写了<code>@WebServlet()</code>，读者可以自己动手尝试写一下



























