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
 * @name rainierApp.directive:simpleResourceTile
 * @description
 * # simpleResourceTile
 */
angular.module('rainierApp')
    .directive('simpleResourceTile', function () {
        return {
            scope: {
                item: '=',
                layout: '='
            },
            templateUrl: 'views/templates/simple-resource-tile.html',
            restrict: 'E'
        };
    });
