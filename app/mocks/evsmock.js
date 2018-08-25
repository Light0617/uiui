'use strict';

rainierAppMock.factory('evsMock', function (mockUtils) {
    var mockEVSs = [];

    var generateMockEVSs = function () {
        var total = 64;

        var adminEVS = generateMockEVS(0);

        // Admin EVS is the only EVS with type admin
        adminEVS.type = 'admin';
        mockEVSs.push(adminEVS);

        for(var i = 1; i <= total; i++) {
            var mockEVS = generateMockEVS(i);
            mockEVSs.push(mockEVS);
        }
        var matchingEvs = generateMockEVS(i);
        matchingEvs.uuid = '35cfc131-179d-4e62-918e-a5b53332b61d';
        mockEVSs.push(matchingEvs);

    };

    var generateMockEVS = function (v) {
        return {
            'uuid': mockUtils.uuid(),
            'id': v,
            'name': 'File Server ' + v,
            'type': 'srv',
            'enabled': mockUtils.trueOrFalse(),
            'status': mockUtils.trueOrFalse() ? 'On line' : 'Off line',
            'clusterNodeId': mockUtils.trueOrFalse() ? 1 : 2,
            'interfaceAddresses': [
                {
                    'ip': '101.101.101.1' + v,
                    'mask': '101.101.101.1' + v,
                    'prefixLength': '21',
                    'port': 'ag' + 1,
                    'locationName': '',
                    'ipv6': false
                },
                {
                    'ip': '101.101.101.2' + v,
                    'mask': '101.101.101.2' + v,
                    'prefixLength': '21',
                    'port': 'ag' + 1,
                    'locationName': '',
                    'ipv6': false
                }
            ],
            'links': [
                {
                    'rel': '_self',
                    'href': ''
                },
                {
                    'rel': '_filesystems',
                    'href': '/#/file/storage-systems/22001/vfs/' + mockUtils.uuid() + '/file-systems'
                }
            ]
        };
    };


    var handleGetRequest = function (urlResult) {
        //create the links - need to update backend API
        if (urlResult.type === 'vfs') {
            // get all EVS call
            return mockUtils.response.ok(mockUtils.collectionResponse(mockEVSs, 'evses'));
        }


        if (urlResult.subResourceId) {
            return mockUtils.response.ok(_.first(mockEVSs));
        }

        return mockUtils.response.ok(mockUtils.collectionResponse(mockEVSs, 'evses'));
    };

    return {
        init: function () {
            generateMockEVSs();
        },
        getMock: function () {
            return mockEVSs;
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