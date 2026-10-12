Given a `std::list<int>`, insert `value` **directly after every element equal to `target`**. Only the elements that were in the list *before* the call count as matches; the elements you insert must not be re-examined.

```cpp
void insertAfterEach(std::list<int>& l, int target, int value);
```

### Iterators on a list

`std::list` has **bidirectional** iterators: you can `++it` and `--it`, but there is no `it + 2` and no `l[i]`. Use `std::next(it)` / `std::advance` when you need to skip ahead.

Unlike `vector`, inserting into a `list` **does not invalidate** any existing iterator. That makes this problem simpler than it looks, with one trap:

- `l.insert(pos, value)` inserts *before* `pos`, so to insert *after* the current element you need `std::next(it)`.
- If `value == target`, a naive loop will visit the element it just inserted, match it, insert again, and never finish. Advance past what you inserted.

### Example 1

```
Input:  l = [1, 2, 3, 2],  target = 2,  value = 9
Output: [1, 2, 9, 3, 2, 9]
```

### Example 2

```
Input:  l = [5, 5, 5],  target = 5,  value = 5
Output: [5, 5, 5, 5, 5, 5]
```
Three matches, three inserts. An unbounded loop here means you re-scanned inserted elements (the judge reports a **Time Limit Exceeded**).

### Example 3

```
Input:  l = [1, 2, 3],  target = 7,  value = 0
Output: [1, 2, 3]
```

### Constraints

- `0 <= n <= 10^5`
