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
    }

    reloadModel() {
        if (this.simulationModel != undefined) {
            this.simulationModel.xChart.destroy();
            this.simulationModel.energyChart.destroy();
        } 

        const values = this.form.GetValues();

        this.renderer = new Renderer2D('spring', borderWidth, -borderWidth / 2);
        this.simulationModel = new MechanicsSimulationModel(this.form, this.renderer);
        this.simulationModel.addObject(new Grid(new Vec2(0, 0), new Vec2(20, 20)));
        this.simulationModel.enableVelocityVectorRender = document.getElementById('showVelocities').checked;
        this.simulationModel.useGravity = false;

        let point1 = new StaticObject(new Vec2(0, 0));

        this.simulationModel.addObject(point1);
        
        let circle = new CircleBody(1, new Vec2(values.d + values.deltax, 0), 2, values.envres, integrators.rk3over8);
        circle.velocity = new Vec2(values.v, 0);
        this.circle = circle;

        this.simulationModel.addObject(new TrailPath(this.simulationModel, circle));

        this.simulationModel.spring = new Spring(point1, circle, values.d, values.k);

        this.simulationModel.addObject(this.simulationModel.spring);
        this.simulationModel.addObject(circle);


        // this.simulationModel.addObject(new Spring(circle, circle3, 3, k));

        this.simulationModel.xChart = new Chart('xChart',
            {
                type: "line",
                data: {
                    labels: [],
                    datasets: [{
                        label: "Положение x, м",
                        fill: false,
                        pointRadius: 1,
                        borderColor: "rgba(255,0,0,0.5)",
                        data: []
                    }, {
                        label: "Скорость v_x, м/с",
                        fill: false,
                        pointRadius: 1,
                        borderColor: "rgba(0,0,255,0.5)",
                        data: []
                    }]
                },
                options: {
                    animation: false
                }
            }
        );
        this.simulationModel.energyChart = new Chart('energyChart',
            {
                type: "line",
                data: {
                    labels: [],
                    datasets: [{
                        label: "Кинетическая, Дж",
                        fill: false,
                        pointRadius: 1,
                        borderColor: "rgba(255,0,0,0.5)",
                        data: []
                    }, {
                        label: "Потенциальная, Дж",
                        fill: false,
                        pointRadius: 1,
                        borderColor: "rgba(0,0,255,0.5)",
                        data: []
                    }, {
                        label: "Полная, Дж",
                        fill: false,
                        pointRadius: 1,
                        borderColor: "rgba(0,255,0,0.5)",
                        data: []
                    }]
                },
                options: {
                    animation: false
                }
            }
        );
    }

    nextTick() {
        if (!this.stopped) {
            for (let i = 0; i < ticksPerFrame; i++) {
                this.simulationModel.update();
            }
            this.simulationModel.renderFrame();
        }

        document.getElementById('energyDisplay').innerText = this.simulationModel.getFullEnergy();
    }

    nextTickFactory() {
        var t = this;
        return () => { t.nextTick(); }
    }
}

function main() {
    var form = new FormMaker("springForm");

    form
    .AddNumber(new NumberInput("d", "d = ", new NumberDomain(3, "м", 0.001, 0)))
    .AddNumber(new NumberInput("deltax", "\\(\\Delta x\\) = ", new NumberDomain(1, "м", 0.001)))
    .AddNumber(new NumberInput("v", "<span>\\(\\ v_x \\) = </span>", new NumberDomain(1, "м/с", 0.001)))
    .AddNumber(new NumberInput("k", "<span>\\(\\ k \\) = </span>", new NumberDomain(1, "Н·м", 0.001)))
    .AddNumber(new NumberInput("envres", "<span>\\(\\ k \\) = </span>", new NumberDomain(1, "Н·с/м", 0.001)))
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
    

    mainObject.reloadModel();

    setInterval(
        mainObject.nextTickFactory(),
        frameRenderTime * 1000  // in ms
    )
}


class Spring {
    constructor(obj1, obj2, distance=3, k=1) {
        this.obj1 = obj1;
        this.obj2 = obj2;
        this.distance = distance;
        this.k = k;
        this.mass = 1;
        this.immoveable = false;
        
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
        let obj1ToObj2 = this.obj2.futurePosition.subtract(this.obj1.futurePosition);
        let newDistance = obj1ToObj2.length;

        let forceMagnitude = (newDistance - this.distance) * this.k;
        let force1 = obj1ToObj2.normalize().multiply(forceMagnitude);
        let force2 = obj1ToObj2.normalize().multiply(-forceMagnitude);

        this.obj1.applyForce(force1);
        this.obj2.applyForce(force2);
    }

