'use strict';

rainierAppMock.factory('storagePoolMock', function(mockUtils) {
    var storagePools = [];
    var hdp = [
        {
            'tier': 'Silver',
            'capacity': mockUtils.getCapacity(50, 100)
        }
    ];
    var hdt = [
        {
            'tier': 'Platinum',
            'capacity': mockUtils.getCapacity(50, 100),
            'bufferSpace':{
                'newPageAssignment':{
                    'unlimited': false,
                    'value': 8
                },
                'tierRelocation':{
                    'unlimited': false,
                    'value': 2
                }
            },
            'performanceUtilization':{
                'unlimited': false,
                'value': 0
            }
        },
        {
            'tier': 'Silver',
            'capacity': mockUtils.getCapacity(50, 100),
            'bufferSpace':{
                'newPageAssignment':{
                    'unlimited': false,
                    'value': 8
                },
                'tierRelocation':{
                    'unlimited': false,
                    'value': 2
                }
            },
            'performanceUtilization':{
                'unlimited': false,
                'value': 0
            }
        }
    ];

    var generateMockStoragePools = function() {
        var total = 64;

        while (total-- !== 0) {
            var mockStoragePool = generateMockStoragePool(total);
            storagePools.push(mockStoragePool);
        }
    };
    
    var storagePoolSummary = {
        'summariesByType':[
            {
                'poolType':'HDP',
                'totalCapacity':8636942254080,
                'usedCapacity':0,
                'availableCapacity':8636942254080,
                'usedSubscribedCapacity':309497692160,
                'poolCount':25
            },
            {
                'poolType':'HTI',
                'totalCapacity':1724746039296,
                'usedCapacity':528482304,
                'availableCapacity':1724217556992,
                'usedSubscribedCapacity':309497692160,
                'poolCount':1
            },
            {
                'poolType':'HDT',
                'totalCapacity':3449492078592,
                'usedCapacity':0,
                'availableCapacity':3449492078592,
                'usedSubscribedCapacity':4999610368,
                'poolCount':30
            }
        ],
        'ddmEnabled': mockUtils.trueOrFalse()
    };

    var monitoringModes = ['PERIODICAL', 'CONTINUOUS', 'PERIODICAL_WITH_ACTIVE_FLASH', 'CONTINUOUS_WITH_ACTIVE_FLASH', 'NONE'];

    var generateMockStoragePool = function(v) {
        if (mockUtils.trueOrFalse()) {
            return generateMockStoragePoolWithTotalEfficiency(v);
        }
        return generateMockStoragePoolWithoutTotalEfficiency(v);
    };

    var generateMockStoragePoolWithoutTotalEfficiency = function(v) {
        var capacityInfo = mockUtils.getCapacityInformation(100, 150);
        var tiers = mockUtils.trueOrFalse() ? hdp : hdt;
        var fmcCompress = _.sample(['YES', 'NO', 'PARTIAL']);
        var parityGroupCompress = fmcCompress === 'YES' ? true
            : fmcCompress === 'NO' ? false
                : mockUtils.trueOrFalse();

        return {
            'availableCapacityInBytes': capacityInfo.freeCapacity,
            'availableLogicalCapacityInBytes': mockUtils.getCapacity(50, 100),
            'availableSubscription': {
                'unlimited': false,
                'value': 0
            },
            'capacityInBytes': mockUtils.getCapacity(50, 100),
            'fmcCompressed': fmcCompress,
            'encrypted': mockUtils.trueOrFalse() ? 'YES' : 'NO',
            'fmcCompressionDetails': getFmcCompressionDetails(),
            'compressionDetails': getCompressionDetails(),
            'externalParityGroupIds' : [],
            'logicalCapacityInBytes': mockUtils.getCapacity(50, 100),
            'monitoringMode' : _.sample(monitoringModes),
            'nasBoot': mockUtils.trueOrFalse(),
            'parityGroups': [
                {
                    'id': '1-1',
                    'encryption': false,
                    'compression': parityGroupCompress,
                    'compressionSupported': parityGroupCompress
                },
                {
                    'id': '1-2',
                    'encryption': false,
                    'compression': parityGroupCompress,
                    'compressionSupported': parityGroupCompress
                }
            ],
            'storageSystemId': '22000',
            'status': 'NORMAL',
            'storagePoolId': v,
            'label':'Storage Pool ' + v,
            'subscriptionLimit': {
                'unlimited': mockUtils.trueOrFalse(),
                'value': mockUtils.randomInt(0,100)
            },
            'type': tiers.length > 1 ? 'HDT' : 'HDP',
            'usedCapacityInBytes': capacityInfo.usedCapacity,
            'usedLogicalCapacityInBytes': capacityInfo.usedCapacity,
            'usedSubscription': 0,
            'utilizationThreshold1': mockUtils.randomInt(1,100),
            'utilizationThreshold2': mockUtils.randomInt(1,100),
            'activeFlashEnabled': mockUtils.trueOrFalse(),
            'ddmEnabled': mockUtils.trueOrFalse(),
            'tiers': tiers,
            'deduplicationEnabled': mockUtils.trueOrFalse(),
            'deduplicationSystemDataCapacityInBytes': 40.00 * 1024 * 1024 * 1024 * 1024,
            'dataReductionSavingsRate':2.1,
            'capacityEfficiencyRate':3.2
        };
    };

    var generateMockStoragePoolWithTotalEfficiency = function(v) {
        return angular.extend(generateMockStoragePoolWithoutTotalEfficiency(v),
            mockUtils.trueOrFalse() ? getIrregularCase() : {
                'totalEfficiency': {
                    'totalEfficiencyRate': {
                        'status': 'CALCULATED',
                        'value': 20.8
                    },
                    'dataReductionRate': {
                        'totalDataReductionRate':  {
                            'status': mockUtils.randomInArray(['CALCULATED', 'CALCULATION_IN_PROGRESS']),
                            'value': 1.84
                        },
                        'softwareSavingRate': {
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
                        'fmdSavingRate': {
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
                    'calculationStartTime': '2018-05-15T10:05',
                    'calculationEndTime': '2018-05-15T10:38'
                }
            });
    };

    var getIrregularCase = function() {
        return mockUtils.trueOrFalse() ?
            {
                'compressionDetails': null,
                'fmcCompressionDetails': null,
                'dataReductionSavingsRate': null,
                'capacityEfficiencyRate': null,
                'totalEfficiency': {
                    'totalEfficiencyRate': {
                        'status': 'CALCULATION_IN_PROGRESS',
                        'value': null
                    },
                    'dataReductionRate': {
                        'totalDataReductionRate':  {
                            'status': 'CALCULATION_IN_PROGRESS',
                            'value': null
                        },
                        'softwareSavingRate': {
                            'totalSoftwareSavingRate':  {
                                'status': 'CALCULATION_IN_PROGRESS',
                                'value': null
                            },
                            'compressionRate':  {
                                'status': 'CALCULATION_IN_PROGRESS',
                                'value': null
                            },
                            'deduplicationRate':  {
                                'status': 'CALCULATION_IN_PROGRESS',
                                'value': null
                            },
                            'patternMatchingRate':  {
                                'status': 'CALCULATION_IN_PROGRESS',
                                'value': null
                            }
                        },
                        'fmdSavingRate': {
                            'totalFmdSavingRate':  {
                                'status': 'CALCULATION_IN_PROGRESS',
                                'value': null
                            },
                            'compressionRate':  {
                                'status': 'CALCULATION_IN_PROGRESS',
                                'value': null
                            },
                            'patternMatchingRate':  {
                                'status': 'CALCULATION_IN_PROGRESS',
                                'value': null
                            }
                        }
                    },
                    'snapshotEfficiencyRate':  {
                        'status': 'CALCULATION_IN_PROGRESS',
                        'value': null
                    },
                    'provisioningEfficiencyPercentage':  {
                        'status': 'CALCULATION_IN_PROGRESS',
                        'value': null
                    },
                    'calculationStartTime': 'CALCULATION_IN_PROGRESS',
                    'calculationEndTime': 'CALCULATION_IN_PROGRESS'
                }
            }
            :
            {
                'compressionDetails': null,
                'fmcCompressionDetails': null,
                'dataReductionSavingsRate': null,
                'capacityEfficiencyRate': null,
                'totalEfficiency': {
                    'totalEfficiencyRate': {
                        'status': 'CALCULATED',
                        'value': 20.8
                    },
                    'dataReductionRate': {
                        'totalDataReductionRate':  {
                            'status': 'CALCULATED',
                            'value': 1.84
                        },
                        'softwareSavingRate': null,
                        'fmdSavingRate': null
                    },
                    'snapshotEfficiencyRate':  null,
                    'provisioningEfficiencyPercentage': {
                        'status': 'CALCULATED',
                        'value': 170
                    },
                    'calculationStartTime': '2018-05-15T10:05',
                    'calculationEndTime': '2018-05-15T10:38'
                }
            };
    };

    var handleGetRequest = function (urlResult){
        if(urlResult.subResourceId === 'summary') {
            return mockUtils.response.ok(storagePoolSummary);
        }
        else if (urlResult.subResourceId) {
            var storagePool = mockUtils.fromCollection(storagePools, parseInt(urlResult.subResourceId), 'storagePoolId');
            return (storagePool) ? mockUtils.response.ok(storagePool) : mockUtils.response.notFound('Unable to find endpoint with matching Id.');
        }

        return mockUtils.response.ok(mockUtils.singlePageCollectionResponse(storagePools));
    };

    var getFmcCompressionDetails = function getFmcCompressionDetails() {
        return {
            expansionRate: mockUtils.randomInt(0,10),
            compressionRate: mockUtils.randomInt(0,10),
            savingsPercentage: mockUtils.randomInt(0,10),
        };
    };

    var getCompressionDetails = function getCompressionDetails() {
        return {
            compressionRate: mockUtils.randomInt(0,9) + '.' + mockUtils.randomInt(0,9) + mockUtils.randomInt(0,9),
            deduplicationRate: mockUtils.randomInt(0,9) + '.' + mockUtils.randomInt(0,9) + mockUtils.randomInt(0,9),
            savingsPercentage: mockUtils.randomInt(0,9) + '.' + mockUtils.randomInt(0,9),
        };
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
