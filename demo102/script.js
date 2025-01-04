const frameRenderTime = 1 / 50;
const ticksPerFrame = 5;
const timeScale = 1;

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
        this.simulationModel.objects.push(new CircleBody(1, new Vec2(0, values['h'] + 1)));
        this.simulationModel.objects[0].velocity = new Vec2(values['v'] * Math.cos(values['alpha']), values['v'] * Math.sin(values['alpha']));
        this.simulationModel.objects.push(new CircleBody(1, new Vec2(9, 1)));
        this.simulationModel.objects.push(new CircleBody(1, new Vec2(9, 3)));
        this.simulationModel.objects.push(new CircleBody(1, new Vec2(9, 5)));
        this.simulationModel.objects.push(new CircleBody(1, new Vec2(9, 7)));
        this.simulationModel.objects.push(new CircleBody(1, new Vec2(7, 1)));
        this.simulationModel.objects.push(new CircleBody(1, new Vec2(7, 3)));
        this.simulationModel.objects.push(new CircleBody(1, new Vec2(7, 5)));
        this.simulationModel.objects.push(new CircleBody(1, new Vec2(7, 7)));
        // this.simulationModel.objects.push(new CircleBody(1, new Vec2(5, 1)));
        // this.simulationModel.objects.push(new CircleBody(1, new Vec2(5, 3)));
        // this.simulationModel.objects.push(new CircleBody(1, new Vec2(5, 5)));
        // this.simulationModel.objects.push(new CircleBody(1, new Vec2(5, 7)));
        this.simulationModel.objects.push(new LineBody(new Vec2(-10, 0), new Vec2(20, 0)));
        this.simulationModel.objects.push(new LineBody(new Vec2(-10, 10), new Vec2(20, 0)));
        this.simulationModel.objects.push(new LineBody(new Vec2(-10, 0), new Vec2(0, 10)));
        this.simulationModel.objects.push(new LineBody(new Vec2(10, 0), new Vec2(0, 10)));
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
    .AddNumber(new NumberInput("v", "|v| = ", new NumberDomain(1, "м/с", 0.001, 0)))
    .AddNumber(new NumberInput("alpha", "α = ", new NumberDomain(0.71, "рад", 0.001, -1.570, 1.570)))
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
}


class CollisionInfo {
    constructor(distance, collidedEdge) {
        this.distance = distance;
        this.collidedEdge = collidedEdge;
    }
}

