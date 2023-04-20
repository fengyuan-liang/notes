# docker启动nginx无法正常代理

最近想使用nginx代理二级域名到不同的端口，发现会报错

```shell
2023/04/12 08:18:28 [error] 24#24: *8 connect() failed (111: Connection refused) while connecting to upstream, client: 58.34.185.106, server: xxx.xxx.xxx, request: "GET / HTTP/1.1", upstream: "http://127.0.0.1:20077/", host: "xxx.xxx.xxx"
```

我的配置很简答，就是通过域名代理到不同的端口

```shell
server {
		listen       80;
		server_name  xxx.com;
		location / {
			proxy_pass http://127.0.0.1:20074;
		}
	}
server {
		listen      80;
		server_name  xxxx.com;
		location / {
			proxy_pass http://127.0.0.1:20077;
		}
	}
```

其实这是因为使用的docker启动的nginx，docker默认启动的nginx使用的是`bridge模式`，将端口映射到外面，在容器里面访问`localhost`是访问不到宿主机的

| **Docker网络模式** | **配置**                  | **说明**                                                     |
| ------------------ | ------------------------- | ------------------------------------------------------------ |
| host模式           | –net=host                 | 容器和宿主机共享Network namespace                            |
| bridge模式         | –net=bridge               | 最为常用的模式（默认为该模式）                               |
| none模式           | –net=none                 | 容器有独立的Network namespace，但并没有对其进行任何网络设置，如分配veth pair 和网桥连接，配置IP等 |
| container模式      | –net=container:NAME_or_ID | 容器和另外一个容器共享Network namespace。 kubernetes中的pod就是多个容器共享一个Network namespace |

我们只需要改成`host`模式，共用宿主机的网络即可！

还有就是不建议使用命令启动容器，根本找不到自己挂载的目录在哪里，建议使用`docker-compose`

```yml
version: "3"
services:
   web:
     container_name: nginx
     image: nginx
     volumes:
       - ./html:/usr/share/nginx/html
       - ./conf/nginx.conf:/etc/nginx/nginx.conf
       - ./conf.d:/etc/nginx/conf.d
       - ./logs:/var/log/nginx
     restart: always
     network_mode: host
```

>注意⚠️：使用`host`模式后就不要再`-p`暴露端口了，本身已经使用了本地网络，所有端口是与宿主机同步，再作端口映射是本机映射到本机，脱了裤子放屁，多此一举
>
>如果映射端口了会启动失败的！