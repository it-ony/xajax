(function(window, undefined) {

    var parent = window.parent,
        console = window.console,
        initialized = false,
        handlers = {
            ajax: function(data, messageId) {
                ajax(data.url, data.options, function(err, result) {
                    sendMessage(messageId, err, result);
                });
            }
        },
        programIds = ['Msxml2.XMLHTTP', 'Microsoft.XMLHTTP', 'Msxml2.XMLHTTP.4.0'];

    if (window.addEventListener) {
        addEventListener("message", receiveMessage, false);
    } else {
        attachEvent("onmessage", receiveMessage);
    }

    function receiveMessage(event) {
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

    function createQueryString(parameter) {
        var ret = [];

        for (var key in parameter) {
            if (parameter.hasOwnProperty(key)) {
                ret.push(encodeURIComponent(key) + "=" + encodeURIComponent(parameter[key]));
            }
        }

        return ret.join("&");
    }

    function extend(ret) {
        var args = Array.prototype.slice.call(arguments);

        if (args.length > 1) {
            for (var i = 1; i < args.length; i++) {
                var obj = args[i];

                for (var key in obj) {
                    if (obj.hasOwnProperty(key)) {
                        ret[key] = obj[key];
                    }
                }
            }
        }

        return ret;

    }

    function createXhr() {
        //Would love to dump the ActiveX crap in here. Need IE 6 to die first.
        var xhr, i, id;
        if (typeof XMLHttpRequest !== "undefined") {
            return new XMLHttpRequest();
        } else {
            for (i = 0; i < 3; i++) {
                id = programIds[i];
                try {
                    xhr = new ActiveXObject(id);
                } catch (e) {
                    // nothing to do here
                }

                if (xhr) {
                    programIds = [id];  // so faster next time
                    break;
                }
            }
        }

        if (!xhr) {
            throw new Error("XMLHttpRequest not available");
        }

        return xhr;
    }

    function ajax(url, options, callback) {

        var s = {
            url: url
        };

        extend(s, {
            type: "GET",
            contentType: "application/x-www-form-urlencoded",
            async: true,
            headers: {
            },
            data: null,
            queryParameter: null
        }, options);

        if (s.data && !(Object.prototype.toString.call(s.data) === "[object String]" || (typeof FormData !== "undefined" && s.data instanceof FormData))) {
            throw "data must be a string";
        }

        s.hasContent = !/^(?:GET|HEAD)$/.test(s.type);

        if (s.queryParameter) {
            // append query parameter to url
            s.url += /\?/.test(s.url) ? "&" : "?" + createQueryString(s.queryParameter);
        }

        // create new xhr
        var xhr = createXhr();
        xhr.open(s.type, s.url, s.async);

        if (s.hasContent && s.contentType !== false) {
            xhr.setRequestHeader("Content-Type", s.contentType);
        }

        try {
            for (var header in s.headers) {
                if (s.headers.hasOwnProperty(header)) {
                    xhr.setRequestHeader(header, s.headers[header]);
                }
            }
        } catch (e) {
        } // FF3

        xhr.send(s.data);

        var xhrCallback = function (_, isAbort) {

            var xhrResult,
                rHeaders = /^(.*?):[ \t]*([^\r\n]*)\r?$/mg;

            if (xhrCallback && (isAbort || xhr.readyState === 4)) {
                xhrCallback = undefined;

                if (isAbort) {
                    // Abort it manually if needed
                    if (xhr.readyState !== 4) {
                        xhr.abort();
                    }
                } else {

                    var headers = {},
                        match,
                        nativeHeaders = xhr.getAllResponseHeaders();

                    while ((match = rHeaders.exec(nativeHeaders) )) {
                        headers[match[1]] = match[2];
                    }

                    xhrResult = {
                        status: xhr.status,
                        statusText: xhr.statusText,
                        response: xhr.responseText,
                        headers: headers
                    };
                }

                if (callback) {
                    callback(isAbort, xhrResult);
                }
            }
        };

        if (!s.async || xhr.readyState === 4) {
            xhrCallback();
        } else {
            xhr.onreadystatechange = xhrCallback;
        }

        return xhr;

    }

    if (parent) {
        parent.postMessage("initialized", "*");
        initialized = true;
    } else {
        console && console.log && console.log("Cannot find parent");
    }


})(window);