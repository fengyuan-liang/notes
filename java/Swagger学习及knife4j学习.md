# Swagger学习及knife4j学习

>Swagger简介

我们在进行<code>前后端分离开发</code>的时候需要可以自动生成接口文档的工具，解决我们的烦恼。那有这样的工具吗？

当然有！我们要使用的工具就是它，它是一个开源软件框架，由大型工具生态系统支持，可帮助开发人员设计，构建，记录和使用 `RESTful Web` 服务。开发人员只需要编写和更新 `Swagger`描述文件，`Swagger` 就会帮我们生成接口文档，并通过可视化的方式展现给我们。目前，越来越多的开发人员按照 `Swagger` 文档规范进行开发。

**Swagger的特点：**

- 号称世界上最流行的API框架
- Restful Api 文档在线自动生成器 => **API 文档 与API 定义同步更新**
- 直接运行，在线测试API
- 支持多种语言 （如：Java，PHP等）
- 官网：https://swagger.io/



## 1. Swagger使用

>不解释了直接在SpringBoot项目中上手

Swagger使用步骤：maven导入坐标依赖 => 写一个SwaggerConfiguration的配置类 => 使用Swagger注解 =>访问

### 1.1 引入坐标依赖

```xml

```

- Api
- ApiModel
- ApiModelProperty
- ApiOperation
- ApiParam
- ApiResponse
- ApiResponses
- ResponseHeader

### 1.2 常用注解使用

#### 1.2.1 Api

Api 用在类上，与Controller注解并列使用，说明该类的作用。可以标记一个Controller类做为swagger 文档资源，使用方式：

```java
@Api(tags = "小程序登录模块")
```

 属性配置：

|    属性名称    |                       描述                       |
| :------------: | :----------------------------------------------: |
|     value      |                   url的路径值                    |
|      tags      |        如果设置这个值、value的值会被覆盖         |
|  description   |                 对api资源的描述                  |
|    basePath    |                基本路径可以不配置                |
|    position    |       如果配置多个Api 想改变显示的顺序位置       |
|    produces    | For example, "application/json, application/xml" |
|    consumes    | For example, "application/json, application/xml" |
|   protocols    |      Possible values: http, https, ws, wss.      |
| authorizations |                高级特性认证时配置                |
|     hidden     |            配置为true 将在文档中隐藏             |

效果：

![image-20220125125436759](https://s2.loli.net/2022/01/25/y7fjx6caL8pid4P.png)

#### 1.2.1 ApiOperation标记

ApiOperation：用在方法上，与Controller中的方法并列使用，说明方法的作用，每一个url资源的定义,使用方式：





## 4. knife4j使用

### 4.1导入坐标依赖

```xml
<!-- knif4j -->
<dependency>
    <groupId>com.github.xiaoymin</groupId>
    <artifactId>knife4j-spring-boot-starter</artifactId>
    <version>2.0.9</version>
</dependency>
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-web</artifactId>
</dependency>
```













