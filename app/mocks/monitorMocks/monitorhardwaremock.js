'use strict';

rainierAppMock.factory('monitorHardwareMock', function (monitorMock, mockUtils) {

    var getMockMonitorHardware = function ()  {
        //v1/monitoring/status/hardware & /v1/monitoring/status:storageArrayId/hardware
        return {
            'totalComponentWiseHardwareAlerts': 4,
            'hardwareComponents': {
                'diskAlerts': true,
                'powerSupplyAlerts': true,
                'batteryAlerts': true,
                'fanAlerts': false,
                'portAlerts': true,
                'cacheAlerts': false,
                'memoryAlerts': false,
                'processorAlerts': false
            }
        };
    };

    var getMockMonitorHardwareResourceType  = function(resourceType)  {
        var diskAlerts = monitorMock.diskAlert;
        var hardwareAlerts = monitorMock.hardwareAlert;
        //v1/monitorng/status/hardware/:resourceType & v1/monitoring/status/:storageArrayId/hardware/:resourceType
        var alerts = _.filter(resourceType === 'disk' ? diskAlerts : hardwareAlerts, function (alert) {
            return alert.resourceType.toUpperCase() === resourceType.toUpperCase();
        });
        if (alerts)  {
            return resourceType === 'disk' ? { diskAlertInformationList: alerts } : { alertInformationList: alerts };
        }
    };

    var handleGetRequest = function (urlResult) {
        if (urlResult.subResourceId === null) {
            return mockUtils.response.ok(getMockMonitorHardware());
        } else  {
            return mockUtils.response.ok(getMockMonitorHardwareResourceType(urlResult.subResourceId));
        }
    };

    return {
        getMockResourceType: getMockMonitorHardwareResourceType,
        init: function () {
        },
        getMock: function () {
            return getMockMonitorHardware();
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