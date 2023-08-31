# Trie前缀树

>我们现在有个需求，如何判断一堆不重复的字符串是否以某个前缀开头
>
>可以用`Set/Map`存储字符串（保证字符串不重复）
>
>- 遍历所有的字符串进行判断
>- 时间复杂度`O(n)`

有没有更优的数据结构来实现前缀搜索呢？

我们可以使用`Trie前缀树`

我们常常在路由中使用前缀树这一数据结构，用来匹配`/api/:id`这样的路由

>- Trie的优点：搜索前缀的效率主要跟前缀的长度有关
>
>- Trie的缺点：浪费内存
>
>- 更多Trie的数据结构和算法有：Double-array Trie（DAT）、Suffix Tree（后缀树）、Patricia Tree（Radix Trie 或 Compact Trie）、Crit-bit Tree (二进制位压缩树)、AC自动机

## 1. Trie前缀树

>- Trie也叫字典树、前缀树（prefix Tree）、单词查找树
>- Trie搜索字符串的效率主要跟**字符串的长度**有关
>
>假设使用`Trie`存储cat、dog、doggy、does、cast、add六个单词
>
>![image-20230623171950532](https://cdn.fengxianhub.top/resources-master/202306231719742.png)

## 2. 接口设计

```java
// 接口设计1
int size();
boolean isEmpty();
void clear();
boolean contains(String str);
void add(String str);
void remove(String str);
boolean starsWith(String prefix);
// 接口设计2
int size();
boolean isEmpty();
void clear();
boolean contains(String str);
V add(String str, V value);
V remove(String str);
boolean starsWith(String prefix);
```

第一套接口很像`set`，第二套接口很像`map`































