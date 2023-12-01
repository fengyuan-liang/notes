# BootStrap



## 1. 主要内容

![image-20211109224703684](https://cdn.fengxianhub.top/resources-master/202111092247818.png)

## 2. BootStrap安装和使用

### 2.1 介绍

中文网站：https://www.bootcss.com/

​		Bootstrap是一套现成的CSS样式集合（做得还是很友好的)。是两个推特的员工干出来的。

​		Bootstrap是最受欢迎的HTML、CSS和JS框架，用于开发响应式布局、移动设备优先的WEB项目。

​		2011年，twitter的"一小撮"工程师为了提高他们内部的分析和管理能力，用业余时间为他们的产品构建了一套易用、优雅、灵活、可扩展的前端工具集--BootStrap。Bootstrap由MARK OTTO和Jacob Thornton所设计和建立，在github上开源之后，迅速成为该站上最多人watch&fork的项目。大量工程师踊跃为该项目贡献代码，社区惊人地活跃，代码版本进化非常快速，官方文档质量极其高(可以说是优雅)，同时涌现了许多基于Bootstrap建设的网站:界面清新、简洁;要素排版利落大方。

​		Bootstrap特别适合那种没有设计师的团队（甚至说没有前端的团队)，可以快速的出一个网页。

### 2.2 BootStrap特点

1. 简洁、直观、强悍的前端开发框架，html、css、javascript 工具集，让web开发更速、简单。
2. 基于html5、css3的bootstrap，具有大量的诱人特性:友好的学习曲线，卓越的兼容性，响应式设计，12列格网，样式向导文档。
3. 自定义JQuery 插件，完整的类库，bootstrap3基于Less，bootstrap4基于Sass的CSS预处理技术
4. Bootstrap响应式布局设计;让一个网站可以兼容不同分辨率的设备。Bootstrap响应式布局设计，给用户提供更好的视觉使用体验
5. 丰富的组件

### 2.3 使用栗子

```html
```



说明:

- 
   viewport 标记用于指定用户是否可以缩放Web页面

-  width和height 指令分别指定视区的逻辑宽度和高度。他们的值要么是以像素为单位的数字，要么是一个特殊的标记符号。
-  width指令使用device-width标记可以指示视区宽度应为设备的屏幕宽度。
-  height指令使用device-height标记指示视区高度为设备的屏幕高度。
-  initial-scae指令用于设置Web页面的初始缩放比例。默认的初始缩放比例值因智能手机浏览器的不同而有所差异。通常情况下设备会在览器中呈现出整个Web页面，设为1.0则将显示未经缩放的Web文档。



## 3. 布局容器和栅格网格系统

### 3.1布局容器

1、container类主要用户固定宽度并支持响应式布局的容器

```html
<div class="container">
...
</div>
```

2、.container-fluid类似于100%宽度，占据全部视口(viewport)的容器

 ```html
 <div class="container-fluid">
 ...
 </div>
 ```



### 3.2 栅格网格系统

​		Bootstrap提供了一套响应式、移动设备优先的流式栅格系统，随着屏幕或视口(viewport)尺寸的增加，系统会自动分为最多12列。栅格系统用于通过一系列的行（row）与列(column)的组合来创建页面布局，你的内容就可以放入这些创建好的布局中。

​		网格系统的实现原理非常简单，仅仅是通过定义容器大小，平分12份(也有平分成24份或32份，但12份是最常见的)，再调整内外边距，最后结合媒体查询，就制作出了强大的响应式网格系统。Bootstrap框架中的网格系统就是将容器平分成12份。

