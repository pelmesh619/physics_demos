const frameRenderTime = 1 / 40;
const ticksPerFrame = 10;
const timeScale = 1;

const showDebugInfo = false;

function dt() {
    return frameRenderTime / ticksPerFrame * timeScale;
}

const borderWidth = 22.5;

class Main {
    constructor(form) {
        this.form = form;
        this.stopped = false;
    }

    reloadModel() {
        const values = this.form.GetValues();

        this.renderer = new Renderer2D('brachistochrone', borderWidth, 0);
        this.simulationModel = new MechanicsSimulationModel(this.form, this.renderer);
        this.simulationModel.enableColliderRender = document.getElementById('showColliders').checked;
        this.simulationModel.enableVelocityVectorRender = document.getElementById('showVelocities').checked;

        this.simulationModel.useGravity = false;

        let circle = new CircleBody(values.r, new Vec2(0, 0), 1);

        circle.velocity = new Vec2(values.v, 0);
        circle.canRotate = true;
        circle.angularVelocity = values.v / values.r;

        this.simulationModel.addObject(new TrailPath(this.simulationModel, circle, new Vec2(0, 1)));
        this.simulationModel.addObject(circle);
        this.simulationModel.addObject(new Grid(new Vec2(10, 0), new Vec2(20, 20)));
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

    var ballisticForm = new FormMaker("brachistochroneForm");

    var mainObject = new Main(ballisticForm);

    ballisticForm
    .AddNumber(new NumberInput("r", "r = ", new NumberDomain(1, "м", 0.001, 0)))
    .AddNumber(new NumberInput("v", "v<sub>x</sub> = ", new NumberDomain(1, "м/с", 0.001)))
    .AddSubmitButton('submitButton', "Перезапустить симуляцию", () => { mainObject.reloadModel(); })
    .AddButton('nextStepButton', "Следующий шаг симуляции", () => { 
        mainObject.simulationModel.update();
        mainObject.simulationModel.renderFrame();
    })
    .AddButton('nextFrameButton', "Следующий кадр", () => { 
        for (let i = 0; i < 1; i++) {
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

class CircleBody extends DinamicObject {
    constructor(radius, startPosition, mass=1) {
        super(startPosition);
        
        this.radius = radius;
        this.mass = mass;
    }

    render(renderer) {
        renderer.DrawCircumference(this.position, this.radius);
    }
}

class LineBody extends StaticObject {
    constructor(startPosition, direction) {
        super(startPosition);
        this.points = [new Vec2(0, 0), direction];
    }

    render(renderer) {
        renderer.DrawPolygon(this.points.map((vec) => vec.add(this.position)), 'purple');
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


        this.position = new Vec2(NaN, NaN);
        this.relativePosition = relativePosition;

        this.dataAmountLimit = 1000;

        this.data = [];

        this.counter = 0;
    }

    update() {
        if (this.counter % this.ticksPerRecord == 0) {
            this.data.push(
                {
                    "position": this.parentObject.position.add(this.relativePosition.rotate(this.parentObject.angle)),
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
    }
}

class Grid extends StaticObject {
    constructor(position, size, step=new Vec2(1, 1)) {
        super(new Vec2(0, 0));
        this.position = position;
        this.size = size;
        this.step = step;
    }

    render(renderer) {
        for (let i = 0; i < this.size.x; i += this.step.x) {
            let x = i - this.size.x / 2;
            let startY = this.position.y - this.size.y / 2;
            let endY = this.position.y + this.size.y / 2;

            renderer.DrawLine(new Vec2(x, startY), new Vec2(x, endY));
        }
        for (let j = 0; j < this.size.y; j += this.step.y) {
            let y = j - this.size.y / 2;
            let startX = this.position.x - this.size.x / 2;
            let endX = this.position.x + this.size.x / 2;

            renderer.DrawLine(new Vec2(startX, y), new Vec2(endX, y));
            
        }
    }
}

window.onload = main;
