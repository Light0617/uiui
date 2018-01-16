/*
 * ========================================================================
 *
 * Copyright (c) by Hitachi Vantara, 2018. All rights reserved.
 *
 * ========================================================================
 */

'use strict';

/**
 * @ngdoc directive
 * @name rainierApp.directive:inventoryTab
 * @description
 * # tab of inventory
 */
angular.module('rainierApp')
    .directive('inventoryTab', function () {
        var controller = ['$scope', function ($scope) {
            if($scope.tabModel) {
                $scope.tabModel.selected = $scope.tabModel.selected ?
                    $scope.tabModel.selected : $scope.tabModel.tabs[0];
            }
        }];
        return {
            scope: {
                tabModel: '=ngModel'
            },
            replace: true,
            controller: controller,
            templateUrl: 'views/templates/inventory-tab.html',
            restrict: 'E'
        };
    });