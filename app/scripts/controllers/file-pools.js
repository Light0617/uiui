'use strict';

/**
 * @ngdoc function
 * @name rainierApp.controller:StoragePoolsCtrl
 * @description
 * # StoragePoolsCtrl
 * Controller of the rainierApp
 */
angular.module('rainierApp')
    .controller('FilePoolsCtrl', function ($scope, $routeParams, $timeout, $filter, orchestratorService, objectTransformService, synchronousTranslateService, scrollDataSourceBuilderService, $location) {
        var storageSystemId = $routeParams.storageSystemId;
        var filePoolSummary;

        orchestratorService.filePoolSummary(storageSystemId).then(function (result) {
            filePoolSummary = result;
            return orchestratorService.filePools(storageSystemId);
        }).then(function (result) {
            var filePools = result.filePools;
            var dataModel = {
                file: true,
                title: synchronousTranslateService.translate('common-storage-system-file-pools'),
                titleTooltip: synchronousTranslateService.translate('file-pools-tooltip'),
                storageSystemId: storageSystemId,
                view: 'tile',
                allItemsSelected: false,
                filePoolSummary: filePoolSummary,
                search: {
                    freeText: '',
                    freeCapacity: {
                        min: 0,
                        max: 1000,
                        unit: 'PB'
                    },
                    totalCapacity: {
                        min: 0,
                        max: 1000,
                        unit: 'PB'
                    },
                    healthy: null
                },
                filePools: filePools,
                sort: {
                    field: 'usageBare',
                    reverse: true,
                    setSort: function (f) {
                        $timeout(function () {
                            if ($scope.dataModel.sort.field === f) {
                                $scope.dataModel.sort.reverse = !$scope.dataModel.sort.reverse;
                            }
                            else {
                                $scope.dataModel.sort.field = f;
                                $scope.dataModel.sort.reverse = false;
                            }
                        });
                    }
                }
            };

            objectTransformService.transformFilePoolsSummaryModel(dataModel);

            var actions = [
                {
                    icon: 'icon-delete',
                    tooltip :'action-tooltip-delete',
                    type: 'confirm',
                    confirmTitle: 'file-pool-delete-confirmation',
                    confirmMessage: 'file-pool-delete-selected-content',
                    enabled: function () {
                        return dataModel.anySelected();
                    },
                    onClick: function () {
                        _.forEach(dataModel.getSelectedItems(), function (item) {
                            orchestratorService.deleteFilePool(storageSystemId, item.id);
                        });
                    }
                },
                {
                    icon: 'icon-edit',
                    tooltip: 'action-tooltip-edit',
                    type: 'link',
                    enabled: function () {
                        return dataModel.onlyOneSelected();
                    },
                    onClick: function () {
                        if (dataModel.onlyOneSelected()) {
                            $location.path(['storage-systems', storageSystemId, 'file-pools',
                                _.first(dataModel.getSelectedItems()).id, 'expand'
                            ].join('/'));
                        }
                    }
                }
            ];

            dataModel.getActions = function () {
                return actions;
            };

            dataModel.addAction = function () {
                $location.path(['storage-systems', storageSystemId, 'file-pools', 'add'].join('/'));
            };

            dataModel.barData = [
                {
                    colorClass: 'file-used',
                    legendText: dataModel.usedLegend,
                    capacity: dataModel.usedCapacityInBytes
                },
                {
                    colorClass: 'file-allocated',
                    legendText: dataModel.allocatedLegend,
                    capacity: dataModel.physicalCapacityInBytes
                },
                {
                    colorClass: 'file-overcommited',
                    legendText: dataModel.overCommitLegend,
                    capacity: dataModel.capacityInBytes
                }
            ];

            $scope.dataModel = dataModel;
            scrollDataSourceBuilderService.setupDataLoader($scope, filePools, 'filePoolSearch');
        });

    });
