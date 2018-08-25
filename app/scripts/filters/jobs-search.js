'use strict';

/**
 * @ngdoc filter
 * @name rainierApp.filter:parityGroupsSearch
 * @function
 * @description
 * # parityGroupsSearch
 * Filter in the rainierApp.
 */
angular.module('rainierApp')
    .filter('jobsSearch', function ($filter) {
        var getDate= function (shouldFilter, datePart, timePart){
            if (shouldFilter && _.isDate(datePart) && _.isDate(timePart)){

                var year = datePart.getFullYear();
                var month = datePart.getMonth();
                var date = datePart.getDate();
                var hours = timePart.getHours();
                var minutes = timePart.getMinutes();

                var d = new Date(year, month, date, hours, minutes);
               return d.getTime();
            }
            return null;
        };

        var getDateNumberWithoutSeconds = function (number) {
            if (number) {
                var d = new Date(number);
                d.setSeconds(0);
                d.setMilliseconds(0);
                return d.getTime();
            }
            return null;
        };

        return function (input, search) {
            if (!search) {
                return input;
            }
            input = $filter('filter')(input, {
                'title': {
                    'text': search.freeText
                }
            }, false);

            if (search.filterStatus){

                input = _.filter(input, function (item) {
                    var pass = (item.status === search.status || !search.status);
                    return pass;
                });
            }

            // First filter out the start range
            if (search.filterStartTime){

                var startDateStart = getDate(search.filterStartTime, search.startDateStart, search.startTimeStart);
                var startDateEnd = getDate(search.filterStartTime, search.startDateEnd, search.startTimeEnd);

                input = _.filter(input, function (item) {
                    var itemStartDate = getDateNumberWithoutSeconds(item.startDate);

                    var largerThanOrEqualToLowerBound = (startDateStart && itemStartDate >= startDateStart);
                    var smallerThanOrEqualToUpperBound = (startDateEnd && itemStartDate <= startDateEnd);

                    var pass = (search.filterStartTime && largerThanOrEqualToLowerBound && smallerThanOrEqualToUpperBound);
                    return pass;
                });

            }

            // Then filter out the end range
            if (search.filterEndTime){
                var endDateStart = getDate(search.filterEndTime, search.endDateStart, search.endTimeStart);
                var endDateEnd = getDate(search.filterEndTime, search.endDateEnd, search.endTimeEnd);

                input = _.filter(input, function (item) {
                    var itemEndDate =getDateNumberWithoutSeconds(item.endDate);

                    var largerThanOrEqualToLowerBound = (endDateStart && itemEndDate && itemEndDate >= endDateStart);
                    var smallerThanOrEqualToUpperBound = (endDateEnd && itemEndDate && itemEndDate <= endDateEnd);
                    var pass = (search.filterEndTime && largerThanOrEqualToLowerBound && smallerThanOrEqualToUpperBound);
                    return pass;
                });
            }

            return  input;
        };
    });
