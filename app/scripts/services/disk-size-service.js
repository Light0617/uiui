'use strict';

/**
 * @ngdoc service
 * @name rainierApp.diskSizeService
 * @description
 * # diskSizeService
 * Factory in the rainierApp.
 */
angular.module('rainierApp')
    .factory('diskSizeService', function () {
        var units = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB'];
        var speed = 0;
        return {
            getDisplaySize: function (bytes) {
                bytes = parseInt(bytes);
                if (isNaN(bytes) || bytes === 0) {
                    return {
                        size: 0,
                        value: 0,
                        unit: 'GB'
                    };
                }


                var i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
                var updatedSize = (bytes / Math.pow(1024, i)).toFixed(2);
                var unit = units[i];
                return {
                    value: bytes,
                    size: updatedSize,
                    unit: unit
                };

            },
            createDisplaySize: function (size, unit) {
                var i = _.findIndex(units, function (u) {
                    return u === unit;
                });

                var bytes = size * Math.pow(1024, i);
                return this.getDisplaySize(bytes);
            },

            getDisplaySpeed: function (rawSpeed) {
                var speedUnit = 'k';
                speed = parseInt(rawSpeed);
                if (isNaN(speed) || speed === 0) {
                    speed = '';
                } else {
                    speed = (speed / 1000) + speedUnit;
                }
                return speed;
            },

            getDisplaySpeedOnly: function (rawSpeed) {
                speed = parseInt(rawSpeed);
                if (isNaN(speed) || speed === 0) {
                    speed = '';
                } else {
                    speed = (speed / 1000);
                }
                return speed;
            },

            getDisplaySpeedUnitOnly: function (rawSpeed) {
                var speedUnit = 'k';
                speed = parseInt(rawSpeed);
                if (isNaN(speed) || speed === 0) {
                    speedUnit = '';
                }
                return speedUnit;
            }
        };
    });
