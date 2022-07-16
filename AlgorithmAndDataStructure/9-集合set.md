# 集合（Set）

java中常见集合

```css
Collection 接口的接口 对象的集合（单列集合）
├——-List 接口：元素按进入先后有序保存，可重复
│—————-├ LinkedList 接口实现类， 链表， 插入删除， 没有同步， 线程不安全
│—————-├ ArrayList 接口实现类， 数组， 随机访问， 没有同步， 线程不安全
│—————-└ Vector 接口实现类 数组， 同步， 线程安全
│ ———————- Stack 是Vector类的实现类
└——-Set 接口： 仅接收一次，不可重复，并做内部排序
├—————-HashSet 使用hash表（数组）存储元素
│————————└ LinkedHashSet 链表维护元素的插入次序
└ —————-TreeSet 底层实现为红黑树，元素排好序

Map 接口 键值对的集合 （双列集合）
├———Hashtable 接口实现类， 同步， 线程安全
├———HashMap 接口实现类 ，没有同步， 线程不安全
│—————–├ LinkedHashMap 双向链表和哈希表实现
│—————–└ WeakHashMap
├ ——–TreeMap 红黑树对所有的key进行排序
└———IdentifyHashMap
```



## 1. 接口设计

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

## 2. 链表实现集合

set接口

```java
public interface Set<E>{
    int size();
    boolean isEmpty();
    void clear();
    boolean contains(E element);
    void add(E element);
    void remove(E element);
    void traversal(Visitor<E> visitor);
    abstract class Visitor<E>{
        boolean stop;
        public abstract boolean visit(E element);
    }
}
```

双向链表实现集合

```java
package com.fx.set;

import com.fx.List.LinkedList;
import com.fx.List.List;

/**
 * <p>
 * 双向链表实现集合
 * </p>
 *
 * @since: 2022/6/29 9:21
 * @author: 梁峰源
 */
public class ListSet<E> implements Set<E> {
    private final List<E> list = new LinkedList<>();

    @Override
    public int size() {
        return list.size();
    }

    @Override
    public boolean isEmpty() {
        return list.isEmpty();
    }

    @Override
    public void clear() {
        list.clear();
    }

    @Override
    public boolean contains(E element) {
        return list.contains(element);
    }

    @Override
    public void add(E element) {
        // 集合不能包含重复的元素，更加推荐覆盖元素的方式
//        if(list.contains(element)) return;
        int index = list.indexOf(element);
        // 存在就覆盖，不存在就添加
        if (index!= list.ELEMENT_NOT_FOUND) {
            list.set(index, element);
        }else {
            list.add(element);
        }
    }

    @Override
    public void remove(E element) {
        list.remove(list.indexOf(element));
    }

    @Override
    public void traversal(Visitor<E> visitor) {
        // 如果没有传遍历接口，直接返回
        if (visitor == null) return;
        int size = list.size();
        for (int i = 0; i < size; i++) {
            if (visitor.visit(list.get(i))) return;
        }
    }
}

```

这里贴一下双向链表的代码：

```java
package com.fx.List;


/**
 * 线性表
 */
public interface List<E> {

    int ELEMENT_NOT_FOUND = -1;//没有找到元素的返回值

    /**
     * 在指定索引上插入指定值，指定索引后面的值依次后移
     *
     * @param index   指定索引
     * @param element 指定值
     */
    void add(int index, E element);

    /**
     * @param element 添加到集合中的元素
     */
    void add(E element);

    /**
     * 删除指定索引上的值
     *
     * @param index 指定索引
     * @return 返回被删除元素的值
     */
    E remove(int index);


    /**
     * 清除集合中所有的元素
     */
    void clear();

    boolean contains(E element);

    /**
     * 返回对应元素在集合中的索引
     *
     * @param element 指定元素
     * @return 返回指定元素在集合中的索引
     */
    int indexOf(E element);

    /**
     * 设置指定索引的值并返回设置之前的值
     *
     * @param index   指定索引
     * @param element 设置的值
     * @return 返回set值之前的值
     */
    E set(int index, E element);

    /**
     * @param index 指定索引
     * @return 返回指定索引的元素
     */
    E get(int index);

    /**
     * @return 判断是否为空
     */
    boolean isEmpty();

    /**
     * @return 返回此时的元素个数
     */
    int size();
}

```

```java
package com.fx.List;

/**
 * 线性表抽象类
 */
public abstract class AbstractList<E> implements List<E> {

    protected int size;//元素的数量

    /**
     * @return 判断是否为空
     */
    public boolean isEmpty() {
        return size == 0;
    }

    /**
     * @param element 添加到集合中的元素
     */
    public boolean contains(E element){
        return indexOf(element) !=ELEMENT_NOT_FOUND;
    }

    /**
     * 添加元素检查索引合法性
     */
    protected void rangeCheckForAdd(int index) {
        if (index < 0 || index > size) {
            outOfBound(index);
        }
    }

    /**
     * 索引检查合法性
     */
    protected void rangeCheck(int index) {
        if (index < 0 || index > size - 1) {
            outOfBound(index);
        }
    }

    /**
     * 索引不合法抛出异常
     */
    protected void outOfBound(int index) {
        throw new IndexOutOfBoundsException("索引值不合法,index=" + index + ",实际大小size=" + size);
    }
}

```

