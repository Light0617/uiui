'use strict';

rainierAppMock.factory('filePoolMock', function(mockUtils) {
    var filePools = [];

    var generateMockFilePools = function() {
        var total = 64;

        while (total-- !== 0) {
            var mockFilePool = generateMockFilePool(total);
            filePools.push(mockFilePool);
        }
    };

    var generateMockFilePool = function(v) {
        var capacityInfo = mockUtils.getCapacityInformation(100, 150);
        var chunkSize = mockUtils.getCapacity(50, 100);
        var storageSystemId = 12345;
        var poolId1 = 1;
        var poolId2 = 2;
        var filePoolId = 1;
        var tiered = mockUtils.trueOrFalse();
        return {
            'id': v.toString(),
            'label':'File Pool ' + v,
            'totalCapacity': capacityInfo.totalCapacity,
            'freeCapacity': capacityInfo.freeCapacity,
            'usedCapacity': capacityInfo.usedCapacity,
            'physicalCapacity': capacityInfo.physicalCapacity,
            'healthy': mockUtils.trueOrFalse(),
            'chunkSize': chunkSize,
            'tiered': tiered,
            'tierNames' : tiered ? ['Platinum', 'Gold'] : ['Platinum'],
            'links':[
                {
                    'rel':'_self',
                    'href':''
                },
                {
                    'rel':'_poolId1',
                    'href':'/#/storage-systems/' + storageSystemId + '/storage-pools/' + poolId1
                },
                {
                    'rel':'_poolId2',
                    'href':'/#/storage-systems/' + storageSystemId + '/storage-pools/' + poolId2
                },
                {
                    'rel':'_fileSystems',
                    'href':'/#/storage-systems/' + storageSystemId + '/file-pools/' + filePoolId + '/file-systems'
                }
            ]
        };
    };

    var handleGetRequest = function (urlResult){
        if (urlResult.subResourceId) {
            var filePool = mockUtils.fromCollection(filePools, urlResult.subResourceId, 'id');
            return (filePool) ? mockUtils.response.ok(filePool) : mockUtils.response.notFound('Unable to find endpoint with matching Id.');
        }

        return mockUtils.response.ok(mockUtils.collectionResponse(filePools, 'filePools'));
    };

    return {
        init: function() {
            generateMockFilePools();
        },
        getMock: function() {
            return filePools;
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