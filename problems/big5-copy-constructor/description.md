`IntBuffer` owns a raw `int*` array allocated with `new int[n]`. The class as given compiles, but the compiler-generated special members are **wrong for a raw pointer**: they copy the pointer, not the array.

Implement the **copy constructor**. The destructor is already written.

```cpp
IntBuffer(const IntBuffer& other);
```

### What happens without it

The compiler-generated copy constructor is a *shallow copy*: the new object gets the **same pointer**. Two objects now own one array:

1. Changing one changes the other.
2. When both are destroyed, the array is deleted twice. The judge reports this as a **DOUBLE FREE** runtime error.

### Requirements

- Allocate a fresh array of `other.size()` ints and copy the contents (deep copy).
- Copying an empty buffer must produce an empty buffer without allocating (`size() == 0`).
- `IntBuffer b(a);` and `IntBuffer c = a;` both call this constructor.

### Example

```
Input:  n = 3, values 1 2 3
Output:
a: [1, 2, 3]
b: [101, 2, 3]
c: [1, 2, -97]
sizes: 3 3 3
separate storage: yes
copy of empty has size: 0
leaked blocks: 0
```
Modifying `b` and `c` did not touch `a`.
