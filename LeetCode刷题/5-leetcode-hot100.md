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





# [3. 无重复字符的最长子串](https://leetcode.cn/problems/longest-substring-without-repeating-characters/)

```go
func lengthOfLongestSubstring(s string) int {
	var (
		m           = make(map[rune]bool)
		array       = []rune(s)
		length = len(array)
		maxLength   = 0
		left, right = 0, 0
	)
	for left < length &&  right < length {
		if !m[array[right]] {
			// 添加
			m[array[right]] = true
			right++
			if right - left > maxLength {
				maxLength = right - left
			}
		} else {
			// 存在
			delete(m, array[left])
			left++
		}
	}
	return maxLength
}
```



# [438. 找到字符串中所有字母异位词](https://leetcode.cn/problems/find-all-anagrams-in-a-string/)

```go
// 方法一，暴力解法，枚举所有子字符串，并且统计每个字符出现的频率
// 时间复杂度：O(m * n)
// 空间复杂度 O(n) 这里可以把array数组优化掉
func findAnagrams(s string, p string) (ans []int) {
	var (
		array = []rune(s)
		m     = make(map[rune]struct{})
	)
	// 统计每个单词出现的次数
	cntP := [26]int{}
	for _, c := range p {
		cntP[c-'a']++
	}
	for _, val := range p {
		m[val] = struct{}{}
	}
	hit := func(chars []rune) bool {
        // 值类型 会直接复制
		clone := cntP
		for _, ch := range chars {
			clone[ch-'a']--
			if _, ok := m[ch]; !ok {
				return false
			}
		}
		// 检查是否所有字符串都匹配
		for _, val := range clone {
			if val != 0 {
				return false
			}
		}
		return true
	}
	// 枚举所有字串
	for i := 0; i <= len(array)-len(p); i++ {
		if hit(array[i : i+len(p)]) {
			ans = append(ans, i)
		}
	}
	return
}

// 方法二，定长滑窗
// 相当于暴力 时间复杂度 O(m*n)
func findAnagrams(s string, p string) (ans []int) {
	var (
		// 这里map可以用数组替换 cntP := [26]int{} 
		cntM = make(map[uint8]int)
		cntP = make(map[uint8]int)
	)
	for i := 0; i < len(p); i++ {
		cntM[p[i]]++
	}
	mapEqual := func(a, b map[uint8]int) bool {
		if maps.Equal(a, b) {
			return true
		}
		for k, v := range a {
			if v != b[k] {
				return false
			}
		}
		return true
	}
	for i := range s {
		ch := s[i]
		cntP[ch]++
		if i < len(p)-1 {
			continue
		}
		// 判断字串是否满足要求
		if mapEqual(cntM, cntP) {
			ans = append(ans, i-len(p)+1)
		}
		// 左边弹出出一个
		cntP[s[i-len(p)+1]]--
	}
	return
}

// TODO@lfy 不定长滑动窗口
```

>双指针（滑动窗口）依赖于**窗口和的单调性**：
>
>- 增加元素 → 和增加（仅当所有数为正）
>- 减少元素 → 和减少（仅当所有数为正）
>
>下面的题就用不了双指针
>
>**当有负数时**，破坏了单调性，即缩小窗口，可能和还会增加

# [560. 和为 K 的子数组](https://leetcode.cn/problems/subarray-sum-equals-k/)

```go
```





















# [160. 相交链表](https://leetcode.cn/problems/intersection-of-two-linked-lists/)

```go
// 方法1，用map保存
func getIntersectionNode(headA, headB *ListNode) *ListNode {
    var m = map[*ListNode]struct{}{}
    for headA != nil {
        m[headA] = struct{}{}
        headA = headA.Next
    }
    for headB != nil {
        if _, ok := m[headB]; ok {
            return headB
        }
        headB = headB.Next
    }
    return nil
}
// 方法2，数学方法 这里需要来一个空节点，当不相交时走到空节点
func getIntersectionNode(headA, headB *ListNode) *ListNode {
    p, q := headA, headB
    for p != q {
        if p != nil {
            p = p.Next
        } else {
            p = headB
        }

        if q != nil {
            q = q.Next
        } else {
            q = headA
        }
    }
    return p
}
```





