
var LOGINDATA = {};
var USERNAME = null;
var JID = null;
var DOMAIN = null;
var CONNECTSERVER = null;
var PASS = null;
var COMPANYNAME = null;
var COMPANYID = null;

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
var userPhoneNumberToUserObservable = [];
var pendingAttendedTransfer = null;

var currentServerObfuscateNumberSetting = true;
var currentServerConnectSnomSetting = false;
var retrievedUserNoteModel = false;

var userNoteModel = {}; // userId : note.
var queuePause = null;


$(document).ready(function () {
    tryAutoLogin();
});

function init() {
    LOGINDATA = {};
    USERNAME = null;
    JID = null;
    DOMAIN = null;
    CONNECTSERVER = null;
    PASS = null;
    COMPANYNAME = null;
    COMPANYID = null;
    conn = null;
    model = null;
    inAttTransfer = false;
    me = null;
    phoneIp = "";
    phoneUser = "";
    phonePass = "";
    loggedIn = false;
    reconnecting = 0;
    serverNotExpected = false;
    restUrl = "";
    userIdToUserObservable = [];
    queueIdToQueueObservable = [];
    callIdToCallObservable = [];
    userPhoneNumberToUserObservable = [];
    pendingAttendedTransfer = null;
    currentServerObfuscateNumberSetting = true;
    currentServerConnectSnomSetting = false;
    retrievedUserNoteModel = false;
    userNoteModel = {};
}

function tryAutoLogin() {
    init();

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

function login(login, password, server) {

    PASS = password;

    var parseLoginDeferred = ResolveServer.parseLogin(login);
    parseLoginDeferred.done(function(parsedLogin) {

        //console.log(parsedLogin);
        LOGINDATA = parsedLogin;
        USERNAME = parsedLogin.username;
        DOMAIN = parsedLogin.domain;

        conn = new Lisa.Connection();

        // Setup connection-status callback.
        conn.connectionStatusObservable.addObserver(connectionStatusCallback);
        connect(parsedLogin.bosh_server);
        listingViewModel.numericInput("");
    });
}


function connect(connectServer, connectPort) {

    CONNECTSERVER = connectServer;
    connectPort = connectPort || 443;
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
            $("#loginSubmitBtn").prop("disabled",false); // FIXME: Not in the model!
            serverNotExpected = true;
        }
    });

    // Setup connection-status callback.
    conn.connectionStatusObservable.addObserver(connectionStatusCallback);

    // Debugging
    conn._hitError = function (reqStatus) {
        console.log("Error occured: " + reqStatus);
    }

    // Setup callback for various pieces needed information
    conn.getCompanyId().done(function(companyId){
        COMPANYID = companyId;
        getContactListData(USERNAME, DOMAIN, PASS, COMPANYID);
    });
    conn.getCompanyName().done(function(companyName){
        COMPANYNAME = companyName;
    });

    // Setup callback when receiving the company model
    conn.getModel().done(gotModel);

    console.log("Connecting to: " + LOGINDATA.bosh_server + " " + LOGINDATA.jid);

    conn.connect(LOGINDATA.bosh_server, LOGINDATA.jid, PASS);

    listingViewModel.numericInput("");
}

/*
 * At first, try to get the phone-auth information from Compass.
 */
function getPhoneAuth(user, server, pass) {
    // Try to retieve auth-information from Compass
    getPhoneAuthFromCompass(user, server, pass);
}

