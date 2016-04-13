var express = require('express')
var bodyParser = require('body-parser')
var _ = require('lodash');

var app = express()

var jsonParser = bodyParser.json()

var tiers = {
    "tiers": [
        {
            "id": "1",
            "tier": "Platinum",
            "subTiers": [
                {
                    "diskType": "SSD",
                    "speed": 0
                },
                {
                    "diskType": "FMD",
                    "speed": 0
                },
                {
                    "diskType": "FMC",
                    "speed": 0
                }
            ]
        },
        {
            "id": "2",
            "tier": "Gold",
            "subTiers": [
                {
                    "diskType": "SAS",
                    "speed": 15000
                }
            ]
        },
        {
            "id": "3",
            "tier": "Silver",
            "subTiers": [
                {
                    "diskType": "SAS",
                    "speed": 10000
                }
            ]
        },
        {
            "id": "4",
            "tier": "Bronze",
            "subTiers": [
                {
                    "diskType": "SAS",
                    "speed": 7200
                }
            ]
        },
        {
            "id": "5",
            "tier": "External",
            "subTiers": []
        }
    ]
};

var loginUser = null;

var getCapacity = function (min, max) {
    return _.random(min, max) * Math.pow(1024, 4) + '';
}
var raidConfigs = [
    {
        raidLevel: 'RAID5',
        layouts: ["3D+1P", "4D+1P", "6D+1P", "7D+1P"]
    },
    {
        raidLevel: 'RAID6',
        layouts: ["6D+2P", "12D+2P", "14D+2P"]
    }
]
var getSubTier = function (capacitySeed) {

    var subTier = {
        "diskType": "SAS",
        "speed": 150000,
        "capacity": getCapacity(300, 301),
        "availableSizesInBytes": _.range(capacitySeed, capacitySeed + 10).map(function (val) {
            return getCapacity(val, val + 1)
        })
    };

    subTier.description = [subTier.diskType, subTier.speed].join(' ');

    return subTier;
}
var getTier = function (name) {
    return {
        "name": name,
        "templateSubTiers": _.range(1, _.random(4, 6)).map(function (val) {
            return getSubTier(_.random(40, 100))
        })
    };
}
var jobSeed = 1;
var getjob = function (name) {
    return {
        id: (jobSeed++) + '',
        title: name,
        user: "user1",
        tenant: "tenant1",
        status: "IN_PROGRESS",
        startDate: null,
        endDate: null,
        parentJobId: 00021,
        reports: null
    }
}
var R800storageSystems = _.map(_.range(1, 2), function (v) {

    var total = getCapacity(800, 1000);
    var physicalUsed = getCapacity(500, 700);
    var used = getCapacity(200, 400);


    return {
        "storageSystemId": '1100' + v,
        "model": "VSP G1000",
        "svpIpAddress": '20.20.90.1' + v,
        "gum1IpAddress": '20.20.90.2' + v,
        "gum2IpAddress": '20.20.90.3' + v,
        "firmwareVersion": 'v1.0',
        "horcmVersion": 'v1.0',
        "cacheCapacity": getCapacity(400, 600),
        "totalUsableCapacity": total,
        "allocatedToPool": physicalUsed,
        "unallocatedToPool": parseInt(total) - parseInt(physicalUsed),
        "usedCapacity": used,
        "availableCapacity": parseInt(total) - parseInt(physicalUsed),
        "subscribedCapacity": getCapacity(600, 1200),
        "unusedDisks": 10,
        "unusedDisksCapacity": getCapacity(200, 1000),
        "accessible": true
    };
});

var HM800storageSystems = _.map(_.range(1, 65), function (v) {

    var total = getCapacity(800, 1000);
    var physicalUsed = getCapacity(500, 700);
    var used = getCapacity(200, 400);


    return {
        "storageSystemId": '2200' + v,
        "model": "VSP G400",
        "svpIpAddress": '10.20.90.1' + v,
        "gum1IpAddress": '10.20.90.2' + v,
        "gum2IpAddress": '10.20.90.3' + v,
        "firmwareVersion": 'v1.0',
        "horcmVersion": 'v1.0',
        "cacheCapacity": getCapacity(400, 600),
        "totalUsableCapacity": total,
        "allocatedToPool": physicalUsed,
        "unallocatedToPool": parseInt(total) - parseInt(physicalUsed),
        "usedCapacity": used,
        "availableCapacity": parseInt(total) - parseInt(physicalUsed),
        "subscribedCapacity": getCapacity(600, 1200),
        "unusedDisks": 10,
        "unusedDisksCapacity": getCapacity(200, 1000),
        "accessible": true
    };
});

var storageSystems = R800storageSystems.concat(HM800storageSystems);

var storageEvs = _.map(_.range(1, 65), function (v) {

    return {
        "id": '1' + v,
        "uuid": 'abcdefg1234' + v,
        "label": 'evs1' + v,
        "type": '1' + v,
        "status": 'Online' + v,
        "preferredClusterNodeId": '234' + v,
        "interfaceAddresses": getInterfaceAddresses()

    };
});

function getInterfaceAddresses() {
    return {
        "ip": '172.17.79.147',
        "mask": '' ,
        "prefixLength": '2' ,
        "port": '8080' ,
        "locationName": 'SCHQ' ,
        "ipv6": 'false'

    };
}

var volumes = _.map(_.range(1, 10), function (v) {

    return {
        volumeId: v,
        storageSystemId: "REPLACE",
        poolId: '001',
        label: "Volume" + v,
        size: getCapacity(100, 200),
        usedCapacity: getCapacity(10, 25),
        availableCapacity: getCapacity(50, 75),
        status: _.sample(['Normal', 'Blocked', 'Busy', 'Unknown']),
        type: _.sample(['HDP', 'HDT', 'HTI']),
        dataProtectionSummary: getVolumeDataProtectionSummary()
    };
});

function getVolumeDataProtectionSummary() {
    return {
        replicationType: _.sample([['CLONE'], ['SNAPSHOT'], ['CLONE', 'SNAPSHOT'], []]),
        volumeType: _.sample([['P-VOL'], ['S-VOL'], ['UNPROTECTED'], ['P-VOL', 'S-VOL']]),
        replicationGroupIdMap: getReplicationGroupIdMap(),
        hasFailures: _.sample([true, false, false, false]),
        secondaryVolumeCount: 17,
        secondaryVolumeFailures: 13
    };
}

function getReplicationGroupIdMap() {
    var rand = _.random(1, 2);
    var map = {};
    for (var j = 0; j <= 9; j++) {
        map[[_.random(1000, 2000)]] = "RG name " + j.toString();
    }
    if (rand === 1) {
        return null;
    }
    return map;
}

var replicationGroups = _.map(_.range(1, 3), function (v) {

    return {
        id: v,
        storageSystemId: '220010',
        name: 'Replication Group' + v,
        comments: 'Test',
        type: _.sample(['SNAPSHOT', 'CLONE']),
        consistent: _.sample([true, false]),
        // TODO:CDUAN Real time data or your target?
        numberOfCopies: _.random(1, 2),
        schedule: {hour: 13, minute: 2, recurringUnit: 'WEEKLY', recurringUnitInterval: null, dayOfWeek: ['SUN', 'MON'], dayOfMonth: null},
        scheduleEnabled: _.sample([true, false]),
        primaryVolumeIds: getPrimaryVolumeIds(),
        failures: _.random(1, 10)
    };
});

function getPrimaryVolumeIds() {

    var primaryVolumeIdList = [];
    for (var i = 1; i <= _.random(1, 5); i++) {
        var rand = _.random(1, 3);
        primaryVolumeIdList.push(rand);
    }
    return _.uniq(primaryVolumeIdList);
}

var volumePairs = _.map(_.range(1, 150), function (v) {

    return {
        replicationGroup: _.sample(["Replication Group" + _.random(1, 30), null]),
        volumePairGroup: _.sample(['SnapshotGroup' + v, 'CloneGroup' + v]),
        mirrorId: _.random(1, 20),
        splitTime: 1450814584000, //nullable
        consistent: _.sample([true, false]),
        consistencyId: _.random(1, 100), //nullable
        type: _.sample(['SNAPSHOT', 'CLONE']),
        primaryVolume: getVolume('p-vol'),
        secondaryVolume: getVolume('s-vol'),
        state: _.sample(['HEALTHY', 'ERROR'])
    };
});

function getVolume(volume) {

    var rand = _.random(0, 1);
    var result = {
        id: _.random(1, 3)
    };
    if (volume === 'p-vol') {
        result.status = _.sample(['SMPL', 'COPY', 'RCPY', 'PAIR', 'PSUS', 'PSUE']);
    } else {
        if (rand === 0) {
            result.status = _.sample(['SMPL', 'COPY', 'RCPY', 'PAIR', 'PSUS', 'PSUE']);
        } else {
            result = null;
        }
    }
    return result;
}

var hosts = _.map(_.range(1, 80), function (v) {

    return {
        serverId: v,
        serverName: 'MOCKUP HOST',
        description: 'TEST',
        ipAddress: "10.1.91." + v,
        wwpns: getWWN(),
        osType: _.sample(['HP_UX', 'SOLARIS', 'AIX', 'TRU64', 'HI_UX', 'WIN', 'WIN_EX', 'LINUX', 'VMWARE', 'VMWARE_EX', 'NETWARE', 'OVMS']),
        dpStatus: _.sample(['Failed', 'Success']),
        dpType: getDpType()
    };
});

var providerHosts = _.map(_.range(1, 80), function (v) {
    return {
        serverId: v,
        serverName: 'MOCKUP HOST',
        description: 'TEST',
        ipAddress: "10.1.91." + v,
        wwpns: getWWN(),
        osType: _.sample(['HP_UX', 'SOLARIS', 'AIX', 'TRU64', 'HI_UX', 'WIN', 'WIN_EX', 'LINUX', 'VMWARE', 'VMWARE_EX', 'NETWARE', 'OVMS']),
        attachedVolumeCount: 5,
        dataProtectionSummary: {
            replicationType: "CLONE",
            protection: "PROTECTED",
            hasFailures: false
        }
    };
});

function getWWN() {

    var wwnList = [];
    var rand = _.random(1, 2);
    for (var i = 1; i <= rand; i++) {
        wwnList.push(_.sample(['15:00:00:f0:8c:08:95:de', '50:06:04:81:D6:F3:45:42', '21:00:00:e0:8b:05:05:04', '10:00:00:00:c9:22:fc:01']));
    }
    return wwnList;
}

function getDpType() {

    var dpTypeList = [];
    var rand = _.random(0, 1);
    if (rand === 1) {
        dpTypeList.push('CLONE');
    }
    rand = _.random(0, 1);
    if (rand === 1) {
        dpTypeList.push('SNAPSHOT');
    }
    return dpTypeList;
}

var poolTypes = ['HDP', 'HDT', 'HTI'];
var poolTiers = [
    {
        "tier": "Gold",
        "capacity": "10737418240"
    },
    {
        "tier": "Silver",
        "capacity": "21474836480"
    },
    {
        "tier": "Bronze",
        "capacity": "5368709120"
    }
];
var encryptionAndCompression = ['YES', 'NO', 'PARTIAL'];
var expansionAndCompressionRate = [1,2,3,4,5,6,7,8];

function getPortAttribute() {

    var attributesList = [];
    var possibleAttributeValues = ['TARGET_PORT', 'RCU_TARGET_PORT', 'MCU_INITIATOR_PORT', 'EXTERNAL_INITIATOR_PORT'];
    attributesList.push(_.sample(possibleAttributeValues));
    return attributesList;
}

var storagePorts = _.union(
    [{
        storagePortId: 'CL1-C',
        storageSystemId: '22001',
        wwn: '50060e8007c380000',
        attributes: ['TARGET_PORT'],
        speed: _.sample(['AUTO', '4G']),
        type: 'FIBRE',
        loopId: 'G9',
        topology: _.sample(['FABRIC_ON_POINT_TO_POINT','FABRIC_OFF_POINT_TO_POINT','FABRIC_ON_ARB_LOOP','FABRIC_OFF_ARB_LOOP']),
        securitySwitchEnabled: _.sample([true, false])
    }],
    _.map(_.range(1, 50), function (v) {

    var pad = "00";
    v += '';
    var wwn = '50060e8007c38' + pad.substring(0, pad.length - v.length) + v

    return {
        storagePortId: 'CL' + v + '-' + _.sample(['A', 'B']),
        storageSystemId: '22001',
        wwn: wwn,
        attributes: getPortAttribute(),
        speed: _.sample(['AUTO', '4G']),
        type: _.sample(['ENAS', 'ESCON', 'FCOE', 'FIBRE', 'FICON', 'ISCSI', 'SCSI']),
        loopId: _.sample(['A', 'B', 'C', 'D', 'E', 'F']) + _.random(1, 9),
        topology: _.sample(['FABRIC_ON_POINT_TO_POINT','FABRIC_OFF_POINT_TO_POINT','FABRIC_ON_ARB_LOOP','FABRIC_OFF_ARB_LOOP']),
        securitySwitchEnabled: _.sample([true, false])
    };
}));

var diskSpeeds = [0, 7500, 10000, 15000];
var diskTypes = ['SSD', 'FMD', 'FMC', 'SAS'];
var diskStatuses = ['SPARE', 'FREE'];
var statuses = ['AVAILABLE', 'FORMATTING', 'QUICK_FORMATTING', 'IN_USE', 'UNINITIALIZED', 'UNSUPPORTED_ATTACHED', 'UNSUPPORTED_INACCESSIBLE_RESOURCEGROUP', 'EXTERNALIZED'];
var level = _.sample(raidConfigs);
var encryption = [true, false];
var compression = [true, false];

var parityGroups = _.map(_.range(1, 121), function (v) {

    //PG should have diskType information. So need to remove unwanted external tier which does not has diskType
    var tiersWithoutExternal = _.filter(tiers.tiers, function(tier){ return tier.subTiers && tier.subTiers.length > 0; });
    var tier = _.sample(tiersWithoutExternal);
    var subTier = _.sample(tier.subTiers);
    var level = _.sample(raidConfigs);

    return {
        parityGroupId: '1 - ' + v,
        storageSystemId: "2200" + v,
        raidLevel: level.raidLevel,
        raidLayout: level.raidLayout,
        diskSpec: {
            type: subTier.diskType,
            capacityInBytes: subTier.capacity,
            speed: subTier.speed
        },
        status: _.sample(statuses),
        totalCapacityInBytes: getCapacity(100, 200),
        availableCapacityInBytes: getCapacity(50, 80),
        virtualizedCapacityInBytes: getCapacity(50, 100),
        encryption: _.sample(encryption),
        compression: _.sample(compression)
    };
});

