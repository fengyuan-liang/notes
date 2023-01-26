# golang ORM框架

市面上有许多优秀的golang orm框架

- gorm

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

## 2. gorm

>Orm简介
>
>对象关系映射（Object Relational Mapping，简称ORM）模式是一种为了解决对象与关系数据库存在互不匹配问题的技术（例如Java中对象和表之间的映射）

**安装**

```go
go get -u gorm.io/gorm
go get -u gorm.io/driver/mysql
```









