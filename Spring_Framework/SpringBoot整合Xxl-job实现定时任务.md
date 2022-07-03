# SpringBoot整合Xxl-job实现定时任务并监控

```java
                          ,--,                                        
                        ,--.'|                               ,---,    
                        |  | :       ,---,.  .--.   ,---.  ,---.'|    
 ,--,  ,--,  ,--,  ,--, :  : '     ,'  .' |.--,`|  '   ,'\ |   | :    
 |'. \/ .`|  |'. \/ .`| |  ' |   ,---.'   ,|  |.  /   /   |:   : :    
 '  \/  / ;  '  \/  / ; '  | |   |   |    |'--`_ .   ; ,. ::     |,-. 
  \  \.' /    \  \.' /  |  | :   :   :  .' ,--,'|'   | |: :|   : '  | 
   \  ;  ;     \  ;  ;  '  : |__ :   |.'   |  | ''   | .; :|   |  / : 
  / \  \  \   / \  \  \ |  | '.'|`---'     :  | ||   :    |'   : |: | 
./__;   ;  \./__;   ;  \;  :    ;        __|  : ' \   \  / |   | '/ : 
|   :/\  \ ;|   :/\  \ ;|  ,   /       .'__/\_: |  `----'  |   :    | 
`---'  `--` `---'  `--`  ---`-'        |   :    :          /    \  /  
                                        \   \  /           `-'----'   
                                         `--`-'                       
```

## 思维导图









<style>
    @font-face {
            font-family: 'Monaco';
            src: url('https://gitee.com/fengxian_duck/resources/raw/master/202109201607602.woff2') 		                                                                                                 format('woff2'),
            url('https://gitee.com/fengxian_duck/resources/raw/master/202109201608370.woff') format('woff');
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
        border-left: 8px solid #62ca38!important;
        background: #eef0f4;
        overflow: auto;
        word-break: break-word!important;
    }
</style>
<blockquote>
    <p>
        SpringBoot基于Spring4.0设计，不仅继承了Spring框架原有的优秀特性，而且还通过简化配置来进一步简化了Spring应用的整个搭建和开发过程。另外SpringBoot通过集成大量的框架使得依赖包的版本冲突，以及引用的不稳定性等问题得到了很好的解决。
    </p>
</blockquote>
