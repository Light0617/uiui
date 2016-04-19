'use strict';

/**
 * @ngdoc function
 * @name rainierApp.controller:FilePoolsExpandCtrl
 * @description
 * # FilePoolsExpandCtrl
 * Controller of the rainierApp
 */
angular.module('rainierApp')
    .controller('FilePoolsExpandCtrl', function ($scope, $routeParams, fileSystemService, $location, $timeout, $window, $filter, orchestratorService,
                                              objectTransformService, filePoolService, diskSizeService) {
        var storageSystemId = $routeParams.storageSystemId;
        var filePoolId = $routeParams.filePoolId;

        $scope.diskTypeSpeedToTier = {};

        orchestratorService.filePoolExpandTemplate(storageSystemId, filePoolId).then(function (template) {
            var dataModel = {
                validationForm: {
                    label: ''
                },
                validationFormRight: {
                    utilizationThreshold1: '',
                    utilizationThreshold2: '',
                    utilizationSlider1: '',
                    utilizationSlider2: ''
                },
                tierManagement: function() {
                    $location.path('/tier-management');
                },
                expand: true
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
            $scope.dataModel.max = 10;
            $scope.dataModel.min = 1;
            $scope.dataModel.label = template.label;

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
                    templateTiers: tiers,
                    utilizationThreshold1: $scope.dataModel.template.utilizationThreshold1,
                    utilizationThreshold2: $scope.dataModel.template.utilizationThreshold2
                };
                if(template.label !== dataModel.label) {
                    payload['label'] = dataModel.label;
                }
                orchestratorService.expandFilePool(storageSystemId, filePoolId, payload).then(function () {
                 window.history.back();
                 });
            };

            $scope.dataModel.canSubmit = function () {
                return $scope.dataModel.validationForm.label.$valid && $scope.dataModel.validationForm.label.$dirty ||
                    $scope.dataModel.selectedCapacity || $scope.dataModel.selectedPlatinumCapacity ||
                    ($scope.dataModel.validationFormRight.utilizationThreshold1.$valid &&
                    $scope.dataModel.validationFormRight.utilizationThreshold1.$dirty && $scope.dataModel.expand) ||
                    ($scope.dataModel.validationFormRight.utilizationThreshold2.$valid &&
                    $scope.dataModel.validationFormRight.utilizationThreshold2.$dirty && $scope.dataModel.expand) ||
                    ($scope.dataModel.validationFormRight.utilizationSlider1.$valid &&
                    $scope.dataModel.validationFormRight.utilizationSlider1.$dirty && $scope.dataModel.expand) ||
                    ($scope.dataModel.validationFormRight.utilizationSlider2.$valid &&
                    $scope.dataModel.validationFormRight.utilizationSlider2.$dirty && $scope.dataModel.expand);
            };

            $scope.$watch('dataModel.template', function (val) {
                filePoolService.watchTemplateTypeWizard($scope.dataModel, val, diskSizeService);
            });

            $scope.$watch('dataModel.poolTiered', function () {
                filePoolService.uncheckSelection($scope.dataModel);
            });

            $scope.$watchGroup(['dataModel.selectedCapacity', 'dataModel.selectedPlatinumCapacity'], function (vals) {
                var summaryModel = objectTransformService.transformCreateTieredFilePoolCapacitySummaryModel(vals, template.overCommitRatio);
                summaryModel.noBreakdown = true;

                $scope.dataModel.keyAndColors = filePoolService.getKeyAndColors(_.first(summaryModel.arrayDataVisualizationModel.items));
                $scope.dataModel.summaryModel = summaryModel;
            }, true);
        });


    });
