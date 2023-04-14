# K8s使用

>K8s学习教程：https://kuboard.cn/learning/

## 1. Kubernetes操作

首先我们看一下K8s的基本架构

![image-20221211110940010](https://cdn.fengxianhub.top/resources-master/202212111109250.png)

首先我们要了解Kubernetes在运行我们的资源时，关联到了哪些内容

* 资源的构建方式：

  * 采用kubectl的命令方式
  * yaml文件方式

- 在K8s中操作的最小单位为`Pod`，在一个`Pod`中可以跑多个`docker容器`

- 我们并不会直接去操作`Pod`，这些`Pod`会被`nameSpace`划分开，我们需要进入命名空间中去操作

  ![image-20221211111247439](https://cdn.fengxianhub.top/resources-master/202212111112534.png)

- 我们可以通过`kubectl get ns`获取系统默认的命名空间

  ![image-20221211111503828](https://cdn.fengxianhub.top/resources-master/202212111115926.png)

- 我们可以通过命令`kubectl create ns 【空间名】`来创建一个命名空间，通过命名空间来隔离容器

  ![image-20221211111648435](https://cdn.fengxianhub.top/resources-master/202212111116511.png)

### 1.1 Namespace

命名空间：主要是为了对`Kubernetes`中运行的资源进行过隔离， 但是网络是互通的，类似`Docker`的容器，可以将多个资源配置到一个NameSpace中。而NameSpace可以对不同环境进行资源隔离，默认情况下Kubernetes提供了default命名空间，在构建资源时，如果不指定资源，默认采用default资源。
**命令方式**：

```sh
# 查看现有的全部命名空间
kubectl get ns

# 构建命名空间
kubectl create ns 命名空间名称

# 删除现有命名空间， 并且会删除空间下的全部资源
kubectl delete ns 命名空间名称
```

**yaml文件方式**：（构建资源时，设置命名空间）

```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: test
```

### 1.2 pod

>Pod：Kubernetes运行的一组容器，Pod是Kubernetes的最小单位，但是对于Docker而然，Pod中会运行多个Docker容器

**命令方式**：

```sh
# 查看所有运行的pod
kubectl get pods -A

# 查看指定Namespace下的Pod
kubectl get pod [-n 命名空间]  #（默认default）

# 创建Pod
kubectl run pod名称 --image=镜像名称

# 查看Pod详细信息
kubectl describe pod pod名称

# 删除pod
kubectl delete pod pod名称 [-n 命名空间]  #（默认default）

# 查看pod输出的日志
kubectl logs -f pod名称

# 进去pod容器内部
kubectl exec -it pod名称 -- bash

# 查看kubernetes给Pod分配的ip信息，并且通过ip和容器的端口，可以直接访问
kubectl get pod -owide
```

**yaml方式（推荐）**：

```yaml
apiVersion: v1
kind: Pod
metadata:
  labels:
    run: 运行的pod名称
  name: pod名称
  namespace: 命名空间
spec:
  containers:
  - image: 镜像名称
    name: 容器名称

# 启动Pod：kubectl apply -f yaml文件名称
# 删除Pod：kubectl delete -f yaml文件名称
```

**Pod中运行多个容器**

```yaml
apiVersion: v1
kind: Pod
metadata:
  labels:
    run: 运行的pod名称
  name: pod名称
  namespace: 命名空间
spec:
  containers:
  - image: 镜像名称
    name: 容器名称
  - image: 镜像名称
    name: 容器名称
…………    
```

**启动后可以查看到**

|                         Kuboard效果                          |
| :----------------------------------------------------------: |
| ![image-20220104203155749](https://cdn.fengxianhub.top/resources-master/202205091418094.png) |

当我们在`namespace`中创建好一个容器后，我们会发现其实还是访问不了，因为如果我们想要自己的服务可以对外访问，就必须要有一个`service`，通过访问`service`才能够去访问我们的`pod`

![image-20221211113242290](https://cdn.fengxianhub.top/resources-master/202212111132403.png)

- 通过k8s提供的ip进行访问

  ![image-20221211113538522](https://cdn.fengxianhub.top/resources-master/202212111135683.png)

### 1.3 Deployment

>部署时，可以通过Deployment管理和编排Pod

**Deployment部署实现**：

- 命令方式

  ```sh
  # 基于Deployment启动容器
  kubectl create deployment deployment名称 --image=镜像名称
  # 用deployment启动的容器会在被删除后自动再次创建，达到故障漂移的效果
  # 需要使用deploy的方式删除deploy
  # 查看现在的deployment
  kubectl get deployment
  
  # 删除deployment
  kubectl delete deployment deployment名称
  
  # 基于Deployment启动容器并设置Pod集群数
  kubectl create deployment deployment名称 --image=镜像名称 --replicas 集群个数
  ```

- [配置文件方式](https://kubernetes.io/zh/docs/concepts/workloads/controllers/deployment/)

  ```yaml
  apiVersion: apps/v1
  kind: Deployment
  metadata:
    namespace: test
    name: nginx-deployment
    labels:
      app: nginx
  spec:
    replicas: 3
    selector:
      matchLabels:
        app: nginx
    template:
      metadata:
        labels:
          app: nginx
      spec:
        containers:
        - name: nginx
          image: nginx:latest
          ports:
          - containerPort: 80
  ```

  正常使用kubectl运行yaml即可

  ```sh
  kubectl apply -f deployment-nginx.yml
  ```

  ![image-20221211140918850](https://cdn.fengxianhub.top/resources-master/202212111409061.png)

### 1.4 Service

在上面的步骤中我们看到我们现在的`pod`现在还不能进行访问，所以我们需要设置暴露服务的`Service`，绑定`deployment`

来实现容器的负载均衡、自动路由

![image-20221211141056730](https://cdn.fengxianhub.top/resources-master/202212111410811.png)

可以将多个Pod对外暴露一个Service，让客户端可以通过Service访问到这一组Pod，并且可以实现负载均衡

**ClusterIP方式**：（ClusterIP是集群内部Pod之间的访问方式）

- 命令实现效果

  ```sh
  # 通过生成service映射一个Deployment下的所有pod中的某一个端口的容器
  kubectl expose deployment Deployment名称 --port=Service端口号 --target-port=Pod内容器端口
  # ex
  kubectl expose deployment nginx-deployment --port=9000 --target-port=80 -n test
  # 删除
  kubectl delete service nginx-deployment
  ```

- NodePort方式

  ClusterIP的方式只能在Pod内部实现访问，但是一般需要对外暴露网关，所以需要NodePort的方式Pod外暴露访问

  ```sh
  # 通过生成service映射一个Deployment下的所有pod中的某一个端口的容器
  kubectl expose deployment Deployment名称 --port=Service端口号 --target-port=Pod内容器端口 --type=NodePort
  kubectl expose deployment nginx-deployment --port=8888 --target-port=80 --type=NodePort
  # 
  kubectl expose deployment nginx-deployment --port=8081 --target-port=80 --type=LoadBalancer
  ```

  暴露之后就可以使用集群里任何一个结点的ip+后面的端口就行访问

  ![image-20230413215025584](https://cdn.fengxianhub.top/resources-master/202304132150977.png)

- yaml

  ```yaml
  apiVersion: apps/v1
  kind: Deployment
  metadata:
    namespace: test
    name: nginx-deployment
    labels:
      app: nginx-deployment
  spec:
    replicas: 3
    selector:
      matchLabels:
        app: nginx
    template:
      metadata:
        labels:
          app: nginx
      spec:
        containers:
        - name: nginx
          image: nginx:latest
          ports:
          - containerPort: 80
  ---
  apiVersion: v1
  kind: Service
  metadata:
    namespace: test
    name: nginx-deployment
    labels:
      app: nginx-deployment
  spec:
    selector:
      app: nginx
    ports:
    - port: 8888
      targetPort: 80
    type: NodePort
  ---
  
  ```

### 1.5 Ingress

Kubernetes推荐将`Ingress`作为所有`Service`的入口，提供统一的入口，避免多个服务之间需要记录大量的IP或者域名，毕竟`IP`可能改变，服务太多域名记录不方便。

Ingress底层其实就是一个Nginx， 可以在Kuboard上直接点击安装



|                         Kuboard安装                          |
| :----------------------------------------------------------: |
| ![image-20220105153343642](https://cdn.fengxianhub.top/resources-master/202205091418669.png) |
| **![image-20220105153416367](https://cdn.fengxianhub.top/resources-master/202205091418146.png)** |

因为副本数默认为1，但是k8s整体集群就2个节点，所以显示下面即为安装成功

|                           安装成功                           |
| :----------------------------------------------------------: |
| ![image-20220105153502619](https://cdn.fengxianhub.top/resources-master/202205091418072.png) |

可以将Ingress接收到的请求转发到不同的Service中。

推荐使用yaml文件方式

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: nginx-ingress
spec:
  ingressClassName: ingress
  rules:
  - host: nginx.mashibing.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: nginx-service
            port:
              number: 8888
```

|                          启动时问题                          |
| :----------------------------------------------------------: |
| ![image-20220105203819715](https://cdn.fengxianhub.top/resources-master/202205091418593.png) |

Kuboard安装的Ingress有admission的校验配置，需要先删除配置再启动

找到指定的ingress的校验信息，删除即可

|                           删除信息                           |
| :----------------------------------------------------------: |
| ![image-20220105204434044](https://cdn.fengxianhub.top/resources-master/202205091418390.png) |

```sh
# 查看校验webhook的配置
kubectl get -A ValidatingWebhookConfiguration

# 删除指定的校验
kubectl delete ValidatingWebhookConfiguration ingress-nginx-admission-my-ingress-controller
```

配置本地hosts文件

|                          配置hosts                           |
| :----------------------------------------------------------: |
| ![image-20220105204921272](https://cdn.fengxianhub.top/resources-master/202205091418443.png) |

记下来既可以访问在Service中暴露的Nginx信息

|                      服通过Ingress访问                       |
| :----------------------------------------------------------: |
| ![image-20220105205407393](https://cdn.fengxianhub.top/resources-master/202205091418593.png) |

### 1.6 Jenkins集成Kubernetes

**准备部署的yml文件** 【部署hnit-cms】

```yaml
apiVersion: apps/v1
kind: Deployment
metadata: 
  namespace: test
  name: hnit-cms
  labels:
    app: hnit-cms
spec:
  replicas: 2
  selector:
    matchLabels:
      app: hnit-cms
  template:
    metadata:
      labels:
        app: hnit-cms    
    spec:
      containers:
      - name: hnit-cms
        image: 192.168.30.17:9052/repo/hnit-cms:v1.0.0
        imagePullPolicy: Always
        ports:
        - containerPort: 8080
---
apiVersion: v1
kind: Service
metadata:
  namespace: test
  labels:
    app: hnit-cms
  name: hnit-cms  
spec:
  selector:
    app: hnit-cms
  ports:
  - port: 8081
    targetPort: 8080
  type: NodePort
---
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  namespace: test
  name: hnit-cms
spec:
  ingressClassName: ingress
  rules:
  - host: cms.hnit.cn
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: pipeline
            port:
              number: 8081
```

