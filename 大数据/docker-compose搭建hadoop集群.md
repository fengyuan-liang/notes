# docker-compose搭建hadoop集群

拉取镜像

```java
docker pull bde2020/hadoop-datanode:1.1.0-hadoop3.2.1-java8
docker pull bde2020/hadoop-namenode:1.1.0-hadoop3.2.1-java8
docker pull bde2020/hadoop-resourcemanager:1.1.0-hadoop3.2.1-java8
docker pull bde2020/hadoop-historyserver:1.1.0-hadoop3.2.1-java8
docker pull bde2020/hadoop-nodemanager:1.1.0-hadoop3.2.1-java8
```



默认的hadoop.env

```java
CORE_CONF_fs_defaultFS=hdfs://namenode:8020
CORE_CONF_hadoop_http_staticuser_user=root
CORE_CONF_hadoop_proxyuser_hue_hosts=*
CORE_CONF_hadoop_proxyuser_hue_groups=*

HDFS_CONF_dfs_webhdfs_enabled=true
HDFS_CONF_dfs_permissions_enabled=false

YARN_CONF_yarn_log___aggregation___enable=true
YARN_CONF_yarn_resourcemanager_recovery_enabled=true
YARN_CONF_yarn_resourcemanager_store_class=org.apache.hadoop.yarn.server.resourcemanager.recovery.FileSystemRMStateStore
YARN_CONF_yarn_resourcemanager_fs_state___store_uri=/rmstate
YARN_CONF_yarn_nodemanager_remote___app___log___dir=/app-logs
YARN_CONF_yarn_log_server_url=http://historyserver:8188/applicationhistory/logs/
YARN_CONF_yarn_timeline___service_enabled=true
YARN_CONF_yarn_timeline___service_generic___application___history_enabled=true
YARN_CONF_yarn_resourcemanager_system___metrics___publisher_enabled=true
YARN_CONF_yarn_resourcemanager_hostname=resourcemanager
YARN_CONF_yarn_timeline___service_hostname=historyserver
YARN_CONF_yarn_resourcemanager_address=resourcemanager:8032
YARN_CONF_yarn_resourcemanager_scheduler_address=resourcemanager:8030
YARN_CONF_yarn_resourcemanager_resource___tracker_address=resourcemanager:8031
```





```java
version: "2"

services:
  namenode:
    image: bde2020/hadoop-namenode:1.1.0-hadoop3.2.1-java8
    container_name: namenode
    volumes:
      - hadoop_namenode:/hadoop/dfs/name
    environment:
      - CLUSTER_NAME=test
    env_file:
      - ./hadoop.env
    ports:
      - "50070:50070"
      - "50075:50075"

  resourcemanager:
    image: bde2020/hadoop-resourcemanager:1.1.0-hadoop3.2.1-java8
    container_name: resourcemanager
    depends_on:
      - namenode
      - datanode1
      - datanode2
    env_file:
      - ./hadoop.env
    ports:
      - "8088:8088"

  historyserver:
    image: bde2020/hadoop-historyserver:1.1.0-hadoop3.2.1-java8
    container_name: historyserver
    depends_on:
      - namenode
      - datanode1
      - datanode2
    volumes:
      - hadoop_historyserver:/hadoop/yarn/timeline
    env_file:
      - ./hadoop.env
    ports:
      - "8188:8188"

  nodemanager1:
    image: bde2020/hadoop-nodemanager:1.1.0-hadoop3.2.1-java8
    container_name: nodemanager1
    depends_on:
      - namenode
      - datanode1
      - datanode2
    env_file:
      - ./hadoop.env
    ports:
      - "8042:8042"

  datanode1:
    image: bde2020/hadoop-datanode:1.1.0-hadoop3.2.1-java8
    container_name: datanode1
    depends_on:
      - namenode
    volumes:
      - hadoop_datanode1:/hadoop/dfs/data
    env_file:
      - ./hadoop.env
    ports:
      - "5642:5642"

  datanode2:
    image: bde2020/hadoop-datanode:1.1.0-hadoop3.2.1-java8
    container_name: datanode2
    depends_on:
      - namenode
    volumes:
      - hadoop_datanode2:/hadoop/dfs/data
    env_file:
      - ./hadoop.env
    ports:
      - "5645:5645"
          
  datanode3:
    image: bde2020/hadoop-datanode:1.1.0-hadoop3.2.1-java8
    container_name: datanode3
    depends_on:
      - namenode
    volumes:
      - hadoop_datanode3:/hadoop/dfs/data
    env_file:
      - ./hadoop.env
    ports:
      - "5648:5648"

volumes:
  hadoop_namenode:
  hadoop_datanode1:
  hadoop_datanode2:
  hadoop_datanode3:
  hadoop_historyserver:
```



