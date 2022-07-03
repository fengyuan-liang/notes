# Netty 内存池(二)内存申请流程

上期带大家了解了一下Netty内存池都有哪些重要的对象，以及这些对象的作用是什么，本期就带大家分析一下线程是如何申请一块内存的。本期由于涉及到了很多变量和位运算，有些变量的赋值、位运算的计算过程、内存池涉及到的对象的构造就不分析了，大家可以自行查看源码。

申请内存的入口在#NioByteUnsafe的read()方法中有一行代码

```java
byteBuf = allocHandle.allocate(allocator);
```

从allocate()方法进去一路跟踪，因为分析直接内存，最后就到了#PooledByteBufAllocator的newDirectBuffer()方法中，这个调用链大家可以自行查看。接下来直接从这个方法开始分析

```java
#PooledByteBufAllocator
protected ByteBuf newDirectBuffer(int initialCapacity, int maxCapacity) {
    
    //threadCache是PoolThreadLocalCache类型的，是Netty自己实现的一种ThreadLocal
    //把它当作普通的ThreadLocal看就行
    //在PoolThreadLocalCache的initialValue方法，会为每个线程创建一个PoolThreadCache对象
    //并且会将使用线程数量最少的Arena放到PoolThreadCache对象中，也即是PoolThreadCache持有Arena对象
    
    //从ThreadLocal中获取出PoolThreadCache缓存对象
    PoolThreadCache cache = threadCache.get();
    //获取PoolThreadCache中的Arena
    PoolArena<ByteBuffer> directArena = cache.directArena;
    final ByteBuf buf;
    if (directArena != null) {
        //通过Arena去分配一块内存
        buf = directArena.allocate(cache, initialCapacity, maxCapacity);
    } else {
        //......
    }
    return toLeakAwareBuffer(buf);
}
```

# Arena对象分配内存

```java
#PoolArena
PooledByteBuf<T> allocate(PoolThreadCache cache, int reqCapacity, int maxCapacity) {
    //到对象池中获取一个ByteBuf对象
    PooledByteBuf<T> buf = newByteBuf(maxCapacity);
    
    //为上面的buf分配内存
    allocate(cache, buf, reqCapacity);
    
    return buf;
}
```

## 从对象池获取ByteBuf对象

```java
#DirectArena
protected PooledByteBuf<ByteBuffer> newByteBuf(int maxCapacity) {
    //下面两个分支都是到同一个方法
    if (HAS_UNSAFE) {
        return PooledUnsafeDirectByteBuf.newInstance(maxCapacity);
    } else {
        return PooledDirectByteBuf.newInstance(maxCapacity);
    }
}

#PooledDirectByteBuf
static PooledUnsafeDirectByteBuf newInstance(int maxCapacity) {
    //RECYCLER和前面出站缓冲区一样，都是对象池
    //从对象池获取ByteBuf对象
    PooledUnsafeDirectByteBuf buf = RECYCLER.get();
    
    buf.reuse(maxCapacity);
    return buf;
}

#PooledByteBuf
final void reuse(int maxCapacity) {
    //设置一下当前ByteBuf的属性
    maxCapacity(maxCapacity);
    resetRefCnt();
    setIndex0(0, 0);
    discardMarks();
}
```

## 为ByteBuf对象分配内存

