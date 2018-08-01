/*
 * ========================================================================
 *
 * Copyright (c) by Hitachi Vantara, 2018. All rights reserved.
 *
 * ========================================================================
 */

'use strict';

describe('Service: virtualizeVolumeService tests', function () {
    var virtualizeVolumeService;
    beforeEach(function () {
        module('rainierApp');
    });

    beforeEach(inject(function (_virtualizeVolumeService_) {
        virtualizeVolumeService = _virtualizeVolumeService_;
    }));

    describe('constructVirtualizePayload', function () {
        it('should return virtualize payload from dataModel', function () {
            var selected = {
                luns: [
                    {
                        externalDeviceId: 'HITACHI 50405F7702BC'
                    }, {
                        externalDeviceId: 'EMC 50405F7702BD'
                    }
                ],
                hostMode: 'LINUX',
                storageSystem: {
                    storageSystemId: '510001'
                },
                hosts: [{
                    protocol: 'FIBRE'
                }],
                hostModeOptions: [999, 0],
                autoCreateZone: true,
                paths: [
                    {
                        storagePortId: 'CL66-B',
                        serverId: 197,
                        serverEndPoint: '3054E1B674314999'
                    },
                    {
                        storagePortId: 'CL25-B',
                        serverId: 198,
                        serverEndPoint: '3054E1B674315000'
                    },
                    {
                        storagePortId: 'CL25-B',
                        serverId: 198,
                        serverEndPoint: '3054E1B674315000'
                    }
                ]
            };
            var result = virtualizeVolumeService.constructVirtualizePayload(selected);
            expect(result.storageSystemId).toEqual('510001');
            expect(result.attachExternalVolumeToServer.intendedImageType).toEqual('LINUX');
            expect(result.attachExternalVolumeToServer.hostModeOptions).toBeUndefined();
            expect(result.attachExternalVolumeToServer.enableZoning).toEqual(true);
            expect(result.attachExternalVolumeToServer.ports.length).toEqual(3);
            expect(result.attachExternalVolumeToServer.ports[0].portIds[0]).toEqual('CL66-B');
            expect(result.attachExternalVolumeToServer.ports[0].serverId).toEqual(197);
            expect(result.attachExternalVolumeToServer.ports[0].serverWwns[0]).toEqual('3054E1B674314999');
            expect(result.attachExternalVolumeToServer.ports[1].portIds[0]).toEqual('CL25-B');
            expect(result.attachExternalVolumeToServer.ports[1].serverId).toEqual(198);
            expect(result.attachExternalVolumeToServer.ports[1].serverWwns[0]).toEqual('3054E1B674315000');
            expect(result.attachExternalVolumeToServer.ports[2].portIds[0]).toEqual('CL25-B');
            expect(result.attachExternalVolumeToServer.ports[2].serverId).toEqual(198);
            expect(result.attachExternalVolumeToServer.ports[2].serverWwns[0]).toEqual('3054E1B674315000');
            expect(result.externalDevices[0].externalDeviceId).toEqual('HITACHI 50405F7702BC');
            expect(result.externalDevices[1].externalDeviceId).toEqual('EMC 50405F7702BD');
        });
    });
});
