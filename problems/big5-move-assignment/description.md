`IntBuffer` owns a raw `int*` array allocated with `new int[n]`. The class as given compiles, but the compiler-generated special members are **wrong for a raw pointer**: they copy the pointer, not the array.

Implement the **move assignment operator**. The other four are already written.

```cpp
IntBuffer& operator=(IntBuffer&& other) noexcept;
```

### Steps

1. Guard against self-move: `if (this != &other)`. `b = std::move(b)` must leave `b` intact. Without the guard you free your own array and then "steal" the dangling pointer.
2. Free the array you currently own (otherwise it leaks).
3. Take `other.data_` and `other.size_`.
4. Reset `other` to `nullptr` / `0` so its destructor is harmless.
5. `return *this;`

Mark it `noexcept`. Moving from an empty buffer leaves `*this` empty.

### Example

```
Input:  n = 3 values 1 2 3, m = 2 values 9 9
Output:
b after b = move(a): [1, 2, 3]
stole storage (no new array): yes
moved-from is empty: yes
sizes: 0 3
b after self-move: [1, 2, 3]
c after c = move(b): [1, 2, 3]
returns *this: yes
array allocations so far: 2
noexcept: yes
assigned from empty, size: 0
leaked blocks: 0
```
