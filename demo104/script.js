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
        this.allTimeMaximum = -Infinity;
        this.allTimeMinimum = Infinity;
        const values = this.form.GetValues();

        this.renderer = new Renderer2D('simulation', borderWidth);
        this.simulationModel = new CollisionSimulationModel(this.form, this.renderer);
        this.simulationModel.useGravity = false;
        this.simulationModel.enableColliderRender = document.getElementById('showColliders').checked;
        this.simulationModel.enableVelocityVectorRender = document.getElementById('showVelocities').checked;

        let objects = [];

        for (let body of values.bodies) {
            let circle = new CircleBody(body.radius, body.position, body.mass);
            circle.velocity = body.velocity;

            this.simulationModel.addObject(new TrailPath(this.simulationModel, circle));
            objects.push(circle);
        }

        let t = this;
        objects.forEach((obj) => t.simulationModel.addObject(obj));

        this.simulationModel.objects.push(new LineBody(new Vec2(-10, -6), new Vec2(20, 0)));
        this.simulationModel.objects.push(new LineBody(new Vec2(-10, 7), new Vec2(20, 0)));
        this.simulationModel.objects.push(new LineBody(new Vec2(-10, -7), new Vec2(0, 14)));
        this.simulationModel.objects.push(new LineBody(new Vec2(9, -7), new Vec2(0, 14)));

    }

    nextTick() {
        if (!this.stopped) {
            for (let i = 0; i < ticksPerFrame; i++) {
                this.simulationModel.update();
                this.updateEnergyValues();

            }
            this.simulationModel.renderFrame();
            this.updateEnergyDisplay();
        }
    }

    updateEnergyDisplay() {
        document.getElementById('energyDisplay').innerText = 
            'Энергия системы: \n' + toScientificNotation(this.simulationModel.getFullEnergy(), 6) + "\n" +  
            "Минимум: \n" + toScientificNotation(this.allTimeMinimum, 6) + "\n" + 
            "Максимум: \n" + toScientificNotation(this.allTimeMaximum, 6);
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
    document.getElementById('showColliders').addEventListener('change', (event) => {
        mainObject.simulationModel.enableColliderRender = event.target.checked;
    });
    document.getElementById('showVelocities').addEventListener('change', (event) => {
        mainObject.simulationModel.enableVelocityVectorRender = event.target.checked;
    });

    var form = new FormMaker("mainForm");

    var mainObject = new Main(form);

    const bodies = new ListInputScheme(
        new CompoundInputScheme({
            mass: new NumberInputScheme(1, 'кг', 0.001, 0.001).WithLabel('\\( m = \\)'),
            radius: new NumberInputScheme(1, 'м', 0.001, 0.001).WithLabel('\\( R = \\)'),
            position: new Vec2InputScheme(new NumberInputScheme(0, 'м', 0.001), new NumberInputScheme(0, 'м', 0.001)).WithLabel('\\( \\vec{r} = \\)'),
            velocity: new Vec2InputScheme(new NumberInputScheme(0, 'м/с', 0.001), new NumberInputScheme(0, 'м/с', 0.001)).WithLabel('\\( \\vec{v} = \\)'),
        })
    ).Build("bodies", 'Тела:')
    .WithAddButtonText('Добавить тело')
    .WithRemoveButtonText('Удалить тело')

    bodies.CreateNewInputObject();
    bodies.CreateNewInputObject();

    form
    .AddInputObject(bodies)
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

    bodies.SetValue(form.formId, [
        {
            radius: 1,
            mass: 1,
            position: Vec2.UpLeft,
            velocity: Vec2.DownRight,
        },
        {
            radius: 2,
            mass: 10,
            position: Vec2.DownRight.multiply(2),
            velocity: Vec2.UpLeft,
        }
    ]);
    bodies.Reload(form);

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

window.onload = main;
