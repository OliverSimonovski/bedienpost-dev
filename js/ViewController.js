// Overall viewmodel for this screen, along with initial state
var global = {};
var shortcutsActive = false;
var keypadActive = false;
var dialing = false;
var transfering = false;
var selectingNumber = false;
var clockCompensation = 0; // Compensate for a misconfigured clock.
var contactPhoneNumberPriority = ["work", "mobile", "home"];

function UserListItem(id, name, ext, log, avail, ringing, company) {
    _.bindAll(this, 'startCall', 'noCalls', 'setFavorite');

    this.id = ko.observable(id                            || 0);
    this.name = ko.observable(name                        || "");
    this.ext = ko.observable(ext                          || "");
    this.log = ko.observable(log                          || false);
    this.avail = ko.observable(avail                      || false);
    this.ringing = ko.observable(ringing                  || false);
    this.company = ko.observable(company                  || "");

    this.directionIsOut = ko.observable(true);
    
    this.connectedName = ko.observable("");
    this.connectedNr = ko.observable("");
    this.callStartTime = ko.observable(0);
    this.amImportedContact = ko.observable(false);
    this.numbers = ko.observableArray();



    var storedAsFav = isFav(id, UserListItem.storageKey());
    this.favorite = storedAsFav;

    this.numberAndDuration = ko.computed(function() 
    {
        if (this.callStartTime() == 0) {
            return "";
        }

        var callStart = moment.utc(this.callStartTime() * 1000.);
        var duration = (currentTime() - callStart); // duration in milliseconds
        if (duration < 0) {
            if (duration < clockCompensation)
                clockCompensation = duration; // We want the minimum value that we've seen in clockCompensation.
        }
        duration -= clockCompensation;

        var timeString = moment.utc(duration).format("H:mm:ss"); // Create a date object and format it.
        var timePart = "[" + timeString + "]";

        var numberPart = this.connectedNr();
        if ((numberPart != "") && this.connectedName() != "") {
            var npend = numberPart.substr(-5);
            numberPart = numberPart.replace(npend, ".....");
        }
        numberPart = (numberPart != "") ? numberPart + " " : "";

        return numberPart + timePart;
        
    }, this);
}

UserListItem.prototype.startCall = function(number, name, startTime, directionIsOut) {
    this.connectedName(name);
    this.connectedNr(number);
    this.callStartTime(startTime);
    this.directionIsOut(directionIsOut);
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
    return USERNAME + "@" + DOMAIN + "_UserListFavs";
}

UserListItem.saveFavs = function(userList) {
    saveFavs(userList, UserListItem.storageKey());  
}

function isFav(id, storageKey) {
    var isFavObservable = ko.observable(false);
    if (global[storageKey] == null) {
        // We haven't retrieved this storage-key from remote yet, let's do so now.
        global[storageKey] = {};
        global[storageKey].deferred = remoteStorage.getItem(storageKey);
        global[storageKey].favs = {};
    }

    // Use a deferred to set isFavObservable
    global[storageKey].deferred.done(function(storageKey, isFavObservable) {
        return function(response) {
            // Received response
            var responseArr = (response) ? JSON.parse(response) : {};
            global[storageKey].favs = _.union(global[storageKey].favs, responseArr); // Merge local and remote results.
            isFavObservable(_.contains(global[storageKey].favs, id));
        }
    }(storageKey, isFavObservable));

    return isFavObservable;
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
    global[storageKey].favs = favIndices;
    remoteStorage.setItem(storageKey, json);
}


function QueueListItem(id, name) {
    _.bindAll(this, 'queueLogin');

    this.id = ko.observable(id                            || "");
    this.name = ko.observable(name                        || "");

    this.signInOut = ko.observable(false);
    this.waitingAmount = ko.observable(0);
    this.orderNr = 0;

    this.favorite = isFav(id, QueueListItem.storageKey());
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
    return USERNAME + "@" + DOMAIN + "_QueueListFavs";
}

function CallListItem(id, name, startTime, directionIsOut, descriptionWithNumber) {
    _.bindAll(this, 'stopCall');

    this.id = ko.observable(id                            || "");
    this.name = ko.observable(name                        || "");
    this.callStartTime = ko.observable(startTime          || 0);
    this.directionIsOut = ko.observable(directionIsOut    || false);
    this.finished = ko.observable(false);
    this.descriptionWithNumber = ko.observable(descriptionWithNumber || "");

    this.timeConnected = ko.computed(function() 
    {
        if (this.callStartTime() == 0) {
            return "";
        }

        var callStart = moment.utc(this.callStartTime() * 1000.);
        var duration = (currentTime() - callStart); // duration in milliseconds
        if (duration < 0) {
            if (duration < clockCompensation)
                clockCompensation = duration; // We want the minimum value that we've seen in clockCompensation.
        }
        duration -= clockCompensation;

        var timeString = moment.utc(duration).format("H:mm:ss"); // Create a date object and format it.
        return timeString;
        
    }, this);

    this.toDisplay = ko.computed(function()
    {
    if (!this.finished()) {
        return this.name();
    } else {
        return this.name() + " - finished";
    }

    }, this);
}

