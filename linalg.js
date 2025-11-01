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
        this._nonzeroIndices = undefined;
    }

    get nonzeroIndices() {
        if (this._nonzeroIndices === undefined) {
            this._nonzeroIndices = [];
            for (let i = 0; i < this.length; i++) {
                if (this._v[i] !== 0) {
                    this._nonzeroIndices.push(i);
                }
            }
        }
        return this._nonzeroIndices;
        
    }

    get(i) {
        if (i >= this.length || i < 0) {
            throw new IndexError("i is not an index for this vector");
        }
        return this._v[i];
    }

    at(i) {
        return this.get((i >= 0 ? i : (i - Math.floor(i / this.length) * this.length)) % this.length);
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
    
        other = other.transpose();

        // Результат имеет размер nA x mB
        let m = Matrix.zero(nA, mB);
    
        for (let i = 0; i < nA; i++) {
            for (let j = 0; j < mB; j++) {
                m.set(i, j, this.getVec(i).scalarProduct(other.getVec(j)));
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

    getColumn(j) {
        let col = [];
        for (let i = 0; i < this.dimension[0]; i++) {
            col.push(this.get(i, j));
        }
        return new LinearVector(col);
    }

    transpose() {
        const [n, m] = this.dimension;
        let transposed = [];
    
        for (let j = 0; j < m; j++) {
            let row = [];
            for (let i = 0; i < n; i++) {
                row.push(this._m[i].get(j));
            }
            transposed.push(new LinearVector(row));
        }
    
        return new Matrix(transposed);
    }
}


class LinearAlgorithms {
    // QR-разложение матрицы A на Q и R
    static qrDecomposition(matrix) {
        const [n, m] = matrix.dimension;
        if (n !== m) throw new Error("Matrix must be square");

        let A = matrix.transpose();
        let Q = Matrix.zero(n);

        // Используем метод Грама-Шмидта
        let vectors = [];
        for (let j = 0; j < n; j++) {
            let v = A.getVec(j).copy();
            for (let k = 0; k < j; k++) {
                let qk = vectors[k];
                let dot = qk.scalarProduct(v);
                for (let i = 0; i < v.length; i++) {
                    v._v[i] -= dot * qk.get(i);
                }
            }
            let norm = v.hypot;
            if (norm === 0) throw new Error("Matrix is singular");
            let q = v.multiply(1 / norm);
            vectors.push(q);
        }

        // Собираем Q
        let Qmat = [];
        for (let i = 0; i < n; i++) {
            let row = [];
            for (let j = 0; j < n; j++) {
                row.push(vectors[j].get(i)); // i-я строка, j-й столбец
            }
            Qmat.push(new LinearVector(row));
        }

        // R = Q^T * A
        let Rmat = [];
        for (let i = 0; i < n; i++) {
            let row = [];
            for (let j = 0; j < n; j++) {
                row.push(vectors[i].scalarProduct(A.getVec(j)));
            }
            Rmat.push(new LinearVector(row));
        }

        return [new Matrix(Qmat), new Matrix(Rmat)];
    }

    // Нахождение всех собственных значений через QR-алгоритм
    static findEigenvalues(matrix, tol = 1e-10, maxIter = 1000) {
        const [n, m] = matrix.dimension;
        if (n !== m) throw new Error("Matrix must be square");

        let A = matrix.copy();

        for (let k = 0; k < maxIter; k++) {
            let [Q, R] = LinearAlgorithms.qrDecomposition(A);
            A = R.multiplyMatrix(Q); // A = R * Q
        }

        // Собственные значения — это элементы на диагонали
        let eigenvalues = [];
        for (let i = 0; i < n; i++) {
            eigenvalues.push(A.get(i, i));
        }
        return eigenvalues;
    }

    static findEigenvaluesAndVectors(matrix, tol = 1e-10, maxIter = 500, iterFunction = () => {}) {
        const [n, m] = matrix.dimension;
        if (n !== m) throw new Error("Matrix must be square");
    
        let A = matrix.copy();
        let Q_total = Matrix.zero(n, n);
    
        // Q_total ← единичная матрица
        for (let i = 0; i < n; i++) {
            Q_total.set(i, i, 1);
        }
        
        let startIter = 0;
        let deltaT = 0;
        let lastIter = 0;

        for (let iter = 0; iter < maxIter; iter++) {
            let start = performance.now();
            let [Q, R] = LinearAlgorithms.qrDecomposition(A);
            A = R.multiplyMatrix(Q);
            Q_total = Q_total.multiplyMatrix(Q);
            
            // Проверка сходимости
            let offDiag = 0;
            for (let i = 0; i < n; i++) {
                for (let j = 0; j < i; j++) {
                    offDiag += Math.abs(A.get(i,j));
                }
            }
            lastIter = iter;
            if (offDiag < tol) break;

            deltaT += performance.now() - start;
            if (deltaT > 10000) {
                let iterString = iter == startIter ? iter : `from ${startIter} to ${iter}`;
                console.info(`Iteration ${iterString} completed! Took ${deltaT.toFixed(1)} ms. Last offDiag is ${offDiag}`);
                startIter = iter + 1;
                deltaT = 0;
            }
            iterFunction(iter, performance.now() - start, offDiag);
        }
        let offDiag = 0;
        for (let i = 0; i < n; i++) {
            for (let j = 0; j < i; j++) {
                offDiag += Math.abs(A.get(i,j));
            }
        }
        if (deltaT != 0) {
            let iterString = lastIter == startIter ? lastIter : `from ${startIter} to ${lastIter}`;
            console.info(`Iteration ${iterString} completed! Took ${deltaT.toFixed(1)} ms. Last offDiag is ${offDiag}`);
        }
    
        // Собственные значения — диагональные элементы
        let eigenvalues = [];
        for (let i = 0; i < n; i++) {
            eigenvalues.push(A.get(i, i));
        }
    
        // Собственные векторы — столбцы Q_total
        let eigenvectors = [];
        for (let j = 0; j < n; j++) {
            eigenvectors.push(Q_total.getColumn(j));
        }
    
        return { energies: eigenvalues, vectors: eigenvectors };
    }
}

function assertEqual(a, b, message, verboseIfPassed=false) {
    if (Array.isArray(a) && Array.isArray(b)) {
        if (a.length !== b.length || !a.every((v, i) => Math.abs(v - b[i]) < 1e-6)) {
            console.error("❌ FAIL:", message, "Expected", b, "but got", a);
            return;
        }
    } else {
        if (Math.abs(a - b) > 1e-6) {
            console.error("❌ FAIL:", message, "Expected", b, "but got", a);
            return;
        }
    }
    if (verboseIfPassed) {
        console.log("✅ PASS:", message);
    }
}

// Тест создания и методов матрицы
function testMatrixBasic() {
    let v1 = new LinearVector([1, 2]);
    let v2 = new LinearVector([3, 4]);
    let m = new Matrix([v1.copy(), v2.copy()]);

    assertEqual(m.get(0, 0), 1, "get element (0,0)");
    assertEqual(m.get(1, 1), 4, "get element (1,1)");

    m.set(0, 0, 10);
    assertEqual(m.get(0, 0), 10, "set element (0,0)");

    let sum = m.add(new Matrix([new LinearVector([1,1]), new LinearVector([1,1])]));
    assertEqual(sum.get(0,0), 11, "matrix addition");
    assertEqual(sum.get(1,1), 5, "matrix addition");

    let diff = m.subtract(new Matrix([new LinearVector([1,1]), new LinearVector([1,1])]));
    assertEqual(diff.get(0,0), 9, "matrix subtraction");
    assertEqual(diff.get(1,1), 3, "matrix subtraction");

    let scaled = m.multiply(2);
    assertEqual(scaled.get(0,0), 20, "matrix multiply scalar");
    assertEqual(scaled.get(1,1), 8, "matrix multiply scalar");

    let m2 = m.copy();
    assertEqual(m2.get(0,0), 10, "matrix copy");
    assertEqual(m2.get(0,1), 2, "matrix copy");
    assertEqual(m2.get(1,0), 3, "matrix copy");
    assertEqual(m2.get(1,1), 4, "matrix copy");
}

// Тест нахождения собственных значений
function testEigenvalues() {
    // Матрица 2x2: [2, 1; 1, 2] имеет собственные значения 3 и 1
    let m = new Matrix([
        new LinearVector([2, 1]),
        new LinearVector([1, 2])
    ]);

    let eigenvalues = LinearAlgorithms.findEigenvalues(m, 1e-8, 100);
    eigenvalues.sort((a,b) => a-b); // сортируем для проверки

    assertEqual(eigenvalues, [1, 3], "eigenvalues of 2x2 symmetric matrix");

    // Матрица 3x3: [[2,0,0],[0,3,0],[0,0,4]] имеет собственные значения 2,3,4
    let m2 = new Matrix([
        new LinearVector([2,0,0]),
        new LinearVector([0,3,0]),
        new LinearVector([0,0,4])
    ]);
    let eig2 = LinearAlgorithms.findEigenvalues(m2, 1e-8, 100);
    eig2.sort((a,b) => a-b);
    assertEqual(eig2, [2,3,4], "eigenvalues of diagonal 3x3 matrix");
}

// Тест push/pop
function testPushPop() {
    let v = new LinearVector([1,2]);
    v.push(3);
    assertEqual(v.length, 3, "vector push increases length");
    let x = v.pop();
    assertEqual(x, 3, "vector pop returns last element");
    assertEqual(v.length, 2, "vector pop decreases length");

    let m = new Matrix([
        new LinearVector([1,2]),
        new LinearVector([3,4])
    ]);
    m.push(new LinearVector([5,6]));
    assertEqual(m.dimension[0], 3, "matrix push increases rows");
    let last = m.pop();
    assertEqual(last.get(0), 5, "matrix pop returns last row");
    assertEqual(m.dimension[0], 2, "matrix pop decreases rows");
}

// Запуск всех тестов
function runTests() {
    testMatrixBasic();
    testEigenvalues();
    testPushPop();
}

runTests();
