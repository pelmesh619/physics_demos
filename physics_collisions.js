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

class CollisionSimulationModel {
    constructor(formMaker, renderer) {
        this.formMaker = formMaker;
        this.renderer = renderer;
        this.useGravity = true;

        this.objects = [];
        this.previousEnergyValue = null;
        this.time = 0;
    }

    addObject(object) {
        this.objects.push(object);

        return this;
    }

    update() {
        this.handleCollision();
        this.objects.forEach(
            (obj) => {
                if (obj.isAffectedByGravity && this.useGravity) {
                    obj.applyForce(new Vec2(0, -Constants.g * obj.mass));
                }
                obj.update();
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
        this.renderer.DrawFrame();
    }
}
