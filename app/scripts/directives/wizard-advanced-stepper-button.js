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
 * @name rainierApp.directive:wizardAdvancedStepperButton
 * @description
 * # wizardAdvancedStepperButton
 */
angular.module('rainierApp')
    .directive('wizardAdvancedStepperButton', function () {
        return {
            scope: {
                stepCompleted: '=',
                stepActive: '=',
                title: '=ngTitle'
            },
            templateUrl: 'views/templates/wizard-advanced-stepper-button.html',
            restrict: 'E',
            replace: true,
            link: function (scope) {
                scope.stepDisabled = !(scope.stepCompleted || scope.stepActive);
            }
        };
    });

