# Netty 内存池(三)内存释放流程

上一期我们分析了内存申请的流程，本期就来分析一下内存归还释放的流程。

逻辑入口在#PooledByteBuf对象的deallocate()方法

```java
protected final void deallocate() {
	//handle，这个字段就是#PoolChunk的allocate方法中计算出来的值，具体有两个分支
	//当它>=0的时候表示当前PooledByteBuf对象是持有内存的
	if (handle >= 0) {
	    final long handle = this.handle;
	    //释放内存，将handle改为-1
	    this.handle = -1;
	    //真正持有内存的字段
	    memory = null;
	    //通过arena对象释放内存
	    chunk.arena.free(chunk, tmpNioBuf, handle, maxLength, cache);
		//释放完内存后，将属性都置null
	    tmpNioBuf = null;
	    chunk = null;
		//归还到对象池
	    recycle();
    }
}
```

真正的释放逻辑在arena对象中实现，跟进去

```java
#PoolArena
void free(PoolChunk<T> chunk, ByteBuffer nioBuffer, long handle, int normCapacity, PoolThreadCache cache) {
    //判断chunk是否是池化内存，申请huge规格的就是非池化
    if (chunk.unpooled) {
        int size = chunk.chunkSize();
        //释放内存
        destroyChunk(chunk);
        //更新当前arena分配huge规格的容量
        activeBytesHuge.add(-size);
        //释放次数+1
        deallocationsHuge.increment();
    }
    else {
        //其他规格走这个逻辑
        //获取规格的枚举类型
        SizeClass sizeClass = sizeClass(normCapacity);
        //将内存添加到PoolThreadCache对象中缓存
        if (cache != null && cache.add(this, chunk, nioBuffer, handle, normCapacity, sizeClass)) {
            // cached so not free it.
            return;
        }
        //执行到这，说明缓存失败了，执行真正的释放逻辑
        freeChunk(chunk, handle, sizeClass, nioBuffer, false);
    }
}

#PoolArena
void freeChunk(PoolChunk<T> chunk, long handle, SizeClass sizeClass, ByteBuffer nioBuffer, boolean finalizer) {
    final boolean destroyChunk;
    //真正释放需要加锁
    synchronized (this) {
        if (!finalizer) {
            //记录一下每个规格的释放次数
            switch (sizeClass) {
                case Normal:
                    ++deallocationsNormal;
                    break;
                case Small:
                    ++deallocationsSmall;
                    break;
                case Tiny:
                    ++deallocationsTiny;
                    break;
                default:
                    throw new Error();
            }
        }
        //chunk.parent就是chunk所属的PoolChunkList
        destroyChunk = !chunk.parent.free(chunk, handle, nioBuffer);
    }
    if (destroyChunk) {
        //当PoolChunkList的前驱为null，上面chunk.parent.free(chunk, handle, nioBuffer)会返回false
        //会到当前逻辑回收整块chunk
        destroyChunk(chunk);
    }
}

#PoolChunkList
boolean free(PoolChunk<T> chunk, long handle, ByteBuffer nioBuffer) {
    //释放内存
    chunk.free(handle, nioBuffer);
    //判断当前chunk的使用率是否达到了当前PoolChunkList的最小值
    if (chunk.usage() < minUsage) {
        //从当前PoolChunkList中移除
        remove(chunk);
        //将chunk移动到合适使用率的PoolChunkList中
        return move0(chunk);
    }
    //执行到这，说明chunk未移动，还是在当前PoolChunkList中
    return true;
}

#PoolChunk
void free(long handle, ByteBuffer nioBuffer) {
    //根据handle，计算满二叉树的数组下标
    int memoryMapIdx = memoryMapIdx(handle);
    //计算subpage规格的位图下标
    int bitmapIdx = bitmapIdx(handle);
    //判断当前内存属于哪种规格
    if (bitmapIdx != 0) { // free a subpage
        //获取当前内存所归属的subpage
        PoolSubpage<T> subpage = subpages[subpageIdx(memoryMapIdx)];
        assert subpage != null && subpage.doNotDestroy;
        //PoolSubpage分配后，会放在arena对象的SubpagePools中，找到对应桶位的头节点
        PoolSubpage<T> head = arena.findSubpagePoolHead(subpage.elemSize);
        //锁头节点
        synchronized (head) {
            //bitmapIdx & 0x3FFFFFFF 会消除高位，拿到叶子节点在数组中的下标
            //具体计算看上期
            if (subpage.free(head, bitmapIdx & 0x3FFFFFFF)) {
                //上面这个方法，如果整个subpage的内存都释放完了，返回false
                //执行到这，说明subpage仍有部分内存被占用了
                return;
            }
        }
    }
    //执行到这，
    //1.规格为normal
    //2.上面的subpage已经释放完了，是一页整(8k)
    
    //更新空闲内存大小
    freeBytes += runLength(memoryMapIdx);
    //更新节点的分配深度能力值
    setValue(memoryMapIdx, depth(memoryMapIdx));
    //恢复父节点的深度值
    updateParentsFree(memoryMapIdx);
    if (nioBuffer != null && cachedNioBuffers != null &&
            cachedNioBuffers.size() < PooledByteBufAllocator.DEFAULT_MAX_CACHED_BYTEBUFFERS_PER_CHUNK) {
        cachedNioBuffers.offer(nioBuffer);
    }
}
```

