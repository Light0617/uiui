'use strict';

/**
 * @ngdoc function
 * @name rainierApp.controller:SecurityCtrl
 * @description
 * # SecurityCtrl
 * Controller of the rainierApp
 */
angular.module('rainierApp')
    .controller('SecurityCtrl', function ($scope, $q, $timeout, orchestratorService) {
        $scope.$watch('dataModel.accountDomain.id', function (id) {
            onAccountDomainIdChanged(id);
        });

        $scope.$watch('dataModel.groupMappingModel.mappings', function (mappins) {
            if (!$scope.dataModel || !$scope.dataModel.groupMappingModel) {
                return;
            }
            var hasNewMappings = false;
            var itemDeleted = false;

            _.forEach(mappins, function (item) {
                if (item.deleted) {
                    itemDeleted = true;
                }
                else if (item.added) {
                    hasNewMappings = true;
                }
            });
            var canSubmit = false;
            if (hasNewMappings) {
                canSubmit = hasNewMappings;
            }
            else {
                canSubmit = itemDeleted;
            }

            $scope.dataModel.groupMappingModel.canSubmit = canSubmit;
            $scope.dataModel.cannotDelete = _.some(mappins, 'id');
        }, true);

        function onDomainChanged(domain) {
            var dataModel = {
                accountDomain: domain,
                groupMappingModel: null
            };

            dataModel.save = function () {
                if (dataModel.accountDomain && dataModel.accountDomain.id) {
                    var updateAccountDomainPayload = {
                        username: dataModel.accountDomain.username,
                        password: dataModel.accountDomain.password
                    };
                    orchestratorService.updateAccountDomain(dataModel.accountDomain.id, updateAccountDomainPayload).then(function () {
                        window.history.back();
                    });
                }
                else {
                    var addAccountDomainPayload = {
                        domain: dataModel.accountDomain.domain,
                        username: dataModel.accountDomain.username,
                        password: dataModel.accountDomain.password
                    };
                    orchestratorService.addAccountDomain(addAccountDomainPayload).then(function () {
                        window.history.back();
                    });
                }
            };

            dataModel.remove = function () {
                orchestratorService.deleteAccountDomain(dataModel.accountDomain.id).then(function () {
                    window.history.back();
                });
            };

            dataModel.canSave = function () {
                return dataModel.accountDomain && !_.isEmpty(dataModel.accountDomain.domain) && !_.isEmpty(dataModel.accountDomain.username) && !_.isEmpty(dataModel.accountDomain.password);
            };

            $scope.dataModel = dataModel;

            if (domain === null) {
                return;
            }

            onAccountDomainIdChanged(domain.id);
        }

        function intiView() {
            orchestratorService.accountDomains().then(function (result) {

                var activeDirectoryAccountDomain = null;

                _.forEach(result.accountDomains, function (domain) {
                    if (domain.type === 'ACTIVE_DIRECTORY') {
                        activeDirectoryAccountDomain = domain;
                        return false;
                    }
                });

                onDomainChanged(activeDirectoryAccountDomain);
            });
        }

        intiView();


        var onAccountDomainIdChanged = function (id) {
            if (!id) {
                return;
            }

            orchestratorService.groupMappings(id).then(function (result) {
                var mappings = [];

                var template = {
                    roles: [
                        'StorageAdministrator',
                        'SystemAdministrator',
                        'SecurityAdministrator'
                    ],
                    deleted: false,
                    added: false
                };


                _.forEach(result.mappings, function (item) {
                    var clone = _.cloneDeep(template);
                    angular.extend(clone, item);
                    clone.readOnly = true;
                    clone.delete = function () {
                        clone.deleted = true;
                    };
                    mappings.push(clone);
                });


                var groupMappingModel = {
                    mappings: mappings,
                    getUserGroups: function (filterKey) {
                        return orchestratorService.userGroups(id, filterKey).then(function (result) {
                            return result.groups;
                        });
                    },
                    addMapping: function (isInitLoad) {
                        // when the first row is not valid, it is not added.
                        if (mappings.length > 0 && (_.isEmpty(mappings[0].groupName) || _.isEmpty(mappings[0].userRole))) {
                            return;
                        }
                        var clone = _.cloneDeep(template);
                        clone.delete = function () {

                            $timeout(function () {
                                _.remove(mappings, function (m) {
                                    return m === clone;
                                });

                            });
                        };

                        if (!isInitLoad && mappings.length > 0 && mappings[0].added === false) {
                            mappings[0].added = true;
                            mappings[0].readOnly = true;
                        }
                        mappings.splice(0, 0, clone);
                    }
                };

                groupMappingModel.reset = function () {
                    onAccountDomainIdChanged(id);
                };

                groupMappingModel.submit = function () {
                    var tasks = [];
                    var itemsToAdd = [];
                    var i;

                    // Skip the first row because it is used for adding new mapping.
                    for (i = 1; i < groupMappingModel.mappings.length; i++){
                        var item = groupMappingModel.mappings[i];
                        if (item.deleted) {
                            tasks.push(orchestratorService.deleteGroupMapping(item.accountDomainId, item.id));
                        }
                        else if (item.added){
                            itemsToAdd.push(item);
                        }
                    }

                    _.forEach(itemsToAdd, function (item) {
                        var payload = {
                            groupName: item.groupName,
                            userRole: item.userRole
                        };
                        tasks.push(orchestratorService.addGroupMapping(id, payload));
                    });

                    if (tasks.length === 0) {
                        return;
                    }
                    $q.all(tasks).then(function () {
                        window.history.back();
                    });

                };

                groupMappingModel.addMapping(true);


                $scope.dataModel.groupMappingModel = groupMappingModel;

            });
        };


    });
