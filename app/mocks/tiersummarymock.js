'use strict';

rainierAppMock.factory('tierSummaryMock', function (mockUtils) {
    var handleGetRequest = function () {
        return {
            'tierSummaryItems': [
                {
                    'freeCapacity': '0',
                    'tierName': 'Gold',
                    'totalCapacity': '3458572746752'
                },
                {
                    'freeCapacity': '1181537009664',
                    'tierName': 'Platinum',
                    'totalCapacity': '1181537796096'
                },
                {
                    'freeCapacity': '1729179942912',
                    'tierName': 'External',
                    'totalCapacity': '1729179942912'
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