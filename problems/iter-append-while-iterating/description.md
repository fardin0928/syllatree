For every **negative** element in the original vector, append its absolute value to the **end** of the vector, in the same order the negatives appear. The original elements stay untouched.

```cpp
void appendAbsOfNegatives(std::vector<int>& v);
```

### The trap

`push_back` may **reallocate**: when `size() == capacity()` the vector allocates a bigger block, moves every element there, and frees the old block. Every iterator, pointer and reference into the old block is now dangling.

```cpp
for (auto it = v.begin(); it != v.end(); ++it)   // `it` and `v.end()` can both go stale
    if (*it < 0) v.push_back(-*it);
```

This may appear to work for small inputs and then explode on a bigger one. With AddressSanitizer on, the judge turns the read-after-free into a **Runtime Error** so you can see it.

Ways out:

1. Remember the original `size()` and loop by index up to that.
2. Call `v.reserve(...)` for the worst case before iterating, so no reallocation can happen. (Iterators past the original end are still not valid for reading, though.)
3. Collect the values to append into a separate container first, then append.

Note also that the loop condition `it != v.end()` would re-examine the values you appended if `end()` were re-evaluated, and those are never negative, so that bug hides. Do not rely on it.

### Example 1

```
Input:  v = [1, -2, 3, -4]
Output: [1, -2, 3, -4, 2, 4]
```

### Example 2

```
Input:  v = [-1, -1, -1]
Output: [-1, -1, -1, 1, 1, 1]
```

### Example 3

```
Input:  v = [5, 0, 7]
Output: [5, 0, 7]
```

### Constraints

- `0 <= n <= 10^5`
- `-10^9 <= v[i] <= 10^9`
