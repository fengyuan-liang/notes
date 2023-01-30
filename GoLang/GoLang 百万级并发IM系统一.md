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
}

// BizError 自定义错误
type BizError struct {
	when time.Time
	what string
}

const FORMAT_DATA = "2006/01/02 15:04.000" // 标准格式化时间

// 具体打印的异常信息
func (bizError *BizError) Error() string {
	return fmt.Sprintf("异常时间:【%v】，异常提示:【%v】", bizError.when.Format(FORMAT_DATA), bizError.what)
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

但是这种方式不够优雅，所以我们需要封装一个接口体来存储解析好的配置文件

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



## 3. 功能开发

为了开发方便我们需要引入一些第三方包

- 结构体之间属性拷贝，类似于（spring中的BeanUtil）：https://github.com/ulule/deepcopier

  这个直接将github上的`deepcopier.go`拷贝到`util`目录下即可

- 用来做参数校验（类似于Spring中的validator） ：https://github.com/go-playground/validator

  根据readme文档引入即可

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

#### 3.1.3 更新相关

和之前的思路差不多，但是这里有一个点需要注意的是，使用gin解析json数据后，所有的数字类型都会被保存为`float64`类型，我们需要通过结构体里面的类型将其类型转换一下，这样更新的时候才不会出问题，详细的转换过程可以看代码；其次就是`userId`这个字段不能被更新，可以添加到方法后面

![image-20230130142048715](https://cdn.fengxianhub.top/resources-master/image-20230130142048715.png)

我们最后要达成的效果是，根据前端传递的参数就能进行更新，并且还能够自动忽略一些字段

![image-20230130143051180](https://cdn.fengxianhub.top/resources-master/image-20230130143051180.png)



