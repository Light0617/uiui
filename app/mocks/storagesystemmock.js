'use strict';

rainierAppMock.factory('storageSystemMock', function(mockUtils) {
    var storageSystems = [];

    var generateMockStorageSystems = function() {
        var total = 64;

        while (total-- !== 0) {
            var mockStorageSystem;
            if (mockUtils.randomInt(0, 1) > 0) {
                mockStorageSystem = generateMockStorageSystem(total);
            } else {
                mockStorageSystem = generateMockStorageSystemWithoutSvp(total);
            }
            storageSystems.push(mockStorageSystem);
        }
    };

    var generateMockStorageSystem = function(v) {
        var total = mockUtils.getCapacity(800, 1000);
        var physicalUsed = mockUtils.getCapacity(500, 700);
        var used = mockUtils.getCapacity(200, 400);

        var mockStorageSystem = {
            'storageSystemId': '2200' + v,
            'storageSystemName': 'Storage' + v,
            'unified': mockUtils.trueOrFalse(),
            'model': 'VSP G1500',
            'svpIpAddress': '10.20.90.1' + v,
            'gum1IpAddress': '10.20.90.2' + v,
            'gum2IpAddress': '10.20.90.3' + v,
            'firmwareVersion': '80-06-40-00/02',
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
            'primaryGumNumber': null,
            'username': 'maintenance'
        };

        return mockUtils.trueOrFalse() ?
            mockStorageSystem : generateMockStorageSystemWithTotalEfficiecny(mockStorageSystem);
    };

    var generateMockStorageSystemWithTotalEfficiecny = function(mockStorageSystem) {
        return angular.extend(mockStorageSystem, {
            'totalEfficiency': {
                'totalEfficiencyRate': {
                    'status': 'CALCULATED_WITH_EXCEEDED',
                    'value': 99999.99
                },
                'dataReductionEfficiency': {
                    'totalDataReductionRate':  {
                        'status': 'CALCULATED',
                        'value': 99999.99
                    },
                    'softwareSavingEfficiency': {
                        'totalSoftwareSavingRate':  {
                            'status': 'CALCULATED',
                            'value': 1.52
                        },
                        'compressionRate':  {
                            'status': 'CALCULATED',
                            'value': 1.15
                        },
                        'deduplicationRate':  {
                            'status': 'CALCULATED',
                            'value': 1.34
                        },
                        'patternMatchingRate':  {
                            'status': 'CALCULATED',
                            'value': 1.08
                        }
                    },
                    'fmdSavingEfficiency': {
                        'totalFmdSavingRate':  {
                            'status': mockUtils.randomInArray(['CALCULATED', 'CALCULATION_IN_PROGRESS']),
                            'value': 2.21
                        },
                        'compressionRate':  {
                            'status': 'CALCULATED',
                            'value': 2.14
                        },
                        'patternMatchingRate':  {
                            'status': 'CALCULATION_IN_PROGRESS',
                            'value': null
                        }
                    }
                },
                'snapshotEfficiencyRate':  {
                    'status': 'CALCULATED',
                    'value': 10.37
                },
                'provisioningEfficiencyPercentage':  {
                    'status': 'CALCULATED',
                    'value': 170
                },
                'calculationStartTime': '2018-05-15T10:05:33',
                'calculationEndTime': '2018-05-15T10:38:59'
            }
        });
    };

    var generateMockStorageSystemWithoutSvp = function(v) {
        var mock = generateMockStorageSystem(v);
        var specificElementsWithoutSvp = {
            'storageSystemName': 'SVP-less Storage' + v,
            'svpIpAddress': null,
            'primaryGumNumber': _.sample([1, 2]),
            'model': 'VSP G900',
            'unified': false,
            'firmwareVersion': '88-03-01-60/00'
        };
        return angular.extend(mock, specificElementsWithoutSvp);
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
                'subscribedCapacity': mockUtils.getCapacity(1000 * storageSystems.length, 1000 * storageSystems.length),
                'tierSummaryItems': [
                    {
                        'freeCapacity': mockUtils.getCapacity(1, 50),
                        'tierName': 'Bronze',
                        'totalCapacity': mockUtils.getCapacity(50, 100)
                    },
                    {
                        'freeCapacity': mockUtils.getCapacity(1, 50),
                        'tierName': 'Silver',
                        'totalCapacity': mockUtils.getCapacity(50, 100)
                    },
                    {
                        'freeCapacity': mockUtils.getCapacity(1, 50),
                        'tierName': 'Gold',
                        'totalCapacity': mockUtils.getCapacity(50, 100)
                    },
                    {
                        'freeCapacity': mockUtils.getCapacity(1, 50),
                        'tierName': 'Platinum',
                        'totalCapacity': mockUtils.getCapacity(50, 100)
                    },
                    {
                        'freeCapacity': mockUtils.getCapacity(1, 50),
                        'tierName': 'External',
                        'totalCapacity': mockUtils.getCapacity(50, 100)
                    }
                ],
                'storageSystemCount': storageSystems.length
            };
            return mockUtils.response.ok(summary);
        }
        if (urlResult.resourceId) {
            // var storageSystem = mockUtils.fromCollection(storageSystems, urlResult.resourceId, 'storageSystemId');
            // return (storageSystem) ? mockUtils.response.ok(storageSystem) : mockUtils.response.notFound('Unable to find endpoint with matching Id.');
            return mockUtils.response.ok(storageSystems[0]);
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