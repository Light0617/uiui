'use strict';

/**
 * @ngdoc function
 * @name rainierApp.controller:ChangeLocalPasswordCtrl
 * @description
 * # ChangeLocalPasswordCtrl
 * Controller of the rainierApp
 */
angular.module('rainierApp')
    .controller('ChangeLocalPasswordCtrl', function ($scope, orchestratorService) {
        orchestratorService.accountDomains().then(function (result) {
            if (result){
                var accountDomains = result.accountDomains;
                for (var i=0; i<accountDomains.length; i++){
                    var resultAccountDomain = accountDomains[i];
                    if (resultAccountDomain.domain === 'LOCAL') {
                        orchestratorService.getSystemAccountsDomain(resultAccountDomain.id).then(getSystemAccountsDomainReturns);
                        break;
                    }
                }
            }
        });

        function getSystemAccountsDomainReturns(result) {
            if (result) {
                var users = result.users;
                for (var i=0; i<users.length; i++){
                    var user = users[i];
                    if (user.loginName === 'sysadmin') {
                        $scope.dataModel = {
                            accountDomainId: user.accountDomainId,
                            sysAdminId: user.id,
                            loginName: user.loginName,
                            password: '',
                            confirmPassword: '',
                            passwordFieldType: 'password',
                            showPassword: false,
                            passwordMatch: true
                        };
                        break;
                    }
                }
            }
        }

        $scope.isValid = function () {
            var dataModel = $scope.dataModel;
            if (dataModel) {
                return (isNotBlank($scope.dataModel.loginName) && isNotBlank($scope.dataModel.password) && isNotBlank($scope.dataModel.confirmPassword) && isStringMatch($scope.dataModel.password, $scope.dataModel.confirmPassword));
            } else {
                return false;
            }
        };

        $scope.updateSysAdminPassword = function() {
            var updateAccountDomainUserPayload = buildUpdateAccountDomainUserPayload();
            orchestratorService.updateSystemAccountDomain($scope.dataModel.accountDomainId, $scope.dataModel.sysAdminId, updateAccountDomainUserPayload);
            window.history.back();
        };

        function buildUpdateAccountDomainUserPayload() {
            var updateAccountDomainUserPayload = {
                password: $scope.dataModel.password
            };
            return updateAccountDomainUserPayload;
        }

        function isNotBlank(inputString) {
            return (inputString !== undefined && inputString !== null && inputString.length > 0);
        }

        function isStringMatch(inputString, confirmInputString) {
            return (inputString === confirmInputString);
        }

        $scope.$watchGroup(['dataModel.confirmPassword', 'dataModel.password'], function() {
            var dataModel = $scope.dataModel;
            if (dataModel && isNotBlank(dataModel.password) && isNotBlank(dataModel.confirmPassword)){
                $scope.dataModel.passwordMatch = isStringMatch(dataModel.password, dataModel.confirmPassword);
            } else if (dataModel && isNotBlank(dataModel.password) && dataModel.confirmPassword === '') {
                $scope.dataModel.passwordMatch = true;
            }
        }, true);

        $scope.$watch('dataModel.showPassword', function () {
            var dataModel = $scope.dataModel;
            if (dataModel) {
                if (dataModel.showPassword === false) {
                    $scope.dataModel.passwordFieldType = 'password';
                } else {
                    $scope.dataModel.passwordFieldType = 'text';
                }
            }
        }, true);
    });