![image-20211110000240258](https://cdn.fengxianhub.top/resources-master/202111100002475.png)



注意：网格系统必须要引入



​		.container、row 、xs (xsmall phones)，sm (small tablets)，md (middle desktops)，Ig (larger desktops)	即:超小屏(自动)，小屏(750px)，中屏(970px)和大屏(1170px)

​		数据行(.row)必须包含在容器(.container)中，以便为其赋予合适的对齐方式和内距(padding)。

​		在行(.row)中可以添加列(.column),只有列(column)才可以作为行容器(.row)的直接子元素，但列数之和不能超过平分的总列数，比如12。如果大于12,则自动换到下一行。

​		具体内容应当放置在列容器(column)之内



#### 3.2.1 列组合

​		列组合简单理解就是更改数字来合并列（原则：**列总和树不能超过12，大于12则自动换到下一列**），有点类似于表格的colspan属性

```html
<div class="row">
    <!--行中有列元素-->
    <!--
        col-xs-数值:超小屏(自动)
        col-sm-数值:小屏(750px)
        col-md-数值:中屏(970px)  ->最常用!
        col-lg-数值:大屏(1170px)
-->
    <div class="col-md-4" style="background-color: pink">占四个网格</div>
    <div class="col-md-8" style="background-color:darkorange">占八个网格</div>
</div>
```



#### 3.2.2 列偏移（不会覆盖其他列）

​		如果我们不希望相邻的两个列紧靠在一起，但又不想使用margin或者其他的技术手段来。这个时候就可以使用列偏移（offset)功能来实现。使用列偏移也非常简单，只需要在列元素上添加类名"col-md-offset-*"(其中星号代表要偏移的列组合数)，那么具有这个类名的列就会向右偏移。例如，你在列元素上添加"col-md-offset-8"，表示该列向右移动8个列的宽度(要保证列与偏移列的总数不超过12，不然会致列断行|换行显示)。

```html
<div class="row">
    <!--列偏移-->
    <div class="col-md-2" style="background-color:darksalmon">占一个网格</div>
    <div class="col-md-2 col-md-offset-2" style="background-color: pink">列偏移两格</div>
    <div class="col-md-2" style="background-color:darkorange">占一个网格</div>
    <div class="col-md-2" style="background-color:azure">占一个网格</div>
    <div class="col-md-2" style="background-color:cornsilk">占一个网格</div>
</div>
```

#### 3.2.3 列排序（会覆盖其他列）

​		列排序其实就是改变列的方向，就是改变左右浮动，并且设置浮动的距离。在Bootstrap框架的网格系统中是通过添加类名col-md-push-*和col-md-pull-*(其中星号代表移动的列组合数)。往前pull，往后push。
​		列排序其实就是改变列的方向，就是改变左右浮动，并且设置浮动的距离.在Bootstrap框架的网格系统中是通过添加类名Col-Md-Push-*和Coll-Md-*(其中星号代表移动的列组合数)。往前拉，往后推。



#### 3.2.4 列嵌套

Bootstrap框架的网格系统还支持列的嵌套。你可以在一个列中添加一个或者多个行（row）容器，然后在这个行容器中插入列.

```html
<div class="row">
    <!--列嵌套-->
    <div class="col-md-8" style="background-color:darksalmon">
        <div class="row">
            <div class="col-md-1" style="background-color:wheat">1</div>
            <div class="col-md-1" style="background-color:darkgoldenrod">1</div>
            <div class="col-md-1" style="background-color:goldenrod">1</div>
            <div class="col-md-1" style="background-color:goldenrod">1</div>
            <div class="col-md-1" style="background-color:goldenrod">1</div>
        </div>
    </div>  
    <div class="col-md-4" style="background-color:saddlebrown">也嵌套</div>
</div>
```

#### 3.2.5 自适应布局

```html
<!--自适应列嵌套 屏幕大时，显示两列，屏幕小时显示四列-->
<div class="row">
    <div class="col-md-3 col-sm-6" style="background-color:wheat">1</div>
    <div class="col-md-3 col-sm-6" style="background-color:darkgoldenrod">1</div>
    <div class="col-md-3 col-sm-6" style="background-color:goldenrod">1</div>
    <div class="col-md-3 col-sm-6" style="background-color:goldenrod">1</div>
</div>
```



## 4. 常用样式

#### 4.1 排版

##### 4.1.1 标题

​		Bootstrap和普通的HTML页面一样，定义标题都是使用标签<h1>到<h6>,只不过Bootstrap覆盖了其默认的样式，使用其在所有浏览器下显示的效果一样。为了让非标题元素和标题使用相同的样式，还特意定义了.h1~.h6六个类名。同时后面可以紧跟着一行小的副标题<smal1></sma17>或使用.small

##### 4.1.2 段落

​		通过.lead 来突出强调内容（其作用就是增大文本字号，加粗文本，而且对行高和margin也做相应的处理）

<small>:小号字

<b><strong>：加粗

<i><em>:斜体

##### 4.1.3 强调

