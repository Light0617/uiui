'use strict';

/**
 * @ngdoc directive
 * @name rainierApp.directive:rainierBrandLogo
 * @description
 * # rainierBrandLogo
 */
angular.module('rainierApp')
    .directive('rainierBrandLogo', function () {
        return {
            templateUrl: 'views/templates/rainier-brand-logo.html',
            restrict: 'E',
            replace: true
        };
    });
