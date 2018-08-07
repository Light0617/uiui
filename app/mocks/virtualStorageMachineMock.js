'use strict';

rainierAppMock.factory('virtualStorageMachineMock', function (mockUtils) {
    var virtualStorageMachines = [];

    var generateMockVirtualStorageMachines = function () {
        var total = 1;

        while (total-- !== 0) {
            var mockVirtualStorageMachines = generateVirtualStorageMachines(total);
            virtualStorageMachines.push(mockVirtualStorageMachines);
        }
    };

    var generateVirtualStorageMachines = function () {
        // var virtualStorageSystemId = '41000' + v;
        // var physicalStorageSystemId = '41000' + _.random(1, 20);
        return {
            virtualStorageMachineId: '22006' + _.random(0, 9) + '-VSPG' + _.random(9, 10) + '00',
            storageSystemId: '22006' + _.random(0, 9),
            model: 'VSP G' + _.random(9, 10) + '00',
            pairHACount: _.random(1, 50),
            physicalStorageSystemIds: ['220063', '220061']
        };
    };

    var gadPairs = [
        {
            volumePairGroup: 'RL-Multiple-snaps-123',
            primary: {
                volumeId: '1',
                storageSystemId: '921931',
                status: 'PSUS',
                quorumId: 10
            },
            secondary: {
                volumeId: '2',
                storageSystemId: '410031',
                status: 'SSUS',
                quorumId: 10
            },
            splitTime: 1462441131000,
            type: 'SNAP',
            state: 'NORMAL'
        }
    ];

    var handleGetRequest = function (urlResult) {
        if(urlResult.url.match('gad-pairs$')) {
            return mockUtils.response.ok(mockUtils.singlePageCollectionResponse(gadPairs));
        } else {
            return mockUtils.response.ok(mockUtils.singlePageCollectionResponse(virtualStorageMachines));
        }
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