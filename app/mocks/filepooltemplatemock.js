'use strict';

rainierAppMock.factory('filePoolTemplateMock', function(mockUtils) {
    var filePoolTemplate = null;

    var generateMockFilePoolTemplate = function() {
        filePoolTemplate =
                {
                    'label': null,
                    'overCommitRatio': '200',
                    'tiers': [
                        {
                            'name': 'Platinum',
                            'templateSubTiers': [
                                {
                                    'diskType': 'FMD',
                                    'speed': '15000',
                                    'capacity': mockUtils.getCapacity(50, 300),
                                    'raidLayout': '14D+2P',
                                    'raidLevel': 'RAID6',
                                    'availableSizesInBytes': [mockUtils.getCapacity(50, 300), mockUtils.getCapacity(50, 300), mockUtils.getCapacity(50, 300)]
                                },
                                {
                                    'diskType': 'FMD',
                                    'speed': '15000',
                                    'capacity': mockUtils.getCapacity(50, 300),
                                    'raidLayout': '6D+2P',
                                    'raidLevel': 'RAID6',
                                    'availableSizesInBytes': [mockUtils.getCapacity(50, 300), mockUtils.getCapacity(50, 300), mockUtils.getCapacity(50, 300)]
                                },
                                {
                                    'diskType': 'SSD',
                                    'speed': '15000',
                                    'capacity': mockUtils.getCapacity(50, 300),
                                    'raidLayout': '14D+2P',
                                    'raidLevel': 'RAID6',
                                    'availableSizesInBytes': [mockUtils.getCapacity(50, 300), mockUtils.getCapacity(50, 300), mockUtils.getCapacity(50, 300)]
                                },
                                {
                                    'diskType': 'SSD',
                                    'speed': '15000',
                                    'capacity': mockUtils.getCapacity(50, 300),
                                    'raidLayout': '6D+2P',
                                    'raidLevel': 'RAID6',
                                    'availableSizesInBytes': [mockUtils.getCapacity(50, 300), mockUtils.getCapacity(50, 300), mockUtils.getCapacity(50, 300)]
                                }
                            ]
                        },
                        {
                            'name': 'Gold',
                            'templateSubTiers': [
                                {
                                    'diskType': 'SAS',
                                    'speed': '15000',
                                    'capacity': mockUtils.getCapacity(50, 300),
                                    'raidLayout': '14D+2P',
                                    'raidLevel': 'RAID6',
                                    'availableSizesInBytes': [mockUtils.getCapacity(50, 300), mockUtils.getCapacity(50, 300), mockUtils.getCapacity(50, 300)]
                                },
                                {
                                    'diskType': 'SAS',
                                    'speed': '15000',
                                    'capacity': mockUtils.getCapacity(50, 300),
                                    'raidLayout': '6D+2P',
                                    'raidLevel': 'RAID6',
                                    'availableSizesInBytes': [mockUtils.getCapacity(50, 300), mockUtils.getCapacity(50, 300), mockUtils.getCapacity(50, 300)]
                                }
                            ]
                        },
                        {
                            'name': 'Silver',
                            'templateSubTiers': [
                                {
                                    'diskType': 'SAS',
                                    'speed': '10000',
                                    'capacity': mockUtils.getCapacity(50, 300),
                                    'raidLayout': '14D+2P',
                                    'raidLevel': 'RAID6',
                                    'availableSizesInBytes': [mockUtils.getCapacity(50, 300), mockUtils.getCapacity(50, 300), mockUtils.getCapacity(50, 300)]
                                },
                                {
                                    'diskType': 'SAS',
                                    'speed': '10000',
                                    'capacity': mockUtils.getCapacity(50, 300),
                                    'raidLayout': '6D+2P',
                                    'raidLevel': 'RAID6',
                                    'availableSizesInBytes': [mockUtils.getCapacity(50, 300), mockUtils.getCapacity(50, 300), mockUtils.getCapacity(50, 300)]
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
                                    'raidLayout': '14D+2P',
                                    'raidLevel': 'RAID6',
                                    'availableSizesInBytes': [mockUtils.getCapacity(50, 300), mockUtils.getCapacity(50, 300), mockUtils.getCapacity(50, 300)]
                                },
                                {
                                    'diskType': 'SAS',
                                    'speed': '7200',
                                    'capacity': mockUtils.getCapacity(50, 300),
                                    'raidLayout': '6D+2P',
                                    'raidLevel': 'RAID6',
                                    'availableSizesInBytes': [mockUtils.getCapacity(50, 300), mockUtils.getCapacity(50, 300), mockUtils.getCapacity(50, 300)]
                                }
                            ]
                        }
                    ],
                    utilizationThreshold1: 70,
                    utilizationThreshold2: 80
        };
    };
    var handleGetRequest = function (){
        return mockUtils.response.ok(filePoolTemplate);
    };

    return {
        init: function() {
            generateMockFilePoolTemplate();
        },
        getMock: function() {
            return filePoolTemplate;
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