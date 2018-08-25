'use strict';

/**
 * @ngdoc directive
 * @name rainierApp.directive:volumeActions
 * @description
 * # volumeActions
 */
angular.module('rainierApp')
    .directive('volumeActions', function () {
        return {
            scope: false,
            templateUrl: 'views/templates/volume-actions.html',
            restrict: 'E'
        };
    });
