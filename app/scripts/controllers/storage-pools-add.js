'use strict';

/**
 * @ngdoc function
 * @name rainierApp.controller:StoragePoolsAddCtrl
 * @description
 * # StoragePoolsAddCtrl
 * Controller of the rainierApp
 */
angular.module('rainierApp')
    .controller('StoragePoolsAddCtrl', function ($scope, $routeParams, $timeout, orchestratorService, diskSizeService, storagePoolService, objectTransformService, paginationService) {
        var storageSystemId = $routeParams.storageSystemId;

        var GET_PARITY_GROUPS_PATH = 'parity-groups';
        var GET_STORAGE_SYSTEMS_PATH = 'storage-systems';
        var defaultLow = 0;
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
                    defaultSubscriptionLimitValue = result.subscriptionLimit.value;
                    defaultSubscriptionLimitUnlimited = result.subscriptionLimit.unlimited;
                    $scope.model.templateUtilizationThreshold1 = parseInt(result.utilizationThreshold1);
                    $scope.model.templateUtilizationThreshold2 = parseInt(result.utilizationThreshold2);
                    $scope.model.templateSubscriptionLimit = result.subscriptionLimit;
                });
            
            orchestratorService.licenses(val.storageSystemId).then(function (result) {
                $scope.model.htiPool = false;
                $scope.model.hasHdpLicense = false;
                $scope.model.hasHdtLicense = false;
                $scope.model.hasHtiLicense = false;
                $scope.model.hasActiveFlashLicense = false;
                $scope.model.activeFlashEnabled = false;
                $scope.model.activeFlashAllowed = false;
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
                var showAsAvailable = ['AVAILABLE', 'QUICK_FORMATTING'];
                var usableParityGroups = _.filter(result,
                    function(parityGroup) {
                        return (showAsAvailable.indexOf(parityGroup.status) > -1);
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
            $scope.model.disableUtilization = val === 'HTI' && $scope.model.wizardType === 'advanced';
            $scope.model.utilizationThreshold1 = defaultLow;
            $scope.model.subscriptionLimit.value = defaultSubscriptionLimitValue;
            $scope.model.subscriptionLimit.unlimited = defaultSubscriptionLimitUnlimited;
        });

        $scope.$watch('model.htiPool', function () {
            $scope.model.templateUtilizationThreshold1 = defaultLow;
            $scope.model.templateSubscriptionLimit.value = defaultSubscriptionLimitValue;
            $scope.model.templateSubscriptionLimit.unlimited = defaultSubscriptionLimitUnlimited;
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
            }
        });

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
                hasActiveFlashLicense: false
            };

            $scope.payload = {
                submit: function () {
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
                            subscriptionLimit: $scope.model.templateSubscriptionLimit,
                            poolTemplateSubTiers: poolTemplateSubTiers
                        };
                        orchestratorService.deployPoolTemplate($scope.model.storageSystem.storageSystemId, deployPayload).then(function () {
                            window.history.back();
                        });
                    } else {
                        var createPoolPayload = {
                            type: $scope.model.poolType,
                            label: $scope.model.label,
                            activeFlashEnabled: $scope.model.activeFlashEnabled,
                            utilizationThreshold1: $scope.model.utilizationThreshold1,
                            utilizationThreshold2: $scope.model.utilizationThreshold2,
                            subscriptionLimit: $scope.model.subscriptionLimit,
                            parityGroupIds: $scope.model.selectedParityGroups
                        };
                        orchestratorService.createStoragePool($scope.model.storageSystem.storageSystemId, createPoolPayload).then(function () {
                            window.history.back();
                        });
                    }


                },
                isInvalid: function () {
                    var isInvalid = !$scope.model || !$scope.model.storageSystem || !$scope.model.label ||
                        _.isEmpty($scope.model.label) ||  !$scope.model.availablePoolTypes || $scope.model.availablePoolTypes.length === 0;
                    
                    if(!isInvalid && $scope.model.subscriptionLimit){
                        var isHtiPool = $scope.model.htiPool;
                        if($scope.model.poolType){
                            isHtiPool = ($scope.model.poolType === 'HTI');
                        }
                        isInvalid = !storagePoolService.isSubscriptionLimitValid(isHtiPool, $scope.model.subscriptionLimit.unlimited, $scope.model.subscriptionLimit.value);    
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
                            isInvalid = isInvalid || _.isEmpty($scope.model.poolType);
                        }
                    }

                    return isInvalid;
                }

            };
        });
    });
