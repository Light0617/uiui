'use strict';

/**
 * @ngdoc service
 * @name rainierApp.filePoolService
 * @description
 * # filePoolService
 * Factory in the rainierApp.
 */
angular.module('rainierApp')
    .factory('filePoolService', function (rainerColorRange, tiersColorRange, diskSizeService) {
        function onOptionSelected(selectedTier, diskSize, model, option) {
            var platinum = _.first(model.diskSizesByTier).name;
            var checked = diskSize.checked;
            if(selectedTier.name === platinum) {
                var platinumTier = _.first(model.diskSizesByTier);
                _.forEach(platinumTier.diskSizes, function (diskSize) {
                    diskSize.checked = false;
                });
                if(checked) {
                    diskSize.checked = false;
                    platinumTier.selectedSize = '';
                    model.selectedPlatinumCapacity = null;
                }
                else {
                    model.selectedPlatinumCapacity = diskSize;
                    option.selectedSize = diskSize.requestedCapacity;
                    diskSize.checked = true;
                }
            }
            else {
                _.forEach(model.diskSizesByTier, function (tier) {
                    if (tier.name !== platinum) {
                        tier.selectedSize = '';
                    }
                    _.forEach(tier.diskSizes, function (diskSize) {
                        if (tier.name !== platinum) {
                            diskSize.checked = false;
                        }
                    });
                });
                if(checked) {
                    diskSize.checked = false;
                    model.selectedCapacity = null;
                }
                else {
                    model.selectedCapacity = diskSize;
                    option.selectedSize = diskSize.requestedCapacity;
                    diskSize.checked = true;
                }
            }
        }

        function nearestPow2(n){
            return Math.ceil(Math.log(n)/Math.log(2));
        }

        function getNumberOfHDDs(driveCapacity, requestedCapacity) {
                return Math.ceil(driveCapacity / requestedCapacity);
        }

        function getBestIops(numOfSD, overCommitTarget, queueDepth, totalTagCapability) {
            var bestIop = -1;
            var iopPotential;
            var prevNumOfSD = -1;
            var capacity = 8796093022208;
            while(capacity < 70368744177665) {
                numOfSD = nearestPow2(overCommitTarget / capacity);
                if(numOfSD < 4) {
                    numOfSD = 4;
                }
                else if(numOfSD > 32) {
                    numOfSD = 32;
                }
                if(prevNumOfSD === numOfSD) {
                    return bestIop;
                }
                iopPotential = numOfSD * queueDepth;
                if(totalTagCapability >= iopPotential) {
                    return iopPotential;
                }
                else if(bestIop === -1 || bestIop > iopPotential) {
                    prevNumOfSD = numOfSD;
                    bestIop = iopPotential;
                }
                capacity += 2199023255552;
            }
            return bestIop;
        }

        function getMaxTags(driveType, speed) {
            if(driveType.indexOf('FMD') > -1) {
                return 64;
            }
            else if(driveType.indexOf('SSD') > -1) {
                return 16;
            }
            else if(speed === '10000' || speed === '15000') {
                return 8;
            }
            return 4;
        }

        function getQueueDepth(driveType) {
            if(driveType.indexOf('FMD') > -1) {
                return 256;
            }
            else if(driveType.indexOf('SSD') > -1) {
                return 256;
            }
            return 32;
        }

        function convertTier(tier, diskSizeService){

            var uniqueValues = [];
            var uniqueSizes = {};
            var tierInPool = null;

            _.forEach(tier.templateSubTiers, function (subTier) {
                _.forEach(subTier.availableSizesInBytes, function (capacity) {
                    if (!uniqueSizes[capacity]) {
                        var template = {};
                        template.capacity = diskSizeService.getDisplaySize(subTier.capacity);
                        template.diskType = subTier.diskType;
                        template.raidLevel = subTier.raidLevel;
                        template.raidLayout = subTier.raidLayout;
                        template.speed = subTier.speed;
                        template.requestedCapacity = diskSizeService.getDisplaySize(capacity);
                        template.name = tier.name;
                        template.checked = false;
                        uniqueSizes[capacity] = true;
                        uniqueValues.push(template);
                    }
                });
            });

            var maxAvailableSizeForTier = _.max(uniqueValues, function (uv) { return uv.requestedCapacity.value;});
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
                maxAvailableSize: maxAvailableSizeForTier.requestedCapacity,
                onOptionSelected: function (diskSize, model, option) {
                    onOptionSelected(tier, diskSize, model, option);
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
            watchTemplateTypeWizard: function (model, poolTemplate, diskSizeService) {
                if (!poolTemplate) {
                    return;
                }

                model.diskSizesByTier = _.map(poolTemplate.tiers, function(tier){
                    return convertTier(tier, diskSizeService);
                });
            },
            calculateIops: function (vals, subscriptionLimit, platinumName) {
                var numOfDrives;
                var numOfParities;
                var splitRaidLayout;
                var numOfSD;
                var numOfHDDs;
                var totalTagCapability;
                var overCommitTarget;
                var queueDepth;
                var iopPotential;
                var iopList = [0, 0];
                _.each(vals, function(val) {
                    if(val) {
                        splitRaidLayout = val.raidLayout.split('D+');
                        numOfParities = _.last(splitRaidLayout).replace('P', '');
                        numOfDrives = _.first(splitRaidLayout);
                        numOfHDDs = getNumberOfHDDs(val.capacity.value, val.requestedCapacity.value);
                        totalTagCapability = numOfHDDs * getMaxTags(val.diskType, val.speed);
                        overCommitTarget = numOfParities * val.capacity.value * (subscriptionLimit / 100);
                        queueDepth = getQueueDepth(val.diskType);
                        iopPotential = getBestIops(numOfSD, overCommitTarget, queueDepth, totalTagCapability);
                        if(val.name === platinumName) {
                            iopList[1] = iopPotential;
                        }
                        else {
                            iopList[0] = iopPotential;
                        }
                    }
                });
                return iopList;
            },
            getKeyAndColors: function(item){
                var usedDisplaySize = diskSizeService.getDisplaySize(_.first(item).capacity.value);
                var freeDisplaySize = diskSizeService.getDisplaySize(_.last(item).capacity.value);
                return [{
                    key: Math.round(usedDisplaySize.size) + ' ' + usedDisplaySize.unit + ' Physical Block Pool Capacity',
                    color: '#3D84F5'
                },
                    {
                        key: Math.round(freeDisplaySize.size) + ' ' + freeDisplaySize.unit + ' Estimated File Over Commit Capacity',
                        color: '#1A2B45'
                    }]
                    ;
            },
            uncheckSelection: function (model){
            _.forEach(model.diskSizesByTier, function (tier) {
                tier.selectedSize = '';
                _.forEach(tier.diskSizes, function (diskSize) {
                    diskSize.checked = false;
                });
            });
            model.selectedCapacity = '';
            model.selectedPlatinumCapacity = '';
            }

        };
    });
