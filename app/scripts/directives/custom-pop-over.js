'use strict';

angular.module('rainierApp')
.directive('customPopover', ['$popover', function($popover) {
    return {
        restrict: 'A',
        link: function(scope, element) {
            var myPopover = $popover(element, {
                title: 'Job Id',
                contentTemplate: 'views/templates/pop-over-template.html',
                html: true,
                trigger: 'manual',
                autoClose: true,
                scope: scope,
                container :'body'
            });
            scope.showPopover = function() {
                myPopover.show();
            };
        }
    };
}]);



