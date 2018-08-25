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
 * @name rainierApp.directive:wizardSinglePanelContent
 * @description
 * # wizardSinglePanelContent
 */
angular.module('rainierApp')
    .directive('wizardSinglePanelContent', function () {
        return {
            scope: {
                dataModel: '=ngModel',
                filterModel : '=',
                panelTemplate: '@'
            },
            templateUrl: 'views/templates/wizard-single-panel-content.html'
        };
    });

