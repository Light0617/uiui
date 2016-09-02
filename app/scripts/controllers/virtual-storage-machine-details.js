'use strict';

/**
 * @ngdoc function
 * @name rainierApp.controller:StoragePortsCtrl
 * @description
 * # StoragePortsCtrl
 * Controller of the rainierApp
 */
//TODO: CDUAN All pagination calls
angular.module('rainierApp')
    .controller('VirtualStorageMachineDetailsCtrl', function ($scope, $routeParams, $timeout, $window, orchestratorService,
                                              objectTransformService, synchronousTranslateService,
                                              scrollDataSourceBuilderServiceNew, ShareDataService, paginationService,
                                              queryService, wwnService, hwAlertService) {
        var storageSystemId = $routeParams.storageSystemId;
        var getStoragePortsPath = 'storage-ports';
        $scope.summaryModel= {};

        orchestratorService.storageSystem(storageSystemId).then(function (result) {
            // TODO: CDUAN Do we wanna show data protection tile? Check with PO
            // TODO: CDUAN Revisit header summary when designer finished NEWRAIN-6105
            $scope.storageSystemModel = result.model;
            return paginationService.get(null, getStoragePortsPath, objectTransformService.transformPort, true, storageSystemId);
        }).then(function (result) {
            // TODO: CDUAN Revisit header summary when designer finished NEWRAIN-6105
            var summaryModel = objectTransformService.transformToPortSummary(result.resources);
            summaryModel.title = synchronousTranslateService.translate('common-storage-system-ports');
            summaryModel.hwAlert = hwAlertService;
            summaryModel.getActions = $scope.summaryModel.getActions;
            $scope.summaryModel = summaryModel;

            var dataModel = {
                singleViewAndPaged: true,
                storageSystemId: storageSystemId,
                view: 'list',
                onlyOperation: true,
                nextToken: result.nextToken,
                total: result.total,
                currentPageCount: 0,
                sort: {
                    field: 'name',
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
                            paginationService.getQuery(getStoragePortsPath, objectTransformService.transformPort, storageSystemId).then(function (result) {
                                updateResultTotalCounts(result);
                            });
                        });
                    }
                }
            };

            $scope.filterModel = {
                filter: {
                    freeText: '',
                },
                searchQuery: function (value) {
                    var queryObjects = [];
                    queryObjects.push(new paginationService.QueryObject('storagePortId', new paginationService.SearchType().STRING, value));
                    paginationService.setTextSearch(queryObjects);
                    paginationService.getQuery(getStoragePortsPath, objectTransformService.transformPort, storageSystemId).then(function(result) {
                        updateResultTotalCounts(result);
                    });
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

            dataModel.getResources = function(){
                return paginationService.get(null, getStoragePortsPath, objectTransformService.transformPort, false, storageSystemId);
            };


            // TODO CDUAN Attribute name should be changed
            dataModel.gridSettings = [
                {
                    title: 'ID',
                    sizeClass: 'twelfth',
                    sortField: 'storagePortId',
                    getDisplayValue: function (item) {
                        return item.storagePortId;
                    },
                    type: 'id'

                },
                {
                    title: 'WWN',
                    sizeClass: 'sixth',
                    sortField: 'wwn',
                    getDisplayValue: function (item) {
                        return item.type === 'FIBRE' ? wwnService.appendColon(item.wwn) : '';
                    }

                },
                {
                    title: 'Type',
                    sizeClass: 'twelfth',
                    sortField: 'type',
                    getDisplayValue: function (item) {
                        return item.type;
                    }

                },
                {
                    title: 'Speed',
                    sizeClass: 'twelfth',

                    sortField: 'speed',
                    getDisplayValue: function (item) {
                        return item.speed;
                    }

                },
                {
                    title: 'Fabric',
                    sizeClass: 'twelfth',
                    sortField: 'fabric',
                    getDisplayValue: function (item) {
                        return item.fabric;
                    }

                },
                {
                    title: 'Connection Type',
                    sizeClass: 'twelfth',
                    sortField: 'connectionType',
                    getDisplayValue: function (item) {
                        return item.connectionType;
                    }

                },
                {
                    title: 'Security',
                    sizeClass: 'twelfth',
                    sortField: 'securitySwitchEnabled',
                    getDisplayValue: function (item) {
                        return item.securitySwitchEnabled ? 'Enabled' : 'Disabled';
                    }
                }
            ];

            dataModel.cachedList = result.resources;
            dataModel.displayList = result.resources.slice(0, scrollDataSourceBuilderServiceNew.showedPageSize);

            $scope.dataModel = dataModel;
            //TODO CDUAN Do we need a search? May need to refactor this
            scrollDataSourceBuilderServiceNew.setupDataLoader($scope, result.resources, 'virtualStorageMachineSearch', true);
        });



    });