var externalParityGroups = _.map(_.range(1, 4), function (v) {

     return {
	externalParityGroupId: '1-'+v,
	storageSystemId: "2200" + v,
	availableCapacity: '1729179942912',
	capacity: '1729179942912',
	externalStorageSystemId: '420007',
	externalStorageVendor: 'HITACHI',
	externalStorageProduct: 'VSP'
    };
});

var getRaidOptionsForPgTemplate = function (flag) {
    return {
        raidLayout: _.sample(level.layouts),
        raidLevel: level.raidLevel,
        numberOfDisksForRaidLayout: _.random(1, 5),
        numberOfParityGroups: _.random(40, 100),
        usableCapacity: getCapacity(1, 3),
        isDefault: flag,
        numberOfUnusedDisks: _.random(10, 30)
    }
}

var parityGroupsTemplateItems = _.map(_.range(1, 7), function (v) {
    return {
        diskType: _.sample(diskTypes),
        speed: _.sample(diskSpeeds),
        size: 302195408896,
        totalNumberOfDisks: _.random(40, 100),
        numberOfAvailableDisks: _.random(40, 80),
        numberOfNewHotSpares: _.random(1, 10),
        numberOfExistingHotSpares: _.random(1, 7),
        raidOptions: [
            getRaidOptionsForPgTemplate(true),
            getRaidOptionsForPgTemplate(false)
        ]
    }
});

var disks = _.map(_.range(1, 101), function (v) {
    var type = _.sample(diskTypes);
    var speed = (type === "SSD" || type === "FMC" || type === "FMD") ? 0 : _.sample([7500, 10000, 15000]);
    return {
        diskId: _.random(1, 10000).toString(),
        storageSystemId: "22001",
        serialNumber: _.random(1, 10000).toString(),
        location: "location",
        model: "model",
        capacityInBytes: _.random(1, 302195408896),
        version: _.random(1, 100).toString(),
        speed: speed,
        type: type,
        purpose: _.sample(diskStatuses),
        parityGroupId: _.random(1, 10000).toString()
    }
});

var storagePools = _.map(_.range(1, 100), function (v) {

    var capacityInBytes = getCapacity(200, 300),
        usedCapacityInBytes = getCapacity(100, 200),
        availableCapacityInBytes = capacityInBytes - usedCapacityInBytes,
        physicalCapacityInBytes = getCapacity(200, 300),
        usedPhysicalCapacityInBytes = getCapacity(100, 200),
        availablePhysicalCapacityInBytes = getCapacity(50, 100),
        tier = _.sample(poolTiers, 1),
        type = _.sample(poolTypes),
        encryption = _.sample(encryptionAndCompression),
        compression = _.sample(encryptionAndCompression),
        expansionRate = _.sample(expansionAndCompressionRate),
        compressionRate = _.sample(expansionAndCompressionRate);

    if (type === 'HDT') {
        tier = _.sample(poolTiers, 2);
    }

    return {
        "storagePoolId": v,
        "storageSystemId": "22001",
        "label": "Pool" + v,
        "capacityInBytes": capacityInBytes,
        "usedCapacityInBytes": usedCapacityInBytes,
        "availableCapacityInBytes": availableCapacityInBytes,
        "usedSubscribedCapacityInBytes": "4999610368",
        "physicalCapacityInBytes": physicalCapacityInBytes,
        "usedPhysicalCapacityInBytes": usedPhysicalCapacityInBytes,
        "availablePhysicalCapacityInBytes": availablePhysicalCapacityInBytes,
        "type": type,
        "utilizationThreshold1": 20.0,
        "utilizationThreshold2": 90,
        "subscriptionLimit": {"unlimited": false, "value": 101},
        "usedSubscription": {"unlimited": false, "value": _.random(50, 200)},
        "availableSubscription": {"unlimited": false, "value": 101},
        "status": "Normal",
        "parityGroups": [{ id: "1-2", encryption: true, compression: false}],
        "externalParityGroupIds": _.sample([['1-50', '1-51', '1-52'],['1-50', '1-51'], []]),
        "tiers": tier,
        "expansionRate": expansionRate,
        "compressionRate": compressionRate,
        "encrypted": encryption,
        "compressed": compression,
        "savingsPercentage": 10
    };

});

app.get('/v1/product-version', jsonParser, function (req, res) {
    if (!loginUser) return res.sendStatus(401)
    res.json({
            "productVersionInfo": "1.1.0.67"
        }
    );
})

app.get('/v1/storage-systems/:storageSystemId/disks', jsonParser, function (req, res) {
    if (!loginUser) return res.sendStatus(401)
    return res.json({
        disks: disks
    })
    return res.sendStatus(404)
});



app.get('/v1/storage-systems/:storageSystemId/replication-groups', jsonParser, function (req, res) {

    if (!loginUser) return res.sendStatus(401)

    var ss = _.find(storageSystems, function (s) {
        return s.storageSystemId == req.params.storageSystemId;
    })

    if (ss) {

        var rgs = _.map(replicationGroups, function (rg) {
            var clone = _.cloneDeep(rg);
            clone.storageSystemId = ss.storageSystemId;
            if (clone.type === 'CLONE') {
                clone.numberOfCopies = 1;
                clone.schedule = null;
                clone.scheduleEnabled = false;
            }
            return clone;
        })
        return res.json({
            resources: rgs,
            nextToken: null,
            total: rgs.total
        });
    }
    return res.sendStatus(404)
});

app.get('/v1/storage-systems/:storageSystemId/replication-groups/summary', jsonParser, function (req, res) {
    if (!loginUser) return res.sendStatus(401);
    res.json({
            "replicationGroupCountByType": [
                {
                    "replicationType": "CLONE", "count": 2
                }, {
                    "replicationType": "SNAPSHOT", "count": 2
                }
            ]
        }
    );
});

app.get('/v1/storage-systems/:storageSystemId/volume-pairs', jsonParser, function (req, res) {

    if (!loginUser) return res.sendStatus(401)

    var ss = _.find(storageSystems, function (s) {
        return s.storageSystemId == req.params.storageSystemId;
    })

    if (ss) {

        var vps = _.map(volumePairs, function (vp) {
            var clone = _.cloneDeep(vp);
            clone.primaryVolume.storageSystemId = ss.storageSystemId;
            if (clone.secondaryVolume !== null) {
                clone.secondaryVolume.storageSystemId = ss.storageSystemId;
            }
            return clone;
        })
        return res.json({
            volumePairs: vps
        });
    }
    return res.sendStatus(404)
})

app.get('/v1/storage-systems/:storageSystemId/replication-groups/:replicationGroupId/affected-volume-pairs', jsonParser, function (req, res) {

    if (!loginUser) return res.sendStatus(401)

    var ss = _.find(storageSystems, function (s) {
        return s.storageSystemId == req.params.storageSystemId;
    })

    if (ss) {

        var vps = _.map(volumePairs, function (vp) {
            var clone = _.cloneDeep(vp);
            clone.primaryVolume.storageSystemId = ss.storageSystemId;
            if (clone.secondaryVolume !== null) {
                clone.secondaryVolume.storageSystemId = ss.storageSystemId;
            }
            return clone;
        })
        return res.json({
            volumePairs: vps
        });
    }
    return res.sendStatus(404)
})

app.get('/v1/data-protection/failed-servers', jsonParser, function (req, res) {
    if (!loginUser) return res.sendStatus(401)
    res.json({servers: providerHosts});
})

app.post('/v1/storage-systems/:storageSystemId/data-protection/local/clones/:replicationId/restore/secondary-volumes/:secondaryVolId', jsonParser, function (req, res) {
    res.json(getjob('Restoring Volume'));
});
app.post('/v1/storage-systems/:storageSystemId/data-protection/local/clones/:replicationId/restore/secondary-volumes/:secondaryVolId', jsonParser, function (req, res) {
    res.json(getjob('Restoring Volume'));
});


app.get('/v1/storage-systems/:storageSystemId/volumes/:primaryVolId/protection-details', jsonParser, function (req, res) {
    if (!loginUser) return res.sendStatus(401)

    var now = new Date();

    res.json({
            "restoreReplicationDetails": [
                {
                    "replicationId": 1,
                    "replicationName": "RG1",
                    "primaryVolId": 1,
                    "secondaryVolId": 7,
                    "replicationType": "CLONE",
                    "snapDateTime": new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), now.getMinutes() - _.random(100, 500)).getTime()
                },
                {
                    "replicationId": 2,
                    "replicationName": "RG2",
                    "primaryVolId": 1,
                    "secondaryVolId": 8,
                    "replicationType": "CLONE",
                    "snapDateTime": new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), now.getMinutes() - _.random(100, 500)).getTime()
                },
                {
                    "replicationId": 3,
                    "replicationName": "RG3",
                    "primaryVolId": 1,
                    "secondaryVolId": 2,
                    "replicationType": "SNAPSHOT",
                    "snapDateTime": new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), now.getMinutes() - _.random(100, 500)).getTime()
                },
                {
                    "replicationId": 4,
                    "replicationName": "RG4",
                    "primaryVolId": 1,
                    "secondaryVolId": 2,
                    "replicationType": "CLONE",
                    "snapDateTime": new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), now.getMinutes() - _.random(100, 500)).getTime()
                },
                {
                    "replicationId": 5,
                    "replicationName": "RG5",
                    "primaryVolId": 1,
                    "secondaryVolId": 2,
                    "replicationType": "SNAPSHOT",
                    "snapDateTime": new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), now.getMinutes() - _.random(100, 500)).getTime()
                }
            ]
        }
    );
})

app.get('/v1/compute/servers', jsonParser, function (req, res) {
    if (!loginUser) return res.sendStatus(401)

    res.json({
        resources: hosts,
        nextToken: null,
        total: hosts.total
    })
});

app.get('/v1/compute/servers/:serverId', jsonParser, function (req, res) {
    if (!loginUser) return res.sendStatus(401)

    var host = _.find(hosts, function (h) {
        return h.serverId == req.params.serverId;
    })

    if (host) {
        return res.json(host)
    }
    return res.sendStatus(404)
});

app.post('/v1/compute/servers/:serverId', jsonParser, function (req, res) {
    res.json(getjob('Update server'));
});

app.post('/v1/compute/servers/:serverId/add-wwpn', jsonParser, function (req, res) {
    res.json(getjob('Add WWPN to server'));
});

app.post('/v1/compute/servers/:serverId/remove-wwpn', jsonParser, function (req, res) {
    res.json(getjob('Remove WWPN from server'));
});

app.get('/v1/compute/servers/:serverId/storage-systems/:storageSystemId/volumes', jsonParser, function (req, res) {
    var host = _.find(hosts, function (h) {
        return h.serverId == req.params.serverId;
    });

    if (host) {
        var storageSystemId = req.params.storageSystemId;
        var attachedVolumes = [];
        _.forEach(_.take(volumes, _.random(1, 5)), function (volume) {
            var attachedVolumeResource = _.cloneDeep(volume);
            attachedVolumeResource.storageSystemId = storageSystemId;
            attachedVolumeResource.serverId = host.serverId;
            attachedVolumeResource.paths = [];

            for (var n = 0; n < _.random(1,4); n++) {

                attachedVolumeResource.paths.push({
                    storagePortId: "CL" + n + "-A",
                    storageSystemId: storageSystemId,
                    lun: 12 + n,
                    name: "testName" + n,
                    hostMode: "Windows",
                    wwns: ["12:34:56:78:90:12:34:56"],
                    hostModeOptions: [12, 13, 14]
                });
            }

            attachedVolumes.push(attachedVolumeResource);
        });

        return res.json({"attachedVolumes": attachedVolumes});
    }
    return res.sendStatus(404)
});

app.get('/v1/data-protection/server/:hostId/alert', jsonParser, function (req, res) {
    if (!loginUser) return res.sendStatus(401)
    res.json({
            "volumeAlerts": 12
        }
    );
});

app.get('/v1/server/:hostId/volumes', jsonParser, function (req, res) {
    if (!loginUser) return res.sendStatus(401)

    var host = _.find(hosts, function (h) {
        return h.serverId == req.params.hostId;
    })

    if (host) {
        return res.json({
            "hostId": host.serverId,
            "dpVolResouce": _.take(volumes, _.random(0, 5))
        })
    }
    return res.sendStatus(404)
});

app.get('/v1/compute/servers/summary', jsonParser, function (req, res) {
    if (!loginUser) return res.sendStatus(401);

    res.json({
        osTypeCount: getOsTypeCount(),
        totalHost: 200
    })
});

function getOsTypeCount() {
    var map = {};
    map['HP_UX'] = _.random(1, 20);
    map['SOLARIS'] = _.random(1, 20);
    map['AIX'] = _.random(1, 20);
    map['TRU64'] = _.random(1, 20);
    map['HI_UX'] = _.random(1, 20);
    map['WIN'] = _.random(1, 20);
    map['WIN_EX'] = _.random(1, 20);
    map['LINUX'] = _.random(1, 20);
    map['VMWARE'] = _.random(1, 20);
    map['VMWARE_EX'] = _.random(1, 20);
    map['NETWARE'] = _.random(1, 20);
    return map;
}

app.delete('/v1/compute/servers/:serverId', jsonParser, function (req, res) {
    res.json(getjob('Deleting host'));
});

app.post('/v1/security/tokens', jsonParser, function (req, res) {
    loginUser = {
        'token': {
            user: {
                name: 'sysadmin'
            }
        }
    };
    res.set('X-Auth-Token', '449d72b0-0f12-43c8-9dba-c528cc0585b9')
    res.json()
})

app.get('/v1/security/tokens', jsonParser, function (req, res) {
    if (!loginUser) return res.sendStatus(401)
    res.json(loginUser)
})

app.delete('/v1/security/tokens', jsonParser, function (req, res) {
    if (!loginUser) return res.sendStatus(401)
    loginUser = null;
    res.json(loginUser)
})

app.get('/v1/logs', jsonParser, function (req, res) {
    if (!loginUser) return res.sendStatus(401)
    res.sendFile('logs.zip', {root: __dirname});
});

app.get('/v1/data-protection/failed-volumes', jsonParser, function (req, res) {
    if (!loginUser) return res.sendStatus(401)
    var vols  = [];

    _.forEach(volumes, function (v) {
        var copy = _.cloneDeep(v);
        copy.storageSystemId = _.sample(storageSystems).storageSystemId;
        vols.push(copy);
    });

    res.json({
        volumes: vols
    });
});

