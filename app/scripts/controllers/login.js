'use strict';

/**
 * @ngdoc function
 * @name rainierApp.controller:LoginCtrl
 * @description
 * # LoginCtrl
 * Controller of the rainierApp
 */
angular.module('rainierApp')
    .controller('LoginCtrl', function ($scope, $compile, $location, authService, synchronousTranslateService) {
        $scope.model = {
            submitAction: function () {
                authService.login($scope.model.username, $scope.model.password).then(
                    function () {
                        $location.path('/');
                    },
                    function (res) {
                        if (res && res.status === 401) {
                            $scope.model.unauthorized = true;
                        } else {
                            $scope.model.loginFailed = true;
                        }
                    }
                );
            },
            palette: ['#35665C', '#458B74', '#56AF8C', '#66D4A4']
        };

        function watch(key, prop) {
            $scope.$watch(function () {
                return synchronousTranslateService.translate(key);
            }, function (newVal) {
                $scope.model[prop] = newVal;
            });
        }

        watch('brand-company', 'company');
        watch('brand-rainier', 'product');
        watch('login-username-placeholder', 'userPlaceholder');
        watch('login-password-placeholder', 'passwdPlaceholder');
        watch('login-common-error', 'failedMessage');
        watch('login-unauthorized-error', 'unauthorizedMessage');
    });