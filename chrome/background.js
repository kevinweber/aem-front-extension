// Background Page
// Documentation: https://developer.chrome.com/extensions/event_pages
(function () {
  'use strict';

  var syncStorage = chrome.storage.sync,
    OPTIONS = {
      VERSION: chrome.app.getDetails().version
    },
    IMG = {
      status: {
        defaultOn: "img/icons/icon-reload-on-blue.png",
        defaultOff: "img/icons/icon-reload-off-blue.png",
        on: "img/icons/icon-reload-on.png",
        off: "img/icons/icon-reload-off.png"
      }
    },
    FLAGS = {
      iconClicked: false,
      popupOpened: false
    };

  function clearStorage() {
    console.info("Storage cleared.");
    chrome.storage.sync.clear();
  }

  function setIcon(status, tabId) {
    var path;

    switch (status) {
    case "on":
      path = IMG.status.off;
      break;
    case "off":
      path = IMG.status.on;
      break;
    case "default":
      // TODO: Adjust defaultOn/defaultOff depending on global setting
      path = IMG.status.defaultOn;
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
    items.extension.version = OPTIONS.VERSION;

    // Set up default options
    items.options = items.options || {};
    items.options.browserSync = items.options.browserSync || {};
    items.options.browserSync.isDisabled = items.options.browserSync.isDisabled || false;

    items.tabs = items.tabs || {};

    syncStorage.set(items);
  });

  function shouldAddScript(tab) {
    syncStorage.get(['options', 'tabs'], function (items) {
      if (!items.options.browserSync.isDisabled && isValidUrl(tab.url)) {
        var status;
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

        chrome.tabs.sendMessage(tab.id, {
          task: "add-script"
        });

        syncStorage.set(items);
      }
    });
  }

  function updateTabStatus(tabId) {
    syncStorage.get(['tabs'], function (items) {
      if (items.tabs[tabId]) {
        var status = items.tabs[tabId].status;

        if (status === "on") {
          status = "off";
        } else {
          status = "on";
        }

        setIcon(status, tabId);

        items.tabs[tabId].status = status;
        syncStorage.set(items);
      }
    });
  }


  chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
    //    if (changeInfo.status === "loading") {
    //      chrome.tabs.sendMessage(tabId, {
    //        task: "add-identifier",
    //        data: OPTIONS.VERSION
    //      });
    //    }

    if (changeInfo.status === "complete") {
      //      console.debug('Updated page.', tabId, changeInfo, tab, tab.url);

      shouldAddScript(tab);
    }
  });

  chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
    if (message.task === "update-storage") {
      syncStorage.set(message.data);
    }

    if (message.task === "clear-storage") {
      clearStorage();
    }

    if (message.task === "popup-opened") {
      FLAGS.popupOpened = true;
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

  function setPopup(url) {
    // Doc: https://developer.chrome.com/extensions/browserAction#method-setPopup
    chrome.browserAction.setPopup({
      popup: url
    });
  }

  chrome.browserAction.onClicked.addListener(function (tab) {
    var CONTROL_TIME = 400;

    if (FLAGS.iconClicked === false) {
      FLAGS.iconClicked = true;

      setPopup("options/index.html");

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
}());