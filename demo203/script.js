const frameRenderTime = 0.016;
const ticksPerFrame = 100;
const timeScale = 1;

const showDebugInfo = false;

function dt() {
    return frameRenderTime / ticksPerFrame * timeScale;
}

const borderWidth = 20;


var colorGradientStart = 0;
var colorGradientEnd = 1;

function getRainbowColor(value) {
    let v = (clamp(value, colorGradientStart, colorGradientEnd) - colorGradientStart) /
        (colorGradientEnd - colorGradientStart);

    const angle = (1 - v) * 270;

    return "hsl(" + Math.round(angle) + " 80 50 / 70%)";
}

function getRainbowColor2(value) {
    let v = (clamp(value, colorGradientStart, colorGradientEnd) - colorGradientStart) /
        (colorGradientEnd - colorGradientStart);

    const angle = (1 - v) * 270;

    return "hsl(" + Math.round(angle) + " 80 30)";
}


let wavelengthsToRgb = {};

function wavelength_to_rgb(wavelength) {
    if (wavelength in wavelengthsToRgb)
        return wavelengthsToRgb[wavelength];

    gamma = 0.8;
    intensity_max = 255;
    factor = 0;
    R = G = B = 0
    if ((wavelength >= 380e-9) && (wavelength < 440e-9)) {
        R = -(wavelength - 440e-9) / (440e-9 - 380e-9);
        G = 0.0;
        B = 1.0;
    } else if ((wavelength >= 440e-9) && (wavelength < 490e-9)) {
        R = 0.0;
        G = (wavelength - 440e-9) / (490e-9 - 440e-9);
        B = 1.0;
    } else if ((wavelength >= 490e-9) && (wavelength < 510e-9)) {
        R = 0.0;
        G = 1.0;
        B = -(wavelength - 510e-9) / (510e-9 - 490e-9);
    } else if ((wavelength >= 510e-9) && (wavelength < 580e-9)) {
        R = (wavelength - 510e-9) / (580e-9 - 510e-9);
        G = 1.0;
        B = 0.0;
    } else if ((wavelength >= 580e-9) && (wavelength < 645e-9)) {
        R = 1.0;
        G = -(wavelength - 645e-9) / (645e-9 - 580e-9);
        B = 0.0;
    } else if ((wavelength >= 645e-9) && (wavelength <= 750e-9)) {
        R = 1.0;
        G = 0.0;
        B = 0.0;
    }
    
    R = round(intensity_max * (R * (1.0 - gamma) + gamma))
    G = round(intensity_max * (G * (1.0 - gamma) + gamma))
    B = round(intensity_max * (B * (1.0 - gamma) + gamma))
    
    wavelengthsToRgb[wavelength] = new Vec3(R, G, B);
    return wavelengthsToRgb[wavelength];
}

const infernoColors = [
    [0, 0, 0],         // Черный (начало)
    [72, 12, 168],     // Темно-фиолетовый
    [203, 45, 125],    // Пурпурно-красный
    [246, 89, 59],     // Оранжевый
    [252, 173, 89],    // Желто-оранжевый
    [252, 255, 164]    // Ярко-желтый (конец)
];

function interpolateColor(value) {
    const numColors = infernoColors.length;
    const scaledValue = value * (numColors - 1);
    const index1 = Math.floor(scaledValue);
    const index2 = Math.min(index1 + 1, numColors - 1);
    const fraction = scaledValue - index1;

    const color1 = infernoColors[index1];
    const color2 = infernoColors[index2];

    return "rgb(" + 
        Math.round(color1[0] + fraction * (color2[0] - color1[0])) + " " +
        Math.round(color1[1] + fraction * (color2[1] - color1[1])) + " " +
        Math.round(color1[2] + fraction * (color2[2] - color1[2])) + 
    ")";
}


var STEP = 15;
var STARTARROWSTEP = 50;
var UPPERBOUND_ARROWSTEP = 30;
var LOWERBOUND_ARROWSTEP = 70;
var ARROWSTEP = STARTARROWSTEP;

class Main {
    constructor(form) {
        this.form = form;
        this.stopped = false;
        this.renderer = new Renderer2D('simulationCanvas', borderWidth);
        this.gridMatrix = [];
        
        let t = this;
        this.renderer.addScrollResponseHandler((renderer) => {
            t.renderer.PrepareFrame();
            t.calculator.renderPlot(renderer, STEP, interpolateColor);
        });
        this.renderer.addMouseDragHandler((renderer) => {
            t.renderer.PrepareFrame();
            t.calculator.renderPlot(renderer, STEP, interpolateColor);
        });
    }

