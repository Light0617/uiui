'use strict';

rainierAppMock.factory('dataProtectionMock', function(mockUtils) {
    var numberOfStorageSystems = 64;

    var handleGetRequest = function (urlResult){
        if (urlResult.resourceId === 'servers') {
            var hostDpAlert = {
                'hostDpAlert': 6
            };
            return mockUtils.response.ok(hostDpAlert);
        }
        if (urlResult.resourceId === 'volumes') {
            var volumeAlerts = {
                'volumeAlerts': 6
            };
            return mockUtils.response.ok(volumeAlerts);
        }
        if (urlResult.resourceId === 'summary' || urlResult.subResourceId === 'summary') {
            var thinUsed = parseInt(mockUtils.getCapacity(400 * numberOfStorageSystems, 400 * numberOfStorageSystems));

            var capacityInfo = {
                'protectedCapacity': parseInt((thinUsed * 0.2)).toString(),
                'unprotectedCapacity': parseInt((thinUsed * 0.5)).toString(),
                'secondaryCapacity': parseInt((thinUsed * 0.3)).toString(),
                'protectedVolumes': 8,
                'unprotectedVolumes': 11,
                'secondaryVolumes': 12
            };
            return mockUtils.response.ok(capacityInfo);
        }
    };

    return {
        init: function() {

        },
        getMock: function() {
            return [];
        },
        handle: function(urlResult) {
            switch (urlResult.method) {
                case 'GET':
                    return handleGetRequest(urlResult);
                default:
                    return mockUtils.response.methodNotAllowed(urlResult.url);
            }
        }
    };
});