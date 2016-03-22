'use strict';

/**
 * @ngdoc function
 * @name rainierApp.controller:LoginCtrl
 * @description
 * # LoginCtrl
 * Controller of the rainierApp
 */
angular.module('rainierApp')
    .controller('LoginCtrl', function($scope, $location, authService) {
        $scope.model = {
            date: new Date(),
            username: '',
            password: '',
            loginDisabled: function() {
                return $scope.model.username.length === 0 || $scope.model.password.length === 0;
            },
            login: function() {

                authService.login($scope.model.username, $scope.model.password).then(
                    function() {
                        $location.path('/');
                    },
                    function(res){
                        if (res && res.status === 401){
                            $scope.model.unauthorized = true;
                        } else {
                            $scope.model.loginFailed = true;
                        }
                    }
                );

            }

        };
    });
