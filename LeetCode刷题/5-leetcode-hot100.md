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