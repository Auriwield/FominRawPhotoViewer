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
            var canvas = $("#viewer");
            var circle = $("#circle");
            var radius = $("#radius");
            var circleX = 0, circleY = 0;

            function updateCircle() {
                var rad = parseInt(radius.val());
                var diameter = rad * 2;
                var x = circleX - rad;
                var y = circleY - rad;

                circle.css("width", diameter);
                circle.css("height", diameter);
                circle.css("left", x);
                circle.css("top", y);
            }

            radius.change(updateCircle);

            canvasUtils.onScroll(canvas, function (delta) {
                var v = parseFloat(radius.val()) * (1 + delta / 2000);
                v = Math.floor(v * 100) / 100;
                if (v < 3 || v > Math.min(canvas[0].width, canvas[0].height)) return;
                radius.val(v);
                updateCircle();
            });

            canvasUtils.onMouseMoveAbsolute(canvas, function (x, y) {
                var rect = canvas[0].getBoundingClientRect();
                var canvasPos = canvas.offset();
                if (!canvasUtils.ptInRect(x, y + canvasPos.top, rect)) {
                    circle.addClass("hidden");
                    return;
                }
                circle.removeClass("hidden");
                circleX = x;
                circleY = y;
                updateCircle();
            });


            function showImage() {
                var imageData = canvasUtils.convertTo8bit(_10BitImageData, 4192, 3104);
                var scale = canvasUtils.calcScale(imageData);
                canvasUtils.drawIntoCanvas(imageData, canvas, scale);
            }

            showImage();

            $(window).resize(showImage);

        });
});