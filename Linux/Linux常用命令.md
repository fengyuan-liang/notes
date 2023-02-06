# Linux常用命令

<img src='https://i.loli.net/2021/09/18/9FoAXuMa8Hz1sOh.png'>



## 1.1-centOS开放网络

<style>
	blockquote{
            display: block;
            padding: 16px;
            margin: 0 0 24px;
            border-left: 8px solid #dddfe4;
            background: #eef0f4;
            overflow: auto;
            word-break: break-word!important;
        }
    ol{
    font-family: Monaco;
    list-style-type: decimal;
	}
    code {
            color: #c7254e;
            background-color: #f9f2f4;
            border-radius: 2px;
            padding: 2px 4px;
            font-family: Monaco;
        }
    table th, table td { 
		text-align: center;
		vertical-align: middle!important;
	}
 </style>
<blockquote>
    <p>
        首先在命令行里登录，账号是root，再敲入命令nmtui设置网络
    </p>
</blockquote>


<img src='https://i.loli.net/2021/09/18/5rDBuPR3fMQyaLb.png'>



<blockquote>
    <p>
        再在这个界面设置开放网络
    </p>
</blockquote>


<img src='https://i.loli.net/2021/09/18/UmIt6J1M8iCcal9.png'>



<blockquote>
    <p>
        选择第二个	
    </p>
</blockquote>



<img src='https://i.loli.net/2021/09/18/AoyJCHaZNflEcqQ.png'>



<blockquote>
    <p>
        返回
    </p>
</blockquote>


<img src='https://i.loli.net/2021/09/18/AQucCBdGlDV47ES.png'>



<blockquote>
    <p>
        退出
    </p>
</blockquote>


<img src='https://i.loli.net/2021/09/18/s3rfZmzgjwSEBGa.png'>



<blockquote>
    <p>
        在root模式下敲入命令行<code>ip address</code>查看开放的IP地址
    </p>
</blockquote>


<img src='https://i.loli.net/2021/09/18/i1m5xpNr2wAOz3v.png'>



<blockquote>
    <p>
        在xshell中设置开放的<code>ip地址</code>
    </p>
</blockquote>
<img src='https://i.loli.net/2021/09/18/Rp14WBEF5AQjdfM.png' >



<blockquote>
    <p>
        系统的关闭与重启：常用的关机命令是<code>shutdown now</code> 常用的重启命令是<code>reboot</code>
    </p>
</blockquote>





## 1.2-Linux常用命令



<div>
    <strong>
    Shell启动完成后，显示命令提示符，提示用户可以输入命令了
    </strong>
    <ol>
        <li>对于普通用户来说，系统默认的提示符是:<code>$</code></li>
        <li>对于root用户，系统默认的提示符是:<code>#</code></li>
    </ol>
</div>


<blockquote>
    <p>
        Shell命令分类(按照命令的功能分类)
    </p>
</blockquote>

<ul>
    <li>文件与目录操作&nbsp;(Linux用户必须掌握的<code>基本操作</code>)</li>
    <li>文本操作&nbsp;(Linux用户必须掌握的<code>基本操作</code>)</li>
    <li>备份压缩</li>
    <li>系统监控</li>
    <li>网络通信</li>
</ul>

### 1.2.1-命令的格式

<blockquote>
    <p>
        命令的格式为：命令名[选项一][选项二]...[参数一][参数二]
    </p>
</blockquote>
<strong>解释：</strong>

<ul>
    <li><code>命令名</code>是命令的名称,表示要执行的操作<code>通常是小写</code></li>
    <li><code>选项</code>是对命令的特别定义，指出命令的<code>操作方式</code></li>
    <li><code>方括号</code>括起来的部分表名该项是<code>可选的</code></li>
</ul>

<strong>举个栗子:</strong>

<blockquote>
    <p>
        在命令行<code>rm -i abc</code>中,<code>rm</code>是命令名,表示<span style="background: yellow">删除文件操作</span>;<code>-i</code>是命令的选项,表示<span style="background: yellow">删除前要提示用户确认</span>;<code>abc</code>是命令参数,表示<span style="background: yellow">要删除的文件</span>
    </p>
</blockquote>



<hr/>

<blockquote>
    <p>
        命令的自行定义和解释(几乎每个命令都有自行定义和解释)
    </p>
</blockquote>
<strong>解释：</strong>

