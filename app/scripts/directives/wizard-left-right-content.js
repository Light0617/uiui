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
 * @name rainierApp.directive:wizardLeftRightContent
 * @description
 * # wizardLeftRightContent
 */
angular.module('rainierApp')
    .directive('wizardLeftRightContent', function () {
        return {
            scope: {
                dataModel: '=ngModel',
                leftPanelTemplate: '@',
                rightPanelTemplate: '@',
                pageTitle: '=ngTitle',
                pageName: '@'
            },
            replace: true,
            templateUrl: 'views/templates/wizard-left-right-content.html'
        };
    });

