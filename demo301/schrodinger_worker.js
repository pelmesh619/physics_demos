importScripts("../linalg.js", "../physics_basics.js");

self.onmessage = (event) => {
    try {
        let [U, xMin, xMax, N, maxIter] = event.data;


        let rawPotentialFunc = JSON.parse(U).map(part => ({
            expr: part.expr,
            cond: { x: part.cond._x, y: part.cond._y }
        }));

        let potentialFunc = evalPotentialFunction(rawPotentialFunc);

        const result = solveSchrodinger(potentialFunc, xMin, xMax, N, maxIter);

        self.postMessage({ status: "done", data: result });  
    } catch (err) {
        console.error("Worker exception:", err);
        self.postMessage({ error: err.message });
    }
};

self.onerror = (e) => {
    console.error("Error inside worker:", e.message);
    self.postMessage({ error: e.message });
};

function evalPotentialFunction(functionParts) {
    const parts = functionParts.map(p => ({
        expr: new Function("x", "return " + p.expr),
        cond: p.cond
    }));

    return function(x) {
        for (let part of parts) {
            if (x >= part.cond.x && x <= part.cond.y)
                return part.expr(x);
        }
        return 0;
    };
}

function solveSchrodinger(U, xMin, xMax, N, maxIter, hbar=1, m=1) {
    const dx = (xMax - xMin)/(N+1);
    let H = Matrix.zero(N, N);
    let x_values = [];

    for (let i = 0; i < N; i++) {
        let xi = xMin + (i+1)*dx;
        x_values.push(xi);
        H.set(i,i, hbar**2/(m*dx**2) + U(xi));
        if (i > 0) H.set(i, i-1, -(hbar**2)/(2*m*dx**2));
        if (i < N-1) H.set(i, i+1, -(hbar**2)/(2*m*dx**2));
    }

    let {energies, vectors} = LinearAlgorithms.findEigenvaluesAndVectors(
        H, 1e-4, maxIter, 
        (iter, deltaT, offDiag) => {
            self.postMessage({ status: "iteration", data: { iter: iter, deltaT: deltaT, offDiag: offDiag } });
        }
    );

    let pairs = energies.map((E, i) => ({ E, psi: vectors[i] }));

    pairs.sort((a, b) => a.E - b.E);
    energies = pairs.map(p => p.E);
    vectors = pairs.map(p => p.psi);

    // нормировка \int |\psi|^2 dx = 1
    for (let n = 0; n < vectors.length; n++) {
        let sum = 0;
        for (let i = 0; i < vectors[n].length; i++)
            sum += vectors[n].get(i)**2;
        let norm = Math.sqrt(sum * dx);
        if (norm > 0) vectors[n] = vectors[n].multiply(1 / norm);
    }

    return {x_values, energies, wavefunctions: vectors};
}