<ul>
    <li>单个字符的选项以<code>-</code>开始;&nbsp;&nbsp;例如：<code>rm -i abc</code></li>
    <li>多个字符的选项以<code>--</code>开始;例如：<code>rm --help</code></li>
    <li>当一个命令行中带有多个单字符选项时，可将这些选项合并,例如<code>rm -i -v abc</code>可以写成<code>rm -iv abc</code></li>
</ul>



<hr/>

<blockquote>
    <p>命令行里的注释</p>
</blockquote>

<ul>
    <li>命令行里的注释用<code>#</code>字符打头,例如<code>rm -i abc #delete a file</code> &nbsp; 注释部分不会被shell解释和执行</li>
</ul>


### 1.2.2-命令的输入与执行

<blockquote>
    <p>常用的Shell命令行编辑键</p>
</blockquote>

<div>
    <table>
        <thead>
            <tr>
                <th>按键</th>
                <th>功能</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td>
                    <code>Backspace</code>&nbsp;&nbsp;<code>Delete</code>&nbsp;&nbsp;<code>Ctrl+h</code>
                </td>
                <td>
                    删除字符
                </td>
            </tr>
            <tr>
                <td>
                    <code>Ctrl+u</code>&nbsp;&nbsp;<code>Ctrl+k</code>
                </td>
                <td>
                    删除光标前后端的所有字符
                </td>
            </tr>
            <tr>
                <td>
                    <code>\</code>
                </td>
                <td>
                    续行符,用于跨行输入长命令
                </td>
            </tr>
            <tr>
                <td>
                    <code>Tab</code>
                </td>
                <td>
                    命令补全
                </td>
            </tr>
            <tr>
                <td>
                    <code>↑</code>&nbsp;<code>↓</code>
                </td>
                <td>
                    翻找命令历史记录
                </td>
            </tr>
            <tr>
                <td>
                    <code>←</code><code>→</code>
                </td>
                <td>
                    前后移动光标
                </td>
            </tr>
        </tbody>
    </table>
</div>



<hr/>

<blockquote>
    <p>常用的Shell命令运行控制键</p>
</blockquote>

<div>
    <table>
        <thead>
            <tr>
                <th>按键</th>
                <th>功能</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td>
                    <code>Enter</code>&nbsp;&nbsp;<code>Ctrl+j</code>&nbsp;&nbsp;<code>Ctrl+m</code>
                </td>
                <td>
                    提交命令运行
                </td>
            </tr>
            <tr>
                <td>
                    <code>Ctrl+s</code>
                </td>
                <td>
                    暂停屏幕输出
                </td>
            </tr>
            <tr>
                <td>
                    <code>Ctrl+c</code>
                </td>
                <td>
                    终止命令的运行
                </td>
            </tr>
        </tbody>
    </table>
</div>
<strong>解释：</strong>

<ul>
    <li>在命令执行过程中，如果输出的信息太多太快,可以按<code>Ctrl+s</code>暂停滚屏，之后按任意键恢复</li>
    <li>在命令执行过程中，如果想要终止命令的运行,可以按<code>Ctrl+c</code></li>
</ul>

<hr/>

### 1.2.3-一些简单的命令

<blockquote>
    <p>who命令</p>
</blockquote>

功能：显示已登录的用户

格式：who[选项]

选项：

<ul>
    <li><code>-H</code>:显示各列的标题</li>
    <li><code>-q</code>:显示登录的用户名和用户数</li>
</ul>

<hr/>

<strong>举个栗子:</strong>

<img src="https://i.loli.net/2021/09/19/kQuTBjOprd15eLC.png"/>



<strong>解释：</strong>

<ul><li>终端的名称是<code>ttyn</code>&nbsp;&nbsp;<code>n</code>是终端的编号</li></ul>

<blockquote>
    <p>echo命令</p>
</blockquote>

功能：回显字符串(相当于c语言里的printf)

格式：echo[选项]字符串...

选项：

<ul>
    <li><code>-n</code>:输出字符串后光标不换行</li>
</ul>

<hr/>

<strong>举个栗子:</strong>

<img src="https://i.loli.net/2021/09/19/Bdv4WFtUT7ZNYcO.png"/>



<blockquote>
    <p>date命令</p>
</blockquote>

功能：显示、设置系统日期和时间

格式：date [选项] [+格式]

选项：

<ul>
    <li><code>-s</code>:设置时间和日期</li>
    <li><code>-u</code>:使用格林威治时间</li>
</ul>

<p>参数：参数的格式由<code>格式控制字符</code>和<code>其他字符</code>构成的，用于控制输出的格式; 当串有空格时,要用<code>引号</code>括起来</p>

