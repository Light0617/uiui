/*
 * ========================================================================
 *
 * Copyright (c) by Hitachi Data Systems, 2017. All rights reserved.
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
                item: '=',
            },
            templateUrl: 'views/templates/pass-pattern-tile.html',
            restrict: 'E'
        };
    });
