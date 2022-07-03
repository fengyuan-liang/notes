# CSS学习

## 1.网页布局

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
        border-left: 8px solid #dddfe4;
        background: #eef0f4;
        overflow: auto;
        word-break: break-word!important;
    }
</style>
<blockquote>
    <p>
        网页布局的三大核心：<code>盒子模型</code>、<code>浮动</code>和<code>定位</code>
    </p>
</blockquote>
css书写顺序（强制）：

1. 布局定位属性：display、position、float、clear、visibility、overflow（建议display第一个写，毕竟关系到模型）
2. 自身属性：width、height、margin、padding、border、background
3. 文本属性：color、font、text-decoration、text-align、vertical-align、white-space、break-word
4. 其他属性（css3）：content、cursor、border-radius、box-shadow、text-shadow、background、linear-gradient




### 1.1盒子模型



![image-20220124225825307](https://s2.loli.net/2022/01/24/dP6is87QlDhRg2O.png)





### 1.2 浮动



#### 1.2.1 标准流（普通流/文档流）

<blockquote>
    <p>
        标准流，就是标签按照规定好默认方式排列
    </p>
</blockquote>



1. 块级元素会独占一行，自上而下顺序排列

   常用块级元素：<code>div</code>、<code>hr</code>、<code>p</code>、<code>h1-h6</code>、<code>ul-ol</code>、<code>dl</code>、<code>form</code>、<code>table</code>

2. 行内元素会按照顺序，从左到由右顺序排列，碰到父元素边缘则自动换行

   常用行内元素：<code>span</code>、<code>a</code>、<code>i</code>、<code>em</code>



#### 1.2.2 为什么需要浮动

有很多的布局效果，标准流没有办法完成，此时就可以利用浮动完成布局。因为浮动可以改变元素标签默认的排列方式.

**浮动最典型的应用:可以让多个块级元素一行内排列显示。**
	

<blockquote>
    <p>
        网页布局第一准则:多个块级元素<code>纵向排列找标准流</code>，多个块级元素<code>横向排列找浮动</code>。
    </p>
</blockquote>

#### 1.2.3 什么是浮动

<code>float</code>属性用于创建浮动框，将其移动到一边，直到左边缘或右边缘触及包含块或另一个浮动框的边缘。



语法：选择器{float：属性值}

| 属性值 |           描述           |
| :----: | :----------------------: |
|  none  | 元素不浮动（**默认值**） |
|  left  |     元素向**左**浮动     |
| right  |     元素向**右**浮动     |



<hr/>

#### 1.2.4 💖浮动特性

设置了浮动（float）的元素最重要的特性：

1.  脱离标准普通流的控制（浮）移动到指定位置（动），俗称<code>脱标</code>
2.  浮动的盒子<code>不再保留原先的位置</code>
3. 如果多个盒子都设置了浮动，则他们会按照属性值<code>一行类显示并且顶端对齐排列</code>
4. 浮动元素会具有行内块元素的特点
5.  浮动元素压住它下面标准流的盒子，但是不会压住下面标准流盒子里面的文字（图片）

注意:浮动的元素是互相贴靠在一起的(不会有缝隙),如果父级宽度装不下这些浮动的盒子，多出的盒子会另起一行对齐。



<blockquote>
    <p>
        <code>行内块元素（inline-block）</code>特点：
    </p>
</blockquote>

任何元素都可以浮动。不管原先是什么模式的元素,添加浮动之后具有行内块元素相似的特性。

- 如果块级盒子没有设置宽度,默认宽度和父级一 样宽,但是添加浮动后,它的大小根据内容来决定
- 浮动的盒子中间是没有缝隙的,是紧挨着一起的
- 行内元素同理



#### 1.2.5 约束浮动

<blockquote>
    <p>
        浮动元素经常和标准流父级搭配使用，用标准元素约束浮动元素
    </p>
</blockquote>

为了约束浮动元素位置，我们网页布局一般采取的策略是：

**先用标准流的父元素排列上下位置，之后内部子元素采取浮动排列左右位置，符合网页布局第一准则**

即：父元素管上下、标准流管左右

注意：

- 浮动经常和标准流的父盒子搭配使用（网页布局第一准则）
- 如果一个元素浮动了，理论上其余的兄弟元素也要浮动
- 浮动的盒子只会影响浮动盒子后面的标准流，不会影响前面的标准流



#### 1.2.6 清除浮动

<blockquote>
    <p>
        父元素不方便给高度，子元素又需要浮动，这时我们就需要清除浮动
    </p>
</blockquote>

为什么要清除浮动？

- 由于父级盒子很多情况下，不方便给高度，但是子盒子浮动又不占有位置，最后父级盒子高度为0时，就会影响下面的标准流盒子，所以我们需要清除浮动
- 由于浮动元素不再占有原文档流的位置，所以它会对后面的元素排版产生影响

关于浮动的注意点：

- 清除浮动的本质是为了<code>清除浮动元素带来的影响</code>
- 如果父盒子本身有高度，就不需要清除浮动
- 清除浮动之后，父级就会根据浮动的字盒子自动检测高度。父级有了高度，就不会影响下面的标准流了



<blockquote>
    <p>
        清除浮动语法：<code>选择器{clear：属性值;}</code>
    </p>
</blockquote>

| 属性值 | 描述                                       |
| :----- | ------------------------------------------ |
| left   | 不允许左侧有浮动元素（清除左侧浮动的影响） |
| right  | 不允许右侧有浮动元素（清除右侧浮动的影响） |
| both   | 同时清除左右两侧浮动的影响                 |

在实际开发中，几乎只用<code>clear:both;</code>

清除浮动的策略是：<code>闭合浮动</code>

<blockquote>
    <p>
        清除浮动的方法
    </p>
</blockquote>

1. <code>额外标签法</code>,也称隔墙法，是W3C推荐的做法（实际开发中不推荐）

   浮动标签法会在浮动元素末尾添加一个空的标签（必须是<code>块级元素</code>）。例如<div style="clear:both"></div>,或者其他标签

   - 优点：通俗易懂，结构简单
   - 缺点：添加了许多无意义的标签，结构化较差

2. 父级添加<code>overflow属性</code>

   可以给父级添加<code>overflow</code>属性，将其属性值设置为<code>hidden</code>、<code>auto</code>、<code>scroll</code>

3. 父级添加<code>after伪元素</code>（伪元素清除浮动是一种高级写法）

   <code>:after</code>方式是额外标签法的升级版。也是给父元素添加

   - 子不教父之过，注意是给父级元素添加属性（这里命名为.clearfix类）
   - 优点：没有增加标签，结构更简单
   - 缺点：需要照顾低版本的浏览器

   ```css
   .clearfix:after{
       content:"";
       display:block;
       height:0;
       clear:both;
       visibility:hidden;
   }
   .clearfix{
       /*IE6、7专有*/
       *zoom:1;
   }
   ```

4. 父级添加<code>双伪元素</code>（双伪元素清除浮动法）

   

   ```css
   .clearfix:before,
   .clearfix:after{
       content:"";
       display:table;
   }
   .clearfix:after{
       clear:both;
   }
   .clearfix{
       *zoom:1;
   }
   ```

   

总结：

为什么需要清除浮动？

- 父级没高度

- 子盒子浮动了

- 影响下面布局了，我们就应该清除浮动

  

| 清除浮动的方式       | 优点               | 缺点                             |
| -------------------- | ------------------ | -------------------------------- |
| 额外标签法（隔墙法） | 通俗易懂，书写方便 | 添加许多无意义的标签，结构化较差 |
| 父级overflow:hidden; | 书写简单           | 溢出会被隐藏                     |
| 父级after伪元素      | 结构语义化正确     | 由于IE6-7不支持:after,兼容性问题 |
| 父级双伪元素         | 结构语义正确       | 由于IE6-7不支持:after,兼容性问题 |



### 1.3 定位

#### 1.3.1 定位的组成

定位：将盒子定在某一个位置，所以定位也是在摆放盒子，按照定位的方式移动盒子

重点：<code>定位</code>=<code>定位模式</code>+<code>位偏移</code>

- 定位模式：用于指定一个元素在文档中的定位方式
- 边偏移：决定一个元素的最终位置

<blockquote>
    <p>
        定位模式
    </p>
</blockquote>

定位模式决定元素的定位方式，它通过css的<code>position</code>属性来设置，其值可以分为四个：

|    值    |     语义     |
| :------: | :----------: |
|  static  | **静态**定位 |
| relative | **相对**定位 |
| absolute | **绝对**定位 |
|  fixed   | **固定**定位 |

<blockquote>
    <p>
        边偏移
    </p>
</blockquote>

边偏移就是定位的盒子移动到最终位置。有top、bottom、left和 right 4个属性

| 边偏移属性 | 示例         | 描述                                                   |
| ---------- | ------------ | ------------------------------------------------------ |
| top        | top：80px    | **顶端**偏移量，定义元素相对于其父元素**上边线的距离** |
| bottom     | bottom：80px | **底部**偏移量，定义元素相对于其父元素**下边线的距离** |
| left       | left：80px   | **左侧**偏移量，定义元素相对于其父元素**左边线的距离** |
| right      | right：80px  | **右侧**偏移量，定义元素相对于其父元素**右边线的距离** |

#### 1.3.2 static 静态定位

静态定位是元素的默认定为方式，即**无定位**的意思，完全遵守标准流，**拥有标准流的特性**

语法：

```css
选择器{ position : static; }
```

- 静态定位按照标准流特性摆放位置，它**没有边偏移**
- 静态定位在实际项目中基本不会使用

<hr/>

#### 1.3.3 relative 相对定位

<code>相对定位</code>是元素在移动位置的时候，是相对于它<code>原来的位置</code>来说的（自恋型）

语法：

```css
选择器 { position : relative;}
```

- 给position为 relative的元素加位偏移时，不是根据浏览器或者父元素来进行偏移，而是<code>根据自身原来的位置进行偏移</code>
- <code>原来</code>在标准流的<code>位置</code>继续占有，后面的盒子任然以标准流的方式对待它（<code>不脱标，继续保存原来的位置</code>）

最佳实践：由于**相对定位不脱标**的特性，它最适合的场景是给<code>绝对定位</code>"<code>当爹</code>"

<hr/>

#### 1.3.4 absolute绝对定位

<code>绝对定位</code>是元素在移动位置的时候，是相对于它<code>祖先元素</code>来说的（拼爹型）

语法：

```css
选择器{ position : absolute;}
```

- 如果<code>没有祖先元素</code>或者<code>祖先元素没有定位</code>，则以浏览器为准定位（Document文档）
- 如果祖先元素有定位（相对、绝对、固定定位），则以<code>最近一级</code>的有定位祖先元素为参考点移动位置
- 绝对定位<code>不再占有原先的位置</code>（脱标）
- 绝对定位（固定定位）会完全压住盒子，包括里面的文字、图片

<hr/>

#### 1.3.5 子绝父相的由来

<code>子绝父相</code>太重要了，是我们网页定位的核心，意思就是：“**子级是绝对定位的话，父级要用相对定位**”

- 子级绝对定位，不会占有位置，可以放到父盒子里面的任何一个地方，不会影响其他的兄弟盒子
- 父盒子需要加定位限制子盒子在父盒子内显示
- 父盒子布局时，需要占有位置，因此父亲只能是相对定位

这就是子绝父相的由来，所以<code>相对定位经常用来作为绝对定位的父级</code>

总结：

- 父级需要占有位置，因此是相对定位
- 子盒子不需要占有位置，则是绝对定位

<hr/>

#### 1.3.6 fixed固定定位

<code>固定定位</code>是元素<code>固定于浏览器可视区的位置</code>。主要使用场景：可以在浏览器页面滚动时元素的位置不会改变

语法：

```css
选择器{ position : fixed;}
```

固定定位的特点：

1. 以浏览器的可视窗口为参照点移动元素
   - 跟父元素没有任何关系
   - 不随滚动条滚动
2. 固定定位<code>不在占有原先的定位</code>
   - 固定定位也是<code>脱标</code>的，其实固定定位也可以看做是一种特殊的绝对定位



固定定位小技巧：**固定在版心右侧位置**：

小算法：

1. 让固定定位的盒子left:50%，走到浏览器可视区（也可以看做版心）的一半位置
2. 让固定定位的盒子margin-left：版心宽度的一半距离。多走版心宽度的一半位置就可以让固定定位的盒子贴着版心右侧对齐了

<hr/>

#### 1.3.7 sticky粘性定位

<code>粘性定位</code>可以被认为是相对定位和固定定位的混合。Sticky：粘性的

语法：

```css
选择器{ position : sticky ; top : 10px}
```

粘性定位的特点：

1. 以浏览器的可视窗口为参照点移动原始（固定定位特点）
2. 粘性定位<code>占有原先的位置</code>（相对定位特点）
3. 必须添加top、left、right、bottom其中一个才有效

跟页面滚动搭配使用。兼容性较差，IE不支持。

<hr/>

#### 1.3.8 z-index定位叠放次序

在使用定位布局时，可能会出现盒子重叠的情况。此时，可以使用<code>z-index</code>来控制盒子的前后次序（z轴）

语法：

```css
选择器{ z-index : 1 ;}
```

- 数值可以是正整数、负整数或0，默认是auto，数值越大，盒子越靠上
- 如果属性值相同，则按照书写属性，后来居上
- 数字后面不能加单位
- 只有定位的盒子才有z-index属性（标准流和浮动是你没有这个属性的）

<hr/>

#### 1.3.9 定位总结

|     定位模式     |     是否脱标     |      移动位置      |  是否常用  |
| :--------------: | :--------------: | :----------------: | :--------: |
|  static静态定位  |        否        |   不能使用边偏移   |    很少    |
| relative相对定位 |  否（占有位置）  | 相对于自身位置偏移 |    常用    |
| absolute绝对定位 | 是（不占有位置） |   带有定位的父级   |    常用    |
|  fixed固定定位   | 是（不占有位置） |    浏览器可视区    |    常用    |
|  sticky粘性定位  |  否（占有位置）  |    浏览器可视区    | 当前阶段少 |

1. 一定记住相对定位、固定定位、绝对定位两个大的特点：

   - 是否占有位置（脱标否）
   - 以谁为基准点移动位置

   **重点掌握子绝父相的定位模式**

2. 定位特殊特性：

   绝对定位和固定定位也和浮动类似

   - 行内元素添加绝对或者固定定位，可以直接设置高度和宽度
   - 块级元素添加绝对或者固定定位，如果不给宽度或者高度，默认大小是内容的大小

3. 绝对定位（固定定位）会完全压住盒子：

   浮动元素不同，只会压住它下面标准流的盒子，但是不会压住下面标准流盒子里面的文字（图片）

<hr/>

### 1.4 元素的显示和隐藏

本质是让一个元素在页面中隐藏或显示出来

用到的元素有：<code>display</code>、<code>visibility</code>、<code>overflow</code>

#### 1.4.1 display属性

display属性用来设置一个元素应如何显示，**元素隐藏后元素占有的位置也会消失**

- display：none；隐藏元素
- display：block；除了转换为块级元素之外，同时还有显示元素的意思

#### 1.4.2 visibility可见性

visibility属性用来指定一个元素应可见还是隐藏，**元素隐藏后元素占有的位置不会消失**

- visibility：visible；元素可视
- visibility：hidden；元素隐藏

#### 1.4.3 overflow溢出

overflow属性指定了如果内容溢出一个元素的框（超过其指定高度及宽度）时，会发生什么

| 属性值  | 描述                                       |
| ------- | ------------------------------------------ |
| visible | 不剪切内容也不添加滚动条                   |
| hidden  | 不显示超过对象尺寸的内容，超出的部分隐藏掉 |
| scroll  | 不管超出内容否，总是显示滚动条             |
| auto    | 超出自动显示滚动条，不超出不显示滚动条     |

注意：一般情况下，我们都不想让溢出的内容显示出来，因为溢出的部分会影响布局

但是如果有定位的盒子，请慎用overflow：hidden，因为它会隐藏多余的部分



<hr/>

### 1.5 网页布局总结

通过盒子模型，我们知道大部分html标签是一个盒子

通过CSS浮动、定位可以让每个盒子排列成为网页

一个完整的网页，是<code>标准流</code>、<code>浮动</code>、<code>定位</code>一起完成布局的，每个都有其专门和独到的用法

1. 标准流

   可以让盒子上下排列或者左右排列，<code>垂直的块级盒子显示就用标准流布局</code>

2. 浮动

   可以让多个块级元素一行显示或者左右对齐盒子，<code>朵儿块级盒子水平显示就用浮动布局</code>

   





## 2. CSS高级篇

2.1 精灵图





2.2 字体图标





2.3 CSS三角





2.4 























## 网页布局常用样式

1. 标准流元素居中

   margin：0 auto
   
2. 绝对定位盒子水平居中（绝对定位的盒子不能用margin：0 auto进行居中）

   ```css
   选择器：{
       position:absolute;
   	left:50%;
       margin-left:-width/2;
   }
   ```

3. 绝对定位盒子垂直居中：position：absolute; top：50%; margin-top：-height/2;

   ```css
   <!--让盒子水平垂直居中标准写法-->
   .classic {
       position:absolute;
       top:50%;
       left:50%;
       transform:translate(-50%,-50%);
   }
   <!--flex写法-->
   .flex {
       display:flex;
       align-item:center;
       justify-content:center;
   }
   <!--grid写法-->
   .grid {
       display:grid;
       place-item:center;
   }
   ```

   









