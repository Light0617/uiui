'use strict';

/**
 * @ngdoc function
 * @name rainierApp.controller:SnmpManagerAddCtrl
 * @description
 * # SnmpManagerAddCtrl
 * Controller of the rainierApp
 */
angular.module('rainierApp')
    .controller('SnmpManagerAddCtrl', function ($scope, $window, orchestratorService) {

        var dataModel = {
            snmpManager: {
                authProtocol: 'NO_AUTH',
                privacyProtocol: 'NO_PRIV'
            },
            authProtocols: orchestratorService.authProtocols(),
            privacyProtocols: orchestratorService.privacyProtocols()
        };

        dataModel.canSubmit = function () {
            var isValid = !_.isEmpty(dataModel.snmpManager.ipAddress) && !_.isEmpty(dataModel.snmpManager.port) &&
                !_.isEmpty(dataModel.snmpManager.name) &&
                !_.isEmpty(dataModel.snmpManager.username);
            if (isValid) {
                if (dataModel.snmpManager.privacyProtocol!=='NO_PRIV' && _.isEmpty(dataModel.snmpManager.privacyPassword)){
                    return false;
                }
                if (dataModel.snmpManager.authProtocol!=='NO_AUTH' && _.isEmpty(dataModel.snmpManager.authPassword)){
                    return false;
                }
                if (dataModel.snmpManager.privacyProtocol!=='NO_PRIV' && dataModel.snmpManager.authProtocol==='NO_AUTH'){
                    return false;
                }
            }
            return isValid;
        };

        dataModel.submit = function () {
            var payload = buildAddSnmpManagerPayload([dataModel.snmpManager]);
            orchestratorService.addSnmpManager(payload).then(function () {
                window.history.back();
            });
        };

        $scope.dataModel = dataModel;

        function buildAddSnmpManagerPayload(snmpManagers) {
            var addSnmpManagerPayload = {
                snmpManagers: []
            };

            _.forEach( snmpManagers, function(snmpManager){
                addSnmpManagerPayload.snmpManagers.push({
                    name: snmpManager.name,
                    username: snmpManager.username,
                    ipAddress: snmpManager.ipAddress,
                    authProtocol: snmpManager.authProtocol,
                    authPassword: snmpManager.authProtocol === 'NO_AUTH' ? null : snmpManager.authPassword,
                    privacyProtocol: snmpManager.privacyProtocol,
                    privacyPassword: snmpManager.privacyProtocol === 'NO_PRIV' ? null : snmpManager.privacyPassword,
                    port: snmpManager.port

                });
            });
            return addSnmpManagerPayload;
        }
    });
