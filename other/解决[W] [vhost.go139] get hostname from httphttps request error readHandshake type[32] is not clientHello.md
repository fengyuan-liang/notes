# 解决[W] [vhost.go:139] get hostname from http/https request error: readHandshake: type[32] is not clientHello

>最近应付学校检查作业，需要用内网穿透给别人访问自己的网页，尝试用`frp`做web服务器，并且在内网服务器上配置了宝塔面板，按照官方教程一步一步弄，`tcp`访问内网宝塔面板刚开始就弄好了，`http`或`https`请求网站却一直报这样那样的错😭

搭建步骤参考官方文档：<a href="https://gofrp.org/docs/examples/">通过自定义域名访问内网的 Web 服务</a>

讲一下报这个错的原因，我看到官方文档里配置了域名，然后想域名不也就是解析了ip地址嘛，那我配个ip地址应该也能访问吧

**官方做法：**

![image-20220222141113727](https://cdn.fengxianhub.top/resources-master/202202221411822.png)

**我的做法：**

![image-20220222141643137](https://cdn.fengxianhub.top/resources-master/202202221416198.png)

>然后就一直报错！！！

![image-20220222141755343](https://cdn.fengxianhub.top/resources-master/202202221417392.png)

报错信息显示重新握手失败什么的😅

然后百思不得其解，又去看来下官方案例，最后想`是不是没有用域名导致的！！！！！`

>把IP地址换成域名试了下，然后就成功了

![image-20220222142308356](https://cdn.fengxianhub.top/resources-master/202202221423448.png)





