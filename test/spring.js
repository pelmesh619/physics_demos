const frameRenderTime = 0.016;
const ticksPerFrame = 1000;
const timeScale = 1;

const showDebugInfo = false;

function dt() {
    return frameRenderTime / ticksPerFrame * timeScale;
}

var borderWidth = 20;

class Main {
    constructor(form) {
        this.form = form;
        this.stopped = false;

        this.allTimeMaximum = -Infinity;
        this.allTimeMinimum = Infinity;
    }

    static scenarios = {
        pendulum: (mainObject) => {
            borderWidth = 20;
            mainObject.renderer = new Renderer2D('spring', borderWidth, -borderWidth / 2);

            let point1 = new StaticObject(new Vec2(0, 0));

            mainObject.simulationModel.addObject(point1);
            
            let circle = new CircleBody(1, new Vec2(3, 0), 1, 0, integrators[document.getElementById('integrator-select').value]);
            mainObject.circle = circle;
    
            let k = 10000;
            mainObject.simulationModel.addObject(new TrailPath(mainObject.simulationModel, circle));
    
            mainObject.simulationModel.addObject(circle);
            mainObject.simulationModel.addObject(new Spring(point1, circle, 3, k));
        },
        string_paradox: (mainObject) => {
            document.getElementById('removeMiddleString').removeAttribute("disabled");

            borderWidth = 30;
            mainObject.renderer = new Renderer2D('spring', borderWidth, -borderWidth / 2, -15);

            let point1 = new StaticObject(new Vec2(0, 0));

            mainObject.simulationModel.addObject(point1);
            
            let circle = new CircleBody(0.1, new Vec2(0, -2), 0.1, 10, integrators[document.getElementById('integrator-select').value]);
            let circle2 = new CircleBody(0.1, new Vec2(0, -3), 0.1, 10, integrators[document.getElementById('integrator-select').value]);
            let circle3 = new CircleBody(1, new Vec2(0, -5), 10, 10, integrators[document.getElementById('integrator-select').value]);

            mainObject.circle = circle;

            let k = 60;
            let k2 = 100000;
            mainObject.simulationModel.addObject(new TrailPath(mainObject.simulationModel, circle3));

            let spring1 = new Spring(point1, circle, 1, k);
            let spring2 = new NonStretchableString(circle, circle2, 1, k2, Vec2.Zero, 'rgba(20, 20, 190, 60%)');
            let spring3 = new Spring(circle2, circle3, 1, k);
            let spring4 = new NonStretchableString(point1, circle2, 4, k2, Vec2.Left.multiply(0.2), 'rgba(20, 190, 20, 60%)');
            let spring5 = new NonStretchableString(circle, circle3, 4, k2, Vec2.Right.multiply(0.2), 'rgba(190, 20, 20, 60%)');
            mainObject.simulationModel.addObject(circle)
            .addObject(circle2)
            .addObject(circle3)
            .addObject(spring1);

            mainObject.middleStringIndex = mainObject.simulationModel.objects.length;

            mainObject.simulationModel.addObject(spring2)
            .addObject(spring3)
            .addObject(spring4)
            .addObject(spring5);
        },
        ellipse: (mainObject) => {
            borderWidth = 30;
            mainObject.renderer = new Renderer2D('spring', borderWidth);
            mainObject.simulationModel.useGravity = false;
            
            let circle = new CircleBody(1, new Vec2(4, 0), 1, 0, integrators[document.getElementById('integrator-select').value]);

            mainObject.circle = circle;
            circle.velocity = new Vec2(0, 10);

            let k = 100000;
            mainObject.simulationModel.addObject(new TrailPath(mainObject.simulationModel, circle))
            .addObject(new EllipticalSpring(new StaticObject(new Vec2(-3, 0)), circle, new StaticObject(new Vec2(3, 0)), 8, k))
            .addObject(circle);
        },
        triple_pendulum: (mainObject) => {
            borderWidth = 35;
            mainObject.renderer = new Renderer2D('spring', borderWidth, -borderWidth / 2, -10);

            let point1 = new StaticObject(new Vec2(0, 0));

            mainObject.simulationModel.addObject(point1);

            let n = 3;
            let length = 9;
            let k = 100000;

            let lastCircle = point1;
            for (let i = 1; i <= n; i++) {
                let circle = new CircleBody(0.3, new Vec2(0, i * length / n), 1, 0, integrators[document.getElementById('integrator-select').value]);
                
                mainObject.simulationModel.addObject(circle)
                .addObject(new Spring(lastCircle, circle, length / n, k));

                lastCircle = circle;
            }

            lastCircle.velocity = Vec2.Right.multiply(5);
            mainObject.simulationModel.addObject(new TrailPath(mainObject.simulationModel, lastCircle));

        },
        spring_pendulum: (mainObject) => {
            borderWidth = 35;
            mainObject.renderer = new Renderer2D('spring', borderWidth, -borderWidth / 2, -10);

            let point1 = new StaticObject(new Vec2(0, 0));

            let circle1 = new CircleBody(0.7, new Vec2(2, -5), 0.5, 0, integrators[document.getElementById('integrator-select').value]);
    
            let k = 10;
            mainObject.simulationModel.addObject(new TrailPath(mainObject.simulationModel, circle1))
            .addObject(point1)
            .addObject(circle1)
            .addObject(new Spring(point1, circle1, 3, k));
        },
    }

