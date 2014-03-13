var BeheerModel = function() {
    var self = this;

    self.phoneIp = ko.observable("");
    self.phoneUser = ko.observable("");
    self.phonePass = ko.observable("");

    self.username = ko.observable("");
    self.server = ko.observable("");
    self.password = ko.observable("");
    self.company = ko.observable("");

    self.submitSimple = function() {

    }

    self.submitPhoneAuth = function() {

    }
}

var beheerModel = new BeheerModel();
ko.applyBindings(beheerModel);

