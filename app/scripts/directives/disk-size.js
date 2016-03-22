'use strict';

/**
 * @ngdoc directive
 * @name rainierApp.directive:diskSize
 * @description
 * # diskSize
 */
angular.module('rainierApp')
    .directive('diskSize', function(diskSizeService) {
        function postLink(scope, element, attrs) {

            scope.builder = function(sizeObj) {
                if (!sizeObj) {
                    sizeObj = diskSizeService.createDisplaySize(0, 'GB');
                } else if (!_.isPlainObject(scope.size)) {
                    sizeObj = diskSizeService.getDisplaySize(scope.size);
                }

                var wrappedIn = attrs.wrappedIn;
                if (!wrappedIn) {
                    wrappedIn = 'h1';
                }



                var html = [
                    '<', wrappedIn, '>',
                    sizeObj.size,
                    '&nbsp;', sizeObj.unit, ' ',
                    attrs.postFix,
                    '</', wrappedIn, '>'
                ].join('');

                element.html(html);
            };

            scope.$watch(function() {
                return scope.size;
            }, function(val) {
                scope.builder(val);
            });
        }

        return {
            scope: {
                size: '=ngModel'
            },
            replace: true,
            restrict: 'E',
            link: postLink
        };
    });
