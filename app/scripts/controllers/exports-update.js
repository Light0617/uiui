


'use strict';

/**
 * @ngdoc function
 * @name rainierApp.controller:ExportsUpdateCtrl
 * @description
 * # ExportsUpdateCtrl
 * Controller of the rainierApp
 */
angular.module('rainierApp')
    .controller('ExportsUpdateCtrl', function($scope, $routeParams, orchestratorService) {

        var storageSystemId = $routeParams.storageSystemId;
        var fileSystemId = $routeParams.fileSystemId;
        var exportId = $routeParams.exportId;

        orchestratorService.export(storageSystemId, fileSystemId, exportId).then(function (result) {
            var dataModel = {
                validationForm: {
                    fileSystemPath: '',
                    accessConfiguration: ''
                },
                label: result.name,
                storageSystemId: storageSystemId,
                fileSystemId: fileSystemId,

                payload: {
                    fileSystemPath: result.fileSystemPath,
                    accessConfiguration: result.accessConfiguration
                }
            };

            $scope.dataModel = dataModel;

            $scope.dataModel.canSubmit = function () {
                return ($scope.dataModel.validationForm.label.$dirty || $scope.dataModel.validationForm.fileSystemPath.$dirty || $scope.dataModel.validationForm.accessConfiguration.$dirty) &&
                    $scope.dataModel.validationForm.label.$valid && $scope.dataModel.validationForm.fileSystemPath.$valid && $scope.dataModel.validationForm.accessConfiguration.$valid;
            };

            $scope.dataModel.submit = function () {
                orchestratorService.patchExport(storageSystemId, fileSystemId, exportId, $scope.dataModel.payload).then(function () {
                    window.history.back();
                });
            };
        });
    });
