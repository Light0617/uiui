'use strict';

/**
 * @ngdoc service
 * @name rainierApp.storagePoolService
 * @description
 * # storagePoolService
 * Factory in the rainierApp.
 */
angular.module('rainierApp')
    .factory('storagePoolService', function (rainerColorRange, tiersColorRange) {
        function onOptionSelected(model, selectedTierName, diskSize) {
            if (!model || !model.diskSizesByTier || !selectedTierName) {
                return;
            }

            _.forEach(model.diskSizesByTier, function (tier) {
                if (tier.name === selectedTierName) {
                    tier.open = false;
                    tier.expanded = false;
                    tier.selectedSize = diskSize;
                }
                tier.disabled = false;
            });

            var selectedTiers = _.chain(model.diskSizesByTier)
                .where(function (item) {
                    var selectedSize = item.selectedSize;
                    return !_.isNull(selectedSize) && !_.isUndefined(selectedSize) && selectedSize.diskSize.size > 0;
                })
                .value();
            if (selectedTiers.length === 3) {
                _.chain(model.diskSizesByTier)
                    .difference(selectedTiers)
                    .forEach(function (tier) {
                        tier.disabled = true;
                    });
            }

        }

        function addKeyColor(keys) {
            var i;
            var keyAndColors = [];
            for (i = 0; i < keys.length; ++i) {
                keyAndColors.push({
                    key: keys[i],
                    color: tiersColorRange[i]
                });
            }

            return keyAndColors;
        }

        function convertTier(tier, model, diskSizeService, isUpdate){

            var uniqueValues = [];
            var uniqueSizes = {};
            var tierInPool = null;

            // During update, we want to show the tier size starting from the current size.
            // So we find the current size for the current tier and added to the returned disk size by tier.
            if (isUpdate) {
                for (var i = 0; i < model.tiers.length; ++i) {
                    if (model.tiers[i].tier === tier.name) {
                        tierInPool = model.tiers[i];
                        break;
                    }
                }
            }

            _.forEach(tier.templateSubTiers, function (subTier) {
                _.forEach(subTier.availableSizesInBytes, function (diskSize) {

                    // Add the current disk size of the current tier when needed.
                    if (tierInPool) {
                        diskSize = parseInt(diskSize) + parseInt(tierInPool.capacity);
                    }

                    if (!uniqueSizes[diskSize]) {
                        var cloned = _.cloneDeep(subTier);
                        uniqueSizes[diskSize] = true;
                        delete cloned.availableSizesInBytes;
                        cloned.diskSize = diskSizeService.getDisplaySize(diskSize);
                        uniqueValues.push(cloned);
                    }
                });
            });

            uniqueValues.push({
                diskSize: tierInPool ? diskSizeService.getDisplaySize(tierInPool.capacity) : diskSizeService.getDisplaySize(0)
            });

            var maxAvailableSizeForTier = _.max(uniqueValues, function (uv) {
                return uv.diskSize.value;
            }).diskSize;
            if (tierInPool){
                maxAvailableSizeForTier = diskSizeService.getDisplaySize(maxAvailableSizeForTier.value - tierInPool.capacity);
            }

            var mapped = {
                name: tier.name,
                disabled: false,
                expanded: false,
                currentCapacity: tierInPool ? tierInPool.capacity : null,
                selectedSize: tierInPool ? _.last(uniqueValues) : null,
                diskSizes: uniqueValues,
                maxAvailableSize: maxAvailableSizeForTier,
                onOptionSelected: function (diskSize) {
                    onOptionSelected(model, tier.name, diskSize);
                },
                toggleExpanded: function (currentTier, event) {
                    var target = angular.element(event.target);
                    currentTier.expanded = !currentTier.expanded;
                    if (currentTier.expanded) {
                        target.parent().parent().addClass('expanded');
                    } else {
                        target.parent().parent().removeClass('expanded');
                    }
                }
            };
            return mapped;
        }

        return {
            watchTemplateTypeWizard: function (model, vals, diskSizeService, isUpdate) {
                var poolTemplate = vals[0];
                var wizardType = vals[1];

                if (!poolTemplate || wizardType !== 'basic') {
                    return;
                }

                model.diskSizesByTier = _.map(poolTemplate.tiers, function(tier){
                    return convertTier(tier, model, diskSizeService, isUpdate);
                });
            },
            dataVizModelForBasic: function (model, diskSizesByTier, tierKeys, diskSizeService) {
                var keys = [];
                var selectedTiers = _.chain(diskSizesByTier)
                    .where(function (item) {
                        keys.push(item.name);
                        var selectedSize = item.selectedSize;
                        return !_.isNull(selectedSize) && !_.isUndefined(selectedSize) && selectedSize.diskSize.size > 0;
                    })
                    .value();

                var total = _.reduce(_.pluck(selectedTiers, 'selectedSize'), function (t, s) {
                    return t + s.diskSize.value;
                }, 0);

                var items = _.map(selectedTiers, function (item) {
                    return {
                        key: item.name,
                        used: {
                            capacity: diskSizeService.createDisplaySize(0, 'GB')
                        },
                        free: {
                            capacity: item.selectedSize.diskSize
                        }
                    };
                });
                if (model) {
                    model.selectedTiers = selectedTiers;
                }

                return {
                    keys: tierKeys || keys,
                    keyAndColors: addKeyColor(tierKeys || keys),
                    total: {
                        label: 'total',
                        capacity: diskSizeService.getDisplaySize(total)
                    },
                    items: items

                };

            },
            dataVizModelForAdvanced: function (model, pgs, diskSizeService) {
                if (!model || !pgs) {
                    return;
                }
                var items = {};
                var keysMap = {};
                var total = 0;
                var keys = [];
                var selectedPGs = [];
                var selectedPGObjects = [];
                model.activeFlashAllow = false;
                // [NEWRAIN-1392]--The following parity groups are too many. Need to find a way just pass in the needed
                // parity groups by the caller.
                _.forEach(_.union(pgs, model.inUseParityGroups), function (pg) {
                    var diskType = pg.diskSpec.type;
                    if (pg.selected) {
                        if(pg.diskSpec.type !== 'SAS') {
                            model.activeFlashAllowed = true;
                        }
                        var size;
                        if (!pg.inuse) {
                            selectedPGObjects.push(pg);
                            selectedPGs.push(pg.parityGroupId);
                            size = parseInt(pg.availableCapacityInBytes);
                        }
                        else {
                            size = parseInt(pg.totalCapacityInBytes);
                        }


                        total += size;

                        var diskTypeTotal = items[diskType];

                        if (diskTypeTotal) {
                            diskTypeTotal += size;
                        }
                        else {
                            diskTypeTotal = size;
                        }
                        items[diskType] = diskTypeTotal;

                    }
                    if (!keysMap[diskType]) {
                        keysMap[diskType] = true;
                        keys.push(diskType);
                    }
                });


                var capacities = [];
                for (var dt in items) {

                    capacities.push({
                        label: dt,
                        key: dt,
                        used: {
                            capacity: diskSizeService.createDisplaySize(0, 'GB')
                        },
                        free: {
                            capacity: diskSizeService.getDisplaySize(items[dt])
                        }

                    });
                }

                model.selectedParityGroups = selectedPGs;
                model.selectedParityGroupObjects = selectedPGObjects;

                return {
                    keys: keys,
                    keyAndColors: addKeyColor(keys),
                    total: {
                        label: 'total',
                        capacity: diskSizeService.getDisplaySize(total)
                    },
                    items: capacities

                };

            },
            filterParityGroups: function (parityGroups, diskSpeedToTier, pool) {
                if(pool && pool.type === 'HDP') {
                    return _.filter(parityGroups, function(pg) {
                       return (pg.status !== 'IN_USE' && pool.tierNames === diskSpeedToTier[pg.diskType]);
                    });
                }
                return _.filter(parityGroups, function(pg){
                    return (pg.status !== 'IN_USE');
                });
            }

        };
    });