```java
#PoolArena
private void allocate(PoolThreadCache cache, PooledByteBuf<T> buf, final int reqCapacity) {
    //将reqCapacity转为Netty定义的规格，方便后面计算，内部源码和ConcurrentHashMap的tableSizeFor相似
    final int normCapacity = normalizeCapacity(reqCapacity);
    
    //判断内存是否为tiny或small规格
    if (isTinyOrSmall(normCapacity)) { // capacity < pageSize
        //SubpagePools的下标
        int tableIdx;
        //SubpagePools的引用
        PoolSubpage<T>[] table;
        
        //判断是否为tiny
        boolean tiny = isTiny(normCapacity);
        
        if (tiny) { // < 512
            //执行到这，说明是tiny类型
            
            //从缓存中申请tiny规格的内存，缓存逻辑后面再分析
            if (cache.allocateTiny(this, buf, reqCapacity, normCapacity)) {
                //执行到这，说明申请成功，直接返回
                return;
            }
            
            //执行到这，说明缓存申请失败

            //计算当前规格在tinySubpagePools中的下标
            //tinySubpagePools是Arena中保存的子页数组，上期分析过
            tableIdx = tinyIdx(normCapacity);
            
			//将tinySubpagePools赋值给table
            table = tinySubpagePools;
            
        } else {// 否则就是 small
            //small规格，逻辑和tiny一样
            // 和tiny 的雷同。
            if (cache.allocateSmall(this, buf, reqCapacity, normCapacity)) {
                return;
            }
            tableIdx = smallIdx(normCapacity);
            table = smallSubpagePools;
        }
        
        //执行到这，tableIdx计算出来了当前内存规格在SubpagePools中的下标
        //table是对应的SubpagePools数组
        
        //获取对应规格桶位的头节点
        final PoolSubpage<T> head = table[tableIdx];
        
        //因为Arena是共享给多个线程申请内存，所以需要同步
        //SubpagePools桶位头节点就是用来加锁同步
        synchronized (head) {
            
            //这里解释一下，Arena中两个SubpagePools的头节点在创建时，
            //prev和next指针都会指向head
            
            //获取head.next，如果只有head节点，那么s指向的是head
            final PoolSubpage<T> s = head.next;
            
            //判断是否有PoolSubpage
            if (s != head) {
                //执行到这，说明head后面有子页，可以分配内存
                assert s.doNotDestroy && s.elemSize == normCapacity;
                //分配内存逻辑
                long handle = s.allocate();
                assert handle >= 0;
                //从PoolSubpage分配内存，后面有逻辑和这一样
                s.chunk.initBufWithSubpage(buf, null, handle, reqCapacity);
                incTinySmallAllocation(tiny);
                return;
            }
        }
        
        // 执行到这，说明SubpagePools不能分配当前规格的内存
        //要去PoolChunk中分配
        //锁当前Arena对象
        synchronized (this) {
            //从PoolChunk上分配内存
            allocateNormal(buf, reqCapacity, normCapacity);
        }
        //在Arena内部记录一下分配了多少次的tiny或small规格的内存
        incTinySmallAllocation(tiny);
        return;
    }
    //以上的逻辑是分配tiny或small
    
    //判断是否为normal类型，默认就是8k~16m
    if (normCapacity <= chunkSize) {
        
        //缓存分配
        if (cache.allocateNormal(this, buf, reqCapacity, normCapacity)) {
            return;
        }
        
        //从PoolChunk上分配内存，锁当前Arena
        synchronized (this) {
            //分配内存逻辑
            allocateNormal(buf, reqCapacity, normCapacity);
            //记录分配了多少次Normal规格的内存
            ++allocationsNormal;
        }
    }
    
    //判断是否为huge规格，>16m
    else {
        allocateHuge(buf, reqCapacity);
    }
}
```

上面这个方法，就是根据线程申请的内存规格，然后进行不同的内存分配逻辑，除了缓存以外，可以分为以下几个分支：1.initBufWithSubpage，从SubpagePools上分配内存；2.allocateNormal从PoolChunk上分配内存；3.allocateHuge分配Huge规格。

initBufWithSubpage的实现会在allocateNormal中被调用到，allocateHuge内部就只是分配非池化的Chunk，所以就不单独拿出来分析了。

### allocateNormal()

我们先分析Normal规格的，毕竟SubpagePools不能分配tiny或small时也是走这个逻辑，比较通用

