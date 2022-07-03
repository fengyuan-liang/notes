# 好玩的CSS样式

## 1. EyeAnimation

### 1.1 样式展示

样式是油管：https://www.youtube.com/watch?v=IFNUXlqtROc 上看的，原视频作者：Online Tutorials

![](https://i.loli.net/2021/10/29/uUGT5vSAJ2Dwy3q.gif)



### 2.2 完整代码

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Eye Ball Move on Mousemove</title>
    <link rel="stylesheet" href="css/EyeAnimation.css">
    <style>
        *{
            margin: 0;
            padding: 0;
        }
        body{
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            background: radial-gradient(#f2761e,#ef4921);
        }
        .box{
            display: flex;
        }
        .box .eye{
            position: relative;
            width: 120px;
            height: 120px;
            display: block;
            background: #fff;
            margin: 0 20px;
            border-radius: 50%;
            box-shadow: 0 5px 45px rgba(0,0,0,0.2),
            inset 0 0 15px #f2761e,
            inset 0 0 25px #f2761e;
        }
        .box .eye::before{
            content: '';
            position: absolute;
            top: 50%;
            left: 35%;
            transform: translate(-50%,-50%);
            width: 45px;
            height: 45px;
            border-radius: 50%;
            background: #000000;
            border: 10px solid #2196f3;
            box-sizing: border-box;
        }
    </style>
</head>
<body>
    <div class="box">
        <div class="eye"></div>
        <div class="eye"></div>
    </div>
    <script>
        document.querySelector('body').addEventListener('mousemove',eyeball);
        function eyeball(e) {
            const eye=document.querySelectorAll('.eye');
            eye.forEach(function (eye) {
                let x=(eye.getBoundingClientRect().left)+(eye.clientWidth/2);
                let y=(eye.getBoundingClientRect().top)+(eye.clientHeight/2);

                let radian=Math.atan2(e.pageX-x,e.pageY-y);
                let rotation=(radian*(180/Math.PI)*-1)+270;
                eye.style.transform="rotate("+rotation+"deg)"
            })
        }
    </script>
</body>
</html>
```



















