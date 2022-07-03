<style>
    @font-face {
            font-family: 'Monaco';
            src: url('https://cdn.fengxianhub.top/resources-master/202109201607602.woff2') 		                                                                                                 format('woff2'),
            url('https://cdn.fengxianhub.top/resources-master/202109201608370.woff') format('woff');
            font-weight: normal;
            font-style: normal;
            font-display: swap;
        }
    dl{
        font-family: Monaco;
    }
    code {
        color: #c7254e;
        background-color: #f9f2f4;
        border-radius: 2px;
        padding: 2px 4px;
        font-family: Monaco;
    }
    blockquote{
        display: block;
        padding: 16px;
        margin: 0 0 24px;
        border-left: 8px solid #dddfe4;
        background: #eef0f4;
        overflow: auto;
        word-break: break-word!important;
    }
</style>
<blockquote>
    <p>
        diyTomcat第二期，实现一个简单的<code>http静态资源</code>访问器
    </p>
</blockquote>

​		通过序言的内容我们知道，http协议我们可以通过socket获取请求的内容，接下来我们通过请求的内容就可以将服务器内的资源通过socket回传给客户端

​		先进行简单实现，后续再进行升级改造

>项目工程路径示例

![image-20220119135153387](https://cdn.fengxianhub.top/resources-master/202201191351598.png)

笔者这里做了日志处理和xml解析需要导入几个jar包：

```css
dom4j-1.6.1.jar 
log4j-1.2.14.jar
```

可以在Maven官网上下载：<a href="https://mvnrepository.com/artifact/org.dom4j/dom4j">Maven传送门</a>

这里还放了一个server.xml配置文件，可以去官方Tomcat的conf目录下copy

## 1.  MyCatServer主类

```java
package com.fx.tomcat;


import org.apache.log4j.Logger;
import org.dom4j.Document;
import org.dom4j.DocumentException;
import org.dom4j.Element;
import org.dom4j.io.SAXReader;

import java.io.*;
import java.net.ServerSocket;
import java.net.Socket;

/**
 * @author: fengxian
 * @date: 2022/1/17 17:02
 * Description:
 */
public class MyCatServer {

    private final Logger logger = Logger.getLogger(MyCatServer.class);
    private boolean flag=true;
    public static void main(String[] args) throws IOException {
        MyCatServer myCatServer = new MyCatServer();
        int tomcatServicePort = myCatServer.getTomcatServicePort();
        myCatServer.startServer(tomcatServicePort);
    }

    private void startServer(int port) {
        try (ServerSocket ss = new ServerSocket(port)) {
            while(flag){
                Socket socket = ss.accept();
                logger.debug("有用户进行请求,他是"+socket.getLocalSocketAddress());
                new Thread(new TaskService(socket)).start();
            }
        } catch (Exception e) {
        	logger.error("服务器启动异常：{}",e);
        }
    }

    /**
     * 获得配置文件
     */
    private int getTomcatServicePort() {
        SAXReader saxReader = new SAXReader();
        Document document = null;
        try {
            document = saxReader.read("yc-tomcat/src/main/resources/server.xml");
        } catch (DocumentException e) {
            e.printStackTrace();
        }
        assert document != null;
        Element root = document.getRootElement();
        Element connector = root.element("Service").element("Connector");
        return Integer.parseInt(connector.attributeValue("port"));
    }
}

```



## 2. TaskService主类

```java
package com.fx.tomcat;

import org.apache.log4j.Logger;

import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.Socket;

/**
 * @author: fengxian
 * @date: 2022/1/18 9:09
 * Description:
 */
public class TaskService implements Runnable{
    private final Logger logger = Logger.getLogger(TaskService.class);
    private Socket socket;
    private InputStream in = null;
    private OutputStream out = null;
    private boolean flag;
    private String Connection=null;
    private HttpServletRequest request;
    private HttpServletResponse response;
    public TaskService(Socket socket){
        this.socket=socket;
        flag = true;
    }
    @Override
    public void run() {
        while(flag){
            try {
                //http请求封装
                HttpServletRequest req = new HttpServletRequest(socket);
                //根据请求做出响应
                HttpServletResponse resp = new HttpServletResponse(req, socket);
            } catch (Exception e) {
                logger.error("线程运行错误"+e.getMessage());
            }finally {
                if(!"keep-alive".equals(Connection)){
                    flag = false;
                    //不是长链接即关闭资源
                    try {
                        socket.close();
                    } catch (IOException ioException) {
                        logger.error(ioException.getMessage());
                    }
                    try {
                        if(in != null){
                            in.close();
                        }
                    } catch (IOException ioException) {
                        logger.error(ioException.getMessage());
                    }
                    try {
                        if(out != null){
                            out.close();
                        }
                    } catch (IOException ioException) {
                        logger.error(ioException.getMessage());
                    }
                }
            }
        }
    }
}

```

## 3. HttpServletRequest

>HttpServletRequest负责解析请求并将请求的数据进行包装

```java
package com.fx.tomcat;

import org.apache.log4j.Logger;

import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.net.Socket;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * @author: fengxian
 * @date: 2022/1/18 9:35
 * Description:
 */
public class HttpServletRequest {
    private final Logger logger = Logger.getLogger(HttpServletRequest.class);
    private final Socket socket;
    private final InputStream in;
    private String method;
    private String requestURI;//统一资源标识符
    private String requestURL;//统一资源定位符
    private String queryString;
    private final Map<String,String[]> parameterMap = new ConcurrentHashMap<>();//参数
    private String scheme;//协议类型 http1.1
    private String protocol;//协议版本
    private String realPath;//项目所在绝对路径
    public HttpServletRequest(Socket socket) throws IOException {
        this.socket=socket;
        this.in=socket.getInputStream();
        //获得原始的请求数据
        String rawData = readFromStream();
        //截取相应参数  version  method  requestURI  headers(Map)..头域信息  参数parameterMap
        parseRequestInfo(rawData);
        //正则表达式解析请求的字符串
    }

    private void parseRequestInfo(String rawData){
        //先根据空行截取两个部分request_line&response_head  response_Body
        String[] strings = rawData.split("\\n");
        String request_line = strings[0];
        parseRequestLine(request_line);
        //TODO parseRequestHead();
    }

    /**
     * 解析请求头
     */
    private void parseRequestHead() {
    }

    /**
     * 将请求行解析
     * 请求头示例：
     *      1. 带参数：GET /comment/index.html?type=0&id=415792881 HTTP/1.1
     *      2. 不带参数：POST /foods/Resuser.action HTTP/1.1
     *      3. /表示访问欢迎页面：GET / HTTP/1.1
     */
    private void parseRequestLine(String request_line) {
        String[] strings = request_line.split("\\s");
        this.method=strings[0];//GET
        this.queryString=strings[1];///comment/index.html?type=0&id=415792881
        this.protocol=strings[2];//HTTP/1.1
        this.scheme=protocol.split("/")[0];//HTTP
        //带参数
        if(queryString.contains("?")){
            String[] strs = queryString.split("\\?");
            this.requestURI=strs[0];//      /comment/index.html
            String[] params = strs[1].split("&");
            for (String str : params) {
                String[] entry=str.split("=");
                String[] values = entry[1].split(",");
                parameterMap.put(entry[0],values);
            }
        }else {
            this.requestURI=queryString;
        }
        //如果requestURI为 / 则需要去web.xml中找<welcome-file-list>里的默认欢迎界面，一般为index.html
        requestURI = "/".equals(requestURI) ? "index.html" : requestURI;
        this.requestURL=scheme+"://"+socket.getLocalSocketAddress()+requestURI;
        //拿到项目的在服务器上的绝对路径 / 要用File.separator表示，不同环境下可能不同
        this.realPath=System.getProperty("user.dir")+ File.separator+"yc-tomcat"+File.separator+"webapps";
    }


    /**
     * 获得http请求的原始数据
     */
    private String readFromStream() throws IOException {
        StringBuilder rawData = new StringBuilder(100*1024);
        int length;
        byte[] bt=new byte[100*1024];
        length = in.read(bt);
        for (int i = 0; i < length; i++) {
            rawData.append((char)bt[i]);
        }
        return rawData.toString();
    }

    @Override
    public String toString() {
        return "HttpServletRequest{" +
                "method='" + method + '\'' +
                ", requestURI='" + requestURI + '\'' +
                ", requestURL='" + requestURL + '\'' +
                ", queryString='" + queryString + '\'' +
                ", parameterMap=" + parameterMap +
                ", scheme='" + scheme + '\'' +
                ", protocol='" + protocol + '\'' +
                ", realPath='" + realPath + '\'' +
                '}';
    }

    public String getRealPath(){
        return realPath;
    }

    public InputStream getIn() {
        return in;
    }

    public String getMethod() {
        return method;
    }

    public String getRequestURI() {
        return requestURI;
    }

    public String getRequestURL() {
        return requestURL;
    }

    public String getQueryString() {
        return queryString;
    }

    public Map<String, String[]> getParameterMap() {
        return parameterMap;
    }

    public String getScheme() {
        return scheme;
    }

    public String getProtocol() {
        return protocol;
    }
}

```

## 4. HttpServletResponse

HttpServletResponse主要是得到客户端请求的字段并对其进行响应

```java
package com.fx.tomcat;

import org.apache.log4j.Logger;

import java.io.*;
import java.net.Socket;

/**
 * @author: fengxian
 * @date: 2022/1/18 9:53
 * Description:
 */
public class HttpServletResponse {
    private final Logger logger = Logger.getLogger(HttpServletResponse.class);
    private Socket socket;
    private HttpServletRequest request;
    private OutputStream out;
    private String requestURI;
    private String realPath;
    public HttpServletResponse(HttpServletRequest request, Socket socket) {
        this.request = request;
        this.socket = socket;
        this.realPath=request.getRealPath();
        this.requestURI = request.getRequestURI();
        outResult();
    }

    /**
     * 从request拿到需要请求的资源，从资源路径下通过流返回给客户端
     */
    private void outResult() {
        byte[] fileContent;//要输出文件的字节数组
        String responseProtocol=null;
        try {
            out = socket.getOutputStream();
        } catch (IOException ioException) {
            logger.error("服务器响应输出异常：" + ioException.getMessage());
        }
        if (requestURI == null || "".equals(requestURI)) {
            logger.error("URI为空");
            return;
        }
        String fileName = request.getRealPath() + requestURI;
        File file = new File(fileName);
        if (file.exists()) {
            fileContent = readFile(file);
            responseProtocol = get200Protocol(fileContent);
        } else {
            File file404 = new File(request.getRealPath(), "404.html");
            fileContent = readFile(file404);
            responseProtocol=get404Protocol(fileContent);
        }
        //最后输出
        try {
        	out.write(responseProtocol.getBytes());
        	out.flush();
        	out.write(fileContent);
        	out.flush();
        } catch (IOException e) {
        	logger.error("服务器数据写出出错："+e.getMessage());
        }finally {
            if(out != null){
                try {
                    out.close();
                } catch (IOException e) {
                    logger.error("服务器错误："+e.getMessage());
                }
            }
        }
    }
    //200协议
    private String get200Protocol(byte[] bt) {
        int index = requestURI.lastIndexOf(".");
        if (index >= 0){
            index++;//从后面截取，取后缀名
        }
        String extension = requestURI.substring(index);
        String response_line = "HTTP/1.1 200\n";
        String response_head = "";
        if("html".equalsIgnoreCase(extension) || "htm".equalsIgnoreCase(extension)){
            response_head= "Content-Type: text/html\n"+
                    "Content-Length: "+bt.length+"\n\n";//包含一个空行
        }else if ("css".equalsIgnoreCase(extension)){
            response_head= "Content-Type: text/css\n"+
                    "Content-Length: "+bt.length+"\n\n";//包含一个空行
        }else if("js".equalsIgnoreCase(extension)){
            response_head= "Content-Type: text/javascript\n"+
                    "Content-Length: "+bt.length+"\n\n";//包含一个空行
        }else if("jpeg".equalsIgnoreCase(extension) || "jpg".equalsIgnoreCase(extension)){
            response_head= "Content-Type: image/jpeg\n"+
                    "Content-Length: "+bt.length+"\n\n";//包含一个空行
        }else if("png".equalsIgnoreCase(extension)){
            response_head= "Content-Type: image/png\n"+
                    "Content-Length: "+bt.length+"\n\n";//包含一个空行
        }else if("gif".equalsIgnoreCase(extension)){
            response_head= "Content-Type: image/gif\n"+
                    "Content-Length: "+bt.length+"\n\n";//包含一个空行
        }
        return response_line+response_head;
    }
    //404协议
    private String get404Protocol(byte[] bt) {
        String response_line = "HTTP/1.1 404 Not Found\n";
        String response_head = "Server: Apache-Coyote/1.1\n" +
                "Content-Type: text/html;charset=utf-8\n" +
                "Content-Language: en\n" +
                "Content-Length: "+bt.length+"\n" +
                "Date: Tue, 18 Jan 2022 14:04:53 GMT\r\n\r\n";//包含一个空行
        return response_line+response_head;
    }

    /**
     * 读文件
     */
    private byte[] readFile(File file) {
        //字节数组内存流，防止文件过大读取异常
        /*
         * 1、用于操作字节数组的流对象，其实它们就是对应设备为内存的流对象。
         * 2、该流的关闭是无效的，因为没有调用过系统资源。
         * 3、按照流的读写思想操作数组中元素。
         */
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        byte[] bt = new byte[10 * 1024];
        int length = 0;
        try (
                InputStream in = new FileInputStream(file)
        ) {
            while ((length = in.read(bt, 0, bt.length)) != -1) {
                //先读到内存流中做缓冲
                baos.write(bt, 0, length);
                baos.flush();
            }
        } catch (IOException e) {
            logger.error("服务器内部文件读取失败");
            //TODO 500错误
        }
        return baos.toByteArray();
    }
}

```



## 5. 运行效果

![image-20220119140416220](https://cdn.fengxianhub.top/resources-master/202201191404905.png)



![image-20220119140405371](https://cdn.fengxianhub.top/resources-master/202201191404819.png)

