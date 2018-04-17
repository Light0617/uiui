'use strict';

/**
 * @ngdoc function
 * @name rainierApp.controller:editChapService
 * @description
 * # editChapService
 * Factory of the rainierApp
 */
angular.module('rainierApp')
    .factory('editChapService', function (orchestratorService, $modal,
                                          synchronousTranslateService) {

        var confirmOverwriteChapSecretThenCallApi = function (messageParameters, api, payload) {
            var modelInstance = $modal.open({
                templateUrl: 'views/templates/basic-confirmation-modal.html',
                windowClass: 'modal fade confirmation',
                backdropClass: 'modal-backdrop',
                controller: function ($scope) {
                    $scope.confirmationTitle = synchronousTranslateService.translate(
                        'storage-volume-attach-confirm-force-overwrite-chap-user-name-title');
                    $scope.confirmationMessage = synchronousTranslateService.translate(
                        'storage-volume-attach-confirm-force-overwrite-chap-user-name-message',
                        {
                            storageSystemId: messageParameters.storageSystemId,
                            storagePort: messageParameters.storagePort,
                            chapUserNames: messageParameters.chapUserNames
                        });
                    $scope.cancelButtonLabel = synchronousTranslateService.translate('no');
                    $scope.okButtonLabel = synchronousTranslateService.translate('yes');

                    $scope.ok = function () {
                        payload.forceOverwriteChapSecret = true; // Set option to force to overwrite CHAP secret
                        api.call({}, payload) // Then retry to invoke api
                            .then(function () {
                                modelInstance.close(true);
                                window.history.back();
                            }, function () {
                                modelInstance.close(true);
                            });
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
            confirmOverwriteChapSecretThenCallApi: confirmOverwriteChapSecretThenCallApi
        };
    });