app.get('/v1/data-protection/storage-systems/:storageSystemId/failed-volumes', jsonParser, function (req, res) {
    if (!loginUser) return res.sendStatus(401);
    var vols  = [];

    _.forEach(volumes, function (v) {
        var copy = _.cloneDeep(v);
        copy.storageSystemId = req.params.storageSystemId;
        vols.push(copy);
    });

    res.json({
        volumes: vols
    });
});

app.get('/v1/data-protection/storage-systems/:storageSystemId/servers/failed-servers', jsonParser, function (req, res) {
    if (!loginUser) return res.sendStatus(401)
    res.json({servers: providerHosts});
});

app.get('/v1/data-protection/storage-systems/:storageSystemId/summary', jsonParser, function (req, res) {
    if (!loginUser) return res.sendStatus(401)

    var ss = _.find(storageSystems, function (s) {
        return s.storageSystemId == req.params.storageSystemId;
    });

    var thinUsed = parseInt(ss.usedCapacity);


    res.json({
            "protectedCapacity": parseInt((thinUsed * 0.2)).toString(),
        "protectedVolumes": 8,
            "unprotectedCapacity": parseInt((thinUsed * 0.5)).toString(),
        "unprotectedVolumes": 11,
            "secondaryCapacity": parseInt((thinUsed * 0.3)).toString(),
        "secondaryVolumes": 12
        }
    );
})

app.get('/v1/data-protection/summary', jsonParser, function (req, res) {
    if (!loginUser) return res.sendStatus(401);

    var thinUsed = parseInt(getCapacity(400 * storageSystems.length, 400 * storageSystems.length));

    res.json({
        "protectedCapacity": parseInt((thinUsed * 0.2)).toString(),
        "protectedVolumes": 16,
        "unprotectedCapacity": parseInt((thinUsed * 0.5)).toString(),
        "unprotectedVolumes": 22,
        "secondaryCapacity": parseInt((thinUsed * 0.3)).toString(),
        "secondaryVolumes": 24
        }
    );

})


app.get('/v1/storage-systems/summary', jsonParser, function (req, res) {
    if (!loginUser) return res.sendStatus(401)
    res.json(
        {
            "totalUsableCapacity": getCapacity(800 * storageSystems.length, 800 * storageSystems.length),
            "allocatedToPool": getCapacity(700 * storageSystems.length, 700 * storageSystems.length),
            "unallocatedToPool": getCapacity(400 * storageSystems.length, 400 * storageSystems.length),
            "usedCapacity": getCapacity(400 * storageSystems.length, 400 * storageSystems.length),
            "availableCapacity": getCapacity(100 * storageSystems.length, 100 * storageSystems.length),
            "subscribedCapacity": getCapacity(600 * storageSystems.length, 600 * storageSystems.length),
            "storageSystemCount": storageSystems.length
        }
    );
})

app.get('/v1/storage-systems', jsonParser, function (req, res) {
    if (!loginUser) return res.sendStatus(401)

    res.json({
        resources: storageSystems,
        nextToken: null,
        total: storageSystems.length
    })
});
app.get('/v1/storage-systems/:storageSystemId/templates/pool/:storagePoolId', jsonParser, function (req, res) {
    if (!loginUser) return res.sendStatus(401)

    var ss = _.find(storageSystems, function (s) {
        return s.storageSystemId == req.params.storageSystemId;
    });

    if (ss) {
        return res.json({
            "tiers": [
                getTier('Platinum'),
                getTier('Gold'),
                getTier('Silver'),
                getTier('Bronze')
            ],
            "utilizationThreshold1": 60,
            "utilizationThreshold2": 90,
            "subscriptionLimit": 100
        });


    }
    return res.sendStatus(404)
});

app.get('/v1/storage-systems/:storageSystemId/templates/pool', jsonParser, function (req, res) {
    if (!loginUser) return res.sendStatus(401)

    var ss = _.find(storageSystems, function (s) {
        return s.storageSystemId == req.params.storageSystemId;
    })

    if (ss) {
        return res.json({
            "tiers": [
                getTier('Platinum'),
                getTier('Gold'),
                getTier('Silver'),
                getTier('Bronze')
            ],
            "utilizationThreshold1": 60,
            "utilizationThreshold2": 90,
            "subscriptionLimit": 100
        });


    }
    return res.sendStatus(404)
});

app.get('/v1/storage-systems/:storageSystemId', jsonParser, function (req, res) {
    if (!loginUser) return res.sendStatus(401)

    var ss = _.find(storageSystems, function (s) {
        return s.storageSystemId == req.params.storageSystemId;
    })

    if (ss) {
        return res.json(ss)
    }
    return res.sendStatus(404)
});

app.get('/v1/storage-systems/:storageSystemId/volumes', jsonParser, function (req, res) {
    if (!loginUser) return res.sendStatus(401)

    var ss = _.find(storageSystems, function (s) {
        return s.storageSystemId == req.params.storageSystemId;
    });

    if (ss) {

        var vols = _.map(volumes, function (v) {
            var clone = _.cloneDeep(v);
            clone.storageSystemId = ss.storageSystemId;
            return clone;
        });
        return res.json({
            resources: vols,
            nextToken: null,
            total: vols.length
        });
    }
    return res.sendStatus(404)
});

app.get('/v1/storage-systems/:storageSystemId/volumes/summary', jsonParser, function (req, res) {
    if (!loginUser) return res.sendStatus(401);
    res.json({
            "volumeCountByType":
            {
                "HTI":3,"HDP":11,"HDT":11
            },
            "numberOfVolumes":25
        }
    );
});

app.get('/v1/storage-systems/:storageSystemId/volumes/:volumeId', jsonParser, function (req, res) {
    if (!loginUser) return res.sendStatus(401)

    var volume = _.find(volumes, function (v) {
        return v.volumeId == req.params.volumeId;
    })

    if (volume) {
        volume = _.cloneDeep(volume);
        volume.storageSystemId = req.params.storageSystemId;
        return res.json(volume)
    }
    return res.sendStatus(404)
});

app.delete('/v1/storage-systems/:storageSystemId/volumes/:volumeId', jsonParser, function (req, res) {
    res.json(getjob('Deleting volume'));
});

app.post('/v1/volume-manager/create', jsonParser, function (req, res) {

    res.json(getjob('Creating volumes'));
});

app.post('/v1/volume-manager/attach', jsonParser, function (req, res) {

    res.json(getjob('Attaching volumes'));
});

app.post('/v1/volume-manager/create-attach', jsonParser, function (req, res) {

    res.json(getjob('Create volumes and attach to servers'));
});

app.get('/v1/storage-systems/:storageSystemId/storage-pools', jsonParser, function (req, res) {
    if (!loginUser) return res.sendStatus(401)

    res.json({
        resources: storagePools,
        nextToken: null,
        total: storagePools.length
    })
});

app.get('/v1/storage-systems/:storageSystemId/storage-pools/summary', jsonParser, function (req, res) {
    if (!loginUser) return res.sendStatus(401)

    var summariesByType = []

    var summariesByTypeMap = {};
    _.forEach(storagePools, function (pool) {
        var summary = summariesByTypeMap[pool.type];
        if (!summary) {
            summary = {
                poolType: pool.type,
                totalCapacity: pool.capacityInBytes,
                usedCapacity: pool.usedCapacityInBytes,
                availableCapacity: pool.availableCapacityInBytes,
                usedSubscribedCapacity: pool.usedSubscribedCapacityInBytes,
                poolCount: 1
            }
            summariesByTypeMap[pool.type] = summary;
        }
        else {
            summary.totalCapacity = (parseInt(summary.totalCapacity) + parseInt(pool.capacityInBytes)) + '';
            summary.usedCapacity = (parseInt(summary.usedCapacity) + parseInt(pool.usedCapacityInBytes)) + '';
            summary.availableCapacity = parseInt(summary.availableCapacity) + parseInt(pool.availableCapacityInBytes);
            summary.usedSubscribedCapacity = parseInt(summary.usedSubscribedCapacity) + parseInt(pool.usedSubscribedCapacityInBytes);
            summary.poolCount++;
        }
    });

    for (var type in summariesByTypeMap) {
        var item = summariesByTypeMap[type];

        item.subscriptionCapacity = {
            unlimited: false,
            value: parseInt(item.totalCapacity) * _.sample([1, 2, 3])
        }
        summariesByType.push(item);
    }

    res.json({
        "summariesByType": [
            {
                "poolType": "HDP",
                "totalCapacity": "17122826649600",
                "usedCapacity": "0",
                "availableCapacity": "17122826649600",
                "usedSubscribedCapacity": "1127185645568",
                "poolCount": 2
            },
            {
                "poolType": "HTI",
                "totalCapacity": "0",
                "usedCapacity": "0",
                "availableCapacity": "0",
                "usedSubscribedCapacity": "0",
                "poolCount": 0
            },
            {
                "poolType": "HDT",
                "totalCapacity": "34984163278848",
                "usedCapacity": "0",
                "availableCapacity": "34984163278848",
                "usedSubscribedCapacity": "0",
                "poolCount": 1
            }
        ]
    });
});

app.post('/v1/storage-systems/:storageSystemId/storage-pools', jsonParser, function (req, res) {
    if (!loginUser) return res.sendStatus(401)

    res.json(getjob('Creating Storage Pool'))
});

app.post('/v1/storage-systems/:storageSystemId/templates/pool', jsonParser, function (req, res) {

    if (!loginUser) return res.sendStatus(401)

    res.json(getjob('Creating Pool'));


});

app.post('/v1/storage-systems', jsonParser, function (req, res) {

    if (!loginUser) return res.sendStatus(401)

    if (req.body.svpIpAddress === '123') {
        res.status(400).json({
            "message": "Parameter svpIpAddress carries null or empty value. Please specify appropriate value.",
            "severity": "Error",
            "reportTypeName": "PayloadValidationReport",
            "messageCode": "EmptyOrNullEntryMessage",
            "messageParameters": {
                "parameterName": "svpIpAddress"
            }
        });
    }
    else {
        res.json(getjob('Adding storage System'));
    }


});

app.get('/v1/storage-systems/:storageSystemId/storage-pools/:storagePoolId', jsonParser, function (req, res) {
    if (!loginUser) return res.sendStatus(401)

    var sp = _.find(storagePools, function (s) {
        return s.storagePoolId == req.params.storagePoolId;
    })

    if (sp) {
        return res.json(sp)
    }
    return res.sendStatus(404)
});

app.post('/v1/storage-systems/:storageSystemId/storage-pools/:storagePoolId', jsonParser, function (req, res) {
    if (!loginUser) return res.sendStatus(401)

    var sp = _.find(storagePools, function (s) {
        return s.storagePoolId == req.params.storagePoolId;
    })

    if (sp) {
        return res.json(getjob('Update storage pool'))
    }
    return res.sendStatus(404)
});

app.delete('/v1/storage-systems/:storageSystemId/storage-pools/:storagePoolId', jsonParser, function (req, res) {
    res.json(getjob('Deleting storage pool'));
});

app.get('/v1/storage-systems/:storageSystemId/storage-ports', jsonParser, function (req, res) {
    if (!loginUser) return res.sendStatus(401);

    return res.json({
        resources: storagePorts,
        nextToken: null,
        total: storagePorts.length
    });
});

app.get('/v1/storage-systems/:storageSystemId/storage-ports/:storagePortId', jsonParser, function (req, res) {
    if (!loginUser) return res.sendStatus(401);

    var sp = _.find(storagePorts, function (s) {
        return s.storagePortId == req.params.storagePortId;
    })

    if (sp) {
        return res.json(sp);
    }
    return res.sendStatus(404);
});

app.get('/v1/storage-systems/:storageSystemId/parity-groups', jsonParser, function (req, res) {
    if (!loginUser) return res.sendStatus(401)

    res.json({
        resources: parityGroups,
        nextToken: null,
        total: parityGroups.total
    })
});

app.get('/v1/storage-systems/:storageSystemId/external-parity-groups/summary', jsonParser, function (req, res) {
    if (!loginUser) return res.sendStatus(401)

    res.json({
        "totalCapacity":"0",
        "totalFreeCapacity":"0",
        "numberOfExternalParityGroups":0
    })
});

app.get('/v1/storage-systems/:storageSystemId/volumes/summary', jsonParser, function (req, res) {
    if (!loginUser) return res.sendStatus(401);
    res.json({
            "volumeCountByType":
            {
                "HTI":3,"HDP":11,"HDT":11
            },
            "numberOfVolumes":25
        }
    );
});

app.delete('/v1/storage-systems/:storageSystemId/parity-groups/:parityGroupId', jsonParser, function (req, res) {
    res.json(getjob('Deleting parity group'));
});

app.get('/v1/storage-systems/:storageSystemId/parity-groups/:parityGroupId', jsonParser, function (req, res) {
    if (!loginUser) return res.sendStatus(401)

    var pg = _.find(parityGroups, function (p) {
        return p.parityGroupId == req.params.parityGroupId;
    })

    if (pg) {
        return res.json(pg)
    }
    return res.sendStatus(404)
});

app.get('/v1/storage-systems/:storageSystemId/templates/parity-group', jsonParser, function (req, res) {
    if (!loginUser) return res.sendStatus(401)
    return res.json({
        parityGroupTemplateItems: parityGroupsTemplateItems
    })
    return res.sendStatus(404)
});

app.post('/v1/storage-systems/:storageSystemId/templates/parity-group', jsonParser, function (req, res) {

    res.json(getjob('Creating parity groups'));
});

