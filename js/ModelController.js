
var USERNAME = null;
var JID = null;
var DOMAIN = null;
var CONNECTSERVER = null;
var PASS = null;

var conn;
var model;
var inAttTransfer = false;
var me = null;


var phoneIp = "";
var phoneUser = "";
var phonePass = "";
var loggedIn = false;
var reconnecting = 0;
var serverNotExpected = false;

var restUrl = "";

var userIdToUserObservable = [];
var queueIdToQueueObservable = [];
var callIdToCallObservable = [];

$(document).ready(function () {
    tryAutoLogin();
});

function tryAutoLogin() {
    // Auto-login if auto-login information provided.
    var urlvars = getUrlVars();
    if (urlvars["login"])   {
        login(urlvars.login, urlvars.pass);
        closeLoginModal();
        return;
    }

    var loginInfo = localStorage.getItem("loginInfo");
    if (loginInfo) loginInfo = JSON.parse(loginInfo);
    if ((loginInfo != null) && loginInfo.loggedIn) {
        console.log("Was previously logged in. Automatically logging in as " + loginInfo.username + "@" + loginInfo.server);
        login(loginInfo.username, loginInfo.password, loginInfo.server);
        closeLoginModal();
    }
}

function connectServerFromJidDomain(jidDomain) {
    var deferred = jQuery.Deferred();
    if (jidDomain.indexOf("uc.") == 0) {
        var boshServer = getEnvWithPrefix("bosh", jidDomain);
        deferred.resolve(boshServer, 443);
    } else {
        var srvRequestName = "_xmpp-server._tcp." + jidDomain;
        console.log("Resolving: " + srvRequestName);

        var srvResponse = DnsResolv.resolve(srvRequestName, "SRV");

        srvResponse.done(function(dnsResponse){
            console.log("Got response:");
            console.log(dnsResponse);

            // No SRV record found.
            if (dnsResponse.responses.length == 0) {
                alert("Could not discover connect-server for domain. Are you using the correct JID?")
                deferred.fail("Could not discover connect-server for domain. Are you using the correct JID?");
                return;
            }

            // SRV record found. Let's find the server for the environment.
            var responseString = dnsResponse.responses[0].rdata;
            var responseServer = responseString.split(" ")[3];
            console.log("Found XMPP server: " + responseServer);

            // Some string replacement to find the BOSH server
            var boshServer = getEnvWithPrefix("bosh", responseServer);
            console.log("Found BOSH server: " + boshServer);
            deferred.resolve(boshServer, 443);
        });


    }
    return deferred;
}

function login(login, password, server) {

    var loginSplit = login.split("@");
    DOMAIN = loginSplit[1];
    DOMAIN = DOMAIN || server;
    DOMAIN = DOMAIN || "uc.pbx.speakup-telecom.com";
    PASS = password;

    // For user@domain users, turn the username in a full jid.
    USERNAME = login;

    listingViewModel.loginName(USERNAME);
    listingViewModel.loginServer(DOMAIN);

    var serverDeferred = connectServerFromJidDomain(DOMAIN);
    serverDeferred.done(function(connectserver, connectPort){
        connect(connectserver, connectPort);
    });
}


function connect(connectServer, connectPort) {

    CONNECTSERVER = connectServer;
    connectPort = connectPort || 7500;
    listingViewModel.authError(false);

    if (USERNAME.indexOf("@") != -1) {
        JID = USERNAME;
    } else {
        JID = USERNAME + "@" + DOMAIN;
    }

    conn = new Lisa.Connection();
    conn.log_xmpp = false;

    // Connect over SSL
    conn.bosh_port = connectPort;
    conn.use_ssl = true;

    // Setup logging and status messages.
    conn.logging.setCallback(function(msg) {
        console.log(msg);
        if ((serverNotExpected == false) &&
            (msg.indexOf("request") != -1) &&
            (msg.indexOf("error") != -1) &&
            (msg.indexOf("happened") != -1)) {
            alert("Server not responding as expected. Please check the server and try again. " +
                "Is your internet connection working?");
            serverNotExpected = true;
        }
    });

    // Setup connection-status callback.
    conn.connectionStatusObservable.addObserver(connectionStatusCallback);

    // Debugging
    conn._hitError = function (reqStatus) {
        console.log("Error occured: " + reqStatus);
    }

    // Setup callback when receiving the company model
    conn.getModel().done(gotModel);

    console.log("Connecting to: " + CONNECTSERVER + " " + JID + " " + PASS);
    conn.connect(CONNECTSERVER, JID, PASS);
    
    getPhoneAuth(USERNAME, DOMAIN, PASS);
    listingViewModel.numericInput("");
}

