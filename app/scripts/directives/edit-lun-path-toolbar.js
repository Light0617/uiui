'use strict';

/**
 * @ngdoc directive
 * @name rainierApp.directive:editLunPathToolbar
 * @description
 * # editLunPathToolbar
 */
angular.module('rainierApp')
    .directive('editLunPathToolbar', function () {
        return {
            templateUrl: 'views/edit-lun-path-toolbar.html',
            restrict: 'E',
            replace: true

        };
    });