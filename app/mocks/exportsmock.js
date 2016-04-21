'use strict';

rainierAppMock.factory('exportsMock', function (mockUtils) {
    var mockExports = [];

    var generateMockExports = function () {
        var total = 64;

        for(var i = 1; i <= total; i++) {
            var mockExport = generateMockExport(i);
            mockExports.push(mockExport);
        }

    };

    var generateMockExport = function (v) {
        return {
            'id': 'E' + v,
            'name': '/Export ' + v,
            'fileSystemId': 10,
            'fileSystemPath':'/etc',
            'evsId': 1,
            'snapshotOptions':'',
            'transferToReplicationTarget':'',
            'accessConfiguration': '1.1.1.1 2.2.2.2 3.3.3.3 4.4.4.4 5.5.5.5',
            'links':[
                {
                    'rel':'_self',
                    'href':''
                },
                {
                    'rel':'_filesystem',
                    'href':'/v1/storage-systems/22001/file-systems/10'
                },
                {
                    'rel': '_vfs',
                    'href': '/#/storage-systems/22001/vfs/35cfc131-179d-4e62-918e-a5b53332b61d'
                }
            ]
        };
    };

    var handleGetRequest = function (urlResult) {
        if (urlResult.subSubResourceId) {
            var exports = mockUtils.fromCollection(mockExports, urlResult.subSubResourceId, 'id');
            return (exports) ? mockUtils.response.ok(exports) : mockUtils.response.notFound('Unable to find export with matching Id.');
        }
        return mockUtils.response.ok(mockUtils.collectionResponse(mockExports, 'exports'));
    };

    return {
        init: function () {
            generateMockExports();
        },
        getMock: function () {
            return mockExports;
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