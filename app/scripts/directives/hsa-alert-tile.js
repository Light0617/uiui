'use strict';

/**
 * @ngdoc directive
 * @name rainierApp.directive:hsaAlertTile
 * @description
 * # hsaAlertTile
 */
angular.module('rainierApp').directive('hsaAlertTile', function () {
  return {
    restrict: 'E',
    replace: true,
    scope: {
      service: '='
    },
    templateUrl: 'views/templates/alert-tile.html',
    link: function (scope) {
      scope.$watch('service.alertCount', function (newVal) {
        if (newVal > 0) {
          scope.alertLevel = 'error';
        } else {
          scope.alertLevel = 'healthy';
        }
      });
    },
  };
});
