


'use strict';

/**
 * @ngdoc function
 * @name rainierApp.controller:SharesExportsAddCtrl
 * @description
 * # SharesExportsAddCtrl
 * Controller of the rainierApp
 */
angular.module('rainierApp')
    .controller('SharesExportsAddCtrl', function($scope, $routeParams, orchestratorService) {

        var storageSystemId = $routeParams.storageSystemId;
        var fileSystemId = $routeParams.fileSystemId;

        orchestratorService.fileSystems(storageSystemId).then(function (result) {
            var dataModel = {
                validationForm: {
                    label: '',
                    path: ''
                },
                storageSystemId: storageSystemId,
                fileSystems: result.fileSystems,
                fileSystem: _.find(result.fileSystems, function(fileSystem){ return fileSystemId === fileSystem.id; }),
                fileSystemSelectable: _.isUndefined(fileSystemId),
                label: '',
                fileSystemPath: '\\HSA',
                windows: 'true'
            };

            $scope.dataModel = dataModel;

            $scope.dataModel.canSubmit = function () {
                return $scope.dataModel.validationForm.label.$valid && $scope.dataModel.validationForm.fileSystemPath.$valid && $scope.dataModel.fileSystem;
            };

            $scope.dataModel.submit = function () {
                var payload = {};
                payload.fileSystemPath = $scope.dataModel.fileSystemPath;
                payload.fileSystemId = $scope.dataModel.fileSystem.id;
                if($scope.dataModel.windows) {
                    payload.shareName = $scope.dataModel.label;
                    orchestratorService.addShare(storageSystemId, payload).then(function () {
                        window.history.back();
                    });
                }
                else{
                    payload.exportName = $scope.dataModel.label;
                    orchestratorService.addExport(storageSystemId, payload).then(function () {
                        window.history.back();
                    });
                }
            };
        });
    });
