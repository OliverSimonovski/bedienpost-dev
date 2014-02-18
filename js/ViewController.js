// Overall viewmodel for this screen, along with initial state


function UserListItem(id, name, ext, log, avail, ringing) {
    _.bindAll(this, 'startCall', 'noCalls', 'setFavorite');

    this.id = ko.observable(id                            || "");
    this.name = ko.observable(name                        || "");
    this.ext = ko.observable(ext                          || "");
    this.log = ko.observable(log                          || false);
    this.avail = ko.observable(avail                      || false);
    this.ringing = ko.observable(ringing                  || false);

    this.connectedName = ko.observable("");
    this.connectedNr = ko.observable("");
    this.favorite = ko.observable(true);
    this.callStartTime = ko.observable(0);

    this.numberAndDuration = ko.computed(function() 
    {
        if (this.callStartTime() == 0) {
            return "";
        }

        var duration = (currentTime() - (this.callStartTime() * 1000)); // duration in milliseconds
        if (duration < 0) duration = 0;
        var timeString = moment(duration).format("H:mm:ss"); // Create a date object and format it.

        var numberPart = (this.connectedNr() != "") ? (this.connectedNr() + " ") : ("");
        var timePart = "[" + timeString + "]";

        return numberPart + timePart;
        
    }, this);
}

UserListItem.prototype.startCall = function(number, name, startTime) {
    this.connectedName(name);
    this.connectedNr(number);
    this.callStartTime(startTime);
}

UserListItem.prototype.noCalls = function() {
    this.connectedName("");
    this.connectedNr("");
    this.callStartTime(0);
}

UserListItem.prototype.setFavorite = function (fav) {
    this.favorite(fav);
}


function QueueListItem(id, name) {
    _.bindAll(this, 'queueLogin');

    this.id = ko.observable(id                            || "");
    this.name = ko.observable(name                        || "");

    this.favorite = ko.observable(false);
    this.signInOut = ko.observable(false);
    this.waitingAmount = ko.observable(0);
    this.orderNr = 0;
}

QueueListItem.prototype.queueLogin = function (amLoggingIn) {
    //this.signInOut(amLoggingIn); // Event should come correctly through api.
    var queue = Lisa.Connection.model.queues[this.id()];

    if (amLoggingIn) {
        conn.queueLogin(queue);
    } else {
        conn.queueLogout(queue);   
    }
}

function CallListItem(id, name, startTime) {
    this.id = ko.observable(id                            || "");
    this.name = ko.observable(name                        || "");
    this.callStartTime = ko.observable(startTime          || 0);

    this.timeConnected = ko.computed(function() 
    {
        if (this.callStartTime() == 0) {
            return "";
        }

        var duration = (currentTime() - (this.callStartTime() * 1000)); // duration in milliseconds
        if (duration < 0) duration = 0;
        var timeString = moment(duration).format("H:mm:ss"); // Create a date object and format it.

        return timeString;
        
    }, this);
}



/*
 * ko.observable with the current time that triggers every second. 
 *  All time-dependent function can efficiently track this one observable. 
 *  Knockout.js wizardry should only trigger computables that really are dependent on this observable *right now*.
 */
currentTime = ko.observable(0);
var myDate = new Date();
setInterval(function() {
    //var currentTime = myDate.getTime(); 
    //var timezoneOffset = myDate.getTimezoneOffset(); 

    currentTime(_.now());
}, 1000); // Update UserListItem.currentTime every second.

