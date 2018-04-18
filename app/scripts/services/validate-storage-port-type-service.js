'use strict';

/**
 * @ngdoc function
 * @name rainierApp.controller:validatePortTypeService
 * @description
 * # validatePortTypeService
 * Factory of the rainierApp
 */
angular.module('rainierApp')
    .factory('validatePortTypeService', function ($modal, synchronousTranslateService) {

        var openNoStoragePortTypeWarning = function (serverProtocol, storageSystem) {
            var modelInstance = $modal.open({
                templateUrl: 'views/templates/basic-confirmation-modal.html',
                windowClass: 'modal fade confirmation',
                backdropClass: 'modal-backdrop',
                controller: function ($scope) {
                    $scope.confirmationTitle = synchronousTranslateService.translate(
                        'storage-volume-attach-no-storage-port-for-server-title');
                    $scope.confirmationMessage = synchronousTranslateService.translate(
                        'storage-volume-attach-no-storage-port-for-server-message', {
                            serverProtocol: synchronousTranslateService.translate(serverProtocol),
                            storageSystemId: storageSystem.storageSystemId
                        });
                    $scope.cancelButtonLabel = synchronousTranslateService.translate('cancel-button');
                    $scope.okButtonLabel = synchronousTranslateService.translate('ok-button');

                    $scope.ok = function () {
                        modelInstance.close(true);
                    };

                    $scope.cancel = function () {
                        modelInstance.dismiss(synchronousTranslateService.translate('common-label-cancel'));
                    };

                    modelInstance.result.finally(function () {
                        $scope.cancel();
                    });
                }
            });
        };

        return {
            openNoStoragePortTypeWarning: openNoStoragePortTypeWarning
        };
    });
