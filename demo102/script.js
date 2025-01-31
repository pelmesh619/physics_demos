const frameRenderTime = 0.016;
const ticksPerFrame = 100;
const timeScale = 1;

const showDebugInfo = false;

function dt() {
    return frameRenderTime / ticksPerFrame * timeScale;
}

DynamicObject.integrator = integrators.rk4;

const borderWidth = 22.5;

class Main {
    constructor(form) {
        this.form = form;
        this.stopped = false;
    }

    reloadModel() {
        if (this.simulationModel != undefined) {
            this.simulationModel.xChart.destroy();
            this.simulationModel.yChart.destroy();
            this.simulationModel.energyChart.destroy();
        } 

        const values = this.form.GetValues();

        this.renderer = new Renderer2D('ballisticSimulation', borderWidth, -borderWidth / 2, -4);
        this.simulationModel = new CollisionSimulationModel(this.form, this.renderer);
        this.simulationModel.enableColliderRender = document.getElementById('showColliders').checked;
        this.simulationModel.enableVelocityVectorRender = document.getElementById('showVelocities').checked;

        let circle = new CircleBody(1, Vec2.Up.multiply(values.h + 1), 1);

        circle.velocity = new Vec2(values['v'] * Math.cos(values['alpha']), values['v'] * Math.sin(values['alpha']));

        this.simulationModel.addObject(new TrailPath(this.simulationModel, circle));
        this.simulationModel.addObject(new EnvironmentResistanceForce(this.simulationModel, (obj) => obj.velocity.multiply(-values.envres)));
        this.simulationModel.addObject(new ChartObserver(this.simulationModel, circle));
        this.simulationModel.addObject(circle);
        this.simulationModel.addObject(new LineBody(new Vec2(-10, 0), new Vec2(20, 0)));
        this.simulationModel.addObject(new LineBody(new Vec2(-10, 10), new Vec2(20, 0)));
        this.simulationModel.addObject(new LineBody(new Vec2(-10, 0), new Vec2(0, 10)));
        this.simulationModel.addObject(new LineBody(new Vec2(9, 0), new Vec2(0, 10)));



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
        this.simulationModel.yChart = new Chart('yChart',
            {
                type: "line",
                data: {
                    labels: [],
                    datasets: [{
                        label: "Высота y, м",
                        fill: false,
                        pointRadius: 1,
                        borderColor: "rgba(255,0,0,0.5)",
                        data: []
                    }, {
                        label: "Скорость v_y, м/с",
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
    }

    nextTickFactory() {
        var t = this;
        return () => { t.nextTick(); }
    }
}

function main() {
    document.getElementById('showColliders').addEventListener('change', (event) => {
        mainObject.simulationModel.enableColliderRender = event.target.checked;
    });
    document.getElementById('showVelocities').addEventListener('change', (event) => {
        mainObject.simulationModel.enableVelocityVectorRender = event.target.checked;
    });

    var ballisticForm = new FormMaker("ballisticForm");

    var mainObject = new Main(ballisticForm);

    ballisticForm
    .AddNumber(new NumberInput("v", "\\( |v| \\) = ", new NumberDomain(10, "м/с", 0.001, 0)))
    .AddNumber(new NumberInput("alpha", "\\( \\alpha \\) = ", new NumberDomain(1.57 / 2, "рад", 0.001, -1.570, 1.570)))
    .AddNumber(new NumberInput("h", "\\( h \\) = ", new NumberDomain(1, "м", 0.001, 0)))
    .AddNumber(new NumberInput("envres", "\\( \\lambda \\) = ", new NumberDomain(0, "Н·с/м", 0.001)))
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

    const xChart = document.createElement('canvas');
    xChart.id = 'xChart';

    const yChart = document.createElement('canvas');
    yChart.id = 'yChart';

    const energyChart = document.createElement('canvas');
    energyChart.id = 'energyChart';

    ballisticForm.DOMObject.appendChild(xChart);
    ballisticForm.DOMObject.appendChild(yChart);
    ballisticForm.DOMObject.appendChild(energyChart);
    
    MathJax.Hub.Queue(["Typeset", MathJax.Hub]);

    mainObject.reloadModel();

    setInterval(
        mainObject.nextTickFactory(),
        frameRenderTime * 1000  // in ms
    )
}

class CircleBody extends DynamicObject {
    constructor(radius, startPosition, mass=1) {
        super(startPosition);
        
        this.radius = radius;
        this.mass = mass;
        this.rigidbody = new PolygonRigidbody(
            this,
            RegularPolygonFactory(radius * 0.95, 8)
        );
    }

    render(renderer) {
        renderer.DrawCircle(this.position, this.radius);
    }
}

class LineBody extends StaticObject {
    constructor(startPosition, direction) {
        super(startPosition);
        this.points = [new Vec2(0, 0), direction, direction.normalize().rotateClockwise90().add(direction), direction.normalize().rotateClockwise90()]
        this.rigidbody = new PolygonRigidbody(this, this.points);
    }

    render(renderer) {
        renderer.DrawPolygon(this.points.map((vec) => vec.add(this.position)), 'purple');
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
                    "potentialEnergy": this.parentObject.getPotentialEnergy(1),
                    "fullEnergy": this.parentObject.getFullMechanicEnergy(1),
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


        data = this.simulationModel.yChart.data;
        data.labels = timeArray;

        data.datasets[0].data = this.data.map((v) => v.position.y);
        data.datasets[1].data = this.data.map((v) => v.velocity.y);

        this.simulationModel.yChart.update();

        data = this.simulationModel.energyChart.data;
        data.labels = timeArray;

        data.datasets[0].data = this.data.map((v) => v.kineticEnergy);
        data.datasets[1].data = this.data.map((v) => v.potentialEnergy);
        data.datasets[2].data = this.data.map((v) => v.fullEnergy);

        this.simulationModel.energyChart.update();
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

window.onload = main;
