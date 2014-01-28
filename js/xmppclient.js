
var conn;
var model;
var phoneip;
var inAttTransfer = false;
var me = null;

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
    
    conn.connect(SERVER, USERNAME, PASS);
    
    // Get the company-model
    conn.getModel().done(gotModel);
  
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
    var userObj = Object();
        userObj.id = user.id;
        userObj.name = user.name;
        userObj.favorite = false;
        userObj.ext = userObj.extension;
        userObj.log = user.loggedIn;
        userObj.avail = false;
        return userObj;
}

function refreshModel(model) {
    console.log("Refreshing interface.")
    
    //$('#user_list').empty();
    //$('#queue_list').empty();
    
    // Add users to interface.
    //var datamodel = Array();
    userListEntries.removeAll();
    for (var userId in model.users) {
        //addUser(model.users[userId]);
        var user = model.users[userId];
        var userObj = userToClientModel(user);
        userListEntries.push(userObj);
    }
    //console.log(datamodel);
    //console.log(initialLists[0]);
    //initialLists[0].entries = ko.observableArray(datamodel);
    //initialLists[0].entries = null;
    //ko.applyBindings(new ListingsViewModel());
    
    // Add queues to interface.
    /*for (var queueId in model.queues) {
        addQueue(model.queues[queueId]);
    }*/
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
    var entry = $('#tpl_user').clone().attr('id', 'user_' + user.id);
    
    // Dial
    $('#user_list').append(entry);
    entry.find('.transfer').click(function(event) {
            event.preventDefault();
            transferToUser(user);   
    });
    entry.find('.atttransfer').click(function(event) {
            event.preventDefault();
            attendedtransferToUser(user);   
    });
    
    updateUser(user);
    
    // Execute updateUser(user) whenever the user changes.
    user.observable.addObserver(updateUser); 
}

// Make-up the user entry.
function updateUser(user) {
    console.log ("*** Updating user " + user);
    var entry = $('#user_' + user.id);
    
    // Name
    entry.find('.user_name').text(user.name + ((user.extension != "") ? " (" + user.extension + ")" : ""));
    var ext = user.extension;
    
    // Extension
    //if (ext == '') ext = '[unknown]';
    //entry.find('.user_ext').text(ext);

    
    // Set user status based on active calls.
    var status = '';
    var calls = Object.keys(user.calls);
    

    var status_entry = entry.find('.user_status');

    if (user.loggedIn == false) {
        $(entry).animate({backgroundColor: "white"}, 1000);
        return;
    }
    if (calls.length > 0) {
            var call = user.calls[calls[0]];
            if (call.destination && (call.destination != user)) {
                //status_entry.text('On the phone with ' + call.destination.name);
            } else if (call.source && (call.source != user)) {
                //status_entry.text('On the phone with ' + call.source.name);
            }
            //entry.css('background-color', "red");
            $(entry).animate({backgroundColor: "#FF4D4D"}, 1000);
    } else {
            status_entry.text('');
            //entry.css('background-color', 'transparent');
            //entry.css('background-color', "green");
            $(entry).animate({backgroundColor: "#66FF66"}, 1000);
    }

    // Did we get any calls?
    if (user.id == Lisa.Connection.myUserId) {
        $('#current-calls').empty();

        for (var callId in me.calls) {
            var call = user.calls[callId];
            updateCalls(call);
        }



         // Hide transfer elements if there aren't any calls.
        if (_.size(user.calls) == 0 ) {
            $('.transfer').hide();
            $('.atttransfer').hide();
        } else {
            //entry.find('.transfer').show();
            for (var userId in model.users) {
                if (userId == Lisa.Connection.myUserId) {
                    continue;
                }


                var transferUser = model.users[userId];
                console.log("considering user " + transferUser);
                var transferUserEntry = $('#user_' + transferUser.id);
                if ((transferUser.extension != "") && (_.size(transferUser.calls) == 0)) {
                    transferUserEntry.find('.transfer').show();
                    if (_.toArray(user.calls)[0].state == "ANSWERED") {
                        transferUserEntry.find('.atttransfer').show();
                    }
                } else {
                    transferUserEntry.find('.transfer').hide();
                    transferUserEntry.find('.atttransfer').hide();
                }
            }

           

            if (_.toArray(user.calls)[0].state == "ANSWERED") {
                $hangupCall = $("<div><a href=''>Hang up the current call</a></div>");
                $hangupCall.click(function(event) {
                    event.preventDefault();
                    phoneCommand("CANCEL");
                });
                $('#current-calls').append($hangupCall);

                if (inAttTransfer) {
                    $('#current-calls').append("<p/>");
                    $transferCall = $("<div><a href=''>Finalize attended transfer</a></div>");
                    $transferCall.click(function(event) {
                        event.preventDefault();
                        phoneCommand("TRANSFER");
                        inAttTransfer = false;
                    });
                    $('#current-calls').append($transferCall);          
                }

            } else {
                $('#current-calls').append("<p/>");
                $pickupCall = $("<div><a href=''>Pick up the incoming call</a></div>");
                $pickupCall.click(function(event) {
                    event.preventDefault();
                    phoneCommand("ENTER");
                });
                $('#current-calls').append($pickupCall);   
            }
        }
    }
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



