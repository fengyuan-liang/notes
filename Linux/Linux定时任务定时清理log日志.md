# Linux定时任务定时清理log日志，附定时任务知识点

>我们知道当我们的web服务器接收到请求时就会将日志存放到相应的log日志里面，如果我们不清理就会越来越大，直至将所有空间耗尽。我们可以采取用`crontab命令`做定时任务执行`shell`脚本来清理日志

先看下log日志所占空间：

![image-20220222174738390](https://cdn.fengxianhub.top/resources-master/202202221747592.png)

先用`pwd`查看一下shell脚本的绝对路径，我的是：/root/frp_0.32.1_linux_amd64

先写一句简单的脚本(就是把一个空字符串覆盖原来的日志)：

```shell
#!/bin/bash
PATH=$PATH:~/bin
export PATH
echo "">绝对路径/nohup.out
```

在日志文件所在文件夹下敲入`vim clearlog.sh`，按`i`进入插入模式，粘贴一下，然后按`Esc`，再按英文的`:`，按住`shift`并敲入`wq`写入并退出



测试一下：

![image-20220222175258436](https://cdn.fengxianhub.top/resources-master/202202221752526.png)

>写一个定时任务，命令：`crontab`，参数解释 `-e`编辑、`-u`查看、`-r`删除

在日志文件所在文件夹下敲入`crontab -e`，然后按`i`进入编辑模式，敲入`*/1 * * * * sh 绝对路径/clearlog.sh`

这个`*/1`代表每分钟执行一次，如果想每20分钟执行一次就写`*/20`，前四个*号分别代表：

![image-20220222181315962](https://cdn.fengxianhub.top/resources-master/202202221813093.png)

退出查看一下：

![image-20220222215342663](https://cdn.fengxianhub.top/resources-master/202202222153789.png)



然后给shell脚本增加一个可以执行的权限：

```java
chmod +x clearlog.sh
```

然后就可以等待定时任务周期性启动了，接下来就可以定时清理垃圾了

![image-20220222215826491](https://cdn.fengxianhub.top/resources-master/202202222158540.png)

当然如果不会写可以用工具自动生成：<a href="https://cron.qqe2.com/">cron自动生成工具</a>                   也可以检测语法：<a href="https://tool.lu/crontab/">cron语法检测</a> 



## 附录：Linux定时任务知识点

![image-20220222220833236](https://cdn.fengxianhub.top/resources-master/202202222208506.png)