```java
#PoolArena
private void allocateNormal(PooledByteBuf<T> buf, int reqCapacity, int normCapacity) {
    
    //Arena的PoolChunkList
    //首先尝试从PoolChunkList上进行分配，后面再分析
    if (q050.allocate(buf, reqCapacity, normCapacity) || q025.allocate(buf, reqCapacity, normCapacity) ||
        q000.allocate(buf, reqCapacity, normCapacity) || qInit.allocate(buf, reqCapacity, normCapacity) ||
        q075.allocate(buf, reqCapacity, normCapacity)) {
        return;
    }
    
    //执行到这，说明PoolChunkList不能分配当前规格的内存
    
    //创建一个新的PoolChunk
    PoolChunk<T> c = newChunk(pageSize, maxOrder, pageShifts, chunkSize);
    //从新创建的PoolChunk上分配内存
    boolean success = c.allocate(buf, reqCapacity, normCapacity);
    assert success;
    //将新建的PoolChunk加入到qInit内
    qInit.add(c);
}
```

#### **创建PoolChunk**

```java
#DirectArena
protected PoolChunk<ByteBuffer> newChunk(int pageSize, int maxOrder,
        int pageShifts, int chunkSize) {
    
    if (directMemoryCacheAlignment == 0) {
        //默认都是走这个分支
        //创建PoolChunk
        //第二个参数allocateDirect(chunkSize)
        //真正的申请内存，返回ByteBuffer对象
        return new PoolChunk<ByteBuffer>(this,
                allocateDirect(chunkSize), pageSize, maxOrder,
                pageShifts, chunkSize, 0);
    }
    //......
}

#PoolChunk
PoolChunk(PoolArena<T> arena, T memory, int pageSize, int maxOrder, int pageShifts, int chunkSize, int offset) {
    //当前PoolChunk属于池化内存
    unpooled = false;
    //当前PoolChunk归属的Arena
    this.arena = arena;
    //真正的内存,ByteBuffer对象。注意：可以是heap也可以是direct内存
    this.memory = memory;
    //页面大小，8k
    this.pageSize = pageSize;
    //页面偏移量，13，后面要计算
    this.pageShifts = pageShifts;
    //满二叉树最大深度，11
    this.maxOrder = maxOrder;
    //PoolChunk的内存容量，默认16m
    this.chunkSize = chunkSize;
    //当前PoolChunk使用的内存偏移量，现在为0，因为还未使用
    this.offset = offset;
    //表示不能分配内存的深度值，12
    unusable = (byte) (maxOrder + 1);
    //24
    log2ChunkSize = log2(chunkSize);
    //这个值后面会用来计算当前规格是否为子页，可以自己计算一下
    // 1111 1111 1111 1111 11110 0000 0000 0000
    subpageOverflowMask = ~(pageSize - 1);
    //空闲内存字节数，16*1024*1024
    freeBytes = chunkSize;
    
    assert maxOrder < 30 : "maxOrder should be < 30, but is: " + maxOrder;
    
    //表示一个PoolChunk最多能分配多少个子页
    // 1 << 11 == 2048，也就是满二叉树的2048个叶子节点
    maxSubpageAllocs = 1 << maxOrder;
    
    //数组，表示满二叉树当前节点的深度值
    memoryMap = new byte[maxSubpageAllocs << 1];
    //表式当前节点初始的深度值
    depthMap = new byte[memoryMap.length];
    //为什么要有两个数组？
    //depthMap是做为一个参考值，最开始赋值后就不会再变化
    //memoryMap初始和depthMap相同，但是当PoolChunk分配内存后，就要修改节点的深度值
    //所以使用两个数组，一个表示当前节点的深度值，一个表示初始值供参考用
    
    //初始下标为1，根节点下标为1
    int memoryMapIndex = 1;
    for (int d = 0; d <= maxOrder; ++ d) { // move down the tree one level at a time
        //计算每一层的最左边节点的下标
        // 1 , 2 , 4 ...... 2048
        int depth = 1 << d;
        for (int p = 0; p < depth; ++ p) {
            //为每个节点赋初始深度值
            memoryMap[memoryMapIndex] = (byte) d;
            depthMap[memoryMapIndex] = (byte) d;
            memoryMapIndex ++;
        }
    }
    //PoolChunk中的Subpage数组，用来表示哪一个叶子节点做为Subpage分配内存
    //maxSubpageAllocs == 2048
    subpages = newSubpageArray(maxSubpageAllocs);
    cachedNioBuffers = new ArrayDeque<ByteBuffer>(8);
}
```

