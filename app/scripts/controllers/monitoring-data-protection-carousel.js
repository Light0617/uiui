'use strict';
/*
 * ========================================================================
 *
 * Copyright (c) by Hitachi Data Systems, 2015. All rights reserved.
 *
 * ========================================================================
 */

angular.module('rainierApp')
    .controller('MonitoringDataProtectionCarouselCtrl', function ($scope, monitoringService) {
        $scope.interval = 0;
        $scope.slides = [
            {
                active: true,
                items: [
                {
                    id: 'disk',
                    itemClass: 'active',
                    iconClass: 'icon-volume',
                    headerValue: '23',
                    displayName: 'Volumes',
                    badgeClass: 'danger',
                    onClick: monitoringService.setSelectedComponent
                },
                {
                    itemClass: '',
                    iconClass: 'icon-host',
                    headerValue: '25',
                    id: 'disk',
                    displayName: 'Hosts',
                    badgeClass: 'disabled',
                    onClick: monitoringService.setSelectedComponent
                }
                ]
            }
        ];
    });

