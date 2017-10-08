const canvasUtils = (function () {

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

    function calcScale(imageData) {
        var maxWidth = $(window).width() * 0.9;
        var maxHeight = ($(window).height() - $(".header").height() - $("#inputs").height()) * 0.9;
        var mpX = maxWidth / imageData.width;
        var mpY = maxHeight / imageData.height;
        return Math.min(mpX, mpY);
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

    function onMouseClick(canvas, callback) {
        $(document.body).click(function (e) {
            if (e.which === 1) {
                var rect = canvas[0].getBoundingClientRect();
                if (!canvasUtils.ptInRect(e.pageX, e.pageY, rect)) return;
                callback(e.pageX - rect.left, e.pageY - rect.top);
            }
        });
    }

    function onMouseMoveAbsolute(canvas, callback) {
        $(document.body).mousemove(function (e) {
            callback(e.pageX, e.pageY);
        });
    }

    function onScroll(canvas, callback) {
        $(document.body).bind('mousewheel', function (e) {
            var rect = canvas[0].getBoundingClientRect();
            if (canvasUtils.ptInRect(e.pageX, e.pageY, rect)) {
                callback(e.originalEvent.wheelDelta);
            }
        });
    }

    function ptInRect(x, y, rect) {
        return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;

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
        w = Math.floor(w / 2);
        h = Math.floor(h / 2);

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

    function balanceWhite(data, w, h, x, y, rad, numOfPoints) {
        var w2 = w;
        w = Math.floor(w / 2);
        h = Math.floor(h / 2);

        var ar = 0;
        var ag = 0;
        var ab = 0;
        for (var n = 0; n < numOfPoints; n++) {
            var a = getRandom(0, Math.PI * 2);
            var ra = getRandom(0, rad);
            var x1 = Math.floor(Math.cos(a) * ra + x);
            var y1 = Math.floor(Math.sin(a) * ra + y);

            var index = (y1 * w2 * 2 + x1 * 2) * 2;
            ar += data[index + w2 * 2 + 2] + data[index + w2 * 2 + 3] * 256;

            var ag1 = data[index + 2] + data[index + 3] * 256;
            var ag2 = data[index + w2 * 2] + data[index + w2 * 2 + 1] * 256;
            ag += (ag1 + ag2) / 2;
            ab += data[index] + data[index + 1] * 256;
        }

        ar /= numOfPoints;
        ag /= numOfPoints;
        ab /= numOfPoints;

        var kr = 1023 / ar;
        var kg = 1023 / ag;
        var kb = 1023 / ab;

        var dest = new Uint8ClampedArray(data.length);

        for (var i = 0; i < h; i++) {
            for (var j = 0; j < w; j++) {
                index = (i * w2 * 2 + j * 2) * 2;

                var r = data[index + w2 * 2 + 2] + data[index + w2 * 2 + 3] * 256;
                var g1 = data[index + 2] + data[index + 3] * 256;
                var g2 = data[index + w2 * 2] + data[index + w2 * 2 + 1] * 256;
                var b = data[index] + data[index + 1] * 256;

                r *= kr;
                g1 *= kg;
                g2 *= kg;
                b *= kb;

                if (r > 1023) r = 1024;
                if (g1 > 1023) g1 = 1023;
                if (g2 > 1023) g2 = 1023;
                if (b > 1023) b = 1023;
                //r
                dest[index + w2 * 2 + 2] = r % 256;
                dest[index + w2 * 2 + 3] = r >> 8;
                //g1
                dest[index + 2] = g1 % 256;
                dest[index + 3] = g1 >> 8;
                //g2
                dest[index + w2 * 2] = g2 % 256;
                dest[index + w2 * 2 + 1] = g2 >> 8;
                //b
                dest[index] = b % 256;
                dest[index + 1] = b >> 8;
            }
        }
        return dest;
    }

    function getRandom(a, b) {
        return a + Math.random() * b;
    }

    return {
        drawIntoCanvas: drawIntoCanvas,
        calcScale: calcScale,
        getImageData: getImageData,
        onMouseMoveAbsolute: onMouseMoveAbsolute,
        onMouseClick: onMouseClick,
        onScroll: onScroll,
        get10BitImageData: get10BitImageData,
        convertTo8bit: convertTo8bit,
        ptInRect: ptInRect,
        balanceWhite: balanceWhite
    }
})();