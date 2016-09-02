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
                                                        scrollDataSourceBuilderService) {


        orchestratorService.virtualStorageMachines().then(function (result) {
            _.forEach(result.resources, function (vsm) {
                objectTransformService.transformVirtualStorageMachine(vsm);
            });
            initView(result);
        });

        function initView(result) {
            var virtualStorageMachines = result.resources ? result.resources : [];

            $scope.dataModel = {
                title: 'Virtual storage machines',
                onlyOperation: true,
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
                // TODO: CDUAN Attribute name may change
                gridSettings: [
                    {
                        title: synchronousTranslateService.translate('fabric-tile-san-fabric-id'),
                        sizeClass: 'sixth',
                        sortField: 'storageSystemId',
                        getDisplayValue: function (item) {
                            return item.storageSystemId;
                        }
                    },
                    {
                        title: synchronousTranslateService.translate('fabric-tile-virtual-fabric-id'),
                        sizeClass: 'sixth',
                        sortField: 'model',
                        getDisplayValue: function (item) {
                            return item.model;
                        }

                    },
                    {
                        title: synchronousTranslateService.translate('fabric-tile-switch-type'),
                        sizeClass: 'sixth',
                        sortField: 'pairHACount',
                        getDisplayValue: function (item) {
                            return item.pairHACount;
                        }

                    },
                    {
                        title: synchronousTranslateService.translate('fabric-tile-switch-ip'),
                        sizeClass: 'quarter',
                        sortField: 'displayPhysicalStorageSystems',
                        getDisplayValue: function (item) {
                            return item.displayPhysicalStorageSystems;
                        }

                    }
                ]
            };

            scrollDataSourceBuilderService.setupDataLoader($scope, virtualStorageMachines, 'virtualStorageMachineSearch');
        }
    });
