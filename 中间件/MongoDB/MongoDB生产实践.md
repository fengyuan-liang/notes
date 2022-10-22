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
		enterTime: { $max: "$enterTime" }}},
		{$project:{'userId':'$_id','enterTime':'$enterTime'}}
])
```

```java
// 1
{
    "_id": NumberLong("1146537712"),
    "userId": NumberLong("1146537712"),
    "enterTime": ISODate("2022-10-09T08:17:49.761Z")
}

// 2
{
    "_id": NumberLong("1146181204"),
    "userId": NumberLong("1146181204"),
    "enterTime": ISODate("2022-09-21T11:40:39.154Z")
}

// 3
{
    "_id": NumberLong("1134320827"),
    "userId": NumberLong("1134320827"),
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

## 2. 三张表联合查询，筛选并分页

业务背景：

需要

### 思路

先获得`clan_join_quit_record`中在

```java
db.clan_join_quit_record.aggregate([
    {
        $lookup: {
            from: "cha_user",
            localField: "userId",
            foreignField: "userId",
            as: "aa"
        }
    }
		
])
```
![](https://cdn.fengxianhub.top/resources-master/20221020144242.png)

解构出来成为单独的数据

```java
db.clan_join_quit_record.aggregate([
    {
        $lookup: {
            from: "cha_user",
            localField: "userId",
            foreignField: "userId",
            as: "aa"
        }
    },
	{
      "$unwind": {
        "path": "$annotation",
        "preserveNullAndEmptyArrays": true
      }
    },
		
])
```

```java
@Override  
public Page<ClanManageQueryUserPageDTO> queryUserManage(ClanUserQueryPageVO vo) {  
    Clan clan = clanService.get(vo.getClanId());  
    if (clan == null) {  
        throw AppException.pop("家族不存在");  
    }  
    Set<Long> userIds = new HashSet<>(clan.getUserIds());  
    // 关联第一张表  
    LookupOperation lookupOperation = LookupOperation.newLookup()  
            .from(MongoUtils.getTableName(ChaUser.class))  
            .localField(ClanQuitAppeal.Fields.userId)  
            .foreignField(ChaUser.Fields.userId)  
            .as("aa");  
    // 关联第二张表  
    LookupOperation lookupOperation2 = LookupOperation.newLookup()  
            .from(ClanVoiRoomUser.COLLECTION_NAME)  
            .localField(ChaUser.Fields.userId)  
            .foreignField(ClanVoiRoomUser.Fields.userId)  
            .as("bb");  
  
    Criteria criteria = Criteria.where("aa").ne(new String[0]).and(ClanQuitAppeal.Fields.status).ne(ApplyStatus.APPLYING.code())  
            .and("aa.type").is(ClanRecordType.JOIN.getType())  
            .and("aa.clanId").is(vo.getClanId())  
            .and("aa.userId").in(userIds);  
    if (!StringUtils.isBlank(vo.getUserNumber())) {  
        criteria.and("bb.userNumber").is(vo.getUserNumber());  
    }  
    if (!StringUtils.isBlank(vo.getUserName())) {  
        criteria.and("bb.userName").is(vo.getUserName());  
    }  
    if (vo.getIsOnline() != null) {  
        criteria.and("bb.roomOnline").is(vo.getIsOnline().equals(1));  
    }  
    if (vo.getStartTime() != null && vo.getEndTime() != null) {  
        criteria.and(BaseEntity.Fields.createTime).gt(vo.getStartTime()  
                .atTime(LocalTime.MIN)).lt(vo.getEndTime().atTime(LocalTime.MAX));  
    }  
    if (vo.getStartTime() == null && vo.getEndTime() != null) {  
        criteria.and(BaseEntity.Fields.createTime).lt(vo.getEndTime().atTime(LocalTime.MAX));  
    }  
    if (vo.getStartTime() != null && vo.getEndTime() == null) {  
        criteria.and(BaseEntity.Fields.createTime).gt(vo.getStartTime().atTime(LocalTime.MIN));  
    }  
    if (!StringUtils.isBlank(vo.getRoomName())) {  
        criteria.and("roomName").is(vo.getRoomName());  
    }  
  
    if (!StringUtils.isBlank(vo.getRoomName())) {  
        criteria.and("roomNumber").is(vo.getRoomNumber());  
    }  
  
    if (ObjectUtil.isNotEmpty(vo.getJoinRoomSign())) {  
        if (vo.getJoinRoomSign() == 0) {  
            criteria.and("roomNumber").ne(null);  
        } else {  
            criteria.and("roomNumber").is(null);  
        }  
    }  
    ProjectionOperation projectionOperation = Aggregation.project()  
            .and("aa.clanId").as("clanId")  
            .and("aa.userId").as("userId")  
            .and("aa.type").as("type")  
            .and("aa.createTime").as("createTime")  
            .and("roomName").as("roomName")  
            .and("roomNumber").as("roomNumber")  
            .and("aa").as("aa")  
            .and("bb").as("bb");  
  
    Aggregation aggregation = Aggregation.newAggregation(  
            lookupOperation,  
            lookupOperation2,  
            // 由于关联的表嵌套默认是数组，所以都解构出来  
            Aggregation.unwind("aa"),  
            Aggregation.unwind("bb"),  
            projectionOperation,  
            Aggregation.match(criteria),  
            // 分页  
            Aggregation.skip((vo.getPageNumber() - 1) * vo.getPageSize()),  
            Aggregation.limit(vo.getPageSize())  
    );  
    AggregationResults<ClanJoinAndQuitRecord> aggregate = mongoTemplate.aggregate(aggregation, ClanVoiRoomUser.class, ClanJoinAndQuitRecord.class);  
    // 本周  
    LocalDateTime nextWeek = LocalDateTime.now().plusWeeks(1);  
    LocalDateTime start = DateUtil.prevWeekBegin(nextWeek);  
    LocalDateTime end = DateUtil.prevWeekEnd(nextWeek);  
    // 本周流水  
    Map<Long, Long> incomeMap = clanFlowRecordService.mapIncome(clan.getId(), start, end);  
    // 本周天数  
    Map<Integer, Long> dayCountMap = clanLiveRecordService.mapDayCount(clan.getId(), start, end);  
    // 本周时长  
    Map<Long, Long> lenMap = clanMicRecordService.mapLen(clan.getId(), start, end);  
    // 用户信息  
    Map<Long, ChaUser> userMap = contextService.userMap(userIds);  
    List<ClanManageQueryUserPageDTO> dtoList = new LinkedList<>();  
    for (ClanJoinAndQuitRecord record : aggregate.getMappedResults()) {  
        ClanManageQueryUserPageDTO dto = new ClanManageQueryUserPageDTO();  
        ChaUser user = contextService.getUser(record.getUserId());  
        dto.setUserId(user.getUserId());  
        dto.setClanId(clan.getId());  
        dto.setClanName(clan.getName());  
        dto.setUserNumber(user.getUserNumber());  
        dto.setUserName(user.getUserName());  
        dto.setJoinDate(DateUtil.format(record.getCreateTime(), DateUtil.DEFAULT_FMT));  
        dto.setClanNumber(clan.getClanNumber());  
        dto.setIsOnline(user.isRoomOnline() ? 1 : 2);  
        dto.setWeekFlow(incomeMap.getOrDefault(user.getUserId(), 0L));  
        dto.setWeekLiveDay(dayCountMap.getOrDefault(userMap.getOrDefault(user.getUserId(), ChaUser.EMPTY).getRoomId(), 0L).intValue());  
        dto.setWeekLiveTime(lenMap.getOrDefault(user.getUserId(), 0L));  
        dto.setFollowCount(relationService.getFollowers(user.getUserId()));  
        ClanLevel clanLevel = clanLevelService.get(clan);  
        if (clanLevel != null) {  
            ClanManageLevelDTO clanLevelDto = new ClanManageLevelDTO();  
            clanLevelDto.setId(clanLevel.getId().intValue());  
            clanLevelDto.setName(clanLevel.getName());  
            dto.setClanLevel(clanLevelDto);  
        }  
        // 填充主播与房间之前的绑定关系  
        ClanVoiRoomUser clanVoiRoomUser = clanVoiRoomUserService.queryByUserNumber(user.getUserNumber());  
        if (Objects.isNull(clanVoiRoomUser)) {  
            dto.setJoinRoomSign(ClanManageQueryUserPageDTO.JoinRoomEnum.UN_JOIN.getCode());  
        } else {  
            dto.setRoomNumber(clanVoiRoomUser.getRoomNumber());  
            dto.setRoomName(clanVoiRoomUser.getRoomName());  
            dto.setJoinRoomSign(ClanManageQueryUserPageDTO.JoinRoomEnum.JOIN.getCode());  
        }  
        dtoList.add(dto);  
    }  
    return new Page<>(vo.getPageSize(), dtoList.size(), dtoList).setTotal(aggregate.getMappedResults().size());  
}
```

### sql

```java
db.clan_join_quit_record.aggregate([
			// 先过滤掉不符合条件的数据
			{$match:{ 
					type:NumberInt('1'),
					userId:{$in:[NumberLong('1154459791'),NumberLong('1154451839'),NumberLong('1137430401'),NumberLong('1130021483')]},
					// 根据时间筛选
					createTime:{"$gte":ISODate("2020-10-27T09:49:10.724Z"),"$lte":ISODate("2022-10-27T09:49:10.724Z")}
			}},
			// 按照userId进行分组，并取最新的数据
			{$group:{
					_id:'$userId',
					createTime:{$max:"$createTime"},
          data:{$max: '$$ROOT'}
			}},
			// 投影出想要的字段
			{$project:{_id:'$_id',userId:'$data.userId', clanId:'$data.userId',type:'$data.type'}},
			// 连接第二张表
			{
					$lookup: {
							from: "clan_voi_room_user",
							localField: "userId",
							foreignField: "userId",
							as: "clan_voi_room_user"
					}
			},
			// 将子文档解构出来
			{
					$unwind:'$clan_voi_room_user'
			},
			// 投影出想要的字段
			{$project:{userId:'$userId', clanId:'$userId'
								,type:'$type',roomNumber:'$clan_voi_room_user.roomNumber'
								,roomName:'$clan_voi_room_user.roomName',joinRoomSign:'$clan_voi_room_user.joinRoomSign'}},
			// 过滤
			{$match:{ 
					"roomNumber": "910532",
					"roomName": "原味豆奶"
			}},
			// 分页
				"$skip": 0
			},
			{
				"$limit": 10
			}
])
```

java代码

```java
private Page<ClanJoinAndQuitRecord> filterClanJoinAndQuitRecord(H5ClanMemberVO vo, MemberInput input) {  
    MatchOperation match = Aggregation.match(Criteria.where(ClanJoinAndQuitRecord.Fields.clanId).is(vo.getClanId())  
            .and(ClanJoinAndQuitRecord.Fields.userId).in(vo.getMembers())  
            .and(ClanJoinAndQuitRecord.Fields.type).is(ClanRecordType.JOIN.getType()));  
    // 筛选时间条件  
    MatchOperation filterTime = Aggregation.match(  
            MongoUtils.betweenTime(new Criteria(), BaseEntity.Fields.createTime, vo.getStartTime(), vo.getEndTime()));  
    // 根据用户分组，选取最大的加入时间 --- 即最新的加入时间  
    GroupOperation group = Aggregation.group(ClanJoinAndQuitRecord.Fields.userId)  
            .first(ClanJoinAndQuitRecord.Fields.userId).as(ClanJoinAndQuitRecord.Fields.userId)  
            .first(ClanJoinAndQuitRecord.Fields.clanId).as(ClanJoinAndQuitRecord.Fields.clanId)  
            .max(BaseEntity.Fields.createTime).as(BaseEntity.Fields.createTime);  
    CountOperation countOperation = Aggregation.count().as("count");  
    // 连接第二张表，mongo里面的`lookup`类似于MySQL中的左连接，即保留右表中null的部分  
    LookupOperation lookupOperation = LookupOperation.newLookup()  
            // 第二张表名  
            .from(ClanVoiRoomUser.COLLECTION_NAME)  
            // 第一张表中要连接的字段  
            .localField("userId")  
            // 第二张表中要连接的字段  
            .foreignField("userId")  
            // 内嵌文档命名  
            .as(ClanVoiRoomUser.COLLECTION_NAME);  
    MatchOperation lookupMatch = null;  
    if (ObjectUtil.isEmpty(input.getJoinRoomSign())) {  
        // 查询全部，不需要筛选  
        lookupMatch = Aggregation.match(new Criteria());  
    } else if (Objects.equals(input.getJoinRoomSign(), 0)) {  
        // 只查询加入家族的用户，即右边表中记录不为空，`new String[0])` 表示空文档 `[]`        lookupMatch = Aggregation.match(Criteria.where(ClanVoiRoomUser.COLLECTION_NAME).ne(new String[0]));  
    } else if (Objects.equals(input.getJoinRoomSign(), 1)) {  
        // 只查询加入家族的用户，即右边表中记录为空  
        lookupMatch = Aggregation.match(Criteria.where(ClanVoiRoomUser.COLLECTION_NAME).is(new String[0]));  
    }  
    // 第二张表里面的筛选，这里要带上连接后的投影名  
    Criteria foreignTableCriteria = new Criteria();  
    if (StrUtil.isNotEmpty(input.getRoomName())) {  
        foreignTableCriteria.and("clan_voi_room_user.roomName").is(input.getRoomName());  
    }  
    if (StrUtil.isNotEmpty(input.getRoomNumber())) {  
        foreignTableCriteria.and("clan_voi_room_user.roomNumber").is(input.getRoomNumber());  
    }  
    MatchOperation foreignTableMatch = Aggregation.match(foreignTableCriteria);  
    // 筛选完后需要排序  
    SortOperation sortOperation = Aggregation.sort(Sort.by(Sort.Order.desc(BaseEntity.Fields.createTime)));  
    // 分页  
    SkipOperation skipOperation = Aggregation.skip(new Long((input.getPageNumber() - 1) * input.getPageSize()));  
    LimitOperation limitOperation = Aggregation.limit(new Long(input.getPageSize()));  
    // 分别统计数量和统计匹配的文档  
    // 统计数量  
    List<Document> document = mongoTemplate.aggregate(Aggregation.newAggregation(  
            match, // 先过滤掉表`clan_join_quit_record`中不符合条件的数据  
            filterTime, // 筛选时间  
            group, // 按照userId分组，并按时间取最大的一条记录  
            lookupOperation, // 连接第二张表，相当于MySQL左外连接  
            lookupMatch, // 连接第二张表后筛选条件  
            foreignTableMatch, //  连接第二张表后筛选条件  
            countOperation  
    ), ClanJoinAndQuitRecord.class, Document.class).getMappedResults();  
    long total = !document.isEmpty() ? document.get(0).get("count", 0) : 0;  
    // 统计匹配的文档  
    AggregationResults<ClanJoinAndQuitRecord> clanJoinAndQuitRecords = mongoTemplate.aggregate(Aggregation.newAggregation(  
            match, // 先过滤掉表`clan_join_quit_record`中不符合条件的数据  
            filterTime, // 筛选时间  
            group, // 按照userId分组，并按时间取最大的一条记录  
            lookupOperation, // 连接第二张表，相当于MySQL左外连接  
            lookupMatch, // 连接第二张表后筛选条件  
            foreignTableMatch, //  连接第二张表后筛选条件  
            sortOperation, // 排序  
            skipOperation, // 分页 跳过多少条  
            limitOperation // 分页 限制多少条  
    ), ClanJoinAndQuitRecord.class, ClanJoinAndQuitRecord.class);  
    // 组装数据  
    Page<ClanJoinAndQuitRecord> page = new Page<>();  
    page.setResult(clanJoinAndQuitRecords.getMappedResults());  
    page.setTotal(total);  
    return page;  
}
```