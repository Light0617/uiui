'use strict';

/**
 * @ngdoc service
 * @name rainierApp.cronStringConverterService
 * @description
 * # cronStringConverterService
 * Factory in the rainierApp.
 */
angular.module('rainierApp')
    .factory('cronStringConverterService', function () {

        function addSuffix (date) {
            switch (date % 100) {
                case 11:
                case 12:
                case 13:
                    return date + 'th';
            }
            switch (date % 10) {
                case 1:
                    return date + 'st';
                case 2:
                    return date + 'nd';
                case 3:
                    return date + 'rd';
                default:
                    return date + 'th';
            }
        }

        function addZero (time) {
            if (time < 10) {
                time = '0' + time;
            }
            return time;
        }

        function timeConverter (hour, minute) {
            var suffix = 'AM';
            if (hour >= 12) {
                hour = hour - 12;
                suffix = 'PM';
            }
            if (hour === 0) {
                hour = 12;
            }
            return hour + ':' + addZero(minute) + ' ' + suffix;
        }

        function requiredParamCheck (param) {
            return param !== undefined && param !== null;
        }

        return {
            fromDatePickerToObjectModel: function (type, time, date, days, hourInterval, hourStartMinute) {
                var objectModel = {};
                if (type === 'HOURLY' || type === 'hour' || type === 'Hourly') {
                    objectModel.hour = null;
                    objectModel.minute = parseInt(hourStartMinute);
                } else if (time) {
                    objectModel.hour = parseInt(time.getHours());
                    objectModel.minute = parseInt(time.getMinutes());
                } else {
                    objectModel.hour = null;
                    objectModel.minute = null;
                }
                if (type === type.toLowerCase()) {
                    if (type === 'day') {
                        objectModel.recurringUnit = 'DAILY';
                    } else {
                        objectModel.recurringUnit = type.toUpperCase() + 'LY';
                    }
                } else {
                    objectModel.recurringUnit = type.toUpperCase();
                }
                objectModel.recurringUnitInterval = null;
                objectModel.dayOfWeek = null;
                objectModel.dayOfMonth = null;
                var transformWeekdays = function (weekday) {
                    var transformedWeekday;
                    switch (weekday) {
                        case 'Sunday':
                            transformedWeekday = 'SUN';
                            break;
                        case 'Monday':
                            transformedWeekday = 'MON';
                            break;
                        case 'Tuesday':
                            transformedWeekday = 'TUE';
                            break;
                        case 'Wednesday':
                            transformedWeekday = 'WED';
                            break;
                        case 'Thursday':
                            transformedWeekday = 'THU';
                            break;
                        case 'Friday':
                            transformedWeekday = 'FRI';
                            break;
                        case 'Saturday':
                            transformedWeekday = 'SAT';
                            break;
                    }
                    return transformedWeekday;
                };
                switch (type) {
                    case 'HOURLY':
                    case 'hour':
                    case 'Hourly':
                        objectModel.recurringUnitInterval = parseInt(hourInterval);
                        break;
                    case 'DAILY':
                    case 'day':
                    case 'Daily':
                        break;
                    case 'WEEKLY':
                        objectModel.dayOfWeek = [];
                        if (typeof days === 'string') {
                            days = days.replace(/\s+/g, '');
                            var splicedDays = days.split(',');
                            _.forEach(splicedDays, function (d) {
                                objectModel.dayOfWeek.push(transformWeekdays(d));
                            });
                        } else if (typeof days === 'object') {
                            for (var day in days) {
                                if (days.hasOwnProperty(day)) {
                                    if (days[day] === true) {
                                        objectModel.dayOfWeek.push(day.toString().toUpperCase());
                                    }
                                }
                            }
                        }
                        break;
                    case 'week':
                        objectModel.dayOfWeek = [];
                        _.forEach(days, function (selectedDay) {
                            objectModel.dayOfWeek.push(transformWeekdays(selectedDay));
                        });
                        break;
                    case 'MONTHLY':
                    case 'month':
                    case 'Monthly':
                        objectModel.dayOfMonth = date;
                        break;
                }
                return objectModel;
            },

            isEqualForObjectModel: function (uiSchedule, backendSchedule) {
                if (uiSchedule.recurringUnit !== backendSchedule.recurringUnit) {
                    return false;
                }
                var result = true;
                switch (uiSchedule.recurringUnit) {
                    case 'HOURLY':
                        result = parseInt(uiSchedule.minute) === parseInt(backendSchedule.minute) &&
                            parseInt(uiSchedule.recurringUnitInterval) === parseInt(backendSchedule.recurringUnitInterval);
                        break;
                    case 'DAILY':
                        result = parseInt(uiSchedule.minute) === parseInt(backendSchedule.minute) &&
                            parseInt(uiSchedule.hour) === parseInt(backendSchedule.hour);
                        break;
                    case 'WEEKLY':
                        result = parseInt(uiSchedule.minute) === parseInt(backendSchedule.minute) &&
                            parseInt(uiSchedule.hour) === parseInt(backendSchedule.hour) &&
                            _.isEqual(_.sortBy(uiSchedule.dayOfWeek), _.sortBy(backendSchedule.dayOfWeek));
                        break;
                    case 'MONTHLY':
                        result = parseInt(uiSchedule.minute) === parseInt(backendSchedule.minute) &&
                            parseInt(uiSchedule.hour) === parseInt(backendSchedule.hour) &&
                            parseInt(uiSchedule.dayOfMonth) === parseInt(backendSchedule.dayOfMonth);
                        break;
                }
                return result;
            },

            fromObjectModelToDatePicker: function (objectModel) {
                if (!objectModel || _.isEmpty(objectModel) || !objectModel.recurringUnit) {
                    return null;
                }
                var schedule = {};
                schedule.type = objectModel.recurringUnit;
                if (objectModel.recurringUnit !== 'HOURLY') {
                    schedule.hourInterval = null;
                    schedule.hourStartMinute = null;
                    schedule.time = new Date();
                    schedule.time.setHours(objectModel.hour, objectModel.minute);
                } else {
                    schedule.hourInterval = objectModel.recurringUnitInterval;
                    schedule.hourStartMinute = objectModel.minute;
                    schedule.time = null;
                }
                switch (objectModel.recurringUnit) {
                    case 'HOURLY':
                        schedule.days = null;
                        schedule.date = null;
                        break;
                    case 'DAILY':
                        schedule.days = null;
                        schedule.date = null;
                        break;
                    case 'WEEKLY':
                        schedule.days = {
                            Mon: false,
                            Tue: false,
                            Wed: false,
                            Thu: false,
                            Fri: false,
                            Sat: false,
                            Sun: false
                        };
                        var capitalizeFirstLetter = function (string) {
                            return string.substr(0, 1).toUpperCase() + string.slice(1).toLowerCase();
                        };
                        _.forEach(objectModel.dayOfWeek, function(day) {
                            schedule.days[capitalizeFirstLetter(day)] = true;
                        });
                        schedule.date = null;
                        break;
                    case 'MONTHLY':
                        schedule.days = null;
                        schedule.date = objectModel.dayOfMonth;
                        break;
                    default:
                        schedule = {};
                }
                return schedule;
            },

            fromObjectModelToNaturalLanguage: function (objectModel) {
                if (!objectModel || _.isEmpty(objectModel) || !objectModel.recurringUnit) {
                    return 'N/A';
                }
                var naturalLanguage = '';

                switch (objectModel.recurringUnit) {
                    case 'HOURLY':
                        if (requiredParamCheck(objectModel.minute) && requiredParamCheck(objectModel.recurringUnitInterval)) {
                            if (objectModel.minute === 0) {
                                naturalLanguage = 'Every ' + objectModel.recurringUnitInterval +
                                    (objectModel.recurringUnitInterval === 1 ? ' hour on the hour' : 'hours on the hour');
                            } else {
                                naturalLanguage = 'At ' + objectModel.minute + (objectModel.minute === 1 ? ' minute past the hour every ' :  ' minutes past the hour every ') +
                                    objectModel.recurringUnitInterval + (objectModel.recurringUnitInterval === 1 ? ' hour' : ' hours');
                            }
                        } else {
                            naturalLanguage = 'N/A';
                        }
                        break;
                    case 'DAILY':
                        if (requiredParamCheck(objectModel.hour) && requiredParamCheck(objectModel.minute)) {
                            naturalLanguage = 'At ' + timeConverter(objectModel.hour, objectModel.minute) + ' every day';
                        } else {
                            naturalLanguage = 'N/A';
                        }
                        break;
                    case 'WEEKLY':
                        if (requiredParamCheck(objectModel.hour) && requiredParamCheck(objectModel.minute) && requiredParamCheck(objectModel.dayOfWeek)) {
                            naturalLanguage = 'At ' + timeConverter(objectModel.hour, objectModel.minute) + ' every week on ' + objectModel.dayOfWeek.join(', ');
                        } else {
                            naturalLanguage = 'N/A';
                        }
                        break;
                    case 'MONTHLY':
                        if (requiredParamCheck(objectModel.hour) && requiredParamCheck(objectModel.minute) && requiredParamCheck(objectModel.dayOfMonth)) {
                            naturalLanguage = 'At ' + timeConverter(objectModel.hour, objectModel.minute) + ' every month on ' + addSuffix(objectModel.dayOfMonth) + ' day of the month';
                        } else {
                            naturalLanguage = 'N/A';
                        }
                        break;
                    default:
                        naturalLanguage = 'N/A';
                }
                return naturalLanguage;
            }
        };
    });