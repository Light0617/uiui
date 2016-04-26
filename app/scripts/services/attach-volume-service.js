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
            }
        };
    });