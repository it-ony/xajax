xajax
=====

The same-origin-policies in browsers secure our daily usage of web pages. Without them *session* could be highjacked easily or personal data stolen without your notice.

To make hosted services more accessible and extendable companies are providing REST API's. Accessing these interfaces from a browser application that is delivered by a different origin {protocol, port, hostname} cannot be accessed directly - but with the following mechanisms.

* JSONP 
* ReverseProxy 
* CORS Requests
* cross-document messaging 

**JSONP** works because the `script` tag does not respect the same-origin-policy. But it just works for data retrieval (GET) so that you cannot use a REST service completely.

**ReverseProxy** is an easy to set-up method to redirect all API request via the own hosting server to the server of the API hosted under a different origin. The smaller problem is that the server or load balancer needs to be configured. Much larger is the pain that every request is routed through your server. A direct communication between the client and the API server makes sense.

A mixture of **JSONP** for all read only request and **ReverseProxy** could work if no cookies are involved.

**CORS** - Cross-origin resource sharing, is the answer from the w3c and works with most of [todays browsers](http://caniuse.com/cors). In several cases a second request (preflight) is made under the hood of the XMLHttpRequest to grant the request from the server side.

**cross-domain messaging** is a technic that allows most of [todays browsers](http://caniuse.com/x-doc-messaging) to send messages between windows regardless their origin. The security is ensured by checking the origin in the javascript code of the windows that registers for the `receiveMessage` event.

To sum up CORS is the standardized way, but needs some additional server side implementation. If you have an existing API without CORS support, but want to make it available without that people have to use *JSONP* or a *ReverseProxy* than *cross-domain messaging* could be a good way. **XAJAX** will help you!

How to use xajax
----------------

To use xajax, you as origin owner of the API resource must deliver some endpoint html file. The endpoint encapsulates the hole cross-domain messaging and performs the ajax requests. The result is delivered by the endpoint via `postMessage` to the requesting client.

```html
<!doctype html>
<html lang="en-US">
<head>
    <meta charset="UTF-8"/>
    <script type="text/javascript" src="server.js"></script>
</head>
<body>

<script type="text/javascript">

    XAJAX.createServer({
        allowedOrigins: [
            // use "*" for allow all origins
        ],

        allowedRequests: [
            /*
            *  a RegExp or String that guard the access for ajax requests e.g.
            *  /^\/api/ - to allow all /api* calls
            * */
        ]
    });

</script>
</body>
</html>
```

The allowedOrigins is an array of strings that you will allow to access. The allow requests parameter is an array of either strings or regular expressions that are used to grant access to perform a specify request. To allow the xajax client to access all */api* resources the RegExp `/^\/api/` is used. This prevents the access from resources like the `/index.html` where e.g. the user name or id could be read from.

**Allow as few as possible resources and origins**

In addition to the arrays you can also provide the following two methods for a more advanced filtering of origins and allowed requests.

```js

/***
 * guard access to the origin
 *
 * @param {String} origin - the origin the request came from
 * @returns {boolean} - true if the access is granted
 */
allowOrigin: function (origin) {
}

/***
 * guard access for ajax requests
 *
 * @param {String} url
 * @returns {boolean} - true if the request is allowed
 */
allowRequest: function (url) {
}
```

The client
--------------

The client relies on the `client.js` file. After the javascript file has been loaded the `XAJAX` object is available which allows the creation of a new client.

```js
var myClient = XAJAX.create("http://external-server.tld/xajax-server.html", function (err) {
    // optional callback function, invoked after the client has initialized completely
});
```

Even if the client hasn't been initialized completely, it's possible to perform ajax requests yet. All requests will be queued until the initialization has been completed.

```js
myClient.ajax("/url", {
    type: "POST",               //  optional, default GET
    //contentType:                  default: "application/x-www-form-urlencoded"
    // async: true                  default: true, leaf it this way!!
    headers: {
        // headers to be sent
    },
    queryParameter: {
        mediaType: "json"
        // some other parameter
    },
    data: '{"foo": "bar"}'
}, function (err, result) {
    console.log("Ajax returned", err, result);
});
``` 

The result of the callback is an object with the following format.

```js
headers: {
    // an object of all headers returned
},
response: "",     // the response text of the request,
status: 200,      // the status code
statusText: "OK"  // and the status text
```

No responseXML will be available, because just JSON objects and for IE <= 9 just strings can be send between two windows. Use `(new DOMParser()).parseFromString(result.response)` if you need an responseXML.

MIT License
-----------

Copyright (c) 2013 Tony Findeisen

Permission is hereby granted, free of charge, to any person obtaining a copy of
this software and associated documentation files (the "Software"), to deal in
the Software without restriction, including without limitation the rights to
use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
the Software, and to permit persons to whom the Software is furnished to do so,
subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.


