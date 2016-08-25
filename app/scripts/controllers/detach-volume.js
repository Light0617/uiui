'use strict';

/**
 * @ngdoc function
 * @name rainierApp.controller:DetachVolumeCtrl
 * @description
 * # DetachVolumeCtrl
 * Controller of the rainierApp
 */
angular.module('rainierApp')
    .controller('DetachVolumeCtrl', function ($scope, $routeParams, $timeout, orchestratorService,
                                              diskSizeService, storagePoolService, objectTransformService,
                                              paginationService, viewModelService, scrollDataSourceBuilderServiceNew) {
        var storageSystemId = $routeParams.storageSystemId;
        var volumeId = $routeParams.volumeId;
        var GET_HOSTS_PATH = 'compute/servers';
        $scope.model = {
            storageSystemId : storageSystemId,
            volumeId: volumeId,
            removeZone: false
        };
        var serverIds = [];
        orchestratorService.volume(storageSystemId, volumeId).then(function (result) {
            $scope.model.volumeLabel = result.label;
            _.forEach(result.attachedVolumeServerSummary, function (attachedVolumeServerSummaryItem) {
                if(attachedVolumeServerSummaryItem.serverId !== null) {
                    serverIds.push(attachedVolumeServerSummaryItem.serverId);
                }
            });

            var GET_HOSTS_PATH_WITH_SERVER_ID;
            if(serverIds.length === 1) {
                GET_HOSTS_PATH_WITH_SERVER_ID = 'compute/servers?q=serverId:' + serverIds[0];
            } else {
                GET_HOSTS_PATH_WITH_SERVER_ID = 'compute/servers?q=serverId+IN+(' + serverIds.join(' OR ') + ')';
            }

            paginationService.get(null, GET_HOSTS_PATH_WITH_SERVER_ID, handleHost, true).then(function (result) {

                var hosts = result.resources;
                var dataModel = viewModelService.newWizardViewModel(['select']);
                var storageSystem = {
                    storageSystemId: storageSystemId
                };

                angular.extend(dataModel, {
                    selectedStorageSystem: storageSystem,
                    storageSystems: [storageSystem],
                    hosts: hosts,
                    view: 'tile',
                    allItemsSelected: false,
                    nextToken: result.nextToken,
                    total: result.total,
                    displayList: result.resources,
                    search: {
                        freeText: ''
                    },
                    sort: {
                        field: 'serverId',
                        reverse: false,
                        setSort: function (f) {
                            $timeout(function () {
                                if ($scope.dataModel.sort.field === f) {
                                    $scope.dataModel.sort.reverse = !$scope.dataModel.sort.reverse;
                                } else {
                                    $scope.dataModel.sort.field = f;
                                    $scope.dataModel.sort.reverse = false;
                                }
                            });
                        }
                    }
                });

                dataModel.selectModel = {
                    canSubmit: function () {
                        return dataModel.anySelected();
                    },
                    submit: function () {
                        var selectedServers = _.where(dataModel.displayList, 'selected');
                        for(var selectedServer in selectedServers) {
                            var payload = {
                                storageSystemId: storageSystemId,
                                volumeId: volumeId,
                                serverId: selectedServers[selectedServer].serverId,
                                removeConnection: $scope.model.removeZone
                            };

                            orchestratorService.detachVolume(payload);
                        }
                        window.history.back();
                    }
                };


                dataModel.getResources = function(){
                    return paginationService.get($scope.dataModel.nextToken, GET_HOSTS_PATH, handleHost, false);
                };
                dataModel.cachedList = result.resources;
                dataModel.displayList = result.resources.slice(0, scrollDataSourceBuilderServiceNew.showedPageSize);
                $scope.dataModel = dataModel;

                scrollDataSourceBuilderServiceNew.setupDataLoader($scope, hosts, 'hostSearch');
            });

            var updateResultTotalCounts = function(result) {
                $scope.dataModel.nextToken = result.nextToken;
                $scope.dataModel.cachedList = result.resources;
                $scope.dataModel.displayList = result.resources.slice(0, scrollDataSourceBuilderServiceNew.showedPageSize);
                $scope.dataModel.itemCounts = {
                    filtered: $scope.dataModel.displayList.length,
                    total: $scope.dataModel.total
                };
            };

            $scope.filterModel = {
                showAllFilters: false,
                filterDpType: function () {
                    var replicationTypes = [];
                    if ($scope.dataModel.snapshot) {
                        replicationTypes.push('SNAPSHOT');
                    }
                    if ($scope.dataModel.cloneNow) {
                        replicationTypes.push('CLONE');
                    }
                    $scope.dataModel.search.replicationTypes = replicationTypes;
                },
                filter: {
                    freeText: '',
                    status: '',
                    osType: null,
                    replicationType: null,
                    snapshot: false,
                    clone: false
                },
                arrayType: (new paginationService.SearchType()).ARRAY,
                filterQuery: function (key, value, type, arrayClearKey) {
                    var queryObject = new paginationService.QueryObject(key, type, value, arrayClearKey);
                    paginationService.setFilterSearch(queryObject);
                    for(var index in serverIds) {
                        paginationService.addSearchParameter(new paginationService.QueryObject('serverId', new paginationService.SearchType().INT, serverIds[index]));
                    }
                    paginationService.getQuery(GET_HOSTS_PATH, handleHost).then(function(result) {
                        updateResultTotalCounts(result);
                    });
                },
                searchQuery: function (value) {
                    var queryObjects = [];
                    queryObjects.push(new paginationService.QueryObject('serverId', new paginationService.SearchType().INT, value));
                    queryObjects.push(new paginationService.QueryObject('serverName', new paginationService.SearchType().STRING, value));
                    paginationService.setTextSearch(queryObjects);
                    for(var index in serverIds) {
                        paginationService.addSearchParameter(new paginationService.QueryObject('serverId', new paginationService.SearchType().INT, serverIds[index]));
                    }
                    paginationService.getQuery(GET_HOSTS_PATH, handleHost).then(function(result) {
                        updateResultTotalCounts(result);
                    });
                }
            };
        });

        function handleHost(host) {
            objectTransformService.transformHost(host);

            host.metaData[0].details.push(host.attachedVolumeCount + ' volume(s)');
        }

    });