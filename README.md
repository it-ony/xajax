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
