const borderWidth = 40;

var colorGradientStart = -10;
var colorGradientEnd = 10;

function getRainbowColor(value) {
    let v = (clamp(value, colorGradientStart, colorGradientEnd) - colorGradientStart) /
        (colorGradientEnd - colorGradientStart);
  
    const angle = (1 - v) * 270;
  
    return "hsl(" + Math.round(angle) + " 80 50)";
}

var STEP = 10;
var ARROWSTEP = 50;

// -x / Math.pow(Math.hypot(x, y), 3)

// x * (Math.hypot(x, y) - 2) / Math.hypot(x, y)

class Main {
    constructor(form) {
        this.form = form;
        
        this.renderer = new Renderer2D('simulation', borderWidth);

        let t = this;
        this.renderer.addScrollResponseHandler((renderer) => {
            t.calculator.reset();
            t.calculator.renderPlot(renderer, STEP, getRainbowColor);
            this.calculator.renderArrows(this.renderer, getRainbowColor);
        });
        this.renderer.addMouseDragHandler((renderer) => {
            t.calculator.reset();
            t.calculator.renderPlot(renderer, STEP, getRainbowColor);
            this.calculator.renderArrows(this.renderer, getRainbowColor);
        });
    }

    reloadModel() {
        const values = this.form.GetValues();
        [colorGradientStart, colorGradientEnd] = [values.colorGradientStart, values.colorGradientEnd].sort();

        let funcX = `(vec) => { let [x, y] = vec.xy; return ${values.func_x}; }`;
        let funcY = `(vec) => { let [x, y] = vec.xy; return ${values.func_y}; }`;

        try {
            funcX = eval(funcX);
            funcY = eval(funcY);
        } catch (error) {
            console.log(error);
            window.alert('Функция задана неправильно!');
            return;
        }

        this.func = new Vec2Function(funcX, funcY);

        this.calculator = new GraphCalculator(this.func, values.zero);
        this.calculator.renderPlot(this.renderer, STEP, getRainbowColor);
        this.calculator.renderArrows(this.renderer, getRainbowColor);


    }
}

class Vec2Function {
    constructor(funcX, funcY) {
        this.funcX = funcX;
        this.funcY = funcY;

        this.vecFunc = (vec) => new Vec2(funcX(vec), funcY(vec));
    }
}

class GraphCalculator {
    constructor(func, zeroPoint=Vec2.Zero) {
        this.reset();
        this.func = func;
        this.zeroPoint = zeroPoint;
    }

    reset() {
        this.values = {};
        this.primitiveValues = {};
    }

    calculateAtPoint(p) {
        if (this.values[p.key] === undefined) {
            this.values[p.key] = this.func.vecFunc(this.translateFunc(p));
        }
        return this.values[p.key];
    }

    calculatePrimitiveAtPoint(point, stepVector, dVector) {
        if (this.primitiveValues[point.key] === undefined) {
            if (this.zeroPointR.x - stepVector.x <= point.x && point.x <= this.zeroPointR.x + stepVector.x) {
                if (this.zeroPointR.y - stepVector.y <= point.y && point.y <= this.zeroPointR.y + stepVector.y) {
                    this.primitiveValues[point.key] = 0;
                } else if (this.zeroPointR.y < point.y) {
                    this.primitiveValues[point.key] = this.calculatePrimitiveAtPoint(new Vec2(point.x, point.y - stepVector.y), stepVector, dVector) - this.calculateAtPoint(point).y * dVector.y;
                } else {
                    this.primitiveValues[point.key] = this.calculatePrimitiveAtPoint(new Vec2(point.x, point.y + stepVector.y), stepVector, dVector) + this.calculateAtPoint(point).y * dVector.y;
                }
            } else if (this.zeroPointR.x < point.x) {
                this.primitiveValues[point.key] = this.calculatePrimitiveAtPoint(new Vec2(point.x - stepVector.x, point.y), stepVector, dVector) + this.calculateAtPoint(point).x * dVector.x;
            } else {
                this.primitiveValues[point.key] = this.calculatePrimitiveAtPoint(new Vec2(point.x + stepVector.x, point.y), stepVector, dVector) - this.calculateAtPoint(point).x * dVector.x;
            }
        }
        return this.primitiveValues[point.key];
    }