    reloadModel() {        
        if (this.calculator != undefined && this.calculator.intensityChart != undefined) {
            this.calculator.intensityChart.destroy();
        } 

        const values = this.form.GetValues();

        function f(x) {
            if (x % values.d > (values.d - values.b)) {
                return 1;
            }
            return 0;
        }

        

        let steps = values.M;
        
        
        let klambda = values.klambda;

        this.calculator = new GraphCalculator(f, values.N * values.d, steps, values.lambda * 1e-9, values.dlambda * 1e-9, values.L);
        this.calculator.intensityChart = new Chart('intensityChart',
            {
                type: "line",
                data: {
                    labels: [],
                    datasets: [{
                        label: "Интенсивность I",
                        fill: false,
                        pointRadius: 1,
                        borderColor: "rgba(255,0,0,0.5)",
                        data: []
                    }]
                },
                options: {
                    animation: false
                }
            }
        );
        
        this.calculator.arrowstepInMeters = STARTARROWSTEP / this.renderer.contextWidth * this.renderer.sizeX;
        
        if (values.dlambda > 0){
            for (let i = 0; i < klambda; i++) {
                this.calculator.calculate((i * (values.dlambda / (klambda - 1)) + values.lambda - values.dlambda / 2) * 1e-9);
            }
        } else {
            this.calculator.calculate(values.lambda * 1e-9);
        }
        this.calculator.finalCalculate();
        
        this.renderer.PrepareFrame();
        this.calculator.renderPlot(this.renderer, STEP, interpolateColor);

    }

}

class GraphCalculator {
    gridCoordinatesToModelSpace(i, j) {
        let xi = this.gridSize / (this.grid.length);
        let yi = this.gridSize / (this.grid[i].length);
        let x0 = i * xi;
        let y0 = j * yi;

        return [x0, y0];
    }

    constructor(grid, gridWidth, calculationSteps, lambda, dlambda, length) {
        this.reset();
        this.grid = grid;
        this.gridWidth = gridWidth;
        this.slits = [];
        this.calculationSteps = calculationSteps;

        for (let i = 0; i < calculationSteps; i++) {
            let x = (i + 0.5) * gridWidth / calculationSteps;
            if (grid(x) == 1) {
                this.slits.push(x);
            }
            
        }
        this.intensity = Array(calculationSteps).fill(0);
        this.rgbImage = Array(calculationSteps).fill(Vec3.Zero);

        this.lambda = lambda;
        this.dlambda = dlambda;
        this.klambda = 2;
        this.screenDistance = length;
        this.arrowstepInMeters = 0;
        this.origin = Vec2.Zero;
    }

    reset() {
        this.values = {};
        this.intensity = [];
    }

    calculate(lambda) {
        if (!(lambda in this.values)) {
            this.values[lambda] = Array(this.calculationSteps).fill(Vec2.Zero);
        }
        let values = this.values[lambda];

        let k = 2 * Math.PI / lambda;

        for (let i = 0; i < this.calculationSteps; i++) {
            let x = (i + 0.5) * this.gridWidth / this.calculationSteps;
            for (let slitX of this.slits) {
                let r = Math.sqrt((x - slitX)**2 + this.screenDistance**2);

                let deltaphi = k * r;

                let E = Vec2.Up.rotate(deltaphi);

                values[i] = values[i].add(E);
            }
        }
    }

    finalCalculate() {
        let maximum = -Infinity;
        let rgbMaximum = 0;


        for (let lambda in this.values) {
            let values = this.values[lambda];
            for (let i = 0; i < values.length; i++) {
                this.intensity[i] += values[i].x**2 + values[i].y**2;
            }
        }

        for (let lambda in this.values) {
            let values = this.values[lambda];
            for (let i = 0; i < values.length; i++) {                  
                this.rgbImage[i] = wavelength_to_rgb(lambda).multiply(values[i].x**2 + values[i].y**2);
            }
        }

        for (let i = 0; i < this.intensity.length; i++) {
            if (this.intensity[i] > maximum) {
                maximum = this.intensity[i];
            }
            if (Math.max(...this.rgbImage[i].do(Math.abs).xyz) > rgbMaximum) {
                rgbMaximum = Math.max(...this.rgbImage[i].do(Math.abs).xyz);
            }
        }

        if (maximum == 0) {
            maximum = 1;
        }
        if (rgbMaximum == 0) {
            rgbMaximum = 1;
        }

        for (let i = 0; i < this.intensity.length; i++) {
            this.intensity[i] = this.intensity[i] / maximum;
            this.rgbImage[i] = this.rgbImage[i].multiply(1 / rgbMaximum);
        }

        this.updateCharts();
    }