app.get('/v1/jobs', jsonParser, function (req, res) {
    if (!loginUser) return res.sendStatus(401)

    var jobs = _.range(1, 300).map(function (i) {
        var now = new Date();
        var minutes = now.getMinutes() - _.random(100, 500);
        var start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), minutes);
        var end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), minutes + _.random(2, 10));

        var status = _.sample(['SUCCESS', 'SUCCESS_WITH_ERRORS', 'IN_PROGRESS', 'FAILED'])
        if (status == 'IN_PROGRESS') {
            end = null;
        }
        else {
            end = end.getTime();
        }


        return {
            "id": "1421b356-c5e4-4e8f-b66e-37454363df1" + i,
            "title": _.sample(["Create storage system", "Provision Storage", "Provision Storage Volume", "Expand Storage Pool", "Delete Storage Pool"]),
            "user": "sysadmin",
            "tenant": "",
            "subTenant": "st",
            "status": status,
            "startDate": start.getTime(),
            "endDate": end,
            "parentJobId": null,
            "reports": []
        }
    })

    res.json({
        "jobs": _.union(jobs, [
            {
                "id": "1c866b22-68b2-4cdf-beee-b48e36919c3f",
                "title": "Create volume,",
                "user": "sysadmin",
                "tenant": "0",
                "subTenant": "0",
                "status": "FAILED",
                "startDate": 1420678229000,
                "endDate": 1420678326000,
                "parentJobId": "ec69cf6f-baf2-4835-a8b9-8612826ab100",
                "reports": [
                    {
                        "message": "Creating volume.",
                        "severity": "Information",
                        "reportTypeName": "com.hds.bel.storage.core.contract.report.UserReport",
                        "messageCode": "CreateVolumePreStepMessage",
                        "messageParameters": {},
                        "creationDate": 1420678229000
                    },
                    {
                        "message": "An unexpected internal error occurred. Contact System Administrator if required.Control command I/O error",
                        "severity": "Error",
                        "reportTypeName": "com.hds.bel.storage.core.contract.report.UserReport",
                        "messageCode": "UnexpectedInternalErrorOccurredMessage",
                        "messageParameters": {
                            "exceptionMessage": "Control command I/O error"
                        },
                        "creationDate": 1420678326000
                    },
                    {
                        "message": "An unexpected internal error occurred. Contact System Administrator if required.Control command I/O error",
                        "severity": "Error",
                        "reportTypeName": "com.hds.bel.storage.core.contract.report.UserReport",
                        "messageCode": "UnexpectedInternalErrorOccurredMessage",
                        "messageParameters": {
                            "exceptionMessage": "Control command I/O error"
                        },
                        "creationDate": 1420678326000
                    }
                ]
            },
            {
                "id": "2d422dfb-af03-4966-92b7-022872b6256b",
                "title": "Create volume,",
                "user": "sysadmin",
                "tenant": "0",
                "subTenant": "0",
                "status": "FAILED",
                "startDate": 1420678229000,
                "endDate": 1420678423000,
                "parentJobId": "ec69cf6f-baf2-4835-a8b9-8612826ab100",
                "reports": [
                    {
                        "message": "Creating volume.",
                        "severity": "Information",
                        "reportTypeName": "com.hds.bel.storage.core.contract.report.UserReport",
                        "messageCode": "CreateVolumePreStepMessage",
                        "messageParameters": {},
                        "creationDate": 1420678229000
                    },
                    {
                        "message": "An unexpected internal error occurred. Contact System Administrator if required.Control command I/O error",
                        "severity": "Error",
                        "reportTypeName": "com.hds.bel.storage.core.contract.report.UserReport",
                        "messageCode": "UnexpectedInternalErrorOccurredMessage",
                        "messageParameters": {
                            "exceptionMessage": "Control command I/O error"
                        },
                        "creationDate": 1420678423000
                    },
                    {
                        "message": "An unexpected internal error occurred. Contact System Administrator if required.Control command I/O error",
                        "severity": "Error",
                        "reportTypeName": "com.hds.bel.storage.core.contract.report.UserReport",
                        "messageCode": "UnexpectedInternalErrorOccurredMessage",
                        "messageParameters": {
                            "exceptionMessage": "Control command I/O error"
                        },
                        "creationDate": 1420678423000
                    }
                ]
            },
            {
                "id": "ec69cf6f-baf2-4835-a8b9-8612826ab100",
                "title": "Create volumes from template",
                "user": "sysadmin",
                "tenant": "0",
                "subTenant": "0",
                "status": "FAILED",
                "startDate": 1420678228000,
                "endDate": 1420678423000,
                "parentJobId": null,
                "reports": [
                    {
                        "message": "Child job 2d422dfb-af03-4966-92b7-022872b6256b failed.",
                        "severity": "Error",
                        "reportTypeName": "com.hds.bel.storage.core.contract.report.UserReport",
                        "messageCode": "ChildJobFailedErrorMessage",
                        "messageParameters": {
                            "jobId": "2d422dfb-af03-4966-92b7-022872b6256b"
                        },
                        "creationDate": 1420678423000
                    }
                ]
            },
            {
                "id": "068a572c-d7b0-4e67-bfdb-4c43d88ca67f",
                "title": "Create volume,",
                "user": "sysadmin",
                "tenant": "0",
                "subTenant": "0",
                "status": "SUCCESS",
                "startDate": 1420677521000,
                "endDate": 1420677639000,
                "parentJobId": "7378ac43-d3ab-499b-86ec-d35b72c8ca70",
                "reports": [
                    {
                        "message": "Creating volume.",
                        "severity": "Information",
                        "reportTypeName": "com.hds.bel.storage.core.contract.report.UserReport",
                        "messageCode": "CreateVolumePreStepMessage",
                        "messageParameters": {},
                        "creationDate": 1420677522000
                    },
                    {
                        "message": "Successfully created volume 12.",
                        "severity": "Information",
                        "reportTypeName": "com.hds.bel.storage.core.contract.report.UserReport",
                        "messageCode": "CreateVolumePostStepMessage",
                        "messageParameters": {
                            "volumeId": "12"
                        },
                        "creationDate": 1420677639000
                    }
                ]
            },
            {
                "id": "33958241-cef7-41a1-99b2-28a761bab064",
                "title": "Create volume,",
                "user": "sysadmin",
                "tenant": "0",
                "subTenant": "0",
                "status": "SUCCESS",
                "startDate": 1420677521000,
                "endDate": 1420677561000,
                "parentJobId": "7378ac43-d3ab-499b-86ec-d35b72c8ca70",
                "reports": [
                    {
                        "message": "Creating volume.",
                        "severity": "Information",
                        "reportTypeName": "com.hds.bel.storage.core.contract.report.UserReport",
                        "messageCode": "CreateVolumePreStepMessage",
                        "messageParameters": {},
                        "creationDate": 1420677522000
                    },
                    {
                        "message": "Successfully created volume 2.",
                        "severity": "Information",
                        "reportTypeName": "com.hds.bel.storage.core.contract.report.UserReport",
                        "messageCode": "CreateVolumePostStepMessage",
                        "messageParameters": {
                            "volumeId": "2"
                        },
                        "creationDate": 1420677561000
                    }
                ]
            },
            {
                "id": "7378ac43-d3ab-499b-86ec-d35b72c8ca70",
                "title": "Create volumes from template",
                "user": "sysadmin",
                "tenant": "0",
                "subTenant": "0",
                "status": "SUCCESS",
                "startDate": 1420677521000,
                "endDate": 1420677639000,
                "parentJobId": null,
                "reports": []
            },
            {
                "id": "788dea20-5aea-48e4-8486-9c2fe7dc8143",
                "title": "Create volume,",
                "user": "sysadmin",
                "tenant": "0",
                "subTenant": "0",
                "status": "SUCCESS",
                "startDate": 1420677521000,
                "endDate": 1420677600000,
                "parentJobId": "7378ac43-d3ab-499b-86ec-d35b72c8ca70",
                "reports": [
                    {
                        "message": "Creating volume.",
                        "severity": "Information",
                        "reportTypeName": "com.hds.bel.storage.core.contract.report.UserReport",
                        "messageCode": "CreateVolumePreStepMessage",
                        "messageParameters": {},
                        "creationDate": 1420677522000
                    },
                    {
                        "message": "Successfully created volume 4.",
                        "severity": "Information",
                        "reportTypeName": "com.hds.bel.storage.core.contract.report.UserReport",
                        "messageCode": "CreateVolumePostStepMessage",
                        "messageParameters": {
                            "volumeId": "4"
                        },
                        "creationDate": 1420677600000
                    }
                ]
            },
            {
                "id": "2fdcf2a9-d2e3-4e5a-94e8-42f1c90b56b4",
                "title": "Delete volume",
                "user": "sysadmin",
                "tenant": "0",
                "subTenant": "0",
                "status": "SUCCESS",
                "startDate": 1420676294000,
                "endDate": 1420676314000,
                "parentJobId": null,
                "reports": [
                    {
                        "message": "Deleting volume 15.",
                        "severity": "Information",
                        "reportTypeName": "com.hds.bel.storage.core.contract.report.UserReport",
                        "messageCode": "DeleteVolumePreStepMessage",
                        "messageParameters": {
                            "volumeId": "15"
                        },
                        "creationDate": 1420676294000
                    },
                    {
                        "message": "Successfully deleted volume 15.",
                        "severity": "Information",
                        "reportTypeName": "com.hds.bel.storage.core.contract.report.UserReport",
                        "messageCode": "DeleteVolumePostStepMessage",
                        "messageParameters": {
                            "volumeId": "15"
                        },
                        "creationDate": 1420676314000
                    }
                ]
            },
            {
                "id": "4280811e-a064-4f7a-80b4-d1bd8f814086",
                "title": "Delete volume",
                "user": "sysadmin",
                "tenant": "0",
                "subTenant": "0",
                "status": "SUCCESS",
                "startDate": 1420676294000,
                "endDate": 1420676321000,
                "parentJobId": null,
                "reports": [
                    {
                        "message": "Deleting volume 14.",
                        "severity": "Information",
                        "reportTypeName": "com.hds.bel.storage.core.contract.report.UserReport",
                        "messageCode": "DeleteVolumePreStepMessage",
                        "messageParameters": {
                            "volumeId": "14"
                        },
                        "creationDate": 1420676294000
                    },
                    {
                        "message": "Successfully deleted volume 14.",
                        "severity": "Information",
                        "reportTypeName": "com.hds.bel.storage.core.contract.report.UserReport",
                        "messageCode": "DeleteVolumePostStepMessage",
                        "messageParameters": {
                            "volumeId": "14"
                        },
                        "creationDate": 1420676321000
                    }
                ]
            },
            {
                "id": "5130827b-2305-4cb4-bfd4-d26133fdc8fb",
                "title": "Delete volume",
                "user": "sysadmin",
                "tenant": "0",
                "subTenant": "0",
                "status": "SUCCESS",
                "startDate": 1420676294000,
                "endDate": 1420676301000,
                "parentJobId": null,
                "reports": [
                    {
                        "message": "Deleting volume 12.",
                        "severity": "Information",
                        "reportTypeName": "com.hds.bel.storage.core.contract.report.UserReport",
                        "messageCode": "DeleteVolumePreStepMessage",
                        "messageParameters": {
                            "volumeId": "12"
                        },
                        "creationDate": 1420676294000
                    },
                    {
                        "message": "Successfully deleted volume 12.",
                        "severity": "Information",
                        "reportTypeName": "com.hds.bel.storage.core.contract.report.UserReport",
                        "messageCode": "DeleteVolumePostStepMessage",
                        "messageParameters": {
                            "volumeId": "12"
                        },
                        "creationDate": 1420676301000
                    }
                ]
            },
            {
                "id": "a8134114-236a-4467-8b43-80ddb7034a11",
                "title": "Delete volume",
                "user": "sysadmin",
                "tenant": "0",
                "subTenant": "0",
                "status": "SUCCESS",
                "startDate": 1420676294000,
                "endDate": 1420676308000,
                "parentJobId": null,
                "reports": [
                    {
                        "message": "Deleting volume 13.",
                        "severity": "Information",
                        "reportTypeName": "com.hds.bel.storage.core.contract.report.UserReport",
                        "messageCode": "DeleteVolumePreStepMessage",
                        "messageParameters": {
                            "volumeId": "13"
                        },
                        "creationDate": 1420676294000
                    },
                    {
                        "message": "Successfully deleted volume 13.",
                        "severity": "Information",
                        "reportTypeName": "com.hds.bel.storage.core.contract.report.UserReport",
                        "messageCode": "DeleteVolumePostStepMessage",
                        "messageParameters": {
                            "volumeId": "13"
                        },
                        "creationDate": 1420676307000
                    }
                ]
            },
            {
                "id": "50b28103-29e9-4107-b6f8-2cf054e20f55",
                "title": "Delete volume",
                "user": "sysadmin",
                "tenant": "0",
                "subTenant": "0",
                "status": "SUCCESS",
                "startDate": 1420675862000,
                "endDate": 1420675876000,
                "parentJobId": null,
                "reports": [
                    {
                        "message": "Deleting volume 4.",
                        "severity": "Information",
                        "reportTypeName": "com.hds.bel.storage.core.contract.report.UserReport",
                        "messageCode": "DeleteVolumePreStepMessage",
                        "messageParameters": {
                            "volumeId": "4"
                        },
                        "creationDate": 1420675863000
                    },
                    {
                        "message": "Successfully deleted volume 4.",
                        "severity": "Information",
                        "reportTypeName": "com.hds.bel.storage.core.contract.report.UserReport",
                        "messageCode": "DeleteVolumePostStepMessage",
                        "messageParameters": {
                            "volumeId": "4"
                        },
                        "creationDate": 1420675876000
                    }
                ]
            },
            {
                "id": "c202b82a-15eb-45dc-835a-9daa6feb503f",
                "title": "Delete volume",
                "user": "sysadmin",
                "tenant": "0",
                "subTenant": "0",
                "status": "SUCCESS",
                "startDate": 1420675862000,
                "endDate": 1420675870000,
                "parentJobId": null,
                "reports": [
                    {
                        "message": "Deleting volume 2.",
                        "severity": "Information",
                        "reportTypeName": "com.hds.bel.storage.core.contract.report.UserReport",
                        "messageCode": "DeleteVolumePreStepMessage",
                        "messageParameters": {
                            "volumeId": "2"
                        },
                        "creationDate": 1420675863000
                    },
                    {
                        "message": "Successfully deleted volume 2.",
                        "severity": "Information",
                        "reportTypeName": "com.hds.bel.storage.core.contract.report.UserReport",
                        "messageCode": "DeleteVolumePostStepMessage",
                        "messageParameters": {
                            "volumeId": "2"
                        },
                        "creationDate": 1420675869000
                    }
                ]
            },
            {
                "id": "02f6a261-4c79-4036-b23d-c874783535eb",
                "title": "Create volume,",
                "user": "sysadmin",
                "tenant": "0",
                "subTenant": "0",
                "status": "SUCCESS",
                "startDate": 1420675064000,
                "endDate": 1420675183000,
                "parentJobId": "50f95196-fe05-4dc4-bcb3-4dfac246e4bd",
                "reports": [
                    {
                        "message": "Creating volume.",
                        "severity": "Information",
                        "reportTypeName": "com.hds.bel.storage.core.contract.report.UserReport",
                        "messageCode": "CreateVolumePreStepMessage",
                        "messageParameters": {},
                        "creationDate": 1420675064000
                    },
                    {
                        "message": "Successfully created volume 13.",
                        "severity": "Information",
                        "reportTypeName": "com.hds.bel.storage.core.contract.report.UserReport",
                        "messageCode": "CreateVolumePostStepMessage",
                        "messageParameters": {
                            "volumeId": "13"
                        },
                        "creationDate": 1420675183000
                    }
                ]
            },
            {
                "id": "4a63de0f-8763-4244-bc16-7042d52bfd9c",
                "title": "Create volume,",
                "user": "sysadmin",
                "tenant": "0",
                "subTenant": "0",
                "status": "SUCCESS",
                "startDate": 1420675064000,
                "endDate": 1420675262000,
                "parentJobId": "50f95196-fe05-4dc4-bcb3-4dfac246e4bd",
                "reports": [
                    {
                        "message": "Creating volume.",
                        "severity": "Information",
                        "reportTypeName": "com.hds.bel.storage.core.contract.report.UserReport",
                        "messageCode": "CreateVolumePreStepMessage",
                        "messageParameters": {},
                        "creationDate": 1420675065000
                    },
                    {
                        "message": "Successfully created volume 15.",
                        "severity": "Information",
                        "reportTypeName": "com.hds.bel.storage.core.contract.report.UserReport",
                        "messageCode": "CreateVolumePostStepMessage",
                        "messageParameters": {
                            "volumeId": "15"
                        },
                        "creationDate": 1420675262000
                    }
                ]
            },
            {
                "id": "50f95196-fe05-4dc4-bcb3-4dfac246e4bd",
                "title": "Create volumes from template",
                "user": "sysadmin",
                "tenant": "0",
                "subTenant": "0",
                "status": "SUCCESS",
                "startDate": 1420675064000,
                "endDate": 1420675263000,
                "parentJobId": null,
                "reports": []
            },
            {
                "id": "8dd45f59-32a9-4f4a-bfc5-b694111db209",
                "title": "Create volume,",
                "user": "sysadmin",
                "tenant": "0",
                "subTenant": "0",
                "status": "SUCCESS",
                "startDate": 1420675064000,
                "endDate": 1420675144000,
                "parentJobId": "50f95196-fe05-4dc4-bcb3-4dfac246e4bd",
                "reports": [
                    {
                        "message": "Creating volume.",
                        "severity": "Information",
                        "reportTypeName": "com.hds.bel.storage.core.contract.report.UserReport",
                        "messageCode": "CreateVolumePreStepMessage",
                        "messageParameters": {},
                        "creationDate": 1420675064000
                    },
                    {
                        "message": "Successfully created volume 12.",
                        "severity": "Information",
                        "reportTypeName": "com.hds.bel.storage.core.contract.report.UserReport",
                        "messageCode": "CreateVolumePostStepMessage",
                        "messageParameters": {
                            "volumeId": "12"
                        },
                        "creationDate": 1420675144000
                    }
                ]
            },
            {
                "id": "9329e37b-8c0f-45cc-8ab4-e8481dfaaaec",
                "title": "Create volume,",
                "user": "sysadmin",
                "tenant": "0",
                "subTenant": "0",
                "status": "SUCCESS",
                "startDate": 1420675064000,
                "endDate": 1420675104000,
                "parentJobId": "50f95196-fe05-4dc4-bcb3-4dfac246e4bd",
                "reports": [
                    {
                        "message": "Creating volume.",
                        "severity": "Information",
                        "reportTypeName": "com.hds.bel.storage.core.contract.report.UserReport",
                        "messageCode": "CreateVolumePreStepMessage",
                        "messageParameters": {},
                        "creationDate": 1420675064000
                    },
                    {
                        "message": "Successfully created volume 4.",
                        "severity": "Information",
                        "reportTypeName": "com.hds.bel.storage.core.contract.report.UserReport",
                        "messageCode": "CreateVolumePostStepMessage",
                        "messageParameters": {
                            "volumeId": "4"
                        },
                        "creationDate": 1420675104000
                    }
                ]
            },
            {
                "id": "f76854a4-fb3e-4baf-9050-9d0f45479835",
                "title": "Create volume,",
                "user": "sysadmin",
                "tenant": "0",
                "subTenant": "0",
                "status": "SUCCESS",
                "startDate": 1420675064000,
                "endDate": 1420675223000,
                "parentJobId": "50f95196-fe05-4dc4-bcb3-4dfac246e4bd",
                "reports": [
                    {
                        "message": "Creating volume.",
                        "severity": "Information",
                        "reportTypeName": "com.hds.bel.storage.core.contract.report.UserReport",
                        "messageCode": "CreateVolumePreStepMessage",
                        "messageParameters": {},
                        "creationDate": 1420675065000
                    },
                    {
                        "message": "Successfully created volume 14.",
                        "severity": "Information",
                        "reportTypeName": "com.hds.bel.storage.core.contract.report.UserReport",
                        "messageCode": "CreateVolumePostStepMessage",
                        "messageParameters": {
                            "volumeId": "14"
                        },
                        "creationDate": 1420675223000
                    }
                ]
            },
            {
                "id": "7e4228fe-0f4a-42c9-8202-8a1c1f263ac0",
                "title": "Update volume",
                "user": "sysadmin",
                "tenant": "0",
                "subTenant": "0",
                "status": "FAILED",
                "startDate": 1420673875000,
                "endDate": 1420673887000,
                "parentJobId": null,
                "reports": [
                    {
                        "message": "Updating volume 2.",
                        "severity": "Information",
                        "reportTypeName": "com.hds.bel.storage.core.contract.report.UserReport",
                        "messageCode": "UpdateVolumePreStepMessage",
                        "messageParameters": {
                            "volumeId": "2"
                        },
                        "creationDate": 1420673875000
                    },
                    {
                        "message": "An unexpected internal error occurred. Contact System Administrator if required.Control command I/O error",
                        "severity": "Error",
                        "reportTypeName": "com.hds.bel.storage.core.contract.report.UserReport",
                        "messageCode": "UnexpectedInternalErrorOccurredMessage",
                        "messageParameters": {
                            "exceptionMessage": "Control command I/O error"
                        },
                        "creationDate": 1420673887000
                    },
                    {
                        "message": "An unexpected internal error occurred. Contact System Administrator if required.Control command I/O error",
                        "severity": "Error",
                        "reportTypeName": "com.hds.bel.storage.core.contract.report.UserReport",
                        "messageCode": "UnexpectedInternalErrorOccurredMessage",
                        "messageParameters": {
                            "exceptionMessage": "Control command I/O error"
                        },
                        "creationDate": 1420673887000
                    }
                ]
            },
            {
                "id": "7ecc60fb-0c55-4b23-a925-dbb55121f4b0",
                "title": "Update volume",
                "user": "sysadmin",
                "tenant": "0",
                "subTenant": "0",
                "status": "FAILED",
                "startDate": 1420673613000,
                "endDate": 1420673628000,
                "parentJobId": null,
                "reports": [
                    {
                        "message": "Updating volume 2.",
                        "severity": "Information",
                        "reportTypeName": "com.hds.bel.storage.core.contract.report.UserReport",
                        "messageCode": "UpdateVolumePreStepMessage",
                        "messageParameters": {
                            "volumeId": "2"
                        },
                        "creationDate": 1420673613000
                    },
                    {
                        "message": "An unexpected internal error occurred. Contact System Administrator if required.Control command I/O error",
                        "severity": "Error",
                        "reportTypeName": "com.hds.bel.storage.core.contract.report.UserReport",
                        "messageCode": "UnexpectedInternalErrorOccurredMessage",
                        "messageParameters": {
                            "exceptionMessage": "Control command I/O error"
                        },
                        "creationDate": 1420673628000
                    },
                    {
                        "message": "An unexpected internal error occurred. Contact System Administrator if required.Control command I/O error",
                        "severity": "Error",
                        "reportTypeName": "com.hds.bel.storage.core.contract.report.UserReport",
                        "messageCode": "UnexpectedInternalErrorOccurredMessage",
                        "messageParameters": {
                            "exceptionMessage": "Control command I/O error"
                        },
                        "creationDate": 1420673628000
                    }
                ]
            },
            {
                "id": "4d672c13-4af7-4dc3-b21b-77eb3a7bd593",
                "title": "Update volume",
                "user": "sysadmin",
                "tenant": "0",
                "subTenant": "0",
                "status": "FAILED",
                "startDate": 1420673405000,
                "endDate": 1420673418000,
                "parentJobId": null,
                "reports": [
                    {
                        "message": "Updating volume 2.",
                        "severity": "Information",
                        "reportTypeName": "com.hds.bel.storage.core.contract.report.UserReport",
                        "messageCode": "UpdateVolumePreStepMessage",
                        "messageParameters": {
                            "volumeId": "2"
                        },
                        "creationDate": 1420673405000
                    },
                    {
                        "message": "An unexpected internal error occurred. Contact System Administrator if required.Control command I/O error",
                        "severity": "Error",
                        "reportTypeName": "com.hds.bel.storage.core.contract.report.UserReport",
                        "messageCode": "UnexpectedInternalErrorOccurredMessage",
                        "messageParameters": {
                            "exceptionMessage": "Control command I/O error"
                        },
                        "creationDate": 1420673417000
                    },
                    {
                        "message": "An unexpected internal error occurred. Contact System Administrator if required.Control command I/O error",
                        "severity": "Error",
                        "reportTypeName": "com.hds.bel.storage.core.contract.report.UserReport",
                        "messageCode": "UnexpectedInternalErrorOccurredMessage",
                        "messageParameters": {
                            "exceptionMessage": "Control command I/O error"
                        },
                        "creationDate": 1420673417000
                    }
                ]
            },
            {
                "id": "91c3e356-625b-4ab5-bd0b-dd07fdd9141d",
                "title": "Update volume",
                "user": "sysadmin",
                "tenant": "0",
                "subTenant": "0",
                "status": "FAILED",
                "startDate": 1420672677000,
                "endDate": 1420672690000,
                "parentJobId": null,
                "reports": [
                    {
                        "message": "Updating volume 2.",
                        "severity": "Information",
                        "reportTypeName": "com.hds.bel.storage.core.contract.report.UserReport",
                        "messageCode": "UpdateVolumePreStepMessage",
                        "messageParameters": {
                            "volumeId": "2"
                        },
                        "creationDate": 1420672677000
                    },
                    {
                        "message": "An unexpected internal error occurred. Contact System Administrator if required.Control command I/O error",
                        "severity": "Error",
                        "reportTypeName": "com.hds.bel.storage.core.contract.report.UserReport",
                        "messageCode": "UnexpectedInternalErrorOccurredMessage",
                        "messageParameters": {
                            "exceptionMessage": "Control command I/O error"
                        },
                        "creationDate": 1420672689000
                    },
                    {
                        "message": "An unexpected internal error occurred. Contact System Administrator if required.Control command I/O error",
                        "severity": "Error",
                        "reportTypeName": "com.hds.bel.storage.core.contract.report.UserReport",
                        "messageCode": "UnexpectedInternalErrorOccurredMessage",
                        "messageParameters": {
                            "exceptionMessage": "Control command I/O error"
                        },
                        "creationDate": 1420672689000
                    }
                ]
            },
            {
                "id": "adcc6ce9-74f9-41a6-a67f-d8d76e2bea90",
                "title": "Update volume",
                "user": "sysadmin",
                "tenant": "0",
                "subTenant": "0",
                "status": "SUCCESS",
                "startDate": 1420672040000,
                "endDate": 1420672046000,
                "parentJobId": null,
                "reports": [
                    {
                        "message": "Updating volume 2.",
                        "severity": "Information",
                        "reportTypeName": "com.hds.bel.storage.core.contract.report.UserReport",
                        "messageCode": "UpdateVolumePreStepMessage",
                        "messageParameters": {
                            "volumeId": "2"
                        },
                        "creationDate": 1420672040000
                    },
                    {
                        "message": "Successfully updated volume 2.",
                        "severity": "Information",
                        "reportTypeName": "com.hds.bel.storage.core.contract.report.UserReport",
                        "messageCode": "UpdateVolumePostStepMessage",
                        "messageParameters": {
                            "volumeId": "2"
                        },
                        "creationDate": 1420672046000
                    }
                ]
            },
            {
                "id": "19db1a1a-9094-493f-94d0-94a2b1d5442c",
                "title": "Create volume,",
                "user": "sysadmin",
                "tenant": "0",
                "subTenant": "0",
                "status": "SUCCESS",
                "startDate": 1420671240000,
                "endDate": 1420671299000,
                "parentJobId": "deaf9a77-03b2-4211-b397-b8a3d3ec9b0b",
                "reports": [
                    {
                        "message": "Creating volume.",
                        "severity": "Information",
                        "reportTypeName": "com.hds.bel.storage.core.contract.report.UserReport",
                        "messageCode": "CreateVolumePreStepMessage",
                        "messageParameters": {},
                        "creationDate": 1420671240000
                    },
                    {
                        "message": "Successfully created volume 2.",
                        "severity": "Information",
                        "reportTypeName": "com.hds.bel.storage.core.contract.report.UserReport",
                        "messageCode": "CreateVolumePostStepMessage",
                        "messageParameters": {
                            "volumeId": "2"
                        },
                        "creationDate": 1420671299000
                    }
                ]
            },
            {
                "id": "deaf9a77-03b2-4211-b397-b8a3d3ec9b0b",
                "title": "Create volumes from template",
                "user": "sysadmin",
                "tenant": "0",
                "subTenant": "0",
                "status": "SUCCESS",
                "startDate": 1420671240000,
                "endDate": 1420671299000,
                "parentJobId": null,
                "reports": []
            },
            {
                "id": "1dfa38bd-b39e-4f4c-a79b-5cc005a4a4f4",
                "title": "Create pool.",
                "user": "sysadmin",
                "tenant": "0",
                "subTenant": "0",
                "status": "SUCCESS",
                "startDate": 1420670883000,
                "endDate": 1420670951000,
                "parentJobId": null,
                "reports": [
                    {
                        "message": "Creating pool.",
                        "severity": "Information",
                        "reportTypeName": "com.hds.bel.storage.core.contract.report.UserReport",
                        "messageCode": "CreatePoolPreStepMessage",
                        "messageParameters": {},
                        "creationDate": 1420670883000
                    },
                    {
                        "message": "Successfully created pool 000.",
                        "severity": "Information",
                        "reportTypeName": "com.hds.bel.storage.core.contract.report.UserReport",
                        "messageCode": "CreatePoolPostStepMessage",
                        "messageParameters": {
                            "storagePoolId": "000"
                        },
                        "creationDate": 1420670951000
                    }
                ]
            },
            {
                "id": "d69957a3-fb92-4d95-8598-fd7b74045299",
                "title": "Create storage system",
                "user": "sysadmin",
                "tenant": "0",
                "subTenant": "0",
                "status": "SUCCESS",
                "startDate": 1420658204000,
                "endDate": 1420658367000,
                "parentJobId": null,
                "reports": [
                    {
                        "message": "Creating storage system.",
                        "severity": "Information",
                        "reportTypeName": "com.hds.bel.storage.core.contract.report.UserReport",
                        "messageCode": "CreateStorageSystemPreStepMessage",
                        "messageParameters": {},
                        "creationDate": 1420658204000
                    },
                    {
                        "message": "Successfully created storage system 410118.",
                        "severity": "Information",
                        "reportTypeName": "com.hds.bel.storage.core.contract.report.UserReport",
                        "messageCode": "CreateStorageSystemPostStepMessage",
                        "messageParameters": {
                            "storageId": "410118"
                        },
                        "creationDate": 1420658367000
                    }
                ]
            },
            {
                "id": "16c527e5-f57d-4008-ad28-8ec50544af8b",
                "title": "Create storage system",
                "user": "sysadmin",
                "tenant": "0",
                "subTenant": "0",
                "status": "SUCCESS",
                "startDate": 1420657068000,
                "endDate": 1420657283000,
                "parentJobId": null,
                "reports": [
                    {
                        "message": "Creating storage system.",
                        "severity": "Information",
                        "reportTypeName": "com.hds.bel.storage.core.contract.report.UserReport",
                        "messageCode": "CreateStorageSystemPreStepMessage",
                        "messageParameters": {},
                        "creationDate": 1420657068000
                    },
                    {
                        "message": "Successfully created storage system 410033.",
                        "severity": "Information",
                        "reportTypeName": "com.hds.bel.storage.core.contract.report.UserReport",
                        "messageCode": "CreateStorageSystemPostStepMessage",
                        "messageParameters": {
                            "storageId": "410033"
                        },
                        "creationDate": 1420657283000
                    }
                ]
            },
            {
                "id": "42ec6968-f6f8-499d-80fa-2702c389a21d",
                "title": "Remove storage system",
                "user": "sysadmin",
                "tenant": "0",
                "subTenant": "0",
                "status": "SUCCESS",
                "startDate": 1420656734000,
                "endDate": 1420656746000,
                "parentJobId": null,
                "reports": [
                    {
                        "message": "Removing storage system 410118.",
                        "severity": "Information",
                        "reportTypeName": "com.hds.bel.storage.core.contract.report.UserReport",
                        "messageCode": "RemoveStorageSystemPreStepMessage",
                        "messageParameters": {
                            "storageId": "410118"
                        },
                        "creationDate": 1420656735000
                    },
                    {
                        "message": "Successfully removed storage system 410118.",
                        "severity": "Information",
                        "reportTypeName": "com.hds.bel.storage.core.contract.report.UserReport",
                        "messageCode": "RemoveStorageSystemPostStepMessage",
                        "messageParameters": {
                            "storageId": "410118"
                        },
                        "creationDate": 1420656746000
                    }
                ]
            },
            {
                "id": "7561462a-4920-4412-8c5e-52eb2f231737",
                "title": "Create storage system",
                "user": "sysadmin",
                "tenant": "0",
                "subTenant": "0",
                "status": "SUCCESS",
                "startDate": 1420655017000,
                "endDate": 1420655171000,
                "parentJobId": null,
                "reports": [
                    {
                        "message": "Creating storage system.",
                        "severity": "Information",
                        "reportTypeName": "com.hds.bel.storage.core.contract.report.UserReport",
                        "messageCode": "CreateStorageSystemPreStepMessage",
                        "messageParameters": {},
                        "creationDate": 1420655017000
                    },
                    {
                        "message": "Successfully created storage system 410118.",
                        "severity": "Information",
                        "reportTypeName": "com.hds.bel.storage.core.contract.report.UserReport",
                        "messageCode": "CreateStorageSystemPostStepMessage",
                        "messageParameters": {
                            "storageId": "410118"
                        },
                        "creationDate": 1420655170000
                    }
                ]
            }
        ])
    });
});

