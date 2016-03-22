'use strict';

/**
 * @ngdoc directive
 * @name rainierApp.directive:donutChart
 * @description
 * # donutChart
 */
angular.module('rainierApp')
    .directive('donutChart', function(){
    function link(scope, element){


        var width = 760;
        var height = 280;
        var min = Math.min(width, height);
        var svg = d3.select(element[0]).append('svg');


       var drawChart  = function(){

           var data =  scope.chartData || scope.dataModel.chartData;

           var pie = d3.layout.pie().sort(null);
           var arc = d3.svg.arc()
               .outerRadius(min / 2 * 0.9)
               .innerRadius(min / 2 * 0.5);
           var color = d3.scale.ordinal()
               .range(['#7bc142', '#bcda89', '#2e464c']);

           //  var data = [10, 20, 30,65,18];


           svg.attr({width: width, height: height});

           var g = svg.append('g')
               // center the donut chart
               .attr('transform', 'translate(' + width / 2 + ',' + height / 2 + ')');

           // add the paths for each arc slice
           g.selectAll('path').data(pie(data))
               .enter().append('path')
               .attr('fill', function(d, i){return color(i);})
               .style('stroke', 'white')
               .attr('d', arc)
               .transition()
               .ease('exp')
               .duration(1000)
               .attrTween('d', function(b){
                   var i = d3.interpolate({startAngle: 1.1*Math.PI, endAngle: 1.1*Math.PI}, b);
                   return function(t) { return arc(i(t)); };
               });

           // draw legend
           var legend = svg.selectAll('.legend')
               .data(color.domain())
               .enter().append('g')
               .attr('class', 'legend')
               .attr('transform', function(d, i) { return 'translate(0,' + i * 20 + ')'; });

           // draw legend colored rectangles
           legend.append('rect')
               .attr('x', width - 590)
               .attr('y', 30)
               .attr('width', 18)
               .attr('height', 18)
               .style('fill', color);

           // draw legend text
           legend.append('text')
               .attr('x', width - 600 )
               .attr('y', 39)
               .attr('dy', '.35em')
               .style('text-anchor', 'end')
               .text(function(d) {
                   return d >= scope.dataModel.chartNames.length ? '' : scope.dataModel.chartValues[d] + '  ' + scope.dataModel.chartNames[d];
               });

       };

       scope.$watch('chartData', function() {
            drawChart();
        },true);

    }
    return {
        link: link,
        restrict: 'E'
    };
});




angular.module('rainierApp')
    .directive('donutDynamicChart', function(){
    function link(scope, element){


        var width = 800;
        var height = 290;
        var min = Math.min(width, height);
        var svg = d3.select(element[0]).append('svg');


       var drawChart  = function(){

           var sourceData = [];
           if (scope.chartData){
               sourceData = scope.chartData;
           } else if (scope.model && scope.model.chartData) {
               sourceData = scope.model.chartData;
           } else if (scope.dataModel && scope.dataModel.chartData) {
               sourceData = scope.dataModel.chartData;
           }

           var data = [];
           var names = [];

           for (var i = 0; i < sourceData.length; ++i) {
              data.push(sourceData[i].value);
              names.push(sourceData[i].name);
           }
           var display = [];
           for(var j = 0; j < names.length; ++j) {
               var object = {name: names[j], data: data[j]};
               display.push(object);
           }

           var pie = d3.layout.pie().sort(null);
           var arc = d3.svg.arc()
               .outerRadius(min / 2 * 0.9)
               .innerRadius(min / 2 * 0.5);
           var color = d3.scale.ordinal()
               .range(['#7bc142', '#bcda89', '#2e464c', '#5c8793', '#1692ae', '#29abc0', '#7a9ea7', '#47aa47', '#c5d246', '#307539', '#42b766', '#5cc1a3', '#84b3c6', '#0c4f12' ]);

           //  var data = [10, 20, 30,65,18];


           svg.attr({width: width, height: height});

           var g = svg.append('g')
               // center the donut chart
               .attr('transform', 'translate(' + width / 2 + ',' + height / 2 + ')');

           // add the paths for each arc slice
           g.selectAll('path').data(pie(data))
               .enter().append('path')
               .attr('fill', function(d, i){return color(i);})
               .style('stroke', 'white')
               .attr('d', arc)
               .data(display)
               .append('title')
               .text(function(d) {
                   return d.data + '  ' + d.name;
               })
               .transition()
               .ease('exp')
               .duration(1000)
               .attrTween('d', function(b){
                   var i = d3.interpolate({startAngle: 1.1*Math.PI, endAngle: 1.1*Math.PI}, b);
                   return function(t) { return arc(i(t)); };
               });

           // draw legend
           var legend = svg.selectAll('.legend')
               .data(color.domain())
               .enter().append('g')
               .attr('class', 'legend')
               .attr('transform', function(d, i) { return 'translate(0,' + i * 20 + ')'; });

           // draw legend colored rectangles
           legend.append('rect')
               .attr('x', width - 590)
               .attr('y', 30)
               .attr('width', 18)
               .attr('height', 18)
               .style('fill', color);

           // draw legend text
           legend.append('text')
               .attr('x', width - 600 )
               .attr('y', 39)
               .attr('dy', '.35em')
               .style('text-anchor', 'end')
               .text(function(d) {
                   return d >= names.length ? '' : data[d] + '  ' + names[d];
               });

       };

       scope.$watch('chartData', function() {
            drawChart();
        },true);

    }
    return {
        link: link,
        restrict: 'E'
    };
});