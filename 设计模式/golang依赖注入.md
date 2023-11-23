# golang依赖注入

很多人都是依赖注入是`Spring`的那一套东西，golang并不需要依赖注入

我们来看平时写单测的时候常见的一个`打桩`的场景

>打桩常用的Mock框架有：
>
>- https://github.com/golang/mock  （缺点：需要手动生成mock代码）
>- https://github.com/agiledragon/gomonkey （支持arm架构）

```go
func NewDemoController(demoService DemoService) *DemoController {
  return &DemoController{
    demoService: demoService
  }
}

struct DemoController {
  demoService DemoService
}

func (d *DemoController) Hello() Response {
  id := d.Ctx.getString(":id")
  if person, err := d.demoService.GetPerson(id); err != nil {
    return Reponse.Error(404, "can not this person")
  }
  return Response.Success(fmt.Sprintf("hello, %s", person.name))
}
```

然后编写单元测试用例

```go
struct FakeDemoService {
  person: *Person
  err: error
}

func (f *FakeDemoService) GetPerson(id: string) (*Person, error) {
  return f.person, f.err
}

func Test_demoController_Hello_Success(t *testing.T) {
  fakeDemoService := &FakeDemoService{
    person: &Person{Name: "Joe"},
    err: nil
  }
  controller := NewDemoController(fakeDemoService)
  resp := controller.Hello("1234")
  assert.Equalf(t, resp.code, 200, "status code should be 200")
  assert.Equalf(t, resp.msg, "hello, ", "status code should be 200")
}

func Test_demoController_Hello_Failed(t *testing.T) {
  fakeDemoService := &FakeDemoService{
    person: nil,
    err: fmt.Errorf("Not Found")
  }
  controller := NewDemoController(fakeDemoService)
  resp := controller.Hello("1234")
  assert.Equalf(t, resp.code, 404, "status code should be 404")
}
```

以上的测试用例，充分说明依赖注入的重要性，尤其是在追求高代码测试覆盖率的前提下。

