'use strict';

/**
 * @ngdoc directive
 * @name rainierApp.directive:storageSystemVolumeDataVisualization
 * @description
 * # storageSystemVolumeDataVisualization
 */
angular.module('rainierApp')
    .directive('storageSystemVolumeDataVisualization', function (replicationService) {
        return {
            scope: false,
            templateUrl: 'views/templates/storage-system-volume-data-visualization.html',
            restrict: 'E',
            link: function() {
                $('text.value, text.header').on('mouseover', function(event){
                    var title = this.getAttribute('title');
                    if (title) {
                        var tooltipBlock = $('#svg-tooltip-block');
                        tooltipBlock.css('position', 'absolute');
                        tooltipBlock.css('left', event.pageX);
                        tooltipBlock.css('top', event.pageY);
                        tooltipBlock.css('z-index', 10000);
                        tooltipBlock.css('visibility', 'visible');
                        tooltipBlock.text(replicationService.tooltip(title));
                    }
                });

                $('text.value, text.header').on('mouseleave', function(){
                    var tooltipBlock = $('#svg-tooltip-block');
                    tooltipBlock.css('visibility', 'hidden');
                });
            }
        };
    });
