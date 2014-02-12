// Overall viewmodel for this screen, along with initial state

var demoData = false;
var incomingCallEntries = ko.observableArray();
var initialIncomingCallList = [{ name: "Incoming CallList", entries: incomingCallEntries }];

var initialIncomingCallList = [
    { name: "Incoming CallList", entries: ko.observableArray( [
        { id: 1, name: "Incoming Call 1", timeConnected:"4:50" },
        { id: 2, name: "Incoming Call 2", timeConnected:"2:40" },
        { id: 3, name: "Incoming Call 3", timeConnected:"2:12" },
        { id: 4, name: "Incoming Call 4", timeConnected:"0:56" }] )        
    }
];

var waitingListEntries = ko.observableArray();
var initialWaitingQueueList = [{ name: "Call List", entries: waitingListEntries }];

var initialWaitingQueueList = [
    { name: "WaitingQueue List", entries: ko.observableArray( [
        { id: 1, name: "Wachtrij 1", favorite:ko.observable(true), orderNr:"", signInOut:ko.observable(true), waitingAmount:3 },
        { id: 2, name: "Wachtrij 2", favorite:ko.observable(true), orderNr:"", signInOut:ko.observable(false), waitingAmount:7 },
        { id: 3, name: "Wachtrij 3", favorite:ko.observable(false), orderNr:"", signInOut:ko.observable(true), waitingAmount:4 },
        { id: 4, name: "Wachtrij 4", favorite:ko.observable(false), orderNr:"", signInOut:ko.observable(true), waitingAmount:12 },
        { id: 5, name: "Wachtrij 5", favorite:ko.observable(false), orderNr:"", signInOut:ko.observable(false), waitingAmount:23 },
        { id: 6, name: "Wachtrij 6", favorite:ko.observable(true), orderNr:"", signInOut:ko.observable(false), waitingAmount:1 },
        { id: 7, name: "Wachtrij 7", favorite:ko.observable(false), orderNr:"", signInOut:ko.observable(false), waitingAmount:0 },
        { id: 8, name: "Wachtrij 8", favorite:ko.observable(true), orderNr:"", signInOut:ko.observable(true), waitingAmount:0 },
        { id: 9, name: "Wachtrij 9", favorite:ko.observable(true), orderNr:"", signInOut:ko.observable(false), waitingAmount:3 }] )
    }
];
var xmppWaitingQueueList = [
    { name: "WaitingQueue List", entries: ko.observableArray()}
];

var userListEntries = ko.observableArray();
var xmppUserLists = [{ name: "Call List", entries: userListEntries }];

