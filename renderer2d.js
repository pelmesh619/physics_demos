
class Renderer2D {
    constructor(canvasId, sizeX, offsetX=null, offsetY) {
        this.canvasId = canvasId;
        this.sizeX = sizeX;
        this.ratio = this.contextHeight / this.contextWidth;
        this.sizeY = this.sizeX * this.ratio;
        this.offsetX = offsetX == null ? -sizeX / 2 : offsetX;
        this.offsetY = offsetY == null ? -this.sizeY / 2 : offsetY;

        this.mouseResponseHandlers = [];
        this.addMouseResponse();

        this.context = this.DOMObject.getContext('2d');

        
        this.DOMObject.width = this.contextWidth;
        this.DOMObject.height = this.contextHeight;
        this.context.scale(1, 1);
    }

    callMouseResponseHandlers() {
        let renderer = this;
        this.mouseResponseHandlers.forEach((func) => {
            func(renderer);
        })
    }

    addMouseResponseHandler(func) {
        this.mouseResponseHandlers.push(func);
    }

    addMouseResponse() {
        this.DOMObject.outerHTML = this.DOMObject.outerHTML;

        let t = this;
        t.isDragging = false;
        let startX, startY;
        let oldOffsetX, oldOffsetY;

        this.DOMObject.addEventListener('mousedown', (e) => {
            t.isDragging = true;
            startX = e.clientX;
            startY = e.clientY;
            [oldOffsetX, oldOffsetY] = [t.offsetX, t.offsetY];

        });

        this.DOMObject.addEventListener('mouseup', () => {
            t.isDragging = false;
        });

        this.DOMObject.addEventListener('mousemove', (e) => {
            if (t.isDragging) {
                let v = new Vec2(e.clientX - startX, e.clientY - startY).multiply(t.sizeX / t.contextWidth);

                t.offsetX = oldOffsetX - v.x;
                t.offsetY = oldOffsetY + v.y;

                this.callMouseResponseHandlers();
            }
        });

        this.DOMObject.addEventListener('wheel', (e) => {
            e.preventDefault();
            const scaleAmount = 0.02 * Math.sign(e.deltaY) * t.sizeX;

            t.sizeX += scaleAmount;
            t.offsetX += -scaleAmount / 2;
            t.sizeY += scaleAmount * t.ratio;
            t.offsetY += -scaleAmount / 2 * t.ratio;

            this.callMouseResponseHandlers();
        });

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

    translateCoordinatesToModelSpace(vec2, y=undefined) {
        let x;
        if (y === undefined) {
            x = vec2.x;
            y = vec2.y;
        } else {
            x = vec2;
        }

        return new Vec2(
            x * this.sizeX / this.contextWidth + this.offsetX,
            (this.contextHeight - y) * this.sizeY / this.contextHeight + this.offsetY
        );
    }

    translateLengthToRenderSpace(a) {
        return a / this.sizeX * this.contextWidth;
    }

    DrawCircle(point, radius, color='red') {
        point = this.translateCoordinatesToRenderSpace(point);

        this.context.fillStyle = color;

        this.context.beginPath();
        this.context.arc(point.x, point.y, this.translateLengthToRenderSpace(radius), 0, 2 * Math.PI);
        this.context.fill();
    }

    DrawCircumference(point, radius, color='red', width=2) {
        point = this.translateCoordinatesToRenderSpace(point);

        this.context.strokeStyle = color;
        this.context.lineWidth = width;

        this.context.beginPath();
        this.context.arc(point.x, point.y, this.translateLengthToRenderSpace(radius), 0, 2 * Math.PI);
        this.context.stroke();
    }

    DrawLine(point1, point2, color='green', width=1) {
        const ctx = this.context;
        ctx.strokeStyle = color;
        ctx.lineWidth = width;

        point1 = this.translateCoordinatesToRenderSpace(point1);
        point2 = this.translateCoordinatesToRenderSpace(point2);

        ctx.beginPath();
        ctx.moveTo(point1.x, point1.y);
        ctx.lineTo(point2.x, point2.y);
        ctx.stroke();
    }

    DrawPolygon(points, fillColor) {
        const ctx = this.context;
        ctx.fillStyle = fillColor;
        ctx.strokeStyle = fillColor;

        if (points.length == 0) {
            return;
        }
        
        ctx.beginPath();

        let point1 = this.translateCoordinatesToRenderSpace(points[0]);
        ctx.moveTo(...point1.xy);

        for (let i = 1; i < points.length; i++) {
            let p = this.translateCoordinatesToRenderSpace(points[i]);
            ctx.lineTo(...p.xy);
        }

        ctx.fill();
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

    DrawFrame() { }

    DrawPixel(point, color='black', width=1) {
        this.context.fillStyle = color;
        this.context.fillRect(point.x, point.y, width, width);
    }
}
