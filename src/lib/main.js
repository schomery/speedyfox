'use strict';

var sp = require('sdk/simple-prefs');
var self = require('sdk/self');
var timers = require('sdk/timers');
var timers = require('sdk/timers');
var tabs = require('sdk/tabs');
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

var list = [
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
  'network.http.speculative-parallel-limit',
  'network.http.fast-fallback-to-IPv4',
  'network.dns.disablePrefetch',
  'network.prefetch-next',
  'browser.cache.use_new_backend'
];
var values = [true, false, true, 3, 12, 300000, 60000, true, 15000, true, true, 256, 256, 6, 20, 0, false, true, false, 1];

list.forEach(function (pref) {
  sp.prefs[pref] = prefs.get(pref);
  observe(pref, function (p) {
    sp.prefs[p] = prefs.get(p);
  });
  sp.on(pref, function (p) {
    prefs.set(p, sp.prefs[p]);
  });
});

exports.main = function (options) {
  if (options.loadReason === 'install' || options.loadReason === 'startup') {
    var version = sp.prefs.version;
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

sp.on('reset-control', function () {
  list.forEach(prefs.reset);
  sp.prefs.welcome = true;
});
sp.on('recommended-control', function () {
  list.forEach((p, i) => prefs.set(p, values[i]));
  sp.prefs.welcome = true;
});
sp.on('faq-control', function () {
  tabs.open('http://firefox.add0n.com/speed-tweaks.html?type=m');
});
sp.on('support-control', function () {
  tabs.open('https://github.com/schomery/speedyfox/issues');
});