var ListingsViewModel = function(){
    var self = this;
    
    self.availableWaitingList = ko.observableArray(initialWaitingQueueList);
    
    self.currentList = ko.observable();
    self.favoriteList = ko.observable();
    self.waitingQueueList = ko.observable();
    self.incomingCallList = ko.observable();
    
    self.clickedListItem = ko.observable();
    self.clickedListItemName = ko.observable();
    self.waitingQueueItemToSignInOut = ko.observable();
    self.waitingQueueItemToMarkFavorite = ko.observable();
    
    self.loginName = ko.observable();
    self.loginPass = ko.observable();
    self.incomingCallMailTo = ko.observable();
    self.search = ko.observable();
    self.shortcutKey = ko.observable();
    
    
    self.currentList.subscribe(function()
    {
        self.search(""); 
    });

     function addShortCuts() {
 
     }
 
     function filterListByName(list, searchParam) {
       if (!list) {
         return null;
       }
 
       if (!searchParam) {
         return list;
       }

       searchParam = searchParam.toLowerCase();  
       var filteredEntries = [];
 
       ko.utils.arrayForEach(list, function(entry) {
         if ((entry.name().toLowerCase()).indexOf(searchParam) > -1) {
           filteredEntries.push(entry); 
         }  
       });
 
       return filteredEntries;
     }
 

    self.filteredItems = ko.computed(function() 
    {
        if (self.currentList()){
            // Sort the current list
            self.currentList().entries.sort(function(left, right) { return left.name() == right.name() ? 0 : (left.name() < right.name() ? -1 : 1) });

            var searchParam = self.search();
            var result = filterListByName(self.currentList().entries(), searchParam);
            return result;
        }
        return [];
        
    }, self);
    
    self.favFilteredItems = ko.computed(function() 
    {
        if (self.currentList()){
            var result = _.filter(self.currentList().entries(), function(item){
                return item.favorite();
            });
            return result;
        }
        return [];
    }, self);
    
    self.filterWaitingQueue = ko.computed(function()
    {
         if (self.waitingQueueList()){
            var favoriteEntries = ko.observableArray();
             self.sortItemsAscending();
             favoriteEntries = self.waitingQueueList().entries();
             return favoriteEntries;
        }                                 
    }, self);
 
    self.sortItemsAscending = function() {
        self.waitingQueueList().entries(self.waitingQueueList().entries().sort(function(a, b) { return a.favorite < b.favorite;}));                                    };
    
    // Pretty useless to have it computed... Nothing changes with the currentIncomingList
    self.incomingCallQueue = ko.computed(function()
    {
         if (self.incomingCallList()){
            var filteredEntries = ko.observableArray();
            
             ko.utils.arrayForEach(self.incomingCallList().entries(), function(entry) {
                 filteredEntries.push(entry);
             });
             return filteredEntries();
        }                                 
    }, self);
    
    self.clickItem = function(clickedItem) 
    {
        self.clickedListItem(clickedItem);
        var name = clickedItem.name();
        self.clickedListItemName(name);
       
        $('#connectModal').modal({
            keyboard: true
        })
    }
    
    self.mailTo = function(incomingCall)
    {
        self.incomingCallMailTo(incomingCall);
        //perform mailto functionality upon this object.
    }

    // no updating appearing in the UI .. omehow the values do seem to update in the array.. is the accoring value missing bindings?
    // another question: should you be able to mark the ones you aren't logged into as favorite?
    self.markFavorite = function(favorite)
    {
        self.waitingQueueItemToMarkFavorite(favorite);
        
        var indexVal = self.waitingQueueList().entries().indexOf(favorite);
        var markFavoriteFlag = self.waitingQueueList().entries()[indexVal].favorite();
        var tobeShifted = self.waitingQueueList().entries().splice(indexVal,1);
        if (markFavoriteFlag){
            tobeShifted[0].favorite(false);
            self.waitingQueueList().entries().push(tobeShifted[0]);
        } else if (!markFavoriteFlag) {
            tobeShifted[0].favorite(true);
            self.waitingQueueList().entries().unshift(tobeShifted[0]);
        }        
        self.sortItemsAscending();
    }
    
    // no updating appearing in the UI.. somehow the values do seem to update in the array.. is the accoring value missing bindings?
    self.signInOut = function(queueListItem)
    {
        queueListItem.queueLogin(!queueListItem.signInOut());
    }
    
    self.actionCalling = function()
    {
        //alert("Calling");
        // use self.clickItem ... as the reference to really call.
    }
    
    self.actionConnectThrough = function()
    {
        //alert("actionCallingThrough");
        // use self.clickItem ... as the reference to really callthrough
    }
    
    self.cancelLogin = function()
    {
        //alert("cancelLogin");
    }
    
    self.doLogin = function()
    {
        console.log("Logging in as: " + self.loginName());
        login(self.loginName(), self.loginPass());
    }
    
    self.favoriteCssClass = function(fav)
    {
        if (fav == true) {
            return 'fa fa-star';
        } else {
            return 'fa fa-star-o';
        }    
    }
    
    self.signInOutCssClass = function(signInOut)
    {
        if (signInOut == true){
            return 'fa fa-sign-out';
            
        } else {
            return 'fa fa-sign-in';
        }
    }
    
    self.signInOutColor = function(signInOut)
    {
         if (signInOut == true){
            return 'logged-in-color';
        } else {
            return 'logged-out-color';
        }
    }

    self.logCssClass = function(logged)
    {
        if (logged == true) {
            return 'fa fa-check-circle';
        } else {
            return 'fa fa-minus-circle';
        }                                       
    };
    
    self.colorClass = function(avail, logged, ringing)
    {
        if (logged == true) {
            if (avail == true){
                 return 'green';
            } else if(ringing == true) {
                return 'orange';
            } else {
                return 'red'
            }
        } else {
            return 'white';
        }  
    }
    
    self.setSearch = function(searchParam)
    {
        self.search(searchParam);
    }

    self.favoriteList( self.favFilteredItems()) ;
   
    self.setSearch("");
    
    if (demoData) {
        self.currentList( demoUserLists[0] );
        self.waitingQueueList( initialWaitingQueueList[0] );
        self.incomingCallList( initialIncomingCallList[0] );
    } else {
        self.currentList( xmppUserLists[0] );
        self.waitingQueueList( xmppWaitingQueueList[0] );
        self.incomingCallList( xmppIncomingCallList[0] );
    }
    
    $( "#inputField" ).keypress(function(e)
    {
        var searchParam = self.search();
        if(searchParam){
           if ((e.which) == 48 || 49 || 50 || 51 || 52 || 53 || 54 || 55 || 56 || 57){
               var shortcutKey = (e.which%48);
               if (e.ctrlKey){
                  
                  var itemToClick = self.filteredItems()[shortcutKey];
                  if (itemToClick != null)
                   {
                       self.clickItem(itemToClick);
                   }
                   event.preventDefault();
               }
           } 
        }
    });
    
    $( document ).keypress(function(e)
    {
        // ugly code ... should be a better way... for later to cleanup -> might make a keyFunction..
        var searchParam = self.search();
        searchParam +="";
        searchParam = searchParam.toLowerCase();
        if (!searchParam){
           if ((e.which) == 48 || 49 || 50 || 51 || 52 || 53 || 54 || 55 || 56 || 57){
               var shortcutKey = (e.which%48);
               if (e.ctrlKey){
                  
                  var itemToClick = self.favFilteredItems()[shortcutKey];
                  if (itemToClick != null)
                   {
                       self.clickItem(itemToClick);
                   }
                   event.preventDefault();
               }
           }
        } else {
            if ((e.which) == 48 || 49 || 50 || 51 || 52 || 53 || 54 || 55 || 56 || 57){
               var shortcutKey = (e.which%48);
               if (e.ctrlKey){
                  
                  var itemToClick = self.filteredItems()[shortcutKey];
                  if (itemToClick != null)
                   {
                       self.clickItem(itemToClick);
                   }
                   event.preventDefault();
               }
           }
        }
    });
    
    
    $('#loginModal').modal({
            keyboard: false
    })
    
    /*
    $( "#inputField" ).focusin(function() {
         console.log("in");
        self.hasFocus = true;
    });
    
    $( "#inputField" ).focusout(function() {
         console.log("out");
        self.hasFocus = false;
    });
    */
    
    //Modal positioning for screen and resizing
    function adjustModalMaxHeightAndPosition(){
        $('.modal').each(function(){
            if($(this).hasClass('in') == false){
                $(this).show(); /* Need this to get modal dimensions */
            };
            var contentHeight = $(window).height() - 60;
            var headerHeight = $(this).find('.modal-header').outerHeight() || 0;
            var footerHeight = $(this).find('.modal-footer').outerHeight() || 0;
    
            $(this).find('.modal-content').css({
                'max-height': function () {
                    return contentHeight;
                }
            });
    
            $(this).find('.modal-body').css({
                'max-height': function () {
                    return (contentHeight - (headerHeight + footerHeight));
                }
            });
    
            $(this).find('.modal-dialog').css({
                'margin-top': function () {
                    return -($(this).outerHeight() / 2);
                },
                'margin-left': function () {
                    return -($(this).outerWidth() / 2);
                }
            });
            if($(this).hasClass('in') == false){
                $(this).hide(); /* Hide modal */
            };
        });
    };
    $(window).resize(adjustModalMaxHeightAndPosition).trigger("resize");
    }

ko.applyBindings(new ListingsViewModel());
