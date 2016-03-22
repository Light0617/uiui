'use strict';

/**
 * @ngdoc directive
 * @name rainierApp.directive:backButton
 * @description
 * # backButton
 */
angular.module('rainierApp')
    .directive('backButton', function() {
        return {
            restrict: 'A',
            link: function(scope, element) {
                element.on('click', function() {
                    window.history.back();
                });
            }
        };
    });
