'use strict';

/**
 * @ngdoc function
 * @name rainierApp.controller:MonitoringCtrl
 * @description
 * # MonitoringCtrl
 * Controller of the rainierApp
 */
angular.module('rainierApp')
    .controller('MonitoringCtrl', function ($scope, $timeout, $window, monitoringService, scrollDataSourceBuilderService, diskSizeService) {

        var ERROR_LEVEL = 'error';
        var HEALTHY_LEVEL = 'healthy';

        monitoringService.getSummaryStatus(function (result) {
            $scope.hardwareAlertTotals = result.hardwareAlertTotals;
            $scope.capacityAlertTotals = result.capacityAlertTotals;
            monitoringService.getDpAlerts(function (result) {
                $scope.dpAlertTotals = result.total;
                $scope.dpAlertHosts = result.totalHostAlertCount;
                $scope.dpAlertVolumes = result.totalVolumeAlertCount;
                initView();
            });
        });

        function initView() {
            $scope.model = {
                title : 'Monitoring',
                alerts: {
                    capacity: {
                        count: $scope.capacityAlertTotals.totalComponentWiseCapacityAlerts,
                        level: $scope.capacityAlertTotals &&
                        $scope.capacityAlertTotals.totalComponentWiseCapacityAlerts !== 0 &&
                        $scope.capacityAlertTotals.totalComponentWiseCapacityAlerts !== '0'? ERROR_LEVEL : HEALTHY_LEVEL
                    },
                    dp: {
                        count: $scope.dpAlertTotals,
                        level: $scope.dpAlertTotals !== 0 &&
                        $scope.dpAlertTotals !== '0'? ERROR_LEVEL : HEALTHY_LEVEL
                    },
                    hardware: {
                        count: $scope.hardwareAlertTotals.totalComponentWiseHardwareAlerts,
                        level: $scope.hardwareAlertTotals &&
                        $scope.hardwareAlertTotals.totalComponentWiseHardwareAlerts !== 0 &&
                        $scope.hardwareAlertTotals.totalComponentWiseHardwareAlerts !== '0'? ERROR_LEVEL : HEALTHY_LEVEL
                    },
                    jobs: {
                        count: 0,
                        level: 'healthy'
                    }
                }
                };
            $scope.interval = 0;
            var slides = [], slide = {}, items = [];
            items.push(displayAlert('Volumes', $scope.dpAlertVolumes));
            items.push(displayAlert('Hosts', $scope.dpAlertHosts));
            slide.items = items;
            slides.push(slide);
            $scope.slides = slides;
            $scope.onSelectComponent(monitoringService.getSelectedComponent());

        }
        
        $scope.onSelectComponent = function (componentType) {
            $scope.dropdownReady = false;
            monitoringService.getComponentAlerts(componentType, function (alerts) {
                $scope.dataModel = {
                    title : 'Alerts',
                    view: 'list',
                    diskTable: componentType === 'disk',
                    poolTable: componentType === 'pool',
                    storageArrays: monitoringService.getUniqueStorageSerialNumbers(alerts),
                    alertLevels: monitoringService.getUniqueAlertLevels(alerts),
                    isStorageArrayId: monitoringService.isStorageArrayId(),
                    search: {
                        freeText: ''
                    },
                    sort: {
                        reverse: true,
                        setSort: function(f) {
                            $timeout(function() {
                                if ($scope.dataModel.sort.field === f) {
                                    $scope.dataModel.sort.reverse = !$scope.dataModel.sort.reverse;
                                } else {
                                    $scope.dataModel.sort.field = f;
                                    $scope.dataModel.sort.reverse = false;
                                }
                            });
                        }
                    }

                };

                $scope.dropdownReady = true;

                if (componentType === 'disk') {
                    _.forEach(alerts, function (alert) {
                        alert.diskSpec.capacity = diskSizeService.getDisplayPhysicalSize(alert.diskSpec.capacity);
                    });
                }

                scrollDataSourceBuilderService.setupDataLoader($scope, alerts, 'alertSearch', true);
            });

        };

        $scope.selectedComponent = monitoringService.getSelectedComponent();

        $scope.$watch(monitoringService.getSelectedComponent, function (newValue) {
            if(newValue){
                $scope.onSelectComponent(newValue);
            }
        });

        function displayAlert (alertType, numberOfAlert) {
            var item = {};
            item.displayName = alertType;
            item.onClick = monitoringService.launchDpMonitoring;
            if (numberOfAlert > 0) {
                item.numberOfAlert = numberOfAlert;
                item.badgeClass = 'danger';
            }
            else {
                item.badgeClass = 'disabled';
                item.numberOfAlert = 0;
            }
            if (alertType === 'Volumes') {
                item.id = 'volume';
                item.itemClass = 'active';
                item.iconClass = 'icon-volume';
            }
            else {
                item.id = 'host';
                item.itemClass = '';
                item.iconClass = 'icon-host';
            }
            return item;
        }
    });
