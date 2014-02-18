var demoData = false;
var incomingCallEntries = ko.observableArray();
var queueListEntries = ko.observableArray();

var xmppWaitingQueueList = [
    { name: "WaitingQueue List", entries: queueListEntries}
];

var userListEntries = ko.observableArray();
var xmppUserLists = [{ name: "Call List", entries: userListEntries }];



var xmppIncomingCallList = [{ name: "Incoming CallList", entries: incomingCallEntries }];
var initialIncomingCallList = [
    { name: "Incoming CallList", entries: ko.observableArray( [
        { id: 1, name: "Incoming Call 1", timeConnected:"4:50" },
        { id: 2, name: "Incoming Call 2", timeConnected:"2:40" },
        { id: 3, name: "Incoming Call 3", timeConnected:"2:12" },
        { id: 4, name: "Incoming Call 4", timeConnected:"0:56" }] )        
    }
];


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

var demoUserLists = [
    { name: "Call List", entries: ko.observableArray( [
         { id: 1, name: "Receptie DraadloosDraadloosDraadloos", shortcut:"", favorite:true, ext:"264,254", log:true, avail:true, ringing:true, connectedName:"Lambert Storingsdienst", connectedNr:"070123456789", callDuration:0 },
         { id: 2, name: "Thomas Winkelman", shortcut:"", favorite:false, ext:"130,140", log:true, avail:false, ringing:true, connectedName:"", connectedNr:"", callDuration:0 },
         { id: 3, name: "Joop Aanstoot", shortcut:"", favorite:true, ext:"130,140", log:false, avail:false, ringing:true, connectedName:"", connectedNr:"", callDuration:0 },
         { id: 4, name: "Bart Meijerink", shortcut:"", favorite:false, ext:"130,140", log:true,  avail:false, ringing:true, connectedName:"", connectedNr:"", callDuration:0 },
         { id: 5, name: "Patrick Van der Veen", shortcut:"", favorite:false, ext:"130,140", log:true, avail:false, ringing:false, connectedName:"Richard Kamphuis", connectedNr:"070123456789", callDuration:144000 },
         { id: 6, name: "Nicole Roskamp", shortcut:"", favorite:false, ext:"130,140", log:true, avail:false, ringing:false, connectedName:"", connectedNr:"", callDuration:0 },
         { id: 7, name: "Remko Uland", shortcut:"", favorite:true, ext:"130,140", log:true, avail:false, ringing:false, connectedName:"", connectedNr:"", callDuration:0 },
         { id: 8, name: "Richard Kamphuis", shortcut:"", favorite:false, ext:"130,140", log:true, avail:false, ringing:true, connectedName:"", connectedNr:"", callDuration:0 },
         { id: 9, name: "Tom Waanders", shortcut:"", favorite:false, ext:"130,140", log:true, avail:false, ringing:true, connectedName:"070123456789", connectedNr:"", callDuration:55000 },
         { id: 10, name: "Martin Kamphuis", shortcut:"", favorite:true, ext:"130,140", log:true, avail:false, ringing:true, connectedName:"", connectedNr:"", callDuration:0 },
         { id: 11, name: "Support 1e Lijns", shortcut:"", favorite:false, ext:"130,140", log:true, avail:false, ringing:false, connectedName:"070123456789", connectedNr:"", callDuration:36200000 },
         { id: 12, name: "Lambert Storingsdienst", shortcut:"", favorite:false, ext:"130,140", log:true, avail:false, ringing:true, connectedName:"", connectedNr:"", callDuration:0 },
         { id: 13, name: "Maurice", shortcut:"", favorite:false, ext:"130,140", log:true, avail:false, ringing:false, connectedName:"", connectedNr:"", callDuration:0 },
         { id: 14, name: "Pascal", shortcut:"", favorite:false, ext:"130,140", log:true, avail:false, ringing:true, connectedName:"", connectedNr:"", callDuration:0 },
         { id: 15, name: "Roland", shortcut:"",  favorite:false, ext:"130,140", log:true, avail:false, ringing:true, connectedName:"", connectedNr:"", callDuration:0 },
         { id: 16, name: "Wim", shortcut:"", favorite:false, ext:"130,140", log:true, avail:false, ringing:true, connectedName:"", connectedNr:"", callDuration:0}] )
    }
];