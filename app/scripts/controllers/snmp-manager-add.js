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
                authProtocol: {value:'NO_AUTH', display:'No Auth'},
                privacyProtocol: {value:'NO_PRIV', display:'No Privacy'}
            },
            authProtocols: _.map(orchestratorService.authProtocols(), function(value) {
                if(value === 'NO_AUTH') {
                    return {value:value, display:'No Auth'}
                }
                return {value:value, display:value}
            }),
            privacyProtocols: _.map(orchestratorService.privacyProtocols(), function(value) {
                if(value === 'NO_PRIV') {
                    return {value:value, display:'No Privacy'}
                }
                return {value:value, display:value}
            })
        };

        dataModel.canSubmit = function () {
            var isValid = !_.isEmpty(dataModel.snmpManager.ipAddress) && !_.isEmpty(dataModel.snmpManager.port) &&
                !_.isEmpty(dataModel.snmpManager.name) &&
                !_.isEmpty(dataModel.snmpManager.username);
            if (isValid) {
                if (dataModel.snmpManager.privacyProtocol.value!=='NO_PRIV' && _.isEmpty(dataModel.snmpManager.privacyPassword)){
                    return false;
                }
                if (dataModel.snmpManager.authProtocol.value!=='NO_AUTH' && _.isEmpty(dataModel.snmpManager.authPassword)){
                    return false;
                }
                if (dataModel.snmpManager.privacyProtocol.value!=='NO_PRIV' && dataModel.snmpManager.authProtocol.value==='NO_AUTH'){
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
                    authProtocol: snmpManager.authProtocol.value,
                    authPassword: snmpManager.authProtocol.value === 'NO_AUTH' ? null : snmpManager.authPassword,
                    privacyProtocol: snmpManager.privacyProtocol.value,
                    privacyPassword: snmpManager.privacyProtocol.value === 'NO_PRIV' ? null : snmpManager.privacyPassword,
                    port: snmpManager.port

                });
            });
            return addSnmpManagerPayload;
        }
    });
