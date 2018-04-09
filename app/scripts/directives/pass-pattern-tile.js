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
 * @name rainierApp.directive:passPatternTile
 * @description
 * # passPatternTile
 */
angular.module('rainierApp')
    .directive('passPatternTile', function () {
        return {
            scope: {
                model: '=ngModel',
                update: '&'
            },
            templateUrl: 'views/templates/pass-pattern-tile.html',
            restrict: 'E'
        };
    });