上面这个方法，我们分两个部分来看，首先是subpage释放内存

```java
#PoolSubpage
boolean free(PoolSubpage<T> head, int bitmapIdx) {
    if (elemSize == 0) {
        return true;
    }
    //下面就是计算在bitmap数组的哪一个桶位，对应long值的某一位
    int q = bitmapIdx >>> 6;
    int r = bitmapIdx & 63;
    assert (bitmap[q] >>> r & 1) != 0;
    //将位图的位数置0，表示释放内存
    bitmap[q] ^= 1L << r;
    //设置nextAbail变量，表示下次申请时，不需要计算，通过该变量就能直接分配了
    setNextAvail(bitmapIdx);
    
    if (numAvail ++ == 0) {
        //numAvail==0，说明当前subpage已经分配完了
    	//但此时时释放逻辑，所以subpage又能分配内存，将它重新放入arena的SubpagePools中
        addToPool(head);
        return true;
    }
    
    if (numAvail != maxNumElems) {
        //说明subpage在SubpagePools中
        return true;
    }
    else {
        //说明subpage并未使用
        
        if (prev == next) {
            // Do not remove if this subpage is the only one left in the pool.
            return true;
        }
        //销毁当前subpage
        doNotDestroy = false;
        //从arena出队
        removeFromPool();
        //因为subpage并未使用，需要将subpage释放到chunk中
        return false;
    }
}
```

另一部分就是释放子节点的内存后，需要恢复父节点的深度值

```java
#PoolChunk
private void updateParentsFree(int id) {
    //当前节点原本的深度值+1
    int logChild = depth(id) + 1;
    while (id > 1) {
        //获取父节点下标
        int parentId = id >>> 1;
        //获取当前节点深度值
        byte val1 = value(id);
        //获取兄弟节点深度值
        byte val2 = value(id ^ 1);
        //-1，变成当前节点原本的深度值
        logChild -= 1; // in first iteration equals log, subsequently reduce 1 from logChild as we traverse up
        //当前节点和兄弟节点的深度值都是原本的值，说明父节点也要恢复到原本的深度值
        if (val1 == logChild && val2 == logChild) {
            //父节点是子节点的深度值-1
            setValue(parentId, (byte) (logChild - 1));
        }
        else {
            //说明子节点并未全部都释放内存
            byte val = val1 < val2 ? val1 : val2;
            //将父节点的深度值设置为子节点中小的那一个
            setValue(parentId, val);
        }
        //将当前节点指向父节点，向上恢复
        id = parentId;
    }
}
```

