# C#搭建项目过程

## 1. 新建WPF项目

>第一步：首先打开Visual Studio2019

![image-20220619160412368](https://cdn.fengxianhub.top/resources-master/202206191604826.png)

>第二步：选择WPF项目并创建

![image-20220619160719914](https://cdn.fengxianhub.top/resources-master/202206191607017.png)

>第三步：选择项目路径并命名

![image-20220619161025534](https://cdn.fengxianhub.top/resources-master/202206191610636.png)

## 2. 构建前端界面

一般我们是先写前端界面，再写后端逻辑，这里我以写一个登录界面为例演示一下

![image-20220619161548399](https://cdn.fengxianhub.top/resources-master/202206191615494.png)

>第一步，前端编码

```xaml
    <Grid>
        <!-- 定义几行,后面接每行的比例 -->
        <Grid.RowDefinitions>
            <RowDefinition Height="1*"/>
            <RowDefinition Height="4*"/>
        </Grid.RowDefinitions>
        <!-- 声明一个label，定义一些属性 HorizontalAlignment表示水平居中 -->
        <Label Content="登录界面" FontSize="24" HorizontalAlignment="Center" VerticalAlignment="Bottom"/>
        <!-- 第一行 -->
        <Grid Grid.Row="1" Margin="30">
            <!-- 在行里面定义列 -->
            <Grid.RowDefinitions>
                <!-- 这里是固定写法，定义三行，即在第一个大的行里面定义三个小行 -->
                <RowDefinition/>
                <RowDefinition/>
                <RowDefinition/>
            </Grid.RowDefinitions>
            <Grid>
                <!-- 第一行里面定义两列 -->
                <Grid.ColumnDefinitions>
                    <ColumnDefinition Width="60"/>
                    <ColumnDefinition/>
                </Grid.ColumnDefinitions>
                <Label Content="账号:" FontSize="16" HorizontalAlignment="Center" VerticalAlignment="Center"/>
                <!-- 这里是一个文本输入框 -->
                <TextBox Margin="53,20,7.6,19.6" FontSize="15"
                         Name="AccountId" Grid.ColumnSpan="2"/>
            </Grid>
            <Grid Grid.Row="1">
                <Grid.ColumnDefinitions>
                    <ColumnDefinition Width="60"/>
                    <ColumnDefinition/>
                </Grid.ColumnDefinitions>
                <Label Content="密码:" FontSize="16" HorizontalAlignment="Center" VerticalAlignment="Center"/>
                <!-- 密码框 -->
                <PasswordBox Margin="53,20,7.6,19.6" FontSize="15"
                             Name="passwordId" Grid.ColumnSpan="2"/>
            </Grid>
            <Grid Grid.Row="2">
                <!-- 定义一个按钮 -->
                <Border Margin="10,15" >
                    <!-- 给按钮绑定点击事件，函数写在当前文件的cs文件中 -->
                    <Button Content="登录" Click="ClickLoginBotton"/>
                </Border>
            </Grid>
        </Grid>
    </Grid>
```

这里中比较重要的是：

- 要熟悉WPF的布局方式
- 要记住常用的标签和标签的属性

***WPF的布局方式：***

![image-20220619162908693](https://cdn.fengxianhub.top/resources-master/202206191629807.png)



![image-20220619162920314](https://cdn.fengxianhub.top/resources-master/202206191629446.png)

我们把前端构建好后基本就是这个样子的：

![image-20220619163055762](https://cdn.fengxianhub.top/resources-master/202206191630828.png)

## 3. 后端逻辑编码

在前面的界面里面右击能进入后台逻辑的界面：

![image-20220619163252271](https://cdn.fengxianhub.top/resources-master/202206191632354.png)

![image-20220619163336318](https://cdn.fengxianhub.top/resources-master/202206191633433.png)

>在这里写后台的登录逻辑，首先我们要写导入一下新大陆云平台的SDK

![image-20220619163637642](https://cdn.fengxianhub.top/resources-master/202206191636699.png)

![image-20220619164112302](https://cdn.fengxianhub.top/resources-master/202206191641401.png)

>在本机里面找到两个`dll`文件

![image-20220619163952647](https://cdn.fengxianhub.top/resources-master/202206191639729.png)



![image-20220619163956140](https://cdn.fengxianhub.top/resources-master/202206191639220.png)

>添加好了就有这两个sdk文件了

![image-20220619163515795](https://cdn.fengxianhub.top/resources-master/202206191635847.png)

这里给出后台的逻辑代码：

```csharp
using NLECloudSDK;
using System;
using System.Windows;
/**
 * @author 梁峰源
 * @date 2021年8月3日18:25:14
 * 
 * 此类为登录界面，主要负责与新大陆云平台进行登录验证
 */
namespace QueuingMachine.View
{
    /// <summary>
    /// MainWindow.xaml 的交互逻辑
    /// </summary>
    public partial class LoginView : Window
    {
        private string Id, password;//用户名和密码
        public LoginView()
        {
            InitializeComponent();
            //设置屏幕居中
            WindowStartupLocation = WindowStartupLocation.CenterScreen;

        }
        /**
         * @param sender
         * @param RoutedEventArgs委托事件,参数列表中必须要有委托事件传入
         * 此方法为点击登录时进行登录逻辑的检测
         */
        private void ClickLoginBotton(object sender, RoutedEventArgs e)
        {
            Id = AccountId.Text.Trim();//获得当前用户框用户名并去除左右空格
            password = passwordId.Password.Trim();//获得当前密码框密码并去除左右空格
            //非空检测
            if (string.IsNullOrEmpty(Id))
            {
                MessageBox.Show("用户名不能为空", "消息提示");
                return;
            }
            if (string.IsNullOrEmpty(password))
            {
                MessageBox.Show("密码不能为空", "消息提示");
                return;
            }
            //账户名和密码检测
            try
            {
                //登录云平台,获取连接对象sdk
                var sdk = Commons.GetInstance();
                //获取登录实例
                Commons.accountLoginDTO = new AccountLoginDTO()
                {
                    //Account为新大陆云平台的账号，Password为账号
                    Account = Id,
                    Password = password
                };
                //通过登录实例获取一个ResultMsg集合
                var ResultMsg = sdk.UserLogin(Commons.accountLoginDTO);
                if (ResultMsg.IsSuccess())
                {
                    //登录成功，获取平台的登录凭证
                    Commons.mToken = ResultMsg.ResultObj.AccessToken;
                    if (string.IsNullOrEmpty(Commons.mToken))
                    {
                        ResultMsg.SetFailure("登录凭据 为空");
                        MessageBox.Show("登录凭据为空，登录失败，请检查新大陆云平台", "消息提示");
                    }
                    //登录成功，进行界面跳转
                    new MainView().Show();
                    //关闭当前窗口
                    this.Close();
                }
                else
                {
                    //登录失败，进行消息提示
                    MessageBox.Show("登录失败，请检查账号和密码", "消息提示");
                }
                
            }
            catch (Exception ex)
            {
                MessageBox.Show(ex.Message);
            }
        }
    }   
}

```

>这里我们将所有云平台的请求封装到一个公共类中

这里给出代码：

```csharp
using System;
using System.Net.Http;
using System.Text.Json;
using System.Threading.Tasks;
using System.Windows;
using NLECloudSDK;  //添加引用
using NLECloudSDK.Model;   //添加引用
/**
 * @author 梁峰源
 * @date 2021年8月3日18:50:13
 * 
 * 此类为工具类
 */
namespace QueuingMachine
{
    public class Commons
    {
        //#region为代码折叠器
        #region --字段（静态）--
        public static string api_HOST = "http://api.nlecloud.com";   // 云平台网址      
        public static NLECloudAPI cloudApi = new NLECloudAPI(api_HOST);  // 云平台API实例
        public static int ID_NUMBER = 313728;   //设备ID（排队机：queue0726）
        public static AccountLoginDTO accountLoginDTO = null;   //登录用户实例
        public static string mToken;   //登录凭据（登录成功后保存该凭据，后续操作需要使用）
        //获取唯一可用的对象
        #endregion
        public static NLECloudAPI GetInstance()
        {
            // 空合并运算符(??),用于定义可空类型和引用类型的默认值。如果此运算符的左操作数不为null，则此运算符将返回左操作数，否则返回右操作数
            return cloudApi ?? (cloudApi = new NLECloudAPI(api_HOST));
        }

        public static async Task<JsonDocument> Json2String()
        {
            HttpClient httpClient = new HttpClient();
            var client = httpClient;
            //采用异步的形式得到流数据
            var response = await client.GetStreamAsync("");
            var document = JsonDocument.ParseAsync(response);
            return await document;
        }
    }

}

```

这里需要你先在新大陆平台创建账号密码

- <a href="http://www.nlecloud.com/">新大楼平台</a>

- <a href="http://www.nlecloud.com/project/282695/tool/datasm">新大陆数据调试界面</a>

![image-20220619165219541](https://cdn.fengxianhub.top/resources-master/202206191652702.png)

>启动项目即可，大家可以去网上找一些视频看一下

## 4. LiveCharts插件的使用

>在比赛中会用到图标，所以这里图标的插件需要掌握的很熟练，当然图标插件有很多，我这里以LiveCharts为例

这里也提供一些参考文章：

**WPF图表控件DynamicDataDisplay（网友整理）：**

1、DynamicDataDisplay学习之路

 （1）使用步骤：https://blog.csdn.net/qq_40594137/article/details/86137145

 （2）xml中常用方法：https://blog.csdn.net/qq_40594137/article/details/86158150

 （3）后台常用参数方法：https://blog.csdn.net/qq_40594137/article/details/86139247

 2、WPF 动态模拟CPU 使用率曲线图

https://blog.csdn.net/niewq/article/details/50210559

3、WPF Chart DynamicDataDisplay的横坐标显示日期的解决方案

https://www.cnblogs.com/pigwing/archive/2010/11/22/1883832.html

4、WPF中DynamicDataDisplay的使用总结

https://www.cnblogs.com/shzt/p/9150984.html

5、WPF 使用DynamicDataDisplay 过程及获取x,y轴坐标

https://blog.csdn.net/kenjianqi1647/article/details/82314891

6、DynamicDataDisplay-源码示例（**靠谱**）

https://blog.csdn.net/qq_40594137/article/details/83583714

>LiveCharts插件的使用

![image-20220619165724183](https://cdn.fengxianhub.top/resources-master/202206191657255.png)

>第一步：装插件，本地地址为：你的路径\lib\net45 两个都选45！里面的dll文件，添加步骤前面提过这里不再赘述

添加成功后依赖里面就有了

![image-20220619165844841](https://cdn.fengxianhub.top/resources-master/202206191658911.png)

>第二步：应用声明

![xmlns : "http://schemas. mi crosoft. com/expression/blend/200S"  xmlns : mc="http://schemas. openxmlformats. org/markup-compatibi 1 i ty/2006"  c Il-namespace:--ivet-harts. /pt- : assembly=LiveCharts_ lipf"  (Gri d) ](data:image/png;base64,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)



>第三步：在WPF项目中添加图标，LiveChart的几种类型有

![image-20220619170043904](https://cdn.fengxianhub.top/resources-master/202206191700009.png)

![image-20220619170059183](https://cdn.fengxianhub.top/resources-master/202206191700305.png)



![image-20220619170111806](https://cdn.fengxianhub.top/resources-master/202206191701909.png)

![image-20220619170208657](https://cdn.fengxianhub.top/resources-master/202206191702761.png)

![image-20220619170230258](https://cdn.fengxianhub.top/resources-master/202206191702389.png)

![image-20220619170241434](https://cdn.fengxianhub.top/resources-master/202206191702563.png)

## 5. LiveCharts插件参考文章

参考文章：

- [https://blog.csdn.net/qq_23176133/article/details/86619080?ops_request_misc=%257B%2522request%255Fid%2522%253A%2522162821358016780264024819%2522%252C%2522scm%2522%253A%252220140713.130102334.pc%255Fall.%2522%257D&request_id=162821358016780264024819&biz_id=0&utm_medium=distribute.pc_search_result.none-task-blog-2~all~first_rank_v2~rank_v29-4-86619080.first_rank_v2_pc_rank_v29&utm_term=livechart&spm=1018.2226.3001.4187](https://blog.csdn.net/qq_23176133/article/details/86619080?ops_request_misc=%7B%22request%5Fid%22%3A%22162821358016780264024819%22%2C%22scm%22%3A%2220140713.130102334.pc%5Fall.%22%7D&request_id=162821358016780264024819&biz_id=0&utm_medium=distribute.pc_search_result.none-task-blog-2~all~first_rank_v2~rank_v29-4-86619080.first_rank_v2_pc_rank_v29&utm_term=livechart&spm=1018.2226.3001.4187)

- http://www.manongjc.com/detail/24-rcyzcnchzsewbux.html   //这篇文章写的很好！！

- https://blog.csdn.net/YouyoMei/article/details/102810081?ops_request_misc=&request_id=&biz_id=102&utm_term=livechart&utm_medium=distribute.pc_search_result.none-task-blog-2~all~sobaiduweb~default-7-.first_rank_v2_pc_rank_v29&spm=1018.2226.3001.4187

![image-20220619170349493](https://cdn.fengxianhub.top/resources-master/202206191703602.png) 