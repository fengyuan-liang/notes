# MapReduce编程

详细过程和步骤请看<a href="https://blog.csdn.net/zhao2chen3/article/details/109952995?ops_request_misc=%257B%2522request%255Fid%2522%253A%2522165216390216781667859646%2522%252C%2522scm%2522%253A%252220140713.130102334..%2522%257D&request_id=165216390216781667859646&biz_id=0&utm_medium=distribute.pc_search_result.none-task-blog-2~all~top_click~default-1-109952995-null-null.142^v9^control,157^v4^control&utm_term=MapReduce%E7%BC%96%E7%A8%8B&spm=1018.2226.3001.4187">MapReduce入门+编程wordcount实例</a>

## 一、实验目的：

1、通过实验掌握基本的MapReduce编程方法，完成词频统计。

2、掌握用MapReduce解决一些常见的数据问题等。

3、通过操作MapReduce的实验，模仿实验内容，深入理解MapReduce的过程，熟悉MapReduce程序的编程

## 二、实验内容：

1、词频统计任务要求

2、 MapReduce程序编写方法

3、编译打包程序

4、运行程序

## 三、词频统计

### 3.1 准备工作

在Linux系统本地创建两个文件，即文件`wordfile1.txt`和`wordfile2.txt`

- wordfile1.txt内容为

  ```css
  I love Spark
  I love Hadoop
  ```

- wordfile2.txt内容为

  ```css
  Hadoop is good
  Spark is fast
  ```

