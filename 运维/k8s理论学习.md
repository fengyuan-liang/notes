# k8s

# 整体架构

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

# 资源与对象

>在K8s中将所有的东西都抽象为资源，如`Pod`、`Service`、`Node`等都是资源，**对象**就是资源的**实例**，是持久化的实体，如某个具体的Pod，某个具体的Node，k8s使用这些实体表示整个集群的状态
>
>对象的创建、删除、修改都是通过`Api server`组件提供的API接口进行实现的，kubectl也是使用rest API实现的

## 资源清单



## pod

Pod（容器组）是k8s中最小的可部署单元，一个Pod至少包含了一个应用程序容器、存储资源、一个唯一的网络ip地址，以及一些确定容器该如何运行的选项

pod中第一个容器是`pause`

![image-20240115230437691](https://cdn.fengxianhub.top/resources-master/image-20240115230437691.png)



# k8s核心概念

![image-20240116220644226](https://cdn.fengxianhub.top/resources-master/image-20240116220644226.png)

## 资源的分类

在k8s集群中，一切皆为资源

![image-20240116205553997](https://cdn.fengxianhub.top/resources-master/image-20240116205553997.png)



## DamonSet

可以通过节点亲和力来配置当前节点是否启动`DamonSet`的进程

![image-20240116205608350](https://cdn.fengxianhub.top/resources-master/image-20240116205608350.png)

## service/ingress

我们把流量分为`南北流量`和`东西流量`

- service实现`东西流量`
- ingress实现`南北流量`

![image-20240116210704727](https://cdn.fengxianhub.top/resources-master/image-20240116210704727.png)

下面再来几张图来介绍二者的区别

![image-20240116214727474](https://cdn.fengxianhub.top/resources-master/image-20240116214727474.png)

## 命名空间级别

**configmap**





**Secret**



**downwardAPI**

downwardAPI这个模式和其他模式不一样的地方在于它不是为了存放容器的数据也不是用来进行容器和宿主机的数据交换的，而是让pod里的容器能够直接获取到这个pod对象本身的一些信息

downwardAPI提供了两种方式用于将pod的信息注入到容器内部：

- 环境变量：用于单个变量，可以将pod信息和容器信息直接注入容器内部
- volume挂载：将pod信息生成为文件，直接挂载到容器内部去



# kubectl使用

在任意节点使用kubectl

![image-20240116221823005](https://cdn.fengxianhub.top/resources-master/image-20240116221823005.png)



## 常用命令

```shell
$ kubectl scale deploy --replicas=1 deploy名字
```



# 深入Pod

![image-20240124225638491](https://cdn.fengxianhub.top/resources-master/image-20240124225638491.png)

## Pod探针 

![image-20240123231545613](https://cdn.fengxianhub.top/resources-master/image-20240123231545613.png)



```yaml
// 启动探针 注意：需要k8s版本在1.16以上
startupProbe:
  httpGet:
    path: /health
    port: 8080
    scheme: HTTP
  failureThreshold: 30
  periodSeconds: 10
  timeoutSeconds: 5
// 存活探针
livenessProbe:
  failureThreshold: 5
  httpGet:
    path: /health
    port: 8080
    scheme: HTTP
  initialDelaySeconds: 60
  periodSeconds: 10 // 10s请求一次，探测是否存活了
// 就绪探针
readinessProbe:
  failureThreshold: 5 // 允许最大错误次数
  httpGet:
    path: /health
    port: 8080
    scheme: HTTP
  periodSeconds: 60 
  sucessThreshold: 1 // 指定成功认定为健康的连续探测次数。只有在连续成功探测次数达到该值时，容器才被认为是健康的
  timeoutSeconds: 10 // 10s请求一次，探测是否存活了
```

## pod生命周期

![image-20240124001443837](https://cdn.fengxianhub.top/resources-master/image-20240124001443837.png)

### 生命周期参数

我们可以设置pod的生命周期

```yaml
spec: # 期望按照里面的描述进行创建
  containers: # 容器的描述
  - name: nginx-pod
    image: nginx:1.21.1
    imagePullPolicy: IfNotPresent # 本地没有再去远程拉取
    lifecycle: # 生命周期的配置
      postStart:  # 生命周期启动阶段要做的事情，不一定在容器的command之前运行
        exec:
          command:
          - sh
          - -c
          - "echo '<h1>Pre start</h1>' > /usr/share/nginx/html/index.html"
      preStop:
        exec:
          command:
          - sh
          - -c
          - "sleep 50 && echo '<h1>Pre Stop</h1>' > /usr/share/nginx/html/index.html"
```

可以通过来控制pod销毁后等待的时间

```yaml
spec: # 期望按照里面的描述进行创建
  terminationGracePeriodSeconds: 10
```

![image-20240124230943880](https://cdn.fengxianhub.top/resources-master/image-20240124230943880.png)

也可以修改等待的时间

![image-20240124233648321](https://cdn.fengxianhub.top/resources-master/image-20240124233648321.png)



## 完整例子

```yaml
apiVersion: v1
kind: Pod # 定义资源类型，也可以是Deloyment StatefulSet这一类资源
metadata: # pod相关的元数据
  name: nginx-demo
  labels:
    type: app
    version: v1.0.0
  namespace: test
spec: # 期望按照里面的描述进行创建
  terminationGracePeriodSeconds: 10
  containers: # 容器的描述
  - name: nginx-pod
    image: nginx:1.21.1
    imagePullPolicy: IfNotPresent # 本地没有再去远程拉取
    lifecycle: # 生命周期的配置
      postStart:  # 生命周期启动阶段要做的事情，不一定在容器的command之前运行
        exec:
          command:
          - sh
          - -c
          - "echo '<h1>Pre start</h1>' > /usr/share/nginx/html/index.html"
      preStop:
        exec:
          command:
          - sh
          - -c
          - "sleep 50 && echo '<h1>Pre Stop</h1>' > /usr/share/nginx/html/index.html"
    startupProbe:
      httpGet:
        path: /index.html
        port: 80
        scheme: HTTP
      failureThreshold: 30
      periodSeconds: 10
      timeoutSeconds: 5
    command:
    - nginx
    - -g
    - 'daemon off;' # nginx -g 'daemon off;'
    workingDir: /usr/share/nginx/html
    ports:
    - name: http
      containerPort: 80
      protocol: TCP
    env:
    - name: JVM_OPTS
      value: '-Xms128m -Xmx128m'
    resources:
      requests: # 最小需要申请多少资源
        cpu: 100m # 1000m是一个核心 100m即一个核心的百分之十
        memory: "128Mi" # 现在内存最少使用128M
      limits: # 资源最多使用
        cpu: 200m
        memory: 256Mi
```

# RS和Deployment

![image-20240124235142206](https://cdn.fengxianhub.top/resources-master/image-20240124235142206.png)

## 修改Label

```shell
lfy@ubuntu:~/k8s/namespace/test/pods$ kubectl get po --show-labels -n test
NAME         READY   STATUS    RESTARTS   AGE   LABELS
nginx-demo   1/1     Running   0          49s   type=app,version=v1.0.0
lfy@ubuntu:~/k8s/namespace/test/pods$ kubectl label po nginx-demo author=lfy -n test
pod/nginx-demo labeled
lfy@ubuntu:~/k8s/namespace/test/pods$ kubectl get po --show-labels -n test
NAME         READY   STATUS    RESTARTS   AGE     LABELS
nginx-demo   1/1     Running   0          2m18s   author=lfy,type=app,version=v1.0.0
lfy@ubuntu:~/k8s/namespace/test/pods$ kubectl label po nginx-demo author=lfy_v2 --overwrite -n test
pod/nginx-demo labeled
lfy@ubuntu:~/k8s/namespace/test/pods$ kubectl get po --show-labels -n test
NAME         READY   STATUS    RESTARTS   AGE     LABELS
nginx-demo   1/1     Running   0          7m10s   author=lfy_v2,type=app,version=v1.0.0
```

上述方式都是临时修改，可以通过`kubectl edit 资源`修改yml文件

## 查询Label

```shell
lfy@ubuntu:~/k8s/namespace/test/pods$ kubectl get po -l type=app -n test --show-labels
NAME         READY   STATUS    RESTARTS   AGE   LABELS
nginx-demo   1/1     Running   0          13m   author=lfy_v2,type=app,version=v1.0.0
lfy@ubuntu:~/k8s/namespace/test/pods$ kubectl get po -l type=app,version=v1.0.0 -n test --show-labels
NAME         READY   STATUS    RESTARTS   AGE   LABELS
nginx-demo   1/1     Running   0          14m   author=lfy_v2,type=app,version=v1.0.0
lfy@ubuntu:~/k8s/namespace/test/pods$ kubectl get po -l type=app,version in (v1.0.0, v1.0.1) -n test --show-labels
-bash: syntax error near unexpected token `('
lfy@ubuntu:~/k8s/namespace/test/pods$ kubectl get po -l 'type=app,version in (v1.0.0, v1.0.1)' -n test --show-labels
NAME         READY   STATUS    RESTARTS   AGE   LABELS
nginx-demo   1/1     Running   0          14m   author=lfy_v2,type=app,version=v1.0.0
lfy@ubuntu:~/k8s/namespace/test/pods$ kubectl get po -l 'type=app,versionv1.0.1)' -n test --show-labels
Error from server (BadRequest): Unable to find "/v1, Resource=pods" that match label selector "type=app,versionv1.0.1)", field selector "": unable to parse requirement: found ')', expected: in, notin, =, ==, !=, gt, lt
lfy@ubuntu:~/k8s/namespace/test/pods$ kubectl get po -l 'type=app,version!=v1.0.1' -n test --show-labels
NAME         READY   STATUS    RESTARTS   AGE   LABELS
nginx-demo   1/1     Running   0          15m   author=lfy_v2,type=app,version=v1.0.0
```

三处app: nginx-deploy，第一处是当前deployment自身的标签，第二处是筛选该deployment管理的pod，第三处是pod模板创建的pod的标签，这样理解对不对？



## 回滚镜像

```shell
history limit来更改保持的revision数

案例
更新deployment时参数不小心写错，如nginx:1.9.1写成了nginx:1.91
kubectl set image deployment/nginx-deploy nginx=nginx:1.91 -n test

监控滚动升级状态，由于镜像名称错误，下载镜像失败，因此更新过程会卡住
kubectl rollout status deployments nginx-deploy -n test
为了修复这个问题，我们需要找到需要回退的revision进行回滚，通过【kubectl rollout history deployment/nginx-deploy】可以获取revision的列表
通过【kubectl rollout history deployment/nginx-deployment --revision=2】可以查看详细信息

确认要回退的版本后，可以通过【kubectl rollout undo deployment/nginx-deploy】可以回滚到上一个版本或者指定的revision版本【kubectl rollout undo deployment/nginx-deploy --to-revision=2】

可以通过设置spec.revisionHistoryLimit来指定deployment保留了多少revision，如果为0就无法进行回滚了
```

```shell
kubectl rollout status deployments nginx-deploy -n test
```

```shell
// 故意改错template里面的描述
lfy@ubuntu:~/k8s/namespace/test/pods$ kubectl set image deployment/nginx-deploy nginx=nginx:1.91 -n test
deployment.apps/nginx-deploy image updated
lfy@ubuntu:~/k8s/namespace/test/pods$ kubectl get po --show-labels -n test
NAME                            READY   STATUS              RESTARTS   AGE   LABELS
nginx-demo                      1/1     Running             0          47h   author=lfy_v2,type=app,version=v1.0.0
nginx-deploy-58d5f88b69-6m6xv   1/1     Running             0          23h   app=nginx-deploy,pod-template-hash=58d5f88b69
nginx-deploy-58d5f88b69-lv68j   1/1     Running             0          23h   app=nginx-deploy,pod-template-hash=58d5f88b69
nginx-deploy-58d5f88b69-vtml8   1/1     Running             0          23h   app=nginx-deploy,pod-template-hash=58d5f88b69
nginx-deploy-66bf86f787-z9f54   0/1     ContainerCreating   0          12s   app=nginx-deploy,pod-template-hash=66bf86f787
lfy@ubuntu:~/k8s/namespace/test/pods$ kubectl get po --show-labels -n test
NAME                            READY   STATUS             RESTARTS   AGE     LABELS
nginx-demo                      1/1     Running            0          47h     author=lfy_v2,type=app,version=v1.0.0
nginx-deploy-58d5f88b69-6m6xv   1/1     Running            0          23h     app=nginx-deploy,pod-template-hash=58d5f88b69
nginx-deploy-58d5f88b69-lv68j   1/1     Running            0          23h     app=nginx-deploy,pod-template-hash=58d5f88b69
nginx-deploy-58d5f88b69-vtml8   1/1     Running            0          23h     app=nginx-deploy,pod-template-hash=58d5f88b69
nginx-deploy-66bf86f787-z9f54   0/1     ImagePullBackOff   0          3m52s   app=nginx-deploy,pod-template-hash=66bf86f787
// 进行回滚，但是之前的有问题所以会报错
lfy@ubuntu:~/k8s/namespace/test/pods$ kubectl rollout status deployments nginx-deploy -n test
Waiting for deployment "nginx-deploy" rollout to finish: 1 out of 3 new replicas have been updated...
error: deployment "nginx-deploy" exceeded its progress deadline
// 查看版本记录
lfy@ubuntu:~/k8s/namespace/test/pods$ kubectl rollout history deployment/nginx-deploy -n test
deployment.apps/nginx-deploy
REVISION  CHANGE-CAUSE
1         <none>
2         <none>
3         <none>
// 数字越大越新 我们可以查看上一个版本的镜像信息
lfy@ubuntu:~/k8s/namespace/test/pods$ kubectl rollout history deployment/nginx-deploy --revision=2 -n test
deployment.apps/nginx-deploy with revision #2
Pod Template:
  Labels:       app=nginx-deploy
        pod-template-hash=58d5f88b69
  Containers:
   nginx:
    Image:      nginx:latest
    Port:       <none>
    Host Port:  <none>
    Environment:        <none>
    Mounts:     <none>
  Volumes:      <none>
 // 进行回滚
 lfy@ubuntu:~/k8s/namespace/test/pods$ kubectl rollout undo deployment/nginx-deploy --to-revision=2 -n test
deployment.apps/nginx-deploy rolled back
lfy@ubuntu:~/k8s/namespace/test/pods$ kubectl get po --show-labels -n test
NAME                            READY   STATUS    RESTARTS   AGE   LABELS
nginx-demo                      1/1     Running   0          47h   author=lfy_v2,type=app,version=v1.0.0
nginx-deploy-58d5f88b69-6m6xv   1/1     Running   0          24h   app=nginx-deploy,pod-template-hash=58d5f88b69
nginx-deploy-58d5f88b69-lv68j   1/1     Running   0          24h   app=nginx-deploy,pod-template-hash=58d5f88b69
nginx-deploy-58d5f88b69-vtml8   1/1     Running   0          24h   app=nginx-deploy,pod-template-hash=58d5f88b69
```

## 扩容缩容



```shell
lfy@ubuntu:~$ kubectl scale --replicas=6 deploy nginx-deploy -n test
deployment.apps/nginx-deploy scaled
lfy@ubuntu:~$ kubectl get deploy -n test
NAME           READY   UP-TO-DATE   AVAILABLE   AGE
nginx-deploy   6/6     6            6           41h
// 可以看到RS的数量还是三个
lfy@ubuntu:~$ kubectl get rs -n test
NAME                      DESIRED   CURRENT   READY   AGE
nginx-deploy-58d5f88b69   6         6         6       40h
nginx-deploy-66bf86f787   0         0         0       16h
nginx-deploy-84657b87     0         0         0       41h
lfy@ubuntu:~$ kubectl get po -n test
NAME                            READY   STATUS    RESTARTS   AGE
nginx-deploy-58d5f88b69-285m9   1/1     Running   0          3m50s
nginx-deploy-58d5f88b69-6m6xv   1/1     Running   0          40h
nginx-deploy-58d5f88b69-87wxm   1/1     Running   0          3m50s
nginx-deploy-58d5f88b69-d2jgf   1/1     Running   0          3m50s
nginx-deploy-58d5f88b69-lv68j   1/1     Running   0          40h
nginx-deploy-58d5f88b69-vtml8   1/1     Running   0          40h
```

## 暂定和恢复

因为每次修改template信息后都会更新pod，我们可以先暂定等修改好了再进行更新

```shell
由于每次对pod template中的信息发生修改后，都会触发更新deployment操作，那么此时如果频繁修改信息，就会产生多次更新，而实际上只需要执行最后一次更新即可，当出现此类情况时我们就可以暂停【deployment】的【rollout】

通过【kubectl rollout pause deployment <name>】就可以实现暂定，直到你下次继续恢复后才会继续进行滚动更新，通过【kubectl rollout resume deployment <name>】恢复更新

尝试对容器进行修改，然后查看是否发生更新操作
kubectl set image deploy <name> nginx=nginx:1.17.9
kubectl get po
```



# statefulSet

![image-20240128230505191](https://cdn.fengxianhub.top/resources-master/image-20240128230505191.png)



# DaemonSet

为每一个匹配的Node都部署一个守护进程

可以使用守护进程收集Node上面的日志信息

![image-20240128232813692](https://cdn.fengxianhub.top/resources-master/image-20240128232813692.png)



```yaml
apiVersion: apps/v1
kind: DaemonSet
metadata:
  name: fluentd
spec:
  template:
    metadata
      labels:
        app: logging
        id: fluentd
    name: fluentd
    spec:
      containers:
      - name: fluentd-es
        image: agilestacks/fluentd-elasticsearch:v1.3.0
        env:
        - name: FLUENTD_ARGS
          value: -qq
        volumeMounts:
        - name: varlog
          mountPath: /var/lib/docker/containers
        - name: varlog
          mountPath: /var/log
      volumes:
        - hostPath:
            path: /var/lib/docker/containers
          name: containers
        - hostPath:
            path: /var/log
          name: varlog
```





