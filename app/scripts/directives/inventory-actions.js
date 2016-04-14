/*
 * ========================================================================
 *
 * Copyright (c) by Hitachi Data Systems, 2015. All rights reserved.
 *
 * ========================================================================
 */

'use strict';

/**
 * @ngdoc directive
 * @name rainierApp.directive:inventoryActions
 * @description
 * # inventoryActions
 */
angular.module('rainierApp')
    .directive('inventoryActions', function () {
        return {
        	scope: {
                dataModel: '=ngModel',
                atTop: '@'
            },
            templateUrl: 'views/templates/inventory-actions.html',
            restrict: 'E'
        };
    });
