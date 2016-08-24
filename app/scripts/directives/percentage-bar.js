/* global angular: false */
'use strict';

/**
 * @ngdoc directive
 * @name rainierApp.directive:percentageBar
 * @description
 * # percentageBar
 */
angular.module('rainierApp')
  .directive('percentageBar', function (d3service) {
    var svgHeight = 61;
    var svgWidth = 600;

    var builder = {

      buildLayout: function (d3, svg, percentage) {
        var percentageValue;
        var textClass = 'more-than-ten-percent';
        var textAnchor = 'end';
        if (percentage.unlimited === true){
          percentageValue = 100;
        } else {
          percentageValue = percentage.value;
          if (percentageValue <= 10){
            textClass = 'less-than-ten-percent';
            textAnchor = 'start';
          }
        }

        var bar = svg
            .attr('version', '1.1')
            .attr('viewBox', '0 0 ' + svgWidth + ' ' + svgHeight)
            .attr('preserveAspectRatio', 'xMinYMin meet')
            .attr('transform', 'scale(1,1)')
            .attr('class', 'bdv');

        bar.append('rect')
            .attr('class', 'data dv-base')
            .attr('x', 0)
            .attr('y', 0)
            .attr('rx', 9)
            .attr('ry', 9)
            .attr('width', '100%')
            .attr('height', 60);

        bar.append('rect')
            .attr('class', 'data dv-value')
            .attr('x', 0)
            .attr('y', 0)
            .attr('rx', 9)
            .attr('ry', 9)
            .attr('width', percentageValue + '%')
            .attr('height', 60)
            .append('title')
            .text(percentageValue + '%');

        bar.append('text')
            .attr('class', textClass)
            .attr('x', percentageValue + '%')
            .attr('y', 0)
            .attr('dy', '68%')
            .attr('text-anchor', textAnchor)
            .text(percentageValue + '%');
      }
    };

    return {
      scope: {
        data: '=ngModel'
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

            builder.buildLayout(d3, svg, data, scope);
          };
        });
      }
    };
  });
