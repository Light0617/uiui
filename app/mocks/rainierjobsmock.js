'use strict';

rainierAppMock.factory('rainierJobsMock', function (mockUtils) {
    var preVirtualizeKey = 'preVirtualize';

    var preVirtualizeCount = 2;
    var preVirtualizeJobs = function () {
        preVirtualizeCount--;
        var job = {
            jobId: preVirtualizeKey
        };
        if (preVirtualizeCount) {
            return _.extend(job, {
                status: 'IN_PROGRESS'
            });
        } else {
            preVirtualizeCount = 2;
            return _.extend(job, {
                status: 'SUCCESS'
                // TODO some reports are expected
            });
        }
    };

    var target = function (urlResult) {
        if (urlResult) {
            return preVirtualizeJobs;
        }
        return false;
    };

    var handle = function (urlResult) {
        var fn = target(urlResult);
        if (fn) {
            return mockUtils.response.ok(fn());
        }
        return mockUtils.response.notFound('unable to find job');
    };

    return {
        target: target,
        handle: handle
    };
});
