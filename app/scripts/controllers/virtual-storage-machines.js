'use strict';

/**
 * @ngdoc function
 * @name rainierApp.controller:VirtualStorageMachinesCtrl
 * @description
 * # VirtualStorageMachinesCtrl
 * Controller of the rainierApp
 */
angular.module('rainierApp')
    .controller('VirtualStorageMachinesCtrl', function ($scope, $timeout, $window, orchestratorService,
                                                        objectTransformService, synchronousTranslateService,
                                                        scrollDataSourceBuilderService, $location) {


        orchestratorService.virtualStorageMachines().then(function (result) {
            _.forEach(result.resources, function (vsm) {
                objectTransformService.transformVirtualStorageMachine(vsm);
            });
            initView(result);
        });

        function initView(result) {
            var virtualStorageMachines = result.resources ? result.resources : [];

            var dataModel = {
                title: 'Virtual storage machines',
                view: 'tile',
                total: virtualStorageMachines.length,

                search: {
                    freeText: ''
                },
                sort: {
                    field: 'storageSystemId',
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
                },
                gridSettings: [
                    {
                        title: synchronousTranslateService.translate('virtual-storage-system-id'),
                        sizeClass: 'sixth',
                        sortField: 'virtualStorageMachineId',
                        getDisplayValue: function (item) {
                            return item.virtualStorageMachineId;
                        },
                        type: 'id'
                    },
                    {
                        title: synchronousTranslateService.translate('storage-systems-model'),
                        sizeClass: 'sixth',
                        sortField: 'productModel',
                        getDisplayValue: function (item) {
                            return item.model;
                        }

                    }
                ],
                displayList: virtualStorageMachines
            };

            var actions = [
                {
                    icon: 'icon-delete',
                    tooltip :'action-tooltip-delete',
                    type: 'confirm',
                    confirmTitle: 'virtual-storage-machine-delete-confirmation',
                    confirmMessage: 'virtual-storage-machine-delete-selected-content',
                    enabled: function () {
                        return dataModel.anySelected();
                    },
                    onClick: function () {
                        _.forEach(dataModel.getSelectedItems(), function (item) {
                            item.actions.delete.onClick(orchestratorService);
                        });
                    }
                },
                {
                    icon: 'icon-add-volume',
                    tooltip: 'action-tooltip-edit',
                    type: 'link',
                    enabled: function () {
                        return dataModel.onlyOneSelected();
                    },
                    onClick: function () {
                        var selectedVsm = _.where(dataModel.displayList, 'selected');
                        var virtualStorageMachineId = selectedVsm[0].virtualStorageMachineId;
                        $location.path(['virtual-storage-machines', virtualStorageMachineId, 'add-existing-volumes'].join('/'));
                    }
                }
            ];

            dataModel.getActions = function () {
                return actions;
            };

            $scope.dataModel = dataModel;

            scrollDataSourceBuilderService.setupDataLoader($scope, virtualStorageMachines, 'virtualStorageMachineSearch');
        }
    });
