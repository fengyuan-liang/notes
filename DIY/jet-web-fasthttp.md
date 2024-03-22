# Jet 🛩

一款和gin不太一样的golang web服务器

## Overview

- 异常简洁的路由规则，再也不用像gin一样写繁琐的路由，并且自动解析参数
- 依赖注入 & 依赖倒置 & 开闭原则
- 集成 fasthttp
- 更加细粒度的Hook支持
- DDD & 六边形架构
- CQS & 聚合根
- 一级缓存 & 二级缓存 & 防击穿（暂未实现）
- 集成普罗米修斯（暂未实现）
- AOP 集成（暂未实现）

## usage

```go
go get github.com/fengyuan-liang/jet-web-fasthttp
```

## 使用说明

```go
// 在Jet中 路由是挂载在Controller上的，通过Controller进行路由分组
type jetController struct{}

var bootTestLog = xlog.NewWith("boot_test_log")

func TestJetBoot(t *testing.T) {
	jet.Register(&jetController{})
	t.Logf("err:%v", jet.Run(":8080"))
}

// ----------------------------------------------------------------------

// 参数解析完成之后的hook，您可以使用它对参数进行校验，例如使用`validated`进行
func (j *jetController) PostParamsParseHook(param any) error {
	if err := utils.Struct(param); err != nil {
		return errors.New(utils.ProcessErr(param, err))
	}
	return nil
}

func (j *jetController) PostMethodExecuteHook(param any) (data any, err error) {
  // 你可以通过controller方法执行完后的hook来restful方式的处理返回结果
	return utils.ObjToJsonStr(param), nil
}

// curl http://localhost:8080/v1/usage/111/week  =>  {"code":401,"data":{},"msg":"bad token"}
// if add -H "Authorization: <your_token_here>"  =>  {"code":200,"data":{},"msg":"msg"}
func (j *jetController) PreMethodExecuteHook(ctx context.Ctx) (err error) {
	if authorizationHeader := string(ctx.Request().Header.Peek("Authorization")); authorizationHeader == "" {
		ctx.Response().SetStatusCode(401)
		errInfo := map[string]any{"code": 401, "data": ctx.Keys(), "msg": "bad token"}
		err = errors.New(utils.ObjToJsonStr(errInfo))
	}
	return
}

// ----------------------------------------------------------------------

// 我们会尽可能的找到您需要的参数并将参数注入到您的结构体参数中
type req struct {
	Id   int    `json:"id" validate:"required" reg_err_info:"cannot empty"`
	Name string `json:"name" validate:"required" reg_err_info:"cannot empty"`
}

func (j *jetController) PostV1UsageContext(ctx jet.Ctx, req *req) (map[string]any, error) {
	ctx.Logger().Info("GetV1UsageContext")
	ctx.Logger().Infof("req:%v", req)
	ctx.Put("request uri", ctx.Request().URI().String())
	ctx.Put("traceId", ctx.Logger().ReqId)
	ctx.Put("req", req)
	return ctx.Keys(), nil
}


func (j *jetController) GetV1UsageContext0(ctx Ctx, args *context.Args) (map[string]any, error) {
	ctx.Logger().Info("GetV1UsageContext")
	ctx.Put("request uri", ctx.Request().URI().String())
	ctx.Put("traceId", ctx.Logger().ReqId)
	ctx.Put("args", args)
	return map[string]any{"code": 200, "data": ctx.Keys(), "msg": "ok"}, nil
}

func (j *jetController) GetV1UsageWeek0(args *context.Args) error {
	bootTestLog.Infof("GetV1UsageWeek %v", *args)
	return errors.New(utils.ObjToJsonStr(args.CmdArgs))
}

type Person struct {
	Name string `json:"name"`
	Age  int    `json:"age"`
}

func (j *jetController) GetV1Usage0Week(args *context.Args) (*Person, error) {
	//bootTestLog.Infof("GetV1Usage0Week %v", *args)
	return &Person{
		Name: "张三",
		Age:  18,
	}, nil
}

func (j *jetController) GetV1UsageWeek(args string) (map[string]string, error) {
	bootTestLog.Info("GetV1UsageWeek", args)
	return map[string]string{"args": args}, nil
}

func (j *jetController) GetV1UsageWeekk0(args *context.Args) error {
	bootTestLog.Infof("GetV1UsageWeekk0 %v", *args)
	return errors.New(utils.ObjToJsonStr(args.CmdArgs))
}

```

