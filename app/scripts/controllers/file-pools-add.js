'use strict';

/**
 * @ngdoc function
 * @name rainierApp.controller:FilePoolsAddCtrl
 * @description
 * # FilePoolsAddCtrl
 * Controller of the rainierApp
 */
angular.module('rainierApp')
    .controller('FilePoolsAddCtrl', function ($scope, $routeParams, fileSystemService, $location, $timeout, $window, $filter, orchestratorService,
                                              objectTransformService, filePoolService, diskSizeService, synchronousTranslateService) {
        var storageSystemId = $routeParams.storageSystemId;
        var platinumName;
        $scope.diskTypeSpeedToTier = {};

        orchestratorService.filePoolTemplate(storageSystemId).then(function (template) {
            var dataModel = {
                validationForm: {
                    label: ''
                },
                tierManagement: function() {
                    $location.path('/tier-management');
                }
            };
            $scope.dataModel = dataModel;
            var diskTypeSpeedToTier = {};
            $scope.tierKeys = _.pluck(template.tiers, 'name');
            _.forEach(template.tiers, function(tier){
                _.forEach(tier.templateSubTiers, function(subTier){
                    diskTypeSpeedToTier[subTier.diskType + ' ' + diskSizeService.getDisplaySpeed(subTier.speed)] = tier.tier;
                });
            });
            $scope.diskTypeSpeedToTier = diskTypeSpeedToTier;
            $scope.dataModel.template = template;
            $scope.dataModel.selectedStorageSystem = storageSystemId;
            $scope.dataModel.subscriptionLimit = template.overCommitRatio + '%';
            $scope.dataModel.max = 10;
            $scope.dataModel.min = 1;
            $scope.dataModel.iops = 0;
            $scope.dataModel.warning = synchronousTranslateService.translate('file-pool-raid-warning');

            $scope.dataModel.submit = function () {
                var tiers = [];
                var dataModel = $scope.dataModel;
                if($scope.dataModel.selectedCapacity) {
                    tiers.push({
                        capacity: dataModel.selectedCapacity.capacity.value.toString(),
                        diskType: dataModel.selectedCapacity.diskType,
                        raidLevel: dataModel.selectedCapacity.raidLevel,
                        raidLayout: dataModel.selectedCapacity.raidLayout,
                        speed: dataModel.selectedCapacity.speed,
                        sizeToUse: dataModel.selectedCapacity.requestedCapacity.value.toString(),
                        name: dataModel.selectedCapacity.name
                    });
                }
                if($scope.dataModel.selectedPlatinumCapacity) {
                    tiers.push({
                        capacity: dataModel.selectedPlatinumCapacity.capacity.value.toString(),
                        diskType: dataModel.selectedPlatinumCapacity.diskType,
                        raidLevel: dataModel.selectedPlatinumCapacity.raidLevel,
                        raidLayout: dataModel.selectedPlatinumCapacity.raidLayout,
                        speed: dataModel.selectedPlatinumCapacity.speed,
                        sizeToUse: dataModel.selectedPlatinumCapacity.requestedCapacity.value.toString(),
                        name: dataModel.selectedPlatinumCapacity.name
                    });
                }
                var payload = {
                    label: $scope.dataModel.label,
                    templateTiers: tiers,
                    utilizationThreshold1: $scope.dataModel.template.utilizationThreshold1,
                    utilizationThreshold2: $scope.dataModel.template.utilizationThreshold2
                };
                orchestratorService.createFilePool(storageSystemId, payload).then(function () {
                 window.history.back();
                 });
            };

            $scope.dataModel.canSubmit = function () {
                return $scope.dataModel.validationForm.label.$valid && $scope.dataModel.selectedCapacity ||
                    $scope.dataModel.selectedPlatinumCapacity;
            };

            $scope.$watch('dataModel.template', function (val) {
                filePoolService.watchTemplateTypeWizard($scope.dataModel, val, diskSizeService);
                platinumName = _.first($scope.dataModel.diskSizesByTier).name;
            });

            $scope.$watch('dataModel.poolTiered', function () {
                filePoolService.uncheckSelection($scope.dataModel);
            });

            $scope.$watchGroup(['dataModel.selectedCapacity', 'dataModel.selectedPlatinumCapacity'], function (vals) {
                var summaryModel = objectTransformService.transformCreateTieredFilePoolCapacitySummaryModel(vals, template.overCommitRatio);
                summaryModel.noBreakdown = true;

                $scope.dataModel.keyAndColors = filePoolService.getKeyAndColors(_.first(summaryModel.arrayDataVisualizationModel.items));
                $scope.dataModel.summaryModel = summaryModel;
                $scope.dataModel.iops = filePoolService.calculateIops(vals, $scope.dataModel.template.overCommitRatio, platinumName);
            }, true);
        });


    });
