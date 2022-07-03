# Levenshtein Distance编辑距离应用实践——拼写检查(Java fork/join框架实现)

Levenshtein Distance，一般称为编辑距离（Edit Distance，`Levenshtein Distance只是编辑距离的其中一种`）或者**莱文斯坦距离**，算法概念是俄罗斯科学家弗拉基米尔·莱文斯坦（Levenshtein · Vladimir I）在1965年提出。

**编辑距离**是针对二个[字符串](https://baike.baidu.com/item/字符串)（例如英文字）的差异程度的量化量测，量测方式是看至少需要多少次的处理才能将一个字符串变成另一个字符串。编辑距离可以用在[自然语言处理](https://baike.baidu.com/item/自然语言处理)中，例如[拼写检查](https://baike.baidu.com/item/拼写检查)可以根据一个拼错的字和其他正确的字的编辑距离，判断哪一个（或哪几个）是比较可能的字。[DNA](https://baike.baidu.com/item/DNA)也可以视为用A、C、G和T组成的字符串，因此编辑距离也用在生物信息学中，判断二个DNA的类似程度。[Unix](https://baike.baidu.com/item/Unix)下的[diff](https://baike.baidu.com/item/diff)及[patch](https://baike.baidu.com/item/patch)即是利用编辑距离来进行文本编辑对比的例子。

`Levenshtein Distance`算法的概念很简单：Levenshtein Distance指**「两个字串之间，由一个转换成另一个所需的最少编辑操作次数」**，允许的编辑操作包括：

- 将其中一个字符替换成另一个字符（Substitutions）。
- 插入一个字符（Insertions）
- 删除一个字符（Deletions）

如果对该算法不了解的同学请看这篇博客：<a href="https://blog.csdn.net/tianjindong0804/article/details/115803158">一文详解编辑距离（Levenshtein Distance）</a>

本文主要探究如何用Java并发框架`fork/Join`实现快速的单词拼写检查，拼写检查的效果我们在很多场景下都能看到，例如用输入法进行汉语拼音输入时，如果拼音的顺序有问题，那么输入法就好给你匹配一个最可能的输入规则；`idea`中也可以进行拼写检查，例如：

![test](https://cdn.fengxianhub.top/resources-master/202204162018585.gif)

>我们知道如果想要进行`拼写检测`，就需要用莱文斯坦距离(下文简称LD)对已有的`单词数据集`进行计算，算出LD最小且大于0的值
>
>如果单词数据集的数量比较大，计算起来就会很浪费时间
>
>所以这里我们采用Java中的`fork/Join`框架进行拼写检查，尽可能的调用机器所有核心CPU的资源，节省匹配时间

这里我采用的数据集数据数量为`25W`条，数据格式为每行一个，数据集可以在<a href="https://gitee.com/fengxian_duck/bigdata-resources/tree/master/data">我的git仓库</a>里面拉取到，在data文件夹下面的`UK Advanced Cryptics Dictionary.txt`

长下面👇这个样子：

![image-20220416124005786](https://cdn.fengxianhub.top/resources-master/202204161240850.png)

## 1. 实现莱文斯坦距离算法

### 1.1 算法原理分析

首先我们需要实现LD算法，计算出给定两个单词之间的`莱文斯坦距离`，实现后才能根据数据集中的数据进行挖掘

这里直接给出结论：

我们如果要比较`son`和`sun`单词的列文斯坦距离，我们需要先初始化一个二维数组，将字符串变成字符，例如下面这样：

|      |      | `s`  | `o`  | `n`  |
| ---- | ---- | ---- | ---- | ---- |
|      | `0`  | `1`  | `2`  | `3`  |
| `s`  | `1`  | k1   |      |      |
| `u`  | `2`  |      |      |      |
| `n`  | `3`  |      |      |      |

接下来我们需要计算列表中空出来的地方，我们的计算原则为（以`k1`位置为例）

- 如果`k1`对应正上方和左方的字符**相等**：将`k1`左边、上方的数字`加1`，左上方的数字`加0`，然后取三个数字中的最小值
- 如果`k1`对应正上方和左方的字符**不相等**：将`k1`左边、上方的数字`加1`，左上方的数字`加1`，然后取三个数字中的最小值

最后面得出的结果为：

|      |      | `s`  | `o`  | `n`  |
| ---- | ---- | ---- | ---- | ---- |
|      | `0`  | `1`  | `2`  | `3`  |
| `s`  | `1`  | 0    | 1    | 2    |
| `u`  | `2`  | 1    | 1    | 2    |
| `n`  | `3`  | 2    | 2    | 1    |

最后我们得到数组中的最后一个元素就是我们要求的`莱文斯坦距离算法`，即`son`和`sun`只需要进行一次修改就可以相互转换

### 1.2 代码实现

原理清楚了之后，接下来我们用Java代码实现一下

我们写一个加载器，将我们存放在`txt`文件中的数据读到一个集合中，这里我采用的`nio`非堵塞式的方式

```java
/**
 * @author: Eureka
 * @date: 2022/4/15 21:24
 * @Description: 用于将单词列表加载到字符串对列表中，UKACD数据集在文件中是按照每行一个单词的形式存放的
 * 这样实现load()静态方法WordsLoader类接收到单词列表文件的路径，就会返回一个250,353个单词的字符串对象列表
 */
public class WordsLoader {
    public static List<String> load(String path) {
        Path file = Paths.get(path);
        List<String> data = new ArrayList<>();
        try {
            try(InputStream in = Files.newInputStream(file);
                BufferedReader bufferedReader = new BufferedReader(new InputStreamReader(in))){
                String line;
                while((line = bufferedReader.readLine()) != null){
                    data.add(line);
                }
            }
        } catch (IOException ioException) {
            ioException.printStackTrace();
        }
        return data;
    }
}
```

接下来就是将`莱文斯坦距离算法`实现一下：

这里有两种思路，分别是自顶向下的`递归`求解和自底向上的`动态规划`求解，由于递归会产生大量的重复计算，所以这里我们采用动态规划进行计算

```java
/**
 * @author: Eureka
 * @date: 2022/4/15 20:45
 * @Description: 莱文斯坦距离算法实现
 */
public class LevenshteinDistance {
    /**
     * 传入待计算莱文斯坦距离的两个字符串
     *
     * @param str1 字符串1
     * @param str2 字符串2
     * @return 返回两个字符串的莱文斯坦距离
     */
    public static int editDistance(String str1, String str2) {
        //创建一个二维数组，因为二维表需要多存一位，所以这里需要多申请一个空间
        int[][] distances = new int[str1.length() + 1][str2.length() + 1];
        //初始化列
        for (int i = 1; i <= str1.length(); i++) {
            distances[i][0] = i;
        }
        //初始化行
        for (int i = 0; i <= str2.length(); i++) {
            distances[0][i] = i;
        }
        //可以按行遍历也可以按列遍历，这里按列遍历
        for (int i = 1; i <= str1.length(); i++) {
            for (int j = 1; j <= str2.length(); j++) {
                //第一次循环 从str1中取出第0个字符和str2中的每个字符比较
                if (str1.charAt(i - 1) == str2.charAt(j - 1)) {
                    //这里可以取左上角的值，因为一定是最小的
                    distances[i][j] = minimum(distances[i][j - 1] + 1, distances[i - 1][j - 1], distances[i - 1][j] + 1);
                } else {
                    //全部加一取最小值等价于取最小值再加一
                    distances[i][j] = minimum(distances[i][j - 1], distances[i - 1][j], distances[i - 1][j - 1]) + 1;
                }
            }
        }
        //将得到的二维数组打印出来
        show(distances,str2,str1);
        //返回莱文斯坦距离
        return distances[str1.length()][str2.length()];
    }

    /**
     * 返回三个数字中的最小值，依次输入数字的顺序为：左、左上、上
     */
    private static int minimum(int i, int j, int k) {
        return Math.min(i, Math.min(j, k));
    }

    /**
     * 将二维数组打印出来
     */
    private static void show(int[][] distances,String str2,String str1) {
        //输出第一个字符串
        char[] c2 = str2.toCharArray();
        System.out.print("*\t*\t");
        for(char c : c2){
            System.out.print(c+"\t");
        }
        System.out.print("\t\n*");
        char[] c1 = str1.toCharArray();
        int cnt = 0;
        boolean flag = false;
        for (int[] d : distances) {
            if(flag){
                System.out.print(c1[cnt++]+"\t");
            }else {
                flag = true;
                System.out.print("\t");
            }
            for (int i : d) {
                System.out.print(i + "\t");
            }
            System.out.println();
        }
    }
}

```

测试一下：

```java
@Test
public static void test() {
    System.out.println("莱文斯坦距离:"+LevenshteinDistance.editDistance("sun", "son"));
}
```

输出结果：

```java
*	*	s	o	n		
*	0	1	2	3	
s	1	0	1	2	
u	2	1	1	2	
n	3	2	2	1	
莱文斯坦距离:1
```

## 2. 使用fork/join进行匹配

### 2.1 单线程匹配

首先我们看一下从`25w`条数据中进行匹配会花多少时间(请把show方法注释掉，不然打印太多东西了)

测试类：

```java
@Test
public void test02() {
    Instant start = Instant.now();
    //加载数据
    List<String> dictionary = WordsLoader.load("你的路径//UK Advanced Cryptics Dictionary.txt");
    System.out.println("数据加载耗时：" + Duration.between(start, Instant.now()).toMillis() + "ms" + "\n共加载数据条数：" + dictionary.size() + "条");
    //匹配
    String matchStr = "zythum";
    int bestDistance = Integer.MAX_VALUE;
    int bestDistanceIndex = 0;
    for (int i = 0; i < dictionary.size(); i++) {
        int editDistance = LevenshteinDistance.editDistance(matchStr, dictionary.get(i));
        if (editDistance <= bestDistance) {
            bestDistance = editDistance;
            bestDistanceIndex = i;
        }
    }
    System.out.println("匹配到的词为：" + dictionary.get(bestDistanceIndex) + "\n总共耗时：" + Duration.between(start, Instant.now()).toMillis() + "ms");
}
```

测试结果：

```css
数据加载耗时：88ms
共加载数据条数：250353条
匹配到的词为：zythum
总共耗时：306ms
```

可以看到我匹配数据集的最后一条数据耗时306ms，接下来让我们看看`fork/join`的表现情况

### 2.2 fork/join多线程匹配

结合`fork/join`框架拆分合并的规约思想，我们的思路如下：

其中`BestMatchingData`用来包装每个任务返回的结果

![image-20220417223831103](https://cdn.fengxianhub.top/resources-master/202204172238412.png)

我们用代码实现一下：

首先我们定义一个类用来存放查找到的单词，因为`莱文斯坦距离算法`查找到相同的单词可能会有很多个

```java
/**
 * @author: Eureka
 * @date: 2022/4/16 20:29
 * @Description: 用来存放最佳匹配算法的结果
 * 存储了单词列表（因为与输入词相近的词有多个）以及这些单词与输入字符串之间的距离
 */
@Data //lombok，自动生成getter setter toString方法
public class BestMatchingData {
    private int distance;//这些单词与输入字符串之间的距离
    private List<String> words;//存储单词列表的字符串对象列表
}
```

然后让我们回忆一下`Fork/Join`的使用范式：

![image-20220418124141130](https://cdn.fengxianhub.top/resources-master/202204181241482.png)

首先我们创建自己的任务类`BestMatchingTask`：

```java
/**
 * @author: Eureka
 * @date: 2022/4/17 21:38
 * @Description: 执行那些实现Callable接口并且将在执行器中执行的任务
 * 每个任务处理一部分字典，并且返回这一部分字典获得的结果
 */
public class BestMatchingTask extends RecursiveTask<BestMatchingData> {
    private final int THRESHOLD;//分解任务的阀值
    private final int startIndex;//任务要分析的这一部分字典的起始位置(包含)
    private final int endIndex;//任务要分析的这一部分字典的结束位置(不包含)
    private final List<String> dictionary;//以字符串对象列表形式表示的字典
    private final String word;//参照输入字符串
    public BestMatchingTask(int startIndex, int endIndex, List<String> dictionary, int THRESHOLD ,String word) {
        this.startIndex = startIndex;
        this.endIndex = endIndex;
        this.dictionary = dictionary;
        this.word = word;
        this.THRESHOLD = THRESHOLD;
    }

    /**
     * call()方法处理startIndex和endIndex属性值之间的所有单词，并清空结果列表并且将新单词加入到该列表中
     * 如果找到一个与当前查找结果距离相同的单词，那么就将该单词加入到结果列表中
     */
    @Override
    public BestMatchingData compute() {
        //代操作的集合 如果小于阈值就进行计算，大于就进行拆分
        if(endIndex - startIndex < THRESHOLD){
            int minDistance = Integer.MAX_VALUE;
            List<String> list = new ArrayList<>();
            //进行计算
            for (int i = startIndex; i < endIndex; i++) {
                int distance = LevenshteinDistance.editDistance(word, dictionary.get(i));
                if(distance < minDistance){
                    //清空原来的集合
                    list.clear();
                    minDistance = distance;
                    list.add(dictionary.get(i));
                }else if(distance == minDistance){
                    list.add(dictionary.get(i));
                }
            }
            //返回计算结果
            BestMatchingData data = new BestMatchingData();
            data.setDistance(minDistance);
            data.setWords(list);
            return data;
        }else {
            //拆分
            int middle = (startIndex + endIndex) / 2;
            //构建子任务
            BestMatchingTask left = new BestMatchingTask(startIndex,middle,dictionary,THRESHOLD,word);
            BestMatchingTask right = new BestMatchingTask(middle,endIndex,dictionary,THRESHOLD,word);
            //激活子任务
            invokeAll(left,right);
            //包装结果
            BestMatchingData leftData = left.join();
            BestMatchingData rightData = right.join();
            BestMatchingData data = new BestMatchingData();
            if(leftData.getDistance() == rightData.getDistance()){
                //合并
                data.setDistance(leftData.getDistance());
                ArrayList<String> dataAll = new ArrayList<>();
                dataAll.addAll(leftData.getWords());
                dataAll.addAll(rightData.getWords());
                data.setWords(dataAll);
            }else if(leftData.getDistance() < rightData.getDistance()){
                data.setDistance(leftData.getDistance());
                data.setWords(leftData.getWords());
            }else {
                data.setDistance(rightData.getDistance());
                data.setWords(rightData.getWords());
            }
            return data;
        }
    }
}

```

启动任务类：

```java
/**
 * @author: Eureka
 * @date: 2022/4/17 21:56
 * @Description: 创建执行器和必要的任务，并且将任务发送给执行器
 */
public class BestMatchingConcurrentCalculation {
    public static BestMatchingData getBestMatchingWords(String word, List<String> dictionary) {
        //取cpu的核数，将机器的核数作为在此使用的最大线程数
        int numCores = Runtime.getRuntime().availableProcessors();
        //计算每个任务需要处理数据的数量
        //计算每个任务需要处理数据的数量
        int size = dictionary.size();
        //每个任务需要处理多少条数据
        int THRESHOLD = size / numCores;
        int startIndex = 0, endIndex = dictionary.size();
        //forkJoinPool
        ForkJoinPool forkJoinPool = new ForkJoinPool();
        //产生第一个任务
        BestMatchingTask task = new BestMatchingTask(startIndex, endIndex, dictionary, THRESHOLD, word);
        //同步调用
        forkJoinPool.invoke(task);
        //拿到并返回结果
        return task.join();
    }
}
```

测试类：

```java
@Test
public void test03(){
    Instant start = Instant.now();
    //加载数据
    List<String> dictionary = WordsLoader.load("your path//UK Advanced Cryptics Dictionary.txt");
    System.out.println("数据加载耗时：" + Duration.between(start, Instant.now()).toMillis() + "ms" + "\n共加载数据条数：" + dictionary.size() + "条");
    //匹配
    String matchStr = "zythum";
    BestMatchingData bestMatchingWords = BestMatchingConcurrentCalculation2.getBestMatchingWords(matchStr, dictionary);
    System.out.println("匹配到的词为：" + bestMatchingWords.getWords().toString() + "\n总共耗时：" + Duration.between(start, Instant.now()).toMillis() + "ms");
}
```

测试结果：

```java
数据加载耗时：130ms
共加载数据条数：250353条
匹配到的词为：[zythum]
总共耗时：304ms
```

可以看到数据量较小的情况下和单线程并没有很大差别，而且由于创建任务和cpu轮询的开销，可能会比单线程更慢一些

我们将数据集适当加大一些(就复制几次就好)

我们将数据集增大到`三百万条`再测试一下

![image-20220418130106912](https://cdn.fengxianhub.top/resources-master/202204181301055.png)

单线程版本：

```java
数据加载耗时：2460ms
共加载数据条数：3002037条
匹配到的词为：zythum
总共耗时：6318ms
```

fork/join版本：

```java
数据加载耗时：2126ms
共加载数据条数：3002037条
匹配到的词为：[zythum, zythum, zythum, zythum, zythum, zythum, zythum, zythum, zythum, zythum, zythum, zythum]
总共耗时：3167ms
```

我们将数据增加到`一千八百万条数据`再测试一下：

这里建议将JVM虚拟机参数调整一下，不然跑不动

![image-20220418131600849](https://cdn.fengxianhub.top/resources-master/202204181316052.png)

```java
-Xmx4096m
```

我们再来看一下`单线程`结果：

```java
数据加载耗时：20277ms
共加载数据条数：18011216条
匹配到的词为：zythum
总共耗时：227814ms
```

再来看一下多线程的结果：

```java
数据加载耗时：17463ms
共加载数据条数：18011216条
匹配到的词为：[zythum, zythum, zythum, zythum, zythum, zythum, zythum, zythum, zythum, zythum, zythum, zythum, zythum, zythum, zythum, zythum, zythum, zythum, zythum, zythum, zythum, zythum, zythum, zythum, zythum, zythum, zythum, zythum, zythum, zythum, zythum, zythum, zythum, zythum, zythum, zythum, zythum, zythum, zythum, zythum, zythum, zythum, zythum, zythum, zythum, zythum, zythum, zythum, zythum, zythum, zythum, zythum, zythum, zythum, zythum, zythum, zythum, zythum, zythum, zythum, zythum, zythum, zythum, zythum, zythum, zythum, zythum, zythum, zythum, zythum, zythum, zythum]
总共耗时：178446ms
```

可以很清楚的看到加载并匹配大概`两千万条`条数据，单线程耗时`227`秒，fork/Join耗时`178`秒，但这主要是因为JVM进行了优化，单线程处理大任务的时候，会调用cpu所有的核心进行计算

之后我们可以部署一个微服务来单独进行运算，单线程不行用多线程，多线程不行用集群😁

### 2.3 传统多线程版本

为了证明fork/join框架的优秀性，我这里也做了一个传统多线程版本的

```java
/**
 * @author: Eureka
 * @date: 2022/4/17 21:38
 * @Description: 执行那些实现Callable接口并且将在执行器中执行的任务
 * 每个任务处理一部分字典，并且返回这一部分字典获得的结果
 */
public class BestMatchingTask implements Callable<BestMatchingData> {
    private final int startIndex;//任务要分析的这一部分字典的起始位置(包含)
    private final int endIndex;//任务要分析的这一部分字典的结束位置(不包含)
    private final List<String> dictionary;//以字符串对象列表形式表示的字典
    private final String word;//参照输入字符串

    public BestMatchingTask(int startIndex, int endIndex, List<String> dictionary, String word) {
        this.startIndex = startIndex;
        this.endIndex = endIndex;
        this.dictionary = dictionary;
        this.word = word;
    }

    /**
     * call()方法处理startIndex和endIndex属性值之间的所有单词，并清空结果列表并且将新单词加入到该列表中
     * 如果找到一个与当前查找结果距离相同的单词，那么就将该单词加入到结果列表中
     */
    @Override
    public BestMatchingData call() {
        List<String> results = new ArrayList<>();
        int minDistance = Integer.MAX_VALUE;
        int distance;
        for (int i = startIndex; i < endIndex; i++) {
            distance = LevenshteinDistance.editDistance(word,dictionary.get(i));
            /*
             * 如果在此过程中它找到了比钱一个单词更加接近的单词，将清空结果列表并且将新单词加入到该列表中
             * 如果找到一个与当前查找结果距离相同的单词，那么就将该单词加入到结果列表中
             **/
            if(distance < minDistance){
                //有更短的距离就清空原集合
                results.clear();
                minDistance = distance;
                results.add(dictionary.get(i));
            }else if(distance == minDistance){
                results.add(dictionary.get(i));
            }
        }
        //创建一个BestMatchingData的对象并且返回该对象，该对象中包含查找到的单词列表以及这些单词与输入字符串之间的距离
        BestMatchingData data = new BestMatchingData();
        data.setWords(results);
        data.setDistance(minDistance);
        return data;
    }
}

```



```java
/**
 * @author: Eureka
 * @date: 2022/4/17 21:56
 * @Description: 创建执行器和必要的任务，并且将任务发送给执行器
 */
public class BestMatchingConcurrentCalculation {
    public static BestMatchingData getBestMatchingWords(String word, List<String> dictionary) {
        //取cpu的核数，将机器的核数作为在此使用的最大线程数
        int numCores = Runtime.getRuntime().availableProcessors();
        //创建线程池
        ThreadPoolExecutor poolExecutor = new ThreadPoolExecutor(numCores, numCores, 10, TimeUnit.SECONDS,
                new ArrayBlockingQueue<>(numCores),
                new ThreadPoolExecutor.DiscardOldestPolicy());
        //计算每个任务需要处理数据的数量
        int size = dictionary.size();
        //每个任务需要处理多少条数据
        int step = size / numCores;
        int startIndex, endIndex;
        List<Future<BestMatchingData>> results = new ArrayList<>();
        for (int i = 0; i < numCores; i++) {
            startIndex = i * step;
            if (i == numCores - 1) {
                endIndex = dictionary.size();
            } else {
                endIndex = (i + 1) * step;
            }
            //创建这些任务，使用submit()方法将其发送给执行器，并且将该方法返回的future对象添加到future对象列表
            BestMatchingTask task = new BestMatchingTask(startIndex, endIndex, dictionary, word);
            //submit方法会立即返回，不会一直等待任务执行
            Future<BestMatchingData> future = poolExecutor.submit(task);
            results.add(future);
        }
        //关闭线程池
        poolExecutor.shutdown();
        //
        List<String> words = new ArrayList<>();
        int minDistance = Integer.MAX_VALUE;
        //对Future对象列表执行迭代操作以获得任务的执行结果
        for (Future<BestMatchingData> f : results) {
            /*
             * 这里我们调用不带任何参数的get()方法，如果任务执行结束，则该方法返回由call()方法返回的对象
             * 如果任务尚未结束，该方法会通过当前线程将调用线程置为休眠状态，直到任务执行结束并且可获得结果为止
             ***/
            BestMatchingData data = null;
            try {
                data = f.get();
            } catch (InterruptedException | ExecutionException e) {
                e.printStackTrace();
            }
            //将任务的结果组合成一个结果列表，这样就可以仅返回与参照字符距离最近的单词的列表
            assert data != null;
            if (data.getDistance() < minDistance) {
                //清空原来的集合
                words.clear();
                minDistance = data.getDistance();
                words.addAll(data.getWords());
            }
        }
        //创建并返回一个BestMatchingData对象，其中含有算法执行结果
        BestMatchingData bestMatchingData = new BestMatchingData();
        bestMatchingData.setDistance(minDistance);
        bestMatchingData.setWords(words);
        return bestMatchingData;
    }
}

```

测试：

```java
@org.junit.Test
    public void test02(){
        Instant start = Instant.now();
        //加载数据
        List<String> dictionary = WordsLoader.load("your path//UK Advanced Cryptics Dictionary.txt");
        System.out.println("数据加载耗时：" + Duration.between(start, Instant.now()).toMillis() + "ms" + "\n共加载数据条数：" + dictionary.size() + "条");
        //匹配
        String matchStr = "zythum";
        BestMatchingData bestMatchingWords = BestMatchingConcurrentCalculation.getBestMatchingWords(matchStr, dictionary);
        System.out.println("匹配到的词为：" + bestMatchingWords.getWords().toString() + "\n总共耗时：" + Duration.between(start, Instant.now()).toMillis() + "ms");
    }
```

测试25万条数据结果：

```java
数据加载耗时：119ms
共加载数据条数：250353条
匹配到的词为：[zythum]
总共耗时：300ms
```

测试三百万条数据结果：

```java
数据加载耗时：2174ms
共加载数据条数：3002036条
匹配到的词为：[zythum]
总共耗时：3246ms
```



对比一下：

|            | 25w条数据 | 三百万条数据 | 两千万条数据 |
| ---------- | --------- | ------------ | ------------ |
| 单线程     | 306ms     | 6318ms       | 227814ms     |
| fork/join  | 304ms     | 3167ms       | 178446ms     |
| 传统多线程 | 300ms     | 3646ms       | 198446ms     |

抛去JVM优化的部分，其实可以看出`fork/join`框架还是非常优秀的
