# GoLang 百万级并发IM系统

## 1. 概述

实现的功能有：

**基本功能**

- 单聊、群聊发送文字、表情、图片、语音、视频等等
- 访客模式，点对点私聊，广播，机器人等
- 心跳检测下线
- 快捷回复
- 撤回消息
- 拉黑、删除

**高阶功能**

- 语音房、直播房

**技术栈**

- gin、gorm、swagger、logrus auth等中间件

**系统架构**

![image-20230127203340881](https://cdn.fengxianhub.top/resources-master/image-20230127203340881.png)

**网络架构**

![image-20230127203730304](https://cdn.fengxianhub.top/resources-master/image-20230127203730304.png)

**消息发送流程**

![image-20230127204251309](https://cdn.fengxianhub.top/resources-master/image-20230127204251309.png)

## 2. 项目架构

```java
├── common 
│   ├── bizError // 异常封装
│   └── driverUtil // 驱动相关
│       ├── mongoHelper
│       └── mysqlHepler
├── config // 配置文件
├── models // 实体类
├── router // 路由
├── service
├── sql
├── test // 单元测试
└── utils // 工具类
```









