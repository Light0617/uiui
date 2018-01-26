'use strict';

rainierAppMock.factory('serversMock', function (mockUtils, volumeMock, commonMock) {
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

    var commonServerProperties = function(id) {
        return {
            serverId: id,
            serverName: 'MOCKUP HOST',
            description: 'TEST',
            ipAddress: '10.1.91.' + id,
            osType: _.sample(['HP_UX', 'SOLARIS', 'AIX', 'TRU64', 'WIN', 'WIN_EX', 'LINUX', 'VMWARE', 'VMWARE_EX', 'NETWARE', 'OVMS']),
            dpStatus: _.sample(['Failed', 'Success']),
            dataProtectionSummary:{replicationType: randomReplicationType()},
            attachedVolumeCount: 7
        };
    };

    var fibreServer = function(id) {
        var result = commonServerProperties(id);
        result.protocol = 'FIBRE';
        result.wwpns = commonMock.getWwns();
        return result;
    };

    var iscsiServer = function(id) {
        var result = commonServerProperties(id);
        result.protocol = 'ISCSI';
        result.iscsiNames = commonMock.getIscsiNames();
        result.chapUser = 'user1';
        result.mutualChapUser = 'user2';
        return result;
    };

    var generateMockHost = function (id) {
        if(_.sample([true, false])) {
            return fibreServer(id);
        } else {
            return iscsiServer(id);
        }
    };

    var randomReplicationType = function () {
        var type= ['CLONE','SNAP', 'SNAP_ON_SNAP', 'SNAP_CLONE'];
        _.each(type, function(e, i, a) {
            if(_.random(0, 1)){
                a.splice(a.indexOf(e), 1);
            }
        });
        return type;
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