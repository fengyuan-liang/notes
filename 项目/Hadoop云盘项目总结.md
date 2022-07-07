# Hadoop云盘项目总结

## 0. 项目介绍

**技术栈：**HDFS、Sqoop、Flume、Ganglia、Azkaban、Zookeeper、Redis、Nginx、Docker、Vue-Cli

**实现功能：**使用 Hadoop 搭建 HA 集群实现网盘系统，前端采用 vue-cli，后端采用 SpringBoot。实现的功能有：用户上 传下载文件；通过 MapReduce 清洗、挖掘、分析用户数据并生成报表；通过 Ganglia 监控集群状态；使用 Azkaban 进行定时调度；使用 Java ForkJoin 框架搭建 RSS 高性能爬虫，通过布隆过滤器过滤重复信息

项目难点：

1. 由于项目在公网上搭建，项目前期对 Hadoop 集群各种通信端口不够熟悉，导致集群通信失败 
2. 用户上传相同文件时会出现重复上传现象。通过布隆过滤器过滤相同文件，通过构建用户文档树映射用户路径 和真实路径，将相同文件移至共享文件区，用户上传和删除行为仅做逻辑实现，不做业务实现 
3. 集群中数据清洗、挖掘、分析的 MR 任务过多，难以控制。通过引入 Azkaban 统一管理集群中的 Flume、Sqoop 和 MR 任务，并进行定时调度



## 1. 循环引用导致无意识的递归(java.lang.StackOverflowError)问题

**问题描述**：在构建用户文档树的时候，采取链表双向指针的方式，分别指向上一个和下一个结点，导致无意识的循环引用，然后报StackOverflowError

**问题产生原因**：在Java中的每个类从根本上都是继承自Object，标准容器类自然也不例外，因此容器类都有toString()方法，并且重写了该方法，使得它生成的String结果能够表达容器本身，以及容器所包含的对象.例如ArrayList.toString()，它会遍历ArrayList中包含的所有对象，调用没个元素的toString()方法。而我的集合类本身会循环引用，最终导致无限递归

**解决方法：**将集合类由继承改为组合，内部维护一个List；修改双向引用为单向，仅指向下一个结点，将根结点保存在用户的属性中，结点的遍历从根结点开始；重写集合类的`toString、equals、hashCode`方法，不让其遍历整个集合

**测试结果**：经测试，自定义的文档树，有良好的程序健壮性和可拓展性，使用黑白测试均通过，文档树构建（showTree方法）如下

```css
 ├─dir
 ├─dir2
 ├─dir3
 │    ├─xx.java
 │    ├─dir2
 │    │    ├─dir3
 │    │    ├─dir4
 │    │    ├─dir5
 │    │    ├─dir6
 │    │    │    ├─xx2.java
 │    │    │    ├─xx2.java
```

## 2. 日志记录和用户鉴权

>后端用户鉴权

**问题描述**：采用传统的AOP进行切面时灵活性不够，无法对具体的接口数据进行记录

**问题产生原因**：通常使用的AOP不能具体记录接口的行为，不能自定义接口的行为，也业务耦合性不高

**解决方法：**自定义日志注解，手动标记每个接口的具体行为，并设置横切点统一进行用户鉴权，核心代码为：

```java
/**
 * 对包含注解的请求进行拦截
 */
@Pointcut("@annotation(cn.hnit.annotation.SysLog)")
public void logPointCut() {
}

/**
 * 后置通知 用于拦截操作，在方法返回后执行
 *
 * @param joinPoint 切点
 */
@AfterReturning(pointcut = "logPointCut()")
public void doAfterReturn(JoinPoint joinPoint) {
    saveLog(joinPoint, null);
}

/**
 * 拦截异常操作，有异常时执行
 */
@AfterThrowing(value = "logPointCut()", throwing = "e")
public void doAfterThrow(JoinPoint joinPoint, Exception e) {
    saveLog(joinPoint, e);
}
```

>前端用户鉴权

每次请求都会带上token

```javascript
const service = axios.create({
  baseURL: "https://hadoop.fengxianhub.top/api", // 请求的路径
  timeout: 5000, // request timeout
  headers: {
    header: "access-control-allow-origin", // 跨域问题
    token: getToken(), //所有请求都必须带上token
  },
});
```

使用vuex进行组件间通信，并保持用户的状态

```javascript
const getters = {
  sidebar: (state) => state.app.sidebar,
  device: (state) => state.app.device,
  token: (state) => state.user.token,
  avatar: (state) => state.user.avatar,
  name: (state) => state.user.uname,
  roles: (state) => state.user.roles || [],
  permission_routes: (state) => state.permission.routes,
};
export default getters;
```

每次路由前都要检查用户权限

