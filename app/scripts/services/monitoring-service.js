'use strict';

/**
 * @ngdoc service
 * @name rainierApp.monitoringService
 * @description
 * # MonitoringService
 * Factory in the rainierApp.
 */
angular.module('rainierApp')
    .factory('monitoringService', function (orchestratorService, objectTransformService, ShareDataService, paginationService, $routeParams, $location) {

        var currentCategory = 'capacity';
        var currentComponent = 'pool';
        var model = {};

        function getHardwareComponents() {
            var components = [
                {
                    display: 'Disk',
                    pathVar: 'disk'
                },
                {
                    display: 'Fan',
                    pathVar: 'fan'
                },
                {
                    display: 'Processor',
                    pathVar: 'processor'
                }
            ];
            return components;
        }

        function getCapacityComponents() {
            return [
                {
                    display: 'Pools',
                    key: 'pools'
                }
            ];
        }

        function launchMonitoring(category, alertCount) {
            if (alertCount && alertCount !== 0) {
                var path = '/monitoring';
                if ($routeParams.storageSystemId) {
                    path = '/storage-systems/' + $routeParams.storageSystemId + path;
                }
                $location.path(path);
                currentCategory = category;
                if (currentCategory === 'hardware') {
                    currentComponent = 'disk';
                } else {
                    currentComponent = 'pool';
                }
            }
        }

        function getCurrentCategory() {
            return currentCategory;
        }

        function getSelectedComponent() {
            return currentComponent;
        }

        function setSelectedComponent(componentToSelect) {
            currentComponent = componentToSelect;
        }

        function getModel() {
            return model;
        }

        function getSummaryStatus(callback) {
            var HARDWARE_KEY = 'hardware';
            var CAPACITY_KEY = 'capacity';

            if($routeParams.storageSystemId) {
                orchestratorService.statusByStorageSystem(HARDWARE_KEY, $routeParams.storageSystemId).then(function (result) {
                    model.hardwareAlertTotals = result;
                    orchestratorService.statusByStorageSystem(CAPACITY_KEY, $routeParams.storageSystemId).then(function (result) {
                        model.capacityAlertTotals = result;
                        callback(model);
                    });
                });
            }else {
                orchestratorService.status(HARDWARE_KEY).then(function (result) {
                    model.hardwareAlertTotals = result;
                    orchestratorService.status(CAPACITY_KEY).then(function (result) {
                        model.capacityAlertTotals = result;
                        callback(model);
                    });
                });
            }


        }

        function launchDpMonitoring(alertCount) {
            if(alertCount && alertCount !== 0){
                var path = '/data-protection-monitoring';
                ShareDataService.fromStorageSystem = false;
                if ($routeParams.storageSystemId) {
                    path = '/storage-systems/' + $routeParams.storageSystemId + path;
                    ShareDataService.fromStorageSystem = true;
                }
                $location.path(path);
            }
        }

        function launchDpMonitoringFromVolumeTile() {
            var path = '/data-protection-monitoring';
            if ($routeParams.storageSystemId) {
                path = '/storage-systems/' + $routeParams.storageSystemId + path;
            }
            $location.path(path);
        }

        function getDpAlerts(callback) {
            if($routeParams.storageSystemId) {
                orchestratorService.failedServersForStorageSystem($routeParams.storageSystemId).then(function(serverResult) {

                    model.totalHostAlertCount = serverResult.servers.length;
                    model.servers = serverResult.servers;

                    paginationService.getAllPromises(null, 'volumes?q=dataProtectionSummary.hasFailures:true', true, $routeParams.storageSystemId, null, false).then(function(volumeResult) {
                        _.forEach(volumeResult, function (item) {
                            objectTransformService.transformVolume(item);
                        });
                        model.total = model.totalHostAlertCount + volumeResult.length;
                        model.totalVolumeAlertCount = volumeResult.length;
                        model.volumes = volumeResult;
                        callback(model);
                    });
                });
            } else {
                paginationService.getAllPromises(null, 'compute/servers?q=dataProtectionSummary.hasFailures:true', true, null, null, false).then(function(serverResult) {

                    var volumeCount = 0;
                    var volumes = [];

                    model.totalHostAlertCount = serverResult.length;
                    model.servers = serverResult;

                    paginationService.getAllPromises(null, 'storage-systems', true, null, objectTransformService.transformStorageSystem, false).then(function(storageSystemResult) {
                        _.forEach(storageSystemResult, function (storageSystem, index) {

                            if (storageSystem.accessible) {
                                paginationService.getAllPromises(null, 'volumes?q=dataProtectionSummary.hasFailures:true', true, storageSystem.storageSystemId, null, false).then(function(volumeResult) {

                                    volumeCount += volumeResult.length;
                                    volumes = volumes.concat(volumeResult);

                                    if (index === storageSystemResult.length - 1) {

                                        _.forEach(volumes, function (item) {
                                            objectTransformService.transformVolume(item);
                                        });
                                        model.total = model.totalHostAlertCount + volumeCount;
                                        model.totalVolumeAlertCount = volumeCount;
                                        model.volumes = volumes;
                                        callback(model);
                                    }
                                });
                            }
                        });
                    });
                });
            }
        }

        function getComponentAlerts(componentType, callback) {

            if (componentType === 'pool') {
                if($routeParams.storageSystemId) {
                    orchestratorService.capacityAlertsByStorageSystem(componentType, $routeParams.storageSystemId).then(function (result) {
                        var list = result.capacityAlertInformationList;
                        callback(list ? list : []);
                    });
                }else{
                    orchestratorService.capacityAlerts(componentType).then(function (result) {
                        var list = result.capacityAlertInformationList;
                        callback(list ? list : []);
                    });
                }

            } else {
                if($routeParams.storageSystemId) {
                    orchestratorService.hardwareAlertsByStorageSystem(componentType, $routeParams.storageSystemId).then(function (result) {
                        var list = componentType === 'disk' ? result.diskAlertInformationList : result.alertInformationList;
                        callback(list ? list : []);
                    });
                }else{
                    orchestratorService.hardwareAlerts(componentType).then(function (result) {
                        var list = componentType === 'disk' ? result.diskAlertInformationList : result.alertInformationList;
                        callback(list ? list : []);
                    });
                }
            }

            currentComponent = componentType;
        }

        function capitalize(str) {
            return str.replace(/(?:^|\s)\S/g, function(a) { return a.toUpperCase(); });
        }

        function filterUniqueByProperty(alerts, property) {
            return _.map(_.uniq(alerts, function (alert) {
                return alert[property];
            }), function (items) {
                return capitalize(items[property]);
            });
        }

        function getUniqueStorageSerialNumbers(alerts) {
            return filterUniqueByProperty(alerts, 'storageSerialNumber');
        }

        function getUniqueAlertLevels(alerts) {
            return filterUniqueByProperty(alerts, 'alertLevel');
        }

        function isStorageArrayId() {
            if ($routeParams.storageSystemId) {
                return true;
            }
            return false;
        }

        return {
            getHardwareComponents: getHardwareComponents,
            getCapacityComponents: getCapacityComponents,
            launchMonitoring: launchMonitoring,
            getCurrentCategory: getCurrentCategory,
            getSelectedComponent: getSelectedComponent,
            setSelectedComponent: setSelectedComponent,
            getSummaryStatus: getSummaryStatus,
            launchDpMonitoring: launchDpMonitoring,
            launchDpMonitoringFromVolumeTile: launchDpMonitoringFromVolumeTile,
            getDpAlerts: getDpAlerts,
            getComponentAlerts: getComponentAlerts,
            getUniqueStorageSerialNumbers: getUniqueStorageSerialNumbers,
            getUniqueAlertLevels: getUniqueAlertLevels,
            isStorageArrayId: isStorageArrayId,
            getModel: getModel
        };
    });
