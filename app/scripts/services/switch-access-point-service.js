'use strict';

/**
 * @ngdoc service
 * @name rainierApp.switchAccessPointService
 * @description
 * # switchAccessPointService
 * Factory in the rainierApp.
 */
angular.module('rainierApp')
    .factory('switchAccessPointService', function ($modal, $q, synchronousTranslateService) {
        return {
            getLink: function (storageSystem) {
                var primaryGumNumber;
                var gumIpAddress;
                switch (storageSystem.primaryGumNumber) {
                    case 1:
                        primaryGumNumber = 2;
                        gumIpAddress = storageSystem.gum2IpAddress;
                        break;
                    case 2:
                        primaryGumNumber = 1;
                        gumIpAddress = storageSystem.gum1IpAddress;
                        break;
                    default:
                        return {};
                }
                return {
                    type: 'link',
                    title: 'storage-system-switch-access-point',
                    onClick: function (orchestratorService) {
                        var defer = $q.defer();
                        var modelInstance = $modal.open({
                            templateUrl: 'views/templates/basic-confirmation-modal.html',
                            windowClass: 'modal fade confirmation',
                            backdropClass: 'modal-backdrop',
                            controller: function ($scope) {
                                $scope.confirmationTitle = 'storage-system-switch-access-point-confirm-title';
                                $scope.cancelButtonLabel = 'common-label-cancel';
                                $scope.okButtonLabel = 'common-label-ok';
                                $scope.confirmationMessage = synchronousTranslateService.translate(
                                    'storage-system-switch-access-point-confirm-message',
                                    { 'gumIpAddress': gumIpAddress});
                                $scope.cancel = function () {
                                    modelInstance.dismiss('cancel');
                                    defer.reject();
                                };
                                $scope.ok = function () {
                                    orchestratorService.switchAccessPoint(
                                        storageSystem.storageSystemId, {'primaryGumNumber': primaryGumNumber});
                                    modelInstance.close(true);
                                    defer.resolve(true);
                                };

                                modelInstance.result.finally(function () {
                                    $scope.cancel();
                                    defer.reject();
                                });
                            }
                        });
                    }
                };
            }
        };
    });
