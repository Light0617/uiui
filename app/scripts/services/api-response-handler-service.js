'use strict';

/**
 * @ngdoc service
 * @name rainierApp.apiResponseHandlerService
 * @description
 * # apiResponseHandlerService
 * Factory in the rainierApp.
 */
angular.module('rainierApp')
    .factory('apiResponseHandlerService', function ($q, $modal, $rootScope, $timeout, synchronousTranslateService) {

        var self = this;

        var _apiGetResponseHandler = function (promise) {
            var wrapped = $q.defer();
            promise.then(function (job) {
                    wrapped.resolve(job);
                }, function (error) {
                    $timeout(function () {
                        var data = error.data;
                        if (!data || !data.message) {
                            data = {
                                message: (function (key) {
                                    return synchronousTranslateService.translate(key);
                                })('common-api-get-message')
                            };
                        }
                        data.received = new Date();
                        $rootScope.$broadcast('pageErrorReceived', data);
                    }, 1000);
                    wrapped.reject(error);
                }
            );
            return wrapped.promise;
        };
        var _apiResponseHandler = function (promise) {

            var wrapped = $q.defer();
            promise.then(function (job) {
                    $timeout(function () {
                        $rootScope.$broadcast('jobCreated', job);
                    }, 1000);

                    wrapped.resolve(job);
                }, function (error) {
                    if (self.errorDialogOpend) {
                        console.log(error);
                        wrapped.reject(error);
                        return;
                    }
                    var modelInstance = $modal.open({
                        templateUrl: 'views/templates/error-modal.html',
                        windowClass: 'modal fade confirmation',
                        backdropClass: 'modal-backdrop',
                        controller: function ($scope) {

                            $scope.error = error.data;
                            $scope.cancel = function () {
                                modelInstance.dismiss('cancel');
                                self.errorDialogOpend = false;
                                wrapped.reject();
                            };

                            modelInstance.result.finally(function() {
                                $scope.cancel();
                            });
                        }
                    });
                    self.errorDialogOpend = true;
                }
            );
            return wrapped.promise;
        };

        return {
            _apiGetResponseHandler: _apiGetResponseHandler,
            _apiResponseHandler: _apiResponseHandler
        };
    });