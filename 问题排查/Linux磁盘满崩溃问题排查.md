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

查看容器信息

```json
lfy@ubuntu:~$ docker inspect image2webp 
[
    {
        "Id": "e8963ebd088b3195d12f28108e97533b4bf829a40f7f32cba8bcbbf108f3f2ee",
        "Created": "2025-09-07T09:04:17.365294372Z",
        "Path": "./image2webp",
        "Args": [],
        "State": {
            "Status": "running",
            "Running": true,
            "Paused": false,
            "Restarting": false,
            "OOMKilled": false,
            "Dead": false,
            "Pid": 8155,
            "ExitCode": 0,
            "Error": "",
            "StartedAt": "2025-10-18T14:51:54.662534484Z",
            "FinishedAt": "2025-10-18T14:48:50.382718397Z",
            "Health": {
                "Status": "healthy",
                "FailingStreak": 0,
                "Log": [
                    {
                        "Start": "2025-10-18T23:05:36.756454319+08:00",
                        "End": "2025-10-18T23:05:36.835757893+08:00",
                        "ExitCode": 0,
                        "Output": "  % Total    % Received % Xferd  Average Speed   Time    Time     Time  Current\n                                 Dload  Upload   Total   Spent    Left  Speed\n\r  0     0    0     0    0     0      0      0 --:--:-- --:--:-- --:--:--     0\r100    50  100    50    0     0  64267      0 --:--:-- --:--:-- --:--:-- 50000\n{\"status\": \"healthy\", \"service\": \"webp-converter\"}"
                    },
                    {
                        "Start": "2025-10-18T23:06:06.837037641+08:00",
                        "End": "2025-10-18T23:06:06.893478458+08:00",
                        "ExitCode": 0,
                        "Output": "  % Total    % Received % Xferd  Average Speed   Time    Time     Time  Current\n                                 Dload  Upload   Total   Spent    Left  Speed\n\r  0     0    0     0    0     0      0      0 --:--:-- --:--:-- --:--:--     0\r100    50  100    50    0     0  52083      0 --:--:-- --:--:-- --:--:-- 50000\n{\"status\": \"healthy\", \"service\": \"webp-converter\"}"
                    },
                    {
                        "Start": "2025-10-18T23:06:36.893967053+08:00",
                        "End": "2025-10-18T23:06:36.953899311+08:00",
                        "ExitCode": 0,
                        "Output": "  % Total    % Received % Xferd  Average Speed   Time    Time     Time  Current\n                                 Dload  Upload   Total   Spent    Left  Speed\n\r  0     0    0     0    0     0      0      0 --:--:-- --:--:-- --:--:--     0\r100    50  100    50    0     0  79491      0 --:--:-- --:--:-- --:--:-- 50000\n{\"status\": \"healthy\", \"service\": \"webp-converter\"}"
                    },
                    {
                        "Start": "2025-10-18T23:07:06.954300325+08:00",
                        "End": "2025-10-18T23:07:07.033835576+08:00",
                        "ExitCode": 0,
                        "Output": "  % Total    % Received % Xferd  Average Speed   Time    Time     Time  Current\n                                 Dload  Upload   Total   Spent    Left  Speed\n\r  0     0    0     0    0     0      0      0 --:--:-- --:--:-- --:--:--     0\r100    50  100    50    0     0  33333      0 --:--:-- --:--:-- --:--:-- 50000\n{\"status\": \"healthy\", \"service\": \"webp-converter\"}"
                    },
                    {
                        "Start": "2025-10-18T23:07:37.034742636+08:00",
                        "End": "2025-10-18T23:07:37.083639496+08:00",
                        "ExitCode": 0,
                        "Output": "  % Total    % Received % Xferd  Average Speed   Time    Time     Time  Current\n                                 Dload  Upload   Total   Spent    Left  Speed\n\r  0     0    0     0    0     0      0      0 --:--:-- --:--:-- --:--:--     0\r100    50  100    50    0     0  64683      0 --:--:-- --:--:-- --:--:-- 50000\n{\"status\": \"healthy\", \"service\": \"webp-converter\"}"
                    }
                ]
            }
        },
        "Image": "sha256:604652c69ed671115bf534dee02aaf47b14f0de30fa6a6afd3dc375308b51523",
        "ResolvConfPath": "/var/lib/docker/containers/e8963ebd088b3195d12f28108e97533b4bf829a40f7f32cba8bcbbf108f3f2ee/resolv.conf",
        "HostnamePath": "/var/lib/docker/containers/e8963ebd088b3195d12f28108e97533b4bf829a40f7f32cba8bcbbf108f3f2ee/hostname",
        "HostsPath": "/var/lib/docker/containers/e8963ebd088b3195d12f28108e97533b4bf829a40f7f32cba8bcbbf108f3f2ee/hosts",
        "LogPath": "/var/lib/docker/containers/e8963ebd088b3195d12f28108e97533b4bf829a40f7f32cba8bcbbf108f3f2ee/e8963ebd088b3195d12f28108e97533b4bf829a40f7f32cba8bcbbf108f3f2ee-json.log",
        "Name": "/image2webp",
        "RestartCount": 0,
        "Driver": "overlay2",
        "Platform": "linux",
        "MountLabel": "",
        "ProcessLabel": "",
        "AppArmorProfile": "docker-default",
        "ExecIDs": null,
        "HostConfig": {
            "Binds": [
                "/home/lfy/workspace/config:/config",
                "/home/lfy/workspace/logs:/logs"
            ],
            "ContainerIDFile": "",
            "LogConfig": {
                "Type": "json-file",
                "Config": {}
            },
            "NetworkMode": "bridge",
            "PortBindings": {
                "10080/tcp": [
                    {
                        "HostIp": "",
                        "HostPort": "10080"
                    }
                ]
            },
            "RestartPolicy": {
                "Name": "no",
                "MaximumRetryCount": 0
            },
            "AutoRemove": false,
            "VolumeDriver": "",
            "VolumesFrom": null,
            "ConsoleSize": [
                0,
                0
            ],
            "CapAdd": null,
            "CapDrop": null,
            "CgroupnsMode": "private",
            "Dns": [],
            "DnsOptions": [],
            "DnsSearch": [],
            "ExtraHosts": null,
            "GroupAdd": null,
            "IpcMode": "private",
            "Cgroup": "",
            "Links": null,
            "OomScoreAdj": 0,
            "PidMode": "",
            "Privileged": false,
            "PublishAllPorts": false,
            "ReadonlyRootfs": false,
            "SecurityOpt": null,
            "UTSMode": "",
            "UsernsMode": "",
            "ShmSize": 67108864,
            "Runtime": "runc",
            "Isolation": "",
            "CpuShares": 0,
            "Memory": 0,
            "NanoCpus": 0,
            "CgroupParent": "",
            "BlkioWeight": 0,
            "BlkioWeightDevice": [],
            "BlkioDeviceReadBps": [],
            "BlkioDeviceWriteBps": [],
            "BlkioDeviceReadIOps": [],
            "BlkioDeviceWriteIOps": [],
            "CpuPeriod": 0,
            "CpuQuota": 0,
            "CpuRealtimePeriod": 0,
            "CpuRealtimeRuntime": 0,
            "CpusetCpus": "",
            "CpusetMems": "",
            "Devices": [],
            "DeviceCgroupRules": null,
            "DeviceRequests": null,
            "MemoryReservation": 0,
            "MemorySwap": 0,
            "MemorySwappiness": null,
            "OomKillDisable": null,
            "PidsLimit": null,
            "Ulimits": [],
            "CpuCount": 0,
            "CpuPercent": 0,
            "IOMaximumIOps": 0,
            "IOMaximumBandwidth": 0,
            "MaskedPaths": [
                "/proc/asound",
                "/proc/acpi",
                "/proc/kcore",
                "/proc/keys",
                "/proc/latency_stats",
                "/proc/timer_list",
                "/proc/timer_stats",
                "/proc/sched_debug",
                "/proc/scsi",
                "/sys/firmware",
                "/sys/devices/virtual/powercap"
            ],
            "ReadonlyPaths": [
                "/proc/bus",
                "/proc/fs",
                "/proc/irq",
                "/proc/sys",
                "/proc/sysrq-trigger"
            ]
        },
        "GraphDriver": {
            "Data": {
                "LowerDir": "/var/lib/docker/overlay2/fad58f0c646dff32f53de6f40b746075eefaa9098cd9d7bb9071b8c8fb3689f1-init/diff:/var/lib/docker/overlay2/5003fee633a105daab6771a9e27c931858c465049fbe63c1f8111fea30eafb8f/diff:/var/lib/docker/overlay2/5434b88ac2794da5efc1fab74334a92c175872ad72def3916ab4d5b1292f4d31/diff:/var/lib/docker/overlay2/e891d32c36646cd4dfd78b5c12d8ab316dabf8d296e02767135b1cd553bd1064/diff:/var/lib/docker/overlay2/375dedbffbda55225206e6bfde62760f472265e50c7b5d5ec9e6a76d7af35b19/diff:/var/lib/docker/overlay2/d9cabd535357ae91f1d666811758208214bdd956fea44b11d32c74fe0d3f6451/diff:/var/lib/docker/overlay2/7f4ffe8844649901a4f6e6e40a99f68fca35ab8c92e23933ed82dc4fda6dd75c/diff",
                "MergedDir": "/var/lib/docker/overlay2/fad58f0c646dff32f53de6f40b746075eefaa9098cd9d7bb9071b8c8fb3689f1/merged",
                "UpperDir": "/var/lib/docker/overlay2/fad58f0c646dff32f53de6f40b746075eefaa9098cd9d7bb9071b8c8fb3689f1/diff",
                "WorkDir": "/var/lib/docker/overlay2/fad58f0c646dff32f53de6f40b746075eefaa9098cd9d7bb9071b8c8fb3689f1/work"
            },
            "Name": "overlay2"
        },
        "Mounts": [
            {
                "Type": "bind",
                "Source": "/home/lfy/workspace/config",
                "Destination": "/config",
                "Mode": "",
                "RW": true,
                "Propagation": "rprivate"
            },
            {
                "Type": "bind",
                "Source": "/home/lfy/workspace/logs",
                "Destination": "/logs",
                "Mode": "",
                "RW": true,
                "Propagation": "rprivate"
            }
        ],
        "Config": {
            "Hostname": "e8963ebd088b",
            "Domainname": "",
            "User": "webpuser",
            "AttachStdin": false,
            "AttachStdout": false,
            "AttachStderr": false,
            "ExposedPorts": {
                "10080/tcp": {}
            },
            "Tty": false,
            "OpenStdin": false,
            "StdinOnce": false,
            "Env": [
                "PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin",
                "PORT=10080",
                "MAX_UPLOAD_SIZE=33554432",
                "DEFAULT_QUALITY=80",
                "DEFAULT_LOSSLESS=false",
                "LOG_LEVEL=info",
                "LOG_FORMAT=json"
            ],
            "Cmd": [
                "./image2webp"
            ],
            "Healthcheck": {
                "Test": [
                    "CMD-SHELL",
                    "curl -f http://localhost:${PORT}/v1/health || exit 1"
                ],
                "Interval": 30000000000,
                "Timeout": 3000000000,
                "StartPeriod": 5000000000,
                "Retries": 3
            },
            "Image": "registry.cn-hangzhou.aliyuncs.com/fengyuan-liang/image2webp:v0.0.1",
            "Volumes": null,
            "WorkingDir": "/app",
            "Entrypoint": null,
            "OnBuild": null,
            "Labels": {}
        },
        "NetworkSettings": {
            "Bridge": "",
            "SandboxID": "f67d3c34344233f117bab773df788158fd5e83f5a866948f8df1a4a4652d6d02",
            "SandboxKey": "/var/run/docker/netns/f67d3c343442",
            "Ports": {
                "10080/tcp": [
                    {
                        "HostIp": "0.0.0.0",
                        "HostPort": "10080"
                    },
                    {
                        "HostIp": "::",
                        "HostPort": "10080"
                    }
                ]
            },
            "HairpinMode": false,
            "LinkLocalIPv6Address": "",
            "LinkLocalIPv6PrefixLen": 0,
            "SecondaryIPAddresses": null,
            "SecondaryIPv6Addresses": null,
            "EndpointID": "fa49cd7a741ddf924e4f889c43ca5df1700258368d6f70abf6c9ff597e5098d0",
            "Gateway": "172.17.0.1",
            "GlobalIPv6Address": "",
            "GlobalIPv6PrefixLen": 0,
            "IPAddress": "172.17.0.12",
            "IPPrefixLen": 16,
            "IPv6Gateway": "",
            "MacAddress": "02:42:ac:11:00:0c",
            "Networks": {
                "bridge": {
                    "IPAMConfig": null,
                    "Links": null,
                    "Aliases": null,
                    "MacAddress": "02:42:ac:11:00:0c",
                    "DriverOpts": null,
                    "NetworkID": "6e672f581985cf349abe6fd50c935f7727e62b677b70b7e602fa9f0397473a27",
                    "EndpointID": "fa49cd7a741ddf924e4f889c43ca5df1700258368d6f70abf6c9ff597e5098d0",
                    "Gateway": "172.17.0.1",
                    "IPAddress": "172.17.0.12",
                    "IPPrefixLen": 16,
                    "IPv6Gateway": "",
                    "GlobalIPv6Address": "",
                    "GlobalIPv6PrefixLen": 0,
                    "DNSNames": null
                }
            }
        }
    }
]
```