// Get configuration for the phone from the server.
function getPhoneAuth(user, server, pass) {

    var postObj = {};
    postObj.username = user;
    postObj.server = server;
    postObj.auth = btoa(user + ":" + pass)

    console.log("Retrieving phone auth for: " + user + " " + server);

    $.ajax
      ({
        type: "POST",
        url: "https://www.bedienpost.nl/retrievePhoneAuth.php",
        dataType: 'json',
        data: postObj,
        success: function (response){
            //console.log(response);
            var responseObj = response;
            phoneIp = responseObj.phoneIp;
            phoneUser = responseObj.phoneUser;
            phonePass = responseObj.phonePass;
            console.log("Configured authentication information for phone on " + phoneIp);
            console.log(navigator.userAgent);
            if (navigator.userAgent.indexOf("Chrome") != -1) {
                chromeLoginPhone();
            }

            // Check whether the phone is reachable.
            listingViewModel.connectedPhone(false);
            checkSnomConnected();
            setInterval(checkSnomConnected, 300000); // re-check every five minutes.
        }, 
        error: function (response) {
            console.log("User not authorized for SNOM control.")
        }
    });    
}

// Bit of a hack to allow Chrome to logon to the phone automatically.
function chromeLoginPhone() {
    console.log("ChromeLogin");
    var iframe = document.createElement("IFRAME");
    $(iframe).hide();
    iframe.setAttribute("src", "http://"+phoneUser+":"+phonePass+"@" + phoneIp);
    document.documentElement.appendChild(iframe);
    _.delay( function() {
        iframe.parentNode.removeChild(iframe);
    }, 5000);
}

function checkSnomConnected() {
    var url = "http://" + phoneIp + "/img/snom_logo.png?randomToPreventCaching=" + Math.random();
    var logoImage = new Image();

    logoImage.onload = function() {
        listingViewModel.connectedPhone((this.width > 0) && (this.height > 0));
    };
    logoImage.onerror = function() {
        listingViewModel.connectedPhone(false);
    };
    logoImage.src = url;

}

function connectionStatusCallback(status) {
    if (status == Strophe.Status.CONNFAIL) {
    } else if (status == Strophe.Status.DISCONNECTED) {
        // Reconnect
        if (loggedIn) {
            console.log("Connection lost, reconnecting...");
            reconnecting += 1;
            tryAutoLogin();
        }
    } else if (status == Strophe.Status.AUTHFAIL) {
        if ((reconnecting == 0) || (reconnecting > 10)) {
            listingViewModel.authError(true);
            alert("Authentication failed. Please re-enter your username and password and try again.");
        } else {
            reconnecting += 1;
            tryAutoLogin();
        }
    }
}

function logout() {
    // Show the login modal
    $('#loginModal').modal({
            keyboard: true
    })
    listingViewModel.loginPass("");
    loggedIn = false;

    // Remove the between-session login information.
    var loginInfo = {};
    loginInfo.loggedIn = false;
    localStorage.setItem("loginInfo", JSON.stringify(loginInfo));  

    // Actual disconnect
    conn.disconnect();

    // Empty on-screen lists.
    userListEntries.removeAll();
    queueListEntries.removeAll();
    incomingCallEntries.removeAll();

}

function gotModel(newmodel) {
    // Show interface
    loggedIn = true;
    reconnecting = 0;
    serverNotExpected = false;
    var loginInfo = {};
    loginInfo.loggedIn = true;
    loginInfo.username = USERNAME;
    loginInfo.password = PASS;
    loginInfo.server = DOMAIN;
    localStorage.setItem("loginInfo", JSON.stringify(loginInfo));

    
    model = newmodel;
    me = model.users[Lisa.Connection.myUserId];
    refreshModel(model);
    
    // Listen for added or removed users or queues, which requires to redraw the whole structure.
    model.userListObservable.addObserver(refreshModel);
    model.queueListObservable.addObserver(refreshModel);

   closeLoginModal();
}

