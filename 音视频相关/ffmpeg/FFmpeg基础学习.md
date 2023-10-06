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

