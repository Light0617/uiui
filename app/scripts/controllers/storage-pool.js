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

            result.compressedParityGroups = _.filter(result.parityGroups, function(pg) { return pg.compression; });
            result.actionsList = _.map(result.actions);
            result.utilizationThreshold1 = addPercentageSign(result.utilizationThreshold1);
            result.utilizationThreshold2 = addPercentageSign(result.utilizationThreshold2);
            result.subscriptionLimit.value = addPercentageSign(result.subscriptionLimit.value);
            result.logicalCapacityInBytes = getSizeDisplayText(diskSizeService.getDisplaySize(result.logicalCapacityInBytes));
            result.usedLogicalCapacityInBytes = getSizeDisplayText(diskSizeService.getDisplaySize(result.usedLogicalCapacityInBytes));
            result.availableLogicalCapacityInBytes = getSizeDisplayText(diskSizeService.getDisplaySize(result.availableLogicalCapacityInBytes));
            result.expansionRate = addColonSign(1, result.expansionRate);
            result.compressionRate = addColonSign(result.compressionRate, 1);
            result.savingsPercentage = addPercentageSign(result.savingsPercentage);
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
