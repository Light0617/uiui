'use strict';

/**
 * @ngdoc function
 * @name rainierApp.controller:mutualChapService
 * @description
 * # mutualChapService
 * Factory of the rainierApp
 */
angular.module('rainierApp')
    .factory('mutualChapService', function (orchestratorService, $modal,
                                            synchronousTranslateService, utilService) {
        var editMutualChapUser = function (hostGroup) {
            var modelInstance = $modal.open({
                templateUrl: 'views/templates/edit-mutual-chap-user-modal.html',
                windowClass: 'modal fade confirmation',
                backdropClass: 'modal-backdrop',
                controller: function ($scope) {
                    $scope.iscsiTargetName = hostGroup.iscsiTargetInformation.iscsiTargetName;
                    $scope.dataModel = {
                        mutualChapUserName: hostGroup.iscsiTargetInformation.mutualChapUser
                    };
                    $scope.submit = function () {
                        var payload = {
                            iscsiTargetInformation: {
                                mutualChapUser: {
                                    userName: {
                                        currentValue: hostGroup.iscsiTargetInformation.mutualChapUser,
                                        newValue: $scope.dataModel.mutualChapUserName
                                    },
                                    secret: $scope.dataModel.mutualChapUserSecret
                                }
                            }
                        };
                        orchestratorService.editMutualChapUser(
                            hostGroup.storageSystemId, hostGroup.hostGroupId, payload);
                        $scope.cancel();
                    };

                    $scope.canSubmit = function () {
                        return $scope.dataModel &&
                            !utilService.isNullOrUndefOrBlank($scope.dataModel.mutualChapUserName) &&
                            !utilService.isNullOrUndefOrBlank($scope.dataModel.mutualChapUserSecret);
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

        var deleteMutualChapUser = function (hostGroup) {
            var modelInstance = $modal.open({
                templateUrl: 'views/templates/basic-confirmation-modal.html',
                windowClass: 'modal fade confirmation',
                backdropClass: 'modal-backdrop',
                controller: function ($scope) {
                    $scope.confirmationTitle = synchronousTranslateService.translate(
                        'host-delete-mutual-chap-user');
                    $scope.confirmationMessage = synchronousTranslateService.translate(
                        'host-delete-mutual-chap-user-message',
                        {
                            iscsiTargetName: hostGroup.iscsiTargetInformation.iscsiTargetName
                        });
                    $scope.cancelButtonLabel = synchronousTranslateService.translate(
                        'cancel-button');
                    $scope.okButtonLabel = synchronousTranslateService.translate(
                        'ok-button');

                    $scope.ok = function () {
                        var payload = {
                            iscsiTargetInformation: {
                                mutualChapUser: {
                                    userName: {
                                        currentValue: hostGroup.iscsiTargetInformation.mutualChapUser,
                                        newValue: null
                                    }
                                }
                            }
                        };
                        orchestratorService.editMutualChapUser(
                            hostGroup.storageSystemId, hostGroup.hostGroupId, payload);
                        $scope.cancel();
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
            editMutualChapUser: editMutualChapUser,
            deleteMutualChapUser: deleteMutualChapUser
        };
    });
