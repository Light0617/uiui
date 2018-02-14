/*
 * ========================================================================
 *
 * Copyright (c) by Hitachi Vantara, 2018. All rights reserved.
 *
 * ========================================================================
 */

'use strict';

/**
 * @ngdoc filter
 * @name rainierApp.filter:migrationTasksSearch
 * @function
 * @description
 * # migrationTasksSearch
 * Filter in the rainierApp.
 */
angular.module('rainierApp')
    .filter('migrationTasksSearch', function ($filter, migrationTaskService) {
        return function (input, search) {
            if (!search) {
                return input;
            }

            var freeTextInput = $filter('filter')(input, {
                'migrationTaskName': search.freeText,
            }, false);

            var selectedInput = $filter('filter')(input, {
                'selected': true,
            }, false);

            input = _.union(freeTextInput, selectedInput);

            return _.filter(input, function (item) {
                var statusMatched = true;
                if (search.isStatusFiltered()) {
                    statusMatched = search.scheduled && migrationTaskService.isScheduled(item.status) ||
                        search.inProgress && migrationTaskService.isInProgress(item.status) ||
                        search.success && migrationTaskService.isSuccess(item.status) ||
                        search.failed && migrationTaskService.isFailed(item.status) ||
                        search.successWithErrs && migrationTaskService.isSuccessWithErrors(item.status);
                }

                var pass = item.selected || statusMatched;
                return pass;

            });
        };
    });