function getPhoneAuthFromCompass(user, server, pass) {
    // Get the company.
    var getCompany = function() {

        var restCompanyUrl = "https://" + Lisa.Connection.restServer + "/company";
        // Retrieve company-info to retrieve company shortname which is used as phone username
        var companyReceived = function(response) {
            //console.log(response);
            phoneUser = response.shortname;
        }

        $.ajax
        ({
            type: "GET",
            headers: {
                "Authorization": Lisa.Connection.restAuthHeader,
                "X-No-Redirect": true
            },
            url: restCompanyUrl,
            success: companyReceived
        });
    }

    var getPhoneConnectionEnabledForUser = function() {
    // Get phone-auth to see whether phone-connection is enabled for this user.
        var phoneAuthReceived = function(response) {
            if (response.phoneIp == "auto") {
                currentServerConnectSnomSetting = true;
                listingViewModel.connectSnom(true);
                // next step
                getPhoneStatus();
            } else if (response.phoneIp != null) {
                console.log("Legacy phone-auth data found.");
                // phoneIP is filled out and not 'auto'.
                // This originates from when the compass platform wasn't able to give us phone authentication information by itself.
                // Those deployments don't exist anymore, so let's just retrieve phone-auth from the server anyway.
                currentServerConnectSnomSetting = true;
                listingViewModel.connectSnom(true);
                // next step
                getPhoneStatus();
            } else {
                currentServerConnectSnomSetting = false;
                listingViewModel.connectSnom(false);
            }
        }

        var postObj = {};
        postObj.username = user;
        postObj.server = server;
        postObj.auth = btoa(user + ":" + pass)

        $.ajax
        ({
            type: "POST",
            url: "https://www.bedienpost.nl/retrievePhoneAuth.php",
            dataType: 'json',
            data: postObj,
            success: phoneAuthReceived,
            error: function (response) {
                console.log("User not authorized for SNOM control.")
                phoneIp = "";
                phoneUser = "";
                phonePass = "";
                listingViewModel.phoneIp(phoneIp);
                listingViewModel.connectedPhone(false);
            }
        });
    }

    /* Get the phone-status from the Compass REST URL */
    // TODO; Nested functions in flatter structure.
    var getPhoneStatus = function() {
        // After user-status is received, retrieve the phone-info.
        var statusReceived = function(response) {
            //console.log(response.phone);
            var url = response.phone;
            var phoneUrlReceived = function(response) {
                //console.log(response);
                phonePass = response.resourceId;
                var ip = response.privateIP;
                if (!ip) {
                    ip = response.publicIP;
                }
                if (ip) {
                    phoneIp = ip.split(":")[0];
                }
                //phoneIp = response.pubIP;
                //console.log(response);
                console.log("phone user: " + phoneUser + " pass: " + phonePass + " ip: " + phoneIp);
                if (navigator.userAgent.indexOf("Chrome") != -1) {
                    chromeLoginPhone();
                }

                listingViewModel.phoneIp(phoneIp);
                listingViewModel.connectedPhone(false);
                checkSnomConnected();
                setInterval(checkSnomConnected, 300000); // re-check every five minutes.

            }
            $.ajax
            ({
                type: "GET",
                headers: {
                    "Authorization": Lisa.Connection.restAuthHeader,
                    "X-No-Redirect": true
                },
                url: url,
                dataType: 'json',
                success: phoneUrlReceived
            });
        }

        // Retrieve user-status to receive phone url that we can use to read the phone-ip on the LAN.
        var url = Lisa.Connection.restUserUrl + "/status";
        $.ajax
        ({
            type: "GET",
            headers: {
                "Authorization": Lisa.Connection.restAuthHeader,
                "X-No-Redirect": true
            },
            url: url,
            dataType: 'json',
            success: statusReceived
        });
    }

    // Start the sequence
    getCompany();
    getPhoneConnectionEnabledForUser(); // Triggers the sequence that eventually retrieves the phone-auth. getCompany() is a prerequisite.
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
    var url = "http://"+phoneUser+":"+phonePass+"@" + phoneIp + "/img/snom_logo.png?noCaching=" + Math.random();
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
            alert("Inloggen mislukt. Voer uw login en wachtwoord opnieuw in, en probeer het nog een keer.");
            $("#loginSubmitBtn").prop("disabled",false); // FIXME: Not in the model!
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

    // Empty lots of other data-structures.
    init();

}

