const frameRenderTime = 1 / 100;
const ticksPerFrame = 3;
const timeScale = 0.9;

const showDebugInfo = false;

const borderWidth = 25;

function dt() {
    return frameRenderTime / ticksPerFrame * timeScale;
}

class Main {
    constructor(form) {
        this.form = form;
        this.reloadModel();
        this.stopped = false;
    }

    reloadModel() {
        this.renderer = new Renderer2D('balls', borderWidth, -borderWidth / 2, -1.5);
        this.simulationModel = new CollisionSimulationModel(this.form, this.renderer);

        this.simulationModel.addObject(new CircleBody(1, new Vec2(6, 1)))
        .addObject(new CircleBody(1, new Vec2(6, 3)))
        .addObject(new CircleBody(1, new Vec2(0, 1)))
        .addObject(new CircleBody(1, new Vec2(0, 3)))
        .addObject(new CircleBody(1, new Vec2(-6, 1)))
        .addObject(new CircleBody(1, new Vec2(-6, 3)))
        .addObject(new LineBody(new Vec2(-10, 0), new Vec2(20, 0)))
        .addObject(new LineBody(new Vec2(-10, 11), new Vec2(20, 0)))
        .addObject(new LineBody(new Vec2(-10, 0), new Vec2(0, 10)))
        .addObject(new LineBody(new Vec2(9, 0), new Vec2(0, 10)));
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
    var mainObject = new Main();

    mainObject.reloadModel();

    document.getElementById('showColliders').addEventListener('change', (event) => {
        mainObject.simulationModel.enableColliderRender = event.target.checked;
    });
    document.getElementById('showVelocities').addEventListener('change', (event) => {
        mainObject.simulationModel.enableVelocityVectorRender = event.target.checked;
    });
    document.getElementById('stopSimulation').addEventListener('change', (event) => {
        mainObject.stopped = event.target.checked;
    });
    
    document.getElementById('nextStepButton').addEventListener('click', () => { 
        mainObject.simulationModel.update();
        mainObject.simulationModel.renderFrame();
    });
    document.getElementById('nextFrameButton').addEventListener('click', () => { 
        for (let i = 0; i < 1; i++) {
            mainObject.simulationModel.update();
        }
        mainObject.simulationModel.renderFrame();
    })

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
            RegularPolygonFactory(radius * 1, 7)
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
