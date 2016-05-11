'use strict';

rainierAppMock.factory('externalParityGroupMock', function(mockUtils) {
    var externalParityGroups = [];

    var generateMockExternalParityGroups = function() {
        var total = 64;

        while (total-- !== 0) {
            var mockExternalParityGroup = generateMockExternalParityGroup(total);
            externalParityGroups.push(mockExternalParityGroup);
        }
    };

    var externalParityGroupSummary = {
        'totalCapacity':6756894572544,
        'totalFreeCapacity':6756894572544,
        'numberOfExternalParityGroups':64
    };

    var generateMockExternalParityGroup = function(v) {
        return {
            'externalParityGroupId':'1-' + v,
            'storageSystemId':'410031',
            'availableCapacity':mockUtils.getCapacity(1, 50),
            'capacity':mockUtils.getCapacity(50, 100),
            'externalStorageSystemId':'420007',
            'externalStorageVendor':'HITACHI',
            'externalStorageProduct':'VSP Gx00'
        };
    };

    var handleGetRequest = function (urlResult){
        if(urlResult.subResourceId === 'summary') {
            return mockUtils.response.ok(externalParityGroupSummary);
        }
        else if (urlResult.subResourceId) {
            var externalParityGroup = mockUtils.fromCollection(externalParityGroups, urlResult.subResourceId, 'id');
            return (externalParityGroup) ? mockUtils.response.ok(externalParityGroup) : mockUtils.response.notFound('Unable to find endpoint with matching Id.');
        }

        return mockUtils.response.ok(mockUtils.singlePageCollectionResponse(externalParityGroups));
    };

    return {
        init: function() {
            generateMockExternalParityGroups();
        },
        getMock: function() {
            return externalParityGroups;
        },
        handle: function(urlResult) {
            switch (urlResult.method) {
                case 'GET':
                    return handleGetRequest(urlResult);
                default:
                    return mockUtils.response.methodNotAllowed(urlResult.url);
            }
        }
    };
});