app.get('/v1/templates/tiers', jsonParser, function (req, res) {
    if (!loginUser) return res.sendStatus(401)


    res.json(tiers);
});

app.get('/v1/storage-systems/:storageSystemId/tiers/summary', jsonParser, function (req, res) {
    if (!loginUser) return res.sendStatus(401);
    res.json({
            "tierSummaryItems":
                [
                    {
                        "tierName":"Platinum",
                        "totalCapacity":"40461983285248",
                        "freeCapacity":"5277647634432"
                    }
                ]
        }
    );
});

app.post('/v1/templates/tiers/:tierId', jsonParser, function (req, res) {

    res.json(getjob('Update Tier ' + req.params.tierId + ' name.'));
});

app.post('/v1/san-fabrics', jsonParser, function (req, res) {
    res.json(getjob('Adding Fabric Switch'));
});

app.post('/v1/san-fabrics/:fabricName', jsonParser, function (req, res) {

    res.json(getjob('Updating Fabric Switch'));
});

app.delete('/v1/san-fabrics/:fabricName', jsonParser, function (req, res) {

    res.json(getjob('Deleting Fabric Switch'));
});

app.get('/v1/san-fabrics', jsonParser, function (req, res) {
    if (!loginUser) return res.sendStatus(401)
    res.json({ fabrics:[
        {
            "sanFabricId": "1_1",
            "virtualFabricId": "",
            "switchType": "BROCADE",
            "principalSwitchAddress": "10.76.76.170",
            "principalSwitchUsername": "admin",
            "principalSwitchPortNumber": 22
        },
        {
            "sanFabricId": "1_123",
            "virtualFabricId": "",
            "switchType": "BROCADE",
            "principalSwitchAddress": "10.76.76.171",
            "principalSwitchUsername": "admin",
            "principalSwitchPortNumber": 22
        },
        {
            "sanFabricId": "1_2",
            "virtualFabricId": "",
            "switchType": "BROCADE",
            "principalSwitchAddress": "10.76.76.172",
            "principalSwitchUsername": "admin",
            "principalSwitchPortNumber": 22
        },
        {
            "sanFabricId": "1_4",
            "virtualFabricId": "VFID4",
            "switchType": "CISCO",
            "principalSwitchAddress": "10.76.76.173",
            "principalSwitchUsername": "admin",
            "principalSwitchPortNumber": 22
        },
        {
            "sanFabricId": "1_5",
            "virtualFabricId": "VFID5",
            "switchType": "CISCO",
            "principalSwitchAddress": "10.76.76.174",
            "principalSwitchUsername": "admin",
            "principalSwitchPortNumber": 22
        },
        {
            "sanFabricId": "1_6",
            "virtualFabricId": "VFID6",
            "switchType": "CISCO",
            "principalSwitchAddress": "10.76.76.175",
            "principalSwitchUsername": "admin",
            "principalSwitchPortNumber": 22
        }
    ]});
});

