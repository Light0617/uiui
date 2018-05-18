'use strict';

/**
 * @ngdoc function
 * @name rainierApp.controller:VirtualStorageMachineGadPairsCtrl
 * @description
 * # VirtualStorageMachineGadPairsCtrl
 * Controller of the rainierApp
 */
angular.module('rainierApp')
    .controller('VirtualStorageMachineGadPairsCtrl', function (
        $scope, $routeParams, $timeout, $window, orchestratorService,
        objectTransformService, synchronousTranslateService, $location,
        scrollDataSourceBuilderServiceNew, ShareDataService, paginationService,
        queryService, wwnService, dpAlertService
    ) {
        var serialModelNumber = $routeParams.serialModelNumber;
        var getGadPairsPath = 'gad-pairs';
        var getVirtualStorageMachinesPath = 'virtual-storage-machines';
        if (!ShareDataService.virtualStorageMachine) {
            window.history.back();
        }
        var currentVirtualStorageMachine = ShareDataService.virtualStorageMachine;

        var summaryModel = {
            pairCount: currentVirtualStorageMachine.pairHACount,
            leftPhysicalStorageSystem: currentVirtualStorageMachine.physicalStorageSystems[0],
            rightPhysicalStorageSystem: currentVirtualStorageMachine.physicalStorageSystems[1],
            services: {
                dp: dpAlertService
            }
        };
        $scope.summaryModel = summaryModel;
        $scope.summaryModel.services.dp.update();

        paginationService.get(null, getGadPairsPath, objectTransformService.transformGadPair, true,
            null, getVirtualStorageMachinesPath, serialModelNumber)
            .then(function (result) {
            var dataModel = {
                title: 'Virtual storage machine ' + serialModelNumber,
                singleViewAndPaged: true,
                view: 'list',
                onlyOperation: true,
                nextToken: result.nextToken,
                total: result.total,
                currentPageCount: 0,
                sort: {
                    field: 'primary.volumeId',
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
                            paginationService.getQuery(getGadPairsPath, objectTransformService.transformGadPair,
                                null, getVirtualStorageMachinesPath, serialModelNumber).then(function (result) {
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
                    queryObjects.push(new paginationService.QueryObject('volumeId', new paginationService.SearchType().STRING, value));
                    paginationService.setTextSearch(queryObjects);
                    paginationService.getQuery(getGadPairsPath, objectTransformService.transformGadPair,
                        null, getVirtualStorageMachinesPath, serialModelNumber).then(function (result) {
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
                return paginationService.get(null, getGadPairsPath, objectTransformService.transformGadPair, false,
                    null, getVirtualStorageMachinesPath, serialModelNumber);
            };

            dataModel.gridSettings = [
                {
                    title: 'repliaction-group-volume-list-pvolid',
                    sizeClass: 'twelfth',
                    sortField: '',
                    getDisplayValue: function (item) {
                        return item.primary.displayVolumeId;
                    },
                    type: 'hyperLink',
                    onClick: function (item) {
                        var path = ['storage-systems', item.primary.storageSystemId, 'volumes', item.primary.volumeId].join('/');
                        $location.path(path);
                    }
                },
                {
                    title: 'repliaction-group-volume-list-svolid',
                    sizeClass: 'twelfth',
                    sortField: '',
                    getDisplayValue: function (item) {
                        return item.secondary.displayVolumeId;
                    },
                    type: 'hyperLink',
                    onClick: function (item) {
                        var path = ['storage-systems', item.secondary.storageSystemId, 'volumes', item.secondary.volumeId].join('/');
                        $location.path(path);
                    }

                },
                {
                    title: 'repliaction-group-volume-list-pvol-status',
                    sizeClass: 'twelfth',
                    sortField: '',
                    getDisplayValue: function (item) {
                        return item.primary.status;
                    }

                },
                {
                    title: 'repliaction-group-volume-list-svol-status',
                    sizeClass: 'twelfth',
                    sortField: '',
                    getDisplayValue: function (item) {
                        return item.secondary.status;
                    }

                },
                {
                    title: 'quorum-Id',
                    sizeClass: 'sixth',
                    sortField: '',
                    getDisplayValue: function (item) {
                        return item.primary.quorumId;
                    }

                },
                {
                    title: 'gad-pvol-storage-system-id',
                    sizeClass: 'sixth',
                    sortField: '',
                    getDisplayValue: function (item) {
                        return item.primary.storageSystemId;
                    }

                },
                {
                    title: 'gad-svol-storage-system-id',
                    sizeClass: 'sixth',
                    sortField: '',
                    getDisplayValue: function (item) {
                        return item.secondary.storageSystemId;
                    }

                }
            ];

            dataModel.cachedList = result.resources;
            dataModel.displayList = result.resources.slice(0, scrollDataSourceBuilderServiceNew.showedPageSize);

            $scope.dataModel = dataModel;
            scrollDataSourceBuilderServiceNew.setupDataLoader($scope, result.resources, null, true);
        });

    });
