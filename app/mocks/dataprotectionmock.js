'use strict';

rainierAppMock.factory('dataProtectionMock', function(mockUtils) {
    var numberOfStorageSystems = 64;
    var hostDpAlert = {
        'hostDpAlert': 6
    };
    var volumeDpAlert = {
        'volumeAlerts': 6
    };

    var handleGetRequest = function (urlResult){
        if (urlResult.resourceId === 'server') {
            if (urlResult.subResourceId && urlResult.subResourceId === 'alert') {
                return mockUtils.response.ok(volumeDpAlert);
            } else {
                return mockUtils.response.ok(hostDpAlert);
            }
        }
        if (urlResult.resourceId === 'volumes') {
            return mockUtils.response.ok(volumeDpAlert);
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
        if (urlResult.subResourceId === 'servers') {
            return mockUtils.response.ok({servers:[]});
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