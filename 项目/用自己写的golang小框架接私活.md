# 用自己写的golang小框架接私活

前段时间，写过一个很小的golang web框架，最近刚好接了个小私活，技术选型的时候毫不犹豫的选择了自己写的可能踩坑很多的小框架

技术选型：

- 服务端：golang
  - web框架：https://github.com/fengyuan-liang/jet-web-fasthttp
  - 其他：gorm、redis、oss
- 小程序端：uniapp + vue3
- 管理后台：react18 + antd

首先看下为什么选golang，其实主要原因是省内存，买个阿里99的服务器就能用，用java的话后续续费服务器会比较贵，我这里一共跑了三个后台程序，总内存占用不到`30MB`，可以说1.5G内存用不完根本用不完

![image-20240818210019127](https://cdn.fengxianhub.top/resources-master/image-20240818210019127.png)

然后小程序上线大概两周，使用非常丝滑。这2核2G的服务器起码应付个几千到1W用户应该不成问题

![image-20240818210229996](https://cdn.fengxianhub.top/resources-master/image-20240818210229996.png)

其中CICD使用github workflow进行，其实最后所有服务器成本加起来就`99/年`就够了（OSS很便宜忽略不计），但是维护成本肯定报价不止这些😜

## 1. 解决的问题

其实很多小项目单体服务就已经够了，所以我的小web框架就解决了两件事

- 简化路由配置：通过方法名作为路由，并且能将参数自动注入到方法列表，提供hook在注入前统一校验
- 依赖注入：web框架内置使用dig进行依赖注入，非常方便

最后看项目的结构非常清爽

```shell
├── config
│   └── config.go
├── controller
│   ├── common.go
│   ├── ctl_deduction.go
│   ├── ctl_evaluation.go
│   ├── ctl_order.go
│   ├── ctl_product.go
│   ├── ctl_wxpay.go
│   ├── mini_config.go
│   └── user.go
├── cron
│   └── cron.go
├── entity
│   ├── bo
│   ├── dto
│   ├── req
│   └── vo
├── main.go
├── middleware
│   └── auth.go
├── service
│   ├── svc_deduction.go
│   ├── svc_message.go
│   ├── svc_mini_config.go
│   ├── svc_order.go
│   ├── svc_order_evaluation.go
│   ├── svc_product.go
│   ├── svc_user.go
│   └── svc_wxpay.go
└── utils
    ├── util_wx.go
    └── util_wx_avatar.go
├── main.go
```

路由看起来也非常清爽

![image-20240818211349033](https://cdn.fengxianhub.top/resources-master/image-20240818211349033.png)

## 2. 开发效率

在项目0-1的过程，其实开发效率都很高，后续只要项目不会变大到无法控制，和spring-boot效率其实差不多

并且小框架最最最最重要的是，他只是一个路由框架，帮你做了一些参数解析的工作，完全没有引入任何复杂性的东西

## 3. 小结

最后的最后，发表下感慨，用自己写的小小小框架还能赚到一点点钱，还是有点爽的哈哈

