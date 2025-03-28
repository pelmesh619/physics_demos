class Grid extends StaticObject {
    constructor(position, size, step=new Vec2(1, 1), color='rgba(60, 100, 220, 0.6)') {
        super(position);
        this.position = position;
        this.size = size;
        this.step = step;
        this.color = color
    }

    render(renderer) {
        let startY = this.position.y - this.size.y / 2;
        let endY = this.position.y + this.size.y / 2;
        let startX = this.position.x - this.size.x / 2;
        let endX = this.position.x + this.size.x / 2;

        for (let i = startX; i <= endX; i += this.step.x) {
            renderer.DrawLine(new Vec2(i, startY), new Vec2(i, endY), this.color);
        }
        for (let j = startY; j <= endY; j += this.step.y) {
            renderer.DrawLine(new Vec2(startX, j), new Vec2(endX, j), this.color);
        }
    }
}

class TrailPath {
    constructor(simulationModel, stickToObject, relativePosition=null, secondsToHold=3) {
        if (relativePosition == null) {
            relativePosition = new Vec2(0, 0);
        }
        this.parentObject = stickToObject;
        this.simulationModel = simulationModel;
        this.ticksPerRecord = ticksPerFrame;


        this.relativePosition = relativePosition;

        this.secondsToHold = secondsToHold;
        this.velocity = new Vec2(0, 0);

        this.data = [];

        this.counter = 0;

        this.color = 'rgba(10, 250, 10, 70%)';
        this.width = 3;
    }

    get position() {
        return this.parentObject.position.add(this.relativePosition.rotate(this.parentObject.angle));
    }

    get secondsToHold() {
        return this.dataAmountLimit * frameRenderTime;
    }

    set secondsToHold(value) {
        this.dataAmountLimit = round(value / frameRenderTime);
    }

    update() {
        if (this.counter % this.ticksPerRecord == 0) {
            this.data.push(
                {
                    time: this.simulationModel.time,
                    position: this.position,
                }
            );
            this.velocity = this.position.subtract(this.data[this.data.length - 1].position)
            .multiply(this.simulationModel.time - this.data[this.data.length - 1].time);
        }
        this.counter++;
        if (this.data.length > this.dataAmountLimit && this.dataAmountLimit > 0) {
            this.data.splice(0, this.data.length - this.dataAmountLimit);
        }
    }

    render(renderer) {
        for (let i = 1; i < this.data.length; i++) {
            renderer.DrawLine(this.data[i - 1].position, this.data[i].position, this.color, this.width);
        }
    }
}
