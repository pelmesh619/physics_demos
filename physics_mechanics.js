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

    nextTick() { }

    applyForce() { }

    getPotentialEnergy = () => 0;

    getFullMechanicEnergy = () => 0;
}