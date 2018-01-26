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
        randomChar: function() {
            return _.sample('ABCDEFGHIJKLMOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz.'.split(''));
        },
        getRandomWWN: function (num) {
            if(_.isUndefined(num)) {
                num = 0;
            }
            var maxNum = parseInt('FFFFFFFFFFFFFFFF', 16);
            var dec = _.random(0, maxNum - num);

            dec = dec + num;
            var hex = dec.toString(16).toUpperCase();
            if(hex.length!==16) {
                _.range(0, 16 - hex.length).forEach(function(){
                    hex = '0' + hex;
                });
            }

            return hex;
        },
        getWWN: function () {
            var rand = _.random(1, 5);
            var wwnList = _.range(0, rand).map(this.getRandomWWN);
            return wwnList;
        },
        getIscsiNames: function () {
            var list = [];
            var rand = _.random(2,2);
            for(var i=1; i<=rand; i++) {
                // max length 223
                const name = 'iqn.' + _.range(0, 100).map(this.randomChar).join('');
                list.push(name);
            }
            return list;
        },
    };
});
