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

    // Линейная интерполяция для каждого канала
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
        const values = this.form.GetValues();

        // [colorGradientStart, colorGradientEnd] = [values.colorGradientStart, values.colorGradientEnd].sort();

        let grid = Array(values.d.x).fill().map(() => Array(values.d.y).fill(0));
        // grid[Math.round(values.d.x/2)][3] = 1;
        for (let i = 1; i < values.d.x; i += 100) {
            for (let j = 1; j < values.d.y; j += 100) {
                grid[i][j] = 1;
            }
        }

        grid[values.d.x - 2][values.d.y - 2] = 1;
        // grid[Math.round(values.d.x/2)] = Array(values.d.y).fill().map(() => 1);
        // grid[Math.round(values.d.x/2) - 1] = Array(values.d.y).fill().map(() => 1);
        // grid[Math.round(values.d.x/2) + 1] = Array(values.d.y).fill().map(() => 1);

        let klambda = 10;

        this.calculator = new GraphCalculator(grid, values.a, values.lambda * 1e-9, values.dlambda * 1e-9, values.L);
        this.calculator.arrowstepInMeters = STARTARROWSTEP / this.renderer.contextWidth * this.renderer.sizeX;
        for (let i = 0; i < klambda; i++) {
            this.calculator.calculate((i * (values.dlambda / (klambda - 1)) + values.lambda - values.dlambda / 2) * 1e-9);
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

    constructor(grid, gridSize, lambda, dlambda, length) {
        this.reset();
        this.grid = grid;
        this.gridSize = gridSize;
        this.slits = [];

        for (let i = 0; i < grid.length; i++) {
            for (let j = 0; j < grid[i].length; j++) {
                if (grid[i][j] == 1) {
                    this.slits.push(
                        new Vec3(...this.gridCoordinatesToModelSpace(i, j), 0)
                    );
                }
            }
        }
        this.intensity = Array(this.grid.length).fill().map(() => Array(this.grid[0].length).fill(0));

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
            this.values[lambda] = Array(this.grid.length).fill().map(() => Array(this.grid[0].length).fill(Vec2.Zero));
        }
        let values = this.values[lambda];

        let k = 2 * Math.PI / lambda;

        for (let slit of this.slits) {
            for (let i = 0; i < values.length; i++) {
                for (let j = 0; j < values[i].length; j++) {
                    let v = new Vec3(...this.gridCoordinatesToModelSpace(i, j), this.screenDistance);

                    let r = slit.subtract(v).length;

                    let deltaphi = k * r;

                    let E = Vec2.Up.rotate(deltaphi).multiply(1 / r);

                    values[i][j] = values[i][j].add(E);
                }
            }
        }
    }

    finalCalculate() {
        let maximum = -Infinity;

        for (let lambda in this.values) {
            let values = this.values[lambda];
            for (let i = 0; i < values.length; i++) {
                for (let j = 0; j < values[i].length; j++) {
                    this.intensity[i][j] += values[i][j].x**2 + values[i][j].y**2;
                }
            }
        }

        if (maximum == 0) {
            maximum = 1;
        }

        for (let i = 0; i < this.intensity.length; i++) {
            for (let j = 0; j < this.intensity[i].length; j++) {
                if (this.intensity[i][j] > maximum) {
                    maximum = this.intensity[i][j];
                }
            }
        }

        for (let i = 0; i < this.intensity.length; i++) {
            for (let j = 0; j < this.intensity[i].length; j++) {
                this.intensity[i][j] = this.intensity[i][j] / maximum;
            }
        }
    }

    renderPlot(renderer, pixelStep, colorFunction=(p) => Math.abs(p) < 4 ? 'black' : undefined) {       
        let step = this.arrowstepInMeters 
        // let step = renderer.translateLengthToModelSpace(pixelStep);
        let dVector = new Vec2(1, 1);

        for (let i = 0; i < this.intensity.length; i++) {
            for (let j = 0; j < this.intensity[0].length; j++) {
                this.drawPixel(renderer, i, j, this.intensity[i][j], dVector, colorFunction);
            }
        }
        for (let i = 0; i < this.grid.length; i++) {
            for (let j = 0; j < this.grid[0].length; j++) {
                this.drawPixel(renderer, i - this.grid.length - 1, j, this.grid[i][j], dVector, (a) => a == 0 ? "black" : "gray");
            }
        }
    }

    drawPixel(renderer, i, j, value, dVector, colorFunction) {
        let px = (i - this.intensity.length / 2) * dVector.x;
        let py = (j - this.intensity[0].length / 2) * dVector.y;
        let p = new Vec2(px, py).add(this.origin);

        let color = colorFunction(
            value
        );
        if (color !== undefined) {
            renderer.DrawPolygon(
                [
                    p, 
                    p.add(Vec2.Right.multiply(dVector.x)), 
                    p.add(Vec2.Right.multiply(dVector.x)).add(Vec2.Down.multiply(dVector.y)), 
                    p.add(Vec2.Down.multiply(dVector.y))
                ], 
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
    .AddNumber(new NumberInput("a", "Ширина сетки </br>\\( a \\) = ", new NumberDomain(0.02, "м", 0.001, 0)))
    .AddInputObject(new Vec2Input("d", "Разрешение сетки </br>\\( d \\) = ", new Vec2InputScheme(new NumberInputScheme(30, "", 0.001, 1), new NumberInputScheme(30, "", 0.001, 1))))
    .AddSubmitButton('submitButton', "Перестроить график", () => { mainObject.reloadModel(); });

    var mainObject = new Main(form);
    
    MathJax.Hub.Queue(["Typeset", MathJax.Hub]);

    mainObject.reloadModel();
}


window.onload = main;
