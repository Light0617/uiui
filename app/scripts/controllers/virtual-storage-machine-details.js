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
        $scope, $routeParams, $location, $timeout, $window, objectTransformService,
        paginationService, ShareDataService, queryService,
        scrollDataSourceBuilderService, rainierQueryService
    ) {
        var openGadAction;

        var storageSystemIds = function () {
            return ShareDataService.virtualStorageMachine.physicalStorageSystems;
        };

        var getStorageSystemPath = function () {
            return 'storage-systems' + rainierQueryService.and('storageSystemId', storageSystemIds());
        };

        var generateSetSortFn = function () {
            return function (f) {
                $timeout(function () {
                    if ($scope.dataModel.sort.field === f) {
                        queryService.setSort(f, !$scope.dataModel.sort.reverse);
                        $scope.dataModel.sort.reverse = true;
                    } else {
                        $scope.dataModel.sort.field = f;
                        queryService.setSort(f, false);
                        $scope.dataModel.sort.reverse = false;
                    }
                    paginationService.getQuery(
                        getStorageSystemPath(), objectTransformService.transformVSMStorageSystems
                    );
                });
            };
        };

        var getResources = function () {
            return paginationService.get(
                null, getStorageSystemPath(), objectTransformService.transformVSMStorageSystems
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
                title: 'Virtual Storage Machine ' + $routeParams.serialModelNumber,
                onlyOperation: true,
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

        var initActions = function () {
            openGadAction = {
                openGad: {
                    type: 'link',
                    title: 'Open GAD Pairs',
                    icon: 'icon-storage-navigator-settings',
                    tooltip: 'Open GAD Pairs',
                    onClick: function () {
                        $location.path([
                            'virtual-storage-machines',
                            ShareDataService.virtualStorageMachine.serialModelNumber,
                            'gad-pairs'
                        ].join('/'));
                    },
                    enabled: function () {
                        return true;
                    }
                }
            };
        };


        var getSummaryActions = function () {
            return _.map(openGadAction);
        };

        var generateSummaryModel = function (vsm) {
            var model = vsm;
            model.getActions = getSummaryActions;
            return model;
        };

        var initModel = function () {
            getResources().then(function (result) {
                $scope.dataModel = generateDataModel(result);
                scrollDataSourceBuilderService.setupDataLoader(
                    $scope, result.resources, 'virtualStorageMachineDetailsSearch'
                );
                $scope.summaryModel = generateSummaryModel(ShareDataService.virtualStorageMachine);
            });
        };

        if (!ShareDataService.virtualStorageMachine || storageSystemIds().length === 0) {
            window.history.back();
        } else {
            initActions();
            initModel();
        }
    });