我们注意到，`UserController`的方法比较有意思，叫`GetV1UsageWeek`，其实这代表着我们有一个接口`v1/usage/week`已经写好了，请求方式为`Get`，我们请求的参数会自动注入到`r *Args`中

```shell
$ curl http://localhost/v1/usage/week?form_param1=1
{"request_id":"ZRgQg3Osptrx","code":200,"message":"success","data":"1"}
```

如果想要定义`v1/usage/week/1`的形式，或者`v1/usage/1/week`，我们可以使用`0`或其他符号填充名字

```go
GetV1UsageWeek0 -> v1/usage/week/1 // 0的位置表示要接受一个可变的参数
GetV1Usage0Week -> v1/usage/1/week
```

参数会默认注入到`CmdArgs`中

```go
func (u *UserController) GetV1Usage0Week(r *Args, env *rpc.Env) (*api.Response, error) {
	return api.Success(xlog.GenReqId(), r.CmdArgs), nil
}
```

```shell
$ curl http://localhost/v1/usage/1/week
{"request_id":"H5OQ4Jg0yBtg","code":200,"message":"success","data":["1"]}
```

### example

```go
func main() {
	//jet.Register(&DemoController{})
	xlog.SetOutputLevel(xlog.Ldebug)
	jet.AddMiddleware(jet.TraceJetMiddleware)
	jet.Run(":8080")
}

func init() {
	jet.Provide(NewDemoController)
}

func NewDemoController() jet.ControllerResult {
	return jet.NewJetController(&DemoController{})
}

type BaseController struct {
	jet.IJetController
}

func (BaseController) PostParamsParseHook(param any) error {
	if err := utils.Struct(param); err != nil {
		return errors.New(utils.ProcessErr(param, err))
	}
	return nil
}

// PostMethodExecuteHook restful
func (BaseController) PostMethodExecuteHook(param any) (data any, err error) {
	// restful
	return utils.ObjToJsonStr(param), nil
}

type DemoController struct {
	BaseController
}

type Person struct {
	Name string `json:"name"`
	Age  int    `json:"age"`
}
// 路由 get /v1/usage/{id}/week 已经可以访问了
func (j *DemoController) GetV1Usage0Week(ctx jet.Ctx, args *jet.Args) (*Person, error) {
	ctx.Logger().Infof("GetV1Usage0Week %v", *args)
	return &Person{
		Name: "张三",
		Age:  18,
	}, nil
}
```

## 更新计划

### 1. Hook

#### 1.1 参数相关

- [x] 支持通过挂载hook对参数进行预解析、自定义参数校验规则（目前支持hook有）
  - [x] PostParamsParseHook
  - [x] PostRouteMountHook
  - [x] PostMethodExecuteHook
  - [x] PreMethodExecuteHook
- [x] 添加hook注入自定义的`context`，便于进行鉴权以及链路追踪等操作

### 2. 🤡Aspect（切面）支持

#### 2.1 常规切面

- [ ] 前置、后置、异常、环绕、最终五种切面

### 3. 路由策略

- [ ] 通过controller自定义路由前缀

### 4. 依赖注入支持

在Jet中，依赖注入（inject）是非常核心的概念，Jet中几乎所有的功能都通过依赖注入完成（Jet底层基于`dig`进行依赖注入实现）

例如我们可以向`Jet`中提供`JetController`，`Jet`会自动获取到并且解析路由

```go
type jetController struct {
	inject.IJetController
}

func NewDemoController() inject.JetControllerResult {
	return inject.NewJetController(&jetController{})
}

func main() {
  xlog.SetOutputLevel(xlog.Ldebug)
	//Register(&jetController{})
  // 通过依赖注入的方式，注册controller并启动
	jet.Provide(NewDemoController)
	jet.Run(":8080")
}
```

Jet推荐将依赖注入贯穿整个程序的开发周期，包括`MVC`架构下的`repo`、`service`、`controller`，或者`DDD`架构下的`domain`

可以使用下面的方式并结合`init`方法，进行自动注入到`Jet`中，并且维护整个程序的生命周期

```go
package main

import (
	_ "xxx/apps/xxx/internal/component"
	_ "xxx/apps/xxx/internal/controller"
	_ "xxx/apps/xxx/internal/server"
	_ "xxx/domain/repo"
)

func main() {
	jet.Run(":8080")
}
```

在其他领域层，我们需要将组件注册到`Jet`中

```go
// xxxController.go

func init() {
  // provide your 
  jet.Provide(NewXxxController)
}

type XxxController struct {
  xxxRepo repo.XxxRepo
}

func NewXxxController(xxxRepo repo.XxxRepo) jet.ControllerResult {
  return jet.NewJetController(&jetController{
    xxxRepo: xxxRepo
  })
}
```

