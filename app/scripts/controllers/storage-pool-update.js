'use strict';

/**
 * @ngdoc function
 * @name rainierApp.controller:StoragePoolUpdateCtrl
 * @description
 * # StoragePoolUpdateCtrl
 * Controller of the rainierApp
 */
angular.module('rainierApp')
    .controller('StoragePoolUpdateCtrl', function ($modal, $scope, $routeParams, $timeout, orchestratorService,
                                                   diskSizeService, storagePoolService, paginationService,
                                                   objectTransformService, resourceTrackerService) {
        var storageSystemId = $routeParams.storageSystemId;
        var poolId = $routeParams.storagePoolId;
        var GET_PARITY_GROUPS_PATH = 'parity-groups';
        var parityGroups;

        orchestratorService.storagePool(storageSystemId, poolId)
            .then(function (pool) {
                $scope.model = pool;
                $scope.poolPgs = pool.parityGroups;
                $scope.model.originalActiveFlash = pool.activeFlashEnabled;
                $scope.model.originalLabel = pool.label;
                $scope.model.originalPoolType = pool.type;
                $scope.model.poolType = pool.type;
                $scope.model.availablePoolTypes = [pool.type];
                $scope.model.wizardType = 'basic';
                $scope.model.originalHtiPool = (pool.type === 'HTI');
                $scope.model.disableUtilization = pool.type === 'HTI';
                $scope.model.htiPool = $scope.model.originalHtiPool;
                $scope.model.originalUtilizationThreshold1 = $scope.model.utilizationThreshold1;
                $scope.model.originalUtilizationThreshold2 = $scope.model.utilizationThreshold2;
                $scope.model.originalSubscriptionLimit = {
                    unlimited: pool.subscriptionLimit.unlimited,
                        value: pool.subscriptionLimit.value
                };
                $scope.model.templateSubscriptionLimit = {};
                $scope.model.originalTemplateSubscriptionLimit = {};
                $scope.model.hasHdpLicense = false;
                $scope.model.hasHdtLicense = false;
                $scope.model.hasHtiLicense = false;
                $scope.model.activeFlashAllowed = false;
                $scope.model.hasActiveFlashLicense = pool.activeFlashEnabled;
                $scope.model.originalActiveFlashEnabled = false;
                paginationService.getAllPromises(null, GET_PARITY_GROUPS_PATH, true, storageSystemId,
                    objectTransformService.transformParityGroup).then(function(result) {
                        parityGroups = result;
                        orchestratorService.tiers().then(function (result) {
                            var diskTypeSpeedToTier = {};
                            $scope.tierKeys = _.pluck(result.tiers, 'tier');
                            _.forEach(result.tiers, function (tier) {
                                _.forEach(tier.subTiers, function (subTier) {
                                    diskTypeSpeedToTier[subTier.diskType + ' ' + diskSizeService.getDisplaySpeed(subTier.speed)] = tier.tier;
                                });
                            });
                            $scope.diskTypeSpeedToTier = diskTypeSpeedToTier;
                            $scope.model.parityGroups = storagePoolService.filterParityGroups(parityGroups, diskTypeSpeedToTier, pool);
                            var c = _.chain($scope.model.parityGroups);
                            $scope.model.diskTypes = c.pluck(function (pg) {
                                return pg.diskSpec.type;
                            }).uniq().value();
                            $scope.model.raidLayouts = c.pluck('raidLayout').uniq().value();
                            $scope.model.raidLevels = c.pluck('raidLevel').uniq().value();
                            $scope.model.diskSpeeds = c.pluck(function (pg) {
                                return pg.diskSpec.speed;
                            }).uniq().value();
                            $scope.model.diskSpeeds = _.map($scope.model.diskSpeeds, function (ds) {
                                if (ds === '') {
                                    ds = '0';
                                }
                                return ds;
                            });
                            $scope.model.diskSpeeds.sort();

                            var diskType = null;
                            var raidLayout = null;
                            var raidLevel = null;
                            var diskSpeed = null;

                            // true if the current pool have the same disk type, raid layout, raid level, disk speed
                            var isUnified = false;

                            var usableParityGroups = [];
                            var inUseParityGroups = [];

                            // When the parity groups for the current pool have the same disk type, raid layout,
                            // raid level, disk speed, we set the initial filter as them for the parity groups
                            // to be selected.
                            _.forEach($scope.model.parityGroups, function (pg) {
                                if (_.find(pool.parityGroups, function(parityGroup) { return parityGroup.id === pg.parityGroupId; })) {
                                    if (!diskType && !raidLayout && !raidLevel && !diskSpeed) {
                                        diskType = pg.diskSpec.type;
                                        raidLayout = pg.raidLayout;
                                        raidLevel = pg.raidLevel;
                                        diskSpeed = pg.diskSpec.speed;
                                        isUnified = true;
                                    } else if (diskType !== pg.diskSpec.type ||
                                        raidLayout !== pg.raidLayout ||
                                        raidLevel !== pg.raidLevel ||
                                        diskSpeed !== pg.diskSpec.speed) {
                                        isUnified = false;
                                    }

                                    pg.selected = true;
                                    pg.inuse = true;
                                    inUseParityGroups.push(pg);
                                } else if (pg.status === 'AVAILABLE' || pg.status === 'QUICK_FORMATTING' || pg.status === 'AVAILABLE_PHYSICAL') {
                                    pg.selected = false;
                                    pg.inuse = false;
                                    usableParityGroups.push(pg);
                                }

                            });
                            $scope.model.inUseParityGroups = inUseParityGroups;
                            $scope.model.parityGroups = usableParityGroups;

                            $scope.model.search = isUnified ?
                            {
                                freeText: '',
                                diskSpec: {
                                    type: diskType,
                                    speed: diskSpeed
                                },
                                raidLayout: raidLayout,
                                raidLevel: raidLevel
                            }
                                :
                            {
                                freeText: '',
                                diskSpec: {
                                    type: null,
                                    speed: null
                                },
                                raidLayout: null,
                                raidLevel: null
                            };
                        });
                    });

                orchestratorService.tiers().then(function (result) {
                    $scope.tierKeys = _.pluck(result.tiers, 'tier');
                });

                orchestratorService.getUpdatePoolTemplate(storageSystemId, poolId)
                    .then(function (result) {
                        $scope.model.poolTemplate = result;
                        $scope.model.templateUtilizationThreshold1 = parseInt(result.utilizationThreshold1);
                        $scope.model.templateUtilizationThreshold2 = parseInt(result.utilizationThreshold2);
                        $scope.model.originalTemplateUtilizationThreshold1 = $scope.model.templateUtilizationThreshold1;
                        $scope.model.originalTemplateUtilizationThreshold2 = $scope.model.templateUtilizationThreshold2;
                        $scope.model.templateSubscriptionLimit = {
                            unlimited: result.subscriptionLimit.unlimited,
                                value: result.subscriptionLimit.value
                        };
                        $scope.model.originalTemplateSubscriptionLimit = result.subscriptionLimit;
                    });

                orchestratorService.licenses(storageSystemId).then(function (result) {
                    _.forEach(result.licenseSettings, function(license){
                            if (license.productName.toUpperCase() === 'ACTIVE FLASH' && license.installed === true){
                                $scope.model.hasActiveFlashLicense = true;
                            } else if (license.productName.toUpperCase() === 'DYNAMIC TIERING' && license.installed === true) {
                                if ($scope.model.availablePoolTypes.length === 1 &&  $scope.model.availablePoolTypes[0] === 'HDP'){
                                    $scope.model.availablePoolTypes.push('HDT');
                                }
                                $scope.model.hasHdtLicense = true;
                            }
                        }
                    );
                });

                $scope.payload = {
                    submit: function () {
                        var updatedLabel = ($scope.model.originalLabel === $scope.model.label) ? null : $scope.model.label;
                        if ($scope.model.wizardType === 'basic') {

                            var poolTemplateSubTiers = getActualSelectedTierSizes();
                            var deployPayload = {
                                htiPool: $scope.model.htiPool,
                                label: updatedLabel,
                                utilizationThreshold1: $scope.model.templateUtilizationThreshold1,
                                utilizationThreshold2: $scope.model.templateUtilizationThreshold2,
                                subscriptionLimit: $scope.model.templateSubscriptionLimit,
                                poolTemplateSubTiers: poolTemplateSubTiers
                            };
                            if($scope.model.htiPool && ($scope.model.templateUtilizationThreshold1 < 1 || $scope.model.templateUtilizationThreshold2 < 1)) {
                                deployPayload.utilizationThreshold1 = 1;
                                deployPayload.subscriptionLimit.value = 1;
                            }
                            orchestratorService.updatePoolTemplate(storageSystemId, poolId, deployPayload).then(function () {
                                window.history.back();
                            });
                        } else {
                            var updatePoolPayload = {
                                label: updatedLabel,
                                activeFlashEnabled: $scope.model.activeFlashEnabled,
                                poolType: $scope.model.poolType,
                                utilizationThreshold1: $scope.model.utilizationThreshold1,
                                utilizationThreshold2: $scope.model.utilizationThreshold2,
                                subscriptionLimit: $scope.model.subscriptionLimit,
                                parityGroupIds: ($scope.model.selectedParityGroups.length === 0) ? null : $scope.model.selectedParityGroups
                            };
                            if($scope.model.poolType === 'HTI' && ($scope.model.utilizationThreshold1 < 1 || $scope.model.subscriptionLimit < 1)) {
                                updatePoolPayload.utilizationThreshold1 = 1;
                                updatePoolPayload.subscriptionLimit.value = 1;
                            }

                            // Get selected and existing parity groups on the pool
                            $scope.poolPgIds = [];
                            _.forEach($scope.poolPgs, function (poolPg) {
                                $scope.poolPgIds.push(poolPg.id);
                            });
                            _.forEach($scope.model.selectedParityGroups, function (selectedPg) {
                                $scope.poolPgIds.push(selectedPg);
                            });

                            // Build reserved resources
                            var reservedResourcesList = [];
                            reservedResourcesList.push(poolId + '=' + resourceTrackerService.storagePool());
                            _.forEach($scope.poolPgIds, function (poolPgId) {
                                reservedResourcesList.push(poolPgId + '=' + resourceTrackerService.parityGroup());
                            });

                            // Show popup if resource is present in resource tracker else submit
                            resourceTrackerService.showReservedPopUpOrSubmit(reservedResourcesList, storageSystemId, resourceTrackerService.storageSystem(),
                                'Update Pool Confirmation', storageSystemId, poolId, updatePoolPayload,
                                orchestratorService.updateStoragePool);
                        }
                    },
                    isValid: function () {
                        if (!$scope.model) {
                            return false;
                        }
                        var subscriptionCheckResult = false;
                        if ($scope.model.wizardType === 'basic') {
                             subscriptionCheckResult = storagePoolService.isSubscriptionLimitValid($scope.model.htiPool, 
                                     $scope.model.templateSubscriptionLimit.unlimited, $scope.model.templateSubscriptionLimit.value);
                            return (($scope.model.originalLabel !== $scope.model.label) || getActualSelectedTierSizes().length > 0 ||
                                $scope.model.originalHtiPool !== $scope.model.htiPool ||
                                $scope.model.templateUtilizationThreshold1 !== $scope.model.originalTemplateUtilizationThreshold1 ||
                                $scope.model.templateUtilizationThreshold2 !== $scope.model.originalTemplateUtilizationThreshold2 ||
                                $scope.model.templateSubscriptionLimit.unlimited !== $scope.model.originalTemplateSubscriptionLimit.unlimited ||
                                $scope.model.templateSubscriptionLimit.value !== $scope.model.originalTemplateSubscriptionLimit.value) && subscriptionCheckResult;
                        } else {
                             subscriptionCheckResult = storagePoolService.isSubscriptionLimitValid($scope.model.poolType === 'HTI',
                                    $scope.model.subscriptionLimit.unlimited, $scope.model.subscriptionLimit.value);

                          return (($scope.model.originalLabel !== $scope.model.label) || ($scope.model.activeFlashEnabled !== $scope.model.originalActiveFlash) ||
                                $scope.model.selectedParityGroups.length > 0 ||
                                $scope.model.originalPoolType !== $scope.model.poolType ||
                                $scope.model.utilizationThreshold1 !== $scope.model.originalUtilizationThreshold1 ||
                                $scope.model.utilizationThreshold2 !== $scope.model.originalUtilizationThreshold2 ||
                                $scope.model.subscriptionLimit.unlimited !== $scope.model.originalSubscriptionLimit.unlimited ||
                                $scope.model.subscriptionLimit.value !== $scope.model.originalSubscriptionLimit.value) && subscriptionCheckResult;
                        }
                    }
                };
            });

        function getActualSelectedTierSizes() {
            var poolTemplateSubTiers = [];

            // If the tier has been selected before, the selected size will be shown as selected in the
            // page. So we need to deduct the existing size before calling api to update.
            _.forEach($scope.model.selectedTiers, function (tier) {
                var addedDiskSize = 0;
                if (tier.currentCapacity && tier.selectedSize.diskSize.value <= tier.currentCapacity) {
                    return;
                }
                if (tier.currentCapacity && tier.selectedSize.diskSize.value > tier.currentCapacity) {
                    addedDiskSize = tier.selectedSize.diskSize.value - tier.currentCapacity;
                } else {
                    addedDiskSize = tier.selectedSize.diskSize.value;
                }

                poolTemplateSubTiers.push(
                    {
                        name: tier.name,
                        sizeToUseInBytes: addedDiskSize
                    }
                );
            });

            return poolTemplateSubTiers;
        }

        $scope.$watchGroup(['model.poolTemplate', 'model.wizardType'], function (vals) {
            storagePoolService.watchTemplateTypeWizard($scope.model, vals, diskSizeService, true);
        });

        function dataVizModelForBasic(diskSizesByTier) {
            $scope.dataVizModel = storagePoolService.dataVizModelForBasic($scope.model, diskSizesByTier, $scope.tierKeys, diskSizeService);
        }

        $scope.$watch('model.diskSizesByTier', dataVizModelForBasic, true);

        function updateSubscriptionLimit(subscriptionLimit){
            if (subscriptionLimit && subscriptionLimit.unlimited === true){
                subscriptionLimit.value = null;
            }
        }

        $scope.$watch('model.subscriptionLimit', updateSubscriptionLimit, true);

        $scope.$watch('model.templateSubscriptionLimit', updateSubscriptionLimit, true);

        $scope.$watchGroup(['model.wizardType'], function (vals) {
            var wizardType = vals[0];

            if (!wizardType) {
                return;
            }

            if (wizardType === 'advanced') {
                $scope.model.selectedParityGroup = null;

                $scope.model.search = {
                    freeText: '',
                    diskSpec: {
                        type: null,
                        speed: null
                    },
                    raidLayout: null,
                    raidLevel: null,
                    compression: null,
                    encryption: null
                };

                dataVizModelForAdvanced($scope.model.parityGroups);
            } else if (wizardType === 'basic') {
                dataVizModelForBasic($scope.model.diskSizesByTier);
            }
        });

        function dataVizModelForAdvanced(pgs) {
            $scope.dataVizModel = storagePoolService.dataVizModelForAdvanced($scope.model, pgs, diskSizeService);
            _.each($scope.model.tiers, function(tier) {
                if(tier.tier === _.first($scope.tierKeys)) {
                    $scope.model.activeFlashAllowed = true;
                }
            });
        }

        $scope.$watch('model.parityGroups', dataVizModelForAdvanced, true);

    });
