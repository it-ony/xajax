(function (window, undefined) {
    var XAJAX = window.XAJAX = window.XAJAX || {},
        parent = window.parent,
        console = window.console,
        programIds = ['Msxml2.XMLHTTP', 'Microsoft.XMLHTTP', 'Msxml2.XMLHTTP.4.0'],

        Server = function (options) {

            options = extend({}, {
                allowedOrigins: [
                    // use "*" for all
                ],

                allowedRequests: [
                ],

                /***
                 * guard access to the origin
                 *
                 * @param {String} origin - the origin the request came from
                 * @returns {boolean} - true if the access is granted
                 */
                allowOrigin: function (origin) {
                    for (var i = 0; i < this.allowedOrigins.length; i++) {
                        var o = this.allowedOrigins[i];

                        if (o === "*") {
                            return true;
                        }

                        if (o === origin) {
                            return true
                        }
                    }

                    return false;
                },

                /***
                 *
                 * guard access for ajax requests
                 *
                 * @param {String} url
                 *
                 * @returns {boolean}
                 */
                allowRequest: function (url) {

                    for (var i = 0; i < this.allowedRequests.length; i++) {
                        var request = this.allowedRequests[i];

                        if (Object.prototype.toString.call(request) === "[object RegExp]") {
                            if (request.test(url)) {
                                return true;
                            }
                        } else if (request === url) {
                            return true;
                        }

                    }

                    return false;
                }
            }, options);

            var initialized = false,
                handlers = {
                    ajax: function (data, messageId) {

                        if (options.allowRequest(data.url)) {
                            ajax(data.url, data.options, function (err, result) {
                                sendMessage(messageId, err, result);
                            });
                        } else {
                            sendMessage(messageId, "Request for url '" + data.url + "' not allowed", null);
                        }


                    }
                };

            if (window.addEventListener) {
                addEventListener("message", receiveMessage, false);
            } else {
                attachEvent("onmessage", receiveMessage);
            }

            if (parent) {
                // send initialized event
                parent.postMessage("initialized", "*");
                initialized = true;
            } else {
                console && console.log && console.log("Cannot find parent");
            }


            /***
             * event handler for receiveMessage on window object
             * @param event
             */
            function receiveMessage(event) {
                if (!initialized) {
                    return;
                }

                var eventData = JSON.parse(event.data);

                // validate event data
                if (!(eventData && eventData.hasOwnProperty("type") && eventData.hasOwnProperty("data") && eventData.hasOwnProperty("messageId"))) {
                    sendMessage(eventData.messageId, "Data couldn't be parsed", null);
                    return;
                }

                if (!options.allowOrigin(event.origin)) {
                    sendMessage(eventData.messageId, "Origin " + event.origin + " not allowed", null);
                    return;
                }


                var handler = handlers[eventData.type];

                if (handler) {
                    try {
                        // invoke handler
                        handler(eventData.data, eventData.messageId);
                    } catch (e) {
                        sendMessage(eventData.messageId, e, null);
                    }
                } else {
                    sendMessage(eventData.messageId, "Handler for type '" + eventData.type + "' not found", null);
                }
            }
        };

    /***
     *
     * @param [options]
     * @param {Array} [options.allowedOrigins=['*']]
     * @param {Array} [options.allowedRequests]
     * @param {Function} [options.allowOrigin]
     * @param {Function} [options.allowRequest]
     *
     * @returns {Server}
     */
    XAJAX.createServer = function(options) {
        return new Server(options);
    };

    /***
     * send a message to the parent frame
     *
     * @param messageId - id to identify the callback in the client
     * @param err - error object, if an error occurred
     * @param data - result of the invokation
     */
    function sendMessage(messageId, err, data) {

        var message = {
            error: err,
            data: data,
            messageId: messageId
        };

        parent.postMessage(JSON.stringify(message), "*");
    }

    /***
     * creates a query string from the parameter object
     *
     * @param parameter
     * @returns {string}
     */
    function createQueryString(parameter) {

        if (!parameter) {
            return "";
        }

        var ret = [];

        for (var key in parameter) {
            if (parameter.hasOwnProperty(key)) {
                ret.push(encodeURIComponent(key) + "=" + encodeURIComponent(parameter[key]));
            }
        }

        return ret.join("&");
    }

    /***
     * extend the first object with all keys from the following objects
     *
     * @param [result]
     * @returns {Object}
     */
    function extend(result) {
        var args = Array.prototype.slice.call(arguments);

        if (args.length > 1) {
            for (var i = 1; i < args.length; i++) {
                var obj = args[i];

                for (var key in obj) {
                    if (obj.hasOwnProperty(key)) {
                        result[key] = obj[key];
                    }
                }
            }
        }

        return result;

    }

    /***
     * creates a new XMLHTTPREQUEST object in all browsers
     *
     * @returns {*}
     */
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


    /***
     * performs an ajax request
     *
     * @param {String} url - the url for the request
     * @param {Object} [options]
     * @param {String} [options.type=GET] - the type of the request
     * @param {String} [options.contentType=application/x-www-form-urlencoded] - content type used for the request
     * @param {Boolean} [options.async=true] - indicates if requests are performed in an asynchronous way
     * @param {Object} [options.headers] - additional header requests
     * @param {String|FormData} [options.data] - data send with this ajax request
     * @param {Object} [options.queryParameter] - an object with query params to send
     *
     * @param {Function} [callback] - callback function(err, result)
     * @returns {*}
     */
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
            var queryString = createQueryString(s.queryParameter);

            if (queryString) {
                s.url += (/\?/.test(s.url) ? "&" : "?") + queryString;
            }
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

})(window);