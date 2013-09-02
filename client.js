var XAJAX;

(function (window, document) {

    var serverCache = {};

    XAJAX = function (serverUrl, callback) {

        var initializationDelay = 1000,
            queue = [],
        // if the iFrame has been initialized
            initialized = false,
        // true, if we can communicate with the iFrame
            loaded = false,
            checkInitializedTimer = null,
            iFrame = null,
            publicMethods,
            messageCount = 0,

        // stores all sent messages, identified by the messageId
            messages = {};

        if (window.addEventListener) {
            addEventListener("message", receiveMessage, false);
        } else {
            attachEvent("onmessage", receiveMessage);
        }

        function receiveMessage(event) {

            if (serverUrl.indexOf(event.origin) !== 0) {
                return;
            }

            if (event.data === "initialized") {
                if (initialized) {
                    return;
                }

                checkInitializedTimer && clearTimeout(checkInitializedTimer);

                initialized = true;
                loaded = true;

                callback && callback(null, publicMethods);

                // progress queue
                for (var i = 0; i < queue.length; i++) {
                    var request = queue[i];
                    publicMethods.ajax(request.url, request.options, request.callback);
                }

                queue = [];
            } else if (initialized) {

                var eventData = JSON.parse(event.data),
                    messageId = eventData.messageId,
                    messageObject = messages[messageId];

                if (messageObject && messageObject.callback) {
                    messageObject.callback(eventData.error, eventData.data);
                }

                delete messages[messageId];
            }
        }

        initializeIFrame();

        function initializeIFrame() {

            iFrame = document.createElement("iframe");
            iFrame.onload = function () {

                if (!initialized) {
                    checkInitializedTimer = setTimeout(function () {
                        initialized = true;
                        callback(new Error("Initialisation failed"), publicMethods);
                    }, initializationDelay);
                }

            };

            iFrame.src = serverUrl;
            iFrame.style.visibility = "hidden";
            iFrame.style.display = "none";

            //noinspection XHTMLIncompatabilitiesJS
            var body = document.body || document.getElementsByTagName("body")[0];

            body.appendChild(iFrame);

        }

        function sendMessage(type, data, callback) {
            messageCount++;

            var message = {
                type: type,
                data: data,
                messageId: messageCount
            };

            messages[messageCount] = {
                message: message,
                callback: callback
            };

            iFrame.contentWindow.postMessage(JSON.stringify(message), serverUrl);
        }

        // Public methods
        publicMethods = {

            /***
             * make cross domain ajax calls
             *
             * @param url - the request url
             * @param [options]
             * @param [callback] - callback function(err, result)
             */
            ajax: function (url, options, callback) {

                if (initialized) {
                    if (loaded) {
                        // perform post message on iFrame window

                        sendMessage("ajax", {
                            url: url,
                            options: options
                        }, callback);

                    } else {
                        callback && callback(new Error("Cannot communicate with iFrame"));
                    }

                } else {
                    // queue it
                    queue.push({
                        url: url,
                        options: options,
                        callback: callback
                    });
                }
            }
        };

        return publicMethods;
    };

    /***
     *
     * @param serverUrl - the url where the receiveMessage proxy lives
     * @param [callback]
     * @returns {XAJAX}
     */
    XAJAX.create = function (serverUrl, callback) {

        var instance;

        if (!serverCache.hasOwnProperty(serverUrl)) {

            instance = new XAJAX(serverUrl, function (err) {

                var cacheEntry = serverCache[serverUrl];

                cacheEntry.initialized = true;
                cacheEntry.initializedError = err;

                // invoke all callbacks
                var callbacks = cacheEntry.callbacks;

                for (var i = 0; i < callbacks.length; i++) {
                    callbacks[i] && callbacks[i](err);
                }
            });

            serverCache[serverUrl] = {
                callbacks: [callback],
                initialized: false,
                initializedError: null,
                instance: instance
            };
        } else {

            var cacheEntry = serverCache[serverUrl];

            if (cacheEntry.initialized) {
                callback && callback(cacheEntry.initializedError);
            } else {
                cacheEntry.callbacks.push(callback);
            }

            instance = cacheEntry.instance;
        }

        return instance;

    }

})(window, document);