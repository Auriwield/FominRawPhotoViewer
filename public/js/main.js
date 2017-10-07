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

            function showImage() {
                var imageData = canvasUtils.convertTo8bit(_10BitImageData, 4192, 3104);
                var scale = canvasUtils.calcScale(imageData, 1);
                var canvas = $("#viewer");
                canvasUtils.drawIntoCanvas(imageData, canvas, scale);
            }

            showImage();

            $(window).resize(showImage);
        });
});