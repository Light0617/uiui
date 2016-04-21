'use strict';

rainierAppMock.factory('sharesMock', function (mockUtils) {
    var mockShares = [];

    var generateMockShares = function () {
        var total = 64;

        for(var i = 1; i <= total; i++) {
            var mockShare = generateMockShare(i);
            mockShares.push(mockShare);
        }

    };

    var generateMockShare = function (v) {
        var mockPermissions = generateMockPermissions();
        return {
            'id': 'S' + v,
            'name': 'Share ' + v,
            'fileSystemId': 10,
            'fileSystemPath':'/etc',
            'evsId': 1,
            'evsUuid': '35cfc131-179d-4e62-918e-a5b53332b61d',
            'permissions': mockPermissions,
            'accessConfiguration':'1.1.1.1 2.2.2.2 3.3.3.3 4.4.4.4 5.5.5.5',
            'cacheOptions':'',
            'snapshotOptions':'',
            'maxConcurrentUsers':'',
            'transferToReplicationTarget':'',
            'userHomeDirectoryMode':'',
            'userHomeDirectoryPath':'',
            'followSymbolicLinks':'',
            'followGlobalSymbolicLinks':'',
            'links':[
                {
                    'rel':'_self',
                    'href':''
                },
                {
                    'rel':'_filesystem',
                    'href':'/#/storage-systems/22001/file-systems/10'
                },
                {
                    'rel': '_vfs',
                    'href': '/#/storage-systems/22001/vfs/35cfc131-179d-4e62-918e-a5b53332b61d'
                }
            ]
        };
    };

    var generateMockPermissions = function () {
        var total = 5;
        var mockPermissions = [];
        for(var i = 1; i <= total; i++) {
            var mockPermission = generateMockPermission();
            mockPermissions.push(mockPermission);
        }
        return mockPermissions;
    };

    var generateMockPermission = function () {
        return {
            'groupName': 'everyone',
            'permissionType':
            {
                'allowFullControl': mockUtils.trueOrFalse(),
                'allowRead': mockUtils.trueOrFalse(),
                'allowChange': mockUtils.trueOrFalse(),
                'denyFullControl': mockUtils.trueOrFalse(),
                'denyRead': mockUtils.trueOrFalse(),
                'denyChange': mockUtils.trueOrFalse()
            }
        };
    };



    var handleGetRequest = function (urlResult) {
        if (urlResult.subSubResourceId) {
            var share = mockUtils.fromCollection(mockShares, urlResult.subSubResourceId, 'id');
            return (share) ? mockUtils.response.ok(share) : mockUtils.response.notFound('Unable to find share with matching Id.');
        }
        return mockUtils.response.ok(mockUtils.collectionResponse(mockShares, 'shares'));
    };

    return {
        init: function () {
            generateMockShares();
        },
        getMock: function () {
            return mockShares;
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