![image-20220510144151873](https://cdn.fengxianhub.top/resources-master/202205101441976.png)

### 3.2 编写代码

>现在需要设计一个词频统计程序，统计input文件夹下所有文件中每个单词的出现次数

如果对MapReduce不熟悉请看<a href="https://blog.csdn.net/bolg_hero/article/details/11485793?ops_request_misc=%257B%2522request%255Fid%2522%253A%2522165216390216781667859646%2522%252C%2522scm%2522%253A%252220140713.130102334..%2522%257D&request_id=165216390216781667859646&biz_id=0&utm_medium=distribute.pc_search_result.none-task-blog-2~all~sobaiduend~default-3-11485793-null-null.142^v9^control,157^v4^control&utm_term=MapReduce%E7%BC%96%E7%A8%8B&spm=1018.2226.3001.4187">MapReduce编程(入门篇)</a>

这个程序我们分为三个部分

```java
import org.apache.hadoop.conf.Configuration;
import org.apache.hadoop.fs.Path;
import org.apache.hadoop.io.IntWritable;
import org.apache.hadoop.io.Text;
import org.apache.hadoop.mapreduce.Job;
import org.apache.hadoop.mapreduce.Mapper;
import org.apache.hadoop.mapreduce.Reducer;
import org.apache.hadoop.mapreduce.lib.input.FileInputFormat;
import org.apache.hadoop.mapreduce.lib.output.FileOutputFormat;
import org.apache.hadoop.util.GenericOptionsParser;

import java.io.IOException;
import java.util.Iterator;
import java.util.StringTokenizer;

/**
 * @Description: 统计单词
 * @date: 2022/5/10 14:26
 * @author: 梁峰源
 */
public class WordCount {
    public static void main(String[] args) throws Exception {
        Configuration conf = new Configuration();
        String[] otherArgs = (new GenericOptionsParser(conf, args)).getRemainingArgs();
        if (otherArgs.length < 2) {
            System.err.println("Usage: wordcount <in> [<in>...] <out>");
            System.exit(2);
        }
        Job job = Job.getInstance(conf, "word count");     //设置环境参数
        job.setJarByClass(WordCount.class);                //设置整个程序的类名
        job.setMapperClass(TokenizerMapper.class);         //添加Mapper类
        job.setReducerClass(IntSumReducer.class);          //添加Reducer类
        job.setOutputKeyClass(Text.class);                 //设置输出类型
        job.setOutputValueClass(IntWritable.class);        //设置输出类型
        for (int i = 0; i < otherArgs.length - 1; ++i) {
            FileInputFormat.addInputPath(job, new Path(otherArgs[i]));  //设置输入文件
        }
        FileOutputFormat.setOutputPath(job, new Path(otherArgs[otherArgs.length - 1]));//设置输出文件
    }

    static class IntSumReducer extends Reducer<Text, IntWritable, Text, IntWritable> {
        private final IntWritable result = new IntWritable();

        public IntSumReducer() {
        }

        public void reduce(Text key, Iterable<IntWritable> values, Reducer<Text, IntWritable, Text, IntWritable>.Context context) throws IOException, InterruptedException {
            int sum = 0;
            IntWritable val;
            for (Iterator i$ = values.iterator(); i$.hasNext(); sum += val.get()) {
                val = (IntWritable) i$.next();
            }
            this.result.set(sum);
            context.write(key, this.result);
        }
    }

    static class TokenizerMapper extends Mapper<Object, Text, Text, IntWritable> {
        private static final IntWritable one = new IntWritable(1);
        private final Text word = new Text();

        public TokenizerMapper() {
        }

        public void map(Object key, Text value, Mapper<Object, Text, Text, IntWritable>.Context context) throws IOException, InterruptedException {
            StringTokenizer itr = new StringTokenizer(value.toString());
            while (itr.hasMoreTokens()) {
                this.word.set(itr.nextToken());
                context.write(this.word, one);
            }
        }
    }
}

```

我们知道在Linux执行Java程序要麻烦一些，因为没有IDE为我们自动导包，我们需要手动进行导包

在linux环境下使用命令行执行java程序时，如果要使用到大量外部的jar包或class文件，一般我们有两种方式进行导包

```css
-classpath，命令格式：# java -classpath ，使用";"分隔

-cp ，这个命令一看就是-classpath的缩写，当然用途是一样的。

-Djava.ext.dirs，命令格式：# java -Djava.ext.dirs=  //多个路径用可以使用冒号分隔(windows下使用分号)分割
```

详细区别请看：https://blog.csdn.net/weixin_34441120/article/details/114517185

我们需要先在自己的本机上找到执行Java脚本所需的jar包

```java
hadoop-2.10.1/share/hadoop/common
hadoop-2.10.1/share/hadoop/common/bin
/root/fengyuan-liang/hadoop-2.10.1/share/hadoop/mapreduce
```

先建立WordCount.java文件

![image-20220510145035650](https://cdn.fengxianhub.top/resources-master/202205101450765.png)



保存退出

这里需要加载四个路径下的jar，用extCLassLoader加载器进行加载

```css
/root/fengyuan-liang/hadoop-2.10.1/share/hadoop/common
/root/fengyuan-liang/hadoop-2.10.1/share/hadoop/mapreduce
/root/fengyuan-liang/hadoop-2.10.1/share/hadoop/common/lib
/usr/lib/jvm/jre-1.8.0-openjdk/lib  //自己jdk的lib路径
```

你要找到自己的jar路径然后像我下面一下拼接起来

使用编译命令

```css
javac -Djava.ext.dirs=/root/fengyuan-liang/hadoop-2.10.1/share/hadoop/common:/root/fengyuan-liang/hadoop-2.10.1/share/hadoop/mapreduce:/root/fengyuan-liang/hadoop-2.10.1/share/hadoop/common/lib:/usr/lib/jvm/jre-1.8.0-openjdk/lib   WordCount.java
```

![image-20220510145112157](https://cdn.fengxianhub.top/resources-master/202205101451208.png)

编译之后，在文件夹下可以发现有3个“.class”文件，这是Java的可执行文件。此时，我们需要将它们打包并命名为WordCount.jar，命令如下

```css
jar -cvf WordCount.jar *.class
```

![image-20220510152147367](https://cdn.fengxianhub.top/resources-master/202205101521532.png)









