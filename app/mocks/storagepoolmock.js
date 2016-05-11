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
            'capacity': mockUtils.getCapacity(50, 100)
        },
        {
            'tier': 'Silver',
            'capacity': mockUtils.getCapacity(50, 100)
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
        ]
    };

    var generateMockStoragePool = function(v) {
        var capacityInfo = mockUtils.getCapacityInformation(100, 150);
        var tiers = mockUtils.trueOrFalse() ? hdp : hdt;
        return {
            'availableCapacityInBytes': capacityInfo.freeCapacity,
            'availableLogicalCapacityInBytes': mockUtils.getCapacity(50, 100),
            'availableSubscription': {
                'unlimited': false,
                'value': 0
            },
            'capacityInBytes': mockUtils.getCapacity(50, 100),
            'compressed': mockUtils.trueOrFalse() ? 'YES' : 'NO',
            'compressionRate': mockUtils.randomInt(0,10),
            'encrypted': mockUtils.trueOrFalse() ? 'YES' : 'NO',
            'expansionRate': mockUtils.randomInt(0,10),
            'externalParityGroupIds' : [],
            'logicalCapacityInBytes': mockUtils.getCapacity(50, 100),
            'parityGroups': [
                {
                    'id': '1-1',
                    'encryption': false,
                    'compression': false
                }
            ],
            'storageSystemId': '22000',
            'savingsPercentage': mockUtils.randomInt(0,10),
            'status': 'NORMAL',
            'storagePoolId': v,
            'label':'Storage Pool ' + v,
            'subscriptionLimit': {
                'unlimited': false,
                'value': 0
            },
            'type': tiers.length > 1 ? 'Tiered' : 'Thin',
            'usedCapacityInBytes': capacityInfo.usedCapacity,
            'usedLogicalCapacityInBytes': capacityInfo.usedCapacity,
            'usedSubscription': 0,
            'utilizationThreshold1': mockUtils.randomInt(1,100),
            'utilizationThreshold2': mockUtils.randomInt(1,100),
            'activeFlashEnabled': mockUtils.trueOrFalse(),
            'tiers': tiers
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