'use strict';

rainierAppMock.factory('ethernetInterfaceMock', function (mockUtils) {
    var handleGetRequest = function () {
        var ethernetInterfaces = [
            {
                'name': 'ag1',
                'hyasInterfaceCapabilities': [
                    {
                        'value': 2
                    },
                    {
                        'value': 4
                    },
                    {
                        'value': 8
                    }
                ]
            },
            {
                'name': 'c0',
                'hyasInterfaceCapabilities': [
                    {
                        'value': 0
                    }
                ]
            },
            {
                'name': 'eth0',
                'hyasInterfaceCapabilities': [
                    {
                        'value': 0
                    }
                ]
            },
            {
                'name': 'eth1',
                'hyasInterfaceCapabilities': [
                    {
                        'value': 0
                    }
                ]
            },
            {
                'name': 'fsmc0',
                'hyasInterfaceCapabilities': [
                    {
                        'value': 0
                    }
                ]
            },
            {
                'name': 'lo',
                'hyasInterfaceCapabilities': [
                    {
                        'value': 0
                    }
                ]
            },
            {
                'name': 'tg1',
                'hyasInterfaceCapabilities': [
                    {
                        'value': 16
                    }
                ]
            },
            {
                'name': 'tg2',
                'hyasInterfaceCapabilities': [
                    {
                        'value': 16
                    }
                ]
            },
            {
                'name': 'tg3',
                'hyasInterfaceCapabilities': [
                    {
                        'value': 16
                    }
                ]
            },
            {
                'name': 'tg4',
                'hyasInterfaceCapabilities': [
                    {
                        'value': 16
                    }
                ]
            },
            {
                'name': 'tg5',
                'hyasInterfaceCapabilities': [
                    {
                        'value': 16
                    }
                ]
            },
            {
                'name': 'tg6',
                'hyasInterfaceCapabilities': [
                    {
                        'value': 16
                    }
                ]
            }
        ];
        return { ethernetInterfaceResourceList: ethernetInterfaces };
            
    };

    return {
        init: function () {
        },
        getMock: function () {
        },
        handle: function (urlResult) {
            switch (urlResult.method) {
                case 'GET':
                    return mockUtils.response.ok(handleGetRequest());
                default:
                    return mockUtils.response.methodNotAllowed(urlResult.url);
            }
        }
    };
});