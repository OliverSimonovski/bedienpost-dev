(function() {

    /*
     * Attach library under 'remoteStorage' global.
     * Can be accessed as 'lib' within the library
     */
    var root = this;
    var lib = root.remoteStorage = {};

    /* username defaults to global USERNAME, company defaults to empty ("") */
    function initPostObj(username, company) {
        var postObj = {};
        postObj.username = (username == "") ? "" : username || USERNAME; // if username is empty, keep it empty.
        postObj.server = DOMAIN;
        postObj.company = company || "";
        postObj.auth = btoa(USERNAME + ":" + PASS);
        return postObj;
    }

    lib.setItem = function (key, value, username, company) {
        var result = jQuery.Deferred();

        var postObj = initPostObj(username, company);
        postObj.method = "setItem";
        postObj.key = key;
        postObj.data = value;

        $.ajax
        ({
            type: "POST",
            url: "https://www.bedienpost.nl/remoteStorage_v2.php",
            dataType: 'json',
            data: postObj,
            success: function (response){
                result.resolve();
            },
            error: function (response) {
                result.reject();
                console.log("Error remoteStorage setItem for key: " + key + " username: " + USERNAME + " server: " + DOMAIN);
                console.log(JSON.stringify(response));
            }
        });

        return result;
    }

    lib.getItem = function(key, username, company) {
        var result = jQuery.Deferred();

        var postObj = initPostObj(username, company);
        postObj.method = "getItem";
        postObj.key = key;

        $.ajax
        ({
            type: "POST",   // Actually, refactoring this to use a GET is a bit nicer
            url: "https://www.bedienpost.nl/remoteStorage_v2.php",
            dataType: 'json',
            data: postObj,
            success: function (response){
                //console.log("getItem result: "+ JSON.stringify(response));
                result.resolve(response);
            },
            error: function (response) {
                console.log("Error remoteStorage getItem for key: " + key + " username: " + USERNAME + " server: " + DOMAIN);
                //console.log(JSON.stringify(response));
            }
        });

        return result;
    }

}).call(this);