function gotModel(newmodel) {
    getPhoneAuth(USERNAME, DOMAIN, PASS);
    retrieveSettings();

    // initialise the queuePause module.
    queuePause = new QueuePause(conn);

    // Show interface
    loggedIn = true;
    reconnecting = 0;
    serverNotExpected = false;
    var loginInfo = {};
    loginInfo.loggedIn = true;
    loginInfo.username = LOGINDATA.given_login;
    loginInfo.password = PASS;
    loginInfo.server = DOMAIN;
    localStorage.setItem("loginInfo", JSON.stringify(loginInfo));
    listingViewModel.loggedInName(Lisa.Connection.model.users[Lisa.Connection.myUserId].name);
    
    model = newmodel;
    me = model.users[Lisa.Connection.myUserId];
    refreshModel(model);
    
    // Listen for added or removed users or queues, which requires to redraw the whole structure.
    model.userListObservable.addObserver(refreshModel);
    model.queueListObservable.addObserver(refreshModel);

   closeLoginModal();
}

function retrieveSettings() {

    remoteStorage.getItem("company_hideLastPartPhoneNumber", "", COMPANYNAME)
        .done(function(response) {
            if (response == "false") {
                currentServerObfuscateNumberSetting = false;
                listingViewModel.obfuscateNumber(false);
            } else {
                currentServerObfuscateNumberSetting = true;
                listingViewModel.obfuscateNumber(true); // Default to hiding.
            }
        });

    remoteStorage.getItem("company_crmUrl", "", COMPANYNAME)
        .done(function(response) {
            listingViewModel.crmUrl(response);
        });

    remoteStorage.getItem("company_autoPauseSettings", "", COMPANYNAME)
        .done(function(response) {
            if (response != null) {
                var queuePauseSettings = JSON.parse(response);
                queuePause.changePauseTimes(queuePauseSettings);
                setAutoPauseSettingsInGui(queuePauseSettings);
            }
        });

    remoteStorage.getItem("company_allowPause", "", COMPANYNAME)
        .done(function (response) {
            console.log("Retrieved company allowPaused setting: " + response);
            if (response !== null) {
                listingViewModel.allowPause(JSON.parse(response));
            }
        });
}

function setAutoPauseSettingsInBackend(queuePauseSettings) {
    console.log("GUI changed, updating pause-times in back-end, and storing on server.")
    //console.log(queuePauseSettings);
    queuePause.changePauseTimes(queuePauseSettings);
    remoteStorage.setItem("company_autoPauseSettings", JSON.stringify(queuePauseSettings), "", COMPANYNAME);
}

function getContactListData(user, server, pass, companyId) {
    var postObj = {};
    postObj.username = user;
    postObj.server = server;
    postObj.auth = btoa(user + ":" + pass);
    postObj.company_id = companyId;


    console.log("Retrieving contact-list for: " + user + " " + server + " " + postObj.company_id);

    $.ajax
    ({
        type: "POST",
        url: "https://www.bedienpost.nl/retrieveContacts.php",
        dataType: 'json',
        data: postObj,
        success: function (response){
            var responseObj = response;
            //console.log("Received Contacts");
            //console.log(responseObj);
            addContactListData(responseObj);
        },
        error: function (response) {
            console.warn("Failure trying to receive additional contacts for company.")
        }
    });

}

function addContactListData(contactListData) {
    var contactListData = contactListData || contactUsersDemoData;

    for (arrayIndex in contactListData) {
        var user = contactListData[arrayIndex];
        //console.log("Considering contact user: " + user.name);

        // Try the defined contactPhoneNumberPriority order to find the correct phone-number. This means for example that the "work" number has priority over "mobile".
        for (key in contactPhoneNumberPriority){
            var numberKey = contactPhoneNumberPriority[key];
            var number = _.where(user.numbers, {name: numberKey})[0];
            if (number) {
                user.extension = number.number;
                break;
            }
        }

        // If still no default number found, just pick the first available number.
        if (!user.extension) {
            if (user.numbers[0]) {
                user.extension = user.numbers[0].number;
            }
        }

        addUser(user);
    }

    // Retrieved the contact-list, now let's find the associated notes for the users.
    getUserNoteModel();
    setInterval(getUserNoteModel, 900000); // re-check every fifteen minutes.
}

