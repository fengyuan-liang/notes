Maven-BEP_1-Parent

# 介绍
重构了一下这个项目的maven结构,使其拥有更合理的结构，添加了maven依赖，删去无用的依赖关系

# 软件架构
软件架构说明


# 安装教程

1. ## 需要先导入maven依赖

   ```html
           <dependency>
               <groupId>junit</groupId>
               <artifactId>junit</artifactId>
               <version>4.12</version>
               <scope>test</scope>
           </dependency>
   
           <!--引入maven-BEP_1-service的依赖关系-->
           <dependency>
               <artifactId>maven-BEP_1-service</artifactId>
               <groupId>org.example</groupId>
               <version>1.0-SNAPSHOT</version>
           </dependency>
   
           <!--引入华为api-->
   <!--        <dependency>-->
   <!--            <groupId>com.huawei.cloudcampus.api</groupId>-->
   <!--            <artifactId>cloudcampus</artifactId>-->
   <!--            <version>1.0.0</version>-->
   <!--        </dependency>-->
   
           <!--导入jar包-->
           <dependency>
               <groupId>com.github.kevinsawicki</groupId>
               <artifactId>http-request</artifactId>
               <version>6.0</version>
           </dependency>
   
           <!--导入okhttp-->
           <dependency>
               <groupId>com.squareup.okhttp3</groupId>
               <artifactId>okhttp</artifactId>
               <version>4.9.0</version>
           </dependency>
   
   
           <!-- https://mvnrepository.com/artifact/com.squareup.okhttp3/logging-interceptor -->
           <dependency>
               <groupId>com.squareup.okhttp3</groupId>
               <artifactId>logging-interceptor</artifactId>
               <version>4.9.0</version>
           </dependency>
   
   
           <!-- https://mvnrepository.com/artifact/com.squareup.okhttp/okhttp -->
           <dependency>
               <groupId>com.squareup.okhttp</groupId>
               <artifactId>okhttp</artifactId>
               <version>2.7.5</version>
           </dependency>
   
   
           <!-- https://mvnrepository.com/artifact/com.squareup.okhttp/logging-interceptor -->
           <dependency>
               <groupId>com.squareup.okhttp</groupId>
               <artifactId>logging-interceptor</artifactId>
               <version>2.7.5</version>
           </dependency>
   
   
           <dependency>
               <groupId>org.apache.commons</groupId>
               <artifactId>commons-lang3</artifactId>
               <version>3.7</version>
           </dependency>
   
           <!-- https://mvnrepository.com/artifact/org.joda/joda-convert -->
           <dependency>
               <groupId>org.joda</groupId>
               <artifactId>joda-convert</artifactId>
               <version>2.2.1</version>
           </dependency>
   
           <dependency>
               <groupId>joda-time</groupId>
               <artifactId>joda-time</artifactId>
               <version>2.9.4</version>
           </dependency>
   
           <!-- https://mvnrepository.com/artifact/com.google.code.gson/gson -->
           <dependency>
               <groupId>com.google.code.gson</groupId>
               <artifactId>gson</artifactId>
               <version>2.8.5</version>
           </dependency>
   
           <dependency>
               <groupId>hu.blackbelt.bundles.swagger-parser</groupId>
               <artifactId>io.swagger.parser</artifactId>
               <version>1.0.47_1</version>
           </dependency>
   <!--        <dependency>-->
   <!--            <groupId>org.testng</groupId>-->
   <!--            <artifactId>testng</artifactId>-->
   <!--            <version>1.0-SNAPSHOT</version>-->
   <!--            <scope>compile</scope>-->
   <!--        </dependency>-->
   
           <dependency>
               <groupId>org.apache.httpcomponents</groupId>
               <artifactId>httpclient</artifactId>
               <version>4.5.2</version>
           </dependency>
   
           <dependency>
               <groupId>org.apache.httpcomponents</groupId>
               <artifactId>httpcore</artifactId>
               <version>4.4.5</version>
           </dependency>
   ```

   

2. xxxx

3. xxxx

# 使用说明

1.  需要先导入maven依赖
2.  xxxx
3.  xxxx

# 参与贡献

1.  Fork 本仓库
2.  新建 Feat_xxx 分支
3.  提交代码
4.  新建 Pull Request
5.  


# 特技

1.  使用 Readme\_XXX.md 来支持不同的语言，例如 Readme\_en.md, Readme\_zh.md
2.  Gitee 官方博客 [blog.gitee.com](https://blog.gitee.com)
3.  你可以 [https://gitee.com/explore](https://gitee.com/explore) 这个地址来了解 Gitee 上的优秀开源项目
4.  [GVP](https://gitee.com/gvp) 全称是 Gitee 最有价值开源项目，是综合评定出的优秀开源项目
5.  Gitee 官方提供的使用手册 [https://gitee.com/help](https://gitee.com/help)
6.  Gitee 封面人物是一档用来展示 Gitee 会员风采的栏目 [https://gitee.com/gitee-stars/](https://gitee.com/gitee-stars/)