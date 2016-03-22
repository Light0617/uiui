'use strict';

rainierAppMock.factory('storageSystemMock', function(mockUtils) {
    var storageSystems = [];

    var generateMockStorageSystems = function() {
        var total = 64;

        while (total-- !== 0) {
            var mockStorageSystem = generateMockStorageSystem(total);
            storageSystems.push(mockStorageSystem);
        }
    };

    var generateMockStorageSystem = function(v) {
        var total = mockUtils.getCapacity(800, 1000);
        var physicalUsed = mockUtils.getCapacity(500, 700);
        var used = mockUtils.getCapacity(200, 400);


        return {
            'storageSystemId': '2200' + v,
            'unified': mockUtils.trueOrFalse(),
            'model': 'VSP G400',
            'svpIpAddress': '10.20.90.1' + v,
            'gum1IpAddress': '10.20.90.2' + v,
            'gum2IpAddress': '10.20.90.3' + v,
            'firmwareVersion': 'v1.0',
            'horcmVersion': 'v1.0',
            'cacheCapacity': mockUtils.getCapacity(400, 600),
            'totalUsableCapacity': total,
            'allocatedToPool': physicalUsed,
            'unallocatedToPool': parseInt(total) - parseInt(physicalUsed),
            'usedCapacity': used,
            'availableCapacity': parseInt(total) - parseInt(physicalUsed),
            'subscribedCapacity': mockUtils.getCapacity(600, 1200),
            'unusedDisks': 10,
            'unusedDisksCapacity': mockUtils.getCapacity(200, 1000),
            'accessible': true
        };
    };

    var handleGetRequest = function (urlResult){
        if (urlResult.resourceId === 'summary') {
            var summary =
            {
                'totalUsableCapacity': mockUtils.getCapacity(800 * storageSystems.length, 800 * storageSystems.length),
                'allocatedToPool': mockUtils.getCapacity(700 * storageSystems.length, 700 * storageSystems.length),
                'unallocatedToPool': mockUtils.getCapacity(400 * storageSystems.length, 400 * storageSystems.length),
                'usedCapacity': mockUtils.getCapacity(400 * storageSystems.length, 400 * storageSystems.length),
                'availableCapacity': mockUtils.getCapacity(100 * storageSystems.length, 100 * storageSystems.length),
                'subscribedCapacity': mockUtils.getCapacity(600 * storageSystems.length, 600 * storageSystems.length),
                'tierSummaryItems': [
                    {
                        'freeCapacity': '0',
                        'tierName': 'Bronze',
                        'totalCapacity': '3458572746752'
                    },
                    {
                        'freeCapacity': '0',
                        'tierName': 'Silver',
                        'totalCapacity': '3458572746752'
                    },
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
                ],
                'storageSystemCount': storageSystems.length
            };
            return mockUtils.response.ok(summary);
        }
        if (urlResult.resourceId) {
            var storageSystem = mockUtils.fromCollection(storageSystems, urlResult.resourceId, 'storageSystemId');
            return (storageSystem) ? mockUtils.response.ok(storageSystem) : mockUtils.response.notFound('Unable to find endpoint with matching Id.');
        }
        var paginatedStorageSystems = {
            resources: storageSystems,
            nextToken: null,
            total: storageSystems.length
        };
        return mockUtils.response.ok(paginatedStorageSystems);
    };

    return {
        init: function() {
            generateMockStorageSystems();
        },
        getMock: function() {
            return storageSystems;
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