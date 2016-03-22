'use strict';

/**
 * @ngdoc directive
 * @name rainierApp.directive:pageTitle
 * @description
 * # pageTitle
 */
angular.module('rainierApp')
    .directive('pageTitle', function () {
        return {
            templateUrl: 'views/templates/page-title.html',
            restrict: 'E',
            transclude: true,
            replace: true

        };
    });
