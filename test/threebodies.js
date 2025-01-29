const frameRenderTime = 0.016;
const ticksPerFrame = 100;
const timeScale = 1;

const showDebugInfo = false;

const borderWidth = 60;

function dt() {
    return frameRenderTime / ticksPerFrame * timeScale;
}

DynamicObject.integrator = integrators.euler;

class Main {
    constructor(form) {
        this.form = form;
        this.stopped = false;
    }

    reloadModel() {
        this.allTimeMaximum = -Infinity;
        this.allTimeMinimum = Infinity;

        this.renderer = new Renderer2D('balls', borderWidth);
        this.simulationModel = new MechanicsSimulationModel(this.form, this.renderer);
        this.simulationModel.useGravity = false;

        // let r = 10;
        
        // let n = 8;

        // for (let i = 0; i < n; i++) {
        //     let circle = new CircleBody(0.5, new Vec2(r, 0).rotate(i * 2 * Math.PI / n), 2e10, this.simulationModel);

        //     circle.velocity = Vec2.Up.multiply(10).rotate(i * 2 * Math.PI / n);

        //     this.simulationModel
        //     .addObject(new TrailPath(this.simulationModel, circle))
        //     .addObject(circle);
        // }

        let sun = new CircleBody(0.1, new Vec2(0, 0), 33940e7, this.simulationModel);
        this.simulationModel
        .addObject(new TrailPath(this.simulationModel, sun))
        .addObject(sun);

        let earth = new CircleBody(0.07, new Vec2(15, 0), 43e7, this.simulationModel);
        earth.velocity = Vec2.Down.multiply(Math.sqrt(Constants.G * (earth.mass + sun.mass) / earth.position.length));
        this.simulationModel
        .addObject(new TrailPath(this.simulationModel, earth))
        .addObject(earth);

        let moon = new CircleBody(0.05, new Vec2(15.3, 0), 0.523e7, this.simulationModel);
        moon.velocity = Vec2.Down.multiply(Math.sqrt(Constants.G * (earth.mass + moon.mass) / (earth.position.subtract(moon.position)).length)).add(earth.velocity);
        this.simulationModel
        .addObject(new TrailPath(this.simulationModel, moon))
        .addObject(moon);

        // circle.velocity = Vec2.Right.multiply(0.2);

        this.simulationModel.addObject(new MassCenter(this.simulationModel));
    }

    nextTick() {
        if (!this.stopped) {
            for (let i = 0; i < ticksPerFrame; i++) {
                this.simulationModel.update();

            }
            this.updateEnergyValues();
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
    var mainObject = new Main();

    mainObject.reloadModel();

    document.getElementById('restartButton').addEventListener("click", () => { mainObject.reloadModel(); });

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
        for (let i = 0; i < ticksPerFrame; i++) {
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
    constructor(radius, startPosition, mass=1, simulationModel=null) {
        super(startPosition);
        
        this.radius = radius;
        this.mass = mass;
        this.simulationModel = simulationModel;
    }

    update() {
        if (this.simulationModel != null) {
            const thisObj = this;

            
            const moveableObjects = this.simulationModel.objects.filter(
                (obj) => obj.position != undefined && obj.mass != undefined && obj.position.isValid()
            )

            moveableObjects.forEach((obj) => {
                if (obj === thisObj) {
                    return;
                }

                const obj1ToObj2 = obj.position.subtract(thisObj.position);
                const length = obj1ToObj2.length;

                if (length > obj.radius + thisObj.radius || true) {
                    const force = obj1ToObj2.normalize().multiply(Constants.G * thisObj.mass * obj.mass / Math.pow(length, 2));
                    thisObj.applyForce(force);
                } else {
                    // const force = obj1ToObj2.normalize().multiply(thisObj.futureVelocity().scalarProduct(obj1ToObj2.normalize()));
                    // thisObj.applyForce(force.multiply(-thisObj.mass / dt()));
                }
            })
        }

        if (this.stopForce.length != 0) {
            this.applyForce(this.stopForce);
        }
        this.position = this.nextPosition;
        this.angle = this.nextAngle;

        this.velocity = this.velocity.add(this.acceleration.multiply(dt()));
        this.acceleration = new Vec2(0, 0);
        this.stopForce = new Vec2(0, 0);

        this.angularVelocity += this.angularAcceleration * dt();
        this.angularAcceleration = 0;

        this.futureAngle = this.angle + this.angularVelocity * dt();
    }

    futureVelocity() {
        return this.velocity.add(this.acceleration.multiply(dt()));
    }

    render(renderer) {
        renderer.DrawCircle(this.position, this.radius, 'rgba(250, 10, 10, 60%)');
    }
}

class MassCenter {
    constructor(simulationModel=null) {
        this.simulationModel = simulationModel;
        this.position = new Vec2(NaN, NaN);
    }

    update() { }

    render(renderer) {
        const moveableObjects = this.simulationModel.objects.filter(
            (obj) => obj.position != undefined && obj.mass != undefined && obj.position.isValid()
        )

        let position = moveableObjects
        .reduce((sum, obj) => obj.position.multiply(obj.mass).add(sum), Vec2.Zero)
        .multiply(1 / moveableObjects.reduce((sum, obj) => sum + obj.mass, 0));

        renderer.DrawCircle(position, 0.3, 'rgba(40, 40, 40, 60%)');
    }

}


class TrailPath {
    constructor(simulationModel, stickToObject, relativePosition=null) {
        if (relativePosition == null) {
            relativePosition = new Vec2(0, 0);
        }
        this.parentObject = stickToObject;
        this.simulationModel = simulationModel;
        this.ticksPerRecord = ticksPerFrame * 2;


        this.relativePosition = relativePosition;

        this.dataAmountLimit = 3 / frameRenderTime;
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
            renderer.DrawLine(this.data[i - 1].position, this.data[i].position, 'rgba(10, 250, 10, 70%)', 3);
        }
    }
}


window.onload = main;
