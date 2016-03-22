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
 * @name rainierApp.directive:wizardHeader
 * @description
 * # wizardHeader
 */
angular.module('rainierApp')
    .directive('wizardHeader', function () {
        return {
            scope: {
                title: '=ngTitle',
                iconClass: '@'
            },
            templateUrl: 'views/templates/wizard-header.html',
            replace :true

        };
    });