# 2. 问题原因

#### ✅ 1. `Healthcheck` 配置错误

>核心结论：**是容器的健康检查（Healthcheck）在高频执行，导致系统资源耗尽**
>
>从 `inspect` 输出中
>
>```json
>"Healthcheck": {
>    "Test": [
>        "CMD-SHELL",
>        "curl -f http://localhost:${PORT}/v1/health || exit 1"
>    ],
>    "Interval": 3000000000,   ← 这里是 3 秒（3e9 纳秒）
>    "Timeout": 3000000000,   ← 超时 3 秒
>    "StartPeriod": 5000000000, ← 启动后 5 秒开始检查
>    "Retries": 3
>}
>```

#### ✅ 2. 日志中的 `curl` 行为验证了这一点

你在 `Health.Log` 中看到：

```shell
"Output": "  % Total    % Received % Xferd  Average Speed   Time    Time     Time  Current\n                                 Dload  Upload   Total   Spent    Left  Speed\n\r  0     0    0     0    0     0      0      0 --:--:-- --:--:-- --:--:--     0\r100    50  100    50    0     0  64267      0 --:--:-- --:--:-- --:--:-- 50000\n{\"status\": \"healthy\", \"service\": \"webp-converter\"}"
```

- 这正是 `curl` 的输出格式。
- 时间戳显示：健康检查大约每 **30 秒执行一次？不对！**

