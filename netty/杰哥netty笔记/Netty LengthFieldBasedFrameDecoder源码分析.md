# Netty LengthFieldBasedFrameDecoder源码分析

Netty系列文章:
[Netty服务端启动流程源码分析](https://blog.csdn.net/weixin_45271492/article/details/121543945?spm=1001.2014.3001.5501)
[Netty服务端处理客户端连接流程](https://blog.csdn.net/weixin_45271492/article/details/121593075?spm=1001.2014.3001.5501)
[Netty客户端消息处理流程](https://blog.csdn.net/weixin_45271492/article/details/121612030?spm=1001.2014.3001.5501)
[NioEventLoop源码分析](https://blog.csdn.net/weixin_45271492/article/details/121651926?spm=1001.2014.3001.5501)
[Netty RecvByteBufAllocator源码分析](https://blog.csdn.net/weixin_45271492/article/details/121777606?spm=1001.2014.3001.5501)

LengthFieldBasedFrameDecoder是一个基于长度字段的解码器，它也是Netty提供的最难理解的解码器，本期就带大家分析一下它的实现原理。

在学习LengthFieldBasedFrameDecoder的时候，大家都知道它主要有5个核心的参数配置，分别是以下这几个

maxFrameLength：数据包最大长度

lengthFieldOffset：长度字段偏移量

lengthFieldLength：长度字段所占的字节数

lengthAdjustment：长度的调整值

initialBytesToStrip：解码后跳过的字节数

但是很多时候大家都分不清这几个参数在解析过程中到底有什么含义，所以分析源码之前，我们先要弄清楚每一个参数的含义是什么。以下是LengthFieldBasedFrameDecoder源码中作者给出的注释中的案例，我们来分析一下。

# 案例分析

案例1：

lengthFieldOffset=0   长度字段从0开始

lengthFieldLength=2   长度字段本身占2个字节

lengthAdjustment=0   需要调整0字节

initialBytesToStrip=0   解码后跳过0字节

整个包长度为14字节

| Length（长度）            | Actual Content（真实的数据）                 |
| ------------------------- | -------------------------------------------- |
| 0x000C                    | HELLO, WORLD                                 |
| 0x000C==12，该字段为2字节 | 数据总共12字节，所以长度字段指的是数据的长度 |

解码后

| Length | Actual Content |
| ------ | -------------- |
| 0x000C | HELLO, WORLD   |



案例2：

lengthFieldOffset=0   长度字段从0开始
lengthFieldLength=2   长度字段本身占2个字节
lengthAdjustment=0  需要调整0字节
initialBytesToStrip=2   解码后跳过2字节

整个包长度为14字节

| Length（长度）            | Actual Content（真实的数据）                 |
| ------------------------- | -------------------------------------------- |
| 0x000C                    | HELLO, WORLD                                 |
| 0x000C==12，该字段为2字节 | 数据总共12字节，所以长度字段指的是数据的长度 |

这时initialBytesToStrip字段起作用了，在解码后会将前面的2字节跳过，所以解码后就只剩余了数据部分。

解码后

| Actual Content（真实的数据） |
| ---------------------------- |
| HELLO, WORLD                 |



案例3：

lengthFieldOffset=0   长度字段从0开始
lengthFieldLength=2   长度字段本身占2个字节
lengthAdjustment= -2  需要调整 -2 字节
initialBytesToStrip=0   解码后跳过2字节

整个包长度为14字节

| Length（长度）            | Actual Content（真实的数据）               |
| ------------------------- | ------------------------------------------ |
| 0x000E                    | HELLO, WORLD                               |
| 0x000E==14，该字段为2字节 | 数据总共12字节，长度字段指的是整个包的长度 |

这时lengthAdjustment起作用了，因为长度字段的值包含了长度字段本身的2字节，如果要获取数据的字节数，需要加上lengthAdjustment的值，就是 14+（-2）=12，这样才算出来数据的长度。

解码后

| Length | Actual Content |
| ------ | -------------- |
| 0x000E | HELLO, WORLD   |



案例4：

lengthFieldOffset=2     长度字段从第2个字节开始
lengthFieldLength=3    长度字段本身占3个字节
lengthAdjustment=0     需要调整0字节
initialBytesToStrip=0     解码后跳过0字节

整个包长度为17字节

| Header（头） | Length（长度）              | Actual Content（真实的数据）             |
| ------------ | --------------------------- | ---------------------------------------- |
| OxCAFE       | 0x00000C                    | HELLO, WORLD                             |
| 2字节        | 0x00000C==12，该字段为3字节 | 数据总共12字节，长度字段指的是数据的长度 |

由于数据包最前面加了2个字节的Header，所以lengthFieldOffset为2，说明长度字段是从第2个字节开始的。然后lengthFieldLength为3，说明长度字段本身占了3个字节。

解码后

| Header | Length   | Actual Content |
| ------ | -------- | -------------- |
| OxCAFE | 0x00000C | HELLO, WORLD   |



案例5：

lengthFieldOffset=0     长度字段从第0个字节开始
lengthFieldLength=3    长度字段本身占3个字节
lengthAdjustment=2     需要调整2字节
initialBytesToStrip=0     解码后跳过0字节

整个包长度为17字节

| Length（长度）              | Header（头） | Actual Content（真实的数据）             |
| --------------------------- | ------------ | ---------------------------------------- |
| 0x00000C                    | OxCAFE       | HELLO, WORLD                             |
| 0x00000C==12，该字段为3字节 | 2字节        | 数据总共12字节，长度字段指的是数据的长度 |

lengthFieldOffset为0，所以长度字段从0字节开始。lengthFieldLength为3，长度总共占3字节。因为长度字段后面还剩余14字节的总数据，但是长度字段的值为12，只表示了数据的长度，不包含头的长度，所以lengthAdjustment为2，就是12+2=14，计算出Header+Content的总长度。

解码后

| Length（长度） | Header（头） | Actual Content（真实的数据） |
| -------------- | ------------ | ---------------------------- |
| 0x00000C       | OxCAFE       | HELLO, WORLD                 |



案例6：

lengthFieldOffset=1     长度字段从第1个字节开始
lengthFieldLength=2    长度字段本身占2个字节
lengthAdjustment=1     需要调整1字节
initialBytesToStrip=3     解码后跳过3字节

整个包长度为16字节

| Header（头） | Length（长度）            | Header（头） | Actual Content（真实的数据）             |
| ------------ | ------------------------- | ------------ | ---------------------------------------- |
| 0xCA         | 0x000C                    | 0xFE         | HELLO, WORLD                             |
| 1字节        | 0x000C==12，该字段为2字节 | 1字节        | 数据总共12字节，长度字段指的是数据的长度 |

这一次将Header分为了两个1字节的部分，lengthFieldOffset为1表示长度从第1个字节开始，lengthFieldLength为2表示长度字段占2个字节。因为长度字段的值为12，只表示了数据的长度，所以lengthAdjustment为1，12+1=13，表示Header的第二部分加上数据的总长度为13。因为initialBytesToStrip为3，所以解码后跳过前3个字节。

解码后

| Header（头） | Actual Content（真实的数据） |
| ------------ | ---------------------------- |
| 0xFE         | HELLO, WORLD                 |



案例7：

lengthFieldOffset=1     长度字段从第1个字节开始
lengthFieldLength=2    长度字段本身占2个字节
lengthAdjustment=-3     需要调整 -3 字节
initialBytesToStrip=3     解码后跳过3字节

整个包的长度为16字节

| Header（头） | Length（长度）            | Header（头） | Actual Content（真实的数据）             |
| ------------ | ------------------------- | ------------ | ---------------------------------------- |
| 0xCA         | 0x0010                    | 0xFE         | HELLO, WORLD                             |
| 1字节        | 0x0010==16，该字段为2字节 | 1字节        | 数据总共12字节，长度字段指的是包的总长度 |

这一次长度字段的值为16，表示包的总长度，所以lengthAdjustment为 -3 ，16+ (-3)=13，表示Header的第二部分加数据部分的总长度为13字节。initialBytesToStrip为3，解码后跳过前3个字节。

解码后

| Header（头） | Actual Content（真实的数据） |
| ------------ | ---------------------------- |
| 0xFE         | HELLO, WORLD                 |

到这里我们可以总结一下，长度字段后的数据字节数=长度字段的值+lengthAdjustment。分析完以上7个案例，相信大家应该对这几个参数已经理解了。接下来就去分析一下源码。

# 重要的字段

```java
//大小端排序
//大端模式：是指数据的高字节保存在内存的低地址中，而数据的低字节保存在内存的高地址中，地址由小向大增加，而数据从高位往低位放；
//小端模式：是指数据的高字节保存在内存的高地址中，而数据的低字节保存在内存的低地址中，高地址部分权值高，低地址部分权值低，和我们的日常逻辑方法一致。
//不了解的自行查阅一下资料
private final ByteOrder byteOrder;
//最大帧长度
private final int maxFrameLength;
//长度字段偏移量
private final int lengthFieldOffset;
//长度域字段的字节数
private final int lengthFieldLength;
//长度字段结束位置的偏移量  lengthFieldOffset+lengthFieldLength
private final int lengthFieldEndOffset;
//长度调整
private final int lengthAdjustment;
//需要跳过的字节数
private final int initialBytesToStrip;
//快速失败
private final boolean failFast;
//true 表示开启丢弃模式，false 正常工作模式
private boolean discardingTooLongFrame;
//当某个数据包的长度超过maxLength，则开启丢弃模式，此字段记录需要丢弃的数据长度
private long tooLongFrameLength;
//记录还剩余多少字节需要丢弃
private long bytesToDiscard;
```

构造方法就是一系列的赋值操作，大家可以自行查看。从字段中可以看出，LengthFieldBasedFrameDecoder有两种工作模式，正常模式和丢弃模式，接下来我们从这两个模式分别分析一下它的decode()解码方法。

# decode()

```java
//ctx：内部持有当前解码器
//in：缓冲区
//out：保存解码后的数据
protected final void decode(ChannelHandlerContext ctx, ByteBuf in, List<Object> out) throws Exception {
    //跟进去
    Object decoded = decode(ctx, in);
    if (decoded != null) {
        out.add(decoded);
    }
}
```

## 正常模式

这里只注释了正常模式下的解码流程，以免混淆。

```java
protected Object decode(ChannelHandlerContext ctx, ByteBuf in) throws Exception {
    
    //丢弃模式
    if (discardingTooLongFrame) {
        discardingTooLongFrame(in);
    }
    
    //判断缓冲区中可读的字节数是否小于长度字段的偏移量
    if (in.readableBytes() < lengthFieldEndOffset) {
        //说明长度字段的包都还不完整，半包
        return null;
    }
    
    //执行到这，说明可以解析出长度字段的值了
    
    //计算出长度字段的开始偏移量
    int actualLengthFieldOffset = in.readerIndex() + lengthFieldOffset;
    
    //获取长度字段的值，不包括lengthAdjustment的调整值
    long frameLength = getUnadjustedFrameLength(in, actualLengthFieldOffset, lengthFieldLength, byteOrder);
    
    //如果数据帧长度小于0，说明是个错误的数据包
    if (frameLength < 0) {
        //内部会跳过这个数据包的字节数，并抛异常
        failOnNegativeLengthField(in, frameLength, lengthFieldEndOffset);
    }
    
    //套用前面的公式：长度字段后的数据字节数=长度字段的值+lengthAdjustment
    //frameLength就是长度字段的值，加上lengthAdjustment等于长度字段后的数据字节数
    //lengthFieldEndOffset为lengthFieldOffset+lengthFieldLength
    //那说明最后计算出的framLength就是整个数据包的长度
    frameLength += lengthAdjustment + lengthFieldEndOffset;
    //判断是否为错误的数据包
    if (frameLength < lengthFieldEndOffset) {
        failOnFrameLengthLessThanLengthFieldEndOffset(in, frameLength, lengthFieldEndOffset);
    }
    
    //整个数据包的长度是否大于最大帧长度
    if (frameLength > maxFrameLength) {
        //丢弃超出的部分，丢弃模式
        exceededFrameLength(in, frameLength);
        return null;
    }
    
    //执行到这说明是正常模式
    //数据包的大小
    int frameLengthInt = (int) frameLength;
    //判断缓冲区可读字节数是否小于数据包的字节数
    if (in.readableBytes() < frameLengthInt) {
        //半包，等会再来解析
        return null;
    }
    
    //执行到这说明缓冲区的数据已经包含了数据包
    
    //跳过的字节数是否大于数据包长度
    if (initialBytesToStrip > frameLengthInt) {
        failOnFrameLengthLessThanInitialBytesToStrip(in, frameLength, initialBytesToStrip);
    }
    
    
    //跳过initialBytesToStrip个字节
    in.skipBytes(initialBytesToStrip);
    
    //解码
    //获取当前可读的下标
    int readerIndex = in.readerIndex();
    //获取跳过后的真实数据长度
    int actualFrameLength = frameLengthInt - initialBytesToStrip;
    //提取真实的数据
    ByteBuf frame = extractFrame(ctx, in, readerIndex, actualFrameLength);
    //更新一下可读的下标
    in.readerIndex(readerIndex + actualFrameLength);
    //返回数据
    return frame;
}

//解析长度字段的值
//offset：长度字段开始的偏移量
//length：长度字段的字节数
protected long getUnadjustedFrameLength(ByteBuf buf, int offset, int length, ByteOrder order) {
    //大小端排序
    buf = buf.order(order);
    //长度字段的值
    long frameLength;
    //根据长度字段的字节数，获取出长度字段的值
    switch (length) {
    case 1:
        //byte
        frameLength = buf.getUnsignedByte(offset);
        break;
    case 2:
        //short    
        frameLength = buf.getUnsignedShort(offset);
        break;
    case 3:
        //int占32位，这里取出后24位，返回int类型    
        frameLength = buf.getUnsignedMedium(offset);
        break;
    case 4:
        //int
        frameLength = buf.getUnsignedInt(offset);
        break;
    case 8:
        //long
        frameLength = buf.getLong(offset);
        break;
    default:
        throw new DecoderException(
                "unsupported lengthFieldLength: " + lengthFieldLength + " (expected: 1, 2, 3, 4, or 8)");
    }
    //返回长度字段的值
    return frameLength;
}

//获取真实的数据
//index：可读的下标
//length：要读取的长度
protected ByteBuf extractFrame(ChannelHandlerContext ctx, ByteBuf buffer, int index, int length) {
    return buffer.retainedSlice(index, length);
}
```

以上是正常模式的解码过程，接下来分析一下丢弃模式。

## 丢弃模式

```java
protected Object decode(ChannelHandlerContext ctx, ByteBuf in) throws Exception {
    //是否开启丢弃模式，默认为false，会在后面进行修改
    if (discardingTooLongFrame) {
        //丢弃数据
        discardingTooLongFrame(in);
    }
    if (in.readableBytes() < lengthFieldEndOffset) {
        return null;
    }
    int actualLengthFieldOffset = in.readerIndex() + lengthFieldOffset;
    long frameLength = getUnadjustedFrameLength(in, actualLengthFieldOffset, lengthFieldLength, byteOrder);
    if (frameLength < 0) {
        failOnNegativeLengthField(in, frameLength, lengthFieldEndOffset);
    }
    frameLength += lengthAdjustment + lengthFieldEndOffset;
    if (frameLength < lengthFieldEndOffset) {
        failOnFrameLengthLessThanLengthFieldEndOffset(in, frameLength, lengthFieldEndOffset);
    }
    
    //丢弃模式就是在这开启的
    //如果数据包长度大于最大长度
    if (frameLength > maxFrameLength) {
        //对超过的部分进行处理
        exceededFrameLength(in, frameLength);
        return null;
    }
    int frameLengthInt = (int) frameLength;
    if (in.readableBytes() < frameLengthInt) {
        return null;
    }
    if (initialBytesToStrip > frameLengthInt) {
        failOnFrameLengthLessThanInitialBytesToStrip(in, frameLength, initialBytesToStrip);
    }
    in.skipBytes(initialBytesToStrip);
    int readerIndex = in.readerIndex();
    int actualFrameLength = frameLengthInt - initialBytesToStrip;
    ByteBuf frame = extractFrame(ctx, in, readerIndex, actualFrameLength);
    in.readerIndex(readerIndex + actualFrameLength);
    return frame;
}
```

首先来分析一下丢弃模式是如何开启的

```java
//frameLength：数据包的长度
private void exceededFrameLength(ByteBuf in, long frameLength) {
    //数据包长度-可读的字节数  两种情况
    //1. 数据包总长度为100，可读的字节数为50，说明还剩余50个字节需要丢弃但还未接收到
    //2. 数据包总长度为100，可读的字节数为150，说明缓冲区已经包含了整个数据包
    long discard = frameLength - in.readableBytes();
    //记录一下最大的数据包的长度
    tooLongFrameLength = frameLength;
    
    
    if (discard < 0) {
        //说明是第二种情况，直接丢弃当前数据包
        in.skipBytes((int) frameLength);
    } else {
        //说明是第一种情况，还有部分数据未接收到
        //开启丢弃模式
        discardingTooLongFrame = true;
        //记录下次还需丢弃多少字节
        bytesToDiscard = discard;
        //丢弃缓冲区所有数据
        in.skipBytes(in.readableBytes());
    }
    //跟进去
    failIfNecessary(true);
}

private void failIfNecessary(boolean firstDetectionOfTooLongFrame) {
    if (bytesToDiscard == 0) {
        //说明需要丢弃的数据已经丢弃完成
        //保存一下被丢弃的数据包长度
        long tooLongFrameLength = this.tooLongFrameLength;
        this.tooLongFrameLength = 0;
        //关闭丢弃模式
        discardingTooLongFrame = false;
        //failFast：默认true
        //firstDetectionOfTooLongFrame：传入true
        if (!failFast || firstDetectionOfTooLongFrame) {
            //快速失败
            fail(tooLongFrameLength);
        }
    } else {
        //说明还未丢弃完成
        if (failFast && firstDetectionOfTooLongFrame) {
            //快速失败
            fail(tooLongFrameLength);
        }
    }
}

private void fail(long frameLength) {
    //丢弃完成或未完成都抛异常
    if (frameLength > 0) {
        throw new TooLongFrameException(
                        "Adjusted frame length exceeds " + maxFrameLength +
                        ": " + frameLength + " - discarded");
    } else {
        throw new TooLongFrameException(
                        "Adjusted frame length exceeds " + maxFrameLength +
                        " - discarding");
    }
}
```

如果丢弃未完成，那么会在下一次调用decode()时，在方法内部的最上方进行丢弃逻辑

```java
private void discardingTooLongFrame(ByteBuf in) {
    //保存还需丢弃多少字节
    long bytesToDiscard = this.bytesToDiscard;
    //获取当前可以丢弃的字节数，有可能出现半包
    int localBytesToDiscard = (int) Math.min(bytesToDiscard, in.readableBytes());
    //丢弃
    in.skipBytes(localBytesToDiscard);
    //更新还需丢弃的字节数
    bytesToDiscard -= localBytesToDiscard;
    this.bytesToDiscard = bytesToDiscard;
    //是否需要快速失败，回到上面的逻辑
    failIfNecessary(false);
}
```

以上就是丢弃模式，就是对超过最大数据长度的部分进行丢弃的处理。

如果看到这还不太理解的话，不妨试试构建几个数据，自行分析一下整体的流程，相信会对大家有更好的帮助。