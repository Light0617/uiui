/**
 * Created by skawaguchi on 4/15/16.
 */
'use strict';

/**
 * @ngdoc service
 * @name rainierApp.linkLabelService
 * @description
 * # service to process uuids and replace them with name.
 * Factory in the rainierApp.
 */
angular.module('rainierApp')
    .factory('linkLabelService', function () {

        function changeVFSLink(link, uuid, fs, evsName) {
            if (uuid === fs.evsUuid) {
                link.label = 'VFS ' + evsName;
            }
        }

        return {
            replaceEVSUuidWithLabel: function (src, evses) {
                var allEvses = [];
                if(Array.isArray(evses)){
                    allEvses = evses;
                } else {
                    allEvses.push(evses);
                }
                return _.map(src, function (obj) {
                    _.forEach(obj.displayLinks, function (link) {
                        if (link.icon === 'icon-virtual-file-server') {
                            _.forEach(allEvses, function (evs) {
                                if (evs.uuid) {
                                    changeVFSLink(link, evs.uuid, obj, evs.name);
                                }
                                if (evs.evsUuid) {
                                    changeVFSLink(link, evs.evsUuid, obj, evs.name);
                                }
                            });
                        }
                    });
                    return obj;
                });
            },

            replaceFSIdWithLabel: function (src, fileSystems) {
                var allFileSystems = [];
                if(Array.isArray(fileSystems)){
                    allFileSystems = fileSystems;
                } else {
                    allFileSystems.push(fileSystems);
                }
                return _.map(src, function (obj) {
                    _.forEach(obj.displayLinks, function (link) {
                        if (link.icon === 'icon-filesystem') {
                            _.forEach(allFileSystems, function (fs) {
                                if(obj.fileSystemId) {
                                    if (fs.id === obj.fileSystemId) {
                                        link.label = 'File System ' + fs.label;
                                    }
                                }
                            });
                        }
                    });
                    return obj;
                });
            },

            replacePoolIdWithLabel: function (src, pools) {
                var allPools = [];
                if(Array.isArray(pools)){
                    allPools = pools;
                } else {
                    allPools.push(pools);
                }
                return _.map(src, function (obj) {
                    _.forEach(obj.displayLinks, function (link) {
                        if (link.icon === 'icon-pools') {
                            _.forEach(allPools, function (pool) {
                                if(obj.filePoolId) {
                                    if (pool.id === obj.filePoolId) {
                                        link.label = 'File Pool ' + pool.label;
                                    }
                                }
                            });
                        }
                    });
                    return obj;
                });
            }
        };
    });