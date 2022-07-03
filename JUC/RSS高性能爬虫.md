# RSS高性能爬虫

[简易信息聚合](https://baike.baidu.com/item/简易信息聚合)（也叫聚合内容）是一种基于[XML](https://baike.baidu.com/item/XML)的标准，在互联网上被广泛采用的内容包装和投递协议。RSS(Really Simple Syndication)是一种描述和同步[网站](https://baike.baidu.com/item/网站)内容的格式，是使用最广泛的XML应用。RSS搭建了[信息](https://baike.baidu.com/item/信息/111163)迅速传播的一个技术平台，使得每个人都成为潜在的[信息提供者](https://baike.baidu.com/item/信息提供者/12754057)。发布一个RSS文件后，这个RSS Feed中包含的信息就能直接被其他站点调用，而且由于这些数据都是标准的XML格式，所以也能在其他的[终端](https://baike.baidu.com/item/终端/1903878)和服务中使用，是一种描述和同步网站内容的格式。RSS可以是以下三个解释的其中一个： [Really](https://baike.baidu.com/item/Really/16030355) Simple Syndication；RDF (Resource Description Framework) Site Summary； Rich Site Summary。但其实这三个解释都是指同一种Syndication的技术。

这里有几个rss种子源地址：

- 品牌视觉资讯品平台;https://www.rologo.com/feed
- 摄影世界;https://www.photoworld.com.cn/feed
- 抽屉;https://dig.chouti.com/feed.xml

RSS文件具有很好的可读性：

![image-20220427230239398](https://cdn.fengxianhub.top/resources-master/202204272303805.png)

## 1. 解析xml文件

常见的解析xml方式有两种：

- dom解析
- sax解析

>SAX：只能读，不能修改，只能顺序访问，适合对大型的XML的解析，解析速度快！
>DOM：不仅能读，还能修改，而且能够实现随机访问，缺点是解析速度慢，只适合解析小型文档
>解析速度慢（要在内存中生成节点树，而生成树是比较费时的）
>SAX：应用于保存大量数据的XML（为什么要用XML保存大量的数据类容？答：可以实现异构系统
>的数据访问，实现跨平台！）
>DOM：一般应用与小型的配置XML，方便我们操作！





































