# 往redis里存对象，将bean存入redis hash中

> 由于redis中Hash数据类型的特点，`特别适合存储对象`，所以我们使用hash存储对象

**我们最后要完成的效果是这样的：**

![image-20220208182627053](https://cdn.fengxianhub.top/resources-master/202202081826300.png)

我们首先要知道如果往hash的key中加英文冒号`:`，用可视化工具看的时候就会自动变成上面图的那样。

这里我存的key是：王五:oR83j4kkq2CyvVmuxl6znKbrWi2A

往hash中存数据一共有三种形式，我放到文章最后面，可以复习看一下

## 1.SpringBoot中添加redis配置类

**坐标依赖：**

```xml
<!-- redis -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-data-redis</artifactId>
</dependency>
<!-- 对象池，使用redis存储Object时必须引入 -->
<dependency>
    <groupId>org.apache.commons</groupId>
    <artifactId>commons-pool2</artifactId>
</dependency>
```

**配置类代码：**

```java
@Configuration
public class RedisConfig extends CachingConfigurerSupport {
    @Bean
    @ConditionalOnMissingBean(name = "redisTemplate")
    public RedisTemplate<Object, Object> redisTemplate(RedisConnectionFactory redisConnectionFactory) {
        //初始化一个redis模板
        RedisTemplate<Object, Object> template = new RedisTemplate<>();
        //使用fastjson实现对于对象得序列化
        Jackson2JsonRedisSerializer<Object> serializer = new Jackson2JsonRedisSerializer<>(Object.class);
        ObjectMapper om = new ObjectMapper();
        om.setVisibility(PropertyAccessor.ALL, JsonAutoDetect.Visibility.ANY);
        om.enableDefaultTyping(ObjectMapper.DefaultTyping.NON_FINAL);
        serializer.setObjectMapper(om);

        //设置“值”的序列化方式
        template.setValueSerializer(serializer);
        //设置“hash”类型数据的序列化方式
        template.setHashValueSerializer(serializer);
        //设置“key"的序列化方式
        template.setKeySerializer(new StringRedisSerializer());
        //设置“hash的key”的序列化方式
        template.setHashKeySerializer(new StringRedisSerializer());
        //设置redis模板的工厂对象
        template.setConnectionFactory(redisConnectionFactory);
        return template;
    }
}
```

## 2. 实现代码

```java
@Resource
private RedisTemplate<String,Object> redisTemplate;

@Test
public void TestRedis() throws InstantiationException, IllegalAccessException {
    //拿到一个JavaBean
    UmbrellaBorrow umbrellaBorrow = umbrellaBorrowService.getById(1);
    //设置key
    String key="umbrella:"+"张三oR83j4kkq2CyvVmuxl6znKbrWi2A";
    String key2="umbrella:"+"李四oR83j4kkq2CyvVmuxl6znKbrWi2A";
    String key3="umbrella:"+"王五oR83j4kkq2CyvVmuxl6znKbrWi2A";
    //拿到redis操作对象
    HashOperations<String, Object, Object> redisHash = redisTemplate.opsForHash();
    try {
        //存入redis中
        parseMap(key,redisHash,umbrellaBorrow);
        parseMap(key2,redisHash,umbrellaBorrow);
        parseMap(key3,redisHash,umbrellaBorrow);
    } catch (InvocationTargetException e) {
        e.printStackTrace();
    }
}
/**
  * 将bean转成map
  */
private void parseMap(String key,HashOperations<String, Object, Object> redisHash, Object bean) throws IllegalAccessException, InstantiationException, InvocationTargetException {
    //1. 获得所有的get方法
    List<Method> allGetMethod = getAllGetMethod(bean);
    //2. 遍历往redis中存入值
    for(Method m : allGetMethod){
        //截取属性名
        String field = m.getName().substring(3);
        //激活方法得到值
        Object value = m.invoke(bean)+"";//将LocalDataTime转换成字符串
        //往redis里存这些字段
        redisHash.put(key,field,value);
    }

}

/**
  * 取出所有的get方法
  *
  * @param bean 指定实例
  * @return 返回set方法的集合
  */
private List<Method> getAllGetMethod(Object bean) {
    List<Method> getMethods = new ArrayList<>();
    Method[] methods = bean.getClass().getMethods();
    for (Method m : methods) {
        if (m.getName().startsWith("get")) {
            getMethods.add(m);
        }
    }
    return getMethods;
}
```

> 🚀也可以用`org.springframework.cglib.beans.BeanMap`转换，可以封装成一个工具类

```java
/**
  * 将bean存入Redis中
  */
private void parseRedisMap(String key, Object bean,HashOperations<String, Object, Object> redisHash) {
    Map<String, Object> map = BeanMapUtil.beanToMap(bean);
    map.forEach((field,value)->redisHash.put(key,field, String.valueOf(value)));
}
```

**工具类：**

```java
public class BeanMapUtil {

    public static <T> Map<String, Object> beanToMap(T bean) {
        BeanMap beanMap = BeanMap.create(bean);
        Map<String, Object> map = new HashMap<>();

        beanMap.forEach((key, value) -> {
            map.put(String.valueOf(key), value);
        });
        return map;
    }

    public static <T> T mapToBean(Map<String, ?> map, Class<T> clazz)
            throws IllegalAccessException, InstantiationException {
        T bean = clazz.newInstance();
        BeanMap beanMap = BeanMap.create(bean);
        beanMap.putAll(map);
        return bean;
    }

    public static <T> List<Map<String, Object>> objectsToMaps(List<T> objList) {
        List<Map<String, Object>> list = new ArrayList<>();
        if (objList != null && objList.size() > 0) {
            Map<String, Object> map = null;
            T bean = null;
            for (int i = 0, size = objList.size(); i < size; i++) {
                bean = objList.get(i);
                map = beanToMap(bean);
                list.add(map);
            }
        }
        return list;
    }

    public static <T> List<T> mapsToObjects(List<Map<String, Object>> maps, Class<T> clazz)
            throws InstantiationException, IllegalAccessException {
        List<T> list = new ArrayList<>();
        if (maps != null && maps.size() > 0) {
            Map<String, ?> map = null;
            for (int i = 0, size = maps.size(); i < size; i++) {
                map = maps.get(i);
                T bean = mapToBean(map, clazz);
                list.add(bean);
            }
        }
        return list;
    }
}
```

## 附录 ⭐哈希（hash）复习

***Redis hash*** 是一个键值对集合。

***Redis hash*** 是一个 ***String*** 类型的 ***field*** 和 ***value*** 的映射表，***hash*** `特别适合用于存储对象`。类似 Java 里面的 Map<String,Object>

![image-20220208112708716](https://cdn.fengxianhub.top/resources-master/202202081127594.png)

<h2>如何将对象存到Redis中呢？</h2>

> **第一种**：`将对象转换成一个JSON字符串`，例如上图所示：user={id=1,name="张三",age=20}

**缺点**：无法直接操作这个对象，例如想将age加一，需要先反序列化 改好后再序列化回去。开销较大。太复杂，一般不用

> **第二种**：通过用户key：id+对象属性标签，value：属性的方式存储
> 
> ![image-20220208113436681](https://cdn.fengxianhub.top/resources-master/202202081134748.png)

**优点**：方便对对象中的属性进行操作

**缺点**：数据太过分散，数据一多就显得十分混乱，一般我们也不用

> 🚀**第三种**：通过hash映射存储，key：id，value：<field,value>的形式
> 
> ![image-20220208115418767](https://cdn.fengxianhub.top/resources-master/202202081836494.png)

第三种方式是最适合存储对象的

![image-20220208121355632](https://cdn.fengxianhub.top/resources-master/202202081836532.png)

**常用命令：**

- `hset <key><field><value>`：给 ***\<key>*** 集合中的 ***\<field>*** 键赋值 ***\<value>***
- `hget <key1><field>`：从 ***\<key1>*** 集合 ***\<field>*** 取出 ***value*** 
- `hmset <key1><field1><value1><field2><value2>...`： 批量设置 ***hash*** 的值
- `hexists <key1><field>`：查看哈希表 ***key*** 中，给定域 ***field*** 是否存在
- `hkeys <key>`：列出该 ***hash*** 集合的所有 ***field***
- `hvals <key>`：列出该 ***hash*** 集合的所有 ***value***
- `hincrby <key><field><increment>`：为哈希表 ***key*** 中的域 ***field*** 的值加上增量 1  -1
- `hsetnx <key><field><value>`：将哈希表 ***key*** 中的域 ***field*** 的值设置为 ***value*** ，当且仅当域 ***field*** 不存在

**数据结构**:

***Hash*** 类型对应的数据结构是两种：***ziplist***（压缩列表），***hashtable***（哈希表）。

当 ***field-value*** 长度较短且个数较少时，使用 ***ziplist***，否则使用 ***hashtable***。

<hr>
