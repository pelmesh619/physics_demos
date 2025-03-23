const frameRenderTime = 0.016;
const ticksPerFrame = 100;
const timeScale = 3600;

const showDebugInfo = false;

const borderWidth = 4.5;

function dt() {
    return frameRenderTime / ticksPerFrame * timeScale;
}

class Matrix3x3 {
    constructor(data) {
        this.data = data;
    }

    multiply(vec) {
        return new Vec3(
            this.data[0].scalarProduct(vec),
            this.data[1].scalarProduct(vec),
            this.data[2].scalarProduct(vec),
        )
    }

    transpose() {
        return new Matrix3x3(
            [
                new Vec3(this.data[0].x, this.data[1].x, this.data[2].x),
                new Vec3(this.data[0].y, this.data[1].y, this.data[2].y),
                new Vec3(this.data[0].z, this.data[1].z, this.data[2].z),
            ]
        )
    }
}

function eccentricAnomalyFromMeanAnomaly(eccentricity, meanAnomaly) {
    function func(x, epsilon) {
        return round(x - eccentricity * Math.sin(x) - meanAnomaly, epsilon)
    }

    let l = 0;
    let r = 2 * Math.PI;
    let epsilon = 10;
    while (true){
        m = (r - l) / 2 + l;
        value = func(m, epsilon);
        if (value > 0)
            r = m;
        else if (value < 0)
            l = m;
        else
            break
    }

    return m;
}

function orbitMovementFactory(a, e, inclination, orbitalNode, periapsisArgument) {
    let b = a * Math.sqrt(1 - e*e);
    let c = a * e;

    let T = 2 * Math.PI * Math.sqrt(Math.pow(a, 3) / Planets.Earth.gravitationalParameter);
    let angularFrequency = Math.PI * 2 / T;


    function ellipse(eccentricAnomaly) {
        let rho = a * (1 - e * Math.cos(eccentricAnomaly));

        let sin_E_half = Math.sin(eccentricAnomaly / 2);
        let cos_E_half = Math.cos(eccentricAnomaly / 2);
        
        let numerator = Math.sqrt(1 + e) * sin_E_half;
        let denominator = Math.sqrt(1 - e) * cos_E_half;
        
        let trueAnomaly = 2 * Math.atan2(numerator, denominator);

        return new Vec3(rho * Math.cos(trueAnomaly), rho * Math.sin(trueAnomaly), 0);
    }

    let m1 = new Matrix3x3(
        [
            new Vec3(1, 0, 0),
            new Vec3(0, Math.cos(inclination), -Math.sin(inclination)),
            new Vec3(0, Math.sin(inclination), Math.cos(inclination)),
        ]
    )

    let n = m1.multiply(new Vec3(0, 0, 1));

    let m2 = new Matrix3x3(
        [
            new Vec3(
                Math.cos(periapsisArgument), 
                -Math.sin(periapsisArgument) * n.z, 
                Math.sin(periapsisArgument) * n.y
            ),
            new Vec3(
                Math.sin(periapsisArgument) * n.z, 
                Math.cos(periapsisArgument) + (1 - Math.cos(periapsisArgument)) * n.y * n.y, 
                (1 - Math.cos(periapsisArgument)) * n.y * n.z
            ),
            new Vec3(
                -Math.sin(periapsisArgument) * n.y, 
                (1 - Math.cos(periapsisArgument)) * n.z * n.y, 
                Math.cos(periapsisArgument) + (1 - Math.cos(periapsisArgument)) * n.z * n.z
            ),
        ]
    )

    let m3 = new Matrix3x3(
        [
            new Vec3(Math.cos(orbitalNode), -Math.sin(orbitalNode), 0),
            new Vec3(Math.sin(orbitalNode), Math.cos(orbitalNode), 0),
            new Vec3(0, 0, 1),
        ]
    )

    function f(t) {
        let point = ellipse(eccentricAnomalyFromMeanAnomaly(e, t * angularFrequency % (2 * Math.PI)));

        return m3.multiply(m2.multiply(m1.multiply(point)));
    }

    return f;
}