访问

```java
Namenode: http://namenode:50070/dfshealth.html#tab-overview
History server: http://historyserver:8188/applicationhistory
Datanode: http://datanode:50075/
Nodemanager: http://nodemanager:8042/node
Resource manager: http://resourcemanager:8088/
```











## 版本二

```css
CORE_CONF_fs_defaultFS=hdfs://namenode:9000
CORE_CONF_hadoop_http_staticuser_user=root
CORE_CONF_hadoop_proxyuser_hue_hosts=*
CORE_CONF_hadoop_proxyuser_hue_groups=*
CORE_CONF_io_compression_codecs=org.apache.hadoop.io.compress.SnappyCodec

HDFS_CONF_dfs_replication=3
HDFS_CONF_dfs_webhdfs_enabled=true
HDFS_CONF_dfs_permissions_enabled=false
HDFS_CONF_dfs_namenode_datanode_registration_ip___hostname___check=false

YARN_CONF_yarn_log___aggregation___enable=true
YARN_CONF_yarn_log_server_url=http://historyserver:8188/applicationhistory/logs/
YARN_CONF_yarn_resourcemanager_recovery_enabled=true
YARN_CONF_yarn_resourcemanager_store_class=org.apache.hadoop.yarn.server.resourcemanager.recovery.FileSystemRMStateStore
YARN_CONF_yarn_resourcemanager_scheduler_class=org.apache.hadoop.yarn.server.resourcemanager.scheduler.capacity.CapacityScheduler
YARN_CONF_yarn_scheduler_capacity_root_default_maximum___allocation___mb=8192
YARN_CONF_yarn_scheduler_capacity_root_default_maximum___allocation___vcores=4
YARN_CONF_yarn_resourcemanager_fs_state___store_uri=/rmstate
YARN_CONF_yarn_resourcemanager_system___metrics___publisher_enabled=true
YARN_CONF_yarn_resourcemanager_hostname=resourcemanager
YARN_CONF_yarn_resourcemanager_address=resourcemanager:8032
YARN_CONF_yarn_resourcemanager_scheduler_address=resourcemanager:8030
YARN_CONF_yarn_resourcemanager_resource__tracker_address=resourcemanager:8031
YARN_CONF_yarn_timeline___service_enabled=true
YARN_CONF_yarn_timeline___service_generic___application___history_enabled=true
YARN_CONF_yarn_timeline___service_hostname=historyserver
YARN_CONF_mapreduce_map_output_compress=true
YARN_CONF_mapred_map_output_compress_codec=org.apache.hadoop.io.compress.SnappyCodec
YARN_CONF_yarn_nodemanager_resource_memory___mb=16384
YARN_CONF_yarn_nodemanager_resource_cpu___vcores=8
YARN_CONF_yarn_nodemanager_disk___health___checker_max___disk___utilization___per___disk___percentage=98.5
YARN_CONF_yarn_nodemanager_remote___app___log___dir=/app-logs
YARN_CONF_yarn_nodemanager_aux___services=mapreduce_shuffle

MAPRED_CONF_mapreduce_framework_name=yarn
MAPRED_CONF_mapred_child_java_opts=-Xmx4096m
MAPRED_CONF_mapreduce_map_memory_mb=4096
MAPRED_CONF_mapreduce_reduce_memory_mb=8192
MAPRED_CONF_mapreduce_map_java_opts=-Xmx3072m
MAPRED_CONF_mapreduce_reduce_java_opts=-Xmx6144m
MAPRED_CONF_yarn_app_mapreduce_am_env=HADOOP_MAPRED_HOME=/opt/hadoop-3.2.1/
MAPRED_CONF_mapreduce_map_env=HADOOP_MAPRED_HOME=/opt/hadoop-3.2.1/
MAPRED_CONF_mapreduce_reduce_env=HADOOP_MAPRED_HOME=/opt/hadoop-3.2.1/
```

