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
var STARTARROWSTEP = 50;
var UPPERBOUND_ARROWSTEP = 30;
var LOWERBOUND_ARROWSTEP = 70;
var ARROWSTEP = STARTARROWSTEP;

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
            let arrowstep = t.calculator.arrowstepInMeters / t.renderer.sizeX * t.renderer.contextWidth;
            if (arrowstep > UPPERBOUND_ARROWSTEP) {
                t.calculator.arrowstepInMeters /= 2;
            }
            if (arrowstep < LOWERBOUND_ARROWSTEP) {
                t.calculator.arrowstepInMeters *= 2;
            }
            
            t.calculator.renderEquipotentials(this.renderer);
            t.calculator.renderObjects(t.renderer);
            t.calculator.renderArrows(t.renderer, getRainbowColor);
        });
        this.renderer.addMouseDragHandler((_) => {
            t.calculator.reset();
            t.renderer.PrepareFrame();
            t.calculator.renderEquipotentials(this.renderer);
            t.calculator.renderObjects(t.renderer);
            t.calculator.renderArrows(t.renderer, getRainbowColor);
        });

        this.renderer.addMouseOverHandler((point) => {
            let fieldStrength = t.calculator.calculateStrengthFieldAtPoint(point);
            
            return "(" + toScientificNotation(point.x) + ' м, ' + toScientificNotation(point.y) + " м)<br/>" + 
              "(" + toScientificNotation(fieldStrength.x) + ' В/м, ' + toScientificNotation(fieldStrength.y) + ' В/м)<br/>' + 
              toScientificNotation(fieldStrength.length) + ' В/м<br/>' + 
              toScientificNotation(t.calculator.calculatePotentialAtPoint(point)) + ' В';
        });
    }

    reloadModel() {
        const values = this.form.GetValues();
        [colorGradientStart, colorGradientEnd] = [values.colorGradientStart, values.colorGradientEnd].sort();

        this.calculator = new GraphCalculator();
        
        for (let charge of values.charges) {
            this.calculator.addObject(new Charge(charge.position, charge.charge));
        }
        for (let dipole of values.dipoles) {
            this.calculator.addObject(new Dipole(dipole.position, dipole.moment));
        }
        
        this.calculator.arrowstepInMeters = STARTARROWSTEP / this.renderer.contextWidth * this.renderer.sizeX;

        // this.calculator.renderPlot(this.renderer, STEP, getRainbowColor);
        this.renderer.PrepareFrame();
        this.calculator.renderEquipotentials(this.renderer);
        this.calculator.renderObjects(this.renderer);
        this.calculator.renderArrows(this.renderer, getRainbowColor);

    }
}

class GraphCalculator {
    constructor() {
        this.reset();
        this.objects = [];
        this.arrowstep = ARROWSTEP;
        this.arrowstepInMeters = 0;
        this.potentialStep = 4;
        this.pixelPotentialStep = 8;
    }

