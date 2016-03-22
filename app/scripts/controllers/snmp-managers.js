'use strict';

/**
 * @ngdoc function
 * @name rainierApp.controller:SnmpManagerCtrl
 * @description
 * # SnmpManagerCtrl
 * Controller of the rainierApp
 */
angular.module('rainierApp')
    .controller('SnmpManagerCtrl', function ($scope, $timeout, $location, $window, orchestratorService, objectTransformService, synchronousTranslateService, scrollDataSourceBuilderService) {

        orchestratorService.snmpManagers().then(function (result) {
            initView(result);
        });

        function initView(result) {

            var snmpManagers = result.snmpManagerInformationList ? result.snmpManagerInformationList : [];

            _.forEach(snmpManagers, function (item) {
                item.itemIcon = 'icon-snmp';
                item.metaData = [
                    {
                        left: true,
                        title: item.name,
                        details: [item.ipAddress, item.username, item.privacyProtocol, item.authProtocol]
                    },
                    {
                        left: false,
                        title: 'PORT',
                        details: [item.port]
                    }
                ];
            });
            var dataModel = {
                view: 'tile',
                title: synchronousTranslateService.translate('snmp-managers'),
                noAlerts: false,
                displayPrompt: false,
                allItemsSelected: false,
                authProtocols: orchestratorService.authProtocols(),
                privacyProtocols: orchestratorService.privacyProtocols(),
                search: {
                    freeText: ''
                },
                sort: {
                    field: 'name',
                    reverse: false,
                    setSort: function (f) {

                        $timeout(function () {

                            if ($scope.dataModel.sort.field === f) {
                                $scope.dataModel.sort.reverse = !$scope.dataModel.sort.reverse;
                            }
                            else {
                                $scope.dataModel.sort.field = f;
                                $scope.dataModel.sort.reverse = false;
                            }
                        });
                    }
                }

            };

            var actions = [
                {
                    icon: 'icon-edit',
                    type: 'link',
                    enabled: function () {
                        return dataModel.onlyOneSelected();
                    },
                    onClick: function() {
                        $scope.updateSelected();
                    }
                },
                {
                    icon: 'icon-delete',
                    type: 'confirm',
                    tooltip: 'action-tooltip-delete',
                    confirmTitle: 'snmp-manager-delete-confirmation',
                    confirmMessage: 'snmp-manager-delete-selected-content',
                    enabled: function () {
                        return dataModel.anySelected();
                    },
                    onClick: function () {
                        _.forEach(dataModel.getSelectedItems(), function (item) {
                            orchestratorService.deleteSnmpManager(item.name);
                        });
                    }
                }
            ];
            dataModel.getActions = function () {
                return actions;
            };

            dataModel.addAction = function () {
                $location.path(['snmp-managers', 'add'].join('/'));
            };

            dataModel.gridSettings = [
                {
                    title: 'Name',
                    sizeClass: 'sixth',
                    sortField: 'name',
                    getDisplayValue: function (item) {
                        return item.name;
                    }

                },
                {
                    title: 'IP Address',
                    sizeClass: 'sixth',
                    sortField: 'ipAddress',
                    getDisplayValue: function (item) {
                        return item.ipAddress;
                    }

                },
                {
                    title: 'Username',
                    sizeClass: 'sixth',
                    sortField: 'username',
                    getDisplayValue: function (item) {
                        return item.username;
                    }

                },
                {
                    title: 'Auth Protocol',
                    sizeClass: 'twelfth',
                    sortField: 'authProtocol',
                    getDisplayValue: function (item) {
                        return item.authProtocol;
                    }

                },
                {
                    title: 'Privary Protocol',
                    sizeClass: 'twelfth',
                    sortField: 'privacyProtocol',
                    getDisplayValue: function (item) {
                        return item.privacyProtocol;
                    }

                },
                {
                    title: 'Port',
                    sizeClass: 'twelfth center-content',
                    sortField: 'port',
                    getDisplayValue: function (item) {
                        return item.port;
                    }

                }
            ];

            $scope.dataModel = dataModel;

            if(snmpManagers.length === 0) {
                $scope.dataModel.displayPrompt = true;
            }

            scrollDataSourceBuilderService.setupDataLoader($scope, snmpManagers, 'snmpManagerSearch');
        }

        $scope.updateSelected = function () {
            var snmpManager;
            for (var i = 0; i < $scope.dataModel.filteredList.length; ++i) {
                snmpManager = $scope.dataModel.filteredList[i];
                if (snmpManager.selected) {
                    $window.location.href = '#/snmp-managers/' + snmpManager.name + '/update';
                    break;
                }
            }
        };

    });
