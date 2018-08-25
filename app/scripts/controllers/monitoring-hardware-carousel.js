'use strict';
/*
 * ========================================================================
 *
 * Copyright (c) by Hitachi Data Systems, 2015. All rights reserved.
 *
 * ========================================================================
 */

angular.module('rainierApp')
    .controller('MonitoringHardwareCarouselCtrl', function ($scope, monitoringService) {
        function getHardwareAlertIcon(componentAlertType) {
            var model = monitoringService.getModel();
            if (model.hasOwnProperty('hardwareAlertTotals') && model.hardwareAlertTotals.hasOwnProperty('hardwareComponents')) {
                var hardwareComponents = model.hardwareAlertTotals.hardwareComponents;
                if (hardwareComponents.hasOwnProperty(componentAlertType)) {
                    return hardwareComponents[componentAlertType] ? 'danger' : 'disabled';
                }
            }
        }

        $scope.interval = 0;
        $scope.slides = [
            {
                active: true,
                items: [{
                    id: 'disk',
                    itemClass: 'active',
                    iconClass: 'icon-disk-status',
                    displayName: 'Disk',
                    badgeClass: getHardwareAlertIcon('diskAlerts'),
                    onClick: monitoringService.setSelectedComponent
                },
                    {
                        itemClass: '',
                        iconClass: 'icon-fan',
                        id: 'fan',
                        displayName: 'Fan',
                        badgeClass: getHardwareAlertIcon('fanAlerts'),
                        onClick: monitoringService.setSelectedComponent
                    },
                    {
                        itemClass: '',
                        iconClass: 'icon-battery',
                        id: 'battery',
                        displayName: 'Battery',
                        badgeClass: getHardwareAlertIcon('batteryAlerts'),
                        onClick: monitoringService.setSelectedComponent
                    }
                ]
            },
            {
                active: false,
                items: [{
                    itemClass: '',
                    iconClass: 'icon-cache',
                    id: 'cache',
                    displayName: 'Cache',
                    badgeClass: getHardwareAlertIcon('cacheAlerts'),
                    onClick: monitoringService.setSelectedComponent
                },
                    {
                        itemClass: '',
                        iconClass: 'icon-processor',
                        id: 'processor',
                        displayName: 'Processor',
                        badgeClass: getHardwareAlertIcon('processorAlerts'),
                        onClick: monitoringService.setSelectedComponent
                    },
                    {
                        itemClass: '',
                        iconClass: 'icon-power-status',
                        id: 'powerSupply',
                        displayName: 'Power',
                        badgeClass: getHardwareAlertIcon('powerSupplyAlerts'),
                        onClick: monitoringService.setSelectedComponent
                    }
                ]
            },
            {
                active: false,
                items: [
                    {
                        itemClass: '',
                        iconClass: 'icon-ports',
                        id: 'port',
                        displayName: 'Ports',
                        badgeClass: getHardwareAlertIcon('portAlerts'),
                        onClick: monitoringService.setSelectedComponent
                    },
                    {
                        itemClass: '',
                        iconClass: 'icon-memory',
                        id: 'memory',
                        displayName: 'Memory',
                        badgeClass: getHardwareAlertIcon('memoryAlerts'),
                        onClick: monitoringService.setSelectedComponent
                    }
                ]
            }
        ];
    });
