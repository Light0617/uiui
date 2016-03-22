'use strict';

/**
 * @ngdoc directive
 * @name rainierApp.directive:pageLoadingIndicator
 * @description
 * # pageLoadingIndicator
 */
angular.module('rainierApp')
    .directive('pageLoadingIndicator', function () {
        return {
            templateUrl: 'views/templates/page-loading-indicator.html',
            restrict: 'E'

        };
    });
