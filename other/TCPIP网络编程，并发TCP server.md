# TCP/IP网络编程，并发TCP server

server.cpp代码

```cpp
#include <cstdio>
#include <cstdlib>
#include <cstring>
#include <netinet/in.h>
#include <sys/socket.h>
#include <unistd.h>

constexpr uint32_t MAXLEN = 4096;
constexpr uint16_t PORT = 6666;
constexpr uint32_t MAX_CONN_MUN = 10;

inline void PrintErr()
{
    printf("errno = %s\n", strerror(errno));
}

int CreateSocket(uint16_t port, int& listen_fd)
{
    listen_fd = socket(AF_INET, SOCK_STREAM, 0);
    if (listen_fd == -1) {
        PrintErr();
        return -1;
    }

    sockaddr_in serv_addr;
    memset(&serv_addr, 0, sizeof(serv_addr));
    serv_addr.sin_family = AF_INET;
    serv_addr.sin_addr.s_addr = htonl(INADDR_ANY);
    serv_addr.sin_port = htons(port);

    int ret = bind(listen_fd, reinterpret_cast<sockaddr*>(&serv_addr), sizeof(serv_addr));
    if (ret == -1) {
        PrintErr();
        return -1;
    }

    ret = listen(listen_fd, MAX_CONN_MUN);
    if (ret == -1) {
        PrintErr();
        return -1;
    }

    return 0;
}

void StrEcho(int sock_fd)
{
    char buf[MAXLEN];
    ssize_t n;
again:
    while ((n = read(sock_fd, buf, sizeof(buf))) > 0) {
        printf("rev msg: %s\n", buf);
        write(sock_fd, buf, n);
    }
    if (n < 0 && errno == EINTR) {
        goto again;
    } else if (n < 0) {
        printf("read error\n");
    }
}

int main()
{
    int listen_fd;
    int ret = CreateSocket(PORT, listen_fd);
    if (ret != 0) {
        exit(0);
    }

    sockaddr_in cliaddr;
    socklen_t clilen;
    pid_t child_pid;
    while (true) {
        int conn_fd = accept(listen_fd, reinterpret_cast<sockaddr*>(&cliaddr), &clilen);
        if (conn_fd == -1) {
            PrintErr();
            return -1;
        }
        if ((child_pid = fork()) == 0) {
            printf("rev conn req, start a child proc, pid=%u\n", child_pid);
            close(listen_fd);
            StrEcho(conn_fd);
            exit(0);
        }
        close(conn_fd);
    }

    return 0;
}
```

client.cpp代码

```cpp
#include <arpa/inet.h>
#include <cstdio>
#include <cstdlib>
#include <cstring>
#include <iostream>
#include <netinet/in.h>
#include <sys/socket.h>
#include <unistd.h>

constexpr uint16_t SERV_PORT = 6666;
constexpr uint32_t MAXLEN = 4096;

inline void PrintErr()
{
    printf("errno = %s\n", strerror(errno));
}

int CreateSocket(const char *ip, uint16_t port, int& sock_fd)
{
    sock_fd = socket(AF_INET, SOCK_STREAM, 0);
    if (sock_fd == -1) {
        PrintErr();
        return -1;
    }

    sockaddr_in serv_addr;
    memset(&serv_addr, 0, sizeof(serv_addr));
    serv_addr.sin_family = AF_INET;
    serv_addr.sin_port = htons(SERV_PORT);
    int ret = inet_pton(AF_INET, ip, &serv_addr.sin_addr);
    if (ret == -1) {
        printf("inet_pton err, argv[1]=%s\n", ip);
        return -1;
    }

    ret = connect(sock_fd, reinterpret_cast<sockaddr*>(&serv_addr), sizeof(serv_addr));
    if (ret == -1) {
        PrintErr();
        return -1;
    }

    return 0;
}

int main(int argc, char** argv)
{
    if (argc != 2) {
        exit(0);
    }

    int sock_fd;
    int ret = CreateSocket(argv[1], SERV_PORT, sock_fd);
    if (ret != 0) {
        exit(0);
    }

    char buf[MAXLEN];
    while (std::cin.getline(buf, MAXLEN)) {
        write(sock_fd, buf, strlen(buf));
        if (read(sock_fd, buf, MAXLEN) == 0) {
            exit(0);
        }
        printf("rev msg: %s\n", buf);
    }

    return 0;
}
```

makefile配置文件

```makefile
all:server client
server:server.o
    g++ -g -o server server.o
client:client.o
    g++ -g -o client client.o
server.o:server.cpp
    g++ -g -c server.cpp
clinet.o:client.cpp
    g++ -g -c client.cpp
clean:all
    rm all
```

执行make命令,打开两个终端一个执行./server一个执行./client 127.0.0.1