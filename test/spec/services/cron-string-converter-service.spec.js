'use strict';

describe('Service: cronStringConverterService tests', function() {
    beforeEach(module('rainierApp'));

    var cronStringConverterService;

    beforeEach(inject(function($injector) {
        cronStringConverterService = $injector.get('cronStringConverterService');
    }));

    describe('natural language converter tests', function() {
        it('returns an invalid schedule correctly', function() {
            expect(cronStringConverterService.fromObjectModelToNaturalLanguage(null)).toEqual('N/A');
            expect(cronStringConverterService.fromObjectModelToNaturalLanguage(undefined)).toEqual('N/A');
            expect(cronStringConverterService.fromObjectModelToNaturalLanguage({})).toEqual('N/A');
            expect(cronStringConverterService.fromObjectModelToNaturalLanguage({hour: null, minute: 0, recurringUnit: 'WEEKLY',
                recurringUnitInterval: 1, dayOfWeek: null, dayOfMonth: null})).toEqual('N/A');
            expect(cronStringConverterService.fromObjectModelToNaturalLanguage({hour: 12, minute: 0, recurringUnit: 'HOURLY',
                recurringUnitInterval: null, dayOfWeek: null, dayOfMonth: null})).toEqual('N/A');
            expect(cronStringConverterService.fromObjectModelToNaturalLanguage({hour: 0, minute: 0, recurringUnit: 'MONTHLY',
                recurringUnitInterval: null, dayOfWeek: ['SUN', 'WED'], dayOfMonth: null})).toEqual('N/A');
            expect(cronStringConverterService.fromObjectModelToNaturalLanguage({hour: 12, minute: 0, recurringUnit: 'WEEKLY',
                recurringUnitInterval: null, dayOfWeek: null, dayOfMonth: 20})).toEqual('N/A');
        });
        it('returns a valid hourly schedule correctly', function() {
            expect(cronStringConverterService.fromObjectModelToNaturalLanguage({minute: 0, recurringUnit: 'HOURLY',
                recurringUnitInterval: 1})).toEqual('Every 1 hour on the hour');
            expect(cronStringConverterService.fromObjectModelToNaturalLanguage({hour: null, minute: 0, recurringUnit: 'HOURLY',
                recurringUnitInterval: 1, dayOfWeek: null, dayOfMonth: null})).toEqual('Every 1 hour on the hour');
            expect(cronStringConverterService.fromObjectModelToNaturalLanguage({minute: 56, recurringUnit: 'HOURLY',
                recurringUnitInterval: 3})).toEqual('At 56 minutes past the hour every 3 hours');
        });
        it('returns an invalid hourly schedule correctly', function() {
            expect(cronStringConverterService.fromObjectModelToNaturalLanguage({minute: null, recurringUnit: 'HOURLY',
                recurringUnitInterval: 1})).toEqual('N/A');
            expect(cronStringConverterService.fromObjectModelToNaturalLanguage({hour: null, minute: 0, recurringUnit: 'HOURLY',
                recurringUnitInterval: null})).toEqual('N/A');
        });
        it('returns a valid daily schedule correctly', function() {
            expect(cronStringConverterService.fromObjectModelToNaturalLanguage({hour: 12, minute: 0, recurringUnit: 'DAILY',
                recurringUnitInterval: null, dayOfWeek: null, dayOfMonth: null})).toEqual('At 12:00 PM every day');
            expect(cronStringConverterService.fromObjectModelToNaturalLanguage({hour: 12, minute: 0, recurringUnit: 'DAILY'})).toEqual('At 12:00 PM every day');
        });
        it('returns an invalid daily schedule correctly', function() {
            expect(cronStringConverterService.fromObjectModelToNaturalLanguage({hour: null, minute: 0, recurringUnit: 'DAILY',
                recurringUnitInterval: null, dayOfWeek: null, dayOfMonth: null})).toEqual('N/A');
            expect(cronStringConverterService.fromObjectModelToNaturalLanguage({hour: 12, minute: null, recurringUnit: 'DAILY',
                recurringUnitInterval: null, dayOfWeek: null, dayOfMonth: null})).toEqual('N/A');
        });
        it('returns a valid weekly schedule correctly', function() {
            expect(cronStringConverterService.fromObjectModelToNaturalLanguage({hour: 0, minute: 0, recurringUnit: 'WEEKLY',
                recurringUnitInterval: null, dayOfWeek: ['SUN', 'WED'], dayOfMonth: null})).toEqual('At 12:00 AM every week on SUN, WED');
            expect(cronStringConverterService.fromObjectModelToNaturalLanguage({hour: 0, minute: 0, recurringUnit: 'WEEKLY',
                dayOfWeek: ['SUN', 'WED']})).toEqual('At 12:00 AM every week on SUN, WED');
        });
        it('returns an invalid weekly schedule correctly', function() {
            expect(cronStringConverterService.fromObjectModelToNaturalLanguage({hour: 0, minute: 0, recurringUnit: 'WEEKLY',
                recurringUnitInterval: null, dayOfWeek: null, dayOfMonth: null})).toEqual('N/A');
            expect(cronStringConverterService.fromObjectModelToNaturalLanguage({hour: null, minute: 0, recurringUnit: 'WEEKLY',
                recurringUnitInterval: null, dayOfWeek: null, dayOfMonth: null})).toEqual('N/A');
            expect(cronStringConverterService.fromObjectModelToNaturalLanguage({hour: 0, minute: null, recurringUnit: 'WEEKLY',
                recurringUnitInterval: null, dayOfWeek: null, dayOfMonth: null})).toEqual('N/A');
        });
        it('returns a valid monthly schedule correctly', function() {
            expect(cronStringConverterService.fromObjectModelToNaturalLanguage({hour: 12, minute: 0, recurringUnit: 'MONTHLY',
                recurringUnitInterval: null, dayOfWeek: null, dayOfMonth: 20})).toEqual('At 12:00 PM every month on 20th day of the month');
            expect(cronStringConverterService.fromObjectModelToNaturalLanguage({hour: 12, minute: 0, recurringUnit: 'MONTHLY',
                dayOfMonth: 20})).toEqual('At 12:00 PM every month on 20th day of the month');
            expect(cronStringConverterService.fromObjectModelToNaturalLanguage({hour: 12, minute: 0, recurringUnit: 'MONTHLY',
                dayOfMonth: 11})).toEqual('At 12:00 PM every month on 11th day of the month');
            expect(cronStringConverterService.fromObjectModelToNaturalLanguage({hour: 12, minute: 0, recurringUnit: 'MONTHLY',
                dayOfMonth: 12})).toEqual('At 12:00 PM every month on 12th day of the month');
            expect(cronStringConverterService.fromObjectModelToNaturalLanguage({hour: 12, minute: 0, recurringUnit: 'MONTHLY',
                dayOfMonth: 13})).toEqual('At 12:00 PM every month on 13th day of the month');
            expect(cronStringConverterService.fromObjectModelToNaturalLanguage({hour: 12, minute: 0, recurringUnit: 'MONTHLY',
                dayOfMonth: 1})).toEqual('At 12:00 PM every month on 1st day of the month');
            expect(cronStringConverterService.fromObjectModelToNaturalLanguage({hour: 12, minute: 0, recurringUnit: 'MONTHLY',
                dayOfMonth: 2})).toEqual('At 12:00 PM every month on 2nd day of the month');
            expect(cronStringConverterService.fromObjectModelToNaturalLanguage({hour: 12, minute: 0, recurringUnit: 'MONTHLY',
                dayOfMonth: 3})).toEqual('At 12:00 PM every month on 3rd day of the month');
            expect(cronStringConverterService.fromObjectModelToNaturalLanguage({hour: 12, minute: 0, recurringUnit: 'MONTHLY',
                dayOfMonth: 21})).toEqual('At 12:00 PM every month on 21st day of the month');
            expect(cronStringConverterService.fromObjectModelToNaturalLanguage({hour: 12, minute: 0, recurringUnit: 'MONTHLY',
                dayOfMonth: 22})).toEqual('At 12:00 PM every month on 22nd day of the month');
            expect(cronStringConverterService.fromObjectModelToNaturalLanguage({hour: 12, minute: 0, recurringUnit: 'MONTHLY',
                dayOfMonth: 23})).toEqual('At 12:00 PM every month on 23rd day of the month');
        });
        it('returns an invalid monthly schedule correctly', function() {
            expect(cronStringConverterService.fromObjectModelToNaturalLanguage({hour: null, minute: 0, recurringUnit: 'MONTHLY',
                recurringUnitInterval: null, dayOfWeek: null, dayOfMonth: 20})).toEqual('N/A');
            expect(cronStringConverterService.fromObjectModelToNaturalLanguage({hour: 12, minute: null, recurringUnit: 'MONTHLY',
                recurringUnitInterval: null, dayOfWeek: null, dayOfMonth: 20})).toEqual('N/A');
            expect(cronStringConverterService.fromObjectModelToNaturalLanguage({hour: 12, minute: 0, recurringUnit: 'MONTHLY',
                recurringUnitInterval: null, dayOfWeek: null, dayOfMonth: null})).toEqual('N/A');
        });
    });
});
