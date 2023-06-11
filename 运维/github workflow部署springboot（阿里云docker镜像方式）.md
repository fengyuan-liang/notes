# github workflow使用docker部署springboot并推送到阿里云镜像仓库

>最近想通过github的`workflow`部署springboot项目（CI），网上看了很多文章，都是有这样那样的问题，最终花了一个下午的时间终于搞好了
>
>通过github的`workflow`，可以节省掉`jenkins`，而且感觉`workflow`语法比`pipeline `稍微简单一些，特此记录一下自己的过程，方便复习

这里我们使用：

- docker或者docker-compose或者Kubernetes部署（写对应的脚本即可，我这里是docker部署）
- 使用阿里云镜像仓库（dockerhub太慢了！github推阿里云非常快😁）

## 1. 建立你的actions

首先我们选择使用对应的打包工具，我这里使用`maven`

![image-20230429195347414](https://cdn.fengxianhub.top/resources-master/202304291953735.png)

选择好之后会在当前项目新建`./github/workflows`的目录，里面用来管理`workflow`相关的文件

详细的官方中文文档可以看这里：https://docs.github.com/zh/actions/using-workflows

![image-20230429195640564](https://cdn.fengxianhub.top/resources-master/202304291956728.png)

这里我起名叫`docker_build.yml`，其实都一样

## 2. 工作流脚本

工作流文件语法非常的简单，我这里把我的贴出来，可以根据自己项目的结构进行调整

大家只需要改登录Docker Hub的部分：这里需要看的服务有多少个模块，需要进入到最终jar包生成的地方然后`docker build`。其他的地方都差不多

```yml
name: Deploy with docker

on:
  push:
    # 分支
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  compile:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Set up JDK 8
        uses: actions/setup-java@v2
        with:
          java-version: '8.0'
          distribution: 'adopt'
      # maven缓存，不加的话每次都会去重新拉取，会影响速度
      - name: Dependies Cache
        uses: actions/cache@v2
        with:
          path: ~/.m2/repository
          key: ${{ runner.os }}-maven-${{ hashFiles('**/pom.xml') }}
          restore-keys: |
            ${{ runner.os }}-maven-
      # 编译打包
      - name: Build with Maven
        run: |
          mvn package -Dmaven.test.skip=true
      # 登录Docker Hub
      - name: Build the Docker image
        run: |
          docker version
          # 登录阿里云镜像仓库
          docker login --username=${{ secrets.DOCKER_HUB_USERNAME }} --password=${{ secrets.DOCKER_PASSWORD }} registry.cn-hangzhou.aliyuncs.com
          cd app/chat-front
          mkdir docker
          cp ./Dockerfile ./docker
          cp ./target/*.jar ./docker
          cd docker
          # 使用Dockerfile构建镜像
          docker build . --file Dockerfile --tag ${{ vars.hubAddr }}/${{ vars.USER_NAME }}/${{ vars.IMAGE_NAME }}:${{ vars.tag }}
          # 推送镜像到镜像仓库
          docker push ${{ vars.hubAddr }}/${{ vars.USER_NAME }}/${{ vars.IMAGE_NAME }}:${{ vars.tag }}
      # push后，用ssh连接服务器执行脚本    
      - name: 登录服务器, 执行脚本
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.SSH_REMOTE_HOST }}
          port: ${{ secrets.SSH_PORT }}
          username: ${{ secrets.SSH_USER }}
          password: ${{ secrets.SSH_PASSWORD }}
          # 执行脚本
          script: |
            # 部署脚本 后面的vars是传递给脚本的参数
            sh /root/script/deploy.sh ${{ vars.USER_NAME }} ${{ vars.IMAGE_NAME }} ${{ vars.PORT }} ${{ vars.CONTAINS_PORT }} ${{ vars.hubAddr }} ${{ vars.tag }}
```

看上去是不是很简单呢😆

### 2.1 触发事件

第一部分就是触发的事件了，我这里是希望每次合并`main`分支并且合并`PR`的时候就可以自动触发

```yml
on:
  push:
    # 分支
    branches: [ main ]
  pull_request:
    branches: [ main ]
```

### 2.2 密文和执行参数

这个工作流脚本是直接在我们项目里面的，所以里面的一些参数肯定是不能被别人看到的，我们可以通过`${{ secrets.xxx }}`的方式设置密文，密文设置后就看不到了，只能够更新；通过`${{ vars.xxx}}`设置运行的参数，例如设置docker对外暴露的端口等等

![image-20230429201234047](https://cdn.fengxianhub.top/resources-master/202304292012236.png)

执行参数就需要结合我们的脚本一起用了，一般是通过我们会通过`ssh`远程执行一个部署脚本`deploy.sh`，并且携带一些参数过去

![image-20230429202310715](https://cdn.fengxianhub.top/resources-master/202304292023907.png)

### 2.3 deploy.sh执行脚本

当我们打包好`docker镜像`之后，可以通过`ssh`远程执行我们自己服务器上的部署脚本，让脚本把之前跑的容器鲨死，把镜像删除，再重新拉取我们最新的镜像进行部署。其实有镜像了，那我们只需要将脚本改一改就可以部署`docker-compose`和`Kubernetes`

下面是我的脚本：

为了让脚本做到通用性，可以部署不同的项目，需要通过外面传入一些参数，确定具体要部署的项目

- user_name：就是你仓库的账号名，一般镜像拉取的`URL`的前面是带账号名的
- image_name：镜像的名字，也是你允许后容器的名字（可以自己改改脚本）
- PORT：访问容器的外部端口
- CONTAINS_PORT：容器自己的端口，例如mysql默认3306，Tomcat默认8080

```shell
# 这里的$1、$2对应上面传递过来的参数
user_name=$1
image_name=$2
PORT=$3
CONTAINS_PORT=$4
hubAddr=$5
tag=$6
# 如果传入的参数有一个为空，我们就提示他输入参数，然后退出
if [ "$1" == "" ]  || [ "$2" == "" ] || [ "$3" == "" ] || [ "$4" == ""]; then 
          echo "请输入参数"
            exit
fi

# 删除容器,就是删除旧的容器
# docker ps -a 获取所有的容器
# ｜ grep ${image_name} 得到这个容器 awk '${print $1}' 根据空格分割，输出第一项
containerId=`docker ps -a | grep ${image_name} | awk '{print $1}'`
if [ "$containerId" != "" ] ; then
        # 停止运行
docker stop $containerId
# 删除容器
docker rm $containerId
echo "Delete Container Success"
fi

# 删除镜像
# 获取所有的镜像，得到我们自己构建的镜像的id
imageId=`docker images | grep ${hubAddr}/${user_name}/${image_name} | awk '{print $3}'`
if [ "$imageId" != "" ] ; then
        # 删除镜像
docker rmi -f $imageId
echo "Delete Image Success"
fi
# 登录docker
# docker login -u lijiayan -p 你在docker hub上获取的密钥
# 拉取docker上新的镜像
docker pull ${hubAddr}/${user_name}/${image_name}:${tag}
# 运行最新的镜像 
# -d 设置容器在后台运行
# -p 表示端口映射，把本机的 92 端口映射到 container 的 80 端口（这样外网就能通过本机的 92 端口访问了
# 如果服务器重启后，我们需要重新启动docker
# 执行 systemctl restart docker 重新启动docker
# 但docker启动了，里面的容器没有启动，所以我们添加--restart=always ，docker启动后，容器也可以启动
# dokcer ps -a 查看所有的容器
docker run -d -p $3:$4 --name $image_name --restart=always ${hubAddr}/${user_name}/${image_name}:${tag}
echo "Start Container Successs"
echo "$image_name"
```

### 2.4 Dockerfile

我这里贴一下自己的`Dockerfile`，需要注意的是，github不能用oracleJDK，需要用`openJDK`

```dockerfile
FROM openjdk:8-alpine
COPY ./chat-front.jar /tmp/chat-front.jar
EXPOSE 9002
ENTRYPOINT java -jar /tmp/chat-front.jar
```

## 3. 阿里云镜像仓库设置

众所周知，在国内拉取dockerhub非常慢，所以我们可以使用阿里云提供给我们每个人免费的仓库

- 地址：https://cr.console.aliyun.com/

注册阿里云账号完成之后，在dashboard中搜索“容器镜像服务”关键字

![image-20210513095921439](https://img2020.cnblogs.com/blog/516671/202105/516671-20210513105051379-1318503892.png; charset=UTF-8)

可以看到个人免费有300个份额

![image-20210513100348822](https://img2020.cnblogs.com/blog/516671/202105/516671-20210513105052437-785149540.png;%20charset=UTF-8)

点击“访问凭证”按钮，设置固定密码

![image-20210513100541072](https://img2020.cnblogs.com/blog/516671/202105/516671-20210513105053253-231913737.png;%20charset=UTF-8)

>注意：这里设置的密码用来填上面的`工作流脚本`里面的`secrets.DOCKER_PASSWORD`

接下来就是创建命名空间，命名空间其实就是你推送地址的名字，我们在工作流脚本里面推送的`vars.USER_NAME`，我这里用自己的名字命名

![image-20230429203400785](https://cdn.fengxianhub.top/resources-master/202304292034938.png)

在这一步中会确定下来仓库的类型是`公开`还是`私有`（私有需要登录后才能拉取），填完相关信息点击下一步进入`代码源`页面，这里使用的是`github`，所以要先进行github授权，授权完成后选定github对应的项目，最后**取消“代码变更自动构建镜像”选项框，勾选“海外机器构建”选项框**（因为github在海外，如果不选择这个，我尝试了下，推送镜像的时候会非常慢）

![image-20210513101222122](https://img2020.cnblogs.com/blog/516671/202105/516671-20210513105054032-1995596628.png;%20charset=UTF-8)

然后创建好自己镜像仓库名称即可

![image-20230429203548620](https://cdn.fengxianhub.top/resources-master/202304292035728.png)

>我们后面推送的地址和登录相关的信息可以点击`创建好的项目里面进行查看`
>
>如果有问题可以看官方文档：<a href="https://www.alibabacloud.com/help/zh/container-registry/latest/faq-about-errors-of-docker-login-docker-push-and-docker-pull">Docker登录、推送和拉取失败常见问题</a>

部署完之后当我们推送了`main`分支之后就能看到我们的项目正常的跑起来了🦄

![image-20230429202420428](https://cdn.fengxianhub.top/resources-master/202304292024542.png)

![image-20230429203907395](https://cdn.fengxianhub.top/resources-master/202304292039493.png)