```java
package com.fx.List;

/**
 * 链表
 */
public class LinkedList<E> extends AbstractList<E>{
    private Node<E> first;
    private Node<E> last;
    private static class Node<E> {
        E element;
        Node<E> next;
        public Node(E element, Node<E> next) {
            this.element = element;
            this.next = next;
        }

        @Override
        public String toString() {
            StringBuilder sb = new StringBuilder();
            sb.append("_").append(element).append("_");

            if (next != null) {
                sb.append(next.element);
            } else {
                sb.append("null");
            }

            return sb.toString();
        }
    }
    @Override
    public void add(int index, E element) {
        rangeCheckForAdd(index);
        if(index == 0){
            first = first == null ? new Node<>(element, null) : new Node<>(element, first);
        }else {
            Node<E> prev=node(index-1);//首先获取上一个结点
            prev.next= new Node<>(element,prev.next);
        }
        size++;
    }

    @Override
    public void add(E element) {
        add(size,element);
    }

    @Override
    public E remove(int index) {
        rangeCheck(index);
        Node<E> node=first;
        if(index==0){
            first=first.next;
        }else {
            Node<E> prev = node(index - 1);//先找到前一个元素
            node = prev.next;
            prev.next=node.next;
        }
        size--;
        return node.element;
    }

    @Override
    public void clear() {
        size=0;
        first=null;
    }

    @Override
    public boolean contains(E element) {
        return indexOf(element) != ELEMENT_NOT_FOUND;
    }

    @Override
    public int indexOf(E element) {
        Node<E> node=first;
        if(element==null){
            for (int i = 0; i < size; i++) {
                if (node.element==null){
                    return i;
                }else {
                    node=node.next;
                }
            }
        }else {
            for (int i = 0; i < size; i++) {
                //让使用者指定E的比较方法,如未指定，即比较内存地址
                if (element.equals(node.element)) {
                    return i;
                }
                node=node.next;
            }
        }
        return ELEMENT_NOT_FOUND;
    }

    @Override
    public E set(int index, E element) {
        Node<E> node = node(index);
        E oldElement=node.element;
        node.element=element;
        return oldElement;
    }

    @Override
    public E get(int index) {
        return node(index).element;
    }

    @Override
    public boolean isEmpty() {
        return first==null;
    }

    @Override
    public int size() {
        return size;
    }

    /**
     * 返回指定索引值上的node对象
     */
    private Node<E> node(int index){
        rangeCheck(index);
        Node<E> node=first;
        for (int i = 0; i < index; i++) {
            node=node.next;
        }
        return node;
    }

    @Override
    public String toString() {
        StringBuilder sbf = new StringBuilder();
        sbf.append("size=").append(size).append(",[");
        Node<E> node=first;
        for (int i = 0; i < size; i++) {
            if (i != 0) {
                sbf.append(", ");
            }
            sbf.append(node.element);
            node=node.next;
        }
        sbf.append("]");
        return sbf.toString();
    }

}

```



## 3. 红黑树实现集合

```java
package com.fx.set;

import com.fx.Tree.BinaryTree;
import com.fx.Tree.RbTree;

/**
 * <p>
 *
 * </p>
 *
 * @since: 2022/7/12 13:29
 * @author: 梁峰源
 */
public class TreeSet<E> implements Set<E> {
    // 红黑树
    RbTree<E> rbTree = new RbTree<>();

    @Override
    public int size() {
        return rbTree.size();
    }

    @Override
    public boolean isEmpty() {
        return rbTree.isEmpty();
    }

    @Override
    public void clear() {
        rbTree.clear();
    }

    @Override
    public boolean contains(E element) {
        return rbTree.contains(element);
    }

    @Override
    public void add(E element) {
        // 红黑树本身如果是相同的会覆盖，默认就是去重的
        rbTree.add(element);
    }

    @Override
    public void remove(E element) {
        rbTree.remove(element);
    }

    @Override
    public void traversal(Visitor<E> visitor) {
        // 中序遍历
        rbTree.inorderTraversal(new BinaryTree.Visitor<E>() {
            @Override
            protected boolean visit(E element) {
                return visitor.visit(element);
            }
        });
    }
}

```

红黑树的代码就不贴出来了，上一篇博客里面有

测试：

```java
public class TestTreeSet {
    public static void main(String[] args) {
        Set<Integer> treeSet = new TreeSet<>();
        treeSet.add(10);
        treeSet.add(12);
        treeSet.add(10);
        treeSet.add(13);
        treeSet.add(13);
        treeSet.traversal(new Set.Visitor<Integer>() {
            @Override
            public boolean visit(Integer element) {
                System.out.println(element);
                return false;
            }
        });
    }
}

```

```java
10
12
13
```



































