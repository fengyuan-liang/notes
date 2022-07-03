# Redis修改key的值（重命名key），附常用key命令

>命令：`rename oldKey newKey`

![image-20220214000613839](https://cdn.fengxianhub.top/resources-master/202202140006996.png)

>不会改变TTL的

![image-20220214000810945](https://cdn.fengxianhub.top/resources-master/202202140008998.png)

>常用key命令，在Redis中存储的```key```都是```String```类型，在Redis中```key```和```value```长度最大均为```512M```

**key操作：**

- `keys *`：查看当前库所有 ***key***  
- `exists key`：判断某个 ***key*** 是否存在
- `type key`：查看你的 ***key*** 是什么类型
- `del key` ：删除指定的 ***key*** 数据
- `unlink key`：根据 ***value*** 选择非阻塞删除，仅将 ***keys*** 从 ***keyspace*** 元数据中删除，真正的删除会在后续异步操作
- `expire key 10` ：为给定的 ***key*** 设置过期时间
- `ttl key`：查看还有多少秒过期，-1表示永不过期，-2表示已过期
- `select`：命令切换数据库
- `dbsize`：查看当前数据库的 ***key*** 的数量
- `flushdb`：清空当前库
- `flushall`：通杀全部库
- `rename oldKey newKey`：重命名key
