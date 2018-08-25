'use strict';

/**
 * @ngdoc directive
 * @name rainierApp.directive:thresholdVisualization
 * @description
 * # backButton
 */
angular.module('rainierApp')
    .directive('thresholdVisualization', function (synchronousTranslateService, d3service) {
        var baseHeight = 50;
        var baseWidth = baseHeight * 0.5;

        var arrowWidth = 2;
        var arrowHeight = 2;

        var thresholdBarX = 19.5;
        var thresholdBarY = arrowHeight/2;

        var svgWidth = 80;
        var svgHeight = baseHeight + arrowHeight;

        var builder = {

            buildLayout: function (d3, svg, model) {
                var threshold1 = parseFloat(model.utilizationThreshold1);
                var threshold2 = parseFloat(model.utilizationThreshold2);
                var logicalUtilization = parseFloat(model.logicalUtilization);
                var utilizationY = (100 - logicalUtilization)/100 * baseHeight;
                var thresholdHeight = (baseHeight - utilizationY);
                var y2 = (100 - threshold2)/100 * baseHeight;
                var y1 = (100 - threshold1)/100 * baseHeight;

                var polygonThreshold2Points = (thresholdBarX + baseWidth) + ',' + (thresholdBarY + y2) + ' ' + (thresholdBarX + baseWidth + arrowWidth) + ',' + (thresholdBarY + y2 - arrowHeight/2) + ' ' + (thresholdBarX + baseWidth + arrowWidth) + ',' + (thresholdBarY + y2 + arrowHeight/2);
                var polygonThreshold1Points = (thresholdBarX + baseWidth) + ',' + (thresholdBarY + y1) + ' ' + (thresholdBarX + baseWidth + arrowWidth) + ',' + (thresholdBarY + y1 - arrowHeight/2) + ' ' + (thresholdBarX + baseWidth + arrowWidth) + ',' + (thresholdBarY + y1 + arrowHeight/2);
                var polygonUtilizationPoints = (thresholdBarX) + ',' + (thresholdBarY + utilizationY) + ' ' + (thresholdBarX - arrowWidth) + ',' + (thresholdBarY + utilizationY - arrowHeight/2) + ' ' + (thresholdBarX - arrowWidth) + ',' + (thresholdBarY + utilizationY + arrowHeight/2);

                var bar = svg
                    .attr('version', '1.1')
                    .attr('viewBox', '0 0 ' + svgWidth + ' ' + svgHeight)
                    .attr('preserveAspectRatio', 'xMidYMin slice')
                    .attr('transform', 'scale(1,1)')
                    .attr('class', 'udv')
                    .attr('class', 'udv-thresholds')
                    .attr('style', 'padding-bottom:' + svgHeight/svgWidth*100 + '%');

                var stack = bar.append('g')
                    .attr('class', 'utilization-stack');

                stack.append('rect')
                    .attr('class', 'base-value')
                    .attr('rx', 0.5)
                    .attr('ry', 0.5)
                    .attr('x', thresholdBarX)
                    .attr('y', thresholdBarY)
                    .attr('width', baseWidth)
                    .attr('height', baseHeight);

                var colorString = '';
                if (logicalUtilization>=threshold2) {
                    colorString = 'fill:#D14D36';
                }
                else if (logicalUtilization>=threshold1 && model.type !== 'HTI') {
                    colorString = 'fill:#FBAF17';
                }
                else {
                    colorString = 'fill:#A1E06E';
                }

                stack.append('rect')
                    .attr('class', 'thresholds')
                    .attr('rx', 0.5)
                    .attr('ry', 0.5)
                    .attr('x', thresholdBarX)
                    .attr('y', thresholdBarY + utilizationY)
                    .attr('style', colorString)
                    .attr('width', baseWidth)
                    .attr('height', thresholdHeight);

                stack.append('line')
                    .attr('class', 'base-value')
                    .attr('x1', thresholdBarX)
                    .attr('y1', thresholdBarY + y2)
                    .attr('x2', thresholdBarX + baseWidth)
                    .attr('y2', thresholdBarY + y2)
                    .attr('stroke-width', 0.1)
                    .attr('stroke', 'black');

                stack.append('line')
                    .attr('class', 'base-value')
                    .attr('x1', thresholdBarX)
                    .attr('y1', thresholdBarY + y1)
                    .attr('x2', thresholdBarX + baseWidth)
                    .attr('y2', thresholdBarY + y1)
                    .attr('stroke-width', 0.1)
                    .attr('stroke', 'black');

                bar.append('polygon')
                    .attr('class', 'caret')
                    .attr('style', 'fill:#D14D36')
                    .attr('points', polygonThreshold2Points);

                bar.append('polygon')
                    .attr('class', 'caret')
                    .attr('style', 'fill:#FBAF17')
                    .attr('points', polygonThreshold1Points);

                bar.append('polygon')
                    .attr('class', 'caret')
                    .attr('points', polygonUtilizationPoints);

                bar.append('text')
                    .attr('x', thresholdBarX + baseWidth + arrowWidth + 1)
                    .attr('y', (thresholdBarY + y2 + arrowHeight/2 - 0.3))
                    .attr('font-size', '12.5%')
                    .attr('style','text-transform: uppercase')
                    .text(synchronousTranslateService.translate('threshold2') + ' ' + model.utilizationThreshold2);

            if ( model.suspendSnapshot === true) {
                bar.append('text')
                    .attr('x', thresholdBarX + baseWidth + arrowWidth + 1)
                    .attr('y', (thresholdBarY + y2 - arrowHeight/2 - 0.3))
                    .attr('font-size', '12.5%')
                    .text(synchronousTranslateService.translate('storage-pool-suspend-snapshot-description'))
                    .append('title')
                    .text(synchronousTranslateService.translate('storage-pool-suspend-snapshot-description'));
            }

            bar.append('text')
                    .attr('x', thresholdBarX + baseWidth + arrowWidth + 1)
                    .attr('y', (thresholdBarY + y1 + arrowHeight/2 - 0.3))
                    .attr('font-size', '12.5%')
                    .attr('style','text-transform: uppercase')
                    .text(synchronousTranslateService.translate('threshold1') + ' ' + model.utilizationThreshold1);

                bar.append('text')
                    .attr('x', 0)
                    .attr('y', (thresholdBarY + utilizationY + arrowHeight/2 - 0.3))
                    .attr('font-size', '12.5%')
                    .attr('style','text-transform: uppercase')
                    .text(synchronousTranslateService.translate('utilization') + ' ' + model.logicalUtilization +'%');
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
