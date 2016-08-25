/*
 * ========================================================================
 *
 * Copyright (c) by Hitachi Data Systems, 2016. All rights reserved.
 *
 * ========================================================================
 */

'use strict';

/**
 * @ngdoc function
 * @name rainierApp.controller:EditLunPathCtrl
 * @description
 * # EditLunPathCtrl
 * Controller of the rainierApp
 */
angular.module('rainierApp').controller('EditLunPathCtrl', function ($scope, $timeout, orchestratorService,
                                        objectTransformService, synchronousTranslateService, scrollDataSourceBuilderServiceNew,
                                        ShareDataService, $location, $routeParams, viewModelService,
                                        editLunPathService, d3service){

    var dataModel = {

    };

    angular.extend(dataModel, viewModelService.newWizardViewModel(['select', 'attach', 'paths', 'protect']));
    $scope.dataModel = dataModel;
});
