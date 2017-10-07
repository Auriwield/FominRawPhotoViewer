const canvasUtils = (function () {

    // noinspection JSUnusedGlobalSymbols
    function getImage(canvas, imageData) {
        drawIntoCanvas(imageData, canvas, 1.0);
        return canvas[0].toDataURL();
    }

    function drawIntoCanvas(imageData, canvas, scale) {
        var ctx = canvas[0].getContext("2d");
        if (!scale) scale = calcScale(imageData);
        canvas[0].width = imageData.width * scale;
        canvas[0].height = imageData.height * scale;

        if (scale !== 1)
            imageData = scaleImageData(imageData, scale);
        else
            imageData = new ImageData(imageData.data, imageData.width, imageData.height);

        ctx.putImageData(imageData, 0, 0);
    }

    function makeCanvasSquare(canvas, subw, subh) {
        if (!subw) subw = 0;
        if (!subh) subh = 0;

        var maxWidth = $(window).width() * 0.9 - subw;
        var maxHeight = ($(window).height() - $(".header").height()) * 0.9 - subh;

        var side = Math.min(maxWidth, maxHeight);

        canvas[0].width = side;
        canvas[0].height = side;
    }

    function calcScale(imageData, multiplier) {
        if (!multiplier) multiplier = 2;
        var maxWidth = $(window).width() / multiplier * 0.9;
        var maxHeight = ($(window).height() - $(".header").height()) * 0.9;
        var mpX = maxWidth / imageData.width;
        var mpY = maxHeight / imageData.height;
        return Math.min(mpX, mpY);
    }

    function getPrescaledImageData() {
        var maxWidth = Math.floor($(window).width() * 0.8);
        var maxHeight = Math.floor(($(window).height() - $(".header").height()) * 0.8);
        return new ImageData(new Uint8ClampedArray(maxWidth * maxHeight * 4), maxWidth, maxHeight);
    }

    function scaleImageData(imageData, scale) {
        var h1 = imageData.height;
        var w1 = imageData.width;
        var w2 = Math.floor(w1 * scale);
        var h2 = Math.floor(h1 * scale);

        var srcLength = h1 * w1 * 4;
        var destLength = w2 * h2 * 4;

        var src = imageData.data;
        var dest = new Uint8ClampedArray(destLength);

        for (var y = 0; y < h2; y++) {
            for (var x = 0; x < w2; x++) {
                var x1 = Math.floor(x / scale);
                var y1 = Math.floor(y / scale);

                if (x1 < 0 || x1 >= w1 || y1 < 0 || y1 >= h1)
                    continue;

                if (x < 0 || x >= w2 || y < 0 || y >= h2)
                    continue;

                var destIndex = (y * w2 + x) * 4;
                var sourceIndex = (y1 * w1 + x1) * 4;

                if (destIndex + 3 >= destLength || destIndex < 0
                    || sourceIndex + 3 >= srcLength || sourceIndex < 0) continue;


                for (var i = 0; i < 4; i++) {
                    dest[destIndex + i] = src[sourceIndex + i];
                }
            }
        }

        return new ImageData(dest, w2, h2);
    }

    function applyBorder(imageData, t, color) {
        var w = imageData.width + t;
        var h = imageData.height + t;

        var dest = new Uint8ClampedArray(w * h * 4);

        for (var i = 0; i < imageData.height; i++) {
            for (var j = 0; j < imageData.width; j++) {
                var srcIndex = (i * imageData.width + j) * 4;
                var destIndex = ((i + t) * w + j + t) * 4;
                for (var p = 0; p < 4; p++) {
                    dest[destIndex + p] = imageData.data[srcIndex + p]
                }
                destIndex += 4;
            }
        }

        var data = new ImageData(dest, w, h);

        fillRectangle(data, 0, 0, w, t, color);
        fillRectangle(data, 0, t, t, h - t * 2, color);
        fillRectangle(data, w - t, t, t, h - t * 2, color);
        fillRectangle(data, 0, h - t, w, t, color);

        return data;
    }

    function fillRectangle(imageData, x, y, width, height, color) {
        var yEnd = y + height;
        var xEnd = x + width;

        if (yEnd > imageData.height) yEnd = imageData.height;
        if (xEnd > imageData.width) xEnd = imageData.width;

        for (var i = y; i < yEnd; i++) {
            for (var j = x; j < xEnd; j++) {
                var index = (i * imageData.width + j) * 4;
                imageData.data[index] = color.r;
                imageData.data[index + 1] = color.g;
                imageData.data[index + 2] = color.b;
                imageData.data[index + 3] = color.a;
            }
        }
    }

    function getImageData(file) {
        var url = window.URL.createObjectURL(file);
        var canvas = document.createElement('canvas');
        var ctx = canvas.getContext("2d");
        var image = new Image();
        var promise = new window.Promise(function (resolve) {
            image.onload = function () {
                canvas.width = image.width;
                canvas.height = image.height;
                ctx.drawImage(image, 0, 0);
                resolve(ctx.getImageData(0, 0, image.width, image.height));
            };
        });
        image.src = url;
        return promise;
    }

    function onMouseDownDelta(canvas, callback) {
        var x = -1;
        var y = -1;
        canvas.mousemove(function (e) {
            if (e.which === 1
                && x !== -1 && y !== -1) {
                var dx = e.pageX - x;
                var dy = e.pageY - y;
                callback(dx, dy);
            }

            x = e.pageX;
            y = e.pageY;
        });
    }

    function onMouseDownAbsolute(canvas, callback) {
        canvas.mousemove(function (e) {
            var rect = canvas[0].getBoundingClientRect();
            if (e.which === 1) {
                var x = e.pageX - rect.left;
                var y = e.pageY - rect.top;
                callback(x, y);
            }
        });
    }

    function onScroll(canvas, callback) {
        canvas.bind('mousewheel', function (e) {
            callback(e.originalEvent.wheelDelta);
        });
    }

    function getSquareAtCoords(imageData, x, y) {
        var w = 4;
        var h = 4;
        var dest = new Uint8ClampedArray(w * h * 4);

        for (var i = 3; i < dest.length; i += 4) {
            dest[i] = 255;
        }

        x = x - x % 4;
        y = y - y % 4;

        var xEnd = x + 4;
        var yEnd = y + 4;

        if (xEnd > imageData.width) xEnd = imageData.width;
        if (yEnd > imageData.height) yEnd = imageData.height;
        var i1 = 0;
        for (i = y; i < yEnd; i++, i1++) {
            for (var j = x, j1 = 0; j < xEnd; j++, j1++) {
                var srcIndex = (i * imageData.width + j) * 4;
                var destIndex = (i1 * w + j1) * 4;

                for (var p = 0; p < 3; p++) {
                    dest[destIndex + p] = imageData.data[srcIndex + p]
                }
            }
        }

        return new ImageData(dest, w, h)
    }

    function get10BitImageData(raw) {
        var reader = new FileReader();
        return new window.Promise(function (resolve) {
            reader.onload = function () {
                var array = new Uint8Array(reader.result);
                resolve(array);
            };
            reader.readAsArrayBuffer(raw);
        });
    }

    function convertTo8bit(data, w, h) {
        var w2 = w;
        w = w / 2;
        h = h / 2;

        var dest = new Uint8ClampedArray(w * h * 4);

        for (var i = 0; i < h; i++) {
            for (var j = 0; j < w; j++) {
                var index = (i * w2 * 2 + j * 2) * 2;

                var r = (data[index + w2 * 2 + 2] + data[index + w2 * 2 + 3] * 256) / 4;
                var g1 = (data[index + 2] + data[index + 3] * 256) / 4;
                var g2 = (data[index + w2 * 2] + data[index + w2 * 2 + 1] * 256) / 4;
                var g = (g1 + g2) / 2;
                var b = (data[index] + data[index + 1] * 256) / 4;

                var destIndex = (i * w + j) * 4;

                dest[destIndex] = Math.floor(r);
                dest[destIndex + 1] = Math.floor(g);
                dest[destIndex + 2] = Math.floor(b);
                dest[destIndex + 3] = 255;
            }
        }

        return new ImageData(dest, w, h);
    }

    // noinspection JSUnusedGlobalSymbols
    return {
        getImage: getImage,
        makeCanvasSquare: makeCanvasSquare,
        drawIntoCanvas: drawIntoCanvas,
        calcScale: calcScale,
        scaleImageData: scaleImageData,
        getImageData: getImageData,
        getPrescaledImageData: getPrescaledImageData,
        onMouseDown: onMouseDownDelta,
        onMouseDownAbsolute: onMouseDownAbsolute,
        onScroll: onScroll,
        getSquareAtCoords: getSquareAtCoords,
        applyBorder: applyBorder,
        get10BitImageData: get10BitImageData,
        convertTo8bit: convertTo8bit
    }
})();