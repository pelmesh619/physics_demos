class Constants {
    static get g() { return 9.8; }

    static get G() { return 6.6743 * 10e-11; }
}

class ElectricConstants {
    static get k() { return 9 * Math.pow(10, 9); }

    static get epsilon0() { return 8.85 * Math.pow(10, -11); }
}

class Planets {
    static Earth = {
        meanRadius: 6371e3,
        rotationPeriod: 0.99726968 * 24 * 60 * 60,
        mass: 5.9726e24,
        gravitationalParameter: 3.986004418e14
    }
}

function clamp(v, min, max) {
    return Math.max(min, Math.min(max, v));
}

function round(number, a=0) {
    if (a > 0) {
        return (number).toFixed(a);
    }
    if (a == 0) {
        return Math.round(number);
    }

    let r = number % Math.pow(10, -a);

    if (r / Math.pow(10, -a) > 0.5) {
        return number - number % Math.pow(10, -a);
    }
    return number - number % Math.pow(10, -a) + 1;
}

function roundByStep(number, step, min=0) {
    return round((number - min) / step) * step + min;
}
  
function digitnumber(number) {
    let a = 0;
    if (number == 0) {
        return 0;
    }
    number = Math.abs(number);
    if (number > 1) {
        while (number > 10) {
            number /= 10;
            a++;
        }
        return a;
    }
    while (number < 1) {
        number *= 10;
        a--;
    }
    return a;
}

function toScientificNotationTuple(number, base=10) {
    if (number == 0) {
        return [0, 0];
    }
    let exponent;

    let isInverse = Math.abs(number) < 1;

    let n = Math.abs(!isInverse ? number : 1 / number);

    if (base == 10) {
        exponent = Math.log10(n);
    } else if (base == 2) {
        exponent = Math.log2(n);
    } else {
        exponent = Math.log(n) / Math.log(base);
    }

    if (isInverse) {
        exponent = -exponent;
    }

    exponent = Math.floor(exponent);

    let mantissa = number / Math.pow(base, exponent);

    return [mantissa, exponent];
}
  
function toScientificNotation(number, roundDigits=3) {
    let [mantissa, exponent] = toScientificNotationTuple(number);
    
    if (exponent <= 2 && exponent >= -2) {
        mantissa = mantissa * Math.pow(10, exponent);
    }
  
    let string = round(mantissa, roundDigits);

    if (Math.abs(string) == 10) {
        string = Math.trunc(mantissa * Math.pow(10, roundDigits)) / Math.pow(10, roundDigits);
    }

    if (exponent > 2 || exponent < -2) {
        string += ' x 10^(' + exponent + ')';
    }
    return string;
}
  


class Vec2 {
    static Zero = new Vec2(0, 0);
    static Up = new Vec2(0, 1);
    static Left = new Vec2(-1, 0);
    static Right = new Vec2(1, 0);
    static Down = new Vec2(0, -1);
    static UpLeft = new Vec2(-1, 1);
    static DownLeft = new Vec2(-1, -1);
    static UpRight = new Vec2(1, 1);
    static DownRight = new Vec2(1, -1);

    constructor(x, y) {
        this._x = x;
        this._y = y;
    }

    get x() {
        return this._x;
    }

    set x(value) {
        this._x = value;
        this._key = undefined;
        this._length = undefined;
    }

    get y() {
        return this._y;
    }

    set y(value) {
        this._y = value;
        this._key = undefined;
        this._length = undefined;
    }

    get xy() {
        return [this.x, this.y];
    }

    set xy(c) {
        [this.x, this.y] = c;
        return this.xy;
    }

    get length() {
        if (this._length === undefined) {
            this._length = Math.hypot(this.x, this.y);
        }
        return this._length;
    }

    get key() {
        if (this._key === undefined) {
            this._key = `${this.x}:${this.y}`;
        }
        return this._key;
    }

    add(other) {
        return new Vec2(this.x + other.x, this.y + other.y);
    }

    subtract(other) {
        return new Vec2(this.x - other.x, this.y - other.y);
    }

    multiply(number) {
        return new Vec2(this.x * number, this.y * number);
    }

    scalarProduct(other) {
        return this.x * other.x + this.y * other.y;
    }

    angleBetween(other) {
        return Math.atan2(this.sineBetween(other), this.cosineBetween(other));
    }

    cosineBetween(other) {
        if (this.length == 0 || other.length == 0) {
            return 0;
        }
        let s = this.scalarProduct(other) / this.length / other.length;

        return clamp(s, -1, 1);
    }

    determinant(other) {
        return this.x * other.y - this.y * other.x;
    }

    sineBetween(other) {
        if (this.length == 0 || other.length == 0) {
            return 0;
        }
        let s = this.determinant(other) / this.length / other.length;

        return clamp(s, -1, 1);
    }

    rotateClockwise90() {
        return new Vec2(this.y, -this.x);
    }

    rotate(angle) {
        return new Vec2(
            this.x * Math.cos(angle) + this.y * Math.sin(angle), 
            -this.x * Math.sin(angle) + this.y * Math.cos(angle)
        );
    }

    normalize() {
        return this.length == 0 ? new Vec2(0, 0) : new Vec2(this.x / this.length, this.y / this.length);
    }

