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
 * @name rainierApp.directive:inventoryPage
 * @description
 * # inventoryPage
 */
angular.module('rainierApp')
    .directive('inventoryPage', function () {

        var controller = ['$scope', function ($scope) {
                $scope.toggleExpandButton = function (item) {
                    if (item.opened) {
                        $('#' + item.id).attr('aria-expanded', 'false');
                    } else {
                        $('#' + item.id).attr('aria-expanded', 'true');
                        _.forEach ($scope.dataModel.displayList, function (d) {
                            if (d.id !== item.id) {
                                d.opened = false;
                                $('#' + d.id).attr('aria-expanded', 'false');
                                if (d.hasOwnProperty('volumePairs')) {
                                    d.volumePairs = [];
                                }
                            }
                        });
                    }
                };
            }];
        return {
            scope: {
                dataModel: '=ngModel',
                listCountSummaryTitle : '@',
                listCountTooltip : '@',
                summaryModel : '=',
                filterModel : '=',
                summaryTemplate: '@',
                tileItemTemplate :'@',
                filterTemplate : '@',
                gridHeaderTemplate :'@',
                gridItemTemplate : '@',
                listDetailsTemplate : '@',
                pageActions :'=',
                selectedItemActions : '=',
                services: '='
            },
            controller: controller,
            templateUrl: 'views/templates/inventory-page.html',
            restrict: 'E'
        };
    });
