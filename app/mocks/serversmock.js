'use strict';

rainierAppMock.factory('serversMock', function (mockUtils, volumeMock) {
    var mockHosts = [];
    var mockVolumes = [];

    var generateMockHostsAndVolumes = function () {
        var total = 200;

        while (total-- !== 0) {
            var mockHost = generateMockHost(total);
            mockHosts.push(mockHost);
        }
        mockVolumes = volumeMock.getMock();
    };

    var generateMockHost = function (v) {
        return {
            serverId: v,
            serverName: 'MOCKUP HOST',
            description: 'TEST',
            ipAddress: '10.1.91.' + v,
            wwpns: mockUtils.getWWN(),
            osType: _.sample(['HP_UX', 'SOLARIS', 'AIX', 'TRU64', 'WIN', 'WIN_EX', 'LINUX', 'VMWARE', 'VMWARE_EX', 'NETWARE', 'OVMS']),
            dpStatus: _.sample(['Failed', 'Success']),
            dataProtectionSummary:{replicationType:['CLONE','SNAPSHOT', 'SNAPSHOT_EXTENDABLE', 'SNAPSHOT_FULLCOPY']},
            attachedVolumeCount: 7
        };
    };

    var getOsTypeCount = function () {
        var map = {};
        map.HP_UX = _.random(1, 20);
        map.SOLARIS = _.random(1, 20);
        map.AIX = _.random(1, 20);
        map.TRU64 = _.random(1, 20);
        map.WIN = _.random(1, 20);
        map.WIN_EX = _.random(1, 20);
        map.LINUX = _.random(1, 20);
        map.VMWARE = _.random(1, 20);
        map.VMWARE_EX = _.random(1, 20);
        map.NETWARE = _.random(1, 20);
        return map;
    };

    var handleGetRequest = function (urlResult) {
        if (urlResult.resourceId === 'servers') {
            if (urlResult.subType) {
                switch (urlResult.subType) {
                    case 'summary':
                        return mockUtils.response.ok({osTypeCount: getOsTypeCount(), totalHost: 200});
                    case 'attached-volumes':
                        return mockUtils.response.ok(mockUtils.singlePageCollectionResponse(mockVolumes));
                    default:
                        var host = mockUtils.fromCollection(mockHosts, parseInt(urlResult.subType), 'serverId');
                        return (host) ? mockUtils.response.ok(host) : mockUtils.response.notFound('Unable to find host with matching Id.');
                }
            } else {
                return mockUtils.response.ok(mockUtils.singlePageCollectionResponse(mockHosts, 'servers'));
            }
        } else if (urlResult.subType === 'volumes') {
            return mockUtils.response.ok({dpVolResouce: mockVolumes, hostId: urlResult.resourceId});
        }
    };

    return {
        init: function () {
            generateMockHostsAndVolumes();
        },
        getMock: function () {
            return mockHosts;
        },
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