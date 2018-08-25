/*
 * ========================================================================
 *
 * Copyright (c) by Hitachi Vantara, 2018. All rights reserved.
 *
 * ========================================================================
 */

'use strict';

/**
 * @ngdoc directive
 * @name rainierApp.directive:sortColumnHeader
 * @description
 * # sortColumnHeader
 */
angular.module('rainierApp')
    .directive('sortColumnHeader', function () {
        var controller = ['$scope', 'synchronousTranslateService', function ($scope, trans) {
            try {
                var parsed = JSON.parse($scope.label);
                if (_.isArray(parsed)) {
                    $scope.labels = _.map(parsed, trans.translate);
                } else {
                    throw new Error();
                }
            } catch (e) {
                $scope.labels = [trans.translate($scope.label)];
            }
        }];
        return {
            scope: {
                sortModel: '=ngModel',
                field: '@',
                label: '@',
                labels: '@'
            },
            controller: controller,
            templateUrl: 'views/templates/sort-column-header.html',
            restrict: 'E',
            replace: true
        };
    });
