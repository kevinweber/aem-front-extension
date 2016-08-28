// Background Page
// Documentation: https://developer.chrome.com/extensions/event_pages
(function () {
  'use strict';

  var syncStorage = chrome.storage.sync,
    OPTIONS = {
      VERSION: chrome.runtime.getManifest().version
    },
    IMG = {
      status: {
        defaultOn: "img/icons/icon-reload-on-blue.png",
        defaultOff: "img/icons/icon-reload-off-blue.png",
        on: "img/icons/icon-reload-on.png",
        off: "img/icons/icon-reload-off.png"
      }
    },
    POPUPS = {
      global: "options/index.html"
    },
    FLAGS = {
      iconClicked: false,
      popupOpened: false
    },
    globalDefaultStatus;

  function isPositiveInteger(x) {
    return /^\d+$/.test(x);
  }

  /**
   * Compare two software version numbers (e.g. 1.7.1)
   * Returns:
   *
   *  0 if they're identical
   *  Negative if v1 < v2
   *  Positive if v1 > v2
   *  NaN if they are in the wrong format
   *
   * Based on: http://jsfiddle.net/ripper234/Xv9WL/28/
   */
  function compareVersionNumbers(v1, v2) {
    var v1parts = v1.split('.'),
      v2parts = v2.split('.'),
      i;

    // First, validate both numbers are true version numbers
    function validateParts(parts) {
      for (i = 0; i < parts.length; i += 1) {
        if (!isPositiveInteger(parts[i])) {
          return false;
        }
      }
      return true;
    }
    if (!validateParts(v1parts) || !validateParts(v2parts)) {
      return NaN;
    }

    for (i = 0; i < v1parts.length; i += 1) {
      if (v2parts.length === i) {
        return 1;
      }

      if (v1parts[i] === v2parts[i]) {
        continue;
      }
      if (v1parts[i] > v2parts[i]) {
        return 1;
      }

      return -1;
    }

    if (v1parts.length !== v2parts.length) {
      return -1;
    }

    return 0;
  }

  function clearStorage() {
    console.info("Storage cleared.");
    chrome.storage.sync.clear();
  }

  function setGlobalDefaultStatus(option) {
    if (option === false) {
      globalDefaultStatus = "defaultOff";
    } else {
      globalDefaultStatus = "defaultOn";
    }
  }

  function getGlobalDefaultStatus() {
    return globalDefaultStatus;
  }

  function setIcon(status, tabId) {
    var path;

    if (status === "default") {
      status = getGlobalDefaultStatus();
    }

    switch (status) {
    case "on":
      path = IMG.status.on;
      break;
    case "off":
      path = IMG.status.off;
      break;
    case "defaultOn":
      path = IMG.status.defaultOn;
      break;
    case "defaultOff":
      path = IMG.status.defaultOff;
      break;
    }

    chrome.browserAction.setIcon({
      path: path,
      tabId: tabId
    });
  }

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

  syncStorage.get(null, function (items) {
    console.debug('STORAGE:', items);

    // Set version number
    items.extension = items.extension || {};

    // Cleanup stored data from previous version of this extension
    if (compareVersionNumbers(items.extension.version, "0.1") < 0) {
      clearStorage();
    }
    items.extension.version = OPTIONS.VERSION;

    // Set up default options
    items.options = items.options || {};
    if (items.options.reloadByDefault !== false) {
      items.options.reloadByDefault = items.options.reloadByDefault || true;
    }

    items.tabs = items.tabs || {};

    syncStorage.set(items);
  });

  function addScript(tabId) {
    chrome.tabs.sendMessage(tabId, {
      task: "add-script"
    });
  }

  function removeScript(tabId) {
    chrome.tabs.sendMessage(tabId, {
      task: "remove-script"
    });
  }

  /**
   * A tab can have a status of either:
   * - true
   * - false
   * - "default" (falls back to whatever the global default is, thus either on or off)
   */
  function updateTab(tab, items) {
    var status,
      task;

    if (items.tabs[tab.id]) {
      status = items.tabs[tab.id].status || "default";
    } else {
      status = "default";
    }

    setIcon(status, tab.id);

    items.tabs[tab.id] = {
      status: status,
      url: tab.url
    };

    if (status === "on" || (status === "default" && getGlobalDefaultStatus() === "defaultOn")) {
      addScript(tab.id);
    }

    syncStorage.set(items);
  }

  function shouldAddScript(tab) {
    syncStorage.get(['options', 'tabs'], function (items) {
      setGlobalDefaultStatus(items.options.reloadByDefault);

      if (isValidUrl(tab.url)) {
        updateTab(tab, items);
      }
    });
  }

  function updateTabStatus(tabId) {
    syncStorage.get(['tabs'], function (items) {
      if (items.tabs[tabId]) {
        var status = items.tabs[tabId].status;

        if (status === "on" || (status === "default" && getGlobalDefaultStatus() === "defaultOn")) {
          status = "off";
          removeScript(tabId);
        } else {
          status = "on";
          addScript(tabId);
        }

        setIcon(status, tabId);

        items.tabs[tabId].status = status;
        syncStorage.set(items);
      }
    });
  }

  function setPopup(url) {
    // Doc: https://developer.chrome.com/extensions/browserAction#method-setPopup
    chrome.browserAction.setPopup({
      popup: url
    });
  }

  /*******************************/
  /** ALL EVENT LISTENERS BELOW **/
  /*******************************/

  chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
    if (changeInfo.status === "complete") {
      //      console.debug('Updated page.', tabId, changeInfo, tab, tab.url);

      shouldAddScript(tab);
    }
  });

  chrome.tabs.onRemoved.addListener(function (tabId, removeInfo) {
    syncStorage.get(['tabs'], function (items) {

      if (items.tabs[tabId]) {
        delete items.tabs[tabId];
        syncStorage.set(items);
      }
    });
  });

  chrome.browserAction.onClicked.addListener(function (tab) {
    var CONTROL_TIME = 400;

    if (FLAGS.iconClicked === false) {
      FLAGS.iconClicked = true;

      setPopup(POPUPS.global);

      setTimeout(function () {
        // Always reset popup after CONTROL_TIME so we can update the icon if user doesn't double-click
        setPopup("");

        if (!FLAGS.popupOpened) {
          updateTabStatus(tab.id);
        }

        FLAGS.iconClicked = false;
        FLAGS.popupOpened = false;
      }, CONTROL_TIME);
    }
  });

  chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
    if (message.task === "update-storage") {
      syncStorage.set(message.data);
    }

    if (message.task === "clear-storage") {
      clearStorage();
    }

    if (message.event === "popup-opened") {
      FLAGS.popupOpened = true;
    }
  });
}());