# java中线程启动过程分析及本地方法 start0源代码的追踪学习

>先回顾一下线程的生命周期

流程图：

![image-20220311160938348](https://gitee.com/fengxian_duck/resources/raw/master/202203111609672.png)

>当我们调用Thread的start方法时（没有放任务，重写了run方法）：

```java
public class _0_Thread {
    public static void main(String[] args) {
        System.out.println("主方法的开头");
        MyThread myThread = new MyThread();
        myThread.start();//子程序运行
    }
}
class MyThread extends Thread{
    @Override
    public void run() {
        for (int i = 0; i < 100; i++) {
            System.out.println("MyThread类中的i值为："+i);
            try {
                Thread.sleep(1000);
            } catch (Exception e) {
                e.printStackTrace();
            }
        }
    }
}

```

start()方法的调用过程如下：

```java
myThread.start() -> 继承自Thread类的start()方法 -> start0() -> private native void start0() -> cpp底层去找当前线程类的run方法 -> myThread的run方法	
```

在Java中用`native`关键字修饰的方法表示这是一个本地方法，也就是底层是用`cpp`写的

>当我们往Thread里面丢一个任务，在start时

```java
public static void main(String[] args) {
    Thread thread = new Thread(() -> System.out.println("线程启动"));
    thread.start();
}
```

`new Thread(() -> System.out.println("线程启动"))`的调用过程如下：

```java
thread.start() -> Thread类的start0() -> init(null, target, "Thread-" + nextThreadNum(), 0)
    -> init(ThreadGroup g, Runnable target, String name,
                      long stackSize, AccessControlContext acc,
                      boolean inheritThreadLocals)
    -> this.target = target(Thread类有一个target属性)
```

`thread.start()`的调用过程如下：

```java
thread.start() -> start0() 注意这里是线程类的start0方法，不是任务类的 -> cpp底层去找当前线程类的run方法
    -> Thread类的run方法 
    -> 	@Override
		public void run() {
    		if (target != null) {
        	target.run();
        }
```

>到这里，我们可以看出`start0()`这个本地方法的作用，但是我们还是没有办法查看下去。我们可以去`openJDK`里找到答案
>
>首先我们需要知道的是，我们一般用的都是`Oracle JDK`，它和`openJDK`的区别有：
>
>`openJDK` 是对外开放源码的，`Oracle JDK`则没有（部分开源，大概开源7%作用）

他们之间区别看：<a href="https://blog.csdn.net/qq_42105629/article/details/105282823?ops_request_misc=&request_id=&biz_id=102&utm_term=%E6%AF%94%E8%BE%83%E4%B8%80%E4%B8%8BopenJDK&utm_medium=distribute.pc_search_result.none-task-blog-2~all~sobaiduweb~default-0-105282823.es_vector_control_group&spm=1018.2226.3001.4187">比较一下 Oracle JDK与openJDK的区别</a>

openJDK可以在这里下载：<a href="https://hg.openjdk.java.net/">openJDK下载</a>           <a href="https://hg.openjdk.java.net/jdk8u/jdk8u/jdk/file/f0b93fbd8cf8">openJDK1.8</a>

`start0()`底层 c 代码地址：<a href="https://hg.openjdk.java.net/jdk8u/jdk8u/jdk/file/f0b93fbd8cf8/src/share/native/java/lang/Thread.c">start0()底层c代码</a>

>点进去看之后我们可以注意到一个方法：
>
>这个方法主要是建立了方法之间的映射关系，将 start0 映射到 JVM_StartThread方法上

```c
static JNINativeMethod methods[] = {
    {"start0",           "()V",        (void *)&JVM_StartThread},
    {"stop0",            "(" OBJ ")V", (void *)&JVM_StopThread},
    {"isAlive",          "()Z",        (void *)&JVM_IsThreadAlive},
    {"suspend0",         "()V",        (void *)&JVM_SuspendThread},
    {"resume0",          "()V",        (void *)&JVM_ResumeThread},
    {"setPriority0",     "(I)V",       (void *)&JVM_SetThreadPriority},
    {"yield",            "()V",        (void *)&JVM_Yield},
    {"sleep",            "(J)V",       (void *)&JVM_Sleep},
    {"currentThread",    "()" THD,     (void *)&JVM_CurrentThread},
    {"countStackFrames", "()I",        (void *)&JVM_CountStackFrames},
    {"interrupt0",       "()V",        (void *)&JVM_Interrupt},
    {"isInterrupted",    "(Z)Z",       (void *)&JVM_IsInterrupted},
    {"holdsLock",        "(" OBJ ")Z", (void *)&JVM_HoldsLock},
    {"getThreads",        "()[" THD,   (void *)&JVM_GetAllThreads},
    {"dumpThreads",      "([" THD ")[[" STE, (void *)&JVM_DumpThreads},
    {"setNativeName",    "(" STR ")V", (void *)&JVM_SetNativeThreadName},
};
```

`(void *)&JVM_StartThread`方法是写在`#include "jvm.h"`这个库文件中的

接下来我们要查`JVM`虚拟机底层实现的代码，但是`JVM`也分很多种类，openJDK使用的是基于`hotspot`的虚拟机

所以我们可以在这里找到底层源码：<a href="https://hg.openjdk.java.net/jdk8u/jdk8u/hotspot/file">hotspot源码</a>     <a href="https://hg.openjdk.java.net/jdk8u/jdk8u/hotspot/file/76a9c9cf14f1/src/share/vm/prims">jvm.h源码</a>

这里我们注意：`jvm.h`文件只是声明了宏，具体实现在,<a href="https://hg.openjdk.java.net/jdk8u/jdk8u/hotspot/file/76a9c9cf14f1/src/share/vm/prims/jvm.cpp">jvm.cpp</a>中，我们点进去搜索一下`JVM_StartThread`就可以看到下面的代码：

```c
JVM_ENTRY(void, JVM_StartThread(JNIEnv* env, jobject jthread))
  JVMWrapper("JVM_StartThread");
  JavaThread *native_thread = NULL;
```

这个`JVM_ENTRY`是一个入口程序，我们来研究下里面的代码：

```cpp
JVM_ENTRY(void, JVM_StartThread(JNIEnv* env, jobject jthread))
  JVMWrapper("JVM_StartThread");
  JavaThread *native_thread = NULL; //创建一个引用

  // We cannot hold the Threads_lock when we throw an exception,
  // due to rank ordering issues. Example:  we might need to grab the
  // Heap_lock while we construct the exception.
  bool throw_illegal_thread_state = false;

  // We must release the Threads_lock before we can post a jvmti event
  // in Thread::start.
  {
    // Ensure that the C++ Thread and OSThread structures aren't freed before
    // we operate.
    MutexLocker mu(Threads_lock); //加了一把线程锁

    // Since JDK 5 the java.lang.Thread threadStatus is used to prevent
    // re-starting an already started thread, so we should usually find
    // that the JavaThread is null. However for a JNI attached thread
    // there is a small window between the Thread object being created
    // (with its JavaThread set) and the update to its threadStatus, so we
    // have to check for this
    if (java_lang_Thread::thread(JNIHandles::resolve_non_null(jthread)) != NULL) {
      throw_illegal_thread_state = true; //抛异常
    } else {   //下面的是重点
      // We could also check the stillborn flag to see if this thread was already stopped, but
      // for historical reasons we let the thread detect that itself when it starts running
 	  // 计算创建线程所需要的大小
      jlong size =
             java_lang_Thread::stackSize(JNIHandles::resolve_non_null(jthread));
      // Allocate the C++ Thread structure and create the native thread.  The
      // stack size retrieved from java is signed, but the constructor takes
      // size_t (an unsigned type), so avoid passing negative values which would
      // result in really large stacks.
      size_t sz = size > 0 ? (size_t) size : 0;
      //生成一个JavaThread的对象
      native_thread = new JavaThread(&thread_entry, sz);

      // At this point it may be possible that no osthread was created for the
      // JavaThread due to lack of memory. Check for this situation and throw
      // an exception if necessary. Eventually we may want to change this so
      // that we only grab the lock if the thread was created successfully -
      // then we can also do this check and throw the exception in the
      // JavaThread constructor.
      if (native_thread->osthread() != NULL) {
        // Note: the current thread is not being used within "prepare".
        native_thread->prepare(jthread);
      }
    }
  }
```

这里面至关重要的一句代码就是：

```cpp
native_thread = new JavaThread(&thread_entry, sz);
```

这里由生成了一个Java线程，里面的第一个参数是一个函数，我们继续找下这个函数：

```cpp
static void thread_entry(JavaThread* thread, TRAPS) {
  HandleMark hm(THREAD);
  Handle obj(THREAD, thread->threadObj());
  JavaValue result(T_VOID);
  JavaCalls::call_virtual(&result,
                          obj,
                          KlassHandle(THREAD, SystemDictionary::Thread_klass()),
                          vmSymbols::run_method_name(),
                          vmSymbols::void_method_signature(),
                          THREAD);
}
```

JavaCalls::call_virtual表示调用了call_virtual这个方法

这里面最重要的代码就是这行：

```cpp
vmSymbols::run_method_name()
```

表示调用了一个方法，我们继续查vmSymbols到底调用了什么，这个方法是在这个文件里面的:

```cpp
#include "classfile/vmSymbols.hpp"
```

我们可以在这里查到`vmSymbols.cpp`的源码：<a href="https://hg.openjdk.java.net/jdk8u/jdk8u/hotspot/file/76a9c9cf14f1/src/share/vm/classfile/vmSymbols.hpp">vmSymbols.cpp源码</a>

我们可以在318查到：

![image-20220311194255458](https://gitee.com/fengxian_duck/resources/raw/master/202203111942665.png)

其实`vmSymbols::run_method_name()`就是调用了`run`方法

>这样我们就可以得出结论：`start0()调用的是当前线程类的run方法`
>
>例如在上面的栗子中：
>
>- MyThread类没有传任务类进去，调用的就是`MyThread类`的run方法
>
>- Thread类里传入一个任务类，然后`start0()`调用的是Thread类的run方法，然后就会执行这一行代码：
>
>  ```java
>  @Override
>  public void run() {
>      if (target != null) {
>          target.run();
>      }
>  ```
>
>  所以最终调用的是任务类的run方法！





​	

































