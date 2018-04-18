'use strict';

/**
 * @ngdoc directive
 * @name rainierApp.directive:confirmationModal
 * @description
 * # confirmationModal
 */
angular.module('rainierApp')
    .directive('confirmationModal', function () {
        return {
            scope: {
                dialogTitle: '@dialogTitle',
                content: '@content',
                confirmClick: '&',
                modalId: '@',
                switchEnabled: '=',
                trueText: '@trueText',
                falseText: '@falseText',
                requireSelection: '&',
                disableRadioButton: '=',
                itemAttribute: '=',
                itemAttributes: '='
            },
            templateUrl: 'views/templates/confirmation-modal.html',
            restrict: 'E'
        };
    });
