# JavaScript ES6新特性

![image-20211225143034218](https://cdn.fengxianhub.top/resources-master/202112251430298.png)

<style>
    @font-face {
            font-family: 'Monaco';
            src: url('https://cdn.fengxianhub.top/resources-master/202109201607602.woff2') 		                                                                                                 format('woff2'),
            url('https://cdn.fengxianhub.top/resources-master/202109201608370.woff') format('woff');
            font-weight: normal;
            font-style: normal;
            font-display: swap;
        }
    dl{
        font-family: Monaco;
    }
    code {
        color: #c7254e;
        background-color: #f9f2f4;
        border-radius: 2px;
        padding: 2px 4px;
        font-family: Monaco;
    }
    blockquote{
        display: block;
        padding: 16px;
        margin: 0 0 24px;
        border-left: 8px solid #dddfe4;
        background: #eef0f4;
        overflow: auto;
        word-break: break-word!important;
    }
</style>
<blockquote>
    <p>
        <code>ES6</code> 主要是为了解决 <code>ES5</code> 的先天不足，比如 JavaScript之前的版本里并没有<code>类</code>的概念
    </p>
</blockquote>
## 1. 函数参数默认值

```javascript
// ES6 允许给函数参数赋值初始值
      // 1.形参初始值 具有默认值的参数，一般位置要靠后
      function add(a, b, c = 10) {
        return a + b + c;
      }
      let result = add(1, 2, 3);
      console.log(result); //6

      let result1 = add(1, 2);
      console.log(result1); //13

      //2.与解构赋值结合
      function connect(options) {
        let host = options.host;
        let username = options.username;
        //等等
      }

      connect({
        host: "localhost",
        username: "root",
        password: "root",
        port: 3306,
      });

      function connect({ host, username, password, port = 3306 }) {
        console.log(host); //localhost
        console.log(username); //root
        console.log(password); //root
        console.log(port); //3306
      }

      connect({
        host: "localhost",
        username: "root",
        password: "root",
        // port: 3306
      });
```



## 2. 简化对象写法

```javascript
//ES6 允许在大括号里面，直接写入变量和函数，作为对象的属性和方法
//书写更简洁，程序员可以更加偷懒了！！！
let name = "奉先";
let change = function () {
    console.log("我们可以改变你！！！");
};

const SCHOOL = {
    name,
    change,
    improve() {
        console.log("方法也更加简洁了，之前的是improve:function(){}");
    },
};
change();
SCHOOL.improve();
console.log(SCHOOL);
```

## 3. 箭头函数(Lambda表达式)

```javascript
      //箭头函数声明与我们之前函数声明的区别

      //1.this 是静态的，this始终指向函数声明时所在作用域下的this的值
      function getName() {
        console.log(this.name);
      }

      let getName2 = () => {
        console.log(this.name);
      };

      window.name = "奉先";
      const SCHOOL = {
        name: "yuanchen",
      };

      // //直接调用
      getName(); //奉先
      getName2(); //奉先

      // //call 方法调用(可以改变函数内部this的值)
      getName.call(SCHOOL); //yuanchen     method.invoke(  o )   o.method();
      getName2.call(SCHOOL); //奉先  并没有改变， this 是静态的，this始终指向函数声明时所在作用域下的this的值

      //2.不能作为构造实例化对象
      let Person = function (name, age) {
        this.name = name;
        this.age = age;
      };
      let me = new Person("xxn", "19");
      console.log(me);

      let Person = (name, age) => {
        this.name = name;
        this.age = age;
      };

      let me = new Person("xxn", "19"); //Person is not a constructor   原因this
      console.log(me);

      //3.不能使用arguments变量
      let fn = function () {
        console.log(arguments);
      };
      fn(1, 2, 3);

      let fn = () => {
        console.log(arguments); //arguments is not defined  arguments  (因为函数也是一种特殊对象，由容器创建，所以事先放入了一些属性)（index5.html）
      };
      fn(1, 2, 3);

      //4.箭头函数的简写
      //1)省略小括号，当形参有且只有一个的时候
      let add = (n) => {
        return n + n;
      };

      // let result=add(9);
      // console.log(result);  //18

      // //2)省略花括号，当代码体只有一条语句的时候，此时return也必须省略
      // 语句的执行结果就是函数的返回值
      let pow = (n) => n * n;
      console.log(pow(9)); //81   此处不是很清楚的建议去看康师傅的javase，后面会讲到lambda表达式
```

## 4. 解构赋值

```javascript
      //ES6 解构赋值--------------->允许按照一定模式从数组和对象中提取值，对变量进行赋值
      //1.数组的解构
      const F4 = ["小沈阳", "刘能", "赵四", "宋小宝"];
      let [xiao, liu, zhao, song] = F4;
      console.log(xiao); //小沈阳
      console.log(liu); //刘能
      console.log(zhao); //赵四
      console.log(song); //宋小宝

      //2.对象的解构
      const zhao = {
        name: "赵本山",
        age: "20",
        xiaopin: function () {
          console.log("我可以演小品");
        },
      };

      let { name, age, xiaopin } = zhao; //注意此处是{}，不是[]，区别于数组
      console.log(name);
      zhao.name = "赵四";
      console.log(name);
      console.log(age);
      console.log(xiaopin);
      xiaopin();

      //用于某属性或方法频繁调用,例如：
      //当我们频繁调用xiaopin方法时;
      zhao.xiaopin();
      zhao.xiaopin();
      zhao.xiaopin();
      zhao.xiaopin(); //zhao这也算重复，这时可以用到解构赋值
      let { xiaopin } = zhao;
      xiaopin();
      xiaopin();
      xiaopin();
      xiaopin();
```

## 5. 拓展运算符 ...

```javascript
      //  ... 扩展运算符能将数组转换为逗号分隔的参数序列
      //声明一个数组
      const tfboys = ["易烊千玺", "王源", "王俊凯"];
      //声明一个函数
      function chunwan() {
        console.log(arguments);
      }
      let app = {
        url: "miniProgram/sendCode",
        method: "POST",
        data: {
          phone: 17670459756,
        },
      };
      chunwan(tfboys); //0: (3) ["易烊千玺", "王源", "王俊凯"],length=1
      chunwan(...tfboys); //chunwan('易烊千玺','王源','王俊凯'),变成了三个参数，  length: 3

      //1.数组的合并
      const KUAIZI = ["肖央", "王太利"];
      const FH = ["曾毅", "玲花"];
      //const zuixuanxiaopingguo=KUAIZI.concat(FH);
      const zuixuanxiaopingguo = [...KUAIZI, ...FH]; //["肖央", "王太利", "曾毅", "玲花"]
      console.log(zuixuanxiaopingguo);

      //2.数组的克隆
      const SZH = ["E", "G", "M"];
      const SYC = [...SZH]; //['E','G','M'];
      console.log(SYC); //浅拷贝

      //3.将伪数组转换为真正的数组
      const DIVS = document.querySelectorAll("div");
      console.log(DIVS); //Object
      const DIVSARR = [...DIVS];
      console.log(DIVSARR); //Array
```

## 6.模板字符串

```javascript
      var a = 1;
      var b = 2;
      var sum = a + b;
      var res = `a+b的和是${sum}`;
      console.log(res);//a+b的和是3

      // =======================================

      var obj = { name: "张三；", age: 18 };
      var str = `姓名：${obj.name}年龄：${obj.age}`;
      console.log(str);//姓名张三,年龄18

      //3.变量拼接
      let lovest = "`魏翔`";
      let out = lovest + "是我心目中最搞笑的演员"; //之前的拼接

      //使用``之后
      let lovest2 = `魏翔`;
      let out2 = `${lovest2}是我心目中最搞笑的演员`;
      console.log(out2); //魏翔是我心目中最搞笑的演员
```

## 7. forof遍历数组

```javascript
    //我们之前遍历  for in
    for (let x in arr) {
      console.log(x); //此时的x是下标,若想取到值则需看下一行代码
      console.log(typeof x);//string,注意forin遍历的index是string类型的
      console.log(arr[x]);
    }

	//可以使用forEach来获得number类型的index
    arr.forEach((value, index) => {
      console.log(value);//数组中的值
      console.log(index);//number类型的索引
      console.log(typeof index);//number
    });	

    //使用for of
    for (let x of arr) {
      console.log(x); //唐僧  孙悟空 猪八戒 沙僧   ,取到的是值
    }
```



## 8. promise&generator

### 8.1 all

all的主要作用是等到 [] 括号里的所有promise请求都请求完成后才执行回调函数，常用来在页面刚加载时确保数据全部能刷新出来

```javascript
<!DOCTYPE html>
<html>
  <head>
    <title>all</title>
  </head>

  <body></body>

  <script>
    var promise1 = new Promise(function (resolve) {
      setTimeout(function () {
        resolve(1);
        alert(1 + "先到");
      }, 3000);
    });
    var promise2 = new Promise(function (resolve) {
      setTimeout(function () {
        resolve(2);
        alert(2 + "先到");
      }, 1000);
    });
    Promise.all([promise1, promise2]).then(function (value) {
      alert(value);
    });
  </script>
</html>

```



### 8.2 race

race和all恰恰相反，当 [  ] 括号里的任意promise请求完成后就会执行回调函数里的内容

```javascript
<!DOCTYPE html>
<html>
  <head>
    <title>异步</title>
  </head>

  <body></body>

  <script>
    function timerPromise(delay) {
      return new Promise(function (resolve) {
        //console.log(delay);
        resolve(delay);
      });
    }
    // 任何一个promise变为resolve或reject 的话程序就停止运行
    Promise.race([
      timerPromise(1),
      timerPromise(32),
      timerPromise(64),
      timerPromise(128),
    ]).then(function (value) {
      console.log(value); // => 1
    });

    function getURL(URL) {
        return new Promise(function (resolve, reject) {
            var req = new XMLHttpRequest();
            req.open('GET', URL, true);
            req.onload = function () {
                if (req.status === 200) {
                    resolve(req.responseText);
                } else {
                    reject(new Error(req.statusText));
                }
            };
            req.onerror = function () {
                reject(new Error(req.statusText));
            };
            req.send();
        });
    }
    var URL = "...";
    getURL(URL).then(function onFulfilled(value) {
        console.log(value);
    });
  </script>
</html>

```





































