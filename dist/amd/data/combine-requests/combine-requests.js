/*can-connect@1.0.20#data/combine-requests/combine-requests*/
define(function (require, exports, module) {
    var connect = require('../../can-connect');
    var canSet = require('can-set');
    var getItems = require('../../helpers/get-items');
    var deepAssign = require('can-util/js/deep-assign');
    var makeDeferred = require('../../helpers/deferred');
    var forEach = [].forEach;
    module.exports = connect.behavior('data/combine-requests', function (baseConnection) {
        var pendingRequests;
        return {
            unionPendingRequests: function (pendingRequests) {
                var self = this;
                pendingRequests.sort(function (pReq1, pReq2) {
                    if (canSet.subset(pReq1.set, pReq2.set, self.algebra)) {
                        return 1;
                    } else if (canSet.subset(pReq2.set, pReq1.set, self.algebra)) {
                        return -1;
                    } else {
                        return 0;
                    }
                });
                var combineData = [];
                var current;
                doubleLoop(pendingRequests, {
                    start: function (pendingRequest) {
                        current = {
                            set: pendingRequest.set,
                            pendingRequests: [pendingRequest]
                        };
                        combineData.push(current);
                    },
                    iterate: function (pendingRequest) {
                        var combined = canSet.union(current.set, pendingRequest.set, self.algebra);
                        if (combined) {
                            current.set = combined;
                            current.pendingRequests.push(pendingRequest);
                            return true;
                        }
                    }
                });
                return Promise.resolve(combineData);
            },
            getSubset: function (set, unionSet, data) {
                return canSet.getSubset(set, unionSet, data, this.algebra);
            },
            time: 1,
            getListData: function (set) {
                set = set || {};
                var self = this;
                if (!pendingRequests) {
                    pendingRequests = [];
                    setTimeout(function () {
                        var combineDataPromise = self.unionPendingRequests(pendingRequests);
                        pendingRequests = null;
                        combineDataPromise.then(function (combinedData) {
                            forEach.call(combinedData, function (combined) {
                                var combinedSet = deepAssign({}, combined.set);
                                baseConnection.getListData(combinedSet).then(function (data) {
                                    if (combined.pendingRequests.length === 1) {
                                        combined.pendingRequests[0].deferred.resolve(data);
                                    } else {
                                        forEach.call(combined.pendingRequests, function (pending) {
                                            pending.deferred.resolve({ data: self.getSubset(pending.set, combined.set, getItems(data)) });
                                        });
                                    }
                                }, function (err) {
                                    if (combined.pendingRequests.length === 1) {
                                        combined.pendingRequests[0].deferred.reject(err);
                                    } else {
                                        forEach.call(combined.pendingRequests, function (pending) {
                                            pending.deferred.reject(err);
                                        });
                                    }
                                });
                            });
                        });
                    }, this.time || 1);
                }
                var deferred = makeDeferred();
                pendingRequests.push({
                    deferred: deferred,
                    set: set
                });
                return deferred.promise;
            }
        };
    });
    var doubleLoop = function (arr, callbacks) {
        var i = 0;
        while (i < arr.length) {
            callbacks.start(arr[i]);
            var j = i + 1;
            while (j < arr.length) {
                if (callbacks.iterate(arr[j]) === true) {
                    arr.splice(j, 1);
                } else {
                    j++;
                }
            }
            i++;
        }
    };
});
//# sourceMappingURL=combine-requests.js.map