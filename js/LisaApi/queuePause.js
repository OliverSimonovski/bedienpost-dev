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
        if (type == Lisa.User.EventTypes.CallRemoved) {
            var call = item;
            var lastQueue = item.lastQueue;
            //console.log("Last queue that this call went through:" + lastQueue);

            if (lastQueue) {
                // Determine whether this queue has a pause-time.
                var pauseTime = this.pauseTimes[lastQueue.id];

                if (pauseTime && (pauseTime > 0)) {
                    Lisa.Connection.logging.log("Pausing this user for " + pauseTime + " seconds");
                    this.conn.queuePause(lastQueue);
                    _.delay(function(conn, queue) {
                        conn.queueUnpause(queue);
                    }, pauseTime * 1000, this.conn, lastQueue);
                }
            }
        }
    }


}).call(this);