function closeLoginModal() {
    $('#loginModal').modal('hide');
    shortcutsActive = true;
}

function getCallInfo(call, user) {
    callInfo = {};

    // Get info specific to incoming call or outgoing call, and determine whether the other party is an user on the platform.
    if ((call.sourceUser) && (call.sourceUser == user)) {
        // Outgoing call
        callInfo.directionIsOut = true;
        if (call.destinationUser) {
            callInfo.number = call.destinationUser.extension;
        }
    } else {
        // Incoming call
        callInfo.directionIsOut = false;
        if (call.sourceUser) {
            callInfo.number = call.sourceUser.extension;
        }
    }

    // Set name and number for the call.
    callInfo.name = "...";
    if (!callInfo.number) {
        callInfo.number = call.source.find('number').text();// + " - [" + timeString + "]";
    }
    if (!callInfo.number) {
        callInfo.number = call.destination.find('number').text();// + " - [" + timeString + "]";
    }

    // Try to find a user with this phone-number in the list, and display its name if found.
    var lastSevenNumbers = callInfo.number.substr(-7);
    var userObj = userPhoneNumberToUserObservable[lastSevenNumbers];
    if (userObj) {
        callInfo.name = userObj.name();
    }

    // Set description.
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

    // Handle user-numbers
    if (user.numbers) {
        // User from contact-list import
        userObj.numbers(user.numbers);
        userObj.amImportedContact(true);
    } else {
        // User from XMPP
        userObj.numbers([{name: "work", number: user.extension}]);
    }
    //console.log("Numbers for " + userObj.name());
    //console.log(userObj.numbers());

    // Handle user companies.
    if (user.numbers) {
        userObj.company(user.company);
        //console.log("Setting company for contact user to " + user.company);
    } else {
        //console.log("Setting company for regular user to " + COMPANYNAME);
        userObj.company(COMPANYNAME);
    }

    //console.log(userObj.numbers);

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
    console.log("Updating queue representation for queue " + queue.name);

    queueObj = queueObj || new QueueListItem(queue.id, queue.name);
    queueObj.signInOut(queue.users[Lisa.Connection.myUserId] != null);
    queueObj.waitingAmount(_.size(queue.calls));
    queueObj.maxWaitingStartTime(currentTime() - queue.maxWait * 1000);
    queueObj.paused(queue.paused);

    var availableStr = "", unAvailableStr="", pausedStr = "";
    var avfirst = true, unavfirst = true, pausedFirst = true;
    var sortedUsers = _.sortBy(queue.users, function(user){
        return user.name;
    });

    for (userId in sortedUsers) {
        var user = sortedUsers[userId];
        //console.log(user);
        //console.log(queueObj.id());

        if (user.loggedIn == false) continue;
        var pausedForQueue = user.pausedForQueue[queueObj.id()];
        if (_.size(user.calls) > 0) {
            unAvailableStr += ((!unavfirst) ? ", " : "") + user.name;
            unavfirst = false;
        } else if (pausedForQueue) {
            pausedStr += ((!pausedFirst) ? ", " : "") + user.name;
            pausedFirst = false;
        } else if (_.size(user.calls) == 0){
            availableStr += ((!avfirst) ? ", " : "") + user.name;
            avfirst = false;
        }
    }
    var memberStr = "Beschikbaar: \n " + availableStr +
        "\n\nNiet Beschikbaar:\n" + unAvailableStr +
        "\n\nGepauzeerd:\n" + pausedStr;
    queueObj.membersStr(memberStr);

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

var userListEntriesArray = [];

/* Add / Update page for users */
function addUser(user) {
    console.log("Adding user " + user);
    if (user.name == "") {
        console.log("User has no name, not adding");
        return;
    }

    if (user.observable)
        user.observable.addObserver(updateUser);

    var userObj = updateUser(user);



    userIdToUserObservable[user.id] = userObj;

    // Store users belonging to a certain phone-number
    for (numberKey in userObj.numbers()) {
        var number = userObj.numbers()[numberKey].number;
        if ((number != null) && (number != "")) {
            var lastSevenNumbers = number.substr(-7);
            userPhoneNumberToUserObservable[lastSevenNumbers] = userObj;
        }
    }

    // We are caching results in an own (fast) javascript array, and pushing new users out to the knockout observablearray periodically for performance reasons.
    userListEntriesArray.push(userObj);
    var updateUserListEntries = _.debounce(updateUserListEntriesFunc, 300);
    updateUserListEntries();
}

function updateUserListEntriesFunc() {
    //console.log(userListEntriesArray);
    userListEntriesArray = _.sortBy(userListEntriesArray, function(entry){ return entry.name(); });
    userListEntries(userListEntriesArray);
}

// Make-up the user entry.
function updateUser(user) {
    //console.log("Updating user " + user);
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
            callObj.originalCallModel = call;
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

    // Update the queues that the user is part of
    for (var queueId in user.queues) {
        var queue = user.queues[queueId];
        updateQueue(queue);
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
            delete callIdToCallObservable[oldEntry.id()];
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
            oldEntry.originalCallModel = newEntry.originalCallModel;
        } else {
            console.log("Adding call " + newEntry.id() );
            callIdToCallObservable[newEntry.id()] = newEntry;
            incomingCallEntries.push(newEntry);    
        }
    }

//    console.log("Call list after merging new enties:");
//    console.log(incomingCallEntries());
//    console.log(callIdToCallObservable);
}

