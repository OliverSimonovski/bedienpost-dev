// This is a basic and incomplete Javascript implementation of the
// data model of Compass.
// 
// It handles events for users, calls and queues.
// The Compass data model, codenamed Lisa, is internally represented
// by Javascript objects. 
//
// Version: __VERSION__

// JS namespace declaration
var Lisa = {};

// XML Namespaces
Strophe.addNamespace('LISA_REQUESTS', 
		'http://talkto.nl/lisa/requests');
Strophe.addNamespace('LISA_NOTIFICATIONS',
		'http://talkto.nl/lisa/notifications');

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

/* Bare minimum - we might want to store more data */
Lisa.User = function() {
	this.id = "";
	this.name = "";
	this.jid = "";
	this.extension = "";
	this.calls = {};
	this.queues = {};
	this.loggedIn = false;

	this.toString = function() {
		return "(User:" + this.id + ":" + this.name + ",l:" + this.loggedIn
				+ ")";
	}
	this.observable = new Lisa.Observable();
}

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

	this.toString = function() {
		return "(Queue:" + this.id + ":" + this.name + ")";
	}
	this.observable = new Lisa.Observable();
}

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
}

// FIXME: Fit nicely in a class somewhere.
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
		
		Lisa.Connection.logging.log("MODEL: Added or updated call " + call);
		if (newCall) {
			this.callListObservable.notify(call, 'add');
		} else {
			call.observable.notify(call);
		}
		
		// If the call contains users, attach them to the right user-objects in
		// the data model.
		// FIXME: Maybe the connector should be doing this.
		if (call.sourceUser) {
			call.sourceUser.calls[call.id] = call;
			call.sourceUser.observable.notify(call.sourceUser);
		}
		if (call.destinationUser) {
			call.destinationUser.calls[call.id] = call;
			call.destinationUser.observable.notify(call.destinationUser);
		}
	}

	this.removeCall = function(call) {
		var foundCall = this.calls[call.id];
		if (foundCall == null) {
			Lisa.Connection.logging
					.log("MODEL: WARNING: Request to remove call, but call not in data model."
							+ call);
			return;
		}

		// Delete the call.
		delete this.calls[foundCall.id];

		// Delete the call from all objects that might refer to it.
		if (foundCall.sourceUser) {
			delete foundCall.sourceUser.calls[foundCall.id];
			foundCall.sourceUser.observable.notify(foundCall.sourceUser);
		}
		if (foundCall.destinationUser) {
			delete foundCall.destinationUser.calls[foundCall.id];
			foundCall.destinationUser.observable.notify(foundCall.destinationUser);
		}
		if (foundCall.queue) {
			delete foundCall.queue.calls[foundCall.id];
			foundCall.queue.observable.notify(foundCall.queue);
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

	/*
	 * this.removeQueue = function(queue){ }
	 */

	this.addUser = function(user) {
		if (user == null) {
			return;
		}

		Lisa.Connection.logging.log("MODEL: Added user " + user);
		var newUser = (this.users[user.id] == null);
		this.users[user.id] = user;

		// Notifications
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
			Lisa.Connection.logging.log("queues for this user: " + user.queues);
			for ( var queueId in user.queues) {
				// Delete user from queue as well.
				var queue = this.queues[queueId];
				delete queue.users[user.id];
				Lisa.Connection.logging.log("Deleted user " + user
						+ "from queue" + queue);

				// Notify any queues this user might be in.
				queue.observable.notify(queue);
			}
		}

		this.userListObservable.notify(this, user);
	}
	
	this.getUser = function(id) {
		return this.users[id];
	};
	
	this.getQueue = function(id) {
		return this.queues[id];
	};
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

Lisa.Connection = function() {

	var connection;
	var companyId;
	var initDeferred = $.Deferred();
	var modelCompleteDeferred = $.Deferred();
	var usersDone = false;
	var queuesDone = false;

	this.bosh_port = 5281;
	this.use_ssl = true;
	this.log_xmpp = false;

	Lisa.Connection.connectionStatusObservable = new Lisa.Observable();
	this.connectionStatusObservable = Lisa.Connection.connectionStatusObservable;

	Lisa.Connection.model = new Lisa.Model();
	this.model = Lisa.Connection.Model;

	Lisa.Connection.myUserId = 0;
	Lisa.Connection.userName = "";
	var myUserId = Lisa.Connection.myUserId;
	var userName = Lisa.Connection.userName;

	this.setupConnection = function(server, username) {
		// configuration
		Lisa.Connection.server = server;
		Lisa.Connection.userName = username;
		Lisa.Connection.logging.log("My username: " + Lisa.Connection.userName);

		// Setup strophe connection
		var protocol = this.use_ssl ? 'https' : 'http';
		var bosh_service = protocol + '://' + server + ':' + this.bosh_port
				+ '/http-bind';
		connection = new Strophe.Connection(bosh_service);
		if (this.log_xmpp) {
			connection.rawInput = this.logging.logInput;
			connection.rawOutput = this.logging.logOutput;
		}

		// Attach callbacks...
		connection.addHandler(callback(function(stanza) {
			onMessageReceived(stanza);
			return true;
		}), null, 'message', null, null, null);
		connection.addHandler(callback(function(stanza) {
			onPubsubReceived(stanza);
			return true;
		}), null, 'message', null, null, connection.PubSub.service);

		// create jQuery deferred to communicate initialisation success or
		// error.
		initDeferred.fail(Lisa.Connection.logging.log);
		initDeferred.fail(function() {
			modelCompleteDeferred.reject();
		});
		return initDeferred;
	}

	/* Connect to the XMPP server through BOSH */
	this.connect = function(server, username, password, resource) {

		this.setupConnection(server, username);

		// Configuration
		resource = resource || "LisaApi" + "_" + randomstring(10);
		var jid = username + '@' + server + '/' + resource;

		// .. and connect.
		connection.connect(jid, password, connectionStatusChanged);
	}

	/** Attach to a previous BOSH session * */
	this.attach = function(server, jid, sid, rid) {

		var username = jid.substring(0, jid.indexOf('@'));
		this.setupConnection(server, username);

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

	this.disconnect = function() {
		// Switch to using synchronous requests
		// since this is typically called
		// onUnload.
		this.connection.sync = true;
		this.connection.flush();
		this.connection.disconnect();
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

	/* Actions */

	this.dialNumber = function(number) {
		var iq = $iq({
			to : 'phone.' + Lisa.Connection.server,
			type : 'set',
			id : connection.getUniqueId('lisa')
		}).c('action', {
			xmlns : Strophe.NS.LISA_REQUESTS,
			name : 'dial'
		}).c('dial').c('destinationNumber').t(number);
		return this.sendIQ(iq);
	}

	this.dialUser = function(user) { // user-object.
		var iq = $iq({
			to : 'phone.' + Lisa.Connection.server,
			type : 'set',
			id : connection.getUniqueId('lisa')
		}).c('action', {
			xmlns : Strophe.NS.LISA_REQUESTS,
			name : 'dial'
		}).c('dial').c('destinationUserId').t(user.id);
		return this.sendIQ(iq);
	}

	this.queueLogin = function(queue, user) { // queue-object.
		var userId = user ? user.userId : Lisa.Connection.myUserId;

		var iq = $iq({
			to : 'phone.' + Lisa.Connection.server,
			type : 'set',
			id : connection.getUniqueId('lisa')
		}).c('action', {
			xmlns : Strophe.NS.LISA_REQUESTS,
			name : 'queuelogin'
		}).c('queuelogin').c('userId').t(userId).up().c('queueId').t(queue.id);
		return this.sendIQ(iq);
	}

	this.queueLogout = function(queue, user) { // queue-object.
		var userId = user ? user.userId : Lisa.Connection.myUserId;

		var deferred = $.Deferred();
		var iq = $iq({
			to : 'phone.' + Lisa.Connection.server,
			type : 'set',
			id : connection.getUniqueId('lisa')
		}).c('action', {
			xmlns : Strophe.NS.LISA_REQUESTS,
			name : 'queuelogout'
		}).c('queuelogout').c('userId').t(userId).up().c('queueId').t(queue.id);
		return this.sendIQ(iq);
	}

	/* One-off getters */
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

	this.getModel = function() {
		var deferred = $.Deferred();
		modelCompleteDeferred.done(function(deferred) {
			return function() {
				deferred.resolve(Lisa.Connection.model);
			};
		}(deferred)); // Use closure to bring local var (deferred) into
		// callback.
		modelCompleteDeferred.fail(function() {
			deferred.reject();
		});
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
		}

		Lisa.Connection.connectionStatusObservable.notify(status);
	}

	function onConnected() {
		// set invisible, we don't want our user to get online
		setInvisible();

		// get company
		// $('#status').text('Getting company info...');
		var iq = $iq({
			to : 'phone.' + Lisa.Connection.server,
			type : 'get',
			id : connection.getUniqueId('lisa')
		}).c('getcompany', {
			xmlns : Strophe.NS.LISA_REQUESTS
		});
		connection.sendIQ(iq, callback(onGetCompany), function() {
			initDeferred.reject("Lisa is down.");
		});

		// retrieve userlist
		iq = $iq({
			to : 'phone.' + Lisa.Connection.server,
			type : 'get',
			id : connection.getUniqueId('lisa')
		}).c('get', {
			xmlns : Strophe.NS.LISA_REQUESTS
		}).c('user', {});
		connection.sendIQ(iq, callback(processUser), function() {
			initDeferred.reject("get user failed - Lisa problem?");
		});

		// retrieve queuelist
		iq = $iq({
			to : 'phone.' + Lisa.Connection.server,
			type : 'get',
			id : connection.getUniqueId('lisa')
		}).c('get', {
			xmlns : Strophe.NS.LISA_REQUESTS
		}).c('queue', {});
		connection.sendIQ(iq, callback(processQueue), function() {
			initDeferred.reject("get queue failed - Lisa problem?");
		});

		    // retrieve call-list
    	iq = $iq({
    		to: 'phone.' + Lisa.Connection.server,
    		type: 'get', id: connection.getUniqueId('lisa')
    	}).c('get', {
    		xmlns: Strophe.NS.LISA_REQUESTS
    	}).c('call', {});
    	connection.sendIQ(iq, callback(processCall), function() {
    		initDeferred.reject("get calls failed - Lisa problem?");
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
					if (userModel.jid == Lisa.Connection.userName) {
						Lisa.Connection.myUserId = userModel.id;
						Lisa.Connection.logging.log("INFO: Found my userid: "
								+ Lisa.Connection.myUserId);
					}
				});
		usersDone = true;
		isModelComplete(); // FIXME: After one user? Ofcourse not.
	}

	function processQueue(xml) {
		$(xml).find('result').children().each(function(idx, queue) {
			var queueModel = xmlToQueue($(queue))
			Lisa.Connection.model.addQueue(queueModel);
			// add_queue(queue); // TODO
		});
		queuesDone = true;
		isModelComplete(); // FIXME: After one user? Ofcourse not.
	}

	function processCall(xml) {
        $(xml).find('result').children().each(function(idx, call) {
            var callModel = xmlToCall($(call), true)
            if (callModel)
                Lisa.Connection.model.addCall(callModel);
            //add_queue(queue); // TODO
    });
         callsDone = true;
         isModelComplete(); // FIXME: After one user? Ofcourse not.
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

		// TODO: filter on pubsub namespace
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

		// Subscribe to company pubsub stream
		companyId = $(stanza).find('result').find('id').text();
		companyName = $(stanza).find('result').find('name').text();
		
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
		}).c('value', {}, 'http://jabber.org/protocol/pubsub#subscribe_options');
		/*
		.up().c('field', {
			var: 'pubsub#expire',
			type: 'text-single'
		}).c('value', {}, 'presence');*/
		
		
		connection.sendIQ(iq, onSubscribe, callback(function() {
			initDeferred.reject("Sending Subscription request failed.");
		}));
	}

	// Called through onGetCompany, or through onPubsubReceived.
	function onSubscribe(stanza) {
		var state = $(stanza).find('subscription').attr('subscription');
		if (state == 'pending') {
			// Wait some more...
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
			var call = msg.find('call');
			var callModel = xmlToCall(call);
			if (callModel) {
                if (type == 'notification.call.start') {
                    Lisa.Connection.model.addCall(callModel);
                } else if (type == 'notification.call.update') {
                     Lisa.Connection.model.addCall(callModel);
                } else if (type == 'notification.call.end') {
                    Lisa.Connection.model.removeCall(callModel);
                }
            }
		} else if (type.indexOf('notification.queue') == 0) {
			var queueXml = msg.find('queue');
			var queue = xmlToQueue(queueXml);
			Lisa.Connection.model.addQueue(queue);
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

	function setInvisible() {

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
		var pres = $pres().c('priority').t('1');

		connection.send(iq1);
		connection.send(iq2);
		connection.send(pres);
	}

	/* Private utility functions */
	function xmlToUser(user) {
		var id = user.attr('id');
		var userModel = findOrCreateUser(id);
		userModel.name = user.find('name').text();
		userModel.loggedIn = (user.find('loggedIn').text() == "true");
		userModel.extension = user.find('properties').find('extension').text();
		userModel.jid = user.find('identifiers').find('xmppjid').text();
		return userModel;
	}

	function findOrCreateUser(id) {
		var userModel = Lisa.Connection.model.users[id];// new Lisa.User();
		if (userModel == null) {
			userModel = new Lisa.User();
		}
		userModel.id = id;
		return userModel;
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
							queueModel.users[userId] = user; // Only count
							// users that
							// exist in the
							// model.
							user.queues[queueModel.id] = queueModel;
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
		queueModel.maxWait = getStatistic(queue, "maxwait");
		queueModel.averageWait = getStatistic(queue, "averagewait");
		queueModel.totalWait = getStatistic(queue, "totalwait");
		queueModel.handledCalls = getStatistic(queue, "handledcalls");
		queueModel.totalCalls = getStatistic(queue, "totalcalls");

		return queueModel;
	}

	function getStatistic(queueXml, elementName) {
		var statistic = queueXml.find('properties').find(elementName).text();
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
        callModel.source = src;
        if (callModel.source.attr('type') == 'User') {
                // Outgoing call.
                var userId = src.find('userId').text();
                var user = findOrCreateUser(userId);
                callModel.sourceUser = user;
        }

		// Destination
		var dst = call.find('destination');
        if (initialData && dst.find('timeEnd').length != 0) {
            Lisa.Connection.logging.log("Call " + callModel.id + 
            						    " already ended destination. Not adding to model.");
            return null;
        }
        callModel.destination = dst;
        if (callModel.destination.attr('type') == 'User') {
                // Outgoing call.
                var userId = dst.find('userId').text();
                 var user = findOrCreateUser(userId);
                user.id = userId;
                callModel.destinationUser = user;
        }


        var state = call.find('properties').find('compass__callstate').text();
        switch (state) {
        	case "ring":
        		 callModel.state = "RINGING";
        		 break;
        	case "answered":
        		 callModel.state = "ANSWERED";
        		 break;
        	case "conn":
        		 callModel.state = "CONNECTING";
        		 break;
        	default:
        		 callModel.state = "UNKNOWN";
        		 break;
        }

		return callModel;
	}

}

/* Logging functionality */

// Since callbacks change the contents of 'this', assign statically.
Lisa.Connection.logging = new function() {
	this.cb = undefined;
	this.statusCb = undefined;
	this.loggingObservable = new Lisa.Observable();
	this.statusObservable = new Lisa.Observable();
	Strophe.error = this.log;

	this.setCallback = function(callback) {
		this.loggingObservable.addObserver(callback);
	}

	this.setStatusCallback = function(callback) {
		this.statusObservable.addObserver(callback)
	}

	this.log = function(logMsg) {
		Lisa.Connection.logging.loggingObservable.notify(logMsg);
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

}();
