'use strict';

/**
 * @ngdoc directive
 * @name rainierApp.directive:twoKnobSlider
 * @description
 * # twoKnobSlider
 */
angular.module('rainierApp')
    .directive('twoKnobSlider', function ($timeout) {
        return {
            scope: {
                modelMin: '=ngModelMin',
                modelMax: '=ngModelMax',
                min: '=sliderMin',
                max: '=sliderMax',
                singleSlider: '=singleSlider',
                stopEventFn: '&',
            },
            restrict: 'A',
            link: function postLink(scope, element) {
                scope.onSlide = function (event, ui) {
                    $timeout(function () {
                        if(scope.singleSlider){
                            scope.modelMin = ui.value;
                        }
                        else{
                            scope.modelMin = ui.values[0];
                            scope.modelMax = ui.values[1];
                        }
                    });
                };

                if(scope.singleSlider) {
                    $timeout(function () {
                        $(element).slider({
                            min: scope.min,
                            max: scope.max,
                            value: scope.min,
                            slide: scope.onSlide,
                            stop: function () {
                                if (scope.stopEventFn && _.isFunction(scope.stopEventFn)) {
                                    scope.stopEventFn();
                                }
                            },
                        });
                    });
                }
                else {
                    $timeout(function () {
                        $(element).slider({
                            range: true,
                            min: scope.min,
                            max: scope.max,
                            values: [scope.min, scope.max],
                            slide: scope.onSlide,
                            stop: function () {
                                if (scope.stopEventFn && _.isFunction(scope.stopEventFn)) {
                                    scope.stopEventFn();
                                }
                            }
                        });
                    });
                }
            }
        };
    });
