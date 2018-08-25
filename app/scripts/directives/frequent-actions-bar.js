'use strict';

/**
 * @ngdoc directive
 * @name rainierApp.directive:frequentActionsBar
 * @description
 * # frequentActionsBar
 */
angular.module('rainierApp')
    .directive('frequentActionsBar', function () {
        return {
            templateUrl: 'views/templates/frequent-actions-bar.html',
            restrict: 'E'
        };
    });