function closeLoginModal() {
    // Hacky
    $('#loginModal').modal('hide');
    $("#inputField").focus();
}

function getCallInfo(call, user) {
    callInfo = {};

    if ((call.sourceUser) && (call.sourceUser == user)) {
            // Outgoing call
            callInfo.directionIsOut = true;
            if (call.destinationUser) {
                callInfo.number = call.destinationUser.extension;
                callInfo.name = call.destinationUser.name;
            } else {
                callInfo.name = "...";
                callInfo.number = call.destination.find('number').text();// + " - [" + timeString + "]";
            }
        } else {
            // Incoming call
            callInfo.directionIsOut = false;
            if (call.sourceUser) {
                callInfo.number = call.sourceUser.extension;
                callInfo.name = call.sourceUser.name;
            } else {
                callInfo.name = "...";
                callInfo.number = call.source.find('number').text();// + " - [" + timeString + "]";
            }
        }

    callInfo.description = (callInfo.name != "...") ? callInfo.name  : callInfo.number;
    callInfo.descriptionWithNumber = (callInfo.name != "...") ? callInfo.name + " (" + callInfo.number + ")" : callInfo.number;
    callInfo.startTime = call.destination.find('timeCreated').text(); // seconds since epoch

    return callInfo;
}

function userToClientModel(user, userObj) {
    var numcalls = _.size(user.calls);
    var userObj = userObj || new UserListItem(+user.id, user.name, user.extension, user.loggedIn, (numcalls == 0));
    userObj.log(user.loggedIn);
    userObj.avail(numcalls == 0);

    
    if (numcalls > 0) {
        var call = user.calls[Object.keys(user.calls)[0]]; // Ugh.
        userObj.ringing((call.state != "ANSWERED"));
        var callInfo = getCallInfo(call, user);
        userObj.startCall(callInfo.number, callInfo.name, callInfo.startTime, callInfo.directionIsOut);

    } else {
         userObj.noCalls();
    }
    
    return userObj;
}


function queueToClientModel(queue, queueObj) {
    queueObj = queueObj || new QueueListItem(queue.id, queue.name);
    queueObj.signInOut(queue.users[Lisa.Connection.myUserId] != null);
    queueObj.waitingAmount(_.size(queue.calls));

    return queueObj;
}

function refreshModel(model) {
    console.log("Refreshing interface.")
    
    // Add users to interface.
    userListEntries.removeAll();
    for (var userId in model.users) {

        var user = model.users[userId];
        addUser(user);
    }

    // Process queues
    queueListEntries.removeAll();
    for (var queueId in model.queues) {

        var queue = model.queues[queueId];
        addQueue(queue);
    }
}


/* Add / Update page for users */
function addUser(user) {
    console.log("Adding user " + user);
    if (user.name == "") {
        console.log("User has no name, not adding");
        return;
    }

    user.observable.addObserver(updateUser);

    var userObj = updateUser(user);

    userListEntries.push(userObj);
    userIdToUserObservable[user.id] = userObj;
    
}

// Make-up the user entry.
function updateUser(user) {
    console.log("Updating user " + user);
    var userObj = userIdToUserObservable[user.id];
    userObj = userToClientModel(user, userObj);

    // The user is us
    var newIncomingCallEntries = [];
    if (user.id == Lisa.Connection.myUserId) {
        //incomingCallEntries.removeAll();
        var amInCall = false;
        for (key in user.calls) {
            amInCall = true;
            var call = user.calls[key];

            var callInfo = getCallInfo(call, user);
            var callObj = new CallListItem(call.id, callInfo.description, callInfo.startTime, callInfo.directionIsOut, callInfo.descriptionWithNumber);
            newIncomingCallEntries.push(callObj);
        }
        mergeCallEntriesList(newIncomingCallEntries);

        if (amInCall) {
            if (listingViewModel.callingState() != "transfer") { // If we're transfering, remain in that state.
                listingViewModel.callingState(userObj.ringing() ? "ringing" : "calling");
            }
            listingViewModel.showButton();
        } else {
            listingViewModel.callingState("onhook");
            listingViewModel.hideButton();
        }
    }

    return userObj;
}

function idEqual(a,b) {
    if (a != b) {
        return a.id === b.id;
    }
    return true;
}

