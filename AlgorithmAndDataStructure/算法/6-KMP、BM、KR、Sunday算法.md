# KMP、BM、KR、Sunday算法

首先让我们重新认识一下`串`这个概念，`串`是由若干个字符组成的有限序列

例如串`thank`就是由`t`、`h`、`a`、`n`、`k `组成的

对于字符串我们有以下几个概念

- 前缀（prefix）：从第一个字符开始的字串，包括本身
- 真前缀（proper prefix）：不包括本身并且必须从第一个字符开始的字串
- 后缀（suffix）：从最第一个字符逆序的字串，包括本身
- 真后缀（proper suffix）：不包括本身并且从最第一个字符逆序的字串

| 名称   | 对应字串                |
| ------ | ----------------------- |
| 前缀   | t、th、tha、than、thank |
| 真前缀 | t、th、tha、than        |
| 后缀   | thank、hank、ank、nk、k |
| 真后缀 | hank、ank、nk、k        |

## 1. 串匹配算法

>模式串（Pattern）是要匹配的串，用来在文本串（Text）中寻找字串
>
>我们习惯使用`tlen`代表文本串`Text`的长度，`plan`代表模式串`Pattern`的长度
>
>几个经典的串匹配算法有：
>
>- 蛮力（Brute Force）
>- KMP
>- Boyer-Moore
>- Rabin-Karp
>- Sunday

### 1.1 蛮力算法

以字符串为单位，从左到右移动模式串，直到匹配成功