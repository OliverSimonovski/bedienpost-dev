(function() {

    /*
     * Attach library under 'remoteStorage' global.
     * Can be accessed as 'lib' within the library
     */
    var root = this;
    var lib = root.remoteStorage = {};

    function initPostObj() {
        var postObj = {};
        postObj.username = USERNAME;
        postObj.server = DOMAIN;
        postObj.auth = btoa(USERNAME + ":" + PASS)
        return postObj;
    }

    lib.setItem = function (key, value) {
        var result = jQuery.Deferred();

        var postObj = initPostObj();
        postObj.method = "setItem";
        postObj.key = key;
        postObj.data = value;

        $.ajax
        ({
            type: "POST",
            url: "https://www.bedienpost.nl/remoteStorage.php",
            dataType: 'json',
            data: postObj,
            success: function (response){
                result.resolve();
            },
            error: function (response) {
                result.reject();
                console.log("Error remoteStorage setItem for key: " + key);
                console.log(JSON.stringify(response));
            }
        });

        return result;
    }

    lib.getItem = function(key) {
        var result = jQuery.Deferred();

        var postObj = initPostObj();
        postObj.method = "getItem";
        postObj.key = key;

        $.ajax
        ({
            type: "POST",   // Actually, refactoring this to use a GET is a bit nicer
            url: "https://www.bedienpost.nl/remoteStorage.php",
            dataType: 'json',
            data: postObj,
            success: function (response){
                console.log("getItem result: "+ JSON.stringify(response));
                result.resolve(response);
            },
            error: function (response) {
                console.log("Error remoteStorage getItem for key: " + key);
                console.log(JSON.stringify(response));
            }
        });

        return result;
    }

}).call(this);