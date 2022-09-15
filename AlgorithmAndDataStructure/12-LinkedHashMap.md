# LinkedHashMap

我们先来总结一下HashMap的特点：

- HashMap是查询效率最高的数据结构（O(1)级别）
- HashMap存储元素是无序的

如果我们想要按照添加元素的顺序遍历，显然HashMap是达不到我们的要求的，`TreeMap`可以满足我们的要求，但是效率没有HashMap高

接下来介绍一种新的数据结构——LinkedHashMap

LinkedHashMap就是在HashMap的基础上维护元素的添加顺序，使得遍历的结果是遵从添加顺序的

![image-20220721093424064](https://cdn.fengxianhub.top/resources-master/202207210934379.png)

## 1. 实现添加逻辑

其实我们实现也很简单，就是在添加元素的时候用指针将每个添加的元素串起来就好了

```java
/**
 * <p>
 * LinkedHashMap,红黑树上面的所有结点都用线连接起来了
 * </p>
 *
 * @since: 2022/7/21 9:35
 * @author: 梁峰源
 */
public class LinkedHashMap<K, V> extends HashMap<K, V> {

    /* 需要记录链表的头尾结点 */
    private LinkedNode<K, V> first;
    private LinkedNode<K, V> last;

    /**
     * LinkedHashMap结点
     */
    protected static class LinkedNode<K, V> extends Node<K, V> {
        // 指向上一个结点的指针和指向下一个结点的指针
        LinkedNode<K, V> prev;
        LinkedNode<K, V> next;

        public LinkedNode(K key, V value, Node<K, V> parent) {
            super(key, value, parent);
        }
    }

    @Override
    public void forEach(BiConsumer<? super K, ? super V> action) {
        // 从头结点开始遍历
        LinkedNode<K, V> node = first;
        while (node != null) {
            action.accept(node.key, node.value);
            node = node.next;
        }
    }

    @Override
    public void traversal(Visitor<K, V> visitor) {
        if (visitor == null) return;
        LinkedNode<K, V> node = first;
        while (node != null) {
            if (visitor.visit(node.key, node.value)) return;
            node = node.next;
        }
    }

    /**
     * 我们需要在创建结点的时候用指针将其串起来
     */
    @Override
    protected Node<K, V> createNode(K k, V v, Node<K, V> parent) {
        LinkedNode<K, V> node = new LinkedNode<>(k, v, parent);
        // 添加头结点
        if (first == null) {
            first = last = node;
        } else {
            // 非头结点
            last.next = node;
            node.prev = last;
            last = node;
        }
        return node;
    }

    /**
     * 清空结点需要将first和last去掉，不然不会进行GC
     */
    @Override
    public void clear() {
        super.clear();
        first = null;
        last = null;
    }
}
```

测试一下：

```java
@Test
public void test01() {
    Person p1 = new Person(18, 650, "张三");
    Person p2 = new Person(18, 65, "张三");
    Person p3 = new Person(23, 65, "李四");
    Map<Person, String> map = new LinkedHashMap<>();
    map.put(p1, "张三");
    map.put(p2, "李四");
    map.put(p3, "王五");
    map.forEach((k, v) -> System.out.println(v));
}
```

结果：

```java
张三
李四
王五
```

可以发现，结果确实有序了😄

## 2. 删除逻辑

添加做完了，接下来我们来看删除的逻辑，这里的删除逻辑会复杂一些，**因为在删除的时候我们不仅要处理红黑树的逻辑，还要处理链表的逻辑**，我们可以根据之前的代码然后添加删除链表的逻辑

```java
/**
 * 这里并不是删除结点后修复红黑树性质的代码，而是修复链表和红黑树结点指向关系的代码
 */
@Override
protected void afterRemove(Node<K, V> removedNode) {
    if (removedNode == null) return;
    LinkedNode<K, V> linkedNode = (LinkedNode<K, V>) removedNode;
    LinkedNode<K, V> prev = linkedNode.prev;
    LinkedNode<K, V> next = linkedNode.next;
    if (prev == null) {
        // 是头结点，那么下一个结点成为头结点
        first = next;
    } else {
        prev.next = next;
    }
    if (next == null) {
        // 删除的是尾结点
        last = prev;
    } else {
        next.prev = prev;
    }
}
```

>但是上面移除链表结点的代码并不是完全正确，我们来看下面的这种删除情况，例如我们要删除结点`83`

![image-20220911115040221](https://cdn.fengxianhub.top/resources-master/202209111150458.png)

我们会发现，站在红黑树的角度上来看，删除`83`结点其实是删除它的前驱或者后继结点，也就是删除结点`95`，但是站在链表的角度来看，删除结点`83`就是删除结点`83`

**这里就产生了冲突，所以我们上面的链表结点删除代码中逻辑其实是有问题的**

















































