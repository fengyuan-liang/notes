SSID:	ASUS_5G
协议:	Wi-Fi 5 (802.11ac)
安全类型:	WPA2-个人
网络频带:	5 GHz
网络通道:	161
本地链接 IPv6 地址:	fe80::45d3:480b:d918:d7c8%19
IPv4 地址:	192.168.3.122
IPv4 DNS 服务器:	192.168.3.254
223.5.5.5
制造商:	Realtek Semiconductor Corp.
描述:	Realtek 8822CE Wireless LAN 802.11ac PCI-E NIC
驱动程序版本:	2024.0.9.230
物理地址(MAC):	40-23-43-32-7A-E1



## 服务器下发json帧

服务器下发json帧格式：

|   字段    |                  说明                  |
| :-------: | :------------------------------------: |
|    id     |          控制器设备的唯一编号          |
| post_type | 下发消息类型（ping control configure） |
|  content  |       由post_type决定发送的数据        |
| timestamp |                 时间戳                 |

各设备表示码编号：

|   设备   | 标识码 |
| :------: | :----: |
| 锁机自身 |  2001  |
|  led灯   |  2002  |
|  广告屏  |  2003  |
|  电子锁  |  2004  |
|   wifi   |  2005  |

post_type为configure：

|     配置名称      |     说明     |
| :---------------: | :----------: |
|   DeviceConfig    | 整个机器配置 |
| LockMachineConfig | 锁机参数配置 |
|  LockWiFiConfig   |   wifi配置   |

LockWiFiConfig：wifi配置字段

|      字段名      | 数据类型 |     说明     |
| :--------------: | :------: | :----------: |
|       ssid       |  String  |    wifi名    |
|     password     |  String  |     密码     |
|     protocol     |  String  | wifi协议标准 |
|  security_type   |  String  |   安全类型   |
|  frequency_band  |  String  |   网络频带   |
|     channel      |  String  |     信道     |
|    ipv6_addr     |  int[]   |   ipv6地址   |
|    ipv4_addr     |  int[]   |   ipv4地址   |
|     dns_addr     |  Object  |   dns地址    |
|       mac        |  int[]   |   mac地址    |
| ip_assigned_type |  String  | ip分配的形式 |

dns_addr:dns地址

|       字段名        | 数据类型 |     说明      |
| :-----------------: | :------: | :-----------: |
|     ip_version      |   int    |    ip协议     |
| ipv6_addr/ipv4_addr |  int[]   | ipv4/ipv6地址 |

LockMachineConfig

|          字段名          | 数据类型 |                    说明                     |
| :----------------------: | :------: | :-----------------------------------------: |
|         cpu_freq         |  Number  |               CPU频率 单位：M               |
|        deep_sleep        |  Number  |              休眠时间 单位：秒              |
|    reporting_duration    |  Number  |            上报间隔，单位：毫秒             |
|       wifi_config        |  Object  |                下发WiFi配置                 |
|        timeStamp         |  String  |     ntp服务器地址，用以进行自动时间矫正     |
|     auto_update_time     | boolean  | 是否自动更新时间，自动从给定ntp服务器中拿取 |
|   ntp_server_hostname    |  String  |     ntp服务器地址，用以进行自动时间矫正     |
| umbrella_server_hostname |  String  |                 服务器地址                  |

control操作：

|        操作名称         |              操作属性              |            取值类型            |
| :---------------------: | :--------------------------------: | :----------------------------: |
|      AdsOperation       |               power                |            Boolean             |
|   DeepSleepOperation    |           is_deep_sleep            |            Boolean             |
|      LEDOperation       |   power<br />brightness<br />rgb   | Boolean<br />int32<br />Object |
|      LockOperation      | lock_switch<br />auto_lock_timeout |       Boolean<br />int32       |
|    RestartOperation     |            is_operation            |            Boolean             |
| RestoreFactoryOperation |         is_restore_factory         |            Boolean             |



服务器下发配置帧实例（不发送无效字段）：

```json
{
	"content": {
		"configs": [{
			"auto_update_time": {
				"value": true
			},
			"cpu_freq": {
				"value": 34
			},
			"wifi_config": {
				"frequency_band": "2.4GHz",
				"channel": 161,
				"ssid": "HNIT_Teacher",
				"mac": [192, 168, 1, 1],
				"dns_addr": {
					"ip_version": 4,
					"addr": [192, 198, 90, 190]
				},
				"ip_assigned_type": "static",
				"password": "xxxxxxxx",
				"protocol": "802.11ac",
				"ipv4_addr": [192, 168, 1, 1],
				"security_type": "WPA2-个人"
			},
			"umbrella_server_hostname": {
				"value": "www.volunteer.com"
			},
			"ntp_server_hostname": {
				"value": "xxxx"
			}
		}, {
			"deep_sleep": {
				"value": 10
			}
		}]
	},
	"post_type": "config",
	"id": 357862,
	"timestamp": "1649082479692"
}
```

服务器下发控制帧实例：

```json
{
	"content": {
		"target": {
			"device_name": "led灯",
			"device_code": 2002
		},
		"operation": {
			"rgb": {
				"green": "90",
				"red": "54",
				"blue": "98"
			},
			"brightness": 45,
			"power": true
		}
	},
	"post_type": "control",
	"id": 79696,
	"timestamp": "1649085029710"
}
```

```json
{
	"content": {
		"target": {
			"device_name": "锁机自身",
			"device_code": 2001
		},
		"operation": {
			"ping": true
		}
	},
	"post_type": "test",
	"id": 2002,
	"timestamp": "1649084564261"
}
```

















