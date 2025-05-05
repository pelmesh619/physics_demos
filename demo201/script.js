const frameRenderTime = 0.016;
const ticksPerFrame = 100;
const timeScale = 1;

const showDebugInfo = false;

function dt() {
    return frameRenderTime / ticksPerFrame * timeScale;
}

const borderWidth = 20;

DynamicObject.integrator = integrators.rk3over8

class Main {
    constructor(form) {
        this.form = form;
        this.stopped = false;
        this.renderer = new Renderer2D('simulationCanvas', borderWidth);
        
        let t = this;
        this.renderer.addMouseResponseHandler((r) => { if (t.stopped) t.simulationModel.renderFrame(r); });
    }

    reloadModel() {
        if (this.simulationModel != undefined && this.simulationModel.xChart != undefined) {
            this.simulationModel.xChart.destroy();
            this.simulationModel.energyChart.destroy();
        } 

        const values = this.form.GetValues();

        this.simulationModel = new MechanicsSimulationModel(this.form, this.renderer);
        this.simulationModel.addObject(new Grid(new Vec2(0, 0), new Vec2(20, 20)));
        this.simulationModel.enableVelocityVectorRender = document.getElementById('showVelocities').checked;
        this.simulationModel.useGravity = true;

        let point1 = new StaticObject(new Vec2(0, 0));

        this.simulationModel.addObject(point1);
        
        let circle = new Pendulum(values.L, Vec2.Left.multiply(values.r / 2), values.m, values.envres);
        circle.angle = (values.varphi1 - 90) * Math.PI / 180;
        
        let circle2 = new Pendulum(values.L, Vec2.Right.multiply(values.r / 2), values.m, values.envres);
        circle2.angle = (values.varphi2 - 90) * Math.PI / 180;

        this.simulationModel.addObject(
            new Spring(
                circle, circle2, 
                Vec2.Right.multiply(values.L1), Vec2.Right.multiply(values.L1), 
                values.d, values.k)
        )
        this.simulationModel.addObject(circle);
        this.simulationModel.addObject(circle2);

    }

    nextTick() {
        if (!this.stopped) {
            for (let i = 0; i < ticksPerFrame; i++) {
                this.simulationModel.update();
                this.updateEnergyValues();
            }
            this.simulationModel.renderFrame();
        }
    }

    updateEnergyValues() {
        this.allTimeMaximum = Math.max(this.simulationModel.getFullEnergy(), this.allTimeMaximum);
        this.allTimeMinimum = Math.min(this.simulationModel.getFullEnergy(), this.allTimeMinimum);
    }

    nextTickFactory() {
        var t = this;
        return () => { t.nextTick(); }
    }
}