docker-compose：

```java
version: "3"

services:
  namenode:
    image: bde2020/hadoop-namenode:2.0.0-hadoop3.2.1-java8
    container_name: namenode
    restart: always
    ports:
      - 9870:9870
      - 9010:9000
    volumes:
      - hadoop_namenode:/hadoop/dfs/name
    environment:
      - CLUSTER_NAME=test
      - CORE_CONF_fs_defaultFS=hdfs://namenode:9000
    env_file:
      - ./hadoop.env

  datanode1:
    image: bde2020/hadoop-datanode:2.0.0-hadoop3.2.1-java8
    container_name: datanode1
    restart: always
    volumes:
      - hadoop_datanode1:/hadoop/dfs/data
    environment:
      SERVICE_PRECONDITION: "namenode:9870"
      CORE_CONF_fs_defaultFS: hdfs://namenode:9000
    ports:
      - "9864:9864"
    env_file:
      - ./hadoop.env


  datanode2:
    image: bde2020/hadoop-datanode:2.0.0-hadoop3.2.1-java8
    container_name: datanode2
    restart: always
    volumes:
      - hadoop_datanode2:/hadoop/dfs/data
    environment:
      SERVICE_PRECONDITION: "namenode:9870"
      CORE_CONF_fs_defaultFS: hdfs://namenode:9000
    ports:
      - "9865:9864"
    env_file:
      - ./hadoop.env


  datanode3:
    image: bde2020/hadoop-datanode:2.0.0-hadoop3.2.1-java8
    container_name: datanode3
    restart: always
    volumes:
      - hadoop_datanode3:/hadoop/dfs/data
    environment:
      SERVICE_PRECONDITION: "namenode:9870"
      CORE_CONF_fs_defaultFS: hdfs://namenode:9000
    ports:
      - "9866:9864"
    env_file:
      - ./hadoop.env


  resourcemanager:
    image: bde2020/hadoop-resourcemanager:2.0.0-hadoop3.2.1-java8
    container_name: resourcemanager
    ports:
      - 5088:8088
    restart: always
    environment:
      SERVICE_PRECONDITION: "namenode:9000 namenode:9870 datanode1:9864 datanode2:9864 datanode3:9864"
    depends_on:
      - namenode
      - datanode1
      - datanode2
      - datanode3
    env_file:
      - ./hadoop.env

  nodemanager1:
    image: bde2020/hadoop-nodemanager:2.0.0-hadoop3.2.1-java8
    container_name: nodemanager
    ports:
      - 8042:8042
    restart: always
    environment:
      SERVICE_PRECONDITION: "namenode:9000 namenode:9870 datanode1:9864 datanode2:9864 datanode3:9864 resourcemanager:8088"
    depends_on:
      - namenode
      - datanode1
      - datanode2
      - datanode3
    env_file:
      - ./hadoop.env

  historyserver:
    image: bde2020/hadoop-historyserver:2.0.0-hadoop3.2.1-java8
    container_name: historyserver
    ports:
      - 8188:8188
    restart: always
    environment:
      SERVICE_PRECONDITION: "namenode:9000 namenode:9870 datanode1:9864 datanode2:9864 datanode3:9864 resourcemanager:8088"
    volumes:
      - hadoop_historyserver:/hadoop/yarn/timeline
    depends_on:
      - namenode
      - datanode1
      - datanode2
      - datanode3
    env_file:
      - ./hadoop.env



  spark-master:
    image: bde2020/spark-master:3.1.2-hadoop3.2
    container_name: spark-master
    depends_on:
      - namenode
      - datanode1
      - datanode2
      - datanode3
    ports:
      - "8080:8080"
      - "7077:7077"
    environment:
      - INIT_DAEMON_STEP=setup_spark
      - CORE_CONF_fs_defaultFS=hdfs://namenode:9000

  spark-worker-1:
    image: bde2020/spark-worker:3.1.2-hadoop3.2
    container_name: spark-worker-1
    depends_on:
      - spark-master
    ports:
      - "8081:8081"
    environment:
      - "SPARK_MASTER=spark://spark-master:7077"
      - CORE_CONF_fs_defaultFS=hdfs://namenode:9000

  spark-worker-2:
    image: bde2020/spark-worker:3.1.2-hadoop3.2
    container_name: spark-worker-2
    depends_on:
      - spark-master
    ports:
      - "8082:8081"
    environment:
      - "SPARK_MASTER=spark://spark-master:7077"
      - CORE_CONF_fs_defaultFS=hdfs://namenode:9000


  spark-history-server:
      image: bde2020/spark-history-server:3.1.2-hadoop3.2
      container_name: spark-history-server
      depends_on:
        - spark-master
      ports:
        - "18081:18081"
      volumes:
        - /tmp/spark-events-local:/tmp/spark-events





  hive-server:
    image: bde2020/hive:2.3.2-postgresql-metastore
    container_name: hive-server
    depends_on:
      - namenode
      - datanode1
      - datanode2
      - datanode3
    env_file:
      - ./hadoop-hive.env
    environment:
      HIVE_CORE_CONF_javax_jdo_option_ConnectionURL: "jdbc:postgresql://hive-metastore/metastore"
      SERVICE_PRECONDITION: "hive-metastore:9083"
    ports:
      - "10000:10000"

  hive-metastore:
    image: bde2020/hive:2.3.2-postgresql-metastore
    container_name: hive-metastore
    env_file:
      - ./hadoop-hive.env
    command: /opt/hive/bin/hive --service metastore
    environment:
      SERVICE_PRECONDITION: "namenode:9870 datanode1:9864 datanode2:9864 datanode3:9864 hive-metastore-postgresql:5432"
    ports:
      - "9083:9083"

  hive-metastore-postgresql:
    image: bde2020/hive-metastore-postgresql:2.3.0
    container_name: hive-metastore-postgresql




volumes:
  hadoop_namenode:
  hadoop_datanode1:
  hadoop_datanode2:
  hadoop_datanode3:
  hadoop_historyserver:

```