    reset() {
        this.values = {};
        this.primitiveValues = {};
        this.equipotentialCells = {};
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

    calculatePotentialAtPoint(p) {
        let sum = 0;

        this.objects.forEach((obj) => {
            sum += obj.calculatePotentialAtPoint(p);
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
        this.center = new Vec2(
            roundByStep(renderer.offsetX + renderer.sizeX / 2, this.arrowstepInMeters),
            roundByStep(renderer.offsetY + renderer.sizeY / 2, this.arrowstepInMeters),
        );

        let step = this.arrowstepInMeters;
        let t = this;

        function drawArrow(p) {
            let fieldStrength = t.calculateStrengthFieldAtPoint(p);
            renderer.DrawVector(p, fieldStrength.normalize(), colorFunction(fieldStrength.length));
        }


        for (let i = this.center.x; i < this.center.x + renderer.sizeX / 2 + step; i += step) {
            for (let j = this.center.y; j < this.center.y + renderer.sizeY / 2 + step; j += step) {
                drawArrow(new Vec2(i, j));
            }
            for (let j = this.center.y - step; j > this.center.y - renderer.sizeY / 2 - step; j -= step) {
                drawArrow(new Vec2(i, j));
            }
        }
        for (let i = this.center.x - step; i > this.center.x - renderer.sizeX / 2 - step; i -= step) {
            for (let j = this.center.y; j < this.center.y + renderer.sizeY / 2 + step; j += step) {
                drawArrow(new Vec2(i, j));
            }
            for (let j = this.center.y - step; j > this.center.y - renderer.sizeY / 2 - step; j -= step) {
                drawArrow(new Vec2(i, j));
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

    
    renderEquipotentials(renderer) {
        this.equipotentialCells = {};
      
        for (let i = 0; i < renderer.contextWidth + this.pixelPotentialStep; i += this.pixelPotentialStep) {
            for (let j = 0; j < renderer.contextHeight + this.pixelPotentialStep; j += this.pixelPotentialStep) {      
                if (this.equipotentialCells[new Vec2(i, j).key] === 1) {
                    continue;
                }

                
      
                let vec = renderer.translateCoordinatesToModelSpace(i, j);
                let potential = this.calculatePotentialAtPoint(vec);
                if (Math.abs(potential) < 0.01 * this.potentialStep) {
                    continue;
                }
      
                if (Math.abs(potential % this.potentialStep) > 0.03 * this.potentialStep) {
                    continue;
                }

                let equipotential = new Equipotential(this, renderer, potential);
                equipotential.Search(new Vec2(i, j), this.pixelPotentialStep);
                for (let c in equipotential.cells) {
                    let p = Vec2.fromKey(c);
                    renderer.DrawPixel(p, 'black', this.pixelPotentialStep);

                    this.equipotentialCells[p.key] = 1;
                }
                for (let c in equipotential.blacklist) {
                    this.equipotentialCells[c] = 1;
                }
            }
        }
    }
}

class Equipotential {
    constructor(calculator, renderer, targetValue, potentialFunc) {
        this.targetValue = targetValue;
        this.potentialFunc = potentialFunc;
        this.calculator = calculator;
        this.renderer = renderer;
        this.cells = {};
        this.blacklist = {};
    }
  
    Search(startCell, pixelStep) {
        let startNeighbors = [];
        for (let d of [Vec2.Up, Vec2.UpRight, Vec2.Right, Vec2.DownRight, Vec2.Down, Vec2.DownLeft, Vec2.Left, Vec2.UpLeft]) {
            startNeighbors.push(startCell.add(d.multiply(pixelStep)));
        }
  
        startNeighbors.sort((a, b) => {
            let p1 = this.renderer.translateCoordinatesToModelSpace(a);
            let p2 = this.renderer.translateCoordinatesToModelSpace(b);
            let abs1 = Math.abs(this.targetValue - this.calculator.calculatePotentialAtPoint(p1));
            let abs2 = Math.abs(this.targetValue - this.calculator.calculatePotentialAtPoint(p2));
            return abs1 - abs2;
        })
  
        this.Add(new Vec2(startCell[0], startCell[1]));
    
        while (true) {
            let neighbors = [];
            for (let d of [Vec2.Up, Vec2.UpRight, Vec2.Right, Vec2.DownRight, Vec2.Down, Vec2.DownLeft, Vec2.Left, Vec2.UpLeft]) {
                let newCell = startCell.add(d.multiply(pixelStep));
                neighbors.push(newCell);
            }
  
            neighbors.sort((a, b) => {
                let p1 = this.renderer.translateCoordinatesToModelSpace(a);
                let p2 = this.renderer.translateCoordinatesToModelSpace(b);
                let abs1 = Math.abs(this.targetValue - this.calculator.calculatePotentialAtPoint(p1));
                let abs2 = Math.abs(this.targetValue - this.calculator.calculatePotentialAtPoint(p2));
                return abs1 - abs2;
            });
  
            let success = false;
    
            let i = 0;
            while (i < 3) {
                if (this.Exists(neighbors[i]) || this.blacklist[neighbors[i].key] === 1) {
                    i++;
                    continue;
                }
                this.Add(neighbors[i]);

                if (0 <= neighbors[i].x && neighbors[i].x < this.renderer.contextWidth && 
                    0 <= neighbors[i].y && neighbors[i].y < this.renderer.contextHeight) {
                    startCell = neighbors[i];
                } else if (0 <= startNeighbors[1].x && startNeighbors[1].x < this.renderer.contextWidth && 
                    0 <= startNeighbors[1].y && startNeighbors[1].y < this.renderer.contextHeight) {
                    startCell = startNeighbors[1];
                }
                success = true;
                break;
            }
            for (i = Math.max(i, 3); i < neighbors.length; i++) {
                this.blacklist[neighbors[i].key] = 1;
            }
            if (success) {
                continue;
            }
        
            break;
        }
    }
  
    Exists(vec) {
        return this.cells[vec.key] === 1;
    }
  
    Add(vec) {
        this.cells[vec.key] = 1;
    }
}

  
function main() {
    var form = new FormMaker("mainForm");

    const charges = new ListInputScheme(
        new CompoundInputScheme({
            charge: new ScienceNumberInputScheme(1e-9, 'Кл', 0.001).WithLabel('\\( q = \\)'),
            position: new Vec2InputScheme(new NumberInputScheme(0, 'м', 0.001), new NumberInputScheme(0, 'м', 0.001)).WithLabel('\\( \\vec{r} = \\)'),
        })
    ).Build("charges", 'Заряды:')
    .WithAddButtonText('Добавить заряд')
    .WithRemoveButtonText('Удалить заряд')

    const dipoles = new ListInputScheme(
        new CompoundInputScheme({
            moment: new Vec2InputScheme(new ScienceNumberInputScheme(1e-9, 'Кл·м', 0.001), new ScienceNumberInputScheme(1e-9, 'Кл·м', 0.001)).WithLabel('\\( \\vec p = \\)'),
            position: new Vec2InputScheme(new NumberInputScheme(0, 'м', 0.001), new NumberInputScheme(0, 'м', 0.001)).WithLabel('\\( \\vec{r} = \\)'),
        })
    ).Build("dipoles", 'Диполи:')
    .WithAddButtonText('Добавить диполь')
    .WithRemoveButtonText('Удалить диполь')

    form
    .AddInputObject(charges)
    .AddInputObject(dipoles)
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

    calculatePotentialAtPoint(point) {
        if (point.equal(this.position)) {
            return Vec2.Zero;
        }
    
        return ElectricConstants.k * this.charge / point.subtract(this.position).length;
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

    calculatePotentialAtPoint(point) {
        if (point.equal(this.position)) {
            return Vec2.Zero;
        }
    
        let r = point.subtract(this.position);
        let r_n = r.normalize();
    
        return ElectricConstants.k / r.length / r.length * this.moment.scalarProduct(r_n);
    }

    render(renderer) {
        let angle = this.moment.angleBetween(Vec2.Right);

        renderer.DrawFilledArc(this.position, 0.2, angle - Math.PI / 2, angle + Math.PI / 2, false, 'red');
        renderer.DrawFilledArc(this.position, 0.2, angle - Math.PI / 2, angle + Math.PI / 2, true, 'blue');
    }
}
