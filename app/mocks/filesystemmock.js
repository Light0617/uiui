'use strict';

rainierAppMock.factory('fileSystemMock', function (mockUtils) {
    var filesystems = [];

    var generateFileSystems = function () {
        var total = 50;

        while (total-- !== 0) {
            var mockFS = generateFileSystem(total);
            filesystems.push(mockFS);
        }
    };

    var generateFileSystem = function (v) {
        var capacityInfo = mockUtils.getCapacityInformation(100, 200);
        return {

            'id': '1' + v,
            'label': 'File System' + v,
            'filePoolId': 11,
            'evsId': v + 1,
            'fileSystemCapacityDetails': {
                'capacity': capacityInfo.totalCapacity,
                'freeCapacity': capacityInfo.freeCapacity,
                'usedCapacity': capacityInfo.usedCapacity,
                'expansionLimit': capacityInfo.totalCapacity,
                'unlimitedExpansion': mockUtils.trueOrFalse()
            },
            'status': mockUtils.trueOrFalse() ? 'Mounted' : 'Not Mounted',
            'blockSize': mockUtils.trueOrFalse() ? 4096 : 32768,
            'fileSystemTraits': {
                'readOnly': mockUtils.trueOrFalse(),
                'sysLocked': mockUtils.trueOrFalse(),
                'worm': mockUtils.trueOrFalse(),
                'nonStrictWorm': mockUtils.trueOrFalse(),
                'readCache': mockUtils.trueOrFalse(),
                'objectReplicationTarget': mockUtils.trueOrFalse(),
                'ndmRecoveryTarget': mockUtils.trueOrFalse(),
                'dedupeSupported': mockUtils.trueOrFalse(),
                'dedupeEnabled': mockUtils.trueOrFalse()
            },
            'links': [
                {
                    'rel': '_self',
                    'href': ''
                },
                {
                    'rel': '_filePool1',
                    'href': '/#/storage-systems/1/file-pools/' + v
                },
                {
                    'rel': '_vfs',
                    'href': '/#/storage-systems/22001/vfs/' + mockUtils.uuid()
                }
            ]
        };
    };

    var handleGetRequest = function (urlResult) {
        if (urlResult.subResourceId && !(urlResult.subType === 'file-pools' || urlResult.subType === 'vfs')) {
            var filesystem = mockUtils.fromCollection(filesystems, urlResult.subResourceId, 'id');
            return (filesystem) ? mockUtils.response.ok(filesystem) : mockUtils.response.notFound('Unable to find filesystem with matching Id.');
        }
        return mockUtils.response.ok(mockUtils.collectionResponse(filesystems, 'fileSystems'));
    };


    return {
        init: function () {
            generateFileSystems();
        },
        getMock: function () {
            return filesystems;
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