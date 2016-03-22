'use strict';

/**
 * @ngdoc directive
 * @name rainierApp.directive:poolTierList
 * @description
 * # poolTierList
 */
angular.module('rainierApp')
    .directive('poolTierList', function () {
        return {
            scope: {
                model: '=ngModel',
                select: '&'
            },
            templateUrl: 'views/templates/pool-tier-list.html',
            restrict: 'E'
        };
    });
