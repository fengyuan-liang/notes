# diyVue

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
        这篇文章记录笔者怎么实现一个diy的<code>Vue</code>,以此来加深对<code>Vue</code>等等知识的理解
    </p>
</blockquote>

![image-20220107230948217](https://cdn.fengxianhub.top/resources-master/202201072309509.png)

## 1. 代码实现

```javascript
//1. 先创建一个QVue类，该类接收的是一个options的对象，也就是我们在实例化Vue的时候需要传递的参数
class QVue {
  constructor(options) {
    //new QVue((json对象))
    //缓存options对象数据，用$是为了防止命名污染的问题
    this.$options = options;
    //取出data数据，做数据响应，从这里可以观察到为什么Vue实例上通过this.$data可以拿到我们所写的data数据
    /**
     * 1. 如data不为空，则取data，如为空，则创建一个空对象
     * 2. 短路或，前面为真时后面不执行，即如果options.data为undefine时给他一个默认值防止报错
     */
    this.$data = options.data || {};
    //监听数据的变化
    this.observe(this.$data);
    /**
     * 1. 主要用来解析各种指令，例如v-text v-on v-html v-model v-on:click等指令
     * 2. 解析代码段->{{}}文本结点   v-xxx属性结点
     * 3. this指的是vue对象，即vm对象
     */
    new compile(options.el, this);
  }
  //观察数据的变化
  observe(data) {
    //如果$data不存在，或不是一个对象类型，则返回，不予监听(null和undefine取反都为true)
    if (!data || typeof data != "object") {
      return;
    }
    //获取data中的所有的键
    let keys = Object.keys(data); //keys为内置对象中的方法，用于返回一个有一个给定对象的自身可枚举属性组成的数组
    //循环所有的键，绑定监听
    keys.forEach((key) => {
      //数据响应          对象  属性  属性值
      this.defineReactive(data, key, data(key));
      //代理data中的属性到Vue实例上
      this.proxyData(key);
    });
  }
  //数据响应
  defineReactive(data, key, val) {
    //解决数据层次嵌套，递归绑定监听
    //如果name对应的属性值是对象{}，则它将递归这个对象的所有属性进行绑定
    this.observe(val);
    const dep = new Dep(); //用户管理Watcher
    //这里的obj指的是$data对象，key是他里面的一个属性
    Object.defineProperty(data, key, {
      get() {
        //向管理watcher的对象追加watcher实例，方便管理
        Dep.target && dep.addWatcher(Dep.target);
        return val;
      },
      set(newVal) {
        //如果值没有发生变化则返回
        if (newVal === val) {
          return;
        }
        //只有值发生了变化才通知
        val = newVal;
        dep.notify();
      },
    });
  }
  //代理data
  proxyData(key) {
    //这里的this指的是Vue对象 key指的是$data中的每个键
    Object.defineProperty(this, key, {
      get() {
        return this.$data[key];
      },
      set(newVal) {
        this.$data[key] = newVal;
      },
    });
  }
}

//2. 管理watcher
class Dep {
  constructor() {
    //存储
    this.watchers = []; //用来存各个$data属性对应的watcher
  }
  //添加watcher
  addWatcher(watcher) {
    this.watchers.push(watcher);
  }
  //通知所有的watcher进行更新
  notify() {
    this.watchers.forEach((watchers) => {
      watchers.update();
    });
  }
}

//3. 观察者，做具体更新
class Watcher {
  constructor(vm, key, func) {
    //vue实例
    this.vm = vm;
    //需要更新的key
    this.key = key;
    //更新后执行的函数
    this.func = func;
    //将当前的watcher实例指定到Dep静态属性target，用来在类间进行通信
    Dep.target = this;
    //触发getter，添加依赖
    this.vm[this.key];
    Dep.target = null;
  }
  update() {
    this.func.call(this.vm, this.vm[this.key]); //反射调用
  }
}

//4. 解析el挂载点下的dom

/**
 * 1. 设想绑定原理，在编译的时候可以解析出v-model在做操作的时候，在使用v-model元素上添加了一个时间监听(input)
 * 2. 把时间监听的回调函数作为时间监听的回调函数，如果input发生变化的时候把最新的值设置到vue的实例上，因为vue已经实现了数据的响应化
 * 3. 响应化的set函数会触发界面中所有依赖模块的更新
 * 4. 然后通知哪些model做依赖更新，所以界面中所有跟这个数据有关的东西就更新了
 */
class compile {
  //el就是#app的层，vm:view-model对象
  constructor(el, vm) {}
  /**
   * 1. 将宿主元素中代码片段取出来，遍历，这样做比较高效
   * 2. 这里只考虑了id="xxx"的情况，没有考虑<template>
   */
  node2Fragment(el) {}

  compile(el) {
    //宿主结点下的所有子元素
    const childNodes = el.childNodes;
    Array.from(childNodes).forEach((node) => {
      if (this.isElement(node)) {
        //如果是元素
        console.log("编译元素" + node.nodeName);
        //拿到元素上所有的属性结点
        const nodeAttrs = node.attributes;
        //将它转为数组后循环每个属性结点
        Array.from(nodeAttrs).forEach((attr) => {
          //属性名
          const attrName = attr.name;
          //属性值
          const attrValue = attr.value;
          //如果是指令，注意指令都是以q-开头(真正的vue是以v-开头)
          if (this.isDirective(attrName)) {
            //q-text q-html q-on q-model(分别对应vue中的v-text v-html v-on v-model)
            //获取指令后面的内容text html on model 指令类型
            const dir = attrName.substring(2);
            /**
             * 执行更新
             * 1. 这里的this是在compile对象中，所以是compile对象
             * 2. 即查找compile对象中的text() html() on() 或者是model()
             * 3. 注意这些函数都有三个参数：结点对象 vm对象 属性值
             */
            this[dir] && this[dir](node, this.$vm, attrValue); //???
          }
          //如果是事件
          if (this.isEvent(attrName)) {
            //事件处理，取出事件名 如@click
            let dir = attrName.substring(1); //取出@
            //事件处理，有四个参数：结点对象 vm对象 属性值 事件类型
            this.eventHandler(node, this.$vm, attrValue, dir);
          }
        });
      } else if (this.isInterpolation(node)) {
        //如果是插值文本
        this.compileText(node);
        console.log("编译文本" + node.textContent);
      }
      //递归子元素 解决元素嵌套问题
      if (node.childNodes && node.childNodes.length) {
        this.compile(node);
      }
    });
  }

  //判断是否为元素结点
  isElement(node) {}
  //是否为文本结点  且有插值语法
  isInterpolation(node) {}
  //是否为指令 q-xxx(对应vue中的 v-html v-once v-on v-bind等等)
  isDirective(attr) {}
  //是否为事件对@开头的属性
  isEvent(attr) {}

  /**
   * 指令处理
   */
  text(node, vm, attrValue) {
    this.update(node, vm, attrValue, "text");
  }
  //更新函数 桥接
  update(node, vm, exp, dir) {
    //``表示执行里面的占位符代码，${dir}获取事件类型
    const updateFn = this[`${dir}Updater`];
    //初始化
    updateFn && updateFn(node, vm[exp]);
    //依赖收集
    new Watcher(vm, exp, function (value) {
      updateFn && updateFn(node, value);
    });
  }
  textUptater(node, value) {
    node.textContent = value;
  }
  //双向绑定 v-model
  model(node, vm, exp) {
    //指定input的value属性 模型到视图的绑定
    this.update(node, vm, exp, "model");
    //视图对模型的响应
    node.addEventListener("input", (e) => {
      vm[exp] = e.target.value;
    });
  }
  modelUpdater(node, value) {
    node.value = value;
  }
  //v-html
  html(node, vm, exp) {
    this.update(node, vm, exp, "html");
  }
  htmlUpdater(node, value) {
    node.innerHTML = value;
  }
  //更新插值文本
  compileText(node) {
    let key = RegExp.$1;
    this.update(node, this.$vm, key, "text");
  }
  //事件处理器
  eventHandler(node, vm, exp, dir) {
    let fn = vm.$options.methods && vm.$options.methods[exp];
    if (dir && fn) {
      node.addEventListener(dir, fn.bind(vm));
    }
  }
}

```

## 2. 测试

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta http-equiv="X-UA-Compatible" content="IE=edge" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Document</title>
  </head>
  <body>
    <div id="app">
      <p>{{name}}</p>
    </div>
  </body>
  <script src="../自定义vue框架/myvue3.js"></script>
  <script>
    new Vue({
      el: "app",
      data: {
        name: "张三",
      },
      methods: {
        showInfo(data) {
          console.log(data);
        },
      },
    });
  </script>
</html>

```



