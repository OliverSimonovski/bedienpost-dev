// Overall viewmodel for this screen, along with initial state

var demoData = true;
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
        { id: 1, name: "Wachtrij 1", favorite:false, orderNr:"", signInOut:true, waitingAmount:3 },
        { id: 2, name: "Wachtrij 2", favorite:true, orderNr:"", signInOut:false, waitingAmount:7 },
        { id: 3, name: "Wachtrij 3", favorite:true, orderNr:"", signInOut:true, waitingAmount:4 },
        { id: 4, name: "Wachtrij 4", favorite:false, orderNr:"", signInOut:true, waitingAmount:12 },
        { id: 5, name: "Wachtrij 5", favorite:true, orderNr:"", signInOut:false, waitingAmount:23 },
        { id: 6, name: "Wachtrij 6", favorite:true, orderNr:"", signInOut:false, waitingAmount:1 },
        { id: 7, name: "Wachtrij 7", favorite:false,orderNr:"", signInOut:false, waitingAmount:0 },
        { id: 8, name: "Wachtrij 8", favorite:true, orderNr:"", signInOut:true, waitingAmount:0 },
        { id: 9, name: "Wachtrij 9", favorite:true, orderNr:"", signInOut:false, waitingAmount:3 }] )
    }
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
    
    //self.availableLists = ko.observableArray(initialLists);
    self.availableWaitingList = ko.observableArray(initialWaitingQueueList);
    
    self.currentList = ko.observable();
    self.favoriteList = ko.observable();
    self.waitingQueueList = ko.observable();
    self.incomingCallList = ko.observable();
    
    self.clickedListItem = ko.observable();
    self.clickedListItemName = ko.observable();
    self.search = ko.observable();
    
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

            if(!searchParam || searchParam == "Search here"){
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
                         console.log(entry.name);
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
            
            if(!searchParam || searchParam == "Search here"){
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
                         console.log(entry.name);
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
                         console.log(entry.name);
                         filteredEntries.push(entry);
                     }
                 });
                return filteredEntries();
            }
        }
        /*
        if (self.currentList()){
            var filteredEntries = ko.observableArray();
            var shortcutCounter = 0;    
             ko.utils.arrayForEach(self.currentList().entries(), function(entry) {
                 entry = ko.mapping.toJS(entry);
                 entry.name+="";
                 
                 if ((entry.favorite))
                 {
                     if (shortcutCounter < 10){
                        entry.shortcut= shortcutCounter;
                        shortcutCounter++;
                     }
                     console.log(entry.name);
                     filteredEntries.push(entry);
                 }
             });
            return filteredEntries();
        }
        */
    }, self);
    
    self.filterWaitingQueue = ko.computed(function()
    {
         if (self.waitingQueueList()){
            var filteredEntries = ko.observableArray();
            
                 ko.utils.arrayForEach(self.waitingQueueList().entries(), function(entry) {
                     entry.name+="";
                     if ((entry.waitingAmunt))
                     {  
                        console.log(entry.name);
                     }
                     
                     filteredEntries.push(entry);
                 });
                return filteredEntries();
        }                                 
    }, self);
    
    self.incomingCallQueue = ko.computed(function()
    {
         if (self.incomingCallList()){
            var filteredEntries = ko.observableArray();
            
                 ko.utils.arrayForEach(self.incomingCallList().entries(), function(entry) {
                     entry.name+="";
                     if ((entry.waitingAmunt))
                     {  
                        console.log(entry.name);
                     }
                     
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
    
    self.orderQueueUp = function()
    {   
        alert("QueueUp");
    }
    
    self.orderQueueDown = function()
    {
        alert("Queue Down");
    }
    
    self.markFavorite = function()
    {
        alert("Mark Favorite");
    }
    
    self.signInOut = function()
    {
        alert("signInOut")
    }
    
    self.actionCalling = function()
    {
        //alert("Calling");
    }
    
    self.actionConnectThrough = function()
    {
        //alert("actionCallingThrough");
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
            return 'fa fa-sign-in';
        } else {
            return 'fa fa-sign-out';
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
                return 'yellow';
            } else {
                return 'orange'
            }
        } else {
            return 'red';
        }  
    }
    
    self.setSearch = function(searchParam)
    {
        self.search(searchParam);
    }
    

    if (demoData) {
        self.currentList( demoUserLists[0] );
    } else {
        self.currentList( xmppUserLists[0] );
    }

    self.favoriteList( self.favFilteredItems() ) ;
    self.waitingQueueList( initialWaitingQueueList[0] );
    self.incomingCallList( initialIncomingCallList[0] );
    self.setSearch("");
    
    $( "#inputField" ).keydown(function(event)
    {
       if (event.which == 49){
            event.preventDefault();
           self.clickItem;
           alert("Keydown");
       } 
    });
    
    $('#loginModal').modal({
            keyboard: true
    })
}

ko.applyBindings(new ListingsViewModel());


/*
id="#sortable"
 $(function() {
    $( "#sortable" ).sortable();
    $( "#sortable" ).disableSelection();
  });

$(function() {
    $('a[rel*=leanModal]').leanModal({ top : 200, closeButton: ".modal_close" });		
});
*/
