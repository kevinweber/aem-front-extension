/*global chrome, aemProductivityTools */
(function () {
  'use strict';

  var extension = aemProductivityTools,
    defaults = extension.defaults,
    storage;

  /**
   * All BrowserSync-related functions
   */
  function isHostAllowed() {
    return location.host === "localhost:4502";
  }

  function isPathAllowed() {
    var path,
      allowedPaths,
      i,
      l;

    path = location.pathname;
    allowedPaths = ["/content", "/cf#", "/editor.html"];

    for (i = 0, l = allowedPaths.length; i < l; i += 1) {
      if (path.substring(0, allowedPaths[i].length) === allowedPaths[i]) {
        return true;
      }
    }

    return false;
  }

  function addScriptBrowserSync() {
    var script = document.createElement("script");

    script.setAttribute("async", "true");
    script.setAttribute("src", "http://" + location.hostname + ":3000/browser-sync/browser-sync-client.2.13.0.js");

    document.body.appendChild(script);

    // Helpful for testing/debugging:
    // console.log("BrowserSync script is injected");
  }

  function initBrowserSync() {
    if (isHostAllowed() && !storage) {
      addScriptBrowserSync();
      return;
    } else if (!isHostAllowed() || !storage || storage.browserSync.isDisabled) {
      return;
    } else if (isHostAllowed() && !isPathAllowed()) {
      return;
    }

    addScriptBrowserSync();
  }

  function setCurrentLocation() {
    storage.location = {};
    storage.location.href = location.href;
    storage.location.origin = location.origin;
    storage.location.pathname = location.pathname;
    storage.location.search = location.search;

    extension.updateStorage(storage);
  }

  function loadStorage() {
    chrome.storage.sync.get(defaults, function (obj) {
      storage = obj;

      setCurrentLocation();

      // Helpful for testing/debugging:
      // console.table(storage);
    });

    // Helpful for testing/debugging:
    // extension.clearStorage();
  }

  /**
   * Initiate everything
   */
  document.addEventListener("DOMContentLoaded", function () {
    window.requestAnimationFrame(function () {
      loadStorage();
      window.requestAnimationFrame(initBrowserSync);
    });
  });
}());