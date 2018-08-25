/*
 * ========================================================================
 *
 * Copyright (c) by Hitachi Data Systems, 2016. All rights reserved.
 *
 * ========================================================================
 */

'use strict';

/**
 * @ngdoc directive
 * @name rainierApp.directive:inventoryItemTile
 * @description
 * # inventoryItemTile
 */
angular.module('rainierApp')
    .directive('inventoryItemTile', function () {
        return {
        	scope: {
                item: '=',
            },
            templateUrl: 'views/templates/inventory-item-tile.html',
            restrict: 'E'
        };
    });
