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
 * @name rainierApp.directive:wizardAdvancedStepper
 * @description
 * # wizardAdvancedStepper
 */
angular.module('rainierApp')
    .directive('wizardAdvancedStepper', function () {
        return {
            templateUrl: 'views/templates/wizard-advanced-stepper.html',
            restrict: 'E',
            transclude: true

        };
    });

