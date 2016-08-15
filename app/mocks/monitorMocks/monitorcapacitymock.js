'use strict';

rainierAppMock.factory('monitorCapacityMock', function (monitorMock, mockUtils) {

    var getMockMonitorCapacity = function () {
        //v1/monitoring/status/capacity & /v1/monitoring/status:storageArrayId/capacity
        return {
            'totalComponentWiseCapacityAlerts': '1',
            'numOfCriticalAlerts': '2',
            'numOfWarningAlerts': '3',
            'capacityComponents': {
                'poolAlerts': true
            }
        };
    };

    var getMockMonitorCapacityResourceType  = function(resourceType)  {
        //v1/monitorng/status/capacity/:resourceType
        var capacityAlerts = monitorMock.capacityAlert;
        if (resourceType) {
            var alerts = _.filter(capacityAlerts, function (alert) {
                return alert.resourceType.toUpperCase() === resourceType.toUpperCase();
            });
            if (alerts) {
                return {capacityAlertInformationList: alerts};
            }
        }
    };
/*
     var generateMockMonitorCapacityResourceTypeByStorageSystemId  = function(resourceType, storageArrayId)  {
     //v1/monitorng/status/capacity/:resourceType
     if (resourceType)
     var alerts = _.filter(capacityAlerts, function (alert) {
     return alert.resourceType.toUpperCase() === resourceType.toUpperCase() && alert.storageSerialNumber == storageArrayId;;
     })
     if (alerts) {
     return { capacityAlertInformationList: alerts };
     }
     };
     */
    var handleGetRequest = function (urlResult) {
        if (urlResult.subResourceId === null) {
            return mockUtils.response.ok(getMockMonitorCapacity());
        } else  {
            return mockUtils.response.ok(getMockMonitorCapacityResourceType(urlResult.subResourceId));
        }
    };

    return {
        init: function () {
        },
        getMock: function () {
            return getMockMonitorCapacity();
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