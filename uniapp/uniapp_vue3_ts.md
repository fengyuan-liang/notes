# uniapp知识点

## 1. 项目架构相关

```shell
$ npx degit dcloudio/uni-preset-vue#vite-ts my-vue3-project
```

项目目录

![image-20231109233208935](https://cdn.fengxianhub.top/resources-master/image-20231109233208935.png)

添加vscode 相关uniapp插件

```shell
$ pnpm i -D @types/wechat-miniprogram @uni-helper/uni-app-types

如果发现没有报错，可以改成这个配置项："vueCompilerOptions": {"nativeTags": ["block", "component", "template", "slot"]},
```

![image-20231117000450400](https://cdn.fengxianhub.top/resources-master/image-20231117000450400.png)

设置文件关联取消报错

![image-20231117001825015](https://cdn.fengxianhub.top/resources-master/image-20231117001825015.png)
