'use strict';

/**
 * @ngdoc directive
 * @name rainierApp.directive:poolCapacityDataVisualization
 * @description
 * # poolCapacityDataVisualization
 */
angular.module('rainierApp')
    .directive('poolCapacityDataVisualization', function (d3service) {
        var circleWidth = 50;
        var space = 3;


        var builder = {
            buildLayout: function (d3, svg, data) {
                var color = [ '#868686', '#fcb663', '#E3E4E7', '#fbaf17' ];

                var outerRadius = 250;
                var innerRadius = outerRadius - circleWidth;

                var svgHeight = (outerRadius + space) * 2 ;
                var svgCenter = svgHeight/2;
                var container = svg
                    .attr('version', '1.1')
                    .attr('viewBox', '0 0 ' + svgHeight+ ' ' + svgHeight)
                    .attr('class', 'polar-data-viz-concentric pdv default')
                    .attr('transform', 'scale(1)')
                    .attr('preserveAspectRatio', 'xMidYMin slice')
                    .append('g')
                    .attr('transform', 'translate(' + svgCenter + ', '+ svgCenter +')');


                container.append('circle')
                    .attr('r', innerRadius - space);

                var sg = container.append('g')
                    .attr('class', 'inner-rev');

                sg.append('text')
                    .attr('class', 'number')
                    .attr('text-anchor', 'middle')
                    .attr('dy', 0)
                    .text(data.total.capacity.size);

                sg.append('text')
                    .attr('class', 'unit')
                    .attr('text-anchor', 'middle')
                    .attr('dy', 70)
                    .text(data.total.capacity.unit);

                var arc = d3.svg.arc()
                    .innerRadius(innerRadius)
                    .outerRadius(outerRadius);

                var pie = d3.layout.pie()
                    .value(function (d) {
                        return d.free.capacity.value;
                    });

                container.selectAll('.arc')
                    .data(pie(data.items))
                    .enter()
                    .append('g')
                    .attr('class', 'arc')
                    .append('path')
                    .attr('d', arc)
                    .attr('fill', function (d) {
                        var index = _.indexOf(data.keys, d.data.key);
                        var c = color[index];
                        return c;
                    })
                    .append('title')
                    .text(function (d) {
                        return d.data.key +' '+  d.data.free.capacity.size + ' ' + d.data.free.capacity.unit;
                    });
            }
        };

        return {
            scope: {
                data: '=ngModel'
            },
            restrict: 'E',
            link: function postLink(scope, element) {
                d3service.d3().then(function (d3) {
                    var svg = d3.select(element[0])
                        .append('svg');

                    scope.$watch(function () {
                        return scope.data;
                    }, function () {
                        scope.render(scope.data);
                    });

                    scope.render = function (data) {
                        // remove all previous items before render
                        svg.selectAll('*').remove();

                        // If we don't pass any data, return out of the element
                        if (!data) {
                            return;
                        }

                        builder.buildLayout(d3, svg, data);
                    };
                });
            }
        };
    });
