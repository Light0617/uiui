/*
 * ========================================================================
 *
 * Copyright (c) by Hitachi Vantara, 2018. All rights reserved.
 *
 * ========================================================================
 */

'use strict';

/**
 * @ngdoc function
 * @name rainierApp.controller:CreateVsmCtrl
 * @description
 * # CreateVsmCtrl
 * Controller of the rainierApp
 */

angular.module('rainierApp')
    .controller('CreateVsmCtrl', function ($scope, $timeout, orchestratorService,
                                                                   objectTransformService, synchronousTranslateService,
                                                                   scrollDataSourceBuilderServiceNew,
                                                                   $location, diskSizeService, paginationService,
                                                                   constantService, viewModelService, $q, $modal) {

        var GET_STORAGE_SYSTEM_PATH = 'storage-systems';

        paginationService.getAllPromises(null, GET_STORAGE_SYSTEM_PATH, true, null, objectTransformService.transformStorageSystem).then(function (result) {
            var storageSystems = result;
            var hasFileUsageBar = false;


             var dataModel = {
                view: 'tile',
                hasFileUsageBar: hasFileUsageBar,
                displayList: result,
                sameModelSelection: false,
                selectedVirtualModel: {},
                validationForm: {
                    serialNumber: ''
                },
                canGoNext: function () {
                    return true;
                },
                next: function () {
                    if(dataModel.sameModelSelection) {
                        dataModel.goNext();
                    }
                    else {
                        checkVirtualSerialNumber()
                            .then(dataModel.goNext)
                            .catch(openErrorDialog);
                    }


                },
                search: {
                    freeText: '',
                    freeCapacity: {
                        min: 0,
                        max: 1000,
                        unit: 'PB'
                    },
                    totalCapacity: {
                        min: 0,
                        max: 1000,
                        unit: 'PB'
                    },
                    hasMigrationTasks: null
                },
                sort: {
                    field: 'storageSystemId',
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
            };

            angular.extend(dataModel, viewModelService.newWizardViewModel(['addPhysicalStorageSystems', 'addVolumes', 'addHostGroups']));

            dataModel.VirtualModelCandidates = constantService.virtualModelOptions();


            //use _.range([start], stop, [step]) instead?
            var RAID500_600_700 = [1, 99999];
            var HM700 = [200001, 299999];
            var RAID800_850 = [300001, 399999];
            var HM800_850 = [400001, 499999];

            var vsmModelRange = {
                VSP_F900: HM800_850,
                VSP_G900: HM800_850,
                VSP_F700: HM800_850,
                VSP_G700: HM800_850,
                VSP_F370: HM800_850,
                VSP_G370: HM800_850,
                VSP_F350: HM800_850,
                VSP_G350: HM800_850,
                VSP_F800_AND_VSP_G800: HM800_850,
                VSP_F400_F600_AND_VSP_G400_G600: HM800_850,
                VSP_G200: HM800_850,
                HUS_VM: HM700,
                VSP_F1500_AND_VSP_G1000_G1500: HM800_850,
                VSP: RAID500_600_700,
                USP_VM: RAID500_600_700,
                USP_V: RAID500_600_700,
                NSC: RAID500_600_700,
                USP: RAID500_600_700
            };

            dataModel.vsmModelRange = vsmModelRange;


            $scope.dataModel = dataModel;


            scrollDataSourceBuilderServiceNew.setupDataLoader($scope, storageSystems, 'storageSystemSearch');

            var updateResultTotalCounts = function (result) {
                $scope.dataModel.nextToken = result.nextToken;
                $scope.dataModel.cachedList = result.resources;
                $scope.dataModel.displayList = result.resources.slice(0, scrollDataSourceBuilderServiceNew.showedPageSize);
                $scope.dataModel.itemCounts = {
                    filtered: $scope.dataModel.displayList.length,
                    total: $scope.dataModel.total
                };
            };

            var checkVirtualSerialNumber = function () {
                // var vsnRange = dataModel.placeholder;
                // var vsnInput = dataModel.serialNumber;
                // if(vsnInput<vsnRange[0] || vsnInput>vsnRange[1]) {
                //     return $q.reject('The Virtual Model or Serial Number can`t be the same');
                // }
                var selectedStorageSystemIds = _.map(dataModel.getSelectedItems(), function (storageSystems) {
                    return storageSystems.storageSystemId;
                });
                if(_.contains(selectedStorageSystemIds, dataModel.serialNumber)) {
                    return $q.reject('The Virtual Model or Serial Number can`t be the same');
                }
                return $q.resolve(true);
            };

            var openErrorDialog = function (messageKey) {
                if (_.isUndefined(messageKey)) {
                    return;
                }
                if (!_.isString(messageKey) && messageKey.message) {
                    messageKey = messageKey.message;
                } else if (!_.isString(messageKey) && messageKey.data && messageKey.data.message) {
                    messageKey = messageKey.data.message;
                }
                var modalInstance = $modal.open({
                    templateUrl: 'views/templates/error-modal.html',
                    windowClass: 'modal fade confirmation',
                    backdropClass: 'modal-backdrop',
                    controller: function ($scope) {
                        $scope.error = {
                            title: synchronousTranslateService.translate('error-message-title'),
                            message: synchronousTranslateService.translate(messageKey)
                        };
                        $scope.cancel = function () {
                            modalInstance.dismiss(synchronousTranslateService.translate('common-label-cancel'));
                        };

                        modalInstance.result.finally(function () {
                            modalInstance.dismiss(synchronousTranslateService.translate('common-label-cancel'));
                        });
                    }
                });
            };
        })

        //validation can be done by clicking next button


        $scope.$watch('dataModel.selectedVirtualModel', function () {
            if($scope.dataModel.selectedVirtualModel !== undefined) {
                var index = $scope.dataModel.selectedVirtualModel;
                $scope.dataModel.placeholder = $scope.dataModel.vsmModelRange[index];
            }
        }, true);


    })

    .directive('validateSerialNumber', function(validateIpService) {
        return {
            restrict: 'A',
            require: 'ngModel',
            link: function($scope, element, attr, ngModel) {
                function validateRange(range) {
                    return (range > 0 && range < 129);
                }

                function validateIP(value) {
                    //var splitIp = value.split('/');
                    var validRange = true;
                    var validIp = false;
                    // if (validateIpService.isIPv4(value)) {
                    //     $scope.dataModel.payload.ipv6 = false;
                    // }
                    // else if (validateIpService.isIPv6(_.first(splitIp))) {
                    //     $scope.dataModel.payload.ipv6 = true;
                    //     $scope.dataModel.payload.subnetMask = '';
                    //     validRange = ((splitIp.length === 2) && validateRange(_.last(splitIp)));
                    // }
                    // else {
                    //     validIp = false;
                    // }

                    ngModel.$setValidity('number', validIp);
                    // ngModel.$setValidity('range', validRange);

                    return value;
                }

                ngModel.$parsers.push(validateIP);
            }
        };
    });