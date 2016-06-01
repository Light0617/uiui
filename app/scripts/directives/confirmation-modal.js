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
                title: '@title',
                content: '@content',
                confirmClick: '&',
                modalId: '@',
                switchEnabled: '=',
                trueText: '@trueText',
                falseText: '@falseText',
                requireSelection: '&',
                itemAttribute: '=',
                itemAttributes: '='
            },
            templateUrl: 'views/templates/confirmation-modal.html',
            restrict: 'E'
        };
    });
