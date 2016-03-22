'use strict';

angular.module('rainierApp')
    .directive('welcomeUser', function(authService) {
        return {
            restrict: 'E',
            replace: true,
            link: function() {
                authService.getUser();
            }
        };
    });
