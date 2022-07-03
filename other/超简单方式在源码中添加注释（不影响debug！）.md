# 超简单方式在源码中添加注释（不影响debug！）

我们在阅读源码的时候，会想要在源码中添加一些自己的注释，但是往往会弹出`file is read only`，代码只读

最常用的方法是自己下载源代码然后在idea中设置代码的`Sourcepath`，然后就可以编辑了

但是这样的方法常常也有一些问题，例如：

- 如果改动了源码的位置，`debug`的时候会导致运行代码的行号和真正的jre中编译后的代码行号对应不上，不匹配的情况

- 如果要看复杂项目的源码（例如`Spring源码`），可能几十上百个源码包，难道一个一个这样去配
- 重启idea或者某些情况下`Sourcepath`的路径会重新切换会默认的地址，又得重新配

通过改源码资源位置的方法可以参考：<a href="https://blog.csdn.net/lpf463061655/article/details/103043615/?ops_request_misc=&request_id=&biz_id=102&utm_term=idea%E6%80%8E%E4%B9%88%E5%9C%A8%E6%BA%90%E7%A0%81%E4%B8%AD%E5%86%99%E6%B3%A8%E9%87%8A&utm_medium=distribute.pc_search_result.none-task-blog-2~all~sobaiduweb~default-3-103043615.142^v11^pc_search_result_control_group,157^v12^new_style&spm=1018.2226.3001.4187">idea中阅读jdk源码，并添加注释</a>

>这里介绍一种更加方便并且安全有效的办法：下载插件` Private Notes`

步骤：

1. 打开idea，选择Project->File->Settings  ->  Plugins  ->  Marketplace，搜索`Private Notes`，初始状态如下图

   ![image-20220530103530121](https://cdn.fengxianhub.top/resources-master/202205301035447.png)

2. 然后根据提升重启idea

3. 之后我们就可以开心的添加注释了！！！！

   - 在任何你想加注释的地方 按下`Alt + Enter`鼠标移出点击即可保存
   - 已有私人注释 按下`Alt + Enter`即可快速编辑
   - `Alt + p`可快速添加或者编辑私人注释
   - `Alt + o `展示私人注释的其它操作
   - 右键菜单*私人注释*查看操作

非常方便我们看源码！！！！！！😁😁😁😁😁

![image-20220530104833666](https://cdn.fengxianhub.top/resources-master/202205301048776.png)

