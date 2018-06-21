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
 * @name rainierApp.controller:CreateVsmCtrl
 * @description
 * # CreateVsmCtrl
 * Controller of the rainierApp
 */

angular.module('rainierApp').controller('CreateVsmCtrl', function ($scope, $timeout, orchestratorService,
                                                                   objectTransformService, synchronousTranslateService,
                                                                   scrollDataSourceBuilderService,
                                                                   $location, diskSizeService, paginationService,
                                                                   constantService) {

    var GET_STORAGE_SYSTEM_PATH = 'storage-systems';


    paginationService.getAllPromises(null, GET_STORAGE_SYSTEM_PATH, true, null, objectTransformService.transformStorageSystem).then(function (result) {
        var storageSystems = result;
        var hasFileUsageBar = false;

        var dataModel = {
            view: 'tile',
            hasFileUsageBar: hasFileUsageBar,
            displayList: result.resources,
            sameModelSelection: false,
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
                hasMigrationTasks: null
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
            }
        };

        dataModel.VirtualModelCandidates = constantService.virtualModelOptions();

        $scope.dataModel = dataModel;

        scrollDataSourceBuilderService.setupDataLoader($scope, storageSystems, 'storageSystemSearch');


    });


});