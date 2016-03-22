'use strict';

/**
 * @ngdoc service
 * @name rainierApp.viewModelService
 * @description
 * # viewModelService
 * Factory in the rainierApp.
 */
angular.module('rainierApp')
    .factory('viewModelService', function ($timeout, diskSizeService, objectTransformService) {

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

        function CreateVolumeModel(pools) {

            var self = this;
            var isHdt = function (type) {
                return type === 'HDT';
            };

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
            self.volumeGroupBuilder = function () {


                var template = {
                    noOfVolumes: 1,
                    label: null,
                    labelIsValid: true,
                    suffix: null,
                    disableTier: false,
                    tier: tiers[0],
                    size: {
                        value: 1,
                        unit: 'GB'
                    },
                    poolType: poolTypes[0],
                    pool: null
                };
                template.isSizeValid = function () {
                    var valid =
                        template.noOfVolumes && template.noOfVolumes > 0 &&

                        template.size && template.size.value && template.size.value > 0;
                    return valid;
                };
                template.valid = function () {

                    if (!template.isSizeValid() || template.labelIsValid === false) {
                        return false;
                    }

                    return template.pool || template.tier;
                };

                template.size.getDisplayText = function () {
                    return [template.size.value, template.size.unit].join(' ');
                };

                template.shouldDisableTier = function () {
                    return isHdt(template.poolType);
                };
                template.tierDisplayName = function () {
                    if (template.shouldDisableTier()) {
                        if (template.pool) {
                            return template.pool.tierNames;
                        }
                        return '';
                    }
                    return template.tier;
                };
                template.remove = function () {
                    _.remove(self.volumes, function (v) {
                        return v === template;
                    });
                };
                template.getPools = function () {
                    template.pools = self.getPoolsFoView(template);
                    return template.pools;
                };

                template.getTotalSize = function () {
                    if (template.isSizeValid()) {
                        return diskSizeService.createDisplaySize(parseInt(template.noOfVolumes) * parseInt(template.size.value), template.size.unit);
                    }
                    return diskSizeService.getDisplaySize(0);
                };
                return template;

            };


            self.add = function () {
                var cloned = self.volumeGroupBuilder();
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

                    return (p.type === template.poolType) && (tierDisabled || _.some(p.tiers, function (t) {
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

            self.mapToPayloads = function (vols) {
                return _.map(vols, function (vol) {
                    var poolId = null;
                    var poolType = vol.poolType;
                    if (vol.pool) {
                        poolId = vol.pool.storagePoolId;
                        poolType = null;
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
                        poolId: poolId
                    };
                });
            };

            self.isReady = true;
            self.add();

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
                    if (_.include(pt.attributes, 'TARGET_PORT')){
                        var p = angular.copy(pt);
                        p.selected = false;
                        return p;
                    }
                });
                s.selectablePorts = _.filter(s.selectablePorts, function (spt){
                        return spt;
                    }
                );
                s.selectableWWNs = _.map(s.wwpns, function (wwpn) {
                    return {
                        name: wwpn,
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
                        serverWwns: serverWwns,
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
                var summaryModel = objectTransformService.transformToStorageSummaryModel(selectedStorageSystem);

                summaryModel.noMoreInfo = true;
                var item = summaryModel.arrayDataVisualizationModel.items[0];
                item.index = 1;
                summaryModel.arrayDataVisualizationModel.items = [item];
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