function orbit(time) {
    return new Vec3(1, 0, time);
}

function project3dOnMap(position, angle) {
    let [x, y, z] = position.xyz;

    let a = (Math.atan2(y, x) - angle) % (Math.PI * 2);
    if (a < -Math.PI) {
        a += Math.PI * 2;
    }
    if (a > Math.PI) {
        a -= Math.PI * 2;
    }

    let alpha = a / Math.PI * 2;
    let theta = 1 - (Math.acos(z / Math.hypot(x, y, z))) / Math.PI * 2;

    return new Vec2(alpha, theta);
}

class Main {
    constructor(form) {
        this.form = form;
        this.stopped = false;
        this.renderer = new Renderer2D('simulation', borderWidth);
        
        let t = this;
        this.renderer.addMouseResponseHandler((r) => { if (t.stopped) t.simulationModel.renderFrame(r); });
    }

    reloadModel() {
        let values = this.form.GetValues();

        this.simulationModel = new MechanicsSimulationModel(this.form, this.renderer);
        this.simulationModel.useGravity = false;
        this.simulationModel.enableVelocityVectorRender = document.getElementById('showVelocities').checked;

        let circle = new CircleBody(
            Vec2.Zero, 
            orbitMovementFactory(
                values.a * 1000, 
                values.e, 
                values.inclination * Math.PI / 180, 
                values.orbitalNode * Math.PI / 180, 
                values.periapsisArgument * Math.PI / 180
            ), 
            this.simulationModel
        );
        let rect = new Rectangle(Vec2.Zero, new Vec2(2, 1));

        circle.angularVelocity = 2 * Math.PI / Planets.Earth.rotationPeriod;
        circle.angle += circle.angularVelocity * values.deltaT % (2 * Math.PI);
    
        let track = new OrbitTrack(this.simulationModel, circle);
        track.color = 'red';
        track.secondsToHold = 24;
        track.ticksPerRecord = 20;

        this.simulationModel.addObject(rect);
        this.simulationModel.addObject(new Grid(Vec2.Zero, new Vec2(4, 2), Vec2.UpRight.multiply(0.333), 'rgba(43, 48, 63, 0.81)'));
        this.simulationModel.addObject(circle);
        this.simulationModel.addObject(track);
    }