<ul>
    <li><code>%r</code>:用hh:mm:ss AM/PM(时:分:秒 上午/下午)的形式显示12小时制时间</li>
    <li><code>%T</code>:用hh:mm:ss (时:分:秒)的形式显示24小时制时间</li>
    <li><code>%a</code>:显示星期的缩写,例如 Sun、Mon</li>
    <li><code>%A</code>:显示星期的全称,例如 Sunday、Monday</li>
    <li><code>%b</code>:显示月份的缩写,例如 Jan</li>
    <li><code>%B</code>:显示月份的全称,例如 January</li>
    <li><code>%m</code>:用2位数字显示月份,例如 02</li>
    <li><code>%d</code>:用2位数字显示日期,例如 27</li>
    <li><code>%D</code>:用mm/dd/yy(月/日/年)的形式显示日期,例如 02/27/17</li>
    <li><code>%y</code>:用2位数字显示年份,例如 21</li>
    <li><code>%Y</code>:用4位数字显示年份,例如 2021</li>
</ul>

<h6>注意：如果不带任何的选项和格式参数，会显示当前日期和本地当前时间。格式为:<code>星期 月 日 时间 时区 年</code></h6>

<hr/>

<strong>举个栗子:</strong>

<div><span>Linux系统可能需要先修正时间，可以看这篇文章</span><a href="https://www.linuxprobe.com/centos7-ntp-time.html">Centos 7安装配置NTP网络时间同步服务器</a></div>

<img src="https://i.loli.net/2021/09/19/YfJhZ1OXa4VQ9rS.png"/>



<blockquote>
    <p>cal命令</p>
</blockquote>

功能：显示月份和日期

格式：cal [[月份]年份]

参数：月份是1-12的数字，年份是1-9999的数字

说明：若自带有一个参数，该参数会被解释为月份；若带两个，第一个会被解释为月份，第二个为年份；不带参数时，显示当年当月的日历

<hr/>

<strong>举个栗子:</strong>

<img src="https://i.loli.net/2021/09/19/NyvmrLugMtzp7SI.png"/>

<hr/>

### 1.2.4-联机帮助命令

Linux命令多如牛毛，每个命令还有众多选项，不可能全部记住，所以我们应该经常翻阅联机帮助文档

<strong>获取联机帮助文档主要有以下几种方式：</strong>

<ul>
    <li><code>--help选项</code></li>
    <li><code>man命令</code></li>
    <li><code>info命令</code></li>
</ul>

<blockquote>
    <p>--help选项</p>
</blockquote>

<span>许多Linux命令都提供了一个--help选项，执行带有--help选项的命令将显示该命令的帮助信息。例如:<code>date --help</code>将显示date命令的帮助信息</span>

<hr/>

<strong>举个栗子:</strong>

<img src="https://i.loli.net/2021/09/19/K3sqMlO9bdHx4kz.png"/>



<blockquote>
    <p>man命令</p>
</blockquote>

功能：显示联机手册页

格式：man 命令名

说明：在浏览手册页时，用以下按键翻页、查找和退出

<ul>
    <li><code>PageUp</code><code>b</code>:向上翻一页</li>
    <li><code>PageDown</code>&nbsp;<code>space</code>:向下翻一页</li>
    <li><code>↑</code>:向上滚一行</li>
    <li><code>↓</code>&nbsp;<code>Enter</code>:向下滚一行</li>
    <li><code>/string</code>:在手册中查找字符串string</li>
    <li><code>?string</code>:在手册中向上查找字符串string</li>
    <li><code>n</code>:查找下一个字符串</li>
    <li><code>N</code>:查找上一个字符串</li>
    <li><code>Home</code>:到第一页</li>
    <li><code>End</code>:到最后一页</li>
    <li><code>q</code>:退出</li>
</ul>

<hr/>

<strong>举个栗子:</strong>

<img src="https://i.loli.net/2021/09/19/8uBLiPOvbKQSsdE.png"/>



<blockquote>
    <p>info命令</p>
</blockquote>

除了联机手册外，Linux系统还提供了大多数命令的超文本格式的联机文档，可用info命令浏览。info命令与man命令的用法类似，但浏览起来更加的方便。info是一种文档格式，也是阅读此格式文档的阅读器;我们常用它来查看Linux命令的info文档。它以主题的形式把几个命令组织在一起，以便于我们阅读;在主题内以node(节点)的形式把本主题的几个命令串联在一起。



功能：用node(节点)的形式把本主题的几个命令串联在一起，方便参看文档

格式：info[选项] [参数]

参数：帮助主题，指定需要获得帮助的主题，可以是指令、函数以及配置文件。

