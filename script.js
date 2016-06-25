(function () {
  'use strict';

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

  if (!isHostAllowed()) {
    return;
  } else if (isHostAllowed() && !isPathAllowed()) {
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