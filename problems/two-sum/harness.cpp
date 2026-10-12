#include <algorithm>
#include <iostream>
#include <vector>
#include "solution.cpp"

int main() {
    int n, target;
    std::cin >> n >> target;
    std::vector<int> nums(n);
    for (auto& x : nums) std::cin >> x;

    std::vector<int> ans = Solution().twoSum(nums, target);
    std::sort(ans.begin(), ans.end());
    for (size_t i = 0; i < ans.size(); ++i) {
        if (i) std::cout << ' ';
        std::cout << ans[i];
    }
    std::cout << '\n';
}
