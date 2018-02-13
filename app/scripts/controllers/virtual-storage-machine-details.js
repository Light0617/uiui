/*
 * ========================================================================
 *
 * Copyright (c) by Hitachi Vantara, 2018. All rights reserved.
 *
 * ========================================================================
 */

'use strict';

/**
 * @ngdoc function
 * @name rainierApp.controller:VirtualStorageMachineDetailsCtrl
 * @description
 * # VirtualStorageMachineDetailsCtrl
 * Controller of the rainierApp
 */
angular.module('rainierApp')
    .controller('VirtualStorageMachineDetailsCtrl', function (
        $scope, $routeParams, $timeout, $window, objectTransformService,
        paginationService, ShareDataService, queryService,
        scrollDataSourceBuilderService, rainierQueryService
    ) {
        var storageSystemIds = function () {
            return ShareDataService.virtualStorageMachine.physicalStorageSystems;
        };

        var getStorageSystemPath = function () {
            return 'storage-systems' + rainierQueryService.and('storageSystemId', storageSystemIds());
        };

        var generateSetSortFn = function () {
            return function (f) {
                $timeout(function () {
                    if($scope.dataModel.sort.field === f) {
                        queryService.setSort(f, !$scope.dataModel.sort.reverse);
                        $scope.dataModel.sort.reverse = true;
                    } else {
                        $scope.dataModel.sort.field = f;
                        queryService.setSort(f, false);
                        $scope.dataModel.sort.reverse = false;
                    }
                    paginationService.getQuery(
                        getStorageSystemPath(), objectTransformService.transformStorageSystem
                    );
                });
            };
        };

        var getResources = function () {
            return paginationService.get(
                null, getStorageSystemPath(), objectTransformService.transformStorageSystem
            );
        };

        var gridSettings = function () {
            return [
                {
                    title: 'storage-systems-serial-number',
                    sizeClass: 'sixth',
                    sortFiled: 'storageSystemId',
                    getDisplayValue: function (item) {
                        return item.storageSystemId;
                    },
                    type: 'id'
                },
                {
                    title: 'storage-systems-svp-ip-address',
                    sizeClass: 'sixth',
                    sortField: 'svpIpAddress',
                    getDisplayValue: function (item) {
                        return item.svpIpAddress;
                    }

                },
                {
                    title: 'storage-systems-model',
                    sizeClass: 'twelfth',
                    sortField: 'model',
                    getDisplayValue: function (item) {
                        return item.model;
                    }

                }
            ];
        };

        var generateDataModel = function (result) {
            var dataModel = {
                view: 'tile',
                nextToken: result.nextToken,
                total: result.total,
                currentPageCount: 0,
                sort: {
                    field: 'storageSystemId',
                    reverse: true,
                    setSort: generateSetSortFn()
                },
                search: {
                    freeText: ''
                },
                getResources: getResources,
                gridSettings: gridSettings()
            };
            return dataModel;
        };

        var initModel = function () {
            getResources().then(function (result) {
                $scope.dataModel = generateDataModel(result);
                scrollDataSourceBuilderService.setupDataLoader(
                    $scope, result.resources, 'virtualStorageMachineDetailsSearch'
                );
            });
        };

        if (!ShareDataService.virtualStorageMachine || storageSystemIds().length === 0) {
            window.history.back();
        } else {
            initModel();
        }
    });