function addQueue(queue) {
    console.log("Adding queue " + queue);
    queue.observable.addObserver(updateQueue);

    var queueObj = updateQueue(queue);

    queueListEntries.push(queueObj);
    queueIdToQueueObservable[queue.id] = queueObj;
}

function updateQueue(queue, eventName, pauseTime, number) {
    console.log("Updating queue " + queue);
    var queueObj = queueIdToQueueObservable[queue.id];
    queueObj = queueToClientModel(queue, queueObj);

    // Handle queue auto-pause.
    if (eventName == "autoPaused") {
        var callListItem = new CallListItem(null, null, null, null, number);
        callListItem.makeAutoPause(queue, pauseTime);
        incomingCallEntries.push(callListItem);
    }

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

function attendedTransferToUserWithAutoFinish(number) {
    pendingAttendedTransfer = number;
    return attendedtransferToUser(number);
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
    listingViewModel.search("");
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

function dialNumber(numberToCall) {
    conn.dialNumber(numberToCall);
    if (listingViewModel.connectedPhone()) _.delay(pickupPhone, 1000);
}

function bedienpostAdminAjaxPost(url, postObj, success, error) {
    $.ajax
    ({
        type: "POST",
        url: url,
        data: postObj,
        headers: {
            "Authorization": "Basic " + btoa(JID + ":" + PASS)
        },
        success: success,
        error: error
    });
}

// TODO; Refactor to use the remote-storage functionality directly instead of using some shady form to set remote-storage for us.
function storeSettingObfuscateNumber(value) {
    // Suppress call to server if the change came from the server in the first place
    if (value == currentServerObfuscateNumberSetting)
        return;

    var postObj = {obfuscateNumber: (value) ? 1 : 0};
    var url = "https://bedienpost.nl/admin/settings.php";

    console.log("Storing setting obfuscateNumer to " + value);
    bedienpostAdminAjaxPost(url, postObj,
        function(){console.log("Successfully stored setting obfuscateNumber to " + value); currentServerObfuscateNumberSetting = value;},
        function(){console.warn("Error storing obfuscateNumber setting.");}
    );
}

function storeSettingConnectSnom(value) {
    // Suppress call to server if the change came from the server in the first place
    if (value == currentServerConnectSnomSetting)
        return;

    var postObj = {ingeschakeld: (value) ? 1 : 0};
    var url = "https://bedienpost.nl/admin/StoreSnomConnection.php";

    console.log("Storing setting ConnectSnom to " + value);
    bedienpostAdminAjaxPost(url, postObj,
        function()
        {
            console.log("Successfully stored setting ConnectSnom to " + value);
            currentServerConnectSnomSetting = value;
            // Immediately effectuate the new settings.
            getPhoneAuth(USERNAME, DOMAIN, PASS);
        },
        function(){console.warn("Error storing ConnectSnom setting.");}
    );
}

function uploadVCard(data) {
    $.ajax({
        url: 'https://bedienpost.nl/admin/vcardimport.php',
        type: 'POST',
        data: data,
        headers: {
            "Authorization": "Basic " + btoa(JID + ":" + PASS)
        },
        cache: false,
        dataType: 'json',
        processData: false, // Don't process the files
        contentType: false, // Set content type to false as jQuery will tell the server its a query string request
        success: function(data, textStatus, jqXHR)
        {
        },
        error: function(jqXHR, textStatus, errorThrown)
        {
            console.log(jqXHR.responseText);

            if (jqXHR.responseText.indexOf("completed successfully") != -1) {
                console.log("VCards imported successfully!");
                listingViewModel.vcardUploadFeedback("VCard import Klaar.. Herlaad de bedienpost om de geimporteerde contacten te zien.");

                // re-load contacts
                //getContactListData(USERNAME, DOMAIN, PASS, COMPANYID);
            } else {
                listingViewModel.vcardUploadFeedback("VCard-upload mislukt. Meer informatie beschikbaar in de debugging console van de browser.");
            }
        }
    });
}

function storeSettingAllowPause(value) {
    console.log("Setting allow-pause to " + value);
    remoteStorage.setItem("company_allowPause", value, "", COMPANYNAME);
}

function storeSettingCrmUrl(value) {
    console.log("Setting CRM-url to " + value);
    remoteStorage.setItem("company_crmUrl", value, "", COMPANYNAME);
}

function getUserNoteModel() {
    console.log("Retrieving user-note model from server.")
    var deferred =  remoteStorage.getItem("company_userNoteModel", "", COMPANYNAME);
    deferred.done(function (val) {
        console.log("retrieved: " + val);

        var parsedObj = null;
        try{
            parsedObj = JSON.parse(val);
        }catch(e){
        }

        if (!_.isObject(parsedObj) ) {
            console.log("Invalid or empty response from server, defaulting to an empty object.");
            parsedObj = {};
        }
        userNoteModel = parsedObj;
        retrievedUserNoteModel = true;
        assignAllUserNotes();

    });
    return deferred;
}

function assignAllUserNotes() {
    // Give each user the right notes.
    for (var userId in userNoteModel) {
        var userNote = userNoteModel[userId];
        var userObservable = userIdToUserObservable[userId];
        if (userObservable != null) {
            userObservable.note(userNote);
        } else {
            console.log("Note for unknown user with id " + userId);
        }
    }
}

function storeUserNote(userId, note) {
    // Don't allow to set notes before the notes have been received at startup.
    if (retrievedUserNoteModel == false) {
        return;
    }

    console.log("Going to store note " + note + " for user: " + userId);
    // First retrieve the current notes from the server, in case there have been updates.
    var deferred = getUserNoteModel();
    deferred.done(function(userId, note) {
        return function(){
            console.log("Got most recent data from server, attempting update.")
            if (userNoteModel[userId] != note) {
                userNoteModel[userId] = note;
                assignAllUserNotes();
                if (note == "") {
                    delete userNoteModel[userId];
                }
                console.log("Pushing user-note model to server.")
                console.log(userNoteModel);
                remoteStorage.setItem("company_userNoteModel", JSON.stringify(userNoteModel), "", COMPANYNAME);
            }
        }
    }(userId, note));
}

var debouncedStoreSettingCrmUrl = _.debounce(storeSettingCrmUrl, 5000);