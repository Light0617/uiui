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
            company: synchronousTranslateService.translate('brand-company'),
            product: synchronousTranslateService.translate('brand-rainier'),
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
            userPlaceholder: synchronousTranslateService.translate('login-username-placeholder'),
            passwdPlaceholder: synchronousTranslateService.translate('login-password-placeholder'),
            failedMessage: synchronousTranslateService.translate('login-common-error'),
            unauthorizedMessage: synchronousTranslateService.translate('login-unauthorized-error'),
            palette: ['#35665C', '#458B74', '#56AF8C', '#66D4A4']
        };
    });