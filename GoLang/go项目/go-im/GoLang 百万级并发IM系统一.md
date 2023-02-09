# GoLang 百万级并发IM系统一

这一节我们要搭建基本的项目框架

## 1. 初始化项目

我们首先在github上创建一个仓库

![image-20230128152132062](https://cdn.fengxianhub.top/resources-master/image-20230128152132062.png)

添加`readme、ignore`文件后拉取到本地，初始化项目和依赖（或者也可以本地创建并上传）

```go
go mod init 你的项目名字
go mod tidy
```

接下来我们将项目的目录建好

```go
├── common
│   ├── bizError // 异常封装
│   └── driverUtil // 驱动相关
│       ├── mongoHelper
│       └── mysqlHepler
├── config // 配置文件
├── models // 数据库表映射和操作
├── router // 路由
├── service
├── sql
│   └── daoEntity
├── test // 单元测试
└── utils // 工具类
└── main.go // 启动入口
```

### 1.1 封装异常

我们在common目录下建一个bizError目录，创建`BaseError.go`

```go
package bizError

import (
	"fmt"
	"time"
)

type BizErrorer interface {
	BizError() string
	ErrorMsg() string
	ErrorTime() time.Time
}

// BizError 自定义错误
type BizError struct {
	when time.Time
	what string
}

const FORMAT_DATA = "2006/01/02 15:04.000" // 标准格式化时间

// 绑定一个方法
func (bizError *BizError) Error() string {
	return fmt.Sprintf("异常时间:【%v】，异常提示:【%v】", bizError.when.Format(FORMAT_DATA), bizError.what)
}

// ErrorMsg 只返回错误信息本身
func (bizError *BizError) ErrorMsg() string {
	return bizError.what
}

func (bizError *BizError) ErrorTime() time.Time {
	return bizError.when
}

// BizError 绑定自定义异常进行区分
func (bizError *BizError) BizError() string {
	return bizError.Error()
}

// NewBizError 产生一个异常
func NewBizError(errMsg ...string) BizErrorer {
	return &BizError{when: time.Now(), what: func() string {
		var totalMsg = ""
		if len(errMsg) <= 1 {
			return errMsg[0]
		}
		for _, msg := range errMsg {
			totalMsg += msg
		}
		return totalMsg
	}()}
}
```

## 2. 引入中间件

这里我们需要引入`gorm、gin、swagger`

### 2.1 引入gorm

我们这里使用的是mysql，需要先创建一个数据库

```sql
# create db
create database if not EXISTS gin_chat
    default character set utf8
    default collate utf8_general_ci;
```

**导包**

```go
go get -u gorm.io/gorm
go get -u gorm.io/driver/mysql
```

**数据库配置文件**

我们在config目录下创建配置文件`application.yml`，再创建一个`configStruct.go`文件用来存放解析的配置文件

```yml
db:
  mysql:
    USER_NAME: your USER_NAME
    PASSWORD: your 
    URL: your url
    PORT: your
    DB_NAME: "gin_chat"
```

#### 2.1.1 viper解析配置文件

我们可以直接通过以下方式拿到配置

```go
vip = viper.New()
vip.AddConfigPath(path + "/config") //设置读取的文件路径
vip.SetConfigName("application")    //设置读取的文件名
vip.SetConfigType("yaml")           //设置文件的类型
//尝试进行配置读取
if err := vip.ReadInConfig(); err != nil {
  panic(err)
}
if err != nil {
  log.Fatal("配置文件初始化失败，info：", err)
}
vip.GetString("db.mysql.USER_NAME") // your USER_NAME
```

但是这种方式不够优雅，所以我们需要封装一个结构体来存储解析好的配置文件

在`utils`目录下新建`systemInit.go`文件

```go
package utils

import (
	"github.com/spf13/viper"
	"log"
	"os"
)

// @Description: 系统初始化相关
// @Version: 1.0.0
// @Date: 2023/01/27 22:25
// @Author: fengyuan-liang@foxmail.com

var vip *viper.Viper

func init() {
	InitConfig()
}

// InitConfig 读取config.yml中的配置文件
func InitConfig() *viper.Viper {
	//获取项目的执行路径
	path, err := os.Getwd()
	if err != nil {
		panic(err)
	}
	vip = viper.New()
	vip.AddConfigPath(path + "/config") //设置读取的文件路径
	vip.SetConfigName("application")    //设置读取的文件名
	vip.SetConfigType("yaml")           //设置文件的类型
	//尝试进行配置读取
	if err := vip.ReadInConfig(); err != nil {
		panic(err)
	}
	if err != nil {
		log.Fatal("配置文件初始化失败，info：", err)
	}
	return vip
}

// GetOrDefaultViper 获取解析到的viper
func GetOrDefaultViper() *viper.Viper {
	if vip == nil {
		vip = InitConfig()
	}
	return vip
}
```

再在config目录下的`configStruct.go`文件中写上封装的代码

```go
package config

import (
	"go-im/utils"
)

// @Description: 配置文件映射结构体
// @Version: 1.0.0
// @Date: 2023/01/27 23:22
// @Author: fengyuan-liang@foxmail.com

// ConfigStruct 配置文件映射实体类
type ConfigStruct struct {
	Db DBConfig `yaml:"db"`
}

// DBConfig 映射yml配置文件结构体
type DBConfig struct {
	Mysql   BaseDBStruct `yaml:"mysql"`
}

type BaseDBStruct struct {
	DRIVER_NAME   string `yaml:"DRIVER_NAME"`
	USER_NAME     string `yaml:"USER_NAME"`
	PASSWORD      string `yaml:"PASSWORD"`
	URL           string `yaml:"URL"`
	PORT          string `yaml:"PORT"`
	DB_NAME       string `yaml:"DB_NAME"`
	SlowThreshold int    `yaml:"SlowThreshold"` // 慢sql阈值，单位毫秒
	LogLevel      string `yaml:"LogLevel"`      // 日志打印级别 例如info error
	Colorful      bool   `yaml:"Colorful"`      // 是否彩色打印sql
}

// GetDbInfo 获取config下`db`的配置
func (dbInfo ConfigStruct) GetDbInfo() ConfigStruct {
	vip := utils.GetOrDefaultViper()
	// 读取db配置
	if err := vip.Unmarshal(&dbInfo); err != nil {
		panic("解析db配置异常, info:" + err.Error())
	}
	return dbInfo
}

```

#### 2.1.2 封装gorm驱动

```go
package driverUtil

import (
	"context"
	"fmt"
	"github.com/spf13/viper"
	"go-im/common/bizError"
	"go-im/config"
	"gorm.io/driver/mysql"
	"gorm.io/gorm"
	"time"
)

// @Description: 驱动设置
// @File:  config
// @Version: 1.0.0
// @Date: 2023/01/19 15:59
// @Author: fengyuan-liang@foxmail.com

var gormDb *gorm.DB

//=========================== gorm操作 ==================================

type InitGormDriverInterface interface {
	InitGormDriver() (*gorm.DB, bizError.BizErrorer)
}

// GetGormDriver 多态方法
func GetGormDriver(gormDriver InitGormDriverInterface) (*gorm.DB, bizError.BizErrorer) {
	return gormDriver.InitGormDriver()
}

type GormDriverBasic struct {
	DSN string
}

type GormFormMySQLDriver struct {
	basic GormDriverBasic
}

func (d *GormFormMySQLDriver) InitGormDriver() (*gorm.DB, bizError.BizErrorer) {
	if gormDb != nil {
		return gormDb, nil
	}
	// 获取配置
	var configStruct config.ConfigStruct
	configStruct = configStruct.GetDbInfo()
	dsn := fmt.Sprintf("%v:%v@tcp(%v:%v)/%v?charset=utf8mb4&parseTime=True",
		configStruct.Db.Mysql.USER_NAME,
		configStruct.Db.Mysql.PASSWORD,
		configStruct.Db.Mysql.URL,
		configStruct.Db.Mysql.PORT,
		configStruct.Db.Mysql.DB_NAME)
	var err error
	// 自定义sql日志模版参数
	newLogConfig := logger.New(
		log.New(os.Stdout, "\r\n", log.LstdFlags),
		logger.Config{
			SlowThreshold: time.Second,
			LogLevel: func() logger.LogLevel {
				switch configStruct.Db.Mysql.LogLevel {
				case "Info":
					fallthrough
				case "info":
					return logger.Info
				case "Warn":
					fallthrough
				case "warn":
					return logger.Warn
				case "Error":
					fallthrough
				case "error":
					return logger.Error
				case "Silent":
					fallthrough
				case "silent":
					return logger.Silent
				default:
					return logger.Info
				}
			}(),
			Colorful: configStruct.Db.Mysql.Colorful,
		},
	)
	// 自定义日志模版
	gormDb, err = gorm.Open(mysql.Open(dsn), &gorm.Config{Logger: newLogConfig})
	if err != nil {
		return nil, bizError.NewBizError("数据库连接建立失败，错误信息为：", err.Error())
	}
	return gormDb, nil
}
```

#### 2.1.3 创建表并插入数据

我们先在models模块下建立`UserBasic`

```go
package models

import (
	"go-im/common/driverUtil"
	"go-im/sql/daoEntity"
	"gorm.io/gorm"
)

// @Description: 相关实体类
// @Version: 1.0.0
// @Date: 2023/01/27 21:03
// @Author: fengyuan-liang@foxmail.com

// UserBasic 用户基础属性表
type UserBasic struct {
	gorm.Model
	Name          string
	Age           uint8
	PassWord      string
	PhoneNum      string
	Email         string
	Identity      string
	ClientIp      string
	ClientPort    string
	LoginTime     uint64
	HeartBeatTime uint64
	LogOutTime    uint64 `gorm:"column:logout_time" json:"logout_time"`
	isLogin       bool
	DeviceInfo    string // 登陆设备信息
}

// TableName 用户表名
func (user *UserBasic) TableName() string {
	return "user_basic"
}
```

建表sql

```go
CREATE TABLE `user_basic` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint(20) unsigned NOT NULL,
  `created_at` datetime(3) DEFAULT NULL,
  `updated_at` datetime(3) DEFAULT NULL,
  `deleted_at` datetime(3) DEFAULT NULL,
  `name` longtext,
  `age` tinyint(3) unsigned DEFAULT NULL,
  `password` varchar(100),
  `phone_num` varchar(20),
  `email` varchar(50),
  `identity` varchar(20),
  `client_ip` varchar(50),
  `client_port` varchar(10),
  `login_time` bigint(20) unsigned DEFAULT NULL,
  `heart_beat_time` bigint(20) unsigned DEFAULT NULL,
  `logout_time` bigint(20) unsigned DEFAULT NULL,
  `device_info` longtext,
  PRIMARY KEY (`id`),
  KEY `idx_user_basic_deleted_at` (`deleted_at`),
  KEY `idx_user_basic_user_id` (`user_id`)
) ENGINE=InnoDB AUTO_INCREMENT=103 DEFAULT CHARSET=utf8
```

后面如果需要加字段

```sql
ALTER TABLE user_basic ADD user_id INT(64);
```

接着我们编写main方法插入数据

```go
package main

import (
	"fmt"
	"go-im/common/driverUtil"
	"go-im/models"
)

// @Description: 启动类
// @Version: 1.0.0
// @Date: 2023/01/27 20:58
// @Author: fengyuan-liang@foxmail.com
func main() {
  // 这样的好处是后面引入其他数据源不用违背开闭原则
	db, _ := driverUtil.GetGormDriver(&driverUtil.GormFormMySQLDriver{})
	// user := models.UserBasic{}
  // 创建表 这里最好不要直接创建，因为gorm生成的字段类型可以不合适，例如string会存储为bigText
  // err := db.AutoMigrate(&user)
  // if err != nil {
  //  fmt.Println(err)
  //  return
  // }
  // 插入数据
  // 一定要传递指针
  db.Create(&models.UserBasic{Name:"张三", Age: 18})
}
```

自此，gorm就引入成功了，为了下面gin的使用，我们需要添加一个分页查询的方法

首先定义第一个实体用来接收分页的参数，我们在`sql`目录下创建`daoEntity`目录，并创建`baseDaoEntity.go`

```go
package daoEntity

import "gorm.io/gorm"

// @Description: 通用dao层实体类
// @Version: 1.0.0
// @Date: 2023/01/28 14:32
// @Author: fengyuan-liang@foxmail.com

// Paginate 分页封装
func Paginate(page int, pageSize int) func(db *gorm.DB) *gorm.DB {
	return func(db *gorm.DB) *gorm.DB {
		if page <= 0 {
			page = 1
		}
		switch {
		case pageSize > 100:
			pageSize = 100
		case pageSize <= 0:
			pageSize = 10
		}
		offset := (page - 1) * pageSize
		return db.Offset(offset).Limit(pageSize)
	}
}

```

我们再编写一个分页查询的方法，加在`UserBasic.go`中即可

```go
// PageQueryUserList 分页查询
func PageQueryUserList(pageNo int, pageSize int) []*UserBasic {
	db, _ := driverUtil.GetGormDriver(&driverUtil.GormFormMySQLDriver{})
	// 初始化容器
	userBasicList := make([]*UserBasic, pageSize)
	db.Scopes(daoEntity.Paginate(pageNo, pageSize)).Find(&userBasicList)
	return userBasicList
}
```

### 2.2 引入gin

#### 2.2.1 封装gin

```go
go get -u github.com/gin-gonic/gin
```

我们先封装一下状态码，在common模块下建entity再建response模块，再在里面建立`response.go`

```go
package response

import (
	"encoding/json"
	"log"
)

// @Description: 返回结果封装
// @Version: 1.0.0
// @Date: 2023/01/28 17:34
// @Author: fengyuan-liang@foxmail.com

var (
	Ok  = New(200, "操作成功")
	Err = New(500, "操作失败")
)

type Reply struct {
	Code int         `json:"code"`
	Msg  string      `json:"msg"`
	Data interface{} `json:"data"`
}

// New reply 构造函数
func New(code int, msg string) *Reply {
	return &Reply{
		Code: code,
		Msg:  msg,
		Data: nil,
	}
}

// WithMsg 追加响应消息
func (t *Reply) WithMsg(msg string) Reply {
	return Reply{
		Code: t.Code,
		Msg:  msg,
		Data: t.Data,
	}
}

// WithData 追加响应数据
func (t *Reply) WithData(data interface{}) Reply {
	return Reply{
		Code: t.Code,
		Msg:  t.Msg,
		Data: data,
	}
}

// Json 返回JSON格式的数据
func (t *Reply) Json() []byte {
	s := &struct {
		Code int         `json:"code"`
		Msg  string      `json:"msg"`
		Data interface{} `json:"data"`
	}{
		Code: t.Code,
		Msg:  t.Msg,
		Data: t.Data,
	}
	log.Printf("%+v\n", s)
	raw, err := json.Marshal(s)
	if err != nil {
		log.Println(err)
	}
	return raw
}
```

我们在service目录下创建`userService.go`，用来处理user的逻辑，状态码之类的我们后续再封装

```go
package service

import (
	"github.com/gin-gonic/gin"
	"go-im/models"
	"strconv"
)

// @Description:
// @Version: 1.0.0
// @Date: 2023/01/28 14:43
// @Author: fengyuan-liang@foxmail.com

func PageQueryUserList(c *gin.Context) {
	// 拿到参数
	page := c.Query("pageNo")
	size := c.Query("pageSize")
	if page == "" || size == "" {
		c.JSON(500, response.Err.WithMsg("参数缺失"))
		return
	}
	// 转化类型
	pageInt, _ := strconv.Atoi(page)
	sizeInt, _ := strconv.Atoi(size)
	c.JSON(200, response.Ok.WithData(models.PageQueryUserList(pageInt, sizeInt)))
}

```

在router目录下吗添加路由`router.go`

```go
package router

import (
	"github.com/gin-gonic/gin"
	"go-im/service"
)

// @Description: 路由控制器
// @Version: 1.0.0
// @Date: 2023/01/27 22:04
// @Author: fengyuan-liang@foxmail.com

func Router() *gin.Engine {
	engine := gin.Default()
	//================== 系统相关 =====================
	defaultGroup := engine.Group("/")
	{
		defaultGroup.GET("index", service.GetIndex)
	}
	//================== 用户相关 =====================
	// 路由组1 ，处理用户相关GET请求
	u1 := engine.Group("user/")
	{
		u1.GET("pageQuery", service.PageQueryUserList)
	}
	return engine
}

```

接着在main方法中编写

```go
package main

import (
	"go-im/router"
)

// @Description: 启动类
// @Version: 1.0.0
// @Date: 2023/01/27 20:58
// @Author: fengyuan-liang@foxmail.com

func main() {
	// 路由
	r := router.Router()
	// 监听端口
	r.Run(":8080")
}
```

在浏览器中测试

![image-20230128183424426](https://cdn.fengxianhub.top/resources-master/image-20230128183424426.png)

自此gin框架引入成功

#### 2.2.2 封装返回参数

### 2.3 引入swaggo

#### 2.3.1 引入依赖

当然如果喜欢knife4j的话也有一些go版本的可以尝试一下

- https://gitee.com/youbeiwuhuan/knife4go

笔者这里就使用gin- swagger了

- https://pkg.go.dev/github.com/swaggo/gin-swagger

不熟悉的可以看这篇博客，讲的很详细

- https://blog.csdn.net/JunChow520/article/details/122339247

```go
go install github.com/swaggo/swag/cmd/swag@latest
```

引入之后执行

```go
swag init
```

执行后会创建doc文件夹和里面的文件

引入gin相关swaggo依赖

```go
go get -u github.com/swaggo/gin-swagger
go get -u github.com/swaggo/files
```

在router中引入swagger的路由

```go
package router

import (
	"github.com/gin-gonic/gin"
	swaggerfiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"
	"go-im/docs"
	"go-im/service"
)

func Router() *gin.Engine {
	r := gin.Default()
	//================== 系统相关 =====================
	defaultGroup := r.Group("/")
	{
		defaultGroup.GET("index", service.GetIndex)
	}
	//================== swagger相关 =====================
	// 设置docs文件相对路径
	docs.SwaggerInfo.BasePath = ""
	r.GET("/swagger/*any", ginSwagger.WrapHandler(swaggerfiles.Handler))
	//================== 用户相关 =====================
	// 路由组1 ，处理用户相关GET请求
	u1 := r.Group("user/")
	{
		u1.GET("pageQuery", service.PageQueryUserList)
	}
	return r
}

```

可以测试一下，路径为`http://localhost:8080/swagger/index.html`

![image-20230128165752592](https://cdn.fengxianhub.top/resources-master/image-20230128165752592.png)

自此我们的swagger引入成功，现在我们添加注解进行使用

#### 2.3.2 使用注解生成文档

找一个接口，添加一些注解

```go
package service

import (
	"github.com/gin-gonic/gin"
	"go-im/models"
	"strconv"
)

// @BasePath /user


// PageQueryUserList 分页查询
// @Tags 用户相关
// @BasePath /user
// @Summary 分页查询
// @param pageNo query integer true "第几页" default(1)
// @param pageSize query integer true "每页多少条" default(10)
// @Produce json
// @Success 200 {UserBasic} []*UserBasic
// @Router /user/pageQuery [get]
func PageQueryUserList(c *gin.Context) {
	// 拿到参数
	page := c.Query("pageNo")
	size := c.Query("pageSize")
	if page == "" || size == "" {
		c.JSON(500, response.Err.WithMsg("参数缺失"))
		return
	}
	// 转化类型
	pageInt, _ := strconv.Atoi(page)
	sizeInt, _ := strconv.Atoi(size)
	c.JSON(200, response.Ok.WithData(models.PageQueryUserList(pageInt, sizeInt)))
}
```

我们需要再命令行敲入`swag init`重新生成文档后再重启gin，即可访问生成的文档了

![image-20230128172902081](https://cdn.fengxianhub.top/resources-master/image-20230128172902081.png)

### 2.4 引入redis

我们在后面用户登录功能开发中采用的鉴权方式为`token + redis`的方式，所以这里我们需要引入redis

安装

```go
go get github.com/redis/go-redis/v9
```

添加配置文件（我这里是写在db下）

```go
  redis:
    URL: "your url"
    PORT: 6379
    PASSWORD: ""
    DB: 0
    # 数据库连接池连接数量
    POOL_SIZE: 30
    # 
    MinIdleConns: 10
    # 超时时间，单位毫秒
    PoolTimeout: 30
```

添加对应配置类的结构体

```go
// RedisStruct
// @Description: redis数据源对应配置
type RedisStruct struct {
	URL          string `yaml:"URL"`
	PORT         string `yaml:"PORT"`
	PASSWORD     string `yaml:"PASSWORD"`
	DB           string `yaml:"DB"`
	POOL_SIZE    int    `yaml:"POOL_SIZE"`
	MinIdleConns int    `yaml:"MinIdleConns"`
	PoolTimeout  int    `yaml:"PoolTimeout"`
}
```

初始化方法

```go
func InitRedis() (*redis.Client, bizError.BizErrorer) {
	if redisClient != nil {
		return redisClient, nil
	}
	// 配置文件
	configStruct := getDbConfig()
	redisConfig := configStruct.Db.Redis
	redisClient = redis.NewClient(&redis.Options{
		Addr:         redisConfig.URL + ":" + redisConfig.PORT,
		Password:     redisConfig.PASSWORD,
		PoolSize:     redisConfig.POOL_SIZE,
		MinIdleConns: redisConfig.MinIdleConns,
		PoolTimeout:  time.Duration(redisConfig.PoolTimeout),
	})
	// 测试连接
	result, err := redisClient.Ping().Result()
	if err != nil {
		fmt.Println("result is ", result)
	} else {
		fmt.Println("=====>>>>err:", err)
	}
	return redisClient, nil
}
```



## 3. 功能开发

为了开发方便我们需要引入一些第三方包

- 结构体之间属性拷贝，类似于（spring中的BeanUtil）：https://github.com/ulule/deepcopier

  这个直接将github上的`deepcopier.go`拷贝到`util`目录下即可

- 用来做参数校验（类似于Spring中的validator） ：https://github.com/go-playground/validator

  根据readme文档引入即可

goland可以下载一些插件

- 代码注释自动生成插件：https://github.com/loveinsky100/goanno/

  这里默认参数是`@param`，建议改成`@args`，因为swagger会认为这是接口注解从而报错
  
  ![image-20230202124948901](https://cdn.fengxianhub.top/resources-master/image-20230202124948901.png)
  
  ![image-20230202125042753](https://cdn.fengxianhub.top/resources-master/image-20230202125042753.png)

### 3.1 用户模块

我们先封装crud操作

- 这里需要生成一个用户内显和用户外显，都必须保证唯一。内显是内部用来查询用户身份的，外显是给用户的id，可能会有靓号或者需要排除一些区间，userNumber不与其他的表进行关联，可以随意更改。具体做法有很多，这里采用最简单的方式进行生成，即用10位数字表示，并在db中查询，只有生成的不存在时才进行插入（**具体见插入代码**）

#### 3.1.1 查询相关

我们在生产的项目中是不可能允许查全表这种情况发生的，所有分页查询是我们获取集合的唯一途径，在前面我们封装gin的时候写过分页查询的接口，接下来我们写带过滤条件的分页查询

**router**

```go
u1.GET("/pageQueryByFilter", service.PageQueryByFilter)
```

**Service**

```go
// PageQueryByFilter 带筛选条件的分页查询
// @Tags 用户相关
// @BasePath /user
// @Summary 前端请求参数应为：http://xx:xx/pageQueryByFilter?pageSize=1&pageNo=1&name=1&age=2&email=xxx@xxx
// @Produce json
// @Success 200 {UserBasic} []*UserBasic
// @Router /user/pageQueryByFilter [get]
func PageQueryByFilter(c *gin.Context) {
	// 拿到所有的过滤条件
	queryMap := utils.GetAllQueryParams(c)
	// 拿到参数
	page := queryMap["pageNo"]
	size := queryMap["pageSize"]
	if page == "" || size == "" {
		c.JSON(500, response.Err.WithMsg("参数缺失"))
		return
	}
	// 转化类型
	pageInt, _ := strconv.Atoi(page)
	sizeInt, _ := strconv.Atoi(size)
	// 没有过滤条件
	if len(queryMap) <= 2 {
		c.JSON(200, response.Ok.WithData(models.PageQueryUserList(pageInt, sizeInt)))
		return
	}
	// 添加所有的过滤条件
	c.JSON(200, response.Ok.WithData(models.PageQueryByFilter(pageInt, sizeInt, func(tx *gorm.DB) {
		for k, v := range queryMap {
			if k == "pageNo" || k == "pageSize" {
				continue
			}
			tx.Where(k, v)
		}
	})))
}
```

**models**

```go
// PageQueryByFilter 根据过滤条件进行分页查询。可以使用
func PageQueryByFilter(pageNo int, pageSize int, filter func(*gorm.DB)) []*UserBasic {
	db := getDB()
	// 初始化容器
	tx := db.Scopes(daoEntity.Paginate(pageNo, pageSize))
	// 执行回调函数
	if filter != nil {
		filter(tx)
	}
	// 初始化容器
	userBasicList := make([]*UserBasic, pageSize)
	tx.Find(&userBasicList)
	return userBasicList
}
```

**utils**

```go
// GetAllQueryParams 获取所有请求的参数，并封装为map返回
func GetAllQueryParams(c *gin.Context) map[string]string {
	query := c.Request.URL.Query()
	var queryMap = make(map[string]string, len(query))
	for k := range query {
		queryMap[k] = c.Query(k)
	}
	return queryMap
}
```

可以看到当查询sql，满足我们的预期

```sql
SELECT * FROM `user_basic` WHERE `age` = '10' AND `user_basic`.`deleted_at` IS NULL LIMIT 10
```

![image-20230129163006242](https://cdn.fengxianhub.top/resources-master/image-20230129163006242.png)

#### 3.1.3 插入相关

这里我们用`validator`用来做参数校验，gin默认的`github.com/go-playground/validator`，可以直接使用

除此之外还有一些其他的工具也挺好用的，例如：

- github.com/asaskevich/govalidator

这里笔者就使用gin默认的了

然后开始使用，我们可以用来校验结构体

```go
type UserBasic struct {utils.ProcessErr(userParams, err)
    UserId        uint64 `gorm:"column:user_id" json:"userId"`
    UserNumber    string `gorm:"column:user_number" json:"userNumber"`
    Name          string `validate:"required" reg_error_info:"姓名不能为空"`
    Age           uint8  `validate:"gt=0,lt=200" reg_error_info:"年龄不合法"`
    PassWord      string `gorm:"column:password" json:"password"`
    PhoneNum      string `validate:"RegexPhone" reg_error_info:"手机号格式不正确"`
    Email         string `validate:"email" reg_error_info:"email为空或格式不正确"`
  ...其他省略
}
```

这时一般返回的错误是这样的

![image-20230130225947389](https://cdn.fengxianhub.top/resources-master/image-20230130225947389.png)

当然这样不友好，我们希望能够返回自定义的提醒信息，我们封装一个方法即可

```go
// ProcessErr go validator参数校验器自定义规则及提示
func ProcessErr(u interface{}, err error) string {
	if err == nil { //如果为nil 说明校验通过
		return ""
	}
	invalid, ok := err.(*validator.InvalidValidationError) //如果是输入参数无效，则直接返回输入参数错误
	if ok {
		return "输入参数错误：" + invalid.Error()
	}
	validationErrs := err.(validator.ValidationErrors) //断言是ValidationErrors
	for _, validationErr := range validationErrs {
		fieldName := validationErr.Field() //获取是哪个字段不符合格式
		typeOf := reflect.TypeOf(u)
		// 如果是指针，获取其属性
		if typeOf.Kind() == reflect.Ptr {
			typeOf = typeOf.Elem()
		}
		field, ok := typeOf.FieldByName(fieldName) //通过反射获取filed
		if ok {
			errorInfo := field.Tag.Get("reg_error_info") // 获取field对应的reg_error_info tag值
			return fieldName + ":" + errorInfo           // 返回错误
		} else {
			return "缺失reg_error_info"
		}
	}
	return ""
}
```

再调用我们的方法即可

```go
// 参数校验
validate := validator.New()
// 自定义校验
validate.RegisterValidation("RegexPhone", utils.RegexPhone)
if err := validate.Struct(userParams); err != nil {
  c.JSON(-1, response.Err.WithMsg(utils.ProcessErr(userParams, err)))
  return
}
```

现在就是我们想要的结果了

![image-20230130230149986](https://cdn.fengxianhub.top/resources-master/image-20230130230149986.png)



#### 3.1.3 更新相关

和之前的思路差不多，但是这里有一个点需要注意的是，使用gin解析json数据后，所有的数字类型都会被保存为`float64`类型，我们需要通过结构体里面的类型将其类型转换一下，这样更新的时候才不会出问题，详细的转换过程可以看代码；其次就是`userId`这个字段不能被更新，可以添加到方法后面

![image-20230130142048715](https://cdn.fengxianhub.top/resources-master/image-20230130142048715.png)

我们最后要达成的效果是，根据前端传递的参数就能进行更新，并且还能够自动忽略一些字段

![image-20230130143051180](https://cdn.fengxianhub.top/resources-master/image-20230130143051180.png)

这里只展示核心代码：

```go
// Update 更新用户信息
// @Tags 更新用户信息
// @Param param body models.UserBasic true "上传的JSON"
// @Produce json
// @Router /user/update [post]
func Update(c *gin.Context) {
	jsonMap := make(map[string]interface{}) // 注意该结构接受的内容
	if err := c.BindJSON(&jsonMap); err != nil || len(jsonMap) <= 0 || jsonMap["userId"] == nil {
		c.JSON(500, response.Err.WithMsg("参数缺失"))
		return
	}
	// 不能直接用 map[string]interface{}解析，因为int会范化为float，更新会失败，必须要确定类型
	parseMap := utils.ParseMapFieldType(jsonMap, models.UserBasic{}, "userId")
	// TODO 从token中拿到userId
	var userId = uint64(utils.ParseInt(jsonMap["userId"]))
	models.Update(userId, func(tx *gorm.DB) {
		tx.Updates(parseMap)
	})
	c.JSON(200, response.Ok)
}
```

### 3.2 基础功能

在开发之前我们需要先将`IM`系统中的一些概念理清楚

#### 3.2.1 登陆功能

这里我们需要考虑到项目之后的可拓展性，我们刚开始设计肯定是只支持`账号密码`，但是随着业务的发展，我们肯定需要拓展更多的登录方式，例如:

- 手机号一键登录
- OAuth2.0认证（例如qq登录、微信登录等等）

所以我们必然在登录接口里面不能把逻辑全部写完，并且这部分逻辑写了之后应该不需要改动，要符合`开闭原则`

我们可以使用`工厂模式 + 策略模式`来完成这部分内容

首先我们定义`LoginHandle`接口，让接口的实现者去实现具体的login逻辑；其次我们再定义`LoginFactory`登录工厂，我们之后的登录handle都会存放到这个里面

```go
package loginHanle

import (
	"go-im/common/bizError"
	"go-im/models"
	"log"
)

// LoginHandle
// @Description: 登录接口
type LoginHandle interface {
	// login
	//  @Description: 登录接口
	//  @param map[string]interface{} 登录时传递的参数
	//
	login(paramsMap map[string]interface{}) (*models.UserBasic, bizError.BizErrorer)
}

type LoginFactory struct {
	// 登录工厂
	loginStrategyFactoryMap map[string]LoginHandle
}

// GetLoginStrategy
//
//	@Description: 获取具体登录逻辑执行的handle
//	@receiver loginFactory 登录工厂
//	@args loginSign 登录标识，由前端提供
//	@return LoginHandle 返回具体执行handle
func (loginFactory *LoginFactory) GetLoginStrategy(loginSign string) LoginHandle {
	return loginFactory.loginStrategyFactoryMap[loginSign]
}

// Register
//
//	@Description: 将登录逻辑注册到登录工厂中
//	@receiver loginFactory 登录工厂
//	@args loginSign 登录标识，由前端提供
//	@args loginHandle 具体执行handle
func (loginFactory *LoginFactory) Register(loginSign string, loginHandle LoginHandle) {
	if loginSign == "" || loginHandle == nil {
		log.Fatal("fail register loginHandle，the args is illegal")
	}
	loginFactory.loginStrategyFactoryMap[loginSign] = loginHandle
}

```

再定义我们的登录策略

```go
package loginHanle

import (
	"go-im/common/bizError"
	"go-im/models"
	"go-im/utils"
)

var loginFactory LoginFactory

func init() {
	// 电话登录
	AddLoginStrategy("PHONE_NUMBER_LOGIN_STRATEGY", &PhoneNumberLoginStrategy{})
}

// LoginBySign
//
//	@Description: 根据登录策略进行登录
//	@args loginSign 具体的登录方式，ex：账号密码登录，手机号码登录
//	@args paramsMap 登录的参数
//	@return *models.UserBasic 返回用户信息
//	@return bizError.BizErrorer
func LoginBySign(loginSign string, paramsMap map[string]interface{}) (*models.UserBasic, bizError.BizErrorer) {
	return loginFactory.GetLoginStrategy(loginSign).login(paramsMap)
}

// AddLoginStrategy
//
//	@Description: 增加登录的逻辑。符合开闭原则
//	@args loginSign 登录方式标识
//	@args loginHandle 具体的handle
func AddLoginStrategy(loginSign string, loginHandle LoginHandle) {
	loginFactory.Register(loginSign, loginHandle)
}

type (
	NamePwdLoginStrategy     struct{}
	PhoneNumberLoginStrategy struct{}
)

func (p *NamePwdLoginStrategy) login(paramsMap map[string]interface{}) (*models.UserBasic, bizError.BizErrorer) {
	// 用户名和密码
	name := utils.ParseString(paramsMap["name"])
	password := utils.ParseString(paramsMap["password"])
	userBasic := models.FindUserByName(name)
	if userBasic.Name == "" {
		return nil, bizError.NewBizError("用户不存在，请注册")
	}
	if !utils.CheckBySalt(password, userBasic.Salt, userBasic.Password) {
		return nil, bizError.NewBizError("密码不正确")
	}
	return userBasic, nil
}

func (p *PhoneNumberLoginStrategy) login(params map[string]interface{}) (*models.UserBasic, bizError.BizErrorer) {
	// p.login(nil)
	return nil, nil
}
```

这样的好处在于我们之后如果需要再添加新的逻辑，只需要将自己的handle和标识`loginSign`注册到`LoginStrategy`中即可，我们service层处理的逻辑完全不用改

例如我这里的为

```go
// Login 通用登录接口
// @Tags 通用登录接口
// @Param param body models.UserBasic true "上传的JSON"
// @Produce json
// @Router /user/login [post]
func Login(c *gin.Context) {
	type Params struct {
		Name      string `validate:"required" reg_error_info:"姓名不能为空" json:"name"`
		Password  bool   `validate:"required" reg_error_info:"密码不能为空" json:"password"`
		LoginSign string `validate:"required" reg_error_info:"登录标识不能为空" json:"loginSign"`
	}
	params := &Params{}
	if err := c.BindJSON(params); err != nil {
		c.JSON(-1, response.Err.WithMsg("参数有误，err:"+err.Error()))
		return
	}
	validate := validator.New()
	if err := validate.Struct(params); err != nil {
		c.JSON(-1, response.AppErr.WithMsg(utils.ProcessErr(params, err)))
		return
	}
	parseMap, _ := utils.ParseMap(params, "json")
	// 登录
	if userBasic, err := loginHanle.LoginBySign(params.LoginSign, parseMap); err != nil {
		c.JSON(-1, response.AppErr.WithMsg(err.ErrorMsg()))
	} else {
		c.JSON(200, response.Ok.WithData(userBasic))
	}
}
```

到这里已经可以看到登录拿到用户信息了

![image-20230204134040312](https://cdn.fengxianhub.top/resources-master/202302041340694.png)

#### 3.2.2 发送消息功能

这里发送消息我们采用的是`webScoket`协议，并且为了解耦我们引入了消息队列（使用redis里的发布订阅`pub/sub`）

- 单播：直接走websocket协议
- 多播（广播）、组播：采用客户端订阅消息队列的方式

![image-20230209181944722](https://cdn.fengxianhub.top/resources-master/image-20230209181944722.png)

**基础消息模版**

```go
// Message 群聊消息模板
type Message struct {
	Id          int64  	//消息Id
	GroupId     int64  	//消息所属群组id
	UserId      int64  	//消息所属用户id
	MessageData string 	//消息主体
  MessageType string  //消息类型，文字、语音、表情包图片等
  CreateTime  string 	//消息创建时间
	UpdateTime  string 	//消息更新时间
	Status      int64  	//消息状态
}
```



## 附录一 IM基础概念

### 用户（User）

- 用户，就是使用IM 系统的一个人的代表。是通讯的一方。
- 在业务系统，对接IM 平台时，对需要登录IM 系统的用户，必须对应创建一个IM 用户。

用户的主要属性有：

- user_id：唯一标识一个用户
- user_number：用户的外显ID，给用户展示使用，有靓号控制和排除不合理ID等需求
- username：用户昵称，需要支持特殊编码格式的字符，例如emoji字符
- password：密码
- 昵称：在会话，好友，消息等展示时，用于文本显示。
- 头像：在会话，好友，消息等展示时，用于图片显示。
- 其他属性

### 群（Group）

- 群，是一个允许多人聊天的一个关系。
- 用户在群里发送消息，所有群成员都能够收到。

群的主要属性有：

- group_id：群的唯一标识
- 名称：在会话，群展示时，用于文本显示。
- 头像：在会话，群展示时，用于图片显示。
- owner：群主。一个群只有一个群主，一般是群的创建者，有的可以转移。群的最高权限管理员。
- admin：管理员。一个群可以有多个管理员。管理员可以做一些群的管理功能。比如：接收进群申请，禁言用户等。不同的系统有不同的权限定义。
- member：普通群成员。一个群有多个普通群成员。
- 其他属性

### 聊天室(ChatRoom)

聊天室，是一个特殊的群，与普通群的差别一般有：

- 群成员在离线一段时间后，会主动退出聊天室。（个人认为，是核心区别）。
- 离线消息的数量，会比普通群少。
- 历史消息的数量与时间：会比普通群偏短，偏少。

### 好友(Friend)

- 有的又称联系人。
- 好友是两个用户之间的关系。
- 一般在普通聊天类的应用，需要成为还有关系，才能互相发送消息。

好友的一般属性（普通用户属性之外）：

- 备注
- 分组
- 等

### 会话(Conversation)

会话可以看做是一个临时的关系。

- 用户会话：用户与用户之间的会话。
- 群会话：用户与群/聊天室之间的会话。
- 会话是分方向的：用户A与用户B形成的会话，实际是两个会话。一个是用户A的会话，目标是用户B；另一个是用户B的会话，目标是用户A。两者对会话的操作互不影响。

会话一般的属性有（除了群，或者用户信息外）：

- 最后一条消息：
- 未读消息数：
- 免打扰（不显示未读计数，不推送）
- 置顶
- 等

### 消息(Message)

消息是一个用户，与另一个用户/群的通信内容的载体。

消息的主要属性：

- from：发送用户（user_id)
- to：接收者（用户，群）
- 消息类型：文本，图片，语音，视频等
- 消息内容：对于图片，语音，视频，文件等大多以文件的url 来代替。
- 时间：
- 状态：发送方(发送中，发送成功，发送失败)，接收方（已读，未读）。

### 未读消息/未读计数

- 用户收到消息，未查看的消息。
- 在会话上/角标处会显示未读计数，标识当前未读消息的计数。
- 在用户点进去一个会话，会将该会话的未读计数清零。

## 附录二 IM基础功能

### 好友

好友

- 好友申请
- 拒绝申请
- 同意申请
- 删除好友

黑名单

- 添加黑名单
- 删除黑名单

### 群

- 申请进群（如果设置了需要申请，否则可以直接进群）
- 同意进群申请
- 拒绝进群申请
- 退出群
- 修改群信息：名称，头像，公告等。
- 邀请进群
- 踢出用户（需要管理员）
- 禁言/取消禁言

### 消息

- 发送消息
- 删除消息：删除本地消息，只对自己（单设备）有效。其他人，甚至自己的其他设备如果已经接收了该消息，都还能看到这个消息。
- 撤回消息：只有消息发送者，或者群管理员可以撤回消息。撤回消息后，其他用户都看不到这个消息。一般有时间限制。

### 会话

#### 会话创建

- 发消息，自动创建会话

#### 会话删除

- 会话删除一般是客户端本端的行为。
- 会话删除，可以视为会话本身的一个软删除，不会删除对应的好友，群。
- 会话删除，不影响会话中的消息。（微信应该是删除本地消息）。

### 离线消息/历史消息

#### 离线消息

- 当接收消息的用户不在线时，消息会进入离线消息缓存。
- 当用户上线，会同步离线消息到本地。
- 离线消息有存储时间限制
- 离线消息有存储数量限制

#### 历史消息

- 用户接收消息后，消息并不会立即从服务端删除。还会在服务端继续保存一段时间，称为历史消息。
- 一般可以按会话获取历史消息。

### 推送

- 推送，实际上不是IM。是一套独立的系统。
- IM 会使用推送，来提高消息的及时触达性