```javascript
router.beforeEach(async (to, from, next) => {
  // start progress bar
  NProgress.start();

  // set page title
  document.title = to.meta.title;

  // determine whether the user has logged in
  const hasToken = getToken();

  // 判断是否存在token,没有就重新登陆
  if (hasToken) {
    if (to.path === "/login") {
      // if is logged in, redirect to the home page
      next({ path: "/" });
      NProgress.done();
    } else {
      // determine whether the user has obtained his permission roles through getInfo
      const hasRoles = store.getters.roles && store.getters.roles.length > 0; //这里指的是src/store/getters.js的roles
      //判断是否已经有roles了
      if (hasRoles) {
        next();
      } else {
        try {
          // get user info
          // note: roles must be a object array! such as: ['admin'] or ,['developer','editor']
          //获取roles
          const { roles } = await store.dispatch("user/getInfo"); //第一步

          // generate accessible routes map based on roles
          //获取通过权限验证的路由
          const accessRoutes = await store.dispatch(
            "permission/generateRoutes",
            roles
          ); //第二步
          //更新加载路由
          router.options.routes = store.getters.permission_routes; //第三步
          // dynamically add accessible routes
          router.addRoutes(accessRoutes);
          // hack method to ensure that addRoutes is complete
          // set the replace: true, so the navigation will not leave a history record
          next({ ...to, replace: true });
        } catch (error) {
          // remove token and go to login page to re-login
          await store.dispatch("user/resetToken");
          Message.error(error || "Has Error");
          next(`/login?redirect=${to.path}`);
          NProgress.done();
        }
      }
    }
  } else {
    /* has no token*/

    if (whiteList.indexOf(to.path) !== -1) {
      // in the free login whitelist, go directly
      next();
    } else {
      // other pages that do not have permission to access are redirected to the login page.
      next(`/login?redirect=${to.path}`);
      NProgress.done();
    }
  }
});
```

根据权限过滤路由

```javascript
/**
 * Use meta.role to determine if the current user has permission
 * @param roles
 * @param route
 */
//匹配权限
function hasPermission(roles, route) {
  if (route.meta && route.meta.roles) {
    return roles.some((role) => route.meta.roles.includes(role));
  } else {
    return true;
  }
}

/**
 * Filter asynchronous routing tables by recursion
 * @param routes asyncRoutes
 * @param roles
 */
export function filterAsyncRoutes(routes, roles) {
  const res = [];
  routes.forEach((route) => {
    const tmp = { ...route };
    if (hasPermission(roles, tmp)) {
      if (tmp.children) {
        tmp.children = filterAsyncRoutes(tmp.children, roles);
      }
      res.push(tmp);
    }
  });
  return res;
}
```

## 3. Hadoop集群通信问题

**问题描述**：由于本项目Hadoop集群采用四台2核4G云服务搭建，公网环境复杂，不能关闭防火墙，因此只开启常规端口（8020、50070），在上传数据时发现会上传失败

**问题产生原因**：向集群发起上传文件的请求是发送给namenode的，但是真正上传的对象是datanode，具体由namenode提供，此外集群同步数据是通过50010端口进行的，这个端口的设置在配置文件中并没有很好的体现，导致端口没有开启报异常

**解决方法：**通过查看datanode报错日志确定是网络通信问题导致，进一步减小问题范围，最终找到解决方案

## 4. 业务日志分析

```java
255,lijie,2022-07-05 23:52:47.0,192.168.0.71,获取用户信息,success,Firefox,Windows 10 or Windows Server 2016
```

- 先根据用户分组
- 统计用户的行为（例如登录多少次、查看用户数据多少次）

Azkaban任务具体如下：

先写数据源，再写MapReduce

start.job

```shell
#执行脚本
# start.job
type=command
command=sqoop import --connect jdbc:mysql://localhost:3306/sqoop?serverTimezone=UTC --username lijie --table user_logs --num-mappers 3 --target-dir /logs/user_logs/user_log2 --delete-target-dir
```

mapreduce：

```shell
#执行脚本
# mapreduce.job
type=command
dependencies=start
command=hadoop jar sqoopTest.jar com.fx.service.App /logs/user_logs/user_log /logs/user_logs/user_log_out 
```

sqoop：

```java
#执行脚本
# mapreduce.job
type=command
dependencies=mapreduce
command=sqoop export --connect jdbc:mysql://hadoop3:3306/sqoop --username lijie -export-dir /logs/user_logs/user_log_out/part-r-00000 --table user_logs_analyse --input-fields-terminated-by '\t' --columns="user_name,user_operate,num"
```



## 5. 木马感染

查鲨木马的脚本

```shell
for host in $(cat ./hosts)
    do 
    if[ -lt `"host" ls /var/tmp`]
        echo "$host有病毒，正在鲨死" 
        ssh "$host" rm -rf /var/tmp/*
        echo "$host的病毒查鲨成功"
    fi
done
```

