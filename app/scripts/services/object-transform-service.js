'use strict';

/**
 * @ngdoc service
 * @name rainierApp.objectTransformService
 * @description
 * # objectTransformProvider
 * Provider in the rainierApp.
 */
angular.module('rainierApp')
    .factory('objectTransformService', function (diskSizeService, synchronousTranslateService, $location, $filter,
                                                 ShareDataService, cronStringConverterService, wwnService,
                                                 versionService, replicationService, storageNavigatorSessionService,
                                                 constantService, commonConverterService, volumeService,
                                                 storageAdvisorEmbeddedSessionService) {

        var transforms;
        var allocatedColor = '#DADBDF';
        var unallocatedColor = '#595B5B';
        var physicalCapacityColor = '#66A2FF';
        var availableParityGroupCapacityColor = '#6F7CA8';
        var fileUsedCapacityColor = '#3D84F5';
        var fileFreeCapacityColor = '#265CB3';
        var thinUsedColor = '#7BC242';
        var thinFreeColor = '#599628';
        var overCommitColor = '#272727';
        var subscribedCapacityColor = 'white';
        var vspX200IdentifierPrefix = '/dev/storage/832000';
        var vspX400X600IdentifierPrefix = '/dev/storage/834000';
        var vspX800IdentifierPrefix = '/dev/storage/836000';
        var vspX350IdentifierPrefix = '/dev/storage/882000';
        var vspX370X700X900IdentifierPrefix = '/dev/storage/886000';
        var vspX130IdentifierPrefix = '/dev/storage/880000';
        var vspG1000Identifier = '/sanproject';
        var sessionScopeEncryptionKeys = 'encryption-keys';

        var capacity = function (usedCapacity, freeCapacity) {
            return [
                {
                    capacity: usedCapacity,
                    label: (function (key) {
                        return synchronousTranslateService.translate(key);
                    })('common-label-used'),
                    tooltip: (function (key) {
                        var usedCapacityObject = usedCapacity;
                        var usedCapacityAmount = usedCapacityObject.size + usedCapacityObject.unit;
                        var variable = {
                            usedCapacity: usedCapacityAmount
                        };
                        return synchronousTranslateService.translate(key, variable);
                    })('used-capacity-tooltip'),
                    color: thinUsedColor
                },
                {
                    capacity: freeCapacity,
                    label: (function (key) {
                        return synchronousTranslateService.translate(key);
                    })('common-label-free'),
                    tooltip: (function (key) {
                        var freeCapacityObject = freeCapacity;
                        var freeCapacityAmount = freeCapacityObject.size + freeCapacityObject.unit;
                        var variable = {
                            freeCapacity: freeCapacityAmount
                        };
                        return synchronousTranslateService.translate(key, variable);
                    })('free-capacity-tooltip'),
                    color: thinFreeColor
                }
            ];
        };

        var addZero = function (time) {
            if (time < 10) {
                time = '0' + time;
            }
            return time;
        };

        var formatVolumeId = function (id) {
            if (!id) {
                return "";
            }
            var hexId = ('00000' + id.toString(16).toUpperCase()).substr(-6);
            var formatted = hexId.match(/.{1,2}/g).join(':');
            return id + ' (' + formatted + ')';
        };

        function transformStorageSystemsSummary(item) {
            var subscribedCapacityPercentage = 0;
            var usagePercentage = 0;
            var totalUsable = parseInt(item.totalUsableCapacity);
            if (totalUsable > 0) {
                usagePercentage = Math.round(parseInt(item.usedCapacity) * 100.0 / totalUsable);
                subscribedCapacityPercentage = Math.round(parseInt(item.subscribedCapacity) * 100 /
                    totalUsable);
            }

            item.usagePercentage = usagePercentage;
            item.usage = usagePercentage + '%';
            item.physicalUsed = diskSizeService.getDisplaySize(item.usedCapacity);
            item.physicalTotal = diskSizeService.getDisplaySize(item.allocatedToPool);
            item.physicalFree = diskSizeService.getDisplaySize(item.allocatedToPool - item.usedCapacity);
            item.poolCapacity = diskSizeService.getDisplaySize(item.allocatedToPool);
            item.unallocatedToPoolsCapacity = diskSizeService.getDisplaySize(item.totalUsableCapacity -
                item.allocatedToPool);

            item.subscribedCapacityPercentage = subscribedCapacityPercentage;
            item.total = diskSizeService.getDisplaySize(item.totalUsableCapacity);
        }

        function transformHdvmSnLaunchUrl(item) {
            var identifier = '';
            switch (item.model) {
                case constantService.storageModel.HM800.G200:
                    identifier = vspX200IdentifierPrefix + item.storageSystemId;
                    break;
                case constantService.storageModel.HM800.G400:
                case constantService.storageModel.HM800.F400:
                case constantService.storageModel.HM800.G600:
                case constantService.storageModel.HM800.F600:
                    identifier = vspX400X600IdentifierPrefix + item.storageSystemId;
                    break;
                case constantService.storageModel.HM800.G800:
                case constantService.storageModel.HM800.F800:
                    identifier = vspX800IdentifierPrefix + item.storageSystemId;
                    break;
                case constantService.storageModel.HM850.G350:
                case constantService.storageModel.HM850.F350:
                    identifier = vspX350IdentifierPrefix + item.storageSystemId;
                    break;
                case constantService.storageModel.HM850.G370:
                case constantService.storageModel.HM850.F370:
                case constantService.storageModel.HM850.G700:
                case constantService.storageModel.HM850.F700:
                case constantService.storageModel.HM850.G900:
                case constantService.storageModel.HM850.F900:
                    identifier = vspX370X700X900IdentifierPrefix + item.storageSystemId;
                    break;
                case constantService.storageModel.HM850.G130:
                    identifier = vspX130IdentifierPrefix + item.storageSystemId;
                    break;
                case constantService.storageModel.Rx00.G1000:
                case constantService.storageModel.Rx00.G1500:
                case constantService.storageModel.Rx00.F1500:
                    identifier = vspG1000Identifier;
                    break;
            }

            if (identifier === '') {
                item.hdvmSnLaunchUrl = ['https://', item.svpIpAddress].join('');
            } else {
                item.hdvmSnLaunchUrl = ['https://', item.svpIpAddress, identifier, '/emergency.do'].join('');
            }
        }

        function transformStorageSystemSettings(item) {
            var result = [];

            result.push(storageNavigatorSessionService.getNavigatorSessionAction(
                item.storageSystemId, sessionScopeEncryptionKeys));

            if (constantService.isHM850Series(item.model)) {
                result.push(storageAdvisorEmbeddedSessionService.getLaunchUrl(item.storageSystemId));
            }

            result.push({
                type: 'hyperlink',
                title: 'storage-system-launch-hdvm',
                href: item.hdvmSnLaunchUrl
            });

            return result;
        }

        function metadataDetailsOfPort(item) {
            var result = [];
            if(item.type === 'FIBRE') {
                result = [item.speed, item.fabric, item.connectionType];
                if(item.wwn) {
                    result.push(wwnService.appendColon(item.wwn));
                }
                return result;
            } else if(item.type==='ISCSI' && item.iscsiPortInformation) {
                result = [item.speed, item.iscsiPortInformation.portIscsiName];

                if(item.iscsiPortInformation.ipv4Information) {
                    result.push(item.iscsiPortInformation.ipv4Information.address);
                }
                if(item.iscsiPortInformation.ipv6Enabled) {
                    result.push('IPv6 Enable');
                } else {
                    result.push('IPv6 Disable');
                }
                if(item.iscsiPortInformation.ipv6Information) {
                    result.push(item.iscsiPortInformation.ipv6Information.globalAddress);
                    result.push(item.iscsiPortInformation.ipv6Information.linklocalAddress);
                }
                return result;
            }
            return [];
        }

        transforms = {

            transformVolumeId: function(id) {
                return formatVolumeId(id);
            },

            transformStorageSystem: function (item) {
                transformStorageSystemsSummary(item);
                transformHdvmSnLaunchUrl(item);

                item.firmwareVersionIsSupported = versionService.isStorageSystemVersionSupported(item.firmwareVersion);
                item.metaData = [
                    {
                        left: true,
                        title: item.storageSystemName,
                        details: [item.storageSystemId, item.svpIpAddress]
                    },
                    {
                        left: false,
                        title: item.model,
                        details: []
                    }
                ];
                item.getIcons = function () {
                    return [];
                };
                if (item.gadSummary === 'INCOMPLETE') {
                    item.alertType = 'alert-link';
                    item.alertLink = {
                        icon: 'icon-small-triangle',
                        title: synchronousTranslateService.translate('incomplete-gad-array'),
                    };
                }

                item.getIcons = function () {
                    return [this.alertLink];
                };
                item.topTotal = item.total;
                item.topSize = item.physicalUsed;
                if (item.unified) {
                    item.itemIcon = 'icon-cluster';
                }
                else {
                    item.itemIcon = 'icon-storage-system';
                }
                item.topPostFix = 'common-label-total';
                item.bottomPostFix = 'common-label-used';
                item.onClick = function () {
                    $location.path(['storage-systems', item.storageSystemId].join('/'));
                };

                item.actions = {
                    'delete': {
                        icon: 'icon-delete',
                        tooltip: 'action-tooltip-delete',
                        type: 'confirm',
                        confirmTitle: 'storage-system-delete-confirmation',
                        confirmMessage: 'storage-system-delete-selected-content',
                        enabled: function () {
                            return true;
                        },
                        onClick: function (orchestratorService) {
                            return orchestratorService.deleteStorageSystem(item.storageSystemId);
                        }
                    },
                    'edit': {
                        icon: 'icon-edit',
                        tooltip: 'action-tooltip-edit',
                        type: 'link',
                        onClick: function () {
                            $location.path(['storage-systems', item.storageSystemId, 'update'].join(
                                '/'));
                        },
                        enabled: function () {
                            return true;
                        }
                    },
                    'settings': {
                        icon: 'icon-settings',
                        tooltip: 'action-tooltip-settings',
                        type: 'dropdown',
                        items: transformStorageSystemSettings(item),
                        enabled: function () {
                            return true;
                        }
                    }

                };

                item.getActions = function () {
                    return _.map(item.actions);
                };

                item.alerts = 0;

            },
            transformReplicationGroup: function (item) {
                if (replicationService.isSnapShotType(item.type)) {
                    if (item.scheduleEnabled === false) {
                        item.status = 'Suspended';
                    } else if (!item.hasOwnProperty('isExternal')) {
                        item.status = 'Active';
                    }
                    if (item.targetPoolId === null){
                        item.targetPoolId = synchronousTranslateService.translate('common-auto-selected');
                    }
                } else {
                    item.schedule = 'N/A';
                    item.status = 'N/A';
                }

                item.type = replicationService.displayReplicationType(item.type);

                if (item.consistent === true) {
                    item.consistent = 'On';
                } else if (!item.hasOwnProperty('isExternal')) {
                    item.consistent = 'Off';
                }

                if (item.hasOwnProperty('isExternal')) {
                    item.noSelection = true;
                }

                item.volumePairs = [];
                item.opened = false;

                for (var property in item) {
                    if (item.hasOwnProperty(property)) {
                        if (item[property] === null) {
                            item[property] = 'N/A';
                        }
                    }
                }
                if (item.comments === '') {
                    item.comments = 'N/A';
                }
                item.naturalLanguageSchedule = cronStringConverterService.fromObjectModelToNaturalLanguage(item.schedule);
            },
            transformVolumePairs: function (item) {
                if (!item.primaryVolume) {
                    item.primaryVolume = {
                        id: 'N/A',
                        displayId: 'N/A',
                        status: 'N/A',
                        storageSystemId: 'N/A'
                    };
                } else {
                    item.primaryVolume.displayId = formatVolumeId(item.primaryVolume.id);
                    item.launchPvol = function () {
                        var path = ['storage-systems', item.primaryVolume.storageSystemId, 'volumes', item.primaryVolume.id].join('/');
                        $location.path(path);
                    };
                }

                if (item.primaryVolume.status.indexOf('SMPL') === 0) {
                    item.disabledCheckBox = true;
                }

                if (!item.secondaryVolume) {
                    item.secondaryVolume = {
                        id: 'N/A',
                        displayId: 'N/A',
                        status: 'N/A',
                        storageSystemId: 'N/A'
                    };
                } else {
                    item.secondaryVolume.displayId = formatVolumeId(item.secondaryVolume.id);
                    item.launchSvol = function () {
                        var path = ['storage-systems', item.secondaryVolume.storageSystemId, 'volumes', item.secondaryVolume.id].join('/');
                        $location.path(path);
                    };
                }

                if (item.splitTime !== undefined && item.splitTime !== null) {
                    item.originalSplitTime = item.splitTime;
                    var splitTime = new Date(item.splitTime);
                    item.splitTime = addZero(splitTime.getUTCMonth() + 1) + '/' + addZero(splitTime.getUTCDate()) +
                        ' ' + addZero(splitTime.getUTCHours()) + ':' + addZero(splitTime.getUTCMinutes());
                }

                for (var property in item) {
                    if (item.hasOwnProperty(property)) {
                        if (property !== 'primaryVolume' && property !== 'secondaryVolume' && item[property] === null) {
                            item[property] = 'N/A';
                        }
                    }
                }
            },
            transformVirtualStorageMachine: function (item) {
                item.noSelection = true;
                item.displayPhysicalStorageSystems = item.physicalStorageSystems.join(', ');
                item.metaData = [
                    {
                        left: true,
                        title: item.storageSystemId,
                        details: [item.productModel]
                    },
                    {
                        left: false,
                        title: item.pairHACount,
                        details: [item.displayPhysicalStorageSystems]
                    }
                ];
                item.itemIcon = 'icon-vsm';
                item.onClick = function () {
                    ShareDataService.virtualStorageMachine = item;
                    $location.path(['virtual-storage-machines', item.serialModelNumber].join('/'));
                };
            },
            transformGadPair: function (item) {
                if (item.primary) {
                    item.hasPrimaryHalf = true;
                    item.launchPvol = function () {
                        var path = ['storage-systems', item.primary.storageSystemId, 'volumes', item.primary.volumeId].join('/');
                        $location.path(path);
                    };
                } else {
                    item.hasPrimaryHalf = false;
                    item.primary = new replicationService.GadDevice();
                }

                if (item.secondary) {
                    item.hasSecondaryHalf = true;
                    item.launchSvol = function () {
                        var path = ['storage-systems', item.secondary.storageSystemId, 'volumes', item.secondary.volumeId].join('/');
                        $location.path(path);
                    };
                } else {
                    item.hasSecondaryHalf = false;
                    item.secondary = new replicationService.GadDevice();
                }

                item.noSelection = true;
                item.itemIcon = 'icon-deduplication';

                for (var property in item) {
                    if (item.hasOwnProperty(property)) {
                        if (property !== 'primary' && property !== 'secondary' && item[property] === null) {
                            item[property] = 'N/A';
                        }
                    }
                }
            },
            transformVolume: function (item) {
                var usagePercentage = Math.round(parseInt(item.usedCapacity) * 100.0 / parseInt(item.size));
                item.usagePercentage = usagePercentage;
                item.usage = usagePercentage + '%';
                item.totalCapacity = diskSizeService.getDisplaySize(item.size);
                item.totalCapacity.intSize = parseInt(item.totalCapacity.size);
                item.totalCapacity.decimalSize = parseFloat(item.totalCapacity.size);
                item.usedCapacity = diskSizeService.getDisplaySize(item.usedCapacity);
                item.availableCapacity = diskSizeService.getDisplaySize(item.availableCapacity);
                item.alerts = 0;
                item.open = false;
                item.storagePoolId = parseInt(item.poolId);

                if (item.label && item.label.indexOf('HSA-reserved-') === 0) {
                    item.disabledCheckBox = true;
                }

                item.poolLabel = 'pool' + item.poolId;
                item.volumeLabel = 'Volume' + item.volumeId;
                item.displayVolumeId = formatVolumeId(item.volumeId);

                item.displayedDpType = replicationService.displayReplicationTypes(item.dataProtectionSummary.replicationType, item.gadSummary);

                item.dpStatus = item.dataProtectionSummary.hasFailures;
                item.dpMonitoringStatus = item.dataProtectionSummary.hasFailures ? 'Failed' : 'Success';
                item.dpMonitoringStatus = item.dataProtectionSummary.replicationType.length === 0 ? '' : item.dpMonitoringStatus;


                item.dataSavingTypeValuePairs = volumeService.getDkcDataSavingTypes();
                item.dataSavingTypeValuePair = _.findWhere(volumeService.getDkcDataSavingTypes(), {value: item.dkcDataSavingType});

                var icons = [];
                if (item.dpStatus) {
                    item.alertType = 'alert-link';
                    item.alertLink = {
                        icon: 'icon-small-diamond',
                        title: 'Data Protection Failed.',
                        onClick: function () {
                            var path = ['storage-systems', item.storageSystemId, 'data-protection-monitoring'].join('/');
                            $location.path(path);
                        }
                    };
                    icons.push(item.alertLink);
                }

                if (!item.gadSummary) {
                    item.gadSummary = {
                        virtualLdevId: 'N/A'
                    };
                } else if (item.gadSummary && !item.gadSummary.virtualLdevId && item.gadSummary.virtualLdevId !== 0) {
                    item.gadSummary.virtualLdevId = 'N/A';
                }

                switch (item.dkcDataSavingType) {
                    case 'COMPRESSION':
                        icons.push({
                            icon: 'icon-compression',
                            title: 'Compression Enabled'
                        });
                        break;
                    case 'DEDUPLICATION_AND_COMPRESSION':
                        icons.push({
                            icon: 'icon-deduplication',
                            title: 'Deduplication Enabled'
                        });
                        icons.push({
                            icon: 'icon-compression',
                            title: 'Compression Enabled'
                        });
                        break;
                }

                item.getIcons = function () {
                    return icons;
                };

                item.metaData = [
                    {
                        left: true,
                        title: item.label,
                        details: [item.displayVolumeId]
                    },
                    {
                        left: false,
                        title: item.storageSystemId,
                        details: [item.displayedDpType],
                        detailsToolTips: [_.map(item.dataProtectionSummary.replicationType, function (type) {
                            return replicationService.tooltip(type);
                        }).join(', ')]
                    }
                ];

                if (ShareDataService.showProvisioningStatus === true) {
                    item.metaData.push(
                        {
                            left: true,
                            title: item.provisioningStatus
                        }
                    );
                }

                var allDataProtectionStatus = [];
                if (item.dataProtectionSummary.volumeType.indexOf('UNPROTECTED') !== -1) {
                    allDataProtectionStatus.push('Unprotected');
                } else {
                    if (item.dataProtectionSummary.volumeType.indexOf('P-VOL') !== -1) {
                        allDataProtectionStatus.push('Protected');
                    }
                    if (item.dataProtectionSummary.volumeType.indexOf('S-VOL') !== -1) {
                        allDataProtectionStatus.push('Secondary');
                    }
                }
                switch (_.size(allDataProtectionStatus)) {
                    case 1:
                        item.dataProtectionStatus = _.first(allDataProtectionStatus);
                        break;
                    case 2:
                        if (_.contains(allDataProtectionStatus, 'Protected')) {
                            item.dataProtectionStatus = 'Protected';
                        } else if (_.contains(allDataProtectionStatus, 'Secondary')) {
                            item.dataProtectionStatus = 'Secondary';
                        } else {
                            item.dataProtectionStatus = 'Unprotected';
                        }
                        break;
                    default:
                        item.dataProtectionStatus = 'Unprotected';
                }
                switch (item.dataProtectionStatus) {
                    case 'Protected':
                        item.itemIcon = 'icon-primary-volume';
                        break;
                    case 'Secondary':
                        item.itemIcon = 'icon-secondary-volume';
                        break;
                    case 'Unprotected':
                        item.itemIcon = 'icon-volume';
                        break;
                    default:
                        item.itemIcon = 'icon-volume';
                }


                item.isPrevalidationForDeleting = function () {
                    return this.provisioningStatus === 'ATTACHED' || this.provisioningStatus === 'UNMANAGED';
                };

                item.isGadVolume = function () {
                    if (this.gadSummary) {
                        return (this.gadSummary.volumeType === constantService.gadVolumeType.ACTIVE_PRIMARY ||
                            this.gadSummary.volumeType === constantService.gadVolumeType.ACTIVE_SECONDARY);
                    } else {
                        return false;
                    }
                };

                if (item.isGadVolume()) {
                    switch (item.gadSummary.volumeType) {
                        case constantService.gadVolumeType.ACTIVE_PRIMARY:
                            item.itemIcon = 'icon-primary-volume';
                            break;
                        case constantService.gadVolumeType.ACTIVE_SECONDARY:
                            item.itemIcon = 'icon-secondary-volume';
                            break;
                        default:
                            item.itemIcon = 'icon-volume';
                    }
                }
                switch (item.dkcDataSavingType) {
                    case 'NONE':
                        item.capacitySavingType = 'No';
                        break;
                    case 'COMPRESSION':
                        item.capacitySavingType = 'Compression';
                        break;
                    case 'DEDUPLICATION_AND_COMPRESSION':
                        item.capacitySavingType = 'Deduplication and Compression';
                        break;
                }

                item.topTotal = item.totalCapacity;
                item.topSize = item.usedCapacity;
                item.topPostFix = 'common-label-total';
                item.bottomPostFix = 'common-label-used';
                item.onClick = function () {
                    $location.path(['storage-systems', item.storageSystemId, 'volumes', item.volumeId].join(
                        '/'));
                };

                item.isUnprotected = function () {
                    return (this.dataProtectionSummary.volumeType.indexOf('P-VOL') === -1);
                };

                item.isAttached = function () {
                    return (this.provisioningStatus === 'ATTACHED');
                };


                item.isUnattached = function () {
                    return (this.provisioningStatus === 'UNATTACHED');
                };

                item.isUnmanaged = function () {
                    return (this.provisioningStatus === 'UNMANAGED');
                };

                item.isMigrating = function () {
                    return (this.migrationSummary.migrationType === 'MIGRATION');
                };

                item.actions = {
                    'delete': {
                        icon: 'icon-delete',
                        tooltip: 'action-tooltip-delete',
                        type: 'confirm',
                        confirmTitle: 'storage-volume-delete-one-confirmation',
                        confirmMessage: 'storage-volume-delete-current-content',
                        enabled: function () {
                            return true;
                        },
                        onClick: function (orchestratorService, goback) {
                            orchestratorService.deleteVolume(item.storageSystemId, item.volumeId).then(
                                function () {
                                    if (goback) {
                                        window.history.back();
                                    }
                                });
                        }
                    },
                    'edit': {
                        icon: 'icon-edit',
                        tooltip: 'action-tooltip-update',
                        type: 'link',
                        onClick: function () {
                            if (ShareDataService.showPoolBreadCrumb === true) {
                                $location.path(['storage-systems', item.storageSystemId, 'storage-pools',
                                    item.storagePoolId, 'volumes',
                                    item.volumeId, 'update'
                                ].join('/'));
                            } else {
                                $location.path(['storage-systems', item.storageSystemId, 'volumes',
                                    item.volumeId, 'update'
                                ].join('/'));
                            }
                        },
                        enabled: function () {
                            return true;
                        }
                    },
                    'attach': {
                        icon: 'icon-attach-volume',
                        tooltip: 'action-tooltip-attach-volumes',
                        type: 'link',
                        onClick: function () {
                            ShareDataService.push('selectedVolumes', [item]);
                            $location.path(['storage-systems', item.storageSystemId,
                                'attach-volumes'
                            ].join('/'));
                        },
                        enabled: function () {
                            return true;
                        }
                    },
                    'detach': {
                        icon: 'icon-detach-volume',
                        tooltip: 'storage-volume-detach',
                        type: 'link',
                        onClick: function () {
                            ShareDataService.push('selectedVolumes', [item]);
                            if (ShareDataService.showPoolBreadCrumb === true) {
                                $location.path(['storage-systems', item.storageSystemId, 'storage-pools',
                                    item.storagePoolId, 'volumes',
                                    item.volumeId, 'detach'
                                ].join('/'));
                            } else {
                                $location.path(['storage-systems', item.storageSystemId,
                                    'volumes', item.volumeId, 'detach'
                                ].join('/'));
                            }
                        },
                        enabled: function () {
                            return true;
                        }
                    },
                    'protect': {
                        icon: 'icon-data-protection',
                        tooltip: 'action-tooltip-protect-volumes',
                        type: 'link',
                        onClick: function () {
                            ShareDataService.volumesList = [item];
                        },
                        enabled: function () {
                            return true;
                        }
                    }
                };


                item.hasFibrePath = _.some(item.paths, function (p) {
                    return p.wwns && p.wwns.length > 0;
                });

                item.hasIscsiPath = _.some(item.paths, function(p) {
                    return p.iscsiTargetInformation;
                });

                item.getActions = function () {
                    return _.map(item.actions);
                };
            },
            transformPool: function (item) {
                item.usagePercentage = Math.round(item.usedCapacityInBytes * 100 / item.capacityInBytes);
                item.usage = item.usagePercentage + '%';
                item.logicalUtilization = Math.round(item.usedCapacityInBytes * 100 / item.capacityInBytes); // In percentage
                item.capacityInBytes = diskSizeService.getDisplaySize(item.capacityInBytes);
                item.availableCapacityInBytes = diskSizeService.getDisplaySize(item.availableCapacityInBytes);
                item.usedCapacityInBytes = diskSizeService.getDisplaySize(item.usedCapacityInBytes);
                item.alerts = 0;
                item.tierNames = _.pluck(item.tiers, 'tier').join(', ');
                item.isUsingExternalStorage = function () {
                    return this.externalParityGroupIds && this.externalParityGroupIds.length > 0;
                };

                if (item.isUsingExternalStorage()) {
                    item.disabledCheckBox = true;
                }
                if (item.label.indexOf(constantService.prefixReservedStoragePool) === 0) {
                    item.disabledCheckBox = true;
                    item.isReservedPool = true;
                }

                var activeFlashTitle = '';
                if (_.find(item.tiers, function (tier) {
                        return tier.tier === 'Platinum';
                    })) {
                    item.containsPlatinum = true;
                    activeFlashTitle = synchronousTranslateService.translate('pool-active-flash') +
                        ': ' + commonConverterService.convertBooleanToString(item.activeFlashEnabled);
                }

                item.metaData = [
                    {
                        left: true,
                        title: item.label,
                        details: [item.storagePoolId]
                    },
                    {
                        left: false,
                        title: activeFlashTitle,
                        details: []
                    },
                    {
                        left: false,
                        title: synchronousTranslateService.translate(item.type),
                        details: [item.tierNames]
                    },
                    {
                        left: false,
                        title: synchronousTranslateService.translate('storage-pool-compression') + ': ' + synchronousTranslateService.translate(item.fmcCompressed),
                        details: []
                    },
                    {
                        left: true,
                        title: synchronousTranslateService.translate('storage-pool-monitoring') + ': ' + synchronousTranslateService.translate(item.monitoringMode),
                        details: []
                    }
                ];

                var icons = [];
                if (item.logicalUtilization >= item.utilizationThreshold1) {
                    var alertTitle = 'utilization at ' + item.logicalUtilization + '%';
                    if (item.logicalUtilization < item.utilizationThreshold2 && item.type !== 'HTI') {
                        icons.push({
                            icon: 'icon-small-triangle',
                            title: alertTitle
                        });

                        // The property is for list view
                        item.alertIcon = 'icon-small-triangle';
                    } else if (item.logicalUtilization >= item.utilizationThreshold2) {
                        icons.push({
                            icon: 'icon-small-diamond',
                            title: alertTitle
                        });
                        item.alertIcon = 'icon-small-diamond';
                    }

                    // The following properties are for list view
                    item.alertType = 'pool-alert';
                    item.alertTitle = alertTitle;
                }

                if (item.deduplicationEnabled) {
                    icons.push({
                        icon: 'icon-deduplication',
                        title: 'Deduplication Enabled'
                    });
                }

                item.getIcons = function () {
                    return icons;
                };
                item.topTotal = item.capacityInBytes;
                item.topSize = item.usedCapacityInBytes;
                if (_.first(item.tiers).tier === 'External') {
                    item.itemIcon = 'icon-external-pool';
                }
                else if (item.encrypted === 'YES') {
                    item.itemIcon = 'icon-encrypted-pools';
                } else {
                    item.itemIcon = 'icon-pools';
                }
                item.topPostFix = 'common-label-total';
                item.bottomPostFix = 'common-label-used';
                item.onClick = function () {
                    $location.path(['storage-systems', item.storageSystemId, 'storage-pools', item.storagePoolId]
                        .join('/'));
                };

                item.actions = {
                    'delete': {
                        icon: 'icon-delete',
                        type: 'confirm',
                        confirmTitle: 'storage-pool-delete-one-confirmation',
                        confirmMessage: 'storage-pool-delete-current-content',
                        enabled: function () {
                            return !item.disabledCheckBox;
                        },
                        onClick: function (orchestratorService, goback) {
                            orchestratorService.deleteStoragePool(item.storageSystemId, item.storagePoolId)
                                .then(function () {
                                    if (goback) {
                                        window.history.back();
                                    }
                                });

                        }
                    },
                    'edit': {
                        icon: 'icon-edit',
                        type: 'link',
                        enabled: function () {
                            return !item.disabledCheckBox;
                        },
                        onClick: function () {
                            $location.path(['storage-systems', item.storageSystemId,
                                'storage-pools', item.storagePoolId, 'update'
                            ].join('/'));
                        }
                    }
                };

                item.getActions = function () {
                    return _.map(item.actions);
                };

                item.alerts = 0;

                item.snapshotPoolLabelWithPoolId = function () {
                    if (item.storagePoolId === null) {
                        return item.label;
                    }
                    return String(item.storagePoolId) + ': ' + item.snapshotPoolLabel();
                };

                item.snapshotPoolLabel = function () {
                    if (item.storagePoolId === null) {
                        return item.label;
                    }

                    return [
                        item.label, ' (',
                        synchronousTranslateService.translate(item.type), ': ',
                        item.availableCapacityInBytes.size, ' ',
                        item.availableCapacityInBytes.unit, '/',
                        item.capacityInBytes.size, ' ',
                        item.capacityInBytes.unit, ')'
                    ].join('');
                };
            },
            transformExternalParityGroup: function (item) {
                var used = item.capacity - item.availableCapacity;
                item.usagePercentage = Math.round((used) * 100 / item.capacity);
                item.usage = item.usagePercentage + '%';
                item.free = diskSizeService.getDisplaySize(item.availableCapacity);
                item.total = diskSizeService.getDisplaySize(item.capacity);
                item.used = diskSizeService.getDisplaySize(used);
                item.capacity = diskSizeService.getDisplaySize(item.capacity);
                item.selected = false;
                item.noSelection = true;
                item.status = 'EXTERNALIZED';
                item.totalVirtual = item.capacity;
                if (item.externalStorageVendor === null) {
                    item.externalStorageVendor = '';
                }
                if (item.externalStorageProduct === null) {
                    item.externalStorageProduct = '';
                }
                item.metaData = [
                    {
                        left: true,
                        title: item.externalParityGroupId,
                        details: [item.externalStorageSystemId, item.externalStorageVendor + ' ' + item.externalStorageProduct]
                    }
                ];
                item.getIcons = function () {
                    return [];
                };

                item.actions = {};

                item.getActions = function () {
                    return _.map(item.actions);
                };

                item.itemIcon = 'icon-external-parity-group';
                item.topTotal = item.total;
                item.topSize = item.used;
                item.topPostFix = 'common-label-total';
                item.bottomPostFix = 'common-label-used';
            },
            transformPort: function (item) {
                var icons = [];
                if (item.securitySwitchEnabled) {
                    icons.push({
                        icon: 'icon-password',
                        title: 'Security Enabled'
                    });
                }

                item.getIcons = function () {
                    return icons;
                };
                item.metaData = [
                    {
                        left: true,
                        title: item.storagePortId,
                        details: metadataDetailsOfPort(item)
                    }
                ];

                if (constantService.isR800Series(item.storageSystemModel)) {
                    item.metaData[0].details.unshift(item.attributes[0]);
                }

                item.itemIcon = 'icon-ports';

                item.alerts = 0;

                switch (item.topology) {
                    case 'FABRIC_ON_ARB_LOOP':
                        item.fabric = 'On';
                        item.connectionType = 'FC-AL';
                        break;
                    case 'FABRIC_OFF_ARB_LOOP':
                        item.fabric = 'Off';
                        item.connectionType = 'FC-AL';
                        break;
                    case 'FABRIC_ON_POINT_TO_POINT':
                        item.fabric = 'On';
                        item.connectionType = 'P-to-P';
                        break;
                    case 'FABRIC_OFF_POINT_TO_POINT':
                        item.fabric = 'Off';
                        item.connectionType = 'P-to-P';
                        break;
                }

                var newAttributes = [];
                _.each(item.attributes, function (attribute) {
                    switch (attribute) {
                        case 'TARGET_PORT':
                            newAttributes.push('Target');
                            break;
                        case 'MCU_INITIATOR_PORT':
                            newAttributes.push('Initiator');
                            break;
                        case 'RCU_TARGET_PORT':
                            newAttributes.push('RCU Target');
                            break;
                        case 'EXTERNAL_INITIATOR_PORT':
                            newAttributes.push('External');
                            break;
                    }
                });
                item.attributes = newAttributes;
            },
            transformToPortSummary: function (storagePorts, typeNames) {
                // Only support for fibre port and iscsi port for now
                var filteredPorts = _.filter(storagePorts, function (sp) {
                    return sp.type === 'FIBRE' || sp.type === 'ISCSI';
                });

                var summaryModel = {chartData: []};
                var typeCount = _.countBy(filteredPorts, function (filteredPort) {
                    return filteredPort.type;
                });

                _.each(typeNames, function (typeName) {
                    if (typeCount[typeName.name]) {
                        summaryModel.chartData.push({
                            name: synchronousTranslateService.translate(typeName.name),
                            value: typeCount[typeName.name]
                        });
                    }
                });
                return summaryModel;
            },
            transformParityGroup: function (item) {
                var used = item.totalCapacityInBytes - item.availableCapacityInBytes - item.uninitializedCapacityInBytes;
                item.usagePercentage = Math.round((used) * 100 / item.totalCapacityInBytes);
                item.usage = item.usagePercentage + '%';
                item.free = diskSizeService.getDisplaySize(item.availableCapacityInBytes);
                item.uninitialized = diskSizeService.getDisplaySize(item.uninitializedCapacityInBytes);
                item.total = diskSizeService.getDisplaySize(item.totalCapacityInBytes);
                item.physicalCapacity = diskSizeService.getDisplaySize(item.physicalCapacityInBytes);
                item.used = diskSizeService.getDisplaySize(used);
                item.capacity = diskSizeService.getDisplaySize(item.capacity);
                item.diskSpec.speed = diskSizeService.getDisplaySpeed(item.diskSpec.speed);
                item.diskType = [item.diskSpec.type, item.diskSpec.speed].join(' ');
                item.raidType = [item.raidLevel, item.raidLayout].join(' ');
                var compressionPercent = parseInt(parseInt(item.physicalCapacityInBytes) / parseInt(item.totalCapacityInBytes) * 100);
                item.compressionUsageBar = {
                    physicalCapacity: item.physicalCapacity,
                    total: diskSizeService.getDisplaySize(item.totalCapacityInBytes),
                    tooltip: compressionPercent + '% ' + synchronousTranslateService.translate('storage-pool-physical-capacity'),
                    usagePercentage: compressionPercent
                };

                item.actions = {
                    'delete': {
                        icon: 'icon-delete',
                        tooltip: 'action-tooltip-delete',
                        type: 'confirm',
                        confirmTitle: 'parity-group-delete-confirmation',
                        confirmMessage: 'parity-group-delete-current-content',
                        enabled: function () {
                            return true;
                        },
                        onClick: function (orchestratorService, goback) {
                            orchestratorService.deleteParityGroup(item.storageSystemId, item.parityGroupId)
                                .then(function () {
                                    if (goback) {
                                        window.history.back();
                                    }
                                });

                        }
                    },
                    'initialize': {
                        icon: 'icon-initialize-pg',
                        tooltip: 'one-parity-group-initialize-tooltip',
                        type: 'confirm',
                        confirmTitle: 'parity-group-initialize-confirmation',
                        confirmMessage: 'parity-group-initialize-current-content',
                        enabled: function () {
                            return true;
                        },
                        onClick: function (orchestratorService, goback) {
                            orchestratorService.initializeParityGroup(item.storageSystemId, item.parityGroupId)
                                .then(function () {
                                    if (goback) {
                                        window.history.back();
                                    }
                                });

                        }
                    },
                    'compress': {
                        icon: 'icon-initialize-pg',
                        tooltip: 'one-parity-group-initialize-tooltip',
                        type: 'confirm',
                        confirmTitle: 'parity-group-initialize-confirmation',
                        confirmMessage: 'parity-group-initialize-current-content',
                        enabled: function () {
                            return true;
                        },
                        onClick: function (orchestratorService, goback) {
                            orchestratorService.compressParityGroup(item.storageSystemId, item.parityGroupId)
                                .then(function () {
                                    if (goback) {
                                        window.history.back();
                                    }
                                });

                        }
                    }
                };

                item.getActions = function () {
                    return _.map(item.actions);
                };

                var icons = [];
                if (item.compression) {
                    var compress = synchronousTranslateService.translate('parity-group-compress-enabled');
                    icons.push({
                        icon: 'icon-compression',
                        title: compress
                    });
                }
                item.getIcons = function () {
                    return icons;
                };

                item.metaData = [
                    {
                        left: true,
                        title: item.parityGroupId,
                        details: [item.status]
                    },
                    {
                        left: false,
                        title: item.diskType,
                        details: [item.raidType]
                    }
                ];

                if (item.encryption === true) {
                    item.itemIcon = 'icon-encrypted-parity-group';
                } else {
                    item.itemIcon = 'icon-parity-group';
                }
                item.topTotal = item.total;
                item.topSize = item.used;
                item.topPostFix = 'common-label-total';
                item.bottomPostFix = 'common-label-used';
                item.totalVirtual = item.totalVirtualCapacity;
                item.alerts = 0;
            },
            transformTiers: function (item) {
                item.tiers.forEach(function (tier) {
                    var subTierNames = [];
                    tier.subTiers.forEach(function (subtier) {
                        var subTierName = subtier.diskType;
                        if (subtier.speed !== 0) {
                            subTierName += ' ' + subtier.speed;
                        }
                        subTierNames[subTierNames.length] = subTierName;
                    });
                    tier.subTierNames = subTierNames.join(', ');
                });
            },

            transformFabricSwitch: function (item) {
                item.getIcons = function () {
                    return [];
                };

                var virtualFabricId = ' ';
                if (item.virtualFabricId && item.virtualFabricId.length > 0) {
                    virtualFabricId = synchronousTranslateService.translate('fabric-tile-virtual-fabric') + ' ' + item.virtualFabricId;
                }
                item.virtualFabricIdDisplay = virtualFabricId;

                item.metaData = [
                    {
                        left: true,
                        title: item.sanFabricId,
                        details: [virtualFabricId]
                    },
                    {
                        left: false,
                        title: item.switchType,
                        details: []
                    }
                ];

                item.detailMetaData = [
                    {
                        title: 'fabric-tile-switch-ip',
                        detailData: item.principalSwitchAddress
                    },
                    {
                        title: 'fabric-tile-switch-username',
                        detailData: item.principalSwitchUsername
                    }
                ];

                item.itemIcon = 'icon-fabric-switch';
                item.alerts = 0;
            },
            transformTierSummary: function (tiers, tierSummaryItems, model) {
                _.each(tiers.tiers, function (tier) {
                    var currentTier = _.find(tierSummaryItems, function (summary) {
                        return summary.tierName === tier.tier;
                    });
                    if (currentTier) {
                        var usedCapacity = currentTier.totalCapacity - currentTier.freeCapacity;
                        var percent = usedCapacity / currentTier.totalCapacity * 100;
                        var total = diskSizeService.getDisplaySize(currentTier.totalCapacity);
                        var used = diskSizeService.getDisplaySize(usedCapacity);
                        model.arrayDataVisualizationModel.tierBreakdown.push({
                            name: tier.tier,
                            percent: parseInt(percent),
                            toolTip: used.size + ' ' + used.unit + ' Used / ' + total.size + ' ' + total.unit + ' Total'
                        });
                    }
                    else {
                        model.arrayDataVisualizationModel.tierBreakdown.push({
                            name: tier.tier,
                            percent: 0,
                            toolTip: '0 GB Used / 0 GB Total'
                        });
                    }
                });
            },

            transformSavingsSummary: function (capacitySavingsSummary, model) {
                model.arrayDataVisualizationModel.savingsBreakdown.push({
                    name: synchronousTranslateService.translate('data-reduction-savings-ratio'),
                    savingsRatio: capacitySavingsSummary.dataReductionSavingsRate !== 0 ? capacitySavingsSummary.dataReductionSavingsRate + ' : 1' : ' - '
                });
                model.arrayDataVisualizationModel.savingsBreakdown.push({
                    name: synchronousTranslateService.translate('capacity-efficiency-savings-ratio'),
                    savingsRatio: capacitySavingsSummary.capacityEfficiencyRate !== 0 ? capacitySavingsSummary.capacityEfficiencyRate + ' : 1' : ' - '
                });
            },

            transformStorageSystemsSummary: function (item) {
                transformStorageSystemsSummary(item);
            },

            transformToStorageSummaryModel: function (item, file, dataProtection) {
                //TODO: EL Need to ask for correct tooltips and colors
                var breakdown = [];
                if (dataProtection) {
                    breakdown = [
                        {
                            capacity: diskSizeService.getDisplaySize(dataProtection.protectedCapacity),
                            tooltip: (function (key) {
                                var protectedCapacityObject = diskSizeService.getDisplaySize(dataProtection.protectedCapacity);
                                var protectedCapacityAmount = protectedCapacityObject.size + protectedCapacityObject.unit;
                                var variable = {
                                    protectedCapacity: protectedCapacityAmount
                                };
                                return synchronousTranslateService.translate(key, variable);
                            })('protected-capacity-tooltip'),
                            label: (function (key) {
                                return synchronousTranslateService.translate(key);
                            })('common-label-protected')
                        },
                        {
                            capacity: diskSizeService.getDisplaySize(dataProtection.unprotectedCapacity),
                            tooltip: (function (key) {
                                var unprotectedCapacityObject = diskSizeService.getDisplaySize(dataProtection.unprotectedCapacity);
                                var unprotectedCapacityAmount = unprotectedCapacityObject.size + unprotectedCapacityObject.unit;
                                var variable = {
                                    unprotectedCapacity: unprotectedCapacityAmount
                                };
                                return synchronousTranslateService.translate(key, variable);
                            })('unprotected-capacity-tooltip'),
                            label: (function (key) {
                                return synchronousTranslateService.translate(key);
                            })('common-label-unprotected')
                        },
                        {
                            capacity: diskSizeService.getDisplaySize(dataProtection.secondaryCapacity),
                            tooltip: (function (key) {
                                var secondaryCapacityObject = diskSizeService.getDisplaySize(dataProtection.secondaryCapacity);
                                var secondaryCapacityAmount = secondaryCapacityObject.size + secondaryCapacityObject.unit;
                                var variable = {
                                    secondaryCapacity: secondaryCapacityAmount
                                };
                                return synchronousTranslateService.translate(key, variable);
                            })('secondary-capacity-tooltip'),
                            label: (function (key) {
                                return synchronousTranslateService.translate(key);
                            })('common-label-secondary')
                        }
                    ];
                }
                if (file) {
                    var unifiedItems = [
                        [
                            {
                                capacity: diskSizeService.getDisplaySize(file.physicalCapacity),
                                tooltip: (function (key) {
                                    var physicalCapacityObject = diskSizeService.getDisplaySize(file.physicalCapacity);
                                    var physicalCapacityAmount = physicalCapacityObject.size + physicalCapacityObject.unit;
                                    var variable = {
                                        filePhysicalCapacity: physicalCapacityAmount
                                    };
                                    return synchronousTranslateService.translate(key, variable);
                                })('file-physical-capacity-tooltip'),
                                label: (function (key) {
                                    return synchronousTranslateService.translate(key);
                                })('common-label-file-physical-capacity'),
                                color: physicalCapacityColor
                            },
                            {
                                label: (function (key) {
                                    return synchronousTranslateService.translate(key);
                                })('common-label-allocated'),
                                tooltip: (function (key) {
                                    var poolCapacityAmount = item.poolCapacity.size + item.poolCapacity.unit;
                                    var variable = {
                                        allocatedCapacity: poolCapacityAmount
                                    };
                                    return synchronousTranslateService.translate(key, variable);
                                })('allocated-capacity-tooltip'),
                                capacity: item.poolCapacity,
                                color: allocatedColor
                            },
                            {
                                label: (function (key) {
                                    return synchronousTranslateService.translate(key);
                                })('common-label-unallocated'),
                                tooltip: (function (key) {
                                    var unallocatedToPoolsCapacityAmount = item.unallocatedToPoolsCapacity.size + item.unallocatedToPoolsCapacity.unit;
                                    var variable = {
                                        unallocatedCapacity: unallocatedToPoolsCapacityAmount
                                    };
                                    return synchronousTranslateService.translate(key, variable);
                                })('unallocated-capacity-tooltip'),
                                capacity: item.unallocatedToPoolsCapacity,
                                legendDisplay: item.unallocatedToPoolsCapacity,
                                color: unallocatedColor
                            }
                        ],
                        [
                            {
                                capacity: item.physicalUsed,
                                label: (function (key) {
                                    return synchronousTranslateService.translate(key);
                                })('common-label-used'),
                                tooltip: (function (key) {
                                    var usedCapacityObject = item.physicalUsed;
                                    var usedCapacityAmount = usedCapacityObject.size + usedCapacityObject.unit;
                                    var variable = {
                                        usedCapacity: usedCapacityAmount
                                    };
                                    return synchronousTranslateService.translate(key, variable);
                                })('used-capacity-tooltip'),
                                breakdownLabel: (function (key) {
                                    return synchronousTranslateService.translate(key);
                                })('common-label-used-breakdown'),
                                color: thinUsedColor,
                                breakdown: [
                                    {
                                        capacity: diskSizeService.getDisplaySize(dataProtection.protectedCapacity),
                                        tooltip: (function (key) {
                                            var protectedCapacityObject = diskSizeService.getDisplaySize(dataProtection.protectedCapacity);
                                            var protectedCapacityAmount = protectedCapacityObject.size + protectedCapacityObject.unit;
                                            var variable = {
                                                protectedCapacity: protectedCapacityAmount
                                            };
                                            return synchronousTranslateService.translate(key, variable);
                                        })('protected-capacity-tooltip'),
                                        label: (function (key) {
                                            return synchronousTranslateService.translate(key);
                                        })('common-label-protected')
                                    },
                                    {
                                        capacity: diskSizeService.getDisplaySize(dataProtection.unprotectedCapacity),
                                        tooltip: (function (key) {
                                            var unprotectedCapacityObject = diskSizeService.getDisplaySize(dataProtection.unprotectedCapacity);
                                            var unprotectedCapacityAmount = unprotectedCapacityObject.size + unprotectedCapacityObject.unit;
                                            var variable = {
                                                unprotectedCapacity: unprotectedCapacityAmount
                                            };
                                            return synchronousTranslateService.translate(key, variable);
                                        })('unprotected-capacity-tooltip'),
                                        label: (function (key) {
                                            return synchronousTranslateService.translate(key);
                                        })('common-label-unprotected')
                                    },
                                    {
                                        capacity: diskSizeService.getDisplaySize(dataProtection.secondaryCapacity),
                                        tooltip: (function (key) {
                                            var secondaryCapacityObject = diskSizeService.getDisplaySize(dataProtection.secondaryCapacity);
                                            var secondaryCapacityAmount = secondaryCapacityObject.size + secondaryCapacityObject.unit;
                                            var variable = {
                                                secondaryCapacity: secondaryCapacityAmount
                                            };
                                            return synchronousTranslateService.translate(key, variable);
                                        })('secondary-capacity-tooltip'),
                                        label: (function (key) {
                                            return synchronousTranslateService.translate(key);
                                        })('common-label-secondary')
                                    }
                                ]
                            },
                            {
                                capacity: item.physicalFree,
                                label: (function (key) {
                                    return synchronousTranslateService.translate(key);
                                })('common-label-free'),
                                tooltip: (function (key) {
                                    var freeCapacityObject = item.physicalFree;
                                    var freeCapacityAmount = freeCapacityObject.size + freeCapacityObject.unit;
                                    var variable = {
                                        freeCapacity: freeCapacityAmount
                                    };
                                    return synchronousTranslateService.translate(key, variable);
                                })('free-capacity-tooltip'),
                                legendDisplay: item.physicalFree,
                                color: thinFreeColor
                            },
                            {
                                label: (function (key) {
                                    return synchronousTranslateService.translate(key);
                                })('common-label-file-pool-used'),
                                tooltip: (function (key) {
                                    var usedCapacityObject = diskSizeService.getDisplaySize(file.usedCapacity);
                                    var usedCapacityAmount = usedCapacityObject.size + usedCapacityObject.unit;
                                    var variable = {
                                        fileUsedCapacity: usedCapacityAmount
                                    };
                                    return synchronousTranslateService.translate(key, variable);
                                })('file-used-capacity-tooltip'),
                                capacity: diskSizeService.getDisplaySize(file.usedCapacity),
                                color: fileUsedCapacityColor
                            }
                        ],
                        [
                            {
                                percentage: item.subscribedCapacityPercentage,
                                tooltip: (function (key) {
                                    var subscribedCapacityAmount = item.subscribedCapacityPercentage.toString() + '%';
                                    var variable = {
                                        subscribedCapacity: subscribedCapacityAmount
                                    };
                                    return synchronousTranslateService.translate(key, variable);
                                })('subscription-capacity-tooltip'),
                                label: (function (key) {
                                    return synchronousTranslateService.translate(key);
                                })('common-label-subscription'),
                                color: subscribedCapacityColor
                            },
                            {
                                capacity: diskSizeService.getDisplaySize(item.totalUsableCapacity),
                                tooltip: (function (key) {
                                    var physicalCapacityObject = diskSizeService.getDisplaySize(item.totalUsableCapacity);
                                    var physicalCapacityAmount = physicalCapacityObject.size + physicalCapacityObject.unit;
                                    var variable = {
                                        physicalCapacity: physicalCapacityAmount
                                    };
                                    return synchronousTranslateService.translate(key, variable);
                                })('physical-capacity-tooltip'),
                                label: (function (key) {
                                    return synchronousTranslateService.translate(key);
                                })('common-label-physical-capacity'),
                                color: availableParityGroupCapacityColor
                            }
                        ]
                    ];
                }
                var blockItems = [
                    [
                        {
                            capacity: item.poolCapacity,
                            label: (function (key) {
                                return synchronousTranslateService.translate(key);
                            })('common-label-allocated'),
                            tooltip: (function (key) {
                                var allocatedCapacityObject = item.poolCapacity;
                                var allocatedCapacityAmount = allocatedCapacityObject.size + allocatedCapacityObject.unit;
                                var variable = {
                                    allocatedCapacity: allocatedCapacityAmount
                                };
                                return synchronousTranslateService.translate(key, variable);
                            })('allocated-capacity-tooltip'),
                            color: allocatedColor
                        },
                        {
                            capacity: item.unallocatedToPoolsCapacity,
                            label: (function (key) {
                                return synchronousTranslateService.translate(key);
                            })('common-label-unallocated'),
                            tooltip: (function (key) {
                                var unallocatedCapacityObject = item.unallocatedToPoolsCapacity;
                                var unallocatedCapacityAmount = unallocatedCapacityObject.size + unallocatedCapacityObject.unit;
                                var variable = {
                                    unallocatedCapacity: unallocatedCapacityAmount
                                };
                                return synchronousTranslateService.translate(key, variable);
                            })('unallocated-capacity-tooltip'),
                            legendDisplay: item.unallocatedToPoolsCapacity,
                            color: unallocatedColor
                        }
                    ],
                    [
                        {
                            capacity: item.physicalUsed,
                            label: (function (key) {
                                return synchronousTranslateService.translate(key);
                            })('common-label-used'),
                            tooltip: (function (key) {
                                var usedCapacityObject = item.physicalUsed;
                                var usedCapacityAmount = usedCapacityObject.size + usedCapacityObject.unit;
                                var variable = {
                                    usedCapacity: usedCapacityAmount
                                };
                                return synchronousTranslateService.translate(key, variable);
                            })('used-capacity-tooltip'),
                            breakdownLabel: (function (key) {
                                return synchronousTranslateService.translate(key);
                            })('common-label-used-breakdown'),
                            breakdown: breakdown,
                            color: thinUsedColor
                        },
                        {
                            capacity: item.physicalFree,
                            label: (function (key) {
                                return synchronousTranslateService.translate(key);
                            })('common-label-free'),
                            tooltip: (function (key) {
                                var freeCapacityObject = item.physicalFree;
                                var freeCapacityAmount = freeCapacityObject.size + freeCapacityObject.unit;
                                var variable = {
                                    freeCapacity: freeCapacityAmount
                                };
                                return synchronousTranslateService.translate(key, variable);
                            })('free-capacity-tooltip'),
                            legendDisplay: item.physicalFree,
                            color: thinFreeColor
                        }
                    ],
                    [
                        {
                            percentage: item.subscribedCapacityPercentage,
                            tooltip: (function (key) {
                                var subscribedCapacityAmount = item.subscribedCapacityPercentage.toString() + '%';
                                var variable = {
                                    subscribedCapacity: subscribedCapacityAmount
                                };
                                return synchronousTranslateService.translate(key, variable);
                            })('subscription-capacity-tooltip'),
                            label: (function (key) {
                                return synchronousTranslateService.translate(key);
                            })('common-label-subscription'),
                            color: subscribedCapacityColor
                        },
                        {
                            capacity: diskSizeService.getDisplaySize(item.totalUsableCapacity),
                            tooltip: (function (key) {
                                var physicalCapacityObject = diskSizeService.getDisplaySize(item.totalUsableCapacity);
                                var physicalCapacityAmount = physicalCapacityObject.size + physicalCapacityObject.unit;
                                var variable = {
                                    physicalCapacity: physicalCapacityAmount
                                };
                                return synchronousTranslateService.translate(key, variable);
                            })('physical-capacity-tooltip'),
                            label: (function (key) {
                                return synchronousTranslateService.translate(key);
                            })('common-label-physical-capacity'),
                            color: availableParityGroupCapacityColor
                        }
                    ]
                ];
                if (file) {
                    var fileItems = [
                        [
                            {
                                capacity: item.poolCapacity,
                                label: (function (key) {
                                    return synchronousTranslateService.translate(key);
                                })('common-label-allocated'),
                                tooltip: (function (key) {
                                    var allocatedCapacityObject = item.poolCapacity;
                                    var allocatedCapacityAmount = allocatedCapacityObject.size + allocatedCapacityObject.unit;
                                    var variable = {
                                        allocatedCapacity: allocatedCapacityAmount
                                    };
                                    return synchronousTranslateService.translate(key, variable);
                                })('allocated-capacity-tooltip'),
                                color: allocatedColor
                            },
                            {
                                label: (function (key) {
                                    return synchronousTranslateService.translate(key);
                                })('common-label-unallocated'),
                                tooltip: (function (key) {
                                    var unallocatedCapacityObject = item.unallocatedToPoolsCapacity;
                                    var unallocatedCapacityAmount = unallocatedCapacityObject.size + unallocatedCapacityObject.unit;
                                    var variable = {
                                        unallocatedCapacity: unallocatedCapacityAmount
                                    };
                                    return synchronousTranslateService.translate(key, variable);
                                })('unallocated-capacity-tooltip'),
                                capacity: item.unallocatedToPoolsCapacity,
                                legendDisplay: item.unallocatedToPoolsCapacity,
                                color: unallocatedColor
                            }
                        ],
                        [
                            {
                                label: (function (key) {
                                    return synchronousTranslateService.translate(key);
                                })('common-label-file-pool-used'),
                                tooltip: (function (key) {
                                    var usedCapacityObject = diskSizeService.getDisplaySize(file.usedCapacity);
                                    var usedCapacityAmount = usedCapacityObject.size + usedCapacityObject.unit;
                                    var variable = {
                                        fileUsedCapacity: usedCapacityAmount
                                    };
                                    return synchronousTranslateService.translate(key, variable);
                                })('file-used-capacity-tooltip'),
                                capacity: diskSizeService.getDisplaySize(file.usedCapacity),
                                breakdown: 'none',
                                color: fileUsedCapacityColor
                            },
                            {
                                label: (function (key) {
                                    return synchronousTranslateService.translate(key);
                                })('common-label-file-physical-capacity'),
                                tooltip: (function (key) {
                                    var physicalCapacityObject = diskSizeService.getDisplaySize(file.physicalCapacity);
                                    var physicalCapacityAmount = physicalCapacityObject.size + physicalCapacityObject.unit;
                                    var variable = {
                                        filePhysicalCapacity: physicalCapacityAmount
                                    };
                                    return synchronousTranslateService.translate(key, variable);
                                })('file-physical-capacity-tooltip'),
                                capacity: diskSizeService.getDisplaySize(file.physicalCapacity),
                                color: fileFreeCapacityColor
                            },
                            {
                                percentage: parseInt(file.physicalCapacity > 0 ? file.overcommitCapacity * 100 / file.physicalCapacity : 0),
                                capacity: diskSizeService.getDisplaySize(file.overcommitCapacity),
                                tooltip: (function (key) {
                                    var overcommitCapacityObject = diskSizeService.getDisplaySize(file.overcommitCapacity);
                                    var overcommitCapacityAmount = overcommitCapacityObject.size + overcommitCapacityObject.unit;
                                    var variable = {
                                        overcommitCapacity: overcommitCapacityAmount
                                    };
                                    return synchronousTranslateService.translate(key, variable);
                                })('overcommit-capacity-tooltip'),
                                label: (function (key) {
                                    return synchronousTranslateService.translate(key);
                                })('common-label-overcommit'),
                                color: overCommitColor
                            }
                        ]
                    ];
                }

                return {
                    arrayDataVisualizationModel: {
                        tiersBreakdownLabel: (function (key) {
                            return synchronousTranslateService.translate(key);
                        })('common-label-tier-breakdown'),
                        savingsBreakdownLabel: (function (key) {
                            return synchronousTranslateService.translate(key);
                        })('common-label-savings-breakdown'),
                        showTiersBreakDown: function () {
                            this.tiers = true;
                            this.savings = false;
                            this.protection = false;
                        },
                        showProtectionBreakDown: function () {
                            this.protection = true;
                            this.tiers = false;
                            this.savings = false;
                        },
                        showSavingsBreakDown: function () {
                            this.savings = true;
                            this.tiers = false;
                            this.protection = false;
                        },
                        switchToUnified: function () {
                            this.view = 'unified';
                            this.items = unifiedItems;
                        },
                        switchToBlock: function () {
                            this.view = 'block';
                            this.items = blockItems;
                        },
                        switchToFile: function () {
                            this.view = 'file';
                            this.tiers = true;
                            this.items = fileItems;
                        },
                        tiers: true,
                        protection: false,
                        savings: false,
                        view: 'block',
                        unified: item.unified,
                        total: {
                            label: (function (key) {
                                return synchronousTranslateService.translate(key);
                            })('common-label-total'),
                            tooltip: (function (key) {
                                return synchronousTranslateService.translate(key);
                            })('total-usable-capacity-tooltip'),
                            capacity: item.total
                        },
                        tierBreakdown: [],
                        savingsBreakdown: [],
                        items: blockItems
                    },
                    alerts: {
                        capacity: {
                            count: 0,
                            level: 'healthy'
                        },
                        dp: {
                            count: 0,
                            level: 'healthy'
                        },
                        hardware: {
                            count: 0,
                            level: 'healthy'
                        },
                        jobs: {
                            successCount: 0,
                            successWithErrorCount: 0,
                            failedCount: 0,
                            level: 'healthy'
                        }
                    },
                    summary: {
                        storageArraysCount: item.storageSystemCount,
                        hostsCount: 0,
                        templatesCount: 0
                    }
                };
            },
            transformHost: function (item) {
                var types = [];
                _.each(item.dataProtectionSummary.replicationType, function (type) {
                    types.push(replicationService.displayReplicationType(type));
                });

                item.displayedDpType = types.join(', ');

                item.getIcons = function () {
                    return [];
                };

                item.serverLabel = 'Host' + item.serverId;
                item.onClick = function () {
                    $location.path(['hosts', item.serverId].join('/'));
                };

                if (_.isUndefined(item.attachedVolumeCount) || _.isNaN(item.attachedVolumeCount)) {
                    item.attachedVolumeCount = 0;
                }
                item.status = item.attachedVolumeCount > 0 ? 'Provisioned' : 'Not Provisioned';

                item.actions = {
                    'delete': {
                        icon: 'icon-delete',
                        type: 'confirm',
                        confirmTitle: 'host-delete-confirmation',
                        confirmMessage: 'host-delete-currect-content',
                        enabled: function () {
                            return true;
                        },
                        onClick: function (orchestratorService, goback) {
                            orchestratorService.deleteHost(item.serverId).then(function () {
                                if (goback) {
                                    window.history.back();
                                }
                            });

                        }
                    },
                    'edit': {
                        icon: 'icon-edit',
                        type: 'link',
                        onClick: function () {
                            $location.path(['hosts', item.serverId, 'update'].join('/'));
                        },
                        enabled: function () {
                            return true;
                        }
                    },
                    'attach': {
                        icon: 'icon-attach-volume',
                        type: 'dropdown',
                        enabled: function () {
                            return true;
                        },
                        items: [
                            {
                                type: 'link',
                                title: 'host-attach-existing-volumes',
                                onClick: function () {
                                    ShareDataService.push('selectedServers', [item]);
                                    $location.path('/hosts/attach-volumes');
                                }
                            },
                            {
                                type: 'link',
                                title: 'host-create-attach-protect-volumes',
                                onClick: function () {
                                    ShareDataService.push('selectedServers', [item]);
                                    $location.path('hosts/create-and-attach-volumes');
                                }
                            }
                        ]
                    }
                };

                item.getActions = function () {
                    return _.map(item.actions);
                };

                if (item.dpStatus === 'Failed') {
                    item.alertType = 'alert-link';
                    item.alertLink = {
                        icon: 'icon-small-diamond',
                        title: 'Data Protection Failed.',
                        onClick: function () {
                            var path = ['data-protection-monitoring'].join('/');
                            $location.path(path);
                        }
                    };
                }

                item.getIcons = function () {
                    return [this.alertLink];
                };

                item.osTypeDisplayValue = synchronousTranslateService.translate('host-mode-' + item
                    .osType);

                item.protocolDisplayValue = synchronousTranslateService.translate(item.protocol);

                item.metaData = [{
                    left: true,
                    title: item.serverId,
                    details: [item.serverName, item.ipAddress, item.protocolDisplayValue]
                }, {
                    left: false,
                    title: item.osTypeDisplayValue,
                    details: [item.displayedDpType],
                    detailsToolTips: [_.map(item.dataProtectionSummary.replicationType, function (type) {
                        return replicationService.tooltip(type);
                    }).join(', ')]
                }];

                item.itemIcon = 'icon-host';
                item.alerts = 0;


                if(item.protocol === 'FIBRE') {
                    item.endPoints = item.wwpns;
                } else if (item.protocol === 'ISCSI') {
                    item.endPoints = item.iscsiNames;
                }

                item.displayWWNs = item.wwpns ? wwnService.displayWWNs(item.wwpns) : undefined;
                item.displayIscsiNames = item.iscsiNames ? item.iscsiNames : undefined;
            },
            transformHostGroups: function (item) {
                if(item.protocol==='FIBRE') {
                    item.endPoints = item.hbaWwns;
                } else if(item.protocol==='ISCSI' && item.iscsiTargetInformation) {
                    item.endPoints = item.iscsiTargetInformation.iscsiInitiatorNames;
                }
            },
            transformFailedServer: function (item) {
                var types = [];
                _.each(item.dataProtectionSummary.replicationType, function (type) {
                    types.push(replicationService.displayReplicationType(type));
                });

                item.displayedDpType = types.join(', ');

                item.onClick = function () {
                    $location.path(['hosts', item.serverId].join('/'));
                };
                item.osTypeDisplayValue = synchronousTranslateService.translate('host-mode-' + item.osType);

                item.metaData = [{
                    left: true,
                    title: item.serverId,
                    details: [item.serverName, item.ipAddress, item.attachedVolumeCount + ' volume(s)']
                }, {
                    left: false,
                    title: item.osTypeDisplayValue,
                    details: [item.displayedDpType]
                }];

                item.itemIcon = 'icon-host';

                item.displayWWNs = wwnService.displayWWNs(item.wwpns);

                item.actions = {
                    'delete': {
                        onClick: function (orchestratorService, goback) {
                            orchestratorService.deleteHost(item.serverId).then(function () {
                                if (goback) {
                                    window.history.back();
                                }
                            });
                        }
                    },
                    'edit': {
                        onClick: function () {
                            $location.path(['hosts', item.serverId, 'update'].join('/'));
                        }
                    }
                };
            },
            transformToCreateVolumeSummaryModel: function (storageSystem) {
                return {
                    arrayDataVisualizationModel: {
                        total: {
                            label: (function (key) {
                                return synchronousTranslateService.translate(key);
                            })('common-label-total'),
                            capacity: diskSizeService.getDisplaySize(storageSystem.totalUsableCapacity)
                        },
                        items: [[
                            {
                                label: (function (key) {
                                    return synchronousTranslateService.translate(key);
                                })('common-label-subscription'),
                                tooltip: (function (key) {
                                    var subscribedCapacityAmount = storageSystem.subscribedCapacityPercentage.toString() + '%';
                                    var variable = {
                                        subscribedCapacity: subscribedCapacityAmount
                                    };
                                    return synchronousTranslateService.translate(key, variable);
                                })('subscription-capacity-tooltip'),
                                percentage: storageSystem.subscribedCapacityPercentage,
                                capacity: diskSizeService.getDisplaySize(storageSystem.subscribedCapacity),
                                color: subscribedCapacityColor
                            },
                            {
                                label: (function (key) {
                                    return synchronousTranslateService.translate(key);
                                })('common-label-physical-capacity'),
                                tooltip: (function (key) {
                                    var physicalCapacityObject = diskSizeService.getDisplaySize(storageSystem.totalUsableCapacity);
                                    var physicalCapacityAmount = physicalCapacityObject.size + physicalCapacityObject.unit;
                                    var variable = {
                                        physicalCapacity: physicalCapacityAmount
                                    };
                                    return synchronousTranslateService.translate(key, variable);
                                })('physical-capacity-tooltip'),
                                capacity: diskSizeService.getDisplaySize(storageSystem.totalUsableCapacity),
                                color: unallocatedColor
                            }
                        ]]
                    }
                };
            },
            transformToHostSummaryModel: function (totalVolumesCapacity, usedVolumesCapacity, availableVolumesCapacity) {
                var items = [];
                var totalCapacity = diskSizeService.getDisplaySize(totalVolumesCapacity),
                    usedCapacity = diskSizeService.getDisplaySize(usedVolumesCapacity),
                    availableCapacity = diskSizeService.getDisplaySize(availableVolumesCapacity);

                items.push(capacity(usedCapacity, availableCapacity));

                return {
                    arrayDataVisualizationModel: {
                        total: {
                            label: (function (key) {
                                return synchronousTranslateService.translate(key);
                            })('common-label-total'),
                            capacity: totalCapacity
                        },
                        items: items
                    },
                    alerts: {
                        capacity: {
                            count: 0,
                            level: 'healthy'
                        },
                        dp: {
                            count: 0,
                            level: 'healthy'
                        },
                        hardware: {
                            count: 0,
                            level: 'healthy'
                        },
                        jobs: {
                            successCount: 0,
                            successWithErrorCount: 0,
                            failedCount: 0,
                            level: 'healthy'
                        }
                    }
                };
            },
            transformToDpSummaryModel: function () {
                return {
                    alerts: {
                        capacity: {
                            count: 0,
                            level: 'healthy'
                        },
                        dp: {
                            count: 0,
                            hostCount: 0,
                            volumeCount: 0,
                            level: 'healthy'
                        },
                        hardware: {
                            count: 0,
                            level: 'healthy'
                        },
                        jobs: {
                            successCount: 0,
                            successWithErrorCount: 0,
                            failedCount: 0,
                            level: 'healthy'
                        }
                    }
                };
            },

            transformToBreakdownSummary: function (item) {
                return {
                    arrayDataVisualizationModel: {
                        items: [
                            {
                                used: {
                                    breakdownLabel: (function (key) {
                                        return synchronousTranslateService.translate(key);
                                    })('common-label-used-breakdown'),
                                    breakdown: [
                                        {
                                            capacity: diskSizeService.getDisplaySize(item.protectedCapacity),
                                            tooltip: (function (key) {
                                                var protectedCapacityObject = diskSizeService.getDisplaySize(item.protectedCapacity);
                                                var protectedCapacityAmount = protectedCapacityObject.size + protectedCapacityObject.unit;
                                                var variable = {
                                                    protectedCapacity: protectedCapacityAmount
                                                };
                                                return synchronousTranslateService.translate(key, variable);
                                            })('protected-capacity-tooltip'),
                                            label: (function (key) {
                                                return synchronousTranslateService.translate(key);
                                            })('common-label-protected')
                                        },
                                        {
                                            capacity: diskSizeService.getDisplaySize(item.unprotectedCapacity),
                                            tooltip: (function (key) {
                                                var unprotectedCapacityObject = diskSizeService.getDisplaySize(item.unprotectedCapacity);
                                                var unprotectedCapacityAmount = unprotectedCapacityObject.size + unprotectedCapacityObject.unit;
                                                var variable = {
                                                    unprotectedCapacity: unprotectedCapacityAmount
                                                };
                                                return synchronousTranslateService.translate(key, variable);
                                            })('unprotected-capacity-tooltip'),
                                            label: (function (key) {
                                                return synchronousTranslateService.translate(key);
                                            })('common-label-unprotected')
                                        },
                                        {
                                            capacity: diskSizeService.getDisplaySize(item.secondaryCapacity),
                                            tooltip: (function (key) {
                                                var secondaryCapacityObject = diskSizeService.getDisplaySize(item.secondaryCapacity);
                                                var secondaryCapacityAmount = secondaryCapacityObject.size + secondaryCapacityObject.unit;
                                                var variable = {
                                                    secondaryCapacity: secondaryCapacityAmount
                                                };
                                                return synchronousTranslateService.translate(key, variable);
                                            })('secondary-capacity-tooltip'),
                                            label: (function (key) {
                                                return synchronousTranslateService.translate(key);
                                            })('common-label-secondary')
                                        }
                                    ]
                                }
                            },
                            {
                                used: {
                                    label: (function (key) {
                                        return synchronousTranslateService.translate(key);
                                    })('common-label-allocated'),
                                    tooltip: (function (key) {
                                        return synchronousTranslateService.translate(key);
                                    })('allocated-capacity-tooltip'),
                                    capacity: item.poolCapacity
                                },
                                free: {
                                    label: (function (key) {
                                        return synchronousTranslateService.translate(key);
                                    })('common-label-unallocated'),
                                    tooltip: (function (key) {
                                        return synchronousTranslateService.translate(key);
                                    })('unallocated-capacity-tooltip'),
                                    capacity: item.unallocatedToPoolsCapacity
                                }
                            },
                            {
                                used: {
                                    percentage: item.subscribedCapacityPercentage,
                                    percentageCapacity: diskSizeService.getDisplaySize(item.subscribedCapacity),
                                    tooltip: (function (key) {
                                        return synchronousTranslateService.translate(key);
                                    })('subscription-capacity-tooltip'),
                                    label: (function (key) {
                                        return synchronousTranslateService.translate(key);
                                    })('common-label-subscription')
                                }

                            }
                        ]
                    }
                };

            },
            transformToSummaryByTypeModel: function (item) {
                item.totalCapacity = diskSizeService.getDisplaySize(item.totalCapacity);
                item.usedCapacity = diskSizeService.getDisplaySize(item.usedCapacity);
                item.availableCapacity = diskSizeService.getDisplaySize(item.availableCapacity);

                var items = [];
                items.push(capacity(item.usedCapacity, item.availableCapacity));

                if (item.type !== 'HTI') {
                    items.push([
                        {
                            percentage: (item.totalCapacity.value === 0) ? 0 : Math.round(
                                item.usedSubscribedCapacity * 100 / item.totalCapacity.value
                            ),
                            label: (function (key) {
                                return synchronousTranslateService.translate(key);
                            })('common-label-subscription'),
                            color: subscribedCapacityColor,
                            tooltip: (function (key) {
                                var percentageValue = (item.totalCapacity.value === 0) ? 0 : Math.round(
                                    item.usedSubscribedCapacity * 100 / item.totalCapacity.value);
                                var subscribedCapacityAmount = percentageValue + '%';
                                var variable = {
                                    subscribedCapacity: subscribedCapacityAmount
                                };
                                return synchronousTranslateService.translate(key, variable);
                            })('subscription-capacity-tooltip')
                        },
                        {
                            percentage: 100,
                            color: unallocatedColor
                        }
                    ]);
                }
                return {
                    total: {
                        label: synchronousTranslateService.translate(item.poolType),
                        capacity: item.totalCapacity
                    },
                    items: items
                };

            },
            transformToPoolSummaryModel: function (item) {
                item.totalCapacity = diskSizeService.getDisplaySize(item.totalCapacity);
                item.usedCapacity = diskSizeService.getDisplaySize(item.usedCapacity);
                item.availableCapacity = diskSizeService.getDisplaySize(item.availableCapacity);

                var items = [];
                items.push(capacity(item.usedCapacityInBytes, item.availableCapacityInBytes));

                var tierInfos = [];
                if (item.type === 'HDT') {
                    _.each(item.tiers, function (tier) {
                        var usedPercentage = tier.usedCapacity / tier.capacity * 100;
                        tierInfos.push({
                            tierName: tier.tier,
                            total: {
                                label: (function (key) {
                                    return synchronousTranslateService.translate(key);
                                })('common-label-total'),
                                capacity: diskSizeService.getDisplaySize(tier.capacity)
                            },
                            used: {
                                label: (function (key) {
                                    return synchronousTranslateService.translate(key);
                                })('common-label-tier-used'),
                                capacity: diskSizeService.getDisplaySize(tier.usedCapacity)
                            },
                            item: [
                                {
                                    percentage: usedPercentage.toFixed(1),
                                    label: (function (key) {
                                        return synchronousTranslateService.translate(key);
                                    })(usedPercentage),
                                    tooltip: (function (key) {
                                        return synchronousTranslateService.translate(key);
                                    })(usedPercentage + '%'),
                                    color: allocatedColor
                                },
                                {
                                    percentage: 100,
                                    color: unallocatedColor
                                }
                            ],
                            newPageAssignment: tier.bufferSpace.newPageAssignment,
                            tierRelocation: tier.bufferSpace.tierRelocation,
                            performanceUtilization: tier.performanceUtilization
                        });
                    });
                }

                if (item.type !== 'HTI') {
                    items.push([
                        {
                            percentage: item.usedSubscription,
                            label: (function (key) {
                                return synchronousTranslateService.translate(key);
                            })('common-label-subscription'),
                            tooltip: (function (key) {
                                var subscribedCapacityAmount = item.usedSubscription.toString() + '%';
                                var variable = {
                                    subscribedCapacity: subscribedCapacityAmount
                                };
                                return synchronousTranslateService.translate(key, variable);
                            })('subscription-capacity-tooltip'),
                            color: subscribedCapacityColor
                        },
                        {
                            percentage: item.subscriptionLimit.value ? item.subscriptionLimit.value : 100,
                            color: unallocatedColor
                        }
                    ]);
                }
                return {
                    arrayDataVisualizationModel: {
                        total: {
                            label: (function (key) {
                                return synchronousTranslateService.translate(key);
                            })('common-label-total'),
                            capacity: item.capacityInBytes
                        },
                        items: items
                    },
                    dataVisualizationModel: {
                        items: tierInfos
                    },
                    alerts: {
                        capacity: {
                            count: 0,
                            level: 'healthy'
                        },
                        dp: {
                            count: 0,
                            level: 'healthy'
                        },
                        hardware: {
                            count: 0,
                            level: 'healthy'
                        },
                        jobs: {
                            successCount: 0,
                            successWithErrorCount: 0,
                            failedCount: 0,
                            level: 'healthy'
                        }
                    }
                };
            },
            transformToParityGroupSummaryModel: function () {

                return {

                    alerts: {
                        capacity: {
                            count: 0,
                            level: 'healthy'
                        },
                        dp: {
                            count: 0,
                            level: 'healthy'
                        },
                        hardware: {
                            count: 0,
                            level: 'healthy'
                        },
                        jobs: {
                            successCount: 0,
                            successWithErrorCount: 0,
                            failedCount: 0,
                            level: 'healthy'
                        }
                    }
                };
            },
            transformToVolumeSummaryModel: function (item) {
                return {
                    arrayDataVisualizationModel: {
                        total: {
                            label: (function (key) {
                                return synchronousTranslateService.translate(key);
                            })('common-label-total'),
                            capacity: item.totalCapacity
                        },
                        items: [
                            [{
                                label: (function (key) {
                                    return synchronousTranslateService.translate(
                                        key);
                                })('common-label-used'),
                                tooltip: (function (key) {
                                    var usedCapacityObject = item.usedCapacity;
                                    var usedCapacityAmount = usedCapacityObject.size + usedCapacityObject.unit;
                                    var variable = {
                                        usedCapacity: usedCapacityAmount
                                    };
                                    return synchronousTranslateService.translate(key, variable);
                                })('used-capacity-tooltip'),
                                capacity: item.usedCapacity,
                                color: thinUsedColor
                            },
                                {
                                    label: (function (key) {
                                        return synchronousTranslateService.translate(
                                            key);
                                    })('common-label-free'),
                                    tooltip: (function (key) {
                                        var freeCapacityObject = item.availableCapacity;
                                        var freeCapacityAmount = freeCapacityObject.size + freeCapacityObject.unit;
                                        var variable = {
                                            freeCapacity: freeCapacityAmount
                                        };
                                        return synchronousTranslateService.translate(key, variable);
                                    })('free-capacity-tooltip'),
                                    capacity: item.availableCapacity,
                                    color: thinFreeColor
                                }]
                        ]
                    },
                    alerts: {
                        capacity: {
                            count: 0,
                            level: 'healthy'
                        },
                        dp: {
                            count: 0,
                            level: 'healthy'
                        },
                        hardware: {
                            count: 0,
                            level: 'healthy'
                        },
                        jobs: {
                            successCount: 0,
                            successWithErrorCount: 0,
                            failedCount: 0,
                            level: 'healthy'
                        }
                    }
                };
            },
            transformFilePools: function (item, storageSystemId) {
                item.file = true;
                item.displayLinks = [];
                item.usageBare = Math.round(item.usedCapacity * 100 / item.totalCapacity);
                item.usagePercentage = item.usageBare;
                item.usage = item.usageBare.toString() + '%';
                item.capacityInBytes = diskSizeService.getDisplaySize(item.totalCapacity);
                item.availableCapacityInBytes = diskSizeService.getDisplaySize(item.freeCapacity);
                item.usedCapacityInBytes = diskSizeService.getDisplaySize(item.usedCapacity);
                item.physicalCapacityInBytes = diskSizeService.getDisplaySize(item.physicalCapacity);
                item.chunkSize = diskSizeService.getDisplaySize(item.chunkSize);
                var icons = [];

                if (!item.healthy) {
                    var warning = synchronousTranslateService.translate('file-pool-unhealthy-warning');
                    icons.push({
                        icon: 'icon-small-diamond',
                        title: warning
                    });
                }

                var tierInfo = synchronousTranslateService.translate(item.tiered ? 'tiered' : 'untiered');
                item.tierNameDisplay = item.tierNames.join(', ');
                _.each(item.links, function (link) {
                    if (link.rel.indexOf('poolId') !== -1) {
                        var storagePoolId = _.last(link.href.split('/'));
                        item.displayLinks.push({
                            href: '/#' + _.last(link.href.replace('/file', '').split('/v1')),
                            icon: 'icon-pools',
                            label: synchronousTranslateService.translate('hdp-pool') + ' ' + storagePoolId
                        });
                    }
                });
                item.metaData = [
                    {
                        left: true,
                        title: item.label
                    },
                    {
                        left: false,
                        title: tierInfo
                    }
                ];

                item.getIcons = function () {
                    return icons;
                };

                item.topTotal = item.totalCapacity;
                item.topSize = item.usedCapacity;
                item.itemIcon = 'icon-pools';
                item.topPostFix = 'file-pool-total';
                item.bottomPostFix = 'common-file-used';
                item.onClick = function () {
                    $location.path(['storage-systems', storageSystemId, 'file-pools', item.id]
                        .join('/'));
                };

                item.actions = {};

                item.getActions = function () {
                    return _.map(item.actions);
                };
            },
            transformEVS: function (item) {
                item.displayLinks = [];
                item.file = true;
                var storageSystemPath = '';
                if (item.links) {
                    _.each(item.links, function (link) {
                        if (link.rel.indexOf('filesystem') !== -1) {
                            storageSystemPath = _.first(link.href.split('/vfs')).replace('/file', '').replace('v1', '#');
                            item.storageSystemId = link.href.split('/')[4];
                        }
                    });
                }
                item.listOfIps = '';
                _.each(item.interfaceAddresses, function (ip) {
                    item.listOfIps += ip.ip + '-' + ip.prefixLength + '\n';
                });
                item.listOfIps = item.listOfIps.replace(/\n$/, '');
                item.actions = {};
                item.getActions = function () {
                    return _.map(item.actions);
                };
                item.itemIcon = 'icon-virtual-file-server';

                item.displayLinks.push({
                    href: storageSystemPath,
                    icon: 'icon-storage-system',
                    label: synchronousTranslateService.translate('common-storage-system') + ' ' + item.storageSystemId
                });

                var icons = [];

                if (item.status === 'Disabled') {
                    var warning = synchronousTranslateService.translate('file-server-offline-warning');
                    icons.push({
                        icon: 'icon-small-diamond',
                        title: warning
                    });
                }

                item.getIcons = function () {
                    return icons;
                };

                item.enabledText = item.enabled ? 'Enabled' : 'Disabled';
                item.isEnabled = item.enabled ? 'Yes' : 'No';
                item.isOnline = item.status === 'Online';

                item.metaData = [
                    {
                        left: true,
                        title: item.name,
                        detailsNoSlash: [item.enabledText, synchronousTranslateService.translate('big-blade') + ' ' + item.clusterNodeId]
                    }
                ];

                item.detailMetaData = [
                    {
                        detailData: _.map(item.interfaceAddresses, function (address) {
                            return address.ip;
                        }).join(',')
                    }
                ];

                item.onClickStorageArray = function () {
                    $location.path(['storage-systems', item.storageSystemId].join('/'));
                };

                item.onClick = function () {
                    $location.path(['storage-systems', item.storageSystemId, 'vfs', item.uuid].join('/'));
                };
            },
            transformFileSystems: function (item, storageSystemId) {
                item.file = true;
                item.capacityInBytes = diskSizeService.getDisplaySize(item.fileSystemCapacityDetails.capacity);
                item.availableCapacityInBytes = diskSizeService.getDisplaySize(item.fileSystemCapacityDetails.freeCapacity);
                item.usedCapacityInBytes = diskSizeService.getDisplaySize(item.fileSystemCapacityDetails.usedCapacity);
                item.blockSize = diskSizeService.getDisplaySize(item.blockSize);
                item.expansionLimitInBytes = diskSizeService.getDisplaySize(item.fileSystemCapacityDetails.expansionLimit);
                item.onlyShowTwoBars = true;
                item.usedLegend = item.usedCapacityInBytes.size + ' ' + item.usedCapacityInBytes.unit + ' ' + synchronousTranslateService.translate('file-systems-used-capacity');
                item.allocatedLegend = item.capacityInBytes.size + ' ' + item.capacityInBytes.unit + ' ' + synchronousTranslateService.translate('file-systems-total-capacity');
                item.storageSystemId = storageSystemId;
                item.displayLinks = [];
                item.usageBare = 0;
                if (item.availableCapacityInBytes.size !== 0) {
                    item.usageBare = Math.round(item.usedCapacityInBytes.size * 100 / item.capacityInBytes.size);
                }
                item.usagePercentage = item.usageBare;
                item.usage = item.usageBare + '%';
                var icons = [];

                if (item.blockSize.size === '4.00') {
                    item.blockSizeDisplay = '4K';
                }
                else {
                    item.blockSizeDisplay = '32K';
                }

                item.getIcons = function () {
                    return icons;
                };

                item.metaData = [
                    {
                        left: true,
                        title: item.label,
                        detailsNoSlash: [item.status]
                    }
                ];

                if (item.links) {
                    _.each(item.links, function (link) {
                        if (link.rel.indexOf('vfs') !== -1) {
                            var uuid = _.last(link.href.split('/'));
                            item.displayLinks.push({
                                href: '/#' + _.last(link.href.replace('/file', '').split('/v1')),
                                icon: 'icon-virtual-file-server',
                                label: synchronousTranslateService.translate('vfs') + ' ' + uuid
                            });
                        }
                        else if (link.rel.indexOf('file') !== -1) {
                            item.displayLinks.push({
                                href: '/#' + _.last(link.href.replace('/file', '').split('/v1')),
                                icon: 'icon-pools',
                                label: synchronousTranslateService.translate('file-pool') + ' ' + _.last(link.href.split('/'))
                            });
                        }
                    });
                }

                item.topTotal = item.capacityInBytes;
                item.topSize = item.usedCapacityInBytes;
                item.itemIcon = 'icon-filesystem';
                item.topPostFix = 'file-pool-total';
                item.bottomPostFix = 'common-file-used';
                item.onClick = function () {
                    $location.path(['storage-systems', storageSystemId, 'file-systems', item.id]
                        .join('/'));
                };

                item.actions = {};

                item.getActions = function () {
                    return _.map(item.actions);
                };
            },
            transformFilePoolSummaryModel: function (item) {
                item.usedLegend = item.usedCapacityInBytes.size + ' ' + item.usedCapacityInBytes.unit + ' ' + synchronousTranslateService.translate('file-pool-used-capacity');
                item.allocatedLegend = item.physicalCapacityInBytes.size + ' ' + item.physicalCapacityInBytes.unit + ' ' + synchronousTranslateService.translate('file-pool-allocated-capacity');
                item.overCommitLegend = item.capacityInBytes.size + ' ' + item.capacityInBytes.unit + ' ' + synchronousTranslateService.translate('file-pool-over-commit-capacity');
            },
            transformFilePoolsSummaryModel: function (item) {
                item.capacityInBytes = diskSizeService.getDisplaySize(item.filePoolSummary.overcommitCapacity);
                item.usedCapacityInBytes = diskSizeService.getDisplaySize(item.filePoolSummary.usedCapacity);
                item.physicalCapacityInBytes = diskSizeService.getDisplaySize(item.filePoolSummary.physicalCapacity);
                item.usedLegend = item.usedCapacityInBytes.size + ' ' + item.usedCapacityInBytes.unit + ' ' + synchronousTranslateService.translate('file-pool-used-capacity');
                item.allocatedLegend = item.physicalCapacityInBytes.size + ' ' + item.physicalCapacityInBytes.unit + ' ' + synchronousTranslateService.translate('file-pool-allocated-capacity');
                item.overCommitLegend = item.capacityInBytes.size + ' ' + item.capacityInBytes.unit + ' ' + synchronousTranslateService.translate('file-pool-over-commit-capacity');
            },
            transformFilePoolCapacitySummaryModel: function (item, selectedCapacity, unit) {
                if (!selectedCapacity) {
                    selectedCapacity = 0;
                }
                var selectedDisplayCapacity = diskSizeService.createDisplaySize(selectedCapacity, unit);
                var freeCapacity = parseInt(item.freeCapacity) - selectedDisplayCapacity.value;
                if (freeCapacity < 1) {
                    freeCapacity = 1;
                }
                return {
                    arrayDataVisualizationModel: {
                        file: true,
                        total: {
                            label: (function (key) {
                                return synchronousTranslateService.translate(key);
                            })('common-label-total'),
                            capacity: diskSizeService.getDisplaySize(item.totalCapacity)
                        },
                        items: [
                            [
                                {
                                    label: 'Used Capacity',
                                    tooltip: 'Used Capacity',
                                    capacity: diskSizeService.getDisplaySize(parseInt(item.usedCapacity) + parseInt(selectedDisplayCapacity.value)),
                                    color: '#3D84F5'
                                },
                                {
                                    label: 'Free Capacity',
                                    tooltip: 'Free Capacity',
                                    capacity: diskSizeService.getDisplaySize(freeCapacity),
                                    color: '#1A2B45'
                                }
                            ]
                        ]
                    }
                };
            },
            transformCreateTieredFilePoolCapacitySummaryModel: function (vals, overCommit) {
                var items = [];
                var totalCapacity = 0;

                _.each(vals, function (item) {
                    if (item && item.requestedCapacity) {
                        totalCapacity = totalCapacity + item.requestedCapacity.value;
                    }
                });
                var overCommitCapacity = totalCapacity * (overCommit / 100);

                items.push(capacity(diskSizeService.getDisplaySize(totalCapacity),
                    diskSizeService.getDisplaySize(totalCapacity)));

                return {
                    arrayDataVisualizationModel: {
                        file: true,
                        total: {
                            label: (function (key) {
                                return synchronousTranslateService.translate(key);
                            })('common-label-total'),
                            capacity: diskSizeService.getDisplaySize(overCommitCapacity)
                        },
                        items: [
                            {
                                used: {
                                    capacity: diskSizeService.getDisplaySize(totalCapacity),
                                    color: '#3D84F5'
                                },
                                free: {
                                    capacity: diskSizeService.getDisplaySize(overCommitCapacity - totalCapacity),
                                    color: '#1A2B45'
                                }
                            }
                        ]
                    }
                };
            },
            transformPermission: function (item) {
                var icons = [];
                item.getIcons = function () {
                    return icons;
                };
                var detail;
                if (item.permissionType.fullControl) {
                    detail = synchronousTranslateService.translate('share-full-control');
                }
                else if (item.permissionType.changeAndRead) {
                    detail = synchronousTranslateService.translate('share-change-read');
                }
                else if (item.permissionType.readOnly) {
                    detail = synchronousTranslateService.translate('share-read-only');
                }
                else {
                    detail = synchronousTranslateService.translate('share-none');
                }
                item.metaData = [
                    {
                        left: true,
                        title: item.groupName,
                        detailsNoSlash: [synchronousTranslateService.translate('share-type'), detail]
                    }
                ];

                item.itemIcon = 'icon-share';
            },
            transformAccessConfiguration: function (item) {
                var icons = [];
                item.getIcons = function () {
                    return icons;
                };
                item.metaData = [
                    {
                        left: true,
                        title: item.groupName,
                        detailsNoSlash: [item.NISNetgroup, item.hostName, item.ipAddress]
                    }
                ];

                item.itemIcon = 'icon-share';
            },
            transformCluster: function (item) {
                var nodeStatus = ['Invalid', 'Unknown', 'Up', 'Online', 'Not Up', 'Dead', 'Dormant'];
                _.each(item.clusterNodes, function (node) {
                    node.displayStatus = nodeStatus[node.status];
                });
            },
            transformShare: function (item, updateShare) {
                var icons = [];
                var storageSystemId;
                item.displayLinks = [];
                item.getIcons = function () {
                    return icons;
                };
                item.type = 'Share';
                item.urlType = 'shares';
                item.metaData = [
                    {
                        left: true,
                        title: item.name,
                        detailsNoSlash: [synchronousTranslateService.translate('share-path') + ' ' + item.fileSystemPath]
                    }
                ];

                if (item.name === 'C$') {
                    item.disabledCheckBox = true;
                }

                if (item.links) {
                    _.each(item.links, function (link) {
                        if (link.rel.indexOf('filesystem') !== -1) {
                            storageSystemId = _.first(link.href.split('storage-systems/')[1].split('/'));
                            if (item.fileSystemId !== '00000000000000000000000000000000') {
                                item.displayLinks.push({
                                    href: '/#' + _.last(link.href.replace('/file', '').split('/v1')),
                                    icon: 'icon-filesystem',
                                    label: synchronousTranslateService.translate('common-storage-system-file-system') + ' ' + item.fileSystemId
                                });
                            }
                        }
                        else if (link.rel.indexOf('vfs') !== -1) {
                            item.evsUuid = _.last(link.href.split('/'));
                            item.displayLinks.push({
                                href: '/#' + _.last(link.href.replace('/file', '').split('/v1')),
                                icon: 'icon-virtual-file-server',
                                label: synchronousTranslateService.translate('vfs') + ' ' + item.evsUuid
                            });
                        }
                    });
                }

                _.each(item.permissions, function (permission) {
                    var icons = [];
                    permission.getIcons = function () {
                        return icons;
                    };
                    var detail;
                    if (permission.permissionType.allowFullControl) {
                        detail = synchronousTranslateService.translate('share-full-control');
                    }
                    else if (permission.permissionType.allowChange) {
                        detail = synchronousTranslateService.translate('share-change-read');
                    }
                    else if (permission.permissionType.allowRead) {
                        detail = synchronousTranslateService.translate('share-read-only');
                    }
                    else {
                        detail = synchronousTranslateService.translate('share-none');
                    }
                    permission.permissionDisplay = detail;
                    permission.noSelection = updateShare ? false : true;
                    permission.metaData = [
                        {
                            left: true,
                            title: permission.groupName,
                            detailsNoSlash: [synchronousTranslateService.translate('share-type'), detail]
                        }
                    ];
                    permission.itemIcon = 'icon-user-group';
                });

                item.itemIcon = 'icon-share';

                item.onClick = function () {
                    $location.path(['storage-systems', storageSystemId, 'file-systems', item.fileSystemId, 'shares', item.id]
                        .join('/'));
                };

                item.actions = {};

                item.getActions = function () {
                    return _.map(item.actions);
                };
            },
            transformExport: function (item) {
                var icons = [];
                var storageSystemId;
                item.displayLinks = [];
                item.getIcons = function () {
                    return icons;
                };
                item.type = 'Export';
                item.urlType = 'exports';
                item.metaData = [
                    {
                        left: true,
                        title: item.name,
                        detailsNoSlash: [synchronousTranslateService.translate('export-path') + ' ' + item.fileSystemPath]
                    }
                ];

                if (item.links) {
                    _.each(item.links, function (link) {
                        if (link.rel.indexOf('filesystem') !== -1) {
                            storageSystemId = _.first(link.href.split('storage-systems/')[1].split('/'));
                            if (item.fileSystemId !== '00000000000000000000000000000000') {
                                item.displayLinks.push({
                                    href: '/#' + _.last(link.href.replace('/file', '').split('/v1')),
                                    icon: 'icon-filesystem',
                                    label: synchronousTranslateService.translate('common-storage-system-file-system') + ' ' + item.fileSystemId
                                });
                            }
                        }
                        else if (link.rel.indexOf('vfs') !== -1) {
                            item.evsUuid = _.last(link.href.split('/'));
                            item.displayLinks.push({
                                href: '/#' + _.last(link.href.replace('/file', '').split('/v1')),
                                icon: 'icon-virtual-file-server',
                                label: synchronousTranslateService.translate('vfs') + ' ' + item.evsUuid
                            });
                        }
                    });
                }

                item.itemIcon = 'icon-export';

                item.onClick = function () {
                    $location.path(['storage-systems', storageSystemId, 'file-systems', item.fileSystemId, 'exports', item.id]
                        .join('/'));
                };

                item.actions = {};

                item.getActions = function () {
                    return _.map(item.actions);
                };
            },
            transformToHostModeOptions: function (items) {
                var hostModeOptions = [];
                hostModeOptions.push({
                    id: 999,
                    name: 'AutoSelect',
                    displayName: 'AutoSelect'
                });

                _.each(items.resources, function (item) {
                    hostModeOptions.push({
                        id: item.storageSystemHostModeOptionId,
                        name: item.storageSystemHostModeOptionName,
                        displayName: item.storageSystemHostModeOptionId + ' - ' + item.storageSystemHostModeOptionName
                    });

                });
                return hostModeOptions;
            },

            transformMigrationTask: function (item) {
                item.id = item.migrationTaskId;
                // Update schedule info
                if (item.schedule && item.schedule.datetime) {
                    item.scheduleDate = item.schedule.datetime;
                } else {
                    item.scheduleDate = constantService.notAvailable;
                }
                item.jobStartDate = !item.jobStartDate ? constantService.notAvailable : item.jobStartDate;
                item.jobEndDate = !item.jobEndDate ? constantService.notAvailable : item.jobEndDate;

                // Set default sort value
                if (item.jobEndDate !== constantService.notAvailable) {
                    item.defaultSortKey = -1 * Date.parse(item.jobEndDate);
                } else if (item.jobStartDate !== constantService.notAvailable) {
                    item.defaultSortKey = -1 * Date.parse(item.jobStartDate) + 1000000000000;
                } else if (item.scheduleDate !== constantService.notAvailable) {
                    item.defaultSortKey = Date.parse(item.scheduleDate);
                } else {
                    item.defaultSortKey = Number.MAX_VALUE;
                }

                // status
                item.toDisplayStatus = function () {
                    switch (this.status) {
                        case 'SCHEDULED':
                            return synchronousTranslateService.translate('migration-task-status-scheduled');
                        case 'IN_PROGRESS':
                            return synchronousTranslateService.translate('migration-task-status-in-progress');
                        case 'SUCCESS':
                            return synchronousTranslateService.translate('migration-task-status-success');
                        case 'FAILED':
                            return synchronousTranslateService.translate('migration-task-status-failed');
                        case 'SUCCESS_WITH_ERRORS':
                            return synchronousTranslateService.translate('migration-task-status-success-with-errors');
                        default:
                            if (this.status) {
                                return this.status.charAt(0).toUpperCase() + this.status.toLowerCase().slice(1);
                            }
                            return constantService.notAvailable;
                    }
                };
                item.isScheduled = function () {
                    return this.status === 'SCHEDULED';
                };
                item.isInProgress = function () {
                    return this.status === 'IN_PROGRESS';
                },
                item.isSuccess = function () {
                    return this.status === 'SUCCESS';
                },
                item.isFailed = function () {
                    return this.status === 'FAILED';
                },
                item.isSuccessWithErrors = function () {
                    return this.status === 'SUCCESS_WITH_ERRORS';
                },
                item.toDisplayDate = function (isoDate) {
                    if (isoDate && isoDate !== constantService.notAvailable) {
                        return $filter('date')(isoDate, 'MMM d, y h:mm:ss a');
                    }
                    return constantService.notAvailable;
                };
            },
            transformMigrationPair: function (item) {
                // Resource links
                // TODO When the source volume is external, where is the destination?
                item.launchSourceVol = function (storageSystemId) {
                    var path = ['storage-systems', storageSystemId, 'volumes', this.sourceVolumeId].join('/');
                    $location.path(path);
                };
                if (item.sourcePoolId !== null) {
                    item.launchSourcePool = function (storageSystemId) {
                        var path = ['storage-systems', storageSystemId, 'storage-pools', this.sourcePoolId].join('/');
                        $location.path(path);
                    };
                } else {
                    item.sourcePoolId = constantService.notAvailable;
                }
                if (item.sourceParityGroupId !== null) {
                    item.launchSourceParityGroup = function (storageSystemId) {
                        var path = ['storage-systems', storageSystemId, 'external-parity-groups', this.sourceParityGroupId].join('/');
                        $location.path(path);
                    };
                } else {
                    item.sourceParityGroupId = constantService.notAvailable;
                }
                if (item.targetVolumeId !== null) {
                    item.launchTargetVol = function (storageSystemId) {
                        var path = ['storage-systems', storageSystemId, 'volumes', this.targetVolumeId].join('/');
                        $location.path(path);
                    };
                } else {
                    item.targetVolumeId = constantService.notAvailable;
                }
                if (item.targetPoolId !== null) {
                    item.launchTargetPool = function () {
                        var path = ['storage-systems', this.storageSystemId, 'storage-pools', this.targetPoolId].join('/');
                        $location.path(path);
                    };
                } else {
                    item.targetPoolId = constantService.notAvailable;
                }
                if (item.copyProgress === null) {
                    item.copyProgress = constantService.notAvailable;
                }
                if (item.copyGroupName === null) {
                    item.copyGroupName = constantService.notAvailable;
                }

                // status display
                item.toDisplayStatus = function () {
                    switch (this.status) {
                        case 'NOT_MIGRATED':
                            return synchronousTranslateService.translate('migration-pair-status-not-migrated');
                        case 'MIGRATED':
                            return synchronousTranslateService.translate('migration-pair-status-migrated');
                        case 'MIGRATING':
                            return synchronousTranslateService.translate('migration-pair-status-migrating');
                        case 'INVALID':
                            return synchronousTranslateService.translate('migration-pair-status-invalid');
                        default:
                            return this.status.charAt(0).toUpperCase() + this.status.toLowerCase().slice(1);
                    }
                };
            }
        };

        return transforms;

    });
