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
            var dataModel = {
                storageSystemId: '510001',
                attachModel: {
                    selectedHostMode: 'LINUX',
                    selectedHostModeOption: [999]
                },
                preVirtualizationPaths: [
                    {
                        storagePortId: 'CL66-B'
                    },
                    {
                        storagePortId: 'CL25-B'
                    }
                ],
                pathModel: {
                    paths: [
                        {
                            storagePortId: 'CL66-B',
                            serverId: '198',
                            serverEndPoint: '3054E1B674315000'
                        },
                        {
                            storagePortId: 'CL25-B',
                            serverId: '198',
                            serverEndPoint: '3054E1B674315000'
                        },
                        {
                            storagePortId: 'CL25-B',
                            serverId: '198',
                            serverEndPoint: '84AE235E1F5CA000'
                        }
                    ]
                },
                selectedDiscoveredVolumes: [
                    {
                        volumeId: '186'
                    }
                ]
            };
            var result = virtualizeVolumeService.constructVirtualizePayload(dataModel);
            expect(result.hostMode).toEqual('LINUX');
            expect(result.storageSystemId).toEqual('510001');
            expect(result.luns[0]).toEqual(186);
            expect(result.hostModeOptions[0]).toEqual(999);
            expect(result.serverInfos[0].serverId).toEqual(198);
            expect(result.serverInfos[0].targetPortForHost).toEqual('CL66-B');
            expect(result.serverInfos[0].serverWwn[0]).toEqual('3054E1B674315000');
            expect(result.serverInfos[1].serverId).toEqual(198);
            expect(result.serverInfos[1].targetPortForHost).toEqual('CL25-B');
            expect(result.serverInfos[1].serverWwn[0]).toEqual('3054E1B674315000');
            expect(result.serverInfos[1].serverWwn[1]).toEqual('84AE235E1F5CA000');
        });
    });
});
