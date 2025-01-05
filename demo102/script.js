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
        reloadModel();
        this.stopped = false;
    }

    reloadModel() {
        const values = this.form.GetValues();

        this.renderer = new Renderer('ballisticSimulation', borderWidth);
        this.simulationModel = new SimulationModel(this.form, this.renderer);
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
                this.simulationModel.nextTick();
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
        for (let i = 0; i < 1; i++) {
            mainObject.simulationModel.nextTick();
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

function reloadModel() {
    
}

class Renderer {
    constructor(canvasId) {
        this.canvasId = canvasId;
        this.offsetX = -11;
        this.offsetY = -5;
        this.sizeX = 22;
        this.sizeY = this.sizeX / this.contextWidth * this.contextHeight;
        this.context = this.DOMObject.getContext('2d');
        
        this.DOMObject.width = this.contextWidth;
        this.DOMObject.height = this.contextHeight;
        this.context.scale(1, 1);
    }

    get DOMObject() {
        return document.getElementById(this.canvasId);
    }

    get contextHeight() {
        return this.DOMObject === null ? null : this.DOMObject.clientHeight;
    }

    get contextWidth() {
        return this.DOMObject === null ? null : this.DOMObject.clientWidth;
    }

    PrepareFrame() {
        this.context.clearRect(0, 0, this.DOMObject.width, this.DOMObject.height);
    }

    translateCoordinatesToRenderSpace(vec2, y=undefined) {
        let x;
        if (y === undefined) {
            x = vec2.x;
            y = vec2.y;
        } else {
            x = vec2;
        }

        return new Vec2(
            (x - this.offsetX) / this.sizeX * this.contextWidth,
            this.contextHeight - (y - this.offsetY) / this.sizeY * this.contextHeight
        );
    }

    translateLengthToRenderSpace(a) {
        return a / this.sizeX * this.contextWidth;
    }

    DrawCircle(point, radius) {
        point = this.translateCoordinatesToRenderSpace(point);

        this.context.fillStyle = 'red';
        this.context.beginPath();
        this.context.arc(point.x, point.y, this.translateLengthToRenderSpace(radius), 0, 2 * Math.PI);
        this.context.fill();
    }

    DrawLine(point1, point2) {
        const ctx = this.context;
        ctx.strokeStyle = 'green';

        point1 = this.translateCoordinatesToRenderSpace(point1);
        point2 = this.translateCoordinatesToRenderSpace(point2);

        ctx.beginPath();
        ctx.moveTo(point1.x, point1.y);
        ctx.lineTo(point2.x, point2.y);
        ctx.stroke();
    }
    
    DrawVector(point, vector, arrowLength=30, lineWidth=2, color=null) {
        const ctx = this.context;
        const arrowSize = 10;
    
        let from = this.translateCoordinatesToRenderSpace(point);
        let to = this.translateCoordinatesToRenderSpace(vector.add(point));
    
        vector = to.subtract(from);
        vector = vector.multiply(arrowLength / vector.length).do(round);
    
        to = from.add(vector);
    
        const angle = (new Vec2(1, 0)).angleBetween(to.subtract(from));

        color = 'black';

        ctx.fillStyle = color;
        ctx.strokeStyle = color;
    
        ctx.beginPath();
        ctx.moveTo(from.x, from.y);
        ctx.lineTo(to.x, to.y);
        ctx.lineWidth = lineWidth;
        ctx.stroke();
    
        ctx.beginPath();
        ctx.moveTo(to.x, to.y);
        ctx.lineTo(
            to.x - arrowSize * Math.cos(angle - Math.PI / 6),
            to.y - arrowSize * Math.sin(angle - Math.PI / 6)
        );
        ctx.lineTo(
            to.x - arrowSize * Math.cos(angle + Math.PI / 6),
            to.y - arrowSize * Math.sin(angle + Math.PI / 6)
        );
        ctx.lineTo(to.x, to.y);
        ctx.closePath();
        ctx.fill();
    }
  
}

class PolygonRigidbody {
    constructor(parentObject, points) {
        this._points = points;
        this.parentObject = parentObject;

        this._center = new Vec2(0, 0);
        this.calculateCenterPoint();

        this._points = this._points.map((p) => p.subtract(this._center));

        this.oldPosition = null;
        this.oldAngle = null;
        this.recalculatePoints();
    }

    calculateCenterPoint() {
        let minX = Math.min(...this._points.map((v) => v.x));
        let maxX = Math.max(...this._points.map((v) => v.x));
        let minY = Math.min(...this._points.map((v) => v.y));
        let maxY = Math.max(...this._points.map((v) => v.y));

        let minDistance = Infinity;
        let point = null;
        for (let x = minX; x < maxX; x += (maxX - minX) / 100) {
            for (let y = minY; y < maxY; y += (maxY - minY) / 100) {
                let p = new Vec2(x, y);

                let d = Math.max(...this._points.map((v) => v.subtract(p).length));

                if (d < minDistance) {
                    minDistance = d;
                    point = p;
                }
            }
        }

        this._center = point;
        this.radius = minDistance;
    }

    recalculatePoints() {
        if (this.oldPosition != null && this.oldPosition.equal(this.parentObject.futurePosition) &&
        this.oldAngle != null && this.oldAngle == this.parentObject.futureAngle) {
            return;
        }
        this.oldPosition = this.parentObject.futurePosition;
        this.oldAngle = this.parentObject.futureAngle;

        this.oldPoints = this._points.map(
            (vec) => {
                return vec.rotate(this.oldAngle).add(this._center).add(this.oldPosition);
            }
        ); 

        this.oldEdges = [];

        let a = this.oldPoints[this.oldPoints.length - 1];

        this.oldPoints.forEach((p) => {
            this.oldEdges.push(new Edge(a, p));
            a = p;
        });
    }

    get points() {
        this.recalculatePoints();

        return this.oldPoints;
    }

    get edges() {
        this.recalculatePoints();

        return this.oldEdges;
    }

    get center() {
        return this._center.add(this.parentObject.position);
    }

    DoesIntersect(rigidbody) {
        let center1 = this.center;
        let center2 = rigidbody.center;
        
        if (center1.subtract(center2).length > this.radius + rigidbody.radius) {
            return [];
        }
        let possibleEdges = [];

        for (let i = 0; i < this.edges.length; i++) {
            for (let j = 0; j < rigidbody.edges.length; j++) {
                const e1 = this.edges[i];
                const e2 = rigidbody.edges[j];

                let result = edgeIntersection(e1, e2);

                if (result == null) {
                    continue;
                } else {
                    possibleEdges.push([e1, e2, result]);
                }
            }
        }
        return possibleEdges;
    }

    render(renderer) {
        this.edges.forEach((e) => {
            renderer.DrawLine(e.vec1, e.vec2);
        });
    }
}

function RegularPolygonFactory(radius, n) {
    let points = [];

    let angle = Math.PI / 4;

    for (let i = 0; i < n; i++) {
        points.push(new Vec2(radius * Math.sin(angle), radius * Math.cos(angle)));
        angle += 2 * Math.PI / n;
    }

    return points;
}

class CircleBody {
    constructor(radius, startPosition, mass=1) {
        this.immoveable = false;
        this.radius = radius;
        this.mass = mass;
        this.position = startPosition;
        this.futurePosition = this.position;
        this.velocity = new Vec2(0, 0);
        this.angle = 0;
        this.futureAngle = this.angle;
        this.stopForce = new Vec2(0, 0);
        this.acceleration = new Vec2(0, 0);
        this.angularVelocity = 0;
        this.angularAcceleration = 0;
        this.canRotate = false;
        this.rigidbody = new PolygonRigidbody(
            this,
            [new Vec2(-1, -1), new Vec2(-1, 1), new Vec2(1, 1), new Vec2(1, -1)] 
            // RegularPolygonFactory(radius * 0.95, 8)
        );
        this.isAffectedByGravity = true;
    }

    get momentOfInertia() {
        return this.mass * Math.pow(this.rigidbody.radius, 2) / 2;
    }

    render(renderer) {
        renderer.DrawCircle(this.position, this.radius);
        renderer.DrawVector(this.position, this.velocity);
    }

    applyForce(forceVec, applyPoint=null) {
        if (this.canRotate && applyPoint != null) {
            applyPoint = applyPoint.subtract(this.rigidbody.center);
            let deltaAcceleration = forceVec.multiply(-applyPoint.cosineBetween(forceVec) / this.mass);

            let deltaAngularAcceleration = forceVec.determinant(applyPoint);

            this.acceleration = this.acceleration.add(deltaAcceleration);
            this.angularAcceleration += deltaAngularAcceleration / this.momentOfInertia;
        } else {
            this.acceleration = this.acceleration.add(forceVec.multiply(1 / this.mass));
        }
    }

    applyStopVelocityForce(normalVec) {
        let v1 = this.velocity.add(this.stopForce.multiply(dt() / this.mass));
        let magnitude = v1.length * Math.cos(v1.multiply(-1).angleBetween(normalVec)) * this.mass;

        this.stopForce = this.stopForce.add(normalVec.multiply(magnitude / dt()));
    }

    nextTick() {
        if (this.stopForce.length != 0) {
            this.applyForce(this.stopForce);
        }
        this.position = this.nextPosition;
        this.angle = this.nextAngle;
        this.angularVelocity += this.angularAcceleration * dt();
        this.velocity = this.velocity.add(this.acceleration.multiply(dt()));
        this.acceleration = new Vec2(0, 0);
        this.angularAcceleration = 0;
        this.stopForce = new Vec2(0, 0);
        this.futurePosition = this.position.add(this.velocity.multiply(dt()));
        this.futureAngle = this.angle + this.angularVelocity * dt();

    }

    get nextPosition() {
        let k1_v = this.acceleration;
        let k1_x = this.velocity;
        let k2_x = this.velocity.add(k1_v.multiply(0.5 * dt()));
        let k3_x = this.velocity.add(k1_v.multiply(0.5 * dt()));
        let k4_x = this.velocity.add(k1_v.multiply(dt()));

        return this.position.add((k1_x.add(k2_x.multiply(2)).add(k3_x.multiply(2)).add(k4_x)).multiply(dt() / 6));
    }
    get nextAngle() {
        let k1 = this.angularVelocity;
        let k2 = this.angularVelocity + this.angularAcceleration * (0.5 * dt());
        let k3 = this.angularVelocity + this.angularAcceleration * (0.5 * dt());
        let k4 = this.angularVelocity + this.angularAcceleration * dt();

        return this.angle + (k1 + 2 * k2 + 2 * k3 + k4) * (dt() / 6);
    }

    get kineticEnergy() {
        return Math.pow(this.velocity.length, 2) * this.mass / 2 + this.momentOfInertia * Math.pow(this.angularVelocity, 2) / 2;
    }

    get potentialEnergy() {
        return this.getPotentialEnergy();
    }

    get fullMechanicEnergy() {
        return this.getFullMechanicEnergy();
    }

    getPotentialEnergy(offsetY=0) {
        return this.mass * Constants.g * (this.position.y - offsetY);
    }

    getFullMechanicEnergy(offsetY=0) {
        return this.kineticEnergy + this.getPotentialEnergy(offsetY);
    }
}

class LineBody {
    constructor(startPosition, direction) {
        this.immoveable = true;
        this.position = startPosition;
        this.mass = 0;
        this.angle = 0;
        this.velocity = new Vec2(0, 0);
        this.rigidbody = new PolygonRigidbody(this, [new Vec2(0, 0), direction, direction.normalize().rotateClockwise90().add(direction), direction.normalize().rotateClockwise90()]);
    }

    render(renderer) { }

    nextTick() { }

    applyForce() { }

    get nextPosition() {
        return this.position;
    }

    get futurePosition() {
        return this.position;
    }

    get nextAngle() {
        return this.angle;
    }

    get futureAngle() {
        return this.angle;
    }

    get kineticEnergy() {
        return Math.pow(this.velocity.length, 2) * this.mass / 2;
    }

    getPotentialEnergy() { return 0; }

    getFullMechanicEnergy() {
        return this.kineticEnergy;
    }
}

class SimulationModel {
    constructor(formMaker, renderer) {
        this.formMaker = formMaker;
        this.renderer = renderer;
        this.useGravity = true;

        this.objects = [];
        this.previousEnergyValue = null;
        this.time = 0;
    }

    nextTick() {
        this.handleCollision();
        this.objects.forEach(
            (obj) => {
                if (obj.isAffectedByGravity && this.useGravity) {
                    obj.applyForce(new Vec2(0, -Constants.g * obj.mass));
                }
                obj.nextTick();
            }
        )
        this.time += dt();
    }

    handleCollision() {
        for (let i = 0; i < this.objects.length; i++) {
            let obj1 = this.objects[i];
            for (let j = 0; j < i; j++) {
                let obj2 = this.objects[j];
                if (obj1.immoveable && obj2.immoveable) {
                    continue;
                }
                if (!obj1.position.isValid() || !obj2.position.isValid()) {
                    continue;
                }
                let r = obj1.rigidbody.DoesIntersect(obj2.rigidbody);

                if (r.length == 0) {
                    continue;
                }

                let n1 = new Vec2(0, 0);
                let n2 = new Vec2(0, 0);
                let applyPoint = new Vec2(0, 0);

                r.forEach((tuple) => {
                    n1 = n1.add(tuple[0].vec1.subtract(tuple[0].vec2).normalize().rotateClockwise90());
                    n2 = n2.add(tuple[1].vec1.subtract(tuple[1].vec2).normalize().rotateClockwise90());
                    applyPoint = applyPoint.add(tuple[2]);
                    if (isNaN(applyPoint.x)) {
                        window.alert(JSON.stringify([applyPoint, r, obj1.position, obj2.position]));
                    }
                });
                if (n2.length == 0) {
                    n2 = obj1.rigidbody.center.subtract(obj2.rigidbody.center);
                }
                if (n1.length == 0) {
                    n1 = obj2.rigidbody.center.subtract(obj1.rigidbody.center);
                }

                n1 = n1.normalize();
                n2 = n2.normalize();
                applyPoint = applyPoint.multiply(1 / r.length);

                if (!applyPoint.isValid() || applyPoint.x == Infinity || applyPoint.y == Infinity) {
                    throw new Error();
                }

                if (obj2.immoveable) {
                    this.solveCollisionWithImmoveable(obj1, obj2, n2, applyPoint);
                } else if (obj1.immoveable) {
                    this.solveCollisionWithImmoveable(obj2, obj1, n1, applyPoint);
                } else {
                    this.solveCollisionWithMoveables(obj1, obj2, n1, n2, applyPoint);
                }
            }
        }
    }

    solveCollisionWithImmoveable(moveableObject, immoveableObject, normalVec, applyPoint) {
        let v1 = moveableObject.velocity;
        let force = 0;
        let m1 = moveableObject.mass;
        moveableObject.applyStopVelocityForce(normalVec);
        force = v1.length * Math.cos(v1.multiply(-1).angleBetween(normalVec));
        if (moveableObject.isAffectedByGravity && this.useGravity) {
            force += normalVec.cosineBetween(new Vec2(0, -1)) * (-Constants.g) * dt();
        }

        moveableObject.applyForce(normalVec.multiply(force * m1 / dt()), applyPoint);
    }

    solveCollisionWithMoveables(obj1, obj2, normalVec1, normalVec2, applyPoint) {
        let v1 = obj1.velocity;
        let v2 = obj2.velocity;
        let force1 = 0;
        let force2 = 0;
        let m1 = obj1.mass;
        let m2 = obj2.mass;
        let n1 = normalVec1;
        let n2 = normalVec2;

        obj1.applyStopVelocityForce(n2);
        obj2.applyStopVelocityForce(n1);

        let u1 = v1.subtract(n2.multiply(v1.subtract(v2).scalarProduct(n2) * 2 * m2 / (m1 + m2)));
        let u2 = v2.subtract(n1.multiply(v2.subtract(v1).scalarProduct(n1) * 2 * m1 / (m1 + m2)));

        force1 += u1.length * Math.cos(u1.angleBetween(n2));
        force2 += u2.length * Math.cos(u2.angleBetween(n1));

        if (Math.abs(force1) < 1e-15 && Math.abs(force2) < 1e-15) {
            n1 = n1.add(v2.normalize()).normalize();
            n2 = n2.add(v1.normalize()).normalize();

            obj1.applyStopVelocityForce(n2);
            obj2.applyStopVelocityForce(n1);
    
            let u1 = v1.subtract(n2.multiply(v1.subtract(v2).scalarProduct(n2) * 2 * m2 / (m1 + m2)));
            let u2 = v2.subtract(n1.multiply(v2.subtract(v1).scalarProduct(n1) * 2 * m1 / (m1 + m2)));
    
            force1 += u1.length * Math.cos(u1.angleBetween(n2));
            force2 += u2.length * Math.cos(u2.angleBetween(n1));
    
        }

        obj1.applyForce(n2.multiply(force1 * m1 / dt()), applyPoint);
        obj2.applyForce(n1.multiply(force2 * m2 / dt()), applyPoint);
    }

    getFullEnergy() {
        let s = 0; 
        let this_ = this;
        this.objects
        .filter((v) => v.position.isValid() && !v.immoveable)
        .forEach((v) => { 
            s += v.kineticEnergy;
            if (this_.useGravity) { 
                s += v.getPotentialEnergy(0); 
            }
        }); 
        return s; 
    }

    renderFrame() {
        this.renderer.PrepareFrame();
        this.objects.forEach((obj) => { obj.render(this.renderer); });
        this.objects.forEach((obj) => { obj.rigidbody.render(this.renderer); });

        let fullEnergy = this.getFullEnergy();
        this.previousEnergyValue = fullEnergy;

        if (showDebugInfo) {
            let ballDisplay = document.getElementById('ballDisplay');
            ballDisplay.innerHTML = '';

            this.objects.forEach((obj, i) => {
                if (obj.immoveable) {
                    return;
                }

                ballDisplay.innerHTML += i + ':<br/>'; 
                ballDisplay.innerHTML += '|v| = ' + obj.velocity.length + '<br/>';
                ballDisplay.innerHTML += 'omega = ' + obj.angularVelocity + '<br/>';
                ballDisplay.innerHTML += 'm = ' + obj.mass + '<br/>'; 
                ballDisplay.innerHTML += 'E_k = ' + obj.kineticEnergy + '<br/>'; 
            });

            ballDisplay.innerHTML += fullEnergy + '<br/>';
            ballDisplay.innerHTML += this.time;
        }
    }
}

window.onload = main;
