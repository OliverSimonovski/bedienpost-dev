
var conn;
var model;
var phoneip;
var inAttTransfer = false;
var me = null;
var userIdToUserObservable = Array();

$(document).ready(function () {

    // Retrieve the settings
    var urlvars = getUrlVars();

    var loginSplit = urlvars.login.split("@");
    USERNAME = loginSplit[0];
    SERVER = loginSplit[1];
    PASS = urlvars.pass;
    phoneip = urlvars.phoneip;

    conn = new Lisa.Connection();
    conn.use_ssl = false;
    conn.bosh_port = 5280;
    conn.log_xmpp = true;
    //console.log(conn);
    
    // Setup logging and status messages.
    conn.logging.setCallback(function(msg) {
        console.log(msg);
    });
    conn.logging.setStatusCallback(function(msg) {
        $('#status').text(msg);
    });
    
    // Setup connection-status callback.
    conn.connectionStatusObservable.addObserver(connectionStatusCallback);
    $('#status').text('Connecting...');
    
    // Debugging
    conn._hitError = function (reqStatus) {
        console.log("Error occured: " + reqStatus);
    }
    
    //conn.connect(SERVER, USERNAME, PASS);
    
    // Get the company-model
    conn.getModel().done(gotModel);

    // Logon to the phone:
    //authPhone("192.168.0.18", "jasperdev", "776");
    //phoneCommand("ENTER");
  
});


function connectionStatusCallback(status) {
    if (status == Strophe.Status.CONNFAIL) {
        $('#connect').get(0).value = 'connect';
    } else if (status == Strophe.Status.DISCONNECTED) {
        $('#connect').get(0).value = 'connect';
    } else if (status == Strophe.Status.CONNECTED) {
        $('#status').text('Loading...');
    }
}

function gotModel(newmodel) {
    // Show interface
    $('#loading').hide();
    $('#container').show();

    model = newmodel;
    me = model.users[Lisa.Connection.myUserId];
    refreshModel(model);
    
    // Listen for added or removed users or queues, which requires to redraw the whole structure.
    model.userListObservable.addObserver(refreshModel);
    model.queueListObservable.addObserver(refreshModel);
}

function userToClientModel(user) {
    var numcalls = _.size(user.calls);

    var userObj = Object();
    userObj.id = user.id;
    userObj.name = user.name;
    userObj.favorite = ( Math.floor(Math.random()*100) < 8);
    userObj.ext = userObj.extension;
    userObj.log = user.loggedIn;
    userObj.avail = (numcalls == 0);


    
    if (numcalls > 0) {
        var call = user.calls[Object.keys(user.calls)[0]]; // Ugh.
        console.log(call);

        if ((call.sourceUser) && (call.sourceUser == user)) {
            if (call.destinationUser) {
                userObj.connectedNr = call.destinationUser.extension;
                userObj.connectedName = call.destinationUser.name;
            } else {
                userObj.connectedName = call.destination.find('number').text();
            }
        } else {
            if (call.sourceUser) {
                userObj.connectedNr = call.sourceUser.extension;
                userObj.connectedName = call.sourceUser.name;
            } else {
                userObj.connectedName = call.source.find('number').text();
            }
        }
    } else {
         userObj.connectedNr = "";
         userObj.connectedName = "";    
    }

    return userObj;
}

function queueToClientModel(queue) {
    var numcalls = _.size(queue.calls);

    var queueObj = Object();
    queueObj.name = queue.name;

    return queueObj;
}

function refreshModel(model) {
    console.log("Refreshing interface.")
    
    //$('#user_list').empty();
    //$('#queue_list').empty();
    
    // Add users to interface.
    //var datamodel = Array();
    userListEntries.removeAll();
    for (var userId in model.users) {

        var user = model.users[userId];
        addUser(user);
    }
}

function openUrl(url) {
    console.log(url);
    (new Image()).src = url;
}

function phoneCommand(cmdString) {
    var url = "http://" + phoneip + "/command.htm?key=" + cmdString;
    openUrl(url);    
}

function transferToUser(user) {

    var url = "TRANSFER;";

    var extension = user.extension;
    for ( var i = 0; i < extension.length; i++ ) {
        url += extension.charAt(i) + ";";
    }
    url += "ENTER";

    phoneCommand(url);
}

function attendedtransferToUser(user) {

    inAttTransfer = true;
    //updateUser(me); // Update the user gui

    phoneCommand("F_HOLD");

    _.delay(function() {
       
        var url = "";
        var extension = user.extension;
        for ( var i = 0; i < extension.length; i++ ) {
            url += extension.charAt(i) + ";";
        }
        url += "ENTER";

        phoneCommand(url);
    }, 1000);
}


/* Add / Update page for users */
function addUser(user) {
    console.log("Adding user " + user);
    user.observable.addObserver(updateUser);

    var userObj = userToClientModel(user);
    var userObjObservable = ko.mapping.fromJS(userObj);

    userListEntries.push(userObjObservable);
    userIdToUserObservable[user.id] = userObjObservable;
    
}

// Make-up the user entry.
function updateUser(user, userKoObservable) {
    console.log("Updating user " + user);
    var userObj = userToClientModel(user);
    var userObjObservable = userIdToUserObservable[user.id];

    userObj.favorite = userObjObservable.favorite();

    ko.mapping.fromJS(userObj, userObjObservable);
}

// http://learn.jquery.com/using-jquery-core/faq/how-do-i-select-an-element-by-an-id-that-has-characters-used-in-css-notation/
function safeId(myid) {
    return myid.replace(/(:|\.|\[|\]|\@|\/)/g, "\\$1");
}

/* Add / Update the page-elements for calls */

function updateCalls(call) {

    var elem = $('#tpl_call').clone().attr('id', 'call_' + call.id);
    updateCall(call, elem);
    $('#current-calls').append(elem);
    call.observable.addObserver(function(call) {
        updateCall(call);
    });
}

function updateCall(call, elem) {
    if (!elem) {
        elem = $('#call_' + safeId(call.id));
    }
    elem.text(callToString(call));
}

function callToString(call) {

    if (call == null)
        return "";

    var str = 'Call from ';
    str += endpointToString(call.source);
    str += ' to ';
    str += endpointToString(call.destination);
    str += '.';
    return str;

}

function endpointToString(endpoint) {

    if (endpoint == null)
        return "";

    switch (endpoint.attr('type')) {
    case 'User':
        var userId = endpoint.find('userId').text();
        var user = model.getUser(userId);
        return user.name + " [" + user.extension + "]";

    case 'Dialplan':
        var txt = endpoint.find('description').text();
        if (txt != '' ) return txt;
        return endpoint.find('exten').text();

    case 'Queue':
        var queueId = endpoint.find('queueId').text();
        var queue = model.getQueue(queueId);
        return "queue '" + queue.name + "'";

    case 'External':
        return endpoint.find('number').text();

    default:
        console.log('Cannot represent endpointType ' + endpoint.attr('type'));
        return '[unknown]';
    }

}

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
    var url = "http://jasperdev:776@" + phoneip + "/command.htm?key=" + cmdString;
    openUrl(url);    
}