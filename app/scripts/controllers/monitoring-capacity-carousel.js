'use strict';
/*
 * ========================================================================
 *
 * Copyright (c) by Hitachi Data Systems, 2014. All rights reserved.
 *
 * ========================================================================
 */

angular.module('rainierApp')
    .controller('MonitoringCapacityCarouselCtrl', function ($scope, monitoringService) {
        function getCapacityAlertIcon(componentAlertType) {
            var model = monitoringService.getModel();
            if (model.hasOwnProperty('capacityAlertTotals') && model.capacityAlertTotals.hasOwnProperty('capacityComponents')) {
                var capacityComponents = model.capacityAlertTotals.capacityComponents;
                if (capacityComponents.hasOwnProperty(componentAlertType)) {
                    return capacityComponents[componentAlertType] ? 'danger' : 'disabled';
                }
            }
        }

        $scope.interval = 0;
        $scope.slides = [
            {
                active: true,
                items: [{
                    id: 'pool',
                    itemClass: 'active',
                    iconClass: 'icon-pools',
                    displayName: 'Pools',
                    badgeClass: getCapacityAlertIcon('poolAlerts'),
                    onClick: monitoringService.setSelectedComponent
                }
                ]
            }
        ];
    });
