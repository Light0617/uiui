'use strict';

/**
 * @ngdoc directive
 * @name rainierApp.directive:filePoolTierList
 * @description
 * # filePoolTierList
 */
angular.module('rainierApp')
    .directive('filePoolTierList', function () {
        return {
            scope: {
                model: '=ngModel',
                select: '&'
            },
            templateUrl: 'views/templates/file-pool-tier-list.html',
            restrict: 'E'
        };
    });
