# MapReduce学习

## 1. MapReduce概念

>MapReduce是什么？

我们来看官方文档的解释（我们下载的hadoop中有离线文档：hadoop-2.10.1/share/doc）

![image-20220618103506559](https://cdn.fengxianhub.top/resources-master/202206181035872.png)

**Hadoop MapReduce 是一个易于编写应用程序的软件框架，它以可靠、容错的方式并行处理商业硬件的大型集群(数千个节点)上的大量数据(数 TB 数据集)。**

这里我们可以提炼一下MapReduce的作用：

***一是软件框架，二是并行处理，三是可靠且容错，四是大规模集群，五是海量数据集。***

>这里不得提一下Hadoop成名之战了，2008年，Hadoop赢得1TB排序基准评估第一名，排序1TB数据（大约100亿行数据）耗时209秒
>
>这是非常惊人的数据处理能力！参考文献：<a href="https://www.ucloud.cn/yun/3726.html">hadoop的1TB排序</a>

从官方文档我们可以知道，`MapReduce`是一个分布式的计算框架，它易于编写应用程序。那么如何理解呢？

我们在Java的`Fork/Join`框架学习中其实就能明显感受到这种分而治之的思想。

笔者之前根据`Fork/Join`写过一篇实践的文章：<a href="https://blog.csdn.net/fengxiandada/article/details/124247569?spm=1001.2014.3001.5502">Levenshtein Distance编辑距离应用实践——拼写检查(Java fork/join框架实现)</a>

**例如现在有一个很大的数据集（例如25W条单词）需要处理，单线程下运行会非常的慢，那现在我们该提升速度？**

在`Fork/Join`中运用了多线程进行处理，将大的任务拆分成小的任务（`fork`），每个线程获取到一个小的任务能够很快处理完，再将处理完后的结果统一进行汇总（`Join`），最后得到结果（其实fork/Join是借鉴了MapReduce的思想）

核心思想是将大任务拆分成小任务，再将得到的结果汇总得到最终的结果（fork拆分/Join汇总）

![image-20220417223831103](https://cdn.fengxianhub.top/resources-master/202204172238412.png)

>我们在使用`Fork/Join`的过程中其实也面临着一些问题，就是任务如何拆分，最后结果如何汇总，每次都需要我们编写大量的逻辑代码进行`Fork/Join`，其实是非常麻烦的，并且`Fork/Join`的运算是单机多线程，单机提供的算力是有限的

![image-20220418124141130](https://cdn.fengxianhub.top/resources-master/202204181241482.png)

铺垫了这么多不知道读者有没有回忆起在学习fork/join做大数求和时的过程

`MapReduce`也是一样的思想只不过是从**单机多线程**变成了**多机多进程**

我们来看一下官网的介绍：

![image-20220618140552434](https://cdn.fengxianhub.top/resources-master/202206181405553.png)

我们将这些信息提炼一下，MapReduce可以分成Map和Reduce两部分理解：

1. Map：映射过程，**把一组数据按照某种Map函数映射成新的数据**。我们将这句话拆分提炼出重要信息，也就是说，map主要是：映射、变换、过滤的过程。一条数据进入map会被处理成多条数据，也就是1进N出。

2. Reduce：**归纳过程，把若干组映射结果进行汇总并输出**。我们同样将重要信息提炼，得到reduce主要是：分解、缩小、归纳的过程。一组数据进入reduce会被归纳为一组数据（或者多组数据），也就是一组进N出。

>可能还是很抽象，我们接着往下分析，分析几个MapReduce的实例（光看不练假把戏，做几个栗子就理解了）

在写代码之前我们需要先了解一些`MapReduce`对输入输出数据的格式的要求，先看官方文档：

![image-20220618155713043](https://cdn.fengxianhub.top/resources-master/202206181557174.png)

我们得出关键的信息：

- 输入输出均为`键值对`的格式

- MapReduce中实现了一套新的基本数据类型，为了能够序列化和排序（org.apache.hadoop.io下）

  | jdk类型       | MapReduce类型  |
  | ------------- | -------------- |
  | String        | Text           |
  | int/Integer   | IntWritable    |
  | double/Double | DoubleWritable |

  其他类型差不多都是和基本数据类型相对应，可以在idea中查看到：

  ![image-20220618160350780](https://cdn.fengxianhub.top/resources-master/202206181603838.png)

- MapReduce的过程中**会自动对`key`进行去重和排序**

  **这一点非常重要**，我们在后面的例子中会看到许多泛型，初学者会弄不清输入和输出的东西是什么，要输入和输出什么，这个性质先记住，在后面的例子中都会有体现

>在写代码之前我们要知道Hadoop的部署有三种方式：
>
>- 本地
>- 伪分布式
>- 完全分布式
>
>可能有的读者对Hadoop的搭建不了解，或者没有搭建的条件，本文旨在理解`MapReduce`的思想和编码过程，所以在前面的几个栗子中都是在本地运行，不用打成jar包到集群中运行，后面的栗子中会进行集群运行。尽量后面再介绍集群，减少读者的理解成本

在本地运行我们只需要下载一个Hadoop并在Hadoop的bin目录下配置**[winutils](https://gitee.com/nkuhyx/winutils)**文件即可（Windows环境下），非常简单

这里也解释一下为什么采用Java写的Hadoop还有环境问题，这是因为Windows和Linux对用户权限的管理不同，需要通过一些文件来进行转换

- <a href="https://hadoop.apache.org/releases.html">Hadoop下载地址</a>
- <a href="https://gitee.com/lingd600_admin/hadoop-winutils?_from=gitee_search">gitee镜像winutils文件下载地址</a>

下载好后将winutils文件添加到Hadoop的bin目录下，并设置HADOOP_HOME的环境变量即可（网上教程很多），这里不再赘述

再引入Hadoop的Maven依赖即可

```java
<dependency>
    <groupId>org.springframework.data</groupId>
    <artifactId>spring-data-hadoop</artifactId>
    <version>2.5.0.RELEASE</version>
</dependency>
```

接下来开始第一个栗子，也是被称为大数据版`Hello world`的`Word Count`，单词计数

## 2. 单词计数

这个栗子是官方文档中的，是学习大数据中`Hello World`一样的存在

例如现在我们有以下的数据，我现在要统计每个单词出现的次数

```java
hadoop hive python hive hive
hadoop hive python java jvm hive es
hadoop hive python jsp spark tomcat
hadoop hive python hbash
hadoop hive python
```

>MapReduce需要编写Map和Reduce的逻辑，这里先编写Map的逻辑

在Map的过程中我们需要先继承一个类`org.apache.hadoop.mapreduce.Mapper<KEYIN, VALUEIN, KEYOUT, VALUEOUT>`

它有四个泛型：

- **KEYIN**：LongWritable，对应的Mapper的输入key。输入key是每行的行首偏移量
- **VALUEIN**：Text，对应的Mapper的输入Value。输入value是每行的内容
- **KEYOUT**：对应的Mapper的输出key，根据业务来定义
- **VALUEOUT**：对应的Mapper的输出value，根据业务来定义

我们在之前看官方文档的时候总结过，在Hadoop的Map的过程中，输入输出都是 **键值对的形式**

```java
//                                                 输入的类型                       输出的类型
//                                                 <字节偏移量,         一行文本>     <单词,      数字>
public static class WordCountMapper extends Mapper<LongWritable,       Text,       Text, IntWritable> {
    private final static IntWritable one = new IntWritable(1);
    private final Text word = new Text();
    /**
     * @param key     字节偏移量
     * @param value   一行文本 为什么是Text类型，要能序列化和排序
     * @param context hadoop的容器，可以取出运行时的环境变量
     */
    public void map(LongWritable key, Text value, Context context) throws IOException, InterruptedException {
        System.out.println("key:" + key + ",value:" + value);
        /* 根据空格进行切分，将得到的每一个单词写出去，用单词作为key，value赋值为1表示出现了一次 */
        StringTokenizer itr = new StringTokenizer(value.toString());
        while (itr.hasMoreTokens()) {
            word.set(itr.nextToken());
            context.write(word, one);
        }
    }
}
```

读取一行数据就会调用一次此方法，同时会把输入key和输入value进行传递 ，在实际开发中，最重要的是拿到输入**value(每行内容)**，然后将结果写出

这里我们要特别注意：Map完成输出到Reduce前会做对key做 ***去重和自然排序***

这里牵涉到两个词：***combiner*** 和 ***Shuffle*** 

由于MapReduce计算是分散到不同结点上的（本着不移动数据移动计算过程的原则），如果Map处理完后的数据中有大量重复key的数据存在，这是很不利与网络传输的，所以在将结果进行网络传输前会现在Map的结点上进行一次  ***combiner***，也就是将重复key的键值对合并，并产生一个新的键值对，**并将原来的value添加到一个集合中作为value**

![image-20220618213829568](https://cdn.fengxianhub.top/resources-master/202206182138746.png)

当然其实combiner其实可以发生在两个地方，详情可以看笔者的原理篇的3.6小节

了解了***combiner*** 的作用我们就能够理解后面的reduce的编码

同样，reduce我们也需要继承一个类：`org.apache.hadoop.mapreduce.Reducer`

他同样也有四个泛型，分别对应输入的<key,value>和输出的<key,value>，和上面map过程中一样

现在我们来编写 reduce的代码

```java
/**
 * 因为 combiner 和 reducer 都是对相同的键的数据进行规约，所以用一个类实现就可以了
 */
public static class IntSumReducer extends Reducer<Text, IntWritable, Text, IntWritable> {
    private final IntWritable result = new IntWritable();
    /**
     * 做规约时返回的格式为 <word,{1,1,1}>
     *
     * @param key     单词
     * @param values  返回的结果，为列表结构，存放每一个结点计算的结果
     * @param context 上下文环境
     */
    public void reduce(Text key, Iterable<IntWritable> values,Context context) throws IOException, InterruptedException {
        System.out.println("reduce任务:  它的键 :" + key + ", 它的值:" + values.toString());
        int sum = 0;
        for (IntWritable val : values) {
            sum += val.get();
        }
        result.set(sum);
        context.write(key, result);
    }
}
```

逻辑很简单，就是将map后传入的数据根据key对其value进行累加，这样就能够得到每个单词出现的次数，再将其写出

最后我们来写调用map/reduce函数的主方法：

```java
public static void main(String[] args) throws Exception {
    /* 设置配置文件 */
    Configuration conf = new Configuration();
    /* 创建任务 */
    Job job = Job.getInstance(conf, "word count");
    /* Job -> n个task -> container -> taskset */
    job.setJarByClass(WordCount.class);
    /* mapper操作 */
    job.setMapperClass(WordCountMapper.class);
    /* combiner操作，合并一个结点中的数据,这里没有单独写combiner的逻辑 */
    job.setCombinerClass(IntSumReducer.class);
    /* reduce操作，合并不同结点中的数据 */
    job.setReducerClass(IntSumReducer.class);
    /* 设置输入、输出目录，输出目录不能存在 */
    job.setOutputKeyClass(Text.class);
    job.setOutputValueClass(IntWritable.class);
    /* 设置输入、输出目录，输出目录不能存在 */
    /* 设置输入输出的目录,本地运行设置在本地就好 */
    Path inputpath = new Path("E:\\workspacesJ2SE_idea\\bigData\\MapReduceDemo\\input\\wc.txt");
    Path outpath = new Path("E:\\workspacesJ2SE_idea\\bigData\\MapReduceDemo\\output");
    /* 设置需要计算的文件 */
    FileInputFormat.addInputPath(job, inputpath);
    /* 删除输出目录,这里是我自己写的一个工具类 */
    MpUtil.delOutPut(conf, outpath);
    /* 设置输出目录 */
    FileOutputFormat.setOutputPath(job, outpath);
    /* 0表示正常退出，1表示错误退出 */
    System.exit(job.waitForCompletion(true) ? 0 : 1);
}
```

```java
public class MpUtil {
    public static void delOutPut(Configuration config, Path... outPaths) throws IOException {
        FileSystem fs = FileSystem.get(config);
        // 如果文件存在就将其删除
        for (Path p : outPaths) {
            if (fs.exists(p)) {
                fs.delete(p, true);
            }
        }
    }
}
```

完整代码为：

```java
package com.fx.pro1_wordCout;

import java.io.IOException;
import java.util.StringTokenizer;

import com.fx.utils.MpUtil;
import org.apache.hadoop.conf.Configuration;
import org.apache.hadoop.fs.Path;
import org.apache.hadoop.io.IntWritable;
import org.apache.hadoop.io.LongWritable;
import org.apache.hadoop.io.Text;
import org.apache.hadoop.mapreduce.Job;
import org.apache.hadoop.mapreduce.Mapper;
import org.apache.hadoop.mapreduce.Reducer;
import org.apache.hadoop.mapreduce.lib.input.FileInputFormat;
import org.apache.hadoop.mapreduce.lib.output.FileOutputFormat;
import org.apache.hadoop.util.GenericOptionsParser;

/**
 * @since: 2022/6/17 11:10
 * @author: 
 */
public class WordCount {
    //                                                 输入的类型                       输出的类型
    //                                                 字节偏移量            一行文本     单词         数字
    public static class WordCountMapper extends Mapper<LongWritable,       Text,       Text, IntWritable> {

        private final static IntWritable one = new IntWritable(1);
        private final Text word = new Text();

        /**
         * @param key     字节偏移量
         * @param value   一行文本 为什么是Text类型，要能序列化和排序
         * @param context hadoop的容器，可以取出运行时的环境变量
         */
        public void map(LongWritable key, Text value, Context context) throws IOException, InterruptedException {
            System.out.println("key:" + key + ",value:" + value);
            /* 根据空格进行切分，将得到的每一个单词写出去，用单词作为key，value赋值为1表示出现了一次 */
            StringTokenizer itr = new StringTokenizer(value.toString());
            while (itr.hasMoreTokens()) {
                word.set(itr.nextToken());
                context.write(word, one);
            }
        }
    }

    /**
     * 因为 combiner 和 reducer 都是对相同的键的数据进行规约，所以用一个类实现就可以了
     */
    public static class IntSumReducer extends Reducer<Text, IntWritable, Text, IntWritable> {
        private final IntWritable result = new IntWritable();
        /**
         * 做规约时返回的格式为 <word,{1,2,1}>
         *
         * @param key     单词
         * @param values  返回的结果，为列表结构，存放每一个结点计算的结果
         * @param context 上下文环境
         */
        public void reduce(Text key, Iterable<IntWritable> values,Context context) throws IOException, InterruptedException {
            System.out.println("reduce任务:  它的键 :" + key + ", 它的值:" + values.toString());
            int sum = 0;
            for (IntWritable val : values) {
                sum += val.get();
            }
            result.set(sum);
            context.write(key, result);
        }
    }

    public static void main(String[] args) throws Exception {
        Configuration conf = new Configuration();
        String[] otherArgs = new GenericOptionsParser(conf, args).getRemainingArgs();
        /* yarn-site.xml 中的配置 */
        Job job = Job.getInstance(conf, "word count");
        /* Job -> n个task -> container -> taskset */
        job.setJarByClass(WordCount.class);
        /* mapper操作 */
        job.setMapperClass(WordCountMapper.class);
        /* combiner操作，合并一个结点中的数据 */
        job.setCombinerClass(IntSumReducer.class);
        /* reduce操作，合并不同结点中的数据 */
        job.setReducerClass(IntSumReducer.class);
        /* 设置输出的类型 */
        job.setOutputKeyClass(Text.class);
        job.setOutputValueClass(IntWritable.class);
        /* 设置输入、输出目录，输出目录不能存在 */
        /* 设置输入输出的目录 */
        Path inputpath = new Path("E:\\workspacesJ2SE_idea\\bigData\\MapReduceDemo\\input\\wc.txt");
        Path outpath = new Path("E:\\workspacesJ2SE_idea\\bigData\\MapReduceDemo\\output");
        /* 设置需要计算的文件 */
        FileInputFormat.addInputPath(job, inputpath);
        /* 删除多余的目录 */
        MpUtil.delOutPut(conf, outpath);
        /* 设置输出目录 */
        FileOutputFormat.setOutputPath(job, outpath);
        /* 0表示正常退出，1表示错误退出 */
        System.exit(job.waitForCompletion(true) ? 0 : 1);
    }
}

```

>然后直接运行即可！不用配置配置文件，不用搭集群，就这一个类就能运行！（前提是设置了hadoopHome并添加了**winutils**）

![1](https://cdn.fengxianhub.top/resources-master/202206182156515.gif)



接下来的例子来演示一下在`MapReduce`过程中进行`shuffle /sort`的过程

## 3. 排序数字

我们现在要对以下的数据进行排序：

```java
12
23
3
1
3
43
23
1
4
5
6
```

有了上面的例子，接下来写代码应该会更加容易理解一些

按照MapReduce编程三部曲，我们先写Map的逻辑：

这里非常简单，因为我们利用了MapReduce中在Reduce前会将结点的 ***key*** 进行 ***shuffle /sort*** 的特点，这里我们直接将读取到的值转成`IntWritable`的形式输出就可以，value我们用空填充即可

```java
/**
 * 因为需要排序，所以输出格式为<IntWritable,value>，值我们不关心
 */
public static class SortMapper extends Mapper<LongWritable, Text, IntWritable, Text> {
    public void map(LongWritable key, Text value, Context context) throws IOException, InterruptedException {
        //将输入的文本text转为数字，IntWritable
        int number = Integer.parseInt(value.toString());
        IntWritable iw = new IntWritable(number);
        /* 这里我们不关心value是什么，所以给了空 */
        context.write(iw, new Text());
        System.out.println("====== map ========>  key:" + number);
    }
}
```

对于重复的数据我们会将其value收集成一个集合，并作为reduce输入的value进行输入，我们reduce的逻辑为：

```java
/**
 * 输出
 */
public static class sortReducer extends Reducer<IntWritable, Text, IntWritable, Text> {
    private int num = 1;
    public void reduce(IntWritable key, Iterable<Text> values, Context context) throws IOException, InterruptedException {
        System.out.println("=================>  key:" + key);
        Iterator<Text> iterator = values.iterator();
        while (iterator.hasNext()) {
            /* 这里不要忘记清空迭代器里面的元素，不然会死循环 */
            iterator.next();
            /* 这里我们并不关心输出的key是多少，输出行号即可 */
            context.write(new IntWritable(num++), new Text(key.toString()));
        }
    }
}
```

再编写主方法：

```java
public static void main(String[] args) throws IOException, ClassNotFoundException, InterruptedException {
    Configuration conf = new Configuration();
    /* yarn-site.xml 中的配置 */
    Job job = Job.getInstance(conf, "sort");
    /* mapper操作 */
    job.setMapperClass(SortMapper.class);
    /* 这里很有意思，不能再进行一次Combiner了，在文章里会分析 */
    // job.setCombinerClass(sortReducer.class);
    /* reduce操作，合并不同结点中的数据 */
    job.setReducerClass(sortReducer.class);
    /* 设置输出的类型 */
    job.setOutputKeyClass(IntWritable.class);
    job.setOutputValueClass(Text.class);
    /* 设置输入、输出目录，输出目录不能存在 */
    Path inputpath = new Path("E:\\workspacesJ2SE_idea\\bigData\\MapReduceDemo\\input\\b.txt");
    Path outpath = new Path("E:\\workspacesJ2SE_idea\\bigData\\MapReduceDemo\\output\\");
    FileInputFormat.addInputPath(job, inputpath);
    /* 删除多余的目录 */
    MpUtil.delOutPut(conf, outpath);
    FileOutputFormat.setOutputPath(job, outpath);
    /* 0表示正常退出，1表示错误退出 */
    System.exit(job.waitForCompletion(true) ? 0 : 1);
}
```

这里有一个设置比较有意思，就是上面代码中的第8行，如果加了这一行排序就会出错，读者可以想一想为什么？其实这是因为我们没有单独写 ***Combiner*** 的逻辑，在上一个栗子中直接让其执行了一次 ***Reducer*** 的逻辑，因为在 reducer前会对数据进行去重。但是这里不能执行两次，因为我们设置输入输出的 k、v 会影响结果

执行看结果：

```java
1	1
2	1
3	3
4	3
5	4
6	5
7	6
8	12
9	23
10	23
11	43
```

可以看到排序的很好，这里我们就是利用了MapReduce中 ***shuffle /sort*** 的特点

>其实经过了前两个栗子，我们会发现，MapReduce的使用比ForkJoin简单的多，在ForkJoin中我们需要自己去分割任务，处理子任务，再合并计算总和，在MapReduce中框架都帮你做好了，我们不用去关注 Map和Reduce 的过程，只需要编写自己的业务逻辑

可能有读者觉得还不过瘾，那我们再做一个求平均成绩的栗子，在这个栗子中需要结合 ***Combiner*** 和  ***shuffle /sort***

## 4. 🎯求平均成绩

现在我们有一个数据集，记录了几位同学的几次成绩，现在要求按他们的平均成绩并 ***升序*** 输出

```java
张三	98
李四	94
王五	89
张三	86
李四	92
王五	86
张三	82
李四	90
```

你会说这么简单，直接写代码：

```java
package com.fx.pro4_scoreSort;

import com.fx.utils.MpUtil;
import lombok.extern.slf4j.Slf4j;
import org.apache.hadoop.conf.Configuration;
import org.apache.hadoop.fs.Path;
import org.apache.hadoop.io.DoubleWritable;
import org.apache.hadoop.io.IntWritable;
import org.apache.hadoop.io.LongWritable;
import org.apache.hadoop.io.Text;
import org.apache.hadoop.mapreduce.Job;
import org.apache.hadoop.mapreduce.Mapper;
import org.apache.hadoop.mapreduce.Reducer;
import org.apache.hadoop.mapreduce.lib.input.FileInputFormat;
import org.apache.hadoop.mapreduce.lib.output.FileOutputFormat;
import java.io.IOException;
import java.util.StringTokenizer;

@Slf4j(topic = "app")
public class scoreSort {
    public static class scoreSortMapper extends Mapper<LongWritable, Text, Text, DoubleWritable> {
        private final Text k2 = new Text();
        private final DoubleWritable v2 = new DoubleWritable();
        @Override
        protected void map(LongWritable key, Text value, Context context) throws IOException, InterruptedException {
            // 通过空格进行分割
            StringTokenizer tokenizer = new StringTokenizer(value.toString());
            // 迭代拿出成绩
            while (tokenizer.hasMoreTokens()) {
                k2.set(tokenizer.nextToken());
                v2.set(Double.parseDouble(tokenizer.nextToken()));
                context.write(k2, v2);
            }
        }
    }

    /**
     * 拿到的格式为<name,[v1,v2...]>
     */
    public static class scoreSortReduce extends Reducer<Text, DoubleWritable, Text, DoubleWritable> {
        @Override
        protected void reduce(Text key, Iterable<DoubleWritable> values, Context context) throws IOException, InterruptedException {
            double sum = 0;
            int count = 0;
            /* 这里有几个名字出现就对key累加几次 */
            for (DoubleWritable val : values) {
                sum += val.get();
                count++;
            }
            context.write(key, new DoubleWritable(sum / count));
        }
    }


    public static void main(String[] args) throws IOException, ClassNotFoundException, InterruptedException {
        /* 配置文件 */
        Configuration config = new Configuration();
        Job job = Job.getInstance(config, "App");
        /* mapper操作 */
        job.setMapperClass(scoreSortMapper.class);
        /* 设置map后输出数据类型，如果不设置会默认输出<IntWritable,Text>类型，会报错 */
        job.setMapOutputKeyClass(Text.class);
        job.setMapOutputValueClass(DoubleWritable.class);
        /* 设置输出文件类型 */
        job.setOutputKeyClass(Text.class);
        job.setOutputValueClass(DoubleWritable.class);
        /* combiner操作 */
        job.setCombinerClass(scoreSortReduce.class);
        /* reduce操作 */
        job.setReducerClass(scoreSortReduce.class);
        /* 设置输入、输出目录，输出目录不能存在 */
        /* 设置输入输出的目录 */
        Path inputpath = new Path("E:\\workspacesJ2SE_idea\\bigData\\MapReduceDemo\\input\\d.txt");
        Path outpath = new Path("E:\\workspacesJ2SE_idea\\bigData\\MapReduceDemo\\output");
        /* 设置需要计算的文件 */
        FileInputFormat.addInputPath(job, inputpath);
        /* 删除多余的目录 */
        MpUtil.delOutPut(config, outpath);
        FileOutputFormat.setOutputPath(job, outpath);
        /* 0表示正常退出，1表示错误退出 */
        System.exit(job.waitForCompletion(true) ? 0 : 1);
    }
}

```

输出：

```java
张三	88.66666666666667
李四	92.0
王五	87.5
```

我们会发现这样的结果并不是我们想要的，没有按照升序排列，我们仔细思考一下，***Combiner*** 和  ***shuffle /sort*** 到底是在上面时候发生的，其实是在reduce之前就做完了，所以我们没有办法在 Map 后对value进行排序

那我们能不能再做一次 MapReduce呢？答案是可以的，我们可以将输出的结果再进行一次MapReduce，但是我们并不用写两个主方法，我们可以写在同一个主方法里

map1:

```java
public class scoreSortMapper extends Mapper<LongWritable, Text, Text, DoubleWritable> {
    private final Text k2 = new Text();
    private final DoubleWritable v2 = new DoubleWritable();

    @Override
    protected void map(LongWritable key, Text value, Context context) throws IOException, InterruptedException {
        // 通过空格进行分割
        StringTokenizer tokenizer = new StringTokenizer(value.toString());
        log.error("tokenizer:{}", tokenizer);
        // 迭代拿出成绩 [zhsansan,5]
        while (tokenizer.hasMoreTokens()) {
            k2.set(tokenizer.nextToken());
            v2.set(Double.parseDouble(tokenizer.nextToken()));
            context.write(k2, v2);
        }
    }
}
```

reduce1：

```java
public class scoreSortReduce extends Reducer<Text, DoubleWritable, Text, DoubleWritable> {

    @Override
    protected void reduce(Text key, Iterable<DoubleWritable> values, Context context) throws IOException, InterruptedException {
        double sum = 0;
        int count = 0;
        /* 这里有几个名字出现就对key累加几次 */
        for (DoubleWritable val : values) {
            sum += val.get();
            count++;
        }
        context.write(key, new DoubleWritable(sum / count));
    }
}
```

map2：

```java
public class scoreSortMapper2 extends Mapper<LongWritable, Text, DoubleWritable, Text> {
    @Override
    protected void map(LongWritable key, Text value, Context context) throws IOException, InterruptedException {
        String[] strs = value.toString().trim().split("\t");
        double score = Double.parseDouble(strs[1]);
        context.write(new DoubleWritable(score), new Text(strs[0]));
    }
}
```

reduce2：

```java
public class scoreSortReduce2 extends Reducer<DoubleWritable, Text, Text, DoubleWritable> {

    @Override
    protected void reduce(DoubleWritable key, Iterable<Text> values, Context context) throws IOException, InterruptedException {
        // 取出学生的姓名
        Text name = values.iterator().next();
        // 已经排好序了，直接输出即可
        context.write(name, key);
    }
}
```

主方法：

```java
public class scoreSort {
    public static void main(String[] args) throws IOException, ClassNotFoundException, InterruptedException {
        /* 设置输入、输出目录，输出目录不能存在 */
        /* 设置输入输出的目录 */
        Path inputpath = new Path("E:\\workspacesJ2SE_idea\\bigData\\MapReduceDemo\\input\\d.txt");
        Path outpath = new Path("E:\\workspacesJ2SE_idea\\bigData\\MapReduceDemo\\output");
        /* 设置输出目录二 */
        Path outpath2 = new Path("E:\\workspacesJ2SE_idea\\bigData\\MapReduceDemo\\output2");
        /* 配置文件 */
        Configuration config = new Configuration();
        /* 删除多余的目录 */
        MpUtil.delOutPut(config, outpath,outpath2);

        /* 设置job1 */
        Job job1 = Job.getInstance(config, "App");
        /* mapper操作 */
        job1.setMapperClass(scoreSortMapper.class);
        /* 设置map后输出数据类型，如果不设置会默认输出<IntWritable,Text>类型，会报错 */
        job1.setMapOutputKeyClass(Text.class);
        job1.setMapOutputValueClass(DoubleWritable.class);
        /* 设置输出文件类型 */
        job1.setOutputKeyClass(Text.class);
        job1.setOutputValueClass(DoubleWritable.class);
        /* reduce操作 */
        job1.setReducerClass(scoreSortReduce.class);
        /* 设置需要计算的文件 */
        FileInputFormat.addInputPath(job1, inputpath);
        /* 设置输出目录 */
        FileOutputFormat.setOutputPath(job1, outpath);
        // 执行job1任务
        job1.waitForCompletion(true);

        // 这里设置job2，用以将value进行排序
        Job job2 = Job.getInstance(config, "任务二");
        job2.setMapperClass(scoreSortMapper2.class);
        job2.setMapOutputKeyClass(DoubleWritable.class);
        /* 设置map后输出数据类型，如果不设置会默认输出<IntWritable,Text>类型，会报错 */
        job2.setMapOutputKeyClass(DoubleWritable.class);
        job2.setMapOutputValueClass(Text.class);
        job2.setOutputValueClass(Text.class);
        job2.setReducerClass(scoreSortReduce2.class);
        job2.setOutputKeyClass(Text.class);
        job2.setOutputValueClass(DoubleWritable.class);
        // 通过MutipleInputs多输入的方式添加多个map的处理类，这里设置输入目录是前一个job的输出
        FileInputFormat.addInputPath(job2,outpath);
        FileOutputFormat.setOutputPath(job2,outpath2);
        /* 0表示正常退出，1表示错误退出 */
        System.exit(job2.waitForCompletion(true) ? 0 : 1);
    }
}
```

我们在输出目录二中可以得到我们想要的结果：

```java
王五	87.5
张三	88.66666666666667
李四	92.0
```

可能你看到这里会想，如果我想降序排列怎么办呢？

其实很简单，我们可以重写排序`WritableComparable()`接口的即可，由于DoubleWritable默认就是升序，我们可以写一个类去继承它在重写里面的`compareTo()`方法，再在对应的地方改成自己的实现类即可

```java
public class MyNumber extends DoubleWritable {

    public MyNumber() {
    }

    public MyNumber(double value) {
        super(value);
    }

    @Override
    public int compareTo(DoubleWritable o) {
        return (int) (o.get() - this.get());
    }
}
```

输出结果：

```java
李四	92.0
张三	88.66666666666667
王五	87.5
```

>这时我们就会发现，虽然这样可以完成我们的需求，但是总感觉哪里不对劲，为什么前一个job输出后直接输出到文件里面去了，后一个需要从文件里面读呢？这样不是多产生了两次磁盘IO吗？这也是MapReduce的一个缺点，这也是为什么现在MapReduce被Spark、flink取代的原因，但是要指出的是，MapReduce论文发表是在2008年，由于时代的局限性，当初只能这样设计，但是不可否认的是MapReduce任然具有划时代的作用，它就像黑夜中的一盏明灯一样指引着后面的各种大数据框架

## 5. 天气统计

接下来我们来一个更加复杂的案例，统计每个年月下，温度最高的前两天

需求分析:  
1. 按年月分组 
2. 再按温度排序取前两个

```css
2020-01-02 10:22:22	1c
2020-01-03 10:22:22	2c
2020-01-04 10:22:22	4c
2020-02-01 10:22:22	7c
2020-02-02 10:22:22	9c
2020-02-03 10:22:22	11c
2020-02-04 10:22:22	1c
2019-01-02 10:22:22	1c
2019-01-03 10:22:22	2c
2019-01-04 10:22:22	4c
2019-02-01 10:22:22	7c
2019-02-02 10:22:22	9c
2018-02-03 10:22:22	11c
2018-02-04 10:22:22	1c
```

这里牵涉到一些MapReduce的其他特性了，那就是分区和分组

这里我们先梳理一下需求，首先我们需要按照年月分组，在MapReduce里排序默认是按照自然排序的，且只能对key进行排序，所以第一步我们需要包装一个实体类做key，并重写` WritableComparable()`接口（因为必须要可以序列化），并重写`compareTo`方法，自定义比较规则

```java
@Data //lombok注解，自动生成set get toString方法
public class Weather implements WritableComparable<Weather> {
    private int year;
    private int month;
    private int day;
    private int degree;

    @Override
    public void readFields(DataInput in) throws IOException {
        this.year = in.readInt();
        this.month = in.readInt();
        this.day = in.readInt();
        this.degree = in.readInt();
    }

    @Override
    public void write(DataOutput out) throws IOException {
        out.writeInt(year);
        out.writeInt(month);
        out.writeInt(day);
        out.writeInt(degree);

    }

    @Override
    public int compareTo(Weather o) {
        int t1 = Integer.compare(this.year, o.getYear());
        if (t1 == 0) {
            int t2 = Integer.compare(this.month, o.getMonth());
            if (t2 == 0) {
                return -Integer.compare(this.degree, o.getDegree());
            }
            return t2;
        }
        return t1;
    }

    @Override
    public String toString() {
        return year +
                "/" + month +
                "/" + day +
                "  " + degree;
    }
}
```

接下来我们需要知道一些分区（Partitioner）的概念了，这里面牵涉的东西比较多，可以看笔者的这一篇文章，在3.3节有详细的介绍

这里我们只需要知道，我们设置分区之后可以通过某些运算，将相同key的数据分到一个输出目录即可

```java
/**
 * <p>
 * 完成分区：按键中的年份字段的hash值来计算分区
 * 需要得到每个分区单独一个reduce，显然，默认的hash partition达不到这一点，所以需要重写partition类，让每个年份一个分区
 * </p>
 *
 * @since: 2022/6/21 15:58
 * @author: 梁峰源
 */
public class WeatherPartition extends Partitioner<Weather, IntWritable> {
    /**
     * @param weather {@link Weather}对象
     * @param intWritable 值 温度
     * @param numPartitions 由numPartitions框架传给你，但是由程序job.setNumReduceTasks(3) 参数决定
     */
    @Override
    public int getPartition(Weather weather, IntWritable intWritable, int numPartitions) {
        /*
         * 写一个算法来计算hash
         * 注意：1. 这个hash算法满足业务需求
         *      2. 每一对键值都会调用这个方法，所以这个里面的算法要简洁
         */
        return (weather.getYear() - 1949) % numPartitions;
    }
}

```

而分组是将同一分区的数据再进行区分，上面是按照年份进行分区，我们还需要根据月份进行分组：

```java
/**
 * <p>
 * 分组：group是分组，是在partition里面再分组，相同的key分到一个组中去
 * 在分组中，只需要比较年月，而不需要比较温度，所以在compare()中没有温度比较代码
 * <p>
 * reduce之前，默认是将key相同的值分为一个组，而我们的key是 "只需要比较年月"，显然不满足我们想要的结果，所以需要重写分组函数
 *
 * @since: 2022/6/21 16:39
 * @author: 梁峰源
 */
public class WeatherGroup extends WritableComparator {
    public WeatherGroup(){
        super(Weather.class,true);
    }
    @Override
    public int compare(WritableComparable a, WritableComparable b) {
        Weather w1 = (Weather) a;
        Weather w2 = (Weather) b;
        int c1 = Integer.compare(w1.getYear(), w2.getYear());
        if(c1 == 0){
            return Integer.compare(w1.getMonth(), w2.getMonth());
        }
        return c1;
    }
}
```

mapper类：

```java
/**
 * <p>
 * 读取数据，切分成 year month day degree并存放到weather对象中，再用context完成输出
 * </p>
 *
 * @since: 2022/6/21 16:24
 * @author: 梁峰源
 */
public class WeatherMapper extends Mapper<LongWritable, Text, Weather, IntWritable> {
    @Override
    protected void map(LongWritable key, Text value, Context context) throws IOException, InterruptedException {
        /* 1. 将value按 '\t' 切分 */
        String[] strs = value.toString().trim().split("\t");
        SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");
        Calendar cal = Calendar.getInstance();
        try {
            Date d = sdf.parse(strs[0]);
            /* 将Date转为Calendar */
            cal.setTime(d);
            Weather w = new Weather();
            w.setYear(cal.get(Calendar.YEAR));
            w.setMonth(cal.get(Calendar.MONTH) + 1);
            w.setDay(cal.get(Calendar.DAY_OF_MONTH));
            int degree = Integer.parseInt(strs[1].replace("c", ""));
            w.setDegree(degree);
            context.write(w,new IntWritable(degree));
        } catch (Exception e) {
        	e.printStackTrace();
        }
    }
}
```

reduce:

```java
/**
 * <p>
 * 规约：将传入的数据每个年月从选择器中取两条输出
 * </p>
 *
 * @since: 2022/6/21 16:45
 * @author: 梁峰源
 */
public class WeatherReducer extends Reducer<Weather, IntWritable, Weather, IntWritable> {
    @Override
    protected void reduce(Weather weather, Iterable<IntWritable> values, Context context) throws IOException, InterruptedException {
        int count = 0;
        for(IntWritable value : values){
            count++;
            if(count > 3){
                break;
            }
            context.write(weather,value);
        }
    }
}
```

主方法：

```java
public class WeatherApp {
    public static void main(String[] args) throws IOException, ClassNotFoundException, InterruptedException {
        /* 配置文件 */
        Configuration config = new Configuration();
        /* 任务 */
        Job job = Job.getInstance(config, "天气");
        /* mapper操作 */
        job.setMapperClass(WeatherMapper.class);
        /* 设置map后输出的数据类型 */
        job.setMapOutputKeyClass(Weather.class);
        job.setMapOutputValueClass(IntWritable.class);
        /* 设置文件输出类型 */
        job.setOutputKeyClass(Weather.class);
        job.setOutputValueClass(IntWritable.class);
        /* 设置reduce任务数，由于一共有三种年份，所以会分三个区，这里必须设置三个task */
        job.setNumReduceTasks(3);
        /* 设置分区规则 */
        job.setPartitionerClass(WeatherPartition.class);
        /* 设置分组规则 */
        job.setGroupingComparatorClass(WeatherGroup.class);
        /* reduce操作 */
        job.setReducerClass(WeatherReducer.class);
        /* 设置输入、输出目录，输出目录不能存在 */
        /* 设置输入输出的目录 */
        Path inputpath = new Path("E:\\workspacesJ2SE_idea\\bigData\\MapReduceDemo\\input\\db.txt");
        Path outpath = new Path("E:\\workspacesJ2SE_idea\\bigData\\MapReduceDemo\\output");
        /* 设置需要计算的文件 */
        FileInputFormat.addInputPath(job, inputpath);
        /* 删除多余的目录 */
        MpUtil.delOutPut(config, outpath);
        FileOutputFormat.setOutputPath(job, outpath);
        /* 0表示正常退出，1表示错误退出 */
        System.exit(job.waitForCompletion(true) ? 0 : 1);
    }
}

```





























