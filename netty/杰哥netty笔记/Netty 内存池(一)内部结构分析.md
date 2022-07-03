# Netty 内存池(一)内部结构分析

Netty做为Java中的高性能的网络编程框架，自然是有它的道理。首先是分装了Jdk十分难用nio接口，用责任链模式使用户只需要专注于业务代码，其次使用了直接内存实现零拷贝提升性能。不过直接内存的创建和释放都需要涉及到系统调用，这是十分消耗系统资源的，如果每一次读写都需要系统调用，那么Netty的性能一定是是比较低的。Netty为了解决这一个问题，设计了一个非常优秀的内存池，即最开始就向系统申请一大块的内存，然后每次读写直接从内存池申请和释放即可。由于Netty的内存池设计比较复杂，牵涉的对象也比较多，这期就带大家先熟悉各个对象的职责，和内存池的整体结构，后面再具体分析每一个对象的源码。

先来看看Netty的内存池都定义了哪些规格。

Tiny：16，32，48，64，80，96 ...... (以16递增) ...... 496 ，单位byte

Small：512，1024，2048，4096，单位byte

Normal：以页的方式分配，1页为8k，默认一个Chunk对象（下面会说）有2048个页，也就是16m

Huge：大于16m

这些规格在后面分析的时候会多次出现。接下来就开始分析内存池的对象。

PooledByteBufAllocator：池化内存分配器。Netty也有非池化内存分配器，就是每次向操作系统申请内存，不过默认使用池化。所有读写请求都需要向它申请内存。

在PooledByteBufAllocator中有两个成员属性

```java
//堆内存，包括底下都是数组
private final PoolArena<byte[]>[] heapArenas; //HeapArena
//直接内存
private final PoolArena<ByteBuffer>[] directArenas; //DirectArena
```

Arena对象，代表了一个内存区域，PooleadByteBufAllocator中的申请内存，最终都会交给Arena对象完成。因为Netty通常是处理高并发的场景，多个线程去申请一块内存的竞争是不可避免的，于是Netty使用了多个Arena对象的方式，空间换时间，提高了内存的分配效率。这里涉及到了堆和直接内存两种类型，不过逻辑基本一致，后面主要分析直接内存。

所以说PooleadByteBufAllocator只是一个分配内存的工具，实际上内存是由Arena进行分配的。接着看下Arena对象是怎么构成的。

下图单位b表示byte，不是bit。

![](C:\Users\HYWYZ\Desktop\面试资料\源码\Netty\笔记\内存池\Arena结构.png)

在Arena中可以看到有一个对象叫PoolChunk，它就是实际分配内存的对象了，内部持有ByteBuffer。而Arena内部，变量名以q开头的双向链表，后缀代表了PoolChunk的使用率，刚创建的PoolChunk就会放在qInit链表内部。每个链表内部的PoolChunk又会形成双向链表。在使用PoolChunk时，如果内存使用率发生改变，它也会被移动到相应的链表中去。还有两个SubpagePools，他们的数据结构类似于hashmap的数组+链表，这是用来分配小规格内存的。其中head节点使用来加锁同步，并不具有分配内存的能力。数组内前面的值为下标，后面的值代表了这个桶位是用来分配多大内存的。总共有两种规格，tiny负责分配16~496k，small负责分配512~4096k。这两个数组保存的类型为PoolSubpage，后面再介绍。

一个PoolChunk默认开辟了16m的内存。但是实际使用时，可能并不会用到这么多的内存，那就需要记录一下当前PoolChunk分配了哪些内存出去。

PoolChunk使用一颗12层的满二叉树来表示一个PoolChunk的内存分配情况，在内部使用的是数组来表示满二叉树。

 ![](C:\Users\HYWYZ\Desktop\面试资料\源码\Netty\笔记\内存池\PoolChunk满二叉树.png)

数组下标从1开始，总共保存了4095个节点值，下标对应的值就是当前节点的深度，这些深度有什么用呢？深度值代表了这个节点的内存分配能力。就以默认PoolChunk分配16m来说，根节点的深度为0，说明它能分配16m的内存，下标2和3的节点深度为1，说明它们各自能分配8m的内存。以此类推，总数有2048个的叶子节点，每个能分配8k的内存（16*1024/2048）。当io线程来申请内存时，如果需要8k，那么会将下标2048的节点的深度改为12，并且依次将它的父节点，爷爷节点......的深度都+1，根节点深度值也就变成了1，表示这些节点都只能分配当前深度值的内存了。节点的深度值越小，说明该节点能分配越大的内存，当节点的深度值达到12时，就代表了这个节点已经不能分配内存了。如果PoolChunk的根节点深度值为12，就表示该PoolChunk对象已经不能分配内存。

