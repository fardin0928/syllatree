Remove every **even** number from a `std::vector<int>`, in place, keeping the relative order of the remaining elements.

You must walk the vector with an **iterator** and call `v.erase(it)` yourself. Do not use `std::remove_if`, indexes, or build a second vector; the point of this exercise is to handle iterator invalidation correctly.

```cpp
void eraseEvens(std::vector<int>& v);
```

### What can go wrong

`vector::erase(it)` shifts every element after `it` one slot to the left and **invalidates `it` and everything after it**. A loop like this is a classic bug:

```cpp
for (auto it = v.begin(); it != v.end(); ++it)
    if (*it % 2 == 0) v.erase(it);   // `it` is now dangling, and the next element is skipped
```

`erase` returns an iterator to the element that now sits where the erased one was. Use that return value.

This problem is compiled with AddressSanitizer, so reading through an invalidated iterator is reported as a **Runtime Error** instead of silently producing garbage.

### Example 1

```
Input:  v = [1, 2, 3, 4, 5]
Output: [1, 3, 5]
```

### Example 2

```
Input:  v = [2, 2, 2, 4, 6, 1]
Output: [1]
```
Consecutive evens are the case the buggy loop above gets wrong.

### Example 3

```
Input:  v = [8, 6, 4]
Output: []
```

### Constraints

- `0 <= n <= 10^5`
- `-10^9 <= v[i] <= 10^9`. Negative even numbers are even.