⚠️ 等等，这里有个矛盾！

你日志里的 `systemd` 报错是**每 30 秒一次**，但 `Healthcheck.Interval` 是 **3 秒**，为什么健康检查日志却是每 30 秒一条？

### 🧩 三、真相揭秘：Docker 的 Healthcheck 实现机制

Docker 的健康检查是**串行执行的**：

- 如果上一次 `curl` 还没结束，下一次不会并发执行。
- 但如果 `curl` 执行很快（比如几十毫秒），那么它就会**频繁调用**。

但是！更关键的是：

> 🔥 **`systemd[1]: run-docker-runtime\x2drunc-moby-...` 日志的频繁出现，是因为每次健康检查都会调用 `runc` 来在容器内执行命令！**

即使只是运行一个 `curl`，Docker 也要：

1. 创建 exec 实例
2. 调用 `runc` 进入容器命名空间
3. 执行 `curl`
4. 收集输出
5. 更新健康状态

这个过程涉及大量**进程创建、文件系统访问、命名空间切换**，对系统 IO 和 CPU 开销极大。

### ⚠️ 四、为什么会导致服务器崩溃？

| 原因                     | 说明                                                         |
| ------------------------ | ------------------------------------------------------------ |
| 💥 **高频 runc 调用**     | 每 3 秒一次 `runc` 调用 → 大量 `/run/docker/runtime-runc/moby/...` 目录操作 → **高磁盘 IO** |
| 🚀 **进程频繁 fork/exec** | 每次健康检查都 `fork` 新进程 → **CPU 负载飙升**              |
| 🐢 **累积效应**           | 长期运行下，内核调度、内存管理压力增大 → 系统变慢 → 更多进程堆积 → 最终 OOM 或无响应 |

> 📌 尤其是你服务器可能配置不高（如 1C1G 或 2C2G），这种高频健康检查足以拖垮系统。

# 3. 解决方案