    renderPlot(renderer, pixelStep, colorFunction=(p) => Math.abs(p) < 4 ? 'black' : undefined) {
        let step = renderer.translateLengthToModelSpace(pixelStep);
        let dVector = new Vec2(step, step);

        this.translateFunc = (vec) => renderer.translateCoordinatesToModelSpace(vec);

        this.zeroPointR = renderer.translateCoordinatesToRenderSpace(this.zeroPoint);
        this.primitiveValues[this.zeroPointR.key] = 0;

        for (let i = this.zeroPointR.x; i < renderer.contextWidth; i += pixelStep) {
            for (let j = this.zeroPointR.y; j < renderer.contextHeight; j += pixelStep) {
                this.drawPixel(renderer, i, j, pixelStep, dVector, colorFunction);
            }
            for (let j = this.zeroPointR.y - pixelStep; j > -pixelStep; j -= pixelStep) {
                this.drawPixel(renderer, i, j, pixelStep, dVector, colorFunction);
            }
        }
        for (let i = this.zeroPointR.x - pixelStep; i > -pixelStep; i -= pixelStep) {
            for (let j = this.zeroPointR.y; j < renderer.contextHeight; j += pixelStep) {
                this.drawPixel(renderer, i, j, pixelStep, dVector, colorFunction);
            }
            for (let j = this.zeroPointR.y - pixelStep; j > -pixelStep; j -= pixelStep) {
                this.drawPixel(renderer, i, j, pixelStep, dVector, colorFunction);
            }
        }
    }

    renderArrows(renderer) {
        for (let i = this.zeroPointR.x; i < renderer.contextWidth; i += ARROWSTEP) {
            for (let j = this.zeroPointR.y; j < renderer.contextHeight; j += ARROWSTEP) {
                let p = renderer.translateCoordinatesToModelSpace(i, j);
                renderer.DrawVector(p, this.calculateAtPoint(new Vec2(i, j)));
            }
            for (let j = this.zeroPointR.y - ARROWSTEP; j > -ARROWSTEP; j -= ARROWSTEP) {
                let p = renderer.translateCoordinatesToModelSpace(i, j);
                renderer.DrawVector(p, this.calculateAtPoint(new Vec2(i, j)));
            }
        }
        for (let i = this.zeroPointR.x - ARROWSTEP; i > -ARROWSTEP; i -= ARROWSTEP) {
            for (let j = this.zeroPointR.y; j < renderer.contextHeight; j += ARROWSTEP) {
                let p = renderer.translateCoordinatesToModelSpace(i, j);
                renderer.DrawVector(p, this.calculateAtPoint(new Vec2(i, j)));
            }
            for (let j = this.zeroPointR.y - ARROWSTEP; j > -ARROWSTEP; j -= ARROWSTEP) {
                let p = renderer.translateCoordinatesToModelSpace(i, j);
                renderer.DrawVector(p, this.calculateAtPoint(new Vec2(i, j)));
            }
        }
        // console.log(this.primitiveValues);
    }

    drawPixel(renderer, i, j, pixelStep, dVector, colorFunction) {
        let p = new Vec2(i, j);
        let color = colorFunction(
            this.calculatePrimitiveAtPoint(
                p,
                Vec2.UpRight.multiply(pixelStep),
                dVector
            )
        );
        if (color !== undefined) {
            renderer.DrawPixel(p, color, pixelStep);
        }
    }
}

function main() {
    var form = new FormMaker("mainForm");

    form
    .AddInputObject(new StringInputScheme("x").Build("func_x", "\\( F_x \\) = "))
    .AddInputObject(new StringInputScheme("y").Build("func_y", "\\( F_y \\) = "))
    .AddInputObject(new Vec2InputScheme(new NumberInputScheme(0, 'м', 0.001), new NumberInputScheme(0, 'м', 0.001)).Build("zero", "\\( 0 \\) = "))
    .AddInputObject(new NumberInputScheme(-10, 'Дж', 0.001).Build("colorGradientEnd", "<div style=\"display: inline-block; background-color: hsl(270 80 50); width: 10px; height: 10px;\"></div"))
    .AddInputObject(new NumberInputScheme(10, 'Дж', 0.001).Build("colorGradientStart", "<div style=\"display: inline-block; background-color: hsl(0 80 50); width: 10px; height: 10px;\"></div"))
    .AddSubmitButton('submitButton', "Перестроить график", () => { mainObject.reloadModel(); });


    var mainObject = new Main(form);

    
    MathJax.Hub.Queue(["Typeset", MathJax.Hub]);

    mainObject.reloadModel();
}



window.onload = main;
