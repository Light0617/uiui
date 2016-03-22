'use strict';

/**
 * @ngdoc directive
 * @name rainierApp.directive:steppedSlider
 * @description
 * # steppedSlider
 */
angular.module('rainierApp')
  .directive('steppedSlider', function ($timeout) {
        return {
            scope: {
                model: '=ngModel',
                steps: '='
            },
            restrict: 'A',
            link: function postLink(scope, element) {


                scope.onSlide = function (event, ui) {
                    $timeout(function () {
                    	if (ui.value === 0) {
                    		 scope.model  = null;
                    	}
                    	else {
                    		scope.model = scope.steps[ui.value -1];
                    	}
                        
                    });
                };

                $(element).slider({
                    min: 0,
			    	max: _.size(scope.steps),
			    	value: 0,
			    	slide: scope.onSlide
                });
            }
        };
    });
