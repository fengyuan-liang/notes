# MongoDB生产实践

## 十月

### 1. 查询指定用户最新进房时间

#### 业务背景

需要查询指定用户进入指定房间的每个用户的最新记录

#### 数据样本

```json
{
    "_id": ObjectId("632027b797e9ca18ebbd82b8"),
    "enterTime": ISODate("2022-09-13T06:48:23.867Z"),
    "leaveTime": ISODate("2022-09-13T06:54:20.264Z"),
    "userId": NumberLong("1134320827"),
    "lineTime": NumberLong("5"),
    "roomId": NumberInt("429181"),
    "status": "02",
    "enterDate": "2022-09-13"
}
```

#### 思路
-   首先通过`in`查询，先查询出用户集合中的所有记录，并过滤房间号
- 通过用户的`userId`进行分组，并通过`$ROOT`将分组后的所有文档放入数组中
- 使用筛选器`$filter`获取该数组中日期为最大日期的文档

#### sql

```javascript
db.voi_user_online_time.aggregate([
		{$match:{'userId':{$in:[NumberLong('1146537712'),NumberLong("1146181204"),NumberLong("1134320827")]},"roomId": NumberInt("429181")}},
		{$group:{ 
				"_id":"$userId",
				// 将所有文档放入单独的数组中
				"data":{
						"$push":"$$ROOT"
				}
		}},
		// 将分组的文档进行投影
		{$project:{
				data:{
						$filter:{
								input:"$data",
								as: "item",
								cond:{
										$eq:[
												"$$item.enterTime",
												{$max:"$data.enterTime"}
										]
								}
						}
				}
		}}
])
```

查询结果：

可以看到分别拿到了指定的三个用户在指定房间里面最新的数据

```java
// 1
{
    "_id": NumberLong("1146537712"),
    "data": [
        {
            "_id": ObjectId("6340efbc38f5fd7c891574d9"),
            "enterTime": ISODate("2022-10-08T03:34:20.051Z"),
            "leaveTime": ISODate("2022-10-08T03:34:20.708Z"),
            "userId": NumberLong("1146537712"),
            "lineTime": NumberLong("0"),
            "roomId": NumberInt("429181"),
            "status": "02",
            "enterDate": "2022-10-08"
        }
    ]
}

// 2
{
    "_id": NumberLong("1146181204"),
    "data": [
        {
            "_id": ObjectId("632af83738f5fd31b0c1b0ff"),
            "enterTime": ISODate("2022-09-21T11:40:39.154Z"),
            "leaveTime": ISODate("2022-09-21T11:49:05.235Z"),
            "userId": NumberLong("1146181204"),
            "lineTime": NumberLong("8"),
            "roomId": NumberInt("429181"),
            "status": "02",
            "enterDate": "2022-09-21"
        }
    ]
}

// 3
{
    "_id": NumberLong("1134320827"),
    "data": [
        {
            "_id": ObjectId("632027b797e9ca18ebbd82b8"),
            "enterTime": ISODate("2022-09-13T06:48:23.867Z"),
            "leaveTime": ISODate("2022-09-13T06:54:20.264Z"),
            "userId": NumberLong("1134320827"),
            "lineTime": NumberLong("5"),
            "roomId": NumberInt("429181"),
            "status": "02",
            "enterDate": "2022-09-13"
        }
    ]
}

```

#### java代码

```java

```

#### 解法二

```java
db.voi_user_online_time.aggregate([
		{$match:{'userId':{$in:[NumberLong('1146537712'),NumberLong("1146181204"),NumberLong("1134320827")]},"roomId": NumberInt("429181")}},
		// {$sort: {"enterTime": -1}},
		{$group:{ 
		"_id":"$userId",
		// 将所有文档放入单独的数组中
		enterTime: { $max: "$enterTime" }}}
])
```

```java
// 1
{
    "_id": NumberLong("1146537712"),
    "enterTime": ISODate("2022-10-08T03:34:20.051Z")
}

// 2
{
    "_id": NumberLong("1146181204"),
    "enterTime": ISODate("2022-09-21T11:40:39.154Z")
}

// 3
{
    "_id": NumberLong("1134320827"),
    "enterTime": ISODate("2022-09-13T06:48:23.867Z")
}

```

Java代码

```java
private Map<Long, LocalDateTime> queryUserEnterRoomTime(List<ChaUser> userList, Integer roomId) {  
    if (CollUtil.isEmpty(userList)) {  
        return Maps.newHashMap();  
    }  
    // 获取用户的id  
    List<Long> userIds = userList.stream().map(ChaUser::getUserId).collect(Collectors.toList());  
    Aggregation aggregation = Aggregation.newAggregation(  
            Aggregation.match(Criteria.where(VoiUserOnineTime.Fields.userId).in(userIds)  
                    .and(VoiUserOnineTime.Fields.roomId).is(roomId)),  
            // 分组  
            Aggregation.group(VoiUserOnineTime.Fields.userId).max(VoiUserOnineTime.Fields.enterTime).as(VoiUserOnineTime.Fields.enterTime),  
            // 投影  
            Aggregation.project().and("_id").as("userId").and("enterTime").as("enterTime")  
    );  
    AggregationResults<VoiUserOnineTime> aggregate = mongoTemplate.aggregate(aggregation, VoiUserOnineTime.class, VoiUserOnineTime.class);  
    List<VoiUserOnineTime> mappedResults = aggregate.getMappedResults();  
    log.info("queryUserEnterRoomTime result is：【{}】", mappedResults);  
    return mappedResults.stream().collect(Collectors.toMap(VoiUserOnineTime::getUserId, VoiUserOnineTime::getEnterTime));  
}
```

