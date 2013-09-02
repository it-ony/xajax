(function(window, undefined) {

    var parent = window.parent,
        console = window.console,
        initialized = false,
        handlers = {
            ajax: function(data, messageId) {

            }
        };

    if (window.addEventListener) {
        addEventListener("message", receiveMessage, false);
    } else {
        attachEvent("onmessage", receiveMessage);
    }

    function receiveMessage(event) {
        console.log(event);

        if (!initialized) {
            return;
        }

        var eventData = JSON.parse(event.data);

        // validate event data
        if (!(eventData && eventData.hasOwnProperty("type") && eventData.hasOwnProperty("data") && eventData.hasOwnProperty("messageId"))) {
            sendMessage(eventData.messageId, "Data couldn't be parsed");
            return;
        }

        var handler = handlers[eventData.type];

        if (handler) {
            try {
                // invoke handler
                handler(eventData.data, eventData.messageId);
            } catch (e) {
                sendMessage(eventData.messageId, e);
            }
        } else {
            sendMessage(eventData.messageId, "Handler for type '" + eventData.type + "' not found");
        }
    }

    function sendMessage(messageId, err, data) {

        var message = {
            error: err,
            data: data,
            messageId: messageId
        };

        parent.postMessage(JSON.stringify(message), "*");
    }

    if (parent) {
        parent.postMessage("initialized", "*");
        initialized = true;
    } else {
        console && console.log && console.log("Cannot find parent");
    }


})(window);