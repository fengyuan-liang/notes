# Spring源码学习一，下载Spring源码并配置gradle环境

>`Spring`是基于`gradle`开发，可以简单理解`gradle`是和`Maven`一样的Jar包管理工具

## 1. 下载Spring源码

我们先下载Spring源码，直接去Spring的GitHub主页下载：<a href="[spring-projects/spring-framework: Spring Framework (github.com)](https://github.com/spring-projects/spring-framework)">Spring主页</a>，值得一提的是Spring的作者`Rod Johnson`是一位音乐学博士，看来写代码厉害的都是学音乐的😝

![image-20220212113601308](https://gitee.com/fengxian_duck/resources/raw/master/202202121136799.png)

![image-20220212113814749](https://gitee.com/fengxian_duck/resources/raw/master/202202121138001.png)



![image-20220212113955015](https://gitee.com/fengxian_duck/resources/raw/master/202202121139234.png)



## 2. 下载gradle并配置环境

>`注意：解压完成后不要直接用 IDEA 打开，因为 Spring 的源码是用 gradle 构建的。如果已经 用 IDEA 打开了请删除后重新解压`

我们首先查看一下自己下的Spring源码对应的gradle版本，在`spring-framework-5.0.x\gradle\wrapper` 下的` gradle-wrapper.properties `文件，查看里边的 gradle 版本并下载相应版本

![image-20220212115948774](https://gitee.com/fengxian_duck/resources/raw/master/202202121159843.png)

<a href="https://gradle.org/releases/">gradle下载地址</a>

![image-20220212120032422](https://gitee.com/fengxian_duck/resources/raw/master/202202121200542.png)



>下载并解压（强烈建议所有环境依赖放在一个文件下便于管理），现在配置下环境，打开系统环境遍历

![image-20220212114428528](https://gitee.com/fengxian_duck/resources/raw/master/202202121144712.png)



![image-20220212114838628](https://gitee.com/fengxian_duck/resources/raw/master/202202121148725.png)

![image-20220212114851509](https://gitee.com/fengxian_duck/resources/raw/master/202202121148593.png)





![image-20220212114902716](https://gitee.com/fengxian_duck/resources/raw/master/202202121149785.png)



![image-20220212114957056](https://gitee.com/fengxian_duck/resources/raw/master/202202121149188.png)



![image-20220212115056264](https://gitee.com/fengxian_duck/resources/raw/master/202202121150451.png)



>然后验证一下看环境是否配好了

win+R打开cmd

![image-20220212115532716](https://gitee.com/fengxian_duck/resources/raw/master/202202121155897.png)



>接下来我们需要在用户目录下新建一个` init.gradle` 文件，将国外源换成国内镜像(如果没有.gradle 这个目 录,需要自己新建一个)

![image-20220212120354639](https://gitee.com/fengxian_duck/resources/raw/master/202202121203727.png)



配置文件：

```properties
allprojects{
	 repositories {
			def ALIYUN_REPOSITORY_URL = 'https://maven.aliyun.com/nexus/content/groups/public'
			def ALIYUN_JCENTER_URL = 'https://maven.aliyun.com/nexus/content/repositories/jcenter'
			all { ArtifactRepository repo ->
				if(repo instanceof MavenArtifactRepository){
					def url = repo.url.toString()
					if (url.startsWith('https://repo1.maven.org/maven2')) {
						project.logger.lifecycle "Repository ${repo.url} replaced by $ALIYUN_REPOSITORY_URL."
						remove repo
					}
					if (url.startsWith('https://jcenter.bintray.com/')) {
						project.logger.lifecycle "Repository ${repo.url} replaced by $ALIYUN_JCENTER_URL."
						remove repo
					}
				}
			}
		 maven {
			 url ALIYUN_REPOSITORY_URL
			 url ALIYUN_JCENTER_URL
		}
	 }
}
```

## 3. 在IDEA中打开Spring源码

>首先我们要用cmd进入到Spring目录，然后用`gradlew :spring-oxm:compileTestJava`将spring 转成 IDEA 可以导入的工程结构。

构建成功：

![image-20220212124211038](https://gitee.com/fengxian_duck/resources/raw/master/202202121242228.png)

也有可能构建失败，报错像下面这样，是因为没有安装git工具，或者没有初始化spring源码的目录，进入git bash here，敲入`git init`

```css
Build scan background action failed.
org.gradle.process.internal.ExecException: Process 'command 'git'' finished with non-zero exit value 128
```

如果还是有报错可以不用管它，先打开idea导入`Spring`源码工程

检查一下自己`gradle`的地址，上面那个是`jar包`放的目录，会在此目录下生成一个`cache`的目录。下面那个就是`gradle`的地址

![image-20220212204015195](https://gitee.com/fengxian_duck/resources/raw/master/202202122107115.png)

>看下目录下的`build.gradle`文件，将下载的镜像源修改一下

将阿里云的镜像源放在前面：

```css
maven { url 'https://maven.aliyun.com/nexus/content/groups/public/' }
```

![image-20220212204154171](https://gitee.com/fengxian_duck/resources/raw/master/202202122109463.png)



然后点击右边插件区`gradle`图表的那个小象，下载一下依赖，漫长的等待后就会下载完毕

![image-20220212204544931](https://gitee.com/fengxian_duck/resources/raw/master/202202122109315.png)



>至此就可以进行愉快的Spring源码研究了❤

















