# ACM申请证书

>https://www.cnblogs.com/liulog/p/19584194



```shell
# 申请泛解析证书 需要先环境配置ak sk
acme.sh --issue --dns dns_tencent -d  '*.yyjlb666.cn'

acme.sh --issue --dns dns_ali -d '*.yyjlb6.cn'
```





证书安装到指定目录

```shell
acme.sh --install-cert -d '*.yyjlb666.cn' \
    --fullchain-file /home/lfy/workspace/nginx/cert/yyjlb666.cn/fullchain.pem \
    --key-file /home/lfy/workspace/nginx/cert/yyjlb666.cn/privkey.pem \
    --reloadcmd "docker exec -it nginx nginx -s reload"
    
    
    
    acme.sh --install-cert -d '*.yyjlb6.cn' \
    --fullchain-file /home/lfy/workspace/nginx/cert/yyjlb6.cn/fullchain.pem \
    --key-file /home/lfy/workspace/nginx/cert/yyjlb6.cn/privkey.pem \
    --reloadcmd "docker exec -it nginx nginx -s reload"
```

