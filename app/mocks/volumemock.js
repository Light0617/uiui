/*
 * ========================================================================
 *
 * Copyright (c) by Hitachi Vantara, 2018. All rights reserved.
 *
 * ========================================================================
 */

'use strict';

rainierAppMock.factory('volumeMock', function (mockUtils, storagePortsMock) {
    var volumes = [];

    var generateMockVolumes = function () {
        var total = 200;

        while (total-- !== 0) {
            var mockVolume = generateMockVolume(total);
            volumes.push(mockVolume);
        }
    };

    var volumeSummaryMock = {
        'volumeCountByType': {
            'HDP': 30,
            'HTI': 2,
            'HDT': 30
        },
        'numberOfVolumes': 64
    };

    var wwns = function () {
        var randomLengthArray = _.range(0, _.random(1, 2));
        return _.chain(randomLengthArray).map(storagePortsMock.wwn).value();
    };

    var iscsiTargetInformation = function () {
        var randomLengthArray = _.range(0, _.random(1, 2));
        var r = {
            iscsiTargetName: storagePortsMock.iscsi(),
            iscsiInitiatorNames: _.chain(randomLengthArray).map(storagePortsMock.iscsi).value(),
            chapUsers: ['Chap1', 'Chap2', 'Chap3'],
            authenticationMode: _.sample(['CHAP', 'BOTH', 'NONE'])
        };
        return r;
    };

    function path(protocol) {
        var iscsi = _.sample([true, false]);
        if(protocol==='FIBRE') {
            iscsi = false;
        } else if(protocol === 'ISCSI') {
            iscsi = true;
        }

        return {
            'storagePortId': 'CL1-D',
            'storageSystemId': '410266',
            'lun': 5,
            'name': 'HID_CL1-D_ae76506a-ba79-4bd7-834d-8cf5887cc3ec',
            'hostMode': 'LINUX',
            'wwns': iscsi ? undefined : wwns(),
            'iscsiTargetInformation': iscsi ? iscsiTargetInformation() : undefined,
            'hostModeOptions': [71, 72]
        };
    }

    function paths() {
        var array = _.range(0, _.random(1, 3));
        var protocol = _.sample(['ISCSI', 'FIBRE', undefined]);
        return _.chain(array).map(function() {
            return path(protocol);
        }).value();
    }

    var generateMockVolume = function (v) {
        var volType = _.sample(['HDP', 'HDT', 'HTI', 'GAD']);
        var migrationStatus = _.sample([true, false]);
        var iscsi = _.sample([true, false]);
        var mocksize = mockUtils.getCapacity(2.5, 20);
        return {
            volumeId: v + '',
            storageSystemId: 'REPLACE',
            poolId: '001',
            label: 'Volume' + v,
            scheduledForMigration: migrationStatus,
            size: mocksize,
            usedCapacity: mockUtils.getCapacity(1, 2),
            availableCapacity: mockUtils.getCapacity(1, 2),
            status: _.sample(['Normal', 'Blocked', 'Busy', 'Unknown']),
            type: volType,
            dataProtectionSummary: getVolumeDataProtectionSummary(),
            gadSummary: getVolumeGADSummary(volType, v),
            provisioningStatus: _.sample(['ATTACHED', 'UNATTACHED', 'UNMANAGED']),
            dkcDataSavingType: _.sample(['NONE', 'COMPRESSION', 'DEDUPLICATION_AND_COMPRESSION']),
            migrationSummary: {
                'migrationType': migrationStatus ? 'MIGRATION' : 'NONE',
                'ownerTaskId': migrationStatus ? mockUtils.randomInt(0, 100) : undefined
            },
            isDDM: (mocksize > 4000000000000) ? true : false, // if size > 4000000000000, true
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
                        'wwns': iscsi ? undefined : wwns(),
                        'iscsiTargetInformation': iscsi ? iscsiTargetInformation() : undefined,
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
                        'wwns': iscsi ? undefined : wwns(),
                        'iscsiTargetInformation': iscsi ? iscsiTargetInformation() : undefined,
                        'hostModeOptions':[
                            71,
                            72
                        ]
                    }
                ]
            }
        ],
            utilization: 0,
            paths: paths()
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
            replicationType: _.sample([['CLONE'], ['SNAP'], ['SNAP_ON_SNAP'], ['SNAP_CLONE'],
                ['SNAP_ON_SNAP', 'CLONE'], ['SNAP_CLONE', 'CLONE'], ['SNAP_ON_SNAP', 'SNAP_CLONE'],
                ['SNAP_ON_SNAP', 'SNAP_CLONE', 'CLONE'], ['CLONE', 'SNAP'], []]),
            volumeType: _.sample([['P-VOL'], ['S-VOL'], ['UNPROTECTED'], ['P-VOL', 'S-VOL']]),
            replicationGroupIdMap: getReplicationGroupIdMap(),
            hasFailures: _.sample([true, false, false, false]),
            secondaryVolumeCount: 17,
            secondaryVolumeFailures: 13
        };
    };

    var getVolumeGADSummary = function getVolumeGADSummary(volType, v) {
        if (volType === 'GAD') {
            return {
                volumeType: _.sample(['ACTIVE_PRIMARY', 'ACTIVE_SECONDARY']),
                virtualVolumeId: getVirtualVolumeId(v),
                vsmId: getVirtualStorageMachine()
            };
        } else {
            return {
                volumeType: _.sample(['NOT_AVAILABLE']),
                virtualVolumeId: null,
                vsmId: null
            };
        }
    };

    var handleGetRequest = function (urlResult) {
        _.each(volumes, function (volume) {
            volume.storageSystemId = urlResult.resourceId + '';
        });
        if (urlResult.subResourceId === 'summary') {
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
