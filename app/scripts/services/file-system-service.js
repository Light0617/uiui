'use strict';

/**
 * @ngdoc service
 * @name rainierApp.diskSizeService
 * @description
 * # diskSizeService
 * Factory in the rainierApp.
 */
angular.module('rainierApp')
    .factory('fileSystemService', function (synchronousTranslateService, diskSizeService, orchestratorService) {
        return {
            getFormats: function () {
                return [synchronousTranslateService.translate('file-systems-virtual-machine'),
                    synchronousTranslateService.translate('file-systems-database')];
            },
            getUnits: function () {
                return [synchronousTranslateService.translate('common-gb'),
                    synchronousTranslateService.translate('common-tb')];
            },
            getFormatInKiloBytes: function (format) {
                if(format === synchronousTranslateService.translate('file-systems-database')){
                    return 32;
                }
                return 4;
            },
            getFormatLabel: function (format) {
                if(format === 32768){
                    return synchronousTranslateService.translate('file-systems-database');
                }
                return synchronousTranslateService.translate('file-systems-virtual-machine');
            },
            //TODO: EL Will have a call to get all ports eventually
            getVirtualFileServerPorts: function(){
                return ['ag1', 'ag2', 'ag3', 'ag4'];
            },
            getKeyAndColors: function(filePool, capacity, unit) {
                if(!capacity) {
                    capacity = 0;
                }
                var freeDisplaySize = diskSizeService.getDisplaySize(filePool.freeCapacity);
                return [{
                        key: capacity + ' ' + unit + ' Selected',
                            color: '#3D84F5'
                    },
                    {
                        key: Math.round(freeDisplaySize.size) + ' ' + freeDisplaySize.unit + ' Free',
                            color: '#1A2B45'
                    }]
                ;
            },
            autoSelectFilePool: function(filePools) {
                var maxCapacityFilePool = _.first(filePools);
                _.each(filePools, function(fp){
                   if(maxCapacityFilePool.freeCapacity < fp.freeCapacity){
                       maxCapacityFilePool = fp;
                   }
                });
                return maxCapacityFilePool;
            },
            getStoragePool: function(storageSystemId, storagePoolId){
                orchestratorService.storagePool(storageSystemId, storagePoolId).then(function (sp) {
                    return sp;
                });
            },
            getStoragePoolMapping: function(storageSystemId, filePools) {
                var filePoolMap = {};
                _.each(filePools, function(fp){
                    _.each(fp.links, function(link){
                        if(link.href.indexOf('storage-pools/') > -1){
                            var storagePoolId = _.last(link.href.split('storage-pools/'));
                           filePoolMap[storagePoolId] = _.union(filePoolMap[storagePoolId], [fp]);
                        }
                    });
                });
                return filePoolMap;
            },
            getFilePoolTierMapping: function(storageSystemId, filePools) {
                var filePoolMap = {};
                var tierList = [];
                _.each(filePools, function(fp){
                    var tiers = [];
                    _.each(fp.links, function(link){
                        if(link.href.indexOf('storage-pools/') > -1){
                            var storagePoolId = _.last(link.href.split('storage-pools/'));
                            var storagePool = this.getStoragePool(storageSystemId, storagePoolId);
                            tiers = _.union(tiers, [storagePool.tier]);

                        }
                    });
                    filePoolMap[fp] = tiers;
                    tierList = _.union(tierList, tiers);

                });
                return [filePoolMap, tierList];
            },
            getVirtualFileServerLink: function(links){
                return _.find(links, function(link){
                   return link.rel.indexOf('evs') !== -1;
                });
            }
        };
    });
