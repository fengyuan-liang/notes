# 多线程学习四，控制线程的运行

思维导图：

![image-20220127233738916](https://cdn.fengxianhub.top/resources-master/202201272337088.png)

## 1. synchronized与sleep关系

思维导图：

![image-20220127233853202](https://cdn.fengxianhub.top/resources-master/202201272338404.png)

<hr>

🚩注意：<code>synchronized</code>遇到<code>sleep</code>不会释放锁，只有等到<code>sleep</code>执行完后再释放锁，举个栗子：

```java
public class _11_sleep_wait_lock {
    public synchronized void sleepMethod(){
        System.out.println(printDate()+Thread.currentThread().getName()+"休眠一秒");
        try {
        	Thread.sleep(1000);//sleep函数不会释放锁
        } catch (InterruptedException e) {
        	e.printStackTrace();
        }
        System.out.println(printDate()+Thread.currentThread().getName()+"休眠结束");
    }

    public static void main(String[] args) {
        _11_sleep_wait_lock test = new _11_sleep_wait_lock();
        for (int i = 0; i < 5; i++) {
            new Thread(test::sleepMethod).start();
        }
    }

    //打印当前时间
    private static String printDate() {
        return new SimpleDateFormat("yyyy-MM-dd HH:mm:ss").format(System.currentTimeMillis())+"\t";
    }
}
输出结果：
    2022-01-27 16:40:34	Thread-0休眠一秒
    2022-01-27 16:40:35	Thread-0休眠结束
    2022-01-27 16:40:35	Thread-4休眠一秒
    2022-01-27 16:40:36	Thread-4休眠结束
    2022-01-27 16:40:36	Thread-3休眠一秒
    2022-01-27 16:40:37	Thread-3休眠结束
    2022-01-27 16:40:37	Thread-2休眠一秒
    2022-01-27 16:40:38	Thread-2休眠结束
    2022-01-27 16:40:38	Thread-1休眠一秒
    2022-01-27 16:40:39	Thread-1休眠结束
```

可以看到这样执行会让<code>多线程执行</code>变成<code>单线程执行</code>，这样效率不高，所以推荐使用<code>wait()</code>方法

## 2. synchronized与wait关系

🚩<code>synchronized</code>遇到<code>wait()</code>会释放锁，一旦调用<code>wait()</code>方法，<code>synchronized</code>锁就释放掉了，举个栗子：

```java
public class _11_sleep_wait_lock {
    // wait()方法会释放锁，一旦调用wait()方法，synchronized锁就释放掉了
    public void waitMethod() {
        System.out.println(printDate() + Thread.currentThread().getName() + "休眠一秒");
        synchronized (this) {//局部对象锁，减少细粒度
            try {
                wait(1000);
            } catch (InterruptedException e) {
                e.printStackTrace();
            }
        }
        System.out.println(printDate() + Thread.currentThread().getName() + "休眠结束");
    }

    public static void main(String[] args) {
        _11_sleep_wait_lock test = new _11_sleep_wait_lock();
        for (int i = 0; i < 5; i++) {
            new Thread(test::waitMethod).start();
        }
    }


    //打印当前时间
    private static String printDate() {
        return new SimpleDateFormat("yyyy-MM-dd HH:mm:ss").format(System.currentTimeMillis()) + "\t";
    }
}
打印结果：
    2022-01-27 17:05:23	Thread-4等待一秒
    2022-01-27 17:05:23	Thread-1等待一秒
    2022-01-27 17:05:23	Thread-2等待一秒
    2022-01-27 17:05:23	Thread-0等待一秒
    2022-01-27 17:05:23	Thread-3等待一秒
    2022-01-27 17:05:24	Thread-1等待结束
    2022-01-27 17:05:24	Thread-0等待结束
    2022-01-27 17:05:24	Thread-3等待结束
    2022-01-27 17:05:24	Thread-2等待结束
    2022-01-27 17:05:24	Thread-4等待结束
```

## 3. yield()

<code>yield</code>是屈服的意思，yield使当前线程让出<code>cpu</code>的使用权，但不保证其他线程一定可以获得<code>cpu</code>执行权，当一个线程调用<code>yield</code>方法的时候，他就有运行态转变成了就绪态，等有<code>cpu资源</code>并接受系统调度后才继续转换成运行态

>值得注意的是：线程调用<code>yield</code>后，只会向<code>优先级高</code>或者<code>相同</code>的线程屈服

测试一下：

```java
public class _12_yield {
    public static void main(String[] args) {
        YieldOne y1 = new YieldOne();
        YieldOne y2 = new YieldOne();

        Thread t1 = new Thread(y1, "a");
        Thread t2 = new Thread(y2, "a");

        //设置优先级
        t1.setPriority(1);
        t1.start();

        t2.setPriority(10);//第二个线程的优先级更高
        t2.start();
    }
}

class YieldOne implements Runnable{
    @Override
    public void run() {
        if("a".equals(Thread.currentThread().getName())){
            Thread.yield();//yield只会将执行权交给优先级高的线程
        }
        for (int i = 0; i < 10; i++) {
            System.out.println(Thread.currentThread().getName()+": "+i);
        }
    }
}
打印结果：
    a: 0
    b: 0
    b: 1
    b: 2
    b: 3
    b: 4
    b: 5
    b: 6
    b: 7
    b: 8
    b: 9
    a: 1
```

## 4. join()

<code>join()</code>使一个线程在另一个线程结束后执行，在一个线程(比如main)中调用另一个线程的join()，则当前线程(main)阻塞，让另一个线程先执行后，当前才执行， 与<code>优先级无关</code>

**yield与join的区别**

- yield只会让位给相同或更高优先级的线程, join与优先级无关
- yield是静态方法, join是实例方法

栗子：

```java
public class _13_Join {
    public static void main(String[] args) throws InterruptedException {
        JoinOne joinOne = new JoinOne();
        System.out.println(joinOne.isAlive());
        joinOne.start();
        System.out.println(joinOne.isAlive());
        joinOne.join();
        System.out.println("主线程其他操作...");
        System.out.println(joinOne.isAlive());
    }
}

class JoinOne extends Thread{
    @Override
    public void run() {
        for (int i = 0; i < 10; i++) {
            System.out.println(Thread.currentThread().getName()+": "+i);
            try {
                Thread.sleep(1000);
            } catch (InterruptedException e) {
                e.printStackTrace();
            }
        }
    }
}
打印结果：
    false
    true
    Thread-0: 0
    Thread-0: 1
    Thread-0: 2
    Thread-0: 3
    Thread-0: 4
    Thread-0: 5
    Thread-0: 6
    Thread-0: 7
    Thread-0: 8
    Thread-0: 9
    主线程其他操作...
    false
```

## 5. ThreadGroup 线程组

可以批量管理线程或线程组对象，多个线程组也可以归一个线程组管理

结构：

- 一级关联：只有父子线程的线程组
- 多级关联：有父、子、孙等等的线程组，一般不使用，会导致管理混乱

线程组统一管理栗子：

```java
public class _14_ThreadGroup {
    public static void main(String[] args) {
        TestThread task1 = new TestThread();
        TestThread task2 = new TestThread();
        ThreadGroup threadGroup = new ThreadGroup("新建线程组一");
        Thread t0 = new Thread(threadGroup, task1);
        Thread t1 = new Thread(threadGroup, task2);
        t0.start();
        t1.start();
        System.out.println("活动的线程数为："+threadGroup.activeCount());
        System.out.println("线程组的名称为："+threadGroup.getName());
        //线程组中断，则这个组中所有的线程全部中断
        threadGroup.interrupt();
    }
}

class TestThread implements Runnable{
    @Override
    public void run() {
        try {
        	while(!Thread.currentThread().isInterrupted()){
        	    System.out.println("线程名："+Thread.currentThread().getName());
        	    Thread.sleep(10000);
            }
        } catch (InterruptedException e) {
        	e.printStackTrace();
        }
    }
}
打印结果：
    活动的线程数为：2
    线程名：Thread-1
    线程名：Thread-0
    线程组的名称为：新建线程组一
    java.lang.InterruptedException: sleep interrupted
        at java.lang.Thread.sleep(Native Method)
        at com.fx.multiThread.TestThread.run(_14_ThreadGroup.java:31)
        at java.lang.Thread.run(Thread.java:748)
    java.lang.InterruptedException: sleep interrupted
        at java.lang.Thread.sleep(Native Method)
        at com.fx.multiThread.TestThread.run(_14_ThreadGroup.java:31)
        at java.lang.Thread.run(Thread.java:748)
```



## 6. 问题引入与synchronized和wait使用

问题引入：

```java
public class _15_synchronized {
    public static void main(String[] args) {
        SellTickOp sto = new SellTickOp(5);
        Thread counter1 = new Thread(sto, "张三");
        Thread counter2 = new Thread(sto, "李四");
        Thread counter3 = new Thread(sto, "王五");
        counter1.start();
        counter2.start();
        counter3.start();
    }
}

//synchronized 同步
//卖票的任务
class SellTickOp implements Runnable{
    int tickets;//总票数
    Random random= new Random();
    public SellTickOp(int tickets){
        this.tickets = tickets;
    }
    @Override
    public void run() {
        while (true){
            if(tickets > 0){
                try {
                    Thread.sleep(random.nextInt(800));
                } catch (Exception e) {
                    e.printStackTrace();
                }
                System.out.println(Thread.currentThread().getName()+"在sell第"+(tickets--)+"张票");
            }else {
                return;
            }
        }
    }
}
打印结果：
    张三在sell第5张票
    李四在sell第4张票
    王五在sell第3张票
    张三在sell第2张票
    李四在sell第1张票
    张三在sell第0张票
    王五在sell第-1张票
```

显然这里出现了问题，问题的原因是由于代码块没有加锁，可能会导致所有的线程都在<code>i合法</code>的时候进到if语句中，再执行<code>i--</code>并打印的操作。怎么解决？<code>加锁</code>并且和<code>wait()</code>搭配使用，<code>synchronized</code>遇到<code>wait()</code>会释放锁，一旦调用<code>wait()</code>方法，<code>synchronized</code>锁就释放掉了

```java
@Override
public void run() {
    while (true){
        synchronized (this) {
            if(tickets > 0){
                System.out.println(Thread.currentThread().getName()+"在sell第"+(tickets--)+"张票");
                try {
                    wait(random.nextInt(800));
                } catch (Exception e) {
                    e.printStackTrace();
                }
            }else {
                return;
            }
        }
    }
}
```

























