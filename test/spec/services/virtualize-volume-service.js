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
                externalPorts: [
                    {
                        storagePortId: 'CL66-B'
                    },
                    {
                        storagePortId: 'CL25-B'
                    }
                ],
                luns: [
                    {
                        portId: 'CL10-B',
                        wwn: '66A5763BAFE03799',
                        lunId: 1,
                        externalIscsiInformation: null
                    }
                ],
                hostMode: 'LINUX',
                storageSystem: {
                    storageSystemId: '510001'
                },
                hostModeOptions: [999, 0],
                enableZoning: false,
                paths: [
                    {
                        storagePortId: 'CL66-B',
                        serverId: 198,
                        targetWwn: '3054E1B674315000',
                        serverEndPoint: '3054E1B674315000'
                    },
                    {
                        storagePortId: 'CL25-B',
                        serverId: 198,
                        targetWwn: '3054E1B674315000',
                        serverEndPoint: '3054E1B674315000'
                    }
                ]
            };
            var result = virtualizeVolumeService.constructVirtualizePayload(selected);
            expect(result.hostMode).toEqual('LINUX');
            expect(result.targetPorts[0]).toEqual('CL66-B');
            expect(result.targetPorts[1]).toEqual('CL25-B');
            expect(result.storageSystemId).toEqual('510001');
            expect(result.externalLuns[0].portId).toEqual('CL10-B');
            expect(result.externalLuns[0].wwn).toEqual('66A5763BAFE03799');
            expect(result.externalLuns[0].lunId).toEqual(1);
            expect(result.hostModeOptions).toBeUndefined();
            expect(result.enableZoning).toBeFalsy();
            expect(result.serverInfos[0].serverId).toEqual(198);
            expect(result.serverInfos[0].targetPortForHost).toEqual('CL66-B');
            expect(result.serverInfos[0].serverWwns[0]).toEqual('3054E1B674315000');
            expect(result.serverInfos[1].serverId).toEqual(198);
            expect(result.serverInfos[1].targetPortForHost).toEqual('CL25-B');
            expect(result.serverInfos[1].serverWwns[0]).toEqual('3054E1B674315000');
        });
    });
});
