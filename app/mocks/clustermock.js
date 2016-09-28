'use strict';

rainierAppMock.factory('clusterMock', function (mockUtils) {
    var mockClusters = [];

    var generateMockClusters = function () {
        var total = 64;
        var half = 32;

        var adminEVS = generateMockCluster(0);

        // Admin EVS is the only EVS with type admin
        adminEVS.type = 'admin';
        mockClusters.push(adminEVS);

        for(var i = 1; i <= half; i++) {
            var mockCluster = generateMockCluster(i);
            mockClusters.push(mockCluster);
        }

        for(var j = half; j <= total; j++) {
            var mockGefnCluster = generateMockGefnCluster(j);
            mockClusters.push(mockGefnCluster);
        }

    };

    var generateMockCluster = function (v) {
        return {
            'clusterId': v,
            'name': 'Cluster ' + v,
            'clustered': true,
            'size': 100,
            'health': 'healthy',
            'licenseId': '123',
            'clusterNodes':
            [
                {
                    'uuid': v,
                    'nodeId': 1,
                    'name': 'Cluster node 1',
                    'ipAddresses':
                        [
                            {
                                'ipAddress': '1.1.1.1',
                                'mask':'1.1.1.1',
                                'port':'1111'
                            }
                        ],
                    'status': 2,
                    'model':'VSP G400',
                    'firmware':'v1.0',
                    'vendor':''
                },
                {
                    'uuid': v,
                    'nodeId': 2,
                    'name': 'Cluster node 2',
                    'ipAddresses':
                        [
                            {
                                'ipAddress': '1.1.1.1',
                                'mask':'1.1.1.1',
                                'port':'1111'
                            }
                        ],
                    'status': 3,
                    'model':'VSP G400',
                    'firmware':'v1.0',
                    'vendor':''
                }
            ],
            'numOfNodes':2,
            'unified': true,
            'storageSystemId': v
        };
    };

    var generateMockGefnCluster = function (v) {
        return {
            'clusterId': v,
            'name': 'Cluster ' + v,
            'clustered': true,
            'size': 100,
            'health': 'Healthy',
            'licenseId': '123',
            'clusterNodes':
                [
                    {
                        'uuid': v,
                        'nodeId': 1,
                        'name': 'Cluster node 1',
                        'ipAddresses':
                            [
                                {
                                    'ipAddress': '1.1.1.1',
                                    'mask':'1.1.1.1',
                                    'port':'1111'
                                }
                            ],
                        'status': 2,
                        'model':'VSP G400',
                        'firmware':'v1.0',
                        'vendor':''
                    },
                    {
                        'uuid': v,
                        'nodeId': 2,
                        'name': 'Cluster node 2',
                        'ipAddresses':
                            [
                                {
                                    'ipAddress': '1.1.1.1',
                                    'mask':'1.1.1.1',
                                    'port':'1111'
                                }
                            ],
                        'status': 3,
                        'model':'VSP G400',
                        'firmware':'v1.0',
                        'vendor':''
                    },
                    {
                        'uuid': v,
                        'nodeId': 3,
                        'name': 'Cluster node 1',
                        'ipAddresses':
                            [
                                {
                                    'ipAddress': '1.1.1.1',
                                    'mask':'1.1.1.1',
                                    'port':'1111'
                                }
                            ],
                        'status': 2,
                        'model':'VSP G400',
                        'firmware':'v1.0',
                        'vendor':''
                    },
                    {
                        'uuid': v,
                        'nodeId': 4,
                        'name': 'Cluster node 1',
                        'ipAddresses':
                            [
                                {
                                    'ipAddress': '1.1.1.1',
                                    'mask':'1.1.1.1',
                                    'port':'1111'
                                }
                            ],
                        'status': 2,
                        'model':'VSP G400',
                        'firmware':'v1.0',
                        'vendor':''
                    }
                ],
            'numOfNodes':4,
            'unified': true,
            'storageSystemId': v
        };
    };


    var handleGetRequest = function (urlResult) {
        if (urlResult.subType === 'cluster') {
            return mockUtils.response.ok(_.first(mockClusters));
        }

        return mockUtils.response.ok(mockUtils.collectionResponse(mockClusters, 'cluster'));
    };

    return {
        init: function () {
            generateMockClusters();
        },
        getMock: function () {
            return mockClusters;
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