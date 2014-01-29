// Overall viewmodel for this screen, along with initial state

var initialWaitingQueueList = [
    { name: "WaitingQueue List", entries: ko.observableArray( [
        { id: 1.1, name: "Wachtrij 1", waitingAmount:"3" },
        { id: 1.2, name: "Wachtrij 2", waitingAmount:"4" },
        { id: 1.3, name: "Wachtrij 3", waitingAmount:true },
        { id: 1.4, name: "Wachtrij 4", waitingAmount:true },
        { id: 1.5, name: "Wachtrij 5", waitingAmount:true },
        { id: 1.6, name: "Wachtrij 6", waitingAmount:true },
        { id: 1.7, name: "Wachtrij 7", waitingAmount:true },
        { id: 1.8, name: "Wachtrij 8", waitingAmount:true },
        { id: 1.9, name: "Wachtrij 9", waitingAmount:true }] )
    }
];

var userListEntries = ko.observableArray();
var initialLists = [{ name: "Call List", entries: userListEntries }];

var initialLists = [
    { name: "Call List", entries: ko.observableArray( [
        { id: 1.1, name: "Richard", favorite:true, ext:"264,254", log:true, avail:true , connectedWith:"070123456789" },
        { id: 1.2, name: "Tijs", favorite:false, ext:"130,140", log:true, avail:false, connectedWith:"" },
        { id: 1.3, name: "Jeroen", favorite:true, ext:"130,140", log:false, avail:false, connectedWith:"" },
        { id: 1.4, name: "Robert", favorite:false, ext:"130,140", log:true,  avail:false, connectedWith:"" },
        { id: 1.5, name: "Paul", favorite:false, ext:"130,140", log:true, avail:false, connectedWith:"070123456789" },
        { id: 1.6, name: "Laszlo", favorite:false, ext:"130,140", log:true, avail:false, connectedWith:"" },
        { id: 1.7, name: "Nathan", favorite:true, ext:"130,140", log:true, avail:false, connectedWith:"" },
        { id: 1.8, name: "Steve", favorite:false, ext:"130,140", log:true, avail:false, connectedWith:"" },
        { id: 1.9, name: "Helga", favorite:false, ext:"130,140", log:true, avail:false, connectedWith:"070123456789" },
        { id: 1.10, name: "Michiel", favorite:true, ext:"130,140", log:true, avail:false, connectedWith:"" },
        { id: 1.11, name: "Christian", favorite:false, ext:"130,140", log:true, avail:false, connectedWith:"070123456789" },
        { id: 1.12, name: "Peter", favorite:false, ext:"130,140", log:true, avail:false, connectedWith:"" },
        { id: 1.13, name: "Maurice", favorite:false, ext:"130,140", log:true, avail:false, connectedWith:"" },
        { id: 1.1, name: "Pascal", favorite:false, ext:"130,140", log:true, avail:false, connectedWith:"" },
        { id: 1.7, name: "Roland", favorite:false, ext:"130,140", log:true, avail:false, connectedWith:"" },
        { id: 1.8, name: "Wim", favorite:false, ext:"130,140", log:true, avail:false, connectedWith:"" }] )
    }
];

var ListingsViewModel = function(){
    var self = this;
    
    self.availableLists = ko.observableArray(initialLists);
    self.availableWaitingList = ko.observableArray(initialWaitingQueueList);
    
    self.currentList = ko.observable();
    self.favoriteList = ko.observable();
    self.waitingQueueList = ko.observable();
    
    self.search = ko.observable();
    self.currentList.subscribe(function(){
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
                ko.utils.arrayForEach(self.currentList().entries(), function(entry) {
                     entry = ko.mapping.toJS(entry);
                     entry.name+="";
                     if ((entry.name.toLowerCase()).indexOf(searchParam) > -1)
                     {
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
            var filteredEntries = ko.observableArray();
            
                 ko.utils.arrayForEach(self.currentList().entries(), function(entry) {
                     entry = ko.mapping.toJS(entry);
                     entry.name+="";
                     if ((entry.favorite))
                     {
                         console.log(entry.name);
                         filteredEntries.push(entry);
                     }
                 });
                return filteredEntries();
        }
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
    
    self.logCssClass = function(logged)
    {
        if (logged == true) {
            return 'fa fa-check-circle';
        } else {
            return 'fa fa-minus-circle';
        }                                       
    };
    
    self.colorClass = function(avail, logged)
    {
        if (logged == true) {
            if (avail == true){
                 return 'green';
            } else {
                return 'red';
            }
        } else {
            return 'white';
        }  
    }
    
    self.setSearch = function(searchParam)
    {
        self.search(searchParam);
    }
    
    self.currentList( initialLists[0] );
    self.favoriteList( self.favFilteredItems() ) ;
    self.waitingQueueList( initialWaitingQueueList[0] );
    ///self.waitingQueueList( self.filterWaitingQueue() );
    
    self.setSearch("");
}

ko.applyBindings(new ListingsViewModel());

$(function() {
    $('a[rel*=leanModal]').leanModal({ top : 200, closeButton: ".modal_close" });		
});
