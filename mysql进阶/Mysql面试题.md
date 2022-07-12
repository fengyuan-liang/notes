# Mysql面试题

mysql经典面试题

1. B树和B+树的区别 ？
2. Innodb中的B+树有什么特点 ？
3. 什么是Innodb中的page ?
4. Innodb中的B+树是怎么产生的 ?
5. 什么是聚簇索引 ？
6. Innodb是如何支持范围查找能走索引的 ？
7. 什么是联合索引 ？ 对应B+树是如何生成的 ?
8. 什么是最左前缀原则 ？
9. 为什么要遵守最左前缀原则才能利用到索引 ？
10. 什么是索引条件下推 ？
11. 什么是覆盖索引 ？
12. 有哪些情况会导致索引失效 ？

>B树和B+树的区别
>
>![image-20220709105520413](https://cdn.fengxianhub.top/resources-master/202207091055621.png)
>
>- 叶子结点有指针指向
>- 叶子结点的父结点数据冗余了一份

在<a href="https://dev.mysql.com/doc/internals/en/innodb-fil-header.html">Mysql官网上</a>也有B+树描述

 To show what they're about, I'll draw a two-level B-tree.

```java
--------
  - root -
  --------
       |
  ----------------------
  |                    |
  |                    |
  --------          --------
  - leaf -  <-->    - leaf -
  --------          --------
```

Everyone has seen a B-tree and knows that the entries in the root page point to the leaf pages. (I indicate those pointers with vertical '|' bars in the drawing.) **But sometimes people miss the detail that leaf pages can also point to each other** (I indicate those pointers with a horizontal two-way pointer '<-->' in the drawing). This feature allows `InnoDB` to navigate from leaf to leaf without having to back up to the root level. This is a sophistication which you won't find in the classic B-tree, which is why `InnoDB` should perhaps be called a B+-tree instead.

所以在Mysql中的B+ tree有以下特点：

- 没有数据冗余
- 叶子结点是双向的指针

总之，B+树是基于B树进行修改，升级，并不是所有的B+树都是一样的



























