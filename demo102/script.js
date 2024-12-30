const frameRenderTime = 1 / 5;
const ticksPerFrame = 10;

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
        this.simulationModel.objects.push(new CircleBody(2, new Vec2(0, 0)));
        this.simulationModel.objects.push(new LineBody(new Vec2(0, 0)));
    }

    nextTick() {
        if (!this.stopped) {
            for (let i = 0; i < ticksPerFrame; i++) {
                this.simulationModel.nextTick();
            }
        }

        // this.simulationModel.renderFrame();
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
    .AddSubmitButton('submitButton', "Перезапустить симуляцию", mainObject.reloadModel)
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
    }

    get DOMObject() {
        return document.getElementById(this.canvasId);
    }

    get context() { 
        const d = this.DOMObject; 
        return d === null ? null : d.getContext('2d');
    }

    get contextHeight() {
        return this.DOMObject === null ? null : this.DOMObject.clientHeight;
    }

    get contextWidth() {
        return this.DOMObject === null ? null : this.DOMObject.clientWidth;
    }

    translateCoordinatesToRenderSpace(vec2, y=undefined) {
        if (y != undefined) {
            vec2 = new Vec2(vec2, y);
        }



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
        this.oldPosition = this.parentObject.position;

        this.oldPoints = this._points.map((vec) => vec.add(this.oldPosition));

        this.oldEdges = [];

        let a = this.points[this.points.length - 1];

        this.points.forEach((p) => {
            this.oldEdges.push(new Edge(a, p));
            a = p;
        });
    }

    get points() {
        if (this.oldPosition == this.parentObject.position) {
            return this.oldPoints;
        }

        this.recalculatePoints();

        return this.oldPoints;
    }

    get edges() {
        if (this.oldPosition == this.parentObject.position) {
            return this.oldEdges;
        }

        this.recalculatePoints();

        return this.oldEdges;
    }

    DoesIntersect(rigidbody) {
        for (const e of this.edges) {
            let edgeVector = e.vec1.subtract(e.vec2);
            let perp = edgeVector.rotateClockwise90();

            let poly1min = Infinity;
            let poly1max = -Infinity;

            this.points.forEach((p) => {
                let v = perp.scalarProduct(p);

                poly1max = Math.max(v, poly1max);
                poly1min = Math.min(v, poly1min);
            });

            let poly2min = Infinity;
            let poly2max = -Infinity;

            rigidbody.points.forEach((p) => {
                let v = perp.scalarProduct(p);

                poly2max = Math.max(v, poly2max);
                poly2min = Math.min(v, poly2min);
            });

            if (poly1min < poly2max && poly1max > poly2min || poly2min < poly1max && poly2max > poly1min) {
                poly1min = edgeVector.scalarProduct(e.vec1);
                poly1max = edgeVector.scalarProduct(e.vec2);
                if (poly1max < poly1min) {
                    [poly1max, poly1min] = [poly1min, poly1max];
                }
                poly2min = Infinity;
                poly2max = -Infinity;

                rigidbody.points.forEach((p) => {
                    let v = edgeVector.scalarProduct(p);

                    poly2max = Math.max(v, poly2max);
                    poly2min = Math.min(v, poly2min);
                });

                if (poly2max < poly1max && poly2max > poly1min || poly2min > poly1min && poly2min < poly1max) {
                    return new CollisionInfo(0, e);
                }

                continue;
            } else {
                return new CollisionInfo(Math.min(Math.abs(poly1max - poly2min), Math.abs(poly2max - poly1min)), null);
            }
        }
        throw new Error('collision algorithm got wrong');
    }
}

class CircleBody {
    constructor(radius, startPosition) {
        this.immoveable = false;
        this.radius = radius;
        this.position = startPosition;
        this.velocity = new Vec2(0, 0);
        this.rigidbody = new PolygonRigidbody(this, [new Vec2(1, -1), new Vec2(1, 1), new Vec2(-1, 1), new Vec2(-1, -1)]);
        this.rigidbody.position = this.position;
    }

    render(renderer) {
        
    }

    nextTick() {
        this.position = this.position.add(this.velocity.multiply(frameRenderTime / ticksPerFrame));
        this.rigidbody.position = this.position;
    }
}

class LineBody {
    constructor(startPosition) {
        this.immoveable = true;
        this.position = startPosition;
        this.rigidbody = new PolygonRigidbody(this, [new Vec2(-100, 0), new Vec2(100, 0), new Vec2(0, -1)]);
    }

    render() { }

    nextTick() { }

    changeVelocity() {

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
                    obj.velocity.y -= Constants.g * frameRenderTime / ticksPerFrame;
                }
                obj.nextTick();
            }
        )
    }

    handleCollision() {
        for (let i = 0; i < this.objects.length; i++) {
            for (let j = 0; j < i; j++) {
                let r = this.objects[i].rigidbody.DoesIntersect(this.objects[j].rigidbody);

                if (r.distance == 0) {
                    console.log('yes collision', r);

                    let e = r.collidedEdge;
                    
                }
                if (r.distance > 0) {
                    console.log('no collision', r);
                }
            }
        }
    }

    renderFrame() {
        console.log(this.objects);
    }
}

window.onload = main;
