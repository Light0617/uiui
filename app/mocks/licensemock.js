'use strict';

rainierAppMock.factory('licensemock', function (mockUtils) {
    var license = {
        licenseSettings: [
            {
                productName: 'Data Retention Utility',
                installed: true,
                licenseCapacity: {
                    permitted: {
                        unlimited: true
                    },
                    usedCapacity : '0'
                }
            },
            {
                productName : 'Dynamic Provisioning',
                installed : false,
                licenseCapacity : null
            },
            {
                'productName':'Dynamic Tiering',
                'installed':true,
                'licenseCapacity':{
                    'permitted':{
                        'unlimited':true,
                        'value':null
                    },
                    'usedCapacity':'81529216696320'
                }
            },
            {
                'productName':'active flash',
                'installed':true,
                'licenseCapacity':{
                    'permitted':{
                        'unlimited':true,
                        'value':null
                    },
                    'usedCapacity':'0'
                }
            },
            {
                'productName':'Thin Image',
                'installed':true,
                'licenseCapacity':{
                    'permitted':{
                        'unlimited':true,
                        'value':null
                    },
                    'usedCapacity':'1381905727488'
                }
            },
            {
                productName : 'Data Retention Utility',
                installed : true,
                licenseCapacity : {
                    permitted : {
                        unlimited : false,
                        value : '1512338723946'
                    },
                    usedCapacity : '-'
                }
            },
            {
                productName : 'Data Retention Utility',
                installed : true,
                licenseCapacity : {
                    permitted : {
                        unlimited : true
                    },
                    usedCapacity : '28666759217152'
                }
            },
            {
                'productName': 'Volume Migration',
                'installed': true,
                'licenseCapacity': null
            }
        ]
    };

    var handleGetRequest = function () {
        return mockUtils.response.ok(license);
    };

    return {
        getMock: function () {
            return license;
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