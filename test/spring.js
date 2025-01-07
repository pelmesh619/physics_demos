const frameRenderTime = 1 / 40;
const ticksPerFrame = 10;
const timeScale = 1;

const showDebugInfo = false;

function dt() {
    return frameRenderTime / ticksPerFrame * timeScale;
}

const borderWidth = 30;

class Main {
    constructor(form) {
        this.form = form;
        this.stopped = false;
    }

    reloadModel() {
        this.renderer = new Renderer2D('spring', borderWidth, -borderWidth / 2, -10);
        this.simulationModel = new MechanicsSimulationModel(this.form, this.renderer);
        this.simulationModel.addObject(new Grid(new Vec2(0, 0), new Vec2(20, 20)));
        this.simulationModel.enableVelocityVectorRender = document.getElementById('showVelocities').checked;

        let circle = new CircleBody(1, new Vec2(3, 0), 1);


        // this.simulationModel.addObject(new TrailPath(this.simulationModel, circle));
        this.simulationModel.addObject(circle);

        let circle2 = new CircleBody(1, new Vec2(3, 3), 1);
        let circle3 = new CircleBody(1, new Vec2(6, 3), 1);


        this.simulationModel.addObject(new TrailPath(this.simulationModel, circle3));
        this.simulationModel.addObject(circle2);
        this.simulationModel.addObject(circle3);

        let point1 = new StaticObject(new Vec2(0, 0));

        this.simulationModel.addObject(point1);

        this.simulationModel.addObject(new Spring(point1, circle, 3, 10000));
        this.simulationModel.addObject(new Spring(circle, circle2, 3, 10000));
        this.simulationModel.addObject(new Spring(circle2, circle3, 3, 10000));


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

    var mainObject = new Main(undefined);

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
        
    }

    get position() {
        return this.obj1.position.add(this.obj2.position).multiply(0.5);
    }

    get velocity() {
        return this.obj1.velocity.add(this.obj2.velocity);
    }

    update() {
        let obj1ToObj2 = this.obj2.futurePosition.subtract(this.obj1.position);
        let newDistance = obj1ToObj2.length;

        let force1 = obj1ToObj2.normalize().multiply((newDistance - this.distance) * this.k / 2);
        let force2 = force1.multiply(-1);

        if (this.obj1.immoveable && this.obj2.immoveable) {
            return;
        } else if (this.obj1.immoveable) {
            force2 = force2.multiply(2);
        } else if (this.obj2.immoveable) {
            force1 = force1.multiply(2);
        }

        this.obj1.applyForce(force1);
        this.obj2.applyForce(force2);
    }

    render(renderer) {
        renderer.DrawLine(this.obj1.position, this.obj2.position, 'purple', 5);
    }
}


class CircleBody extends DinamicObject {
    constructor(radius, startPosition, mass=1) {
        super(startPosition);
        
        this.radius = radius;
        this.mass = mass;
    }

    render(renderer) {
        renderer.DrawCircumference(this.position, this.radius, 'red', 5);
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

        this.dataAmountLimit = 200;
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
                    time: this.simulationModel.time,
                    position: this.position,
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
        for (let i = 0; i < this.size.x + this.step.x; i += this.step.x) {
            let x = i - this.size.x / 2 + this.position.x;
            let startY = this.position.y - this.size.y / 2;
            let endY = this.position.y + this.size.y / 2;

            renderer.DrawLine(new Vec2(x, startY), new Vec2(x, endY), 'rgb(60, 100, 220)');
        }
        for (let j = 0; j < this.size.y + this.step.y; j += this.step.y) {
            let y = j - this.size.y / 2 + this.position.y;
            let startX = this.position.x - this.size.x / 2;
            let endX = this.position.x + this.size.x / 2;

            renderer.DrawLine(new Vec2(startX, y), new Vec2(endX, y), 'rgb(60, 100, 220)');
            
        }
    }
}

window.onload = main;