function main() {
    var form = new FormMaker("mainForm");

    form
    .AddNumber(new NumberInput("r", "Расстояние между подвесами </br>\\( r \\) = ", new NumberDomain(4, "м", 0.001, 0)))
    .AddNumber(new NumberInput("m", "Масса тела </br>\\( m \\) = ", new NumberDomain(1, "кг", 0.001, 0)))
    .AddNumber(new NumberInput("L", "Длина маятника </br>\\( L \\) = ", new NumberDomain(2, "м", 0.001, 0)))
    .AddNumber(new NumberInput("L1", "Длина крепления пружины </br>\\( L_1 \\) = ", new NumberDomain(1, "м", 0.001, 0)))
    .AddNumber(new NumberInput("d", "Изначальная длина пружины </br>\\( d \\) = ", new NumberDomain(3, "м", 0.001, 0)))
    .AddNumber(new NumberInput("varphi1", "Начальная фаза 1 </br>\\( \\varphi_1 \\) = ", new NumberDomain(30, "\\( ^\\circ \\)", 0.001, 0)))
    .AddNumber(new NumberInput("varphi2", "Начальная фаза 2 </br>\\( \\varphi_2 \\) = ", new NumberDomain(90, "\\( ^\\circ \\)", 0.001, 0)))
    .AddNumber(new NumberInput("k", "Коэффициент упругости </br><span>\\( k \\) = </span>", new NumberDomain(1, "Н·м", 0.001)))
    .AddNumber(new NumberInput("envres", "Сопротивление среды </br><span>\\( \\lambda \\) = </span>", new NumberDomain(0, "Н·с/м", 0.001)))
    .AddSubmitButton('submitButton', "Перезапустить симуляцию", () => { mainObject.reloadModel(); })
    .AddButton('nextStepButton', "Следующий шаг симуляции", () => { 
        mainObject.simulationModel.update();
        mainObject.simulationModel.renderFrame();
    })
    .AddButton('nextFrameButton', "Следующий кадр", () => { 
        for (let i = 0; i < ticksPerFrame; i++) {
            mainObject.simulationModel.update();
        }
        mainObject.simulationModel.renderFrame();
    })
    .AddCheckbox(new CheckboxInput('stopSimulation', "checkboxes", "Остановить симуляцию", false, 
        (e) => {
            mainObject.stopped = e.target.checked;
        }
    ));

    var mainObject = new Main(form);

    document.getElementById('showVelocities').addEventListener('change', (event) => {
        mainObject.simulationModel.enableVelocityVectorRender = event.target.checked;
    });

    const xChart = document.createElement('canvas');
    xChart.id = 'xChart';

    const energyChart = document.createElement('canvas');
    energyChart.id = 'energyChart';

    form.DOMObject.appendChild(xChart);
    form.DOMObject.appendChild(energyChart);
    
    MathJax.Hub.Queue(["Typeset", MathJax.Hub]);

    mainObject.reloadModel();

    setInterval(
        mainObject.nextTickFactory(),
        frameRenderTime * 1000  // in ms
    )
}


class Spring {
    constructor(obj1, obj2, applyPoint1, applyPoint2, distance=3, k=1) {
        this.obj1 = obj1;
        this.obj2 = obj2;
        this.distance = distance;
        this.k = k;
        this.mass = 1;
        this.immoveable = false;
        this.applyPoint1 = applyPoint1;
        this.applyPoint2 = applyPoint2;
        
    }

    get position() {
        return this.obj1.position.add(this.obj2.position).multiply(0.5);
    }

    get futurePosition() {
        return this.obj1.futurePosition.add(this.obj2.futurePosition).multiply(0.5);
    }

    get velocity() {
        return this.obj1.velocity.add(this.obj2.velocity);
    }

    get kineticEnergy() {
        let obj1ToObj2 = this.obj2.position.subtract(this.obj1.position);
        let newDistance = obj1ToObj2.length;

        return Math.pow(newDistance - this.distance, 2) * this.k / 2;
    }

    getPotentialEnergy() { return 0; }

    update() {
        let a = this.obj1.position.add(this.applyPoint1.rotate(this.obj1.angle));
        let b = this.obj2.position.add(this.applyPoint2.rotate(this.obj2.angle));

        let obj1ToObj2 = a.subtract(b);
        let newDistance = obj1ToObj2.length;

        let forceMagnitude = (newDistance - this.distance) * this.k;
        let force1 = obj1ToObj2.normalize().multiply(-forceMagnitude);
        let force2 = obj1ToObj2.normalize().multiply(forceMagnitude);

        this.obj1.applyForce(force1, a);
        this.obj2.applyForce(force2, b);
    }

    getRainbowColor(value) {
        let obj1ToObj2 = this.obj2.futurePosition.subtract(this.obj1.futurePosition);
        let newDistance = obj1ToObj2.length;
        
        value = newDistance / this.distance;
        
        const angle = clamp(value * 80, 0, 160) + 200;
        
        return "hsl(" + Math.round(angle) + " 100 40)";
    }

    render(renderer) {
        renderer.DrawLine(
            this.obj1.position.add(this.applyPoint1.rotate(this.obj1.angle)), 
            this.obj2.position.add(this.applyPoint2.rotate(this.obj2.angle)), 
            this.getRainbowColor(), 5);
    }
}

