# Trie前缀树

>我们现在有个需求，如何判断一堆不重复的字符串是否以某个前缀开头
>
>可以用`Set/Map`存储字符串（保证字符串不重复）
>
>- 遍历所有的字符串进行判断
>- 时间复杂度`O(n)`

有没有更优的数据结构来实现前缀搜索呢？

我们可以使用`Trie前缀树`

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

































