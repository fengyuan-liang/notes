# c++  TCP/IP Scoket网络编程

基于TCP/IP的通信基本上都是利用SOCKET套接字进行数据通讯，程序一般分为服务器端和用户端两部分。设计思路（visual studio下）：

第一部分　服务器端
　　一、创建服务器套接字（create）。
　　二、服务器套接字进行信息绑定（bind），并开始监听连接（listen）。
　　三、接受来自用户端的连接请求（accept）。
　　四、开始数据传输(send/receive)。
　　五、关闭套接字（closesocket）。

第二部分　客户端
　　一、创建客户套接字（create）。
　　二、与远程服务器进行连接（connect），如被接受则创建接收进程。
　　三、开始数据传输(send/receive)。
　　四、关闭套接字（closesocket）。

<hr/>

Service.cpp代码

```cpp
#include<stdio.h>
#include<stdlib.h>
#include<WinSock2.h>  //WindowsSocket编程头文件
#include<iostream>
#include<cstring>
#pragma comment(lib,"ws2_32.lib")//链接ws2_32.lib库文件到此项目中
using namespace std;

//================全局常量==================
		//创建缓冲区
const int BUF_SIZE = 2048;
		//最大并发连接数
const int MAX_CONN_MUN = 5;
		//socket连接目的ip地址
const char* ipAddr = "192.168.1.187";
		//目的socket端口号
const int PORT = 9090;
//================全局变量==================
SOCKET sockSer, sockCli;
SOCKADDR_IN addrSer, addrCli; //address
int naddr = sizeof(SOCKADDR_IN);

char sendbuf[BUF_SIZE];	
char recvbuf[BUF_SIZE];
//================函数声明==================
int main() {
	cout << "服务器启动" << endl;
	//加载socket库
	WSADATA wsadata;
	if (WSAStartup(MAKEWORD(2, 2), &wsadata) != 0)
	{
		//输出出错信息
		cout << "载入socket库失败!" << endl;
		system("pause");
		return 0;
	}
	else {
		cout << "载入socket库成功!" << endl;
	}
	//创建Socket;
	//描述协议族,INET属于ipv4；
	//sock_stream创建套接字类型：tcp；
	//0不指定协议，常用的协议有tcp、udp等
	sockSer = socket(AF_INET, SOCK_STREAM, 0);
	//初始化地址包
	addrSer.sin_addr.s_addr = inet_addr(ipAddr);//ip地址
	addrSer.sin_family = AF_INET;//使用的协议族，要和上面的同步
	addrSer.sin_port = htons(PORT);//占用的端口
	//绑定Socket(bind)
	bind(sockSer, (SOCKADDR*)&addrSer, sizeof(SOCKADDR));	//强制将SOCKADDR_INET转化成SOCKEADDR
	//监听连接请求
    //等待连接最大数：5
	listen(sockSer, MAX_CONN_MUN);
	//监听
	while (true) {
		cout << "开始连接!" << endl;
		//接受连接
		sockCli = accept(sockSer, (SOCKADDR*)&addrCli, &naddr);
		cout << sockCli << endl;
		if (sockCli != INVALID_SOCKET) {
			while (true)
			{
				cout << "连接成功" << endl;
				cout << "请输入要发送给客户端的信息：" << endl;
				cin >> sendbuf;
				send(sockCli, sendbuf, sizeof(sendbuf), 0);
				//strcpy(sendbuf, "hello");
				//send(sockCli, sendbuf, sizeof(sendbuf), 0);

				//接收客户端发来信息
				recv(sockCli, recvbuf, sizeof(recvbuf), 0);
				cout << "客户端发来的信息：" << recvbuf << endl;
			}
		}
		else
		{
			cout << "连接失败!" << endl;
		}
	}
	closesocket(sockSer);
	closesocket(sockCli);	
	return 0;
}
```

Client.cpp代码

