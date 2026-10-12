#include <cstddef>
#include <cstdint>
#include <cstdio>
#include <cstdlib>
#include <cstring>
#include <iostream>
#include <new>
#include <type_traits>
#include <utility>
#include <vector>
#include "solution.cpp"

// ---- judge memory tracker ---------------------------------------------------
// Every new/new[] gets a small header. delete/delete[] checks it, scribbles the
// block, and never returns it to the OS so a second delete is detectable.
namespace judge {
struct alignas(16) Header { std::size_t size; std::uint64_t magic; };
constexpr std::uint64_t LIVE = 0x600DB10Cull, FREED = 0xDEADBEEFull;
long live = 0, arr_new = 0, arr_del = 0;

void* alloc(std::size_t n, bool arr) {
    auto* h = static_cast<Header*>(std::malloc(sizeof(Header) + (n ? n : 1)));
    if (!h) throw std::bad_alloc();
    h->size = n; h->magic = LIVE;
    ++live; if (arr) ++arr_new;
    return h + 1;
}
void release(void* p, bool arr) {
    if (!p) return;
    auto* h = static_cast<Header*>(p) - 1;
    if (h->magic == FREED) {
        std::fputs("judge: DOUBLE FREE - delete[] called on memory that was already freed. "
                   "Two objects owned the same pointer, or a moved-from object was not reset.\n", stderr);
        std::_Exit(3);
    }
    if (h->magic != LIVE) {
        std::fputs("judge: delete on a pointer that did not come from new.\n", stderr);
        std::_Exit(3);
    }
    h->magic = FREED;
    std::memset(p, 0xAB, h->size);   // reads from freed memory now yield garbage, not the old values
    --live; if (arr) ++arr_del;
}
}  // namespace judge
void* operator new(std::size_t n) { return judge::alloc(n, false); }
void* operator new[](std::size_t n) { return judge::alloc(n, true); }
void operator delete(void* p) noexcept { judge::release(p, false); }
void operator delete[](void* p) noexcept { judge::release(p, true); }
void operator delete(void* p, std::size_t) noexcept { judge::release(p, false); }
void operator delete[](void* p, std::size_t) noexcept { judge::release(p, true); }
// ------------------------------------------------------------------------------

static void print(const char* label, const IntBuffer& b) {
    std::cout << label << ": [";
    for (std::size_t i = 0; i < b.size(); ++i) {
        if (i) std::cout << ", ";
        std::cout << b.at(i);
    }
    std::cout << "]\n";
}
static const char* yn(bool v) { return v ? "yes" : "no"; }
static void fill(IntBuffer& b) {  // read size() ints from stdin into an existing buffer
    for (std::size_t i = 0; i < b.size(); ++i) { int x; std::cin >> x; b.at(i) = x; }
}
static std::size_t readN() { int n; std::cin >> n; return static_cast<std::size_t>(n); }

int main() {
    std::cout << "";
    std::size_t n = readN();

    long live0 = judge::live;
    {
        IntBuffer a(n);
        fill(a);
        IntBuffer b(a);      // direct-init copy
        IntBuffer c = a;     // copy-init (same constructor)
        if (n) { b.at(0) += 100; c.at(n - 1) -= 100; }
        print("a", a);
        print("b", b);
        print("c", c);
        std::cout << "sizes: " << a.size() << " " << b.size() << " " << c.size() << "\n";
        bool separate = n == 0 || (a.data() != b.data() && a.data() != c.data() && b.data() != c.data());
        std::cout << "separate storage: " << yn(separate) << "\n";

        IntBuffer e;
        IntBuffer f(e);
        std::cout << "copy of empty has size: " << f.size() << "\n";
    }
    std::cout << "leaked blocks: " << (judge::live - live0) << "\n";
}
