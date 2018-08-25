'use strict';

rainierAppMock.factory('fabricmock', function (mockUtils) {
    var fabrics = [];

    var generateMockFabrics = function () {
        var total = 8;

        while (total-- !== 0) {
            var mockFabric = generateFabric(total);
            fabrics.push(mockFabric);
        }
    };

    var generateFabric = function (v) {
        return {
            'sanFabricId': '1_' + v,
            'virtualFabricId': '28',
            'switchType': 'BROCADE',
            'principalSwitchAddress': '10.76.76.17' + v,
            'principalSwitchUsername': 'admin',
            'principalSwitchPortNumber': '2' + v
        };
    };

    var handleGetRequest = function (urlResult) {
        if (urlResult.subResourceId) {
            var fabric = mockUtils.fromCollection(fabrics, urlResult.subResourceId, 'sanFabricId');
            return (fabric) ? mockUtils.response.ok(fabric) : mockUtils.response.notFound('Unable to find fabric with matching Id.');
        }
        return mockUtils.response.ok(mockUtils.singlePageCollectionResponse(fabrics));
    };


    return {
        init: function () {
            generateMockFabrics();
        },
        getMock: function () {
            return fabrics;
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