/**
 * @ngdoc directive
 * @name rainierApp.directive:wizardSvgPage
 * @description
 * # wizardSvgPage
 */

'use strict';

angular.module('rainierApp')
    .directive('wizardSvgPage', function (d3service) {

        var builder;

        builder = {
            _buildTopologicalEditor: function (d3, svg, dataModel) {

                var g = svg.append('g');
                g.selectAll('path')
                    .data(dataModel.pathModel.paths)
                    .enter()
                    .append('path')
                    .attr('d', function (d){
                        return dataModel.pathModel.getPath(d);
                    })
                    .attr('path-index', function(d, i){
                        return i;
                    })
                    .attr('stroke-width', 2)
                    .attr('stroke', 'blue')
                    .attr('fill', 'none')
                    .on('mouseover', function () {
                        if ((d3.select(this).attr('selected')) !== 'true') {
                            d3.select(this).attr('stroke', 'red');
                        }

                    })
                    .on('mouseout', function () {
                        if ((d3.select(this).attr('selected')) !== 'true') {
                            d3.select(this).attr('stroke', 'blue');
                        }
                    })
                    .on('click', function () {
                        if ((d3.select(this).attr('selected')) !== 'true') {
                            d3.select(this).attr('selected', 'true');
                        } else {
                            d3.select(this).attr('selected', 'false');
                        }
                    });

            }
        };

        return {
            scope: {
                dataModel: '=ngModel'
            },
            templateUrl: 'views/templates/wizard-svg-page.html',
            restrict: 'E',
            link: function postLink(scope) {
                d3service.d3().then(function (d3) {

                    var svg = d3.select('#topology-editor');

                    scope.$watch(function () {
                        return scope.dataModel;
                    }, function () {
                        scope.render(scope.dataModel);
                    }, true);
                    scope.render = function (dataModel) {

                        // If we don't pass any data, return out of the element
                        if (!dataModel) {
                            return;
                        }

                        builder._buildTopologicalEditor(d3, svg, dataModel);
                    };
                });
            }
        };
    });

