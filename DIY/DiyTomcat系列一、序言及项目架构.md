# DiyTomcat系列一、序言及项目架构

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
        这篇文章记录笔者怎么实现一个diy的<code>Tomcat</code>,以此来加深对<code>网络协议</code>、<code>Sevlet</code>等等知识的理解
    </p>
</blockquote>

![image-20211227164819753](https://cdn.fengxianhub.top/resources-master/202112271648980.png)

## 1. hello Tomcat

首先通过一个简单的socket连接来简单理解Tomcat服务器是怎么接收http请求并响应的，从中我们可以更加理解http协议。

```java
public class Bootstrap {
    public static void main(String[] args) {
        try {
            int port = 18080;
            //Hutool帮助类，用来判断端口号有没有被占用
            if(!NetUtil.isUsableLocalPort(port)) {
                System.out.println(port +" 端口已经被占用了");
                return;
            }
            ServerSocket ss = new ServerSocket(port);
            while(true) {
                Socket s =  ss.accept();
                InputStream is= s.getInputStream();
                int bufferSize = 1024;
                byte[] buffer = new byte[bufferSize];
                is.read(buffer);
                String requestString = new String(buffer,"utf-8");
                System.out.println("浏览器的输入信息： \r\n" + requestString);
                OutputStream os = s.getOutputStream();
                /*
                 * 根据http协议规范，响应的文本格式为：
                 * 1. 响应行
                 *      1.1 响应的协议或版本号  例如：HTTP/1.1
                 *      1.2 响应的状态码  例如：200
                 *      1.3 响应状态描述符  例如：OK
                 * 2. 响应头
                 *      2.1 组成：key:value(不同的响应头，有其不同的含义)
                 *      2.2 例如：Date（生成响应的日期）、Content-Type（MIME类型及编码格式）、Connection（默认是长连接）
                 * 3. 空行
                 * 4. 响应体：这里就是回传给客户端的数据
                 */
                String response_line = "HTTP/1.1 200 OK\r\n";
                String response_head = "Content-Type: text/html\r\n\r\n";//包含一个空行
                String response_Body = "Hello DIY Tomcat from fengxian";//响应体为纯文本
                String responseString = response_line+response_head+response_Body;
                os.write(responseString.getBytes());
                //刷新缓冲区，将所有缓冲区里的数据写出
                os.flush();
                //关闭资源，不规范写法，读者可以自行使用 try-with-resource 写法
                is.close();
                os.close();
                s.close();
            }
        } catch (IOException e) {
            e.printStackTrace();
        }

    }
}
```



### 1.1 http协议

上述代码输出http请求的字段为：

```css
浏览器的输入信息： 
GET / HTTP/1.1
Host: localhost:18080
Connection: keep-alive
sec-ch-ua: "Microsoft Edge";v="111", "Not(A:Brand";v="8", "Chromium";v="111"
sec-ch-ua-mobile: ?0
sec-ch-ua-platform: "macOS"
Upgrade-Insecure-Requests: 1
User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/111.0.0.0 Safari/537.36 Edg/111.0.1661.44
Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7
Sec-Fetch-Site: none
Sec-Fetch-Mode: navigate
Sec-Fetch-User: ?1
Sec-Fetch-Dest: document
Accept-Encoding: gzip, deflate, br
Accept-Language: zh-CN,zh;q=0.9,en;q=0.8,en-GB;q=0.7,en-US;q=0.6
Cookie: _ga=GA1.1.170786272.1675310316

```

浏览器页面为：

![image-20230322160648390](https://cdn.fengxianhub.top/resources-master/image-20230322160648390.png)

首先我们要知道http请求分为<code>GET请求</code>和<code>POST请求</code>，这里笔者发的是一个GET请求

从上面的数据中可以看到http请求包含这几个字段：

- 请求行(Request line)
  - 请求的方式：GET
  
  - 请求的资源路径，格式为[url?key1=value1&key2=value2]，如果是/表示请求服务器默认的欢迎页面
  
    ![image-20220118010215413](https://cdn.fengxianhub.top/resources-master/202201180102516.png)
  
  - 请求的协议的版本号：HTTP/1.1
  
- 请求头(Request header)
  - 由key=value组成，不同的键值对表示不同的含义。例如Content-Type:  application/json表示发送的数据类型为json格式
  
- 空行

- 请求体(Request body)

```css
根据http协议规范，格式为：
1. 响应行
     1.1 响应的协议或版本号  例如：HTTP/1.1
     1.2 响应的状态码  例如：200
     1.3 响应状态描述符  例如：OK
2. 响应头
     2.1 组成：key:value(不同的响应头，有其不同的含义)
     2.2 例如：Date（生成响应的日期）、Content-Type（MIME类型及编码格式）、Connection（默认是长连接）
3. 空行
4. 响应体：这里就是回传给客户端的数据
```

>常用请求方式

![image-20220117155144455](https://cdn.fengxianhub.top/resources-master/202201171551783.png)

#### 1.1.1 GET

>GET请求特点

- GET 请求可被缓存
- GET 请求保留在浏览器历史记录中
- GET 请求可被收藏为书签
- GET 请求不应在处理敏感数据时使用
- GET 请求有长度限制（受浏览器限制，每个浏览器不同）
- GET 请求只应当用于取回数据

get请求实例：

```css
GET /comment/hot?type=0&id=415792881 HTTP/1.1
Host: autumnfish.cn
Connection: keep-alive
Pragma: no-cache
Cache-Control: no-cache
sec-ch-ua: " Not;A Brand";v="99", "Google Chrome";v="97", "Chromium";v="97"
Accept: application/json, text/plain, */*
sec-ch-ua-mobile: ?0
User-Agent: Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/97.0.4692.71 Safari/537.36
sec-ch-ua-platform: "Windows"
Origin: http://121.37.190.126
Sec-Fetch-Site: cross-site
Sec-Fetch-Mode: cors
Sec-Fetch-Dest: empty
Referer: http://121.37.190.126/
Accept-Encoding: gzip, deflate, br
Accept-Language: zh-CN,zh;q=0.9
```



#### 1.1.2 POST

>POST请求特点

- POST 请求不会被缓存
- POST 请求不会保留在浏览器历史记录中
- POST 不能被收藏为书签
- POST 请求对数据长度没有要求

普通POST请求：

```css
POST /foods/Resuser.action HTTP/1.1
Host: 47.93.18.166:8080
User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:94.0) Gecko/20100101 Firefox/94.0
Accept: application/json, text/plain, */*
Accept-Language: zh-CN,zh;q=0.8,zh-TW;q=0.7,zh-HK;q=0.5,en-US;q=0.3,en;q=0.2
Accept-Encoding: gzip, deflate
Content-Type: application/x-www-form-urlencoded;charset=utf-8
Content-Length: 31
Origin: http://47.93.18.166:8080
Connection: keep-alive
Referer: http://47.93.18.166:8080/foods/index_origin.html
Cookie: JSESSIONID=21859CC87FC24F1506E65BC24E788BD3

op=login&username=a&pwd=a&yzm=WADU
```



上传文件POST请求数据实例：

```css
POST /upLoad.do HTTP/1.1
Host: localhost:18080
User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:94.0) Gecko/20100101 Firefox/94.0
Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8
Accept-Language: zh-CN,zh;q=0.8,zh-TW;q=0.7,zh-HK;q=0.5,en-US;q=0.3,en;q=0.2
Accept-Encoding: gzip, deflate
Content-Type: multipart/form-data; boundary=---------------------------303304131117358352651062939366
Content-Length: 7582
Origin: http://localhost:18080
Connection: keep-alive
Referer: http://localhost:18080/yc_orderSystem/upLoad.html
Cookie: Idea-48389f3b=3e71c9e3-24d3-4924-a229-18f00dfb1f72
Upgrade-Insecure-Requests: 1
Sec-Fetch-Dest: document
Sec-Fetch-Mode: navigate
Sec-Fetch-Site: same-origin
Sec-Fetch-User: ?1

-----------------------------303304131117358352651062939366
Content-Disposition: form-data; name="head"; filename="head.jpg"
Content-Type: image/jpeg

ÿØÿàxxxxxxxxxx9 1-----------------------------3033041311173583526510629393662Content-Disposition: form-data; name="head"; filename="head.jpg"3Content-Type: image/jpeg45ÿØÿà-----------------------------3033041311173583526510629393666Content-Disposition: form-data; name="head"; filename="head.jpg"7Content-Type: image/jpeg89ÿØÿà-----------------------------303304131117358352651062939366
Content-Disposition: form-data; name="userName"
zhangsan
-----------------------------303304131117358352651062939366--
```

注意这个<code>Content-Type</code>:**multipart/form-data; boundary=---------------------------303304131117358352651062939366**

boundary是分割线的意思，注意分割线会比content-type中的多两个“-”



#### 1.1.3 HEAD

head请求与 GET 相同，但只返回 HTTP 报头，不返回文档主体，常用来做文件下载前获取文件信息

```java
String url="https://pm.myapp.com/invc/xfspeed/qqpcmgr/download/QQPCDownload1530.exe";
URL u = new URL(url);
try {
    HttpURLConnection conn = (HttpURLConnection) u.openConnection();
    //设置请求的方法：HEAD
    conn.setRequestMethod("HEAD");
    conn.setConnectTimeout(3000);//设置超时时间
    int fileSize = conn.getContentLength();
    //得到文件名，即年月日时分秒
    SimpleDateFormat sdf = new SimpleDateFormat("yyyyMMddHHmmss");
    //获得后缀名
    String suffix = url.substring(url.lastIndexOf("."));
    String fileName=sdf.format(System.currentTimeMillis())+suffix;
    //得到用户的home目录
    String userHome=System.getProperty("user.home");
    System.out.println(userHome);
    File file = new File(userHome, fileName);
    //文件不存在会默认创建
    //文件创建时需要指定大小，不然文件大小会慢慢变大，且如果下载中断后不能在断点处恢复，不友好
    RandomAccessFile randomAccessFile = new RandomAccessFile(file,"rw");
    //创建指定大小的文件
    randomAccessFile.setLength(fileSize);
    randomAccessFile.close();
    System.out.println("文件创建"+file.getName());
} catch (Exception e) {
    e.printStackTrace();
}
```



### 1.2 小结

**其实对http请求做出响应，可以简单理解为Java程序通过流的形式读取本地文件并向客户端发送相应的资源，遵守http协议规范即可**

😊😊😊😊😊😊😊😊😊😊😊😊😊😊😊😊😊😊😊分割线😊😊😊😊😊😊😊😊😊😊😊😊😊😊😊😊😊😊😊😊😊😊

## 2. 项目总架构

当然<code>故不积跬步，无以至千里；不积小流，无以成江海。</code>，这些需求点要一步一步的来，逐渐的完善，如果要真正实现一个商业版本的<code>Tomcat</code>那还是需要持续不断的学习滴

![image-20211227174438918](https://cdn.fengxianhub.top/resources-master/202112271744157.png)



下一篇：<a href="https://blog.csdn.net/fengxiandada/article/details/122579693?spm=1001.2014.3001.5502">diyTomcat系列二、实现一个简单的静态资源访问器</a>





