PoolChunk的满二叉树有2048个叶子节点，每个叶子节点能分配8k的内存。如果线程申请的内存大于等于8k的话，PoolChunk就直接从满二叉树中寻找到具有分配内存能力的节点即可；但如果申请的内存小于8k呢？这种内存大小我们称为小规格，遇到这种情况，PoolChunk会选取一个合适的叶子节点进行内存分配。但是8k对于线程来说还是太大了，不可能每一次遇到小规格内存，都要分配8k出去，那岂不是很浪费内存空间？

Netty为了解决这种情况，引入了PoolSubpage对象。在PoolChunk对象中保存了一个大小为2048的PoolSubpage数组，如果有线程来申请小规格内存，那么PoolChunk会找到一个叶子节点（8k），在这个叶子节点上继续划分空间，PoolChunk中的PoolSubpage就会为对应下标的叶子节点创建PoolSubpage进行管理内存，并且会将这个对象存放到Arena中的SubpagePools上的对应规格的桶位。举个例子，如果线程申请16byte的内存，那么PoolSubpage就会存放到tinySubpagePools的下标为0的桶位里。那PoolSubpage是如何管理小规格的内存呢？

![](C:\Users\HYWYZ\Desktop\面试资料\源码\Netty\笔记\内存池\PoolSubpage结构.png)

上图是PoolSubpage的内部结构，它使用了一个long型数组来表示bitmap（位图）。带大家分析一下这个图的具体含义。一个PoolSubpage管理了8k的内存，也就是8192byte。在java中，long为64位。这幅图代表了这个PoolSubpage是用来分配16byte的内存，用 8k/16byte=512。这个bitmap总共有8个long值，所以bitmap整体有512位，这里面每一位代表了16byte的内存。1代表分配了16k，0代表未分配，那么这幅图就表示当前PoolSubpage已经分配了4个16byte的内存。

不过这副图只代表了PoolSubpage分配16byte的结构，PoolSubpage分配的内存规格范围是16byte~4096byte，所以bitmap的长度是随着规格不断变化的，每一位也是表示当前PoolSubpage所分配的内存规格。如果是分配32byte，那么bitmap有效值就是前4个元素，后面4个是用不到的，这些都是通过计算得到的。

到这为止，Netty内存池用来管理内存的对象就差不多分析完了，不过Netty在这中间还加入了一层缓存对象，就是在线程使用完内存后，不会直接将内存归还到内存池中，而是先放入到缓存对象中，缓存对象又是存在ThreadLocal中。也就是说，等到下一次线程还需要申请同样大小的内存时，就不需要到Arena对象去同步申请内存，直接去缓存中拿内存就行。Netty使用了PoolThreadCache对象来缓存。

![](C:\Users\HYWYZ\Desktop\面试资料\源码\Netty\笔记\内存池\PoolThreadCache结构.png)

PoolThreadCache用了三个数组来缓存不同规格范围的内存，cache表示数组元素的类型是MemoryRegionCache，这个类中使用了一个Queue来保存缓存的ByteBuffer对象。并且每一类规格（tiny，small，normal）能缓存的ByteBuffer的数量也是不同的。具体到后面分析源码就能看到。

到这里，Netty内存池中一些重要对象的作用就解释完毕了，下面总结一下

Arena：代表一个内存区域。内存池使用多个Arena减少并发申请内存的冲突。内部由两个Subpage数组和多个PoolChunList组成。

PoolChunList：存储N个PoolChunk对象，并且内部的PoolChunk对象以双向链表的方式存在。

PoolChunk：真正持有内存（ByteBuffer）的对象，使用满二叉树来表示内存分配情况，默认16m，每个叶子节点能分配8k的内存。

PoolSubpage：在PoolChunk中申请不足以8k的内存时，使用该对象来管理小规格的内存分配情况。PoolChunk对象中使用subpages数组来管理哪个叶子节点被表示为PoolSubpage。在Arena中，使用SubpagePools来保存不同规格的PoolSubpage。

PoolThreadCache：每个线程拥有一个独立的PoolThreadCache对象，该对象存放在ThreadLocal中。PoolThreadCache用来缓存当前线程释放的ByteBuffer，方便下次直接从缓存中取，而不用在Arena中同步申请内存。

整个申请内存的逻辑是这样的，假设申请8k或以上（除大规格内存外）的内存，先去缓存中取，如果没有就到Arena中的PoolChunkList找到一个合适的PoolChunk，如果没有就去创建一个新的PoolChunk申请内存。

如果是小规格的内存，同样先去缓存中取，如果没有就到Arena的SubpagePools中找到一个同样规格的PoolSubpage，如果没有，就去PoolChunkList中找，后面逻辑同上。

整个Netty内存池涉及到的核心对象就分析完成了，后面几期将带大家从源码角度分析。