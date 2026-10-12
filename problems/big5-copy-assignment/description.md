`IntBuffer` owns a raw `int*` array allocated with `new int[n]`. The class as given compiles, but the compiler-generated special members are **wrong for a raw pointer**: they copy the pointer, not the array.

Implement the **copy assignment operator**. Destructor and copy constructor are already written.

```cpp
IntBuffer& operator=(const IntBuffer& other);
```

### What happens without it

Generated assignment copies the pointer. The array `*this` used to own is **leaked** (nobody points to it any more) and the array of `other` is now owned twice (double free at the end).

### The three classic mistakes

1. **Forgetting to free the old array** — leak. The judge prints the number of leaked blocks.
2. **Self-assignment**: `a = a;`. If you `delete[] data_` first and then copy from `other`, you are copying from memory you just freed. The judge scribbles freed memory, so `a` comes back full of garbage. Either check `if (this != &other)` or allocate and copy *before* deleting (copy-and-swap also works).
3. **Not returning `*this`** — `c = b = a` won't compile or won't chain.

Also handle assigning from an empty buffer: afterwards `size()` is 0 and no array is owned.

### Example

```
Input:  n = 3 values 1 2 3, m = 2 values 9 9
Output:
a: [1, 2, 3]
b before: [9, 9]
a after b = a: [1, 2, 3]
b after b = a: [101, 2, 3]
sizes: 3 3
separate storage: yes
a after a = a: [1, 2, 3]
c after c = b = a: [1, 2, 3]
returns *this: yes
assigned empty, size: 0
leaked blocks: 0
```
