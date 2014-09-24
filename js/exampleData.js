var demoData = false;

var incomingCallEntries = ko.observableArray();
var queueListEntries = ko.observableArray();
var userListEntries = ko.observableArray();

var xmppWaitingQueueList = [
    { name: "WaitingQueue List", entries: queueListEntries}
];
var xmppUserLists = [{ name: "Call List", entries: userListEntries }];
var xmppIncomingCallList = [{ name: "Incoming CallList", entries: incomingCallEntries }];

var initialIncomingCallList = [
    { name: "Incoming CallList", entries: ko.observableArray( [
        { id: 1, name: "Incoming Call 1", timeConnected:"4:50" }] )
    }
];


var initialWaitingQueueList = [
    { name: "WaitingQueue List", entries: ko.observableArray( [
        { id: 1, name: "Wachtrij 1", favorite:ko.observable(true), orderNr:"", signInOut:ko.observable(true), waitingAmount:3 }] )
    }
];

var demoUserLists = [
    { name: "Call List", entries: ko.observableArray( [
         { id: 1, name: "Receptie DraadloosDraadloosDraadloos", shortcut:"", favorite:true, ext:"264,254", log:true, avail:true, ringing:true, connectedName:"Lambert Storingsdienst", connectedNr:"070123456789", callDuration:0 }] )
    }
];

var contactUsersDemoData = [
    {    id: "cl1",
         name: "Tinus Testuser",
         numbers:[
             {name: "home", number: "0413230007"},
             {name: "work", number: "0702040167"},
             {name: "mobile", number: "0622130610"}
        ]
    },
    {   id: "cl2",
        name: "Tomas Testuser",
        numbers:[
            {name: "work", number: "0702040167"},
            {name: "mobile", number: "0622130610"}
        ]
    },
    {   id: "cl3",
        name: "Tappie Testuser",
        numbers:[
            {name: "mobile", number: "0622130610"}
        ]
    },
    {   id: "cl4",
        name: "Rinus Raarnummer",
        numbers:[
            {name: "raarNummer", number: "1234567890"}
        ]
    }
];