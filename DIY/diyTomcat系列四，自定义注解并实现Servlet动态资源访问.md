# diyTomcat系列四，自定义注解并实现Servlet动态资源访问

![image-20211227164819753](https://cdn.fengxianhub.top/resources-master/202201230043098.png)

在本节中终于可以遇到一些更加好玩的东西了，这篇文章也可能会有点长

```java
自定义注解、注解解析器、类加载机制、
```

我们首先来看一下<code>Tomcat</code>源码里是怎么设计接口的和继承体系的

Tomcat下<code>servlet-api.jar</code>包目录结构：

![image-20220123010755425](https://cdn.fengxianhub.top/resources-master/202201230107542.png)

我们这里主要要实现的是<code>HttpServletRequest</code>,所以我们在这里主要研究其继承体系。

可以看到<code>HttpServletRequest</code>是一个接口，它的实现类只有一个	

```java
public interface HttpServletRequest extends ServletRequest {}
```

```java
public class HttpServletRequestWrapper extends ServletRequestWrapper implements
        HttpServletRequest {}
```

<code>HttpServletRequestWrapper</code>继承结构：

![image-20220123011419076](https://cdn.fengxianhub.top/resources-master/202201230114185.png)

<code>接口</code>对应的就是规范，当然在本节中没有实现这么多的<code>http规范</code>，仅仅简单实现<code>doGet</code>和<code>doPost</code>方法，所以没有严格遵循<code>Tomcat</code>的继承体系，后续再一步步升级。



## 1. 自定义@myWebServlet注解并解析

​		在笔者注解学习笔记中，曾经定义过<code>Junit</code>的注解，我们可以浅显的认为，注解大部分时候仅仅起到<code>标记</code>和<code>存放属性</code>的作用，解析作用依靠的是<code>注解解析器</code>来完成，在这里我们自定义的注解也仅仅起到这两个作用。

**标记：**

​		我们知道所有的注解都必须带有两个注解<code>@Retention</code>和<code>@Target</code>，Retention标记这个类在程序的什么时期可以访问到，是只在代码中，还是编入class文件中，或者是在运行时可以通过反射访问。我们这里的<code>注解解析器</code>是从<code>class</code>文件中加载的，所以需要设置为<code>RetentionPolicy.RUNTIME</code>。<code>@Target</code>用来标记注解作用在什么地方，是方法上还是类上还是其他地方，我们这里作用在类上，所以设置为<code>ElementType.TYPE</code>。

**存放属性：**

当然我们的注解还需要存放我们<code>Servlet</code>的映射地址，所以需要存放属性。我们知道标准的注解中通常用

```java
String[] value() default {};
```

来存放属性，这样的好处是不用写<code>属性名</code>=<code>属性值</code>，而是可以直接写属性，例如：

```java
@myWebServlet("/hello.action")
```

默认就会存到<code>value</code>中。我们这里先处理一个属性值，后面再处理多个属性值，所以自定义<code>@myWebServlet</code>设计为：

```java
@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.TYPE)
public @interface myWebServlet {
    String value();
}
```

当然此时<code>@myWebServlet</code>并没有任何的作用，主要的工作还是要交给<code>注解解析器来完成</code>，下面我们来捋一下思路：

一般都没会把项目打包成<code>war</code>包放到Tomcat的<code>webapps</code>目录下，项目启动后会自动解压，我们来研究下解压后的文件，笔者这里拿一下简单的web项目来演示一下。

![image-20220123103421526](https://cdn.fengxianhub.top/resources-master/202201231034671.png)

这是我们一般写好的项目目录，<code>controller</code>是笔者放<code>Servlet</code>的地方，<code>web</code>放静态的资源，当我们将项目打成<code>war</code>包放到Tomcat的<code>webapps</code>目录下启动项目并解压后目录变为：

![image-20220123103949000](https://cdn.fengxianhub.top/resources-master/202201231039125.png)



注意此时我们的字节码文件的存放路径为：

```java
Tomcat\webapps\fx-orderSystem\WEB-INF\classes\com\fx\controller\ResFoodController.class
```

​		所以我们要做的就是要扫描这个路径下的<code>所有字节码</code>文件，判断每一个字节码文件有没有被我们的<code>注解</code>所标记，如果被标记了，那么我们应该将其存放到一个集合中，再统一交给我们的<code>资源管理器</code>来进行管理。

**这里我们先实现在项目的工程路径下扫描字节码文件，并将其存放到集合中。**

集合：

```java
public class DiyTomcatServletContext {
    /*用来存放web映射，httpServlet字节码。键对应映射地址，值对应其字节码文件*/
    //ConcurrentHashMap 高并发情况下线程安全的map
    public static Map<String,Class<HttpServlet>> ServletClassMap = new ConcurrentHashMap<>();
}
```

我们将项目路径调整为：

![image-20220123105428346](https://cdn.fengxianhub.top/resources-master/202201231054464.png)

在<code>MyCatServer</code>定义扫描包的方法：

```java
/**
* 扫描类路径，将所有标注有@myWebServlet注解类保存到DiyTomcatServletContext.ServletClassMap中
* Map<String,class>，键对应映射地址，值对应其字节码文件
*/
private void readServletAnnotation() {
    //获得本地项目字节码文件的工程路径
    String userDir = this.getClass().getClassLoader().getResource(".").getPath();
    //递归扫描这个路径下所有的classes文件，获取@myWebservlet注解标记的字节码
    findAllClasses(new File(userDir));
}

private void findAllClasses(File file){
    if(!file.exists()){
        logger.error("类文件加载失败，系统找不到指定路径");
        return;
    }
    String fileAbsolutePath = file.getAbsolutePath();
    //因为file可能是文件也可能是目录所以要递归file
    if(file.isFile()){
        //得到文件后缀名
        int lastDotIndex = fileAbsolutePath.lastIndexOf(".");
        String extension = fileAbsolutePath.substring(lastDotIndex);
        if(".class".equalsIgnoreCase(extension)){
            //让类加载器加载这个文件
            DiyTomcatClassLoader.loadWebServletClassToMap(file,this);
        }
        return;
    }
    //判断其下的所有子文件
    File[] files = file.listFiles();
    //递归加载
    if(files != null && files.length > 0){
        for (File sonFile : files) findAllClasses(sonFile);
    }
}
```

🚩**类加载器：**

这里牵涉到<code>JVM</code>的类加载机制，我们在这里只需要知道通过：

```java
obj.getClass().getClassLoader().getResource(".")
```

可以拿到此字节码文件的地址，格式为：

```java
file:/E:/workspacesJ2SE_idea/DIY/yc-tomcat/out/production/yc-tomcat/
```

通过

```java
obj.getClass().getClassLoader().getResource(".").getPath();
```

可以字节码文件存放的绝对地址拿到：

```java
/E:/workspacesJ2SE_idea/DIY/yc-tomcat/out/production/yc-tomcat/
```

然后我们再通过：

```java
int lastDotIndex = classFilePath.lastIndexOf(".");
String fullPath = classFilePath.substring(classesPath.length() - 1,lastDotIndex);
fullPath = fullPath.replaceAll("\\\\","\\.");
```

再通过遍历就可以拿到指定扫描路径下的所有类的包名，我们将<code>fullPath</code>打印一下：

```java
com.fx.annotations.myWebServlet
com.fx.bean.JsonModel
com.fx.commons.CommonsServlet
com.fx.commons.HttpServlet
com.fx.core.DiyTomcatClassLoader
com.fx.core.DiyTomcatServletContext
com.fx.core.myRunner
com.fx.servlet.helloServlet
```

然后我们将扫描到的注解标记的类存放起来，这里打印一下扫描到注解标记的类，以及注解保存的属性

```java
//遍历一下
DiyTomcatServletContext.ServletClassMap.forEach((key, value)->System.out.println(key+":"+value));
```

```java
//只拿了遍历后的一个结果，可以看到我们已经拿到注解标记的类，以及注解保存的属性
/hello.action:class com.fx.servlet.helloServlet
```

类加载器完整代码：

```java
public class DiyTomcatClassLoader {
    public static void loadWebServletClassToMap(File file,Object obj){
        //如何加载一个类文件到vm
        ClassLoader classLoader = obj.getClass().getClassLoader();
        Class cls = null;
        String classFilePath = file.getPath();
        int lastDotIndex = classFilePath.lastIndexOf(".");
        //将类路径换成标准的Java包命名
        String classesPath = classLoader.getResource(".").getPath();
        String fullPath = classFilePath.substring(classesPath.length() - 1,lastDotIndex);
        fullPath = fullPath.replaceAll("\\\\","\\.");
        try {
            cls = classLoader.loadClass(fullPath);
        } catch (ClassNotFoundException e) {
            e.printStackTrace();
        }
        //检查是否有@myWebServerlet注解
        Annotation[] ans = cls.getAnnotations();
        if(ans != null){
            //获得注解上面的属性并存入ServletClassMap中
            for(Annotation an : ans){
                if(an instanceof myWebServlet){
                    String key = ((myWebServlet) an).value();
                    DiyTomcatServletContext.ServletClassMap.put(key,cls);
                }
            }
    }
}

```



## 2. 简单动态资源分发

项目架构：

![image-20220123162114758](https://cdn.fengxianhub.top/resources-master/202201231621992.png)

​		为了程序的健壮型我们重构一下项目的继承体系，当然也不会实现所有的规范，我们先现在先实现<code>Servlet</code>里面的<code>doGet</code>和<code>doPost</code>请求。

![image-20220123190650058](https://cdn.fengxianhub.top/resources-master/202201231906143.png)

我们定义一个表示<code>http规范</code>的接口，然后让我们的servlet程序都实现这个接口

```java
public abstract class HttpServlet {
    /**
     * Does nothing, because this is an abstract class.
     */
    public HttpServlet() {
        // NOOP
    }
    public abstract void doGet(HttpServletRequest req, HttpServletResponse resp);
    public abstract void doPost(HttpServletRequest req, HttpServletResponse resp);

}
```

我们这里先弄清楚流程并简单实现，后面再一步步加需求。这里我们先规定所有的动态资源访问都以<code>.action</code>结尾。

在HttpServletRequest请求中写一个判断是否为静态资源的方法：

```java
/**
* 判断是否为静态资源访问，这里我们用包含.action的请求表示动态资源的请求
*/
public boolean isStaticRequest(){
    return !queryString.contains(".action");
}
```

我们现在<code>TaskServicel</code>类中对动静态资源进行简单分发：

```java
//根据请求做出响应，是动态资源还是静态资源
Processor processor;
if(req.isStaticRequest()){
    processor = new StaticProcessor();
}else {
    processor = new DynamicProcessor();
}
processor.process(req,resp);
```

其中<code>StaticProcessor</code>和<code>ServletProcessor</code>都继承自<code>HttpServletResponse</code>,然后重写里面处理请求的代码

资源调用接口：

```java
public interface Processor {
    /**
     * 资源处理接口
     *  1. 处理请求
     *  2. 做出响应
     */
    public void process(ServletRequest req,ServletResponse resp);
}
```

**静态资源直接调用：**

```java
public class StaticProcessor implements Processor{
    @Override
    public void process(ServletRequest req, ServletResponse resp) {
        if(resp instanceof HttpServletResponse){
            resp.outResult();//new 谁就调用谁的方法
        }
    }
}

```

**动态资源**反射调用对应的<code>Servlet</code>程序：

```java
public class DynamicProcessor implements Processor{
    private final Logger logger = Logger.getLogger(DynamicProcessor.class);
    public  Map<String,Class<HttpServlet>> ServletClassMap;

    @Override
    public void process(ServletRequest req, ServletResponse resp) {
        ServletClassMap = DiyTomcatServletContext.ServletClassMap;
        HttpServletRequest request = (HttpServletRequest) req;
        HttpServletResponse response = (HttpServletResponse) resp;
        String requestURI = request.getRequestURI();
        //要截取到请求的映射路径
        requestURI = requestURI.substring(requestURI.lastIndexOf("/"));
        if (requestURI == null || "".equals(requestURI)) {
            return;
        }
        Class<HttpServlet> cls = ServletClassMap.get(requestURI);
        //在servlet中找到对应的方法并激活使用
        if(cls != null){
            logger.info("找到sevlet对应的方法了："+requestURI+":"+cls);
            //激活对应的方法
            Method[] methods = cls.getMethods();
            //先使用反射通过指定对象的无产构造器拿到一个指定对象的实例
            Object obj = null;
            try {
                obj = cls.newInstance();
            } catch (InstantiationException | IllegalAccessException e) {
                e.printStackTrace();
            }
            for(Method method : methods){
                if(("do"+request.getMethod()).equalsIgnoreCase(method.getName())){
                    try {
                        method.invoke(obj,request,response);
                    } catch (IllegalAccessException | InvocationTargetException e) {
                        e.printStackTrace();
                    }
                }
            }
        }
    }
}

```

在<code>MyCatServer</code>启动时就要先扫描指定的包路径，扫描的方法自定义注解哪里写了，调用就行。

## 3. 测试与注意点

我们写一个helloServlet来测试一下：

```java
@myWebServlet("/hello.action")
public class helloServlet extends HttpServlet {
    public helloServlet(){
        System.out.println("helloServlet");
    }

    @Override
    public void doGet(HttpServletRequest req, HttpServletResponse resp)  {
        String response_line = "HTTP/1.1 200 OK\r\n";
        String response_Body = "Hello DIY Tomcat from fengxian";//响应体为纯文本
        byte[] bt = response_Body.getBytes();
        String response_head = "Content-Type: text/html\n"+
            "Content-Length: "+bt.length+"\n\n";";//包含一个空行
        try {
            OutputStream out = resp.getOutPutStream();
            out.write((response_line+response_head).getBytes());
            out.flush();
            out.write(bt);
            out.flush();
        } catch (IOException ioException) {
            ioException.printStackTrace();
        }
    }

    @Override
    public void doPost(HttpServletRequest req, HttpServletResponse resp) {
        System.out.println("doPost");
    }
}
```

测试：

![image-20220123182914398](https://cdn.fengxianhub.top/resources-master/202201231829471.png)

后台：

![image-20220123182947735](https://cdn.fengxianhub.top/resources-master/202201231829848.png)

写一个sevlet测试一下数据库：

![image-20220123224053857](https://cdn.fengxianhub.top/resources-master/202201232240388.png)

前台数据：

![image-20220123235252406](https://cdn.fengxianhub.top/resources-master/202201232352584.png)

这时我突然大胆了起来，那我可以放一个不含任何<code>框架</code>的纯天然的<code>JavaWeb</code>项目到<code>diyTomcat</code>里去跑一下嘛？我们把静态资源放在<code>webapps</code>目录下，其他Servlet文件、dao层等等文件先放在工程路径下，后续再升级。测试结果：

![](https://s2.loli.net/2022/01/24/UhLsH354MukZnlq.gif)

<code>banner</code>图标是这个网站上找的：<a href="http://patorjk.com/software/taag/#p=display&f=Big%20Money-nw&t=diyTomcat">banner图标</a>

**注意点：**

这里有几个小细节需要注意一下，不然很容易出错

- 静态资源请求应该默认是长连接，因为一个网页请求常常会有html、css、js等很多文件请求

- 动态资源请求应该是<code>短连接</code>，http响应完后就该结束掉，不然浏览器会一直处于等待情况

- servlet响应的格式一定要规范，要有返回的数据长度，不然浏览器会拒绝接收，比如下面这样

  ```java
  //将json字符串写给前端
  String response="HTTP/1.1 200 OK\n" +
      "Content-Type: application/json; charset=utf-8\n" +
      "Connection: keep-alive\n"+
      "Content-Length: "+bt.length+"\n\n";
  OutputStream out = resp.getOutPutStream();
  try {
      out.write(response.getBytes());//这里传输两次是为了避免空行在浏览器端解析不出来的情况
      out.flush();
      out.write(bt);
      out.flush();
  } catch (IOException ioException) {
      ioException.printStackTrace();
  }
  ```

  

## 3. 小结

这个diyTomcat还是相当稚嫩的，不得不感慨一句<code>学海无涯</code>鸭！接下来我会继续对这个稚嫩的Tomcat进行改造升级。

现在还待解决的问题：

- 扫描class文件的类加载器如果加载到同名class文件异常需要解决
- http规范还需进一步完善
- 需要引入更多的设计模式和更高效的类继承体系以及项目架构来优化代码
- 每次客户端进行请求都需要对磁盘上的文件进行读取，效率低，可不可以利用缓存将经常请求的资源缓存到内存中
- 资源太多不可能全部缓存，可不可以利用队列根据文件访问频率进行梯度排序
- 可不可以设计淘汰算法动态更新缓存的文件
- 怎么进一步提高性能
- 高并发场景如何应对









