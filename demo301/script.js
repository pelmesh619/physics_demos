const frameRenderTime = 0.016;
const ticksPerFrame = 100;
const timeScale = 1;

const showDebugInfo = false;

function dt() {
    return frameRenderTime / ticksPerFrame * timeScale;
}

const borderWidth = 20;


class Main {
    constructor(form) {
        this.form = form;
        this.stopped = false;
        this.renderer = new Renderer2D('simulationCanvas', borderWidth);
        this.rawPotentialFunc = [];
        
        let t = this;
        this.renderer.addScrollResponseHandler((renderer) => {
            t.renderer.PrepareFrame();
            t.calculator.renderPlot(renderer);
        });
        this.renderer.addMouseDragHandler((renderer) => {
            t.renderer.PrepareFrame();
            t.calculator.renderPlot(renderer);
        });
    }

    evalPotentialFunction(rawPotentialFunc) {
        let functionParts = []
        try {
            for (let i = 0; i < rawPotentialFunc.length; i++) {
                let f = eval("(x) => { return " + rawPotentialFunc[i].expr + "; }");
                functionParts.push({expr: f, cond: rawPotentialFunc[i].cond});
            }
        } catch (error) {
            console.log(error);
            return undefined;
        }

        function potentialFunc(x) {
            for (let i = 0; i < functionParts.length; i++) {
                let a = functionParts[i];
                if (a.cond.x <= x && x <= a.cond.y) {
                    return a["expr"](x);
                }
            }
            return 0;
        }

        return potentialFunc;
    }

    reloadModel(willCalculate=true, energies=undefined, wavefunctions=undefined) {        
        const values = this.form.GetValues();

        let potentialFunc = this.evalPotentialFunction(values.potentialFunc);
        if (potentialFunc === undefined) {
            window.alert('Функция задана неправильно!');
            return;
        }

        this.rawPotentialFunc = values.potentialFunc;
        this.calculator = new GraphCalculator(this.renderer, values.domain, potentialFunc);
        this.calculator.N = values.N;
        this.calculator.chosenWaveFunction = values.chosenWaveFunction - 1;
        this.calculator.x_values = [];

        const dx = (values.domain.y - values.domain.x)/(values.N+1);
        for (let i = 0; i < values.N; i++) {
            this.calculator.x_values.push(values.domain.x + (i+1)*dx);
        }

        if (willCalculate) {
            this.calculator.calculate(values.maxIter);
        }
        if (energies !== undefined) {
            this.calculator.energies = energies;
        }
        if (wavefunctions !== undefined) {
            this.calculator.wavefunctions = wavefunctions;
        }

        this.render();
        this.updateProbabilityDisplay();
        this.updateEnergyDisplay();
    }

    render() {
        this.renderer.PrepareFrame();
        this.calculator.renderPlot(this.renderer);
    }

    updateProbabilityDisplay() {
        const v = this.form.GetValues();
        let i = this.calculator.chosenWaveFunction;
        if (this.calculator.wavefunctions.length == 0) {
            return;
        }
        let wavefunction = this.calculator.wavefunctions[i];
        let x_values = this.calculator.x_values;

        let s = 0;
        for (let i = 0; i < v.N; i++) {
            let x = x_values[i]
            if (v.probDomain.x <= x && x <= v.probDomain.y) {
                s += wavefunction.get(i)**2;
            }
        }

        s = (s * (v.domain.y - v.domain.x) / (v.N + 1) * 100).toFixed(5);
        this.form.EditDisplay("probabilityDisplay", `Вероятность прохождения в область: ${s}%`);
    }

    updateEnergyDisplay() {
        let i = this.calculator.chosenWaveFunction;
        if (this.calculator.wavefunctions.length == 0) {
            return;
        }

        let energy = toScientificNotation(this.calculator.energies[i]);
        this.form.EditDisplay("energyDisplay", `Энергия выбранной функции: ${energy} Дж`)
    }

}

class GraphCalculator {
    constructor(renderer, domain, potentialFunc) {
        this.reset();
        this.domain = domain;
        this.renderer = renderer;
        this.potentialFunc = potentialFunc;
        this.wavefunctions = [];
        this.energies = [];

    }

    reset() {
        this.values = {};
        this.intensity = [];
    }

    calculate(maxIter) {
        let r = solveSchrodinger(this.potentialFunc, ...this.domain.xy, this.N, maxIter);

        this.x_values = r['x_values'];
        this.energies = r['energies'];
        this.wavefunctions = r['wavefunctions'];

        console.log("Решение:", r);

    }

