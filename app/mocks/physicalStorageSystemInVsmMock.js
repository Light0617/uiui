'use strict';

rainierAppMock.factory('physicalStorageSystemInVsmMock', function (mockUtils) {
    var physicalStorageSystems = [];

    var generateMockPhysicalStorageSystem = function () {
        var total = 1;

        while (total-- !== 0) {
            var mockVirtualStorageMachines = generatePhysicalStorageSystem(total);
            physicalStorageSystems.push(mockVirtualStorageMachines);
        }
    };

    var generatePhysicalStorageSystem = function (v) {
        var total = mockUtils.getCapacity(800, 1000);
        var physicalUsed = mockUtils.getCapacity(500, 700);
        var used = mockUtils.getCapacity(200, 400);
        return {
            'storageSystemId': '2200' + v,
            'storageSystemName': 'Storage' + v,
            'unified': mockUtils.trueOrFalse(),
            'model': 'VSP G1000',
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
            'accessible': true,
            'gadSummary': _.sample(['Incomplete', 'Not Available']),
            'migrationTaskCount': _.sample([0, 10, 30, 120]),
            'summary': physicalStorageSystemInVsmSummary()
        };
    };

    var physicalStorageSystemInVsmSummary = function() {
        return {
            'definedVolumeCount': 22,
            'undefinedVolumeCount': 12,
            'hostGroups': [
                {
                'definedCount': 11,
                'undefinedCount': 3,
                'storagePortId': 'CL3-A'
                },
                {
                    'definedCount': 10,
                    'undefinedCount': 4,
                    'storagePortId': 'CL7-B'
                },
                {
                    'definedCount': 11,
                    'undefinedCount': 3,
                    'storagePortId': 'CL3-A'
                },
                {
                    'definedCount': 10,
                    'undefinedCount': 4,
                    'storagePortId': 'CL7-B'
                },
                {
                    'definedCount': 11,
                    'undefinedCount': 3,
                    'storagePortId': 'CL3-A'
                },
                {
                    'definedCount': 10,
                    'undefinedCount': 4,
                    'storagePortId': 'CL7-B'
                },
                {
                    'definedCount': 11,
                    'undefinedCount': 3,
                    'storagePortId': 'CL3-A'
                },
                {
                    'definedCount': 10,
                    'undefinedCount': 4,
                    'storagePortId': 'CL7-B'
                },
                {
                    'definedCount': 11,
                    'undefinedCount': 3,
                    'storagePortId': 'CL3-A'
                },
                {
                    'definedCount': 10,
                    'undefinedCount': 4,
                    'storagePortId': 'CL7-B'
                },
                {
                    'definedCount': 11,
                    'undefinedCount': 3,
                    'storagePortId': 'CL3-A'
                },
                {
                    'definedCount': 10,
                    'undefinedCount': 4,
                    'storagePortId': 'CL7-B'
                },
                {
                    'definedCount': 11,
                    'undefinedCount': 3,
                    'storagePortId': 'CL3-A'
                },
                {
                    'definedCount': 10,
                    'undefinedCount': 4,
                    'storagePortId': 'CL7-B'
                },
                {
                    'definedCount': 11,
                    'undefinedCount': 3,
                    'storagePortId': 'CL3-A'
                },
                {
                    'definedCount': 10,
                    'undefinedCount': 4,
                    'storagePortId': 'CL7-B'
                },
                {
                    'definedCount': 11,
                    'undefinedCount': 3,
                    'storagePortId': 'CL3-A'
                },
                {
                    'definedCount': 10,
                    'undefinedCount': 4,
                    'storagePortId': 'CL7-B'
                },
                {
                    'definedCount': 11,
                    'undefinedCount': 3,
                    'storagePortId': 'CL3-A'
                },
                {
                    'definedCount': 10,
                    'undefinedCount': 4,
                    'storagePortId': 'CL7-B'
                }
            ]
        };
    };

    var handleGetRequest = function (urlResult) {
        if(urlResult.subSubType === 'summary'){
            return physicalStorageSystemInVsmSummary();
        } else {
            return physicalStorageSystems;
        }
    };

    return {
        init: function () {
            generateMockPhysicalStorageSystem();
        },
        getMock: function () {
            return physicalStorageSystems;
        },
        handle: function (urlResult) {
            switch (urlResult.method) {
                case 'GET':
                    return mockUtils.response.ok(handleGetRequest(urlResult));
                default:
                    return mockUtils.response.methodNotAllowed(urlResult.url);
            }
        }
    };
});
