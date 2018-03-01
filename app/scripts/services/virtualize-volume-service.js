'use strict';

/**
 * @ngdoc service
 * @name rainierApp.virtualizeVolumeService
 * @description
 * # virtualizeVolumeService
 * Factory in the rainierApp.
 */
angular.module('rainierApp')
    .factory('virtualizeVolumeService', function (attachVolumeService) {


        return {
            getViewBoxHeight: function(sourcePorts, targetPorts, sourceCoordinates, targetCoordinates) {
            attachVolumeService.setPortCoordiantes(sourcePorts, sourceCoordinates);
            attachVolumeService.setPortCoordiantes(targetPorts, targetCoordinates);

            var sourceHeight = sourcePorts[sourcePorts.length - 1].coordinate.y + 30;

            var targetHeight = targetPorts[targetPorts.length - 1].coordinate.y + 30;

            return Math.max(sourceHeight, targetHeight);
        }
        };
    });