### 5. 中间件支持

`Jet`对于中间件的支持极其简单粗暴、明了；当我们添加多个中间件时，jet会从内到外进行执行，也就是后添加的先执行，后添加的后执行

#### 日志中间件

```go
func main() {
	jet.Register(&jetController{})
	jet.AddMiddleware(TraceJetMiddleware)
	jet.Run(":8080")
}

func TraceJetMiddleware(next router.IJetRouter) (router.IJetRouter, error) {
	return JetHandlerFunc(func(ctx *fasthttp.RequestCtx) {
		defer utils.TraceHttpReq(ctx, time.Now())
		next.ServeHTTP(ctx)
	}), nil
}
```

当请求发起

```shell
$ ➜  ~ curl http://localhost:8080/v1/usage/week/111
["111"]%
```

我们能够非常直观的观察输出

```shell
2024/01/04 16:31:55.379274 [jet][INFO] | 200 | | GET | /v1/usage/week/111 | elapsed [2.00150788s]
```

当调用失败返回error时，后续的中间件将不再执行

#### recover中间件

可以使用`Jet`提供的默认的中间件

```go
func main() {
  jet.AddMiddleware(RecoverJetMiddleware)
  jet.Run(":8080")
}

```

`Jet`会返回`Internal Server Error`，http code为`500`

![image-20240105110436328](https://cdn.fengxianhub.top/resources-master/image-20240105110436328.png)

当然您也可以自定义您自己的中间件，但是要注意的是，中间件是后添加的后执行，先添加的先执行，为了避免`recover`中间件对其他中间件逻辑产生干扰，`Jet`建议您将中间件添加到第一个的位置

```go
// 如果返回 xxx, err，后续的中间件将不再执行
func RecoverJetMiddleware(next router.IJetRouter) (router.IJetRouter, error) {
	return JetHandlerFunc(func(ctx *fasthttp.RequestCtx) {
		defer func() {
			if err := recover(); err != nil {
				handler.FailServerInternalErrorHandler(ctx, "Internal Server Error")
				utils.PrintPanicInfo("Your server has experienced a panic, please check the stack log below")
				debug.PrintStack()
			}
		}()
		next.ServeHTTP(ctx)
	}), nil
}
```

### 6. benchmark

```shell
$ ab -c 400 -n 20000 http://localhost:8081/v1/usage/1111/week
This is ApacheBench, Version 2.3 <$Revision: 1879490 $>
Copyright 1996 Adam Twiss, Zeus Technology Ltd, http://www.zeustech.net/
Licensed to The Apache Software Foundation, http://www.apache.org/

Benchmarking localhost (be patient)
Completed 2000 requests
Completed 4000 requests
Completed 6000 requests
Completed 8000 requests
Completed 10000 requests
Completed 12000 requests
Completed 14000 requests
Completed 16000 requests
Completed 18000 requests
Completed 20000 requests
Finished 20000 requests


Server Software:        JetServer
Server Hostname:        localhost
Server Port:            8081

Document Path:          /v1/usage/1111/week
Document Length:        76 bytes

Concurrency Level:      400
Time taken for tests:   1.661 seconds
Complete requests:      20000
Failed requests:        0
Total transferred:      4060000 bytes
HTML transferred:       1520000 bytes
Requests per second:    12041.08 [#/sec] (mean)
Time per request:       33.220 [ms] (mean)
Time per request:       0.083 [ms] (mean, across all concurrent requests)
Transfer rate:          2387.05 [Kbytes/sec] received

Connection Times (ms)
              min  mean[+/-sd] median   max
Connect:        0    0   0.2      0       1
Processing:     8   33   2.4     33      39
Waiting:        1   17   8.8     17      37
Total:          8   33   2.4     33      39

Percentage of the requests served within a certain time (ms)
  50%     33
  66%     33
  75%     34
  80%     34
  90%     35
  95%     36
  98%     37
  99%     38
 100%     39 (longest request)
```

二进制文件占用`14MB`，压测内存占用`6MB`

![image-20240104182950530](https://cdn.fengxianhub.top/resources-master/image-20240104182950530.png)

![image-20240104183001418](https://cdn.fengxianhub.top/resources-master/image-20240104183001418.png)

### 其他更新

**2023/12/18**

请求计时中间件，see`jet.TraceJetMiddleware`

![image-20231218173140763](https://cdn.fengxianhub.top/resources-master/image-20231218173140763.png)
