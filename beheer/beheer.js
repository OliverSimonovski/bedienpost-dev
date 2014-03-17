var BeheerModel = function() {
    var self = this;

    self.phoneIp = ko.observable("");
    self.phoneUser = ko.observable("");
    self.phonePass = ko.observable("");

    self.username = ko.observable("");
    self.server = ko.observable("uc.pbx.speakup-telecom.com");
    self.password = ko.observable("");
    self.company = ko.observable("");

    self.submitSimple = function() {
        var result = checkRestLogin(self.username(), self.server(), self.password());
        result.done(function() {
            self.postSimple();
        });
        result.fail(function(){
            alert("Couldn't authenticate. Username, server, or password incorrect");
        });
    }

    self.submitPhoneAuth = function() {
        self.submitSimple();
    }

    self.postSimple = function() {
        var user = self.username();
        var server = self.server();
        var pass = self.password();
        var rawAuth = user+":"+server+":"+pass;
        var auth = MD5.hexdigest(rawAuth);

        var postObj = {};
        postObj.username = user;
        postObj.server = server;
        postObj.auth = auth;

        $.ajax
        ({
            type: "POST",
            url: "https://www.bedienpost.nl/beheer/setPhoneAuth.php",
            dataType: 'json',
            data: postObj,
            success: function (response){
                alert("Authentication verified. If the credentials for your SNOM phone have been added by an adminsitator," +
                      "you can now use the full functionality of the app.");
            },
            error: function (response) {
                alert("Unable to add authentication information");
            }
        });
    }
}

var beheerModel = new BeheerModel();
ko.applyBindings(beheerModel);


function checkRestLogin(username, server, password) {
    var result = jQuery.Deferred();
    var authHeader = "Basic " + btoa(username + ":" + password);
    var restserver = server.replace("uc.", "rest.");
    var url = "https://" + restserver + "/user";
    $.ajax
    ({
        type: "GET",
        headers: {
            "Authorization": authHeader,
            "X-No-Redirect": true
        },
        url: url,
        dataType: 'json',
        success: function(response) {
            console.log("Authentication succeeded");
            result.resolve();
        },
        error: function() {
            console.log("Authentication failed");
            result.reject();
        }
    });
    return result;
}