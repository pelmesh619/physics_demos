class Grid extends StaticObject {
    constructor(position, size, step=new Vec2(1, 1), color='rgba(60, 100, 220, 0.6)') {
        super(position);
        this.position = position;
        this.size = size;
        this.step = step;
        this.color = color
    }

    render(renderer) {
        for (let i = 0; i < this.size.x + this.step.x; i += this.step.x) {
            let x = i - this.size.x / 2 + this.position.x;
            let startY = this.position.y - this.size.y / 2;
            let endY = this.position.y + this.size.y / 2;

            renderer.DrawLine(new Vec2(x, startY), new Vec2(x, endY), this.color);
        }
        for (let j = 0; j < this.size.y + this.step.y; j += this.step.y) {
            let y = j - this.size.y / 2 + this.position.y;
            let startX = this.position.x - this.size.x / 2;
            let endX = this.position.x + this.size.x / 2;

            renderer.DrawLine(new Vec2(startX, y), new Vec2(endX, y), this.color);
            
        }
    }
}