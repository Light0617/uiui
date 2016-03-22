'use strict';

/**
 * @ngdoc directive
 * @name rainierApp.directive:commonPageHeader
 * @description
 * # commonPageHeader
 */
angular.module('rainierApp')
    .directive('commonPageHeader', function () {
        return {
            templateUrl: 'views/templates/common-page-header.html',
            restrict: 'E',
            replace: true,
            link: function (scope, element, attr) {
                scope.noPageFluid = attr.noPageFluid;
            }
        };
    });