CallListItem.prototype.stopCall = function() {
    this.callStartTime(0);
    this.finished(true);
    _.delay(
        function(self) {
            return function() {
                if (self.finished())
                    incomingCallEntries.remove(self);
            }
        }(this)
    , 10000);
}



/*
 * ko.observable with the current time that triggers every second. 
 *  All time-dependent function can efficiently track this one observable. 
 *  Knockout.js wizardry should only trigger computables that really are dependent on this observable *right now*.
 */
currentTime = ko.observable(0);

setInterval(function() {
    var myDate = new Date();
    currentTime(moment.utc());
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
    self.connectedPhone = ko.observable(false);
    
    self.clickedListItem = ko.observable();
    self.clickedListItemName = ko.observable();
    self.waitingQueueItemToSignInOut = ko.observable();
    self.waitingQueueItemToMarkFavorite = ko.observable();
    
    self.loginName = ko.observable();
    self.loginPass = ko.observable();
    self.incomingCallMailTo = ko.observable();
    self.search = ko.observable().extend({ rateLimit: { timeout: 500, method: "notifyWhenChangesStop" } });
    self.shortcutKey = ko.observable();
    self.callingState = ko.observable('onhook');
    self.authError = ko.observable(false);
    self.numericInput = ko.observable("");
    self.phoneIp = ko.observable("");


    self.phoneAuthAvailable = ko.computed(function(){
        return ((self.phoneIp() != ""));
    }, self);

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

       console.log("Searching...");

       searchParam = searchParam.toLowerCase();  
       var filteredEntries = [];

       for (entryKey in list) {
           var entry = list[entryKey];
           var company = entry.company();
           var entrySearchString = entry.name().toLowerCase() + (company ? " " + company.toLowerCase() : "");
           if (entrySearchString.indexOf(searchParam) > -1) {
               filteredEntries.push(entry);
           }
       }
 
       return filteredEntries;
     }


    self.filteredItems = ko.computed(function()
    {
        if (self.currentList()){
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
    
    // FIXME: foreach in html directly on array.
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

    // FIXME: foreach in html directly on array.
    self.clickedListItemPhoneNumbers = ko.computed(function()
    {
        if (self.clickedListItem() && self.clickedListItem().numbers()){
            var numbers = ko.observableArray();
            ko.utils.arrayForEach(self.clickedListItem().numbers(), function(number) {
                numbers.push(number);
            });

            return numbers();
        } else {
            return [];
        }

    }, self);
    
    self.clickItem = function(clickedItem) 
    {
        self.clickedListItem(clickedItem);
        var name = clickedItem.name();
        self.clickedListItemName(name);

        if (self.callingState() == "onhook") {
            dialing = true;
            selectingNumber = true;
            $('#selectNumberModal').modal({
                keyboard: true
            })
            return;
        }

        if ((phoneIp != "") && listingViewModel.connectedPhone()) {
            transfering = true;
            selectingNumber = true;
            $('#selectNumberModal').modal({
                keyboard: true
            })
        } else {
            dialing = true;
            selectingNumber = true;
            $('#selectNumberModal').modal({
                keyboard: true
            })
        }


    }
    
    self.mailTo = function(incomingCall)
    {
        self.incomingCallMailTo(incomingCall);
        var mailtoUrl = "mailto:?Subject=Gemiste oproep vanaf " + incomingCall.descriptionWithNumber();
        $('<iframe src="'+mailtoUrl+'">').appendTo('body').css("display", "none");
    }

    self.logOut = function(item) {
        console.log("Logging out");
        logout();
        shortcutsActive = false;
        $("#nameInputField").focus();
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
        dialing = false;
        var numberToCall = self.clickedListItem().ext().split(",")[0];
        if (numberToCall != "") {
            conn.dialNumber(numberToCall);
        } else {
            console.log("Can't call user without extension.");
            alert("Can't call user without extension.");
        }
        self.dismissCallModal();
    }

    self.actionSelectedContactNumber = function(item) {
        selectingNumber = false;
        self.clickedListItem().ext(item.number);

        if (dialing) {
            self.actionCalling();
            /*$('#callModal').modal({
                keyboard: true
            })*/
            self.dismissSelectNumberModal();
        } else if (transfering) {
            $('#transferModal').modal({
                keyboard: true
            })
            self.dismissSelectNumberModal();

        }
    }
    
    self.actionTransfer = function()
    {
        transfering = false;
        var toCall = self.clickedListItem().ext().split(",")[0];
        if (self.callingState() == "ringing") {
            transferToUser(toCall);
        } else {
            attendedtransferToUser(toCall);
            _.delay(finishAttendedTransfer, 4000);
        }
        self.dismissTransferModal();
    }

    self.actionTransferAttended = function()
    {
        transfering = false;
        self.callingState("transfer");
        var toCall = self.clickedListItem().ext().split(",")[0];
        attendedtransferToUser(toCall);
        self.dismissTransferModal();
        self.showTransferEndModal();
    }
    
    self.cancelLogin = function()
    {

    }

    self.dismissModal = function(modalToDismiss, focusInputField) {
        modalToDismiss.modal('hide');
        dialing = false;
        transfering = false;
    }

    self.dismissTransferModal = function()
    {
        self.dismissModal($('#transferModal'));
        self.clickedListItem(null);
    }
    
    self.showTransferEndModal = function()
    {
        $('#transferEndModal').modal('show');
    }
    
    self.dismissEndTransferModal = function()
    {
        self.dismissModal($('#transferEndModal'));
        self.clickedListItem(null);
    }
    
     self.dismissCallModal = function()
    {
        self.dismissModal($('#callModal'));
        self.clickedListItem(null);
    }

    self.dismissSelectNumberModal = function() {
        dialing = false;
        transfering = false;
        self.dismissModal($('#selectNumberModal'));
    }

    self.dismissLoginModal = function()
    {
        shortcutsActive = true;
        self.dismissModal($('#loginModal'));
        self.clickedListItem(null);
    }
    
     self.dismissKeypadModal = function()
    {
        shortcutsActive = true;
        keypadActive = false;
        self.dismissModal($('#keypadModal'));
        self.clickedListItem(null);
    }
     
    self.dismissShortcutModal = function()
    {
        self.dismissModal($('#shortcutModal'));
        self.clickedListItem(null);
    }
    
    self.doPickup = function()
    {
        if (self.callingState() == "ringing") {
            pickupPhone();
        }
    }
    
    self.doHangup = function()
    {
        if ((self.callingState() == "ringing") || (self.callingState() == "calling")) {
            hangupPhone();
        }
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

    self.userCssClass = function(entry)
    {
        if (entry.log() == true) {
            var cssClass = 'fa fa-check-circle';
            if (entry.avail()) {
                cssClass += " contact-available";
            } else if (entry.ringing()) {
                cssClass += " contact-ringing";
            } else {
                cssClass += " contact-on-phone";
            }
            return cssClass;
        } else if (entry.amImportedContact()) {
            return 'fa fa-male contact-imported';
        } else {
            return 'fa fa-circle contact-logged-out';
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
    
    self.actionStateCssClass = function( current )
    {
        if(self.callingState() == "ringing" && current == 'pick'){
             return 'btn btn-pickup';
        } else if (self.callingState() == "ringing" && current == 'hang'){
                return 'btn btn-hangup';
        } else if (self.callingState() == "calling" && current == 'hang'){
             return 'btn btn-hangup';
        } else if (self.callingState() == "transfer" && current =='transfer'){
            return 'btn btn-transfer';
        } else {
            return 'btn btn-inactive';
        }
    }

    self.firstRowCssClass = function( entry )
    {
        if (entry != null && entry !=""){
             return 'first-info-small';
        } else {
             return 'first-info-big';
        }
    }
    
    self.secondRowCssClass = function( entry )
    {
         if (entry != null && entry !=""){
             return 'second-info';
        } else {
             return 'invisible';
        }
    }
    
    self.showKeypad = function()
    {
        shortcutsActive = false;
        keypadActive = true;
        $('#keypadModal').modal({
                keyboard: true
            })
        self.clearNumber();
       
    }
    
    $('#keypadModal').on('shown.bs.modal', function () {
       $("#keypadInputField").focus();
    })
    
    self.showLogin = function()
    {
        shortcutsActive = false;
        $('#loginModal').modal({
            keyboard: false
        })
        $("#nameInputField").focus();
    }
    
    $('#loginModal').on('shown.bs.modal', function () {
       
            $("#passwordInputField").focus();
    })
    
    self.showShortcuts = function()
     { 
        $('#shortcutModal').modal({
            keyboard: false
        })
    }
    
    self.enterNumber = function(nr)
    {
        self.numericInput(self.numericInput() + nr);
    }

    self.clearNumber = function()
    {
        self.numericInput("");
    }
  
    self.attendedTransfer = function()
    {
        self.callingState("transfer");
        var number = self.numericInput().replace(/\D/g,'');

        if (self.callingState() == "ringing") {
            transferToUser(number);
        } else {
            attendedtransferToUser(number);
        }
        self.dismissKeypadModal();
        self.showTransferEndModal();
    }
    
    self.unattendedTransfer = function()
    {
        var number = self.numericInput().replace(/\D/g,'');
        if (self.callingState() == "ringing") {
            transferToUser(number);
        } else {
            attendedtransferToUser(number);
            _.delay(finishAttendedTransfer, 4000);
        }
        self.dismissKeypadModal();
    }
    
    self.call = function()
    {
        var number = self.numericInput().replace(/\D/g,'');
        conn.dialNumber(number);
        self.dismissKeypadModal();
    }
    
    self.finalizeTransfer = function()
    {
        if (self.callingState() == "transfer") {
            finishAttendedTransfer();
        }
        self.dismissEndTransferModal();
    }

    self.cancelTransfer = function()
    {
        if (self.callingState() == "transfer") {
            cancelAttendedTransfer();
            self.callingState("calling");
        }
        self.dismissEndTransferModal();
    }
    
    ko.bindingHandlers.numeric = {
        init: function (element, valueAccessor) {
            $(element).on("keydown", function (event) {
                // Allow: backspace, delete, tab, escape, and enter
                if (event.keyCode == 46 || event.keyCode == 8 || event.keyCode == 9 || event.keyCode == 27 || event.keyCode == 13 ||
                    // Allow: Ctrl A en Ctrl
                    (event.keyCode == 86 && event.ctrlKey) ||  (event.keyCode == 86 && event.metaKey) ||
                    (event.keyCode == 65 && event.ctrlKey) ||  (event.keyCode == 65 && event.metaKey) ||
                    // Allow: shift +
                    (event.keyCode == 187 && event.shiftKey == true) ||
                    // Allow: home, end, left, right
                    (event.keyCode >= 35 && event.keyCode <= 39)) {
                
                    // let it happen, don't do anything
                    return;
                }
                else {
                    // Ensure that it is a number and stop the keypress
                    if (event.shiftKey || (event.keyCode < 48 || event.keyCode > 57) && (event.keyCode < 96 || event.keyCode > 105)) {
                        event.preventDefault();
                    }
                }
            });
        }
    };
    
    self.setSearch = function(searchParam)
    {
        self.search(searchParam);
    }

    self.markUserFavorite = function(item) {
        if (item.user) item.user.favorite(true);
        UserListItem.saveFavs(self.currentList().entries());
    }

    self.unmarkUserFavorite = function(item) {
        if (item.fav) item.fav.favorite(false);
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

    $( "#loginModal" ).keypress(function(e)
    {
        if ((e.which) == 13){
            self.doLogin();
        } 
    });
    
    $("#activecalls").on("mouseenter", function(){
        if ((phoneIp != "") && listingViewModel.connectedPhone()) {
            $(".overlay").stop(true, true).fadeIn(250);
        }

    });

    $("#activecalls").on("mouseleave", function(){

        $(".overlay").stop(true, true).fadeOut(250);

    });
    

    $("#submitBtn").click(function() {
         $("#submitBtn").toggleClass('active');
    });

    self.showButton = function(){
        if ((phoneIp != "") && listingViewModel.connectedPhone()) {
            $('.overlay').fadeIn(250); // slideDown(1000);
        }
    }
    
     self.hideButton = function(){
        $('.overlay').fadeOut(250);  // slideUp(1000);
    }

    /*$("#keypadModal").keyup(function (e) {
        if (e.keyCode == 13) {
            if (listingViewModel.callingState() == "onhook") {
                listingViewModel.call();
            } else {
                listingViewModel.unattendedTransfer();
            }
        }
    });*/

    /* Give lower-case chars */
    function matchesKey(key, targetChar) {
        return ((key == targetChar.charCodeAt(0)) || (key == (targetChar.charCodeAt(0) - 32)));
    }

    $(document).keypress(function (e) {

        if (!keypadActive && shortcutsActive) {
            // Process numeric keys
            var searchParam = self.search();
            searchParam += "";
            searchParam = searchParam.toLowerCase();
            var key = e.keyCode ? e.keyCode : e.which ? e.which : e.charCode;
            var list = null;
            if (!searchParam) {
                list = self.favFilteredItems();
            } else {
                list = self.filteredItems();
            }
            if ((key >= 48) && (key <= 57 )) {
                var shortcutKey = (e.which % 48);

                if (selectingNumber) {
                    var itemToClick = self.clickedListItemPhoneNumbers()[shortcutKey];
                    self.actionSelectedContactNumber(itemToClick);
                } else  if (list[shortcutKey] != null) {
                    var itemToClick = self.filteredItems()[shortcutKey];
                    self.clickItem(list[shortcutKey]);
                }
                e.preventDefault();
            }
        } else if (keypadActive) {
            // Keypad key-bindings
            if (matchesKey(e.which, "b")) {  // b for bellen
                self.call();
                console.log("Calling number");
                e.preventDefault();
            } else if (matchesKey(e.which, "a")) {  // a for attended transfer
                self.attendedTransfer();
                console.log("Attended transfer");
                e.preventDefault();
            } else if (matchesKey(e.which, "u")) {  // u for unattended transfer
                self.unattendedTransfer();
                console.log("Unattended transfer");
                e.preventDefault();
            }
            return;
        }



        if (!shortcutsActive)
            return;

        //console.log (e.which);
        //console.log (e.ctrlKey);
        //console.log (e.shiftKey);

        if (matchesKey(e.which, "e")) {         // E - help
            self.showShortcuts();
            e.preventDefault();
        } else if (matchesKey(e.which, "d")) {  // D - dialpad
            self.showKeypad();
            e.preventDefault();
        } else if (matchesKey(e.which, "p")) {  // P - pickup
            self.doPickup();
            e.preventDefault();
        } else if (matchesKey(e.which, "h")) {  // H - hangup
            self.doHangup();
            e.preventDefault();
        } else if (matchesKey(e.which, "b")) { /// B - bel
            self.actionCalling();
            e.preventDefault();
        } else if (matchesKey(e.which, "a")) { // A - attended transfer
            self.actionTransferAttended();
            e.preventDefault();
        } else if (matchesKey(e.which, "t")) {  // t - unattended Transfer
            self.actionTransfer();
            e.preventDefault();
        } else if (matchesKey(e.which, "s")) { // S - Focus zoekveld
            $("#inputField").focus();
            e.preventDefault();
        }
    });

    var _dragged;
    /* Drag and Drop handling */
    ko.bindingHandlers.drag = {
        init: function(element, valueAccessor, allBindingsAccessor) {
            //set meta-data
            ko.utils.domData.set(element, "ko_drag_data", valueAccessor());
             var dragElement = element;
            var dragOptions = {
                helper: function() {
                    //debugger;
                    return $(this).clone()},
                revert: 'true',
               
                appendTo: 'body',
                containment: 'window',
                revertDuration: 100,
                start: function() {
                    _dragged = ko.utils.unwrapObservable(valueAccessor().value);
                },
               
                cursorAt: { top: 20 }
            };
            
            
            //combine options passed into binding (in dragOptions binding) with global options (in ko.bindingHandlers.drag.options)
            var options = ko.utils.extend(ko.bindingHandlers.drag.options, allBindingsAccessor.dragOptions);
            
            //$(dragElement).draggable(dragOptions);
            //initialize draggable
            $(element).draggable(dragOptions).disableSelection();
        },
        options: {}   
    };

    ko.bindingHandlers.drop = {
        init: function(element, valueAccessor, allBindingsAccessor, viewModel) {
            //grab method
             var dropElement = $(element);
            var dropOptions = {
                drop: function(event, ui) {
                    valueAccessor().value(_dragged);
                }
            };
            dropElement.droppable(dropOptions);
           
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
    self.showLogin();
    }

/* Disable shortcuts when search-field gets focus */
$("#inputField").focus(function() {
    shortcutsActive = false;
});

/* Enable shortcuts when search-field loses focus */
$("#inputField").blur(function() {
    shortcutsActive = true;
});

/* ESC to un-focus search-field */
$("#inputField").keydown(function (e) {
    if (e.keyCode == 27) {
        $("#inputField").blur();
    }
});

$("#shortcutModal").keydown(function (e) {
    if ((e.keyCode == 27) || (e.keyCode == 13)) {
        listingViewModel.dismissShortcutModal();
    }
});

var listingViewModel = new ListingsViewModel();
ko.applyBindings(listingViewModel);
$('.overlay').hide();
