/*
 * ========================================================================
 *
 * Copyright (c) by Hitachi Vantara, 2018. All rights reserved.
 *
 * ========================================================================
 */

'use strict';

rainierAppMock.factory('commonMock', function () {
    return {
        randomChar: function () {
            return _.sample('ABCDEFGHIJKLMOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz.'.split(''));
        },
        randomHex: function () {
            return _.sample('0123456789ABCDEF'.split(''));
        },
        getWwn: function (num) {
            if (_.isUndefined(num)) {
                num = 0;
            }
            var maxNum = parseInt('FFFFFFFFFFFFFFFF', 16);
            var dec = _.random(0, maxNum - num);

            dec = dec + num;
            var hex = dec.toString(16).toUpperCase();
            if (hex.length !== 16) {
                _.range(0, 16 - hex.length).forEach(function () {
                    hex = '0' + hex;
                });
            }

            return hex;
        },
        getWwns: function () {
            var rand = _.random(1, 5);
            var wwnList = _.range(0, rand).map(this.getWwn);
            return wwnList;
        },
        getIscsiName: function (isEui) {
            var eui = _.isUndefined(isEui) ? _.sample([true, false]) : isEui;
            if (eui) {
                return 'eui.' + _.range(0, 16).map(this.randomHex).join('');
            } else {
                // max length would be 223
                return 'iqn.' + _.range(0, 100).map(this.randomChar).join('');
            }
        },
        getIscsiNameByIndex: function (index) {
            return 'iqn.' + index;
        },
        getIscsiNames: function () {
            var list = [];
            var rand = _.random(2, 2);
            var eui = _.sample([false, true]);
            for (var i = 1; i <= rand; i++) {
                list.push(this.getIscsiName(eui));
            }
            return list;
        },
    };
});
