'use strict';

/**
 * @ngdoc function
 * @name rainierApp.controller:StoragePoolsAddCtrl
 * @description
 * # StoragePoolsAddCtrl
 * Controller of the rainierApp
 */
angular.module('rainierApp')
    .controller('StoragePoolsAddCtrl', function ($scope, $routeParams, $timeout, orchestratorService, diskSizeService,
                                                 storagePoolService, objectTransformService, paginationService,
                                                 resourceTrackerService, storageSystemCapabilitiesService, utilService,
                                                 parityGroupService) {
        var storageSystemId = $routeParams.storageSystemId;

        var GET_PARITY_GROUPS_PATH = 'parity-groups';
        var GET_STORAGE_SYSTEMS_PATH = 'storage-systems';
        var defaultLow = 1;
        var defaultSubscriptionLimitValue = 100;
        var defaultSubscriptionLimitUnlimited = false;
        $scope.diskTypeSpeedToTier = {};

        $scope.$watch('model.storageSystem', function (val) {
            if (!val) {
                return;
            }
            orchestratorService.tiers().then(function (result) {
                var diskTypeSpeedToTier = {};
                $scope.tierKeys = _.pluck(result.tiers, 'tier');
                _.forEach(result.tiers, function(tier){
                    _.forEach(tier.subTiers, function(subTier){
                        diskTypeSpeedToTier[subTier.diskType + ' ' + diskSizeService.getDisplaySpeed(subTier.speed)] = tier.tier;
                    });
                });
                $scope.diskTypeSpeedToTier = diskTypeSpeedToTier;
            });

            orchestratorService.poolTemplate(val.storageSystemId)
                .then(function (result) {
                    $scope.model.poolTemplate = result;
                    $scope.model.utilizationThreshold1 = parseInt(result.utilizationThreshold1);
                    defaultLow = parseInt(result.utilizationThreshold1);
                    $scope.model.utilizationThreshold2 = parseInt(result.utilizationThreshold2);

                    $scope.model.subscriptionLimit = result.subscriptionLimit;
                    if (!utilService.isNullOrUndef(result.subscriptionLimit)) {
                        defaultSubscriptionLimitValue = result.subscriptionLimit.value;
                        defaultSubscriptionLimitUnlimited = result.subscriptionLimit.unlimited;
                    }
                    $scope.model.templateSubscriptionLimit = result.subscriptionLimit;

                    $scope.model.templateUtilizationThreshold1 = parseInt(result.utilizationThreshold1);
                    $scope.model.templateUtilizationThreshold2 = parseInt(result.utilizationThreshold2);
                    $scope.model.templateSuspendSnapshot = result.suspendSnapshot;
                });
            
            orchestratorService.licenses(val.storageSystemId).then(function (result) {
                $scope.model.htiPool = false;
                $scope.model.hasHdpLicense = false;
                $scope.model.hasHdtLicense = false;
                $scope.model.hasHtiLicense = false;
                $scope.model.hasActiveFlashLicense = false;
                $scope.model.activeFlashEnabled = false;
                $scope.model.ddmEnabled = false;
                $scope.model.activeFlashAllowed = false;
                $scope.model.suspendSnapshot = false;
                $scope.model.isShowSuspendSnapshot = false;
                $scope.model.isSupportDpTiIntegration = storageSystemCapabilitiesService.isSupportDpTiPoolIntegrationVersion(
                    $scope.model.storageSystem.model, $scope.model.storageSystem.firmwareVersion);
                    _.forEach(result.licenseSettings, function(license){
                        if (license.productName.toUpperCase() === 'ACTIVE FLASH' && license.installed === true){
                            $scope.model.hasActiveFlashLicense = true;
                        } else if (license.productName.toUpperCase() === 'THIN IMAGE' && license.installed === true) {
                            if ($scope.model.hasHtiLicense === false){
                                $scope.model.availablePoolTypes.push('HTI');
                            }
                            $scope.model.hasHtiLicense = true;
                        }
                        else if (license.productName.toUpperCase() === 'DYNAMIC PROVISIONING' && license.installed === true) {
                            if ($scope.model.hasHdpLicense === false){
                                $scope.model.availablePoolTypes.push('HDP');
                            }
                            $scope.model.hasHdpLicense = true;
                        }
                        else if (license.productName.toUpperCase() === 'DYNAMIC TIERING' && license.installed === true) {
                            if ($scope.model.hasHdtLicense === false){
                                $scope.model.availablePoolTypes.push('HDT');
                            }
                            $scope.model.hasHdtLicense = true;
                        }
                    }
                );
            });

            paginationService.getAllPromises(null, GET_PARITY_GROUPS_PATH, true, val.storageSystemId,
                objectTransformService.transformParityGroup).then(function(result) {
                var showAsAvailable = ['AVAILABLE', 'QUICK_FORMATTING', 'AVAILABLE_PHYSICAL'];
                var usableParityGroups = _.filter(result,
                    function(parityGroup) {
                        return (showAsAvailable.indexOf(parityGroup.status) > -1) &&
                            parityGroupService.isAvailableEncryptionStatus(parityGroup);
                    }
                );
                $scope.model.parityGroups = storagePoolService.filterParityGroups(usableParityGroups);
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
            });
        });

        $scope.$watchGroup(['model.poolTemplate', 'model.wizardType'], function (vals) {
            storagePoolService.watchTemplateTypeWizard($scope.model, vals, diskSizeService, false);
        });

        function dataVizModelForBasic(diskSizesByTier) {
            $scope.dataVizModel = storagePoolService.dataVizModelForBasic($scope.model, diskSizesByTier, $scope.tierKeys, diskSizeService);
        }

        $scope.$watch('model.diskSizesByTier', dataVizModelForBasic, true);

        $scope.$watch('model.poolType', function (val) {
            var poolType = val;
            $scope.model.disableUtilization = poolType === 'HTI' && $scope.model.wizardType === 'advanced';
            $scope.model.utilizationThreshold1 = defaultLow;
            if (!utilService.isNullOrUndef($scope.model.subscriptionLimit)) {
                $scope.model.subscriptionLimit.value = defaultSubscriptionLimitValue;
                $scope.model.subscriptionLimit.unlimited = defaultSubscriptionLimitUnlimited;
            }

            var supportPoolTypes = storageSystemCapabilitiesService.integratedSnapshotPoolType(
                $scope.model.storageSystem.model, $scope.model.storageSystem.firmwareVersion);
            if(_.contains(supportPoolTypes, poolType)) {
                $scope.model.suspendSnapshot = true;
                $scope.model.isShowSuspendSnapshot = true;
            } else {
                $scope.model.suspendSnapshot = null;
                $scope.model.isShowSuspendSnapshot = false;
            }
        });

        $scope.$watch('model.htiPool', function () {
            $scope.model.templateUtilizationThreshold1 = defaultLow;
            if (!utilService.isNullOrUndef($scope.model.templateSubscriptionLimit)) {
                $scope.model.templateSubscriptionLimit.value = defaultSubscriptionLimitValue;
                $scope.model.templateSubscriptionLimit.unlimited = defaultSubscriptionLimitUnlimited;
            }
        });

        function  dataVizModelForAdvanced(pgs) {
            $scope.dataVizModel = storagePoolService.dataVizModelForAdvanced($scope.model, pgs, diskSizeService);
        }

        $scope.$watch('model.parityGroups', dataVizModelForAdvanced, true);

        $scope.$watch('model.wizardType', function (wizardType) {
            if (!wizardType) {
                return;
            }

            if (wizardType === 'advanced') {
                $scope.model.selectedParityGroup = null;
                $scope.model.search = {
                    freeText : '',
                    diskSpec: {
                        type: null,
                        speed: null
                    },
                    raidLayout: null,
                    raidLevel: null,
                    encryption: null,
                    compression: null
                };
                dataVizModelForAdvanced($scope.model.parityGroups);
            }else if(wizardType === 'basic'){
                dataVizModelForBasic($scope.model.diskSizesByTier);

            }
        });

        $scope.$watch('model.ddmEnabled', function(){
            if($scope.model.ddmEnabled){
                $scope.model.subscriptionLimit = null;
            }
        })

        paginationService.getAllPromises(null, GET_STORAGE_SYSTEMS_PATH, true, null,
            objectTransformService.transformStorageSystem).then(function (result) {
            var storageSystems = result;
            var selectable = _.isUndefined(storageSystemId);

            var storageSystem = _.find(storageSystems, function (s) {
                return selectable || s.storageSystemId === storageSystemId;
            });

            $scope.model = {
                poolType: '',
                wizardType: 'basic',
                label: '',
                storageSystemSelectable: selectable,
                storageSystem: storageSystem,
                storageSystems: storageSystems,
                availablePoolTypes: [],
                hasHdpLicense: false,
                hasHdtLicense: false,
                hasHtiLicense: false,
                hasActiveFlashLicense: false,
                suspendSnapshot: null,
                editableSubscriptionLimit:
                    storageSystemCapabilitiesService.editableSubscriptionLimit(storageSystem.model)
            };

            $scope.payload = {
                submit: function () {
                    var setSubscriptionLimit = function (payload, subscriptionLimit) {
                        if($scope.model.ddmEnabled){
                            payload.subscriptionLimit = null;
                        } else if ($scope.model.editableSubscriptionLimit) {
                            payload.subscriptionLimit = subscriptionLimit;
                        }
                    };

                    if ($scope.model.wizardType === 'basic') {
                        var poolTemplateSubTiers = _.map($scope.model.selectedTiers, function (st) {
                            return {
                                name: st.name,
                                sizeToUseInBytes: st.selectedSize.diskSize.value + ''
                            };

                        });
                        var deployPayload = {
                            htiPool: $scope.model.htiPool,
                            label: $scope.model.label,
                            utilizationThreshold1: $scope.model.templateUtilizationThreshold1,
                            utilizationThreshold2: $scope.model.templateUtilizationThreshold2,
                            poolTemplateSubTiers: poolTemplateSubTiers,
                            suspendSnapshot: $scope.model.templateSuspendSnapshot
                        };
                        setSubscriptionLimit(deployPayload, $scope.model.templateSubscriptionLimit);

                        orchestratorService.deployPoolTemplate($scope.model.storageSystem.storageSystemId, deployPayload).then(function () {
                            window.history.back();
                        });
                    } else {
                        var isSuspendSnapshot = _.isBoolean($scope.model.suspendSnapshot) ?
                            $scope.model.suspendSnapshot : null;


                        var type = $scope.model.poolType;
                        var utilizationThreshold1 = $scope.model.utilizationThreshold1;
                        var utilizationThreshold2 = $scope.model.utilizationThreshold2;

                        if($scope.model.ddmEnabled){
                            type = 'HDP';
                            utilizationThreshold1 = null;
                            utilizationThreshold2 = null;
                        }


                        var createPoolPayload = {
                            type: type,
                            label: $scope.model.label,
                            activeFlashEnabled: $scope.model.activeFlashEnabled,
                            ddmEnabled: $scope.model.ddmEnabled,
                            utilizationThreshold1: utilizationThreshold1,
                            utilizationThreshold2: utilizationThreshold2,
                            parityGroupIds: $scope.model.selectedParityGroups,
                            suspendSnapshot: isSuspendSnapshot,
                            subscriptionLimit: null
                        };

                        setSubscriptionLimit(createPoolPayload, $scope.model.subscriptionLimit);

                        // Get selected parity groups on the pool
                        $scope.poolPgIds = [];
                        _.forEach($scope.model.selectedParityGroups, function (selectedPg) {
                            $scope.poolPgIds.push(selectedPg);
                        });

                        // Build reserved resources
                        var reservedResourcesList = [];
                        _.forEach($scope.poolPgIds, function (poolPgId) {
                            reservedResourcesList.push(poolPgId + '=' + resourceTrackerService.parityGroup());
                        });

                        // Show popup if resource is present in resource tracker else submit
                        resourceTrackerService.showReservedPopUpOrSubmit(reservedResourcesList, storageSystemId, resourceTrackerService.storageSystem(),
                            'Create Pool Confirmation', $scope.model.storageSystem.storageSystemId, null, createPoolPayload, orchestratorService.createStoragePool);

                    }
                },

                isInvalid: function () {
                    var isInvalid = !$scope.model || !$scope.model.storageSystem || !$scope.model.label ||
                        _.isEmpty($scope.model.label) ||  !$scope.model.availablePoolTypes;
                    
                    if(!isInvalid && $scope.model.subscriptionLimit){
                        var isHtiPool = $scope.model.htiPool;
                        if($scope.model.poolType){
                            isHtiPool = ($scope.model.poolType === 'HTI');
                        }
                        isInvalid = !utilService.isNullOrUndef($scope.model.subscriptionLimit) &&
                            !storagePoolService.isSubscriptionLimitValid(
                                isHtiPool,
                                $scope.model.subscriptionLimit.unlimited,
                                $scope.model.subscriptionLimit.value);
                    }
                    if (!isInvalid) {
                        if ($scope.model.wizardType === 'basic') {
                            if ($scope.model.poolType === 'HDT') {
                                isInvalid = _.size($scope.model.selectedTiers) < 2;
                            } else {
                                isInvalid = _.size($scope.model.selectedTiers) === 0;
                            }
                        } else {
                            isInvalid = _.size($scope.model.selectedParityGroups) === 0;
                            if(!$scope.model.ddmEnabled) {
                                isInvalid = isInvalid || _.isEmpty($scope.model.poolType);
                            }
                        }
                    }

                    return isInvalid;
                }

            };
        });
    });