- text-muted 柔和 ，使用浅灰色(#999)

  <div style="background-color: #999;width: 300px;height: 10px"></div>

- text-primary 重要，使用蓝色（#428bca）

  <div style="background-color: #428bca;width: 300px;height: 10px"></div>

- text-success 成功，使用浅绿色（#3c763d）

  <div style="background-color: #3c763d;width: 300px;height: 10px"></div>

- text-info 提示，使用浅蓝色（#317086）

  <div style="background-color: #317086;width: 300px;height: 10px"></div>

- text-warning 警告，使用黄色（#8a6d3b）

  <div style="background-color: #8a6d3b;width: 300px;height: 10px"></div>

- text-danger 危险，使用褐色（#a94442）

  <div style="background-color: #a94442;width: 300px;height: 10px"></div>

##### 4.1.4 对齐效果

​		在CSS中常常使用text-align来实现文本的对齐风格的设置。

其中主要有四种风格:

|   名称   |       对齐效果        |
| :------: | :-------------------: |
|  左对齐  |   左对齐，取值left    |
| 居中对齐 | 居中对齐，取值center  |
|  右对齐  |   右对齐，取值right   |
| 两端对齐 | 两端对齐，取值justify |

##### 4.1.5 列表

- 无序列表（<ul><li></li></ul>）
- 有序列表（<ol><li></li></ol>）
- 定义列表（<dl><dt>...</dt><dd>...</dd></dl>）

第一种：内联列表

class="list-inline"，把垂直列表换成水平列表，而且去掉项目符号(编号），保持水平显示。也可以说内联列表就是为制作水平导航而生。

![image-20211110221905066](https://cdn.fengxianhub.top/resources-master/202111102219376.png)

##### 4.1.6 代码

一般在个人博客上使用的较为频繁，用于显示代码的风格。在Bootstrap主要提供了三种代码风格:

(1）使用<code></code>来显示单行内联代码

(2）使用<pre></pre>来显示多行块代码

- 样式: pre-scrollable (height,max-height高度固定,为340px,超过存在滚动条)
- 如果需要输出html代码需要使用字符实体（<用\&lt;）
- 代码太多是可以添加滚动条还可以使用 `.pre-scrollable` 类，其作用是设置 max-height 为 350px ，并在垂直方向展示滚动条

(3)使用<kbd></kbd>来显示用户输入代码,如快捷键

栗子：

![image-20211110224825703](https://cdn.fengxianhub.top/resources-master/202111102248844.png)

#### 4.2 表单

​		Bootstrap为表格提供了1种基础样式和4种附加样式以及1个支持响应式的表格。在使用Bootstrap的表格过程中，只需要添加对应的类名就可以得到不同的表格风格:

基础样式
1 ) .table:基础表格
	附加样式

1) table-striped:斑马线表概
2) table-bordered:带边框的表格
3) table-hover:鼠标悬停高亮的表格
4) table-condensed:紧凑型表格，单元格没内距或者内距较其他表格的内距小

##### 4.2.1表单控件

​	.form-control		.input-lg(较大)		.input-sm(较小)

###### 4.2.1.1 输入框text

​	.form-control	

```html
<!--文本框-->
<input type="text" class="form-control">
<!--文本框 较大-->
<input type="text" class="form-control input-lg">
<!--文本框 较小-->
<input type="text" class="form-control input-sm">
```

###### 4.2.1.2 下拉选择框 select option

.form-control

```html
<div class="col-md-3">
   <select class="form-control">
       <option value="">北京</option>
       <option value="">上海</option>
       <option value="">深圳</option>
       <option value="">广州</option>
    </select>
</div>
```

###### 4.2.1.3 文本域 textarea

.form-control

```html
<textarea class="form-control" placeholder="请输入文字"></textarea><br>
```

###### 4.2.1.4 复选框 checkbox

​		垂直显示	.checkbox

​		水平显示	.checkbox-inline

```html
<!--垂直显示-->
<!--其中在input标签外面加上lable标签的作用是在点击文字的时候也会选中或者取消，提高用户体验度-->
<div>
    <div class="checkbox">
        <label><input type="checkbox">游戏</label>
    </div>
    <div class="checkbox">
        <label><input type="checkbox">学习</label>
    </div>
</div>
<!--水平显示-->
<div>
    <label class="checkbox-inline">
        <input type="checkbox">游戏
    </label>
    <label class="checkbox-inline">
        <input type="checkbox">学习
    </label>
</div>
```

###### 4.2.1.4 单选框 radio

​		垂直显示	.radio

​		水平显示	.radio-inline

```html
<!--水平显示-->
<div>
    <label class="checkbox-inline">
        <input type="checkbox">游戏
    </label>
    <label class="checkbox-inline">
        <input type="checkbox">学习
    </label>
</div>
<div>单选框 checkbox</div>
<!--垂直显示-->
<div>
    <div class="radio">
        <label><input type="radio" name="sex" value="男生">男</label>
        <label><input type="radio" name="sex" value="女生">女</label>
    </div>
</div>
```

###### 4.1.2.6 按钮

![image-20211114141510792](https://cdn.fengxianhub.top/resources-master/202111141415051.png)



```html
<!--按钮-->
<button class="btn">按钮</button>
<button class="btn btn-danger">按钮</button>
<button class="btn btn-success">按钮</button>
<button class="btn btn-warning">按钮</button>
<button class="btn btn-primary">按钮</button>
<button class="btn btn-info">按钮</button>
<button class="btn btn-default">按钮</button>
<button class="btn btn-link">按钮</button>
<a href="javascript:void(0);" class="btn btn-success">a标签按钮</a>
<span class="btn btn-danger">span标签</span>
<div class="btn btn-info">div按钮</div>
```

#### 4.2.2表单布局

​		基本的表单结构是Bootstrap自带的，个别的表单控件自动接收一些全局样式。下面列出了创建基本表单的步骤:

- 向父<form>元素添加role="form"。
- 把标签和控件放在一个带有class .form-group的<div>中。这是获取最佳间距所必需的。
- 向所有的文本元素<input>、<textarea>和<select>添加class ="form-control"。

##### 4.2.2.1水平表单

​	同一行显示form-horizontal配合Bootstrap框架的网格系统

![image-20211114151825265](https://cdn.fengxianhub.top/resources-master/202111141518456.png)

```html
    <!--水平表单-->
    <form action="#" class="form-horizontal" role="form">
        <h2 style="text-align: center">用户信息表</h2>
        <!--表单中的表单元素组-->
        <div class="form-group">
            <label for="uName" class="control-label col-md-2 col-md-offset-2">姓名</label>
            <div class="col-md-4">
                <input type="text" id="uName" class="form-control" placeholder="请输入名字">
            </div>
        </div>
        <div class="form-group">
            <label for="pwd" class="control-label col-md-2 col-md-offset-2">密码</label>
            <div class="col-md-4">
                <input type="password" id="pwd" class="form-control" placeholder="请输入名字">
            </div>
        </div>
        <div class="form-group">
            <label for="pwd" class="control-label col-md-2 col-md-offset-2">爱好</label>
            <div class="col-md-4">
                <select class="form-control">
                    <option value="">北京</option>
                    <option value="">上海</option>
                    <option value="">深圳</option>
                    <option value="">广州</option>
                </select>
            </div>
        </div>
        <div class="form-group">
            <label for="pwd" class="control-label col-md-2 col-md-offset-2">爱好</label>
            <div class="col-md-2">
                <select class="form-control">
                    <option value="">北京</option>
                    <option value="">上海</option>
                    <option value="">深圳</option>
                    <option value="">广州</option>
                </select>
            </div>
            <div class="col-md-4">
                <div>
                    <label class="checkbox-inline">
                        <input type="checkbox">游戏
                    </label>
                    <label class="checkbox-inline">
                        <input type="checkbox">学习
                    </label>
                    <label class="radio-inline">
                        <input type="radio" name="hobby">游戏
                    </label>
                    <label class="radio-inline">
                        <input type="radio" name="hobby">学习
                    </label>
                </div>
            </div>
        </div>
        <div class="form-group">
            <label for="hobby" class="control-label col-md-2 col-md-offset-2">爱好</label>
            <div class="col-md-4">
                <textarea class="form-control" id="hobby" placeholder="请输入文字"></textarea>
            </div>
        </div>
        <div class="form-group">
            <div class="col-md-1 col-md-offset-5" style="position: relative;left: 60px">
                <button class="btn btn-success">提交</button>
            </div>
        </div>
    </form>
```



#### 4.3缩略图

​		缩略图在电商类的网站很常风，最常用的地方就是产品列表页面。缩略图的实现是配合网格系统一起使用。同时还可以让缩略图配合标题、描述内容，按钮等。







#### 4.4 面板





## 5. BootStrap插件

### 5.1 导航栏

1、基本样式:   .nav 与“nav-tabs”、“nav-pi71s”组合制作导航

2、分类:
	1)、标签型(nav-tabs)导航

​	2)、胶囊形(nav-pi11s)导航

​	3)、堆栈(nav-stacked)导航

