// Overall viewmodel for this screen, along with initial state
var initialCallList = [
    
];

var userListEntries = ko.observableArray();

var initialLists = [
    { name: "Call List", entries: userListEntries/* [
        { id: 1.1, name: "Richard", favorite:true, ext:"264,254", log:true, avail:true  },
        { id: 1.2, name: "Tijs", favorite:false, ext:"130,140", log:true, avail:false },
        { id: 1.3, name: "Jeroen", favorite:true, ext:"130,140", log:false, avail:false },
        { id: 1.4, name: "Robert", favorite:false, ext:"130,140", log:true,  avail:false },
        { id: 1.5, name: "Paul", favorite:false, ext:"130,140", log:true, avail:false },
        { id: 1.6, name: "Laszlo", favorite:false, ext:"130,140", log:true, avail:false },
        { id: 1.7, name: "Nathan", favorite:true, ext:"130,140", log:true, avail:false },
        { id: 1.8, name: "Steve", favorite:false, ext:"130,140", log:true, avail:false },
        { id: 1.9, name: "Helga", favorite:false, ext:"130,140", log:true, avail:false },
        { id: 1.10, name: "Michiel", favorite:true, ext:"130,140", log:true, avail:false },
        { id: 1.11, name: "Christian", favorite:false, ext:"130,140", log:true, avail:false },
        { id: 1.12, name: "Peter", favorite:false, ext:"130,140", log:true, avail:false },
        { id: 1.13, name: "Maurice", favorite:false, ext:"130,140", log:true, avail:false },
        { id: 1.1, name: "Pascal", favorite:false, ext:"130,140", log:true, avail:false },
        { id: 1.7, name: "Roland", favorite:false, ext:"130,140", log:true, avail:false },
        { id: 1.8, name: "Wim", favorite:false, ext:"130,140", log:true, avail:false }] )*/
    },
    { name: "Favorites", entries: ko.observableArray( [
        { id: 2.1, name: "Tijs", favorite:true, ext:"264,254", log:true, avail:true  },
        { id: 2.2, name: "Robert", favorite:false, ext:"130,140", log:true, avail:false },
        { id: 2.3, name: "Michiel", favorite:true, ext:"130,140", log:false, avail:false },
        { id: 2.4, name: "Maurice", favorite:false, ext:"130,140", log:true,  avail:false },
        { id: 2.5, name: "Pascal", favorite:false, ext:"130,140", log:true, avail:false },
        { id: 2.6, name: "Roland", favorite:false, ext:"130,140", log:true, avail:false },
        { id: 2.7, name: "Wim", favorite:false, ext:"130,140", log:true, avail:false },
        { id: 2.8, name: "2.Eight", favorite:false, ext:"130,140", log:true, avail:false }] )
    }
    /*,
    { name: "Active Transfers", entries: ko.observableArray( [
        { name: "3.One", value: 3.1 },
        { name: "3.Two", value: 3.2 },
        { name: "3.Three", value: 3.3 },
        { name: "3.Four", value: 3.4 },
        { name: "3.Five", value: 3.5 },
        { name: "3.Six", value:  3.6 },
        { name: "3.Seven", value: 3.7 },
        { name: "3.Eight", value: 3.8 }] )
    }
    */
];

var ListingsViewModel = function(){
    var self = this;
    
    self.availableLists = ko.observableArray(initialLists);
    
    self.currentList = ko.observable();
    self.search = ko.observable();
    self.currentList.subscribe(function(){
        self.search(""); 
    });

    self.filteredItems = ko.computed(function() {
        if (self.currentList()){
            var searchParam = self.search();
            searchParam +="";
            var filteredEntries = ko.observableArray();
            if(!searchParam || searchParam == "Search here"){
                return self.currentList().entries();
            } else {
                ko.utils.arrayForEach(self.currentList().entries(), function(entry) {
                     entry = ko.mapping.toJS(entry);
                     entry.name+="";
                     if ((entry.name).indexOf(searchParam) > -1)
                     {
                         console.log(entry.name);
                         filteredEntries.push(entry);
                     }
                 });
                return filteredEntries();
            }
        }
    }, self);
    
    self.favFilteredItems = ko.computed(function() {
        if (self.currentList()){
            var searchParam = self.search();
            searchParam +="";
            var filteredEntries = ko.observableArray();
            if(!searchParam || searchParam == "Search here"){
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
            } else {
                ko.utils.arrayForEach(self.currentList().entries(), function(entry) {
                     entry = ko.mapping.toJS(entry);
                     entry.name+="";
                     if ((entry.name).indexOf(searchParam) > -1 && (entry.favorite))
                     {
                         console.log(entry.name);
                         filteredEntries.push(entry);
                     }
                 });
                return filteredEntries();
            }
        }
    }, self);
    
    self.favCssClass = function(value)
    {
        if (value == true) {
            return 'fa fa-check-circle';
        } else {
            return 'fa fa-minus-circle';
        }                                       
    };
    
    /*
    self.availlogCssClass = function(avail, log)
    {
        if (log == true) {
            if (avail){
                return 'fa fa-star';
            } else {
                return 'fa fa-star';
            }
        } else {
            return 'fa fa-star-o';
        }         
    }
    */
    
    self.setSearch = function(searchParam)
    {
        self.search(searchParam);
    }
    
    self.currentList(initialLists[0]);
    self.setSearch("");
}

ko.applyBindings(new ListingsViewModel());

	$(function() {
    			$('a[rel*=leanModal]').leanModal({ top : 200, closeButton: ".modal_close" });		
			});