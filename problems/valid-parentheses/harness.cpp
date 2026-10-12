#include <iostream>
#include <string>
#include "solution.cpp"

int main() {
    std::string s;
    std::getline(std::cin, s);
    while (!s.empty() && (s.back() == '\r' || s.back() == ' ')) s.pop_back();
    std::cout << (Solution().isValid(s) ? "true" : "false") << '\n';
}
