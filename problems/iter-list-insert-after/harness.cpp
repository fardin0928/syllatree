#include <iostream>
#include <list>
#include "solution.cpp"

int main() {
    int n, target, value;
    std::cin >> n >> target >> value;
    std::list<int> l;
    for (int i = 0; i < n; ++i) {
        int x;
        std::cin >> x;
        l.push_back(x);
    }

    insertAfterEach(l, target, value);

    if (l.empty()) {
        std::cout << "[]\n";
        return 0;
    }
    std::cout << '[';
    bool first = true;
    for (int x : l) {
        if (!first) std::cout << ", ";
        first = false;
        std::cout << x;
    }
    std::cout << "]\n";
}
