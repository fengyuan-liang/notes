> hot100 link: https://leetcode.cn/studyplan/top-100-liked/


# [49. 字母异位词分组](https://leetcode.cn/problems/group-anagrams/description/?envType=study-plan-v2&envId=top-100-liked)
思路：转换为哈希表，然后排序
```go 
func groupAnagrams(strs []string) (result [][]string) {
	var m = make(map[string][]string)
	for _, str := range strs {
		bytes := []byte(str)
		slices.Sort(bytes)
		sortedStr := string(bytes)
		m[sortedStr] = append(m[sortedStr], str)
	}
	for _, array := range m {
		result = append(result, array)
	}
	return
}
```

# [128. 最长连续序列](https://leetcode.cn/problems/longest-consecutive-sequence/description/?envType=study-plan-v2&envId=top-100-liked)

思路：
1. 因为是O(n)的时间复杂度，所以不能排序，这里可以用map保存每个数，然后遍历map，每个元素找number-1在不在，在就跳过（减枝），找到最长连续序列为止
2. 用bitmap先开辟【最长连续序列】最小/最大值之间的所有元素，然后把每个数字往里面塞，再找最长连续序列; 这里有个技巧，当数据不大时，用bitmap效果更好，数据大可以退化成map
   
```go
func longestConsecutive(nums []int) int {
    n := len(nums)
    if n == 0 {
        return 0
    }

    // 1. 找最小最大值
    minVal, maxVal := nums[0], nums[0]
    for _, v := range nums {
        if v < minVal {
            minVal = v
        }
        if v > maxVal {
            maxVal = v
        }
    }
    size := maxVal - minVal + 1

    // 2. 阈值：10_000_000 bits ≈ 1.25 MB，内存安全且速度极快
    if size <= 10_000_000 {
        return bitsetSolution(nums, minVal, size)
    }
    return hashsetSolution(nums, n)
}

// bitsetSolution: 使用 uint64 位图 + 块扫描
func bitsetSolution(nums []int, minVal, size int) int {
    // 计算需要的 uint64 数量（向上取整）
    wordCount := (size + 63) / 64
    bits := make([]uint64, wordCount)

    // 填充位图
    for _, num := range nums {
        pos := num - minVal
        idx := pos / 64
        shift := uint(pos & 63) // 等价于 pos % 64
        bits[idx] |= 1 << shift
    }

    maxLen := 0
    curLen := 0

    // 块扫描优化
    for i := 0; i < wordCount; i++ {
        w := bits[i]
        if w == 0xFFFFFFFFFFFFFFFF {
            // 64 位全 1，直接累加 64
            curLen += 64
            if curLen > maxLen {
                maxLen = curLen
            }
            continue
        }
        // 否则逐位检查该 uint64 的每一位
        for j := 0; j < 64; j++ {
            if (w>>j)&1 == 1 {
                curLen++
                if curLen > maxLen {
                    maxLen = curLen
                }
            } else {
                curLen = 0
            }
        }
    }
    return maxLen
}

// hashsetSolution: 标准哈希表解法（起点剪枝）
func hashsetSolution(nums []int, n int) int {
    set := make(map[int]struct{}, n)
    for _, v := range nums {
        set[v] = struct{}{}
    }

    maxLen := 0
    for num := range set {
        if _, ok := set[num-1]; ok {
            continue
        }
        cur := num
        length := 1
        for {
            if _, ok := set[cur+1]; ok {
                cur++
                length++
            } else {
                break
            }
        }
        if length > maxLen {
            maxLen = length
        }
    }
    return maxLen
}
```

# [283. 移动零](https://leetcode.cn/problems/move-zeroes/description/?envType=study-plan-v2&envId=top-100-liked)
思路：
1. 冒泡排序
2. 原地栈
3. 快慢指针

1. 冒泡排序
```go
// bubble sort
// 7 6 5 4
// 6 5 4 7
// 5 4 6 7
// 4 5 6 7
//
//	for i := 0; i < len(nums); i++ {
//			index := 0
//			for j := len(nums) - 1 - i; j > 0; j-- {
//				if nums[index] > nums[index+1] {
//					tmp := nums[index]
//					nums[index] = nums[index+1]
//					nums[index+1] = tmp
//				}
//				index++
//			}
//		}
func moveZeroes(nums []int) {
	for i := 0; i < len(nums); i++ {
		index := 0
		for j := len(nums) - 1 - i; j > 0; j-- {
			if nums[index] == 0 {
				nums[index], nums[index+1] = nums[index+1], nums[index]
			}
			index++
		}
	}
}
```

