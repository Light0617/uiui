'use strict';

rainierAppMock.factory('parityGroupMock', function(mockUtils) {
    var parityGroups = [];

    var tiers = {
        'tiers': [
            {
                'id': '1',
                'tier': 'Platinum',
                'subTiers': [
                    {
                        'diskType': 'SSD',
                        'speed': 0
                    },
                    {
                        'diskType': 'FMD',
                        'speed': 0
                    },
                    {
                        'diskType': 'FMD DC2',
                        'speed': 0
                    }
                ]
            },
            {
                'id': '2',
                'tier': 'Gold',
                'subTiers': [
                    {
                        'diskType': 'SAS',
                        'speed': 15000
                    }
                ]
            },
            {
                'id': '3',
                'tier': 'Silver',
                'subTiers': [
                    {
                        'diskType': 'SAS',
                        'speed': 10000
                    }
                ]
            },
            {
                'id': '4',
                'tier': 'Bronze',
                'subTiers': [
                    {
                        'diskType': 'SAS',
                        'speed': 7200
                    }
                ]
            },
            {
                'id': '5',
                'tier': 'External',
                'subTiers': []
            }
        ]
    };
    var raidConfigs = [
        {
            raidLevel: 'RAID5',
            layouts: ['3D+1P', '4D+1P', '6D+1P', '7D+1P']
        },
        {
            raidLevel: 'RAID6',
            layouts: ['6D+2P', '12D+2P', '14D+2P']
        }
    ];

    var generateMockParityGroups = function() {
        var total = 64;

        while (total-- !== 0) {
            var mockParityGroup = generateMockParityGroup(total);
            parityGroups.push(mockParityGroup);
        }
    };

    var parityGroupSummary = {
        'parityGroupSummaryItems':[
            {
                'diskType':'SAS',
                'speed':'10000',
                'size':576393524736,
                'tierName':'Silver',
                'numberOfAvailableDisks':11,
                'numberOfExistingHotSpares':1,
                'totalCapacity':4611146514432,
                'totalFreeCapacity':0,
                'numberOfParityGroups':3
            },
            {
                'diskType':'SAS',
                'speed':'7200',
                'size':3916143603200,
                'tierName':'Bronze',
                'numberOfAvailableDisks':6,
                'numberOfExistingHotSpares':2,
                'totalCapacity':11748430577664,
                'totalFreeCapacity':11748425859072,
                'numberOfParityGroups':1
            },
            {
                'diskType':'FMDDC2',
                'speed':'0',
                'size':1759216926656,
                'tierName':'Platinum',
                'numberOfAvailableDisks':1,
                'numberOfExistingHotSpares':2,
                'totalCapacity':184717749780480,
                'totalFreeCapacity':10555295268864,
                'numberOfParityGroups':7
            }
        ]
    };
    var generateMockParityGroup = function(v) {
        var tiersWithoutExternal = _.filter(tiers.tiers, function(tier){ return tier.subTiers && tier.subTiers.length > 0; });
        var tier = _.sample(tiersWithoutExternal);
        var subTier = _.sample(tier.subTiers);
        var totalCapacity = mockUtils.getCapacity(100, 200);
        var physicalCapacity = totalCapacity / 8;
        var availableCapacity = mockUtils.getCapacity(50, 80);
        var usedCapacity = totalCapacity - availableCapacity;
        var statuses = ['AVAILABLE', 'FORMATTING', 'QUICK_FORMATTING', 'IN_USE', 'UNINITIALIZED', 'UNSUPPORTED_ATTACHED', 'UNSUPPORTED_INACCESSIBLE_RESOURCEGROUP'];
        var encryption = [true, false];
        var level = _.sample(raidConfigs);
        var compression = mockUtils.trueOrFalse();
        var status = _.sample(statuses);
        status = (mockUtils.trueOrFalse() && compression) ? 'AVAILABLE_PHYSICAL' : status;
        return {
            parityGroupId: '1 - ' + v,
            storageSystemId: '2200' + v,
            raidLevel: level.raidLevel,
            raidLayout: _.sample(level.layouts),
            diskSpec: {
                type: subTier.diskType,
                capacityInBytes: subTier.capacity,
                speed: subTier.speed
            },
            status: status,
            totalCapacityInBytes: totalCapacity,
            uninitializedCapacityInBytes: mockUtils.getCapacity(0, 50),
            availableCapacityInBytes: availableCapacity,
            physicalCapacityInBytes: physicalCapacity,
            usagePercentage: Math.round(usedCapacity * 100 / totalCapacity),
            encryption: _.sample(encryption),
            compression: compression,
            nasBoot: mockUtils.trueOrFalse()
        };
    };

    var handleGetRequest = function (urlResult){
        if(urlResult.subResourceId === 'summary') {
            return mockUtils.response.ok(parityGroupSummary);
        }
        else if (urlResult.subResourceId) {
            var parityGroup = mockUtils.fromCollection(parityGroups, urlResult.subResourceId, 'id');
            return (parityGroup) ? mockUtils.response.ok(parityGroup) : mockUtils.response.notFound('Unable to find endpoint with matching Id.');
        }

        console.log(parityGroups);
        return mockUtils.response.ok(mockUtils.singlePageCollectionResponse(parityGroups));
    };

    return {
        init: function() {
            generateMockParityGroups();
        },
        getMock: function() {
            return parityGroups;
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