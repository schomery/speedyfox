'use strict';

var sp = require('sdk/simple-prefs');
var self = require('sdk/self');
var timers = require('sdk/timers');
var tabs = require('sdk/tabs');
var unload = require('sdk/system/unload');
var {Ci, Cc, Cu} = require('chrome');

var {Services} = Cu.import('resource://gre/modules/Services.jsm');

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

var list = {
  'network.http.pipelining': true,
  'network.http.pipelining.abtest': false,
  'network.http.pipelining.aggressive': true,
  'network.http.pipelining.max-optimistic-requests': 3,
  'network.http.pipelining.maxrequests': 12,
  'network.http.pipelining.maxsize': 300000,
  'network.http.pipelining.read-timeout': 60000,
  'network.http.pipelining.reschedule-on-timeout': true,
  'network.http.pipelining.reschedule-timeout': 15000,
  'network.http.pipelining.ssl': true,
  'network.http.proxy.pipelining': true,
  'network.http.max-connections': 256,
  'network.http.max-persistent-connections-per-proxy': 256,
  'network.http.max-persistent-connections-per-server': 6,
  'network.http.redirection-limit': 20,
  'network.http.speculative-parallel-limit': 0,
  'network.http.fast-fallback-to-IPv4': true,
  'network.dns.disablePrefetch': true,
  'network.prefetch-next': false,
  'browser.cache.use_new_backend': 1,
  'nglayout.initialpaint.delay': 0
};

if (sp.prefs.welcome === undefined) {
  sp.prefs.welcome = true;
}
exports.main = function (options) {
  if (options.loadReason === 'install') {
    let tmp = [];
    for (let p in list) {
      tmp.push([p, prefs.get(p)]);
    }
    sp.prefs.backup = JSON.stringify(tmp);
  }
  if (options.loadReason === 'install' || options.loadReason === 'startup') {
    let version = sp.prefs.version;
    if (self.version !== version) {
      if (sp.prefs.welcome) {
        timers.setTimeout(function () {
          tabs.open(
            'http://firefox.add0n.com/speed-tweaks.html?v=' + self.version +
            (version ? '&p=' + version + '&type=upgrade' : '&type=install')
          );
        }, 3000);
      }
      sp.prefs.version = self.version;
    }
  }
};
exports.onUnload = function (reason) {
  if ((reason === 'uninstall' || reason === 'disable') && sp.prefs.backup) {
    let doit = Services.prompt.confirm(
      null,
      'Speed Tweaks (SpeedyFox)',
      'Would you like me to revert all the preferences back to their previous state?'
    );
    if (doit) {
      JSON.parse(sp.prefs.backup).forEach(arr => prefs.set(arr[0], arr[1]));
    }
  }
};

(function (observer) {
  Services.obs.addObserver(observer, 'isteaks', false);
  unload.when(function () {
    Services.obs.removeObserver(observer, 'isteaks', false);
  });
})({
  observe: function (aSubject, aTopic, aData) {
    if (aTopic === 'isteaks' && aData === 'reset-control') {
      for (let p in list) {
        prefs.reset(p);
      }
      sp.prefs.welcome = true;
    }
    if (aTopic === 'isteaks' && aData === 'recommended-control') {
      for (let p in list) {
        prefs.set(p, list[p]);
      }
      sp.prefs.welcome = true;
    }
    if (aTopic === 'isteaks' && aData === 'clear-cache') {
      let cacheService = Cc['@mozilla.org/network/cache-service;1']
        .getService(Ci.nsICacheService);

      try {
        cacheService.evictEntries(Ci.nsICache.STORE_IN_MEMORY);
        cacheService.evictEntries(Ci.nsICache.STORE_ON_DISK);
      }
      catch (e) {}
      try {
        Cc['@mozilla.org/netwerk/cache-storage-service;1']
          .getService(Ci.nsICacheStorageService)
          .clear();
      }
      catch (e) {}
    }
    if (aTopic === 'isteaks' && aData === 'faq-control') {
      tabs.open('http://firefox.add0n.com/speed-tweaks.html?type=m');
    }
    if (aTopic === 'isteaks' && aData === 'support-control') {
      tabs.open('https://github.com/schomery/speedyfox/issues');
    }
  }
});
