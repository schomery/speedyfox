'use strict';

var sp = require('sdk/simple-prefs');
var unload = require('sdk/system/unload');
var {Cc, Ci} = require('chrome');
var prefService = Cc['@mozilla.org/preferences-service;1']
  .getService(Ci.nsIPrefService);
var prefs = (function () {
  var p = require('sdk/preferences/service');
  return {
    get: function (name) {
      try {
        return p.get(name);
      } catch (e) {console.error(e);}
      return false;
    },
    set: function (name, val) {
      try {
        p.set(name, val);
      } catch (e) {console.error(e);}
    },
    reset: function (name) {
      p.reset(name);
    }
  };
})();

function observe (pref, callback) {
  var branch = prefService.getBranch(pref);
  var observer = {
    observe: function () {
      callback(pref);
    }
  };
  branch.addObserver('', observer, false);
  unload.when(function () {
    branch.removeObserver('', observer);
  });
}

[
  'network.http.pipelining',
  'network.http.pipelining.abtest',
  'network.http.pipelining.aggressive',
  'network.http.pipelining.max-optimistic-requests',
  'network.http.pipelining.maxrequests',
  'network.http.pipelining.maxsize',
  'network.http.pipelining.read-timeout',
  'network.http.pipelining.reschedule-on-timeout',
  'network.http.pipelining.reschedule-timeout',
  'network.http.pipelining.ssl',
  'network.http.proxy.pipelining',
  'network.http.max-connections',
  'network.http.max-persistent-connections-per-proxy',
  'network.http.max-persistent-connections-per-server',
  'network.http.redirection-limit',
  'network.http.fast-fallback-to-IPv4',
  'network.dns.disablePrefetch',
  'network.prefetch-next',
  'browser.cache.use_new_backend'
].forEach(function (pref) {
  sp.prefs[pref] = prefs.get(pref);
  observe(pref, function (p) {
    sp.prefs[p] = prefs.get(p);
  });
  sp.on(pref, function (p) {
    prefs.set(p, sp.prefs[p]);
  });
});
