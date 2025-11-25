# 使用cluade+openspec完成订单对账系统

>近几年AI编程（例如claude）非常火热，vibe coding（氛围编程）概念应运而生，笔者也尝试使用vibe coding进行开发，体验过后，笔者更愿意将`vibe coding`称之为`凭感觉编程`，因为传统“ vibe coding ”（凭感觉编程）模式容易带来的不可预测性和低质量问题。
>
>以下是笔者总结的几个`vibe coding（凭感觉编程）`开发过程中带来的一些问题，在 OpenSpec 出现之前，开发者与 AI 的协作方式通常是“vibe coding”，即通过零散、模糊的自然语言对话来指导 AI 编写代码。这种方式引入了巨大的不确定性：
>
>- **对开发者而言**：AI 经常产生“幻觉”，遗漏关键需求或添加无关功能，导致开发者需要花费大量时间调试和重构AI生成的代码，反而降低了整体效率。
>- **对项目经理而言**：基于模糊提示的工作流难以控制项目范围，返工导致项目延期，且由于缺乏正式计划，任何变更都无法追溯。
>- **对技术负责人而言**：每个开发者及其 AI 助手可能对目标有不同的理解，导致代码库风格不一、架构混乱，难以维护代码质量和一致性。
>
>简单来说，根本问题在于**缺乏一个稳定、可验证的“唯一真相来源”**。AI 被迫猜测用户的模糊指令，使得一个强大的工程伙伴变成了一个反复无常的协作者。

# SDD

基于上述痛点，**SDD**（Spec-Driven Development）概念应运而生，SDD是一种软件开发的**方法论**或**模式**。它的核心思想是：**在写代码之前，先写“规范”（Specification）**

这里的“规范”是对系统行为的精确描述——**它应该做什么**，而不是**怎么做的**。

**SDD 的核心特点：**

1. **规范先行**：代码是对规范的实现，而不是对模糊想法的翻译。
2. **规范即契约**：规范是开发者、团队、以及 AI 之间的共同承诺。
3. **规范驱动变更**：任何功能修改，都从修改规范开始。

**举个例子：**

没有 SDD 的工作流：“帮我加个登录功能... 哦不，密码要加密... 再改一下...”

有 SDD 的工作流：

> 1. 先写规范：登录功能需要用户名密码、密码加密方式、错误提示规则...
> 2. 规范确认后，AI 严格按照规范写代码
> 3. 代码与规范一致，很少返工

目前基于SDD思想有几套不同的实现，OpenSpec、Spec-Kit 和 BMAD。主流使用`OpenSpec`较多，这里很容搞混淆，SDD 并不是 OpenSpec 发明的——这个思想在传统软件工程中一直存在（比如“契约优先开发”、“文档驱动开发”），但它在 AI 编程时代焕发了新的生命力。



# 具体使用

安装openspec

```shell
npm install -g @fission-ai/openspec@latest
```

我们先来看看openspec的一些命令

```shell
$ openspec help
Usage: openspec [options] [command]

AI-native system for spec-driven development

Options:
  -V, --version                      output the version number
  --no-color                         Disable color output
  -h, --help                         display help for command

Commands:
  init [options] [path]              Initialize OpenSpec in your project
  update [options] [path]            Update OpenSpec instruction files
  list [options]                     List items (changes by default). Use --specs to list specs.
  view                               Display an interactive dashboard of specs and changes
  change                             Manage OpenSpec change proposals
  archive [options] [change-name]    Archive a completed change and update main specs
  spec                               Manage and view OpenSpec specifications
  config [options]                   View and modify global OpenSpec configuration
  schema                             Manage workflow schemas [experimental]
  validate [options] [item-name]     Validate changes and specs
  show [options] [item-name]         Show a change or spec
  feedback [options] <message>       Submit feedback about OpenSpec
  completion                         Manage shell completions for OpenSpec CLI
  status [options]                   Display artifact completion status for a change
  instructions [options] [artifact]  Output enriched instructions for creating an artifact or applying tasks
  templates [options]                Show resolved template paths for all artifacts in a schema
  schemas [options]                  List available workflow schemas with descriptions
  new                                Create new items
  help [command]                     display help for command
```

中文翻译版本为

```shell
$ openspec help
用法: openspec [选项] [命令]

AI原生系统，用于规范驱动的开发

选项:
  -V, --version                      显示版本号
  --no-color                          禁用彩色输出
  -h, --help                          显示命令帮助

命令:
  init [选项] [路径]                   在当前项目中初始化 OpenSpec
  update [选项] [路径]                  更新 OpenSpec 指令文件
  list [选项]                          列出项目（默认显示变更）。使用 --specs 列出规范
  view                                 显示规范和变更的交互式仪表板
  change                               管理 OpenSpec 变更提案
  archive [选项] [变更名称]              归档已完成的变更并更新主规范
  spec                                 管理和查看 OpenSpec 规范
  config [选项]                        查看和修改全局 OpenSpec 配置
  schema                               管理工作流模式 [实验性功能]
  validate [选项] [项目名称]             验证变更和规范
  show [选项] [项目名称]                 显示变更或规范
  feedback [选项] <消息>                 提交关于 OpenSpec 的反馈
  completion                           管理 OpenSpec CLI 的 shell 补全
  status [选项]                        显示变更的制品完成状态
  instructions [选项] [制品]             输出创建制品或应用任务的增强指令
  templates [选项]                      显示模式中所有制品的解析模板路径
  schemas [选项]                        列出可用的工作流模式及其描述
  new                                   创建新项目
  help [命令]                          显示命令帮助
```



