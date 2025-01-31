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

        this.renderer = new Renderer2D('brachistochrone', borderWidth, -1);
        this.simulationModel = new MechanicsSimulationModel(this.form, this.renderer);
        this.simulationModel.addObject(new Grid(new Vec2(10, 0), new Vec2(20, 20)));
        this.simulationModel.enableVelocityVectorRender = document.getElementById('showVelocities').checked;

        this.simulationModel.useGravity = false;

        let circle = new CircleBody(values.r, new Vec2(0, 0), 1);

        circle.velocity = new Vec2(values.v, 0);
        circle.canRotate = true;
        circle.angularVelocity = values.v / values.r;

        this.simulationModel.addObject(new TrailPathWithVelocity(this.simulationModel, circle, new Vec2(0, -values.r)));
        this.simulationModel.addObject(circle);
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
    document.getElementById('showVelocities').addEventListener('change', (event) => {
        mainObject.simulationModel.enableVelocityVectorRender = event.target.checked;
    });

    var brachistochroneForm = new FormMaker("brachistochroneForm");

    var mainObject = new Main(brachistochroneForm);

    brachistochroneForm
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

class TrailPathWithVelocity extends TrailPath {
    get position() {
        return this.parentObject.position.add(this.relativePosition.rotate(this.parentObject.angle));
    }

    get velocity() {
        if (this.data.length > 0) {
            return this.position.subtract(this.data[this.data.length - 1].position)
            .multiply(1 / (this.simulationModel.time - this.data[this.data.length - 1].time));
        } 
        return Vec2.Zero;
    }

    set velocity(value) { }
}


window.onload = main;
