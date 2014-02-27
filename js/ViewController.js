// Overall viewmodel for this screen, along with initial state
var global = {};

function UserListItem(id, name, ext, log, avail, ringing) {
    _.bindAll(this, 'startCall', 'noCalls', 'setFavorite');

    this.id = ko.observable(id                            || 0);
    this.name = ko.observable(name                        || "");
    this.ext = ko.observable(ext                          || "");
    this.log = ko.observable(log                          || false);
    this.avail = ko.observable(avail                      || false);
    this.ringing = ko.observable(ringing                  || false);

    this.connectedName = ko.observable("");
    this.connectedNr = ko.observable("");
    this.callStartTime = ko.observable(0);

    var storedAsFav = isFav(id, UserListItem.storageKey());
    this.favorite = ko.observable(storedAsFav);

    this.numberAndDuration = ko.computed(function() 
    {
        if (this.callStartTime() == 0) {
            return "";
        }

        var duration = (currentTime() - (this.callStartTime() * 1000)); // duration in milliseconds
        var myDate = new Date();

        var timezoneOffset = (myDate.getTimezoneOffset() * 60 * 1000);
        duration += timezoneOffset;
        if (duration < timezoneOffset) duration = timezoneOffset;

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

UserListItem.storageKey = function() {
    return USERNAME + "@" + SERVER + "_UserListFavs";
}

UserListItem.saveFavs = function(userList) {
    saveFavs(userList, UserListItem.storageKey());  
}

function isFav(id, storageKey) {
    if (global[storageKey] == null) {
        var result = localStorage.getItem(storageKey);
        global[storageKey] = (result) ? JSON.parse(result) : {} ;

    }
    return _.contains(global[storageKey], id); 
}

function saveFavs(list, storageKey) {
    var favIndices = [];

    for (index in list) {
        var item = list[index];
        if (item.favorite()) {
            favIndices.push(item.id());
        }
    }
    var json = JSON.stringify(favIndices);
    console.log("Saving favorite ids: " + JSON.stringify(favIndices) + " for key " + storageKey);
    global[storageKey] = favIndices;
    localStorage.setItem(storageKey, json);
}


function QueueListItem(id, name) {
    _.bindAll(this, 'queueLogin');

    this.id = ko.observable(id                            || "");
    this.name = ko.observable(name                        || "");

    this.signInOut = ko.observable(false);
    this.waitingAmount = ko.observable(0);
    this.orderNr = 0;

    this.favorite = ko.observable(isFav(id, QueueListItem.storageKey()));
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

QueueListItem.saveFavs = function(queueList) {
    saveFavs(queueList, QueueListItem.storageKey());  
}

QueueListItem.storageKey = function() {
    return USERNAME + "@" + SERVER + "_QueueListFavs";
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

setInterval(function() {
    var myDate = new Date();
    currentTime(myDate.getTime());
}, 1000); // Update UserListItem.currentTime every second.

function nameComparator(left, right) {
    return left.name() == right.name() ? 0 : (left.name() < right.name() ? -1 : 1);    
}

/* 
 * Sorts as following: 
 * - Keep non-favorites alphabetical
 * - Keep favorites last-favorited-first
 */
function favComparator(left, right) {
    return left.favorite() == right.favorite() ? nameComparator(left,right) : (left.favorite() && !right.favorite() ? -1 : 1);
}

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
    self.loginServer = ko.observable("uc.pbx.speakup-telecom.com");
    self.incomingCallMailTo = ko.observable();
    self.search = ko.observable();
    self.shortcutKey = ko.observable();
    self.callingState = ko.observable('transfer');
    
    
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
            self.currentList().entries.sort(nameComparator);

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
        self.waitingQueueList().entries(self.waitingQueueList().entries().sort(favComparator));                                   
    };
    
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
        if (phoneIp == "") {
            return;
        }

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
    self.markQueueFavorite = function(favorite)
    {
       
        favorite.favorite(!favorite.favorite()); // Toggle
        QueueListItem.saveFavs(self.waitingQueueList().entries());
    }
    
    // no updating appearing in the UI.. somehow the values do seem to update in the array.. is the accoring value missing bindings?
    self.signInOut = function(queueListItem)
    {
        queueListItem.queueLogin(!queueListItem.signInOut());
    }
    
    self.actionCalling = function(item)
    {
        var toCall = self.clickedListItem().ext().split(",")[0];
        callUser(toCall);
    }
    
    self.actionConnectThrough = function()
    {
        var toCall = self.clickedListItem().ext().split(",")[0];
        transferToUser(toCall);
    }
    
    self.cancelLogin = function()
    {
        //alert("cancelLogin");
    }
    
    self.doPickup = function()
    {
        pickupPhone();   
    }
    
    self.doHangup = function()
    {
        hangupPhone();
    }
    
    self.doTransfer = function()
    {
        
    }
    
    self.doLogin = function()
    {
        console.log("Logging in as: " + self.loginName());
        login(self.loginName(), self.loginPass(), self.loginServer());
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
    
    self.connectionCssClass = function(typeConnection)
    {
        if(typeConnection == false){
            return 'fa fa-arrow-circle-left';
        } else if (typeConnection == true){
            return 'fa fa-arrow-circle-right';
        } else {
          return '';  
        }
        
    }
    
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
    
    self.actionStateCssClass = function( current )
    {
        console.log(self.callingState());
        console.log(current);
        if(self.callingState() == "ringing" && current == 'pick'){
             return 'btn btn-pickup';
        } else if (self.callingState() == "calling" && current == 'hang'){
             return 'btn btn-hangup';
        } else if (self.callingState() == "transfer" && current =='transfer'){
            return 'btn btn-transfer';
        } else {
            return 'btn btn-inactive';
        }
    }
    
    self.setSearch = function(searchParam)
    {
        self.search(searchParam);
    }

    self.markUserFavorite = function(item) {
         console.log(item);
        item.favorite(true);
        UserListItem.saveFavs(self.currentList().entries());
    }

    self.unmarkUserFavorite = function(item) {
        item.favorite(false);
        UserListItem.saveFavs(self.currentList().entries());
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
         console.log(e.which);
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
    
    self.showButton = function(){
            $('.overlay').fadeIn(250); // slideDown(1000);
        }
     self.hideButton = function(){
            $('.overlay').fadeOut(250);  // slideUp(1000);
        }
    
    $( document ).keypress(function(e)
    {
        // ugly code ... should be a better way... for later to cleanup -> might make a keyFunction..
        console.log(e.which);
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

    /* Drag and Drop handling */
    
    ko.bindingHandlers.drag = {
        init: function(element, valueAccessor, allBindingsAccessor) {
            //set meta-data
            ko.utils.domData.set(element, "ko_drag_data", valueAccessor());
            
            //combine options passed into binding (in dragOptions binding) with global options (in ko.bindingHandlers.drag.options)
            var options = ko.utils.extend(ko.bindingHandlers.drag.options, allBindingsAccessor().dragOptions);
            
            //initialize draggable
            $(element).draggable(options);
        },
        options: {}   
    };

    ko.bindingHandlers.drop = {
        init: function(element, valueAccessor, allBindingsAccessor, viewModel) {
            //grab method
            var action = ko.utils.unwrapObservable(valueAccessor());
            
            //combine options passed into binding (in dropOptions binding) with global options (in ko.bindingHandlers.drop.options)
            var options = ko.utils.extend(ko.bindingHandlers.drop.options, allBindingsAccessor().dropOptions);
            
            options.drop = function(event, ui) {
                //read meta-data off of dropped item 
                var data = ko.utils.domData.get(ui.draggable[0], "ko_drag_data");
                //execute our action
                action.call(viewModel, data);
            };
            
            //initialize droppable
            $(element).droppable(options);            
        },
        options: {}    
    };

    ko.bindingHandlers.drag.options = { helper: 'clone' };
    /* ----------------------- */

    
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

var listingViewModel = new ListingsViewModel();
ko.applyBindings(listingViewModel);
