'use strict';

/**
 * @ngdoc directive
 * @name rainierApp.directive:usageIndicatorBar
 * @description
 * # backButton
 */
angular.module('rainierApp')
    .directive('usageIndicatorBar', function () {
        return {
            scope: {
                model: '=ngModel'
            },
            templateUrl: 'views/templates/usage-indicator-bar.html',
            restrict: 'E',
            replace: false,
            link: function postLink(scope) {
                if(!scope.tooltip) {
                    scope.tooltip = {
                        'title': scope.model.usage + ' used',
                    };
                }
                if (scope.model && scope.model.usage) {
                    var percentage = parseInt(scope.model.usage.toString().replace('%', ''));

                    var cssClass = 'normal';
                    if (scope.model.compression || scope.model.compressed !== 'NO') {
                        // TODO: Change css class to represent normal with compression.
                        cssClass = 'compressed-normal';
                    }
                    if(scope.model.file){
                        cssClass = 'file';
                    }
                    if (percentage > 80) {
                        cssClass = 'full';
                        if (scope.model.compression || scope.model.compressed !== 'NO') {
                            // TODO: Change css class to represent full with compression.
                            cssClass = 'compressed-full';
                        }
                    } else if (percentage >= 70) {
                        cssClass = 'medium';
                        if (scope.model.compression || scope.model.compressed !== 'NO') {
                            // TODO: Change css class to represent medium with compression.
                            cssClass = 'compressed-medium';
                        }
                    }
                    scope.model.usageClass = cssClass;
                }
            }
        };

    });
