# FFmpeg基础学习

## 0x01 CPU vs GPU

我们使用cpu和gpu同时对转码进行耗时统计

>使用cpu

```shell
$ ffmpeg -i love-umbrella-adv.mp4 -c:v vp9 -c:a libvorbis  -threads 16 out.webm
```

耗时

>使用gpu 失败了 没有vp9_nvenc

```shell
$ ffmpeg -hwaccel cuvid -c:v h264_cuvid -i love-umbrella-adv.mp4 -vf "scale_npp=1920:1080" -c:v vp9 -c:a libvorbis -threads 16 out.webm
$ ffmpeg -hwaccel cuvid -c:v h264_cuvid -i 0.mp4 -c:v h264_nvenc -y 00.mp4
$ ffmpeg -hwaccel cuvid -c:v h264_cuvid -i love-umbrella-adv.mp4  out.webm

$ ffmpeg -hwaccel cuvid -c:v h264_cuvid -i love-umbrella-adv.mp4 -c:v vp9_nvenc -c:a libopus output.webm
$ ffmpeg -hwaccel cuvid -c:v h264_cuvid -i love-umbrella-adv.mp4 -c:v h264_nvenc -y 00.mp4
$ ffmpeg -i input.mp4 -c:v h264_nvenc -c:a copy output.webm

ffmpeg -i love-umbrella-adv.mp4 -c:v av1_nvenc -rc:v vbr -cq:v 20 -b:v 0 -c:a copy output.webm
ffmpeg -i love-umbrella-adv.mp4 -c:v h264_nvenc -b:v 2M -c:a copy output.webm

ffmpeg -i love-umbrella-adv.mp4 -c:v h264_nvenc -cq:v 18 -b:v 2M -c:a copy output.mp4

# 查看比特率
ffprobe -v error -select_streams v:0 -show_entries stream=bit_rate -of default=noprint_wrappers=1:nokey=1 love-umbrella-adv.mp4
```

耗时



## 0x02 常用命令

``` shell
$ ffprobe -i [文件名] 查看文件详细信息
```

## 一、概念

介绍 FFmpeg 用法之前，需要了解一些视频处理的基本概念。

### 1.1 容器

视频文件本身其实是一个容器（container），里面包括了视频和音频，也可能有字幕等其他内容。

常见的容器格式有以下几种。一般来说，视频文件的后缀名反映了它的容器格式。

> - MP4
> - MKV
> - WebM
> - AVI

下面的命令查看 FFmpeg 支持的容器。

> ```bash
> $ ffmpeg -formats
> ```

### 1.2 编码格式

视频和音频都需要经过编码，才能保存成文件。不同的编码格式（CODEC），有不同的压缩率，会导致文件大小和清晰度的差异。

常用的视频编码格式如下。

> - H.262
> - H.264
> - H.265

上面的编码格式都是有版权的，但是可以免费使用。此外，还有几种无版权的视频编码格式。

> - VP8
> - VP9
> - AV1

常用的音频编码格式如下。

> - MP3
> - AAC

上面所有这些都是有损的编码格式，编码后会损失一些细节，以换取压缩后较小的文件体积。无损的编码格式压缩出来的文件体积较大，这里就不介绍了。

下面的命令可以查看 FFmpeg 支持的编码格式，视频编码和音频编码都在内。

> ```bash
> $ ffmpeg -codecs
> ```

### 1.3 编码器

编码器（encoders）是实现某种编码格式的库文件。只有安装了某种格式的编码器，才能实现该格式视频/音频的编码和解码。

以下是一些 FFmpeg 内置的视频编码器。

> - libx264：最流行的开源 H.264 编码器
> - NVENC：基于 NVIDIA GPU 的 H.264 编码器
> - libx265：开源的 HEVC 编码器
> - libvpx：谷歌的 VP8 和 VP9 编码器
> - libaom：AV1 编码器

音频编码器如下。

> - libfdk-aac
> - aac

下面的命令可以查看 FFmpeg 已安装的编码器。

> ```bash
> $ ffmpeg -encoders
> ```

## 二、图片格式

### 2.1 常见图片格式分析

常见的图片格式有：**jpg、png、gif、psd、tif、bmp等格式**

当然现在也出现了一些新的流行的格式，例如：WebP（2010年发布）、avif（2019年发布）

