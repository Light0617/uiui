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
 * @name rainierApp.directive:wizardFooter
 * @description
 * # wizardFooter
 */
angular.module('rainierApp')
    .directive('wizardFooter', function () {
        return {
            scope : {
                dataModel : '=ngModel',
                leftButtonTemplate :'@',
                rightButtonTemplate :'@'

            },
            templateUrl: 'views/templates/wizard-footer.html',
            restrict: 'E'
        };
    });

