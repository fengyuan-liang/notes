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

## 3. 代码

```java
package com.fx.trie;

import java.util.HashMap;
import java.util.Map;

/**
 * <p>
 *
 * </p>
 *
 * @author 梁峰源 <fengyuan-liang@foxmail.com>
 * @since 2023/6/24 14:25
 */
public class Trie<V> implements ITrie<V> {

    private static class Node<V> {
        Map<Character, Node<V>> children; // 存储分叉的子结点，k为当前节点存储的字符
        V value;
        boolean isEndWord; // 是否以单词的结尾（是否为一个完整的单词）

        public Map<Character, Node<V>> getChildren() {
            return children == null ? (children = new HashMap<>()) : children;
        }
    }

    private int size;
    private final Node<V> root = new Node<>();


    @Override
    public int size() {
        return size;
    }

    @Override
    public boolean isEmpty() {
        return false;
    }

    @Override
    public void clear() {
        size = 0;
        root.children.clear();
    }

    @Override
    public boolean contains(String str) {
        return false;
    }

    @Override
    public V get(String key) {
        Node<V> node = node(key);
        return node == null ? null : node.value;
    }

    @Override
    public V add(String k, V value) {
        keyCheck(k);
        Node<V> node = root;
        for (char c : k.toCharArray()) {
            Node<V> childNode = node.getChildren().get(c);
            if (childNode == null) {
                childNode = new Node<>();
                node.getChildren().put(c, childNode);
            }
            node = childNode;
        }
        // 之前没有单词
        if (!node.isEndWord) {
            node.isEndWord = true; node.value = value; size++;
            return null;
        }
        // 存在则覆盖
        V oldValue = node.value;
        node.value = value;
        return oldValue;
    }

    @Override
    public V remove(String str) {
        Node<V> node = node(str);
        if (node == null) {
            return null;
        }
        node.isEndWord = false;
        V oldValue = node.value;
        node.value = null;
        return oldValue;
    }

    @Override
    public boolean starsWith(String prefix) {
       keyCheck(prefix);

       Node<V> node = root;
        for (char c : prefix.toCharArray()) {
            node = node.getChildren().get(c);
            if (node == null) {
                return false;
            }
        }
        return true;
    }

    private Node<V> node(String key) {
        keyCheck(key);
        Node<V> node = this.root;
        int len = key.length();
        for (int i = 0; i < len; i++) {
            char c = key.charAt(i); // d o g
            node = node.getChildren().get(c);
            if (node == null) {
                return null;
            }
        }
        return node.isEndWord ? node : null;
    }

    private void keyCheck(String key) {
        if (key == null || key.length() == 0) {
            throw new IllegalArgumentException("key is empty");
        }
    }
}

```































