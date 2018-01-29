'use strict';

/**
 * @ngdoc function
 * @name rainierApp.controller:ShredVolumesCtrl
 * @description
 * # ShredVolumesCtrl
 * Controller of the rainierApp
 */
angular.module('rainierApp')
    .controller('ShredVolumesCtrl', function ($scope, $routeParams, ShareDataService) {
        $scope.dataModel = {
            wizardType: 'basic',
            selectedVolumes: ShareDataService.selectedVolumes,
            minPass: 1,
            maxPass: 35,
            showCurrentVolume: false,
            shreddingAlgorithms:['AA-AA-AA', 'BB-BB-BB', 'CC-CC-CC'],
            itemList:[],
            currentVolume: '',
            selectVolume: function (label) {
                $scope.dataModel.currentVolume = label;
                $scope.dataModel.showCurrentVolume = true;
            },
        };

        $scope.updateNumOfPass = function(){
            $scope.dataModel.itemList=_.range($scope.dataModel.minPass);
        }

        $scope.updateNumOfPassByInput = function(input){
            $scope.dataModel.itemList=_.range(input);
        }

        $scope.resetSlider = function() {
            $scope.dataModel.minPass = 1;
            $scope.updateNumOfPass();
        }
    });
