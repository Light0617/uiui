'use strict';

/**
 * @ngdoc service
 * @name rainierApp.viewModelService
 * @description
 * # viewModelService
 * Factory in the rainierApp.
 */
angular.module('rainierApp')
    .factory('viewModelService', function ($timeout, diskSizeService, objectTransformService, wwnService, volumeService,
                                           synchronousTranslateService) {

        function WizardViewModel(pages) {
            var completedSteps = {};
            var self = this;
            self.currentPage = pages[0];
            self.isStepCompleted = function (page) {
                return completedSteps[page] === true;
            };
            self.isStepActive = function (page) {
                return self.currentPage === page;
            };
            self.isFirstStep = function () {
                return _.first(pages) === self.currentPage;
            };
            self.isLastStep = function () {
                return _.last(pages) === self.currentPage;
            };
            self.goNext = function () {
                completedSteps[self.currentPage] = true;
                if (self.isLastStep()) {
                    return;
                }
                var nextStep = pages[_.indexOf(pages, self.currentPage) + 1];
                self.currentPage = nextStep;
            };
            self.goBack = function () {
                if (self.isFirstStep()) {
                    return;
                }
                var nextStep = pages[_.indexOf(pages, self.currentPage) - 1];
                self.currentPage = nextStep;
            };

        }

        var dataSavingTypes = volumeService.getDkcDataSavingTypes().sort(function(a, b) {
            return a.value.length - b.value.length;
        });

        function CreateVolumeTemplate(createVolumeModel) {
            var self = this;

            self.$createVolumeModel = createVolumeModel;

            self.noOfVolumes = 1;
            self.label = null;
            self.labelIsValid= true;
            self.suffix = null;
            self.disableTier = false;
            self.tier = createVolumeModel.tiers[0];
            self.size = { value: 1, unit: createVolumeModel.$volumeSizeUnits[0] };
            self.poolType = createVolumeModel.poolTypes[0];
            self.pool = null;
            self.dataSavingTypeValue = null;

            self.copy = function () {
                var template = new CreateVolumeTemplate(self.$createVolumeModel);
                template.noOfVolumes = self.noOfVolumes;
                template.label = self.label;
                template.labelIsValid = self.labelIsValid;
                template.suffix = self.suffix;
                template.disableTier = self.disableTier;
                template.tier = self.tier;
                template.size.value = self.size.value;
                template.size.unit = self.size.unit;
                template.poolType = self.poolType;
                template.pool = self.pool;
                template.dataSavingTypeValue = self.dataSavingTypeValue;
                return template;
            };

            self.isSizeValid = function () {
                return self.noOfVolumes && self.noOfVolumes > 0 && self.size && self.size.value && self.size.value > 0;
            };

            self.valid = function () {
                return self.isSizeValid() && self.labelIsValid && (self.pool || self.tier);
            };

            self.size.getDisplayText = function () {
                return [self.size.value, self.size.unit].join(' ');
            };

            self.shouldDisableTier = function () {
                return self.poolType === 'HDT';
            };

            self.tierDisplayName = function () {
                if (self.shouldDisableTier()) {
                    return self.pool ? self.pool.tierNames : '';
                } else {
                    return self.tier;
                }
            };

            self.remove = function () {
                _.remove(self.$createVolumeModel.volumes, function (v) {
                    return v === self;
                });
            };

            self.getPools = function () {
                self.pools = self.$createVolumeModel.getPoolsFoView(self);
                return self.pools;
            };

            self.getTotalSize = function () {
                return self.isSizeValid() ?
                    diskSizeService.createDisplaySize(parseInt(self.noOfVolumes) * parseInt(self.size.value), self.size.unit) :
                    diskSizeService.getDisplaySize(0);
            };

            self.getDataSavingTypes = function () {
                var type = (self.pool ? self.pool.type : self.poolType);
                return dataSavingTypes.slice(1, type === 'HDP' ? 3 : 1);
            };
        }

        function newCreateVolumeTemplateBuilder(createVolumeModel) {
            var builder = new CreateVolumeTemplate(createVolumeModel);

            builder.$autoSelectPoolLabel = synchronousTranslateService.translate('common-auto-selected');

            builder.getDataSavingTypes = function () {
                var type = (builder.pool ? builder.pool.type : builder.poolType);
                return dataSavingTypes.slice(0, type === 'HDP' ? 3 : 1);
            };

            builder.setSizeUnit = function(unit) {
                builder.size.unit = unit;
            };

            builder.setPoolType = function(pt) {
                builder.poolType = pt;
                builder.setPool(null);
            };

            builder.setTier = function(tier) {
                builder.tier = tier;
                builder.setPool(null);
            };

            builder.getPoolLabel = function() {
                return builder.pool ? builder.pool.poolLabel : builder.$autoSelectPoolLabel;
            };

            builder.setPool = function(p) {
                builder.pool = p;
                builder.setDataSavingTypeValue(builder.dataSavingTypeValue);
            };

            builder.autoSelectPool = function() {
                builder.setPool(null);
            };

            builder.getDataSavingType = function () {
                return _.find(dataSavingTypes, function(type) {
                    // replace null with 'NONE'
                    var value = (builder.dataSavingTypeValue ? builder.dataSavingTypeValue : dataSavingTypes[0].value);
                    return type.value === value;
                });
            };

            builder.setDataSavingTypeValue = function(value) {
                function isValid(value) {
                    return _.some(builder.getDataSavingTypes(), function(type) {
                        return type.value === value;
                    });
                }
                // replace 'NONE' with null and then replace [value] not included in currently selectable saving types.
                builder.dataSavingTypeValue = (value !== dataSavingTypes[0].value && isValid(value) ? value : null);
            };

            return builder;
        }

        function CreateVolumeModel(pools) {

            var self = this;

            self.$volumeSizeUnits = volumeService.getVolumeSizeUnits();

            var poolLabelFunction = function (pool) {

                return [
                    pool.label, '(',
                    pool.capacityInBytes.size, ' ',
                    pool.capacityInBytes.unit, '/',
                    pool.availableCapacityInBytes.size, ' ',
                    pool.availableCapacityInBytes.unit, ')'
                ].join('');
            };

            var poolTypes = [];
            var uniquePoolTypes = {};
            var uniqueTiers = {};
            var validPools = [];
            var tiers = [];

            _.forEach(pools, function (pool) {
                var poolType = pool.type;
                if (poolType === 'HTI') {
                    return;
                }


                pool.poolLabel = poolLabelFunction(pool);
                validPools.push(pool);
                if (!uniquePoolTypes[poolType]) {
                    uniquePoolTypes[poolType] = true;
                    poolTypes.push(poolType);
                }

                _.forEach(pool.tiers, function (t) {
                    var tier = t.tier;
                    if (!uniqueTiers[tier]) {
                        uniqueTiers[tier] = true;
                        tiers.push(tier);
                    }

                });
            });

            self.poolTypes = poolTypes;
            self.poolType = poolTypes[0];
            self.tiers = tiers;
            self.volumes = [];
            self.template = newCreateVolumeTemplateBuilder(self);

            self.add = function () {
                var cloned = self.template.copy();
                $timeout(function () {
                    self.volumes.splice(0, 0, cloned);
                });

            };

            self.isValid = function () {
                if (self.volumes.length === 0) {
                    return false;
                }
                var allValid = _.every(self.volumes, function (vol) {
                    return vol.valid();
                });
                return allValid;
            };


            self.getPoolsFoView = function (template) {

                var tierDisabled = template.shouldDisableTier();
                return _.where(validPools, function (p) {

                    return (p.label.indexOf('HSA-reserved-')===-1) && (p.type === template.poolType) && (tierDisabled || _.some(p.tiers, function (t) {
                        return t.tier === template.tier;
                    }));
                });
            };

            self.getVolumeGroups = function () {
                if (!self.isValid()) {
                    return [];
                }
                return self.volumes;
            };

            self.mapToPayloads = function (vols, autoSelectedPoolId) {
                return _.map(vols, function (vol) {
                    var poolId = autoSelectedPoolId !== undefined ? autoSelectedPoolId : null;
                    var poolType = vol.poolType;
                    if (vol.pool) {
                        poolId = vol.pool.storagePoolId;
                    }

                    if (!vol.shouldDisableTier()) {
                        poolType = vol.tier;
                    }

                    return {
                        poolType: poolType,
                        numberOfVolumes: vol.noOfVolumes,
                        label: vol.label === '' ? null : vol.label,
                        suffix: vol.suffix,
                        capacity: diskSizeService.createDisplaySize(vol.size.value, vol.size.unit).value.toString(),
                        poolId: poolId,
                        dkcDataSavingType: vol.dataSavingTypeValue
                    };
                });
            };

            self.isReady = true;
        }


        function ServerPortMapperModel(ports, servers) {

            var self = this;

            self.servers = _.map(servers, function (svr) {
                var s = angular.copy(svr);
                s.portsFilter = {
                    storagePortId: ''
                };
                s.wwnFilter = {
                    name: ''
                };
                s.selected = false;
                s.selectablePorts = _.map(ports, function (pt) {
                    if (_.include(pt.attributes, 'Target')){
                        var p = angular.copy(pt);
                        p.selected = false;
                        return p;
                    }
                });
                s.selectablePorts = _.filter(s.selectablePorts, function (spt){
                        return spt;
                    }
                );
                s.selectableWWNs = _.map(s.displayWWNs, function (wwn) {
                    return {
                        name: wwn,
                        selected: false
                    };
                });
                s.selectablePorts.sort(function (a, b) {
                    var storagePortIdOfA = a.storagePortId;
                    var storagePortIdOfB = b.storagePortId;
                    // Extract number form port id
                    var numberPartOfA = parseInt(storagePortIdOfA.substring(storagePortIdOfA.indexOf('L')+1, storagePortIdOfA.indexOf('-')));
                    var numberPartOfB = parseInt(storagePortIdOfB.substring(storagePortIdOfB.indexOf('L')+1, storagePortIdOfB.indexOf('-')));
                    // Extract suffix letter form port id
                    var letterPartOfA = storagePortIdOfA.substring(storagePortIdOfA.indexOf('-')+1);
                    var letterPartOfB = storagePortIdOfB.substring(storagePortIdOfB.indexOf('-')+1);
                    if (numberPartOfA === numberPartOfB) {
                        return letterPartOfA > letterPartOfB ? 1 : letterPartOfA < letterPartOfB ? -1 : 0;
                    }
                    return numberPartOfA > numberPartOfB ? 1 : numberPartOfA < numberPartOfB ? -1 : 0;
                });

                return s;

            });

            self.getPorts = function () {
                return _.map(self.servers, function (s) {

                    var serverWwns = [];
                    var portIds = [];
                    _.forEach(s.selectablePorts, function (p) {
                        if (p.selected) {
                            portIds.push(p.storagePortId);
                        }
                    });

                    _.forEach(s.selectableWWNs, function (p) {
                        if (p.selected) {
                            serverWwns.push(p.name);
                        }
                    });

                    return {
                        serverId: s.serverId,
                        serverWwns: wwnService.rawWWNs(serverWwns),
                        portIds: portIds
                    };
                });
            };
        }

        function SubscriptionUpdateModel() {
            var lastStorageSystemId = null;
            var lastSubscribedCapacity = null;
            var self = this;

            self.getUpdatedModel = function (storageSystem, volumeGroups) {
                if (!storageSystem || !volumeGroups) {
                    return null;
                }
                var arrayCopy = angular.copy(storageSystem);
                var subscribedCapacity = parseInt(arrayCopy.subscribedCapacity);
                var unmodifiedTotal = arrayCopy.total.value;

                _.forEach(volumeGroups, function (g) {
                    var size = g.getTotalSize();
                    subscribedCapacity += size.value;
                });


                arrayCopy.subscribedCapacityPercentage = Math.round(parseInt(subscribedCapacity) * 100 / unmodifiedTotal);
                arrayCopy.subscribedCapacity = subscribedCapacity;
                if (lastStorageSystemId) {
                    if (lastStorageSystemId === arrayCopy.storageSystemId && subscribedCapacity === lastSubscribedCapacity) {
                        return null;
                    }
                } else {
                    lastStorageSystemId = arrayCopy.storageSystemId;
                }
                lastSubscribedCapacity = subscribedCapacity;
                return arrayCopy;
            };

        }

        function ScheduleModel() {
            var self = this;
            var timeRange = [];

            function pad(num, size) {
                var s = num + '';
                while (s.length < size) {
                    s = '0' + s;
                }
                return s;
            }

            _.forEach(_.range(1, 13), function (h) {
                _.forEach(_.range(0, 60, 5), function (t) {
                    var timeString = pad(h, 2) + ':' + pad(t, 2);
                    timeRange.push(timeString + ' AM');
                    timeRange.push(timeString + ' PM');
                });
            });
            var dayRange = _.range(1, 32);

            self.type = 'hour';
            self.hourStartMinute = 0;
            self.hourInterval = 1;
            self.daysOfMonth = dayRange;
            self.dayOfMonth = dayRange[0];
            self.times = timeRange;
            self.day = {};

            var d = new Date();
            d.setHours(24);
            d.setMinutes(0);
            self.time = d;

            self.isValid = function () {
                var validSchedule = true;
                if (self.type === 'hour') {
                    validSchedule = (self.hourStartMinute >= 0 && self.hourStartMinute <= 59) && self.hourInterval >=1;
                 }
                if (self.type === 'week') {

                    var selectedDays = [];
                    for (var day in self.day) {
                        if (self.day[day]) {
                            selectedDays.push(day);
                        }
                    }
                    validSchedule = validSchedule && selectedDays.length > 0;
                    self.selectedDays = selectedDays;
                }

                if (self.type === 'month') {

                    validSchedule = validSchedule && _.some(self.daysOfMonth, function (d) {
                        return self.dayOfMonth === d;
                    });
                }
                return validSchedule;
            };

            self.toScheduleString = function () {
                if (!self.isValid()) {
                    return null;
                }
                var parts = ['Every', self.type];
                switch (self.type) {
                    case 'week':
                        parts.push('on');
                        parts.push(self.selectedDays.join(','));
                        break;
                    case 'month':
                        parts.push('on');
                        parts.push(self.dayOfMonth);
                        break;

                }
                parts.push('at');
                parts.push(getTimeString(self.time));

                return parts.join(' ');
            };
        }

        function getTimeString(time) {
            var hourData = time.toString().split(':');
            return (hourData[0].substring(hourData[0].length - 2)).concat(':').concat(hourData[1]);
        }


        return {
            newWizardViewModel: function (pages) {
                return new WizardViewModel(pages);
            },
            newCreateVolumeModel: function (pools) {
                return new CreateVolumeModel(pools);
            },

            newServerPortMapperModel: function (ports, servers) {
                return new ServerPortMapperModel(ports, servers);
            },
            buildSummaryModel: function (selectedStorageSystem) {
                var summaryModel = objectTransformService.transformToCreateVolumeSummaryModel(selectedStorageSystem);

                summaryModel.noMoreInfo = true;
                return summaryModel;
            },

            buildLunResources: function (vols) {
                return _.map(vols, function (v) {
                    var lun = parseInt(v.lun);
                    if (!_.isFinite(lun)) {
                        lun = null;
                    }

                    return {
                        volumeId: v.volumeId,
                        lun: lun
                    };
                });
            },
            newSubscriptionUpdateModel: function () {
                return new SubscriptionUpdateModel();
            },

            newScheduleModel: function () {
                return new ScheduleModel();
            }
        };
    });