#### **分配内存逻辑**

```java
#PoolChunk
boolean allocate(PooledByteBuf<T> buf, int reqCapacity, int normCapacity) {
    final long handle;
    //subpageOverflowMask =>    1111 1111 1111 1111 1110 0000 0000 0000
    //normal规格的内存一定大于等于  0000 0000 0000 0000 0010 0000 0000 0000
    //所以这个 & 运算可以判断申请的内存规格是否为normal
    if ((normCapacity & subpageOverflowMask) != 0) { // >= pageSize
        //分配normal规格的内存
        handle =  allocateRun(normCapacity);
    }
    
    //分配subpage的内存
    else {
        //分配tiny或small规格的内存
        handle = allocateSubpage(normCapacity);
    }
    
    //handle == -1 ，说明内存分配失败
    if (handle < 0) {
        return false;
    }
    
    //cachedNioBuffers是PoolChunk的一个缓存ByteBuffer的队列
    ByteBuffer nioBuffer = cachedNioBuffers != null ? cachedNioBuffers.pollLast() : null;
    
    //为buf初始化内存
    //上面两个分支得到的handle结果不同，在这内部会通过handle来计算一些参数
    initBuf(buf, nioBuffer, handle, reqCapacity);
    return true;
}
```

上面又分为了两种不同的情况，下面一一分析

##### *allocateRun()*

```java
#PoolChunk
private long allocateRun(int normCapacity) {
    //计算申请normCapacity大小的内存，需要的满二叉树节点深度值是多少
    int d = maxOrder - (log2(normCapacity) - pageShifts);
    //根据深度值，从满二叉树找到一个合适的节点的数组下标
    int id = allocateNode(d);
    
    if (id < 0) {
        //说明本次申请失败
        return id;
    }
    
    //执行到这，说明内存申请成功
    //更新PoolChunk的空闲内存大小
    freeBytes -= runLength(id);
    //返回满二叉树的节点的下标
    return id;
}

#PoolChunk
//d：本次申请内存所需的深度值
private int allocateNode(int d) {
    //满二叉树下标从1开始
    int id = 1;
    
    //计算出一个补码，高位为1，后面 d 位为0
    int initial = - (1 << d); // has last d bits = 0 and rest all = 1
    //查询当前根节点的深度值
    byte val = value(id);
    
    //如果根节点的深度值大于本次申请内存所需要的深度值，说明已经不足以分配这次的内存
    if (val > d) { // unusable
        return -1;
    }
    
    //这个循环就是找到一个合适节点来分配内存
    //循环条件自行举例计算一下
    while (val < d || (id & initial) == 0) {
        //每一轮向下一层查找节点
        id <<= 1;
        //当前节点的深度值
        val = value(id);
        //如果当前节点不能分配
        if (val > d) {
            //伙伴算法，找兄弟节点
            // 2048^1=2049  2049^1=2048 
            id ^= 1;
            val = value(id);
        }
    }
    //上面这个循环保证可以找到一个能够分配当前内存的节点下标
    
    //获取这个节点的深度值
    byte value = value(id);
    assert value == d && (id & initial) == 1 << d : String.format("val = %d, id & initial = %d, d = %d",
            value, id & initial, d);
    //这个节点分配完内存后，把深度标记为12，即不可分配内存
    setValue(id, unusable); // mark as unusable
    //更新父节点内存分配能力的深度值
    updateParentsAlloc(id);
    return id;
}

#PoolArena
private void updateParentsAlloc(int id) {
    //从子节点向上更新父节点的深度值
    while (id > 1) {
        //获取父节点的下标
        int parentId = id >>> 1;
        //获取当前节点的深度值
        byte val1 = value(id);
        //获取当前节点的兄弟节点的深度值
        byte val2 = value(id ^ 1);
        //判断两个子节点间谁的深度值小
        byte val = val1 < val2 ? val1 : val2;
        //将父节点的深度值改为小的
        //举例：左子节点为12 右子节点为11 那么父节点要设置为11，代表还能分配8k内存
        setValue(parentId, val);
        id = parentId;
    }
}
```

