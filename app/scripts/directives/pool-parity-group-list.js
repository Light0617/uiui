'use strict';

/**
 * @ngdoc directive
 * @name rainierApp.directive:poolParityGroupList
 * @description
 * # poolParityGroupList
 */
angular.module('rainierApp')
    .directive('poolParityGroupList', function () {
        return {
            scope: {
                model: '=ngModel',
                data: '=data',
                select: '&'
            },
            templateUrl: 'views/templates/pool-parity-group-list.html',
            restrict: 'E'
        };
    });
