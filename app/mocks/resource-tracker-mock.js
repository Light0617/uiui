'use strict';

rainierAppMock.factory('resourceTrackerMock', function (mockUtils) {
    var jobId = mockUtils.uuid();
    var mockTrackedResources = {
        reservedResources:[
            {
                jobId: jobId,
                resId: '8',
                resType: 'STORAGE_POOL',
                parentResId: 440084,
                parentResType: 'STORAGE_SYSTEM'
            },
            {
                jobId: jobId,
                resId: '1-1',
                resType: 'PARITY_GROUP',
                parentResId: '440084',
                parentResType: 'STORAGE_SYSTEM'
            }
        ]
    };
    var handleGetRequest = function () {
        return mockUtils.response.ok(mockUtils.singlePageCollectionResponse(mockTrackedResources));
    };


    return {
        getMock: function () {
            return mockTrackedResources;
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