以上的逻辑就是从满二叉树中查找合适的节点进行内存的分配，要注意，最后allocateRun的返回值，handle，是满二叉树节点的下标。

##### *allocateSubpage()*

```java
#PoolChunk
private long allocateSubpage(int normCapacity) {
    
    //从Arena的SubpagePools中拿到一个head节点，这个方法自行查看下，不是很难
    PoolSubpage<T> head = arena.findSubpagePoolHead(normCapacity);
    
    //最大的深度值，11 
    //因为subpage只能从叶子节点上取
    int d = maxOrder; // subpages are only be allocated from pages i.e., leaves
    
    //锁头节点
    synchronized (head) {
        
        //根据深度值d，找到一个合适的节点的下标，上面分析过
        int id = allocateNode(d);
        
        //申请内存失败
        if (id < 0) {
            return id;
        }
        
        //执行到这，说明已经找到了合适的节点来分配
        
        //获取当前Chunk对象上的PoolSubpage数组
        final PoolSubpage<T>[] subpages = this.subpages;
        //页大小，8k
        final int pageSize = this.pageSize;
        //更新Chunk的空闲内存
        freeBytes -= pageSize;
        
        //叶子节点的取值范围在2048~4095，但是Chunk内的PoolSubpage数组长度为2048
        //这个方法就是将叶子节点的下标转为PoolSubpage数组的下标
        int subpageIdx = subpageIdx(id);
        
        //获取PoolSubpage数组指定下标的subpage
        PoolSubpage<T> subpage = subpages[subpageIdx];
        
        //subpage只有在分配小规格内存时才会创建出来
        if (subpage == null) {
            //执行到这，说明该叶子节点是第一次创建subpage
            //第6个参数normCapacity，是规格
            subpage = new PoolSubpage<T>(head, this, id, runOffset(id), pageSize, normCapacity);
            //将创建出来的PoolSubpage放入到对应叶子节点的下标处
            subpages[subpageIdx] = subpage;
        } else {
            //如果该叶子节点已经创建了PoolSubpage，就从这上面分配
            subpage.init(head, normCapacity);
        }
        return subpage.allocate();
    }
}
```

我们先来看看PoolSubpage的创建过程。

```java
#PoolSubpage
PoolSubpage(PoolSubpage<T> head, PoolChunk<T> chunk, int memoryMapIdx, int runOffset, int pageSize, int elemSize) {
    this.chunk = chunk;
    this.memoryMapIdx = memoryMapIdx;
    this.runOffset = runOffset;
    this.pageSize = pageSize;
    //PoolSubpage中的bitmap，前一期有分析
    //8k >>> 10 == 8
    bitmap = new long[pageSize >>> 10];
    init(head, elemSize);
}

#PoolSubpage
void init(PoolSubpage<T> head, int elemSize) {
    doNotDestroy = true;
    //保存规格
    this.elemSize = elemSize;
    if (elemSize != 0) {
        //计算出8k能分配多少个elemSize规格的内存
        maxNumElems = numAvail = pageSize / elemSize;
        //下一个可用的位图索引
        nextAvail = 0;
        
        //maxNumElems >>> 6 == maxNumElems/64
        //找到位图数组的下标
        bitmapLength = maxNumElems >>> 6;
        
        //解决余数
        if ((maxNumElems & 63) != 0) {
            //让数组长度+1
            bitmapLength ++;
        }
        //初始化位图
        for (int i = 0; i < bitmapLength; i ++) {
            bitmap[i] = 0;
        }
    }
    //头插法，将当前PoolSubpage插入到Arena的SubpagePools的链表上
    //内部自行查看
    addToPool(head);
}
```

接着看一下分配内存的逻辑

