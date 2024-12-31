const frameRenderTime = 1 / 50;
const ticksPerFrame = 10;
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
        this.renderer = new Renderer('ballisticSimulation', borderWidth);
        this.simulationModel = new SimulationModel(this.form, this.renderer);
        this.simulationModel.objects.push(new CircleBody(1, new Vec2(-2.5, 3)));
        this.simulationModel.objects.push(new LineBody(new Vec2(-8, 0), new Vec2(10, 0)));
        // this.simulationModel.objects.push(new LineBody(new Vec2(-8, 0), new Vec2(0, 8)));
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
        for (let i = 0; i < ticksPerFrame; i++) {
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
        this.offsetX = -10;
        this.offsetY = -5;
        this.sizeX = 20;
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

        this.oldPosition = null;
        this.recalculatePoints();

        this.radius = Math.max(this._points.map((vec) => vec.length));
    }

    recalculatePoints() {
        if (this.oldPosition != null && this.oldPosition.equal(this.parentObject.nextPosition)) {
            return;
        }
        this.oldPosition = this.parentObject.nextPosition;

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

    DoesIntersect(rigidbody) {
        let minDistance = Infinity;
        let noCollision = false;
        let possibleEdges = []

        for (const e of this.edges) {
            let edgeVector = e.vec1.subtract(e.vec2);
            let perp = edgeVector.rotateClockwise90().normalize();

            let poly1min = Infinity;
            let poly1max = -Infinity;

            this.points.forEach((p) => {
                let v = perp.scalarProduct(p.subtract(e.vec1));

                poly1max = Math.max(v, poly1max);
                poly1min = Math.min(v, poly1min);
            });

            let poly2min = Infinity;
            let poly2max = -Infinity;

            rigidbody.points.forEach((p) => {
                let v = perp.scalarProduct(p.subtract(e.vec1));

                poly2max = Math.max(v, poly2max);
                poly2min = Math.min(v, poly2min);
            });

            if (Math.sign(poly2max) == Math.sign(poly2min) && (Math.sign(poly1min) != Math.sign(poly2max)) || noCollision) {
                minDistance = Math.min(Math.abs(poly1max - poly2min), Math.abs(poly2max - poly1min), minDistance);
                noCollision = true;
            } else {
                poly1min = 0;
                poly1max = edgeVector.normalize().scalarProduct(e.vec2.subtract(e.vec1));
                if (poly1max < poly1min) {
                    [poly1max, poly1min] = [poly1min, poly1max];
                }
                poly2min = Infinity;
                poly2max = -Infinity;

                rigidbody.points.forEach((p) => {
                    let v = edgeVector.normalize().scalarProduct(p.subtract(e.vec1));

                    poly2max = Math.max(v, poly2max);
                    poly2min = Math.min(v, poly2min);
                });

                if (poly2max < poly1max && poly2max > poly1min || poly2min > poly1min && poly2min < poly1max) {
                    possibleEdges.push(e);
                }
            }
        }
        if (!noCollision) {
            return new CollisionInfo(0, possibleEdges[0]);
        }
        return new CollisionInfo(minDistance, null);
    }
}

function NthSidePolygonFactory(radius, n) {
    let points = [];

    let angle = 0;

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
        this.position = startPosition;
        this.velocity = new Vec2(0, 0);
        this.rigidbody = new PolygonRigidbody(
            this, 
            NthSidePolygonFactory(radius, 5)
        );
        this.rigidbody.position = this.position;
    }

    render(renderer) {
        renderer.DrawCircle(this.position, this.radius);
        this.rigidbody.edges.forEach((e) => {
            renderer.DrawLine(e.vec1, e.vec2);
        });
    }

    nextTick() {
        this.position = this.nextPosition;
        this.rigidbody.position = this.position;
    }

    get nextPosition() {
        return this.position.add(this.velocity.multiply(dt()))
    }
}

class LineBody {
    constructor(startPosition, direction) {
        this.immoveable = true;
        this.position = startPosition;
        this.rigidbody = new PolygonRigidbody(this, [new Vec2(0, 0), direction, direction.normalize().rotateClockwise90().multiply(-1)]);
    }

    render(renderer) { 
        this.rigidbody.edges.forEach((e) => {
            renderer.DrawLine(e.vec1, e.vec2);
        });
    }

    nextTick() { }

    changeVelocity() { }

    get nextPosition() {
        return this.position;
    }
}

class SimulationModel {
    constructor(formMaker, renderer) {
        this.formMaker = formMaker;
        this.renderer = renderer;

        this.objects = [];
    }

    nextTick() {
        this.handleCollision();
        this.objects.forEach(
            (obj) => {
                if (!obj.immoveable) {
                    obj.velocity.y -= Constants.g * dt();
                }
                obj.nextTick();
            }
        )
    }

    handleCollision() {
        for (let i = 0; i < this.objects.length; i++) {
            for (let j = 0; j < i; j++) {
                let r1 = this.objects[i].rigidbody.DoesIntersect(this.objects[j].rigidbody);
                let r2 = this.objects[j].rigidbody.DoesIntersect(this.objects[i].rigidbody);

                if (r1.collidedEdge != null && r2.collidedEdge != null) {
                    console.log('yes collision', i, j, r1, r2);

                    let e = r1.collidedEdge;

                    let perp = e.vec1.subtract(e.vec2).rotateClockwise90().normalize();
                    
                    let newVelocity = this.objects[i].velocity;

                    if (!this.objects[i].immoveable) {
                        newVelocity = perp.multiply(perp.scalarProduct(newVelocity)).multiply(-2);

                        this.objects[i].velocity = newVelocity.add(this.objects[i].velocity);
                    }
                    
                    newVelocity = this.objects[j].velocity;

                    if (!this.objects[j].immoveable) {
                        newVelocity = perp.multiply(perp.scalarProduct(newVelocity)).multiply(-2);

                        this.objects[j].velocity = newVelocity.add(this.objects[j].velocity);
                    }
                } else if (r1.distance > 0 || r2.distance > 0) {
                    console.log('no collision', i, j, r1, r2);
                } else {
                    console.log('fuck', i, j, r1, r2);
                }
            }
        }
    }

    renderFrame() {
        this.renderer.PrepareFrame();
        console.log(this.objects);
        this.objects.forEach((obj) => { obj.render(this.renderer); })
        document.getElementById('fuck').innerText = this.objects[0].position.x + ' ' + this.objects[0].position.y + " " + this.objects[1].position.x + ' ' + this.objects[1].position.y;
    }
}

window.onload = main;
