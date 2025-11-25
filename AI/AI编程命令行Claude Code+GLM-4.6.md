# AI编程命令行Claude Code+GLM-4.6 

先看效果





我们来到Claude Code官网：https://code.claude.com/docs/zh-CN/overview#npm

推荐使用`NPM`方式进行安装，一行命令就可以安装完毕

```shell
$ npm install -g @anthropic-ai/claude-code
```



接下来我们用该平台接入大模型：https://bigmodel.cn/console/modelcenter/square

进入bigModel平台，选择你想要的模型

![image-20251219003842201](https://cdn.fengxianhub.top/resources-master/image-20251219003842201.png)

接下来复制你的key

![image-20251219003956860](https://cdn.fengxianhub.top/resources-master/image-20251219003956860.png)

然后设置环境变量，可以根据文档来操作：https://docs.bigmodel.cn/cn/guide/develop/claude

如果是unix平台比如macos可以在你常用shell下面设置

如果是win平台，需要打开环境变量进行设置，直接控制台搜索环境变量

```shell
"ANTHROPIC_AUTH_TOKEN": "your_zhipu_api_key",
"ANTHROPIC_BASE_URL": "https://open.bigmodel.cn/api/anthropic",
"API_TIMEOUT_MS": "3000000",
"CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC": 1
```

| <img src="https://cdn.fengxianhub.top/resources-master/image-20251219005002962.png" alt="image-20251219005002962" style="zoom: 25%;" /> | ![image-20251219004937549](https://cdn.fengxianhub.top/resources-master/image-20251219004937549.png) |
| ------------------------------------------------------------ | ------------------------------------------------------------ |

重新打开里的shell加载环境变量，然后输出就行了

```shell
# git bash shell
$ echo $ANTHROPIC_BASE_URL
https://open.bigmodel.cn/api/anthropic

# powershell 使用 $env: 前缀
PS C:\Users\Administrator> echo $env:API_TIMEOUT_MS
3000000
```

接下来你在某个目录下输入`claude`后，就可以进入终端了，然后设置你的一些设置即可

![image-20251219005851965](https://cdn.fengxianhub.top/resources-master/image-20251219005851965.png)

然后就可以通过文字来进行交流

![image-20251219010003731](https://cdn.fengxianhub.top/resources-master/image-20251219010003731.png)













```shell
https://api.weixin.qq.com/sns/oauth2/access_token?appid=wx8b9c7ada8e33a0c9&secret=a7db6deca7ff73652c33372165467951&code=061zOk0w3t6Kh63lAa3w3UKcCk0zOk0p&state=STATE#/&grant_type=authorization_code
```



















