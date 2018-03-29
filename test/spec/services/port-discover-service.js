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
                wwn: isFibre ? 'thisiswwn' : undefined,
                iscsiPortInformation: {
                    portIscsiName: isFibre ? undefined : 'thisisiscsiname'
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

            expect(data['CL1-A'].endPoint).toEqual('thisiswwn');
            expect(data['CL21-C'].endPoint).toEqual('thisiswwn');
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

            expect(data['CL2-B'].endPoint).toEqual('thisisiscsiname');
            expect(data['CL10-F'].endPoint).toEqual('thisisiscsiname');
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
});
