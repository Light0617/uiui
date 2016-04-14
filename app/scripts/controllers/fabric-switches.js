'use strict';

/**
 * @ngdoc function
 * @name rainierApp.controller:FabricSwitchesCtrl
 * @description
 * # FabricSwitchesCtrl
 * Controller of the rainierApp
 */
angular.module('rainierApp')
    .controller('FabricSwitchesCtrl', function ($scope, $timeout, $window, orchestratorService, objectTransformService, synchronousTranslateService, paginationService, scrollDataSourceBuilderServiceNew, ShareDataService, queryService) {

        var GET_FABRICS_PATH = 'san-fabrics';

        paginationService.get(null, GET_FABRICS_PATH, objectTransformService.transformFabricSwitch, true).then(function (result) {
            initView(result);
        });

        function initView(result) {
            var fabrics = result.resources ? result.resources : [];

            $scope.dataModel = {
                title: 'Fabric Switches',
                view: 'tile',
                nextToken: result.nextToken,
                total: result.total,
                sort: {
                    field: 'sanFabricId',
                    reverse: false,
                    setSort: function (f) {
                        $timeout(function () {
                            if ($scope.dataModel.sort.field === f) {
                                queryService.setSort(f, !$scope.dataModel.sort.reverse);
                                $scope.dataModel.sort.reverse = !$scope.dataModel.sort.reverse;
                            } else {
                                $scope.dataModel.sort.field = f;
                                queryService.setSort(f, false);
                                $scope.dataModel.sort.reverse = false;
                            }
                            paginationService.getQuery(GET_FABRICS_PATH, objectTransformService.transformFabricSwitch).then(function(result) {
                                updateResultTotalCounts(result);
                            });
                        });
                    }
                },
                gridSettings: [
                    {
                        title: synchronousTranslateService.translate('fabric-tile-san-fabric-id'),
                        sizeClass: 'sixth',
                        sortField: 'sanFabricId',
                        getDisplayValue: function (item) {
                            return item.sanFabricId;
                        }
                    },
                    {
                        title: synchronousTranslateService.translate('fabric-tile-virtual-fabric-id'),
                        sizeClass: 'sixth',
                        sortField: 'virtualFabricId',
                        getDisplayValue: function (item) {
                            return item.virtualFabricIdDisplay;
                        }

                    },
                    {
                        title: synchronousTranslateService.translate('fabric-tile-switch-type'),
                        sizeClass: 'sixth',
                        sortField: 'switchType',
                        getDisplayValue: function (item) {
                            return item.switchType;
                        }

                    },
                    {
                        title: synchronousTranslateService.translate('fabric-tile-switch-ip'),
                        sizeClass: 'sixth',
                        sortField: 'principalSwitchAddress',
                        getDisplayValue: function (item) {
                            return item.principalSwitchAddress;
                        }

                    },
                    {
                        title: synchronousTranslateService.translate('fabric-tile-switch-username'),
                        sizeClass: 'twelfth',
                        sortField: 'principalSwitchUsername',
                        getDisplayValue: function (item) {
                            return item.principalSwitchUsername;
                        }
                    }
                ]
            };

            var updateResultTotalCounts = function(result) {
                $scope.dataModel.nextToken = result.nextToken;
                $scope.dataModel.displayList = result.resources;
                $scope.dataModel.itemCounts = {
                    filtered: $scope.dataModel.displayList.length,
                    total: $scope.dataModel.total
                };
            };

            $scope.dataModel.getResources = function(){
                return paginationService.get($scope.dataModel.nextToken, GET_FABRICS_PATH, objectTransformService.transformFabricSwitch, false);
            };
            $scope.dataModel.displayList = fabrics;

            $scope.filterModel = {
                filter: {
                    freeText: '',
                    switchType: ''
                },
                filterQuery: function (key, value, type, arrayClearKey) {
                    var queryObject = new paginationService.QueryObject(key, type, value, arrayClearKey);
                    paginationService.setFilterSearch(queryObject);
                    paginationService.getQuery(GET_FABRICS_PATH, objectTransformService.transformFabricSwitch).then(function(result) {
                        updateResultTotalCounts(result);
                    });
                },
                searchQuery: function (value) {
                    var queryObjects = [];
                    queryObjects.push(new paginationService.QueryObject('sanFabricId', new paginationService.SearchType().INT, value));
                    paginationService.setTextSearch(queryObjects);
                    paginationService.getQuery(GET_FABRICS_PATH, objectTransformService.transformFabricSwitch).then(function(result) {
                        updateResultTotalCounts(result);
                    });
                }
            };


            var actions = [
                {
                    icon: 'icon-edit',
                    tooltip :'action-tooltip-edit',
                    type: 'link',
                    enabled: function () {
                        return $scope.dataModel.onlyOneSelected();
                    },
                    onClick: function () {
                        $scope.editSelected();
                    }
                },
                {
                    icon: 'icon-delete',
                    tooltip :'action-tooltip-delete',
                    type: 'confirm',
                    confirmTitle: 'fabric-switch-delete-confirmation',
                    confirmMessage: 'fabric-switch-delete-selected-content',
                    enabled: function () {
                        return $scope.dataModel.anySelected();
                    },
                    onClick: function () {
                        $scope.deleteSelectedConfirmOk();
                    }
                }
            ];

            $scope.dataModel.getActions = function () {
                return actions;
            };

            $scope.dataModel.addAction = function () {
                $window.location.href = '#/fabric-switches/add';
            };

            scrollDataSourceBuilderServiceNew.setupDataLoader($scope, fabrics, 'fabricSwitchSearch');
        }

        $scope.deleteSelectedConfirmOk = function () {
            deleteFabrics();
        };

        function deleteFabrics() {
            var deletedCount = 0;
            var selectedFabrics = $scope.dataModel.getSelectedItems().length;
            _.forEach($scope.dataModel.getSelectedItems(), function (fabricSwitch) {
                ++deletedCount;
                if(deletedCount === selectedFabrics) {
                    lastDelete(fabricSwitch);
                }else{
                    orchestratorService.deleteFabric(fabricSwitch.sanFabricId);
                }
            });
        }

        function lastDelete (fabricSwitch) {
            orchestratorService.deleteFabric(fabricSwitch.sanFabricId).then(function () {
                orchestratorService.fabrics().then(function (results) {
                    initView(results);
                });
            });
        }

        $scope.editSelected = function () {
            var fabricSwitch;
            for (var i = 0; i < $scope.dataModel.displayList.length; ++i) {
                fabricSwitch = $scope.dataModel.displayList[i];
                if (fabricSwitch.selected) {
                    ShareDataService.editFabricSwitch = $scope.dataModel.displayList[i];
                    $window.location.href = '#/fabric-switches/' + $scope.dataModel.displayList[i].sanFabricId + '/update';
                }
            }
        };
    });
