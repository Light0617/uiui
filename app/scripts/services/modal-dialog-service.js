'use strict';

angular.module('rainierApp')
    .factory('modalDialogService', function ($q, $modal) {
        return {
            showDialog: function (title, message, type) {
                var defer = $q.defer();

                var modalInstance = $modal.open({
                    templateUrl: 'views/templates/close-only-modal.html',
                    windowClass: 'modal confirmation',
                    backdropClass: 'modal-backdrop',
                    controller: function ($scope, $modalInstance) {
                        $scope.title = title;
                        $scope.message = message;
                        $scope.type = type;

                        $scope.ok = function () {
                            modalInstance.close();
                            defer.resolve();
                        };

                        $scope.cancel = function () {
                            $modalInstance.dismiss();
                            defer.reject();
                        };
                    }
                });

                return defer.promise;
            }
        };
    });
