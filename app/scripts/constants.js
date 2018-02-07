'use strict';

angular.module('rainierApp').constant('STORAGE_SYSTEM_VOLUMES_LIST_HEADER_COLUMNS', [
        {
            sort: false,
            styles: 'col-lg-1 col-md-1 col-sm-1 col-xs-1 cell panel-title center'
        },
        {
            sort: false,
            styles: 'col-lg-1 col-md-1 col-sm-1 col-xs-1 cell with-icon center-content'
        },
        {
            titleKey: 'storage-volume-id',
            sort: true,
            sortProperty: 'volumeId',
            styles: 'col-lg-1 col-md-1 col-sm-1 col-xs-1 ellipsis cell td'
        },
        {
            titleKey: 'storage-systems-serial-number',
            sort: true,
            sortProperty: 'displayStorageSystemId',
            styles: 'col-lg-1 col-md-1 col-sm-1 col-xs-1 ellipsis cell td'
        },
        {
            titleKey: 'common-name',
            sort: true,
            sortProperty: 'label',
            styles: 'col-lg-1 col-md-1 col-sm-1 col-xs-1 ellipsis cell td'
        },
        {
            titleKey: 'data-protection-type',
            sort: true,
            sortProperty: 'displayedDpType',
            styles: 'col-lg-1 col-md-1 col-sm-1 col-xs-1 ellipsis cell td'
        },
        {
            titleKey: 'data-protection-status',
            sort: true,
            sortProperty: 'dpMonitoringStatus',
            styles: 'col-lg-1 col-md-1 col-sm-1 col-xs-1 ellipsis cell td'
        },
        {
            titleKey: 'common-label-total',
            sort: true,
            sortProperty: 'totalCapacity.value',
            styles: 'col-lg-1 col-md-1 col-sm-1 col-xs-1 ellipsis cell td'
        },
        {
            titleKey: 'common-label-free',
            sort: true,
            sortProperty: 'availableCapacity.value',
            styles: 'col-lg-1 col-md-1 col-sm-1 col-xs-1 ellipsis cell td'
        },
        {
            titleKey: 'common-label-used',
            sort: true,
            sortProperty: 'usedCapacity.value',
            styles: 'col-lg-1 col-md-1 col-sm-1 col-xs-1 ellipsis cell td'
        }
    ])
    .constant('GET_STORAGE_SYSTEM_VOLUMES_RESOURCES_FUNCTION', function (result) {
        return result.volumes;
    });