# [206. 反转链表](https://leetcode.cn/problems/reverse-linked-list/)

```go
func reverseList(head *ListNode) *ListNode {
	if head == nil || head.Next == nil {
        return head
    }
    post := reverseList(head.Next)
    head.Next.Next = head
    head.Next = nil

    return post
}
```





# [234. 回文链表](https://leetcode.cn/problems/palindrome-linked-list/)

```go
// 方案1：复制后再反转
func isPalindrome(head *ListNode) bool {
    // 复制链表
    dummy := &ListNode{}
    cur := dummy
    p := head
    for p != nil {
        cur.Next = &ListNode{Val: p.Val}
        cur = cur.Next
        p = p.Next
    }
    
    // 反转复制的链表
    reversed := reverseList(dummy.Next)
    
    // 比较
    for head != nil && reversed != nil {
        if head.Val != reversed.Val {
            return false
        }
        head = head.Next
        reversed = reversed.Next
    }
    return true
}

// 方案2：快慢指针（推荐，O(1)空间）
func isPalindrome(head *ListNode) bool {
    if head == nil || head.Next == nil {
        return true
    }
    
    // 1. 找到中点
    slow, fast := head, head
    for fast.Next != nil && fast.Next.Next != nil {
        slow = slow.Next
        fast = fast.Next.Next
    }
    
    // 2. 反转后半部分
    secondHalf := reverseList(slow.Next)
    
    // 3. 比较前半部分和反转后的后半部分
    p1, p2 := head, secondHalf
    for p2 != nil {
        if p1.Val != p2.Val {
            return false
        }
        p1 = p1.Next
        p2 = p2.Next
    }
    
    return true
}

func reverseList(head *ListNode) *ListNode {
	if head == nil || head.Next == nil {
		return head
	}
	post := reverseList(head.Next)
	head.Next.Next = head
	head.Next = nil
	return post
}
```





# [141. 环形链表](https://leetcode.cn/problems/linked-list-cycle/)

```go
// 快慢指针不仅能判断是否有环，还能找到链表的中间节点
func hasCycle(head *ListNode) bool {
    var slow, fast = head, head
    for fast != nil && fast.Next != nil {
        slow = slow.Next
        fast = fast.Next.Next
        if slow == fast {
            return true
        }
    }
    return false
}
```

# [876. 链表的中间结点](https://leetcode.cn/problems/middle-of-the-linked-list/)

>思路：快慢指针一起走，当快指针走完的时候，慢指针就恰好到一半的位置

```go
func middleNode(head *ListNode) *ListNode {
    slow, fast := head, head
    for fast != nil && fast.Next != nil {
        slow = slow.Next
        fast = fast.Next.Next
    }
    return slow
}
```

# [142. 环形链表 II](https://leetcode.cn/problems/linked-list-cycle-ii/)

```go
// 方法1，map 时间复杂度O(n) 空间复杂度O(n)
func detectCycle(head *ListNode) *ListNode {
    var m = make(map[*ListNode]int)
    var cnt = 0
    for head != nil {
        if _, ok := m[head]; ok {
            return head
        } else {
            m[head] = cnt
        }
        cnt++
        head = head.Next
    }
    return nil
}
// 方法二，数学方法
// 这里有个结论，当快慢指针相遇时，慢指针还没走完一圈（这里可以想象两个人绕着操场跑，慢指针会被套圈）

func detectCycle(head *ListNode) *ListNode {
    slow, fast := head, head
    for fast != nil && fast.Next != nil {
        slow = slow.Next
        fast = fast.Next.Next
    }
    return slow
}
```



# [21. 合并两个有序链表](https://leetcode.cn/problems/merge-two-sorted-lists/)

