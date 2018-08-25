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
 * @name rainierApp.directive:wizardPage
 * @description
 * # wizardPage
 */
angular.module('rainierApp')
    .directive('wizardPage', function () {
        return {
            templateUrl: 'views/templates/wizard-page.html',
            restrict: 'E',
            transclude: true

        };
    });

