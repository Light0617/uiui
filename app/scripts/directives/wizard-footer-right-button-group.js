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
 * @name rainierApp.directive:wizardFooterRightButtonGroup
 * @description
 * # wizardFooterRightButtonGroup
 */
angular.module('rainierApp')
    .directive('wizardFooterRightButtonGroup', function () {
        return {
            templateUrl: 'views/templates/wizard-footer-right-button-group.html',
            restrict: 'E',
            transclude: true
        };
    });

