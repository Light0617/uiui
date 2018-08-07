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
        scrollDataSourceBuilderService, rainierQueryService,
        synchronousTranslateService
    ) {
        var openGadAction;

        var storageSystemIds = function () {
            return _.map(
                ShareDataService.virtualStorageMachine.physicalStorageSystemIds,
                function(s) { return s; }
            );
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
                title: synchronousTranslateService.translate('common-virtual-storage-machine') + ' ' + $routeParams.virtualStorageMachineId,
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
                    title: synchronousTranslateService.translate('open-gad-pairs'),
                    icon: 'icon-open',
                    tooltip: synchronousTranslateService.translate('open-gad-pairs'),
                    onClick: function () {
                        $location.path([
                            'virtual-storage-machines',
                            ShareDataService.virtualStorageMachine.virtualStorageMachineId,
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
                var dataModel = $scope.dataModel;
                scrollDataSourceBuilderService.setupDataLoader(
                    $scope, result.resources, 'virtualStorageMachineDetailsSearch'
                );
                $scope.summaryModel = generateSummaryModel(ShareDataService.virtualStorageMachine);
                var actions = [
                    {
                        icon: 'icon-delete',
                        tooltip :'action-tooltip-delete',
                        type: 'confirm',
                        confirmTitle: 'storage-system-delete-confirmation',
                        confirmMessage: 'storage-system-delete-selected-content',
                        enabled: function () {
                            return dataModel.anySelected();
                        },
                        onClick: function () {
                            //TODO
                        }
                    }
                ];
                $scope.dataModel.getActions = function () {
                    return  actions;
                };
            });
        };

        if (!ShareDataService.virtualStorageMachine || storageSystemIds().length === 0) {
            window.history.back();
        } else {
            initActions();
            initModel();
        }
    });
