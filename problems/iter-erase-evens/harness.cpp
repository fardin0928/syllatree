#include <iostream>
#include <vector>
#include "solution.cpp"

int main() {
    int n;
    std::cin >> n;
    std::vector<int> v(n);
    for (auto& x : v) std::cin >> x;

    eraseEvens(v);

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