```java
#PoolSubpage
long allocate() {
    if (elemSize == 0) {
        return toHandle(0);
    }
    //numAvail在init中进行了赋值，表示当前Subpage对象还能分配多少个规格的内存
    if (numAvail == 0 || !doNotDestroy) {
        //分配失败
        return -1;
    }
    
    //获取下一个未使用的位图索引
    final int bitmapIdx = getNextAvail();
    
    //计算出这个索引在bitmap的哪个桶位中
    int q = bitmapIdx >>> 6;

    //计算出这个索引在当前桶位的哪一个位
    int r = bitmapIdx & 63;
    assert (bitmap[q] >>> r & 1) == 0;
    
    //更新这一位
    bitmap[q] |= 1L << r;
    
    //因为刚分配了一个，所以numAvail要-1
    if (-- numAvail == 0) {
        //执行到这，说明当前Subpage已经不能分配内存了
        //从Arena的SubpagePools中移除自身
        //自行查看
        removeFromPool();
    }
    //计算handle返回给上层
    return toHandle(bitmapIdx);
}
```

**获取下一个未使用的位图索引**

```java
#PoolSubpage
private int getNextAvail() {
    //初始值为0
    int nextAvail = this.nextAvail;
    if (nextAvail >= 0) {
        //为什么要设置为-1?
        //PoolSubpage第一次分配内存时，初始下标一定为0，所以不需要去下面的方法里找起始位置
        this.nextAvail = -1;
        //设置为-1后，下一次就会绕过这个if块，到下面的方法中查找起始位置
        return nextAvail;
    }
    // 执行到这，说明nextAvail == -1
    return findNextAvail();
}

private int findNextAvail() {
    final long[] bitmap = this.bitmap;
    //位图有效长度
    final int bitmapLength = this.bitmapLength;
    for (int i = 0; i < bitmapLength; i ++) {
        //获取位图当前桶位的值
        long bits = bitmap[i];
        
        //如果bits已经分配满了，那么64位都是1，取反为0
        //如果bits还未满，一定有N位是0，取反!=0
        if (~bits != 0) {
            //执行到这，说明当前桶位还未分配完
            //找到位图中合适的分配索引
            return findNextAvail0(i, bits);
        }
    }
    //说明分配不了
    return -1;
}

//i：位图数组的下标
//bits：bitmap[i]
private int findNextAvail0(int i, long bits) {
    //当前PoolSubpage最大分配数
    final int maxNumElems = this.maxNumElems;
    //计算出当前桶位的位图起始值
    //举例：bitmap[0]从0开始，bitmap[1]从64开始
    final int baseVal = i << 6;
    
    for (int j = 0; j < 64; j ++) {
        
        //这个条件用来判断bits当前这一位是否可以分配，配合后面的bits>>>=1来看
        if ((bits & 1) == 0) {
            //执行到这，说明当前位已经可以分配了，j就代表了当前位
            //下面这个计算相当于baseVal+j，可以计算出当前索引在全局bitmap中的下标
            int val = baseVal | j;
            //判断当前位数是否超过PoolSubpage的最大分配数
            if (val < maxNumElems) {
                //分配成功，返回这个位索引
                return val;
            }
            else {
                //当前PoolSubpage不能继续分配
                break;
            }
        }
        //当前这一位不能分配的话，右移1位，相当于从右往左找到合适的索引
        bits >>>= 1;
    }
    return -1;
}
```

以上的逻辑，就是从全局的bitmap中找到合适的桶位的long值，然后从long值找到合适的位来分配内存。大家可以自行构造数据来进行这些计算。

**计算handle**

```java
//bitmapIdx：经过上面的逻辑，该变量保存了bitmap全局的位索引
//举例：分配16byte，bitmapIdx==66，那么它表示bitmap[1]这个long值的第3位，忽略高位 0111
private long toHandle(int bitmapIdx) {
    //0x4000000000000000L转换为2进制，是一个long值，除了第63位为1，其他位都为0
    //这个计算相当于将bitmaIdx和memoryMapIdx信息整合在一个long上面，并且第63位是一个标识位1
    return 0x4000000000000000L | (long) bitmapIdx << 32 | memoryMapIdx;
}
```