2. 原地栈
```go
func moveZeroes(nums []int) {
    stackCnt := 0
    for _, num := range nums {
        if num == 0 {
            continue
        }
        nums[stackCnt] = num
        stackCnt++
    }
    clear(nums[stackCnt:])
}
```

3. 快慢指针
```go
func moveZeroes(nums []int) {
    slow := 0  // 指向下一个非零元素应该放的位置
    for fast := 0; fast < len(nums); fast++ {
        if nums[fast] != 0 {
            // 遇到非零元素，把它交换到 slow 的位置
            nums[slow], nums[fast] = nums[fast], nums[slow]
            slow++  // slow 向后移动一位，指向下一个空位
        }
        // 如果 nums[fast] == 0，什么都不做，fast 继续向前
    }
}
```


# [11. 盛最多水的容器](https://leetcode.cn/problems/container-with-most-water/description/?envType=study-plan-v2&envId=top-100-liked)
思路：双指针，优化暴力求解中重复计算的问题
```go
func maxArea(height []int) (ans int) {
    if len(height) < 2 {
        return 0
    }
    var (
        left = 0
        right = len(height) - 1
    )
    for left < right {
        ans = max(ans, min(height[left], height[right]) * (right - left))
        if height[left] < height[right] {
            left++
        } else {
            right--
        }
    }
    return
}
```

# 三数之和

思路：枚举i，然后按照两数之和思路继续，但是这里要注意，需要处理重复元素的情况
@see [两数之和](https://blog.fengxianhub.top/#/LeetCode%E5%88%B7%E9%A2%98/2-%E6%97%A5%E5%B8%B8%E5%88%B7%E9%A2%98?id=%e5%8f%8c%e6%8c%87%e9%92%88amp%e5%a4%9a%e6%8c%87%e9%92%88)
```go
// -1,0,1,2,-1,-4
// -4 -1 -1 0 1 2
func threeSum(nums []int) (ans [][]int) {
    if len(nums) < 3 {
        return 
    }
    ans = make([][]int, 0)
	sort.Ints(nums)
    for i := 0; i < len(nums) - 2; i++ {
        // 跳过重复的元素 当前值和上一个值相等则跳过
        x := nums[i]
        if i > 0 && nums[i] == nums[i-1] {
            continue
        }
        j := i + 1
        k := len(nums) - 1
        // 变成两数之和
        for ;j < k; {
            result := nums[j] + nums[k] + x
            if result > 0 {
                k--
            } else if result < 0 {
                j++
            } else {
                ans = append(ans, []int{nums[i], nums[j], nums[k]})
                // 移动指针，继续寻找其他解
                j++
                k--
                // 跳过重复的 j 和 k
                for j < k && nums[j] == nums[j-1] {
                    j++
                }
                for j < k && nums[k] == nums[k+1] {
                    k--
                }
            }
        }
    }
    return
}
```

# [42. 接雨水](https://leetcode.cn/problems/trapping-rain-water/description/?envType=study-plan-v2&envId=top-100-liked)

思路：重点是pre_max记录左侧有效高度，post_max计算右侧有效高度，高度差就是左右两边的有效高度，再减去当前数组的高度，就是雨水的高度

```go
func trap(height []int) (ans int) {
    var (
        pre_max = make([]int, len(height))
        post_max = make([]int, len(height))
        rightIndex = len(height) - 1
        leftCnt = -1
        rightCnt = -1
    )
    for leftIndex, left := range height {
        right := height[rightIndex]
        if left > leftCnt {
            leftCnt = left
        }
        if right > rightCnt {
            rightCnt = right
        }
        pre_max[leftIndex] = leftCnt
        post_max[rightIndex] = rightCnt
        rightIndex--
    }
    for index, value := range height {
        h := min(pre_max[index], post_max[index]) - value
        if h > 0 {
            ans += h
        }
    }
    return
}
```