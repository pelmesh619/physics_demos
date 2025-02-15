const borderWidth = 40;

var colorGradientStart = -10;
var colorGradientEnd = 10;

function getRainbowColor(value) {
    let v = (clamp(value, colorGradientStart, colorGradientEnd) - colorGradientStart) /
        (colorGradientEnd - colorGradientStart);
  
    const angle = (1 - v) * 270;
  
    return "hsla(" + Math.round(angle) + " 80 50 / 40%)";
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
        this.renderer.addScrollResponseHandler((_) => {
            t.calculator.reset();
            t.renderer.PrepareFrame();
            t.calculator.renderObjects(t.renderer);
            t.calculator.renderArrows(t.renderer, getRainbowColor);
        });
        this.renderer.addMouseDragHandler((_) => {
            t.calculator.reset();
            t.renderer.PrepareFrame();
            t.calculator.renderObjects(t.renderer);
            t.calculator.renderArrows(t.renderer, getRainbowColor);
        });
    }

    reloadModel() {
        const values = this.form.GetValues();
        [colorGradientStart, colorGradientEnd] = [values.colorGradientStart, values.colorGradientEnd].sort();

        this.calculator = new GraphCalculator();
        
        for (let charge of values.charges) {
            this.calculator.addObject(new Charge(charge.position, charge.charge));
        }

        this.calculator.addObject(new Dipole(Vec2.Zero, Vec2.Right));
        this.calculator.addObject(new Dipole(Vec2.Right.multiply(4), Vec2.Right));

        // this.calculator.renderPlot(this.renderer, STEP, getRainbowColor);
        this.renderer.PrepareFrame();
        this.calculator.renderObjects(this.renderer);
        this.calculator.renderArrows(this.renderer, getRainbowColor);

    }
}

class GraphCalculator {
    constructor() {
        this.reset();
        this.objects = [];
    }

    reset() {
        this.values = {};
        this.primitiveValues = {};
    }

    addObject(obj) {
        this.objects.push(obj)
    }

    calculateStrengthFieldAtPoint(p) {
        let sum = Vec2.Zero;

        this.objects.forEach((obj) => {
            sum = sum.add(obj.calculateStrengthFieldAtPoint(p));
        });

        return sum;
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


    renderArrows(renderer, colorFunction) {
        this.zeroPointR = renderer.translateCoordinatesToRenderSpace(
            new Vec2(
                roundByStep(renderer.offsetX + round(renderer.sizeX / 2), ARROWSTEP),
                roundByStep(renderer.offsetY + round(renderer.sizeY / 2), ARROWSTEP),
            )
        );

        for (let i = this.zeroPointR.x; i < renderer.contextWidth + ARROWSTEP; i += ARROWSTEP) {
            for (let j = this.zeroPointR.y; j < renderer.contextHeight + ARROWSTEP; j += ARROWSTEP) {
                let p = renderer.translateCoordinatesToModelSpace(i, j);
                let fieldStrength = this.calculateStrengthFieldAtPoint(p);
                renderer.DrawVector(p, fieldStrength, colorFunction(fieldStrength.length));
            }
            for (let j = this.zeroPointR.y - ARROWSTEP; j > -ARROWSTEP; j -= ARROWSTEP) {
                let p = renderer.translateCoordinatesToModelSpace(i, j);
                let fieldStrength = this.calculateStrengthFieldAtPoint(p);
                renderer.DrawVector(p, fieldStrength, colorFunction(fieldStrength.length));
            }
        }
        for (let i = this.zeroPointR.x - ARROWSTEP; i > -ARROWSTEP; i -= ARROWSTEP) {
            for (let j = this.zeroPointR.y; j < renderer.contextHeight + ARROWSTEP; j += ARROWSTEP) {
                let p = renderer.translateCoordinatesToModelSpace(i, j);
                let fieldStrength = this.calculateStrengthFieldAtPoint(p);
                renderer.DrawVector(p, fieldStrength, colorFunction(fieldStrength.length));
            }
            for (let j = this.zeroPointR.y - ARROWSTEP; j > -ARROWSTEP; j -= ARROWSTEP) {
                let p = renderer.translateCoordinatesToModelSpace(i, j);
                let fieldStrength = this.calculateStrengthFieldAtPoint(p);
                renderer.DrawVector(p, fieldStrength, colorFunction(fieldStrength.length));
            }
        }
    }
    renderObjects(renderer) {
        this.objects.forEach((obj) => obj.render(renderer))
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

    const charges = new ListInputScheme(
        new CompoundInputScheme({
            charge: new NumberInputScheme(1, 'Кл', 0.001).WithLabel('\\( q = \\)'),
            position: new Vec2InputScheme(new NumberInputScheme(0, 'м', 0.001), new NumberInputScheme(0, 'м', 0.001)).WithLabel('\\( \\vec{r} = \\)'),
        })
    ).Build("charges", 'Заряды:')
    .WithAddButtonText('Добавить заряд')
    .WithRemoveButtonText('Удалить заряд')

    form
    .AddInputObject(charges)
    .AddInputObject(new NumberInputScheme(0, 'В/м', 0.001).Build("colorGradientEnd", "<div style=\"display: inline-block; background-color: hsl(270 80 50); width: 10px; height: 10px;\"></div"))
    .AddInputObject(new NumberInputScheme(10, 'В/м', 0.001).Build("colorGradientStart", "<div style=\"display: inline-block; background-color: hsl(0 80 50); width: 10px; height: 10px;\"></div"))
    .AddSubmitButton('submitButton', "Перестроить график", () => { mainObject.reloadModel(); });


    var mainObject = new Main(form);

    
    MathJax.Hub.Queue(["Typeset", MathJax.Hub]);

    mainObject.reloadModel();
}

window.onload = main;

class Charge {
    constructor(position, charge) {
        this.charge = charge;
        this.position = position;
    }

    calculateStrengthFieldAtPoint(point) {
        let toPoint = point.subtract(this.position);

        return toPoint.multiply(ElectricConstants.k * this.charge / Math.pow(toPoint.length, 3));
    }

    render(renderer) {
        renderer.DrawCircle(this.position, 0.2);
    }
}

class Dipole {
    constructor(position, moment) {
        this.moment = moment;
        this.position = position;
    }

    calculateStrengthFieldAtPoint(point) {
        let toPoint = point.subtract(this.position);
    
        return toPoint
            .normalize()
            .multiply(2 * toPoint.normalize().scalarProduct(this.moment))
            .subtract(this.moment)
            .multiply(ElectricConstants.k / Math.pow(toPoint.length, 3));
    }

    render(renderer) {
        renderer.DrawCircle(this.position, 0.2);
    }
}
