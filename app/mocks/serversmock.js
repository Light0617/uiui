'use strict';

rainierAppMock.factory('serversMock', function (mockUtils) {
    var mockHosts = [];

    var generateMockHosts = function () {
        var total = 200;

        while (total-- !== 0) {
            var mockHost = generateMockHost(total);
            mockHosts.push(mockHost);
        }
    };

    var generateMockHost = function (v) {
        return {
            serverId: v,
            serverName: 'MOCKUP HOST',
            description: 'TEST',
            ipAddress: '10.1.91.' + v,
            wwpns: mockUtils.getWWN(),
            osType: _.sample(['HP_UX', 'SOLARIS', 'AIX', 'TRU64', 'HI_UX', 'WIN', 'WIN_EX', 'LINUX', 'VMWARE', 'VMWARE_EX', 'NETWARE', 'OVMS']),
            dpStatus: _.sample(['Failed', 'Success']),
            dpType: mockUtils.getDpType()
        };
    };

    var getOsTypeCount = function () {
        var map = {};
        map.HP_UX = _.random(1, 20);
        map.SOLARIS = _.random(1, 20);
        map.AIX = _.random(1, 20);
        map.TRU64 = _.random(1, 20);
        map.HI_UX = _.random(1, 20);
        map.WIN = _.random(1, 20);
        map.WIN_EX = _.random(1, 20);
        map.LINUX = _.random(1, 20);
        map.VMWARE = _.random(1, 20);
        map.VMWARE_EX = _.random(1, 20);
        map.NETWARE = _.random(1, 20);
        return map;
    };

    var handleGetRequest = function (urlResult) {
        if (urlResult.type === 'servers') {
            mockUtils.response.ok({
                    osTypeCount: getOsTypeCount(),
                    totalHost: 200
                }
            );
        }
        if (urlResult.type === 'compute') {
            mockUtils.response.ok(mockUtils.collectionResponse(mockHosts, 'servers'));
        }

        return mockUtils.response.ok(mockUtils.collectionResponse(mockHosts, 'servers'));
    };

    return {
        init: function () {
            generateMockHosts();
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