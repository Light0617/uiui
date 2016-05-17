/* global _: false */
/* global angular: false */
'use strict';

/**
 * @ngdoc directive
 * @name rainierApp.directive:arrayPolarDataVisualization
 * @description
 * # arrayPolarDataVisualization
 */
angular.module('rainierApp')
    .directive('arrayPolarDataVisualization', function (d3service, synchronousTranslateService) {
        var radius = 70;
        var circleWidth = 20;
        var space = 3;
        var legendWidth = 170;
        var buttonHeight = 25;
        var buttonWidth = 55;

        var tierColors = ['#868686', '#fcb663', '#DADBDF', '#D99027', '#4A567F'];
        var transitionDuration = 1000;
        var overflowDuration = 200;

        var appendToolTip = function (container, obj){
                var toolTip = null;
            if (obj && obj.tooltip) {
                    toolTip = obj.tooltip;
                    container.append('title')
                        .text(toolTip);
                }

            };

        var getDisplayForLegend = function (item) {
            var displayText;
            if(item.legendDisplay) {
                displayText = item.legendDisplay.size + ' ' + item.legendDisplay.unit + ' ' + item.label;
            }
            else if (_.isUndefined(item.percentage) || _.isNull(item.percentage)) {
                displayText = item.capacity.size + ' ' + item.capacity.unit + ' ' + item.label;

            }
            else {
                if (_.isNumber(item.percentage)) {
                    displayText = item.percentage + '%';
                } else if (item.percentage.unlimited ) {
                    displayText = synchronousTranslateService.translate('common-label-unlimited');
                }
                else {
                    if(!isNaN(item.percentage.value)) {
                        displayText = item.percentage.value + '%';
                    } else {
                        displayText = '0%';
                    }
                }

                displayText += ' '  + item.label;


            }
            return displayText;
        };
        var builder = {

            _buildUsedDataGraphLayout: function (d3, options) {
                var data = options.data;
                var container = options.container;
                var height = options.height;
                var width = options.width;
                var cssClass = options.cssClass;
                var labelFunc = options.labelFunc;

                var dataSet = _.map(data, function (item) {
                    return {
                        data: [
                            { group: 'value', value: item.value, item: item.item}
                        ],
                        name: item.item.label
                    };
                });

                dataSet = dataSet.map(function (d) {
                    return d.data.map(function (o) {
                        return {
                            y: o.value,
                            x: o.group,
                            item: o.item
                        };
                    });
                });

                d3.layout.stack()(dataSet);

                dataSet = dataSet.map(function (group) {
                    return group.map(function (d) {
                        return {
                            x: d.y,
                            y: d.x,
                            x0: d.y0,
                            item: d.item
                        };
                    });
                });

                var xMax = d3.max(dataSet, function (group) {
                    return d3.max(group, function (d) {
                        return d.x + d.x0;
                    });
                });

                var xScale = d3.scale.linear()
                    .domain([0, xMax])
                    .range([0, width]);

                var dataGroups = _.map(dataSet[0], function (d) {
                    return d.y;
                });

                var yScale = d3.scale.ordinal()
                    .domain(dataGroups)
                    .rangeRoundBands([0, height], 0.1);

                var groups = container.selectAll('g')
                    .data(dataSet)
                    .enter()
                    .append('g')
                    .attr('class', cssClass);

                groups.selectAll('rect')
                    .data(function (d) {
                        return d;
                    })
                    .enter()
                    .append('rect')
                    .attr('x', function (d) {
                        return xScale(d.x0);
                    })
                    .attr('y', function (d) {
                        return yScale(d.y);
                    })
                    .attr('height', function () {
                        return yScale.rangeBand();
                    })
                    .attr('width', function (d) {
                        return xScale(d.x);
                    })
                    .append('title')
                    .text(function(d) {
                        return (d && d.item) ? d.item.tooltip : '';
                    }
                );

                if (_.isNull(labelFunc) || _.isUndefined(labelFunc)) {
                    return;
                }
                var textLabel = groups.selectAll('text')
                    .data(function (d) {
                        return d;
                    })
                    .enter()
                    .append('text')
                    .attr('x', function (d) {
                        var w = xScale(d.x);
                        return xScale(d.x0) + w / 2;
                    })
                    .attr('y', function (d) {
                        var h = yScale.rangeBand();
                        return yScale(d.y) + h / 2;
                    })
                    .attr('height', function () {
                        return yScale.rangeBand();
                    })
                    .attr('width', function (d) {
                        return xScale(d.x);
                    });
                if (!labelFunc) {
                    return;
                }

                textLabel.selectAll('tspan')
                    .data(function (d) {
                        var w = xScale(d.x);
                        var x = xScale(d.x0) + w / 2;
                        return labelFunc(d.item, x);
                    })
                    .enter()
                    .append('tspan')
                    .attr('x', function (l) {
                        return l.x;
                    })
                    .attr('dy', function (l) {
                                            return l.y;
                                        })
                    .text(function(l){
                        return l.text;
                    });
                    /*.html(function (d) {
                        var w = xScale(d.x);
                        var x = xScale(d.x0) + w / 2;
                        return labelFunc(d.item, x);
                    });*/

            },
            _buildDonutLayout: function (d3, options) {
                var container = options.container;
                var circleRadius = options.radius;
                var overflowEnd = options.overflowWidth;
                var angle360 = 2 * Math.PI;
                var showOverflow = false;
                var arc = d3.svg.arc()
                    .innerRadius(circleRadius)
                    .outerRadius(circleRadius)
                    .startAngle(0);

                var circlesContainer = container.append('g');
                var currentValue = 0;
                var totalValue = 0;
                var containsCapacity = false;
                var sortedCircles;

                if(_.first(options.circles).capacity) {
                    containsCapacity = true;
                    sortedCircles = _.sortBy(options.circles, function (circle) {
                        return circle.capacity.value;
                    });
                    totalValue = _.last(sortedCircles).capacity.value;
                    if(totalValue === 0) {
                        _.last(sortedCircles).capacity.value = 1;
                        totalValue = 1;
                    }
                }
                else {
                    sortedCircles = options.circles;
                    totalValue = _.last(sortedCircles).percentage;
                    if(totalValue === 0) {
                        _.last(sortedCircles).percentage = 1;
                        totalValue = 1;
                    }
                }
                _.each(sortedCircles.reverse(), function(item) {
                    currentValue = containsCapacity ? item.capacity.value : item.percentage;
                    var endAngle = currentValue / totalValue * angle360;

                    if (endAngle > angle360) {
                        endAngle = angle360;
                        showOverflow = true;
                    }
                    var line = circlesContainer.append('path')
                        .datum({endAngle: 0})
                        .attr('d', arc)
                        .attr('stroke-width', circleWidth)
                        .attr('stroke', item.color)
                        .attr('stroke-linejoin', 'round');

                    line.transition()
                        .ease('cubic-in-out')
                        .duration(transitionDuration)
                        .call(function (transition, newAngle) {
                            transition.attrTween('d', function (d) {

                                var interpolate = d3.interpolate(d.endAngle, newAngle);
                                return function (t) {
                                    d.endAngle = interpolate(t);
                                    return arc(d);
                                };
                            });
                        }, endAngle);
                    if(showOverflow) {
                        var ofg = circlesContainer.append('g');

                        var overflowY = -1 * (circleRadius + space / 2 + circleWidth / 2) + 2;

                        var ofXCoordinateShift = 10; // +10 to shift the starting point a bit to the right
                        var of = ofg.append('rect')
                            .attr('class', 'circle-fg-overflow')
                            .attr('rx', (circleWidth + space) / 2)
                            .attr('ry', (circleWidth + space) / 2)
                            .attr('x', -circleWidth + ofXCoordinateShift)
                            .attr('y', overflowY - 2)
                            .attr('fill', item.color)
                            .attr('height', circleWidth + 3.5)
                            .attr('width', 0)
                            .attr('stroke', 'black')
                            .attr('stroke-width', 3);

                        var ofHide = ofg.append('rect')
                            .attr('class', 'circle-fg-overflow')
                            .attr('rx', (circleWidth + space + 8) / 2)
                            .attr('ry', (circleWidth + space + 8) / 2)
                            .attr('x', -circleWidth - 1.5)
                            .attr('y', overflowY - 0.40)
                            .attr('fill', item.color)
                            .attr('height', circleWidth + 0.25)
                            .attr('width', 0);

                        var coverStartAngle = endAngle;

                        var coverArc = d3.svg.arc()
                            .innerRadius(circleRadius)
                            .outerRadius(circleRadius)
                            .startAngle(coverStartAngle);
                        var cover = circlesContainer.append('path')
                            .datum({endAngle: coverStartAngle})
                            .attr('class', 'circle-fg')
                            .attr('d', coverArc)
                            .attr('stroke-width', circleWidth)
                            .attr('stroke-linejoin', 'round');


                        transitionDuration -= overflowDuration;

                        var foregroundDuration = Math.round(coverStartAngle / angle360 * transitionDuration);

                        cover.transition()
                            .ease('cubic-in-out')
                            .duration(transitionDuration - foregroundDuration)
                            .delay(foregroundDuration)
                            .call(function (transition, newAngle) {
                                transition.attrTween('d', function (d) {

                                    var interpolate = d3.interpolate(d.endAngle, newAngle);
                                    return function (t) {
                                        d.endAngle = interpolate(t);
                                        return coverArc(d);
                                    };
                                });
                            }, angle360);
                        of.transition()
                            .attr('width', overflowEnd + circleWidth - ofXCoordinateShift)
                            .duration(overflowDuration)
                            .delay(transitionDuration);

                        ofHide.transition()
                            .attr('width', overflowEnd)
                            .duration(overflowDuration)
                            .delay(transitionDuration);
                    }
                    appendToolTip(line, item);
                });
            },
            _buildLegendLayout: function (options) {
                var legendBoxWidth = options.legendBoxWidth;
                var legendBoxHeight = options.legendBoxHeight;
                var legendYOffset = options.legendYOffset - 10;
                var circles = options.circles;
                var legend = options.container.append('g')
                    .attr('class', 'polar-Viz-legend-container')
                    // The middle circle covers part of the text in the left rectangle.-10 is to move the rectangle
                    // to the left a bit so that the text is not covered by the circle.
                    .attr('transform', 'translate(0,' + legendYOffset + ')');

                var legendIndicatorSize = 12;
                var ly = 7;
                var textToLegendIndicatorOffset = 7;

                _.forEach(circles.reverse(), function (cdata, i) {
                    var legendSize = cdata.circles.length;
                    _.each(cdata.circles, function (circle) {
                       if(!circle.label) {
                           legendSize--;
                       }
                    });
                    var noLabelHeight = (3 - legendSize) * 23;
                    var lg = legend.append('g')
                        .attr('class', 'legend-box legend-box-' + i);

                    lg.append('rect')
                        .attr('width', legendBoxWidth)
                        .attr('height', legendBoxHeight - noLabelHeight)
                        .attr('x', options.legendBoxX)
                        .attr('y', ly)
                        .attr('rx', circleWidth / 2)
                        .attr('ry', circleWidth / 2)
                        .attr('class', 'bg');


                    var delta1 = legendBoxHeight / 2 - space - legendIndicatorSize;
                    var legendIndicationY = ly + delta1 - legendIndicatorSize;

                    _.each(cdata.circles, function (circle) {
                        if(circle.label) {

                            lg.append('rect')
                                .attr('width', legendIndicatorSize)
                                .attr('height', legendIndicatorSize)
                                .attr('x', legendIndicatorSize)
                                .attr('y', legendIndicationY)
                                .attr('rx', space / 2)
                                .attr('ry', space / 2)
                                .attr('stroke', 'black')
                                .attr('fill', circle.color);

                            var displayText = '';

                            if (_.isUndefined(circle.percentage) || _.isNull(circle.percentage)) {
                                displayText = circle.capacity.size + ' ' + circle.capacity.unit + ' ' + circle.label;

                            }
                            else {
                                if (_.isNumber(circle.percentage)) {
                                    displayText = circle.percentage + '%';
                                    displayText += ' ' + circle.label;
                                }
                                else if (circle.percentage.unlimited) {
                                    displayText = synchronousTranslateService.translate('common-label-unlimited');
                                    displayText += ' ' + circle.label;
                                }
                                else if (circle.capacity) {
                                    displayText = getDisplayForLegend(circle);
                                }
                                else {
                                    if (!isNaN(circle.percentage.value)) {
                                        displayText = circle.percentage.value + '%';
                                    } else {
                                        displayText = '0%';
                                    }
                                    displayText += ' ' + circle.label;
                                }
                            }
                            var text = lg.append('text')
                                .attr('class', 'legend-value')
                                .attr('x', legendIndicatorSize * 2 + space)
                                .attr('y', legendIndicationY + textToLegendIndicatorOffset)

                                .text(displayText);
                            appendToolTip(text, circle);
                            legendIndicationY += legendIndicatorSize + space * 3;
                        }
                    });
                    ly += legendBoxHeight + space;
                });


            },
            _buildUnifiedLegendLayout: function (options, data, scope) {
                var legendBoxX = options.legendBoxX + 100;
                var legendBoxWidth = options.legendBoxWidth;
                var legendBoxHeight = options.legendBoxHeight;
                var displayText;
                var unifiedText;
                var textOffset = 9;
                var scaledOffset = 17;
                var maskOffset = 45;
                var legend = options.container.append('g')
                    .attr('class', 'polar-viz-legend-container');
                var unifiedIcon = legend.append('g')
                    .attr('transform', 'scale(2.8) translate('+options.legendBoxX + 10+', '+scaledOffset+')');
                unifiedIcon.append('text')
                    .attr('fill', data.view === 'unified' ? '#A1E06E' : '#444444')
                    .attr('font-size', '3pt')
                    .attr('y', 16)
                    .attr('x', options.legendBoxX + 2)
                    .text('Unified');
                unifiedIcon.append('path')
                    .attr('fill', data.view === 'unified' ? '#A1E06E' : '#444444')
                    .attr('d', 'M11.977,3.816c0.63,0,1.141-0.511,1.141-1.142V1.777c0-0.631-0.511-1.141-1.141-1.141h-8.77c-0.63,0-1.141,0.51-1.141,1.141v0.897c0,0.631,0.511,1.142,1.141,1.142h3.528v0.708H3.207c-0.63,0-1.141,0.511-1.141,1.141v0.898c0,0.63,0.511,1.141,1.141,1.141h3.528v0.707H3.207c-0.63,0-1.141,0.511-1.141,1.142v0.897c0,0.631,0.511,1.142,1.141,1.142h8.77c0.63,0,1.141-0.511,1.141-1.142V9.553c0-0.631-0.511-1.142-1.141-1.142H8.447V7.704h3.529c0.63,0,1.141-0.511,1.141-1.141V5.664c0-0.63-0.511-1.141-1.141-1.141H8.447V3.815L11.977,3.816L11.977,3.816z M8.263,10.452H3.601V9.551h4.662V10.452z M11.25,9.551c0.251,0,0.45,0.202,0.45,0.451s-0.199,0.45-0.45,0.45c-0.248,0-0.45-0.201-0.45-0.45S11.002,9.551,11.25,9.551z M9.602,9.551c0.248,0,0.45,0.202,0.45,0.451s-0.202,0.45-0.45,0.45s-0.45-0.201-0.45-0.45S9.354,9.551,9.602,9.551z M3.602,5.663h4.663v0.901H3.602V5.663z M11.25,5.663c0.251,0,0.45,0.201,0.45,0.45c0,0.25-0.199,0.451-0.45,0.451c-0.248,0-0.45-0.202-0.45-0.451C10.8,5.865,11.002,5.663,11.25,5.663z M9.602,5.663c0.248,0,0.45,0.202,0.45,0.45c0,0.249-0.202,0.451-0.45,0.451s-0.45-0.202-0.45-0.451C9.151,5.865,9.354,5.663,9.602,5.663z M11.25,1.774c0.251,0,0.45,0.202,0.45,0.451c0,0.249-0.199,0.45-0.45,0.45c-0.248,0-0.45-0.202-0.45-0.45C10.8,1.977,11.002,1.774,11.25,1.774z M9.602,1.774c0.248,0,0.45,0.202,0.45,0.451c0,0.249-0.202,0.45-0.45,0.45s-0.45-0.202-0.45-0.45C9.151,1.977,9.354,1.774,9.602,1.774zM3.602,1.774h4.663v0.901H3.602V1.774z');

                legend.append('g')
                    .append('rect')
                    .attr('y', maskOffset)
                    .attr('x', 30)
                    .attr('width', 47)
                    .attr('height', 48)
                    .attr('fill', 'white')
                    .attr('fill-opacity', 0)
                    .attr('opacity', 0)
                    .on('click', function() {
                        if(data.view !== 'unified') {
                            data.switchToUnified();
                            scope.render(data);
                        }
                    })
                    .on('mouseover', function() {
                        if(data.view === 'unified') {
                            $('.legend-box').show();
                        }
                    })
                    .on('mouseout', function() {
                        $('.legend-box').hide();
                    })
                    .attr('cursor', 'pointer');
                var blockIcon = legend.append('g')
                    .attr('transform', 'scale(2.8) translate('+options.legendBoxX + 10+', '+scaledOffset * 2+')');

                blockIcon.append('text')
                    .attr('fill', data.view === 'block' ? '#A1E06E' : '#444444')
                    .attr('font-size', '3pt')
                    .attr('y', 16)
                    .attr('x', options.legendBoxX + 3)
                    .text('Block');
                blockIcon.append('path')
                    .attr('fill', data.view === 'block' ? '#A1E06E' : '#444444')
                    .attr('d', 'M8.104,4.259c0,0.289-0.248,0.52-0.553,0.52c-0.309,0-0.556-0.231-0.556-0.52s0.248-0.522,0.556-0.522C7.855,3.737,8.104,3.97,8.104,4.259z M12.844,2.104V3.65h0.849v1.689h-0.849v1.548h0.849v1.687h-0.849v1.547h0.849v1.688H2.307V0.417h11.386v1.688L12.844,2.104L12.844,2.104z M10.41,8.975c-0.051-0.025-0.116-0.006-0.147,0.041c-0.481,0.777-1.547,1.281-2.712,1.281c-1.166,0-2.231-0.504-2.715-1.281C4.807,8.969,4.742,8.949,4.69,8.975c-0.052,0.027-0.075,0.086-0.05,0.135c0.52,1.068,1.661,1.762,2.91,1.762c1.245,0,2.389-0.693,2.908-1.762C10.484,9.061,10.462,9.002,10.41,8.975z M10.41,7.738c-0.051-0.025-0.116-0.005-0.147,0.041C9.781,8.557,8.716,9.061,7.551,9.061c-1.166,0-2.231-0.502-2.715-1.281C4.807,7.733,4.742,7.712,4.69,7.738c-0.052,0.026-0.075,0.086-0.05,0.137c0.52,1.068,1.661,1.759,2.91,1.759c1.245,0,2.389-0.691,2.908-1.759C10.484,7.825,10.462,7.765,10.41,7.738z M10.41,6.502c-0.051-0.025-0.116-0.007-0.147,0.04C9.781,7.32,8.716,7.823,7.551,7.823c-1.166,0-2.231-0.503-2.715-1.281C4.807,6.496,4.742,6.477,4.69,6.502c-0.052,0.026-0.075,0.084-0.05,0.136c0.52,1.068,1.661,1.761,2.91,1.761c1.245,0,2.389-0.691,2.908-1.761C10.484,6.587,10.462,6.529,10.41,6.502z M10.639,4.259c0-1.604-1.384-2.905-3.088-2.905c-1.707,0-3.09,1.3-3.09,2.905c0,1.604,1.383,2.903,3.09,2.903C9.256,7.162,10.639,5.862,10.639,4.259z');


                legend.append('g')
                    .append('rect')
                    .attr('y', maskOffset * 2 + space)
                    .attr('x', 30)
                    .attr('width', 47)
                    .attr('height', 48)
                    .attr('fill', 'white')
                    .attr('fill-opacity', 0)
                    .on('click', function() {
                        if(data.view !== 'block') {
                            data.switchToBlock();
                            scope.render(data);
                        }
                    })
                    .on('mouseover', function() {
                        if(data.view === 'block') {
                            $('.legend-box').show();
                        }
                    })
                    .on('mouseout', function() {
                        $('.legend-box').hide();
                    })
                    .attr('cursor', 'pointer');
                var fileIcon = legend.append('g')
                    .attr('transform', 'scale(2.8) translate('+options.legendBoxX + 10+', '+scaledOffset * 3+')');
                fileIcon.append('path')
                    .attr('fill', data.view === 'file' ? '#3D84F5' : '#444444')
                    .attr('d', 'M13.249,8.768c-0.401,0-0.806,0-1.207,0V7.73c0-1.232-0.998-2.231-2.23-2.231H8.563V3.624c0.414,0,0.828,0,1.242,0c0.279,0,0.371-0.092,0.371-0.372c0-0.11,0-0.205,0-0.296c0-0.003,0-0.005,0-0.008V2.032c0-0.074,0-0.148,0-0.229V1.006c0-0.281-0.092-0.372-0.371-0.372c-0.622,0-1.244,0-1.867,0L7.431,0.136c-0.461,0-0.925-0.001-1.386,0c-0.278,0-0.37,0.093-0.37,0.37c0,0.109,0,0.206-0.001,0.297c0,0.002,0,0.005,0,0.008v0.916c0,0.074,0,0.148,0,0.228v1.297c0.001,0.281,0.092,0.372,0.373,0.372c0.414,0,0.828,0,1.243,0V5.5H6.041c-1.231,0-2.23,0.999-2.23,2.231V8.27c-0.402,0-0.804-0.002-1.206,0c-0.278,0-0.371,0.092-0.371,0.371c0,0.108,0,0.205,0,0.295c0,0.003,0,0.006,0,0.009V9.86c0,0.075,0,0.148,0,0.228v1.298c0,0.28,0.091,0.371,0.372,0.371c1.253,0.001,2.507,0.001,3.76,0c0.278,0,0.371-0.092,0.371-0.371c0-0.108,0-0.206,0-0.296c0-0.004,0-0.006,0-0.008v-0.916c0-0.074,0-0.148,0-0.229V9.139c0-0.28-0.091-0.37-0.372-0.37c-0.427,0-0.853,0-1.279,0V7.731c0-0.529,0.428-0.957,0.955-0.957h3.771c0.527,0,0.956,0.428,0.956,0.957V8.27c-0.428,0-0.854,0-1.279,0c-0.278,0-0.371,0.093-0.371,0.371c0,0.109,0,0.206,0,0.297c0,0.003,0,0.004,0,0.008v0.916c0,0.074,0,0.148,0,0.229v1.296c0,0.281,0.092,0.372,0.371,0.372c1.253,0.001,2.507,0.001,3.761,0c0.277,0,0.37-0.092,0.37-0.372c0-0.108,0-0.205,0-0.296c0-0.003,0-0.006,0-0.008v-0.915c0-0.075,0-0.148,0-0.229V9.14C13.618,8.859,13.526,8.769,13.249,8.768L13.249,8.768z');
                fileIcon.append('text')
                    .attr('fill', data.view === 'file' ? '#3D84F5' : '#444444')
                    .attr('font-size', '3pt')
                    .attr('y', 16)
                    .attr('x', options.legendBoxX + space + 1)
                    .text('File');


                legend.append('g')
                    .append('rect')
                    .attr('y', maskOffset * 3 + space * 2)
                    .attr('x', 30)
                    .attr('width', 47)
                    .attr('height', 48)
                    .attr('fill', 'white')
                    .attr('fill-opacity', 0)
                    .on('click', function() {
                        if(data.view !== 'file') {
                            data.switchToFile();
                            scope.render(data);
                        }
                    })
                    .on('mouseover', function() {
                        if(data.view === 'file') {
                            $('.legend-box').show();
                        }
                    })
                    .on('mouseout', function() {
                        $('.legend-box').hide();
                    })
                    .attr('cursor', 'pointer');

                var legendIndicatorSize = 12;
                var ly = 65;
                var lg = legend.append('g')
                    .attr('class', 'legend-box legend-box-0')
                    .attr('display', 'none');
                lg.append('rect')
                    .attr('width', legendBoxWidth)
                    .attr('height', legendBoxHeight)
                    .attr('stroke', 'white')
                    .attr('stroke-width', '1')
                    .attr('x', legendBoxX)
                    .attr('y', ly + space)
                    .attr('rx', circleWidth / 2)
                    .attr('ry', circleWidth / 2)
                    .attr('class', 'bg');
                _.each(options.circles.reverse(), function (circleObject) {
                    var sortedCircles = _.sortBy(circleObject.circles, function (circle) {
                        return circle.capacity.value;
                    });
                    _.each(sortedCircles, function (circle) {
                        lg.append('rect')
                            .attr('width', legendIndicatorSize)
                            .attr('height', legendIndicatorSize)
                            .attr('x', legendBoxX + legendIndicatorSize)
                            .attr('y', ly + space * 3)
                            .attr('rx', space / 2)
                            .attr('ry', space / 2)
                            .attr('stroke', 'white')
                            .attr('fill', circle.color);

                        displayText = getDisplayForLegend(circle);
                        unifiedText = lg.append('text')
                            .attr('class', 'legend-value')
                            .attr('fill', 'white')
                            .attr('x', legendIndicatorSize * 2 + space + legendBoxX)
                            .attr('y', ly + space * 3 + textOffset)
                            .text(displayText);

                        appendToolTip(unifiedText, circle);
                        ly += space + legendIndicatorSize;
                    });
                });


            },

            _buildBreakdownDataLayout: function (d3, data, options, scope) {
                var legendBoxWidth = options.legendBoxWidth;
                var legendYOffset = options.legendYOffset;
                var svgWidth = options.svgWidth;
                var legendItemsHeight = options.legendItemsHeight;
                var finalRadius = options.finalRadius;
                var onlyShowBreakDown = options.onlyShowBreakDown;
                var switchMargin = 260;
                var switchTopMargin = 17;


                var breakdownView = options.container.append('g')
                    .attr('class', 'polar-Viz-breakdown');

                if (onlyShowBreakDown === true) {
                    breakdownView.attr('transform', 'translate(' + (legendBoxWidth - (svgWidth/2.5 + space)) + ',' + legendYOffset/3.5 + ')');
                } else {
                    breakdownView.attr('transform', 'translate(' + (legendBoxWidth - space) + ',' + legendYOffset + ')');
                    if(data.unified) {
                        options.container.append('g')
                            .attr('class', 'polar-Viz-breakdown')
                            .attr('transform', 'translate(0,' + legendYOffset + ')')
                            .append('rect')
                            .attr('class', 'breakdown-bg')
                            .attr('width', (legendBoxWidth + space))
                            .attr('height', legendItemsHeight)
                            .attr('rx', circleWidth / 2)
                            .attr('ry', circleWidth / 2);
                    }
                }

                if (!onlyShowBreakDown) {
                    breakdownView.append('rect')
                        .attr('class', 'breakdown-bg')
                        .attr('width', (svgWidth - legendBoxWidth + space))
                        .attr('height', legendItemsHeight)
                        .attr('rx', circleWidth / 2)
                        .attr('ry', circleWidth / 2);
                }

                var bwItemHeight = (legendItemsHeight - space * 5) / 4;
                var bwItemWidth;
                if (onlyShowBreakDown === true) {
                    bwItemWidth = options.breakdownViewWidth;
                } else {
                    bwItemWidth = options.breakdownViewWidth - 2 * circleWidth - 4 * space;
                }
                var bwItemLeft = space * 2 + finalRadius;
                var cbwy = space * 2 + bwItemHeight / 2;

                breakdownView.append('text')
                    .attr('y', cbwy)
                    .attr('height', bwItemHeight)
                    .attr('x', bwItemLeft + space)
                    .attr('class', 'header')
                    .text(options.title);
                if(data.view !== 'file' && !data.hideButtons) {
                    breakdownView.append('rect')
                        .on('click', function () {
                            if (!data.tiers) {
                                data.showTiersBreakDown();
                                scope.render(data);
                            }
                        })
                        .attr('y', cbwy - switchTopMargin)
                        .attr('cursor', 'pointer')
                        .attr('height', buttonHeight)
                        .attr('width', buttonWidth)
                        .attr('fill', data.tiers ? '#a1e06e' : '#E3E4E7')
                        .attr('stroke', 'white')
                        .attr('x', bwItemLeft + switchMargin);

                    breakdownView.append('text')
                        .on('click', function () {
                            if (!data.tiers) {
                                data.showTiersBreakDown();
                                scope.render(data);
                            }
                        })
                        .attr('y', cbwy)
                        .attr('cursor', 'pointer')
                        .attr('height', bwItemHeight)
                        .attr('x', bwItemLeft + switchMargin + space * 5 + 2)
                        .attr('font-size', 10)
                        .attr('class', 'header')
                        .text('Tiers');

                    breakdownView.append('rect')
                        .on('click', function () {
                            if (data.tiers) {
                                data.showProtectionBreakDown();
                                scope.render(data);
                            }
                        })
                        .attr('y', cbwy - switchTopMargin)
                        .attr('cursor', 'pointer')
                        .attr('height', buttonHeight)
                        .attr('width', buttonWidth)
                        .attr('fill', data.tiers ? '#E3E4E7' : '#a1e06e')
                        .attr('stroke', 'white')
                        .attr('x', bwItemLeft + switchMargin + buttonWidth);

                    breakdownView.append('text')
                        .on('click', function () {
                            if (data.tiers) {
                                data.showProtectionBreakDown();
                                scope.render(data);
                            }
                        })
                        .attr('y', cbwy)
                        .attr('cursor', 'pointer')
                        .attr('height', bwItemHeight)
                        .attr('x', bwItemLeft + switchMargin + buttonWidth + space)
                        .attr('font-size', 10)
                        .attr('class', 'header')
                        .text('Protection');
                }

                cbwy += space * 4;

                if(data.view !== 'file' && !data.tiers) {
                    if (onlyShowBreakDown === true) {
                        breakdownView
                            .append('rect')
                            .attr('y', cbwy)
                            .attr('class', 'separator-top')
                            .attr('height', 2)
                            .attr('width', (bwItemWidth))
                            .attr('x', bwItemLeft + space);

                    } else {
                        breakdownView
                            .append('rect')
                            .attr('y', cbwy)
                            .attr('class', 'separator-top')
                            .attr('height', 2)
                            .attr('width', (svgWidth - legendBoxWidth - space));
                    }

                    cbwy += space * 4;

                    var dataTips = breakdownView.append('g')
                        .attr('y', cbwy)
                        .attr('height', bwItemHeight)
                        .attr('transform', 'translate(' + bwItemLeft + ',' + cbwy + ')')
                        .attr('class', 'data-tips');


                    var graphOptions = {
                        data: _.map(options.data, function (item) {
                            return {
                                value: 1,
                                item: item
                            };
                        }),
                        container: dataTips,
                        height: bwItemHeight,
                        width: bwItemWidth,
                        cssClass: 'data-tip',
                        labelFunc: function (item, x) {

                            if (item) {
                                return [
                                    {x: x, y: -2, text: item.capacity.size + ' ' + item.capacity.unit},
                                    {x: x, y: 11, text: item.label}
                                ];

                            }
                            return [];
                        }
                    };
                    builder._buildUsedDataGraphLayout(d3, graphOptions);

                    cbwy += space + bwItemHeight;

                    var charts = breakdownView.append('g')
                        .attr('y', cbwy)
                        .attr('height', bwItemHeight)
                        .attr('transform', 'translate(' + bwItemLeft + ',' + cbwy + ')')
                        .attr('class', 'used-data-pills');


                    graphOptions = {
                        data: _.map(options.data, function (item) {
                            return {
                                value: item.capacity.value,
                                item: item
                            };
                        }),
                        container: charts,
                        height: bwItemHeight,
                        width: bwItemWidth,
                        cssClass: 'data-pill',
                        labelFunc: null
                    };

                    builder._buildUsedDataGraphLayout(d3, graphOptions);

                    cbwy += space * 4 + bwItemHeight;

                    if (onlyShowBreakDown === true) {
                        breakdownView
                            .append('rect')
                            .attr('y', cbwy)
                            .attr('class', 'separator-bottom')
                            .attr('height', 1)
                            .attr('width', (bwItemWidth))
                            .attr('x', bwItemLeft + space);

                    } else {
                        breakdownView
                            .append('rect')
                            .attr('y', cbwy)
                            .attr('class', 'separator-bottom')
                            .attr('height', 1)
                            .attr('width', (svgWidth - legendBoxWidth - space));
                    }

                    cbwy += space * 2;

                    var xScale = d3.scale.linear()
                        .domain([0, 100])
                        .range([0, bwItemWidth]);
                    var xAxis = d3.svg.axis()
                        .scale(xScale)
                        .ticks(5)
                        .tickSize(0)
                        .orient('bottom');

                    breakdownView.append('g')
                        .attr('y', cbwy)
                        .attr('height', bwItemHeight)
                        .attr('transform', 'translate(' + bwItemLeft + ',' + cbwy + ')')
                        .attr('class', 'used-data-axis')
                        .call(xAxis)
                        .append('text')
                        .attr('class', 'axis-range-label')
                        .attr('y', 11)
                        .attr('x', bwItemWidth + space * 4)
                        .text('%');
                }
                else{
                    var width = 290;
                    var textY = 55;
                    var rectY = 40;
                    var circleY = 50;
                    var offset = 26;
                    var index = 0;
                    _.each(data.tierBreakdown, function(tier) {
                        breakdownView.append('circle')
                            .attr('r', 5)
                            .attr('cx', bwItemLeft + 5)
                            .attr('cy', circleY)
                            .attr('fill', 'white')
                            .attr('stroke', tierColors[index])
                            .attr('stroke-width', 4);

                        breakdownView.append('text')
                            .attr('y', textY)
                            .attr('height', bwItemHeight)
                            .attr('x', bwItemLeft + 18)
                            .attr('font-size', 12)
                            .text(tier.name);

                        breakdownView.append('rect')
                            .attr('y', rectY)
                            .attr('rx', 8)
                            .attr('rx', 8)
                            .attr('height', 18)
                            .attr('width', width)
                            .attr('x', bwItemLeft + 80)
                            .attr('fill', 'white')
                            .attr('stroke', tierColors[index])
                            .append('title')
                            .text(tier.toolTip);

                        var fillWidth = parseInt(width * tier.percent / 100);
                        if(fillWidth !== 0 && fillWidth < 9) {
                            fillWidth = 9;
                        }
                        breakdownView.append('rect')
                            .attr('y', rectY)
                            .attr('rx', 8)
                            .attr('rx', 8)
                            .attr('title', tier.toolTip)
                            .attr('height', 18)
                            .attr('width',  fillWidth)
                            .attr('x', bwItemLeft + 80)
                            .attr('fill', tierColors[index])
                            .append('title')
                            .text(tier.toolTip);
                        textY += offset;
                        rectY += offset;
                        circleY += offset;
                        index++;
                    });
                }
            },

            buildLayout: function (d3, svg, data, hideBreakDown, hideLegendBox, onlyShowBreakDown, scope) {
                if(data.view) {
                    legendWidth = 100;
                }
                if (!data.unified) {
                    legendWidth = 170;
                }
                var breakdownViewWidth = 400;

                var legendBoxX = 0;
                if (hideBreakDown === true) {
                    breakdownViewWidth = 60;
                }
                if (onlyShowBreakDown === true) {
                    breakdownViewWidth = 500;
                }
                var finalRadius = radius;

                var circlesObject = _.map(data.items, function (item, index) {
                    var cloned = _.cloneDeep(item);
                    var circleObject = {
                        index: item.index || index,
                        radius: finalRadius,
                        circles: cloned
                    };
                    finalRadius += circleWidth + space;
                    return circleObject;
                });

                var noOfCircles = circlesObject.length;

                var legendBoxWidth = finalRadius + legendWidth + space;

                var legendItemsHeight = (finalRadius - circleWidth - noOfCircles* 2 * space) * 2; //2 * (radius + circleWidth * 1.5);
                var legendBoxHeight = (legendItemsHeight - (noOfCircles - 1) * space) / noOfCircles + space;
                if(data.view === 'unified') {
                    legendBoxHeight += 30;
                }

                if (noOfCircles === 1) {
                    legendItemsHeight = legendBoxHeight = 85;
                }

                var legendYOffset = circleWidth * 1.5 + space * 2;

                finalRadius = finalRadius - circleWidth / 2;
                var svgWidth = legendWidth + finalRadius * 2 + breakdownViewWidth;
                var svgHeight;
                if (onlyShowBreakDown === true) {
                    svgHeight = 210;
                } else {
                    svgHeight = finalRadius * 2;
                }

                _.forEach(data.items, function (item) {
                    _.forEach(item, function (line) {
                        if (!_.isUndefined(line.breakdown) && !_.isNull(line.breakdown)) {

                            var breakdownOptions = {
                                container: svg,
                                data: line.breakdown,
                                legendBoxWidth: legendBoxWidth,
                                legendBoxHeight: legendBoxHeight,
                                legendYOffset: legendYOffset,
                                svgWidth: svgWidth,
                                legendItemsHeight: legendItemsHeight,
                                finalRadius: finalRadius,
                                title: data.tiers ? data.tiersBreakdownLabel : line.breakdownLabel,
                                breakdownViewWidth : breakdownViewWidth,
                                onlyShowBreakDown : onlyShowBreakDown
                            };
                            builder._buildBreakdownDataLayout(d3, data, breakdownOptions, scope);
                        }
                    });
                });

                var calculatedLegendWidth = legendWidth;
                if (hideLegendBox === true ) {
                    legendBoxWidth = 0;
                    calculatedLegendWidth = 0;
                    svgWidth = svgHeight + space * 4;

                }
                var legendOptions = {
                    legendBoxX: legendBoxX,
                    legendBoxWidth: legendBoxWidth,
                    legendBoxHeight: legendBoxHeight,
                    legendYOffset: legendYOffset,
                    container: svg,
                    circles: circlesObject
                };

                if (!data.unified && !hideLegendBox) {
                    builder._buildLegendLayout(legendOptions, data, scope);
                }

                if (onlyShowBreakDown === true) {
                    svg.attr('version', '1.1')
                        .attr('viewBox', '0 0 ' + svgWidth + ' ' + (svgHeight + space * 3))
                        .attr('preserveAspectRatio', 'xMinYMin meet')
                        .attr('transform', 'scale(1,1)')
                        .attr('class', (data.view !== 'file' && !data.file) ? 'pdv default' : 'pdv file');
                } else {
                    var polarViz = svg
                        .attr('version', '1.1')
                        .attr('viewBox', '0 0 ' + svgWidth + ' ' + (svgHeight + space * 3))
                        .attr('preserveAspectRatio', 'xMinYMin meet')
                        .attr('transform', 'scale(1,1)')
                        .attr('class', (data.view !== 'file' && !data.file) ? 'pdv default scale-with-parent-container' : 'pdv default file')
                        .append('g')
                        .attr('transform', 'translate(' + (calculatedLegendWidth + 6 + finalRadius) + ',' + (finalRadius + 2 * space) + ')');

                    polarViz.append('circle')
                        .attr('r', finalRadius);

                    var sg = polarViz.append('g')
                        .attr('class', 'pdv summary-group');

                    var labelContainer = sg.append('g')
                        .attr('class', 'label-container');

                    labelContainer.append('text')
                        .attr('class', 'number')
                        .attr('y', -6)
                        .text(data.total.capacity.size);

                    labelContainer.append('text')
                        .attr('class', 'unit')
                        .attr('y', 14)
                        .text(data.total.capacity.unit);

                    labelContainer.append('text')
                        .attr('class', 'label')
                        .attr('dy', 30)
                        .text(data.total.label);

                    var valuesLabel = sg.append('g')
                    .attr('class', 'label-container')
                    .attr('title', data.total.capacity.size + ' ' + data.total.capacity.unit + ' ' + data.total.label);

                    var tooltip = data.total && data.total.tooltip ? data.total.tooltip : '';
                    valuesLabel.append('circle')
                        .attr('r', 60)
                        .append('title')
                        .text(tooltip);

                    valuesLabel.append('text')
                        .attr('class', 'number')
                        .attr('dy', -6)
                        .text(data.total.capacity.size)
                        .append('title')
                        .text(tooltip);

                    valuesLabel.append('text')
                        .attr('class', 'unit')
                        .attr('dy', 14)
                        .text(data.total.capacity.unit)
                        .append('title')
                        .text(tooltip);

                    valuesLabel.append('text')
                        .attr('class', 'label')
                        .attr('dy', 33)
                        .text(data.total.label)
                        .append('title')
                        .text(tooltip);

                    _.forEach(circlesObject, function (circle) {
                        circle.container = sg;
                        circle.overflowWidth = finalRadius;
                        builder._buildDonutLayout(d3, circle);
                    });
                }

                if (hideLegendBox === true ) {
                    legendBoxWidth = 0;
                }
                else {
                    if(data.unified) {
                        builder._buildUnifiedLegendLayout(legendOptions, data, scope);
                    }
                }
            }
        };

        return {
            scope: {
                data: '=ngModel',
                noBreakDown :'=',
                noLegendBox : '=',
                onlyBreakDown : '='
            },
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
                    },true);
                    scope.render = function (data) {
                        // remove all previous items before render
                        svg.selectAll('*').remove();

                        // If we don't pass any data, return out of the element
                        if (!data) {
                            return;
                        }

                        builder.buildLayout(d3, svg, data, scope.noBreakDown, scope.noLegendBox, scope.onlyBreakDown, scope);
                    };
                });
            }
        };
    });