var demoUserLists = [
    { name: "Call List", entries: ko.observableArray( [
        { id: 1, name: "Receptie DraadloosDraadloosDraadloos", shortcut:"", favorite:true, ext:"264,254", log:true, avail:true, ringing:true, connectedName:"Lambert Storingsdienst", connectedNr:"070123456789" },
        { id: 2, name: "Thomas Winkelman", shortcut:"", favorite:false, ext:"130,140", log:true, avail:false, ringing:true, connectedName:"", connectedNr:"" },
        { id: 3, name: "Joop Aanstoot", shortcut:"", favorite:true, ext:"130,140", log:false, avail:false, ringing:true, connectedName:"", connectedNr:"" },
        { id: 4, name: "Bart Meijerink", shortcut:"", favorite:false, ext:"130,140", log:true,  avail:false, ringing:true, connectedName:"", connectedNr:"" },
        { id: 5, name: "Patrick Van der Veen", shortcut:"", favorite:false, ext:"130,140", log:true, avail:false, ringing:false, connectedName:"Richard Kamphuis", connectedNr:"070123456789" },
        { id: 6, name: "Nicole Roskamp", shortcut:"", favorite:false, ext:"130,140", log:true, avail:false, ringing:false, connectedName:"", connectedNr:"" },
        { id: 7, name: "Remko Uland", shortcut:"", favorite:true, ext:"130,140", log:true, avail:false, ringing:false, connectedName:"", connectedNr:"" },
        { id: 8, name: "Richard Kamphuis", shortcut:"", favorite:false, ext:"130,140", log:true, avail:false, ringing:true, connectedName:"", connectedNr:"" },
        { id: 9, name: "Tom Waanders", shortcut:"", favorite:false, ext:"130,140", log:true, avail:false, ringing:true, connectedName:"070123456789", connectedNr:"" },
        { id: 10, name: "Martin Kamphuis", shortcut:"", favorite:true, ext:"130,140", log:true, avail:false, ringing:true, connectedName:"", connectedNr:"" },
        { id: 11, name: "Support 1e Lijns", shortcut:"", favorite:false, ext:"130,140", log:true, avail:false, ringing:false, connectedName:"070123456789", connectedNr:"" },
        { id: 12, name: "Lambert Storingsdienst", shortcut:"", favorite:false, ext:"130,140", log:true, avail:false, ringing:true, connectedName:"", connectedNr:"" },
        { id: 13, name: "Maurice", shortcut:"", favorite:false, ext:"130,140", log:true, avail:false, ringing:false, connectedName:"", connectedNr:"" },
        { id: 14, name: "Pascal", shortcut:"", favorite:false, ext:"130,140", log:true, avail:false, ringing:true, connectedName:"", connectedNr:"" },
        { id: 15, name: "Roland", shortcut:"",  favorite:false, ext:"130,140", log:true, avail:false, ringing:true, connectedName:"", connectedNr:"" },
        { id: 16, name: "Wim", shortcut:"", favorite:false, ext:"130,140", log:true, avail:false, ringing:true, connectedName:"", connectedNr:""}] )
    }
];

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

    self.filteredItems = ko.computed(function() 
    {
        if (self.currentList()){
            var searchParam = self.search();
            searchParam +="";
            searchParam = searchParam.toLowerCase();
            var filteredEntries = ko.observableArray();

            console.log(self.hasFocus);
            if(!searchParam ){
                return ko.mapping.toJS(self.currentList().entries());
            } else {
                var shortcutCounter = 0;
                ko.utils.arrayForEach(self.currentList().entries(), function(entry) {
                     entry = ko.mapping.toJS(entry);
                     entry.name+="";
                     if ((entry.name.toLowerCase()).indexOf(searchParam) > -1)
                     {
                         if (shortcutCounter < 10){
                            entry.shortcut = shortcutCounter;
                            shortcutCounter++;
                         }
                         filteredEntries.push(entry);
                     }
                 });
                return filteredEntries();
            }
        }
        
    }, self);
    
    self.favFilteredItems = ko.computed(function() 
    {
        if (self.currentList()){
            var searchParam = self.search();
            searchParam +="";
            searchParam = searchParam.toLowerCase();
            var filteredEntries = ko.observableArray();
            
            if(!searchParam){
                var shortcutCounter = 0;
                 ko.utils.arrayForEach(self.currentList().entries(), function(entry) {
                     entry = ko.mapping.toJS(entry);
                     entry.name+="";
                     if ((entry.favorite))
                     {
                        if (shortcutCounter < 10){
                            entry.shortcut = shortcutCounter;
                            shortcutCounter++;
                         }
                         filteredEntries.push(entry);
                     }
                 });
                return filteredEntries();
            } else {
                ko.utils.arrayForEach(self.currentList().entries(), function(entry) {
                     entry = ko.mapping.toJS(entry);
                     entry.name+="";
                     if ((entry.name.toLowerCase()).indexOf(searchParam) > -1 && (entry.favorite))
                     {
                         entry.shortcut = "";
                         filteredEntries.push(entry);
                     }
                 });
                return filteredEntries();
            }
        }
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
        console.log(self.loginName() + " " + self.loginPass());
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