```go
// 1. 使用dummyNode来维护结果链表的头位置
// 2. 最后再连接剩余的链表，不要在for循环里操作
func mergeTwoLists(list1 *ListNode, list2 *ListNode) *ListNode {
	dummy := new(ListNode)
	result := dummy
	for list1 != nil && list2 != nil {
		if list1.Val < list2.Val {
			dummy.Next = list1
			list1 = list1.Next
		} else {
			dummy.Next = list2
			list2 = list2.Next
		}
		dummy = dummy.Next
	}
	// 连接剩余节点
	if list1 != nil {
		dummy.Next = list1
	}
	if list2 != nil {
		dummy.Next = list2
	}
	return result.Next
}
```



# [2. 两数相加](https://leetcode.cn/problems/add-two-numbers/)

```go
func addTwoNumbers(l1 *ListNode, l2 *ListNode) *ListNode {
    var (
        dummy = new(ListNode)
        result = dummy
        cnt = 0
    )
    for l1 != nil || l2 != nil {
        dummy.Next =  &ListNode{Val: cnt, Next: nil}
        if l1 != nil {
            dummy.Next.Val += l1.Val
            l1 = l1.Next
        }
        if l2 != nil {
            dummy.Next.Val += l2.Val
            l2 = l2.Next
        }
        cnt = dummy.Next.Val / 10
        dummy.Next.Val %= 10
        dummy = dummy.Next
    }
    // 处理最后一位
    if cnt > 0 {
        dummy.Next =  &ListNode{Val: cnt, Next: nil}
    }
    return result.Next
}
```



# [19. 删除链表的倒数第 N 个结点](https://leetcode.cn/problems/remove-nth-node-from-end-of-list/)

```go
// 直接解法，遍历了两次链表，需要注意处理头节点的情况
func removeNthFromEnd(head *ListNode, n int) *ListNode {
    // 1. 先遍历下，看看链表有多长
    var (
        node = head
        cnt = 0
    )
    for node != nil {
        cnt++
        node = node.Next
    }
    
    // 如果要删除的是头结点
    if cnt == n {
        return head.Next
    }
    
    // 找到要删除结点的前一个结点
    cnt = cnt - n - 1
    node = head
    for cnt > 0 {
        cnt--
        node = node.Next
    }
    
    // 删除结点
    node.Next = node.Next.Next
    return head
}

// 前后指针
// 1 2 3 4 5
// 删除倒数第2个节点，其实就是一把尺子往后走
// 0 1 2 3 4 5
func removeNthFromEnd(head *ListNode, n int) *ListNode {
    dummy := &ListNode{}
    dummy.Next = head
    left, right := dummy, dummy
    for ; n > 0; n-- {
        right = right.Next
    }
    for right.Next != nil {
        left = left.Next
        right = right.Next
    }
    left.Next = left.Next.Next
    return dummy.Next
}
```



# [24. 两两交换链表中的节点](https://leetcode.cn/problems/swap-nodes-in-pairs/)



```go
func swapPairs(head *ListNode) *ListNode {
    if head == nil || head.Next == nil {
        return head
    }
    newHead := head.Next
    head.Next = swapPairs(head.Next.Next)
    newHead.Next = head
    return newHead
}
```

# [92. 反转链表 II](https://leetcode.cn/problems/reverse-linked-list-ii/)

```go
```





# [25. K 个一组翻转链表](https://leetcode.cn/problems/reverse-nodes-in-k-group/)

```go

```



# [94. 二叉树的中序遍历](https://leetcode.cn/problems/binary-tree-inorder-traversal/)

```go
func inorderTraversal(root *TreeNode) (res []int) {
	if root == nil {
		return []int{}
	}
	
	res = append(res, inorderTraversal(root.Left)...)
	res = append(res, root.Val)
	res = append(res, inorderTraversal(root.Right)...)
	return res
}
```

# 其他遍历

