Lisa Javascript XMPP Library
=============

WARNING
---------
The code in this branch can only be used with the XMPP API of the Compass platform before the 'Durrenstein' release, which is scheduled for the beginning of 2014.
As such, this code will be obsolete very soon. 


Overview
---------

The Lisa Javascript XMPP Library is a javascript library that can be used to connect, retrieve data from, and retrieve notifications from the XMPP API on the IPerity Compass telephony platform.
The library is designed to run as local javascript in a clients web-browser.

After connecting, the library maintains a local datamodel that's automatically and constantly kept up to date from the server. Clients can explore the data-model, and listen for changes on the datamodel.

Requirements
---------

The library depends on a number of other javascript libraries to run:

* JQuery (http://jquery.com/download/)
* JQuery UI (http://jqueryui.com/download/)
* Underscore.js (http://underscorejs.org/)
* Backbone.js (http://backbonejs.org/)
* Strophe.js (http://strophe.im/strophejs/)
* Strophe pubsub plugin (https://github.com/ggozad/strophe.plugins)


Quickstart
---------

* Create a .html page including all required javascript in separate `<script>` tags.
* Include the LisaApi.js as well.

In javascript:

* create the 'connection' object with `var conn = new Lisa.Connection();`
* configure the correct ssl bosh port with `conn.bosh_port = 5280;`
* connect with `conn.connect("hostname","username", "password");`
* Set a callback to trigger when the model is received with `conn.getModel().done(function(model){});`

The model is retrieved through the `conn.getModel().done` callback. Since `conn.getModel()` returns a JQuery Deferred object, this call can be used multiple times.

With the model:

* Explore the users, queues, and calls on the platform with the model.users, models.queues, and models.calls arrays. Each array is keyed by item-id.
* To listen for changes, Callbacks can be attached with a `.observable.addObserver(function(model) {});` call .
* Observers can be attached anywhere in the three. For example: `model.users["1"].observable` works, but so does `_.first(model.users["1"].queues).observable`. 
 

Optionally:

* Configure logging:
```
conn.logging.setCallback(function(msg) {
    console.log(msg);
  });
```

*(much) more documentation + code samples are forthcoming.*
 
