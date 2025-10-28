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
    
    get hypot() {
        if (this._hypot === undefined) {
            this._hypot = Math.hypot(...this._v);
        }
        return this._hypot;
    }
    
    get length() {
        return this._v.length;
    }
    
    add(other) {
        if (this.length != other.length) {
            throw new WrongDimensionsError("vectors have different lengths");
        }
        let v = Array.from(this._v);
        for (let i = 0; i < v.length; i++) {
            v[i] += other.get(i);
        }
        return new LinearVector(v);
    }

    subtract(other) {
        if (this.length != other.length) {
            throw new WrongDimensionsError("vectors have different lengths");
        }
        let v = Array.from(this._v);
        for (let i = 0; i < v.length; i++) {
            v[i] -= other.get(i);
        }
        return new LinearVector(v);
    }

    multiply(number) {
        let v = Array.from(this._v);

        for (let i = 0; i < v.length; i++) {
            v[i] *= number;
        }
        return new LinearVector(v);
    }

    scalarProduct(other) {
        if (this.length != other.length) {
            throw new WrongDimensionsError("vectors have different lengths");
        }
        let n = 0;
        for (let i = 0; i < this.length; i++) {
            n += this.get(i) * other.get(i)
        }
        return n;
    }

    do(func) {
        let v = Array(this.length);

        for (let i = 0; i < v.length; i++) {
            v[i] = func(v[i]);
        }
        return new LinearVector(v);
    }

    copy() {
        return new LinearVector(Array.from(this._v));
    }
}
