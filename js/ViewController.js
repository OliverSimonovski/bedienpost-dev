// Overall viewmodel for this screen, along with initial state


function UserListItem(id, name, ext, log, avail, ringing) {
    this.id = ko.observable(id                            || "");
    this.name = ko.observable(name                        || "");
    this.ext = ko.observable(ext                          || "");
    this.log = ko.observable(log                          || false);
    this.avail = ko.observable(avail                      || false);
    this.ringing = ko.observable(ringing                  || false);

    this.connectedName = ko.observable("");
    this.connectedNr = ko.observable("");
    this.connectedNr = ko.observable("");
    this.favorite = ko.observable(false);
    this.callStartTime = ko.observable(0);
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
       var filteredEntries = ko.observableArray();
 
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
            var searchParam = self.search();
            var result = filterListByName(self.currentList().entries(), searchParam);
            return result;
        }
        
    }, self);
    
    self.favFilteredItems = ko.computed(function() 
    {
        var result = _.filter(self.filteredItems(), function(item){
            return item.favorite();
        });
        return result;
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
        var name = clickedItem.name;
        name += "";
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
    self.signInOut = function(signinout)
    {
        self.waitingQueueItemToSignInOut(signinout);
        
        var indexVal = self.waitingQueueList().entries().indexOf(signinout);
        var signInOutFlag = self.waitingQueueList().entries()[indexVal].signInOut();
            self.waitingQueueList().entries()[indexVal].signInOut(!signInOutFlag);
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
        //alert("doLogin");
        //console.log(self.loginName() + " " + self.loginPass());
        $('#loginModal').modal('hide');
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
    self.incomingCallList( initialIncomingCallList[0] );  //Not sure if this is correctly working out of the box
    self.setSearch("");
    
    if (demoData) {
        self.currentList( demoUserLists[0] );
        self.waitingQueueList( initialWaitingQueueList[0] );
    } else {
        self.currentList( xmppUserLists[0] );
        self.waitingQueueList( xmppWaitingQueueList[0] );
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