<strong>选项：</strong>

<ul>
    <li><code>-d</code>：添加包含info格式帮助文档的目录;</li>
    <li><code>-f</code>：指定要读取的info格式的帮助文档;</li>
    <li><code>-n</code>：指定首先访问的info帮助文件的节点;</li>
    <li><code>-o</code>：输出被选择的节点内容到指定文件;</li>
</ul>

<div><span>关于操作主题的快捷键，可以看这篇文章</span><a href="https://blog.csdn.net/weixin_39884144/article/details/116773187?ops_request_misc=&request_id=&biz_id=102&utm_term=Linux%20info%E5%91%BD%E4%BB%A4%E7%94%A8%E6%B3%95&utm_medium=distribute.pc_search_result.none-task-blog-2~all~sobaiduweb~default-6-116773187.first_rank_v2_pc_rank_v29&spm=1018.2226.3001.4187">info函数linux,Linux命令info的基本用法</a></div>



## 1.3-Linux文件操作

### 1.3.1-Linux系统的文件

<span>Linux文件名的最大长度是255个字符，通常由字母、数字、<code>.</code>、&nbsp;<code>_</code></span>(下划线)和中划线组成。其中，用"."开头的文件是隐藏文件

<strong>Linux文件命名规则:</strong>

<ul>
    <li>大小写敏感</li>
    <li>除了"/"之外，所有的字符都合法</li>
    <li>避免使用加号、减号或者"."作为普通文件的第一个字符</li>
    <li>避免字符<code>@#$%^&*()[]</code></li>
    <li>Linux文件名中不能含有<code>斜杠字符</code>"/"和<code>空字符</code>"\0",也不能有<code>空格</code>、<code>制表符</code>、<code>控制符</code></li>
</ul>

### 1.3.2-文件通配符和正则表达式

<blockquote>
    <p>基本的通配符和匹配规则</p>
</blockquote>



<ul>
    <li><code>*</code> :匹配任何字符或任何个字符</li>
    <li><code>?</code> :匹配任何的单个字符</li>
    <li><code>[]</code>:匹配任何包含在括号里面的单个字符,比如有:file1.txt,file2.txt,file3.exe,file4.txt,要删除file1和file3则可以写为<code>rm file[13].txt</code></li>
</ul>

