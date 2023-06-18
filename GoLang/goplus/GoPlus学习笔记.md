# GoPlus学习笔记

## 1. 特性

在使用golang进行编程的时候，总是感觉有些不太顺手，例如没有`error handing`，没有`lambda`等等

还好这些特性`goplus`都给补上了

## 2. 安装

1. `git clone https://github.com/qiniu/goplus.git`
2. `cd goplus && go install -v ./...`
    执行完这几步后在GOPATH/bin下面会生成GoPlus的命令行工具qrun，qexp，qfmt和qgo

命令说明如下
 **qrun**:  执行工具，qrun xxx.gop 执行gop脚本
 **qexp**: 包装工具，qexp export `<goPkgPath> `生成go包的GoPlus包装层
 **qfmt**: 格式化工具，qfmt xxx.gop 格式化gop脚本
 **qgo**: 转换工具，qgo <gop包名称> 将gop文件转换为go文件



