'use strict';

/**
 * @ngdoc directive
 * @name rainierApp.directive:capacitySlider
 * @description
 * # capacitySlider
 */
angular.module('rainierApp')
    .directive('capacitySlider', function ($timeout) {
        return {
            scope: {
                modelMin: '=ngModelMin',
                modelMax: '=ngModelMax',
                min: '=sliderMin',
                max: '=sliderMax'
            },
            restrict: 'A',
            link: function postLink(scope, element) {

                scope.onSlide = function () {
                    $timeout(function () {
                        $('[data-toggle="popover"]').popover();
                    });
                };

                $timeout(function () {
                    $(element).slider({
                        range: 'min',
                        min: scope.min,
                        max: scope.max,
                        slide: scope.onSlide
                    });
                    $('[data-toggle="popover"]').popover();
                });

            }
        };
    });
