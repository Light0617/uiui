'use strict';

rainierAppMock.factory('savingsSummaryMock', function (mockUtils) {
    var handleGetRequest = function () {
        return {
            'dataReductionSavingsRate': 2.1,
            'capacityEfficiencyRate' : 3.2
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