class Color {
    constructor(r, g, b, a) {
        if (arguments.length === 1) {
            this.createFrom565color(arguments[0]);
            return;
        }

        this.r = r;
        this.g = g;
        this.b = b;
        this.a = a;
    }

    // create from 5/6/5 (16-bit) encoded color
    // rrrrr gggggg bbbbb
    createFrom565color(_565color) {
        let r = _565color >>> 11;
        let g = (_565color >>> 5) & 63;
        let b = _565color & 31;

        let k1 = 255 / 31;
        let k2 = 255 / 63;

        this.r = Math.floor(r * k1);
        this.g = Math.floor(g * k2);
        this.b = Math.floor(b * k1);
        this.a = 255;

        this.fixValuesIfNeed();
    }

    fixValuesIfNeed() {
        if (this.r < 0) this.r = 0;
        if (this.r > 255) this.r = 255;

        if (this.g < 0) this.g = 0;
        if (this.g > 255) this.g = 255;

        if (this.b < 0) this.b = 0;
        if (this.b > 255) this.b = 255;

        if (this.a < 0) this.a = 0;
        if (this.a > 255) this.a = 255;
    }

    toUint16() {
        let color = new Uint16Array(1);

        let k1 = 255 / 31;
        let k2 = 255 / 63;

        let r = Math.round(this.r / k1);
        if (r > 31) r = 31;

        let g = Math.round(this.g / k2);
        if (g > 63) g = 63;

        let b = Math.round(this.b / k1);
        if (b > 31) b = 31;

        color[0] = (r << 11) + (g << 5) + b;
        return color[0];
    }

    // noinspection JSUnusedGlobalSymbols
    check(r, g, b, a) {
        if (a === undefined) a = this.a;
        return this.r === r && this.g === g && this.b === b && this.a === a;
    }

    toString() {
        return `r: ${this.r} g: ${this.g} b: ${this.b} a: ${this.a}`;
    }

    normalize() {
        if (this.r > 1 || this.g > 1
            || this.b > 1 || this.a > 1) {
            this.r /= 255;
            this.g /= 255;
            this.b /= 255;
            this.a /= 255;
        }
    }

    min(color) {
        if (color.r < this.r) this.r = color.r;
        if (color.g < this.g) this.g = color.g;
        if (color.b < this.b) this.b = color.b;
        if (color.a < this.a) this.a = color.a;
    }

    max(color) {
        if (color.r > this.r) this.r = color.r;
        if (color.g > this.g) this.g = color.g;
        if (color.b > this.b) this.b = color.b;
        if (color.a > this.a) this.a = color.a;
    }

    // return a dot product of two color-vectors
    // m1 this color multiplier
    // m2 color multiplier
    plus(color, m1, m2) {
        let r = Math.floor(this.r * m1 + color.r * m2);
        let g = Math.floor(this.g * m1 + color.g * m2);
        let b = Math.floor(this.b * m1 + color.b * m2);
        let a = Math.floor(this.a * m1 + color.a * m2);

        return new Color(r, g, b, a);
    }

    distanceTo(color, withAlfa) {
        let rDiff = this.r - color.r;
        let gDiff = this.g - color.g;
        let bDiff = this.b - color.b;
        let dot = rDiff * rDiff + gDiff * gDiff + bDiff * bDiff;

        if (withAlfa) {
            let aDiff = this.a - color.a;
            dot += aDiff * aDiff;
        }

        return Math.sqrt(dot);
    }
}