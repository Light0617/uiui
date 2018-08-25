'use strict';

/**
 * @ngdoc function
 * @name rainierApp.controller:StoragePortCtrl
 * @description
 * # StoragePortCtrl
 * Controller of the rainierApp
 */
angular.module('rainierApp')
    .controller('StoragePortCtrl', function ($scope, $routeParams, orchestratorService) {
        var storageSystemId = $routeParams.storageSystemId;
        var storagePortId = $routeParams.storagePortId;

        orchestratorService.storagePort(storageSystemId, storagePortId).then(function (result) {
            $scope.model = result;
        });
    });
