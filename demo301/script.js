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
        this.gridMatrix = [];
        
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

    reloadModel(willCalculate=true) {        
        const values = this.form.GetValues();

        let functionParts = []
        try {
            for (let i = 0; i < values.potentialFunc.length; i++) {
                let f = eval("(x) => { return " + values.potentialFunc[i].expr + "; }");
                functionParts.push({expr: f, cond: values.potentialFunc[i].cond});
            }
        } catch (error) {
            console.log(error);
            window.alert('Функция задана неправильно!');
            return;
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
        new Grid(new Vec2(0, 0), new Vec2(20, 20), new Vec2(0.25, 0.25)).render(renderer);
        if (this.wavefunctions.length != 0){
            this.renderFuncValues(this.x_values, this.wavefunctions.at(this.chosenWaveFunction), "red");
        }
    }
}
