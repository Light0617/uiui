'use strict';

/**
 * @ngdoc directive
 * @name rainierApp.directive:applicationStage
 * @description
 * # applicationStage
 */
angular.module('rainierApp')
    .directive('applicationStage', function () {
        return {
            templateUrl: 'views/templates/application-stage.html',
            restrict: 'E',
            transclude: true,
            link: function (scope, element, attr) {
                scope.noPageFluid = attr.noPageFluid;
            }
        };
    });
