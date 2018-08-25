'use strict';

/**
 * @ngdoc directive
 * @name rainierApp.directive:csvFileUpload
 * @description
 * # csvFileUpload
 */
angular.module('rainierApp')
    .directive('csvFileUpload', function () {
        return {
            scope: {
                model: '=ngModel',
                title: '@ngTitle'
            },
            templateUrl: 'views/templates/csv-file-upload.html',
            restrict: 'E',
            controller: function ($scope, fileParserService) {
                $scope.$watch('files', function (files) {
                    if (!files || files.length === 0) {
                        return;
                    }
                    fileParserService.parseCsv(files[0]).then(function (result) {
                        $scope.model = result;
                    });
                });
            }
        };
    });