'use strict';

/**
 * @ngdoc function
 * @name rainierApp.controller:StoragePoolCtrl
 * @description
 * # StoragePoolCtrl
 * Controller of the rainierApp
 */
angular.module('rainierApp')
    .controller('StoragePoolCtrl', function ($scope, $routeParams, $window, orchestratorService, objectTransformService, diskSizeService) {
        var storageSystemId = $routeParams.storageSystemId;
        var storagePoolId = $routeParams.storagePoolId;

        orchestratorService.storagePool(storageSystemId, storagePoolId).then(function (result) {

            var summaryModel = objectTransformService.transformToPoolSummaryModel(result);
            summaryModel.title = 'Storage pool ' + storagePoolId;
            summaryModel.noBreakdown = true;
            $scope.summaryModel = summaryModel;
            result.orchestratorService = orchestratorService;

            result.actionsList = _.map(result.actions);
            result.utilizationThreshold1 = addPercentageSign(result.utilizationThreshold1);
            result.utilizationThreshold2 = addPercentageSign(result.utilizationThreshold2);
            result.subscriptionLimit.value = addPercentageSign(result.subscriptionLimit.value);
            result.physicalCapacityInBytes = getSizeDisplayText(diskSizeService.getDisplaySize(result.physicalCapacityInBytes));
            result.usedPhysicalCapacityInBytes = getSizeDisplayText(diskSizeService.getDisplaySize(result.usedPhysicalCapacityInBytes));
            result.availablePhysicalCapacityInBytes = getSizeDisplayText(diskSizeService.getDisplaySize(result.availablePhysicalCapacityInBytes));
            result.expansionRate = addColonSign(1, result.expansionRate);
            result.compressionRate = addColonSign(result.compressionRate, 1);
            $scope.dataModel = result;
        });

        function addPercentageSign (value) {
            return value + '%';
        }

        function addColonSign (value1, value2) {
            return value1 + ':' + value2;
        }

        function getSizeDisplayText (object) {
            return object.size + ' ' + object.unit;
        }
    });
