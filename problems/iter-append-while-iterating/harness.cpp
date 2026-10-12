#include <iostream>
#include <vector>
#include "solution.cpp"

int main() {
    int n;
    std::cin >> n;
    std::vector<int> v;
    // Read into a temporary and copy so `v` starts with size() == capacity():
    // the very first push_back reallocates and exposes a stale iterator.
    std::vector<int> tmp(n);
    for (auto& x : tmp) std::cin >> x;
    v = tmp;
    v.shrink_to_fit();

    appendAbsOfNegatives(v);

    if (v.empty()) {
        std::cout << "[]\n";
        return 0;
    }
    std::cout << '[';
    for (std::size_t i = 0; i < v.size(); ++i) {
        if (i) std::cout << ", ";
        std::cout << v[i];
    }
    std::cout << "]\n";
}
