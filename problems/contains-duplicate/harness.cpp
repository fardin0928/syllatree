#include <iostream>
#include <vector>
#include "solution.cpp"

int main() {
    int n;
    std::cin >> n;
    std::vector<int> nums(n);
    for (auto& x : nums) std::cin >> x;
    std::cout << (Solution().containsDuplicate(nums) ? "true" : "false") << '\n';
}
