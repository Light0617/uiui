'use strict';

/**
 * @ngdoc directive
 * @name rainierApp.directive:hitachiBrandLogo
 * @description
 * # hitachiBrandLogo
 */
angular.module('rainierApp')
    .directive('hitachiBrandLogo', function () {
        return {
            templateUrl: 'views/templates/hitachi-brand-logo.html',
            restrict: 'E'

        };
    });
