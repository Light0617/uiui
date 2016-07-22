'use strict';

rainierAppMock.factory('monitorCapacityMockById', function (monitorMock, mockUtils) {

    var geteMockMonitorCapacityByStorageId = function (v)  {
        //v1/monitoring/status:storageArrayId/capacity
        return {
            "totalComponentWiseCapacityAlerts": "1",
            "capacityComponents": {
                "poolAlerts": true
            }
        };
    };

    var getMockMonitorCapacityResourceTypeById  = function(resourceType, storageArrayId)  {
        //v1/monitorng/status/capacity/:resourceType
        var capacityAlerts = monitorMock.capacityAlert;
        if (resourceType)
            var alerts = _.filter(capacityAlerts, function (alert) {
                return alert.resourceType.toUpperCase() === resourceType.toUpperCase() && alert.storageSerialNumber == storageArrayId;;
            })
        if (alerts) {
            return { capacityAlertInformationList: alerts };
        }
    };

    var handleGetRequest = function (urlResult) {
        if (urlResult.subSubType == null) {
            return mockUtils.response.ok(geteMockMonitorCapacityByStorageId(urlResult.subType));
        } else  {
            return mockUtils.response.ok(getMockMonitorCapacityResourceTypeById(urlResult.subSubType,urlResult.subType));
        }
    };

    return {
        init: function () {
            console.log("aaaaaaaaaaaaaaaaaaaaaaa");
        },
        getMock: function () {
            console.log("aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa");
            return geteMockMonitorCapacityByStorageId();
        },
        handle: function (urlResult) {
            switch (urlResult.method) {
                case 'GET':
                    return handleGetRequest(urlResult);
                default:
                    return mockUtils.response.methodNotAllowed(urlResult.url);
            }
        }
    };
});