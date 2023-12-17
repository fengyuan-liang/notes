# grpc学习和使用

>- <a href="http://doc.oschina.net/grpc?t=58008">grpc官方中文文档</a>

## 1. 安装protobuf
**mac**

```shell
brew info protobuf
brew install protobuf
```
**win**

下载地址：https://github.com/protocolbuffers/protobuf/releases/tag

### 验证
```shell
protoc --version
```
## 2. grpc-go

### 2.1 安装gRPC

```shell
go get google.golang.org/grpc
```
### 2.2 安装第三方依赖
```shell
go get -u google.golang.org/protobuf/proto
go install google.golang.org/protobuf/cmd/protoc-gen-go@latest
go install google.golang.org/grpc/cmd/protoc-gen-go-grpc@latest
# go get github.com/favadi/protoc-go-inject-tag
```

### 2.3 使用

#### 2.3.1 编写proto文件

```go
syntax = "proto3";
package pb_auth;
option go_package = "./pb_auth;pb_auth";

enum PLATFORM_TYPE {
  UNKNOWN_PLATFORM_TYPE = 0;
  IOS = 1;
  ANDROID = 2;
  MAC = 3;
  WINDOWS = 4;
  WEB = 5;
}

message SignUpReq {
  PLATFORM_TYPE reg_platform = 1; // 注册平台
  string nickName = 2; // 昵称
  string password = 3; // 密码
  string firstName = 4;
  string lastName = 5;
  int32 gender = 6;
  int64 birth_ts = 7; // 生日
  string email = 8;
  string mobile = 9;
  string avatar = 10; //头像url
  int64 city_id = 11; // 城市ID
  int64 code = 12; // 验证码
  string uuid = 13;
  int64 server_id = 14; // 服务器编号
}

message SignUpResp {
  int32 code = 1;
  string msg = 2;
  UserInfo user_info = 3;
  Token access_token = 4;
  Token refresh_token = 5;
}

message UserInfo {
  string nickName = 1;
  string firstName = 2;
  string lastName = 3;
  int32 gender = 4;
  int64 birth_ts = 5;
  string email = 6;
  string mobile = 7;
}

message Token {
  // @inject_tag:json:"token"
  string token = 1;
  // @inject_tag:json:"expire"
  int64 expire = 2;
}

service Auth {
  rpc SignUp(SignUpReq) returns(SignUpResp);
}
```

#### 2.3.2 生成脚本

```go
protoc --go_out=. --go_opt=paths=source_relative \
       --go-grpc_out=. \
       --go-grpc_opt=paths=source_relative \
       *.proto
```

#### 2.3.3 server端

```go
package main

import (
	"context"
	"fmt"
	"google.golang.org/grpc"
	"lark/examples/pb_auth"
	"net"
)

func main() {
	authServer := new(AuthServer)
	authServer.Run()
}

type AuthServer struct {
	pb_auth.UnimplementedAuthServer
}

func (s *AuthServer) Run() {
	var (
		listener net.Listener
		server   *grpc.Server
		err      error
	)
	// 传入一个监听
	listener, err = net.Listen("tcp", ":8081")
	if err != nil {
		panic(err)
	}
	server = grpc.NewServer()
	pb_auth.RegisterAuthServer(server, s)
	err = server.Serve(listener)
	if err != nil {
		fmt.Println(err.Error())
	}
}

func (s *AuthServer) SignUp(ctx context.Context, req *pb_auth.SignUpReq) (resp *pb_auth.SignUpResp, err error) {
	fmt.Println(req.NickName)
	resp = new(pb_auth.SignUpResp)
	resp.Msg = "注册成功"
	return
}
```

#### 2.3.4 client端

```go
package main

import (
	"context"
	"fmt"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"
	"lark/pkg/proto/pb_auth"
)

func main() {
	req := &pb_auth.SignUpReq{
		Nickname: "张三",
	}
	conn, err := grpc.Dial("127.0.0.1:8081", grpc.WithTransportCredentials(insecure.NewCredentials()))
	if err != nil {
		panic(err)
	}
	defer conn.Close()
	client := pb_auth.NewAuthClient(conn)
	var resp *pb_auth.SignUpResp
	resp, err = client.SignUp(context.Background(), req)
	if err != nil {
		panic(err)
	}
	if resp == nil {
		return
	}
	fmt.Println(resp)
}

```

## 附录 golang原生RPC使用

### server

```go
package main

import (
	"fmt"
	"net"
	"net/rpc"
)

func main() {
	// 1. 注册RPC服务
	err := rpc.RegisterName("goods", new(Goods))
	if err != nil {
		fmt.Println(err.Error())
		return
	}
	// 2. 监听端口
	listen, err2 := net.Listen("tcp", "127.0.0.1:8020")
	if err2 != nil {
		return
	}
	defer listen.Close()

	for {
		conn, err3 := listen.Accept()
		fmt.Printf("有连接上来了，他是:[%v]\n", conn.RemoteAddr().String())
		if err3 != nil {
			return
		}
		rpc.ServeConn(conn)
        // 可以自定义编码格式 例如json格式
		rpc.ServeCodec(jsonrpc.NewServerCodec(conn))
	}
}

type Goods struct {
	Name string `json:"name"`
}

type AddGoodsArgs struct {
	Good Goods
}

type AddGoodsReply struct {
	Code   int
	Result string
}

type GetGoodsArgs struct {
}

type GetGoodsReply struct {
	Result string
}

// AddGoods 调用方法的签名是强制的
func (g *Goods) AddGoods(args *AddGoodsArgs, reply *AddGoodsReply) (err error) {
	// 添加商品逻辑
	fmt.Printf("add good: %+v\n", args.Good)
	reply.Result = "add success"
	reply.Code = 200
	return
}

func (g *Goods) GetGoods(args *GetGoodsArgs, reply *GetGoodsReply) error {
	// 获取商品逻辑
	reply.Result = "you got good"
	return nil
}

```

### client

```go
import (
	"fmt"
	"net/rpc"
	"testing"
)

func main() {
    // 自定义解码这里改为net.Dial
	// conn, err := net.Dial("tcp", "127.0.0.1:8020")
	conn, err := rpc.Dial("tcp", "127.0.0.1:8020")
	if err != nil {
		fmt.Println(err.Error())
		return
	}

	defer conn.Close()

	// 调用远程函数

	// 1. 第一个参数 hello.SayHello  hello表示服务名称 SayHello方法名称
	// 2. 第二个参数 给服务端的req传递数据
	// 3. 第三个参数 需要传入地址 获取服务返回的参数
	var reply AddGoodsReply
    // 自定义解码 使用client.Call
	//client := rpc.NewClientWithCodec(jsonrpc.NewClientCodec(conn))
	err = conn.Call("goods.AddGoods", AddGoodsArgs{Good: Goods{Name: "商品1001"}}, &reply)
	if err != nil {
		fmt.Println(err.Error())
		return
	}
	// 获取响应
	fmt.Printf("reply:%v\n", reply)
}
```

