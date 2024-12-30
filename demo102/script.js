const frameRenderTime = 1000 / 5;
const ticksPerFrame = 1;

const borderWidth = 10;

class Main {
    constructor(form) {
        this.form = form;
        reloadModel();
    }

    reloadModel() {
        this.renderer = new Renderer('ballisticSimulation', borderWidth);
        this.simulationModel = new SimulationModel(this.form, this.renderer);
    }

    nextTick() {
        for (let i = 0; i < ticksPerFrame; i++) {
            this.simulationModel.nextTick();
        }

        this.simulationModel.renderFrame();
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
    .AddSubmitButton('submitButton', "Перезапустить симуляцию", mainObject.reloadModel);

    mainObject.reloadModel();

    setInterval(
        mainObject.nextTickFactory(),
        frameRenderTime
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

class CircleRigidbody {
    constructor(radius, startPosition) {
        this.radius = radius;
        this.position = startPosition;
        this.velocity = new Vec2(0, 0);
    }

    render(renderer) {

    }
}

class SimulationModel {
    constructor(formMaker, renderer) {
        this.formMaker = formMaker;
        this.renderer = renderer;

        this.objects = [];
    }

    nextTick() {
        console.log('fuck');
    }

    renderFrame() {

    }
}

window.onload = main;