## 版本三

```java
version: "2.2"
services:
  namenode:
    image: bde2020/hadoop-namenode:1.1.0-hadoop3.2.1-java8
    # 配置好 docker 内的假域名
    hostname: namenode
    container_name: namenode
    ports:
      - 9000:9000
      - 50070:50070
    restart: always
    # 此处使用 network的模式 是host，意思是基于本地的hosts文件内容，此处用处在于和spark集群集成，以及便于外部访问随机生成的端口号
    network_mode: 'host'
    volumes:
      - ./hadoop/namenode:/hadoop/dfs/name
      - ./hadoop/input_files:/input_files
    # environment参数可以添加在 env_file 中
    environment:
      - CLUSTER_NAME=test
      # 配置 hdfs 用户权限问题，不需要只允许 hadoop 用户访问
      - HDFS_CONF_dfs_permissions=false
    # env_file中的参数可以配置在env_file
    env_file:
      - ./hadoop.env

  resourcemanager:
    image: bde2020/hadoop-resourcemanager:1.1.0-hadoop3.2.1-java8
    hostname: resourcemanager
    container_name: resourcemanager
    ports:
      - 8030:8030
      - 8031:8031
      - 8032:8032
      - 8033:8033
      - 8088:8088
    restart: always
    network_mode: 'host'
    depends_on:
      - namenode
      - datanode1
      - datanode2
    env_file:
      - ./hadoop.env
  
  historyserver:
    image: bde2020/hadoop-historyserver:1.1.0-hadoop3.2.1-java8
    hostname: historyserver
    container_name: historyserver
    ports:
      - 8188:8188
    restart: always
    network_mode: 'host'
    depends_on:
      - namenode
      - datanode1
      - datanode2
    volumes:
      - ./hadoop/historyserver:/hadoop/yarn/timeline
    env_file:
      - ./hadoop.env
  
  nodemanager1:
    image: bde2020/hadoop-nodemanager:1.1.0-hadoop3.2.1-java8
    hostname: nodemanager1
    container_name: nodemanager1
    ports:
      - 8040:8040
      - 8041:8041
      - 8042:8042
    restart: always
    network_mode: 'host'
    depends_on:
      - namenode
      - datanode1
      - datanode2
    env_file:
      - ./hadoop.env

  
  datanode1:
    image: bde2020/hadoop-datanode:1.1.0-hadoop3.2.1-java8
    hostname: datanode1
    container_name: datanode1
    restart: always
    network_mode: 'host'
    environment:
      # 等价于在 hdfs-site.xml 中配置 dfs.datanode.address
      - HDFS_CONF_dfs_datanode_address=0.0.0.0:50010
      # dfs.datanode.ipc.address 不使用默认端口的意义是在同一机器起多个 datanode，暴露端口需要不同
      - HDFS_CONF_dfs_datanode_ipc_address=0.0.0.0:50020
      # dfs.datanode.http.address
      - HDFS_CONF_dfs_datanode_http_address=0.0.0.0:50075
    ports:
      - 50010:50010
      - 50020:50020
      - 50075:50075
    depends_on:
      - namenode
    volumes:
      - ./hadoop/datanode1:/hadoop/dfs/data
    env_file:
      - ./hadoop.env
  
  datanode2:
    image: bde2020/hadoop-datanode:1.1.0-hadoop3.2.1-java8
    hostname: datanode2
    container_name: datanode2
    restart: always
    network_mode: 'host'
    environment:
      - HDFS_CONF_dfs_datanode_address=0.0.0.0:50012
      - HDFS_CONF_dfs_datanode_ipc_address=0.0.0.0:50022
      - HDFS_CONF_dfs_datanode_http_address=0.0.0.0:50072
    ports:
      - 50012:50012
      - 50022:50022
      - 50072:50072
    depends_on:
      - namenode
    volumes:
      - ./hadoop/datanode2:/hadoop/dfs/data
    env_file:
      - ./hadoop.env
  
  datanode3:
    image: bde2020/hadoop-datanode:1.1.0-hadoop3.2.1-java8
    hostname: datanode3
    container_name: datanode3
    restart: always
    network_mode: 'host'
    environment:
      - HDFS_CONF_dfs_datanode_address=0.0.0.0:50013
      - HDFS_CONF_dfs_datanode_ipc_address=0.0.0.0:50023
      - HDFS_CONF_dfs_datanode_http_address=0.0.0.0:50073
    ports:
      - 50013:50013
      - 50023:50023
      - 50073:50073
    depends_on:
      - namenode
    volumes:
      - ./hadoop/datanode3:/hadoop/dfs/data
    env_file:
      - ./hadoop.env

```

