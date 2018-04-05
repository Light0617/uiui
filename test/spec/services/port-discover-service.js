/*
 * ========================================================================
 *
 * Copyright (c) by Hitachi Vantara, 2018. All rights reserved.
 *
 * ========================================================================
 */

'use strict';

describe('Service: portDiscoverService tests', function () {
    var portDiscoverService, $q, $httpBackend, $rootScope;

    var orchestratorServiceMock = {
        storagePort: function (tgtStorageId, tgtPortId) {
            var isFibre = tgtStorageId % 2;
            return $q.resolve({
                storagePortId: tgtPortId,
                storageSystemId: tgtStorageId,
                wwn: isFibre ? 'wwn1' : undefined,
                iscsiPortInformation: {
                    portIscsiName: isFibre ? undefined : 'iscsi1'
                }
            });
        },
        volume: function (storageSystemId, volumeId) {
            var isFibre = volumeId % 2;
            var hasPaths = storageSystemId % 2;
            return $q.resolve({
                volumeId: volumeId,
                label: 'volume' + volumeId,
                capacity: storageSystemId + volumeId,
                attachedVolumeServerSummary: hasPaths ? [{
                    paths: [
                        {
                            lun: storageSystemId,
                            wwns: isFibre ? ['wwn' + volumeId] : undefined,
                            iscsiTargetInformation: !isFibre ? {
                                iscsiInitiatorNames: ['iscsi' + volumeId, 'iscsi' + (volumeId + 1)]
                            } : undefined
                        }
                    ]
                }] : undefined
            });
        },
        discoverLun: function (portId, storageSystemId, payloadQuery) {
            var found = storageSystemId % 2;
            return $q.resolve(
                found ? [
                    {
                        portId: portId,
                        lunId: 1,
                        wwn: 'wwna'
                    },
                    {
                        portId: portId,
                        lunId: 2,
                        externalIscsiInformation: {
                            iscsiName: 'iscsi',
                            ipAddress: '1.1.1.2'
                        }
                    }
                ] : []
            );
        }
    };

    beforeEach(function () {
        module('rainierApp');
        module(function ($provide) {
            $provide.value('orchestratorService', orchestratorServiceMock);
        });
    });

    beforeEach(inject(function (_portDiscoverService_, _$q_, _$rootScope_, _$httpBackend_) {
        portDiscoverService = _portDiscoverService_;
        $q = _$q_;
        $rootScope = _$rootScope_;
        $httpBackend = _$httpBackend_;
        $httpBackend.whenGET('/i18n/translation.json').respond({
            success: {}
        });
    }));

    describe('discoverUnmanagedLuns', function () {
        it('should resolved with unique discovered luns', function () {
            var data;
            var deferred = $q.defer();
            var promise = deferred.promise;

            promise.then(function (response) {
                data = response;
            });

            portDiscoverService
                .discoverUnmanagedLuns(['CL1-A', 'CL21-C'], 1)
                .then(function (response) {
                    deferred.resolve(response);
                });

            $rootScope.$digest();

            expect(data.length).toEqual(2);
            expect(data[0].portId).toEqual('CL1-A');
            expect(data[0].lunId).toEqual(1);
            expect(data[1].portId).toEqual('CL1-A');
            expect(data[1].lunId).toEqual(2);

        });
    });

    describe('targetPortEndPointHash', function () {
        it('should resolve with portid-indexed hash and wwn', function () {
            var data;
            var deferred = $q.defer();
            var promise = deferred.promise;

            promise.then(function (response) {
                data = response;
            });

            portDiscoverService
                .targetPortEndPointHash(1, ['CL1-A', 'CL21-C'])
                .then(function (response) {
                    deferred.resolve(response);
                });

            $rootScope.$digest();

            expect(data['CL1-A'].endPoint).toEqual('wwn1');
            expect(data['CL21-C'].endPoint).toEqual('wwn1');
        });

        it('should resolve with portid-indexed hash and iscsi name', function () {
            var data;
            var deferred = $q.defer();
            var promise = deferred.promise;

            promise.then(function (response) {
                data = response;
            });

            portDiscoverService
                .targetPortEndPointHash(0, ['CL2-B', 'CL10-F'])
                .then(function (response) {
                    deferred.resolve(response);
                });

            $rootScope.$digest();

            expect(data['CL2-B'].endPoint).toEqual('iscsi1');
            expect(data['CL10-F'].endPoint).toEqual('iscsi1');
        });
    });

    describe('targetEndPointsOfVolumePath', function () {
        it('should return multiple endPoint object for each wwns', function () {
            var result = portDiscoverService.targetEndPointsOfVolumePath(
                {
                    wwns: ['wwna', 'wwnb'],
                    lun: 3
                }
            );
            expect(result[0].targetEndPoint).toEqual('wwna');
            expect(result[0].lun).toEqual(3);
            expect(result[1].targetEndPoint).toEqual('wwnb');
            expect(result[1].lun).toEqual(3);
        });

        it('should return multiple endPoint object for each iscsiNames', function () {
            var result = portDiscoverService.targetEndPointsOfVolumePath(
                {
                    iscsiTargetInformation: {
                        iscsiInitiatorNames: ['iscsia', 'iscsib']
                    },
                    lun: 4
                }
            );
            expect(result[0].targetEndPoint).toEqual('iscsia');
            expect(result[0].lun).toEqual(4);
            expect(result[1].targetEndPoint).toEqual('iscsib');
            expect(result[1].lun).toEqual(4);
        });
    });

    describe('targetEndPointsOfSourceVolume', function () {
        it('should return flatten volumes objects with each end point', function () {
            var payload = {
                attachedVolumeServerSummary: [
                    {
                        paths: [
                            {
                                wwns: ['wwna', 'wwnb'],
                                lun: 3
                            },
                            {
                                iscsiTargetInformation: {
                                    iscsiInitiatorNames: ['iscsia', 'iscsib']
                                },
                                lun: 5
                            }
                        ]
                    },
                    {
                        paths: [
                            {
                                wwns: ['wwna', 'wwnc'],
                                lun: 3
                            },
                        ]
                    }
                ]
            };
            var result = portDiscoverService.targetEndPointsOfSourceVolume(payload);

            expect(result.length).toEqual(6);
            expect(result[0].targetEndPoint).toEqual('wwna');
            expect(result[0].lun).toEqual(3);
            expect(result[1].targetEndPoint).toEqual('wwnb');
            expect(result[1].lun).toEqual(3);
            expect(result[2].targetEndPoint).toEqual('iscsia');
            expect(result[2].lun).toEqual(5);
            expect(result[3].targetEndPoint).toEqual('iscsib');
            expect(result[3].lun).toEqual(5);
            expect(result[4].targetEndPoint).toEqual('wwna');
            expect(result[4].lun).toEqual(3);
            expect(result[5].targetEndPoint).toEqual('wwnc');
            expect(result[5].lun).toEqual(3);
        });
    });

    describe('targetEndPointsOfSourceVolume', function () {
        it('should return flatten volumes objects with each end point', function () {
            var payload = [{
                volumeId: 3,
                label: 'volume3',
                attachedVolumeServerSummary: [
                    {
                        paths: [
                            {
                                wwns: ['wwna', 'wwnb'],
                                lun: 3
                            },
                            {
                                iscsiTargetInformation: {
                                    iscsiInitiatorNames: ['iscsia', 'iscsib']
                                },
                                lun: 5
                            }
                        ]
                    },
                    {
                        paths: [
                            {
                                wwns: ['wwna', 'wwnc'],
                                lun: 3
                            },
                        ]
                    }
                ]
            }, {
                volumeId: 2,
                label: 'volume2'
            }, {
                volumeId: 4,
                label: 'volume4',
                attachedVolumeServerSummary: [
                    {
                        paths: [
                            {}
                        ]
                    }
                ]
            }, {
                volumeId: 4,
                label: 'volume4',
                attachedVolumeServerSummary: [
                    {
                        paths: [
                            {
                                iscsiTargetInformation: {
                                    iscsiInitiatorNames: ['iscsic']
                                },
                                lun: 1
                            }
                        ]
                    }
                ]
            }];
            var result = portDiscoverService.flattenVolumesByTargetEndPoint(payload);

            expect(result.length).toEqual(7);
            expect(result[0].volumeId).toEqual(3);
            expect(result[0].label).toEqual('volume3');
            expect(result[0].lunNEndPoint).toEqual('wwna_3');
            expect(result[0].lun).toEqual(3);
            expect(result[1].volumeId).toEqual(3);
            expect(result[1].label).toEqual('volume3');
            expect(result[1].lunNEndPoint).toEqual('wwnb_3');
            expect(result[1].lun).toEqual(3);
            expect(result[2].volumeId).toEqual(3);
            expect(result[2].label).toEqual('volume3');
            expect(result[2].lunNEndPoint).toEqual('iscsia_5');
            expect(result[2].lun).toEqual(5);
            expect(result[3].volumeId).toEqual(3);
            expect(result[3].label).toEqual('volume3');
            expect(result[3].lunNEndPoint).toEqual('iscsib_5');
            expect(result[3].lun).toEqual(5);
            expect(result[4].volumeId).toEqual(3);
            expect(result[4].label).toEqual('volume3');
            expect(result[4].lunNEndPoint).toEqual('wwna_3');
            expect(result[4].lun).toEqual(3);
            expect(result[5].volumeId).toEqual(3);
            expect(result[5].label).toEqual('volume3');
            expect(result[5].lunNEndPoint).toEqual('wwnc_3');
            expect(result[5].lun).toEqual(3);
            expect(result[6].volumeId).toEqual(4);
            expect(result[6].label).toEqual('volume4');
            expect(result[6].lunNEndPoint).toEqual('iscsic_1');
            expect(result[6].lun).toEqual(1);
        });
    });

    describe('volumeEndPointHash', function () {
        it('should return lun and endPoint hashed volumes object', function () {
            var data;
            var deferred = $q.defer();
            var promise = deferred.promise;

            promise.then(function (response) {
                data = response;
            });

            portDiscoverService
                .volumeEndPointHash(1, [100, 101])
                .then(function (response) {
                    deferred.resolve(response);
                });

            $rootScope.$digest();

            expect(data.iscsi100_1.volumeId).toEqual(100);
            expect(data.iscsi100_1.label).toEqual('volume100');
            expect(data.iscsi100_1.lunNEndPoint).toEqual('iscsi100_1');
            expect(data.iscsi101_1.volumeId).toEqual(100);
            expect(data.iscsi101_1.label).toEqual('volume100');
            expect(data.iscsi101_1.lunNEndPoint).toEqual('iscsi101_1');
            expect(data.wwn101_1.volumeId).toEqual(101);
            expect(data.wwn101_1.label).toEqual('volume101');
            expect(data.wwn101_1.lunNEndPoint).toEqual('wwn101_1');
        });
    });

    describe('discoveredVolumes', function () {
        it('should return volumes which filtered by discovered one', function () {
            var discoveredLuns = [{
                lunNEndPoint: 'wwna_lun1'
            }, {
                lunNEndPoint: 'iscsib_lun2'
            }, {
                lunNEndPoint: 'wwnb_lun2'
            }];

            var volumeEndPointHash = {
                'wwna_lun1': {
                    volumeId: 1,
                    lun: 1
                },
                'iscsib_lun2': {
                    volumeId: 1,
                    lun: 2
                },
                'something': {
                    volumeId: 0,
                    lun: 0
                }
            };

            var result = portDiscoverService
                .discoveredVolumes(discoveredLuns, volumeEndPointHash);

            expect(result).toEqual([{
                volumeId: 1, lun: 1
            }, {
                volumeId: 1, lun: 2
            }]);
        });
    });

    describe('appendTargetEndPointToLuns', function () {
        it('should return luns with endPoints', function () {
            var discoveredLuns = [
                {
                    portId: 'CL1-A',
                    lunId: 1
                },
                {
                    portId: 'CL2-B',
                    lunId: 1
                }
            ];
            var targetPortIdHash = {
                'CL1-A': {
                    endPoint: 'iscsiNameHere'
                }
            };
            var result = portDiscoverService.appendTargetEndPointToLuns(
                discoveredLuns, targetPortIdHash
            );
            expect(result.length).toEqual(1);
            expect(result[0].portId).toEqual('CL1-A');
            expect(result[0].lunId).toEqual(1);
            expect(result[0].endPoint).toEqual('iscsiNameHere');
            expect(result[0].lunNEndPoint).toEqual('iscsiNameHere_1');
        });
    });

    describe('discoverManagedLunsFromPaths', function () {
        it('should resolved with flattened discovered luns', function () {
            var data = [];
            var deferred = $q.defer();
            var promise = deferred.promise;

            promise.then(function (response) {
                data = response;
            });

            var paths = [{
                targetPortId: 'CL11-F',
                sourceEndPoint: {
                    wwn: 'wwncl11f'
                }
            }, {
                targetPortId: 'CL12-X',
                iscsiInfo: {
                    iscsiName: 'iscsicl12x'
                }
            }];

            portDiscoverService
                .discoverManagedVolumesFromPaths(paths, 1)
                .then(function (response) {
                    deferred.resolve(response);
                });

            $rootScope.$digest();

            expect(data.length).toEqual(4);
            expect(data[0].portId).toEqual('CL11-F');
            expect(data[0].wwn).toEqual('wwna');
            expect(data[1].portId).toEqual('CL11-F');
            expect(data[1].externalIscsiInformation.iscsiName).toEqual('iscsi');
            expect(data[2].portId).toEqual('CL12-X');
            expect(data[2].wwn).toEqual('wwna');
            expect(data[3].portId).toEqual('CL12-X');
            expect(data[3].externalIscsiInformation.iscsiName).toEqual('iscsi');
        });
    });

    describe('discoverManagedVolumes', function () {
        it('should resolved with volumes witch actually discovered', function () {
            var data = [];
            var deferred = $q.defer();
            var promise = deferred.promise;

            promise.then(function (response) {
                data = response;
            });

            var externalPaths = [{
                targetPortId: 'CL129-X',
                lunId: 2
            }, {
                targetPortId: 'CL129-X',
                lunId: 1
            }, {
                targetPortId: 'CL0-undefined',
                lunId: 0
            }];
            var volumeIds = [0, 1, 2, 3];

            portDiscoverService.discoverManagedVolumes(externalPaths, volumeIds, 1, 1)
                .then(function (response) {
                    deferred.resolve(response);
                });

            $rootScope.$digest();

            expect(data.length).toBe(1);
            expect(data[0].volumeId).toBe(1);
            expect(data[0].label).toBe('volume1');
            expect(data[0].capacity).toBe(2);
            expect(data[0].endPoint).toBe('wwn1');
            expect(data[0].lun).toBe(1);
            expect(data[0].lunNEndPoint).toBe('wwn1_1');
        });
    });
});
