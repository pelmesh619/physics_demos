class Constants {
    static get g() { return 9.8; }
    static get k() { return 9 * Math.pow(10, 9); }

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

class Vec2 {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }

    get xy() {
        return [x, y];
    }

    set xy(c) {
        x = c[0];
        y = c[1];
        return [x, y]
    }
}