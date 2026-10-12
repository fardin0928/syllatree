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

    // TODO: destructor. Release the array this object owns.
    ~IntBuffer() {
        
    }

    IntBuffer(const IntBuffer&) = delete;            // not part of this exercise

    IntBuffer& operator=(const IntBuffer&) = delete; // not part of this exercise

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
