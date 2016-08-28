/*global chrome, aemProductivityTools */
(function () {
  'use strict';

  /**
   * By injecting a unique code snippet, websites can see that the user is using this extension, and customize the UX
   */
  function injectIdentifier(version) {
    var element = document.createElement("div");

    element.setAttribute("id", "aem-front-extension");
    element.setAttribute("data-version", version);
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

  chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
    switch (message.task) {
    case "add-script":
      addScriptBrowserSync();
      break;
      //    case "add-identifier":
      //      document.addEventListener("DOMContentLoaded", function () {
      //        injectIdentifier(message.data);
      //      });
      //      break;
    }
  });

  document.addEventListener("DOMContentLoaded", function () {
    injectIdentifier(chrome.runtime.getManifest().version);
  });
}());