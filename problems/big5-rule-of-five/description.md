`IntBuffer` owns a raw `int*` array allocated with `new int[n]`. The class as given compiles, but the compiler-generated special members are **wrong for a raw pointer**: they copy the pointer, not the array.

Implement **all five** special members so `IntBuffer` behaves like a proper value type:

```cpp
~IntBuffer();
IntBuffer(const IntBuffer& other);
IntBuffer& operator=(const IntBuffer& other);
IntBuffer(IntBuffer&& other) noexcept;
IntBuffer& operator=(IntBuffer&& other) noexcept;
```

### The Rule of Five

If a class needs a user-written destructor because it owns a resource through a raw pointer, the compiler-generated copy and move operations are wrong too, because they copy the pointer instead of the resource. So you write all five, or none.

### Checklist (the judge tests each line)

- Destructor: `delete[]`, no leak, safe on `nullptr`.
- Copy constructor: deep copy, separate storage, empty copies stay empty.
- Copy assignment: free the old array, self-assignment safe, returns `*this`.
- Move constructor: steals the pointer, resets the source, `noexcept`, no allocation.
- Move assignment: self-move safe, frees old array, steals, resets source, returns `*this`, `noexcept`.
- Generic code must work: returning an `IntBuffer` from a function, `std::swap`, and growing a `std::vector<IntBuffer>`.

### Example

```
Input:  n = 3 values 1 2 3, m = 2 values 9 9
Output:
a: [1, 2, 3]
c (copy of a, then c[0] += 100): [101, 2, 3]
copy has separate storage: yes
b after b = a: [1, 2, 3]
a after a = a: [1, 2, 3]
move ctor stole storage: yes
moved-from a is empty: yes
move assign stole storage: yes
moved-from d is empty: yes
b after self-move: [1, 2, 3]
sq: [0, 1]
b after swap: [0, 1]
sq after swap: [1, 2, 3]
vector: 11 buffers, last has size 3
noexcept moves: yes
array allocations: 16
leaked blocks: 0
array frees match allocations: yes
```
