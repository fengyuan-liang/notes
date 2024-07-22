# deploy-certificate-to-aliyun

随着各大CA机构开始收割用户，云厂商们提供的免费SSL证书也由之前的12个月变成现在的3个月。笔者一直使用阿里云的OSS作为图床，说实话在如果继续在阿里云上三个月免费一换也太频繁了

> 笔者在这里使用`github action`来每隔两个月自动申请免费的泛解析证书来部署阿里云CDN上
>
> 项目地址：https://github.com/fengyuan-liang/deploy-certificate-to-aliyun

## 如何使用

fork该项目，并填写对应参数即可

GitHub 仓库的 "Settings" -> "Secrets and variables" -> "Actions" 中添加以下 secrets：

- `ALIYUN_ACCESS_KEY_ID`：阿里云账户AK
- `ALIYUN_ACCESS_KEY_SECRET`：阿里云账户SK
- `DOMAIN`: 要设置域名的二级域名，例如要设置*.example.com，这里填写的就是example.com, 多个域名用英文逗号隔开
- `ALIYUN_CDN_DOMAIN`：设置阿里云cdn域名，一般是三级域名，例如cdn.example.com，需要跟上面的DOMAINS对应，否则会设置错误
- `EMAIL`: 证书过期时提醒的邮件

其中AK、SK在阿里云工作台获取

<img src="https://cdn.fengxianhub.top/resources-master/image-20240622225814459.png" alt="image-20240622225814459" style="zoom:50%;" />

这里的`DOMAIN`和`ALIYUN_CDN_DOMAIN`需要对应上，如果是一个泛解析证书用于多个CDN域名的话，可以简单修改下`upload_certs_to_aliyun.py`

```python
def main():
    access_key_id = get_env_var('ALIYUN_ACCESS_KEY_ID')
    access_key_secret = get_env_var('ALIYUN_ACCESS_KEY_SECRET')
    domains = get_env_var('DOMAINS').split(',')
    cdn_domains = get_env_var('ALIYUN_CDN_DOMAINS').split(',')

    client = AcsClient(access_key_id, access_key_secret, 'cn-hangzhou')

    # 假设第一个域名是泛域名证书
    primary_domain = domains[0]
    cert_path = f'~/certs/{primary_domain}/fullchain.pem'
    key_path = f'~/certs/{primary_domain}/privkey.pem'

    for cdn_domain in cdn_domains:
        upload_certificate(client, cdn_domain, cert_path, key_path)
```

