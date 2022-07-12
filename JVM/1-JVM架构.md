# JVM学习一

## 1. JVM简介

什么是JVM？JVM有什么特点？学习JVM有什么好处？

Java Virtual Machine - java程序的运行环境（java二进制字节码的运行环境）

JVM带来的特性有：

- 一次编写，到处运行
- 自动内存管理，垃圾回收功能
- 数组下标越界检查

## 2. 常见的JVM

![image-20220531143124847](https://cdn.fengxianhub.top/resources-master/202205311431087.png)

各个公司有自己的JVM实现，这里主要学习`HotSpot`   JVM

## 3. 学习路线

1. JVM内存模型
2. JVM GC（垃圾回收）
3. Java Class
4. ClassLoader
5. JVM JIT Compiler（即时编译器）

>**对应博客**

| <a href="https://www.bilibili.com/video/BV1yE411Z7AP?p=168&spm_id_from=333.1007.top_right_bar_window_history.content.click">对应视频点这里😁黑马家的</a> |
| :----------------------------------------------------------: |
| <a href="https://blog.csdn.net/fengxiandada/article/details/125115436">JVM内存结构</a> |
| <a href="https://blog.csdn.net/fengxiandada/article/details/125115459?csdn_share_tail=%7B%22type%22%3A%22blog%22%2C%22rType%22%3A%22article%22%2C%22rId%22%3A%22125115459%22%2C%22source%22%3A%22fengxiandada%22%7D&ctrtid=Kalox">JVM垃圾回收与调优学习</a> |
| <a href="https://blog.csdn.net/fengxiandada/article/details/125115520?csdn_share_tail=%7B%22type%22%3A%22blog%22%2C%22rType%22%3A%22article%22%2C%22rId%22%3A%22125115520%22%2C%22source%22%3A%22fengxiandada%22%7D&ctrtid=6xrAk">JVM字节码技术与Java语法糖字节码分析</a> |
| <a href="https://blog.csdn.net/fengxiandada/article/details/125115525?csdn_share_tail=%7B%22type%22%3A%22blog%22%2C%22rType%22%3A%22article%22%2C%22rId%22%3A%22125115525%22%2C%22source%22%3A%22fengxiandada%22%7D&ctrtid=ZXGSw">JVM类加载过程和编译器优化</a> |