其中webp是现在支持性最好且压缩率最高的图片格式，常见对比如下：

- https://www.upyun.com/webp
- https://isparta.github.io/compare-webp/#124533

对比如下：

- webp对比gif格式能节省大约`88%`以上的空间
- 相比png可以减少`98%`以上的空间
- 相比jpg可以减少`35%`的空间
- 平均减少 70%

如果相对webp格式更加了解的可以看下面的文章

- https://zh.wikipedia.org/wiki/WebP
- https://tech.upyun.com/article/252/1.html
- https://tech.upyun.com/article/253/1.html

![image-20231123143029997](https://cdn.fengxianhub.top/resources-master/image-20231123143029997.png)

### 2.2 下一代图片格式

2022 年已到，次世代图片格式战争的局势已经渐渐明朗，[JPEG XL](https://jpeg.org/jpegxl/)、[AVIF](https://aomediacodec.github.io/av1-avif/) 是下一代图片格式的最终选手，唯一的变量是尚在实验阶段的 WebP 的下一代格式 WebP 2。之后很长一段时间应该不会有新的参赛选手了。

## 三、视频格式

常见的视频格式有：AVI、MOV、WMV、MPEG格式**（文件后缀可以是 .MPG .MPEG .MPE .DAT .VOB .ASF .3GP .MP4等）**、WebP

## 四、FFmpeg简单使用

首先我们要知道`FFmpeg`是一系列音视频编解码软件的合集，主要有三部分组成

- ffmpeg：用来对音视频进行编解码
- ffprobe：用来分析音视频
- ffmplay：可以用来播放视频流、音频流，还可以查看音频的贝叶斯曲线

### 4.1 命令行格式

ffmpeg的命令行参数非常多，大体上可以分为五个部分

```shell
$ ffmpeg {1} {2} -i {3} {4} {5}
```

五个部分分别为：

1. 全局参数
2. 输入文件参数
3. 输入文件
4. 输出文件参数
5. 输出文件

参数太多时，我们经常将每个部分分开写

```shell
$ ffmpeg \
[全局参数] \
[输入文件参数] \
-i [输入文件] \
[输出文件参数] \
[输出文件]
```

例如：

```shell
$ ffmpeg \
-y \ # 全局参数
-c:a libfdk_aac -c:v libx264 \ # 输入文件参数
-i input.mp4 \ # 输入文件
-c:v libvpx-vp9 -c:a libvorbis \ # 输出文件参数
output.webm # 输出文件
```

上面的命令将 `mp4` 文件转成 `webm` 文件，这两个都是容器格式。输入的 mp4 文件的音频编码格式是 aac，视频编码格式是 H.264；输出的 webm 文件的视频编码格式是 VP9，音频格式是 Vorbis。

如果不指明编码格式，FFmpeg 会自己判断输入文件的编码。因此，上面的命令可以简单写成下面的样子。

```shell
$ ffmpeg -i input.avi output.mp4
```

### 4.2 常见的命令行参数

- `-c`：指定编码器
- `-c copy`：直接复制，不经过重新编码（这样比较快）
- `-c:v`：指定视频编码器
- `-c:a`：指定音频编码器
- `-i`：指定输入文件
- `-an`：去除音频流
- `-vn`： 去除视频流
- `-preset`：指定输出的视频质量，会影响文件的生成速度，有以下几个可用的值 ultrafast, superfast, veryfast, faster, fast, medium, slow, slower, veryslow。
- `-y`：不经过确认，输出时直接覆盖同名文件。

#### 4.2.1 过滤器

我们在在处理一张图片或者音视频的时候常常有裁剪、缩放等需求，`-filter:v`是FFmpeg中用于视频过滤器（Video Filter）的命令行选项

在FFmpeg中，过滤器允许你对音频或视频进行各种修改和处理操作。`-filter:v`用于指定应用于视频流的过滤器。通过使用视频过滤器，你可以对视频进行裁剪、缩放、旋转、滤镜效果等各种处理。

语法上，`-filter:v`后面需要跟着具体的过滤器表达式。过滤器表达式由一个或多个过滤器及其参数组成，多个过滤器之间使用逗号分隔。

以下是一个示例命令，演示如何使用`-filter:v`来应用视频过滤器：

```shell
$ ffmpeg -i input.mp4 -filter:v "crop=400:300:0:0, rotate=90" output.mp4
// -filter:v 可以简写为 -vf
$ ffmpeg -i input.mp4 -vf "crop=400:300:0:0, rotate=90" output.mp4
```

在上述命令中，`-filter:v`后面的过滤器表达式为`"crop=400:300:0:0, rotate=90"`。这个表达式同时应用了两个过滤器：`crop`和`rotate`。

- `crop=400:300:0:0`表示对视频进行裁剪操作，裁剪出宽度为400像素、高度为300像素的区域，起始坐标为(0, 0)。
- `rotate=90`表示对视频进行旋转操作，将视频逆时针旋转90度。

这样，上述命令将对输入视频进行裁剪和旋转处理，并将处理后的视频保存为`output.mp4`。

当然过滤器的作用远不止于此，在ffmpeg中过滤器能实现的功能有：

- 裁剪(crop)、缩放(scale)、旋转(rotate)、滤镜(overlay)、截取视频的片段（trim）

我们可以查看ffmpeg中支持的过滤器数量非常多，可以查看官方文档进行详细了解：https://ffmpeg.org/ffmpeg-filters.html

```shell
$ ➜  ~ ffmpeg -filters -hide_banner | wc -l
     492
```

在第五节对过滤器进行详细描述

### 4.3 常见用法

#### 4.3.1 查看文件信息

我们可以使用`ffmpeg`或者`ffprobe`来分析视频的源信息，比如视频分辨率、编码格式和比特率等等

```shell
$  ffprobe final.mp4
ffprobe version 6.0 Copyright (c) 2007-2023 the FFmpeg developers
  built with Apple clang version 14.0.3 (clang-1403.0.22.14.1)
  configuration: --prefix=/usr/local/Cellar/ffmpeg/6.0_1 --enable-shared --enable-pthreads --enable-version3 --cc=clang --host-cflags= --host-ldflags= --enable-ffplay --enable-gnutls --enable-gpl --enable-libaom --enable-libaribb24 --enable-libbluray --enable-libdav1d --enable-libjxl --enable-libmp3lame --enable-libopus --enable-librav1e --enable-librist --enable-librubberband --enable-libsnappy --enable-libsrt --enable-libsvtav1 --enable-libtesseract --enable-libtheora --enable-libvidstab --enable-libvmaf --enable-libvorbis --enable-libvpx --enable-libwebp --enable-libx264 --enable-libx265 --enable-libxml2 --enable-libxvid --enable-lzma --enable-libfontconfig --enable-libfreetype --enable-frei0r --enable-libass --enable-libopencore-amrnb --enable-libopencore-amrwb --enable-libopenjpeg --enable-libspeex --enable-libsoxr --enable-libzmq --enable-libzimg --disable-libjack --disable-indev=jack --enable-videotoolbox --enable-audiotoolbox
  libavutil      58.  2.100 / 58.  2.100
  libavcodec     60.  3.100 / 60.  3.100
  libavformat    60.  3.100 / 60.  3.100
  libavdevice    60.  1.100 / 60.  1.100
  libavfilter     9.  3.100 /  9.  3.100
  libswscale      7.  1.100 /  7.  1.100
  libswresample   4. 10.100 /  4. 10.100
  libpostproc    57.  1.100 / 57.  1.100
Input #0, mov,mp4,m4a,3gp,3g2,mj2, from 'final.mp4':
  Metadata:
    major_brand     : isom
    minor_version   : 512
    compatible_brands: isomiso2avc1mp41
    encoder         : Lavf60.3.100
  Duration: 00:00:26.16, start: 0.000000, bitrate: 1375 kb/s
  Stream #0:0[0x1](und): Video: h264 (High) (avc1 / 0x31637661), yuv420p(progressive), 1080x1920 [SAR 1:1 DAR 9:16], 1300 kb/s, 25 fps, 25 tbr, 12800 tbn (default)
    Metadata:
      handler_name    : VideoHandler
      vendor_id       : [0][0][0][0]
      encoder         : Lavc60.3.100 libx264
  Stream #0:1[0x2](und): Audio: aac (LC) (mp4a / 0x6134706D), 48000 Hz, mono, fltp, 70 kb/s (default)
    Metadata:
      handler_name    : SoundHandler
      vendor_id       : [0][0][0][0]
```

输出了很多无用的信息，我们可以使用`-hide_banner`参数，可以只显示元信息

```shell
$ ffprobe final.mp4 -hide_banner
Input #0, mov,mp4,m4a,3gp,3g2,mj2, from 'final.mp4':
  Metadata:
    major_brand     : isom
    minor_version   : 512
    compatible_brands: isomiso2avc1mp41
    encoder         : Lavf60.3.100
  Duration: 00:00:26.16, start: 0.000000, bitrate: 1375 kb/s
  Stream #0:0[0x1](und): Video: h264 (High) (avc1 / 0x31637661), yuv420p(progressive), 1080x1920 [SAR 1:1 DAR 9:16], 1300 kb/s, 25 fps, 25 tbr, 12800 tbn (default)
    Metadata:
      handler_name    : VideoHandler
      vendor_id       : [0][0][0][0]
      encoder         : Lavc60.3.100 libx264
  Stream #0:1[0x2](und): Audio: aac (LC) (mp4a / 0x6134706D), 48000 Hz, mono, fltp, 70 kb/s (default)
    Metadata:
      handler_name    : SoundHandler
      vendor_id       : [0][0][0][0]
```

对上述信息解释如下：

- **Stream #0:00x1**: 这是第一个流，标识为 `#0:0`，使用标签 `[0x1]`，并且没有指定语言（`und`）。
- **Video: h264 (High) (avc1 / 0x31637661)**: 表示这是一个 H.264 编码的视频流，使用的是 High Profile，编码格式标识为 `avc1 / 0x31637661`。
- **yuv420p(progressive)**: 视频的色彩空间为 YUV420P（即每四个 Y 值对应一个 UV 值），并且视频是逐行扫描的，即逐行显示所有的帧。
- **1080x1920 [SAR 1:1 DAR 9:16]**: 视频的分辨率为 1080x1920，表示宽度为 1080 像素，高度为 1920 像素。`SAR` 表示样本宽高比（Sample Aspect Ratio），这里的 `1:1` 表示每个像素的宽度和高度是相等的。`DAR` 表示显示宽高比（Display Aspect Ratio），这里的 `9:16` 表示视频的宽高比为 9:16。
- **1300 kb/s**: 视频的比特率为 1300 kb/s，表示每秒传输的数据量为 1300 千比特（kb）。
- **25 fps**: 视频的帧率为 25 帧每秒（fps），表示每秒播放 25 帧的画面。
- **25 tbr**: 视频的基本时间单位是帧（tbr，Time Base Rate），每秒有 25 帧。
- **12800 tbn**: 视频的时间基准（tbn，Time Base Number）为 12800，表示每个时间单位对应 1/12800 秒。
- **(default)**: 表示该流被标记为默认流，可能是因为它是媒体中的默认选择。

#### 4.3.2 转换编码格式

转换编码格式（transcoding）指的是， 将视频文件从一种编码转成另一种编码。比如转成 H.264 编码，一般使用编码器`libx264`，所以只需指定输出文件的视频编码器即可。

> ```bash
> $ ffmpeg -i [input.file] -c:v libx264 output.mp4
> ```

下面是转成 H.265 编码的写法。

> ```bash
> $ ffmpeg -i [input.file] -c:v libx265 output.mp4
> ```

#### 4.3.3 转换容器格式

转换容器格式（transmuxing）指的是，将视频文件从一种容器转到另一种容器。下面是 mp4 转 webm 的写法。

> ```bash
> $ ffmpeg -i input.mp4 -c copy output.webm
> ```

上面例子中，只是转一下容器，内部的编码格式不变，所以使用`-c copy`指定直接拷贝，不经过转码，这样比较快。

当然还可以重新编码再转换容器格式，这个时候我们就需要指定编解码器

>```shell
>$ ffmpeg \
>-y \ # 全局参数
>-c:a libfdk_aac -c:v libx264 \ # 输入文件参数
>-i input.mp4 \ # 输入文件
>-c:v libvpx-vp9 -c:a libvorbis \ # 输出文件参数
>output.webm # 输出文件
>```

## 五、ffmpeg之过滤器

>官方文档：https://ffmpeg.org/ffmpeg-filters.html#Description





