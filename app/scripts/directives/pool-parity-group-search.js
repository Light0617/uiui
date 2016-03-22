'use strict';

/**
 * @ngdoc directive
 * @name rainierApp.directive:poolParityGroupSearch
 * @description
 * # poolParityGroupSearch
 */
angular.module('rainierApp')
    .directive('poolParityGroupSearch', function () {
        return {
            scope: {
                model: '=ngModel',
                data: '=data',
                select: '&'
            },
            templateUrl: 'views/templates/pool-parity-group-search.html',
            restrict: 'E'
        };
    });
