# FFmpeg基础学习

## 0x01 CPU vs GPU

我们使用cpu和gpu同时对转码进行耗时统计

>使用cpu

```shell
$ ffmpeg -i love-umbrella-adv.mp4 -c:v vp9 -c:a libvorbis  -threads 16 out.webm
```

耗时

>使用gpu

```shell
$ ffmpeg -hwaccel cuvid -c:v h264_cuvid -i love-umbrella-adv.mp4 -vf "scale_npp=1920:1080" -c:v vp9 -c:a libvorbis -threads 16 out.webm
ffmpeg -hwaccel cuvid -c:v h264_cuvid -i 0.mp4 -c:v h264_nvenc -y 00.mp4
$ ffmpeg -hwaccel cuvid -c:v h264_cuvid -i love-umbrella-adv.mp4  out.webm
```

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
