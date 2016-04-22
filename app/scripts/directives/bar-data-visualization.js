'use strict';

/**
 * @ngdoc directive
 * @name rainierApp.directive:barDataVisualization
 * @description
 * # barDataVisualization
 */
angular.module('rainierApp')
    .directive('barDataVisualization', function () {
        return {
            scope: {
                model: '=ngModel'
            },
            templateUrl: 'views/templates/bar-data-visualization.html',
            restrict: 'E',
            link: function(scope, elements) {
                var used = parseInt(scope.model.usedCapacityInBytes.value / scope.model.capacityInBytes.value * 100);
                var allocated;
                if(scope.model.physicalCapacityInBytes) {
                    allocated = parseInt(scope.model.physicalCapacityInBytes.value / scope.model.capacityInBytes.value * 100);
                }
                else {
                    allocated = parseInt((scope.model.usedCapacityInBytes.value + scope.model.availableCapacityInBytes.value) / scope.model.capacityInBytes.value * 100);
                }

                elements.find('.file-used').popover({
                    placement: 'bottom',
                    content: used + '% Used'
                });

                // 7% is the min for the visual
                if(used < 7) {
                    used = 0;
                    if(scope.model.usedCapacityInBytes.value > 0) {
                        used = 7;
                    }
                }
                if(allocated < 7) {
                    allocated = 0;
                    if(scope.model.physicalCapacityInBytes.value > 0) {
                        allocated = 7;
                    }
                }
                if(scope.model.onlyShowTwoBars) {
                    allocated = 100;
                }
                scope.model.used = used + '%';
                scope.model.allocated = allocated + '%';
            },
        };

    });
