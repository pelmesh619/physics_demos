const frameRenderTime = 0.016;
const ticksPerFrame = 100;
const timeScale = 1;

const showDebugInfo = false;

const borderWidth = 70;

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
        this.simulationModel.addObject(new GravitationalForce(this.simulationModel));

        let r = 15;
        
        let n = 3;

        for (let i = 0; i < n; i++) {
            let circle = new CircleBody(0.5, new Vec2(r, 0).rotate(i * 2 * Math.PI / n), 30e11, this.simulationModel);

            circle.velocity = Vec2.Up.multiply(5).rotate(i * 2 * Math.PI / n);

            this.simulationModel
            .addObject(new TrailPath(this.simulationModel, circle))
            .addObject(circle)
        }

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

class GravitationalForce {
    constructor(simulationModel=null) {
        this.simulationModel = simulationModel;
        this.position = new Vec2(NaN, NaN);
    }
    
    update() {
        if (this.simulationModel != null) {
            const moveableObjects = this.simulationModel.objects.filter(
                (obj) => obj.position != undefined && obj.mass != undefined && obj.position.isValid()
            )

            for (let i = 0; i < moveableObjects.length; i++) {
                const obj1 = moveableObjects[i];
                for (let j = 0; j < i; j++) {
                    const obj2 = moveableObjects[j];
                    const obj1ToObj2 = obj2.position.subtract(obj1.position);
                    const length = obj1ToObj2.length;

                    if (length > (obj1.radius + obj2.radius) / 2) {
                        let force = obj1ToObj2.normalize().multiply(Constants.G * obj1.mass * obj2.mass / Math.pow(length, 2));

                        if (force.length > Constants.G * obj1.mass * obj2.mass / Math.pow(obj1.radius + obj2.radius, 2)) {
                            force = force.normalize().multiply(Constants.G * obj1.mass * obj2.mass / Math.pow(obj1.radius + obj2.radius, 2))
                        }
                        obj1.applyForce(force);
                        obj2.applyForce(force.multiply(-1));
                    } else {
                        let force = obj1ToObj2.normalize().multiply(obj1.futureVelocity().scalarProduct(obj1ToObj2.normalize()));
                        obj1.applyForce(force.multiply(-obj1.mass / dt()));
                        obj2.applyForce(force.multiply(obj2.mass / dt()));
                    }
                }
            }
        }
    }

    render() { }
}

class CircleBody extends DynamicObject {
    constructor(radius, startPosition, mass=1, simulationModel=null) {
        super(startPosition);
        
        this.radius = radius;
        this.mass = mass;
        this.simulationModel = simulationModel;
    }

    update() {
        if (this.stopForce.length != 0) {
            this.applyForce(this.stopForce);
        }
        this.position = this.nextPosition;

        // if (this.position.x < this.simulationModel.renderer.offsetX || this.simulationModel.renderer.offsetX + this.simulationModel.renderer.sizeX < this.position.x) {
        //     this.velocity.x = -this.velocity.x;
        //     this.position = this.nextPosition;
        // }
        // if (this.position.y < this.simulationModel.renderer.offsetY || this.simulationModel.renderer.offsetY + this.simulationModel.renderer.sizeY < this.position.y) {
        //     this.velocity.y = -this.velocity.y;
        //     this.position = this.nextPosition;
        // }
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

        renderer.DrawCircle(position, 0.1, 'rgba(40, 40, 40, 60%)');
    }

}


window.onload = main;
