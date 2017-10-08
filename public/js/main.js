//var Materialize = require("./materialize");

function onSelectOrDragImage() {
    return new window.Promise(function (resolve) {
        $(".drop-zone:first")
            .on("dragover", function (event) {
                event.preventDefault();
                event.stopPropagation();
                $(this).addClass('dragging');
            })
            .on("dragleave", function (event) {
                event.preventDefault();
                event.stopPropagation();
                $(this).removeClass('dragging');
            })
            .on("drop", function (event) {
                event.preventDefault();
                event.stopPropagation();
                var file = event.originalEvent.dataTransfer.files[0];
                resolve(file);
            });

        var input = $("input#fake-button");

        input.on("change", function (event) {
            var file = event.delegateTarget.files[0];
            resolve(file);
        });

        $("a#preview").click(function () {
            var url = window.location.href.split('#')[0] + "/raw/data.bin";

            var xhr = new XMLHttpRequest();
            xhr.open("GET", url);
            xhr.responseType = "blob";

            xhr.onload = function () {
                if (this.status === 200) {
                    $("#width").val(4192);
                    $("#height").val(3104);
                    Materialize.updateTextFields();
                    var blob = this.response;
                    resolve(blob);
                }
            };

            xhr.send();
        });

        $(".drop-zone .btn").click(function () {
            input.click();
        });
    });
}

$(document).ready(function () {
    onSelectOrDragImage()
        .then(function (file) {
            var dropZone = $(".drop-zone:first");
            var viewer = $(".viewer:first");
            dropZone.addClass("hidden");
            viewer.removeClass("hidden");
            return canvasUtils.get10BitImageData(file);
        })
        .then(function (_10BitImageData) {
            var body = $(document.body);
            var canvas = $("#viewer");
            var circle = $("#circle");
            var radius = $("#radius");
            var circleX = 0, circleY = 0;
            var minRadius = 3;
            var scale = 1;

            function updateCircle() {
                var rad = parseInt(radius.val());
                var maxRadius = Math.min(canvas[0].width, canvas[0].height) / 2;

                if (rad > maxRadius) {
                    rad = maxRadius;
                    radius.val(rad);
                }

                if (rad < minRadius) {
                    rad = minRadius;
                    radius.val(rad);
                }

                var diameter = rad * 2;
                var x = circleX - rad;
                var y = circleY - rad;

                var rect = canvas[0].getBoundingClientRect();

                if (x < rect.left) x = rect.left;
                if (x + diameter > rect.right - 2) x = rect.right - diameter - 2;
                if (y < rect.top) y = rect.top;
                if (y + diameter > rect.bottom - 2) y = rect.bottom - diameter - 2;

                circle.css("width", diameter - 2);
                circle.css("height", diameter - 2);
                circle.css("left", Math.floor(x));
                circle.css("top", Math.floor(y));
            }

            radius.change(updateCircle);

            canvasUtils.onScroll(canvas, function (delta) {
                var v = parseFloat(radius.val()) * (1 + delta / 2000);
                v = Math.floor(v * 100) / 100;
                var maxRadius = Math.min(canvas[0].width, canvas[0].height) / 2;
                if (v < 3) v = 3;
                if (v > maxRadius) v = maxRadius;
                radius.val(v);
                updateCircle();
            });

            canvasUtils.onMouseMoveAbsolute(canvas, function (x, y) {
                var rect = canvas[0].getBoundingClientRect();
                if (!canvasUtils.ptInRect(x, y, rect)) {
                    circle.addClass("hidden");
                    body.removeClass("no-cursor");
                    return;
                }
                circle.removeClass("hidden");
                body.addClass("no-cursor");
                circleX = x;
                circleY = y;
                updateCircle();
            });

            canvasUtils.onMouseClick(canvas, function (x, y) {
                var rad = parseInt(radius.val());
                var w = parseInt($("#width").val());
                var h = parseInt($("#height").val());
                var points = parseInt($("#num_points").val());
                if (!w || !h || !points) return;
                x /= scale;
                y /= scale;
                _10BitImageData = canvasUtils.balanceWhite(_10BitImageData, w, h, x, y, rad, points);
                showImage();
            });

            var inputWidth = $("#width");
            var inputHeight = $("#height");

            function showImage() {
                var w = inputWidth.val();
                var h = inputHeight.val();
                if (!w || !h) return;
                var imageData = canvasUtils.convertTo8bit(_10BitImageData, w, h);
                scale = canvasUtils.calcScale(imageData);
                canvasUtils.drawIntoCanvas(imageData, canvas, scale);
            }

            showImage();

            inputWidth.change(showImage);
            inputHeight.change(showImage);
            $(window).resize(showImage);

        });
});