'use strict';

/**
 * @ngdoc function
 * @name rainierApp.controller:replicationGroupActionsConfirmationCtrl
 * @description
 * # replicationGroupActionsConfirmationCtrl
 * Controller of the rainierApp
 */
angular.module('rainierApp')
    .controller('replicationGroupActionsConfirmationCtrl', function ($scope, orchestratorService, objectTransformService, scrollDataSourceBuilderService, $routeParams, $timeout, ShareDataService) {
        var storageSystemId = $routeParams.storageSystemId;
        var action = ShareDataService.replicationGroupAction;
        var replicationGroup = ShareDataService.selectedReplicationGroup;
        if (!action || !replicationGroup) {
            window.history.back();
        }

        orchestratorService.affectedVolumePairsByReplicationGroup(storageSystemId, _.first(replicationGroup).id).then(function (result) {
            _.forEach (result.volumePairs, function (vp) {
                objectTransformService.transformVolumePairs(vp);
            });
            $scope.dataModel = {
                affectedVolumePairs: result.volumePairs,
                view: 'list',
                pageAction: action,
                sort: {
                    field: 'primaryVolume.id',
                    reverse: false,
                    setSort: function (f) {
                        $timeout(function () {
                            if ($scope.dataModel.sort.field === f) {
                                $scope.dataModel.sort.reverse = !$scope.dataModel.sort.reverse;
                            } else {
                                $scope.dataModel.sort.field = f;
                                $scope.dataModel.sort.reverse = false;
                            }
                        });
                    }
                }
            };
            scrollDataSourceBuilderService.setupDataLoader($scope, $scope.dataModel.affectedVolumePairs);
        });

        $scope.submitActions = function () {
            var selectedReplicationGroup = _.first(replicationGroup);
            var payload;
            switch (action) {
                case 'suspend':
                    if (selectedReplicationGroup.type === 'Snapshot') {
                        payload = {
                            'scheduleEnabled': false
                        };
                        orchestratorService.editReplicationGroup(storageSystemId, selectedReplicationGroup.id, payload).then(function () {
                            window.history.back();
                        });
                    } else {
                        orchestratorService.suspendReplicationGroup(storageSystemId, selectedReplicationGroup.id).then(function () {
                            window.history.back();
                        });
                    }
                    break;
                case 'resume':
                    if (selectedReplicationGroup.type === 'Snapshot') {
                        payload = {
                            'scheduleEnabled': true
                        };
                        orchestratorService.editReplicationGroup(storageSystemId, selectedReplicationGroup.id, payload).then(function () {
                            window.history.back();
                        });
                    } else {
                        orchestratorService.resumeReplicationGroup(storageSystemId, _.first(replicationGroup).id).then(function () {
                            window.history.back();
                        });
                    }
                    break;
                case 'delete':
                    orchestratorService.deleteReplicationGroup(storageSystemId, _.first(replicationGroup).id).then(function () {
                        window.history.back();
                    });
                    break;
            }
        };
    });