**hadoop.env**

```java
CORE_CONF_fs_defaultFS=hdfs://namenode:8020
CORE_CONF_hadoop_http_staticuser_user=root
CORE_CONF_hadoop_proxyuser_hue_hosts=*
CORE_CONF_hadoop_proxyuser_hue_groups=*

HDFS_CONF_dfs_webhdfs_enabled=true
HDFS_CONF_dfs_permissions_enabled=false
# 使用
HDFS_CONF_dfs_datanode_use_datanode_hostname=true

YARN_CONF_yarn_log___aggregation___enable=true
YARN_CONF_yarn_resourcemanager_recovery_enabled=true
YARN_CONF_yarn_resourcemanager_store_class=org.apache.hadoop.yarn.server.resourcemanager.recovery.FileSystemRMStateStore
YARN_CONF_yarn_resourcemanager_fs_state___store_uri=/rmstate
YARN_CONF_yarn_nodemanager_remote___app___log___dir=/app-logs
YARN_CONF_yarn_log_server_url=http://historyserver:8188/applicationhistory/logs/
YARN_CONF_yarn_timeline___service_enabled=true
YARN_CONF_yarn_timeline___service_generic___application___history_enabled=true
YARN_CONF_yarn_resourcemanager_system___metrics___publisher_enabled=true
YARN_CONF_yarn_resourcemanager_hostname=resourcemanager
YARN_CONF_yarn_timeline___service_hostname=historyserver
YARN_CONF_yarn_resourcemanager_address=resourcemanager:8032
YARN_CONF_yarn_resourcemanager_scheduler_address=resourcemanager:8030
YARN_CONF_yarn_resourcemanager_resource___tracker_address=resourcemanager:8031

```

版本四

