var XAJAX;

(function(window, document, undefined) {

    var serverCache = {};

    XAJAX = function(serverUrl, callback) {

        var initializationDelay = 1000,
            ajaxQueue = [],
            loaded = false,
            initialized = false,
            checkInitializedTimer = null,
            iFrame = null,
            publicMethods;

        if (window.addEventListener) {
            addEventListener("message", receiveMessage, false);
        } else {
            attachEvent("onmessage", receiveMessage);
        }

        function receiveMessage(event) {

            if (event.origin !== serverUrl) {
                return;
            }

            if (event.data === "initialized") {
                if (initialized) {
                    return;
                }

                checkInitializedTimer && clearTimeout(checkInitializedTimer);
                initialized = true;

                callback && callback(null, publicMethods);

                // progress queue
                for (var i = 0; i < ajaxQueue.length; i++) {
                    var request = ajaxQueue[i];
                    publicMethods.ajax(request.url, request.options, request.callback);
                }

                ajaxQueue = [];
            } else {
                // TODO: handle ajax request
            }

            console.log("Receive message in client", event);
        }

        initializeIFrame();

        function initializeIFrame() {

            iFrame = document.createElement("iframe");
            iFrame.onload = function() {

                if (!initialized) {
                    checkInitializedTimer = setTimeout(function() {
                        // TODO: init failed
                        initialized = true;
                        callback(new Error("Initialisation failed"), publicMethods);
                    }, initializationDelay);
                }

            };

            iFrame.src = serverUrl;
            // TODO: remove comments
//            iframe.style.visibility = "hidden";
//            iframe.style.display = "none";
//

            //noinspection XHTMLIncompatabilitiesJS
            var body = document.body || document.getElementsByTagName("body")[0];

            body.appendChild(iFrame);

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

                if (loaded) {
                    // perform post message on iFrame window
                } else {
                    // queue it
                    ajaxQueue.push({
                        url: url,
                        options: options,
                        callback: callback
                    });
                }
            }
        };

        return publicMethods;

        // TODO: create iframe
        // TODO: cache ajax queue
        // TODO: ...
    };

    /***
     *
     * @param serverUrl - the url where the receiveMessage proxy lives
     * @param [callback]
     * @returns {XAJAX}
     */
    XAJAX.create = function(serverUrl, callback) {

        if (!serverCache.hasOwnProperty(serverUrl)) {
            serverCache[serverUrl] = new XAJAX(serverUrl, callback);
        }

        return serverCache[serverUrl];
    }

})(window, document);