# k8s

## 整体架构

先上一个总体的架构图

![Kubernetes 组件](https://cdn.fengxianhub.top/resources-master/kubernetes-cluster-architecture.svg)

其中组件基本功能如下：

>控制平面（Master节点）

- api-server：接口服务，基于`REST`风格开放K8s接口的服务（所有的服务都依赖于此）
- kube-controller-manager：控制器管理器，管理各个类型的控制器；针对k8s中的各种资源进行管理
- cloud-controller-manager：云控制器管理器，第三方云平台提供的控制器API对接管理功能
- kube-scheduler：调度器，负责将`pod`基于一定算法，将其调用到合适的节点（服务器）上
- etcd：k8s的分布式一致性数据库，基于`Raft`算法

>节点（Node）

- kubelet：负责`pod`的生命周期、存储管理、网络资源
- kube-proxy：网络代理，负责service的服务发现、负载均衡（4层均衡）
- container-runtime：容器运行时环境（docker、containerd、CRI-O）
- pod：容器的集合，一个pod里可以拥有多个容器

>附加组件

- kube-dns
- Ingress
- Prometheus
- Dashboard
- Federation：集群间控制
- es：分布式日志数据搜索

## 资源与对象

>在K8s中将所有的东西都抽象为资源，如`Pod`、`Service`、`Node`等都是资源，**对象**就是资源的**实例**，是持久化的实体，如某个具体的Pod，某个具体的Node，k8s使用这些实体表示整个集群的状态
>
>对象的创建、删除、修改都是通过`Api server`组件提供的API接口进行实现的，kubectl也是使用rest API实现的

### 资源清单



### pod

Pod（容器组）是k8s中最小的可部署单元，一个Pod至少包含了一个应用程序容器、存储资源、一个唯一的网络ip地址，以及一些确定容器该如何运行的选项

pod中第一个容器是`pause`

![image-20240115230437691](https://cdn.fengxianhub.top/resources-master/image-20240115230437691.png)



## k8s核心概念

![image-20240116220644226](https://cdn.fengxianhub.top/resources-master/image-20240116220644226.png)

### 资源的分类

在k8s集群中，一切皆为资源

![image-20240116205553997](https://cdn.fengxianhub.top/resources-master/image-20240116205553997.png)



### DamonSet

可以通过节点亲和力来配置当前节点是否启动`DamonSet`的进程

![image-20240116205608350](https://cdn.fengxianhub.top/resources-master/image-20240116205608350.png)

### service/ingress

我们把流量分为`南北流量`和`东西流量`

- service实现`东西流量`
- ingress实现`南北流量`

![image-20240116210704727](https://cdn.fengxianhub.top/resources-master/image-20240116210704727.png)

下面再来几张图来介绍二者的区别

![image-20240116214727474](https://cdn.fengxianhub.top/resources-master/image-20240116214727474.png)

### 命名空间级别

**configmap**





**Secret**



**downwardAPI**

downwardAPI这个模式和其他模式不一样的地方在于它不是为了存放容器的数据也不是用来进行容器和宿主机的数据交换的，而是让pod里的容器能够直接获取到这个pod对象本身的一些信息

downwardAPI提供了两种方式用于将pod的信息注入到容器内部：

- 环境变量：用于单个变量，可以将pod信息和容器信息直接注入容器内部
- volume挂载：将pod信息生成为文件，直接挂载到容器内部去



## kubectl使用

在任意节点使用kubectl

![image-20240116221823005](https://cdn.fengxianhub.top/resources-master/image-20240116221823005.png)
