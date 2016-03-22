


'use strict';

/**
 * @ngdoc function
 * @name rainierApp.controller:StorageSystemsAddCtrl
 * @description
 * # StorageSystemsAddCtrl
 * Controller of the rainierApp
 */
angular.module('rainierApp')
    .controller('StorageSystemsAddCtrl', function($scope, orchestratorService) {
        $scope.model = {
            svpIpAddress: '',
            username: '',
            password: ''

        };

        $scope.payload = {
            submit : function () {
                orchestratorService.addStorageSystem($scope.model).then(function () {
                    window.history.back();
                });
            },
            isInvalid: function() {
                return !$scope.model ||
                    _.isEmpty($scope.model.svpIpAddress) ||
                    _.isEmpty($scope.model.username) ||
                    _.isEmpty($scope.model.password) ;
            }
        };
    });