https://blog.csdn.net/zisuu/article/details/106171037?ops_request_misc=%257B%2522request%255Fid%2522%253A%2522165710485816780357296747%2522%252C%2522scm%2522%253A%252220140713.130102334.pc%255Fall.%2522%257D&request_id=165710485816780357296747&biz_id=0&utm_medium=distribute.pc_search_result.none-task-blog-2~all~first_rank_ecpm_v1~rank_v31_ecpm-5-106171037-null-null.142^v31^pc_search_result_control_group,185^v2^control&utm_term=docker+compose%E6%90%AD%E5%BB%BAhadoop&spm=1018.2226.3001.4187

```java
version: "2"

services:
  namenode:
    image: bde2020/hadoop-namenode:1.1.0-hadoop2.7.1-java8
    hostname: namenode
    container_name: namenode
    volumes:
      - ./data/namenode:/hadoop/dfs/name
    environment:
      - CLUSTER_NAME=test
    env_file:
      - ./hadoop.env
    ports:
      - "50070:50070"
      - "8020:8020"
      - "50470:50470"

  resourcemanager:
    image: bde2020/hadoop-resourcemanager:1.1.0-hadoop2.7.1-java8
    hostname: resourcemanager
    container_name: resourcemanager
    depends_on:
      - "namenode"
    links:
      - "namenode"
    ports:
      - "58088:8088"
    env_file:
      - ./hadoop.env

  historyserver:
    image: bde2020/hadoop-historyserver:1.1.0-hadoop2.7.1-java8
    hostname: historyserver
    container_name: historyserver
    volumes:
      - ./data/historyserver:/hadoop/yarn/timeline
    depends_on:
      - "namenode"
    links:
      - "namenode"
    ports:
      - "58188:8188"
    env_file:
      - ./hadoop.env

  nodemanager1:
    image: bde2020/hadoop-nodemanager:1.1.0-hadoop2.7.1-java8
    hostname: nodemanager1
    container_name: nodemanager1
    depends_on:
      - "namenode"
      - "resourcemanager"
    links:
      - "namenode"
      - "resourcemanager"
    ports:
      - "58042:8042"
    env_file:
      - ./hadoop.env

  datanode:
    image: bde2020/hadoop-datanode:1.1.0-hadoop2.7.1-java8
    hostname: datanode
    container_name: datanode
    depends_on:
      - "namenode"
    links:
      - "namenode"
    volumes:
      - ./data/datanode1:/hadoop/dfs/data
    env_file:
      - ./hadoop.env
    ports:
      - "50010:50010"
      - "50075:50075"
      - "50475:50475"
      - "50020:50020"

```

```java
CORE_CONF_fs_defaultFS=hdfs://namenode:8020
CORE_CONF_hadoop_http_staticuser_user=root
CORE_CONF_hadoop_proxyuser_hue_hosts=*
CORE_CONF_hadoop_proxyuser_hue_groups=*

HDFS_CONF_dfs_webhdfs_enabled=true
HDFS_CONF_dfs_permissions_enabled=false
HDFS_CONF_dfs_client_use_datanode_hostname=true
HDFS_CONF_dfs_datanode_use_datanode_hostname=true
YARN_CONF_yarn_log___aggregation___enable=true
YARN_CONF_yarn_resourcemanager_recovery_enabled=true
YARN_CONF_yarn_resourcemanager_store_class=org.apache.hadoop.yarn.server.resourcemanager.recovery.FileSystemRMStateStore
YARN_CONF_yarn_resourcemanager_fs_state___store_uri=/rmstate
YARN_CONF_yarn_nodemanager_remote___app___log___dir=/app-logs
YARN_CONF_yarn_log_server_url=http://historyserver:8188/applicationhistory/logs/
YARN_CONF_yarn_timeline___service_enabled=true
YARN_CONF_yarn_timeline___service_generic___application___history_enabled=true
YARN_CONF_yarn_resourcemanager_system___metrics___publisher_enabled=true
YARN_CONF_yarn_resourcemanager_hostname=resourcemanager
YARN_CONF_yarn_timeline___service_hostname=historyserver
YARN_CONF_yarn_resourcemanager_address=resourcemanager:8032
YARN_CONF_yarn_resourcemanager_scheduler_address=resourcemanager:8030
YARN_CONF_yarn_resourcemanager_resource___tracker_address=resourcemanager:8031

```

