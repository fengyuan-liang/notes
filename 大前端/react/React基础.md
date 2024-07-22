# React基础

脚手架：https://zh-hans.react.dev/learn/start-a-new-react-project

```shell
// 命令全局安装react脚手架
npm install -g create-react-app
// npx 是NodeJS工具命令，查找并执行后续的包命令
npx create-react-app react-basic --template typescript
// 安装依赖
pnpm i
```



## 1. 基础语法

### 1.1 jsx&tsx

在`JSX`中可以通过`大括号语法{}`识别`js`中的表达式，比如常见的变量、函数调用、方法调用等等

- 使用引号传递字符串
- 使用js变量
- 函数调用和方法调用
- 常用js对象

```tsx
// 项目的根组件
const message = "this is message";
const getName: () => string = () => {
  return "jack";
};
const list = [
  { id: 1001, name: "Vue" },
  { id: 1002, name: "React" },
  { id: 1003, name: "Angular" },
];

function App() {
  return (
    <div className="App">
      <h1>this is title</h1>
      {/* 使用引号传递字符串 */}
      {"this is message"}
      <br />
      {/* 识别变量 */}
      {message}
      <br />
      {/* 识别函数调用 */}
      {getName()}
      {/* 方法调用 */}
      {new Date().getDate()}
      {/* 使用js对象 */}
      <div style={{ color: "red" }}>this is div</div>
      {/* 渲染列表 */}
      <ul>
        {list.map((item) => (
          <li key={item.id}>{item.name}</li>
        ))}
      </ul>
    </div>
  );
}

export default App;
```

### 1.2 条件渲染

在react中，可以使用`逻辑与运算符&&`、`三元表达式?:`实现基础的条件渲染

```tsx
import React, { useState } from "react";

type PropsType = {
  message: string;
};

const ConditionalDemo: React.FC<PropsType | undefined> = (props) => {
  const [isLogin, setIsLogin] = useState(false);
  setTimeout(() => {
    setIsLogin(true);
  }, 1000 * 2);

  return (
    <div>
      {/* 逻辑与 */}
      {isLogin && <span>this is span</span>}
      {/* 三元运算 */}
      {isLogin ? <span>jack</span> : <span>{props?.message}</span>}
    </div>
  );
};

export default ConditionalDemo;

```

复杂事件可以自定义逻辑

```tsx
import { useState } from "react";

function getRandomInt(min: number, max: number) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

const ArticleFc: React.FC = () => {
  const [articleType, setArticleType] = useState(1);
  setInterval(() => {
    setArticleType(getRandomInt(0, 3));
  }, 1000 * 5);
  // 定义核心函数（根据文章类型返回不同的tsx模板）
  const getArticleType = () => {
    return articleType === 0 ? (
      <div>我是无图模式</div>
    ) : articleType === 1 ? (
      <div>我是单图模式</div>
    ) : (
      <div>我是多图模式</div>
    );
  };

  return (
    <div>
      {/* 复杂条件渲染 */}
      {getArticleType()}
    </div>
  );
};

export default ArticleFc;
```

### 1.3 事件绑定

```tsx
const EventFc: React.FC = () => {
  const clickHandler = (e: React.MouseEvent<HTMLButtonElement>) => {
    alert("点击事件触发");
    console.log("button被点击了", e);
  };
  const handleClick = (
    name: string,
    e: React.MouseEvent<HTMLButtonElement>
  ) => {
    alert("点击事件" + name);
    console.log("button被点击了", e);
  };

  return (
    <div>
      {/* 点击事件 */}
      <button onClick={clickHandler}>这是一个按钮</button>
      {/* 传递参数 */}
      <button onClick={(e) => handleClick("jack", e)}>这是一个按钮</button>
    </div>
  );
};

export default EventFc;
```

### 1.4 react组件

概念：一个组件就是用户界面的一部分，它可以有自己的逻辑和外观，组件之间可以互相嵌套，也可以复用多次

![image-20240623183409020](https://cdn.fengxianhub.top/resources-master/image-20240623183409020.png)

组件化能让我们想搭积木一样完成开发。在React中，组件就是一个`首字母大写的函数`，内部存放了组件的逻辑和视图UI，渲染组件只需要把组件当作标签书写即可

### 1.5 hooks

React 提供了一些常用的钩子函数，用于在函数组件中添加状态管理、副作用操作等功能

| 钩子函数            | 描述                                                     |
| :------------------ | :------------------------------------------------------- |
| useState            | 用于在函数组件中添加状态。                               |
| useEffect           | 用于处理副作用操作。                                     |
| useContext          | 用于在函数组件中访问 React 的上下文。                    |
| useReducer          | 用于在函数组件中使用 reducer 模式管理复杂的状态逻辑。    |
| useCallback         | 用于缓存回调函数，避免在每次重新渲染时创建新的回调函数。 |
| useMemo             | 用于缓存计算结果，避免在每次重新渲染时重新计算。         |
| useRef              | 用于在函数组件中创建可变的引用。                         |
| useImperativeHandle | 用于自定义暴露给父组件的实例值或函数。                   |

#### 1.5.1 useState

useState是一个Reack Hook（函数），它运行我们向组件添加一个状态便改良，从而控制影响组件的渲染结果，和普通js变量不同的是，状态变量一旦发生变化，组件的视图UI也会跟着发生变化（`数据驱动视图`）

>状态不可变

在React中，状态被认为是只读的，我们应该始终`替换它而不是修改它`，直接修改状态不能引起视图更新

>修改对象状态

![image-20240623185051297](https://cdn.fengxianhub.top/resources-master/image-20240623185051297.png)

### 1.6 样式处理





















