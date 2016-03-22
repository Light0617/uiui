'use strict';

/**
 * @ngdoc directive
 * @name rainierApp.directive:applicationStage
 * @description
 * # applicationStage
 */
angular.module('rainierApp')
    .directive('select', function ($timeout) {
        return {
            priority: 99,
            link: function (scope, element, attrs) {
                function refresh() {
                    scope.$applyAsync(function () {
                        element.selectpicker('refresh');
                    });
                }


                $timeout(function () {
                    element.selectpicker({size: '5'});
                    element.selectpicker('refresh');
                });

                if (attrs.ngModel) {
                    scope.$watch(attrs.ngModel, refresh, true);
                }

                if (attrs.additionalWatch) {
                    scope.$watch(attrs.additionalWatch, refresh, true);
                }


                if (attrs.ngDisabled) {
                    scope.$watch(attrs.ngDisabled, refresh, true);
                }

                scope.$on('$destroy', function () {
                    $timeout(function () {
                        element.selectpicker('destroy');
                    });
                });
            }
        };
    });
