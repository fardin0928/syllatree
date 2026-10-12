#include <cstddef>
#include <utility>

// IntBuffer owns a raw heap array of ints. No std::vector, no smart pointers:
// the whole point is to manage the pointer by hand.
class IntBuffer {
public:
    IntBuffer() : data_(nullptr), size_(0) {}

    explicit IntBuffer(std::size_t n, int fill = 0)
        : data_(n ? new int[n] : nullptr), size_(n) {
        for (std::size_t i = 0; i < n; ++i) data_[i] = fill;
    }

    ~IntBuffer() {
        delete[] data_;   // delete[] on nullptr is a no-op, so an empty buffer is fine
    }

    IntBuffer(const IntBuffer& other)
        : data_(other.size_ ? new int[other.size_] : nullptr), size_(other.size_) {
        for (std::size_t i = 0; i < size_; ++i) data_[i] = other.data_[i];
    }

    // TODO: copy assignment. Handle self-assignment, free the old array, return *this.
    IntBuffer& operator=(const IntBuffer& other) {
        
        return *this;
    }

    IntBuffer(IntBuffer&&) = delete;                 // not part of this exercise

    IntBuffer& operator=(IntBuffer&&) = delete;      // not part of this exercise

    // ---- do not change below: the judge uses these ----
    std::size_t size() const { return size_; }
    const int* data() const { return data_; }
    int& at(std::size_t i) { return data_[i]; }
    int at(std::size_t i) const { return data_[i]; }

private:
    int* data_;
    std::size_t size_;
};