app.get('/v1/san-fabrics/1', jsonParser, function (req, res) {
    if (!loginUser) return res.sendStatus(401)
    res.json({ fabric:
        {
            "sanFabricId": "1_1",
            "virtualFabricId": "VFID1",
            "switchType": "BROCADE",
            "principalSwitchAddress": "10.76.76.170",
            "principalSwitchUsername": "admin",
            "principalSwitchPortNumber": 22
        }
    });
});

app.get('/v1/san-fabrics/123', jsonParser, function (req, res) {
    if (!loginUser) return res.sendStatus(401)
    res.json({ fabric:
    {
        "sanFabricId": "1_123",
        "virtualFabricId": "VFID123",
        "switchType": "BROCADE",
        "principalSwitchAddress": "10.76.76.171",
        "principalSwitchUsername": "admin",
        "principalSwitchPortNumber": 22
    }
    });
});

app.get('/v1/san-fabrics/2', jsonParser, function (req, res) {
    if (!loginUser) return res.sendStatus(401)
    res.json({ fabric:
    {
        "sanFabricId": "1_2",
        "virtualFabricId": "VFID2",
        "switchType": "BROCADE",
        "principalSwitchAddress": "10.76.76.172",
        "principalSwitchUsername": "admin",
        "principalSwitchPortNumber": 22
    }
    });
});

app.get('/v1/san-fabrics/4', jsonParser, function (req, res) {
    if (!loginUser) return res.sendStatus(401)
    res.json({ fabric:
    {
        "sanFabricId": "1_4",
        "virtualFabricId": "VFID4",
        "switchType": "CISCO",
        "principalSwitchAddress": "10.76.76.173",
        "principalSwitchUsername": "admin",
        "principalSwitchPortNumber": 22
    }
    });
});

app.get('/v1/san-fabrics/5', jsonParser, function (req, res) {
    if (!loginUser) return res.sendStatus(401)
    res.json({ fabric:
    {
        "sanFabricId": "1_5",
        "virtualFabricId": "VFID5",
        "switchType": "CISCO",
        "principalSwitchAddress": "10.76.76.174",
        "principalSwitchUsername": "admin",
        "principalSwitchPortNumber": 22
    }
    });
});

app.get('/v1/san-fabrics/6', jsonParser, function (req, res) {
    if (!loginUser) return res.sendStatus(401)
    res.json({ fabric:
    {
        "sanFabricId": "1_6",
        "virtualFabricId": "VFID6",
        "switchType": "CISCO",
        "principalSwitchAddress": "10.76.76.175",
        "principalSwitchUsername": "admin",
        "principalSwitchPortNumber": 22
    }
    });
});

var resTypes = ["Battery", "Fan", "Cache", "Processor", "Port", "Memory", "PowerSupply"];
var capResType = ["Pool"];
var alertLevels = ['critical', 'warning', 'ok', 'unknown'];
var hardwareAlerts = _.flatten(_.map(_.range(1, 65), function (v) {
    var now = new Date();
    return _.map(_.range(0, 7), function (i) {
        return {
            alertLevel: alertLevels[_.random(0, 1)],
            storageSerialNumber: "2200" + v,
            storageNickname: "VSP G400",
            refCode: "AF5201",
            resourceType: resTypes[i],
            resourceId: "007",
            timestamp: now.toTimeString(),
            description: resTypes[i] + " warning"
        }
    });
}));

var diskAlerts = _.map(_.range(1, 65), function (v) {
    var now = new Date();
    return {
        alertLevel: alertLevels[_.random(0, 1)],
        storageSerialNumber: "2200" + v,
        storageNickname: "VSP G400",
        refCode: "DF5201",
        resourceType: "Disk",
        resourceId: "005",
        resourceLocation: "CDEV - RDEV",
        diskSpec: { diskType:  _.sample(['SSD', 'FMC', 'FMD', 'SAS']), speed: 1500, capacity: getCapacity(0, 5)},
        date: now.toUTCString(),
        timestamp: now.toTimeString(),
        description: "Disk warning"
    }
});

var capacityAlerts = _.flatten(_.map(_.range(1, 65), function (v) {
    var now = new Date();
    return _.map(_.range(0, 1), function (i) {
        return {
            alertLevel: alertLevels[_.random(0, 1)],
            storageSerialNumber: "2200" + v,
            storageNickname: "VSP G400",
            refCode: "CF5201",
            resourceType: capResType[0],
            resourceId: "7",
            date: now.toUTCString(),
            timestamp: now.toTimeString(),
            description: capResType[0] + " warning"
        }
    });
}));

app.get('/v1/monitoring/status/hardware', jsonParser, function (req, res) {
    if (!loginUser) return res.sendStatus(401)
    res.json(
            {
                "totalComponentWiseHardwareAlerts": 4,
                "hardwareComponents": {
                    "diskAlerts": true,
                    "powerSupplyAlerts": true,
                    "batteryAlerts": true,
                    "fanAlerts": false,
                    "portAlerts": true,
                    "cacheAlerts": false,
                    "memoryAlerts": false,
                    "processorAlerts": false
                }
            }

    );
});

app.get('/v1/monitoring/status/:storageArrayId/hardware', jsonParser, function (req, res) {
    if (!loginUser) return res.sendStatus(401)
    res.json(
            {
                "totalComponentWiseHardwareAlerts": "4",
                "hardwareComponents": {
                    "diskAlerts": true,
                    "powerSupplyAlerts": true,
                    "batteryAlerts": true,
                    "fanAlerts": false,
                    "portAlerts": true,
                    "cacheAlerts": false,
                    "memoryAlerts": false,
                    "processorAlerts": false
                }
            }

    );
});

app.get('/v1/monitoring/status/hardware/:resourceType', jsonParser, function (req, res) {
    if (!loginUser) return res.sendStatus(401)
    var alerts = _.filter(req.params.resourceType == "disk" ? diskAlerts : hardwareAlerts, function (alert) {
        return alert.resourceType.toUpperCase() === req.params.resourceType.toUpperCase();
    })

    if (alerts) {

        return res.json(req.params.resourceType === 'disk' ? { diskAlertInformationList: alerts } : { alertInformationList: alerts })
    }
    return res.sendStatus(404)
});

app.get('/v1/monitoring/status/:storageArrayId/hardware/:resourceType', jsonParser, function (req, res) {
    if (!loginUser) return res.sendStatus(401)
    if (req.params.resourceType)
        var alerts = _.filter(req.params.resourceType == "disk" ? diskAlerts : hardwareAlerts, function (alert) {
            return alert.resourceType.toUpperCase() === req.params.resourceType.toUpperCase() && alert.storageSerialNumber == req.params.storageArrayId;
        })

    if (alerts) {
        return res.json(req.params.resourceType === 'disk' ? { diskAlertInformationList: alerts } : { alertInformationList: alerts })
    }
    return res.sendStatus(404)
});

app.get('/v1/monitoring/status/capacity', jsonParser, function (req, res) {
    if (!loginUser) return res.sendStatus(401)
    res.json(
            {
                "totalComponentWiseCapacityAlerts": "1",
                "numOfCriticalAlerts": "2",
                "numOfWarningAlerts": "3",
                "capacityComponents": {
                    "poolAlerts": true
                }
            }

    );
});

app.get('/v1/monitoring/status/:storageArrayId/capacity', jsonParser, function (req, res) {
    if (!loginUser) return res.sendStatus(401)
    res.json(
            {
                "totalComponentWiseCapacityAlerts": "0",
                "numOfCriticalAlerts": "2",
                "numOfWarningAlerts": "1",
                "capacityComponents": {
                    "poolAlerts": false
                }
            }

    );
});

app.get('/v1/monitoring/status/capacity/:resourceType', jsonParser, function (req, res) {
    if (!loginUser) return res.sendStatus(401)
    if (req.params.resourceType)
        var alerts = _.filter(capacityAlerts, function (alert) {
            return alert.resourceType.toUpperCase() === req.params.resourceType.toUpperCase();
        })

    if (alerts) {
        return res.json({ capacityAlertInformationList: alerts })
    }
    return res.sendStatus(404)
});

