'use strict';

/**
 * @ngdoc service
 * @name rainierApp.volumeService
 * @description
 * # volumeService
 * Factory in the rainierApp.
 */
angular.module('rainierApp')
    .factory('volumeService', function (replicationService, ShareDataService, $q, $location, constantService) {

        var getStorageSystems = function (paginationService, objectTransformService, storageSystemId) {
            return paginationService.getAllPromises(null, 'storage-systems', true, null,
                objectTransformService.transformStorageSystem).then(function (result) {
                result = _.filter(result, function (r) {
                    return r.storageSystemId !== storageSystemId;
                });

                if (result.length > 0) {
                    return $q.resolve(result);
                } else {
                    return $q.reject('storage-system-not-found-error');
                }
            });
        };

        var volumeRestoreAction = function (action, selectedVolumes, storageSystemId, storageSystemVolumeService) {

            var volumeId = 0;
            if (selectedVolumes && selectedVolumes.length > 0) {
                volumeId = selectedVolumes[0].volumeId;
            }

            storageSystemVolumeService.getVolumePairsAsPVolWithoutSnapshotFullcopy(null, volumeId,
                storageSystemId).then(function (result) {

                ShareDataService.SVolsList = _.filter(result.resources, function (SVol) {
                    return SVol.primaryVolume && SVol.secondaryVolume;
                });
                ShareDataService.restorePrimaryVolumeId = volumeId;
                ShareDataService.restorePrimaryVolumeToken = result.nextToken;

                _.forEach(ShareDataService.SVolsList, function (volume) {
                    volume.selected = false;
                });
                $location.path(['/storage-systems/', storageSystemId, '/volumes/volume-actions-restore-selection'].join(''));
            });
        };

        var volumeUnprotectActions = function (selectedVolume, storageSystemId) {
            ShareDataService.volumeListForUnprotect = selectedVolume;

            $location.path(['storage-systems', storageSystemId, 'volumes', 'unprotect'].join('/'));
        };

        var hasGadVolume = function (selectedVolumes) {
            return _.find(selectedVolumes, function (volume) {
                return volume.isGadVolume();
            }) !== undefined;
        };

        var hasShredding = function (selectedVolumes) {
            return _.some(selectedVolumes, function (vol) {
                return vol.isShredding();
            });
        };

        var enableToShred = function (volume) {
            return volume.isUnattached() &&
                (volume.isNormal() || volume.status === constantService.volumeStatus.BLOCKED) &&
                volume.capacitySavingType === 'No' &&
                !volume.isSnapshotPair() &&
                volume.dataProtectionSummary.replicationType.indexOf('CLONE') === -1 &&
                volume.migrationSummary.migrationType !== constantService.migrationType.MIGRATION;
        };

        var detachFromTargetStorageDialogSettings = function () {
            var dialogSettings = {
                id: 'detachFromTargetStorageConfirmation',
                title: 'storage-volume-detach-from-target',
                content: 'storage-volume-detach-from-target-content',
                disableRadioButton: true,
                itemAttributes: [],
                itemAttribute: {}
            };

            return dialogSettings;
        };

        var restorable = function (volume) {
            var type = volume.dataProtectionSummary.replicationType;
            var snapshotFullcopyOnly = type.length === 1 && replicationService.isSnapClone(type[0]);
            return !volume.isUnprotected() && !snapshotFullcopyOnly;
        };

        var getActions = function (dataModel, resourceTrackerService, orchestratorService, $modal, storageSystemId,
                                   storageSystemVolumeService, virtualizeVolumeService, utilService, paginationService,
                                   migrationTaskService, attachVolumeService) {
            return [
                {
                    icon: 'icon-delete',
                    tooltip: 'action-tooltip-delete',
                    type: 'confirm',

                    confirmTitle: 'storage-volume-delete-confirmation',
                    confirmMessage: 'storage-volume-delete-selected-content',
                    enabled: function () {
                        return dataModel.anySelected() && !hasGadVolume(dataModel.getSelectedItems()) &&
                            !hasShredding(dataModel.getSelectedItems());
                    },
                    onClick: function () {
                        // Build reserved resources
                        var reservedResourcesList = [];
                        var volIds = [];
                        _.forEach(dataModel.getSelectedItems(), function (item) {
                            reservedResourcesList.push(item.volumeId + '=' + resourceTrackerService.volume());
                            volIds.push(item.volumeId);
                        });

                        // Show popup if resource is present in resource tracker else submit
                        resourceTrackerService.showReservedPopUpOrSubmit(reservedResourcesList, storageSystemId,
                            resourceTrackerService.storageSystem(), 'Delete Volumes Confirmation', storageSystemId,
                            volIds, null, orchestratorService.deleteVolume);

                    }
                },
                {
                    icon: 'icon-edit',
                    tooltip: 'action-tooltip-edit',
                    type: 'link',
                    enabled: function () {
                        return dataModel.onlyOneSelected() && !hasGadVolume(dataModel.getSelectedItems()) &&
                            !hasShredding(dataModel.getSelectedItems());
                    },
                    onClick: function () {
                        var item = _.first(dataModel.getSelectedItems());
                        item.actions.edit.onClick();

                    }
                },
                {
                    icon: 'icon-attach-volume',
                    tooltip: 'action-tooltip-attach-volumes',
                    type: 'link',
                    onClick: function () {
                        var flags = [];
                        _.forEach(dataModel.getSelectedItems(), function (item) {
                            flags.push(item.isUnattached());
                        });
                        if (attachVolumeService.isMultipleVsm(dataModel.getSelectedItems())) {
                            attachVolumeService.openAttachMultipleVsmErrorModal();
                        } else if (flags.areAllItemsTrue()) {
                            ShareDataService.push('selectedVolumes', dataModel.getSelectedItems());
                            $location.path(['storage-systems', storageSystemId, 'attach-volumes'].join('/'));
                        } else {
                            var modelInstance = $modal.open({
                                templateUrl: 'views/templates/attach-volume-confirmation-modal.html',
                                windowClass: 'modal fade confirmation',
                                backdropClass: 'modal-backdrop',
                                controller: function ($scope) {
                                    $scope.cancel = function () {
                                        modelInstance.dismiss('cancel');
                                    };

                                    $scope.ok = function () {
                                        ShareDataService.push('selectedVolumes', dataModel.getSelectedItems());
                                        $location.path(['storage-systems', storageSystemId, 'attach-volumes'].join('/'));
                                        modelInstance.close(true);
                                    };

                                    modelInstance.result.finally(function () {
                                        $scope.cancel();
                                    });
                                }
                            });
                        }
                    },
                    enabled: function () {
                        return dataModel.anySelected() && !hasGadVolume(dataModel.getSelectedItems());
                    }
                },
                {
                    icon: 'icon-detach-volume',
                    tooltip: 'storage-volume-detach',
                    type: 'link',
                    enabled: function () {
                        return dataModel.onlyOneSelected() && _.some(dataModel.getSelectedItems(),
                            function (vol) {
                                return vol.isAttached();
                            }) && !hasGadVolume(dataModel.getSelectedItems());
                    },
                    onClick: function () {
                        var item = _.first(dataModel.getSelectedItems());
                        item.actions.detach.onClick();
                    }
                },
                {
                    type: 'spacer'
                },
                {
                    icon: 'icon-data-protection',
                    tooltip: 'action-tooltip-protect-volumes',
                    type: 'link',
                    onClick: function () {
                        ShareDataService.volumesList = dataModel.getSelectedItems();
                        $location.path(['storage-systems', storageSystemId,
                            'volumes/protect'].join('/'));
                    },
                    enabled: function () {
                        return dataModel.anySelected() &&
                            _.all(dataModel.getSelectedItems(),
                                function (vol) {
                                    return (vol.isAttached() || vol.isUnmanaged()) && !vol.isShredding();
                                });
                    }
                },
                {
                    icon: 'icon-remove-volume',
                    tooltip: 'action-tooltip-unprotect-volumes',
                    type: 'link',
                    onClick: function () {
                        volumeUnprotectActions(dataModel.getSelectedItems(), storageSystemId);
                    },
                    enabled: function () {
                        return dataModel.onlyOneSelected() && !_.some(dataModel.getSelectedItems(),
                            function (vol) {
                                return vol.isUnprotected();
                            });
                    }
                },
                {
                    icon: 'icon-refresh',
                    tooltip: 'action-tooltip-restore-volumes',
                    type: 'link',
                    onClick: function () {
                        volumeRestoreAction('restore', dataModel.getSelectedItems(), storageSystemId, storageSystemVolumeService);
                    },
                    enabled: function () {
                        return dataModel.onlyOneSelected() && _.some(dataModel.getSelectedItems(),
                            function (vol) {
                                return restorable(vol);
                            });
                    }
                },
                {
                    type: 'spacer'
                },
                // Attach to storage
                {
                    icon: 'icon-attach-vol-to-storage',
                    tooltip: 'action-tooltip-attach-to-storage',
                    type: 'link',
                    enabled: function () {
                        return dataModel.anySelected();
                    },
                    onClick: function () {
                        virtualizeVolumeService.invokeOpenAttachToStorage(dataModel.getSelectedItems());
                    }
                },
                {
                    icon: 'icon-migrate-volume',
                    tooltip: 'action-tooltip-migrate-volumes',
                    type: 'link',
                    enabled: function () {
                        return dataModel.getSelectedCount() > 0 && dataModel.getSelectedCount() <= 300 &&
                            migrationTaskService.isAllMigrationAvailable(dataModel.getSelectedItems());
                    },
                    onClick: function () {
                        ShareDataService.selectedMigrateVolumes = dataModel.getSelectedItems();
                        $location.path(['storage-systems', storageSystemId, 'migrate-volumes'].join('/'));
                    }
                },
                {
                    icon: 'icon-detach-vol-to-storage',
                    tooltip: 'storage-volume-detach-from-target',
                    type: 'confirmation-modal',
                    dialogSettings: detachFromTargetStorageDialogSettings(),
                    enabled: function () {
                        return dataModel.anySelected();
                    },
                    confirmClick: function () {
                        $('#' + this.dialogSettings.id).modal('hide');

                        var targetStorageSystemId = this.dialogSettings.itemAttribute.value;

                        if(!utilService.isNullOrUndef(targetStorageSystemId)){
                            _.forEach(dataModel.getSelectedItems(), function (item) {
                                var unprevirtualizePayload  = {
                                    targetStorageSystemId : targetStorageSystemId
                                };
                                orchestratorService.unprevirtualize(storageSystemId, item.volumeId, unprevirtualizePayload);
                            });
                        }
                    },
                    onClick: function () {
                        this.dialogSettings.itemAttributes = [];

                        var dialogSettings = this.dialogSettings;

                        getStorageSystems(paginationService, orchestratorService, storageSystemId).then(function () {
                            _.each(dataModel.storageSystems, function (storageSystem) {
                                dialogSettings.itemAttributes.push(storageSystem.storageSystemId);
                            });
                            dialogSettings.itemAttribute = {
                                value: dialogSettings.itemAttributes[0]
                            };
                        }).catch(function(e){
                            dialogSettings.content = e;
                        });
                    }
                },
                //Shredding
                {
                    icon: 'icon-shred-volume',
                    tooltip: 'shred-volumes',
                    type: 'link',
                    enabled: function () {
                        return dataModel.getSelectedCount() > 0 && dataModel.getSelectedCount() <= 300 &&
                            !_.some(dataModel.getSelectedItems(), function (vol) {
                                return !enableToShred(vol);
                            });
                    },
                    onClick: function () {
                        ShareDataService.push('selectedVolumes', dataModel.getSelectedItems());
                        $location.path(['storage-systems', storageSystemId, 'volumes', 'shred-volumes'].join('/'));
                    }
                }
            ];
        };

        return {
            getStorageSystems: getStorageSystems,
            volumeRestoreAction: volumeRestoreAction,
            volumeUnprotectActions: volumeUnprotectActions,
            hasGadVolume: hasGadVolume,
            hasShredding: hasShredding,
            enableToShred: enableToShred,
            detachFromTargetStorageDialogSettings: detachFromTargetStorageDialogSettings,
            getActions: getActions,
            validateCombinedLabel: function (label, suffix, volumeCount) {
                if (label === null && suffix === null) {
                    return true;
                }

                var simpleNameRegexp = /^[a-zA-Z0-9_.@]([a-zA-Z0-9-_.@]*$|[ a-zA-Z0-9-_.@]*[a-zA-Z0-9-_.@]+$)/;
                var largestSuffix;
                if (suffix === null) {
                    largestSuffix = '';
                } else {
                    largestSuffix = suffix + volumeCount - 1;
                }
                var combinedLabel = label + largestSuffix;

                if (combinedLabel === null || combinedLabel === '') {
                    return true;
                } else if (combinedLabel.length > 32) {
                    return false;
                } else {
                    return simpleNameRegexp.test(combinedLabel);
                }
            },
            restorable: restorable,
            getDkcDataSavingTypes: function () {
                return [
                    {label: 'volume-capacity-saving-type-filter-compression', value: 'COMPRESSION'},
                    {
                        label: 'volume-capacity-saving-type-filter-deduplication-and-compression',
                        value: 'DEDUPLICATION_AND_COMPRESSION'
                    },
                    {label: 'volume-capacity-saving-type-filter-no', value: 'NONE'}
                ];
            },
            getVolumeSizeUnits: function () {
                return ['GB', 'TB', 'PB'];
            }
        };

    });