```cpp
#include<stdio.h>
#include<stdlib.h>
#include<WinSock2.h>  //WindowsSocket编程头文件
#include<iostream>
#include<cstring>
#pragma comment(lib,"ws2_32.lib")//链接ws2_32.lib库文件到此项目中
using namespace std;

//================全局常量==================
//创建缓冲区
const int BUF_SIZE = 2048;
//socket连接目的ip地址
const char* ipAddr = "192.168.1.187";
//目的socket端口号
const int PORT = 9090;
//================全局变量==================
SOCKET sockSer, sockCli;
SOCKADDR_IN addrSer, addrCli; //address
int naddr = sizeof(SOCKADDR_IN);

char sendbuf[BUF_SIZE];
char recvbuf[BUF_SIZE];
//================函数声明==================
int main() {
	//加载socket库
	cout << "客户端启动" << endl;
	WSADATA wsadata;
	if (WSAStartup(MAKEWORD(2, 2), &wsadata) != 0)
	{
		//输出出错信息
		cout << "载入socket库" << endl;
		system("pause");
		return 0;
	}
	//创建Soucket;
	sockCli = socket(AF_INET, SOCK_STREAM, 0);
	//描述协议族,INET属于ipv4；
	//sock_stream创建套接字类型：tcp；
	//0不指定协议，常用的协议有tcp、udp等

	//初始化客户端地址包
	addrCli.sin_addr.s_addr = inet_addr("127.0.0.1");
	addrCli.sin_family = AF_INET;
	addrCli.sin_port = htons(1111);

	//初始化服务器地址
	addrSer.sin_addr.s_addr = inet_addr(ipAddr);
	addrSer.sin_family = AF_INET;
	addrSer.sin_port = htons(PORT);

	while (true)
	{
		if (connect(sockCli, (SOCKADDR*)&addrSer, sizeof(addrSer)) != SOCKET_ERROR)
		{
			while (true)
			{
				//接收服务器信息
				cout << "客户端连接成功" << endl;
				recv(sockCli, recvbuf, sizeof(recvbuf), 0);
				cout << "服务端发的信息：" << recvbuf << endl;
				//发送给服务器信息
				cout << "请输入要发送给服务器的信息：" << endl;
				cin >> sendbuf;
				send(sockCli, sendbuf, sizeof(sendbuf), 0);
				cout << "发送成功" << endl;
			}

		}
		else
		{
			//cout << "客户端连接失败" << endl;
		}
	}
	closesocket(sockSer);
	closesocket(sockCli);
	return 0;
}
```

```cpp
#include <stdio.h>
#include <sys/socket.h>
#include <pthread.h>

void *thread(void *st);
int main(int argc, char *argv[])
{
	pthread_t tid;
	int ret, fd;
	struct sockaddr_in info;
	fd = socket(AF_INET, SOCK_STREAM, 0);
	if(fd < 0)
	goto socket_error;
	{
		int var = 1;
		setsockopt(fd, SOL_SOCKET, SO_REUSEADDR, &var, sizeof(var));;
	}
	info.sin_family = AF_INET;
	info.sin_port = htons(80);
	info.sin_addr.s_addr = 0;
	ret = bind(fd, (void *)&info, sizeof(info));
	if(ret)
	goto bind_error;
	ret = listen(fd, 10);
	if(ret)
	goto listen_error;
	while(1)
	{
		clientfd = accept(fd, NULL, NULL);
		pthread_create(&tid, NULL, thread, (void *)clientfd);
	}
	return 0;
	socket_error:
	printf("socket error!\n");
	return -1;
	bind_error:
	printf("bind error!\n");
	return -2;
	lister_error:
	printf("lister error!\n");
	return -2;
}

void *thread(void *st)
{
	int ret, rd;
	char buf[BUFSIZE];
	int clientfd = (int)st;
	rd = read(clientfd, buf, sizeof(buf));
	if(rd < 0)
	{
		printf("read error!\n")
		return;;
	}
	write(clientfd, "shou dao!", 9);
	close(clientfd);
}
```



