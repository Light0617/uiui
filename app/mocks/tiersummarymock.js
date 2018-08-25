'use strict';

rainierAppMock.factory('tierSummaryMock', function (mockUtils) {
    var handleGetRequest = function () {
        return {
            'tierSummaryItems': [
                {
                    'freeCapacity': mockUtils.getCapacity(1, 50),
                    'tierName': 'Bronze',
                    'totalCapacity': mockUtils.getCapacity(50, 100)
                },
                {
                    'freeCapacity': mockUtils.getCapacity(1, 50),
                    'tierName': 'Silver',
                    'totalCapacity': mockUtils.getCapacity(50, 100)
                },
                {
                    'freeCapacity': mockUtils.getCapacity(1, 50),
                    'tierName': 'Gold',
                    'totalCapacity': mockUtils.getCapacity(50, 100)
                },
                {
                    'freeCapacity': mockUtils.getCapacity(1, 50),
                    'tierName': 'Platinum',
                    'totalCapacity': mockUtils.getCapacity(50, 100)
                },
                {
                    'freeCapacity': mockUtils.getCapacity(1, 50),
                    'tierName': 'External',
                    'totalCapacity': mockUtils.getCapacity(50, 100)
                }
            ]
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