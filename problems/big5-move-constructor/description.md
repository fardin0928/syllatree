`IntBuffer` owns a raw `int*` array allocated with `new int[n]`. The class as given compiles, but the compiler-generated special members are **wrong for a raw pointer**: they copy the pointer, not the array.

Implement the **move constructor**. Destructor, copy constructor and copy assignment are already written.

```cpp
IntBuffer(IntBuffer&& other) noexcept;
```

### What a move is

`other` is about to die (a temporary, or something wrapped in `std::move`). Instead of allocating and copying, **steal its pointer** and leave `other` in a valid empty state:

```cpp
data_ = other.data_;   other.data_ = nullptr;
size_ = other.size_;   other.size_ = 0;
```

### What can go wrong

- **Forgetting to reset `other`.** Both objects now hold the pointer; when `other` is destroyed the array is freed, and when you are destroyed it is freed again: **DOUBLE FREE**.
- **Copying instead of moving.** Works, but allocates. The judge counts array allocations and checks that the moved-to object holds the *same* address.
- **Missing `noexcept`.** `std::vector` only moves elements during reallocation if the move constructor is `noexcept`; otherwise it falls back to copying. The judge prints `noexcept: yes/no`.
- Moving from an already moved-from (empty) object must work: it just yields another empty buffer.

### Example

```
Input:  n = 3, values 1 2 3
Output:
b: [1, 2, 3]
stole storage (no new array): yes
moved-from is empty: yes
array allocations so far: 1
move from empty, size: 0
noexcept: yes
vector kept sizes: yes
leaked blocks: 0
```
