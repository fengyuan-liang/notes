# CompletableFuture

>在jdk中提供了一个用于编排异步任务的强大工具，那就是`CompletableFuture`，通过CompletableFuture我们可以轻松对各种复杂的异步任务进行编排

首先我们可以看到`CompletableFuture`有**12**个静态方法，接下来的文章也会围绕这12个静态方法展开

![image-20240303221756482](https://cdn.fengxianhub.top/resources-master/image-20240303221756482.png)

## 1. 最简单的用法

我们在进行异步处理任务的时候常常会使用到两种类型的任务

- Runnable：处理没有返回值的任务，返回的是`Future<?>`
- Callable\<T>：处理有返回值的任务，返回的是`Future<T>`

`CompletableFuture`也实现了`Future`接口，所以也拥有Future的特性，比如调用`get`方法会阻塞，直到返回，所以可以用其当作Future来使用

![image-20240304000116125](https://cdn.fengxianhub.top/resources-master/image-20240304000116125.png)

```java
public static void main(String[] args) throws ExecutionException, InterruptedException {
    ExecutorService executorService = Executors.newFixedThreadPool(2);
    // 线程1阻塞等待future的结果
    CompletableFuture<String> cf = new CompletableFuture<>();
    Instant start = Instant.now();
    executorService.submit(() -> {
        try {
            String result = cf.get(); // 调用者会阻塞，等待结果返回
            System.out.printf("线程1等待结果，耗时：%s秒, 结果为：%s", Duration.between(start, Instant.now()).getSeconds(), result);
        } catch (InterruptedException | ExecutionException e) {
            throw new RuntimeException(e);
        }
    });
    // 线程2完成结果
    executorService.submit(() -> {
        // 等待五秒
        try {
            TimeUnit.SECONDS.sleep(5);
        } catch (InterruptedException e) {
            throw new RuntimeException(e);
        }
        cf.complete("线程2完成了任务");
    });

// 输出：线程1等待结果，耗时：5秒, 结果为：线程2完成了任务
```

## 2. 提交任务runAsync与supplyAsync

我们可以通过`CompletableFuture`轻松启动一个异步任务（底层默认基于ForkJoinPool，后面会详细分析），可以传入`Runnable`或者`Callable<T>`任务

```java
public static void main(String[] args) throws ExecutionException, InterruptedException {
    CompletableFuture<Void> runAsyncFuture = CompletableFuture.runAsync(() -> {
        try {
            System.out.println("test task is running");
            TimeUnit.SECONDS.sleep(1);
        } catch (InterruptedException e) {
            throw new RuntimeException(e);
        }
    });
    // Runnable 任务没有返回值，只会阻塞等待完成
    runAsyncFuture.get();
    CompletableFuture<String> supplyAsyncFuture = CompletableFuture.supplyAsync(() -> {
        try {
            TimeUnit.SECONDS.sleep(1);
        } catch (InterruptedException e) {
            throw new RuntimeException(e);
        }
        return "test callable task";
    });
    // 阻塞获取返回值
    String result = supplyAsyncFuture.get();
    System.out.println(result);
}

// 输出：
// test task is running
// test callable task
```

## 3. 链式调用

>关于CompletableFuture的链式调用我们主要要掌握
>
>- 掌握异步任务回调
>  - thenApply / thenAccept/ thenRun三类方法使用和区别
>  - 解锁一系列`Async`版本回调（thenXXXAsync）
>- 掌握异步任务编排
>  - 能对2个异步任务的依赖关系、并行关系进行编排
>  - 会对n个任务的合并进行编排

对于`Future`，在提交完任务之后，只能通过`get`方法获取结果，这样可玩性其实不多，多个Future之间不好产生关联，那么可以控制一个Future完成后马上调用下一个吗？我们可以借助`CompletableFuture`提供的强大的链式调用能力来完成

![image-20240303234112688](https://cdn.fengxianhub.top/resources-master/image-20240303234112688.png)

## 4. 异步任务的异常处理

在异步任务进行编排并执行的过程中，有可能会抛出异常，这个时候我们就需要

- 对异步任务进行异常处理
- 在回调链路上对单个异步任务的异常进行现场恢复