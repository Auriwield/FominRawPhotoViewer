"use strict";

function onSelectOrDragImage() {
    return new window.Promise(function (resolve) {
        $(".drop-zone:first").on("dragover", function (event) {
            event.preventDefault();
            event.stopPropagation();
            $(this).addClass('dragging');
        }).on("dragleave", function (event) {
            event.preventDefault();
            event.stopPropagation();
            $(this).removeClass('dragging');
        }).on("drop", function (event) {
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
    onSelectOrDragImage().then(function (file) {
        var dropZone = $(".drop-zone:first");
        var tabs = $("#tabs");
        dropZone.addClass("hidden");
        tabs.removeClass("hidden");
        return canvasUtils.getImageData(file);
    }).then(function (leftImageData) {
        $("nav li a.active").first().parent().click();
    });
});

var imageData = function imageData() {
    return {
        left: null,
        right: null
    };
};