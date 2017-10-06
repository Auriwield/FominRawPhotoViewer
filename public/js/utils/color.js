"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Color = function () {
    function Color(r, g, b, a) {
        _classCallCheck(this, Color);

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


    _createClass(Color, [{
        key: "createFrom565color",
        value: function createFrom565color(_565color) {
            var r = _565color >>> 11;
            var g = _565color >>> 5 & 63;
            var b = _565color & 31;

            var k1 = 255 / 31;
            var k2 = 255 / 63;

            this.r = Math.floor(r * k1);
            this.g = Math.floor(g * k2);
            this.b = Math.floor(b * k1);
            this.a = 255;

            this.fixValuesIfNeed();
        }
    }, {
        key: "fixValuesIfNeed",
        value: function fixValuesIfNeed() {
            if (this.r < 0) this.r = 0;
            if (this.r > 255) this.r = 255;

            if (this.g < 0) this.g = 0;
            if (this.g > 255) this.g = 255;

            if (this.b < 0) this.b = 0;
            if (this.b > 255) this.b = 255;

            if (this.a < 0) this.a = 0;
            if (this.a > 255) this.a = 255;
        }
    }, {
        key: "toUint16",
        value: function toUint16() {
            var color = new Uint16Array(1);

            var k1 = 255 / 31;
            var k2 = 255 / 63;

            var r = Math.round(this.r / k1);
            if (r > 31) r = 31;

            var g = Math.round(this.g / k2);
            if (g > 63) g = 63;

            var b = Math.round(this.b / k1);
            if (b > 31) b = 31;

            color[0] = (r << 11) + (g << 5) + b;
            return color[0];
        }

        // noinspection JSUnusedGlobalSymbols

    }, {
        key: "check",
        value: function check(r, g, b, a) {
            if (a === undefined) a = this.a;
            return this.r === r && this.g === g && this.b === b && this.a === a;
        }
    }, {
        key: "toString",
        value: function toString() {
            return "r: " + this.r + " g: " + this.g + " b: " + this.b + " a: " + this.a;
        }
    }, {
        key: "normalize",
        value: function normalize() {
            if (this.r > 1 || this.g > 1 || this.b > 1 || this.a > 1) {
                this.r /= 255;
                this.g /= 255;
                this.b /= 255;
                this.a /= 255;
            }
        }
    }, {
        key: "min",
        value: function min(color) {
            if (color.r < this.r) this.r = color.r;
            if (color.g < this.g) this.g = color.g;
            if (color.b < this.b) this.b = color.b;
            if (color.a < this.a) this.a = color.a;
        }
    }, {
        key: "max",
        value: function max(color) {
            if (color.r > this.r) this.r = color.r;
            if (color.g > this.g) this.g = color.g;
            if (color.b > this.b) this.b = color.b;
            if (color.a > this.a) this.a = color.a;
        }

        // return a dot product of two color-vectors
        // m1 this color multiplier
        // m2 color multiplier

    }, {
        key: "plus",
        value: function plus(color, m1, m2) {
            var r = Math.floor(this.r * m1 + color.r * m2);
            var g = Math.floor(this.g * m1 + color.g * m2);
            var b = Math.floor(this.b * m1 + color.b * m2);
            var a = Math.floor(this.a * m1 + color.a * m2);

            return new Color(r, g, b, a);
        }
    }, {
        key: "distanceTo",
        value: function distanceTo(color, withAlfa) {
            var rDiff = this.r - color.r;
            var gDiff = this.g - color.g;
            var bDiff = this.b - color.b;
            var dot = rDiff * rDiff + gDiff * gDiff + bDiff * bDiff;

            if (withAlfa) {
                var aDiff = this.a - color.a;
                dot += aDiff * aDiff;
            }

            return Math.sqrt(dot);
        }
    }]);

    return Color;
}();