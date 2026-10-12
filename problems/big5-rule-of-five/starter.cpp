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

    // TODO: copy constructor. `*this` must get its OWN array with the same contents.
    IntBuffer(const IntBuffer& other) {
        
    }

    // TODO: copy assignment. Handle self-assignment, free the old array, return *this.
    IntBuffer& operator=(const IntBuffer& other) {
        
        return *this;
    }

    // TODO: move constructor. Steal other's array; leave `other` empty (nullptr / 0).
    IntBuffer(IntBuffer&& other) noexcept {
        
    }

    // TODO: move assignment. Guard against self-move, free the old array, steal, reset other.
    IntBuffer& operator=(IntBuffer&& other) noexcept {
        
        return *this;
    }

    // ---- do not change below: the judge uses these ----
    std::size_t size() const { return size_; }
    const int* data() const { return data_; }
    int& at(std::size_t i) { return data_[i]; }
    int at(std::size_t i) const { return data_[i]; }

private:
    int* data_;
    std::size_t size_;
};
