(function(window, undefined) {

    if (window.addEventListener) {
        addEventListener("message", receiveMessage, false);
    } else {
        attachEvent("onmessage", receiveMessage);
    }

    function receiveMessage(event) {
        console.log(event);
    }

    var parent = window.parent,
        console = window.console;

    if (parent) {
        parent.postMessage("initialized", "*");
    } else {
        console && console.log && console.log("Cannot find parent");
    }


})(window);