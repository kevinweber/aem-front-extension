/*global chrome, aemProductivityTools */
(function () {
  'use strict';

  var extension = aemProductivityTools,
    defaults = extension.defaults,
    storage;

  /**
   * By injecting a unique code snippet, websites can see that the user is using this extension, and customize the UX
   */
  function injectIdentifier() {
    var element = document.createElement("div");
    element.setAttribute("id", "aem-front-extension");
    element.setAttribute("data-version", defaults.STATIC.extensionVersion);
    element.style.display = 'none';
    document.body.appendChild(element);
  }
  
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
    script.setAttribute("src", "http://" + location.hostname + ":3000/browser-sync/browser-sync-client.2.14.0.js");

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

  function loadStorage() {
    chrome.storage.sync.get(defaults, function (obj) {
      storage = obj;

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
    injectIdentifier();
    
    window.requestAnimationFrame(function () {
      loadStorage();
      window.requestAnimationFrame(initBrowserSync);
    });
  });
}());