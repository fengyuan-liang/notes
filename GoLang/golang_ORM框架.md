# golang ORM框架

市面上有许多优秀的golang orm框架

- gorm：[GORM - The fantastic ORM library for Golang, aims to be developer friendly.](https://gorm.io/zh_CN/)

## 1. golang原生操作

### 1.1 安装对应golang驱动包

- 对应文档：https://pkg.go.dev/github.com/go-sql-driver/mysql

安装驱动

```go
go get -u github.com/go-sql-driver/mysql
```

初始化模块

```go
go mod init m
```

处理依赖

```go
go mod tidy
```

导入驱动

```go
import (
	"database/sql"
	_ "github.com/go-sql-driver/mysql"
	"time"
)
```

### 1.1 获取数据库连接

Open 函数只是验证其参数格式是否正确，实际上并不创建与数据库的连接。如果要检查数据源的名称是否有效， 应该调用`Ping`方法

返回的DB对象可以安全地被多个`goroutine`并发使用，并且维护自己的空闲连接池。因此，Open函数应该仅被调用一次，很少需要关闭这个db对象

```go
package main

import (
	"database/sql"
	"errors"
	"fmt"
	_ "github.com/go-sql-driver/mysql"
	"time"
)

const (
	DIRVER_NAME = "mysql"
	USER_NAME   = "root"
	PASSWORD    = 123456
	URL         = "volunteer.fengxianhub.top"
	PORT        = 20062
	DB_NAME     = "golang_test"
)

var db *sql.DB

func initDB() error {
	var err error
	dsn := fmt.Sprintf("%v:%v@tcp(%v:%v)/%v?charset=utf8mb4&parseTime=True", USER_NAME, PASSWORD, URL, PORT, DB_NAME)
  // 初始化dsb:root:123456@tcp(volunteer.fengxianhub.top:20062)/golang_test?charset=utf8mb4&parseTime=True
	fmt.Printf("初始化dsb:%v\n", dsn)
	// 不会校验账号密码是否正确
	db, err = sql.Open(DIRVER_NAME, dsn)
	if err != nil {
		return errors.New(fmt.Sprintf("数据库连接建立失败，错误信息为：%v", err))
	}
	err = db.Ping()
	// 尝试和数据库建立连接，会校验dsn的正确性
	if err != nil {
		return errors.New(fmt.Sprintf("dsn错误，错误信息为：%v", dsn))
	}
	return nil
}

func main() {
	start := time.Now()
	// 建立连接
	err := initDB()
	if err != nil {
		fmt.Println(err)
	}
	end := time.Now()
  // 数据库连接建立成功，耗时319.388108ms
	fmt.Printf("数据库连接建立成功，耗时%v", end.Sub(start).String())
}

```

### 1.2 MySQL CRUD操作

我们来自己封装一个`DbHelper`，完成CRUD工作，这里就简单展示一下基本api

#### 1.2.1 插入操作

**insertOne**

```go
// InsertOne 插入一条数据，args为填充预编译参数，返回第一个参数为插入数据的主键值
func InsertOne(sql string, args ...any) (any, bizError.BizErrorer) {
	// 1. 检查sql是否符合语法
	// 1.1 检查预编译参数和实际传参数量是否一样
	count := strings.Count(sql, "?")
	if count != len(args) {
		return nil, bizError.NewBizError("传递参数数量与预编译参数数量不一致！")
	}
	// 2. 查询是否已经初始化连接
	if db == nil && utils.IsNotNil(initDbHelper()) {
		// 连接建立失败
		return nil, bizError.NewBizError("插入失败！")
	}
	// 3. 填充预编译对象
	prepare, err := db.Prepare(sql)
	if err != nil {
		return nil, bizError.NewBizError(fmt.Sprintf("Prepare失败，错误信息为：%v", err))
	}
	exec, err2 := prepare.Exec(args)
	if err2 != nil {
		return nil, bizError.NewBizError(fmt.Sprintf("insert执行失败，错误信息为：%v", err2))
	}
	// 4. 可以拿到insert后的主键id
	id, err3 := exec.LastInsertId()
	if err3 != nil {
		return nil, bizError.NewBizError(fmt.Sprintf("insert执行失败，错误信息为：%v", err3))
	}
	return id, nil
}
```



#### 1.2.2 查询操作

**单行查询**

单行查询`db.QueryRow()`执行一次查询，并期待返回最多一行结果（即Row）。`db.QueryRow`总是返回非nil的值，直到返回值的`Scan`方法被调用时，才会返回被延迟的错误

**定义数据库表对应的结构体**

```go
type Person struct {
  id int
  name string
  age uint
}
```

```go
func QueryOne(bean interface{}, sql string, args ...any) (any, bizError.BizErrorer) {
	// 1. 检查参数和数据库连接
	errorer, hasError := check(sql, args)
	if hasError {
		return nil, errorer
	}
	// 2. 组装结构体属性的字段地址
	fieldArr := utils.ReflectField(bean)
	// 3. 调用QueryRow之后必须调用Scan方法，否则持有的数据库连接不会释放
	err := db.QueryRow(sql, args...).Scan(fieldArr...)
	if err != nil {
		return nil, bizError.NewBizError(fmt.Sprintf("查询失败，%v", err))
	}
	return bean, nil
}
```

**多行查询**

```go
// QueryMany 查询多条数据
func QueryMany(bean interface{}, sql string, args ...any) (any, bizError.BizErrorer) {
	// 1. 检查参数和数据库连接
	errorer, hasError := check(sql, args)
	if hasError {
		return nil, errorer
	}
	// 2. 组装结构体属性的字段地址
	fieldArr := utils.ReflectField(bean)
	query, err := db.Query(sql, args...)
	if err != nil {
		return nil, bizError.NewBizError(fmt.Sprintf("查询失败，%v", err))
	}
	// 3. 查询完毕后需要关闭连接
	defer query.Close()
	// 4. 获取所有对象并返回
	var beanList []any
	for query.Next() {
		// 4.1 查询出一条信息
		err := query.Scan(fieldArr)
		if err != nil {
			beanList = append(beanList, bean)
		}
	}
	return beanList, nil
}
```

#### 1.2.3 更新

插入、更新和删除操作都是用`Exec`方法

```go
func (db *DB) Exec(query string, args... interface{}) (Result, error)
```

```go
// Update 更新
func Update(sql string, args ...any) (any, bizError.BizErrorer) {
	// 1. 检查参数和数据库连接
	errorer, hasError := check(sql, args)
	if hasError {
		return nil, errorer
	}
	// 2. 直接执行sql
	exec, err := db.Exec(sql, args...)
	if err != nil {
		return nil, bizError.NewBizError(fmt.Sprintf("更新失败，%v", err))
	}
	// 3. 获取执行匹配的行数
	affected, err2 := exec.RowsAffected()
	if err2 != nil {
		return nil, bizError.NewBizError(fmt.Sprintf("更新失败，%v", err2))
	}
	return affected, nil
}
```

#### 1.2.4 删除

和更新差不多，不做赘述

### 1.3 MongoDB CRUD操作

MongDB中的`JSON`文档存储在名为`BSON（二进制编码的JSON）`的二进制表示中。与其他将`JSON`数据存储为简单字符串和数字的数据库不同，`BSON`编码拓展了`JSON`表示，使其包含额外的类型，如int、long、date、浮点数和decimal128。这使得应用程序更容易可靠地处理、排序和比较数据

连接MongoDB的GO驱动程序中有两大类型表示BSON数据：`D`和`Raw`

类型`D`家族被用来简洁地构建使用本地GO类型的BSON对象。这对于构造传递给MongoDB的命令特别有用。`D`家族包括四类：

- D：一个BSON文档。这种类型应该在顺序重要的情况下使用，比如MongoDB命令
- M：一张无序的map。它和D是一样的，只是它不保证顺序
- A：一个BSON数组
- E：D里面的一个元素

要使用BSON需要先倒入下面的包：

```go
import "go.mongodb.org/mongo-driver/bson"
```

下面是一个使用D类型构建的**过滤器**文档的例子，它可以用来查找name字段与张三或李四匹配的文档

```go
bson.D{{
  "name",
  bson.D{{
    "$in",
    bson.A{"张三", "李四"}
  }}
}}
```

`Raw`类型家族用于验证字节切片。还可以使用`Lookup()`从原始类型检索单个元素。如果不想将BSON反序列化成另一种类型的开销，那么这是非常有用的

#### 1.3.1 初始化操作

导包

```go
go get go.mongodb.org/mongo-driver/mongo
```

```go
package mongdbHelper

import (
	"context"
	"fmt"
	"go.mongodb.org/mongo-driver/mongo"
	"study_db/common/bizError"
	"study_db/dao/driver"
	"time"
)

type MongoDbHelper struct {
	Client          *mongo.Client
	collection      *mongo.Collection // 连接对象
	DB_NAME         string
	COLLECTION_NAME string
}

// InitMongoDbHelper 初始化数据库连接
func InitMongoDbHelper(dbName string, collectionName string) (MongoDbHelper, bizError.BizErrorer) {
	var dbConnectionError bizError.BizErrorer
	var mongodbHelper MongoDbHelper
	// 检查参数
	if collectionName == "" || dbName == "" {
		return mongodbHelper, bizError.NewBizError("传参不能为空！")
	}
	// 初始化数据库连接
	start := time.Now()
	mongodbHelper.Client, dbConnectionError = driver.InitMongoDB()
	if dbConnectionError != nil {
		return mongodbHelper, bizError.NewBizError(fmt.Sprintf("数据库连接建立失败，错误信息为：%v", dbConnectionError))
	}
	end := time.Now()
	mongodbHelper.DB_NAME = dbName
	mongodbHelper.COLLECTION_NAME = collectionName
	// 连接对象
	mongodbHelper.collection = mongodbHelper.Client.Database(dbName).Collection(collectionName)
	fmt.Printf("数据库连接建立成功，耗时%v\n", end.Sub(start).String())
	return mongodbHelper, nil
}

```

#### 1.3.2 插入操作

插入单条

```go
// InsertOne 插入一条数据
func (dbHelper *MongoDbHelper) InsertOne(bean interface{}) (any, bizError.BizErrorer) {
	// 1. 如果连接未建立，提示用户需要调用`InitMongoDbHelper`主动建立连接
	if dbHelper.Client == nil {
		return nil, bizError.NewBizError("连接未建立！请调用InitMongoDbHelper建立连接")
	}
	// 2. 插入一个文档
	oneResult, err := dbHelper.collection.InsertOne(context.TODO(), bean)
	if err != nil {
		return nil, bizError.NewBizError("插入文档失败，错误原因：", err.Error())
	}
	// 3. 返回insertId
	return oneResult, nil
}
```

测试：

```go
func main() {
	helper, err := mongdbHelper.InitMongoDbHelper("go_test", "person")
	if err != nil {
		fmt.Println("连接建立失败", err)
	}
	one, errorer := helper.InsertOne(Person{Name: "张三", Age: 18})
	if errorer != nil {
		fmt.Println("插入文档失败", err)
	}
	fmt.Println("insertId为：", one)
}
```

![image-20230124193816026](https://cdn.fengxianhub.top/resources-master/image-20230124193816026.png)

插入多条

```go
// InsertMany 插入多条数据
func (dbHelper *MongoDbHelper) InsertMany(documents ...interface{}) (*mongo.InsertManyResult, bizError.BizErrorer) {
	insertManyResult, err := dbHelper.collection.InsertMany(context.TODO(), documents)
	if err != nil {
		return nil, bizError.NewBizError("批量插入文档失败，错误原因：", err.Error())
	}
	return insertManyResult, nil
}
```

#### 1.3.3 查询操作

```go
// InsertOne 插入一条数据
func (dbHelper *MongoDbHelper) InsertOne(bean interface{}) (any, bizError.BizErrorer) {
	// 1. 如果连接未建立，提示用户需要调用`InitMongoDbHelper`主动建立连接
	if dbHelper.Client == nil {
		return nil, bizError.NewBizError("连接未建立！请调用InitMongoDbHelper建立连接")
	}
	// 2. 插入一个文档
	oneResult, err := dbHelper.collection.InsertOne(context.TODO(), bean)
	if err != nil {
		return nil, bizError.NewBizError("插入文档失败，错误原因：", err.Error())
	}
	// 3. 返回insertId
	return oneResult, nil
}

// InsertMany 插入多条数据
func (dbHelper *MongoDbHelper) InsertMany(documents ...interface{}) (*mongo.InsertManyResult, bizError.BizErrorer) {
	insertManyResult, err := dbHelper.collection.InsertMany(context.TODO(), documents)
	if err != nil {
		return nil, bizError.NewBizError("批量插入文档失败，错误原因：", err.Error())
	}
	return insertManyResult, nil
}

// FindAll 查询所有文档，一般不允许使用
func (dbHelper *MongoDbHelper) FindAll() (*list.List, bizError.BizErrorer) {
	// 没有过滤条件，即查询全部
	return dbHelper.FindByFilter(bson.D{})
}

// FindOne 只查询一条数据
func (dbHelper *MongoDbHelper) FindOne() (*list.List, bizError.BizErrorer) {
	// 没有过滤条件，即查询全部（这里还不对，需要TODO一下）
	return dbHelper.FindByFilter(bson.D{{"skip", 0}, {"limit", 1}})
}

// FindByFilter 根据查询条件进行查询
func (dbHelper *MongoDbHelper) FindByFilter(filter bson.D) (*list.List, bizError.BizErrorer) {
	// 默认查询超时时间20ms
	ctx, cancel := context.WithTimeout(context.Background(), 20*time.Second)
	// 存储结果集合
	resultList := list.New()
	defer cancel()
	// 需要过滤条件将`bson.D{}`抽象出来即可，例如`bson.D{{"name", "tom"}}`
	cur, err := dbHelper.collection.Find(ctx, filter)
	if err != nil {
		return resultList, bizError.NewBizError("查询失败：", err.Error())
	}
	defer func(cur *mongo.Cursor, ctx context.Context) {
		err := cur.Close(ctx)
		if err != nil {
			log.Panic("关闭连接失败")
		}
	}(cur, ctx)
	for cur.Next(ctx) {
		var result bson.D
		err2 := cur.Decode(&result)
		if err2 != nil {
			return nil, bizError.NewBizError("解码失败：", err.Error())
		}
		resultList.PushFront(result)
	}
	return resultList, nil
}
```

#### 1.3.4 更新操作

```go
// UpdateByPrams 根据参数更新，不用写$set，后续将优化成链式编程
func (dbHelper *MongoDbHelper) UpdateByPrams(query bson.D, update bson.D) (int64, bizError.BizErrorer) {
	return dbHelper.Update(query, bson.D{{"$set", update}})
}

// Update 根据查询和更新条件进行更新
func (dbHelper *MongoDbHelper) Update(query bson.D, update bson.D) (int64, bizError.BizErrorer) {
	// 默认查询超时时间20ms
	ctx, cancel := context.WithTimeout(context.Background(), 20*time.Second)
	defer cancel()
	updateResult, err := dbHelper.collection.UpdateMany(ctx, query, update)
	if err != nil {
		return -1, bizError.NewBizError("解码失败：", err.Error())
	}
	return updateResult.ModifiedCount, nil
}
```

使用

```go
func main() {
	helper, _ := mongdbHelper.InitMongoDbHelper("go_test", "person")
	// 查询李四将其age改为19岁
	helper.UpdateByPrams(bson.D{{"name", "李四"}}, bson.D{{"age", 19}})
}
```

#### 1.3.5 删除操作

```go
// Del 删除
func (dbHelper *MongoDbHelper) Del(delFilter bson.D) (int64, bizError.BizErrorer) {
	// 默认查询超时时间20ms
	ctx, cancel := context.WithTimeout(context.Background(), 20*time.Second)
	defer cancel()
	delResult, err := dbHelper.collection.DeleteMany(ctx, delFilter)
	if err != nil {
		return -1, bizError.NewBizError("删除失败：", err.Error())
	}
	return delResult.DeletedCount, nil
}
```

#### 1.3.6 dbHelper完整代码

```go
package mongdbHelper

import (
	"container/list"
	"context"
	"fmt"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"log"
	"study_db/common/bizError"
	"study_db/dao/driver"
	"time"
)

type MongoDbHelper struct {
	Client          *mongo.Client
	collection      *mongo.Collection // 连接对象
	DB_NAME         string
	COLLECTION_NAME string
}

// InitMongoDbHelper 初始化数据库连接
func InitMongoDbHelper(dbName string, collectionName string) (MongoDbHelper, bizError.BizErrorer) {
	var dbConnectionError bizError.BizErrorer
	var mongodbHelper MongoDbHelper
	// 检查参数
	if collectionName == "" || dbName == "" {
		return mongodbHelper, bizError.NewBizError("传参不能为空！")
	}
	// 初始化数据库连接
	start := time.Now()
	mongodbHelper.Client, dbConnectionError = driver.InitMongoDB()
	if dbConnectionError != nil {
		return mongodbHelper, bizError.NewBizError("数据库连接建立失败，错误信息为：", dbConnectionError.BizError())
	}
	end := time.Now()
	mongodbHelper.DB_NAME = dbName
	mongodbHelper.COLLECTION_NAME = collectionName
	// 连接对象
	mongodbHelper.collection = mongodbHelper.Client.Database(dbName).Collection(collectionName)
	fmt.Printf("数据库连接建立成功，耗时%v\n", end.Sub(start).String())
	return mongodbHelper, nil
}

//========================= 插入相关 ====================================

// InsertOne 插入一条数据
func (dbHelper *MongoDbHelper) InsertOne(bean interface{}) (any, bizError.BizErrorer) {
	// 1. 如果连接未建立，提示用户需要调用`InitMongoDbHelper`主动建立连接
	if dbHelper.Client == nil {
		return nil, bizError.NewBizError("连接未建立！请调用InitMongoDbHelper建立连接")
	}
	// 2. 插入一个文档
	oneResult, err := dbHelper.collection.InsertOne(context.TODO(), bean)
	if err != nil {
		return nil, bizError.NewBizError("插入文档失败，错误原因：", err.Error())
	}
	// 3. 返回insertId
	return oneResult, nil
}

// InsertMany 插入多条数据
func (dbHelper *MongoDbHelper) InsertMany(documents ...interface{}) (*mongo.InsertManyResult, bizError.BizErrorer) {
	insertManyResult, err := dbHelper.collection.InsertMany(context.TODO(), documents)
	if err != nil {
		return nil, bizError.NewBizError("批量插入文档失败，错误原因：", err.Error())
	}
	return insertManyResult, nil
}

//========================= 查询相关 ====================================

// FindAll 查询所有文档，一般不允许使用
func (dbHelper *MongoDbHelper) FindAll() (*list.List, bizError.BizErrorer) {
	// 没有过滤条件，即查询全部
	return dbHelper.FindByFilter(bson.D{})
}

// FindOne 只查询一条数据
func (dbHelper *MongoDbHelper) FindOne() (*list.List, bizError.BizErrorer) {
	// 没有过滤条件，即查询全部（这里还不对，需要TODO一下）
	return dbHelper.FindByFilter(bson.D{{"skip", 0}, {"limit", 1}})
}

// FindByFilter 根据查询条件进行查询
func (dbHelper *MongoDbHelper) FindByFilter(filter bson.D) (*list.List, bizError.BizErrorer) {
	// 默认查询超时时间20s
	ctx, cancel := context.WithTimeout(context.Background(), 20*time.Second)
	// 存储结果集合
	resultList := list.New()
	defer cancel()
	// 需要过滤条件将`bson.D{}`抽象出来即可，例如`bson.D{{"name", "tom"}}`
	cur, err := dbHelper.collection.Find(ctx, filter)
	if err != nil {
		return resultList, bizError.NewBizError("查询失败：", err.Error())
	}
	defer func(cur *mongo.Cursor, ctx context.Context) {
		err := cur.Close(ctx)
		if err != nil {
			log.Panic("关闭连接失败")
		}
	}(cur, ctx)
	for cur.Next(ctx) {
		var result bson.D
		err2 := cur.Decode(&result)
		if err2 != nil {
			return nil, bizError.NewBizError("解码失败：", err.Error())
		}
		resultList.PushFront(result)
	}
	return resultList, nil
}

// ========================= 更新相关 ====================================

// UpdateByPrams 根据参数更新，不用写$set，后续将优化成链式编程
func (dbHelper *MongoDbHelper) UpdateByPrams(query bson.D, update bson.D) (int64, bizError.BizErrorer) {
	return dbHelper.Update(query, bson.D{{"$set", update}})
}

// Update 根据查询和更新条件进行更新
func (dbHelper *MongoDbHelper) Update(query bson.D, update bson.D) (int64, bizError.BizErrorer) {
	// 默认查询超时时间20ms
	ctx, cancel := context.WithTimeout(context.Background(), 20*time.Second)
	defer cancel()
	updateResult, err := dbHelper.collection.UpdateMany(ctx, query, update)
	if err != nil {
		return -1, bizError.NewBizError("解码失败：", err.Error())
	}
	return updateResult.ModifiedCount, nil
}

// ========================= 删除相关 ====================================

// Del 删除
func (dbHelper *MongoDbHelper) Del(delFilter bson.D) (int64, bizError.BizErrorer) {
	// 默认查询超时时间20ms
	ctx, cancel := context.WithTimeout(context.Background(), 20*time.Second)
	defer cancel()
	delResult, err := dbHelper.collection.DeleteMany(ctx, delFilter)
	if err != nil {
		return -1, bizError.NewBizError("删除失败：", err.Error())
	}
	return delResult.DeletedCount, nil
}

```

### 1.4 事物物相关



## 2. gorm

详情请查看官网：

- [GORM - The fantastic ORM library for Golang, aims to be developer friendly.](https://gorm.io/zh_CN/)

>Orm简介
>
>对象关系映射（Object Relational Mapping，简称ORM）模式是一种为了解决对象与关系数据库存在互不匹配问题的技术（例如Java中对象和表之间的映射）

**安装**

```go
go get -u gorm.io/gorm
go get -u gorm.io/driver/mysql
```

### 2.1 声明一个Model模型

`Model`是标准的`struct`，由`Go`的基本数据类型，实现了`Scanner`和`Valuer`接口的自定义类型及指针或别名组成

举个例子：

```go
type User struct {
  ID           uint
  Name         string
  Email        *string
  Age          uint8
  Birthday     *time.Time
  MemberNumber sql.NullString
  ActivatedAt  sql.NullTime
  CreatedAt    time.Time
  UpdatedAt    time.Time
}
```

GORM 倾向于约定优于配置 默认情况下，GORM 使用 `ID` 作为主键，使用结构体名的 `蛇形复数` 作为表名，字段名的 `蛇形` 作为列名，并使用 `CreatedAt`、`UpdatedAt` 字段追踪创建、更新时间

如果您遵循 GORM 的约定，您就可以少写的配置、代码。 如果约定不符合您的实际要求，[GORM 允许你配置它们](https://gorm.io/zh_CN/docs/conventions.html)

当然我们一般直接继承`gorm.Model`即可

```go
// gorm.Model 的定义
type Model struct {
  ID        uint           `gorm:"primaryKey"`
  CreatedAt time.Time
  UpdatedAt time.Time
  DeletedAt gorm.DeletedAt `gorm:"index"`
}
```

### 2.2 CRUD操作

这里详见官方文档，非常详细

```go
func InitDriver() (*gorm.DB, bizError.BizErrorer) {
	dsn := fmt.Sprintf("%v:%v@tcp(%v:%v)/%v?charset=utf8mb4&parseTime=True", USER_NAME, PASSWORD, URL, PORT, DB_NAME)
	db, err := gorm.Open(mysql.Open(dsn), &gorm.Config{})
	if err != nil {
		return nil, bizError.NewBizError(fmt.Sprintf("数据库连接建立失败，错误信息为：%v", err))
	}
	return db, nil
}
```

具体操作：

```go
db, _ := gormUtil.InitDriver()
// 创建表
err := db.AutoMigrate(&gormUtil.Product{})
if err != nil {
  fmt.Println(err)
}
// 插入数据
p := gormUtil.Product{Code: "1001", Price: 20}
// 一定要传递指针
db.Create(&p)
// 查询
var p gormUtil.Product
// 查询主键id为1的记录
db.First(&p, 1)
fmt.Println(p)
// 查询code为1001的记录
db.First(&p, "code = ?", "1001")
fmt.Println(p)
// 更新

// 条件更新
db.Model(&User{}).Where("active = ?", true).Update("name", "hello")
// UPDATE users SET name='hello', updated_at='2013-11-17 21:34:10' WHERE active=true;

// User 的 ID 是 `111`
db.Model(&user).Update("name", "hello")
// UPDATE users SET name='hello', updated_at='2013-11-17 21:34:10' WHERE id=111;

// 根据条件和 model 的值进行更新
db.Model(&user).Where("active = ?", true).Update("name", "hello")
// UPDATE users SET name='hello', updated_at='2013-11-17 21:34:10' WHERE id=111 AND active=true;

// 删除

// Email 的 ID 是 `10`
db.Delete(&email)
// DELETE from emails where id = 10;

// 带额外条件的删除
db.Where("name = ?", "jinzhu").Delete(&email)
// DELETE from emails where id = 10 AND name = "jinzhu";

```

还可以自己进行映射

```go
var id int
var name string
var age int
row := db.Table("t_person").Where("id = ?", 1).Row()
err := row.Scan(&id, &name, &age)
if err != nil {
  fmt.Println(err)
  return
}
fmt.Println(id, name, age)
```

### 2.3 原生sql

- [SQL 构建器 | GORM - The fantastic ORM library for Golang, aims to be developer friendly.](https://gorm.io/zh_CN/docs/sql_builder.html)

```go
db, _ := gormUtil.InitDriver()
var p gormUtil.Product
// RAW执行原生sql
db.Raw("select * from products where price = 200 limit 1").Scan(&p)
fmt.Println(p)

// Exec 原生 SQL
db.Exec("DROP TABLE users")
db.Exec("UPDATE orders SET shipped_at = ? WHERE id IN ?", time.Now(), []int64{1, 2, 3})
// Exec with SQL Expression
db.Exec("UPDATE users SET money = ? WHERE name = ?", gorm.Expr("money * ? + ?", 10000, 1), "jinzhu")
```

其他详情见官网

### 2.4 关联查询

我们知道表和表之间的关系有三种：一对一、一对多和多对多

#### 2.4.1 Belongs To

`belongs to` 会与另一个模型建立了一对一的连接。 这种模型的每一个实例都**属于**另一个模型的一个实例

例如，您的应用包含 user 和 company，并且每个 user 能且只能被分配给一个 company。下面的类型就表示这种关系。 注意，在 `User` 对象中，有一个和 `Company` 一样的 `CompanyID`。 默认情况下， `CompanyID` 被隐含地用来在 `User` 和 `Company` 之间创建一个外键关系， 因此必须包含在 `User` 结构体中才能填充 `Company` 内部结构体

```go
// `User` 属于 `Company`，`CompanyID` 是外键
type User struct {
  gorm.Model
  Name      string
  CompanyID int
  Company   Company
}

type Company struct {
  ID   int
  Name string
}
```

我们可以生成一下这两张表，然后观察表结构

```sql
mysql> show create table users;
CREATE TABLE `users` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `created_at` datetime(3) DEFAULT NULL,
  `updated_at` datetime(3) DEFAULT NULL,
  `deleted_at` datetime(3) DEFAULT NULL,
  `name` longtext,
  `company_id` bigint(20) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_users_deleted_at` (`deleted_at`),
  KEY `fk_users_company` (`company_id`),
  CONSTRAINT `fk_users_company` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8
```

我们可以发现产生了一个外键`fk_users_company`，用来联系`company_id`与`id`，这个就是gorm一对一帮我们产生的外键关系

当然我们可以通过制定一个tag标签给这个外键起个名字

```go
type User struct {
  gorm.Model
  Name         string
  CompanyRefer int
  Company      Company `gorm:"foreignKey:CompanyRefer"`
  // 使用 CompanyRefer 作为外键
}
```

#### 2.4.1 has one（一对一）

`has one` 与另一个模型建立一对一的关联，但它和一对一关系有些许不同。 这种关联表明一个模型的每个实例都包含或拥有另一个模型的一个实例。

例如，您的应用包含 user 和 credit card 模型，且每个 user 只能有一张 credit card

```go
// User 有一张 CreditCard，UserID 是外键
type User struct {
  gorm.Model
  CreditCard CreditCard
}

type CreditCard struct {
  gorm.Model
  Number string
  UserID uint
}
```

#### 2.4.3 Has Many(一对多)

`has many` 与另一个模型建立了一对多的连接。 不同于 `has one`，拥有者可以有零或多个关联模型。

例如，您的应用包含 user 和 credit card 模型，且每个 user 可以有多张 credit card

```go
// User 有多张 CreditCard，UserID 是外键
type User struct {
  gorm.Model
  CreditCards []CreditCard
}

type CreditCard struct {
  gorm.Model
  Number string
  UserID uint
}
```



#### 2.4.3 Many To Many(多对多)

Many to Many 会在两个 model 中添加一张连接表。

例如，您的应用包含了 user 和 language，且一个 user 可以说多种 language，多个 user 也可以说一种 language

```go
// User 拥有并属于多种 language，`user_languages` 是连接表
type User struct {
  gorm.Model
  Languages []Language `gorm:"many2many:user_languages;"`
}

type Language struct {
  gorm.Model
  Name string
}
```

当使用 GORM 的 `AutoMigrate` 为 `User` 创建表时，GORM 会自动创建连接表

### 2.5 事物相关

**禁用默认事务**

为了确保数据一致性，GORM 会在事务里执行写入操作（创建、更新、删除）。如果没有这方面的要求，您可以在初始化时禁用它，这将获得大约 30%+ 性能提升

```go
// 全局禁用
db, err := gorm.Open(sqlite.Open("gorm.db"), &gorm.Config{
  SkipDefaultTransaction: true,
})

// 持续会话模式
tx := db.Session(&Session{SkipDefaultTransaction: true})
tx.First(&user, 1)
tx.Find(&users)
tx.Model(&user).Update("Age", 18)
```

#### 2.5.1 使用事物

要在事务中执行一系列操作，一般流程如下

```go
db.Transaction(func(tx *gorm.DB) error {
  // 在事务中执行一些 db 操作（从这里开始，您应该使用 'tx' 而不是 'db'）
  if err := tx.Create(&Animal{Name: "Giraffe"}).Error; err != nil {
    // 返回任何错误都会回滚事务
    return err
  }

  if err := tx.Create(&Animal{Name: "Lion"}).Error; err != nil {
    return err
  }

  // 返回 nil 提交事务
  return nil
})
```

#### 2.5.2 嵌套事务

```go
db.Transaction(func(tx *gorm.DB) error {
  tx.Create(&user1)

  tx.Transaction(func(tx2 *gorm.DB) error {
    tx2.Create(&user2)
    return errors.New("rollback user2") // Rollback user2
  })

  tx.Transaction(func(tx2 *gorm.DB) error {
    tx2.Create(&user3)
    return nil
  })
  // 返回 nil 提交事务
  return nil
})

// Commit user1, user3
```

#### 2.5.3 手动事务

Gorm 支持直接调用事务控制方法（commit、rollback），例如：

```go
// 开始事务
tx := db.Begin()

// 在事务中执行一些 db 操作（从这里开始，您应该使用 'tx' 而不是 'db'）
tx.Create(...)

// ...

// 遇到错误时回滚事务
tx.Rollback()

// 否则，提交事务
tx.Commit()
```

#### 2.5.4 SavePoint、RollbackTo

GORM 提供了 `SavePoint`、`Rollbackto` 方法，来提供保存点以及回滚至保存点功能，例如：

```go
tx := db.Begin()
tx.Create(&user1)

tx.SavePoint("sp1")
tx.Create(&user2)
tx.RollbackTo("sp1") // Rollback user2

tx.Commit() // Commit user1
```



### 2.6 session相关

GORM 提供了 `Session` 方法，这是一个 [`New Session Method`](https://gorm.io/zh_CN/docs/method_chaining.html)，它允许创建带配置的新建会话模式

```go
// Session 配置
type Session struct {
  DryRun                   bool
  PrepareStmt              bool
  NewDB                    bool
  Initialized              bool
  SkipHooks                bool
  SkipDefaultTransaction   bool
  DisableNestedTransaction bool
  AllowGlobalUpdate        bool
  FullSaveAssociations     bool
  QueryFields              bool
  Context                  context.Context
  Logger                   logger.Interface
  NowFunc                  func() time.Time
  CreateBatchSize          int
}
```

#### 2.8.1 DryRun

生成 `SQL` 但不执行。 它可以用于准备或测试生成的 SQL，例如：

```go
// 新建会话模式
stmt := db.Session(&Session{DryRun: true}).First(&user, 1).Statement
stmt.SQL.String() //=> SELECT * FROM `users` WHERE `id` = $1 ORDER BY `id`
stmt.Vars         //=> []interface{}{1}

// 全局 DryRun 模式
db, err := gorm.Open(sqlite.Open("gorm.db"), &gorm.Config{DryRun: true})

// 不同的数据库生成不同的 SQL
stmt := db.Find(&user, 1).Statement
stmt.SQL.String() //=> SELECT * FROM `users` WHERE `id` = $1 // PostgreSQL
stmt.SQL.String() //=> SELECT * FROM `users` WHERE `id` = ?  // MySQL
stmt.Vars         //=> []interface{}{1}
```

你可以使用下面的代码生成最终的 SQL：

```
// 注意：SQL 并不总是能安全地执行，GORM 仅将其用于日志，它可能导致会 SQL 注入
db.Dialector.Explain(stmt.SQL.String(), stmt.Vars...)
// SELECT * FROM `users` WHERE `id` = 1
```

#### 2.8.2 预编译

`PreparedStmt` 在执行任何 SQL 时都会创建一个 prepared statement 并将其缓存，以提高后续的效率，例如：

```go
// 全局模式，所有 DB 操作都会创建并缓存预编译语句
db, err := gorm.Open(sqlite.Open("gorm.db"), &gorm.Config{
  PrepareStmt: true,
})

// 会话模式
tx := db.Session(&Session{PrepareStmt: true})
tx.First(&user, 1)
tx.Find(&users)
tx.Model(&user).Update("Age", 18)

// returns prepared statements manager
stmtManger, ok := tx.ConnPool.(*PreparedStmtDB)

// 关闭 *当前会话* 的预编译模式
stmtManger.Close()

// 为 *当前会话* 预编译 SQL
stmtManger.PreparedSQL // => []string{}

// 为当前数据库连接池的（所有会话）开启预编译模式
stmtManger.Stmts // map[string]*sql.Stmt

for sql, stmt := range stmtManger.Stmts {
  sql  // 预编译 SQL
  stmt // 预编译模式
  stmt.Close() // 关闭预编译模式
}
```

#### 2.8.3 NewDB

通过 `NewDB` 选项创建一个不带之前条件的新 DB，例如：

```go
tx := db.Where("name = ?", "jinzhu").Session(&gorm.Session{NewDB: true})

tx.First(&user)
// SELECT * FROM users ORDER BY id LIMIT 1

tx.First(&user, "id = ?", 10)
// SELECT * FROM users WHERE id = 10 ORDER BY id

// 不带 `NewDB` 选项
tx2 := db.Where("name = ?", "jinzhu").Session(&gorm.Session{})
tx2.First(&user)
// SELECT * FROM users WHERE name = "jinzhu" ORDER BY id
```

#### 2.8.4 初始化

Create a new initialized DB, which is not Method Chain/Goroutine Safe anymore, refer [Method Chaining](https://gorm.io/zh_CN/docs/method_chaining.html)

```go
tx := db.Session(&gorm.Session{Initialized: true})
```

#### 2.8.5 跳过钩子

如果您想跳过 `钩子` 方法，您可以使用 `SkipHooks` 会话模式，例如：

```go
DB.Session(&gorm.Session{SkipHooks: true}).Create(&user)

DB.Session(&gorm.Session{SkipHooks: true}).Create(&users)

DB.Session(&gorm.Session{SkipHooks: true}).CreateInBatches(users, 100)

DB.Session(&gorm.Session{SkipHooks: true}).Find(&user)

DB.Session(&gorm.Session{SkipHooks: true}).Delete(&user)

DB.Session(&gorm.Session{SkipHooks: true}).Model(User{}).Where("age > ?", 18).Updates(&user)
```

#### 2.8.5 禁用嵌套事务

在一个 DB 事务中使用 `Transaction` 方法，GORM 会使用 `SavePoint(savedPointName)`，`RollbackTo(savedPointName)` 为你提供嵌套事务支持。 你可以通过 `DisableNestedTransaction` 选项关闭它，例如：

```go
db.Session(&gorm.Session{
  DisableNestedTransaction: true,
}).CreateInBatches(&users, 100)
```

## 3. xorm







