    equal(other) {
        return this.x == other.x && this.y == other.y;
    }

    isValid() {
        return !isNaN(this.x) && !isNaN(this.y);
    }

    do(func) {
        return new Vec2(func(this.x), func(this.y));
    }
}

class Vec3 {
    constructor(x, y, z) {
        this.x = x;
        this.y = y;
        this.z = z;
    }

    get xyz() {
        return [this.x, this.y, this.z];
    }

    set xyz(c) {
        [this.x, this.y, this.z] = c;
        return this.xyz;
    }
}

class Edge {
    constructor(vec1, vec2) {
        this.vec1 = vec1;
        this.vec2 = vec2;
    }
}

// https://web.archive.org/web/20141127210836/http://content.gpwiki.org/index.php/Polygon_Collision

function edgeIntersection(edge1, edge2){
    let a = edge1.vec1;
    let b = edge1.vec2;
    let c = edge2.vec1;
    let d = edge2.vec2;
    let det = b.subtract(a).determinant(c.subtract(d));
    if (det == 0) {
        return null; // parallel lines
    }

    let t = c.subtract(a).determinant(c.subtract(d)) / det;
    let u = b.subtract(a).determinant(c.subtract(a)) / det;

    if ((t < 0) || (u < 0) || (t > 1) || (u > 1)) {
        return null;
    } else {
        return a.multiply(1 - t).add(b.multiply(t));
    }
}


const RungeKuttaConstants = { 
    rkRalston: {
        c: [0, 0.4, (14 - 3 * Math.sqrt(5)) / 16, 1],
        a: [
            [0, 0, 0, 0],
            [0.4, 0, 0, 0],
            [(-2889 + 1428 * Math.sqrt(5)) / 1024, (3785 - 1620 * Math.sqrt(5)) / 1024, 0, 0],
            [(-3365 + 2094 * Math.sqrt(5)) / 6040, (-975 - 3046 * Math.sqrt(5)) / 2552, (467040 + 203968 * Math.sqrt(5)) / 240845, 0]
        ],
        b: [(263 + 24 * Math.sqrt(5)) / 1812, (125 - 1000 * Math.sqrt(5)) / 3828, (3426304 + 1661952 * Math.sqrt(5)) / 5924787, (30 - 4 * Math.sqrt(5)) / 123]
    }
}

// TODO properly integrate acceleration

var integrators = {
    euler: (obj) => {
        return {
            position: obj.position.add(obj.velocity.add(obj.acceleration.multiply(dt())).multiply(dt())),
            velocity: obj.velocity.add(obj.acceleration.multiply(dt()))
        };
    },
    rk4: (obj) => {
        let k1_v = obj.acceleration;
        let k1_x = obj.velocity;
        let k2_x = obj.velocity.add(k1_v.multiply(0.5 * dt()));
        let k3_x = obj.velocity.add(k1_v.multiply(0.5 * dt()));
        let k4_x = obj.velocity.add(k1_v.multiply(dt()));

        return {
            position: obj.position.add((k1_x.add(k2_x.multiply(2)).add(k3_x.multiply(2)).add(k4_x)).multiply(dt() / 6)),
            velocity: obj.velocity.add(obj.acceleration.multiply(dt()))
        };
    },
    rk3over8: (obj) => {
        let k1_v = obj.acceleration;
        let k1_x = obj.velocity;
        let k2_x = obj.velocity.add(k1_v.multiply(dt() / 3));
        let k3_x = obj.velocity.add(k1_v.multiply(-dt() * 2 / 3));
        let k4_x = obj.velocity.add(k1_v.multiply(dt()));

        return {
            position: obj.position.add((k1_x.add(k2_x.multiply(3)).add(k3_x.multiply(3)).add(k4_x)).multiply(dt() / 8)),
            velocity: obj.velocity.add(obj.acceleration.multiply(dt()))
        };
    },
    rkRalston: (obj) => {
        let a = RungeKuttaConstants.rkRalston.a;
        let b = RungeKuttaConstants.rkRalston.b;

        let k1_v = obj.acceleration;
        let k1_x = obj.velocity;
        let k2_x = obj.velocity.add(k1_v.multiply(dt() * a[1][0]));
        let k3_x = obj.velocity.add(k1_v.multiply(dt() * (a[2][0] + a[2][1])));
        let k4_x = obj.velocity.add(k1_v.multiply(dt() * (a[3][0] + a[3][1] + a[3][2])));

        return {
            position: obj.position.add(
                (k1_x.multiply(b[0]).add(k2_x.multiply(b[1])).add(k3_x.multiply(b[2])).add(k4_x.multiply(b[3]))).multiply(dt())),
            velocity: obj.velocity.add(obj.acceleration.multiply(dt()))
        };
    },
    ssprk3: (obj) => {
        let k1_v = obj.acceleration;
        let k1_x = obj.velocity;
        let k2_x = obj.velocity.add(k1_v.multiply(dt() * 8 / 15));
        let k3_x = obj.velocity.add(k1_v.multiply(dt() * 2 / 3));

        return {
            position: obj.position.add(
                (k1_x.multiply(1 / 4).add(k3_x.multiply(3 / 4))).multiply(dt())),
            velocity: obj.velocity.add(obj.acceleration.multiply(dt()))
        };
    },
}

