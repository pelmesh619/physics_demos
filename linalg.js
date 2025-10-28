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

    copy() {
        return new LinearVector(Array.from(this._v));
    }
}
