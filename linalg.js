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

    push(x) {
        this._v.push(x);
        this._reset();
    }

    pop() {
        let x = this._v.pop();
        this._reset();

        return x
    }

    normalize() {
        return this.hypot === 0 ? 0 : this.multiply(1 / this.hypot);
    }

    copy() {
        return new LinearVector(Array.from(this._v));
    }
}

class Matrix {
    static zero(n, m) {
        if (m === undefined) {
            m = n;
        }
        let k = new Matrix(Array(n).fill(undefined));

        for (let i = 0; i < n; i++) {
            k._m[i] = LinearVector.zero(m);
        }

        return k;
    }

    constructor(m) {
        this._m = m;
    }

    _reset() {
        this._key = undefined;
        this._det = undefined;
    }

    get(i, j) {
        let [n, m] = this.dimension;
        if (i >= n || i < 0 || j < 0 || j >= m) {
            throw new IndexError("i or j are not an index for this matrix");
        }
        return this._m[i].get(j);
    }

    set(i, j, x) {
        let [n, m] = this.dimension;
        if (i >= n || i < 0 || j < 0 || j >= m) {
            throw new IndexError("i is not an index for this vector");
        }
        this._m[i].set(j, x);
    }

    getVec(i) {
        let [n, _] = this.dimension;
        if (i >= n || i < 0) {
            throw new IndexError("i or j are not an index for this matrix");
        }
        return this._m[i];
    }

    setVec(i, v) {
        let [n, m] = this.dimension;
        if (i >= n || i < 0) {
            throw new IndexError("i is not an index for this vector");
        }
        if (m != v.length) {
            throw new WrongDimensionsError("vector and matrix's vector have different sizes");
        }
        this._m[i] = v.copy();
    }
    
    get det() {
        const [n, m] = this.dimension;
        if (n !== m) {
            throw new Error("Matrix must be square to compute determinant");
        }
        if (this._det === undefined) {
            // Базовые случаи
            if (n === 1) return this._m[0][0];
            if (n === 2) {
                return this._m[0][0] * this._m[1][1] - this._m[0][1] * this._m[1][0];
            }
        
            // Рекурсивное вычисление
            let det = 0;
            for (let j = 0; j < n; j++) {
                const minor = this._m.slice(1).map(row => row.filter((_, col) => col !== j));
                const sign = (j % 2 === 0) ? 1 : -1;
                det += sign * this._m[0][j] * (new Matrix(minor)).determinant();
            }
            this._det = det;
        }
        return this._det;
    }
    
    get dimension() {
        return [this._m.length, this._m[0].length];
    }
    
    add(other) {
        if (this.dimension[0] != other.dimension[0] || this.dimension[1] != other.dimension[1]) {
            throw new WrongDimensionsError("matrices have different lengths");
        }
        let m = this.copy();

        for (let i = 0; i < this.dimension[0]; i++) {
            m.setVec(i, m.getVec(i).add(other.getVec(i)));
        }
        return m;
    }

    subtract(other) {
        if (this.dimension[0] != other.dimension[0] || this.dimension[1] != other.dimension[1]) {
            throw new WrongDimensionsError("matrices have different lengths");
        }
        let m = this.copy();

        for (let i = 0; i < this.dimension[0]; i++) {
            m.setVec(i, m.getVec(i).subtract(other.getVec(i)));
        }
        return m;
    }

    multiply(number) {
        let m = this.copy();

        for (let i = 0; i < this.dimension[0]; i++) {
            m.setVec(i, m.getVec(i).multiply(number));
        }
        return m;
    }

    multiplyMatrix(other) {
        const [nA, mA] = this.dimension;
        const [nB, mB] = other.dimension;
    
        if (mA !== nB) {
            throw new WrongDimensionsError("Number of columns of first matrix must equal number of rows of second matrix");
        }
    
        // Результат имеет размер nA x mB
        let m = Matrix.zero(nA, mB);
    
        for (let i = 0; i < nA; i++) {
            for (let j = 0; j < mB; j++) {
                let s = 0;
                for (let k = 0; k < mA; k++) {
                    s += this.get(i, k) * other.get(k, j);
                }
                m.set(i, j, s);
            }
        }
        return m;
    }

    do(func) {
        let m = this.copy();

        for (let i = 0; i < this.dimension[0]; i++) {
            m.setVec(i, m.getVec(i).do(func))
        }
        return m;
    }

    push(v) {
        if (v.length != this.dimension[1]) {
            throw new WrongDimensionsError("vector and matrix's vector have different sizes");
        }
        this._m.push(v);
        this._reset();
    }

    pop() {
        let v = this._m.pop();
        this._reset();

        return v;
    }

    copy() {
        let m = Array.from(this._m);

        for (let i = 0; i < m.length; i++) {
            m[i] = m[i].copy();
        }

        return new Matrix(m);
    }
}
