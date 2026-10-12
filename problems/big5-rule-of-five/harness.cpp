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

static IntBuffer makeSquares(std::size_t n) {
    IntBuffer b(n);
    for (std::size_t i = 0; i < n; ++i) b.at(i) = static_cast<int>(i * i);
    return b;   // returned by value: move (or elided)
}

int main() {
    std::cout << "";
    std::size_t n = readN();
    long live0 = judge::live, an0 = judge::arr_new, ad0 = judge::arr_del;
    {
        IntBuffer a(n);
        fill(a);
        std::size_t m = readN();
        IntBuffer b(m);
        fill(b);

        // --- copy ---
        IntBuffer c(a);
        if (n) c.at(0) += 100;
        print("a", a);
        print("c (copy of a, then c[0] += 100)", c);
        std::cout << "copy has separate storage: " << yn(n == 0 || a.data() != c.data()) << "\n";

        b = a;
        IntBuffer& aliasA = a;
        a = aliasA;
        print("b after b = a", b);
        print("a after a = a", a);

        // --- move ---
        const int* p = a.data();
        IntBuffer d(std::move(a));
        std::cout << "move ctor stole storage: " << yn(n == 0 || d.data() == p) << "\n";
        std::cout << "moved-from a is empty: " << yn(a.size() == 0 && a.data() == nullptr) << "\n";

        p = d.data();
        b = std::move(d);
        std::cout << "move assign stole storage: " << yn(n == 0 || b.data() == p) << "\n";
        std::cout << "moved-from d is empty: " << yn(d.size() == 0 && d.data() == nullptr) << "\n";
        IntBuffer& aliasB = b;
        b = std::move(aliasB);
        print("b after self-move", b);

        // --- generic code relies on all five ---
        IntBuffer sq = makeSquares(m);
        print("sq", sq);
        std::swap(sq, b);
        print("b after swap", b);
        print("sq after swap", sq);

        std::vector<IntBuffer> v;
        for (int i = 0; i < 10; ++i) v.push_back(IntBuffer(n + 2, i));
        v.push_back(c);
        std::cout << "vector: " << v.size() << " buffers, last has size " << v.back().size() << "\n";

        std::cout << "noexcept moves: " << yn(std::is_nothrow_move_constructible<IntBuffer>::value &&
                                                 std::is_nothrow_move_assignable<IntBuffer>::value) << "\n";
        std::cout << "array allocations: " << (judge::arr_new - an0) << "\n";
    }
    std::cout << "leaked blocks: " << (judge::live - live0) << "\n";
    std::cout << "array frees match allocations: " << yn(judge::arr_del - ad0 == judge::arr_new - an0) << "\n";
}
