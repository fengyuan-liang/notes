# Golang DDNS阿里云脚本

我们使用公网ipv4或者ipv6的时候，可能需要动态刷新域名的记录值，这时候就需要在阿里云的api手册里面需要答案了

- https://next.api.aliyun.com/api/Alidns/2015-01-09/UpdateDomainRecord

![image-20230212214433638](https://cdn.fengxianhub.top/resources-master/202302122144105.png)

可以看到有四个字段是必须要写的，这里分享一下笔者的脚本

这里面的`recordId`可以在控制台获取到

![image-20230212214915187](https://cdn.fengxianhub.top/resources-master/202302122149401.png)

```go
package main

import (
	"fmt"
	alidns20150109 "github.com/alibabacloud-go/alidns-20150109/v2/client"
	openapi "github.com/alibabacloud-go/darabonba-openapi/client"
	"github.com/alibabacloud-go/tea/tea"
	"net"
	"os"
	"regexp"
	"strings"
	"time"
)

var (
	ak            = "your ak"
	sk            = "your sk"
	recordId      = "your recordId"
	DomainURL     = "" // 你的域名 xxx.xxx
	rr            = "" // 你的域名的子域名
	Type          = "" // ipv6为 `AAAA`
	aliDnsServer  = "alidns.cn-hangzhou.aliyuncs.com"
	dateFormatter = "2006-01-02 15:04:05.000 Mon Jan"
)

func main() {
	err := refreshDDNS(tea.StringSlice(os.Args[1:]))
	if err != nil {
		panic(err)
	}
}

// CreateClient 创建发起请求的client
func CreateClient(accessKeyId *string, accessKeySecret *string) (_result *alidns20150109.Client, _err error) {
	config := &openapi.Config{
		// 您的AccessKey ID
		AccessKeyId: accessKeyId,
		// 您的AccessKey Secret
		AccessKeySecret: accessKeySecret,
	}
	// 访问的域名
	config.Endpoint = tea.String(aliDnsServer)
	_result = &alidns20150109.Client{}
	_result, _err = alidns20150109.NewClient(config)
	return _result, _err
}

// 封装获取对应解析记录的方法
func getRecordIp(client *alidns20150109.Client, recordId *string) *string {
	describeDomainRecordsRequest := &alidns20150109.DescribeDomainRecordsRequest{
		DomainName: tea.String(DomainURL),
	}
	// 复制代码运行请自行打印 API 的返回值
	result, _err := client.DescribeDomainRecords(describeDomainRecordsRequest)
	if _err != nil {
		return nil
	}
	records := result.Body.DomainRecords.Record
	var recordIp *string
	for _, record := range records {
		if *record.RecordId == *recordId {
			recordIp = record.Value
			fmt.Printf("%s | now record value of domain is %s\n", *NowTime(), *record.Value)
		}
	}
	return recordIp
}

func NowTime() *string {
	format := time.Now().Format(dateFormatter)
	format = "【" + format + "】"
	return &format
}

// 执行比对当前ip和dns值，并更新操作
func refreshDDNS(args []*string) (_err error) {
	// 获取地址
	client, _err := CreateClient(tea.String(ak), tea.String(sk))
	if _err != nil {
		return _err
	}
	recordIp := getRecordIp(client, &recordId)
	if recordIp == nil {
		fmt.Printf("%s | 获取Ip解析记录失败\n", *NowTime())
		return _err
	}
	// 获取本机ipv6地址
	realIp := getMyIPV6()
	if *realIp == "" {
		return _err
	}
	if *recordIp == *realIp {
		fmt.Printf("%s | real ip %s equals dns record\n", *NowTime(), *realIp)
	} else {
		updateDomainRecordRequest := &alidns20150109.UpdateDomainRecordRequest{
			RecordId: tea.String(recordId),
			RR:       tea.String(rr),
			Type:     tea.String(Type),
			Value:    realIp,
		}
		// 复制代码运行请自行打印 API 的返回值
		_, _err := client.UpdateDomainRecord(updateDomainRecordRequest)
		if _err != nil {
			return _err
		} else {
			recordIp = getRecordIp(client, &recordId)
			fmt.Printf("%s | update dns record success, now record ip is %s\n", *NowTime(), *recordIp)
		}
	}
	return _err
}

// getMyIPV6
//
//	@Description: 获取本地ipv6地址，通过读取网卡信息的方式，我这里读取的是`/64`的，也可以默认读取第一个就行
//	@return *string
func getMyIPV6() *string {
	s, err := net.InterfaceAddrs()
	emptyStr := ""
	if err != nil {
		return &emptyStr
	}
	for _, a := range s {
		i := regexp.MustCompile(`(\w+:){7}\w+/64`).FindString(a.String())
		if strings.Count(i, ":") == 7 {
			// 截取 `/64前面的一段`
			split := strings.Split(i, "/")
			s2 := split[0]
			return &s2
		}
	}
	return &emptyStr
}

//func GetIpHost() *string {
//	resp, err := http.Get("https://link.juejin.cn/?target=https%3A%2F%2Fwww.taobao.com%2Fhelp%2Fgetip.php")
//	if err != nil {
//		println("ip地址查询异常，info：", err)
//	}
//	body, err := ioutil.ReadAll(resp.Body)
//	if err != nil {
//		fmt.Println("ip地址查询异常，info：", err)
//	}
//	result := IpResp{}
//	err = json.Unmarshal(body, &result)
//	marshal, _ := json.Marshal(result)
//	fmt.Printf("%s|====>>>>ip query result is %s\n", *NowTime(), marshal)
//	if err != nil {
//		fmt.Printf("%s|ip query result is %s\n", *NowTime(), string(body))
//		return nil
//	} else {
//		fmt.Printf("%s|ip query result is %s\n", *NowTime(), *result.Ip)
//	}
//	return result.Ip
//}

```

# P2P脚本（端口扫描版）

