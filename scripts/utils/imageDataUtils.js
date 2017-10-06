const canvasUtils = (function () {

    // noinspection JSUnusedGlobalSymbols
    function getImage(canvas, imageData) {
        drawIntoCanvas(imageData, canvas, 1.0);
        return canvas[0].toDataURL();
    }

    function drawIntoCanvas(imageData, canvas, scale) {
        let ctx = canvas[0].getContext("2d");
        if (!scale) scale = calcScale(imageData);
        canvas[0].width = imageData.width * scale;
        canvas[0].height = imageData.height * scale;

        if (scale !== 1)
            imageData = scaleImageData(imageData, scale);
        else
            imageData = new ImageData(imageData.data, imageData.width, imageData.height);

        ctx.putImageData(imageData, 0, 0);
    }

    function makeCanvasSquare(canvas, subw = 0, subh = 0) {
        let maxWidth = $(window).width() * 0.9 - subw;
        let maxHeight = ($(window).height() - $(".header").height()) * 0.9 - subh;

        let side = Math.min(maxWidth, maxHeight);

        canvas[0].width = side;
        canvas[0].height = side;
    }

    function calcScale(imageData, multiplier = 2) {
        let maxWidth = $(window).width() / multiplier * 0.9;
        let maxHeight = ($(window).height() - $(".header").height()) * 0.9;
        let mpX = maxWidth / imageData.width;
        let mpY = maxHeight / imageData.height;
        return Math.min(mpX, mpY);
    }

    function getPrescaledImageData() {
        let maxWidth = Math.floor($(window).width() * 0.8);
        let maxHeight = Math.floor(($(window).height() - $(".header").height()) * 0.8);
        return new ImageData(new Uint8ClampedArray(maxWidth * maxHeight * 4), maxWidth, maxHeight);
    }

    function scaleImageData(imageData, scale) {
        let h1 = imageData.height;
        let w1 = imageData.width;
        let w2 = Math.floor(w1 * scale);
        let h2 = Math.floor(h1 * scale);

        let srcLength = h1 * w1 * 4;
        let destLength = w2 * h2 * 4;

        let src = imageData.data;
        let dest = new Uint8ClampedArray(destLength);

        for (let y = 0; y < h2; y++) {
            for (let x = 0; x < w2; x++) {
                let x1 = Math.floor(x / scale);
                let y1 = Math.floor(y / scale);

                if (x1 < 0 || x1 >= w1 || y1 < 0 || y1 >= h1)
                    continue;

                if (x < 0 || x >= w2 || y < 0 || y >= h2)
                    continue;

                let destIndex = (y * w2 + x) * 4;
                let sourceIndex = (y1 * w1 + x1) * 4;

                if (destIndex + 3 >= destLength || destIndex < 0
                    || sourceIndex + 3 >= srcLength || sourceIndex < 0) continue;


                for (let i = 0; i < 4; i++) {
                    dest[destIndex + i] = src[sourceIndex + i];
                }
            }
        }

        return new ImageData(dest, w2, h2);
    }

    function applyBorder(imageData, t, color) {
        let w = imageData.width + t;
        let h = imageData.height + t;

        let dest = new Uint8ClampedArray(w * h * 4);

        for (let i = 0; i < imageData.height; i++) {
            for (let j = 0; j < imageData.width; j++) {
                let srcIndex = (i * imageData.width + j) * 4;
                let destIndex = ((i + t) * w + j + t) * 4;
                for (let p = 0; p < 4; p++) {
                    dest[destIndex + p] = imageData.data[srcIndex + p]
                }
                destIndex += 4;
            }
        }

        let data = new ImageData(dest, w, h);

        fillRectangle(data, 0, 0, w, t, color);
        fillRectangle(data, 0, t, t, h - t * 2, color);
        fillRectangle(data, w - t, t, t, h - t * 2, color);
        fillRectangle(data, 0, h - t, w, t, color);

        return data;
    }

    function fillRectangle(imageData, x, y, width, height, color) {
        let yEnd = y + height;
        let xEnd = x + width;

        if (yEnd > imageData.height) yEnd = imageData.height;
        if (xEnd > imageData.width) xEnd = imageData.width;

        for (let i = y; i < yEnd; i++) {
            for (let j = x; j < xEnd; j++) {
                let index = (i * imageData.width + j) * 4;
                imageData.data[index] = color.r;
                imageData.data[index + 1] = color.g;
                imageData.data[index + 2] = color.b;
                imageData.data[index + 3] = color.a;
            }
        }
    }

    function getImageData(file) {
        let url = window.URL.createObjectURL(file);
        let canvas = document.createElement('canvas');
        let ctx = canvas.getContext("2d");
        let image = new Image();
        let promise = new window.Promise(function (resolve) {
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
        let x = -1;
        let y = -1;
        canvas.mousemove((e) => {

            if (e.which === 1
                && x !== -1 && y !== -1) {
                let dx = e.pageX - x;
                let dy = e.pageY - y;
                callback(dx, dy);
            }

            x = e.pageX;
            y = e.pageY;
        });
    }

    function onMouseDownAbsolute(canvas, callback) {
        canvas.mousemove((e) => {
            let rect = canvas[0].getBoundingClientRect();
            if (e.which === 1) {
                let x = e.pageX - rect.left;
                let y = e.pageY - rect.top;
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
        let w = 4;
        let h = 4;
        let dest = new Uint8ClampedArray(w * h * 4);

        for (let i = 3; i < dest.length; i += 4) {
            dest[i] = 255;
        }

        x = x - x % 4;
        y = y - y % 4;

        let xEnd = x + 4;
        let yEnd = y + 4;

        if (xEnd > imageData.width) xEnd = imageData.width;
        if (yEnd > imageData.height) yEnd = imageData.height;

        for (let i = y, i1 = 0; i < yEnd; i++, i1++) {
            for (let j = x, j1 = 0; j < xEnd; j++, j1++) {
                let srcIndex = (i * imageData.width + j) * 4;
                let destIndex = (i1 * w + j1) * 4;

                for (let p = 0; p < 3; p++) {
                    dest[destIndex + p] = imageData.data[srcIndex + p]
                }
            }
        }

        return new ImageData(dest, w, h)
    }

    // noinspection JSUnusedGlobalSymbols
    return {
        getImage,
        makeCanvasSquare,
        drawIntoCanvas,
        calcScale,
        scaleImageData,
        getImageData,
        getPrescaledImageData,
        onMouseDown: onMouseDownDelta,
        onMouseDownAbsolute: onMouseDownAbsolute,
        onScroll,
        getSquareAtCoords,
        applyBorder
    }
})();