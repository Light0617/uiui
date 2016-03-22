'use strict';

/**
 * @ngdoc directive
 * @name rainierApp.directive:breadcrumbBar
 * @description
 * # breadcrumbBar
 */
angular.module('rainierApp')
    .directive('breadcrumbBar', function (breadcrumbService, $timeout) {
        return {
            templateUrl: 'views/templates/breadcrumb-bar.html',
            restrict: 'E',
            link: function postLink(scope) {
                $timeout(function (){
                    scope.breadcrumbs = breadcrumbService.get();
                });

            }
        };
    });
