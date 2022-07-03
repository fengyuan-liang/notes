# 集合（Set）

集合的特点

- 不存放重复的元素
- 常用于去重

应用：

- 存放新增IP，统计新增IP量（用来去重）
- 存放词汇，统计词汇量

集合接口设计：

```java
public interface Set<E>{
    int size();
    boolean isEmpty();
    void clear();
    boolean contains(E element);
    void add(E element);
    void remove(E element);
    void traversal(Visitor<E> visitor);
    public static abstract class Visitor<E>{
        boolean stop;
        public abstract boolean visit(E element);
    }
}
```

我们可以通过我们之前学过的数据结构实现集合：

- 动态数组
- 链表
- BST（AVL、红黑树）







































