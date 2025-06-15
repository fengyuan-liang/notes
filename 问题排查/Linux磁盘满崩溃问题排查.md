# Linux IO满崩溃问题排查

>问题回顾：最近一个月，发生两次服务器IO满导致服务器卡死的问题，下面记录了下笔者是如何发现并解决问题的过程
>
>先说结论：**Docker容器崩溃循环导致系统资源耗尽**

如下图，可以看到磁盘io被打满了

![image-20251005160656144](https://cdn.fengxianhub.top/resources-master/image-20251005160656144.png)



# 1. 首先查看系统日志

```shell
# 查看崩溃时间段的日志
sudo journalctl --since "2025-10-05 15:00:00" --until "2025-10-05 16:00:00"
```

查看到以下日志

```shell
Oct 05 15:00:25 ubuntu systemd[1]: run-docker-runtime\x2drunc-moby-e8963ebd088b3195d12f28108e97533b4bf829a40f7f32cba8bcbbf108f3f2ee-run>
Oct 05 15:00:55 ubuntu systemd[1]: run-docker-runtime\x2drunc-moby-e8963ebd088b3195d12f28108e97533b4bf829a40f7f32cba8bcbbf108f3f2ee-run>
Oct 05 15:01:56 ubuntu systemd[1]: run-docker-runtime\x2drunc-moby-e8963ebd088b3195d12f28108e97533b4bf829a40f7f32cba8bcbbf108f3f2ee-run>
Oct 05 15:02:26 ubuntu systemd[1]: run-docker-runtime\x2drunc-moby-e8963ebd088b3195d12f28108e97533b4bf829a40f7f32cba8bcbbf108f3f2ee-run>
Oct 05 15:02:56 ubuntu systemd[1]: run-docker-runtime\x2drunc-moby-e8963ebd088b3195d12f28108e97533b4bf829a40f7f32cba8bcbbf108f3f2ee-run>
Oct 05 15:03:56 ubuntu systemd[1]: run-docker-runtime\x2drunc-moby-e8963ebd088b3195d12f28108e97533b4bf829a40f7f32cba8bcbbf108f3f2ee-run>
Oct 05 15:04:26 ubuntu systemd[1]: run-docker-runtime\x2drunc-moby-e8963ebd088b3195d12f28108e97533b4bf829a40f7f32cba8bcbbf108f3f2ee-run>
Oct 05 15:04:56 ubuntu systemd[1]: run-docker-runtime\x2drunc-moby-e8963ebd088b3195d12f28108e97533b4bf829a40f7f32cba8bcbbf108f3f2ee-run>
Oct 05 15:05:01 ubuntu CRON[1340576]: pam_unix(cron:session): session opened for user root(uid=0) by (uid=0)
Oct 05 15:05:01 ubuntu CRON[1340585]: (root) CMD (command -v debian-sa1 > /dev/null && debian-sa1 1 1)
Oct 05 15:05:01 ubuntu CRON[1340576]: pam_unix(cron:session): session closed for user root
Oct 05 15:05:15 ubuntu sshd[1340869]: User root from 8.217.6.216 not allowed because not listed in AllowUsers
Oct 05 15:05:15 ubuntu sshd[1340869]: pam_unix(sshd:auth): authentication failure; logname= uid=0 euid=0 tty=ssh ruser= rhost=8.217.6.2>
Oct 05 15:05:17 ubuntu sshd[1340869]: Failed password for invalid user root from 8.217.6.216 port 34134 ssh2
Oct 05 15:05:19 ubuntu sshd[1340869]: Connection closed by invalid user root 8.217.6.216 port 34134 [preauth]
Oct 05 15:05:26 ubuntu sshd[1341131]: User root from 8.217.6.216 not allowed because not listed in AllowUsers
Oct 05 15:05:26 ubuntu sshd[1341131]: pam_unix(sshd:auth): authentication failure; logname= uid=0 euid=0 tty=ssh ruser= rhost=8.217.6.2>
Oct 05 15:05:26 ubuntu systemd[1]: run-docker-runtime\x2drunc-moby-e8963ebd088b3195d12f28108e97533b4bf829a40f7f32cba8bcbbf108f3f2ee-run>
Oct 05 15:05:28 ubuntu sshd[1341131]: Failed password for invalid user root from 8.217.6.216 port 43432 ssh2
Oct 05 15:05:30 ubuntu sshd[1341131]: Connection closed by invalid user root 8.217.6.216 port 43432 [preauth]
Oct 05 15:06:26 ubuntu systemd[1]: run-docker-runtime\x2drunc-moby-e8963ebd088b3195d12f28108e97533b4bf829a40f7f32cba8bcbbf108f3f2ee-run>
Oct 05 15:06:56 ubuntu systemd[1]: run-docker-runtime\x2drunc-moby-e8963ebd088b3195d12f28108e97533b4bf829a40f7f32cba8bcbbf108f3f2ee-run>
Oct 05 15:07:56 ubuntu systemd[1]: run-docker-runtime\x2drunc-moby-e8963ebd088b3195d12f28108e97533b4bf829a40f7f32cba8bcbbf108f3f2ee-run>
Oct 05 15:08:27 ubuntu systemd[1]: run-docker-runtime\x2drunc-moby-e8963ebd088b3195d12f28108e97533b4bf829a40f7f32cba8bcbbf108f3f2ee-run>
Oct 05 15:09:57 ubuntu systemd[1]: run-docker-runtime\x2drunc-moby-e8963ebd088b3195d12f28108e97533b4bf829a40f7f32cba8bcbbf108f3f2ee-run>
Oct 05 15:10:27 ubuntu systemd[1]: run-docker-runtime\x2drunc-moby-e8963ebd088b3195d12f28108e97533b4bf829a40f7f32cba8bcbbf108f3f2ee-run>
Oct 05 15:10:33 ubuntu sshd[1348223]: error: kex_exchange_identification: client sent invalid protocol identifier "GET / HTTP/1.1"
Oct 05 15:10:33 ubuntu sshd[1348223]: banner exchange: Connection from 59.82.21.75 port 32108: invalid format
Oct 05 15:10:33 ubuntu sshd[1348224]: error: kex_exchange_identification: client sent invalid protocol identifier "GET / HTTP/1.1"
Oct 05 15:10:33 ubuntu sshd[1348224]: banner exchange: Connection from 59.82.21.244 port 43499: invalid format
Oct 05 15:10:57 ubuntu systemd[1]: run-docker-runtime\x2drunc-moby-e8963ebd088b3195d12f28108e97533b4bf829a40f7f32cba8bcbbf108f3f2ee-run>
Oct 05 15:11:27 ubuntu systemd[1]: run-docker-runtime\x2drunc-moby-e8963ebd088b3195d12f28108e97533b4bf829a40f7f32cba8bcbbf108f3f2ee-run>
Oct 05 15:11:57 ubuntu systemd[1]: run-docker-runtime\x2drunc-moby-e8963ebd088b3195d12f28108e97533b4bf829a40f7f32cba8bcbbf108f3f2ee-run>
Oct 05 15:12:57 ubuntu systemd[1]: run-docker-runtime\x2drunc-moby-e8963ebd088b3195d12f28108e97533b4bf829a40f7f32cba8bcbbf108f3f2ee-run>
Oct 05 15:13:58 ubuntu systemd[1]: run-docker-runtime\x2drunc-moby-e8963ebd088b3195d12f28108e97533b4bf829a40f7f32cba8bcbbf108f3f2ee-run>
Oct 05 15:14:59 ubuntu systemd[1]: run-docker-runtime\x2drunc-moby-e8963ebd088b3195d12f28108e97533b4bf829a40f7f32cba8bcbbf108f3f2ee-run>
Oct 05 15:15:01 ubuntu CRON[1354356]: pam_unix(cron:session): session opened for user root(uid=0) by (uid=0)
Oct 05 15:15:01 ubuntu CRON[1354361]: (root) CMD (command -v debian-sa1 > /dev/null && debian-sa1 1 1)
Oct 05 15:15:01 ubuntu CRON[1354356]: pam_unix(cron:session): session closed for user root
Oct 05 15:15:07 ubuntu sshd[1354479]: Invalid user pi from 117.68.88.108 port 36242
Oct 05 15:15:07 ubuntu sshd[1354479]: pam_unix(sshd:auth): check pass; user unknown
Oct 05 15:15:07 ubuntu sshd[1354479]: pam_unix(sshd:auth): authentication failure; logname= uid=0 euid=0 tty=ssh ruser= rhost=117.68.88>
Oct 05 15:15:09 ubuntu sshd[1354479]: Failed password for invalid user pi from 117.68.88.108 port 36242 ssh2
Oct 05 15:15:11 ubuntu sshd[1354479]: Received disconnect from 117.68.88.108 port 36242:11: Bye Bye [preauth]
Oct 05 15:15:11 ubuntu sshd[1354479]: Disconnected from invalid user pi 117.68.88.108 port 36242 [preauth]
Oct 05 15:15:59 ubuntu systemd[1]: run-docker-runtime\x2drunc-moby-e8963ebd088b3195d12f28108e97533b4bf829a40f7f32cba8bcbbf108f3f2ee-run>
Oct 05 15:16:29 ubuntu systemd[1]: run-docker-runtime\x2drunc-moby-e8963ebd088b3195d12f28108e97533b4bf829a40f7f32cba8bcbbf108f3f2ee-run>
Oct 05 15:16:58 ubuntu sshd[1357036]: error: kex_exchange_identification: Connection closed by remote host
Oct 05 15:16:58 ubuntu sshd[1357036]: Connection closed by 121.14.71.168 port 47158
Oct 05 15:17:01 ubuntu CRON[1357124]: pam_unix(cron:session): session opened for user root(uid=0) by (uid=0)
Oct 05 15:17:01 ubuntu CRON[1357125]: (root) CMD (   cd / && run-parts --report /etc/cron.hourly)
Oct 05 15:17:01 ubuntu CRON[1357124]: pam_unix(cron:session): session closed for user root
Oct 05 15:18:00 ubuntu systemd[1]: run-docker-runtime\x2drunc-moby-e8963ebd088b3195d12f28108e97533b4bf829a40f7f32cba8bcbbf108f3f2ee-run>
Oct 05 15:18:30 ubuntu systemd[1]: run-docker-runtime\x2drunc-moby-e8963ebd088b3195d12f28108e97533b4bf829a40f7f32cba8bcbbf108f3f2ee-run>
Oct 05 15:20:00 ubuntu systemd[1]: run-docker-runtime\x2drunc-moby-e8963ebd088b3195d12f28108e97533b4bf829a40f7f32cba8bcbbf108f3f2ee-run>
Oct 05 15:20:30 ubuntu systemd[1]: run-docker-runtime\x2drunc-moby-e8963ebd088b3195d12f28108e97533b4bf829a40f7f32cba8bcbbf108f3f2ee-run>
Oct 05 15:21:00 ubuntu systemd[1]: run-docker-runtime\x2drunc-moby-e8963ebd088b3195d12f28108e97533b4bf829a40f7f32cba8bcbbf108f3f2ee-run>
Oct 05 15:21:30 ubuntu systemd[1]: run-docker-runtime\x2drunc-moby-e8963ebd088b3195d12f28108e97533b4bf829a40f7f32cba8bcbbf108f3f2ee-run>
Oct 05 15:22:00 ubuntu systemd[1]: run-docker-runtime\x2drunc-moby-e8963ebd088b3195d12f28108e97533b4bf829a40f7f32cba8bcbbf108f3f2ee-run>
Oct 05 15:22:30 ubuntu systemd[1]: run-docker-runtime\x2drunc-moby-e8963ebd088b3195d12f28108e97533b4bf829a40f7f32cba8bcbbf108f3f2ee-run>
Oct 05 15:23:00 ubuntu systemd[1]: run-docker-runtime\x2drunc-moby-e8963ebd088b3195d12f28108e97533b4bf829a40f7f32cba8bcbbf108f3f2ee-run>
Oct 05 15:23:30 ubuntu systemd[1]: run-docker-runtime\x2drunc-moby-e8963ebd088b3195d12f28108e97533b4bf829a40f7f32cba8bcbbf108f3f2ee-run>
Oct 05 15:24:00 ubuntu systemd[1]: run-docker-runtime\x2drunc-moby-e8963ebd088b3195d12f28108e97533b4bf829a40f7f32cba8bcbbf108f3f2ee-run>
Oct 05 15:24:31 ubuntu systemd[1]: run-docker-runtime\x2drunc-moby-e8963ebd088b3195d12f28108e97533b4bf829a40f7f32cba8bcbbf108f3f2ee-run>
Oct 05 15:24:36 ubuntu sshd[1367621]: User root from 117.68.88.108 not allowed because not listed in AllowUsers
Oct 05 15:24:36 ubuntu sshd[1367621]: pam_unix(sshd:auth): authentication failure; logname= uid=0 euid=0 tty=ssh ruser= rhost=117.68.88>
Oct 05 15:24:39 ubuntu sshd[1367621]: Failed password for invalid user root from 117.68.88.108 port 39870 ssh2
Oct 05 15:24:40 ubuntu sshd[1367621]: Received disconnect from 117.68.88.108 port 39870:11: Bye Bye [preauth]
Oct 05 15:24:40 ubuntu sshd[1367621]: Disconnected from invalid user root 117.68.88.108 port 39870 [preauth]
Oct 05 15:25:01 ubuntu systemd[1]: run-docker-runtime\x2drunc-moby-e8963ebd088b3195d12f28108e97533b4bf829a40f7f32cba8bcbbf108f3f2ee-run>
Oct 05 15:25:01 ubuntu CRON[1368207]: pam_unix(cron:session): session opened for user root(uid=0) by (uid=0)
Oct 05 15:25:01 ubuntu CRON[1368208]: (root) CMD (command -v debian-sa1 > /dev/null && debian-sa1 1 1)
Oct 05 15:25:01 ubuntu CRON[1368207]: pam_unix(cron:session): session closed for user root
Oct 05 15:25:31 ubuntu systemd[1]: run-docker-runtime\x2drunc-moby-e8963ebd088b3195d12f28108e97533b4bf829a40f7f32cba8bcbbf108f3f2ee-run>
Oct 05 15:26:01 ubuntu systemd[1]: run-docker-runtime\x2drunc-moby-e8963ebd088b3195d12f28108e97533b4bf829a40f7f32cba8bcbbf108f3f2ee-run>
Oct 05 15:27:05 ubuntu sshd[1263017]: error: no more sessions
Oct 05 15:27:07 ubuntu sshd[1263017]: error: no more sessions
Oct 05 15:27:07 ubuntu sshd[1263017]: error: no more sessions
Oct 05 15:27:07 ubuntu sshd[1253042]: error: no more sessions
Oct 05 15:27:07 ubuntu sshd[1263017]: error: no more sessions
Oct 05 15:27:07 ubuntu sshd[1253042]: error: no more sessions
Oct 05 15:27:14 ubuntu sshd[1253042]: error: no more sessions
Oct 05 15:27:14 ubuntu sshd[1253042]: error: no more sessions
Oct 05 15:27:14 ubuntu sshd[1253042]: error: no more sessions
Oct 05 15:27:15 ubuntu sshd[1263017]: error: no more sessions
Oct 05 15:27:15 ubuntu sshd[1263017]: error: no more sessions
Oct 05 15:27:15 ubuntu sshd[1263017]: error: no more sessions
Oct 05 15:27:18 ubuntu sshd[1253042]: error: no more sessions
Oct 05 15:27:18 ubuntu sshd[1263017]: error: no more sessions
Oct 05 15:29:59 ubuntu systemd[1]: snapd.service: Watchdog timeout (limit 5min)!
```

## **问题时间线分析**

从日志可以看出完整的崩溃过程：

### **15:00-15:15：问题开始**

- 容器 `e8963ebd088b...` 开始出现启动超时
- 每30-60秒尝试启动一次，但都失败
- 同时有SSH暴力破解攻击（次要问题）

### **15:15-15:27：系统逐渐崩溃**

- 容器持续崩溃重启消耗大量IO资源
- SSH开始出现 `error: no more sessions` - **系统资源严重不足的标志**
- 正常的SSH连接开始被拒绝

### **15:29：系统完全崩溃**

- `snapd.service: Watchdog timeout` - **系统已无法响应基本服务**

## **根本原因确认**

**问题容器 ID: `e8963ebd088b3195d12f28108e97533b4bf829a40f7f32cba8bcbbf108f3f2ee`**

这个容器陷入了 **崩溃→自动重启→再崩溃** 的死循环，每次：

1. 启动需要30秒
2. 然后超时被systemd终止
3. 由于Docker的重启策略，又立即重新启动
4. 循环往复，耗尽所有磁盘IO资源



然后可以查看docker的日志

```shell 
# 查看Docker服务日志
sudo journalctl -u docker.service --since "1 hour ago"
```

# 2. 解决方案