    removeMiddleString() {
        this.simulationModel.objects.splice(this.middleStringIndex, 1);
    }

    reset() {
        this.allTimeMaximum = -Infinity;
        this.allTimeMinimum = Infinity;

        this.simulationModel = new MechanicsSimulationModel(this.form, undefined);
        this.simulationModel.addObject(new Grid(new Vec2(0, 0), new Vec2(20, 20)));
        this.simulationModel.enableVelocityVectorRender = document.getElementById('showVelocities').checked;

        const node = document.getElementById("scenario-commentary");
        for (let i = 0; i < node.children.length; i++) {
            node.children[i].style.display = 'none';
        }
    }

    reloadModel() {
        this.reset();

        let scenario = document.getElementById('scenario-select').value;

        Main.scenarios[scenario](this);
        this.simulationModel.renderer = this.renderer;

        let commentaryNode = document.getElementById(scenario + '-commentary');
        if (commentaryNode) {
            commentaryNode.style.display = 'block';
        }
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
    var mainObject = new Main(undefined);

    document.getElementById('restartButton').addEventListener("click", () => { mainObject.reloadModel(); });

    document.getElementById('showVelocities').addEventListener('change', (event) => {
        mainObject.simulationModel.enableVelocityVectorRender = event.target.checked;
    });
    document.getElementById('stopSimulation').addEventListener('change', (event) => {
        mainObject.stopped = event.target.checked;
    });
    
    document.getElementById('nextStepButton').addEventListener('click', () => { 
        mainObject.simulationModel.update();
        mainObject.updateEnergyValues();
        mainObject.simulationModel.renderFrame();
        mainObject.updateEnergyDisplay();
    });
    document.getElementById('nextFrameButton').addEventListener('click', () => { 
        for (let i = 0; i < ticksPerFrame; i++) {
            mainObject.simulationModel.update();
            mainObject.updateEnergyValues();
        }
        mainObject.simulationModel.renderFrame();

        mainObject.updateEnergyDisplay();
    });

    document.getElementById('removeMiddleString').addEventListener('click', (event) => { 
        mainObject.removeMiddleString();
        event.target.setAttribute("disabled", true);
    });

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
        this.mass = 1;
        this.immoveable = false;
        
    }

    get position() {
        return this.obj1.position.add(this.obj2.position).multiply(0.5);
    }

    get futurePosition() {
        return this.obj1.futurePosition.add(this.obj2.futurePosition).multiply(0.5);
    }

    get velocity() {
        return this.obj1.velocity.add(this.obj2.velocity);
    }

    get kineticEnergy() {
        let obj1ToObj2 = this.obj2.position.subtract(this.obj1.position);
        let newDistance = obj1ToObj2.length;

        return Math.pow(newDistance - this.distance, 2) * this.k / 2;
    }

    getPotentialEnergy() { return 0; }

    update() {
        let obj1ToObj2 = this.obj2.futurePosition.subtract(this.obj1.futurePosition);
        let newDistance = obj1ToObj2.length;

        let forceMagnitude = (newDistance - this.distance) * this.k;
        let force1 = obj1ToObj2.normalize().multiply(forceMagnitude);
        let force2 = obj1ToObj2.normalize().multiply(-forceMagnitude);

        this.obj1.applyForce(force1);
        this.obj2.applyForce(force2);
    }

    render(renderer) {
        let obj1ToObj2 = this.obj2.futurePosition.subtract(this.obj1.futurePosition);
        let newDistance = obj1ToObj2.length;
        let opacity = round(clamp((this.distance - newDistance) / this.distance * 20 + 70, 40, 100));

        renderer.DrawLine(this.obj1.position, this.obj2.position, `rgba(190, 30, 190, ${opacity}%)`, 5);
    }
}

class NonStretchableString {
    constructor(obj1, obj2, distance=3, k=1, offset=Vec2.Zero, color='blue') {
        this.obj1 = obj1;
        this.obj2 = obj2;
        this.distance = distance;
        this.k = k;
        this.mass = 1;
        this.immoveable = false;
        this.offset = offset;
        this.color = color;
        
    }

