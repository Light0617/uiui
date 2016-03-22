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
 * @name rainierApp.directive:wizardFooterLeftButtonGroup
 * @description
 * # wizardFooterLeftButtonGroup
 */
angular.module('rainierApp')
    .directive('wizardFooterLeftButtonGroup', function () {
        return {
            templateUrl: 'views/templates/wizard-footer-left-button-group.html',
            restrict: 'E',
            transclude: true
        };
    });

