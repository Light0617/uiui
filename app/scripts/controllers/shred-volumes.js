/*
 * ========================================================================
 *
 * Copyright (c) by Hitachi Vantara, 2018. All rights reserved.
 *
 * ========================================================================
 */

'use strict';

/**
 * @ngdoc function
 * @name rainierApp.controller:ShredVolumesCtrl
 * @description
 * # ShredVolumesCtrl
 * Controller of the rainierApp
 */
angular.module('rainierApp')
    .controller('ShredVolumesCtrl', function ($scope, $routeParams, ShareDataService, orchestratorService,
                                              resourceTrackerService) {
        $scope.dataModel = {};
        $scope.validationForm = {};
        var storageSystemId = $routeParams.storageSystemId;
        var patternRegexp = /^[a-fA-F0-9]{1,8}$/;

        $scope.dataModel = {
            wizardType: 'basic',
            selectedVolumes: ShareDataService.selectedVolumes,
            minPass: 1,
            maxPass: 7,
            numOfPass: 1,
            shreddingMode: 'BASIC',
            showCurrentVolume: false,
            basicShreddingPattern: '00000000-FFFFFFFF-00000000',
            itemList:[],
            currentVolume: '',
            selectVolume: function (label) {
                $scope.dataModel.currentVolume = label;
                $scope.dataModel.showCurrentVolume = true;
            },
            updatePattern: function (index) {
                $scope.dataModel.validatePatterns();
            },
            validateVolumes: function () {
                return ($scope.dataModel.selectedVolumes !== undefined && $scope.dataModel.selectedVolumes.length > 0
                    && $scope.dataModel.selectedVolumes.length <= 300);
            },
            validatePatterns: function () {
                if (!$scope.dataModel.itemList || $scope.dataModel.itemList.length == 0) {
                    return false;
                }
                return _.all($scope.dataModel.itemList, function(item) {
                    return (item.pattern) && item.pattern.match(patternRegexp);
                });
            },
            canSubmit: function () {
                var volumeValid = $scope.dataModel.validateVolumes();
                var inputValid = $scope.dataModel.shreddingMode === 'BASIC' ||
                    $scope.dataModel.shreddingMode === 'ADVANCED' && $scope.dataModel.validatePatterns();
                return volumeValid && inputValid;
            },
            submit: function () {
                var volumeIds = _.map($scope.dataModel.selectedVolumes, function(item){
                    return item.volumeId;
                });
                var shredVolumesPayload = {
                    storageSystemId: storageSystemId,
                    volumeIds: volumeIds
                };

                var patterns = [];
                if ($scope.dataModel.shreddingMode === 'ADVANCED') {
                    var patterns = _.map(_.range(0, $scope.dataModel.numOfPass), function (index) {
                        return '0x' + $scope.dataModel.itemList[index].pattern.trim();
                    });
                    shredVolumesPayload.patterns = patterns;
                }

                // Build reserved resources
                var reservedResourcesList = [];
                _.forEach(volumeIds, function (volumeId) {
                    reservedResourcesList.push(volumeId + '=' + resourceTrackerService.volume());
                });

                // Show popup if resource is present in resource tracker else submit
                resourceTrackerService.showReservedPopUpOrSubmit(reservedResourcesList, storageSystemId,
                    resourceTrackerService.storageSystem(), 'Shred Volumes Confirmation', null, null,
                    shredVolumesPayload, orchestratorService.shredVolumes);
            }
        };

        $scope.dataModel.updateNumOfPass = function () {
            var numOfPasses = $scope.dataModel.numOfPass;
            if (numOfPasses === undefined || numOfPasses < 1 || numOfPasses > 7) {
                return;
            }
            var passPatternItems = _.map(_.range(0, numOfPasses), function (index) {
                if ($scope.dataModel.itemList && $scope.dataModel.itemList.length > index) {
                    return $scope.dataModel.itemList[index];
                }
                var patternItem = {
                    index: index,
                    pattern: 'FFFFFFFF'
                };
                return patternItem;
            });

            $scope.dataModel.itemList = passPatternItems;
        };

        $scope.$watch('dataModel.shreddingMode', function (newVal) {
            if (newVal === 'ADVANCED') {
                $scope.dataModel.updateNumOfPass();
            }
        });

    });