```go
// 前序遍历
func preorderTraversal(root *TreeNode) (res []int) {
    if root == nil {
        return []int{}
    }
    res = append(res, root.Val)
    res = append(res, preorderTraversal(root.Left)...)
    res = append(res, preorderTraversal(root.Right)...)
    return
}
// 后序遍历
func postorderTraversal(root *TreeNode) (res []int) {
	if root == nil {
		return []int{}
	}
	res = append(res, postorderTraversal(root.Left)...)
	res = append(res, postorderTraversal(root.Right)...)
	res = append(res, root.Val)
	return
}
// 层序遍历
func levelOrder(root *TreeNode) (result [][]int) {
    if root == nil {
        return
    }
    queue := []*TreeNode{root}
    for len(queue) > 0 {
        levelSize := len(queue)  // 当前层节点数
        arr := make([]int, 0, levelSize)  // 预分配容量
        
        for i := 0; i < levelSize; i++ {
            node := queue[i]
            arr = append(arr, node.Val)
            if node.Left != nil {
                queue = append(queue, node.Left)
            }
            if node.Right != nil {
                queue = append(queue, node.Right)
            }
        }
        result = append(result, arr)
        queue = queue[levelSize:]  // 移除已处理的本层节点
    }
    return
}
```



# [104. 二叉树的最大深度](https://leetcode.cn/problems/maximum-depth-of-binary-tree/)

```go
func maxDepth(root *TreeNode) int {
    if root == nil {
        return 0
    }
    return max(maxDepth(root.Left), maxDepth(root.Right)) + 1
}
```



# [226. 翻转二叉树](https://leetcode.cn/problems/invert-binary-tree/)

```go
func invertTree(root *TreeNode) *TreeNode {
    if root == nil {
        return nil
    }
    left := invertTree(root.Left)

    right := invertTree(root.Right)

    root.Left = right
    root.Right = left

    return root
}
```



# [101. 对称二叉树](https://leetcode.cn/problems/symmetric-tree/)

```go
func isSymmetric(root *TreeNode) bool {
    return isSameTree(root.Left, root.Right)
}

func isSameTree(left, right *TreeNode) bool {
    if left == nil || right == nil {
        return left == right
    }

    return left.Val == right.Val && isSameTree(left.Left, right.Right) && isSameTree(left.Right, right.Left)
}
```



# [543. 二叉树的直径](https://leetcode.cn/problems/diameter-of-binary-tree/)

```go
func diameterOfBinaryTree(root *TreeNode) (ans int) {
	var dfs func(*TreeNode) int
	dfs = func(root *TreeNode) int {
		if root == nil {
            // 对于叶子来说，链长就是 -1+1=0
			return -1
		}
		lLen := dfs(root.Left) + 1
		rLen := dfs(root.Right) + 1
		ans = max(ans, lLen+rLen)
		return max(lLen, rLen)
	}
	dfs(root)
	return
}
```



# [124. 二叉树中的最大路径和](https://leetcode.cn/problems/binary-tree-maximum-path-sum/)

```go
func maxPathSum(root *TreeNode) (ans int) {
    var dfs func(*TreeNode) int
    ans = -10000
    dfs = func(n *TreeNode) int {
        if n == nil {
            return 0
        }
        l_len := dfs(n.Left)
        r_len := dfs(n.Right)
        ans = max(ans, l_len + r_len + n.Val)
        return max(max(l_len, r_len) + n.Val, 0)
    }
    dfs(root)
    return
}
```



# [108. 将有序数组转换为二叉搜索树](https://leetcode.cn/problems/convert-sorted-array-to-binary-search-tree/)

```go
func sortedArrayToBST(nums []int) *TreeNode {
	if len(nums) <= 0 {
		return nil
	}
	mid := len(nums) / 2
	left := sortedArrayToBST(nums[0: mid])
	right := sortedArrayToBST(nums[mid+1: ])
	return &TreeNode{
		Val: nums[mid],
		Left: left,
		Right: right,
	}
}
```





# [98. 验证二叉搜索树](https://leetcode.cn/problems/validate-binary-search-tree/)

>**每个节点都必须在其祖先划定的范围内：向左走收紧上限，向右走提升下限，当前值必须在 (min, max) 之间。**

