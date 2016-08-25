'use strict';

/**
 * @ngdoc service
 * @name rainierApp.attachVolumeService
 * @description
 * # attachVolumeService
 * Factory in the rainierApp.
 */
angular.module('rainierApp')
    .factory('attachVolumeService', function () {
        function updateHostModeOptions(hostModeOptions, dataModel) {
            dataModel.attachModel.selectedHostModeOption = hostModeOptions;
            dataModel.attachModel.lastSelectedHostModeOption = dataModel.attachModel.selectedHostModeOption;
        }

        function difference(array1, array2) {
            if (array1.length > array2) {
                return _.difference(array1, array2)[0];
            } else {
                return _.difference(array2, array1)[0];
            }
        }

        //Function to check if all hostmode options match, if not return default host mode option
        var getMatchedHostModeOption = function(hostGroups) {
            var defaultHostModeOption = [999];
            var selectedHostModeOptions = defaultHostModeOption;
            if (hostGroups !== null && hostGroups !== undefined && hostGroups.length > 0) {
                selectedHostModeOptions = hostGroups[0].hostModeOptions;
                for (var i = 1; i < hostGroups.length; i++) {
                    var hostGroup = hostGroups[i];
                    if (hostGroup.hostModeOptions.length !== selectedHostModeOptions.length) {
                        return defaultHostModeOption;
                    } else {
                        for (var j = 0; j < hostGroup.hostModeOptions.length; j++) {
                            if (!isHostModeOptionFound(hostGroup.hostModeOptions[j], selectedHostModeOptions)) {
                                return defaultHostModeOption;
                            }
                        }
                    }
                }
            }
            //address the case where host mode option = [] in host group, then set to default.
            if (selectedHostModeOptions.length === 0) {
                selectedHostModeOptions = defaultHostModeOption;
            }
            return selectedHostModeOptions;
        };

        var isHostModeOptionFound = function(hostModeOption, selectedHostModeOptions) {
            for (var k = 0; k < selectedHostModeOptions.length; k++) {
                if (hostModeOption === selectedHostModeOptions[k]) {
                    return true;
                }
            }
            return false;
        };

        var getSelectedServerWwpns = function(selectedServers) {
            var serverWwpns = [];
            if (selectedServers !== null && selectedServers !== undefined) {
                for (var i = 0; i < selectedServers.length; i++) {
                    var selectedServer = selectedServers[i];
                    for (var j = 0; j < selectedServer.wwpns.length; j++) {
                        serverWwpns.push(selectedServer.wwpns[j]);
                    }
                }
            }
            return serverWwpns;
        };

        var getMatchedHostMode = function(hostGroups, autoSelectHostMode) {
            var selectedHostMode = autoSelectHostMode;
            if (hostGroups !== null && hostGroups !== undefined && hostGroups.length > 0) {
                selectedHostMode = hostGroups[0].hostMode;
                for (var i = 1; i < hostGroups.length; i++) {
                    if (hostGroups[i].hostMode !== selectedHostMode) {
                        //if the hostmode does not match then use auto select
                        return autoSelectHostMode;
                    }
                }

            }
            return selectedHostMode;
        };

        return {
            checkSelectedHostModeOptions: function (dataModel) {
                var selectedHostModeOptions = dataModel.attachModel.selectedHostModeOption;
                var recentlySelected = difference(dataModel.attachModel.lastSelectedHostModeOption, selectedHostModeOptions);
                if (selectedHostModeOptions.length === 0) {
                    updateHostModeOptions([], dataModel);
                } else if (recentlySelected === 999 || (!_.isNull(selectedHostModeOptions) && !_.isEmpty(selectedHostModeOptions) && selectedHostModeOptions.length === 1 && selectedHostModeOptions[0] === 999)) {
                    updateHostModeOptions([999], dataModel);
                } else {
                    updateHostModeOptions(_.without(selectedHostModeOptions, 999), dataModel);
                }
            },

            // Used to set hostModeOption to empty array for backend API to auto select the options
            getSelectedHostMode: function (dataModel) {
                var selectedHostModeByUser = dataModel.attachModel.selectedHostModeOption;
                if (_.find(selectedHostModeByUser, function (mode) { return mode === 999; })) {
                    return null;
                } else {
                    return _.where(selectedHostModeByUser, function (mode) {
                        return (mode !== 999);
                    });
                }
            },
            getMatchedHostModeOption: getMatchedHostModeOption,
            getSelectedServerWwpns: getSelectedServerWwpns,
            getMatchedHostMode: getMatchedHostMode
        };
    });