    renderFunc(x_values, func) {
        let func_values = x_values.map(func);
        this.renderFuncValues(x_values, func_values);
    }

    renderFuncValues(x_values, func_values, color='green') {
        let len = Math.min(x_values.length, func_values.length);

        if (x_values.length != func_values.length) {
            console.warn("Array's lengths are not equal, minimal length was taken")
        }
        if (len == 0) {
            return;
        }

        let prev = new Vec2(x_values.at(0), func_values.at(0));

        for (let i = 1; i < len; i++) {
            let a = new Vec2(x_values.at(i), func_values.at(i));
            this.renderer.DrawLine(prev, a, color, 1);
            prev = a;
        }
    }

    renderPlot(renderer, ) {
        this.renderFunc(this.x_values, this.potentialFunc);
        new Grid(new Vec2(0, 0), new Vec2(20, 20), new Vec2(1, 1)).render(renderer);
        if (this.wavefunctions.length != 0){
            this.renderFuncValues(this.x_values, this.wavefunctions.at(this.chosenWaveFunction), "red");
        }
    }
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

    let {energies, vectors} = LinearAlgorithms.findEigenvaluesAndVectors(H, 1e-4, maxIter);

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

function main() {
    const functionBuilder = new ListInputScheme(
        new CompoundInputScheme({
            expr: new StringInputScheme('x').WithLabel('\\( U = \\)'),
            cond: new Vec2InputScheme(new NumberInputScheme(-100, 'м', 0.001), new NumberInputScheme(100, 'м', 0.001)).WithLabel(''),
        })
    ).Build("potentialFunc", 'Функция потенциала:')
    .WithAddButtonText('Добавить кусок')
    .WithRemoveButtonText('Удалить кусок')

    const chosenWaveFunction = new NumberInputScheme(1, '', 1, 1).Build(
        "chosenWaveFunction", 
        '\\( i = \\)', 
        () => { 
            let v = form.GetValues();
            if (v.chosenWaveFunction > v.N) {
                chosenWaveFunction.SetValue(form.formId, v.N);
            }
            v = form.GetValues();
            mainObject.calculator.chosenWaveFunction = v.chosenWaveFunction - 1;
            mainObject.render(); 
            mainObject.updateProbabilityDisplay();
            mainObject.updateEnergyDisplay();
        }
    )

    let probDomain = new Vec2InputScheme(new NumberInputScheme(-1, 'м', 0.001), new NumberInputScheme(1, 'м', 0.001))
        .Build(
            "probDomain", 
            'Вычислить вероятность для области: <br>'
        );

    var form = new FormMaker("mainForm");

    form
    .AddInputObject(functionBuilder)
    .AddInputObject(new Vec2InputScheme(new NumberInputScheme(-1, 'м', 0.001), new NumberInputScheme(1, 'м', 0.001)).WithLabel('Область исследования: <br>').Build("domain"))
    .AddInputObject(new NumberInputScheme(100, '', 1, 1).WithLabel('Число разбиений: <br> \\( N = \\)').Build("N"))
    .AddInputObject(new NumberInputScheme(500, '', 1, 1).WithLabel('Количество итераций: ').Build("maxIter"))
    .AddSubmitButton('submitButton', "Перестроить график", () => { mainObject.reloadModel(); });

    form.DOMObject.appendChild(document.createElement("br"));

    form
    .AddInputObject(chosenWaveFunction)
    .AddDisplay("energyDisplay", "Энергия выбранной функции: 0 Дж")
    .AddInputObject(probDomain)
    .AddDisplay("probabilityDisplay", "Вероятность прохождения в область: 0%");

    probDomain.AddChangeHandler(form, () => { mainObject.updateProbabilityDisplay(); });

    var mainObject = new Main(form);

    MathJax.Hub.Queue(["Typeset", MathJax.Hub]);

    mainObject.reloadModel(false);

    var advancedForm = new FormMaker("advancedForm")
    .AddButton(
        "exportResults",
        "Экспорт результатов", 
        () => {
            downloadData("wavefunctions.json", JSON.stringify(mainObject.export(), null, 2));
        }
    );

    document.getElementById("importResults").addEventListener("change", function(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = function(e) {
            const data = JSON.parse(e.target.result);
            console.log("Загруженные данные:", data);
        
            mainObject.import(data);
        };
        reader.readAsText(file);
    });
}

window.onload = main;
