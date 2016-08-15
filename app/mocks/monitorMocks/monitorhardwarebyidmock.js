'use strict';

rainierAppMock.factory('monitorHardwareMockById', function (monitorMock, monitorHardwareMock, mockUtils) {

    var getMockMonitorHardwareByIdResourceType  = function(resourceType, storageArrayId)  {
        var diskAlerts = monitorMock.diskAlert;
        var hardwareAlerts = monitorMock.hardwareAlert;
        //v1/monitorng/status/hardware/:resourceType & v1/monitoring/status/:storageArrayId/hardware/:resourceType
        var alerts = _.filter(resourceType === 'disk' ? diskAlerts : hardwareAlerts, function (alert) {
            return alert.resourceType.toUpperCase() === resourceType.toUpperCase() && alert.storageSerialNumber === storageArrayId;
        });
        if (alerts)  {
            return resourceType === 'disk' ? { diskAlertInformationList: alerts } : { alertInformationList: alerts };
        }
    };

    var handleGetRequest = function (urlResult) {
        if (urlResult.subSubType === null) {
            return mockUtils.response.ok(monitorHardwareMock.getMock());
        } else  {
            return mockUtils.response.ok(getMockMonitorHardwareByIdResourceType(urlResult.subSubType, urlResult.subType));
        }
    };

    return {
        init: function () {
        },
        getMock: function () {
            return monitorHardwareMock.getMock();
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