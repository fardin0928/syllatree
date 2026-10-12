`IntBuffer` owns a raw `int*` array allocated with `new int[n]`. The class as given compiles, but the compiler-generated special members are **wrong for a raw pointer**: they copy the pointer, not the array.

Implement the **destructor**.

```cpp
~IntBuffer();
```

### What happens without it

The compiler-generated destructor destroys the members: an `int*` and a `size_t`. Destroying a pointer does **nothing** to what it points at. Every `IntBuffer` that goes out of scope leaks its array.

### What the judge checks

- After an `IntBuffer` goes out of scope, the number of live heap blocks is back to what it was ("leaked blocks: 0").
- The array was released with `delete[]`, not `delete`. Memory from `new[]` must go back through `delete[]`; mixing them is undefined behaviour even for `int`.
- Empty buffers (`IntBuffer()` and `IntBuffer(0)`) hold `nullptr`. `delete[] nullptr` is a no-op, so no special case is needed. Make sure you don't add one that breaks.

### Example

```
Input:  n = 3, values 1 2 3
Output:
a: [1, 2, 3]
leaked blocks after scope: 0
array freed with delete[]: yes
leaked blocks after 50 temporaries: 0
empty sizes: 0 0
leaked blocks after empty buffers: 0
```
