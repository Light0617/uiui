/* global Raphael: false */
'use strict';

/**
 * @ngdoc directive
 * @name rainierApp.directive:loadingIndicator
 * @description
 * # loadingIndicator
 */
angular.module('rainierApp')
    .directive('loadingIndicator', function () {
        var spinner = function spinner(ele, R1, R2, count, strokeWidth, colour) {
            var sectorsCount = count || 20,
                color = colour || '#fff',
                width = strokeWidth || 2,
                r1 = Math.min(R1, R2) || 20,
                r2 = Math.max(R1, R2) || 25,
                cx = r2 + width,
                cy = r2 + width,
                r =  Raphael(ele, r2 * 2 + width * 2, r2 * 2 + width * 2), // jshint ignore:line

                sectors = [],
                opacity = [],
                beta = 2 * Math.PI / sectorsCount,

                pathParams = {stroke: color, 'stroke-width': width, 'stroke-linecap': 'round'}; // jshint ignore:line
            Raphael.getColor.reset();
            for (var i = 0; i < sectorsCount; i++) {
                var alpha = beta * i - Math.PI / 2,
                    cos = Math.cos(alpha),
                    sin = Math.sin(alpha);
                opacity[i] = 1 / sectorsCount * i;
                sectors[i] = r.path([['M', cx + r1 * cos, cy + r1 * sin], ['L', cx + r2 * cos, cy + r2 * sin]]).attr(pathParams);
                if (color === 'rainbow') {
                    sectors[i].attr('stroke', Raphael.getColor());
                }
            }
            var tick;
            (function ticker() {
                opacity.unshift(opacity.pop());
                for (var i = 0; i < sectorsCount; i++) {
                    sectors[i].attr('opacity', opacity[i]);
                }
                r.safari();
                tick = setTimeout(ticker, 1000 / sectorsCount);
            })();
            return function () {
                clearTimeout(tick);
                r.remove();
            };
        };

        return {
            restrict: 'A',
            link: function postLink(scope, element, attr) {
                var ele = element[0];
                var color = attr.color;
                spinner(ele, 22, 16, 24, 1,color);
            }
        };
    });
