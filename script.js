(function () {
  'use strict';

  if (location.host !== "localhost:4502") {
    return;
  }

  function addScriptBrowserSync() {
    var script = document.createElement("script");

    script.setAttribute("async", "true");
    script.setAttribute("src", "http://" + location.hostname + ":3000/browser-sync/browser-sync-client.2.13.0.js");

    document.body.appendChild(script);
  }

  document.addEventListener("DOMContentLoaded", function () {
    addScriptBrowserSync();
  });
}());