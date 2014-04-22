// This is a basic and incomplete Javascript implementation of the
// data model of Compass.
// 
// It handles events for users, calls and queues.
// The Compass data model, codenamed Lisa, is internally represented
// by Javascript objects. 

// JS namespace declaration
var Lisa = {};

// XML Namespaces
Strophe.addNamespace('LISA_REQUESTS', 'http://iperity.com/compass');
Strophe.addNamespace('LISA_NOTIFICATIONS', 'http://iperity.com/compass');

/*
 * Observer - Observable pattern 
 */
Lisa.Observable = function() {
	this.observers = [];

	this.addObserver = function(callback) {
		if (jQuery.isFunction(callback)) {
			this.observers.push(callback);
		} else {
			Lisa.Connection.logging
					.log("WARNING: Lisa.Observable.addObserver: callback "
							+ callback + " not a function. Not added");
		}
	}

	this.removeObserver = function(callback) {
		var index = this.observers.indexOf(callback);
		this.observers.remove(index);
	}

	this.notify = function() {
		var args = arguments;
		this.observers.forEach(function(f) {
			f.apply(this, args);
		});
	}
}

/*
 * User object
 */
Lisa.User = function() {
	this.id = "";
	this.name = "";
    this.username = "";
	this.jid = "";
	this.extension = "";
	this.calls = {};
	this.queues = {};
	this.loggedIn = false;

	this.addQueue = function(queue) {
		if (!queue) {
			Lisa.Connection.logging.warn("Tried to add queue, but queue is NULL");
			return;	
		}
		this.queues[queue.id] = queue;
		this.observable.notify(this);
		queue.observable.notify(queue);
	}

	this.removeQueue = function(queue) {
		if (!queue) {
			Lisa.Connection.logging.warn("Tried to remove queue, but queue is NULL");
			return;	
		} else if (!this.queues[queue.id]) {
			Lisa.Connection.logging.warn("Tried to remove queue, but queue " + 
										 queue + " not present in model " + this);	
			return;
		}

		delete this.queues[queue.id];
		this.observable.notify(this);
		queue.observable.notify(queue);
	}

	this.toString = function() {
		return "(User:" + this.id + ":" + this.name + ",l:" + this.loggedIn
				+ ")";
	}
	this.observable = new Lisa.Observable();
}

/*
 * Queue object
 */
Lisa.Queue = function() {
	this.id = "";
	this.name = "";
	this.users = {};
	this.calls = {};
	this.maxWait = 0;
	this.averageWait = 0;
	this.totalWait = 0;
	this.handledCalls = 0;
	this.totalCalls = 0;

	this.addUser = function(user) {
		if (!user) {
			Lisa.Connection.logging.warn("Tried to add user, but user is NULL");
			return;
		}

		this.users[user.id] = user;
		this.observable.notify(this);
		user.observable.notify(user);
	}

	this.removeUser = function(user) {
		if (!user) {
			Lisa.Connection.logging.warn("Tried to remove user, but user is NULL");
			return;	
		} else if (!this.users[user.id]) {
			Lisa.Connection.logging.warn("Tried to remove user, but user " + 
										user + " not present in model " + this);	
			return;
		}

		delete this.users[user.id];
		this.observable.notify(this);
		user.observable.notify(user);
	}

	this.addCall = function(call) {
		if (!call) {
			Lisa.Connection.logging.warn("Tried to add call, but call is NULL");
			return;
		}
		Lisa.Connection.logging.log("Adding call " + call + " to queue " + this);

		this.calls[call.id] = call;
		call.queue = this;
		this.observable.notify(this);
		call.observable.notify(call);
	}

	this.removeCall = function(call) {
		if (!call) {
			Lisa.Connection.logging.warn("Tried to remove call, but call is NULL");
			return;	
		} else if (!this.calls[call.id]) {
			Lisa.Connection.logging.warn("Tried to remove call, but call " + 
										call + " not present in model " + this);	
			return;
		}

		Lisa.Connection.logging.log("Removing call " + call + " from queue " + this);
		call.queue = null;
		delete this.calls[call.id];
		this.observable.notify(this);
		call.observable.notify(call);
	}

	this.toString = function() {
		return "(Queue:" + this.id + ":" + this.name + ")";
	}
	this.observable = new Lisa.Observable();
}


/*
 * Call object
 */
Lisa.Call = function() {
	this.id = "";
	this.queue = null;
	this.source = null;
	this.sourceUser = null;
	this.destination = null;
	this.destinationUser = null;
	this.observable = new Lisa.Observable();

	this.toString = function() {
		return "(Call:" + this.id + ",f:" + this.source + ",t:"
				+ this.destination + ")";
	}

	this.removeUser = function(user) {
		if (!user) {
			Lisa.Connection.logging.warn("MODEL::Call - Tried to remove user, but user is NULL");
			return;	
		}

		if (this.sourceUser == user) {
			delete this.sourceUser.calls[this.id];
		}
		if (this.destinationUser == user) {
			delete this.destinationUser.calls[this.id];
		}
		user.observable.notify(user);
	}
}

