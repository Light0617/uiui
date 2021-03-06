'use strict';

rainierAppMock.factory('parityGroupTemplateMock', function(mockUtils) {

    var parityGroupTemplate = {
            'parityGroupTemplateItems':[
            {
                'diskType':'SAS',
                'speed':10000,
                'size':576393524736,
                'totalNumberOfDisks':24,
                'numberOfAvailableDisks':11,
                'numberOfNewHotSpares':0,
                'numberOfExistingHotSpares':1,
                'raidOptions':[
                    {
                        'raidLayout':'14D+2P',
                        'raidLevel':'RAID6',
                        'numberOfDisksForRaidLayout':16,
                        'numberOfParityGroups':0,
                        'usableCapacity':0,
                        'isDefault':false,
                        'numberOfUnusedDisks':11
                    },
                    {
                        'raidLayout':'6D+1P',
                        'raidLevel':'RAID5',
                        'numberOfDisksForRaidLayout':7,
                        'numberOfParityGroups':1,
                        'usableCapacity':3458361148416,
                        'isDefault':false,
                        'numberOfUnusedDisks':4
                    },
                    {
                        'raidLayout':'12D+2P',
                        'raidLevel':'RAID6',
                        'numberOfDisksForRaidLayout':14,
                        'numberOfParityGroups':0,
                        'usableCapacity':0,
                        'isDefault':false,
                        'numberOfUnusedDisks':11
                    },
                    {
                        'raidLayout':'4D+1P',
                        'raidLevel':'RAID5',
                        'numberOfDisksForRaidLayout':5,
                        'numberOfParityGroups':2,
                        'usableCapacity':4611148197888,
                        'isDefault':false,
                        'numberOfUnusedDisks':1
                    },
                    {
                        'raidLayout':'3D+1P',
                        'raidLevel':'RAID5',
                        'numberOfDisksForRaidLayout':4,
                        'numberOfParityGroups':2,
                        'usableCapacity':3458361148416,
                        'isDefault':false,
                        'numberOfUnusedDisks':3
                    },
                    {
                        'raidLayout':'6D+2P',
                        'raidLevel':'RAID6',
                        'numberOfDisksForRaidLayout':8,
                        'numberOfParityGroups':1,
                        'usableCapacity':3458361148416,
                        'isDefault':true,
                        'numberOfUnusedDisks':3
                    },
                    {
                        'raidLayout':'2D+2D',
                        'raidLevel':'RAID1+0',
                        'numberOfDisksForRaidLayout':4,
                        'numberOfParityGroups':2,
                        'usableCapacity':2305574098944,
                        'isDefault':false,
                        'numberOfUnusedDisks':3
                    },
                    {
                        'raidLayout':'7D+1P',
                        'raidLevel':'RAID5',
                        'numberOfDisksForRaidLayout':8,
                        'numberOfParityGroups':1,
                        'usableCapacity':4034754673152,
                        'isDefault':false,
                        'numberOfUnusedDisks':3
                    }
                ]
            },
            {
                'diskType':'SAS',
                'speed':7200,
                'size':3916143603200,
                'totalNumberOfDisks':12,
                'numberOfAvailableDisks':6,
                'numberOfNewHotSpares':0,
                'numberOfExistingHotSpares':2,
                'raidOptions':[
                    {
                        'raidLayout':'14D+2P',
                        'raidLevel':'RAID6',
                        'numberOfDisksForRaidLayout':16,
                        'numberOfParityGroups':0,
                        'usableCapacity':0,
                        'isDefault':true,
                        'numberOfUnusedDisks':6
                    },
                    {
                        'raidLayout':'6D+1P',
                        'raidLevel':'RAID5',
                        'numberOfDisksForRaidLayout':7,
                        'numberOfParityGroups':0,
                        'usableCapacity':0,
                        'isDefault':false,
                        'numberOfUnusedDisks':6
                    },
                    {
                        'raidLayout':'12D+2P',
                        'raidLevel':'RAID6',
                        'numberOfDisksForRaidLayout':14,
                        'numberOfParityGroups':0,
                        'usableCapacity':0,
                        'isDefault':false,
                        'numberOfUnusedDisks':6
                    },
                    {
                        'raidLayout':'4D+1P',
                        'raidLevel':'RAID5',
                        'numberOfDisksForRaidLayout':5,
                        'numberOfParityGroups':1,
                        'usableCapacity':15664574412800,
                        'isDefault':false,
                        'numberOfUnusedDisks':1
                    },
                    {
                        'raidLayout':'3D+1P',
                        'raidLevel':'RAID5',
                        'numberOfDisksForRaidLayout':4,
                        'numberOfParityGroups':1,
                        'usableCapacity':11748430809600,
                        'isDefault':false,
                        'numberOfUnusedDisks':2
                    },
                    {
                        'raidLayout':'6D+2P',
                        'raidLevel':'RAID6',
                        'numberOfDisksForRaidLayout':8,
                        'numberOfParityGroups':0,
                        'usableCapacity':0,
                        'isDefault':false,
                        'numberOfUnusedDisks':6
                    },
                    {
                        'raidLayout':'2D+2D',
                        'raidLevel':'RAID1+0',
                        'numberOfDisksForRaidLayout':4,
                        'numberOfParityGroups':1,
                        'usableCapacity':7832287206400,
                        'isDefault':false,
                        'numberOfUnusedDisks':2
                    },
                    {
                        'raidLayout':'7D+1P',
                        'raidLevel':'RAID5',
                        'numberOfDisksForRaidLayout':8,
                        'numberOfParityGroups':0,
                        'usableCapacity':0,
                        'isDefault':false,
                        'numberOfUnusedDisks':6
                    }
                ]
            },
            {
                'diskType':'FMD DC2',
                'speed':0,
                'size':1759216926656,
                'totalNumberOfDisks':31,
                'numberOfAvailableDisks':1,
                'numberOfNewHotSpares':0,
                'numberOfExistingHotSpares':2,
                'raidOptions':[
                    {
                        'raidLayout':'14D+2P',
                        'raidLevel':'RAID6',
                        'numberOfDisksForRaidLayout':16,
                        'numberOfParityGroups':0,
                        'usableCapacity':0,
                        'isDefault':false,
                        'numberOfUnusedDisks':1
                    },
                    {
                        'raidLayout':'6D+1P',
                        'raidLevel':'RAID5',
                        'numberOfDisksForRaidLayout':7,
                        'numberOfParityGroups':0,
                        'usableCapacity':0,
                        'isDefault':false,
                        'numberOfUnusedDisks':1
                    },
                    {
                        'raidLayout':'12D+2P',
                        'raidLevel':'RAID6',
                        'numberOfDisksForRaidLayout':14,
                        'numberOfParityGroups':0,
                        'usableCapacity':0,
                        'isDefault':false,
                        'numberOfUnusedDisks':1
                    },
                    {
                        'raidLayout':'4D+1P',
                        'raidLevel':'RAID5',
                        'numberOfDisksForRaidLayout':5,
                        'numberOfParityGroups':0,
                        'usableCapacity':0,
                        'isDefault':false,
                        'numberOfUnusedDisks':1
                    },
                    {
                        'raidLayout':'3D+1P',
                        'raidLevel':'RAID5',
                        'numberOfDisksForRaidLayout':4,
                        'numberOfParityGroups':0,
                        'usableCapacity':0,
                        'isDefault':false,
                        'numberOfUnusedDisks':1
                    },
                    {
                        'raidLayout':'6D+2P',
                        'raidLevel':'RAID6',
                        'numberOfDisksForRaidLayout':8,
                        'numberOfParityGroups':0,
                        'usableCapacity':0,
                        'isDefault':true,
                        'numberOfUnusedDisks':1
                    },
                    {
                        'raidLayout':'2D+2D',
                        'raidLevel':'RAID1+0',
                        'numberOfDisksForRaidLayout':4,
                        'numberOfParityGroups':0,
                        'usableCapacity':0,
                        'isDefault':false,
                        'numberOfUnusedDisks':1
                    },
                    {
                        'raidLayout':'7D+1P',
                        'raidLevel':'RAID5',
                        'numberOfDisksForRaidLayout':8,
                        'numberOfParityGroups':0,
                        'usableCapacity':0,
                        'isDefault':false,
                        'numberOfUnusedDisks':1
                    }
                ]
            }
        ]
    };

    var handleGetRequest = function (){
        return mockUtils.response.ok(parityGroupTemplate);
    };

    return {
        getMock: function() {
            return parityGroupTemplate;
        },
        handle: function(urlResult) {
            switch (urlResult.method) {
                case 'GET':
                    return handleGetRequest();
                default:
                    return mockUtils.response.methodNotAllowed(urlResult.url);
            }
        }
    };
});