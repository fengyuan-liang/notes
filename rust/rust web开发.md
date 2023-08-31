# rust web开发

## 1. 构建原生web服务器





![image-20230806222420080](https://cdn.fengxianhub.top/resources-master/image-20230806222420080.png)





![image-20230806222809669](https://cdn.fengxianhub.top/resources-master/image-20230806222809669.png)







## 2. actix入门

![image-20230807012257467](https://cdn.fengxianhub.top/resources-master/image-20230807012257467.png)

在Actix中支持两类并发

>1. 异步IO（IO多路复用）
>2. 多线程并行：即OS线程数与逻辑CPU数量相同

接下来我们要添加三个路由

![image-20230807012528474](https://cdn.fengxianhub.top/resources-master/image-20230807012528474.png)







### 2.1 内存中添加数据

```shell
curl -X POST localhost:3000/courses/ -H "Content-Type: application/json" -d '{"teacher_id":1, "name":"First course"}'
curl -X POST localhost:3000/courses/ -H "Content-Type: application/json" -d '{"teacher_id":1, "name":"Second course"}'
curl -X POST localhost:3000/courses/ -H "Content-Type: application/json" -d '{"teacher_id":1, "name":"Third course"}'
```

测试数据

```shell
$ curl  localhost:3000/courses/1
{"code":200,"data":[{"teacher_id":1,"id":1,"name":"First course","time":"2023-08-09T13:16:55.348653800"},{"teacher_id":1,"id":2,"name":"Third course","time":"2023-08-09T13:16:58.842984200"},{"teacher_id":1,"id":3,"name":"Third course","time":"2023-08-09T13:17:03.828113800"},{"teacher_id":1,"id":4,"name":"Second course","time":"2023-08-09T13:17:11.449509100"}]}
```

测试接口`get_course_detail`

```shell
$ curl localhost:3000/courses/1/1
{"code":200,"data":{"teacher_id":1,"id":1,"name":"First course","time":"2023-08-09T13:20:09.925247900"}}
```



### 2.2 启动pgSQL

```yaml
version: '3'
services:
  postgresql:
    image: registry.cn-hangzhou.aliyuncs.com/zhengqing/postgres:14.5                    # 镜像'postgres:14.5'
    container_name: postgresql                                                          # 容器名为'postgresql'
    restart: unless-stopped                                                             # 指定容器退出后的重启策略为始终重启，但是不考虑在Docker守护进程启动时就已经停止了的容器
    # 设置环境变量,相当于docker run命令中的-e
    environment:
      TZ: Asia/Shanghai
      LANG: en_US.UTF-8
      POSTGRES_DB: postgres
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: 123456
      ALLOW_IP_RANGE: 0.0.0.0/0 # 允许所有ip访问
    # 数据卷挂载路径设置,将本机目录映射到容器目录
    volumes:
      - "./postgresql/data:/var/lib/postgresql/data"
    # 映射端口
    ports:
      - "5432:5432"
```

```shell
docker-compose up -d
```

使用

```shell
# 进入容器
docker exec -it postgresql bash
# 登录
psql -U postgres -W
# 查看版本
select version();
```

### 2.3 数据库操作

数据库连接

```shell
DATABASE_URL=postgres://postgres:123456@localhost:5432/yx
//                        账号      密码      ip     端口   数据库名称
```

常用命令

```sql
连接数据库, 默认的用户和数据库是postgres
psql -U user -d dbname

切换数据库,相当于mysql的use dbname
\c dbname
列举数据库，相当于mysql的show databases
\l
列举表，相当于mysql的show tables
\dt
查看表结构，相当于desc tblname,show columns from tbname
\d tblname

\di 查看索引 

创建数据库： 
create database [数据库名]; 
删除数据库： 
drop database [数据库名];  
*重命名一个表： 
alter table [表名A] rename to [表名B]; 
*删除一个表： 
drop table [表名]; 

*在已有的表里添加字段： 
alter table [表名] add column [字段名] [类型]; 
*删除表中的字段： 
alter table [表名] drop column [字段名]; 
*重命名一个字段：  
alter table [表名] rename column [字段名A] to [字段名B]; 
*给一个字段设置缺省值：  
alter table [表名] alter column [字段名] set default [新的默认值];
*去除缺省值：  
alter table [表名] alter column [字段名] drop default; 
在表中插入数据： 
insert into 表名 ([字段名m],[字段名n],......) values ([列m的值],[列n的值],......); 
修改表中的某行某列的数据： 
update [表名] set [目标字段名]=[目标值] where [该行特征]; 
删除表中某行数据： 
delete from [表名] where [该行特征]; 
delete from [表名];--删空整个表 
创建表： 
create table ([字段名1] [类型1] ;,[字段名2] [类型2],......<,primary key (字段名m,字段名n,...)>;); 
\copyright     显示 PostgreSQL 的使用和发行条款
\encoding [字元编码名称]
                 显示或设定用户端字元编码
\h [名称]      SQL 命令语法上的说明，用 * 显示全部命令
\prompt [文本] 名称
                 提示用户设定内部变数
\password [USERNAME]
                 securely change the password for a user
\q             退出 psql


```



### 2.4 数据库CRUD

添加课程

```shell
curl -X POST localhost:3000/courses/ -H "Content-Type: application/json" -d '{"teacher_id":1, "id":7, "name":"First course"}'
```





打包脚本

```shell
$ docker run -it --rm \
 -v $PWD:/workdir \
 -v ~/.cargo/git:/root/.cargo/git \
 -v ~/.cargo/registry:/root/.cargo/registry \
 registry.gitlab.com/rust_musl_docker/image:stable-latest \
 cargo build --release -vv --target=x86_64-unknown-linux-musl
```

压测了其中一个接口，qps能到5000以上

![image-20230810235558695](https://cdn.fengxianhub.top/resources-master/image-20230810235558695.png)

也没有太多接口超时，rust的异步db请求还是挺强的

![image-20230810235604293](https://cdn.fengxianhub.top/resources-master/image-20230810235604293.png)



### 2.5 统一异常处理

在java中我们经常进行统一的异常处理，在controller处理异常的逻辑

在rust中也可以进行统一错误处理

![image-20230811224946379](https://cdn.fengxianhub.top/resources-master/image-20230811224946379.png)

编程语言常用的两种错误处理方式：

- 异常（java）
- 返回值（Rust、golang）

rust希望开发者显式的处理错误，因此，可能出错的函数返回Result枚举类型

```rust
enum Result<T, E> {
    Ok(T),
    Err(E),
}
```

在rust中可以使用`?`简化抛出异常

这里`?`的作用我们总结一下：

- 如果`Result`是`Ok`：`Ok`中的值就是表达式的结果，然后继续执行程序
- 如果`Result`是`Err`：`Err`就是`整个函数`的返回值，就像使用了`return`一样

```rust
use std::{fs::File, io::{self, Read}};

fn main() {
    let r = read_username_from_file();
}

fn read_username_from_file() -> Result<String, io::Error> {
    let mut f = File::open("hello.txt")?;

    let mut s = String::new();

     f.read_to_string(&mut s)?;

     Ok(s)
}
```

![image-20230811225659417](https://cdn.fengxianhub.top/resources-master/image-20230811225659417.png)



![image-20230811225703411](https://cdn.fengxianhub.top/resources-master/image-20230811225703411.png)



![image-20230811230036120](https://cdn.fengxianhub.top/resources-master/image-20230811230036120.png)



我们跟着老师改好之后就能自己测试效果了

![image-20230813160140149](https://cdn.fengxianhub.top/resources-master/image-20230813160140149.png)

## 3. 项目重构

现在我们想要增加一些字段并且重构一下之前的代码

![image-20230813160933784](https://cdn.fengxianhub.top/resources-master/image-20230813160933784.png)

之前的目录结构不够清晰，现在我们将项目结构进行重构

### 3.1 使用seaorm

安装脚手架

```shell
$ rust install sea-orm-cli
```

使用脚手架生成对应的实体类（也可以不使用直接改之前的代码）

```shell
$ sea-orm-cli generate entity --database-url postgres://postgres:123456@localhost:5432/tutorial --output-dir src/database
Connecting to Postgres ...
Discovering schema ...
... discovered.
Generating course.rs
    > Column `id`: i32, auto_increment, not_null
    > Column `teacher_id`: i32, not_null
    > Column `name`: String, not_null
    > Column `time`: Option<DateTime>
    > Column `description`: Option<String>
    > Column `format`: Option<String>
    > Column `structure`: Option<String>
    > Column `duration`: Option<String>
    > Column `price`: Option<i32>
    > Column `language`: Option<String>
    > Column `level`: Option<String>
Generating teacher.rs
    > Column `id`: i32, auto_increment, not_null
    > Column `name`: String, not_null
    > Column `picture_url`: String, not_null
    > Column `profile`: Option<String>
Writing src/database\course.rs
Writing src/database\teacher.rs
Writing src/database\mod.rs
Writing src/database\prelude.rs
... Done.
```

然后改一改就可以用了😁

![image-20230822234942195](https://cdn.fengxianhub.top/resources-master/image-20230822234942195.png)









## 4. 教师管理功能

![image-20230817202804707](https://cdn.fengxianhub.top/resources-master/image-20230817202804707.png)



## 5. Tera编写服务端web前端应用

 ![image-20230816231601667](https://cdn.fengxianhub.top/resources-master/image-20230816231601667.png)

>前后端不分离写着也挺好玩的😁

![image-20230821212244733](https://cdn.fengxianhub.top/resources-master/image-20230821212244733.png)

## 6. WebAssembly编写应用

>参考资料：https://rustwasm.github.io/docs/book/

这里我们用`webAssembly`来编写课程管理功能

![image-20230821212353264](https://cdn.fengxianhub.top/resources-master/image-20230821212353264.png)

### 6.1 WebAssembly简介

WebAssembly是一种新的编码方式，可以在现代浏览器中运行

- 它是一种低级的类汇编语言
- 具有紧凑的二进制格式
- 可以接近原生的性能运行
- 并为rust等语言提供了一个编译目标，以便它们在web上运行
- 它也被设计可以于JavaScript共存，允许两者一起工作

![image-20230821213059495](https://cdn.fengxianhub.top/resources-master/image-20230821213059495.png)

![image-20230821213128570](https://cdn.fengxianhub.top/resources-master/image-20230821213128570.png)

![image-20230821213149484](https://cdn.fengxianhub.top/resources-master/image-20230821213149484.png)

![image-20230821213216403](https://cdn.fengxianhub.top/resources-master/image-20230821213216403.png)

![image-20230821213250752](https://cdn.fengxianhub.top/resources-master/image-20230821213250752.png)

![image-20230821213411808](https://cdn.fengxianhub.top/resources-master/image-20230821213411808.png)

### 6.2 WebAssembly环境搭建

我们先进入这个网站：https://rustwasm.github.io/docs/book/game-of-life/setup.html

对应先安装`wasm-pack`

![image-20230821213716826](https://cdn.fengxianhub.top/resources-master/image-20230821213716826.png)

装好后执行

```shell
cargo install cargo-generate
```

windows用户在安装的时候可能会出错，比如这样

```shell
$ cargo install cargo-generate
.... 一大堆报错
error: could not compile `cargo-generate` (bin "cargo-generate") due to previous error
error: failed to compile `cargo-generate v0.18.3`, intermediate artifacts can be found at `C:\Users\Administrator\AppData\Local\Temp\cargo-installDiuaAo`
```

>这里可以看官方的这个issue
>
>- https://github.com/cargo-generate/cargo-generate/issues/948
>
>解决方法：
>
>- https://github.com/cargo-generate/cargo-generate/issues/942#issuecomment-1558214088
>
>其实也就是
>
>```shell
>cargo install --locked cargo-generate --version 0.18.2
>```
>
>但是显然问题还是没有解决，还是安装失败了😫



## 附录遇到的问题

### 0x01 表窥探技术

在执行sqlx的代码的时候遇到了报错

![](https://cdn.fengxianhub.top/resources-master/image-20230816223504893.png)



![](https://cdn.fengxianhub.top/resources-master/image-20230816223445946.png)

没想到表不存在居然连编译都通过不了，太夸张了！！！

更离谱的是我添加表后居然编译就通过了🦀

>**看看gpt的解释**
>
>`sqlx` 在编译时进行了静态分析，并通过查询中使用的表名来检查表的存在与否。当您执行 `sqlx::query!` 宏时，它会尝试将查询字符串解析为有效的 SQL 查询，并在编译时验证查询的语法和语义。这包括检查查询中引用的表是否存在于数据库中。
>
>在您的代码中，当您将查询字符串设置为从 `course` 表中选择数据时，`sqlx` 静态分析过程会检查数据库中是否存在名为 `course` 的表。如果表存在，查询将被认为是有效的，并且代码不会报错。如果表不存在，则静态分析将检测到这个问题，并在编译时报错。
>
>这是 `sqlx` 静态分析的一个优点，它可以在编译时捕获一些潜在的问题，并提供更好的代码安全性和可靠性。通过在编译时检查表的存在与否，`sqlx` 可以避免在运行时出现相关的错误。
>
>需要注意的是，`sqlx` 的静态分析只能检查查询中引用的表是否存在，而不能检查查询的语义是否符合预期。因此，在执行查询之前，仍然需要在运行时处理数据库返回的错误，并确保查询的结果符合预期。

### 0x02 添加日志打印

没有日志可太痛苦了，加上加上

```toml
log = "0.4.0"
env_logger = "0.6.0"
```

在`main.rs`

```rust
use log::info;
use actix_web::middleware::Logger;

fn init_logger() {
    use chrono::Local;
    use std::io::Write;

    let env = env_logger::Env::default()
        .filter_or(env_logger::DEFAULT_FILTER_ENV, "info");
    // 设置日志打印格式
    env_logger::Builder::from_env(env)
        .format(|buf, record| {
            writeln!(
                buf,
                "{} {} [{}] {}",
                Local::now().format("%Y-%m-%d %H:%M:%S"),
                record.level(),
                record.module_path().unwrap_or("<unnamed>"),
                &record.args()
            )
        })
        .init();
    info!("env_logger initialized.");
}

fn main() {
    init_logger();
    info!("hello world");
    let app = move || {
        App::new()
        .wrap(middleware::Logger::default())
}
```

搞好就有日志了

```shell
2023-08-17 22:16:10 INFO [teacher_service] env_logger initialized.
2023-08-17 22:16:10 INFO [actix_server::builder] starting 10 workers
2023-08-17 22:16:10 INFO [actix_server::server] Actix runtime found; starting in Actix runtime
2023-08-17 22:16:21 INFO [actix_web::middleware::logger] 127.0.0.1 "POST /teacher HTTP/1.1" 500 96 "-" "Apifox/1.0.0 (https://apifox.com)" 0.000598
2023-08-17 22:19:29 INFO [actix_web::middleware::logger] 127.0.0.1 "GET /teacher HTTP/1.1" 200 106 "-" "Apifox/1.0.0 (https://apifox.com)" 0.002986
2023-08-17 22:19:45 INFO [actix_web::middleware::logger] 127.0.0.1 "POST /teacher HTTP/1.1" 500 96 "-" "Apifox/1.0.0 (https://apifox.com)" 0.000134
```

如果我们的`sqlx`在执行过程中出现了错误，可以把日志调整到`debug`就能看到`sqlx`的报错提示

```rust
    let env = env_logger::Env::default()
        .filter_or(env_logger::DEFAULT_FILTER_ENV, "debug");
```

```shell
2023-08-17 22:24:03 INFO [teacher_service] env_logger initialized.
2023-08-17 22:24:03 INFO [actix_server::builder] starting 10 workers
2023-08-17 22:24:03 INFO [actix_server::server] Actix runtime found; starting in Actix runtime
2023-08-17 22:24:06 DEBUG [actix_web::data] Failed to extract `Data<teacher_service::models::teacher::CreateTeacher>` for `/teacher` handler. For the Data extractor to work correctly, wrap the data with `Data::new()` and pass it to `App::app_data()`. Ensure that types align in both the set and retrieve calls.
2023-08-17 22:24:06 DEBUG [actix_web::middleware::logger] Error in response: "Requested application data is not configured correctly. View/enable debug logs for more details."
2023-08-17 22:24:06 INFO [actix_web::middleware::logger] 127.0.0.1 "POST /teacher HTTP/1.1" 500 96 "-" "Apifox/1.0.0 (https://apifox.com)" 0.000622
2023-08-17 22:24:13 INFO [actix_server::server] SIGINT received; starting forced shutdown

2023-08-17 22:35:46 DEBUG [sqlx_core::logger] summary="insert into teacher(name, picture_url, …" db.statement="\n\ninsert into\n  teacher(name, picture_url, profile)\nvalues\n  ($1, $2, $3) returning id,\n  name,\n  picture_url,\n  profile\n" rows_affected=0 rows_returned=0 elapsed=1.8817ms
Database error occurred: "error returned from database: duplicate key value violates unique constraint \"teacher_pkey\""
2023-08-17 22:35:46 DEBUG [actix_web::middleware::logger] Error in response: DBError("error returned from database: duplicate key value violates unique constraint \"teacher_pkey\"")

```