app.get('/v1/monitoring/status/:storageArrayId/capacity/:resourceType', jsonParser, function (req, res) {
    if (!loginUser) return res.sendStatus(401)
    if (req.params.resourceType)
        var alerts = _.filter(capacityAlerts, function (alert) {
            return alert.resourceType.toUpperCase() === req.params.resourceType.toUpperCase() && alert.storageSerialNumber == req.params.storageArrayId;
        })

    if (alerts) {
        return res.json({ capacityAlertInformationList: alerts })
    }
    return res.sendStatus(404)
});

app.get('/v1/storage-systems/:storageArrayId/settings/common', jsonParser, function(req, res) {
    return res.json(
        {
            storageSystemName: "VSP-LAB"+req.params.storageArrayId,
            contact: "rainier@hds.com",
            location: "Bellevue-LAB"+req.params.storageArrayId
        }
    )
});

app.get('/v1/storage-systems/:storageArrayId/settings/time-zones', jsonParser, function(req, res) {
    return res.json(
        {
            "timeZones": [
                {
                    "display": "(GMT-12:00) - International Data Line West",
                    "key": "Etc/GMT+12"
                },
                {
                    "display": "(GMT-11:00) - Midway Island/Samoa",
                    "key": "US/Samoa"
                },
                {
                    "display": "(GMT-10:00) - Hawaii",
                    "key": "US/Hawaii"
                },
                {
                    "display": "(GMT-09:00) - Alaska",
                    "key": "US/Alaska"
                },
                {
                    "display": "(GMT-08:00) - Pacific Time(US&Canada)/Tijuana",
                    "key": "US/Pacific"
                },
                {
                    "display": "(GMT-07:00) - Arizona",
                    "key": "US/Arizona"
                },
                {
                    "display": "(GMT-07:00) - Chihuahua/La Paz/Mazatlan",
                    "key": "America/Chihuahua"
                },
                {
                    "display": "(GMT-07:00) - Mountain Time(US&Canada)",
                    "key": "US/Mountain"
                },
                {
                    "display": "(GMT-06:00) - Central Time(US&Canada)",
                    "key": "Canada/Central"
                },
                {
                    "display": "(GMT-06:00) - Central America",
                    "key": "America/Guatemala"
                },
                {
                    "display": "(GMT-06:00) - Saskatchewan",
                    "key": "Canada/Saskatchewan"
                },
                {
                    "display": "(GMT-06:00) - Guadalajara/Mexico City/Monterrey",
                    "key": "America/Mexico_City"
                },
                {
                    "display": "(GMT-05:00) - Eastern Time(US&Canada)",
                    "key": "Canada/Eastern"
                },
                {
                    "display": "(GMT-05:00) - Bogota/Lima/Quito",
                    "key": "America/Bogota"
                },
                {
                    "display": "(GMT-05:00) - Indiana(East)",
                    "key": "EST"
                },
                {
                    "display": "(GMT-04:30) - Caracas/La Paz",
                    "key": "America/Caracas"
                },
                {
                    "display": "(GMT-04:00) - Atlantic Time(Canada)",
                    "key": "Canada/Atlantic"
                },
                {
                    "display": "(GMT-04:00) - Santiago",
                    "key": "America/Santiago"
                },
                {
                    "display": "(GMT-03:30) - Newfoundland",
                    "key": "Canada/Newfoundland"
                },
                {
                    "display": "(GMT-03:00) - Brasilia",
                    "key": "America/Sao_Paulo"
                },
                {
                    "display": "(GMT-03:00) - Buenos Aires/Georgetown",
                    "key": "America/Buenos_Aires"
                },
                {
                    "display": "(GMT-03:00) - Greenland",
                    "key": "America/Godthab"
                },
                {
                    "display": "(GMT-02:00) - Mid-Atlantic",
                    "key": "Atlantic/South_Georgia"
                },
                {
                    "display": "(GMT-01:00) - Cape Verde Is",
                    "key": "Atlantic/Cape_Verde"
                },
                {
                    "display": "(GMT-01:00) - Azores",
                    "key": "Atlantic/Azores"
                },
                {
                    "display": "(GMT:00:00) - Casablanca/Monrovia",
                    "key": "Etc/GMT"
                },
                {
                    "display": "(GMT:00:00) - Greenwich Mean Time : Dublin/Edinburgh/Lisbon/London",
                    "key": "Europe/London"
                },
                {
                    "display": "(GMT+01:00) - Amsterdam/Berlin/Bern/Rome/Stockholm/Vienna",
                    "key": "Europe/Amsterdam"
                },
                {
                    "display": "(GMT+01:00) - Sarajevo/Skopje/Warsaw/Zagreb",
                    "key": "Europe/Sarajevo"
                },
                {
                    "display": "(GMT+01:00) - Brussels/Copenhagen/Madrid/Paris",
                    "key": "Europe/Brussels"
                },
                {
                    "display": "(GMT+01:00) - Belgrade/Bratislava/Budapest/Ljubjana/Prague",
                    "key": "Europe/Belgrade"
                },
                {
                    "display": "(GMT+01:00) - West Central Africa",
                    "key": "Africa/Lagos"
                },
                {
                    "display": "(GMT+02:00) - Athens/Istanbul/Minsk",
                    "key": "Europe/Athens"
                },
                {
                    "display": "(GMT+02:00) - Jerusalem",
                    "key": "Asia/Jerusalem"
                },
                {
                    "display": "(GMT+02:00) - Cairo",
                    "key": "Africa/Cairo"
                },
                {
                    "display": "(GMT+02:00) - Harare/Pretoria",
                    "key": "Africa/Harare"
                },
                {
                    "display": "(GMT+02:00) - Bucharest",
                    "key": "Europe/Bucharest"
                },
                {
                    "display": "(GMT+02:00) - Helsinki/Kyiv/Riga/Sofia/Tallinn/Vilnius",
                    "key": "Europe/Helsinki"
                },
                {
                    "display": "(GMT+03:00) - Kuwait/Riyadh",
                    "key": "Asia/Kuwait"
                },
                {
                    "display": "(GMT+03:00) - Nairobi",
                    "key": "Africa/Nairobi"
                },
                {
                    "display": "(GMT+03:00) - Baghdad",
                    "key": "Asia/Baghdad"
                },
                {
                    "display": "(GMT+03:00) - Moscow/St.Petersburg/Volgograd",
                    "key": "Europe/Moscow"
                },
                {
                    "display": "(GMT+03:30) - Tehran",
                    "key": "Asia/Tehran"
                },
                {
                    "display": "(GMT+04:00) - Abu Dhabi/Muscat",
                    "key": "Asia/Muscat"
                },
                {
                    "display": "(GMT+04:00) - Baku/Tbilisi/Yerevan",
                    "key": "Asia/Baku"
                },
                {
                    "display": "(GMT+04:30) - Kabul",
                    "key": "Asia/Kabul"
                },
                {
                    "display": "(GMT+05:00) - Islamabad/Karachi/Tashkent",
                    "key": "Asia/Karachi"
                },
                {
                    "display": "(GMT+05:00) - Yekaterinburg",
                    "key": "Asia/Yekaterinburg"
                },
                {
                    "display": "(GMT+05:30) - Chennai/Kolkata/Mumbai/New Delhi",
                    "key": "Asia/Kolkata"
                },
                {
                    "display": "(GMT+05:30) - Sri Jayawardenepura",
                    "key": "Asia/Colombo"
                },
                {
                    "display": "(GMT+05:45) - Kathmandu",
                    "key": "Asia/Kathmandu"
                },
                {
                    "display": "(GMT+06:00) - Astana/Dhaka",
                    "key": "Asia/Dhaka"
                },
                {
                    "display": "(GMT+06:00) - Almaty/Novosibirsk",
                    "key": "Asia/Almaty"
                },
                {
                    "display": "(GMT+06:30) - Yangon(Rangoon)",
                    "key": "Asia/Rangoon"
                },
                {
                    "display": "(GMT+07:00) - Bangkok/Hanoi/Jakarta",
                    "key": "Asia/Bangkok"
                },
                {
                    "display": "(GMT+08:00) - Krasnoyarsk",
                    "key": "Asia/Krasnoyarsk"
                },
                {
                    "display": "(GMT+08:00) - Kuala Lumpur/Singapore",
                    "key": "Asia/Kuala_Lumpur"
                },
                {
                    "display": "(GMT+08:00) - Perth",
                    "key": "Australia/Perth"
                },
                {
                    "display": "(GMT+08:00) - Taipei",
                    "key": "Asia/Taipei"
                },
                {
                    "display": "(GMT+08:00) - Beijing/Chongqing/Hong Kong/Urumqi",
                    "key": "Hongkong"
                },
                {
                    "display": "(GMT+09:00) - Irkutsk/Ulaan Bataar",
                    "key": "Asia/Irkutsk"
                },
                {
                    "display": "(GMT+09:00) - Seoul",
                    "key": "Asia/Seoul"
                },
                {
                    "display": "(GMT+09:00) - Yakutsk",
                    "key": "Asia/Yakutsk"
                },
                {
                    "display": "(GMT+09:00) - Osaka/Sapporo/Tokyo",
                    "key": "Asia/Tokyo"
                },
                {
                    "display": "(GMT+09:30) - Adelaide",
                    "key": "Australia/Adelaide"
                },
                {
                    "display": "(GMT+09:30) - Darwin",
                    "key": "Australia/Darwin"
                },
                {
                    "display": "(GMT+10:00) - Brisbane",
                    "key": "Australia/Brisbane"
                },
                {
                    "display": "(GMT+10:00) - Canberra/Melboume/Sydney",
                    "key": "Australia/Canberra"
                },
                {
                    "display": "(GMT+10:00) - Guam/Port Moresby",
                    "key": "Pacific/Guam"
                },
                {
                    "display": "(GMT+10:00) - Hobart",
                    "key": "Australia/Hobart"
                },
                {
                    "display": "(GMT+11:00) - Vladivostok",
                    "key": "Asia/Vladivostok"
                },
                {
                    "display": "(GMT+12:00) - Magadan/Solomon Is./New Caledonia",
                    "key": "Asia/Magadan"
                },
                {
                    "display": "(GMT+12:00) - Auckland/Wellington",
                    "key": "Pacific/Auckland"
                },
                {
                    "display": "(GMT+12:00) - Fiji/Kamchatka/Marshall Is.",
                    "key": "Pacific/Fiji"
                },
                {
                    "display": "(GMT+13:00) - Nuku’alofa",
                    "key": "Pacific/Tongatapu"
                }
            ]
        }
    )
});

app.get('/v1/storage-systems/:storageArrayId/settings/date-time', jsonParser, function(req, res) {
    res.json(
        {
            time: "1424134485",
            timeZone: "US/Samoa",
            ntp: {
                enabled: true,
                ntpServers: ["ntp1.hds.com", "ntp2.hds.com"]
            }

        })
});

app.get('/v1/storage-systems/:storageArrayId/settings/alert-notifications', jsonParser, function(req, res) {
    res.json(
        {
            email: {
                from: "rainer@hds.com",
                recipients: ["storageadmin@acme.com", "systemadmin@acme.com"],
                mailServer: "mail.acme.com"
            },
            smtp: {
                enabled: true,
                username: "smtpuser",
                password: "password123"
            },
            snmp: {
                trapDestinations: [{
                    community: "public",
                    ipAddress: "172.17.41.136"
                }]
            }
        })
});

app.get('/v1/storage-systems/:storageArrayId/settings/licenses', jsonParser, function(req, res) {
    res.json(
        {
            licenses: [
                {
                    productName: "Data Retention Utility",
                    installed: true,
                    licenseCapacity: {
                        permitted: {
                            unlimited: true
                        },
                        usedCapacity : "0"
                    }
                },
                {
                    productName : "Dynamic Provisioning",
                    installed : false,
                    licenseCapacity : null
                },
                {
                    "productName":"Dynamic Tiering",
                    "installed":true,
                    "licenseCapacity":{
                        "permitted":{
                            "unlimited":true,
                            "value":null
                        },
                        "usedCapacity":"81529216696320"
                    }
                },
                {
                    "productName":"active flash",
                    "installed":true,
                    "licenseCapacity":{
                        "permitted":{
                            "unlimited":true,
                            "value":null
                        },
                        "usedCapacity":"0"
                    }
                },
                {
                    "productName":"Thin Image",
                    "installed":true,
                    "licenseCapacity":{
                        "permitted":{
                            "unlimited":true,
                            "value":null
                        },
                        "usedCapacity":"1381905727488"
                    }
                },
                {
                    productName : "Data Retention Utility",
                    installed : true,
                    licenseCapacity : {
                        permitted : {
                            unlimited : false,
                            value : "1512338723946"
                        },
                        usedCapacity : "-"
                    }
                },
                {
                    productName : "Data Retention Utility",
                    installed : true,
                    licenseCapacity : {
                        permitted : {
                            unlimited : true
                        },
                        usedCapacity : "28666759217152"
                    }
                }
            ]
        })
});

app.post('/v1/storage-systems/:storageArrayId/settings/licenses', jsonParser, function(req, res) {
    console.log(req.body);
    res.json(getjob('Installing Licenses'));
});

app.post('/v1/storage-systems/:storageArrayId/settings/alert-notifications', jsonParser, function(req, res) {
    console.log(req.body);
    res.json(getjob('Setting Alert-Notifications properties'));
});

app.post('/v1/storage-systems/:storageArrayId/settings/date-time', jsonParser, function(req, res) {
    console.log(req.body);
    res.json(getjob('Setting Date Time'));
});

app.post('/v1/storage-systems/:storageArrayId/settings/common', jsonParser, function(req, res) {
    console.log(req.body);
    res.json(getjob('Setting Common properties'));
});


app.post('/v1/data-protection/local/snapshots', jsonParser, function (req, res) {
    console.log(req);
    res.json(getjob('Protecting Volumes'));
});


app.post('/v1/data-protection/local/clones', jsonParser, function (req, res) {
    console.log(req);
    res.json(getjob('Protecting Volumes'));
});

app.post('/v1/data-protection/local/clones/delete', jsonParser, function (req, res) {

    res.json(getjob('Deleting pairs'));
});

app.post('/v1/data-protection/local/clones/suspend', jsonParser, function (req, res) {

    res.json(getjob('Suspending pairs'));
});

app.post('/v1/data-protection/local/clones/restore', jsonParser, function (req, res) {

    res.json(getjob('Restoring pairs'));
});

app.post('/v1/data-protection/local/clones/resume', jsonParser, function (req, res) {

    res.json(getjob('Resuming pairs'));
});

app.post('/v1/data-protection/local/snapshots/delete', jsonParser, function (req, res) {

    res.json(getjob('Deleting pairs'));
});