```go
func isValidBST(root *TreeNode) bool {
	return helper(root, nil, nil)
}

func helper(root *TreeNode, min, max *int) bool {
	if root == nil {
		return true
	}
	if min != nil && root.Val <= *min {
		return false
	}
	if max != nil && root.Val >= *max {
		return false
	}
	return helper(root.Left, min, &root.Val) && helper(root.Right, &root.Val, max)
}
```



# [230. 二叉搜索树中第 K 小的元素](https://leetcode.cn/problems/kth-smallest-element-in-a-bst/)

```go
// 解法1，中序遍历 时间复杂度O(n) 空间复杂度O(n)
func kthSmallest(root *TreeNode, k int) int {
    // 中序遍历 拿到排序好的数组
    return inorderTraversal(root)[k-1]
}

func inorderTraversal(root *TreeNode) (ans []int) {
    if root == nil {
        return nil
    }
    ans = append(ans, inorderTraversal(root.Left)...)
    ans = append(ans, root.Val)
    ans = append(ans, inorderTraversal(root.Right)...)
    return
}
// 解法2，提前减枝，中序遍历 BST，边遍历边数数，数到第 k 个就喊停，后面的全都不要了！
func kthSmallest(root *TreeNode, k int) int {
    var count , result = new(int), new(int)
    inorderTraversal(root, count, result, k)
    return *result
}

func inorderTraversal(root *TreeNode, count, result *int, k int) {
    if root == nil || *count >= k {
        return
    }
    inorderTraversal(root.Left, count, result, k)

    *count++
    if *count == k {
        *result = root.Val
    }

    inorderTraversal(root.Right, count, result, k)
}
```



# [199. 二叉树的右视图](https://leetcode.cn/problems/binary-tree-right-side-view/)

```go
func rightSideView(root *TreeNode) (ans []int) {
    if root == nil {
        return
    }
    var queue = []*TreeNode{root}
    for ; len(queue) > 0 ; {
        var arr = make([]int, 0)
        length := len(queue)
        for _, val := range queue[0: length] {
            if val.Left != nil {
                queue = append(queue, val.Left)
            }
            if val.Right != nil {
                queue = append(queue, val.Right)
            }
            arr = append(arr, val.Val)
        }
        ans = append(ans, arr[len(arr) - 1])
        queue = queue[length:]
    }
    return
}
```



# [114. 二叉树展开为链表](https://leetcode.cn/problems/flatten-binary-tree-to-linked-list/)

```go
func flatten(root *TreeNode)  {
    if root == nil {
        return
    }
    ans := preOrder(root)
    for i := 0; i < len(ans) - 1; i++ {
        ans[i].Left = nil 
        ans[i].Right = ans[i+1]
    }
    ans[len(ans)-1].Left = nil
    ans[len(ans)-1].Right = nil
    return
}

func preOrder(root *TreeNode) (ans []*TreeNode) {
    if root == nil {
        return 
    }
    ans = append(ans, root)
    ans = append(ans, preOrder(root.Left)...)
    ans = append(ans, preOrder(root.Right)...)
    return
}
```





# [105. 从前序与中序遍历序列构造二叉树](https://leetcode.cn/problems/construct-binary-tree-from-preorder-and-inorder-traversal/)

```go
// input => preorder = [3,9,20,15,7], inorder = [9,3,15,20,7]
// 从中序遍历拿到左子树的个数和右子树的个数
// 然后能从前序遍历中拿到左子树和右子树d
func buildTree(preorder []int, inorder []int) *TreeNode {
    length := len(preorder)
    if length <= 0 {
        return nil
    }
    // 中序遍历中左子树节点的个数
    index := indexForSlice(inorder, preorder[0])
    leftNode := buildTree(preorder[1:index+1], inorder[:index])
    rightNode := buildTree(preorder[index+1:], inorder[index+1:])
    return &TreeNode{
        Val: preorder[0],
        Left: leftNode,
        Right: rightNode,
    }
}

func indexForSlice[E comparable](arr []E, target E) (index int) {
	for i, v := range arr {
		if v == target {
			return i
		}
	}
	return -1
}

```

































































