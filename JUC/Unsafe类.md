# Unsafe类调用及自定义Atomic原子类

思维导图：

![image-20220501120423636](https://cdn.fengxianhub.top/resources-master/202205011204892.png)

unsafe类功能及使用请看：https://www.jianshu.com/p/db8dce09232d

Java和C++语言的一个重要区别就是Java中我们无法直接操作一块内存区域，不能像C++中那样可以自己申请内存和释放内存。Java中的Unsafe类为我们提供了类似C++手动管理内存的能力。
 Unsafe类，全限定名是`sun.misc.Unsafe`，从名字中我们可以看出来这个类对普通程序员来说是“危险”的，一般应用开发者不会用到这个类。

## 1. Unsafe类调用

>错误方案
>
>原因：在调用`Unsafe.getUnsafe()`时会判断调用类的父级类加载器，只有是根加载器才能调用，即我们无法调用此方法拿到一个Unsafe实例

```java
/**
 * 需求：通过UnSafe类提供的compareAndSwapInt()方法来完成一个类中的state值的原子性操作
 *  1. 创建Unsafe对象，Unsafe构造方法是私有的，可以尝试通过public static Unsafe getUnsafe()
 *  2. 要通过 public final native boolean compareAndSwapLong(Object o, long offset,
 *                                                long expected,
 *                                                long x);来设置值，但问题是offset如何设置
 *  3. 通过 public native long objectFieldOffset(Field var1);来获取一个属性的偏移地址
 */
public class Test1_unsafe_error {
    /**
     * 方案一：错误方案，因为Test1_unsafe是用AppClassLoader加载的，而Unsafe类是在rt.jar下，它由BootStrap类加载器加载
     */
    private static final Unsafe unsafe = Unsafe.getUnsafe();
    static long stateOffset;//state变量在内存中的偏移量
    private volatile int state = 0; //要设置的值
    static{
        try {
        	//错误方案                                      这是反射中的filed对象，这里值的是state这个属性
            stateOffset = unsafe.objectFieldOffset(Test1_unsafe_error.class.getDeclaredField("state"));
        } catch (Exception e) {
        	e.printStackTrace();
        }
    }
    public static void main(String[] args) {
        Test1_unsafe_error test = new Test1_unsafe_error();
        //通过设置内存偏移量来操作state的值        要操作的对象    要操作属性的偏移量   原值   要更新的值
        boolean flag = unsafe.compareAndSwapInt(test,        stateOffset, 0, 1);
        System.out.println("设置结果："+flag);
        //输出修改后的值
        System.out.println(test.state);
    }
}
```

我们看到`unsafe`类的构造器是私有化的，也就是说我们不能通过私有的构造器`new`出来

![image-20220502185327270](https://cdn.fengxianhub.top/resources-master/202205021853647.png)

那既然你们已经有一个实例了，我们能不能通过静态方法`private static Unsafe unsafe = Unsafe.getUnsafe()`直接拿到呢？

其实是不能的，我们调用` Unsafe.getUnsafe()`时，会执行以下代码

```java
@CallerSensitive
public static Unsafe getUnsafe() {
    Class<?> caller = Reflection.getCallerClass();
    if (!VM.isSystemDomainLoader(caller.getClassLoader()))
        throw new SecurityException("Unsafe");
    return theUnsafe;
}
```

点进`VM.isSystemDomainLoader`方法中我们就能看到

```java
public static boolean isSystemDomainLoader(ClassLoader loader) {
    return loader == null;
}
```

显然只有在`rt.jar`包下的类才会用根加载器加载，其调用`getClassLoader()`取到的加载器为null，才能拿到`unsafe`对象

>正确方案

```java
public class Test1_unsafe_error {
    /**
     * 方案一：错误方案，因为Test1_unsafe是用AppClassLoader加载的，而Unsafe类是在rt.jar下，它由BootStrap类加载器加载
     */
//    private static Unsafe unsafe = Unsafe.getUnsafe();
    static long stateOffset;//state变量在内存中的偏移量
    //方案二，正确方案
    static Unsafe unsafe;
    private volatile int state = 0; //要设置的值
    static{
        try {

            //方案二，正确方案
            //使用反射获取Unsafe的成员变量theUnsafe
            Field field = Unsafe.class.getDeclaredField("theUnsafe");
            //设置访问权限
            field.setAccessible(true);
            //获取此变量的值
            unsafe = (Unsafe)field.get(null);
            //获取state变量在Test1_unsafe中的偏移量
            stateOffset = unsafe.objectFieldOffset(Test1_unsafe_error.class.getDeclaredField("state"));

        	//方案一，错误方案                                      这是反射中的filed对象，这里值的是state这个属性
//            stateOffset = unsafe.objectFieldOffset(Test1_unsafe_error.class.getDeclaredField("state"));
        } catch (Exception e) {
        	e.printStackTrace();
        }
    }

    public static void main(String[] args) {
        Test1_unsafe_error test = new Test1_unsafe_error();
        //通过设置内存偏移量来操作state的值        要操作的对象    要操作属性的偏移量   原值   要更新的值
        boolean flag = unsafe.compareAndSwapInt(test,        stateOffset, 0, 1);
        System.out.println("设置结果："+flag);
        //输出修改后的值
        System.out.println(test.state);
    }
}

```

## 2. 自定义Atomic原子类

我们先来看一下Atomic原子类的基本API操作

```java
public class Test2_AtomicInteger {
    public static void main(String[] args) {
        AtomicInteger a = new AtomicInteger(10);
        System.out.println(a.getAndIncrement());//安全的自增
        System.out.println(a.incrementAndGet());//先增加在get
        System.out.println(a.get());
        System.out.println(a.addAndGet(2));//增加2再get
        System.out.println(a.getAndSet(2));//拿到再设置值
        System.out.println(a.get());
    }
}
```

输出结果：

```java
10
12
12
14
14
2
```

我们知道Atomic原子类能够保证原子性，接下来看一下使用：

```java
public class Test2_AtomicInteger_count {
    private static AtomicLong a = new AtomicLong();
    private static Integer[] arr1 = {0, 1, 2, 3, 4, 0, 6, 7, 8, 0};
    private static Integer[] arr2 = {0, 1, 2, 3, 4, 0, 6, 7, 8, 0};

    public static void main(String[] args) throws InterruptedException {
        Thread t1 = new Thread(() -> {
            for (int i : arr1) {
                if (i == 0) {
                    a.incrementAndGet();
                }
            }
        });
        Thread t2 = new Thread(() -> {
            for (int i : arr2) {
                if (i == 0) {
                    a.incrementAndGet();
                }
            }
        });
        t1.start();
        t2.start();
        t1.join(); //防止子线程还没有运行完，主线程先运行完了
        t2.join();
        System.out.println("0出现了：" + a.get() + "次");
    }
}
输出结果：
    0出现了：6次
```

我们知道`i++`并不是一个原子操作，因为同时涉及到了内存读和内存写，但是我们使用Atomic原子类就能保证该操作为原子操作，底层其实就是调用了`unsafe`类

```java
public final long incrementAndGet() {
    return unsafe.getAndAddLong(this, valueOffset, 1L) + 1L;
}
```

`unsafe`底层调用了`CAS`进行硬件级别的并发保证

```java
public final long getAndAddLong(Object o, long offset, long delta) {
    long v;
    do {
        v = getLongVolatile(o, offset);
    } while (!compareAndSwapLong(o, offset, v, v + delta));
    return v;
}
```

>接下来我们也使用`unsafe`类自定义一个简单的Atomic原子类

```java
public class Test3_myAtomicInteger {
    private static MyAtomicInteger a = new MyAtomicInteger();
    private static Integer[] arr1 = {0, 1, 2, 3, 4, 0, 6, 7, 8, 0};
    private static Integer[] arr2 = {0, 1, 2, 3, 4, 0, 6, 7, 8, 0};

    public static void main(String[] args) throws InterruptedException {
        Thread t1 = new Thread(() -> {
            for (int i : arr1) {
                if (i == 0) {
                    a.incrementAndGet();
                }
            }
        });
        Thread t2 = new Thread(() -> {
            for (int i : arr2) {
                if (i == 0) {
                    a.incrementAndGet();
                }
            }
        });
        t1.start();
        t2.start();
        t1.join(); //防止子线程还没有运行完，主线程先运行完了
        t2.join();
        System.out.println("0出现了：" + a.get() + "次");
    }
}

class MyAtomicInteger {
    private static Unsafe unsafe;
    private static long stateOffset;//state变量在内存中的偏移量
    private volatile long state = 0;//要设置的值

    static {
        try {
            //通过反射拿到Unsafe类的实例
            Field field = Unsafe.class.getDeclaredField("theUnsafe");
            //设置访问权限
            field.setAccessible(true);
            //获取此变量的值
            unsafe = (Unsafe) field.get(null);
            //获取state变量在当前类中的偏移量
            stateOffset = unsafe.objectFieldOffset(MyAtomicInteger.class.getDeclaredField("state"));
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    public final long incrementAndGet() {
        int v;
        do {
            v = unsafe.getIntVolatile(this, stateOffset);
            System.out.println(Thread.currentThread().getName() + "值 为：" + v);
        } while (!unsafe.compareAndSwapInt(this, stateOffset, v, v + 1));
        return v;
    }

    public long get() {
        return unsafe.getInt(this, stateOffset);
    }
}

```

输出结果：

```java
Thread-0值 为：0
Thread-1值 为：0
Thread-0值 为：1
Thread-1值 为：1
Thread-0值 为：2
Thread-1值 为：2
Thread-1值 为：3
Thread-1值 为：4
Thread-1值 为：5
0出现了：6次
```

>可以看到如果在单线程情况下应该运行6次，但是这里却运行了9次，在这里就出现了3次冲突，自旋锁起作用了！























