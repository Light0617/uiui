'use strict';

/**
 * @ngdoc service
 * @name rainierApp.versionService
 * @description
 * # versionService
 * Factory in the rainierApp.
 */
angular.module('rainierApp')
    .factory('versionService', function () {
        return {
            /* jshint ignore:start */
            firmwareVersionPrefix: {
                // SVOS820_HM8x0: '88-0X-X', TODO: add firmware version for HM series v8.2 after version fixed
                SVOS820_Rx00:  '80-07-0', // TODO: update firmware version after version fixed
                SVOS810_HM850: '88-01-0',
                SVOS740_HM800: '83-05-2',
                SVOS740_Rx00:  '80-06-2',
                SVOS731_HM800: '83-05-0',
                SVOS731_Rx00:  '80-06-0',
                SVOS730_HM800: '83-04-6',
                SVOS730_Rx00:  '80-05-6',
                SVOS720_HM800: '83-04-4',
                SVOS720_Rx00:  '80-05-4',
                SVOS712_HM800: '83-04-3',
                SVOS712_Rx00:  '80-05-3',
                SVOS710_HM800: '83-04-2',
                SVOS710_Rx00:  '80-05-2',
                SVOS700_HM800: '83-04-0',
                SVOS700_Rx00:  '80-05-0',
                SVOS641_HM800: '83-03-2',
                SVOS641_Rx00:  '80-04-2',
                SVOS640_HM800: '83-03-0',
                SVOS640_Rx00:  '80-04-0'
            },
            /* jshint ignore:end */

            isStorageSystemVersionSupported: function (version) {
                if(_.isEmpty(version)){
                    return true;
                }

                version = version.substring(0, 7);
                for (var key in this.firmwareVersionPrefix) {
                    if (Object.prototype.hasOwnProperty.call(this.firmwareVersionPrefix, key)) {
                        if (this.firmwareVersionPrefix[key] === version) {
                            return true;
                        }
                    }
                }
                return false;
            },

            isEqualOrGreaterVersion: function (baseVersion, checkVersion) {
                if(_.isEmpty(baseVersion) || _.isEmpty(checkVersion)) {
                    return false;
                }

                var baseVersionNumber = Number(baseVersion.substring(0, 7).replace(/-/g, ''));
                var checkVersionNumber = Number(checkVersion.substring(0, 7).replace(/-/g, ''));

                return baseVersionNumber <= checkVersionNumber;
            }
        };
    });
