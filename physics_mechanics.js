class StaticObject {
    constructor(startPosition) {
        this.immoveable = true;
        this.position = startPosition;
        this.mass = 0;
        this.angle = 0;
        this.velocity = new Vec2(0, 0);

        this.nextPosition = this.position;
        this.futurePosition = this.position;
        this.futureAngle = this.angle;
        this.nextAngle = this.angle;
        this.kineticEnergy = 0;
        this.potentialEnergy = 0;
        this.fullMechanicEnergy = 0;
    
    }

    render(renderer) { }

    update() { }

    applyForce() { }

    getPotentialEnergy = () => 0;

    getFullMechanicEnergy = () => 0;
}


class DinamicObject {
    constructor(startPosition, mass=1) {
        this.immoveable = false;
        this.isAffectedByGravity = true;

        this.mass = mass;

        this.position = startPosition;
        this.futurePosition = this.position;
        this.velocity = new Vec2(0, 0);
        this.acceleration = new Vec2(0, 0);

        this.stopForce = new Vec2(0, 0);

        this.canRotate = false;
        this.angle = 0;
        this.futureAngle = this.angle;
        this.angularVelocity = 0;
        this.angularAcceleration = 0;
    }

    get momentOfInertia() {
        return this.mass * Math.pow(this.rigidbody.radius, 2) / 2;
    }

    render() { }

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

    update() {
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


class MechanicsSimulationModel {
    constructor(formMaker, renderer) {
        this.formMaker = formMaker;
        this.renderer = renderer;
        this.useGravity = true;

        this.objects = [];
        this.time = 0;

        this.enableVelocityVectorRender = false;
    }

    addObject(object) {
        this.objects.push(object);

        return this;
    }

    update() {
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
        if (this.enableVelocityVectorRender) {
            this.objects.forEach((obj) => { if (obj.velocity != undefined) this.renderer.DrawVector(obj.position, obj.velocity); });
        }

        this.renderer.DrawFrame();
    }
}

