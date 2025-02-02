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
        this.renderer = new Renderer2D('spring', borderWidth);
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
        this.simulationModel.useGravity = false;

        let point1 = new StaticObject(new Vec2(0, 0));

        this.simulationModel.addObject(point1);
        
        let circle = new CircleBody(1, new Vec2(values.d + values.deltax, 0), values.m);
        circle.velocity = new Vec2(values.v, 0);
        this.circle = circle;

        this.simulationModel.addObject(new TrailPath(this.simulationModel, circle));
        this.simulationModel.addObject(new EnvironmentResistanceForce(this.simulationModel, (obj) => obj.velocity.multiply(-values.envres)));
        this.simulationModel.addObject(new ChartObserver(this.simulationModel, circle));

        this.simulationModel.spring = new Spring(point1, circle, values.d, values.k);

        this.simulationModel.addObject(this.simulationModel.spring);
        this.simulationModel.addObject(circle);

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
    var form = new FormMaker("springForm");

    form
    .AddNumber(new NumberInput("m", "Масса тела </br>\\( m \\) = ", new NumberDomain(1, "кг", 0.001, 0)))
    .AddNumber(new NumberInput("d", "Изначальная длина пружины </br>\\( d \\) = ", new NumberDomain(3, "м", 0.001, 0)))
    .AddNumber(new NumberInput("deltax", "Отклонение тела </br>\\(\\Delta x\\) = ", new NumberDomain(1, "м", 0.001)))
    .AddNumber(new NumberInput("v", "Первоначальная скорость </br><span>\\( v_x \\) = </span>", new NumberDomain(1, "м/с", 0.001)))
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
    constructor(radius, startPosition, mass=1) {
        super(startPosition);
        
        this.radius = radius;
        this.mass = mass;
    }

    render(renderer) {
        renderer.DrawCircumference(this.position, this.radius, 'red', 5);
    }
}

class EnvironmentResistanceForce {
    constructor(simulationModel=null, func) {
        this.simulationModel = simulationModel;
        this.position = new Vec2(NaN, NaN);
        this.func = func;
    }
    
    update() {
        if (this.simulationModel != null) {
            const moveableObjects = this.simulationModel.objects.filter(
                (obj) => obj.position != undefined && obj.applyForce != undefined && obj.velocity != undefined
            )

            for (let i = 0; i < moveableObjects.length; i++) {
                moveableObjects[i].applyForce(this.func(moveableObjects[i]));
            }
        }
    }

    render() { }

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