/**
 * The Lisa Model object.
 *
 * The library gives access to an instance of this object through the getModel() call,
 * and constantly keeps it updated with the the state of the platform.
 */
Lisa.Model = function() {

	this.users = {}; // Array of users, keyed by id.
	this.queues = {}; // Array of queues, keyed by id.
	this.calls = {}; // Array of calls, keyed by id.
	this.userListObservable = new Lisa.Observable();
	this.queueListObservable = new Lisa.Observable();
	this.callListObservable = new Lisa.Observable();

	this.addCall = function(call) {
		var newCall = (this.calls[call.id] == null);
		this.calls[call.id] = call;
		
		Lisa.Connection.logging.log("MODEL: " + ((newCall) ? "Added" : "Updated") + " call " + call);
		if (newCall) {
			this.callListObservable.notify(call, 'add');
		} else {
			call.observable.notify(call);
		}
		
		// Attach the call to any involved users.
		if (call.sourceUser) {
			call.sourceUser.calls[call.id] = call;
			call.sourceUser.observable.notify(call.sourceUser);
		}
		if (call.destinationUser) {
			call.destinationUser.calls[call.id] = call;
			call.destinationUser.observable.notify(call.destinationUser);
		}
	}

	this.removeCall = function(theCall) {
		var call = this.calls[theCall.id];
		if (call == null) {
			Lisa.Connection.logging
					.log("MODEL: WARNING: Request to remove call, but call not in data model."
							+ call);
			return;
		}

		// Delete the call.
		delete this.calls[call.id];

		// Delete the call from all objects that might refer to it.
		if (call.sourceUser) {
			delete call.sourceUser.calls[call.id];
			call.sourceUser.observable.notify(call.sourceUser);
		}
		if (call.destinationUser) {
			delete call.destinationUser.calls[call.id];
			call.destinationUser.observable.notify(call.destinationUser);
		}
		if (call.queue) {
			call.queue.removeCall(call);
		}

		Lisa.Connection.logging.log("MODEL: Removed call " + call);
		this.callListObservable.notify(call, 'remove');
	}

	this.addQueue = function(queue) {
		Lisa.Connection.logging.log("MODEL: Added or updated queue " + queue);

		var newQueue = (this.queues[queue.id] == null);

		// Add the queue to the global model.
		this.queues[queue.id] = queue;

		// Add all calls that are part of the queue to the model.
		for ( var callId in queue.calls) {
			this.addCall(queue.calls[callId]);
		}

		queue.observable.notify(queue);
		if (newQueue)
			this.queueListObservable.notify(this, queue);
	}

	this.addUser = function(user) {
		if (user == null) {
			return;
		}

		Lisa.Connection.logging.log("MODEL: Added user " + user);
		var newUser = (this.users[user.id] == null);
		this.users[user.id] = user;

		// --- Send Notifications ---

		user.observable.notify(user);

		for ( var queueId in user.queues) {
			var queue = this.queues[queueId];
			queue.observable.notify(queue);
		}

		if (newUser)
			this.userListObservable.notify(this, user);
	}

	this.removeUser = function(id) {
		Lisa.Connection.logging.log("Removing user with id " + id);
		var user = this.users[id];

		delete this.users[id];

		if (user) {
			for ( var queueId in user.queues) {

				// Delete user from queue as well.
				var queue = this.queues[queueId];
				delete queue.users[user.id];
				Lisa.Connection.logging.log("Deleted user " + user
						+ "from queue" + queue);

				// Notify any queues that the user used to be in
				queue.observable.notify(queue);
			}
		}

		this.userListObservable.notify(this, user);
	}
	
	this.getUser = function(id) {
		return this.users[id];
	}
	
	this.getQueue = function(id) {
		return this.queues[id];
	}

	this.getCall = function(id) {
		return this.calls[id];
	}
}

function randomstring(L) {
	var s = '';
	var randomchar = function() {
		var n = Math.floor(Math.random() * 62);
		if (n < 10)
			return n; // 1-10
		if (n < 36)
			return String.fromCharCode(n + 55); // A-Z
		return String.fromCharCode(n + 61); // a-z
	}
	while (s.length < L)
		s += randomchar();
	return s;
}

/**
 * The Lisa Connection object.
 *
 * This is the main interface to the library.
 */
