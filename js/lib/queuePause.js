(function() {

    /*
     * Attach library under QueuePause global.
     * Can be accessed as 'lib' within the library
     */
    var root = this;

    /*
     * Variables
     */

    var userUnpauseTimer = null;

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
           if (type == Lisa.Queue.EventTypes.CallRemoved) {
               var call = item;
               call.lastQueue = queue;
               Lisa.Connection.logging.log("AutoPause: Call " + call.id + " removed from queue " + queue.name + ". Setting lastQueue var for call");
           }
    }

    /**
     * Stop the automatic unpause-timer, for example because the user already unpaused himself manually.
     */
    root.QueuePause.prototype.stopUnpauseTimer = function() {
        Lisa.Connection.logging.log("AutoPause: Manually stopping wrap-up time for this user.");
        clearTimeout(userUnpauseTimer);
        userUnpauseTimer = null;
    }

    root.QueuePause.prototype.currentUserChanged = function (user, type, item) {
        var call = item;
        var lastQueue = item ? item.lastQueue : null;
        var pauseTime = lastQueue ? this.pauseTimes[lastQueue.id] : 0;  // Determine whether this queue has a pause-time.

        if ((type == Lisa.User.EventTypes.CallAdded)) {
            console.log("AutoPause: User " + user + " Received call " + call + " from queue " + lastQueue + ".");
            if (lastQueue) console.log("" + _.size(lastQueue.calls) + " calls left in queue " + lastQueue);
        }

        // No pause-time configured for queue. Return.
        if (!(pauseTime && (pauseTime > 0))) {
            console.log("AutoPause: No pauseTime configured or pauseTime is 0 for queue " + lastQueue + "... not pausing.");
            return;
        }

        if (type == Lisa.User.EventTypes.CallAdded && !lastQueue.paused) {
            Lisa.Connection.logging.log("AutoPause: Pausing this user for all queues");
            this.conn.pauseAllQueues();

        } else if (type == Lisa.User.EventTypes.CallRemoved) {

                Lisa.Connection.logging.log("AutoPause: Starting wrap-up time for this user for " + pauseTime + " seconds");
                lastQueue.observable.notify(lastQueue, "autoPaused", pauseTime, call);

                if (userUnpauseTimer != null) {
                    // Kill the previous timer first.
                    this.stopUnpauseTimer();
                }

                userUnpauseTimer = _.delay(function(conn, queue) {
                    Lisa.Connection.logging.log("AutoPause: Wrap-up time expired, unpausing this user.");
                    this.conn.unpauseAllQueues();
                    queue.observable.notify(queue, "autoUnpaused");
                    userUnpauseTimer = null;
                }, pauseTime * 1000, this.conn, lastQueue);

        }
    }

}).call(this);