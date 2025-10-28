class WrongDimensionsError extends Error {
    constructor(message) {
        super(message);
        this.name = "WrongDimensionsError";
    }
}

class IndexError extends Error {
    constructor(message) {
        super(message);
        this.name = "IndexError";
    }
}

class LinearVector {
    static zero(length) {
        return new LinearVector(Array(length).fill(0));
    }

    static one(length) {
        return new LinearVector(Array(length).fill(1));
    }

    constructor(v) {
        this._v = v;
    }

    _reset() {
        this._key = undefined;
        this._hypot = undefined;
    }

    get(i) {
        if (i >= this.length || i < 0) {
            throw new IndexError("i is not an index for this vector");
        }
        return this._v[i];
    }

    at(i) {
        return this.get(i >= 0 ? i : (i - Math.floor(i / this.length) * this.length) % this.length);
    }

    set(i, x) {
        if (i >= this.length || i < 0) {
            throw new IndexError("i is not an index for this vector");
        }
        this._v[i] = x;
    }
    
    copy() {
        return new LinearVector(Array.from(this._v));
    }
}
