'use strict';

rainierAppMock.factory('authMock', function($window, mockUtils) {
    //var tokenHeader = 'x-auth-token';
    var auth = {
        token: '449d72b0-0f12-43c8-9dba-c528cc0585b9',
        username: 'sysadmin'
    };

    var refreshSessionStorage = function() {
        $window.sessionStorage.mockAuthToken = auth.token;
    };

    /*var verifyToken = function(urlResult) {
        return (auth.token && urlResult.headers && urlResult.headers[tokenHeader] && urlResult.headers[tokenHeader] === auth.token);
    };*/

    var login = function(urlResult) {
        if (urlResult.headers && urlResult.headers.Authorization && urlResult.headers.Authorization.indexOf('Basic ') === 0) {
            if (urlResult.headers.Authorization === 'Basic eHh4Onh4eA==') { // username: xxx, password: xxx - simulate incorrect credentials
                return mockUtils.response.unauthorized();
            }
            if (urlResult.headers.Authorization === 'Basic eXl5Onl5eQ==') { // username: yyy, password: yyy - simulate bad request
                return mockUtils.response.badRequest();
            } else {
                auth.token = mockUtils.uuid();
                refreshSessionStorage();

                var headers = {
                    'X-Auth-Token': auth.token
                };
                return [200, '', headers];
            }
        }
        return mockUtils.response.badRequest();
    };

    var logout = function() {
        auth.token = '';
        refreshSessionStorage();
        return [200, '', {}];
    };

    var getToken = function() {
        return [200, {
                'token': {
                    user: {
                        name: auth.username + '@start123.com'
                    }
                }

        }, {}];
    };

    return {
        init: function() {
            if ($window.sessionStorage.mockAuthToken) {
                auth.token = $window.sessionStorage.mockAuthToken;
            }
        },
        getMock: function() {
            return auth;
        },
        authenticateAndCall: function(urlResult, callThrough, paginated) {
            return callThrough(urlResult, paginated);
            /*
            if (verifyToken(urlResult) && callThrough) {
                return callThrough(urlResult);
            } else {
                return mockUtils.response.unauthorized();
            }
            */
        },
        handle: function(urlResult) {
            switch (urlResult.method) {
                case 'GET':
                    return this.authenticateAndCall(urlResult, getToken);
                case 'POST':
                    return login(urlResult);
                case 'DELETE':
                    return this.authenticateAndCall(urlResult, logout);
            }
        }
    };
});