尽管是手动依赖注入，但远比给测试代码 **打桩** 优雅多了，严格来说 `打桩` 也是一种非常不优雅的[依赖注入](https://www.zhihu.com/search?q=依赖注入&search_source=Entity&hybrid_search_source=Entity&hybrid_search_extra={"sourceType"%3A"answer"%2C"sourceId"%3A3118817500})

自动打桩工具如下：

```go
// 模拟的价格查询服务
type MockPriceService struct {
	mock.Mock
}

// 模拟价格查询服务的查询方法
func (m *MockPriceService) GetPrice(itemID string) float64 {
	args := m.Called(itemID)
	return args.Get(0).(float64)
}

// 被测试的函数
func CalculatePrice(itemID string, priceService PriceService) float64 {
	price := priceService.GetPrice(itemID)
	// 进行价格计算逻辑
	return price * 1.1
}

// 测试代码
func TestCalculatePrice(t *testing.T) {
	// 创建模拟的价格查询服务
	mockPriceService := new(MockPriceService)
	// 定义模拟的行为
	mockPriceService.On("GetPrice", "item123").Return(10.0)

	// 注入模拟对象进行测试
	result := CalculatePrice("item123", mockPriceService)

	// 验证预期结果
	expected := 11.0
	assert.Equal(t, expected, result)
}
```



# React 依赖注入

>- https://ruanyifeng.com/blog/2019/09/react-hooks.html

当React 推出 `Hooks` 时，社区的评价可以分为两类：一是 `Mixin` 和 `HOC` 的替代品，二是 `Monad` 的替代品。

先说 `Mixin` 和 `HOC` 的替代品，其实当我第一眼看到 `Mixin` 的时候，我的第一反应是 **面向对象** 和 **依赖注入** 都诞生这么多年，前端搞代码复用为啥不借鉴一下？

如果觉得通过 `useIoC` 依赖注入子组件，并没有比通过 `children` 传递子组件更优雅，那就来个复杂的例子，比如实现一个 `Modal` 组件：

```react
import { useIoC } from "Com/app/hooks/ioc";
import { FC } from "react";
import { Button } from "../basic/button";

const {define, inject} = useIoC()

export const Header: FC<{title: string}> = define((props) => {
    return (
        <h3>{props.title}</h3>
    )
})

export const Body: FC = define(() => {
    return (<></>)
})

export const Footer: FC<{confirm: string, cancel: string}> = define((props) => {
    return (<div className="two buttons">
            <Button type="primary">{props.confirm}</Button>
            <Button type="grey">{props.cancel}</Button>
        </div>)
})

export const Modal: FC = define((props) => {
    const header = inject(Header, props)
    const body = inject(Body, props)
    const footer = inject(Footer, props)
    return <div className="dimmer">
        <div className="modal">
            <div className="header">{header({title: ""})}</div>
            <div className="body">{body({})}</div>
            <div className="center footer">{footer({confirm: "Confirm", cancel: "Cancel"})}</div>
        </div>
    </div>
})


"use client";

import { FC, useState } from "react";
import { Button } from "./components/basic/button";
import { IconButton } from "./components/basic/iconButton";
import { Body, Footer, Header, Modal } from "./components/modal/modal";
import { useIoC } from "./hooks/ioc";

const {define, inject} = useIoC()

define(Header, () => <p className="title">注入成功！</p>)

define(Body, () => <div>我是被注入的内容</div>)

const CustomFooter: FC<{onConfirm: () => void, onCancel: () => void}> = (props) => {
    return (<div className="two buttons">
        <a className="primary button" onClick={props.onConfirm}>确定</a>
        <a className="grey button" onClick={props.onCancel}>取消</a>
    </div>);
  }

export default function Home() {
  const [visible, toggleVisible] = useState(false)
  const [open, close] = [() => toggleVisible(true), ()=>toggleVisible(false), ]
  define(Footer, () => <CustomFooter onConfirm={close} onCancel={close}></CustomFooter>)
  const modal = inject(Modal)

  return (
    <div>
      <p>Icon Button: <IconButton onClick={open}></IconButton></p>
      <p>Normal Button: <Button>普通按钮</Button></p>
      { visible && modal({}) }
    </div>
  );
}
```

像 `Modal` 和 `Tab` 等组件往往需要多个children，这时候React是无能为力的，即便像 `Vue` 、`Qwik` 等框架选择 `Web Component` 规范的 `Named Slot` 勉强解决上述问题，但 `Named Slot` 还存在 **不支持类型检查** 和 **个数有限** 两个已知问题。

以 `Tab` 为例，除了 `TabHead` 一个 `Named Slot` 以外，还有无限个的 `TabContent` Slot，再说如果要实现 `TabContent` 内部一个按钮被点击后关闭当前Tab，用Slot实现起来非常麻烦，跟优雅完全不沾边。

## 分离视图和逻辑控制

在写 `useIoC` 之前，我用过不少开源的第三方封装UI库，比如 `Element UI` 、`Ant Design` 和 `Materi UI` ，它们提供的组件使用起来都不顺手。

下面就用 `Notification` 组件，来展示一下理想中的UI库组件：

```react
import { useIoC } from "Com/app/hooks/ioc";
import { FC, ReactNode, useEffect, useState } from "react";

const {define, inject} = useIoC()

export interface Notifier {
    info(msg: string, timeout?: number): void
    warn(msg: string, timeout?: number): void
    error(msg: string, timeout?: number): void
}

export type MsgType = "info" | "warn" | "error";
export type Msg = {
    type: MsgType,
    text: string
    expiredAt: number
}

function newMsg(type: MsgType, msg: string, timeout = 1000): Msg {
    const now = new Date().getTime()
    return {type: type, text: msg, expiredAt: now + timeout}
}

export const Notification: FC<{msgs: Msg[], remove: (id: number) => void}> = define((props) => {
    return <ul className="notification">
        {
            props.msgs.map(msg => (
                <li key={msg.expiredAt} className={`${msg.type} item`}>
                    <span>{msg.text}</span>
                    <a className="icon" onClick={() => props.remove(msg.expiredAt)}>x</a>
                </li>
            ))
        }
    </ul>
})

export const useNotification: (props?: any) => [ReactNode, Notifier] = (props: any) => {
    const notification = inject(Notification, props)
    const [msgs, list] = useState(new Array<Msg>())
    useEffect(() => {
        const interval =setInterval(() => {
            const now = new Date().getTime()
            list(old => old.filter(msg => msg.expiredAt > now))
        }, 1000)
        return () => clearInterval(interval)
    }, [])

    const remove = function(id: number) {
        list(old => old.filter(msg => msg.expiredAt != id))
    }

    const notifier: Notifier = {
        info: function(msg: string, timeout = 5000) {
            list((old)=> [...old, newMsg("info", msg, timeout)])
        },
        warn: function(msg: string, timeout = 5000) {
            list((old)=> [...old, newMsg("warn", msg, timeout)])
        },
        error: function(msg: string, timeout = 5000) {
            list((old)=> [...old, newMsg("error", msg, timeout)])
        }
    }
    return [notification({msgs: msgs, remove: remove}), notifier]
}
```

通过依赖注入，可以把大量无关的内容放到方法体以外，做到 `关注点分离` ，代码可读性答大幅提升。

使用：

```react
"use client";

import { Button } from "./components/basic/button";
import { useNotification } from "./components/notification";

export default function Home() {
  const [notification, notifier] = useNotification()
  return (
      <Button onClick={() => notifier.info("info")}>通知</Button>
      <Button onClick={() => notifier.warn("warn")}>警告</Button>
      <Button onClick={() => notifier.error("error")}>错误</Button>
      {notification}
  );
}
```

这里，我把视图 `notification` 和 逻辑控制 `notifier` 分开，真正做到 `高内聚、低耦合` 。

我知道前端常见的做法是使用 `zustand` 这类状态管理框架，通过 `dispatchEvent` 方式来实现，但对于我来说，多少有点本末倒置了。

同样的，之前的 `Modal` 也应该有个 `useModal` 的hook：

```react
"use client";

import { Button } from "./components/basic/button";
import { useModal } from "./components/modal";

export default function Home() {
  const [dimmer, modal] = useModal()
  modal.onConfirm(() => console.log("确定"))
  modal.onCancel(() => console.log("取消"))
  return (<div>
    <Button onClick={()=>modal.open()}>打开</Button>
    {dimmer}
  </div>);
}
```

除此之外，还应该有 `useTab` 、 `useTable` 、`useMenu` 等hook，复杂组件应该把视图和逻辑控制分开，而不是通过 `visible && modal({})` 这样方式进行控制。
