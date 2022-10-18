# sql刷题

### [178. 分数排名](https://leetcode.cn/problems/rank-scores/)

```java
+-------------+---------+
| Column Name | Type    |
+-------------+---------+
| id          | int     |
| score       | decimal |
+-------------+---------+
Id是该表的主键。
该表的每一行都包含了一场比赛的分数。Score是一个有两位小数点的浮点值。
```

编写 SQL 查询对分数进行排序。排名按以下规则计算:

分数应按从高到低排列。
如果两个分数相等，那么两个分数的排名应该相同。
在排名相同的分数后，排名数应该是下一个连续的整数。换句话说，排名之间不应该有空缺的数字。

```java
输入: 
Scores 表:
+----+-------+
| id | score |
+----+-------+
| 1  | 3.50  |
| 2  | 3.65  |
| 3  | 4.00  |
| 4  | 3.85  |
| 5  | 4.00  |
| 6  | 3.65  |
+----+-------+
输出: 
+-------+------+
| score | rank |
+-------+------+
| 4.00  | 1    |
| 4.00  | 1    |
| 3.85  | 2    |
| 3.65  | 3    |
| 3.65  | 3    |
| 3.50  | 4    |
+-------+------+
```

#### 方法一

首先我们先不管排序，先想想如何算排名，如示例，如果我们现在得分3.85分，其实我们只需要找出比自己高或者等于自己的人，然后将他们的分数去重，然后 +1 就是自己的排名了。即比3.85分多的人有两个，对score进行去重为1，+1后我的排名为2

假设我的分数为 myScore

```sql
select count(distinct s.score) from Scores s where s.score >= myScore
```

那么现在这个myScore怎么来呢？我们可以嵌套进行获取

```sql
select s.score as score ,
(查询排名的sql) as  rank
from Scores s
order by s.score
```

此时外层sql里面的score就是我自己的score了，即myScore

```sql
select s.score as score ,
(select count(distinct b.score) from Scores b where b.score >= s.score) as `rank` #rank为保留字
from Scores s
order by s.score desc
```

#### 方法二

使用mysql8中自带的排序函数

>1. rank() over
>  作用：查出指定条件后的进行排名，条件相同排名相同，排名间断不连续。
>   说明：例如学生排名，使用这个函数，成绩相同的两名是并列，下一位同学空出所占的名次。即：1 1 3 4 5 5 7
>
>2. dense_rank() over
>  作用：查出指定条件后的进行排名，条件相同排名相同，排名间断不连续。
>   说明：和rank() over 的作用相同，区别在于dense_rank() over 排名是密集连续的。例如学生排名，使用这个函数，成绩相同的两名是并列，下一位同学接着下一个名次。即：1 1 2 3 4 5 5 6
>
>3. row_number() over
>  作用：查出指定条件后的进行排名，条件相同排名也不相同，排名间断不连续。
>   说明：这个函数不需要考虑是否并列，即使根据条件查询出来的数值相同也会进行连续排序。即：1 2 3 4 5 6
>
>**使用小提示**
>dense_rank() over 后面跟排序的依据的列，下面是用了一个排序好的列(order by score desc)。
>注意：如果select中有一列是用rank()这类函数，其他的列都会按着他这列规定好的顺序排。

```sql
# Write your MySQL query statement below
select score, dense_rank() over (order by score desc) as 'rank'  #这个rank之所以要加引号，因为rank本身是个函数，直接写rank会报错
from scores;
```

[**18. 分组计算练习题**]([分组计算练习题_牛客题霸_牛客网 (nowcoder.com)](https://www.nowcoder.com/practice/009d8067d2df47fea429afe2e7b9de45?tpId=199&tqId=1975670&ru=/exam/oj&qru=/ta/sql-quick-study/question-ranking&sourceUrl=%2Fexam%2Foj%3Fpage%3D1%26tab%3DSQL%E7%AF%87%26topicId%3D199))

题目：现在运营想要对每个学校不同性别的用户活跃情况和发帖数量进行分析，请分别计算出每个学校每种性别的用户数、30天内平均活跃天数和平均发帖数量。

```java
id	device_id	gender	age	university	gpa	active_days_within_30  question_cnt  answer_cnt
1	2138		male	21	北京大学	  3.4	7	2	12
2	3214		male		复旦大学	  4.0	15	5	25
3	6543		female	20	北京大学	  3.2	12	3	30
4	2315		female	23	浙江大学	  3.6	5	1	2
5	5432		male	25	山东大学	  3.8	20	15	70
6	2131		male	28	山东大学	  3.3	15	7	13
7	4321		male	26	复旦大学	  3.6
```

显然这里需要进行两次分组，先根据学校进行分组，再根据性别进行分组

在MySQL中`group by`多个字段进行分组可以将多个字段看成一个整体，所以我们写`group by university, gender`

```sql
select
  gender,
  university,
  count(device_id) as user_num,
  avg(active_days_within_30) as avg_active_day, 
  round(avg(question_cnt)) as avg_question_cnt -- round为一位小数点后进行四舍五入
from
  user_profile
group by
  gender,
  university
```