app.post('/v1/data-protection/local/snapshots/suspend', jsonParser, function (req, res) {

    res.json(getjob('Suspending pairs'));
});

app.post('/v1/data-protection/local/snapshots/restore', jsonParser, function (req, res) {

    res.json(getjob('Restoring pairs'));
});

app.post('/v1/data-protection/local/snapshots/resume', jsonParser, function (req, res) {

    res.json(getjob('Resuming pairs'));
});

app.get('/v1/storage-systems/:storageSystemId/data-protection/all', jsonParser, function (req, res) {
    if (!loginUser) return res.sendStatus(401)
    res.json(
        [
            {
                "links": { },
                "id": 0,
                "consistencyGroupNeeded": false,
                "name": "Copy Group 0",
                "replicationType": "SNAPSHOT",
                "comments": "TestComment 0",
                "noOfSVols": 2,
                "copyGroups": [
                    {
                        "id": 0,
                        "copyGrpName": "CG 0",
                        "poolId": 0,
                        "pVol": 24000,
                        "sVol": 0,
                        "pVolStorageArrayId": 51003,
                        "sVolStorageArrayId": 51003,
                        "pVolStatus": "In Progress",
                        "sVolStatus": "In Progress"
                    },
                    {
                        "id": 1,
                        "copyGrpName": "CG 1",
                        "poolId": 0,
                        "pVol": 24001,
                        "sVol": 0,
                        "pVolStorageArrayId": 51003,
                        "sVolStorageArrayId": 51003,
                        "pVolStatus": "In Progress",
                        "sVolStatus": "In Progress"
                    }
                ],
                "scheduleInfo": "At 0:00 AM",
                "cloneNow": false,
                "cascading": false
            },
            {
                "links": { },
                "id": 1,
                "consistencyGroupNeeded": false,
                "name": "Copy Group 1",
                "replicationType": "SNAPSHOT",
                "comments": "TestComment 1",
                "noOfSVols": 2,
                "copyGroups": [
                    {
                        "id": 0,
                        "copyGrpName": "CG 0",
                        "poolId": 0,
                        "pVol": 24000,
                        "sVol": 0,
                        "pVolStorageArrayId": 51003,
                        "sVolStorageArrayId": 51003,
                        "pVolStatus": "In Progress",
                        "sVolStatus": "In Progress"
                    },
                    {
                        "id": 1,
                        "copyGrpName": "CG 1",
                        "poolId": 0,
                        "pVol": 24001,
                        "sVol": 0,
                        "pVolStorageArrayId": 51003,
                        "sVolStorageArrayId": 51003,
                        "pVolStatus": "In Progress",
                        "sVolStatus": "In Progress"
                    }
                ],
                "scheduleInfo": "At 0:00 AM",
                "cloneNow": false,
                "cascading": false
            },
            {
                "links": { },
                "id": 2,
                "consistencyGroupNeeded": false,
                "name": "Copy Group 2",
                "replicationType": "CLONE",
                "comments": "TestComment 2",
                "noOfSVols": 2,
                "copyGroups": [
                    {
                        "id": 0,
                        "copyGrpName": "CG 0",
                        "poolId": 0,
                        "pVol": 24000,
                        "sVol": 0,
                        "pVolStorageArrayId": 51003,
                        "sVolStorageArrayId": 51003,
                        "pVolStatus": "In Progress",
                        "sVolStatus": "In Progress"
                    },
                    {
                        "id": 1,
                        "copyGrpName": "CG 1",
                        "poolId": 0,
                        "pVol": 24001,
                        "sVol": 0,
                        "pVolStorageArrayId": 51003,
                        "sVolStorageArrayId": 51003,
                        "pVolStatus": "In Progress",
                        "sVolStatus": "In Progress"
                    }
                ],
                "scheduleInfo": null,
                "cloneNow": false,
                "cascading": false
            },
            {
                "links": { },
                "id": 3,
                "consistencyGroupNeeded": false,
                "name": "Copy Group 3",
                "replicationType": "CLONE",
                "comments": "TestComment 3",
                "noOfSVols": 4,
                "copyGroups": [
                    {
                        "id": 0,
                        "copyGrpName": "CG 0",
                        "poolId": 0,
                        "pVol": 24000,
                        "sVol": 0,
                        "pVolStorageArrayId": 51003,
                        "sVolStorageArrayId": 51003,
                        "pVolStatus": "In Progress",
                        "sVolStatus": "In Progress"
                    },
                    {
                        "id": 1,
                        "copyGrpName": "CG 1",
                        "poolId": 0,
                        "pVol": 24001,
                        "sVol": 0,
                        "pVolStorageArrayId": 51003,
                        "sVolStorageArrayId": 51003,
                        "pVolStatus": "In Progress",
                        "sVolStatus": "In Progress"
                    }
                ],
                "scheduleInfo": null,
                "cloneNow": false,
                "cascading": false
            },
            {
                "links": { },
                "id": 4,
                "consistencyGroupNeeded": false,
                "name": "Copy Group 4",
                "replicationType": "SNAPSHOT",
                "comments": "TestComment 4",
                "noOfSVols": 6,
                "copyGroups": [
                    {
                        "id": 0,
                        "copyGrpName": "CG 0",
                        "poolId": 0,
                        "pVol": 24000,
                        "sVol": 0,
                        "pVolStorageArrayId": 51003,
                        "sVolStorageArrayId": 51003,
                        "pVolStatus": "In Progress",
                        "sVolStatus": "In Progress"
                    },
                    {
                        "id": 1,
                        "copyGrpName": "CG 1",
                        "poolId": 0,
                        "pVol": 24001,
                        "sVol": 0,
                        "pVolStorageArrayId": 51003,
                        "sVolStorageArrayId": 51003,
                        "pVolStatus": "In Progress",
                        "sVolStatus": "In Progress"
                    }
                ],
                "scheduleInfo": null,
                "cloneNow": false,
                "cascading": false
            },
            {
                "links": { },
                "id": 5,
                "consistencyGroupNeeded": false,
                "name": "Copy Group 5",
                "replicationType": "SNAPSHOT",
                "comments": "TestComment 5",
                "noOfSVols": 8,
                "copyGroups": [
                    {
                        "id": 0,
                        "copyGrpName": "CG 0",
                        "poolId": 101,
                        "pVol": 24000,
                        "sVol": 0,
                        "pVolStorageArrayId": 51003,
                        "sVolStorageArrayId": 51003,
                        "pVolStatus": "In Progress",
                        "sVolStatus": "In Progress"
                    },
                    {
                        "id": 1,
                        "copyGrpName": "CG 1",
                        "poolId": 101,
                        "pVol": 24001,
                        "sVol": 0,
                        "pVolStorageArrayId": 51003,
                        "sVolStorageArrayId": 51003,
                        "pVolStatus": "In Progress",
                        "sVolStatus": "In Progress"
                    }
                ],
                "scheduleInfo": "At 0:00 AM",
                "cloneNow": false,
                "cascading": false
            },
            {
                "links": { },
                "id": 6,
                "consistencyGroupNeeded": false,
                "name": "Copy Group 6",
                "replicationType": "SNAPSHOT",
                "comments": "TestComment 6",
                "noOfSVols": 6,
                "copyGroups": [
                    {
                        "id": 0,
                        "copyGrpName": "CG 0",
                        "poolId": 101,
                        "pVol": 24000,
                        "sVol": 0,
                        "pVolStorageArrayId": 51003,
                        "sVolStorageArrayId": 51003,
                        "pVolStatus": "In Progress",
                        "sVolStatus": "In Progress"
                    },
                    {
                        "id": 1,
                        "copyGrpName": "CG 1",
                        "poolId": 101,
                        "pVol": 24001,
                        "sVol": 0,
                        "pVolStorageArrayId": 51003,
                        "sVolStorageArrayId": 51003,
                        "pVolStatus": "In Progress",
                        "sVolStatus": "In Progress"
                    }
                ],
                "scheduleInfo": "Every day at 00:00",
                "cloneNow": false,
                "cascading": false
            }
        ]
    );
});

app.post('/v1/snmp-managers', jsonParser, function (req, res) {

    res.json(getjob('Adding Snmp Manager'));
});

app.post('/v1/snmp-managers/:snmpMgrName', jsonParser, function (req, res) {

    res.json(getjob('Updating Snmp Manager'));
});

app.delete('/v1/snmp-managers/:snmpMgrName', jsonParser, function (req, res) {

    res.json(getjob('Deleting Snmp Manager'));
});
app.get('/v1/snmp-managers', jsonParser, function (req, res) {
    if (!loginUser) return res.sendStatus(401)
    res.json({ snmpManagerInformationList: [
        {
            "name": "snmp-manager1",
            "ipAddress": "172.17.61.140",
            "username": "user1",
            "privacyProtocol": "AES-128",
            "authProtocol": "MD5",
            "port": 165
        },
        {
            "name": "snmp-manager2",
            "ipAddress": "172.17.61.141",
            "username": "user2",
            "privacyProtocol": "DES",
            "authProtocol": "SHA",
            "port": 165
        }
    ] });
});

app.get('/v1/snmp-managers/:snmpMgrName', jsonParser, function (req, res) {
    if (!loginUser) return res.sendStatus(401)
    if (req.params.snmpMgrName === 'snmp-manager1') {
        res.json(
            {
                "name": "snmp-manager1",
                "ipAddress": "172.17.61.140",
                "username": "user1",
                "privacyProtocol": "AES-128",
                "authProtocol": "MD5",
                "port": 165
            });
    } else if (req.params.snmpMgrName === 'snmp-manager2') {
        res.json(
            {
                "name": "snmp-manager2",
                "ipAddress": "172.17.61.141",
                "username": "user2",
                "privacyProtocol": "DES",
                "authProtocol": "SHA",
                "port": 165
            });
    }
});

app.get('/v1/security/account-domains', jsonParser, function (req, res) {
    if (!loginUser) return res.sendStatus(401)
    res.json({
            "accountDomains": [
                {
                    "id": 1,
                    "domain": "LOCAL",
                    "username": "",
                    "type": "LOCAL"
                },
                {
                    "id": 4,
                    "domain": "mcp.com",
                    "username": "ucp-mcpmgr",
                    "type": "ACTIVE_DIRECTORY"
                }
            ]
        }
    );
});

app.get('/v1/security/account-domains/:accountDomainId/users', jsonParser, function (req, res) {
    if (!loginUser) return res.sendStatus(401)
    res.json({
            "users": [
                {
                    "accountDomainId": 1,
                    "id": 1,
                    "loginName": "sysadmin"
                }
            ]
        }
    );
});

app.get('/v1/storage-systems/:storageSystemId/evs', jsonParser, function (req, res) {
    if (!loginUser) return res.sendStatus(401)

    var ss = _.find(storageSystems, function (s) {
        return s.storageSystemId == req.params.storageSystemId;
    })

    if (ss) {

        var evss = _.map(storageEvs, function (v) {
            var clone = _.cloneDeep(v);
            clone.storageSystemId = ss.storageSystemId;
            return clone;
        })
        return res.json({
            EVSs: evss
        });
    }
    return res.sendStatus(404)
});


app.get('/v1/security/account-domains/:accountDomainId/groups', jsonParser, function (req, res) {
    if (!loginUser) return res.sendStatus(401);

    var groups =  [
        "Domain Users@mcp.com",
        "RAINIER_TENANT_ENG@mcp.com",
        "Domain Computers@mcp.com",
        "Domain Controllers@mcp.com",
        "RAINIER_TENANT_MKT@mcp.com",
        "RAINIER_USER@mcp.com",
        "Enterprise Read-only Domain Controllers@mcp.com",
        "JenkinsAdmin@mcp.com",
        "QA Stress@mcp.com",
        "HCP_Admins@mcp.com",
        "Infrastructure@mcp.com",
        "mcpscomadmins@mcp.com",
        "Domain Guests@mcp.com",
        "ps_scomadmins@mcp.com",
        "RAINIER_SECURITY@mcp.com",
        "RAINIER_ADMIN@mcp.com",
        "UCP Chat@mcp.com",
        "mcpsccmsiteadmins@mcp.com",
        "Shasta Admins@mcp.com",
        "vcoadmins@mcp.com",
        "Masters@mcp.com",
        "DnsUpdateProxy@mcp.com",
        "SCSM-Admins@mcp.com",
        "Group Policy Creator Owners@mcp.com",
        "InactiveSecurityGroup@mcp.com",
        "Read-only Domain Controllers@mcp.com",
        "MediaBundleAdmins@mcp.com",
        "ucp-leadership@mcp.com",
        "UCP-QA@mcp.com",
        "mcpsqldbadmins@mcp.com",
        "PO Admin@mcp.com",
        "UCP-Leads@mcp.com",
        "Enterprise Admins@mcp.com",
        "Automation@mcp.com",
        "Schema Admins@mcp.com",
        "Domain Admins@mcp.com",
        "mcpsqlrepadmins@mcp.com"
    ];
    res.json(
        {
            "groups": _.where(groups, function (g){
                return g.toLowerCase().indexOf(req.query.filter.toLowerCase()) > -1;
            })
        }
    );
});

app.get('/v1/security/account-domains/:accountDomainId/group-mappings', jsonParser, function (req, res) {
    if (!loginUser) return res.sendStatus(401)
    res.json(
        {
            "mappings": [
                {
                    "id": 5,
                    "accountDomainId": 4,
                    "groupName": "JenkinsAdmin@mcp.com",
                    "userRole": "StorageAdministrator"
                }
            ]
        }
    );
});

app.get('/v1/security/account-domains/:accountDomainId/group-mappings', jsonParser, function (req, res) {
    if (!loginUser) return res.sendStatus(401)
    res.json(
        {
            "mappings": [
                {
                    "id": 5,
                    "accountDomainId": 4,
                    "groupName": "JenkinsAdmin@mcp.com",
                    "userRole": "StorageAdministrator"
                }
            ]
        }
    );
});

app.post('*', jsonParser, function(req, res) {
    return res.json(getjob("Started Action..."))
});

app.patch('*', jsonParser, function(req, res) {
    return res.json(getjob("Started Action..."))
});

app.delete('*', jsonParser, function(req, res) {
    return res.json(getjob("Deleting Item(s)"))
});

app.listen(8080);
console.log('running api on port 8080')

console.log('\n=======APIs ========\n')

var routes = app._router.stack;
var table = [];
for (var key in routes) {
    if (routes.hasOwnProperty(key)) {
        var val = routes[key];
        if (val.route) {
            val = val.route;
            console.log(val.stack[0].method + "\t" + val.path);
        }
    }
}

console.log('\nPress Ctrl +C to stop...\n')