_.intersectOnId = function(array) {
    var slice = Array.prototype.slice; // added this line as a utility
    var rest = slice.call(arguments, 1);
    return _.filter(_.uniq(array), function(item) {
      return _.every(rest, function(other) {
        //return _.indexOf(other, item) >= 0;
        return _.any(other, function(element) { return idEqual(element, item); });
      });
    });
  };

function mergeCallEntriesList(newEntries) {
    // Handle deletion of calls that aren't running anymore.
    for (key in incomingCallEntries()) {
        var oldEntry = incomingCallEntries()[key];

        // Determine for each call whether it still exists.
        var stillExists = false;
        for (newEntryKey in newEntries) {
            var newEntry = newEntries[newEntryKey];
            if (newEntry.id() == oldEntry.id()) {
                stillExists = true;
                continue;
            }
        }

        if (!stillExists) {
            console.log ("Call involving " + oldEntry.name() + " with id " + oldEntry.id() + " Doesn't exist anymore. Deleting.");
            //incomingCallEntries.remove(oldEntry);
            oldEntry.stopCall();
            delete callIdToCallObservable[oldEntry.id];
        }
    }

    // Add and update all currently running calls.
    for (newEntryKey in newEntries) {
        var newEntry = newEntries[newEntryKey];
        var oldEntry = callIdToCallObservable[newEntry.id()];
        if (oldEntry) {
            console.log("Merging new call info from call: " + newEntry.id() );
            oldEntry.name(newEntry.name());
            oldEntry.callStartTime(newEntry.callStartTime());
            oldEntry.directionIsOut(newEntry.directionIsOut());
            oldEntry.descriptionWithNumber(newEntry.descriptionWithNumber());
            oldEntry.finished(false);
        } else {
            console.log("Adding call " + newEntry.id() );
            callIdToCallObservable[newEntry.id()] = newEntry;
            incomingCallEntries.push(newEntry);    
        }
    }
}

function addQueue(queue) {
    console.log("Adding queue " + queue);
    queue.observable.addObserver(updateQueue);

    var queueObj = updateQueue(queue);

    queueListEntries.push(queueObj);
    queueIdToQueueObservable[queue.id] = queueObj;
}

function updateQueue(queue) {
    console.log("Updating queue " + queue);
    var queueObj = queueIdToQueueObservable[queue.id];
    queueObj = queueToClientModel(queue, queueObj);

    return queueObj;
}

/*** Phone commands ***/

function callUser(number) {
    if (phoneIp == "") {
        return;
    }

    var url = "TRANSFER;";
    var extension = number;
    for ( var i = 0; i < extension.length; i++ ) {
        url += extension.charAt(i) + ";";
    }
    url += "ENTER";
    phoneCommand(url);   
}

function transferToUser(number) {
     if (phoneIp == "") {
        return;
    }

    var url = "TRANSFER;";

    var extension = number;
    for ( var i = 0; i < extension.length; i++ ) {
        url += extension.charAt(i) + ";";
    }
    url += "ENTER";

    phoneCommand(url);
}

function attendedtransferToUser(number) {
     if (phoneIp == "") {
        return;
    }

    inAttTransfer = true;
    //updateUser(me); // Update the user gui

    phoneCommand("F_HOLD");

    _.delay(function() {
       
        var url = "";
        var extension = number;
        for ( var i = 0; i < extension.length; i++ ) {
            url += extension.charAt(i) + ";";
        }
        url += "ENTER";

        phoneCommand(url);
    }, 1000);
}

function finishAttendedTransfer() {
    phoneCommand("TRANSFER");    
}

function cancelAttendedTransfer() {
    phoneCommand("CANCEL");
    _.delay(function() {
        phoneCommand("ENTER");
    }, 500);
}

function pickupPhone() {
    phoneCommand("ENTER");
}

function hangupPhone() {
    phoneCommand("CANCEL");
}

/* Add / Update the page-elements for calls */

// Support functions
function getUrlVars() {
    var vars = {};
    var parts = window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(m,key,value) {
        vars[key] = value;
    });
    return vars;
}


/** Phone handling **/
function openUrl(url) {
    console.log(url);
    (new Image()).src = url;
}

function phoneCommand(cmdString) {
    var url = "http://"+phoneUser+":"+phonePass+"@" + phoneIp + "/command.htm?key=" + cmdString;
    openUrl(url);    
}