```shell
#!/bin/bash
# check hosts is on/Off
# by rivers on 20219-23
str=$1
for host in $(cat ./hosts)
do 
	if[[-z $(ssh "$host" ls /var/tmp)]];then
    	echo "$host"有病毒
	fi
done
```



```java
#!/bin/bash
# check hosts is on/Off
# by rivers on 20219-23

Network=$1
for Host in $(seq 1 254)
do
ping -c 1 $Network.$Host > /dev/null && result=0 || result=1

if [ "$result" == 0 ];then
  echo -e "\033[32;1m$Network.$Host is up \033[0m"
  echo "$Network.$Host" >> /tmp/up.txt

else
  echo -e "\033[;31m$Network.$Host is down \033[0m"
  echo "$Network.$Host" >> /tmp/down.txt
fi
done

```

## 6. Vue中Echarts图表不显示

**问题描述**：在使用`mounted`钩子初始化Echarts图表时，刚打开界面可以展示，但是跳到其他的tab再回来的时候，图标就不能显示了

**问题产生原因**：由于将图标包装成一个组件了，父组件给子组件传递的数据不会每次都进行传递

**解决方法：**使用Vue的`Watch`监视属性代替`mounted`钩子，如果数据没有发生改变，不会进行重新渲染

```vue
<script>
import * as echarts from "echarts";
require("echarts/theme/macarons");
export default {
  props: ["userLog"],
  data() {
    return {
      className: "Bar",
      height: "400px",
      width: "600px",
      chart: "",
      userLogData: this.userLog,
    };
  },
  watch: {
    userLog(newVal) {
      this.init(newVal);
    },
  },
  methods: {
    init(newVal) {
      //2.初始化
      this.chart = echarts.init(this.$refs.bar);
      //3.配置数据
      let option = {
        xAxis: {
          type: "category",
          data: ["查询网盘", "登录网盘", "上传文件", "下载文件"],
        }, //X轴
        yAxis: { type: "value" }, //Y轴
        series: [
          {
            data: [
              newVal.loginNum,
              newVal.queryNetworkNum,
              newVal.downLoadNum,
              newVal.uploadNum,
            ],
            type: "bar",
          },
        ], //配置项
      };
      // 4.传入数据
      this.chart.setOption(option);
    },
  },
};
</script>
```



## 7. 对接口幂等性的研究

```shell
+---------+------+------------+
| Method  | Safe | Idempotent |
+---------+------+------------+
| CONNECT | no   | no         |
| DELETE  | no   | yes        |
| GET     | yes  | yes        |
| HEAD    | yes  | yes        |
| OPTIONS | yes  | yes        |
| POST    | no   | no         |
| PUT     | no   | yes        |
| TRACE   | yes  | yes        |
+---------+------+------------+  
```

**解决方案：**分布式锁

## 8. Nginx反向代理问题

nginx路径带 / 和不带   带/ 不会有代理地址   不带 会有代理地址 ！！！

>口诀：加不加、不加加

**第一种：**

此时，若请求为www.test1.com/test1/test11，匹配到/test1/或/test后，按照“代理地址+访问URL目录”的规则，将会转发到http://127.0.0.1:8080/test1/test11。

```java
location /test1/ {
    proxy_pass http://127.0.0.1:8080;   # http://127.0.0.1:8080/test1/
}
#或者
location /test1 {
    proxy_pass http://127.0.0.1:8080;
}
```

**第二种：**

这种情况下，nginx转发会对localion路径下的匹配进行截取，按照**“代理地址+访问URL目录部分去除location匹配目录”**的规则，重新进行拼接后转发

```java
#1.proxy_pass变化
location /test1/ {
    proxy_pass http://127.0.0.1:8080/;
}
#www.test1.com/test1/test11   ->  http://127.0.0.1:8080/test11
 
#或者
location /test1/ {
    proxy_pass http://127.0.0.1:8080/test2/;
}
#www.test1.com/test1/test11->http://127.0.0.1:8080/test2/test11
 
#2.location匹配变化
location /test1/ {
    proxy_pass http://127.0.0.1:8080/test2;
}
#www.test1.com/test1/test11->http://127.0.0.1:8080/test2test11(截取了/test1/,少个‘/’)
 
#或者
location /test1 {
    proxy_pass http://127.0.0.1:8080/test2;
}
#www.test1.com/test1/test11->http://127.0.0.1:8080/test2/test11
```



## 9. 小组成员总结

### 9.1 集群脚本编写



### 9.2 后续需要优化的点

- 并发场景下如何保护共享资源

- 上传/下载大文件问题   ===>   断点续传

  网盘：客户端，桌面端（qt）、netty

  web：插件，浏览器插件，不能基于http，RPC

- 用户目录树完善

- 去重优化（文档树那一段）

- 在线预览

- 优化下载速度





