​	4)、自适应(nav-justified)导航

​	5)、面包屑式(breadcrumb)导航，单独使用样式，不与nav一起使用,直接加入到o1、u1中即可，一般用于导航，主要是起的作用是告诉用户现在所处页面的位置（(当前位置)

```html
<p>标签式的导航菜单</p>
<ul class="nav nav-tabs"><!--改这里就好-->
    <li class="active"><a href="javascript:void(0)">Home</a></li>
    <li><a href="http://www.baidu.com">第一页</a></li>
    <li><a href="http://127.0.0.1">第二页</a></li>
    <li><a href="javascript:void(0)">第三页</a></li>
    <li><a href="javascript:void(0)">第四页</a></li>
    <li><a href="javascript:void(0)">第五页</a></li>
</ul>
```

3、状态:

​	1)、选中状态active样式

​	2)、禁用状态:disable4、二级菜单

<hr>

### 5.2 分页导航栏

分页随处可见，分为页码导航和翻页导航
页码导航: ul标签上加 pagination [pagination-lg | pagination-sm]
翻页导航: ul标签上加pager

```html
<ul class="pager">
    <li><a href="javascript:void(0)">上一页</a></li>
    <li><a href="javascript:void(0)">下一页</a></li>
</ul>
```

### 5.3 下拉菜单

