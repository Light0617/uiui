'use strict';

rainierAppMock.factory('filePoolExpandTemplateMock', function(mockUtils) {
    var filePoolExpandTemplate = null;

    var generateMockFilePoolExpandTemplate = function() {
        filePoolExpandTemplate =
        {
            'filePoolExpandTemplateItems': [
                {
                    'label': 'Test Label',
                    'overCommitRatio': '200',
                    'tiers': [
                        {
                            'name': 'Platinum',
                            'templateSubTiers': [
                                {
                                    'diskType': 'FMD',
                                    'speed': '15000',
                                    'capacity': mockUtils.getCapacity(50, 300),
                                    'raidOptions': [
                                        {
                                            'raidLayout': '14D+2P',
                                            'raidLevel': 'RAID6',
                                            'usableCapacities': [
                                                {
                                                    '0': mockUtils.getCapacity(50, 300),
                                                    '1': mockUtils.getCapacity(50, 300),
                                                    '2': mockUtils.getCapacity(50, 300)
                                                }
                                            ]
                                        },
                                        {
                                            'raidLayout': '6D+2P',
                                            'raidLevel': 'RAID6',
                                            'usableCapacities': [
                                                {
                                                    '0': mockUtils.getCapacity(50, 300),
                                                    '1': mockUtils.getCapacity(50, 300),
                                                    '2': mockUtils.getCapacity(50, 300)
                                                }
                                            ]
                                        }
                                    ]
                                },
                                {
                                    'diskType': 'SSD',
                                    'speed': '15000',
                                    'capacity': mockUtils.getCapacity(50, 300),
                                    'raidOptions': [
                                        {
                                            'raidLayout': '14D+2P',
                                            'raidLevel': 'RAID6',
                                            'usableCapacities': [
                                                {
                                                    '0': mockUtils.getCapacity(50, 300),
                                                    '1': mockUtils.getCapacity(50, 300),
                                                    '2': mockUtils.getCapacity(50, 300)
                                                }
                                            ]
                                        },
                                        {
                                            'raidLayout': '6D+2P',
                                            'raidLevel': 'RAID6',
                                            'usableCapacities': [
                                                {
                                                    '0': mockUtils.getCapacity(50, 300),
                                                    '1': mockUtils.getCapacity(50, 300),
                                                    '2': mockUtils.getCapacity(50, 300)
                                                }
                                            ]
                                        }
                                    ]
                                }
                            ]
                        },
                        {
                            'name': 'Bronze',
                            'templateSubTiers': [
                                {
                                    'diskType': 'SAS',
                                    'speed': '7200',
                                    'capacity': mockUtils.getCapacity(50, 300),
                                    'raidOptions': [
                                        {
                                            'raidLayout': '14D+2P',
                                            'raidLevel': 'RAID6',
                                            'usableCapacities': [
                                                {
                                                    '0': mockUtils.getCapacity(50, 300),
                                                    '1': mockUtils.getCapacity(50, 300),
                                                    '2': mockUtils.getCapacity(50, 300)
                                                }
                                            ]
                                        },
                                        {
                                            'raidLayout': '6D+2P',
                                            'raidLevel': 'RAID6',
                                            'usableCapacities': [
                                                {
                                                    '0': mockUtils.getCapacity(50, 300),
                                                    '1': mockUtils.getCapacity(50, 300),
                                                    '2': mockUtils.getCapacity(50, 300)
                                                }
                                            ]
                                        }
                                    ]
                                }
                            ]
                        }
                    ]
                }
            ]
        };
    };
    var handleGetRequest = function (){
        return mockUtils.response.ok(filePoolExpandTemplate);
    };

    return {
        init: function() {
            generateMockFilePoolExpandTemplate();
        },
        getMock: function() {
            return filePoolExpandTemplate;
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