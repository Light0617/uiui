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
                select: '&',
                excludeTiers: '@'
            },
            templateUrl: 'views/templates/pool-tier-list.html',
            restrict: 'E',
            link: function(scope){

                scope.removeExcludedTiers = function (value){
                    if(scope.excludeTiers !== undefined){
                        var tierNamesToBeExcluded = scope.excludeTiers.split(';');
                        return (tierNamesToBeExcluded.indexOf(value.name) === -1);
                    }
                    return true;
                };

            }

        };

    });
