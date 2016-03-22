'use strict';

/**
 * @ngdoc function
 * @name rainierApp.controller:volumeActionsConfirmationCtrl
 * @description
 * # volumeActionsRestoreSelectionCtrl
 * Controller of the rainierApp
 */
angular.module('rainierApp')
    .controller('volumeActionsRestoreSelectionCtrl', function ($scope, orchestratorService, $location, $routeParams,
                                                               ShareDataService, $filter, synchronousTranslateService,
                                                               storageSystemVolumeService, paginationService,
                                                               objectTransformService, $timeout, queryService) {
        var storageSystemId = $routeParams.storageSystemId;
        $scope.title = synchronousTranslateService.translate('restore-volume') + ' ' + ShareDataService.restorePrimaryVolumeId;

        if (!ShareDataService.SVolsList) {
            window.history.back();
        }
        var updateResultTotalCounts = function(result) {
            $scope.restorePrimaryVolumeToken = result.nextToken;
            $scope.volumeRows = result.resources;
        };

        $scope.selectedItem = null;
        $scope.orderByField = '';
        $scope.reverseSort = false;
        $scope.volumeRows = $filter('orderBy')(ShareDataService.SVolsList, 'originalSplitTime', true);
        $scope.restorePrimaryVolumeToken = ShareDataService.restorePrimaryVolumeToken;
        $scope.busy = false;
        $scope.setSort = function (f) {
            $timeout(function () {
                if ($scope.orderByField === f) {
                    queryService.setSort(f, !$scope.reverseSort);
                    $scope.reverseSort = !$scope.reverseSort;
                } else {
                    $scope.orderByField = f;
                    queryService.setSort(f, false);
                    $scope.reverseSort = false;
                }
                paginationService.getQuery(storageSystemVolumeService.VOLUME_PAIRS_PATH,
                    objectTransformService.transformVolumePairs, storageSystemId).then(function(result) {
                    updateResultTotalCounts(result);
                });
            });
        };
        $scope.loadMore = function () {
                if ($scope.restorePrimaryVolumeToken !== null && $scope.restorePrimaryVolumeToken !== undefined &&
                    !$scope.busy) {
                    $scope.busy = true;
                    storageSystemVolumeService.getVolumePairsAsPVol($scope.restorePrimaryVolumeToken,
                        ShareDataService.restorePrimaryVolumeId, storageSystemId).then(function (result) {
                            $scope.volumeRows =  $scope.volumeRows.concat(result.resources);
                            $scope.restorePrimaryVolumeToken = result.nextToken;
                            $scope.busy = false;
                        });
                }
        };

        if (!storageSystemId) {
            storageSystemId = ShareDataService.restoreStorageSystemId;
        }

        $scope.submit = function () {
            var selection = $scope.selectedItem;
            var payload = {
                secondaryVolumeId: selection.secondaryVolume.id.toString()
            };
            orchestratorService.restoreReplicationGroup(selection.primaryVolume.storageSystemId,
                selection.primaryVolume.id, payload).then(function () {window.history.back();});
        };

    });
