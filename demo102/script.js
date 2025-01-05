const frameRenderTime = 1 / 40;
const ticksPerFrame = 5;
const timeScale = 1;

const showDebugInfo = false;

function dt() {
    return frameRenderTime / ticksPerFrame * timeScale;
}

const borderWidth = 10;

class Main {
    constructor(form) {
        this.form = form;
        this.reloadModel();
        this.stopped = false;
    }

    reloadModel() {
        const values = this.form.GetValues();

        this.renderer = new Renderer2D('ballisticSimulation', borderWidth);
        this.simulationModel = new CollisionSimulationModel(this.form, this.renderer);

        this.simulationModel.objects.push(new CircleBody(1, new Vec2(0, values['h'] + 1), 1));
        this.simulationModel.objects[0].velocity = new Vec2(values['v'] * Math.cos(values['alpha']), values['v'] * Math.sin(values['alpha']));
        // this.simulationModel.objects.push(new CircleBody(1, new Vec2(2, 3.5)));
        // this.simulationModel.objects[1].velocity = new Vec2(1, 0);
        // this.simulationModel.objects.push(new CircleBody(2.23, new Vec2(0, 6), 5));
        // this.simulationModel.objects.push(new CircleBody(1, new Vec2(9, 5)));
        // this.simulationModel.objects.push(new CircleBody(1, new Vec2(9, 7)));
        // this.simulationModel.objects.push(new CircleBody(1, new Vec2(7, 1)));
        // this.simulationModel.objects.push(new CircleBody(1, new Vec2(7, 3)));
        // this.simulationModel.objects.push(new CircleBody(1, new Vec2(7, 5)));
        // this.simulationModel.objects.push(new CircleBody(1, new Vec2(7, 7)));
        // this.simulationModel.objects.push(new CircleBody(1, new Vec2(5, 1)));
        // this.simulationModel.objects.push(new CircleBody(1, new Vec2(5, 3)));
        // this.simulationModel.objects.push(new CircleBody(1, new Vec2(5, 5)));
        // this.simulationModel.objects.push(new CircleBody(1, new Vec2(5, 7)));
        this.simulationModel.objects.push(new LineBody(new Vec2(-10, 0), new Vec2(20, 0)));
        this.simulationModel.objects.push(new LineBody(new Vec2(-10, 10), new Vec2(20, 0)));
        this.simulationModel.objects.push(new LineBody(new Vec2(-10, 0), new Vec2(0, 10)));
        this.simulationModel.objects.push(new LineBody(new Vec2(10, 0), new Vec2(0, 10)));

        this.simulationModel.objects[0].angle = Math.PI / 3;
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
    var ballisticForm = new FormMaker("ballisticForm");

    var mainObject = new Main(ballisticForm);

    ballisticForm
    .AddNumber(new NumberInput("v", "|v| = ", new NumberDomain(10, "м/с", 0.001, 0)))
    .AddNumber(new NumberInput("alpha", "α = ", new NumberDomain(1.57, "рад", 0.001, -1.570, 1.570)))
    .AddNumber(new NumberInput("h", "h = ", new NumberDomain(1, "м", 0.001, 0)))
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
        this.rigidbody = new PolygonRigidbody(
            this,
            RegularPolygonFactory(radius * 0.95, 8)
        );
    }

    render(renderer) {
        renderer.DrawCircle(this.position, this.radius);
        renderer.DrawVector(this.position, this.velocity);
    }
}

class LineBody extends StaticObject {
    constructor(startPosition, direction) {
        super(startPosition);
        this.rigidbody = new PolygonRigidbody(this, [new Vec2(0, 0), direction, direction.normalize().rotateClockwise90().add(direction), direction.normalize().rotateClockwise90()]);
    }
}

window.onload = main;
