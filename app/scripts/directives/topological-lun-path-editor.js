'use strict';

/**
 * @ngdoc directive
 * @name bel-services.directive:topologicalLunPathEditor
 * @description
 * # topologicalLunPathEditor
 */

angular.module('bel-services')
    .directive('topologicalLunPathEditor', function ($timeout, d3service) {

        var builder;
        builder = {

            _buildTopologicalEditor: function (d3, svg, data) {

                function findAttribute(name) {
                    for (var i = 0; i < data.servers.length; i++) {
                        if (data.servers[i].name == name) {
                            return data.servers[i];
                        }
                    }
                }

                var lines = svg.attr('class', 'line')
                    .selectAll('line').data(data.servers.hba)
                    .enter()
                    .append('line')
                    .attr('x1', function (d, i) {
                        return d.x;
                    })
                    .attr('y1', function (d) {
                        return d.y;
                    })
                    .attr('x2', function (d) {
                        return (findAttribute(d.connected).x);
                    })
                    .attr('y2', function (d) {
                        return (findAttribute(d.connected).y);
                    })
                    .attr('selected', 'existing')
                    .on('mouseover', function () {
                        if ((d3.select(this).attr('selected')) !== 'click') {
                            d3.select(this).attr('selected', 'hover');
                        }
                    })
                    .on('mouseout', function () {
                        if ((d3.select(this).attr('selected')) !== 'click') {
                            d3.select(this).attr('selected', 'existing');
                        }
                    })
                    .on('click', function () {
                        if ((d3.select(this).attr('selected')) !== 'click') {
                            d3.select(this).attr('selected', 'click');
                        } else {
                            d3.select(this).attr('selected', 'existing');
                        }
                    });

                function movePath() {
                    var coordinates = d3.this('line');
                    line.attr('x2', coordinates[0])
                        .attr('y2', coordinates[1]);
                }

                function createPath() {
                    var coordinates = d3.mouse(this);

                    var x = coordinates[0];
                    var y = coordinates[1];

                    line = svg.append('line')
                        .attr('x1', x)
                        .attr('y1', y)
                        .attr('x2', x)
                        .attr('y2', y)
                        .attr('selected', 'click');
                    svg.on('mousemove', movePath);
                }

                //TODO: replace rect with the final symbol names
                var servers = svg.selectAll('rect')
                    .data(data.servers)
                    .enter()
                    .append('rect')
                    .on('click', createPath);
            }
        };

        return {
            scope: {
                data: '=ngModel'
            },
            templateUrl: 'views/templates/topological-lun-path-editor.html',
            restrict: 'E',
            link: function postLink(scope, element) {
                d3service.d3().then(function (d3) {
                    var ele = element[0];
                    var svg = d3.select(ele)
                        .append('svg');

                    scope.$watch(function () {
                        return scope.data;
                    }, function () {
                        scope.render(scope.data);
                    }, true);
                    scope.render = function (data) {
                        // remove all previous items before render
                        svg.selectAll('*').remove();

                        // If we don't pass any data, return out of the element
                        if (!data) {
                            return;
                        }

                        builder._buildTopologicalEditor(d3, svg, data);
                    };
                });
            }
        };

    });