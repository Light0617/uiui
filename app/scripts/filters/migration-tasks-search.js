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
    .filter('migrationTasksSearch', function ($filter) {
        return function (input, search) {
            if (!search) {
                return input;
            }

            var freeTextInput = $filter('filter')(input, {
                'migrationTaskName': search.freeText,
            }, false);

            var freeTextInputOnComments = $filter('filter')(input, {
                'comments': search.freeText,
            }, false);

            var selectedInput = $filter('filter')(input, {
                'selected': true,
            }, false);

            input = _.union(freeTextInput, freeTextInputOnComments, selectedInput);

            return _.filter(input, function (item) {
                var statusMatched = true;
                if (search.isStatusFiltered()) {
                    statusMatched = search.scheduled && item.isScheduled() ||
                        search.inProgress && item.isInProgress() ||
                        search.success && item.isSuccess() ||
                        search.failed && item.isFailed() ||
                        search.successWithErrs && item.isSuccessWithErrors();
                }

                var pass = item.selected || statusMatched;
                return pass;

            });
        };
    });
