'use strict';

rainierAppMock.factory('virtualStorageMachineMock', function (mockUtils) {
    var virtualStorageMachines = [];

    var generateMockVirtualStorageMachines = function () {
        var total = 20;

        while (total-- !== 0) {
            var mockVirtualStorageMachines = generateVirtualStorageMachines(total);
            virtualStorageMachines.push(mockVirtualStorageMachines);
        }
    };

    var generateVirtualStorageMachines = function (v) {
        var virtualStorageSystemId = '41000' + v;
        var physicalStorageSystemId = '41000' + _.random(1, 20);
        return {
            storageSystemId: virtualStorageSystemId,
            model: 'HM800',
            pairHACount: _.random(1, 50),
            physicalStorageSystems: [virtualStorageSystemId, physicalStorageSystemId]
        };
    };

    var handleGetRequest = function () {
        return mockUtils.response.ok(mockUtils.singlePageCollectionResponse(virtualStorageMachines));
    };

    return {
        init: function () {
            generateMockVirtualStorageMachines();
        },
        getMock: function () {
            return virtualStorageMachines;
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