'use strict';

/**
 * @ngdoc function
 * @name rainierApp.controller:StorageSystemSettingsCtrl
 * @description
 * # StorageSystemSettingsCtrl
 * Controller of the rainierApp
 */
angular.module('rainierApp')
    .controller('StorageSystemSettingsCtrl', function ($routeParams, $timeout, $filter, $location, orchestratorService, diskSizeService) {
        var vm = this;

        vm.timeZones = [];
        vm.licenseKeys = '';
        vm.showIndicator = true;
        vm.forceHideIndicator = false;
        vm.originalCommonSettings = {};
        vm.originalDateTime = {};
        vm.originalEmail = {};
        vm.originalSmtp = {};
        vm.originalSnmp = {};
        vm.originalLicenseModel = {};
        vm.selected = {
            display: null,
            key: null};

        vm.updateIndicator = function () {
            return !(vm.commonData && vm.dateData && vm.alertData && vm.licenseData) && !vm.forceHideIndicator;
        };

        vm.handleIndicator = function () {
            vm.forceHideIndicator = true;
            vm.showIndicator = vm.updateIndicator();
        };
        function loadCommonSettings() {
            return orchestratorService.commonSettings($routeParams.storageSystemId).then(function (result) {
                vm.commonSettings = {};
                vm.commonSettings.storageSystemName = result.storageSystemName;
                vm.commonSettings.contact = result.contact;
                vm.commonSettings.location = result.location;
                vm.commonData = true;
                vm.showIndicator = vm.updateIndicator();
                vm.originalCommonSettings = _.cloneDeep(vm.commonSettings);
            }, function () {
                vm.handleIndicator();
            });
        }

        function loadDateTime() {
            return orchestratorService.dateTime($routeParams.storageSystemId).then(function (result) {
                formatDateTime(result);
                vm.dateData = true;
                vm.showIndicator = vm.updateIndicator();

                vm.originalDateTime.selected = _.cloneDeep(vm.selected);
                vm.originalDateTime.dt = _.cloneDeep(vm.dt);
                vm.originalDateTime.ntpServers = vm.ntpServers;
            }, function () {
                vm.handleIndicator();
            });
        }

        function loadTimeZones() {
            return orchestratorService.timeZones($routeParams.storageSystemId).then(function (result) {
                var zones = result.timeZones;
                vm.timeZones = vm.timeZones.concat(zones);

            }, function () {
                vm.handleIndicator();
            });
        }

        function loadAlertNotifications() {
            return orchestratorService.alertNotifications($routeParams.storageSystemId).then(function (result) {
                vm.email = result.email;
                var recipientStr = '';
                _.forEach(result.email.recipients, function (recipient) {
                    recipientStr += recipientStr === '' ? '' : ';';
                    recipientStr += recipient;
                });
                vm.email.recipients = recipientStr;
                vm.smtp = result.smtp;
                vm.snmp = result.snmp;
                vm.alertData = true;
                vm.showIndicator = vm.updateIndicator();

                vm.originalEmail = _.cloneDeep(vm.email);
                vm.originalSmtp = _.cloneDeep(vm.smtp);
                vm.originalSnmp = _.cloneDeep(vm.snmp);
            }, function () {
                vm.handleIndicator();
            });
        }

        function loadLicenses() {
            return orchestratorService.licenses($routeParams.storageSystemId).then(function (result) {
                formatLicenses(result.licenses);
                vm.licenseData = true;
                vm.showIndicator = vm.updateIndicator();

                vm.originalLicenseModel = _.cloneDeep(vm.licenseModel);
            }, function () {
                vm.handleIndicator();
            });
        }

        loadCommonSettings()
            .then(loadTimeZones)
            .then(loadDateTime)
            .then(loadAlertNotifications)
            .then(loadLicenses);

        vm.sort = {
            field: 'productName',
            reverse: false,
            setSort: function (f) {
                $timeout(function () {
                    if (vm.sort.field === f) {
                        vm.sort.reverse = !vm.sort.reverse;
                    } else {
                        vm.sort.field = f;
                        vm.sort.reverse = false;
                    }
                });
            }
        };

        vm.currentStep = 0;
        vm.steps = [
            {
                id: 'common',
                text: 'Common',
                status: 'active',
                iconStep: 'icon-circle-no-fill',
                content: 'in active'
            },
            {
                id: 'time-zone',
                text: 'Time-Zones',
                status: '',
                iconStep: 'icon-circle-no-fill',
                content: ''
            },
            {
                id: 'licenses',
                text: 'Licenses',
                status: '',
                iconStep: 'icon-circle-no-fill',
                content: ''
            },
            {
                id: 'notification',
                text: 'Notification',
                status: '',
                iconStep: 'icon-circle-no-fill',
                content: ''
            }
        ];

        vm.nextClass = 'enabled';
        vm.prevClass = 'disabled';

        vm.nextStep = function (currentIndex, isNext) {
            vm.steps[currentIndex].status = 'completed';
            vm.steps[currentIndex].iconStep = 'icon-checkmark-no-fill';
            vm.steps[currentIndex].content = '';

            var newIndex = isNext ? currentIndex + 1 : currentIndex - 1;
            vm.steps[newIndex].status = 'active';
            vm.steps[newIndex].content = 'active in';
            vm.steps[newIndex].iconStep = 'icon-circle-no-fill';

            if (vm.currentStep === 0) {
                vm.prevClass = 'disabled';
            } else {
                vm.prevClass = 'enabled';
            }

            if (vm.currentStep === 3) {
                vm.nextClass = 'disabled';
            } else {
                vm.nextClass = 'enabled';
            }
        };

        vm.activateStep = function () {
            vm.nextStep(vm.currentStep++, true);
        };

        vm.activateCertainStep = function (step) {
            if ((vm.currentStep === 0 && vm.commonSettingsInvalid()) ||
                (vm.currentStep === 1 && vm.timeZoneSettingInvalid())) {
                return;
            }

            vm.steps[vm.currentStep].status = 'completed';
            vm.steps[vm.currentStep].iconStep = 'icon-checkmark-no-fill';
            vm.steps[vm.currentStep].content = '';

            vm.steps[step].status = 'active';
            vm.steps[step].content = 'active in';
            vm.steps[step].iconStep = 'icon-circle-no-fill';

            vm.currentStep = step;
            if (vm.currentStep === 0) {
                vm.prevClass = 'disabled';
            } else {
                vm.prevClass = 'enabled';
            }

            if (vm.currentStep === 3) {
                vm.nextClass = 'disabled';
            } else {
                vm.nextClass = 'enabled';
            }
        };

        vm.activatePrevStep = function () {
            vm.nextStep(vm.currentStep--, false);
        };

        vm.open = function ($event) {
            $event.preventDefault();
            $event.stopPropagation();

            vm.opened = true;
        };

        function formatLicenses(licenses) {
            vm.licenseModel = [];
            _.forEach(licenses, function (license) {
                var displayLicense = {};
                var licenseCapacity = '';
                displayLicense.productName = license.productName;
                displayLicense.status = license.installed ? 'Installed' : 'Not Installed';
                if (license.licenseCapacity) {
                    licenseCapacity += license.licenseCapacity.permitted.unlimited ? 'Unlimited' : 'Limited';
                    if (license.licenseCapacity.permitted.value) {
                        licenseCapacity += ' Capacity: ' + diskSizeService.getDisplaySize(license.licenseCapacity.permitted.value).size + ' ' +
                            diskSizeService.getDisplaySize(license.licenseCapacity.permitted.value).unit;
                    }
                    licenseCapacity += ', Used Capacity: ' + diskSizeService.getDisplaySize(license.licenseCapacity.usedCapacity).size + ' ' +
                        diskSizeService.getDisplaySize(license.licenseCapacity.usedCapacity).unit;
                    displayLicense.licenseCapacity = licenseCapacity;
                }
                vm.licenseModel.push(displayLicense);
            });
        }

        function formatDateTime(dateTime) {
            vm.selected = _.find(vm.timeZones, function (zones) {
                return dateTime.timeZone === zones.key;
            });

            // If current time zone setting on storage system is not supported or corrupted
            // we will default to nothing and user must select
            if (!checkValueValidity(vm.selected)) {
                vm.selected = {
                    display: '',
                    key: ''
                };
            }

            // Since storage system returns time in UTC
            // We need to apply an offset it with the selected time zone before displaying to user
            // We also need to keep track of old time zone in case user updated it later
            vm.currentSelected = _.cloneDeep(vm.selected);
            var timeInMSec = dateTime.time * 1000 + getLocalTimeOffSet(vm.selected);
            var systemDate = new Date(timeInMSec);
            vm.dt = systemDate;

            var ntpServersStr = '';
            _.forEach(dateTime.ntp.ntpServers, function (ntpServer) {
                ntpServersStr += ntpServersStr === '' ? '' : ',';
                ntpServersStr += ntpServer;
            });
            vm.ntpServers = ntpServersStr;
        }

        // To offset UTC to selected time zone, we take
        // 1000 msec/sec * 60 sec/min * 60 mins/hour = 3600000 * offsetHour
        // and add the result to the UTC time.  Note: this value can be positive or negative
        function getLocalTimeOffSet(timeZone) {
            var localTimeOffsetSign = 1;
            var localTimeOffsetValue = 0;

            // Regex to find +/-HH:MM in string
            var pattern = new RegExp('([\\+\\-])(\\d{2}):(\\d{2})');
            var parsedUTCOffSet = pattern.exec(timeZone.display);

            // Note: parsedUTCOffSet[0] is always the full string
            if (parsedUTCOffSet && parsedUTCOffSet.length === 4) {
                if (parsedUTCOffSet[1] !== undefined && parsedUTCOffSet[1] === '-') {
                    localTimeOffsetSign = -1;
                }

                if (parsedUTCOffSet[2] !== undefined) {
                    localTimeOffsetValue = localTimeOffsetValue + parseInt(parsedUTCOffSet[2]);
                }

                if (parsedUTCOffSet[3] !== undefined && parsedUTCOffSet[3] === '30') {
                    localTimeOffsetValue = localTimeOffsetValue + 0.5;
                }
            }
            return (localTimeOffsetSign * localTimeOffsetValue * 3600000);
        }

        // If user updated time zone, we need to revert old applied time zone and apply new time zone
        // Using vm.currentSelected to keep tracked of old applied time zone since vm.selected will be updated
        // when user select new timezone on dropdown
        vm.updateDisplayTime = function () {
            if (vm.currentSelected !== undefined && vm.dt !== undefined) {
                var newTimeInMSec = vm.dt.getTime();
                if (vm.currentSelected.display !== vm.selected.display) {
                    newTimeInMSec = newTimeInMSec - getLocalTimeOffSet(vm.currentSelected) + getLocalTimeOffSet(vm.selected);
                    vm.currentSelected = _.cloneDeep(vm.selected);
                }
                vm.dt = new Date(newTimeInMSec);
            }
        };

        function buildCommonSettings() {
            var commonSettingsPayload = {};
            commonSettingsPayload.storageSystemName = vm.commonSettings.storageSystemName !== undefined ? vm.commonSettings.storageSystemName : '';
            commonSettingsPayload.contact = vm.commonSettings.contact !== undefined ? vm.commonSettings.contact : '';
            commonSettingsPayload.location = vm.commonSettings.location !== undefined ? vm.commonSettings.location : '';
            return commonSettingsPayload;
        }

        function unformatDateTime() {
            var payload = {};
            payload.timeZone = vm.selected.key;

            // Since storage system takes UTC time back, we need to revert the offset applied when displaying to user
            payload.time = (vm.dt.getTime() - getLocalTimeOffSet(vm.selected)) / 1000;

            var ntp = {};
            if (vm.ntpServers === undefined || vm.ntpServers.length === 0) {
                ntp.ntpServers = [];
            } else {
                ntp.ntpServers = vm.ntpServers.split(',');
            }
            if (ntp.ntpServers.length === 0) {
                ntp.enabled = false;
            } else {
                ntp.enabled = true;
            }
            payload.ntp = ntp;
            return payload;
        }

        function buildLicenseKeys() {
            var licenses = {};
            licenses.licenseKeys = [];
            if (vm.licenseKeys !== '') {
                licenses.licenseKeys = vm.licenseKeys.split(',');
            }
            return licenses;
        }

        function buildNotificationPayload() {
            var payload = {};
            payload.email = vm.email;
            payload.email.recipients = vm.email.recipients.split(';');
            payload.smtp = vm.smtp;
            if (payload.smtp.username === '' && payload.smtp.password === '') {
                payload.smtp.enabled = false;
            } else {
                payload.smtp.enabled = true;
            }
            buildTrapDestinationPayload();
            payload.snmp = vm.snmp;
            return payload;
        }

        function exitWizard() {
            $location.path('/storage-systems/' + $routeParams.storageSystemId);
        }

        function buildTrapDestinationPayload() {
            var payloads = [];
            _.forEach(vm.snmp.trapDestinations, function (eachTrap) {
                if (!_.isEmpty(eachTrap.community) && !_.isEmpty(eachTrap.ipAddress)) {
                    var payload = {
                        community: eachTrap.community.toUpperCase(),
                        ipAddress: eachTrap.ipAddress
                    };
                    payloads.push(payload);
                }
            });
            vm.snmp.trapDestinations = payloads;
        }

        vm.sortItems = function () {
            vm.licenseModel = $filter('orderBy')(vm.licenseModel, vm.sort.field, vm.sort.reverse);
            vm.snmp.trapDestinations = $filter('orderBy')(vm.snmp.trapDestinations, vm.sort.field, vm.sort.reverse);
        };

        function isCommonSettingsChanged() {
            if (checkValueValidity(vm.commonSettings)) {
                return (checkValueChanged(vm.commonSettings.storageSystemName, vm.originalCommonSettings.storageSystemName) ||
                    checkValueChanged(vm.commonSettings.contact, vm.originalCommonSettings.contact) ||
                    checkValueChanged(vm.commonSettings.location, vm.originalCommonSettings.location));
            }
            return false;
        }

        function isTimeZonesChanged() {
            if (checkValueValidity(vm.selected) && checkValueValidity(vm.dt) && checkValueValidity(vm.ntpServers)) {
                return (checkValueChanged(vm.selected.key, vm.originalDateTime.selected.key) ||
                    checkValueChanged(vm.dt.getTime(), vm.originalDateTime.dt.getTime()) ||
                    checkValueChanged(vm.ntpServers, vm.originalDateTime.ntpServers));
            }
            return false;
        }

        function isLicensesChanged() {
            if (vm.licenseKeys) {
                return true;
            }
            return false;
        }

        function isAlertNotificationsChanged() {
            var emailCheck = false;
            var smtpCheck = false;
            var snmpCheck = false;
            if (checkValueValidity(vm.email)) {
                emailCheck =  (checkValueChanged(vm.email.recipients, vm.originalEmail.recipients) ||
                    checkValueChanged(vm.email.from, vm.originalEmail.from) ||
                    checkValueChanged(vm.email.mailServer, vm.originalEmail.mailServer));
            }

            if (checkValueValidity(vm.smtp)) {
                smtpCheck = (checkValueChanged(vm.smtp.username, vm.originalSmtp.username) ||
                    checkValueChanged(vm.smtp.password, vm.originalSmtp.password));
            }

            if (checkValueValidity(vm.snmp) &&
                checkValueValidity(vm.snmp.trapDestinations) &&
                checkValueValidity(vm.originalSnmp.trapDestinations)) {
                if (checkValueChanged(vm.snmp.trapDestinations.length, vm.originalSnmp.trapDestinations.length)) {
                    snmpCheck = true;
                } else {
                    for (var i = 0; i < vm.originalSnmp.trapDestinations.length; ++i) {
                        var originalSnmpItem = vm.originalSnmp.trapDestinations[i];
                        var snmpItem = vm.snmp.trapDestinations[i];
                        if (originalSnmpItem.community !== snmpItem.community ||
                            originalSnmpItem.ipAddress !== snmpItem.ipAddress) {
                            snmpCheck = true;
                        }
                    }
                }
            }
            return emailCheck || smtpCheck || snmpCheck;
        }

        // method is used to check parameter is undefined or null, ignoring empty string
        // returns true if original value is different and current value
        function checkValueChanged(currentValue, originalValue) {
            // if currentValue is NOT undefined or null, this means either
            // 1. API returned result successfully
            // 2. user updated the field in UI
            if (checkValueValidity(currentValue)) {
                // if originalValue is NOT undefined or null, this means
                // API call was successful and can be used to compared to currentValue
                if (checkValueValidity(originalValue)) {
                    return (currentValue !== originalValue);
                } else {
                    return true;
                }
            } else {
                return false;
            }
        }

        function checkValueValidity(value) {
            return (!_.isUndefined(value) && !_.isNull(value));
        }

        vm.submit = function () {
            if (isCommonSettingsChanged()) {
                orchestratorService.updateCommonSettings($routeParams.storageSystemId, buildCommonSettings());
            }
            if (isTimeZonesChanged()) {
                orchestratorService.updateDateTime($routeParams.storageSystemId, unformatDateTime());
            }
            if (isLicensesChanged()) {
                orchestratorService.updateLicenses($routeParams.storageSystemId, buildLicenseKeys());
            }
            if (isAlertNotificationsChanged()) {
                orchestratorService.updateAlertNotifications($routeParams.storageSystemId, buildNotificationPayload());
            }
            exitWizard();
        };

        vm.cancel = function () {
            exitWizard();
        };

        vm.addNewTrapDest = function () {
            var trapDest = {
                community: '',
                ipAddress: ''
            };
            vm.snmp.trapDestinations.push(trapDest);
        };

        vm.checkCurrentPageInvalid = function () {
            return ((vm.currentStep === 0 && vm.commonSettingsInvalid()) || (vm.currentStep === 1 && vm.timeZoneSettingInvalid()));
        };

        vm.commonSettingsInvalid = function () {
            return vm.commonSettings && _.isEmpty(vm.commonSettings.storageSystemName);
        };

        vm.timeZoneSettingInvalid = function () {
            if ((vm.dt / 1000 > 0) && !_.isEmpty(vm.selected.display) && !_.isEmpty(vm.selected.key)) {
                return false;
            }
            return true;
        };

    });
