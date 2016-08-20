// Background Page
// Documentation: https://developer.chrome.com/extensions/event_pages
(function () {
  'use strict';

  function splitUrl(url) {
    var parseUrl = /^(?:([A-Za-z]+):)?(\/{0,3})([0-9.\-A-Za-z]+)(?::(\d+))?(?:\/([^?#]*))?(?:\?([^#]*))?(?:#(.*))?$/,
      result = parseUrl.exec(url),
      names = ['url', 'scheme', 'slash', 'host', 'port', 'path', 'query', 'hash'],
      urlObject = {},
      i,
      l;

    for (i = 0, l = result.length; i < l; i += 1) {
      urlObject[names[i]] = result[i];
    }

    return urlObject;
  }

  function isValidPath(path) {
    var allowedPaths,
      i,
      l;

    allowedPaths = ["content/", "cf#", "editor.html"];

    for (i = 0, l = allowedPaths.length; i < l; i += 1) {
      if (path.substring(0, allowedPaths[i].length) === allowedPaths[i]) {
        return true;
      }
    }

    return false;
  }

  function isValidUrl(url) {
    var urlObject = splitUrl(url);

    if (urlObject.host !== "localhost") {
      return;
    }

    if (urlObject.port !== "4502") {
      return;
    }

    if (!isValidPath(urlObject.path)) {
      return;
    }

    return true;
  }

  //  function initBrowserSync() {
  //    if (isHostAllowed() && !storage) {
  //      addScriptBrowserSync();
  //      return;
  //    } else if (!isHostAllowed() || !storage || ) {
  //      return;
  //    } else if (isHostAllowed() && !isPathAllowed()) {
  //      return;
  //    }
  //
  //    addScriptBrowserSync();
  //  }

  function shouldAddScript(tab) {
    // TODO: Validate against stored options (storage.browserSync.isDisabled)
    if (isValidUrl(tab.url)) {
      chrome.tabs.sendMessage(tab.id, "add-script");
    }
  }

  chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
    if (changeInfo.status === "complete") {
      console.debug('Updated page.', tabId, changeInfo, tab, tab.url);

      shouldAddScript(tab);
    }
  });
}());