    get position() {
        return this.obj1.position.add(this.obj2.position).multiply(0.5);
    }

    get futurePosition() {
        return this.obj1.futurePosition.add(this.obj2.futurePosition).multiply(0.5);
    }

    get velocity() {
        return this.obj1.velocity.add(this.obj2.velocity);
    }

    get kineticEnergy() { return 0; }

    getPotentialEnergy() { return 0; }

    update() {
        let obj1ToObj2 = this.obj2.futurePosition.subtract(this.obj1.futurePosition);
        let newDistance = obj1ToObj2.length;

        if (newDistance < this.distance) {
            return;
        }

        let forceMagnitude = (newDistance - this.distance) * this.k;
        let force1 = obj1ToObj2.normalize().multiply(forceMagnitude);
        let force2 = obj1ToObj2.normalize().multiply(-forceMagnitude);

        this.obj1.applyForce(force1);
        this.obj2.applyForce(force2);
    }

    render(renderer) {
        let obj1ToObj2 = this.obj2.futurePosition.subtract(this.obj1.futurePosition);
        let newDistance = obj1ToObj2.length;
        let width = (this.distance - newDistance) / this.distance < 0.01 ? 5 : 10;

        renderer.DrawLine(
            this.obj1.position.add(this.offset), 
            this.obj2.position.add(this.offset), 
            this.color, 
            width);
    }
}


class EllipticalSpring {
    constructor(obj1, obj2, obj3, distance=3, k=1) {
        this.obj1 = obj1;
        this.obj2 = obj2;
        this.obj3 = obj3;
        this.distance = distance;
        this.k = k;
        this.mass = 1;
        this.immoveable = false;
        
    }

    get position() {
        return this.obj1.position.add(this.obj2.position).add(this.obj3.position).multiply(1 / 3);
    }

    get futurePosition() {
        return this.obj1.futurePosition.add(this.obj2.futurePosition).multiply(0.5);
    }

    get velocity() {
        return this.obj1.velocity.add(this.obj2.velocity).add(this.obj3.velocity);
    }

    get kineticEnergy() {
        let obj1ToObj2 = this.obj2.futurePosition.subtract(this.obj1.futurePosition);
        let obj2ToObj3 = this.obj3.futurePosition.subtract(this.obj2.futurePosition);
        let newDistance = obj1ToObj2.length + obj2ToObj3.length;

        return Math.pow(newDistance - this.distance, 2) * this.k / 2;
    }

    getPotentialEnergy() { return 0; }

    update() {
        let obj1ToObj2 = this.obj2.futurePosition.subtract(this.obj1.futurePosition);
        let obj2ToObj3 = this.obj3.futurePosition.subtract(this.obj2.futurePosition);
        let newDistance = obj1ToObj2.length + obj2ToObj3.length;

        let forceMagnitude = (newDistance - this.distance) * this.k;
        let force1 = obj1ToObj2.normalize().multiply(forceMagnitude);
        let force2 = obj1ToObj2.normalize().multiply(-forceMagnitude);
        let force3 = obj2ToObj3.normalize().multiply(-forceMagnitude);
        force2 = force2.add(obj2ToObj3.normalize().multiply(forceMagnitude));

        this.obj1.applyForce(force1);
        this.obj2.applyForce(force2);
        this.obj3.applyForce(force3);
    }

    render(renderer) {
        renderer.DrawLine(this.obj1.position, this.obj2.position, 'purple', 5);
        renderer.DrawLine(this.obj2.position, this.obj3.position, 'purple', 5);
    }
}


class CircleBody extends DynamicObject {
    constructor(radius, startPosition, mass=1, envres, integrator) {
        super(startPosition);
        
        this.radius = radius;
        this.mass = mass;
        this.integrator = integrator;
        this.envres = envres;
    }

    render(renderer) {
        renderer.DrawCircumference(this.position, this.radius, 'red', 5);
    }

    
    update() {
        if (this.stopForce.length != 0) {
            this.applyForce(this.stopForce);
        }

        this.applyForce(this.velocity.multiply(-this.envres));

        this.position = this.nextPosition;
        this.angle = this.nextAngle;

        this.velocity = this.velocity.add(this.acceleration.multiply(dt()));
        this.acceleration = new Vec2(0, 0);
        this.stopForce = new Vec2(0, 0);

        this.angularVelocity += this.angularAcceleration * dt();
        this.angularAcceleration = 0;

        // this.futurePosition = this.position.add(this.velocity.multiply(dt()));
        this.futureAngle = this.angle + this.angularVelocity * dt();

    }

    get nextPosition() {
        let r = this.integrator(this);

        return r.position;
    }
}

window.onload = main;