    getRainbowColor(value) {
        let obj1ToObj2 = this.obj2.futurePosition.subtract(this.obj1.futurePosition);
        let newDistance = obj1ToObj2.length;
        
        value = newDistance / this.distance;
        
        const angle = clamp(value * 80, 0, 160) + 200;
        
        return "hsl(" + Math.round(angle) + " 100 40)";
    }

    render(renderer) {
        renderer.DrawLine(this.obj1.position, this.obj2.position, this.getRainbowColor(), 5);
    }
}

class CircleBody extends DynamicObject {
    constructor(radius, startPosition, mass=1, k, integrator) {
        super(startPosition);
        
        this.radius = radius;
        this.mass = mass;
        this.integrator = integrator;
        this.k = k; // rename
    }

    render(renderer) {
        renderer.DrawCircumference(this.position, this.radius, 'red', 5);
    }

    
    update() {
        if (this.stopForce.length != 0) {
            this.applyForce(this.stopForce);
        }

        this.applyForce(this.velocity.multiply(-this.k));

        this.position = this.nextPosition;
        this.angle = this.nextAngle;

        this.velocity = this.velocity.add(this.acceleration.multiply(dt()));
        this.acceleration = new Vec2(0, 0);
        this.stopForce = new Vec2(0, 0);

        this.angularVelocity += this.angularAcceleration * dt();
        this.angularAcceleration = 0;

        // this.futurePosition = this.position.add(this.velocity.multiply(dt()));
        this.futureAngle = this.angle + this.angularVelocity * dt();

    }

    get nextPosition() {
        let r = this.integrator(this);

        return r.position;
    }
}

class TrailPath {
    constructor(simulationModel, stickToObject, relativePosition=null) {
        if (relativePosition == null) {
            relativePosition = new Vec2(0, 0);
        }
        this.parentObject = stickToObject;
        this.simulationModel = simulationModel;
        this.ticksPerRecord = 10;


        this.relativePosition = relativePosition;

        this.dataAmountLimit = 1500;
        this.velocity = new Vec2(0, 0);

        this.data = [];

        this.counter = 0;
    }

    get position() {
        return this.parentObject.position.add(this.relativePosition.rotate(this.parentObject.angle));
    }

    update() {
        if (this.data.length > 0) {
            this.velocity = this.position.subtract(this.data[this.data.length - 1].position)
            .multiply(this.simulationModel.time - this.data[this.data.length - 1].time);
        } else {
            this.velocity = new Vec2(0, 0);
        }
        if (this.counter % this.ticksPerRecord == 0) {
            this.data.push(
                {
                    time: round(this.simulationModel.time, 3),
                    position: this.position,
                    velocity: this.parentObject.velocity.x,
                    kineticEnergy: this.parentObject.kineticEnergy,
                    potentialEnergy: this.simulationModel.spring.kineticEnergy,
                    fullEnergy: this.simulationModel.spring.kineticEnergy + this.parentObject.kineticEnergy,
                }
            );
        }
        this.counter++;
        if (this.data.length > this.dataAmountLimit && this.dataAmountLimit > 0) {
            this.data.splice(0, this.data.length - this.dataAmountLimit);
        }
    }

    render(renderer) {
        for (let i = 1; i < this.data.length; i++) {
            renderer.DrawLine(this.data[i - 1].position, this.data[i].position, 'green', 3);
        }

        let data = this.simulationModel.xChart.data;
        data.labels = this.data.map((v) => v.time);

        data.datasets[0].data = this.data.map((v) => v.position.x);
        data.datasets[1].data = this.data.map((v) => v.velocity);

        this.simulationModel.xChart.update();


        data = this.simulationModel.energyChart.data;
        data.labels = this.data.map((v) => v.time);

        data.datasets[0].data = this.data.map((v) => v.kineticEnergy);
        data.datasets[1].data = this.data.map((v) => v.potentialEnergy);
        data.datasets[2].data = this.data.map((v) => v.fullEnergy);

        this.simulationModel.energyChart.update();
    }
}

window.onload = main;
