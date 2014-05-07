(function() {

    /*
     * Attach library under DnsResolv global.
     * Can be accessed as 'lib' within the library
     */
    var root = this;
    var lib = root.DnsResolv = {};
    lib.resolvers = Array();

    var resolversSorted = false;

    /*
     * Debugging
     */
    lib.debug = true;
    lib.log = function(log) {console.log(log)};

    /*
     * Generic Library response object
     */
    lib.LibResponse = function(request, responses, serviceName) {
        this.request = request;
        this.responses = responses;
        this.serviceName = serviceName;
    }

    /*
     * DNS response object
     */
    lib.Response = function(rdata, name, ttl) {
        this.ttl = ttl || 0;
        this.rdata = rdata || "";
        this.name = name || "";
    }

    /*
     * DNS request object
     */
    function Request(name, type) {
        if ((name == null) || (name == "")) {
            throw "Empty request";
        }

        this.name = name;
        this.type = type;
    }

    /*
     * Resolve a domain-name of a certain type.
     */
    lib.resolve = function (name, type) {
        if (!resolversSorted) {
            resolversSorted = true;
            lib.resolvers = _.sortBy(lib.resolvers, "PRIORITY");
        }

        var result = jQuery.Deferred();
        var request = new Request(name, type)

        var resolver = lib.resolvers[0];
        var resolverResult = resolver.resolve(request);

        resolverResult.then(result.resolve, result.reject);

        if (lib.debug) {
            result.done(function (answer) {
                console.log("Received answer from resolver:");
                console.log(answer);
            });
            result.fail(function(error) {
                console.log("Received error from resolver:");
                console.log(error);
            });
        }

        return result;
    }

    /*
     * Utility-functions to use by the resolvers:
     */


}).call(this);