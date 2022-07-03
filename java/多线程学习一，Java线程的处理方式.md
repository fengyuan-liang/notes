# 多线程学习一，Java线程的处理方式

>Java天生就支持<code>多线程</code>，多线程也是Java里面的核心知识

思维导图：

![image-20220121105323377](https://cdn.fengxianhub.top/resources-master/202201211053456.png)



## 1. 继承Thread方法,实现Runnable接口

```java
public class _1_Runnable {
    public static void main(String[] args) {
        Thread thread = new myThread();
        thread.start();
    }
}
class myThread extends Thread{
    @Override
    public void run() {
        System.out.println("myThread线程启动");
    }
}
```

也可以写成匿名内部类的形式：

```java
public static void main(String[] args) {
        Thread thread = new Thread(new Runnable() {
            @Override
            public void run() {
                System.out.println("线程启动");
            }
        });

        thread.start();
    }
```

匿名内部类+lambda形式：

```java
public static void main(String[] args) {
    Thread thread = new Thread(() -> System.out.println("线程启动"));
    thread.start();
}
```





## 2. 创建FutureTask任务，实现Callable或Runnable接口

>前面的方式线程执行没有<code>返回值</code>,不能得到线程运行后的结果，可以采用创建FutureTask来获得返回值

FutureTask任务实现Callable接口的call()方法：

```java
public static void main(String[] args) {
    //FutureTask对象
    //方式一：实现Callable接口有返回值
    //建立一个任务task
    FutureTask<Integer> task=new FutureTask<>(new Callable<Integer>() {
        @Override
        public Integer call() throws Exception {
            int count=0;
            for (int i = 0; i < 100; i++) {
                count+=i;
            }
            Thread.sleep(3000);
            System.out.println("task执行完了");
            return count;
        }
    });
    //创建线程并绑定一个FutureTask任务
    new Thread(task2).start();
    System.out.println("主线程在执行1");
    /*
         * 获取task里面的值可以通过task.get()方法
         * 此方法有两个构造方法get()和get(long timeout, TimeUnit unit)
         */
    try {
        System.out.println(task.get(10,TimeUnit.SECONDS));
        System.out.println("主线程在执行");
    } catch (InterruptedException | ExecutionException | TimeoutException e) {
        e.printStackTrace();
    }
}
```

FutureTask任务实现Runnable接口的run()方法：

```java
public static void main(String[] args) {
    //FutureTask对象
    //方式二：实现Runnable接口
    class Result {
        private long result;
    }
    Result r = new Result();
    FutureTask<Result> task2=new FutureTask<>(new Runnable() {
        @Override
        public void run() {
            int count=0;
            for (int i = 0; i < 100; i++) {
                count+=i;
            }
            r.result =count;
            System.out.println("task执行完了");
        }
    }, r);

    //创建线程并绑定一个FutureTask任务
    new Thread(task2).start();
    System.out.println("主线程在执行1");
    /*
         * 获取task里面的值可以通过task.get()方法
         * 此方法有两个构造方法get()和get(long timeout, TimeUnit unit)
         */
    try {
        System.out.println(task2.get(10,TimeUnit.SECONDS).result);
        System.out.println("主线程在执行");
    } catch (InterruptedException | ExecutionException | TimeoutException e) {
        e.printStackTrace();
    }
}
```

通过源码分析可知，其实FutureTask 实现 Runnable接口底层还是调用了Callable接口，这体现了适配器设计模式，通过转换接口进行适配

![image-20220121104507280](https://cdn.fengxianhub.top/resources-master/202201211045456.png)





## 3. 创建线程池

>无节制的创建线程会造成资源的浪费，所以一般使用线程池创建线程



```java
package com.fx.multiThread;

import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * 线程池
 */
public class _4_ThreadPool {
    public static void main(String[] args) {
        //核心线程池的大小
        int corePoolSize = 1;
        //核心线程池的最大线程数
        int maxPoolSize=4;
        //线程最大空闲时间
        long keepAliveTime=10;
        //时间单位
        TimeUnit unit=TimeUnit.SECONDS;
        //阻塞队列 容量为2 最多允许放入两个空闲任务
        BlockingQueue<Runnable> workQueue=new ArrayBlockingQueue<>(2);
        //线程创建工厂
        ThreadFactory threadFactory = new NameThreadFactory();
        //线程池拒绝策略
        RejectedExecutionHandler handler = new NameThreadFactory.MyIgnorePolicy();
        //线程池执行者
        ThreadPoolExecutor executor=null;
        try {
        	//不允许无节制的创建线程，必须使用线程池
            executor = new ThreadPoolExecutor(corePoolSize,maxPoolSize,keepAliveTime,unit,workQueue,threadFactory,handler);
            //预启动所有核心线程，提升效率
            executor.prestartAllCoreThreads();
            //任务数量
            int count=10;
            for (int i = 0; i < count; i++) {
                RunnableTask task = new RunnableTask(String.valueOf(i));
                executor.submit(task);//提交任务到线程池 还有4个任务无法执行
            }
        } catch (Exception e) {
        	e.printStackTrace();
        }finally {
            assert executor != null;//断言：可开关  -ea开  -da关
            executor.shutdown();
        }
    }

    /**
     * 线程工厂
     */
    static class NameThreadFactory implements ThreadFactory{
        //线程id， AtomicInteger 原子类
        private final AtomicInteger threadId=new AtomicInteger(1);
        @Override
        public Thread newThread(Runnable r) {
            Thread t = new Thread(r, "线程-" + threadId.getAndIncrement());//相当于i++
            System.out.println(t.getName()+"已经被创建了");
            return t;
        }
        //线程池BlockingQueue满后的拒绝策略
        public static class MyIgnorePolicy implements RejectedExecutionHandler{
            @Override
            public void rejectedExecution(Runnable r, ThreadPoolExecutor e) {
                System.err.println("线程池+"+ e.toString()+r.toString()+"被拒绝");
            }
        }
    }

    /**
     * 任务类
     */
    static class RunnableTask implements Runnable{
        private String name;
        public RunnableTask(String name){
            this.name=name;
        }
        @Override
        public void run() {
            System.out.println(this.toString()+"is running!");
            try {
                Thread.sleep(2000);
            } catch (InterruptedException e) {
                e.printStackTrace();
            }
        }
        public String toString(){
            return "RunnableTask [name="+name+"]";
        }
    }
}

```

























