'use strict';

/**
 * @ngdoc directive
 * @name rainierApp.directive:thresholdVisualization
 * @description
 * # backButton
 */
angular.module('rainierApp')
    .directive('thresholdVisualization', function (d3service) {
        var baseHeight = 80;
        var svgWidth = 75;
        var arrowHeight = 2;

        var builder = {

            buildLayout: function (d3, svg, model) {
                var threshold1 = parseFloat(model.utilizationThreshold1);
                var threshold2 = parseFloat(model.utilizationThreshold2);

                var baseWidth = baseHeight / 2;
                var thresholdDiff = (threshold2 - threshold1) * baseHeight / 100;
                var y2 = (100 - threshold2) * baseHeight / 100 - arrowHeight / 2;
                var y1 = (100 - threshold1) * baseHeight / 100 - arrowHeight / 2;
                var polygon2Points = baseWidth + ',' + y2 + ' ' + (baseWidth+arrowHeight) + ',' + (y2 - arrowHeight/2) + ' ' + (baseWidth+arrowHeight) + ',' + (y2 + arrowHeight/2);
                var polygon1Points = baseWidth + ',' + y1 + ' ' + (baseWidth+arrowHeight) + ',' + (y1 - arrowHeight/2) + ' ' + (baseWidth+arrowHeight) + ',' + (y1 + arrowHeight/2);

                var bar = svg
                    .attr('version', '1.1')
                    .attr('viewBox', '0 0 ' + svgWidth + ' ' + baseHeight)
                    .attr('preserveAspectRatio', 'xMinYMin meet')
                    .attr('transform', 'scale(1,1)')
                    .attr('class', 'udv');

                var stack = bar.append('g')
                    .attr('class', 'utilization-stack');

                stack.append('rect')
                    .attr('class', 'base-value')
                    .attr('rx', 1)
                    .attr('ry', 1)
                    .attr('width', baseWidth)
                    .attr('height', baseHeight);

                stack.append('rect')
                    .attr('class', 'thresholds')
                    .attr('rx', 1)
                    .attr('ry', 1)
                    .attr('y', y2)
                    .attr('style', 'fill:#A1E06E;')
                    .attr('width', baseWidth)
                    .attr('height', thresholdDiff);

                bar.append('polygon')
                    .attr('style', 'fill: lime')
                    .attr('points', polygon2Points);

                bar.append('polygon')
                    .attr('style', 'fill: lime')
                    .attr('points', polygon1Points);

                bar.append('text')
                    .attr('x', baseWidth + arrowHeight + 2)
                    .attr('y', y2+1)
                    .attr('font-size', '20%')
                    .text('Threshold 2: ' + model.utilizationThreshold2);
                bar.append('text')
                    .attr('x', baseWidth + arrowHeight + 2)
                    .attr('y', y1+1)
                    .attr('font-size', '20%')
                    .text('Threshold 1: ' + model.utilizationThreshold1);

                bar.append('text')
                    .attr('x', baseWidth/2 - 13)
                    .attr('y', baseHeight / 2)
                    .attr('font-size', '20%')
                    .attr('fill', 'white')
                    .text('Subscription Limit: ');

                bar.append('text')
                    .attr('x', baseWidth/2 - 4)
                    .attr('y', baseHeight / 2 + 5)
                    .attr('font-size', '20%')
                    .attr('fill', 'white')
                    .text((model.subscriptionLimit.unlimited === true) ? 'unlimited' : model.subscriptionLimit.value);
            }
        };

        return {
            scope: {
                model: '=ngModel'
            },
            restrict: 'E',
            replace: false,
            link: function postLink(scope, element) {
                d3service.d3().then(function (d3) {
                    var ele = element[0];
                    var svg = d3.select(ele)
                        .append('svg');

                    scope.$watch(function () {
                        return scope.model;
                    }, function () {
                        scope.render(scope.model);
                    }, true);
                    scope.render = function (model) {
                        // remove all previous items before render
                        svg.selectAll('*').remove();

                        // If we don't pass any data, return out of the element
                        if (!model) {
                            return;
                        }

                        builder.buildLayout(d3, svg, model, scope);
                    };
                });
            }

        };
    });
