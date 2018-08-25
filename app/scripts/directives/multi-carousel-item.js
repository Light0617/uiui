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
 * @name rainierApp.directive:multiCarouselItem
 * @description
 * # multiCarouselItem
 */
angular.module('rainierApp')
    .directive('multiCarouselItem', function () {
        return {
            scope: {
              model: '=ngModel'
            },
            restrict: 'E',
            templateUrl: 'views/templates/multi-carousel-item.html'

        };
    });