上面这个位运算得出来的handle，高32位保存了本次申请内存的bitmap的全局索引，并且还带有一个标识位，低32位保存了当前PoolSubpage对应满二叉树的哪个叶子节点。

让我们再回到主逻辑

##### *initBuf()*

```java
#PoolChunk
boolean allocate(PooledByteBuf<T> buf, int reqCapacity, int normCapacity) {
    final long handle;
    if ((normCapacity & subpageOverflowMask) != 0) { // >= pageSize
        //返回的是满二叉树的节点下标
        handle =  allocateRun(normCapacity);
    }
    else {
        //高32位表示在bitmap的索引，低32位标识满二叉树的节点下标
        //并且第63位有一个标识位
        //这个标识位就是用来区分上面的if逻辑的返回值，如果在bitmap的索引为0，
        //就分不清到底是满二叉树分配内存，还是PoolSubpage分配内存了
        handle = allocateSubpage(normCapacity);
    }
    if (handle < 0) {
        return false;
    }
    ByteBuffer nioBuffer = cachedNioBuffers != null ? cachedNioBuffers.pollLast() : null;
    initBuf(buf, nioBuffer, handle, reqCapacity);
    return true;
}

void initBuf(PooledByteBuf<T> buf, ByteBuffer nioBuffer, long handle, int reqCapacity) {
    //内部是 (int)handle，取出handle的低32位，就是获取满二叉树的节点下标
    int memoryMapIdx = memoryMapIdx(handle);
    //内部取高32位，就是bitmapIdx，对于allocateRun无意义
    int bitmapIdx = bitmapIdx(handle);
    
    //根据高32位来判断是allocateRun还是allocateSubpage
    if (bitmapIdx == 0) {
        //allocateRun，分配8k或以上
        //获取该节点的深度值
        byte val = value(memoryMapIdx);
        assert val == unusable : String.valueOf(val);
        //内部就是对该buf进行赋值
        //主要是 runOffset(memoryMapIdx) + offset 
        //offset是当前Chunk对象的未使用起始偏移量，runOffset(memoryMapIdx)获取当前节点的偏移量
        //所以最终会计算出buf在Chunk对象上的起始偏移量
        //reqCapacity是业务请求的内存大小
        //runLength(memoryMapIdx)是buf能使用的最大内存
        buf.init(this, nioBuffer, handle, runOffset(memoryMapIdx) + offset,
                reqCapacity, runLength(memoryMapIdx), arena.parent.threadCache());
    }
    else {
        //allocateSubpage，分配小规格
        initBufWithSubpage(buf, nioBuffer, handle, bitmapIdx, reqCapacity);
    }
}

private void initBufWithSubpage(PooledByteBuf<T> buf, ByteBuffer nioBuffer,
                                long handle, int bitmapIdx, int reqCapacity) {
    assert bitmapIdx != 0;
    //获取叶子节点的下标
    int memoryMapIdx = memoryMapIdx(handle);
    //获取PoolSubpage
    PoolSubpage<T> subpage = subpages[subpageIdx(memoryMapIdx)];
    assert subpage.doNotDestroy;
    assert reqCapacity <= subpage.elemSize;
    //(bitmapIdx & 0x3FFFFFFF)，在前面bitmapIdx还有一个标识位，这个位运算能消除标识位
    buf.init(
        this, nioBuffer, handle,
        runOffset(memoryMapIdx) + (bitmapIdx & 0x3FFFFFFF) * subpage.elemSize + offset,
            reqCapacity, subpage.elemSize, arena.parent.threadCache());
}
```

到这里，内存分配的逻辑就分析完了。现在只差从缓存和PoolChunkList中分配内存的逻辑了，下面继续说。

# 缓存中分配内存

