'use strict';

/**
 * @ngdoc function
 * @name rainierApp.controller:StorageSystemCtrl
 * @description
 * # StorageSystemCtrl
 * Controller of the rainierApp
 */
angular.module('rainierApp')
    .controller('StorageSystemCtrl', function ($scope, $routeParams, $window, orchestratorService,
                                               objectTransformService, diskSizeService, synchronousTranslateService,
                                               paginationService, replicationGroupsService,
                                               capacityAlertService, dpAlertService, jobsAlertService, hwAlertService,
                                               replicationService, migrationTaskService, constantService) {
        var storageSystemId = $routeParams.storageSystemId;
        var filePoolsSummary;
        var dataProtection;
        var capacitySavings;
        var tierSummary;
        var tiers;
        var GET_PARITY_GROUPS_PATH = 'parity-groups';
        var GET_STORAGE_PORTS_PATH = 'storage-ports';
        var GET_MIGRATION_TASKS_PATH = 'migration-tasks';

        $scope.services = {
            cp: capacityAlertService,
            dp: dpAlertService,
            job: jobsAlertService,
            hw: hwAlertService
        };
        _.each($scope.services, function(service){
            service.update();
        });

        function getUnifiedInformation() {
            orchestratorService.filePools(storageSystemId).then(function (result) {
                var tiered = 0;
                _.each(result.filePools, function (filePool) {
                    if (filePool.tiered) {
                        tiered += 1;
                    }
                });
                $scope.filePoolSummary = {
                    total: result.filePools.length,
                    tiered: tiered,
                    untiered: result.filePools.length - tiered
                };
            });
            orchestratorService.fileSystems(storageSystemId).then(function (result) {
                var mounted = 0;
                _.each(result.fileSystems, function (fileSystem) {
                    if (fileSystem.status === 'Mounted') {
                        mounted += 1;
                    }
                });
                $scope.fileSystemsSummary = {
                    total: result.fileSystems.length,
                    fileSystemsByType: [
                        {
                            type: synchronousTranslateService.translate('common-storage-system-mounted'),
                            count: mounted
                        },
                        {
                            type: synchronousTranslateService.translate('common-storage-system-unmounted'),
                            count: result.fileSystems.length - mounted
                        }
                    ]
                };
            });
                orchestratorService.enterpriseVirtualServers(storageSystemId).then(function (result) {
                var active = 0;
                _.each(result.evses, function (evs) {
                    if (evs.enabled) {
                        active += 1;
                    }
                });
                $scope.evsesSummary = {
                    total: result.evses.length,
                    evsesByType: [
                        {
                            type: synchronousTranslateService.translate('common-storage-system-active'),
                            count: active
                        },
                        {
                            type: synchronousTranslateService.translate('common-storage-system-inactive'),
                            count: result.evses.length - active
                        }
                    ]
                };

                $scope.shares = {total: 0};
                $scope.sharesSummary = [];
                setShareSummary(0, 'windows');
                setShareSummary(0, 'linux');

                orchestratorService.allShares(storageSystemId).then(function (result) {
                    _.first($scope.sharesSummary).count = result.shares.length;
                    $scope.shares = {total: result.shares.length + $scope.shares.total};
                });
                orchestratorService.allExports(storageSystemId).then(function (result) {
                    _.last($scope.sharesSummary).count = result.exports.length;
                    $scope.shares = {total: result.exports.length + $scope.shares.total};
                });
            });
        }

        function setShareSummary(count, type) {
            $scope.sharesSummary.push({
                type: synchronousTranslateService.translate(type),
                count: count
            });
        }

        orchestratorService.capacitySavingsSummaryForStorageSystem(storageSystemId).then(function (result) {
            capacitySavings = result;
            return orchestratorService.tiers();
        }).then(function (result) {
            tiers = result;
            return orchestratorService.tierSummary(storageSystemId);
        }).then(function (result) {
            tierSummary = result.tierSummaryItems;
            return orchestratorService.dataProtectionSummaryForStorageSystem(storageSystemId);
        }).then(function (result) {
            dataProtection = result;
            return orchestratorService.storageSystem(storageSystemId);
        }).then(function (result) {

            result.orchestratorService = orchestratorService;
            $scope.dataModel = result;
            var title = 'Storage System ' + result.storageSystemId;
            if (result.unified && result.accessible) {
                orchestratorService.filePoolSummary(storageSystemId).then(function (result) {
                    filePoolsSummary = result;
                    var summaryModel = objectTransformService.transformToStorageSummaryModel($scope.dataModel, filePoolsSummary, dataProtection);
                    objectTransformService.transformTierSummary(tiers, tierSummary, summaryModel);
                    objectTransformService.transformSavingsSummary(capacitySavings, summaryModel);
                    summaryModel.title = title;
                    $scope.summaryModel = summaryModel;
                });
                var smuLink = {
                    href: ['https://', result.gum1IpAddress, ':20443/mgr/app/'].join(''),
                    title: 'storage-system-launch-smu',
                    type: 'hyperlink'
                };
                getUnifiedInformation();
                orchestratorService.cluster(storageSystemId).then(function (result) {
                    $scope.clusterSummary = result;
                    if (!$scope.clusterSummary || ($scope.clusterSummary && $scope.clusterSummary.numOfNodes !== 4)) {
                        $scope.dataModel.actions.settings.items.push(smuLink);
                    }
                });
            }
            else {
                var summaryModel = objectTransformService.transformToStorageSummaryModel(result, false, dataProtection);
                objectTransformService.transformTierSummary(tiers, tierSummary, summaryModel);
                objectTransformService.transformSavingsSummary(capacitySavings, summaryModel);
                summaryModel.title = title;
                $scope.summaryModel = summaryModel;
            }
        });

        var externalVolumePairExist = {};
        replicationGroupsService.cloneExternalVolumePairExists(storageSystemId).then(function (result) {
            externalVolumePairExist.clone = result === 0 ? false : true;
            return replicationGroupsService.snapshotExternalVolumePairExists(storageSystemId);
        }).then(function (result) {
            externalVolumePairExist.snapshot = result === 0 ? false : true;
            return replicationGroupsService.snapshotExtendableExternalVolumePairExists(storageSystemId);
        }).then(function (result) {
            externalVolumePairExist.snapshotEx = result === 0 ? false : true;
            return replicationGroupsService.snapshotFullcopyExternalVolumePairExists(storageSystemId);
        }).then(function (result) {
            externalVolumePairExist.snapshotFc = result === 0 ? false : true;
            return orchestratorService.replicationGroupSummary(storageSystemId);
        }).then(function (result) {
            var replicationGroupCountByTypes = result.replicationGroupCountByType;
            var total = 0;
            var replicationGroupsByType = [];

            if (!_.isUndefined(replicationGroupCountByTypes) && !_.isEmpty(replicationGroupCountByTypes)) {
                _.forEach(replicationGroupCountByTypes, function(replicationGroupCountByType) {
                    var replicationGroup = {};

                    if (replicationService.isClone(replicationGroupCountByType.replicationType)) {
                        replicationGroup.type = synchronousTranslateService.translate('common-replication-groups-clone');
                        if (externalVolumePairExist.clone) {
                            replicationGroupCountByType.count++;
                        }
                    } else if (replicationService.isSnapShotType(replicationGroupCountByType.replicationType)) {
                        var typeForSnapShot = synchronousTranslateService.translate('common-replication-groups-snap');
                        var groupForSnapShot = _.find(replicationGroupsByType, function(group) {
                            return group.type === typeForSnapShot;
                        });
                        if (_.isUndefined(groupForSnapShot)) {
                            replicationGroup.type = typeForSnapShot;
                            replicationGroupCountByType.count += externalVolumePairExist.snapshot ? 1 : 0;
                            replicationGroupCountByType.count += externalVolumePairExist.snapshotEx ? 1 : 0;
                            replicationGroupCountByType.count += externalVolumePairExist.snapshotFc ? 1 : 0;
                        } else {
                            // Do not push new element if already exist.
                            groupForSnapShot.count += replicationGroupCountByType.count;
                            total += replicationGroupCountByType.count;
                            return;
                        }
                    }

                    replicationGroup.count = replicationGroupCountByType.count;

                    replicationGroupsByType.push(replicationGroup);
                    total += replicationGroupCountByType.count;
                });
            }

            $scope.replicationGroupSummary = {
                total: total,
                replicationGroupsByType: replicationGroupsByType
            };
        });

        orchestratorService.storagePoolsSummary(storageSystemId).then(function (result) {
            $scope.poolsSummary = {
                total : _.reduce(result.summariesByType, function (sum, sbt){
                    return sum + sbt.poolCount;
                }, 0),
                summariesByType : result.summariesByType
            };
        });

        paginationService.getAllPromises(null, GET_STORAGE_PORTS_PATH, true, storageSystemId, objectTransformService.transformPort).then(function (result) {
            // Only support for fibre port and iscsi port for now
            result.storagePorts = _.filter(result, function(sp) {
                return sp.type === 'FIBRE' || sp.type === 'ISCSI';
            });
            $scope.portsSummary = {
                total : result.storagePorts.length,
                portsByType : _.map(_.groupBy(result.storagePorts, 'type'), function (g){
                    return {
                        type : _.first(g).type,
                        count : g.length
                    };
                })
            };
        });

        orchestratorService.volumeSummary(storageSystemId).then(function (result) {
            $scope.volumesSummary = {
                total: result.numberOfVolumes,
                volumesByType: []
            };
            var map = [];
            var volumeType = ['HDP', 'HDT', 'HTI'];
            for(var type in volumeType) {
                map[volumeType[type]] = {type : volumeType[type], count: 0};
            }

            for (var volumeTypeEntry in result.volumeCountByType) {
                if (result.volumeCountByType.hasOwnProperty(volumeTypeEntry)) {
                    map[volumeTypeEntry] = {
                        type : volumeTypeEntry,
                        count: result.volumeCountByType[volumeTypeEntry] + map[volumeTypeEntry].count
                    };
                }
            }
            for(var index in map) {
                $scope.volumesSummary.volumesByType.push(map[index]);
            }
        });

        paginationService.getAllPromises(null, GET_PARITY_GROUPS_PATH, true, storageSystemId, objectTransformService.transformParityGroup).then(function (result) {
            var pgs = result;
            $scope.parityGroups = pgs;
            $scope.parityGroupsSummary = {

                total : pgs.length,
                parityGroupsByType : _.map(_.groupBy(pgs,function (pg){
                   return pg.diskSpec.type;

                }), function (g){
                    return {
                        type : _.first(g).diskSpec.type,
                        count : g.length
                    };
                })
            };
        });

        orchestratorService.externalParityGroupSummary(storageSystemId).then(function(result) {
            $scope.externalParityGroupsSummary = {
                count : (result.numberOfExternalParityGroups ? result.numberOfExternalParityGroups : 0)
            };
        });

         orchestratorService.externalVolumeSummary(storageSystemId).then(function (result) {
            $scope.externalVolumesSummary = {
                total : result.numberOfVolumes,
                volumesByType : []
            };
            // Currently number of available types is only one.
            // If number of types is increased in the future, use below commented codes. And rethink type label.
            $scope.externalVolumesSummary.volumesByType.push({
                type: synchronousTranslateService.translate('common-external-volumes'),
                count: result.numberOfVolumes
            });
//            for (var volumeTypeEntry in result.volumeCountByType) {
//                if (result.volumeCountByType.hasOwnProperty(volumeTypeEntry)) {
//                    var item = {};
//                    item.type = volumeTypeEntry;
//                    item.count = result.volumeCountByType[volumeTypeEntry];
//                    $scope.externalVolumesSummary.volumesByType.push(item);
//                }
//            }
        });


        paginationService.getAllPromises(null, GET_MIGRATION_TASKS_PATH, true, storageSystemId,
            objectTransformService.transformMigrationTask).then(function (result) {
            migrationTaskService.mergeJobInfo(result).then(function (resources) {
                var mgs = resources;
                $scope.migrationTasks = mgs;
                var grouping = {};
                _.forEach(_.groupBy(mgs, 'status'), function (g) {
                    grouping[_.first(g).status] = g.length;
                });
                $scope.migrationTasksSummary = {
                    total : mgs.length,
                    migrationTasksByStatus : _.map(constantService.migrationTaskStatus, function (status) {
                        return {
                            status : migrationTaskService.toDisplayStatus(status),
                            count : (grouping.hasOwnProperty(status) ? grouping[status] : 0)
                        };
                    })
                };
            });
        });

        orchestratorService.hostGroups(storageSystemId).then(function () {});
    });
