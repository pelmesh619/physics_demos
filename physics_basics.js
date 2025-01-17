class Constants {
    static get g() { return 9.8; }
}

class ElectricConstants {
    static get k() { return 9 * Math.pow(10, 9); }

    static get epsilon0() { return 8.85 * Math.pow(10, -11); }
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
  
function toScientificNotation(number, roundDigits=3) {
    exponent = digitnumber(number);
    if (exponent > 2 || exponent < -2) {
        number = number * Math.pow(10, -exponent);
    }
  
    let string = round(number, roundDigits);
    if (exponent > 2 || exponent < -2) {
        string += ' x 10^(' + exponent + ')';
    }
    return string;
}
  


class Vec2 {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }

    get xy() {
        return [this.x, this.y];
    }

    set xy(c) {
        [this.x, this.y] = c;
        return this.xy;
    }

    get length() {
        return Math.hypot(this.x, this.y);
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