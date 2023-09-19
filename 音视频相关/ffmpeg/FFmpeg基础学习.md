# FFmpeg基础学习

再 看看参数

```java
-f lavfi -i color=0xFFFF00:1080x1920:d=3.000000 -c:v libvpx -i run/cache/test1/0/1/input.webm -i run/cache/test1/0/2/ic_lastart.png -filter_complex [1]crop=680.00:1020.00:200.00:200.00[crop1];[crop1]scale=540.00:960.00[scale1];[scale1]pad=770.07:1067.05:115.03:53.53:0xFFFFFF00[pad1];[pad1]rotate=a=PI*15.00/180:fillcolor=0xFFFFFF00[rotate1];[2]crop=512.00:512.00:256.00:256.00[crop2];[crop2]scale=256.00:256.00[scale2];[scale2]pad=349.70:349.70:46.85:46.85:0xFFFFFF00[pad2];[pad2]rotate=a=PI*30.00/180:fillcolor=0xFFFFFF00[rotate2];color=0xFFFFFF00:s=400x100[back3];[back3]drawtext=text='你好中国':fontsize=100:fontcolor=0x0000FF[draw3];[draw3]pad=400.00:286.60:0.00:93.30:0xFFFFFF00[pad3];[pad3]rotate=a=PI*30.00/180:fillcolor=0xFFFFFF00[rotate3];[0][rotate1]overlay=154.97:726.47[over1];[over1][rotate2]overlay=365.15:53.15[over2];[over2][rotate3]overlay=340.00:306.70:shortest=1[over3] -map [over3] -map 1:a -y run/cache/test1/0/output.mp4
```

```java
[1]crop=680.00:1020.00:200.00:200.00[crop1];[crop1]scale=540.00:960.00[scale1];[scale1]pad=770.07:1067.05:115.03:53.53:0xFFFFFF00[pad1];[pad1]rotate=a=PI*15.00/180:fillcolor=0xFFFFFF00[rotate1];[2]crop=512.00:512.00:256.00:256.00[crop2];[crop2]scale=256.00:256.00[scale2];[scale2]pad=349.70:349.70:46.85:46.85:0xFFFFFF00[pad2];[pad2]rotate=a=PI*30.00/180:fillcolor=0xFFFFFF00[rotate2];color=0xFFFFFF00:s=400x100[back3];[back3]drawtext=text='你好中国':fontsize=100:fontcolor=0x0000FF[draw3];[draw3]pad=400.00:286.60:0.00:93.30:0xFFFFFF00[pad3];[pad3]rotate=a=PI*30.00/180:fillcolor=0xFFFFFF00[rotate3];[0][rotate1]overlay=154.97:726.47[over1];[over1][rotate2]overlay=365.15:53.15[over2];[over2][rotate3]overlay=340.00:306.70:shortest=1[over3]
```