class Pendulum extends DynamicObject {
    constructor(radius, startPosition, mass=1, beta=0) {
        super(startPosition);
        
        this.radius = radius;
        this.mass = mass;
        this.beta = beta;
        this.canRotate = true;
        this.center = Vec2.Zero;
        this.forces = [];
        this.momentOfInertia = radius * radius * mass / 2;
    }

    get weightPosition() {
        return Vec2.Right.multiply(this.radius).rotate(this.angle).add(this.position);
    }


    applyForce(forceVec, applyPoint=null) {
        if (applyPoint == null) {
            applyPoint = this.weightPosition;
        }

        if (this.canRotate && applyPoint != null) {
            applyPoint = applyPoint.subtract(this.position);
            
            let deltaAngularAcceleration = -forceVec.determinant(applyPoint);

            this.angularAcceleration += deltaAngularAcceleration / this.momentOfInertia;
            this.forces.push({vec: forceVec, point: applyPoint.rotate(-this.angle)});
        } else {
            this.acceleration = this.acceleration.add(forceVec.multiply(1 / this.mass));
            this.forces.push({vec: forceVec, point: Vec2.Zero});
        }
        
    }

    update() {
        if (this.stopForce.length != 0) {
            this.applyForce(this.stopForce);
        }

        this.applyForce(this.weightPosition.subtract(this.position).rotate(Math.PI / 2).multiply(-this.angularVelocity * this.beta));


        this.angle = this.nextAngle;

        this.velocity = this.velocity.add(this.acceleration.multiply(dt()));
        this.acceleration = new Vec2(0, 0);
        this.stopForce = new Vec2(0, 0);

        this.angularVelocity += this.angularAcceleration * dt();
        this.angularAcceleration = 0;

        this.futureAngle = this.angle + this.angularVelocity * dt();

        console.log(this);

    }

    render(renderer) {
        renderer.DrawCircle(this.weightPosition, 0.3);
        renderer.DrawLine(this.weightPosition, this.position);
        this.forces.forEach((f) => {
            renderer.DrawVector(this.localToGlobal(f.point), f.vec);
        })

        this.forces = [];
    }
}

class ChartObserver {
    constructor(simulationModel, objectToObserve) {
        this.parentObject = objectToObserve;
        this.simulationModel = simulationModel;

        this.ticksPerRecord = ticksPerFrame * 3;
        this.dataAmountLimit = 70;

        this.position = new Vec2(NaN, NaN);

        this.data = [];

        this.counter = 0;
    }

    update() {
        if (this.counter % this.ticksPerRecord == 0) {
            this.data.push(
                {
                    "time": round(this.simulationModel.time, 2),
                    "position": this.parentObject.position,
                    "velocity": this.parentObject.velocity,
                    "kineticEnergy": this.parentObject.kineticEnergy,
                    "potentialEnergy": this.simulationModel.spring.kineticEnergy,
                    "fullEnergy": this.simulationModel.spring.kineticEnergy + this.parentObject.kineticEnergy,
                }
            );
            if (this.data.length > this.dataAmountLimit && this.dataAmountLimit > 0) {
                this.data.splice(0, this.data.length - this.dataAmountLimit);
            }
        }
        this.counter++;
    }

    render(renderer) {
        let timeArray = this.data.map((v) => v.time);
        
        let data = this.simulationModel.xChart.data;
        data.labels = timeArray;

        data.datasets[0].data = this.data.map((v) => v.position.x);
        data.datasets[1].data = this.data.map((v) => v.velocity.x);

        this.simulationModel.xChart.update();

        data = this.simulationModel.energyChart.data;
        data.labels = timeArray;

        data.datasets[0].data = this.data.map((v) => v.kineticEnergy);
        data.datasets[1].data = this.data.map((v) => v.potentialEnergy);
        data.datasets[2].data = this.data.map((v) => v.fullEnergy);

        this.simulationModel.energyChart.update();
    }
}

window.onload = main;
