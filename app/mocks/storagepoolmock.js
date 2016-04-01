'use strict';

rainierAppMock.factory('storagePoolMock', function(mockUtils) {
    var storagePools = [];

    var generateMockStoragePools = function() {
        var total = 64;

        while (total-- !== 0) {
            var mockStoragePool = generateMockStoragePool(total);
            storagePools.push(mockStoragePool);
        }
    };

    var generateMockStoragePool = function(v) {
        var capacityInfo = mockUtils.getCapacityInformation(100, 150);
        var chunkSize = mockUtils.getCapacity(50, 100);
        var storageSystemId = 12345;
        var poolId1 = 1;
        var poolId2 = 2;
        return {
            'id': v,
            'label':'Storage Pool ' + v,
            'totalCapacity': capacityInfo.totalCapacity,
            'freeCapacity': capacityInfo.freeCapacity,
            'usedCapacity': capacityInfo.usedCapacity,
            'healthy': mockUtils.trueOrFalse(),
            'chunkSize': chunkSize,
            'tiered': mockUtils.trueOrFalse(),
            'tier': 'tier' + mockUtils.randomInt(0,3),
            'links':[
                {
                    'rel':'_self',
                    'href':''
                },
                {
                    'rel':'_poolId1',
                    'href':'/v1/storage-systems/' + storageSystemId + '/storage-pools/' + poolId1
                },
                {
                    'rel':'_poolId2',
                    'href':'/v1/storage-systems/' + storageSystemId + '/storage-pools/' + poolId2
                }
            ]
        };
    };

    var handleGetRequest = function (urlResult){
        if (urlResult.subResourceId) {
            var storagePool = mockUtils.fromCollection(storagePools, parseInt(urlResult.subResourceId), 'id');
            return (storagePool) ? mockUtils.response.ok(storagePool) : mockUtils.response.notFound('Unable to find endpoint with matching Id.');
        }

        var paginatedPools = {
            resources: storagePools,
            nextToken: null,
            total: storagePools.length
        };

        return mockUtils.response.ok(paginatedPools);
    };

    return {
        init: function() {
            generateMockStoragePools();
        },
        getMock: function() {
            return storagePools;
        },
        handle: function(urlResult) {
            switch (urlResult.method) {
                case 'GET':
                    return handleGetRequest(urlResult);
                default:
                    return mockUtils.response.methodNotAllowed(urlResult.url);
            }
        }
    };
});