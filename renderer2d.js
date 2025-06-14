
class Renderer2D {
    constructor(canvasId, sizeX, offsetX=null, offsetY) {
        this.canvasId = canvasId;
        this.sizeX = sizeX;
        this.ratio = this.contextHeight / this.contextWidth;
        this.sizeY = this.sizeX * this.ratio;
        this.offsetX = offsetX == null ? -sizeX / 2 : offsetX;
        this.offsetY = offsetY == null ? -this.sizeY / 2 : offsetY;

        this.mouseResponseHandlers = [];
        this.scrollResponseHandlers = [];
        this.mouseDragHandlers = [];
        this.addMouseResponse();

        this.context = this.DOMObject.getContext('2d');

        
        this.DOMObject.width = this.contextWidth;
        this.DOMObject.height = this.contextHeight;
        this.context.scale(1, 1);

        const infoShower = document.getElementById('mouseoverinfoshower');
        if (infoShower != null) {
            this.DOMObject.addEventListener('mouseleave', () => {
                let shower = document.getElementById('mouseoverinfoshower');
                shower.style.display = 'none';
            })
        }
    }

    callMouseResponseHandlers() {
        let renderer = this;
        this.mouseResponseHandlers.forEach((func) => {
            func(renderer);
        })
    }

    callMouseDragHandlers() {
        let renderer = this;
        this.mouseDragHandlers.forEach((func) => {
            func(renderer);
        })
    }

    callScrollResponseHandlers() {
        let renderer = this;
        this.scrollResponseHandlers.forEach((func) => {
            func(renderer);
        })
    }

    addMouseResponseHandler(func) {
        this.mouseResponseHandlers.push(func);
    }

    addMouseDragHandler(func) {
        this.mouseDragHandlers.push(func);
    }

    addScrollResponseHandler(func) {
        this.scrollResponseHandlers.push(func);
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
                this.callMouseDragHandlers();
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
            this.callScrollResponseHandlers();
        });

    }

    addMouseOverHandler(func) {
        this.DOMObject.addEventListener(
            'mousemove',
            (event) => {
                const shower = document.getElementById('mouseoverinfoshower');
                shower.style.display = 'block';

                let point = this.translateCoordinatesToModelSpace(event.offsetX, event.offsetY);
                
                shower.innerHTML = func(point);
                shower.style.left = '0px';
                shower.style.top = '0px';

                let showerSize = getComputedStyle(shower);
                let showerWidth = +(showerSize.width.slice(0, showerSize.width.length - 2));
                let showerHeight = +(showerSize.height.slice(0, showerSize.height.length - 2));

                if (showerWidth + event.offsetX + 15 > this.contextWidth) {
                    shower.style.left = event.clientX - showerWidth - 10 + 'px';
                } else {
                    shower.style.left = event.clientX + 5 + 'px';
                }
                if (showerHeight + event.offsetY + 15 > this.contextHeight) {
                    shower.style.top = event.clientY - showerHeight - 10 + 'px';
                } else {
                    shower.style.top = event.clientY + 5 + 'px';
                }

            }
        );
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

    translateLengthToModelSpace(a) {
        return a / this.contextWidth * this.sizeX;
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

    DrawArc(point, radius, startAngle, endAngle, isCounterClockwise=false, color='red', width=2) {
        point = this.translateCoordinatesToRenderSpace(point);
        radius = this.translateLengthToRenderSpace(radius);

        this.context.strokeStyle = color;
        this.context.lineWidth = width;
        this.context.beginPath();
        this.context.arc(point.x, point.y, radius, startAngle, endAngle, isCounterClockwise);
        this.context.stroke();
    }

    DrawFilledArc(point, radius, startAngle, endAngle, isCounterClockwise=false, color='red') {
        point = this.translateCoordinatesToRenderSpace(point);
        radius = this.translateLengthToRenderSpace(radius);

        this.context.fillStyle = color;
        this.context.beginPath();
        this.context.arc(point.x, point.y, radius, startAngle, endAngle, isCounterClockwise);
        this.context.fill();
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

    DrawRectangle(upperLeftVertex, lowerRightVertex, fillColor="black") {
        let v1 = this.translateCoordinatesToRenderSpace(upperLeftVertex);
        let v2 = this.translateCoordinatesToRenderSpace(lowerRightVertex);

        [v1, v2] = [new Vec2(Math.min(v1.x, v2.x), Math.min(v1.y, v2.y)), new Vec2(Math.max(v1.x, v2.x), Math.max(v1.y, v2.y))]
        
        v1 = v1.do(Math.round);
        v2 = v2.do(Math.round);

        const ctx = this.context;
        ctx.fillStyle = fillColor;
        ctx.strokeStyle = fillColor;

        ctx.rect(v1.x, v1.y, v2.x - v1.x, v2.y - v1.y);

        ctx.stroke();
    }

    DrawRectangleAsPolygon(upperLeftVertex, lowerRightVertex, fillColor="black") {
        let v1 = upperLeftVertex;
        let v2 = lowerRightVertex;

        [v1, v2] = [new Vec2(Math.min(v1.x, v2.x), Math.min(v1.y, v2.y)), new Vec2(Math.max(v1.x, v2.x), Math.max(v1.y, v2.y))]
        
        this.DrawPolygon([v1, new Vec2(v1.x, v2.y), v2, new Vec2(v2.x, v1.y)], fillColor);
    }
    
    DrawVector(point, vector, color=null, arrowLength=30, lineWidth=2) {
        const ctx = this.context;

        if (!color) {
            color = 'black';
        }

        ctx.strokeStyle = color;
        ctx.fillStyle = color;

        const arrowSize = 10;
    
        let from = this.translateCoordinatesToRenderSpace(point);
        let to = this.translateCoordinatesToRenderSpace(vector.add(point));
    
        vector = to.subtract(from);
        vector = vector.multiply(arrowLength / vector.length);
    
        to = from.add(vector);
    
        const angle = (new Vec2(1, 0)).angleBetween(to.subtract(from));

    
        ctx.beginPath();
        ctx.moveTo(from.x, from.y);
        ctx.lineTo(to.x - (arrowSize - 1) * Math.cos(angle), to.y - (arrowSize - 1) * Math.sin(angle));
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

    DrawImage(image, position, size) {
        let point = this.translateCoordinatesToRenderSpace(position);
        let t = this;
        size = size.do((n) => t.translateLengthToRenderSpace(n));

        this.context.drawImage(image, ...point.xy, ...size.xy);
    }
}
