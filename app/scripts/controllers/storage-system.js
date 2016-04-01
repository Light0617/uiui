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
                                               paginationService, replicationGroupsService) {
        var storageSystemId = $routeParams.storageSystemId;
        var filePoolsSummary;
        var dataProtection;
        var tierSummary;
        var tiers;
        var GET_PARITY_GROUPS_PATH = 'parity-groups';
        var GET_STORAGE_PORTS_PATH = 'storage-ports';

        function getUnifiedInformation() {
            orchestratorService.cluster(storageSystemId).then(function (result) {
                $scope.clusterSummary = result;
            });
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

        orchestratorService.tiers().then(function (result) {
            tiers = result;
            return orchestratorService.tierSummary(storageSystemId);
        }).then(function (result) {
            tierSummary = result.tierSummaryItems;
            return orchestratorService.dataProtectionSummary();
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
                    summaryModel.title = title;
                    $scope.summaryModel = summaryModel;
                });
                var smuLink = {
                    href: ['https://', result.gum1IpAddress, ':20443/mgr/app/'].join(''),
                    title: 'storage-system-launch-smu',
                    type: 'hyperlink'
                };
                $scope.dataModel.actions.settings.items.push(smuLink);
                getUnifiedInformation();
            }
            else {
                var summaryModel = objectTransformService.transformToStorageSummaryModel(result, false, dataProtection);
                objectTransformService.transformTierSummary(tiers, tierSummary, summaryModel);
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
            return orchestratorService.replicationGroupSummary(storageSystemId);
        }).then(function (result) {
            var replicationGroupCountByTypes = result.replicationGroupCountByType;
            var total = 0;
            var replicationGroupsByType = [];

            if (!_.isUndefined(replicationGroupCountByTypes) && !_.isEmpty(replicationGroupCountByTypes)) {
                _.forEach(replicationGroupCountByTypes, function(replicationGroupCountByType) {
                    if (replicationGroupCountByType.replicationType === 'CLONE' && externalVolumePairExist.clone) {
                        replicationGroupCountByType.count++;
                    } else if (replicationGroupCountByType.replicationType === 'SNAPSHOT' && externalVolumePairExist.snapshot) {
                        replicationGroupCountByType.count++;
                    }
                    var replicationGroupType = {
                        type: replicationGroupCountByType.replicationType,
                        count: replicationGroupCountByType.count
                    };
                    replicationGroupsByType.push(replicationGroupType);
                    total = total + replicationGroupCountByType.count;
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
            // Only support for fibre port for now
            result.storagePorts = _.filter(result, function(sp) {
                return sp.type === 'FIBRE';
            });
            var storagePorts = result;
            $scope.portsSummary = {
                total : storagePorts.length,
                portsByType : _.map(_.groupBy(storagePorts, 'type'), function (g){
                    return {
                        type : _.first(g).type,
                        count : g.length
                    };
                })
            };
        });

        orchestratorService.volumeSummary(storageSystemId).then(function (result) {
            $scope.volumesSummary = {
                total : result.numberOfVolumes,
                volumesByType : []
            };
           for (var volumeTypeEntry in result.volumeCountByType) {
                if (result.volumeCountByType.hasOwnProperty(volumeTypeEntry)) { 
                    var item = {};
                    item.type = volumeTypeEntry;
                    item.count = result.volumeCountByType[volumeTypeEntry];
                    $scope.volumesSummary.volumesByType.push(item);
                 }
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
	
        orchestratorService.storageExternalParityGroups(storageSystemId).then(function(result) {
            $scope.externalParityGroups = result.externalParityGroups;
            $scope.externalParityGroupsSummary = {
                count : ($scope.externalParityGroups ? $scope.externalParityGroups.length : 0)
            };
        });

        orchestratorService.externalParityGroupSummary(storageSystemId).then(function(result) {
            $scope.externalParityGroupsSummary = {
                count : (result.numberOfExternalParityGroups ? result.numberOfExternalParityGroups : 0)
            };
        });


    });
