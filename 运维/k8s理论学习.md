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