```java
#PoolThreadCache
boolean allocateNormal(PoolArena<?> area, PooledByteBuf<?> buf, int reqCapacity, int normCapacity) {
    return allocate(cacheForNormal(area, normCapacity), buf, reqCapacity);
}

boolean allocateSmall(PoolArena<?> area, PooledByteBuf<?> buf, int reqCapacity, int normCapacity) {
    return allocate(cacheForSmall(area, normCapacity), buf, reqCapacity);
}

boolean allocateTiny(PoolArena<?> area, PooledByteBuf<?> buf, int reqCapacity, int normCapacity) {
    return allocate(cacheForTiny(area, normCapacity), buf, reqCapacity);
}
```

缓存对象分配内存的逻辑最终实现是一样的，仅仅只是传参的不同。cacheForNormal这一系列的方法，会返回对应规格的MemoryRegionCache对象，不记得的可以回到上期看看。

```java
#PoolThreadCache
private boolean allocate(MemoryRegionCache<?> cache, PooledByteBuf buf, int reqCapacity) {
    if (cache == null) {
        //缓存为null
        return false;
    }
    boolean allocated = cache.allocate(buf, reqCapacity);
    //allocations分配次数
    //freeSweepAllocationThreshold缓存使用的阈值
    //当从缓存分配的次数达到阈值时，需要清理缓存，将缓存释放
    if (++ allocations >= freeSweepAllocationThreshold) {
        allocations = 0;
        //释放缓存的逻辑，自行查看
        trim();
    }
    return allocated;
}

#MemoryRegionCache
public final boolean allocate(PooledByteBuf<T> buf, int reqCapacity) {
    //MemoryRegionCache对象内部有一个队列，用来缓存
    //Entry和出站缓冲区的Entry功能类似，对象池
    Entry<T> entry = queue.poll();
    if (entry == null) {
        return false;
    }
    //初始化buf
    initBuf(entry.chunk, entry.nioBuffer, entry.handle, buf, reqCapacity);
    //回收Entry对象
    entry.recycle();
    ++ allocations;
    return true;
}
```

# PoolChunkList分配内存

```java
#PoolArena
private void allocateNormal(PooledByteBuf<T> buf, int reqCapacity, int normCapacity) {
    //随便看一个
    if (q050.allocate(buf, reqCapacity, normCapacity) || q025.allocate(buf, reqCapacity, normCapacity) ||
        q000.allocate(buf, reqCapacity, normCapacity) || qInit.allocate(buf, reqCapacity, normCapacity) ||
        q075.allocate(buf, reqCapacity, normCapacity)) {
        return;
    }
    //......
}

#PoolChunkList
boolean allocate(PooledByteBuf<T> buf, int reqCapacity, int normCapacity) {
    //判断申请的内存大小是否超过了PoolChunkList管理的内存大小
    if (normCapacity > maxCapacity) {
        return false;
    }
    //遍历PoolChunkList中的PoolChunk对象
    for (PoolChunk<T> cur = head; cur != null; cur = cur.next) {
        //前面分析过
        if (cur.allocate(buf, reqCapacity, normCapacity)) {
            //判断当前的PoolChunk是否超过的PoolChunkList管理的内存区间
            if (cur.usage() >= maxUsage) {
                //移除当前PoolChunk
                remove(cur);
                //加入到下一个PoolChunkList中
                nextList.add(cur);
            }
            return true;
        }
    }
    return false;
}
```

从缓存或PoolChunkList分配内存的大体逻辑就是这样，一些细节大家自行查看。下面总结一下，这张图代表了内存池申请内存的流程

![](C:\Users\HYWYZ\Desktop\面试资料\源码\Netty\笔记\内存池\内存分配流程.png)

到这里，内存申请流程就分析完了，内部涉及到一些变量赋值，位运算的地方，大家就自己去看看，动手算一下。整个流程下来也不是特别难，只是涉及到的对象比较多，然后一些巧妙的位运算不拿笔画一下就看不懂什么意思。如果还是不太明白的，可以下载源码写下注释，然后再自己跟一遍流程，相信大家很快就能理解。