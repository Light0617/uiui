'use strict';

rainierAppMock.factory('unifiedReportingMock', function (mockUtils) {
    var handleGetRequest = function () {
        return {
            'physicalCapacity': mockUtils.getCapacity(100, 200),
            'overcommitCapacity': mockUtils.getCapacity(200, 300),
            'usedCapacity': mockUtils.getCapacity(50, 100)
        };
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