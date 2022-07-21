# 映射（TreeMap、TreeSet源码编写）

Map 在有些编程语言中也叫做字典（dictionary，比如 Python、Objective-C、Swift 等）

Map 的每一个 key 是唯一的

![image-20220712194925432](https://cdn.fengxianhub.top/resources-master/202207121949668.png)

>java中Map的设计

```css
Map 接口 键值对的集合 （双列集合）
├———Hashtable 接口实现类， 同步， 线程安全
├———HashMap 接口实现类 ，没有同步， 线程不安全
│—————–├ LinkedHashMap 双向链表和哈希表实现
│—————–└ WeakHashMap
├ ——–TreeMap 红黑树对所有的key进行排序
└———IdentifyHashMap
```

这里我们主要研究`TreeMap`，并基于红黑树实现它，红黑树的编码可以看笔者的文章：<a href="https://blog.csdn.net/fengxiandada/article/details/125759868?spm=1001.2014.3001.5501">红黑树学习，Java实现</a>

TreeMap分析：

时间复杂度（平均）：添加、删除、搜索：O(logn)

特点 ：

- Key 必须具备可比较性 
- 元素的分布是有顺序的

## 1. 接口设计

```java
public interface Map<K, V> {
    int size();

    boolean isEmpty();

    void clear();

    V put(K key, V value);

    V get(K key);

    V remove(K key);

    boolean containsKey(K key);

    boolean containsValue(V value);
	// 遍历接口
    void traversal(Visitor<K, V> visitor);

    abstract class Visitor<K, V> {
        boolean stop;
        public abstract boolean visit(K key, V value);
    }
}
```

## 2. TreeMap

使用红黑树实现

```java
package com.fx.Map;

import com.fx.IMap.Map;
import com.fx.Tree.Comparable;
import com.fx.Tree.Comparator;

import java.util.LinkedList;
import java.util.Queue;

/**
 * <p>
 * TreeMap
 * </p>
 *
 * @since: 2022/7/12 20:57
 * @author: 梁峰源
 */
@SuppressWarnings("unchecked")
public class TreeMap<K, V> implements Map<K, V> {
    private static final boolean RED = false;
    private static final boolean BLACK = true;
    private int size;//当前树结点个数
    private Node<K, V> root;//根结点
    protected Comparator<K> comparator;//比较器

    public TreeMap() {
        this(null);
    }

    public TreeMap(Comparator<K> comparator) {
        this.comparator = comparator;
    }

    // 基于红黑树实现
    private static class Node<K, V> {
        K key;
        V value;
        boolean color = RED;
        public Node<K, V> left;//左结点
        public Node<K, V> right;//右结点
        public Node<K, V> parent;//父结点

        public Node(K key, V value, Node<K, V> parent) {
            this.key = key;
            this.value = value;
            this.parent = parent;
        }

        public boolean isLeaf() {
            return left == null && right == null;
        }

        public boolean hasTwoChildren() {
            return left != null && right != null;
        }

        public boolean isLeftChild() {
            return parent != null && this == parent.left;
        }

        public boolean isRightChild() {
            return parent != null && this == parent.right;
        }

        // 返回当前结点的兄弟结点
        public Node<K, V> sibling() {
            if (isLeftChild()) {
                return parent.right;
            }
            if (isRightChild()) {
                return parent.left;
            }
            //没有兄弟结点
            return null;
        }
    }

    @Override
    public int size() {
        return size;
    }

    @Override
    public boolean isEmpty() {
        return size == 0;
    }

    @Override
    public void clear() {
        root = null;
        size = 0;
    }

    @Override
    public V put(K key, V value) {
        //非空检测
        KeyNotNullCheck(key);
        //先判断是否为根结点，如果根结点为空则添加根结点
        if (root == null) {
            root = new Node<>(key, value, null);
            size++;
            return null;
        }
        //非根结点，非递归进行添加
        Node<K, V> node = root;//用来标记移动的结点
        Node<K, V> parent = root;//保存当前结点的父结点，默认根结点就是父结点
        //根据比较规则找到待添加元素的位置
        int cmp = 0;
        while (node != null) {
            //比较值
            cmp = compare(key, node.key);
            //保存当前结点的父结点
            parent = node;
            if (cmp > 0) {
                node = node.right;
            } else if (cmp < 0) {
                node = node.left;
            } else {
                // 相等的话覆盖
                V oldValue = node.value;
                node.key = key;
                node.value = value;
                return oldValue;
            }
        }
        //添加元素
        Node<K, V> newNode = new Node<>(key, value, parent);
        if (cmp > 0) {
            parent.right = newNode;
        } else {
            parent.left = newNode;
        }
        size++;
        //判断是否需要平衡这棵二叉树
        afterPut(newNode);
        return null;
    }

    /**
     * 修复红黑树性质
     */
    private void afterPut(Node<K, V> node) {
        // 先取出父结点
        Node<K, V> parent = node.parent;
        // 添加的是根结点(将其染成黑色并返回)或者上溢到根结点
        if (parent == null) {
            black(node);
            return;
        }
        // 如果是前四种情况，即父结点为黑色结点，不用处理
        if (isBlack(parent)) return;
        // 取出uncle结点
        // 取出祖父结点
        Node<K, V> grand = parent.parent;
        Node<K, V> uncle = parent.sibling();
        // 如果叔父结点是红色【B树结点上溢，只需要染色】
        if (isRed(uncle)) {
            black(parent);
            black(uncle);
            // 把祖父结点当做是新添加的结点
            // 递归调用
            afterPut(red(grand));
            return;
        }
        /*
         * 叔父结点不是红色，有四种情况
         * LL/RR: parent染成BLACK，grand染成RED - grand进行单旋操作
         * LR/RL: 自己染成black，grand染成red，再双旋
         */
        if (parent.isLeftChild()) { // L
            red(grand);
            if (node.isLeftChild()) { // LL
                black(parent);
            } else { // LR
                black(node);
                rotateLeft(parent);
            }
            rotateRight(grand);
        } else { //R
            red(grand);
            if (node.isLeftChild()) { // RL
                black(node);
                rotateRight(parent);
            } else { // RR
                black(parent);
            }
            rotateLeft(grand);
        }
    }

    @Override
    public V get(K key) {
        Node<K, V> node = node(key);
        return node == null ? null : node.value;
    }


    /**
     * 对外暴露的删除方法
     */
    @Override
    public V remove(K key) {
        return remove(node(key));
    }


    @Override
    public boolean containsKey(K key) {
        return node(key) == null;
    }

    @Override
    public boolean containsValue(V value) {
        if (root == null) return false;
        Queue<Node<K, V>> queue = new LinkedList<>();
        queue.offer(root);
        while (!queue.isEmpty()) {
            Node<K, V> node = queue.poll();
            if (ValEquals(value, node.value)) return true;
            if (node.left != null) queue.offer(node.left);
            if (node.right != null) queue.offer(node.right);
        }
        return false;
    }

    private boolean ValEquals(V v1, V v2) {
        return v1 == null ? v2 == null : v1.equals(v2);
    }

    @Override
    public void traversal(Visitor<K, V> visitor) {
        traversal(root, visitor);
    }

    /**
     * 中序遍历
     */
    private void traversal(Node<K, V> node, Visitor<K, V> visitor) {
        if (node == null || visitor.stop) return;
        traversal(node.left, visitor);
        if (visitor.stop) return;
        visitor.visit(node.key, node.value);
        traversal(node.right, visitor);
    }

    /**
     * 根据结点删除该结点
     */
    private V remove(Node<K, V> node) {
        if (node == null) return null;
        V oldValue = node.value;
        //优先处理度为2的结点
        if (node.hasTwoChildren()) {
            //找到其后继结点
            Node<K, V> successor = successor(node);
            //用后继结点的值覆盖度为2的结点的值
            node.key = successor.key;
            node.value = successor.value;
            //因为度为2的结点的后继或者前驱结点一定是度为1或0，所以将删除结点交给后面的代码来做
            node = successor;
        }
        //删除度为1或者度为0的结点
        Node<K, V> replaceNode = node.left != null ? node.left : node.right;
        /*
         * 这里有三种情况，需要分类讨论
         *  1. node是度为1的结点
         *  2. node是叶子结点并且是根结点
         *  3. node是叶子结点
         */
        if (replaceNode != null) {
            //先修改node.parent的指向
            replaceNode.parent = node.parent;
            //修改parent的left、right指向
            if (node.parent == null) { //node是度为1的结点且是根结点
                root = replaceNode;
            } else if (node == node.parent.left) {
                node.parent.left = replaceNode;
            } else {
                node.parent.right = replaceNode;
            }
            //删除结点之后的处理
            afterRemove(replaceNode);
        } else if (node.parent == null) {
            //node是叶子结点并且是根结点,直接让该结点为null
            root = null;
            //删除结点之后的处理，这里不需要替代
            afterRemove(node);
        } else {
            //叶子结点
            //父结点的左子树
            if (node == node.parent.left) {
                node.parent.left = null;
            } else {
                //父结点右子树
                node.parent.right = null;
            }
            //删除结点之后的处理，这里也不需要替代
            afterRemove(node);
        }
        size--;
        return oldValue;
    }

    protected void afterRemove(Node<K, V> node) {
        // 如果删除的节点是红色
        // 或者 用以取代删除节点的子节点是红色
        if (isRed(node)) {
            black(node);
            return;
        }

        Node<K, V> parent = node.parent;
        // 删除的是根节点
        if (parent == null) return;

        // 删除的是黑色叶子节点【下溢】
        // 判断被删除的node是左还是右
        boolean left = parent.left == null || node.isLeftChild();
        Node<K, V> sibling = left ? parent.right : parent.left;
        if (left) { // 被删除的节点在左边，兄弟节点在右边
            if (isRed(sibling)) { // 兄弟节点是红色
                black(sibling);
                red(parent);
                rotateLeft(parent);
                // 更换兄弟
                sibling = parent.right;
            }

            // 兄弟节点必然是黑色
            if (isBlack(sibling.left) && isBlack(sibling.right)) {
                // 兄弟节点没有1个红色子节点，父节点要向下跟兄弟节点合并
                boolean parentBlack = isBlack(parent);
                black(parent);
                red(sibling);
                if (parentBlack) {
                    afterRemove(parent);
                }
            } else { // 兄弟节点至少有1个红色子节点，向兄弟节点借元素
                // 兄弟节点的左边是黑色，兄弟要先旋转
                if (isBlack(sibling.right)) {
                    rotateRight(sibling);
                    sibling = parent.right;
                }

                color(sibling, colorOf(parent));
                black(sibling.right);
                black(parent);
                rotateLeft(parent);
            }
        } else { // 被删除的节点在右边，兄弟节点在左边
            if (isRed(sibling)) { // 兄弟节点是红色
                black(sibling);
                red(parent);
                rotateRight(parent);
                // 更换兄弟
                sibling = parent.left;
            }

            // 兄弟节点必然是黑色
            if (isBlack(sibling.left) && isBlack(sibling.right)) {
                // 兄弟节点没有1个红色子节点，父节点要向下跟兄弟节点合并
                boolean parentBlack = isBlack(parent);
                black(parent);
                red(sibling);
                if (parentBlack) {
                    afterRemove(parent);
                }
            } else { // 兄弟节点至少有1个红色子节点，向兄弟节点借元素
                // 兄弟节点的左边是黑色，兄弟要先旋转
                if (isBlack(sibling.left)) {
                    rotateLeft(sibling);
                    sibling = parent.left;
                }

                color(sibling, colorOf(parent));
                black(sibling.left);
                black(parent);
                rotateRight(parent);
            }
        }
    }

    /**
     * 根据传入的元素找到结点
     */
    private Node<K, V> node(K key) {
        Node<K, V> node = root;
        while (node != null) {
            int cmp = compare(key, node.key);
            if (cmp == 0) return node;
            if (cmp > 0) {
                node = node.right;
            } else {
                node = node.left;
            }
        }
        //没找到
        return null;
    }


    /**
     * 规定传入对象的比较规则
     *
     * @param k1 第一个对象
     * @param k2 第二个对象
     * @return 0表示相等，大于0表示 e1 > e2,小于0表示 e2 < e1
     */
    private int compare(K k1, K k2) {
        if (comparator != null) {
            return comparator.compare(k1, k2);
        }
        return ((Comparable<K>) k1).compareTo(k2);
    }

    /**
     * 判断元素是否为空
     */
    private void KeyNotNullCheck(K k) {
        if (k == null) {
            throw new IllegalArgumentException("element must not be null");
        }
    }

    /**
     * 对该元素进行左旋转
     *
     * @param grand 待旋转的结点
     */
    protected void rotateLeft(Node<K, V> grand) {
        if (null == grand) return;
        //获得parent结点
        Node<K, V> parent = grand.right;
        //将parent的左子结点取出
        Node<K, V> leftChild = parent.left;
        //左旋
        grand.right = leftChild;
        parent.left = grand;
        //旋转之后让parent结点成为根结点并更新grand、parent、child结点的高度
        afterRotate(grand, parent, leftChild);
    }


    /**
     * 对该元素进行右旋转
     *
     * @param grand 待旋转的结点
     */
    protected void rotateRight(Node<K, V> grand) {
        //获得parent结点,即grand结点的左结点
        Node<K, V> parent = grand.left;
        //获得parent结点的右子结点，方便后面更新高度
        Node<K, V> rightChild = parent.right;
        //右旋
        grand.left = rightChild;
        parent.right = grand;
        //旋转之后让parent结点成为根结点并更新grand、parent、child结点的高度
        afterRotate(grand, parent, rightChild);
    }

    /**
     * 旋转之后让parent结点成为根结点并更新grand、parent、child结点的高度
     */
    protected void afterRotate(Node<K, V> grand, Node<K, V> parent, Node<K, V> child) {
        /*
         * 让parent结点成为当前子树的根结点
         * 这里有两步：
         *  1. 让parent的父结点指向grand的父结点
         *  2. 让grand父结点本来指向grand的指针指向parent,这里顺便更新了parent结点的父结点
         **/
        parent.parent = grand.parent;
        if (grand.isLeftChild()) {
            grand.parent.left = parent;
        } else if (grand.isRightChild()) {
            grand.parent.right = parent;
        } else {
            //当前结点没有父结点，即grand结点就是root结点
            root = parent;
        }
        /*
         * 一共需要更新三个结点的parent，grand、parent和leftChild结点
         * grand结点在上面第二步中已经更新了，所以这里我们还需要更新parent结点和leftChild结点的parent结点
         **/
        if (child != null) {
            child.parent = grand;
        }
        //更新grand的parent结点
        grand.parent = parent;

    }

    /**
     * 找到当前结点的前驱结点
     */
    protected Node<K, V> predecessor(Node<K, V> node) {
        if (node == null) throw new IllegalArgumentException("node不能为空");
        //前驱结点在左子树当中(left.right.right.......)
        Node<K, V> p = node.left;
        if (p != null) {
            while (p.right != null) {
                p = p.right;
            }
            return p;
        }
        //从祖父结点里面找
        while (node.parent != null && node == node.parent.left) {
            node = node.parent;
        }
        /*
         * 这里有两种情况
         *  1. node.parent == null
         *  2. node = node.parent.right;
         */
        return node.parent;
    }

    /**
     * 找到其后继结点
     */
    protected Node<K, V> successor(Node<K, V> node) {
        if (node == null) throw new IllegalArgumentException("node不能为空");
        Node<K, V> p = node.right;
        //第一种情况，其后继结点为node.right.left.left...
        if (p != null) {
            while (p.left != null) {
                p = p.left;
            }
            return p;
        }
        //从祖父结点里面找
        while (node.parent != null && node == node.parent.right) {
            node = node.parent;
        }
        /*
         * 来到这里有两种情况
         *  1. node.right = null
         *  2. node = node.parent.left;
         */
        return node.parent;
    }

    //染成红色
    private Node<K, V> red(Node<K, V> node) {
        return color(node, RED);
    }

    //染成黑色
    private Node<K, V> black(Node<K, V> node) {
        return color(node, BLACK);
    }

    /**
     * 将元素染色
     *
     * @param node  带染色的结点
     * @param color 需要染的颜色
     * @return 将染色的结点返回
     */
    private Node<K, V> color(Node<K, V> node, boolean color) {
        if (node == null) return node;
        node.color = color;
        return node;
    }

    //查看当前结点颜色
    private boolean colorOf(Node<K, V> node) {
        return node == null ? BLACK : node.color;
    }

    private boolean isBlack(Node<K, V> node) {
        return colorOf(node) == BLACK;
    }

    private boolean isRed(Node<K, V> node) {
        return colorOf(node) == RED;
    }
}
```

## 3. TreeSet

Map 的所有 key 组合在一起，其实就是一个 Set

![image-20220712225136599](https://cdn.fengxianhub.top/resources-master/202207122251837.png)

代码实现

```java
package com.fx.set;

import com.fx.IMap.Map;
import com.fx.Map.TreeMap;

import javax.xml.bind.Element;

/**
 * <p>
 *
 * </p>
 *
 * @since: 2022/7/12 22:45
 * @author: 梁峰源
 */
public class TreeSet<E> implements Set<E> {
    Map<E, Object> map = new TreeMap<>();

    @Override
    public int size() {
        return map.size();
    }

    @Override
    public boolean isEmpty() {
        return map.isEmpty();
    }

    @Override
    public void clear() {
        map.clear();
    }

    @Override
    public boolean contains(E element) {
        return map.containsKey(element);
    }

    @Override
    public void add(E element) {
        map.put(element, null);
    }

    @Override
    public void remove(E element) {
        map.remove(element);
    }

    @Override
    public void traversal(Visitor<E> visitor) {
        map.traversal(new Map.Visitor<E, Object>() {
            @Override
            public boolean visit(E key, Object value) {
                return visitor.visit(key);
            }
        });
    }
}

```

测试：

```java
public class TreeMapTest {

    @Before
    public void before() throws Exception {
    }

    @After
    public void after() throws Exception {
    }

    @Test
    public void testTreeSet() {
        Set<Integer> set = new TreeSet<>();
        set.add(1);
        set.add(5);
        set.add(3);
        set.add(2);
        set.traversal(new Set.Visitor<Integer>() {
            @Override
            public boolean visit(Integer element) {
                System.out.println(element);
                return false;
            }
        });
    }
}

```

结果：

```java
1
2
3
5
```

## 4. TreeMap和TreeSet源码分析

我们先来看一下TreeSet的源码，可以看到和我们的一模一样，底层也是通过`TreeMap`实现

```java
public TreeSet() {
    this(new TreeMap<E,Object>());
}
```

所以我们只需要重点研究`TreeMap`的源码即可，你会发现和我们的思路一模一样，只是它实现的时候结点叫做`Entry`，我们的是Node

![image-20220713135628887](https://cdn.fengxianhub.top/resources-master/202207131356119.png)

贴一下put方法的源码

```java
public V put(K key, V value) {
    Entry<K,V> t = root;
    if (t == null) {
        compare(key, key); // type (and possibly null) check
        root = new Entry<>(key, value, null);
        size = 1;
        modCount++;
        return null;
    }
    int cmp;
    Entry<K,V> parent;
    // split comparator and comparable paths
    Comparator<? super K> cpr = comparator;
    if (cpr != null) {//这里写的有点臃肿
        do {
            parent = t;
            cmp = cpr.compare(key, t.key);
            if (cmp < 0)
                t = t.left;
            else if (cmp > 0)
                t = t.right;
            else
                return t.setValue(value);
        } while (t != null);
    }
    else {
        if (key == null)
            throw new NullPointerException();
        @SuppressWarnings("unchecked")
            Comparable<? super K> k = (Comparable<? super K>) key;
        do {
            parent = t;
            cmp = k.compareTo(t.key);
            if (cmp < 0)
                t = t.left;
            else if (cmp > 0)
                t = t.right;
            else
                return t.setValue(value);
        } while (t != null);
    }
    Entry<K,V> e = new Entry<>(key, value, parent);
    if (cmp < 0)
        parent.left = e;
    else
        parent.right = e;
    fixAfterInsertion(e);//修改红黑树的性质
    size++;
    modCount++;
    return null;
}
```

显然比较逻辑的这一块代码，写的有点臃肿，我们是定义了一个`compare`，节省了代码量，但是官方的做法显然效率会更高，因为分支语句只会有一个执行，然而我们的代码虽然精简，但是做了需要无用的判断

```java
/**
 * 规定传入对象的比较规则
 *
 * @param k1 第一个对象
 * @param k2 第二个对象
 * @return 0表示相等，大于0表示 e1 > e2,小于0表示 e2 < e1
 */
private int compare(K k1, K k2) {
    if (comparator != null) {
        return comparator.compare(k1, k2);
    }
    return ((Comparable<K>) k1).compareTo(k2);
}
```

我们再来看一下官方修复红黑树的代码，其实和我们的差不多，我们的是递归，Java官方是循环：

```java
 /** 插入结点之后的修复 */
 private void fixAfterInsertion(Entry<K,V> x) {
     x.color = RED;
     while (x != null && x != root && x.parent.color == RED) {
         if (parentOf(x) == leftOf(parentOf(parentOf(x)))) {
             Entry<K,V> y = rightOf(parentOf(parentOf(x)));
             if (colorOf(y) == RED) {
                 setColor(parentOf(x), BLACK);//染色
                 setColor(y, BLACK);
                 setColor(parentOf(parentOf(x)), RED);
                 x = parentOf(parentOf(x));// 将兄弟结点染成父结点的颜色
             } else {
                 if (x == rightOf(parentOf(x))) {
                     x = parentOf(x);
                     rotateLeft(x);
                 }
                 setColor(parentOf(x), BLACK);
                 setColor(parentOf(parentOf(x)), RED);
                 rotateRight(parentOf(parentOf(x)));
             }
         } else {// 对称设计即可
             Entry<K,V> y = leftOf(parentOf(parentOf(x)));
             if (colorOf(y) == RED) {
                 setColor(parentOf(x), BLACK);
                 setColor(y, BLACK);
                 setColor(parentOf(parentOf(x)), RED);
                 x = parentOf(parentOf(x));
             } else {
                 if (x == leftOf(parentOf(x))) {
                     x = parentOf(x);
                     rotateRight(x);
                 }
                 setColor(parentOf(x), BLACK);
                 setColor(parentOf(parentOf(x)), RED);
                 rotateLeft(parentOf(parentOf(x)));
             }
         }
     }
     root.color = BLACK;
 }
```

删除结点后修复红黑树的性质：

```java
 /** From CLR */
 private void fixAfterDeletion(Entry<K,V> x) {
     while (x != root && colorOf(x) == BLACK) {
         if (x == leftOf(parentOf(x))) {
             Entry<K,V> sib = rightOf(parentOf(x));
             if (colorOf(sib) == RED) {
                 setColor(sib, BLACK);
                 setColor(parentOf(x), RED);
                 rotateLeft(parentOf(x));
                 sib = rightOf(parentOf(x));
             }
             if (colorOf(leftOf(sib))  == BLACK &&
                 colorOf(rightOf(sib)) == BLACK) {
                 setColor(sib, RED);
                 x = parentOf(x);
             } else {
                 if (colorOf(rightOf(sib)) == BLACK) {
                     setColor(leftOf(sib), BLACK);
                     setColor(sib, RED);
                     rotateRight(sib);
                     sib = rightOf(parentOf(x));
                 }
                 setColor(sib, colorOf(parentOf(x)));
                 setColor(parentOf(x), BLACK);
                 setColor(rightOf(sib), BLACK);
                 rotateLeft(parentOf(x));
                 x = root;
             }
         } else { // symmetric，这个单词表示对称！非常的经典
             Entry<K,V> sib = leftOf(parentOf(x));
             if (colorOf(sib) == RED) {
                 setColor(sib, BLACK);
                 setColor(parentOf(x), RED);
                 rotateRight(parentOf(x));
                 sib = leftOf(parentOf(x));
             }
             if (colorOf(rightOf(sib)) == BLACK &&
                 colorOf(leftOf(sib)) == BLACK) {
                 setColor(sib, RED);
                 x = parentOf(x);
             } else {
                 if (colorOf(leftOf(sib)) == BLACK) {
                     setColor(rightOf(sib), BLACK);
                     setColor(sib, RED);
                     rotateLeft(sib);
                     sib = leftOf(parentOf(x));
                 }
                 setColor(sib, colorOf(parentOf(x)));
                 setColor(parentOf(x), BLACK);
                 setColor(leftOf(sib), BLACK);
                 rotateRight(parentOf(x));
                 x = root;
             }
         }
     }
     setColor(x, BLACK);
 }
```
