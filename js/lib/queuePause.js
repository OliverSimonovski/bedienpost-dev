(function() {

    /*
     * Attach library under QueuePause global.
     * Can be accessed as 'lib' within the library
     */
    var root = this;

    /*
     * Constructor
     * @arg conn        - LisaApi Connection.
     * @arg pauseTimes  - object in format {queueId: time-to-pause-in-seconds}.
     */
    var lib = root.QueuePause = function(conn, pauseTimes) {
        _.bindAll(this, 'modelReady', 'changePauseTimes', 'currentUserChanged');

        this.conn = conn;
        this.pauseTimes = {};                       // {queueId: 10}}

        this.pauseTimes = pauseTimes || {};

        conn.getModel().done(this.modelReady);

    };

    root.QueuePause.prototype.changePauseTimes = function(pauseTimes) {
        this.pauseTimes = pauseTimes;
    }

    root.QueuePause.prototype.modelReady = function() {
        listenToAllQueues();
        model.queueListObservable.addObserver(function() {
            listenToAllQueues(model);
        });

        this.conn.model.users[Lisa.Connection.myUserId].observable.addObserver(this.currentUserChanged);
    }

    function listenToAllQueues() {
        for (queueId in model.queues) {

            // the model.users array contains all users, keyed by user-id.
            var queue = model.queues[queueId];

            // Then, subscribe or re-subscribe to changes on the user.
            queue.observable.removeObserver(queueChanged);
            queue.observable.addObserver(queueChanged);
        }
    }

    /* One of the queues that we're watching has changed */
    function queueChanged(queue, type, item) {
           if (type == Lisa.Queue.EventTypes.CallAdded) {
               var call = item;
               call.lastQueue = queue;
           }
    }

    root.QueuePause.prototype.currentUserChanged = function (user, type, item) {
        var call = item;
        var lastQueue = item ? item.lastQueue : null;
        var pauseTime = lastQueue ? this.pauseTimes[lastQueue.id] : 0;  // Determine whether this queue has a pause-time.

        // No pause-time configured for queue. Return.
        if (!(pauseTime && (pauseTime > 0))) {
            return;
        }

        if (type == Lisa.User.EventTypes.CallAdded) {
            Lisa.Connection.logging.log("Pausing this user for queue " + lastQueue);
            this.conn.pauseAllQueues();

        } else if (type == Lisa.User.EventTypes.CallRemoved) {

                Lisa.Connection.logging.log("Starting wrap-up time for this user for " + pauseTime + " seconds");
                lastQueue.observable.notify(lastQueue, "autoPaused", pauseTime, call);

                _.delay(function(conn, queue) {
                    this.conn.unpauseAllQueues();
                    queue.observable.notify(queue, "autoUnpaused");
                }, pauseTime * 1000, this.conn, lastQueue);

        }
    }

}).call(this);