    nextTick() {
        if (!this.stopped) {
            for (let i = 0; i < ticksPerFrame; i++) {
                this.simulationModel.update();

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
    var form = new FormMaker("mainForm");

    form
    .AddInputObject(new NumberInputScheme(42164, 'км', 0.001).Build("a", "\\( a = \\)"))
    .AddInputObject(new NumberInputScheme(0.4, '', 0.001).Build("e", "\\( e = \\)"))
    .AddInputObject(new NumberInputScheme(63.4, '\\( ^\\circ \\)', 0.001).Build("inclination", "\\( i = \\)"))
    .AddInputObject(new NumberInputScheme(0, '\\( ^\\circ \\)', 0.001).Build("orbitalNode", "\\( \\Omega = \\)"))
    .AddInputObject(new NumberInputScheme(270, '\\( ^\\circ \\)', 0.001).Build("periapsisArgument", "\\( \\omega = \\)"))
    .AddInputObject(new NumberInputScheme(0, 'с', 0.001).Build("deltaT", "\\( \\Delta t = \\)"))
    .AddSubmitButton('submitButton', "Перестроить график", () => { mainObject.reloadModel(); });


    var mainObject = new Main(form);

    mainObject.reloadModel();

    document.getElementById('restartButton').addEventListener("click", () => { mainObject.reloadModel(); });

    document.getElementById('showVelocities').addEventListener('change', (event) => {
        mainObject.simulationModel.enableVelocityVectorRender = event.target.checked;
    });
    document.getElementById('stopSimulation').addEventListener('change', (event) => {
        mainObject.stopped = event.target.checked;
    });
    
    document.getElementById('nextStepButton').addEventListener('click', () => { 
        mainObject.simulationModel.update();
        mainObject.simulationModel.renderFrame();
    });
    document.getElementById('nextFrameButton').addEventListener('click', () => { 
        for (let i = 0; i < ticksPerFrame; i++) {
            mainObject.simulationModel.update();
        }
        mainObject.simulationModel.renderFrame();
    })
    
    MathJax.Hub.Queue(["Typeset", MathJax.Hub]);

    setInterval(
        mainObject.nextTickFactory(),
        frameRenderTime * 1000  // in ms
    )
}


class CircleBody {
    static integrator = integrators.rk3over8;

    constructor(startPosition, orbitFunc, simulationModel) {
        this.immoveable = false;
        this.isAffectedByGravity = false;
        this.simulationModel = simulationModel;
        this.orbitFunc = orbitFunc;

        this.centerPosition = startPosition;

        this.position = Vec3.Zero;

        this.canRotate = true;
        this.angle = 0;
        this.futureAngle = this.angle;
        this.angularVelocity = 0;
        this.angularAcceleration = 0;
    }

    render(renderer) {
        renderer.DrawCircle(this.position, 0.1, 'rgba(52, 189, 213, 0.78)');
    }

    update() {
        this.oldAngle = this.angle;
        this.angle = this.nextAngle;
        while (this.angle > Math.PI) {
            this.angle -= Math.PI * 2;
        }
        while (this.angle < -Math.PI) {
            this.angle += Math.PI * 2;
        }

        this.angularVelocity += this.angularAcceleration * dt();
        this.angularAcceleration = 0;

        this.futureAngle = this.angle + this.angularVelocity * dt();

        this.oldPosition = this.position;
        this.position = project3dOnMap(this.orbitFunc(this.simulationModel.time), this.angle);
        this.velocity = this.position.subtract(this.oldPosition).normalize();
    }

    get nextAngle() {
        let k1 = this.angularVelocity;
        let k2 = this.angularVelocity + this.angularAcceleration * (0.5 * dt());
        let k3 = this.angularVelocity + this.angularAcceleration * (0.5 * dt());
        let k4 = this.angularVelocity + this.angularAcceleration * dt();

        return this.angle + (k1 + 2 * k2 + 2 * k3 + k4) * (dt() / 6);
    }
}

class Rectangle extends StaticObject {
    constructor(position, size) {
        super(position);
        this.size = size;
        this.image = new Image();
        this.image.src = '../static/earth_hr.png';
    }
        
    render(renderer) {
        renderer.DrawImage(this.image, new Vec2(this.position.x - this.size.x, this.position.y + this.size.y), this.size.multiply(2));

        renderer.DrawPolygon(
            [
                this.position.add(new Vec2(this.size.x, this.size.y)),
                this.position.add(new Vec2(-this.size.x, this.size.y)),
                this.position.add(new Vec2(-this.size.x, -this.size.y)),
                this.position.add(new Vec2(this.size.x, -this.size.y)),
            ],
            'rgba(10, 10, 10, 0.1)'
        );
    }
}

class OrbitTrack extends TrailPath {
    update() {
        if (this.counter % this.ticksPerRecord == 0) {
            this.data.push(
                {
                    time: this.simulationModel.time,
                    position: this.parentObject.position
                }
            );
        }
        this.counter++;
        if (this.data.length > this.dataAmountLimit && this.dataAmountLimit > 0) {
            this.data.splice(0, this.data.length - this.dataAmountLimit);
        }
    }
    render(renderer) {
        for (let i = 1; i < this.data.length; i++) {
            if (this.data[i].position.subtract(this.data[i - 1].position).length < 1) {
                renderer.DrawLine(this.data[i - 1].position, this.data[i].position, this.color, this.width);
            }
        }
    }
}

window.onload = main;
