/*
 * ========================================================================
 *
 * Copyright (c) by Hitachi Data Systems, 2015. All rights reserved.
 *
 * ========================================================================
 */

'use strict';

/**
 * @ngdoc directive
 * @name rainierApp.directive:jobSplash
 * @description
 * # jobSplash
 */
angular.module('rainierApp')
    .directive('jobSplash', function ($rootScope, $timeout) {
        return {
            scope: { },
            templateUrl: 'views/templates/job-splash.html',
            replace : true,
            restrict: 'E',
            link: function (scope, element) {
                var $job = $(element);
                $job.hide();
                $rootScope.$on('jobCreated', function (evt, job) {
                    scope.splashJob = job;
                    $job.slideDown('slow');

                    $timeout(function () {
                        $job.slideUp('slow');
                    }, 3000);
                });
            }
        };
    });
