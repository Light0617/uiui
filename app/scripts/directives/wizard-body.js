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
 * @name rainierApp.directive:wizardBody
 * @description
 * # wizardBody
 */
angular.module('rainierApp')
    .directive('wizardBody', function () {
        return {
            templateUrl: 'views/templates/wizard-body.html',
            restrict: 'E',
            transclude: true,
            replace: true
        };
    });

