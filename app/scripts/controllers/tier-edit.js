'use strict';

/**
 * @ngdoc function
 * @name rainierApp.controller:TierManagementCtrl
 * @description
 * # TierManagementCtrl
 * Controller of the rainierApp
 */
angular.module('rainierApp')
    .controller('TierManagementCtrl', function ($scope, orchestratorService, objectTransformService) {

        orchestratorService.tiers().then(function (result) {
            objectTransformService.transformTiers(result);
            $scope.model = result;
            $scope.updatedModel = angular.copy(result);
        });

        $scope.disableButton = function() {
            var updatedTiers = $scope.updatedModel.tiers;
            var oldTiers = $scope.model.tiers;

            for (var i = 0; i < updatedTiers.length; i++) {
                if (updatedTiers[i].tier !== oldTiers[i].tier) {
                    return false;
                }
            }
            return true;
        };

        $scope.updateTierNames = function () {
            var updatedTiers = $scope.updatedModel.tiers;
            var oldTiers = $scope.model.tiers;

            for (var i = 0; i < updatedTiers.length; i++) {
                if (updatedTiers[i].tier !== oldTiers[i].tier) {
                    var payload = buildUpdateTierPayload(updatedTiers[i].tier);
                    orchestratorService.updateTier(oldTiers[i].id, payload);
                }
            }
        };

        function buildUpdateTierPayload(tierName) {
            return {
                tierName: tierName
            };
        }
    });