class PolygonRigidbody {
    constructor(parentObject, points) {
        this._points = points;
        this.parentObject = parentObject;

        this._center = new Vec2(0, 0);
        this.calculateCenterPoint();

        // this._points = this._points.map((p) => p.subtract(this._center));

        this.oldPosition = null;
        this.oldAngle = null;
        this.recalculatePoints();

        this.radius = Math.max(this._points.map((vec) => vec.length));

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
        if (this.oldPosition != null && this.oldPosition.equal(this.parentObject.nextPosition) &&
        this.oldAngle != null && this.oldAngle == this.parentObject.angle) {
            return;
        }
        this.oldPosition = this.parentObject.nextPosition;
        this.oldAngle = this.parentObject.angle;

        this.oldPoints = this._points.map((vec) => vec.add(this.oldPosition));

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
        return this._center.add(this.parentObject.nextPosition);
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

                if (result === null) {
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

function NthSidePolygonFactory(radius, n) {
    let points = [];

    let angle = Math.PI / 4;

    for (let i = 0; i < n; i++) {
        points.push(new Vec2(radius * Math.sin(angle), radius * Math.cos(angle)));
        angle += 2 * Math.PI / n;
    }

    return points;
}

class CircleBody {
    constructor(radius, startPosition) {
        this.immoveable = false;
        this.radius = radius;
        this.mass = 1;
        this.position = startPosition;
        this.velocity = new Vec2(0, 0);
        this.angle = 0;
        this.acceleration = new Vec2(0, 0);
        this.angularVelocity = 0;
        this.rigidbody = new PolygonRigidbody(
            this, 
            NthSidePolygonFactory(radius * 0.94, 10)
        );
        this.isAffectedByGravity = true;
    }

    render(renderer) {
        renderer.DrawCircle(this.position, this.radius);
    }

    applyForce(forceVec) {
        this.acceleration = this.acceleration.add(forceVec.multiply(1 / this.mass));
    }

    nextTick() {
        this.position = this.nextPosition;
        this.velocity = this.velocity.add(this.acceleration.multiply(dt()));
        this.acceleration = new Vec2(0, 0);
    }

    get nextPosition() {
        let k1_v = this.acceleration;
        let k1_x = this.velocity;

        let k2_x = this.velocity.add(k1_v.multiply(0.5 * dt()));

        let k3_x = this.velocity.add(k1_v.multiply(0.5 * dt()));

        let k4_x = this.velocity.add(k1_v.multiply(dt()));

        return this.position.add((k1_x.add(k2_x.multiply(2)).add(k3_x.multiply(2)).add(k4_x)).multiply(dt() / 6));
    }

    get kineticEnergy() {
        return Math.pow(this.velocity.length, 2) * this.mass / 2;
    }

    getPotentialEnergy(offsetY) {
        return this.mass * Constants.g * (this.position.y - offsetY);
    }

    getFullMechanicEnergy(offsetY) {
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

    get kineticEnergy() {
        return Math.pow(this.velocity.length, 2) * this.mass / 2;
    }

    getPotentialEnergy() { }

    getFullMechanicEnergy() {
        return this.kineticEnergy;
    }
}

class SimulationModel {
    constructor(formMaker, renderer) {
        this.formMaker = formMaker;
        this.renderer = renderer;

        this.objects = [];
        this.previousEnergyValue = null;
    }

    nextTick() {
        this.handleCollision();
        this.objects.forEach(
            (obj) => {
                if (obj.isAffectedByGravity) {
                    obj.applyForce(new Vec2(0, -Constants.g * obj.mass));
                }
                obj.nextTick();
            }
        )
    }

    handleCollision() {
        for (let i = 0; i < this.objects.length; i++) {
            for (let j = 0; j < i; j++) {
                if (this.objects[i].immoveable && this.objects[j].immoveable) {
                    continue;
                }
                if (!this.objects[i].position.isValid()) {
                    break; 
                }
                if (!this.objects[j].position.isValid()) {
                    continue;
                }
                let r = this.objects[i].rigidbody.DoesIntersect(this.objects[j].rigidbody);

                if (r.length != 0) {
                    let n1 = new Vec2(0, 0);
                    let n2 = new Vec2(0, 0);
                    let applyPoint = new Vec2(0, 0);

                    r.forEach((tuple) => {
                        n1 = n1.add(tuple[0].vec1.subtract(tuple[0].vec2).normalize().rotateClockwise90());
                        n2 = n2.add(tuple[1].vec1.subtract(tuple[1].vec2).normalize().rotateClockwise90());
                        applyPoint = applyPoint.add(tuple[2]);
                    });
                    if (n2.length == 0) {
                        n2 = this.objects[i].rigidbody.center.subtract(this.objects[j].rigidbody.center);
                    }
                    if (n1.length == 0) {
                        n1 = this.objects[j].rigidbody.center.subtract(this.objects[i].rigidbody.center);
                    }

                    n1 = n1.normalize();
                    n2 = n2.normalize();
                    applyPoint = applyPoint.multiply(1 / r.length);

                    if (!applyPoint.isValid() || applyPoint.x == Infinity || applyPoint.y == Infinity) {
                        throw new Error();
                    }


                    // console.log('yes collision', i, j, r);
                    // window.alert(JSON.stringify([i, j, r]));

                    let v1 = this.objects[i].velocity;
                    let v2 = this.objects[j].velocity;
                    let force1 = 0;
                    let force2 = 0;
                    let m1 = this.objects[i].mass;
                    let m2 = this.objects[j].mass;
                    if (this.objects[j].immoveable) {
                        force1 = 2 * v1.length * Math.cos(v1.multiply(-1).angleBetween(n2));
                        if (this.objects[i].isAffectedByGravity) {
                            force1 += n2.cosineBetween(new Vec2(0, -1)) * (-Constants.g * m1) * dt();
                        }
                    } else if (this.objects[i].immoveable) {
                        force2 = 2 * v2.length * Math.cos(v2.multiply(-1).angleBetween(n1));
                        if (this.objects[j].isAffectedByGravity) {
                            force2 += n1.cosineBetween(new Vec2(0, -1)) * (-Constants.g * m2) * dt();
                        }
                    } else {
                        force1 = v1.length * Math.cos(v1.multiply(-1).angleBetween(n2));
                        force2 = v2.length * Math.cos(v2.multiply(-1).angleBetween(n1));

                        let u1 = v1.subtract(n2.multiply(v1.subtract(v2).scalarProduct(n2) * 2 * m2 / (m1 + m2)));
                        let u2 = v2.subtract(n1.multiply(v2.subtract(v1).scalarProduct(n1) * 2 * m1 / (m1 + m2)));

                        force1 += u1.length * Math.cos(u1.angleBetween(n2));
                        force2 += u2.length * Math.cos(u2.angleBetween(n1));
                    }
                    

                    if (!this.objects[i].immoveable) {
                        this.objects[i].applyForce(n2.multiply(force1 / dt()), applyPoint);
                    }
                    if (!this.objects[j].immoveable) {
                        this.objects[j].applyForce(n1.multiply(force2 / dt()), applyPoint);
                    }
                } else {
                    // console.log('no collision', i, j);
                }
            }
        }
    }

    getFullEnergy() {
        let s = 0; 
        this.objects
        .filter((v) => v.position.isValid())
        .forEach((v) => { s += v.getFullMechanicEnergy(0); }); 
        return s; 
    }

    renderFrame() {
        this.renderer.PrepareFrame();
        this.objects.forEach((obj) => { obj.render(this.renderer); });
        this.objects.forEach((obj) => { obj.rigidbody.render(this.renderer); });

        let fullEnergy = this.getFullEnergy();

        if (this.previousEnergyValue != null && Math.abs(fullEnergy - this.previousEnergyValue) > 1) {
            // window.alert(JSON.stringify([this.previousEnergyValue, fullEnergy]));
        }

        this.previousEnergyValue = fullEnergy;

        document.getElementById('ballDisplay').innerHTML = this.objects[0].kineticEnergy + '<br/>' + 
        this.objects[1].kineticEnergy + '<br/>' + 
        this.objects[0].velocity.length + '<br/>' + 
        this.objects[1].velocity.length + '<br/>' + 
        fullEnergy;
    }
}

window.onload = main;
