/*
 * DnsResolv resolver for http://api.statdns.com
 */

(function() {
    var module = {};
    var lib = DnsResolv;

    module.SERVICENAME = "StatDns";
    module.SUPPORTEDTYPES = ["SRV", "A", "TXT"];

    function checkType(type) {
        if (!_.contains(module.SUPPORTEDTYPES, type)) {
            throw "Invalid or unknown type DNS Request type.";
        }
    }

    module.resolve = function(request) {
        if (!request) throw "Empty Request!";

        checkType(request.type);

        var url = "http://api.statdns.com/" + request.name + "/" + request.type;
        if (DnsResolv.debug) DnsResolv.log("Calling " + url);

        var result = $.Deferred();
        ajaxRequest(url, request, result);
        return result;

    }

    function ajaxRequest(url, request, result) {
        $.ajax
        ({
            type: "GET",
            url: url,
            timeout: 10000,
            dataType: 'jsonp',
            success: function(respObj) {
                if (DnsResolv.debug) {
                    DnsResolv.log("Got response:");
                    DnsResolv.log(respObj);
                }
                var responseArray = handleResponse(respObj, result);
                var responseObject = new lib.LibResponse(request,responseArray, module.SERVICENAME);
                result.resolve(responseObject);
            },
            error: function(respObj, textStatus) {
                result.reject("Request failed: " + textStatus);
            }
        });
    }

    function handleResponse(respObj, result) {
        var responseArr = Array();
        for (var key in respObj.answer) {
            var answer = respObj.answer[key];
            var libResponseObj = new lib.Response(answer.rdata, answer.name, answer.ttl);
            responseArr.push(libResponseObj);
        }
        return responseArr;
    }

    DnsResolv.resolvers.push(module);
}).call(this);
