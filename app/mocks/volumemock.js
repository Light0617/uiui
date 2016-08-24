'use strict';

rainierAppMock.factory('volumeMock', function (mockUtils) {
    var volumes = [];

    var generateMockVolumes = function () {
        var total = 200;

        while (total-- !== 0) {
            var mockVolume = generateMockVolume(total);
            volumes.push(mockVolume);
        }
    };

    var volumeSummaryMock = {
        'volumeCountByType':{
            'HDP':30,
            'HTI':2,
            'HDT':30
        },
        'numberOfVolumes':64
    };
    
    var generateMockVolume = function (v) {
        var volType = _.sample(['HDP', 'HDT', 'HTI', 'GAD']);
        return {
            volumeId: v + '',
            storageSystemId: 'REPLACE',
            poolId: '001',
            label: 'Volume' + v,
            size: mockUtils.getCapacity(100, 200),
            usedCapacity: mockUtils.getCapacity(10, 25),
            availableCapacity: mockUtils.getCapacity(50, 75),
            status: _.sample(['Normal', 'Blocked', 'Busy', 'Unknown']),
            type: volType,
            dataProtectionSummary: getVolumeDataProtectionSummary(),
            gadSummary: getVolumeGADSummary(volType, v),
            provisioningStatus: _.sample(['ATTACHED', 'UNATTACHED', 'UNMANAGED']),
            dkcDataSavingType: _.sample(['NONE', 'COMPRESSION', 'DEDUPLICATION_AND_COMPRESSION']),
            attachedVolumeServerSummary:[
            {
                serverId: null,
                paths:[
                    {
                        'storagePortId':'CL1-D',
                        'storageSystemId':'410266',
                        'lun':5,
                        'name':'HID_CL1-D_ae76506a-ba79-4bd7-834d-8cf5887cc3ec',
                        'hostMode':'LINUX',
                        'wwns':[
                            '1059273981505633'
                        ],
                        'hostModeOptions':[
                            71,
                            72
                        ]
                    }
                ]
            },
            {
                serverId: '2',
                paths:[
                    {
                        'storagePortId':'CL1-E',
                        'storageSystemId':'410266',
                        'lun':4,
                        'name':'HID_CL1-E_ae76506a-ba79-4bd7-834d-8cf5887cc3ec',
                        'hostMode':'LINUX',
                        'wwns':[
                            '1059273981505633'
                        ],
                        'hostModeOptions':[
                            71,
                            72
                        ]
                    }
                ]
            }
        ],
            utilization: 0,
            paths: [{'storagePortId':'CL1-D','storageSystemId':'410266','lun':5,'name':'HID_CL1-D_ae76506a-ba79-4bd7-834d-8cf5887cc3ec','hostMode':'LINUX','wwns':['1059273981505633'],'hostModeOptions':[71,72]}]
        };
    };

    var getReplicationGroupIdMap = function () {
        var rand = _.random(1, 2);
        var map = {};
        for (var j = 0; j <= 9; j++) {
            map[[_.random(1000, 2000)]] = 'RG name ' + j.toString();
        }
        if (rand === 1) {
            return null;
        }
        return map;
    };

    var getVirtualVolumeId = function () {
        return '42';
    };

    var getVirtualStorageMachine = function () {
        return '99999';
    };

    var getVolumeDataProtectionSummary = function getVolumeDataProtectionSummary() {
        return {
            replicationType: _.sample([['CLONE'], ['SNAPSHOT'], ['SNAPSHOT_EXTENDABLE'], ['SNAPSHOT_FULLCOPY'],
                ['SNAPSHOT_EXTENDABLE', 'CLONE'], ['SNAPSHOT_FULLCOPY', 'CLONE'], ['SNAPSHOT_EXTENDABLE', 'SNAPSHOT_FULLCOPY'],
                ['SNAPSHOT_EXTENDABLE', 'SNAPSHOT_FULLCOPY', 'CLONE'], ['CLONE', 'SNAPSHOT'], []]),
            volumeType: _.sample([['P-VOL'], ['S-VOL'], ['UNPROTECTED'], ['P-VOL', 'S-VOL']]),
            replicationGroupIdMap: getReplicationGroupIdMap(),
            hasFailures: _.sample([true, false, false, false]),
            secondaryVolumeCount: 17,
            secondaryVolumeFailures: 13
        };
    };

    var getVolumeGADSummary = function getVolumeGADSummary(volType, v) {
        if(volType === 'GAD') {
            return {
                volumeType: _.sample(['Active-Primary', 'Active-Secondary']),
                virtualVolumeId: getVirtualVolumeId(v),
                vsmId: getVirtualStorageMachine()
            };
        } else {
            return {
                volumeType: _.sample(['SMPL']),
                virtualVolumeId: null,
                vsmId: null
            };
        }
    };

    var handleGetRequest = function (urlResult) {
        _.each(volumes, function(volume) {
            volume.storageSystemId = urlResult.resourceId + '';
        });
        if(urlResult.subResourceId === 'summary') {
            return mockUtils.response.ok(volumeSummaryMock);
        }
        else if (urlResult.subResourceId) {
            var volume = mockUtils.fromCollection(volumes, urlResult.subResourceId, 'volumeId');
            return (volume) ? mockUtils.response.ok(volume) : mockUtils.response.notFound('Unable to find volume with matching Id.');
        }

        return mockUtils.response.ok(mockUtils.singlePageCollectionResponse(volumes));
    };


    return {
        init: function () {
            generateMockVolumes();
        },
        getMock: function () {
            return volumes;
        },
        generateMockVolumes: generateMockVolumes(),
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