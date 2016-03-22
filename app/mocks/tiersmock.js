'use strict';

rainierAppMock.factory('tiersMock', function (mockUtils) {
    var handleGetRequest = function () {
        return {'tiers':[{'id':'1','tier':'Platinum','subTiers':[{'diskType':'SSD','speed':0},{'diskType':'FMD DC2','speed':0},{'diskType':'FMD','speed':0}]},{'id':'2','tier':'Gold','subTiers':[{'diskType':'SAS','speed':15000}]},{'id':'3','tier':'Silver','subTiers':[{'diskType':'SAS','speed':10000}]},{'id':'4','tier':'Bronze','subTiers':[{'diskType':'SAS','speed':7200}]},{'id':'5','tier':'External','subTiers':[]}]};
    };

    return {
        init: function () {
        },
        getMock: function () {
        },
        handle: function (urlResult) {
            switch (urlResult.method) {
                case 'GET':
                    return mockUtils.response.ok(handleGetRequest());
                default:
                    return mockUtils.response.methodNotAllowed(urlResult.url);
            }
        }
    };
});