## 🚀 初学者重点掌握命令

作为新手，建议先掌握这几个核心命令：

### 1. **init** - 初始化项目

```shell
openspec init
# 在当前目录初始化 OpenSpec 项目
```



### 2. **list** - 查看内容

```shell
openspec list           # 查看变更列表
openspec list --specs   # 查看规范列表
```



### 3. **new** - 创建新内容

```shell
openspec new change     # 创建新的变更提案
openspec new spec       # 创建新的规范
```



### 4. **status** - 查看状态

```shell
openspec status [变更名称]  # 查看某个变更的完成状态
```



### 5. **validate** - 验证内容

```shell
openspec validate       # 验证当前变更和规范是否有效
```



## 工作流程

```shell
创建变更 → 写规范 → 设计方案 → 实现功能 → 归档变更
   ↑          ↑          ↑          ↑          ↑
 (change)   (spec)    (design)   (coding)   (archive)
```

```shell
1. 创建 Change（目录）
2. 写 Proposal（为什么做）
3. 写 Specs（需求和行为）
4. 写 Design（技术设计，可选）
5. 写 Tasks（开发任务）
6. 实现代码
7. 归档 Change
```

# 实战

## 插件安装

在实战前需要先安装一个插件`superpowers`，用来进行头脑风暴（对齐需求）

https://cloud.tencent.com/developer/article/2632535

可以在claude里进行看是否安装就位

![image-20260308232805224](https://cdn.fengxianhub.top/resources-master/image-20260308232805224.png)

插件安装在`~/.claude/plugins/marketplaces/`下，进行查看，可以发现claude的插件就是一个md文档

## 开始

进入项目路径，输入`openspec init`

![image-20260308211502388](https://cdn.fengxianhub.top/resources-master/image-20260308211502388.png)

执行后，项目中就有`openspec`目录了

## 创建变更

然后创建变更（也可以看下面，让claude创建）

```shell
$ openspec new change "dasher-balance-reconciliation"
✔ Created change 'dasher-balance-reconciliation' at openspec/changes/dasher-balance-reconciliation/ (schema: spec-driven)
$ ll openspec/changes/
total 4
drwxr-xr-x 1 Administrator 197121 0  3月  7 01:20 archive/
drwxr-xr-x 1 Administrator 197121 0  3月  8 22:52 dasher-balance-reconciliation/
```

>然后用自然语言进行描述，并且让AI使用openspec的规范，创建对应文件含义如下

```shell
├── openspec/
│   ├── AGENTS.md                # AI 助手操作规范 (关键文件)
│   ├── project.md                # 项目上下文说明文档 (可选)
│   ├── config.yaml               # 项目级配置文件
│   ├── schemas/                  # 自定义工作流模板 (可选)
│   │   └── your-custom-schema.yaml
│   ├── specs/                    # 当前已实现功能的最终规范 (只读，由归档更新)
│   │   ├── capability-A/
│   │   │   └── spec.md
│   │   └── capability-B/
│   │       └── spec.md
│   └── changes/                  # 所有进行中的变更提案
│       ├── archive/              # 已完成并归档的变更历史
│       │   ├── 2026-03-09-add-oauth/
│       │   │   ├── proposal.md
│       │   │   ├── tasks.md
│       │   │   └── specs/
│       │   │       └── auth/
│       │   │           └── spec.md
│       │   └── ...
│       └── your-change-id/       # 当前活跃的变更 (如: add-user-profile)
│           ├── .openspec.yaml     # (可选) 该变更专用的 schema 配置
│           ├── proposal.md         # 变更提案 (为什么改、改什么)
│           ├── tasks.md            # 实施步骤清单 (含复选框)
│           ├── design.md           # (可选) 技术设计方案
│           └── specs/              # 针对现有规范的增量修改 (Delta)
│               └── capability-A/   # 对应 specs/capability-A/
│                   └── spec.md     # 只包含 ADDED/MODIFIED 等标记的增量内容
```

其中需要额外关注的就是这几个文件，可以使用文本编辑器查看

```shell
.openspec.yaml     # (可选) 该变更专用的 schema 配置
│           ├── proposal.md         # 变更提案 (为什么改、改什么)
│           ├── tasks.md            # 实施步骤清单 (含复选框)
│           ├── design.md           # (可选) 技术设计方案
│           └── specs/              # 针对现有规范的增量修改 (Delta)
│               └── capability-A/   # 对应 specs/capability-A/
│                   └── spec.md     # 只包含 ADDED/MODIFIED 等标记的增量内容
```

## 进行头脑风暴

当ai创建好骨架之后，我们就要对`proposal(提案)`进行头脑风暴了，旨在让ai不断的提问，让其业务理解正确不偏差

直接在cli里输入`/superpowers:brainstorm`，接着会不断在cli里对你进行提问，并且会修改`proposal.md`文件

![image-20260309001727749](https://cdn.fengxianhub.top/resources-master/image-20260309001727749.png)

全部问题回答完毕后，可以再检查下`proposal.md`、`design.md`和`tasks.md`

然后就是进入coding阶段，开发完毕后再进行调试，不断纠正

![image-20260309003435674](https://cdn.fengxianhub.top/resources-master/image-20260309003435674.png)

会启动多个agent进行开发并测试

![image-20260309005445887](https://cdn.fengxianhub.top/resources-master/image-20260309005445887.png)

# 附录

1. 【openspec github】https://github.com/Fission-AI/OpenSpec