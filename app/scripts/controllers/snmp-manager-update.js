'use strict';

/**
 * @ngdoc function
 * @name rainierApp.controller:SnmpManagerUpdateCtrl
 * @description
 * # SnmpManagerUpdateCtrl
 * Controller of the rainierApp
 */
angular.module('rainierApp')
    .controller('SnmpManagerUpdateCtrl', function ($scope, $routeParams, $window, orchestratorService) {

        var snmpMgrName = $routeParams.name;
        var dataModel = {
            authProtocols: orchestratorService.authProtocols(),
            privacyProtocols: orchestratorService.privacyProtocols()
        };

        orchestratorService.snmpManager(snmpMgrName)
            .then(function (snmpManager) {
                dataModel.snmpManager = snmpManager;
                dataModel.snmpManager.originalIpAddress = snmpManager.ipAddress;
                dataModel.snmpManager.originalPort = snmpManager.port;
                dataModel.snmpManager.originalUsername = snmpManager.username;
                dataModel.snmpManager.originalPrivacyProtocol = snmpManager.privacyProtocol;
                dataModel.snmpManager.originalAuthProtocol = snmpManager.authProtocol;
            });
        dataModel.canSubmit = function () {
            if (!dataModel.snmpManager){
                return false;
            }
            var valid = !_.isEmpty(dataModel.snmpManager.ipAddress) &&
                 dataModel.snmpManager.port &&
                 !_.isEmpty(dataModel.snmpManager.username);
            if (valid) {
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
            return valid;

        };

        dataModel.submit = function () {
            var payload = {
                ipAddress: (dataModel.snmpManager.originalIpAddress !== dataModel.snmpManager.ipAddress) ? dataModel.snmpManager.ipAddress : null,
                port: (dataModel.snmpManager.originalPort !== dataModel.snmpManager.port) ? dataModel.snmpManager.port : null,
                username: (dataModel.snmpManager.originalUsername !== dataModel.snmpManager.username) ? dataModel.snmpManager.username : null,
                privacyProtocol: dataModel.snmpManager.privacyProtocol,
                privacyPassword: dataModel.snmpManager.privacyProtocol === 'NO_PRIV' ? null : dataModel.snmpManager.privacyPassword,
                authProtocol: dataModel.snmpManager.authProtocol,
                authPassword: dataModel.snmpManager.authProtocol === 'NO_AUTH' ? null : dataModel.snmpManager.authPassword
            };
            orchestratorService.updateSnmpManager(dataModel.snmpManager.name, payload).then(function () {
                window.history.back();
            });
        };

        $scope.dataModel = dataModel;
    });
