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

