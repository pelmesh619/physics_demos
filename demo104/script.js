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
        const values = this.form.GetValues();

        this.renderer = new Renderer2D('simulation', borderWidth);
        this.simulationModel = new CollisionSimulationModel(this.form, this.renderer);
        this.simulationModel.useGravity = false;
        this.simulationModel.enableColliderRender = document.getElementById('showColliders').checked;
        this.simulationModel.enableVelocityVectorRender = document.getElementById('showVelocities').checked;

        for (let body of values.bodies) {
            let circle = new CircleBody(1, body.position, body.mass);
            circle.velocity = body.velocity;

            this.simulationModel.addObject(new TrailPath(this.simulationModel, circle));
            this.simulationModel.addObject(circle);
        }

        this.simulationModel.objects.push(new LineBody(new Vec2(-10, -6), new Vec2(20, 0)));
        this.simulationModel.objects.push(new LineBody(new Vec2(-10, 7), new Vec2(20, 0)));
        this.simulationModel.objects.push(new LineBody(new Vec2(-10, -7), new Vec2(0, 14)));
        this.simulationModel.objects.push(new LineBody(new Vec2(9, -7), new Vec2(0, 14)));

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

    var form = new FormMaker("mainForm");

    var mainObject = new Main(form);

    form
    .AddInputObject(
        new ListInputScheme(
            new CompoundInputScheme({
                mass: new NumberInputScheme(1, 'кг', 0.001, 0.001),
                position: new Vec2InputScheme(new NumberInputScheme(0, 'м', 0.001), new NumberInputScheme(0, 'м', 0.001)),
                velocity: new Vec2InputScheme(new NumberInputScheme(0, 'м/с', 0.001), new NumberInputScheme(0, 'м/с', 0.001)),
            })
        ).Build("bodies", 'Тела:')
        .WithAddButtonText('Добавить тело')
        .WithRemoveButtonText('Удалить тело')
    )
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
            RegularPolygonFactory(radius * 1, 16)
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

class TrailPath2 {
    constructor(simulationModel, stickToObject, relativePosition=null) {
        if (relativePosition == null) {
            relativePosition = new Vec2(0, 0);
        }
        this.parentObject = stickToObject;
        this.simulationModel = simulationModel;
        this.ticksPerRecord = ticksPerFrame;


        this.position = new Vec2(NaN, NaN);
        this.relativePosition = relativePosition;

        this.dataAmountLimit = 3 / frameRenderTime;

        this.data = [];

        this.counter = 0;
    }

    update() {
        if (this.counter % this.ticksPerRecord == 0) {
            this.data.push(
                {
                    "time": round(this.simulationModel.time, 2),
                    "position": this.parentObject.position.add(this.relativePosition.rotate(this.parentObject.angle)),
                    "velocity": this.parentObject.velocity.add(this.relativePosition.multiply(this.parentObject.angle)),
                    "kineticEnergy": this.parentObject.kineticEnergy,
                    "potentialEnergy": this.parentObject.getPotentialEnergy(1),
                    "fullEnergy": this.parentObject.getFullMechanicEnergy(1),
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
            renderer.DrawLine(this.data[i - 1].position, this.data[i].position);
        }
        
        let data = this.simulationModel.xChart.data;
        data.labels = this.data.map((v) => v.time);

        data.datasets[0].data = this.data.map((v) => v.position.x);
        data.datasets[1].data = this.data.map((v) => v.velocity.x);

        this.simulationModel.xChart.update();


        data = this.simulationModel.yChart.data;
        data.labels = this.data.map((v) => v.time);

        data.datasets[0].data = this.data.map((v) => v.position.y);
        data.datasets[1].data = this.data.map((v) => v.velocity.y);

        this.simulationModel.yChart.update();

        data = this.simulationModel.energyChart.data;
        data.labels = this.data.map((v) => v.time);

        data.datasets[0].data = this.data.map((v) => v.kineticEnergy);
        data.datasets[1].data = this.data.map((v) => v.potentialEnergy);
        data.datasets[2].data = this.data.map((v) => v.fullEnergy);

        this.simulationModel.energyChart.update();
    }
}

window.onload = main;
