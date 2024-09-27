# 从10分钟优化到3分钟急速启动SpringBoot项目

>首先申明，在最新的Spring版本（6.2.0-M1）中官方已经加入了异步初始化Bean的功能
>
>- https://github.com/spring-projects/spring-framework/issues/19487



## 1. 分析耗时慢的Bean

解决问题之前需要先分析好问题，系统为啥慢都没搞清楚，上来就异步化，反而达不到很好的效果

我们可以简单通过`BeanPostProcessor`来计算每个Bean的耗时时间

```java
import org.springframework.beans.BeansException;
import org.springframework.beans.factory.config.BeanPostProcessor;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.Map;

@Component
public class BeanInitializationTimeLogger implements BeanPostProcessor {

    private Map<String, Long> beanInitializationTimes = new HashMap<>();

    @Override
    public Object postProcessBeforeInitialization(Object bean, String beanName) throws BeansException {
        beanInitializationTimes.put(beanName, System.currentTimeMillis());
        return bean;
    }

    @Override
    public Object postProcessAfterInitialization(Object bean, String beanName) throws BeansException {
        long startTime = beanInitializationTimes.get(beanName);
        long initializationTime = System.currentTimeMillis() - startTime;
        System.out.println("Bean " + beanName + " initialized in " + initializationTime + " ms");
        // 这里可以将数据记录到Metrics中
        return bean;
    }
}

```

分页数据



page pagesize

2 10



cache_1_10_userId

cache_1_10_userId => DB

cache_2_10_userId

cache_3_10_userId

cache_4_10_userId



两级缓存

L1 L2 redis 



分页

1. 滑动分页 => id 过滤下 offset limit => 深翻页
   1. offset 10 limit 10 行式数据库 列式数据库（clickHourse、Hbase）
2. 分页的问题
   1. 第二页的数据 offset 10 limit 10 
   2. count => 性能很差的操作
   3. select count(*) from xxxx;
      1. redis  



流方

缓存 分版本缓存



cache*



sql



keys* 编译所有的key，set => 

scan 100数量





# 参考文章

- [bean加载耗时拓展点](https://juejin.cn/post/7122618843213758478 )
- [68行完成bean异步加载，项目启动速度飞起](https://www.cnblogs.com/thisiswhy/p/17457499.html)
- [13年过去了，Spring官方竟然真的支持Bean的异步初始化了！ ](https://www.cnblogs.com/thisiswhy/p/18202897)
- [蚂蚁boot官方异步化文章](https://help.aliyun.com/document_detail/133162.html)
- [Spring6.2.0支持异步创建Bean容器](https://blog.csdn.net/m0_48767062/article/details/137702306)