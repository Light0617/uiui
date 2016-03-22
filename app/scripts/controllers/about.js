'use strict';

/**
 * @ngdoc function
 * @name rainierApp.controller:AboutCtrl
 * @description
 * # AboutCtrl
 * Controller of the rainierApp
 */
angular.module('rainierApp')
    .controller('AboutCtrl', function($scope) {
        $scope.awesomeThings = [
            'HTML5 Boilerplate',
            'AngularJS',
            'Karma'
        ];
    });
