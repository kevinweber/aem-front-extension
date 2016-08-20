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

    //    console.debug("Identifier element injected.");
  }

  function addScriptBrowserSync() {
    var script = document.createElement("script");

    script.setAttribute("id", "aem-front-script");
    script.setAttribute("async", "true");
    script.setAttribute("src", "http://" + location.hostname + ":3000/browser-sync/browser-sync-client.2.14.0.js");

    document.body.appendChild(script);

    //    console.debug("BrowserSync script injected.");
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
    });
  });

  chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
    switch (message) {
    case "add-script":
      addScriptBrowserSync();
      break;
    }
  });
}());