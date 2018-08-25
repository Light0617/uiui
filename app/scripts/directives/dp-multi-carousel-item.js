/*
 * ========================================================================
 *
 * Copyright (c) by Hitachi Data Systems, 2014. All rights reserved.
 *
 * ========================================================================
 */

'use strict';

/**
 * @ngdoc directive
 * @name rainierApp.directive:dpMultiCarouselItem
 * @description
 * # dpMultiCarouselItem
 */
angular.module('rainierApp')
    .directive('dpMultiCarouselItem', function () {
        return {
            scope: {
              model: '=ngModel'
            },
            restrict: 'E',
            templateUrl: 'views/templates/dp-multi-carousel-item.html'

        };
    });