此功能需要引入两个js文件

```html
<!--bootStrop依赖jQuery-->
<script src="js/jquery-3.1.0.min.js"></script>
<!--引入bootStrop的js文件-->
<script src="bootStrap/js/bootstrap.min.js"></script>
```

要点：

```html
1、使用一个类名为dropdown或btn-group的div 包裹整个下拉框:
<div class="dropdown"></div>
2、默认向下dropdown,向.上弹起加入。dropup即可
3、使用button作为父菜单，使用类名: dropdown-toggle 和自定义data-togg1 e属性
<button type="button" class="btn btn-default dropdown- toggle" data-toggle=" dropdown">
</button>
4、在button中使用font制作下拉箭头
<span class="caret"></span>
5、下拉菜单项使用一 个u1列表，并且定义一个类名为“dropdown-menu
6、分组分割线: <1i>添加类名“divider"来实现添加下拉分隔线的功能
7、分组标题: 1i 添加类名“dropdown-header” 来实现分组的功能
8、对齐方式:
    1)、dropdown-menu-1eft 左对齐 默认样式
    2)、dropdown-menu-ri ght
右对齐
9、激活状态(. active)和禁用状态(. disabled)
```

### 5.4 模态框

​		模态框(Modal) 是覆盖在父窗体.上的子窗体。通常,目的是显示来自一个单独的源的内容，可以在不离开
父窗体的情况下有一-些互动。子窗体可提供信息、交互等。

#### 5.4.1 用法

​	1. **通过data属性**:在控制器元素(比如按钮或者链接)上设置属性 data-toggle="modal",同时设置data-target="#identifier"或href=" #identifier"来指定要切换的特定的模态框(带有id="identifier")。

 2. **通过JavaScript**:使用这种技术，可以通过JavaScript来调用带有id="identifier"的模态框:

    $("#myModal").modal("show");

```html
<!-- 
1. 通过 data 属性：在控制器元素（比如按钮或者链接）上设置属性 data-toggle="modal"，
同时设置 data-target="#identifier" 或 href="#identifier" 来指定要切换的特定的模态框（带有 id="identifier"）。
2. 通过 JavaScript：使用这种技术，您可以通过简单的一行 JavaScript 来调用带有 id="identifier" 的模态框：
-->
<!-- 按钮触发模态框 -->
<button class="btn btn-primary btn-lg" data-toggle="modal" data-target="#myModal">开始演示模态框</button>
<!-- 第二种打开模态框的方法 -->
<button class="btn btn-primary" onclick="openModel()">第二种打开模态框的方法</button>
<!-- 模态框（Modal） -->
<div class="modal fade" id="myModal" tabindex="-1" role="dialog" aria-labelledby="myModalLabel" aria-hidden="true">
    <div class="modal-dialog">
        <div class="modal-content">
            <div class="modal-header">
                <button type="button" class="close" data-dismiss="modal" aria-hidden="true">&times;</button>
                <h4 class="modal-title" id="myModalLabel">模态框（Modal）标题</h4>
            </div>
            <div class="modal-body">在这里添加一些文本</div>
            <div class="modal-footer">
                <button type="button" class="btn btn-default" data-dismiss="modal">关闭</button>
                <button type="button" class="btn btn-primary">提交更改</button>
            </div>
        </div><!-- /.modal-content -->
    </div><!-- /.modal -->
</div>
<script type="text/javascript">
    function openModel(){

        $("#myModal").modal("show");
    }
</script>
```





















