'use strict';

/**
 * @ngdoc function
 * @name rainierApp.controller:ExportCtrl
 * @description
 * # ExportCtrl
 * Controller of the rainierApp
 */
angular.module('rainierApp')
    .controller('ExportCtrl', function ($scope, $routeParams, $timeout, $filter, diskSizeService, fileSystemService,
                                            orchestratorService, objectTransformService, synchronousTranslateService, scrollDataSourceBuilderService, $location, linkLabelService) {
        var storageSystemId = $routeParams.storageSystemId;
        var fileSystemId = $routeParams.fileSystemId;
        var fileSystem;
        var exportId = $routeParams.exportId;
        var exports;

        function transformService() {
            orchestratorService.enterpriseVirtualServer(storageSystemId, exports.evsUuid).then(function (evs) {
            var summaryModel = {};

                var exportList = [];
                exportList.push(exports);
                exports = linkLabelService.replaceFSIdWithLabel(exportList, fileSystem);
                exports = linkLabelService.replaceEVSUuidWithLabel(exports, evs);
                if( Array.isArray(exports) ){
                    exports = exports[0];
                }
            var dataModel = {
                title: synchronousTranslateService.translate('export') + ' ' + exports.name,
                storageSystemId: storageSystemId,
                view: 'tile',
                export: exports,
                singleView: true,
                onlyOperation: true,
                evsIp: _.first(evs.interfaceAddresses).ip
            };

            var summaryModelActions = [
                {
                    icon: 'icon-delete',
                    tooltip: 'action-tooltip-delete',
                    type: 'confirm',
                    confirmTitle: 'export-delete-confirmation',
                    confirmMessage: 'export-delete-selected-content',
                    enabled: function () {
                        return true;
                    },
                    onClick: function () {
                        orchestratorService.deleteExport(storageSystemId, fileSystemId, exportId);
                    }
                },
                {
                    icon: 'icon-edit',
                    tooltip: 'action-tooltip-edit',
                    type: 'link',
                    enabled: function () {
                        return true;
                    },
                    onClick: function () {
                        $location.path(['storage-systems', storageSystemId, 'file-systems', fileSystemId, 'exports', exportId, 'update'].join('/'));
                    }
                }
            ];

            summaryModel.getActions = function () {
                return summaryModelActions;
            };

            dataModel.gridSettings = [
                {
                    title: 'ID',
                    sizeClass: 'twelfth',
                    sortField: 'id',
                    getDisplayValue: function (item) {
                        return item.id;
                    },
                    type: 'id'

                },
                {
                    title: 'Name',
                    sizeClass: 'sixth',
                    sortField: 'label',
                    getDisplayValue: function (item) {
                        return item.label;
                    }

                }
            ];

            $scope.dataModel = dataModel;
            $scope.summaryModel = summaryModel;
        });
        }

        orchestratorService.export(storageSystemId, fileSystemId, exportId).then(function (result) {
            exports = result;
            orchestratorService.fileSystem(storageSystemId, exports.fileSystemId).then(function (fs) {
                fileSystem = fs;
                transformService();
            });

        }, function() {
           orchestratorService.allExports(storageSystemId).then(function (result) {
               exports = _.find(result.shares, function (exports) {
                   return exports.fileSystemId === fileSystemId && exports.id === exportId;
               });
               transformService();

           });
        });
    });