    updateCharts() {
        let data = this.intensityChart.data;
        data.labels = [...Array(this.calculationSteps).keys()].map(
            (i) => round((i + 0.5) * this.gridWidth / this.calculationSteps, 4)
        );

        data.datasets[0].data = this.intensity;

        this.intensityChart.update();
    }

    renderPlot(renderer, pixelStep, colorFunction=(p) => Math.abs(p) < 4 ? 'black' : undefined) {       
        let step = this.arrowstepInMeters 
        // let step = renderer.translateLengthToModelSpace(pixelStep);
        let a = this.gridWidth / this.calculationSteps;
        let dVector = new Vec2(a, a);

        for (let i = 0; i < this.intensity.length; i++) {
            this.drawPixel(renderer, i, 0, this.intensity[i], dVector, colorFunction);
        }
        for (let i = 0; i < this.calculationSteps; i++) {
            let x = (i + 0.5) * this.gridWidth / this.calculationSteps;
            this.drawPixel(renderer, (i - this.calculationSteps - 1), 0, this.grid(x), dVector, (a) => a == 0 ? "black" : "gray");
        }
        for (let i = 0; i < this.calculationSteps; i++) {
            this.drawPixel(
                renderer, 
                (i + this.calculationSteps + 1), 0, 
                this.rgbImage[i], dVector, 
                (a) => `rgb(${round(a.x * 255)}, ${round(a.y * 255)}, ${round(a.z * 255)})`
            );
        }
    }

    drawPixel(renderer, i, j, value, dVector, colorFunction) {
        let px = i * dVector.x;
        let py = j * dVector.y;
        let p = new Vec2(px, py).add(this.origin);

        let color = colorFunction(
            value
        );
        if (color !== undefined) {
            renderer.DrawRectangleAsPolygon(
                p, 
                p.add(new Vec2(dVector.x, this.gridWidth)),
                color
            );
        }
    }
}


function main() {
    var form = new FormMaker("mainForm");

    form
    .AddNumber(new NumberInput("lambda", "Центральная длина волны </br>\\( \\lambda \\) = ", new NumberDomain(500, "нм", 0.001, 0)))
    .AddNumber(new NumberInput("dlambda", "Ширина спектра </br>\\( \\Delta \\lambda \\) = ", new NumberDomain(0, "нм", 0.001, 0)))
    .AddNumber(new NumberInput("L", "Расстояние до экрана </br>\\( L \\) = ", new NumberDomain(1, "м", 0.001, 0)))
    .AddNumber(new NumberInput("b", "Ширина щели </br>\\( a \\) = ", new NumberDomain(0.01, "м", 0.001, 0)))
    .AddNumber(new NumberInput("d", "Период </br>\\( d \\) = ", new NumberDomain(0.02, "м", 0.001, 0)))
    .AddNumber(new NumberInput("N", "Количество щелей </br>\\( N \\) = ", new NumberDomain(10, "", 1, 1)))
    .AddNumber(new NumberInput("M", "Шагов вычислений </br>\\( M \\) = ", new NumberDomain(50, "", 1, 1)))
    .AddNumber(new NumberInput("klambda", "Шагов вычислений волн света </br>\\( k_\\lambda \\) = ", new NumberDomain(10, "", 1, 1)))
    .AddSubmitButton('submitButton', "Перестроить график", () => { mainObject.reloadModel(); });

    var mainObject = new Main(form);

    const intensityChart = document.createElement('canvas');
    intensityChart.id = 'intensityChart';

    form.DOMObject.appendChild(intensityChart);
    
    MathJax.Hub.Queue(["Typeset", MathJax.Hub]);

    mainObject.reloadModel();
}

window.onload = main;
