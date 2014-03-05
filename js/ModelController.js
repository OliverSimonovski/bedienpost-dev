
var conn;
var model;
var inAttTransfer = false;
var me = null;
var USERNAME = SERVER = PASS = null;

var phoneIp = "";
var phoneUser = "";
var phonePass = "";

var restUrl = "";

var userIdToUserObservable = [];
var queueIdToQueueObservable = [];

$(document).ready(function () {

    // Auto-login if auto-login information provided.
    var urlvars = getUrlVars();
    if (urlvars["login"])   {
        login(urlvars.login, urlvars.pass);
        return;
    }

    var loginInfo = localStorage.getItem("loginInfo");
    if (loginInfo) loginInfo = JSON.parse(loginInfo);
    if ((loginInfo != null) && loginInfo.loggedIn) {
        console.log("Was previously logged in. Automatically logging in as " + loginInfo.username + "@" + loginInfo.server);
        login(loginInfo.username, loginInfo.password, loginInfo.server);
    }    
});

function login(login, password, server) {

    var loginSplit = login.split("@");
    USERNAME = loginSplit[0];
    SERVER = loginSplit[1];
    SERVER = SERVER || server;
    SERVER = SERVER || "uc.pbx.speakup-telecom.com";
    PASS = password;

    listingViewModel.loginName(USERNAME);
    listingViewModel.loginServer(SERVER);

    listingViewModel.authError(false);

    conn = new Lisa.Connection();
    conn.log_xmpp = true; // Development

    // Connect over SSL
    conn.bosh_port = 7500;
    conn.use_ssl = true;
    // HACK for VTEL server
    if (SERVER == "uc.vhosted.vtel.nl") {
        conn.bosh_port = 7509;        
    }

    // Setup logging and status messages.
    conn.logging.setCallback(function(msg) {
        console.log(msg);
    });

    // Setup connection-status callback.
    conn.connectionStatusObservable.addObserver(connectionStatusCallback);

    // Debugging
    conn._hitError = function (reqStatus) {
        console.log("Error occured: " + reqStatus);
    }

    // Setup callback when receiving the company model
    conn.getModel().done(gotModel);

    conn.connect(SERVER, USERNAME, PASS);                 // HTTP - For development
    //connectWithGiveSession(SERVER, USERNAME, PASS);     // HTTPS
    
    getPhoneAuth(USERNAME,SERVER,PASS);
}

// Get configuration for the phone from the server.
function getPhoneAuth(user, server, pass) {
    
    var rawAuth = user+":"+server+":"+pass;
    var auth = MD5.hexdigest(rawAuth);
    //console.log("raw auth: " + rawAuth); 
    //console.log("auth:" + auth );

    var postObj = {};
    postObj.username = user;
    postObj.server = server;
    postObj.auth = auth;

    $.ajax
      ({
        type: "POST",
        url: "https://www.bedienpost.nl/getPhoneAuth.php",
        dataType: 'json',
        data: postObj,
        success: function (response){
            //console.log(response);
            var responseObj = response;
            phoneIp = responseObj.phoneIp;
            phoneUser = responseObj.phoneUser;
            phonePass = responseObj.phonePass;
            console.log("Configured authentication information for phone on " + phoneIp);
            if (navigator.userAgent.indexOf("Chrome") != -1) {
                chromeLoginPhone();
            }
        }, 
        error: function (response) {
            console.log("User not authorized for SNOM control.")
        }
    });    
}

// Bit of a hack to allow Chrome to logon to the phone automatically.
function chromeLoginPhone() {
    var iframe = document.createElement("IFRAME");
    $(iframe).hide();
    iframe.setAttribute("src", "http://"+phoneUser+":"+phonePass+"@" + phoneIp);
    document.documentElement.appendChild(iframe);
    _.delay( function() {
        iframe.parentNode.removeChild(iframe);
    }, 5000);
}

function connectionStatusCallback(status) {
    console.log(status);
    if (status == Strophe.Status.CONNFAIL) {
    } else if (status == Strophe.Status.DISCONNECTED) {
    } else if (status == Strophe.Status.AUTHFAIL) {
        listingViewModel.authError(true);
        alert("Authentication failed. Please re-enter your username and password and try again.");
    }
}

function logout() {
        $('#loginModal').modal({
            keyboard: true
    })
    var loginInfo = {};
    loginInfo.loggedIn = false;
    localStorage.setItem("loginInfo", JSON.stringify(loginInfo));  
    conn.disconnect();  
}

function gotModel(newmodel) {
    // Show interface
    var loginInfo = {};
    loginInfo.loggedIn = true;
    loginInfo.username = USERNAME;
    loginInfo.password = PASS;
    loginInfo.server = SERVER;
    localStorage.setItem("loginInfo", JSON.stringify(loginInfo));

    
    model = newmodel;
    me = model.users[Lisa.Connection.myUserId];
    refreshModel(model);
    
    // Listen for added or removed users or queues, which requires to redraw the whole structure.
    model.userListObservable.addObserver(refreshModel);
    model.queueListObservable.addObserver(refreshModel);

    // Hacky
    $('#loginModal').modal('hide');
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

    callInfo.description = (callInfo.name != "...") ? callInfo.name : callInfo.number;
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
        userObj.startCall(callInfo.number, callInfo.name, callInfo.startTime);

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
    if (user.id == Lisa.Connection.myUserId) {
        incomingCallEntries.removeAll();
        var amInCall = false;
        for (key in user.calls) {
            amInCall = true;
            var call = user.calls[key];
            var callInfo = getCallInfo(call, user);

            var callObj = new CallListItem(call.id, callInfo.description, callInfo.startTime, callInfo.directionIsOut);
            incomingCallEntries.push(callObj);
        }
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
