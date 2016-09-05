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
 * @name rainierApp.directive:singleStepWizardBody
 * @description
 * # singleStepWizardBody
 */
angular.module('rainierApp')
    .directive('singleStepWizardBody', function () {
        return {
            scope: {
                dataModel: '=ngModel',
                leftPanelTemplate: '@',
                rightPanelTemplate: '@',
                pageTitle: '@ngTitle',
                data: '=',
                pageName: '@'
            },
            templateUrl: 'views/templates/single-step-wizard-body.html',
            restrict: 'E',
            replace: true
        };
    });