![image-20210919155735658](https://cdn.fengxianhub.top/resources-master/202109191557763.png)



<div><span>更多关于Linux文件通配符和正则表达式，可以看这篇文章</span><a href="https://blog.csdn.net/swjtuwyp/article/details/51817472?ops_request_misc=%257B%2522request%255Fid%2522%253A%2522163203641016780357293587%2522%252C%2522scm%2522%253A%252220140713.130102334..%2522%257D&request_id=163203641016780357293587&biz_id=0&utm_medium=distribute.pc_search_result.none-task-blog-2~all~sobaiduend~default-1-51817472.first_rank_v2_pc_rank_v29&utm_term=Linux+%E6%AD%A3%E5%88%99%E8%A1%A8%E8%BE%BE%E5%BC%8F&spm=1018.2226.3001.4187">linux通配符和正则表达式</a></div>



<hr/>

<h6>举个栗子：</h6>







## 1.4-vi文本编辑器

### 1.4.1-vi的三种操作模式

<blockquote>
    <p><code>命令模式(normal mode)</code>&nbsp;<code>插入模式(insert mode)</code>&nbsp;<code>末行模式(last line mode)</code></p>
</blockquote>






## 1.5 docker命令

移动文件到镜像中

docker cp /root/lfyJava/yc-orderSystem.war fc43eda01b06:/usr/local/tomcat/webapps

查看容器的内部ip地址：

docker inspect imageID

```css
//获取指定容器的ip
docker inspect --format '{{ .NetworkSettings.IPAddress }}' 68f0d84be6ad

//获取所有容器ip
docker inspect --format='{{.Name}} - {{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' $(docker ps -aq)

```

注意mysql内部访问id为172.17.0.2

进入容器：docker exec -it imageID /bin/bash

创建docker容器:docker run --name my_tomcat -it -d -p 18080:8080 tomcat

```css
1、拉取tomcat镜像
[root@localhost /]# docker pull tomcat（#拉取tomcat镜像，不指定TAG，默认表示拉取最新版本的）
Using default tag: latest
latest: Pulling from library/tomcat
.....................
2、启动tomcat容器
[root@localhost /]# docker run --name my_tomcat -it -d -p 8080:8080 tomcat（#在后台启动tomcat容器，容器名称为my_tomcat,虚拟机端口号为8080,tomcat默认端口号为8080）
c2a785689e09704a4281709c0641eddac1acd639e38c36cca350632628537a36 (#注意：第一个端口号是宿主机的端口号，用来对应tomcat的端口号，可以自定义，第二个端口号是tomcat的默认端口号，一般不修改，如果要变更，则需要更改tomcat的配置文件)
[root@localhost /]# docker ps（#查看本地正在运行的容器）
CONTAINER ID        IMAGE               COMMAND                  CREATED             STATUS              PORTS                    NAMES
c2a785689e09        tomcat              "catalina.sh run"        14 seconds ago      Up 5 seconds        0.0.0.0:8080->8080/tcp   my_tomcat
3、本地访问tomcat首页
192.168.79.128:8080
```

### 1.5.1 创建容器

> docker run :创建一个新的容器并运行一个命令

```css
 语法：docker run [OPTIONS] IMAGE [COMMAND] [ARG...]
```

#### 1.OPTIONS说明

```css
 -t:为容器重新分配一个伪输入终端，通常与 -i 同时使用
 -i:以交互模式运行容器，通常与 -t 同时使用
 -d:后台运行容器，并返回容器ID
 --name:为容器指定一个名称
 -p:端口映射，格式为：主机(宿主)端口:容器端口
 -v: 挂载宿主机文件夹，格式为： 宿主机文件夹：容器文件夹
 --link: 添加链接到另一个容器
 -m:设置容器使用内存最大值； 
```

**栗子**

- 使用docker镜像tomcat:latest以后台模式启动一个容器,并将容器命名为mytomcat

  ```css
   docker run -tid --name mytomcat tomcat:latest
  ```

- 使用镜像tomcat:latest以后台模式启动一个容器,并将容器的8080端口映射到宿主机的8080端口。

  ```css
   docker run -tid --name mytomcat -p 8080:8080 tomcat:latest
  ```

- 使用镜像tomcat:latest以后台模式启动一个容器,并将容器的8080端口映射到宿主机的8080端口,主机的目录 /home 映射到容器的 /home

  ```css
   docker run -tid --name mytomcat -p 8080:8080 -v /home:/home tomcat:latest
  ```

- 使用镜像tomcat:latest启动一个容器,在容器内执行/bin/bash命令。

  ```css
   docker run -it tomcat:latest /bin/bash
  ```

- **创建一个mysql实例并设置密码**

  ```css
  docker run --name mysql01 -p 13457:3306 -e MYSQL_ROOT_PASSWORD=$A200516123a$ -d mysql:5.7.24
  docker run --name mysql01 -p 13457:3306 -e MYSQL_ROOT_PASSWORD=lfy123456 -d mysql:5.7.24
  
  —name 为设置容器的名字，我设置为mysql01
  
  -p 端口映射
  
  -e 为设置执行时的环境变量，在这里我设置mysql的root密码，相关变量可参考官网
  
  -d 为设置镜像，镜像名:版本
  ```

  



### 1.5.2 删除容器和镜像

删除docker中的镜像，我们可以使用如下命令：

```css
docker rmi 镜像id
```

删除docker中的容器可以使用如下命令：

```css
docker rm 容器id
```

使用如下命令可以查看当前正在运行的容器

```css
docker ps
```

对于已退出的容器，可以使用如下命令进行查看：

```css
docker ps -a
```



### 1.5.3 进入容器

```css
docker exec ：在运行的容器中执行命令
# 语法
docker exec [OPTIONS] CONTAINER COMMAND [ARG...]
# OPTIONS说明：
-d :分离模式: 在后台运行
-i :即使没有附加也保持STDIN 打开
-t :分配一个伪终端


docker container exec -it f0b1c8ab3633 /bin/bash
```

而Docker中的容器ID可以用`docker -ps`来查看

```css
[root@lfy ~]# docker ps
CONTAINER ID        IMAGE               COMMAND                  CREATED             STATUS              PORTS                                NAMES
16dd3910b869        mysql:5.7.24        "docker-entrypoint..."   4 weeks ago         Up 4 weeks          33060/tcp, 0.0.0.0:13457->3306/tcp   mysql01
da12683276ce        nginx               "/docker-entrypoin..."   6 weeks ago         Up 6 weeks          0.0.0.0:8082->80/tcp                 nginx-test-web
8823c7ca1ed5        redis               "docker-entrypoint..."   6 weeks ago         Up 6 weeks          0.0.0.0:6379->6379/tcp               redis

```

`redis-cli`表示运行一个redis客户端

```css
[root@localhost ~]# docker exec -it da45019bf760 redis-cli
127.0.0.1:6379> 
127.0.0.1:6379> set msg "Hello World Redis"
OK
127.0.0.1:6379> get msg
"Hello World Redis"
127.0.0.1:6379>

```



### 1.5.4 安装redis

https://blog.csdn.net/qq_17623363/article/details/106418353?ops_request_misc=%257B%2522request%255Fid%2522%253A%2522164431111716780271934053%2522%252C%2522scm%2522%253A%252220140713.130102334..%2522%257D&request_id=164431111716780271934053&biz_id=0&utm_medium=distribute.pc_search_result.none-task-blog-2~all~top_positive~default-1-106418353.first_rank_v2_pc_rank_v29&utm_term=docker%E5%AE%89%E8%A3%85redis&spm=1018.2226.3001.4187

阿里云docker_redis，conf和data挂载目录：/root/docker/redis/data   /root/docker/redis/conf

启动镜像并挂载数据命令：

```css
docker run -p 6500:6379 \
--name redis \
-v /root/docker/redis/conf/redis.conf:/etc/redis/redis.conf  \
-v /root/docker/redis/data:/data \
-d redis redis-server /etc/redis/redis.conf \
--appendonly yes
```

参数解释：

>-p 6500:6379:把容器内的6500端口映射到宿主机6379端口
>-v /data/redis/redis.conf:/etc/redis/redis.conf：把宿主机配置好的redis.conf放到容器内的这个位置中
>-v /data/redis/data:/data：把redis持久化的数据在宿主机内显示，做数据备份
>redis-server /etc/redis/redis.conf：这个是关键配置，让redis不是无配置启动，而是按照这个redis.conf的配置启动
>–appendonly yes：redis启动后数据持久化

### 1.5.5 安装nginx

<a href="https://blog.csdn.net/ddhsea/article/details/92203713?ops_request_misc=%257B%2522request%255Fid%2522%253A%2522164631358016780264051789%2522%252C%2522scm%2522%253A%252220140713.130102334..%2522%257D&request_id=164631358016780264051789&biz_id=0&utm_medium=distribute.pc_search_result.none-task-blog-2~all~sobaiduend~default-1-92203713.pc_search_result_control_group&utm_term=docker+ngnix&spm=1018.2226.3001.4187">安装nginx</a>

>创建nginx并做文件夹映射

命令：

```sh
docker run -d \
-p 9528:9528 \
--name nginx_volunteer \
-v /root/volunteer/nginx/conf.d:/etc/nginx/conf.d \
-v /root/volunteer/nginx/html:/usr/share/nginx/html \
nginx
```

-d后台运行 -p映射端口 -v映射目录



### 1.5.6 内网穿透NPS及NPC搭建(使用docker实现)

<a href="">nps官网</a>

```java
1.启动NPS服务器容器（端口映射需要注意）：
docker run -td --rm -p 10180:8080 -p 10124:8024 -p 10150-10179:10150-10179 --name nps q012315/nps_custom:1.1.2
```

### 1.5.7 安装mysql

```java
docker run  -p 3308:3306 --name mysql -e MYSQL_ROOT_PASSWORD=$A200516123a$ -d  mysql:8 --character-set-server=utf8mb4 --collation-server=utf8mb4_unicode_ci
```

## 1.6 mysql数据库操作

### 1.6.1 给远程用户赋权

**mysql> grant 权限1,权限2, … 权限n on 数据库名称.表名称 to 用户名@用户地址 identified by ‘连接口令’;**

权限1，权限2，… 权限n 代表 select、insert、update、delete、create、drop、index、alter、grant、references、reload、shutdown、process、file 等14个权限。

这里面就相当于平时运维给测试开的可能只有增，改，查的权限，可以通过该方法给不同的用户授权。

当 数据库名称、表名称 被 * .* 代替时，表示赋予用户操作服务器上所有数据库所有表的权限
用户地址可以是localhost，也可以是IP地址、机器名和域名。也可以用 ‘%’ 表示从任何地址连接
‘连接口令’ 不能为空，否则创建失败

> 举几个栗子

```sql
mysql> grant select,insert,update,delete,create,drop on daxiang.warning to coffee@106.54.20.23 identified by '123456';
给来自106.54.20.23的用户coffee分配可对数据库daxiang的warning表进行select,insert,update,delete,create,drop等操作的权限，并设定口令为123456。
mysql> grant all privileges on vtdc.* to coffee@10.163.225.87 identified by '123456';
给来自106.54.20.23的用户coffee分配可对数据库vtdc所有表进行所有操作的权限，并设定口令为123456。

mysql> grant all privileges on * .* to coffee@106.54.20.23identified by '123456';
给来自106.54.20.23的用户coffee分配可对所有数据库的所有表进行所有操作的权限，并设定口令为123456。

mysql> grant all privileges on * .* to coffee@localhost identified by '123456';
给本机用户coffee分配可对所有数据库的所有表进行所有操作的权限，并设定口令为123456。
GRANT ALL PRIVILEGES ON *.* TO 'root'@'%' WITH GRANT OPTION
mysql> flush privileges; //刷新配置
```





select host,user form user;



### 1.6.2 修改mysql 密码

- 第一步mysql容器
  docker exec -it 容器ID /bin/bash
- 第二步连接mysql
  mysql -uroot -p
  输入密码后，登录mysql终端
- 第三步修改密码
  SET PASSWORD FOR 'root' = PASSWORD('设置的密码');
- 第四步重启
  重启mysql容器即可 docker restart 容器ID



## 1.7 阿里OOS搭建

> <a href="http://tbm-auth.alicdn.com/e99361edd833010b/CzBmdPB98ApjaxDwzsS/QbVS89rXOFE9mpWkoSt_288903706440_hd_hq.mp4?auth_key=1641743972-0-0-eb9061d1c799050ecc0a574d89817a78">官方视频</a>







## 1.8 云服务器搭建内网穿透





## 1.9 Linux清理空间

https://blog.csdn.net/weixin_30872337/article/details/95295561?ops_request_misc=&request_id=&biz_id=102&utm_term=Linux%E7%A9%BA%E9%97%B4%E4%B8%80%E4%B8%8B%E6%B2%A1%E4%BA%86&utm_medium=distribute.pc_search_result.none-task-blog-2~all~sobaiduweb~default-2-95295561.142^v7^control,157^v4^control&spm=1018.2226.3001.4187



# 2. shell编程

2.shell脚本

### 2.1.1 任意地方执行shell脚本

1. 用解释程序将文件当成文本文件来执行

   ```css
   sh hello.sh
   ```

2. 将文本文件增加可执行权限

   ```css
   chmod + x hello.sh
   ```

​		关于执行的路径





- ./hello.sh  相对路径
- /root/hello.sh  绝对路径

3. 将shell脚本的路径加入到PATH环境变量中

4. 🚩加入到/bin/xxx

   ​	/sbin/xxx

   ​	/use/bin/xxx

   ​	/usr/sbin/xxx

   ![image-20220120143259363](https://cdn.fengxianhub.top/resources-master/202201201432527.png)







### 2.1.2 设置变量

直接设置:

```css
name=lfy
```

用echo $name输出变量



从键盘中读入变量(后面跟的变量要存在，name)：

```css
read -p "please input your name:" name
```

![image-20220120151734538](https://cdn.fengxianhub.top/resources-master/202201201517614.png)



#### 















## 附录-Linux命令速查表

<hr/>
<ol>
	<li><code>ip address</code>:查看IP地址</li>
    <li><code>nmtui</code>:开放网络(方便<code>shell</code>进行管理)</li>
    <li><code>who</code>:显示已登录用户,<code>-H</code>表示显示各列的标题,<code>-q</code>表示显示登录的用户名和用户数</li>
    <li><code>echo</code>:回显字符串,添加选项<code>-n</code>表示回显字符串后光标不换行</li>
    <li><code>date</code>:显示、设置系统日期和时间 常用<code> date '+%Y年 %m月 %d日 %T' </code>显示<code>2021年 09月 19日 12:09:57</code>格式的时间</li>
    <li><code>find</code>:查找<code>find / -name fengxian</code>表示在根目录下通过名字查找叫fengxian的文件</li>
    <li><code>set nu</code>:在vi里显示行编号</li>
    <li><code>cat</code>:将文件内容打印出来</li>
    <li><code>top</code>:实时查看当前进程（任务管理器）</li>
    <li><code>ps aux</code>:快照查看当前进程（任务管理器）</li>
    <li><code>kill -9 进程号</code>:鲨死一个进程</li>
    <li><code>pwd</code>:查看当前所处绝对路径</li>
    <li>springBoot项目运行命令：修改运行方式为nohup java -jar xxx.jar >/dev/null 2>&1 &即可。</li>
    <li><code>ctrl+c</code>:强制终止程序的执行；</li>
    <li><code>ctrl-z</code>:常用于挂起一个进程</li>
    <li><code>ps -U root -u root -N</code>:查看非root运行的进程</li>
    <li><code>ps -aux|grep natapp</code>:查看指定进程</li>
    <li><code>netstat  -anp  |grep  3306</code>:查看指定端口</li>
    <li><code>./natapp -authtoken=xxxxx</code>:开启natapp端口映射</li>
    <li><code>cat /etc/os-release</code>:查看系统版本信息</li>
    <li><code>getconf LONG_BIT</code>:查看操作系统位数（32位？64位？）</li>
    <li><code>nohup java-jar xxx.jar &</code>:在后台运行程序</li>
    <li><code>service mysqld status</code>:查看数据库启动情况</li>
    <li><code>service mysqld start</code>:启动数据库</li>
    <li><code>firewall-cmd --zone=public --add-port=3306/tcp --permanent</code>:开启3306端口</li>
</ol>
1. `du -a`显示当前目录下所有文件的大小，单位字节
2. `du -h`以人类可读的形式查看当前目录所有文件占用磁盘大小
3. `du -ah`显示当前目录各文件占用大小
3. `du -h -d1`只看当前一级文件



// 重载生效刚才的端口设置
firewall-cmd --reload

firewall常用命令如下：
常用命令介绍
firewall-cmd --state ##查看防火墙状态，是否是running
firewall-cmd --reload ##重新载入配置，比如添加规则之后，需要执行此命令
firewall-cmd --get-zones ##列出支持的zone
firewall-cmd --get-services ##列出支持的服务，在列表中的服务是放行的
firewall-cmd --query-service ftp ##查看ftp服务是否支持，返回yes或者no
firewall-cmd --add-service=ftp ##临时开放ftp服务
firewall-cmd --add-service=ftp --permanent ##永久开放ftp服务
firewall-cmd --remove-service=ftp --permanent ##永久移除ftp服务
firewall-cmd --add-port=80/tcp --permanent ##永久添加80端口
iptables -L -n ##查看规则，这个命令是和iptables的相同的
man firewall-cmd ##查看帮助



fg 前台
bg 后台
加上 & 表示后台运行

后台运行程序 fg 会转到前台来

前台正在运行的程序转到后台：
1，ctrl + z暂停程序并放置后台（注意程序未终止）
2，jobs -l 找到刚才程序的jobs号
3，bg %1；程序jobs号为1的就转到后台运行




防火墙：

1.查看端口号，比如8080 是否已开放。#firewall-cmd --query-port=80/tcp



如为no则该端口没有开放，若为yes则该端口已开放无需操作。

2. 添加端口：#firewall-cmd --zone=public --add-port=8080/tcp --permanent

3.重启firewall：#firewall-cmd --reload

4. 查询该端口是否添加成功： #firewall-cmd --query-port=80/tcp

 

以下为防火墙常用命令。

防火墙：

查询端口：firewall-cmd --query-port=80/tcp

添加端口：firewall-cmd --zone=public --add-port=80/tcp --permanent

查询开放端口：firewall-cmd --list-all

 

–zone #作用域

–add-port=80/tcp #添加端口，格式为：端口/通讯协议

–permanent #永久生效，没有此参数重启后失效

 

重启firewall：firewall-cmd --reload

停止firewall：systemctl stop firewalld.service

禁止firewall开机启动：systemctl disable firewalld.service



## 附录-centOS安装常用应用

1. <a href="https://blog.csdn.net/qq_36582604/article/details/80526287?ops_request_misc=&request_id=&biz_id=102&utm_term=centOS%20%E5%AE%89%E8%A3%85mysql&utm_medium=distribute.pc_search_result.none-task-blog-2~all~sobaiduweb~default-1-80526287.pc_search_result_control_group&spm=1018.2226.3001.4187">安装mysql57</a>
2. <a href="https://blog.csdn.net/qq_42815754/article/details/82968464?ops_request_misc=%257B%2522request%255Fid%2522%253A%2522163765424416780255223820%2522%252C%2522scm%2522%253A%252220140713.130102334..%2522%257D&request_id=163765424416780255223820&biz_id=0&utm_medium=distribute.pc_search_result.none-task-blog-2~all~top_positive~default-2-82968464.pc_search_result_control_group&utm_term=linux%E5%AE%89%E8%A3%85jdk&spm=1018.2226.3001.4187">安装jdk1.8</a>
2. mysql8：https://blog.csdn.net/u011421988/article/details/107234718

```java
yum install -y java-1.8.0-openjdk.x86_64
```







