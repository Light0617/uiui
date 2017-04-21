'use strict';

/**
 * @ngdoc function
 * @name rainierApp.controller:ExternalParityGroupsCtrl
 * @description
 * # ExternalParityGroupsCtrl
 * Controller of the rainierApp
 */
angular.module('rainierApp')
    .controller('ExternalParityGroupsCtrl', function ($scope, $routeParams, $timeout, orchestratorService,  synchronousTranslateService, scrollDataSourceBuilderServiceNew, 
                                                      objectTransformService, queryService, paginationService) {
        var storageSystemId = $routeParams.storageSystemId;
        var title = synchronousTranslateService.translate('common-external-parity-groups');
        var getExternalParityGroupPath = 'external-parity-groups';
        orchestratorService.storageSystem(storageSystemId).then(function (result) {
            $scope.storageSystemModel= result.model;
        });

        paginationService.get(null, getExternalParityGroupPath, objectTransformService.transformExternalParityGroup, true, storageSystemId).then(function (result) {
            var dataModel = {
                storageSystemId: storageSystemId,
                title: title,
                view: 'tile',
                parityGroups: result.resources,
                onlyOperation: true,
                sort: {
                    field: 'externalParityGroupId',
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
                            paginationService.getQuery(getExternalParityGroupPath, objectTransformService.transformExternalParityGroup, storageSystemId).then(function(result) {
                                updateResultTotalCounts(result);
                            });
                        });
                    }
                },
                getSelectedExternalParityGroupCount: function () {
                    var selectedCount = 0;
                    _.forEach($scope.dataModel.displayList, function (externalParityGroup) {
                        if (externalParityGroup.selected === true) {
                            selectedCount++;
                        }
                    });

                    return selectedCount;
                }
            };

            var updateResultTotalCounts = function(result) {
                $scope.dataModel.nextToken = result.nextToken;
                $scope.dataModel.cachedList = result.resources;
                $scope.dataModel.displayList = result.resources.slice(0, scrollDataSourceBuilderServiceNew.showedPageSize);
                $scope.dataModel.itemCounts = {
                    filtered: $scope.dataModel.displayList.length,
                    total: $scope.dataModel.total
                };
            };
            
            $scope.filterModel = {
                filter: {
                    freeText: '',
                    totalCapacity: {
                        min: 0,
                        max: 1000,
                        unit: 'PB'
                    }
                },
                filterQuery: function (key, value, type, arrayClearKey) {
                    var queryObject = new paginationService.QueryObject(key, type, value, arrayClearKey);
                    paginationService.setFilterSearch(queryObject);
                    paginationService.getQuery(getExternalParityGroupPath, objectTransformService.transformExternalParityGroup, storageSystemId).then(function(result) {
                        updateResultTotalCounts(result);
                    });
                },
                sliderQuery: function(key, start, end, unit) {
                    paginationService.setSliderSearch(key, start, end, unit);
                    paginationService.getQuery(getExternalParityGroupPath, objectTransformService.transformExternalParityGroup, storageSystemId).then(function(result) {
                        updateResultTotalCounts(result);
                    });
                },
                searchQuery: function (value) {
                    var queryObjects = [];
                    queryObjects.push(new paginationService.QueryObject('externalParityGroupId', new paginationService.SearchType().STRING, value));
                    queryObjects.push(new paginationService.QueryObject('externalStorageVendor', new paginationService.SearchType().STRING, value));
                    queryObjects.push(new paginationService.QueryObject('externalStorageProduct', new paginationService.SearchType().STRING, value));
                    queryObjects.push(new paginationService.QueryObject('externalStorageSystemId', new paginationService.SearchType().STRING, value));
                    paginationService.setTextSearch(queryObjects);
                    paginationService.getQuery(getExternalParityGroupPath, objectTransformService.transformExternalParityGroup, storageSystemId).then(function(result) {
                        updateResultTotalCounts(result);
                    });
                }
            };

            dataModel.getResources = function(){
                return paginationService.get($scope.dataModel.nextToken, getExternalParityGroupPath, objectTransformService.transformExternalParityGroup, false, storageSystemId);
            };
            dataModel.cachedList = result.resources;
            dataModel.displayList = result.resources.slice(0, scrollDataSourceBuilderServiceNew.showedPageSize);
            
	      dataModel.getActions = function () {
                return [];
            };
	    
            dataModel.gridSettings = [
                {
                    title: 'external-parity-group-id',
                    sizeClass: 'twelfth',
                    sortField: 'externalParityGroupId',
                    getDisplayValue: function (item) {
                        return item.externalParityGroupId;
                    },
                    type: 'id'

                },
                {
                    title: 'external-parity-group-storage',
                    sizeClass: 'seventh',
                    sortField: 'externalStorageSystemId',
                    getDisplayValue: function (item) {
                        return item.externalStorageSystemId;
                    }

                },
                {
                    title: 'external-parity-group-vendor',
                    sizeClass: 'seventh',
                    sortField: 'externalStorageVendor',
                    getDisplayValue: function (item) {
                        return item.externalStorageVendor;
                    }

                },
                {
                    title: 'external-parity-group-model',
                    sizeClass: 'seventh',
                    sortField: 'externalStorageProduct',
                    getDisplayValue: function (item) {
                        return item.externalStorageProduct;
                    }

                },
                {
                    title: 'common-label-total',
                    sizeClass: 'twelfth',

                    sortField: 'item.capacity',
                    getDisplayValue: function (item) {
                        return item.total;
                    },
                    type: 'size'

                }
            ];

            $scope.dataModel = dataModel;

            scrollDataSourceBuilderServiceNew.setupDataLoader($scope, result.resources, 'externalParityGroupsSearch');
        });

    });