Lisa.Connection = function() {

	// === Static variables
	Lisa.Connection.connectionStatusObservable = new Lisa.Observable();
	Lisa.Connection.model = new Lisa.Model();
	Lisa.Connection.myUserId = 0;		// Lisa user id.
	Lisa.Connection.jid = "";			// bare jid (username@domain, no resource)
	Lisa.Connection.userName = "";		// Compass username. May be with or without domain.
    Lisa.Connection.password = "";
    Lisa.Connection.server = "";		// the XMPP server hostname
    Lisa.Connection.domain = "";		// the domain of the user (domain part of jid)
	Lisa.Connection.restServer = "";
    Lisa.Connection.restUserUrl = "";
    Lisa.Connection.restIdentityUrl = "";

	// === Local variables
	var self = this;
	var connection;
	var companyId;
	var initDeferred = $.Deferred();
	var modelCompleteDeferred = $.Deferred();
	var usersDone = false;
	var queuesDone = false;

	// === Public members
	
	/*
     * Connecting without SSL makes you vulnerable for eavesdropping and connection hijacking. 
     * Please look up the port-number for you Compass environment in the documentation,
     * set bosh_port to this value, and set use_ssl to true using your client.
     */
	this.bosh_port = 5280;
	this.use_ssl = false;

	this.retrieve_model = true;
	this.log_xmpp = false;
	this.connectionStatusObservable = Lisa.Connection.connectionStatusObservable;
	this.model = Lisa.Connection.Model;
	
	/** Connect to the XMPP server through BOSH */
	this.connect = function(server, jid, password, resource) {

        jid = fixupJid(jid, server);
        this.setupConnection(server, jid);
        Lisa.Connection.password = password;

		// Configuration
		resource = resource || "LisaApi" + "_" + randomstring(10);
        var fullJid = jid + '/' + resource;

		// .. and connect.
        connection.connect(fullJid, password, connectionStatusChanged);
	}

	/** Attach to a previous BOSH session
     *  Note: Doesn't store the password, and as such disables
     *  use of functions that use the REST api such as
     *  dialNumber, dialUser, queueLogin, and queueLogout */
	this.attach = function(server, jid, sid, rid) {

		jid = fixupJid(jid, server);
		this.setupConnection(server, jid);

		// Attach callbacks...
		connection.addHandler(callback(function(stanza) {
			onMessageReceived(stanza);
			return true;
		}), null, 'message', null, null, null);
		connection.addHandler(callback(function(stanza) {
			onPubsubReceived(stanza);
			return true;
		}), null, 'message', null, null, connection.PubSub.service);

		// Attach
		Lisa.Connection.logging.log("Attaching to session with sid: " + sid
				+ " ,jid: " + jid + " ,rid: " + rid);
		connection.attach(jid, sid, rid, connectionStatusChanged);
		connectionStatusChanged(Strophe.Status.CONNECTED);
	}

	/** Disconnect from the server. */
	this.disconnect = function() {
		/* Switch to using synchronous requests
		 * since this is typically called
		 * onUnload.
		 */
		Lisa.Connection.connection.sync = true;
		Lisa.Connection.connection.flush();
		Lisa.Connection.connection.disconnect();
	},

	this.sendIQ = function(iq) {
		var deferred = $.Deferred();
		connection.sendIQ(iq, callback(function(res) {
			res = $(res);
			deferred.resolve(res);
		}), callback(function(res) {
			res = $(res);
			deferred.reject(res);
		}));
		return deferred;
	},

	this.setupConnection = function(server, jid) {
		// configuration
		Lisa.Connection.server = server;
		Lisa.Connection.domain = jid.substring(jid.indexOf('@') + 1);
		Lisa.Connection.jid = jid;

		// Setup strophe connection
		var protocol = this.use_ssl ? 'https' : 'http';
		var bosh_service = protocol + '://' + server + ':' + this.bosh_port
				+ '/http-bind';
		connection = new Strophe.Connection(bosh_service);
		Lisa.Connection.connection = connection;
		if (this.log_xmpp) {
			connection.rawInput = this.logging.logInput;
			connection.rawOutput = this.logging.logOutput;
		}

		// Attach callbacks...
		connection.addHandler(callback(function(stanza) {
			onMessageReceived(stanza);
			return true;
		}), null, 'message', null, null, null);
		// If pubsub plugin loaded
		if (connection.PubSub) {
			connection.addHandler(callback(function(stanza) {
				onPubsubReceived(stanza);
				return true;
			}), null, 'message', null, null, connection.PubSub.service);
		}

		// create jQuery deferred to communicate initialisation success or
		// error.
		initDeferred.fail(Lisa.Connection.logging.log);
		initDeferred.fail(function() {
			modelCompleteDeferred.reject.apply(this, arguments);
		});
		return initDeferred;
	};



	this.getStropheConnection = function() {
		return connection;
	};

	/*
	 * Actions
	 */

	/** Have the current user dial a phone-numer.*/
	this.dialNumber = function(number) {
		Lisa.Connection.logging.log("Calling " + number);
        restAjaxRequest(
            Lisa.Connection.restUserUrl + "/dialNumber",
            {destination: number},
            function (response){
                Lisa.Connection.logging.log("Issued call to " + number);
            }
        );
	}

	/** Have the current user dial another user */
	this.dialUser = function(user) {
        Lisa.Connection.logging.log("Calling " + user);
        var targetUserUrl = "https://" + Lisa.Connection.restServer + "/user/" + user.id;
        restAjaxRequest(
            Lisa.Connection.restUserUrl + "/dialUser",
            {callee: targetUserUrl},
            function (response){
                Lisa.Connection.logging.log("Issued call to " + user);
            }
        );
    }

	/** Have the current user logon to a queue*/
	this.queueLogin = function(queue) {
        // First, see whether we have any previous settings stored for the queue.
        var fromLs = localStorage.getItem(localStorageKeyForQueue(queue));
        var settingsObj = (fromLs) ? JSON.parse(fromLs) : {};
        this.queueLoginWithSettings(queue, settingsObj.priority || 1, settingsObj.callForward || false);
	}

    /** Have the current user logon to a queue with known settings*/
    this.queueLoginWithSettings = function(queue, priority, callForward) {
        var queueId = "https://" + Lisa.Connection.restServer + "/queue/" + queue.id;
        Lisa.Connection.logging.log("Logging in to queue " + queueId
                                    + " with priority " + priority + " and follow-forwards " + callForward);
        restAjaxRequest(
            Lisa.Connection.restIdentityUrl + "/loginQueue",
            {queue:queueId, priority:priority, callForward:callForward},
            function (response){
                Lisa.Connection.logging.log("Logged onto queue" + queue);
            }
        )
    }

	/** Have the current user log out of a queue */
	this.queueLogout = function(queue) {

        // First, retrieve any queue membership settings, so we can
        // set these settings correctly upon logging in again.
        restAjaxRequest(
            Lisa.Connection.restIdentityUrl + "/queueMemberships",
            null,
            function(queue) {
                return function (response){
                    // Store current queue settings
                    var queueId = "https://" + Lisa.Connection.restServer + "/queue/" + queue.id;
                    var currentSettings = _.where(response, {queue: queueId})[0];
                    var settingsObj = {priority: currentSettings.priority, callForward: currentSettings.callForward};
                    Lisa.Connection.logging.log("Storing settings " + JSON.stringify(settingsObj) + " for queue " + queue + " on logout.");
                    localStorage.setItem(localStorageKeyForQueue(queue), JSON.stringify(settingsObj));

                    // then, logout of the queue.
                    Lisa.Connection.logging.log("Logging out of queue " + queueId);
                    restAjaxRequest(
                        Lisa.Connection.restIdentityUrl + "/logoutQueue",
                        {queue:queueId},
                        function (response){
                            Lisa.Connection.logging.log("Logged out of queue" + queue);
                        }
                    )
                }
            }(queue),
            null,
            "GET"
        )
	}

    function localStorageKeyForQueue(queue) {
        return "queueSettings_" + queue.id;
    }

	/*
	 * One-off getters
	 *
	 * Each of these functions returns a JQuery.deferred()
	 * http://api.jquery.com/category/deferred-object/
	 */

	/**
	 * get the current company-id.
	 *
	 * @returns a JQuery.deferred that will resolve to the 
	 * company-id of the current user when available. 
	 */
	this.getCompanyId = function() {
		var deferred = $.Deferred();
		initDeferred.done(function(deferred) {
			return function() {
				deferred.resolve(companyId);
			};
		}(deferred)); // Use closure to bring local var (deferred) into
		// callback.
		return deferred;
	}

	/**
	 * get the current company-name.
	 *
	 * @returns a JQuery.deferred that will resolve to the 
	 * company-name of the current user when available. 
	 */
	this.getCompanyName = function() {
		var deferred = $.Deferred();
		initDeferred.done(function(deferred) {
			return function() {
				deferred.resolve(companyName);
			};
		}(deferred)); // Use closure to bring local var (deferred) into
		// callback.
		return deferred;
	}

	/**
	 * get the current data-model.
	 *
	 * The data-model is automatically kept up-to-date with the
	 * state of the platform.
	 *
	 * @returns a JQuery.deferred that will resolve to the 
	 * Lisa Api data model when available. 
	 */
	this.getModel = function() {
		var deferred = $.Deferred();

		modelCompleteDeferred.done(function(deferred) {
			return function() {
				deferred.resolve(Lisa.Connection.model);
			};
		}(deferred)); 

		modelCompleteDeferred.fail(function(deferred) {
			return function() {
				deferred.reject.apply(this, arguments);
			};
		}(deferred));

		return deferred;
	}

	/** Logging * */
	// Allow logging to be accessed statically (Lisa.Connection.logging) as well
	// as through the instance (this.logging).
	this.logging = Lisa.Connection.logging;

	/** XMPP event callbacks * */
	function connectionStatusChanged(status) {
		if (status == Strophe.Status.CONNECTING) {
			Lisa.Connection.logging.log('STATUS: Strophe is connecting.');
			Lisa.Connection.logging.status('Connecting...');
		} else if (status == Strophe.Status.CONNFAIL) {
			Lisa.Connection.logging.log('STATUS: Strophe failed to connect.');
			Lisa.Connection.logging.status('Connection failed.');
			initDeferred.reject("Connection failed.");
		} else if (status == Strophe.Status.DISCONNECTING) {
			Lisa.Connection.logging.log('STATUS: Strophe is disconnecting.');
			Lisa.Connection.logging.status('Disconnecting...');
		} else if (status == Strophe.Status.DISCONNECTED) {
			Lisa.Connection.logging.log('STATUS: Strophe is disconnected.');
			Lisa.Connection.logging.status('Disconnected...');
		} else if (status == Strophe.Status.CONNECTED) {
			Lisa.Connection.logging.log('STATUS: Strophe is connected!');
			Lisa.Connection.logging.status('Connected.');
			onConnected();
		} else if (status == Strophe.Status.AUTHFAIL) {
			Lisa.Connection.logging.log('STATUS: authentication failed');
			Lisa.Connection.logging.status('Authentication Failed.');
			initDeferred.reject("Authentication Failed.");
		}

		Lisa.Connection.connectionStatusObservable.notify(status);
	}

	function onConnected() {
		
		if (!self.retrieve_model)
			return;

		// set invisible, we don't want our user to get online
		self.setInvisible();
		self.sendInitialPresence();

		// Get company
		var iq = $iq({
			to : 'phone.' + Lisa.Connection.domain,
			type : 'get',
			id : connection.getUniqueId('lisa')
		}).c('request', {
			xmlns : Strophe.NS.LISA_REQUESTS,
			type: 'GET_COMPANY'
		});
		connection.sendIQ(iq, callback(onGetCompany), function() {
			initDeferred.reject("Service is down.");
		});

		// Get users
		iq = $iq({
			to : 'phone.' + Lisa.Connection.domain,
			type : 'get',
			id : connection.getUniqueId('lisa')
		}).c('request', {
			xmlns : Strophe.NS.LISA_REQUESTS,
			type: "GET"
		}).c('filter', {
			type: "user"
		});
		connection.sendIQ(iq, callback(processUser), function() {
			initDeferred.reject("get user failed - Lisa problem?");
		});

		// Get queues
		iq = $iq({
			to : 'phone.' + Lisa.Connection.domain,
			type : 'get',
			id : connection.getUniqueId('lisa')
		}).c('request', {
			xmlns : Strophe.NS.LISA_REQUESTS,
			type: "GET"
		}).c('filter', {
			type: "queue"
		});
		connection.sendIQ(iq, callback(processQueue), function() {
			initDeferred.reject("get queue failed - Lisa problem?");
		});

		// Get queues
		iq = $iq({
			to : 'phone.' + Lisa.Connection.domain,
			type : 'get',
			id : connection.getUniqueId('lisa')
		}).c('request', {
			xmlns : Strophe.NS.LISA_REQUESTS,
			type: "GET"
		}).c('filter', {
			type: "call"
		});
		connection.sendIQ(iq, callback(processCall), function() {
			initDeferred.reject("get call failed - Lisa problem?");
		});

	}

    function fixupJid(jid, server) {
        if (jid.indexOf("@") == -1) {
            // Old-style: jid is username
            return jid + "@" + server;
        } else {
            // New-style: jid is actual jid, server is connect hostname
            return jid;
        }
    }

    function setupRest() {
        // Setup REST server & often-used urls
        Lisa.Connection.restServer = Lisa.Connection.server.replace("uc.", "rest.");
        Lisa.Connection.restUserUrl = "https://" + Lisa.Connection.restServer + "/user/" + Lisa.Connection.myUserId;
        Lisa.Connection.restAuthHeader = "Basic " + btoa(Lisa.Connection.userName + ":" + Lisa.Connection.password);

        // Retrieve the identity
        restAjaxRequest(
            Lisa.Connection.restUserUrl + "/identities",
            null,
            function(response) {
                Lisa.Connection.restIdentityUrl = _.where(response, {order: 0})[0].self;
            },
            null,
            "GET"
        )
    }

    function restAjaxRequest(url, data, success, error, method) {
        $.ajax
        ({
            type: method || "POST",
            headers: {
                "Authorization": Lisa.Connection.restAuthHeader,
                "X-No-Redirect": true
            },
            url: url,
            dataType: 'json',
            data: JSON.stringify(data),
            success: success,
            error: error
        });
    }

	function processUser(xml) {
		$(xml).find('result').children().each(
				function(idx, user) {
					var userModel = xmlToUser($(user));
					if (userModel == null)
						return;
					Lisa.Connection.model.addUser(userModel);

					// Are we this user?
					if (userModel.jid == Lisa.Connection.jid) {
						Lisa.Connection.myUserId = userModel.id;
                        Lisa.Connection.userName = userModel.username;
						Lisa.Connection.logging.log("INFO: Found my userid: "
								+ Lisa.Connection.myUserId);
                        usersDone = true;

                        // Now we have an User ID, Setup REST
                        setupRest();
					}
				});
		isModelComplete();
	}

	function processQueue(xml) {
		$(xml).find('result').children().each(function(idx, queue) {
			var queueModel = xmlToQueue($(queue))
			Lisa.Connection.model.addQueue(queueModel);
		});
		queuesDone = true;
		isModelComplete();
	}

	function processCall(xml) {
        $(xml).find('result').children().each(function(idx, call) {
            var callModel = xmlToCall($(call), true)
            if (callModel)
                Lisa.Connection.model.addCall(callModel);
    });
         callsDone = true;
         isModelComplete();
    }

	function isModelComplete() {
		if (usersDone && queuesDone) {
			if (Lisa.Connection.myUserId == 0) {
				Lisa.Connection.logging
						.log("ERROR: Model complete, but couldn't find own user.");
				modelCompleteDeferred.fail();
				connectionStatusChanged(Strophe.Status.CONNFAIL);
				return false;
			}

			Lisa.Connection.logging.log("INFO: Initial model complete!")
			modelCompleteDeferred.resolve();
			return true;
		}
		return false;
	}

	function onMessageReceived(stanza) {
		Lisa.Connection.logging.log("INFO: Message Received");
	}

	function onPubsubReceived(stanza) {
		Lisa.Connection.logging.log("INFO: Pubsub Received.")
		var state = $(stanza).find('subscription').attr('subscription');
		if (state) {
			Lisa.Connection.logging.log("INFO: Subscription state: " + state)
			onSubscribe(stanza);
		}

		$('item', stanza).each(
				function(idx, item) {
					item = $(item).children(":first");
					if (item.prop('nodeName') == 'notification') {
						onReceiveNotification(item);
					} else {
						Lisa.Connection.logging('Unknown message: '
								+ item.prop('nodeName'));
					}
				});
	}

	function onGetCompany(stanza) {
		Lisa.Connection.logging.log("INFO: Get Company Received;")
		Lisa.Connection.logging.status("Subscribing...")
		
		// Retrieve company id and name
		companyId = $(stanza).find('result').find('id').text();
		companyName = $(stanza).find('result').find('name').text();
		
		// Subscribe to company pubsub stream
		// NOTE: not using strophe's subscribe here; we want to subscribe using
		// our full jid, not bare jid
		var node = companyId;
		var iq = $iq({
			to : connection.PubSub.service,
			type : 'set',
			id : connection.getUniqueId('pubsub')
		}).c('pubsub', {
			xmlns : Strophe.NS.PUBSUB
		}).c('subscribe', {
			node : node,
			jid : connection.jid
		}).up().c('options')
		.c('x', {
			xmlns : 'jabber:x:data',
			type: 'submit'
		}).c('field', {
			var: 'FORM_TYPE',
			type: 'hidden'
		}).c('value', {}, 'http://jabber.org/protocol/pubsub#subscribe_options')
		.up().c('field', {
			var: 'pubsub#expire',
			type: 'text-single'
		}).c('value', {}, 'presence');

		connection.sendIQ(iq, onSubscribe, callback(function() {
			initDeferred.reject("Sending Subscription request failed.");
		}));
	}

	// Called through onGetCompany, or through onPubsubReceived.
	function onSubscribe(stanza) {
		var state = $(stanza).find('subscription').attr('subscription');
		if (state == 'pending') {
			// Waiting for 'subscribed'.
		} else if (state == 'subscribed') {
			onSubscribed();
		} else {
			initDeferred.reject("Subscription failed");
		}
	}

	function onSubscribed() {
		Lisa.Connection.logging.log("INFO: Subscribed Received;")
		Lisa.Connection.logging.status("Subscribed.")
		initDeferred.resolve(); // Mark initialisation as completed.
	}

	function onReceiveNotification(msg) {
		Lisa.Connection.logging.log("INFO: Notification Received;");
		var type = msg.attr('type');
		if (type.indexOf('notification.call') == 0) {
			if (type == 'notification.call.end') {
				var callId = msg.find("callId").text();
				var call = findOrCreateCall(callId);
				Lisa.Connection.model.removeCall(call);
			} else if (type == 'notification.call.start') {
				var call = msg.find('call');
				var callModel = xmlToCall(call);
				Lisa.Connection.model.addCall(callModel);
			} else if (type == 'notification.call.update') {
				var call = msg.find('call');
				var callModel = xmlToCall(call);
                Lisa.Connection.model.addCall(callModel);
            }
		} else if (type.indexOf('notification.queueMember') == 0) {
			var member = msg.find('member');
			xmlToQueueMember(type, member);
		} else if (type.indexOf('notification.queue.call') == 0) {
			xmlToQueueCall(type, msg);
		} else if (type.indexOf('notification.queue.update') == 0) {
			xmlQueueUpdate(msg);
		} else if (type.indexOf('notification.user.update') == 0) {
			xmlUserUpdate(msg);	
		} else if (type.indexOf('notification.user.status') == 0) {
			var userXml = msg.find('user');
			var user = xmlToUser(userXml);
			Lisa.Connection.model.addUser(user);
		}
	}

	function callback(cb) {
		// Callback wrapper with
		// (1) proper error reporting (Strophe swallows errors)
		// (2) always returns true to keep the handler installed
		return function() {
			try {
				cb.apply(this, arguments);
			} catch (e) {
				Lisa.Connection.logging
						.log('ERROR: ' + (e.stack ? e.stack : e));
			}

			// Return true to keep calling the callback.
			return true;
		};
	}

	// Set ourselves to invisible mode.
	this.setInvisible = function() {

		var iq1 = $iq({
			type : 'set',
			id : connection.getUniqueId('lisa')
		}).c('query', {
			xmlns : 'jabber:iq:privacy'
		}).c('list', {
			name : 'invisible'
		}).c('item', {
			action : 'deny',
			order : '1'
		}).c('presence-out', {});
		var iq2 = $iq({
			type : 'set',
			id : connection.getUniqueId('lisa')
		}).c('query', {
			xmlns : 'jabber:iq:privacy'
		}).c('active', {
			name : 'invisible'
		});

		connection.send(iq1);
		connection.send(iq2);
	};

	this.sendInitialPresence = function() {
		var pres = $pres().c('priority').t('1');

		connection.send(pres);
	}

	function xmlToUser(user) {
		var id = user.attr('id');
		var userModel = findOrCreateUser(id);
		userModel.name = user.find('name').text();
		userModel.loggedIn = (user.find('loggedIn').text() == "true");
		// assume just 1 extension, for now
		userModel.extension = user.find('extensions').text();
        // Backward compatibility with the pre 05/2014 Lisa that would send a username as 'xmppJid' field.
        var apiJid = user.find('identifiers').find('xmppJid').text();
		userModel.jid = fixupJid(apiJid, Lisa.Connection.server);
		userModel.username = user.find('identifiers').find('compassId').text();
		return userModel;
	}

	function findOrCreateUser(id) {
		var userModel = Lisa.Connection.model.users[id];
		if (userModel == null) {
			userModel = new Lisa.User();
		}
		userModel.id = id;
		return userModel;
	}

	function xmlToQueueMember(type, member) {
		var queueId = member.find('queueId').text();
		var queue = Lisa.Connection.model.getQueue(queueId);
		var userId = member.find('userId').text();
		var user = Lisa.Connection.model.getUser(userId);

		if (user && queue) {
			if (type.indexOf('notification.queueMember.enter') == 0) {
				queue.addUser(user);
				user.addQueue(queue);
				Lisa.Connection.logging.log("Added user " + user + 
											" to queue " + queue);
			} else if (type.indexOf('notification.queueMember.leave') == 0) {
				queue.removeUser(user);
				user.removeQueue(queue);
				Lisa.Connection.logging.log("Removed user " + user +
									 		" from queue " + queue);
			}
		}
	}

	function xmlToQueueCall(type, notification) {
		var queueId = notification.find('queueId').text();
		var queue = Lisa.Connection.model.getQueue(queueId);
		var queueCall = notification.find('queueCall');
		var callId = queueCall.find('callId').text();
		var call = Lisa.Connection.model.getCall(callId);

		if (queue && call) {
			if (type.indexOf('notification.queue.call.enter') == 0) {
				queue.addCall(call);
			} else if (type.indexOf('notification.queue.call.leave') == 0) {
				queue.removeCall(call);
			}
		} else {
			Lisa.Connection.logging.warn("Couldn't find queue " + queue +
										 " or call " + call + " " + callId);	
		}
	}

	function xmlToQueue(queue) {
		var id = queue.attr('id');

		var queueModel = findOrCreateQueue(id);

		queueModel.name = queue.find('name').text();

		// User-entries
		queueModel.users = {};
		queue.find('userEntries').children().each(
				function(queueModel) {
					return function(idx, child) {
						var userId = $(child).find('userId').text();
						var user = Lisa.Connection.model.users[userId];
						if (user) {
							queueModel.addUser(user);
							user.addQueue(queueModel);
							Lisa.Connection.logging.log("Added user " + user
									+ " to queue " + queueModel);
						}
					}
				}(queueModel));

		// call-entries
		queueModel.calls = {};
		queue.find('callIds').children().each(function(queueModel) {
			return function(idx, child) {
				var callId = $(child).text();
				var call = findOrCreateCall(callId);
				call.id = callId;
				queueModel.calls[callId] = call;
			}
		}(queueModel));

		// Statistics     
		queueModel.maxWait = getStatistic(queue, "maxWait");
		queueModel.averageWait = getStatistic(queue, "averageWait");
		queueModel.totalWait = getStatistic(queue, "totalWait");
		queueModel.handledCalls = getStatistic(queue, "handledCalls");
		queueModel.totalCalls = getStatistic(queue, "totalCalls");

		return queueModel;
	}

	function xmlQueueUpdate(notification) {
		var queueId = notification.find('queueId').text();
		var queue = Lisa.Connection.model.getQueue(queueId);
		if (queue == null) {
			Lisa.Connection.logging.warn("Received notification for unknown queue id " + queueId);
			return;	
		}

		statisticsUpdate(notification, queue);
	}

	function xmlUserUpdate(notification) {
		var userId = notification.find('userId').text();
		var user = Lisa.Connection.model.getUser(userId);
		if (user == null) {
			Lisa.Connection.logging.warn("Received notification for unknown user id " + userId);
			return;	
		}

		notification.children().each(function(user) {
			return function (idx, child) {
				if (child.nodeName == "propertyChange") {
					var name = $(child).find("name").text();
					var value = $(child).find("newValue").text();
					if (name == "loggedIn") {
						user.loggedIn = (value == "true");
						user.observable.notify(user);
					}
				}
			}
		}(user));
	}

	function statisticsUpdate(notificationXml, queueModel) {
		notificationXml.children().each(function(queueModel) {
			return function (idx, child) {
				if (child.nodeName == "propertyChange") {
					var statistic = $(child).find("name").text();
					var statValue = $(child).find("newValue").text();
					queueModel[statistic] = statValue;
					queueModel.observable.notify(queueModel);
				}
			}
		}(queueModel));		
	}

	function getStatistic(queueXml, elementName) {
		var statistic = queueXml.find(elementName).text();
		return (statistic == '') ? 0 : parseInt(statistic);
	}

	function findOrCreateCall(id) {
		var callModel = Lisa.Connection.model.calls[id];
		if (callModel == null) {
			callModel = new Lisa.Call();
		}
		callModel.id = id;
		return callModel;
	}

	function findOrCreateQueue(id) {
		var queueModel = Lisa.Connection.model.queues[id];
		if (queueModel == null) {
			queueModel = new Lisa.Queue();
		}
		queueModel.id = id;
		return queueModel;
	}

	function xmlToCall(call, initialData) {
		
		initialData = initialData || false;

		var id = call.attr('id');
		var callModel = findOrCreateCall(id);

		// Source
		var src = call.find('source');
		if (initialData && src.find('timeEnd').length != 0) {
            Lisa.Connection.logging.log("Call " + callModel.id + 
            	                        " already ended source. Not adding to model.");
            return null;
        }
		
		var sourceUser = null
		if (src.attr('type') == 'User') {
			var userId = src.find('userId').text();
			var sourceUser = findOrCreateUser(userId);
		}
		// Remove the call from the original source user; 
		// After changing the sourceUser, we won't remember the original sourceuser anymore.
		if (callModel.sourceUser && (callModel.sourceUser != sourceUser)) {
			callModel.removeUser(callModel.sourceUser);
		}
		callModel.sourceUser = sourceUser;
		callModel.source = src;

		// Destination
		var dst = call.find('destination');
		if (initialData && dst.find('timeEnd').length != 0) {
            Lisa.Connection.logging.log("Call " + callModel.id + 
            						    " already ended destination. Not adding to model.");
            return null;
        }
		
		var destinationUser = null;
		if (dst.attr('type') == 'User') {
			var userId = dst.find('userId').text();
			var destinationUser = findOrCreateUser(userId);
			
		}
		// Remove the call from the original destination user; 
		// After changing the destinationUser, we won't remember the original destinationUser anymore.
		if (callModel.destinationUser && (callModel.destinationUser != destinationUser)) {
			callModel.removeUser(callModel.destinationUser);
		}
		callModel.destinationUser = destinationUser;
		callModel.destination = dst;

        callModel.state = call.find('state').text();

		return callModel;
	}

}

/* Logging functionality */
Lisa.Connection.logging = new function() {
	this.cb = undefined;
	this.statusCb = undefined;
	this.loggingObservable = new Lisa.Observable();
	this.statusObservable = new Lisa.Observable();

	this.setCallback = function(callback) {
		this.loggingObservable.addObserver(callback);
	}

	this.setStatusCallback = function(callback) {
		this.statusObservable.addObserver(callback)
	}

	this.log = function(logMsg) {
		Lisa.Connection.logging.loggingObservable.notify(logMsg);
	}

	this.warn = function(logMsg) {
		Lisa.Connection.logging.log("WARNING: " + logMsg);
	}

	this.status = function(statusMsg) {
		Lisa.Connection.logging.statusObservable.notify(statusMsg);
	}

	this.logInput = function(data) {
		Lisa.Connection.logging.log("RECV: " + data);
	}

	this.logOutput = function(data) {
		Lisa.Connection.logging.log("SENT: " + data);
	}

	Strophe.error = this.log;

}();
