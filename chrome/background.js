/**
 * Background Page
 *
 * Handle most of the logic here, especially everything related to storage and
 * code that may be relevant for the frontend as well as the options page.
 * Then communicate with them using chrome.tabs.sendMessage and chrome.runtime.onMessage.
 *
 * Documentation: https://developer.chrome.com/extensions/event_pages
 */
(function () {
  'use strict';

  var syncStorage = chrome.storage.sync,
    OPTIONS = {
      VERSION: chrome.runtime.getManifest().version
    },
    IMG = {
      status: {
        defaultOn: 'img/icons/icon-reload-on-blue.png',
        defaultOff: 'img/icons/icon-reload-off-blue.png',
        on: 'img/icons/icon-reload-on.png',
        off: 'img/icons/icon-reload-off.png'
      }
    },
    POPUPS = {
      global: 'options/index.html'
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
    console.info('Storage cleared.');
    chrome.storage.sync.clear();
  }

  function setGlobalDefaultStatus(option) {
    if (option === false) {
      globalDefaultStatus = 'defaultOff';
    } else {
      globalDefaultStatus = 'defaultOn';
    }
  }

  function getGlobalDefaultStatus() {
    return globalDefaultStatus;
  }

  function setIcon(status, tabId) {
    var path;

    if (status === 'default') {
      status = getGlobalDefaultStatus();
    }

    switch (status) {
    case 'on':
      path = IMG.status.on;
      break;
    case 'off':
      path = IMG.status.off;
      break;
    case 'defaultOn':
      path = IMG.status.defaultOn;
      break;
    case 'defaultOff':
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

  function isValidPath(path, allowedPaths) {
    var i,
      l;

    for (i = 0, l = allowedPaths.length; i < l; i += 1) {
      if (path.substring(0, allowedPaths[i].length) === allowedPaths[i]) {
        return true;
      }
    }

    if (allowedPaths.indexOf('*') > -1) {
      return true;
    }

    return false;
  }

  function isValidUrl(url, options) {
    var urlObject = splitUrl(url);

    var testDomains = options.domains || 'localhost:4502';
    var domainsArray = testDomains.split(/\,\s*/g);

    var testPaths = options.allowedPaths || 'content/, cf#, editor.html';
    var pathsArray = testPaths.split(/\,\s*/g);

    var matchesDomain = false;
    var matchesPath = false;

    if (domainsArray.indexOf('*') > -1) {
      matchesDomain = true;
    } else if (domainsArray.indexOf(urlObject.host) > -1) {
      matchesDomain = true;
    } else if (domainsArray.indexOf(urlObject.port) > -1) {
      matchesDomain = true;
    } else if (domainsArray.indexOf(urlObject.host + ':' + urlObject.port) > -1) {
      matchesDomain = true;
    }

    if (isValidPath(urlObject.path, pathsArray)) {
      matchesPath = true
    }

    return matchesDomain && matchesPath;
  }

  syncStorage.get(null, function (items) {
    console.debug('STORAGE:', items);

    // Set version number
    items.extension = items.extension || {};

    // Cleanup stored data from previous version of this extension
    if (!items.extension.version || compareVersionNumbers(items.extension.version, '0.1') < 0) {
      clearStorage();
    }
    items.extension.version = OPTIONS.VERSION;

    // Set up default options
    items.options = items.options || {};
    if (items.options.reloadByDefault !== false) {
      items.options.reloadByDefault = items.options.reloadByDefault || true;
    }

    if (items.options.useKeyboardToggle !== false) {
      items.options.useKeyboardToggle = items.options.useKeyboardToggle || true;
    }

    items.tabs = items.tabs || {};

    syncStorage.set(items);
  });

  function addScript(tabId) {
    chrome.tabs.sendMessage(tabId, {
      task: 'add-script'
    });
  }

  function removeScript(tabId) {
    chrome.tabs.sendMessage(tabId, {
      task: 'remove-script'
    });
  }

  /*
   * A very basic solution to add or replace a property and its value to a URL
   * Source: https://gist.github.com/kevinweber/58a1b1bdcbab109018dc01a619f9b730
   */
  function replaceOrAddValue(query, variable, value) {
    var findVariable = variable + '=',
      variableIndex = query.indexOf(findVariable),
      hashIndex = query.indexOf('#'),
      hash = '',
      splitQuery,
      queryFirstPart,
      queryLastPart;

    // Extract hash
    if (hashIndex > -1) {
      splitQuery = query.split('#', 2);
      query = splitQuery[0];
      hash = '#' + splitQuery[1];
    }

    // Check if value exists already. '-1' means it doesn't exist yet.
    if (variableIndex === -1) {
      query += query.indexOf('?') === -1 ? '?' : '&';
      query += findVariable + value;
    } else {
      // Split query
      queryFirstPart = query.substring(0, variableIndex);
      queryLastPart = query.substring(variableIndex);

      // Replace value of property
      queryLastPart = queryLastPart.replace(/=[\w-]+/, '=' + value);

      // Stick two parts back together
      query = queryFirstPart + queryLastPart;
    }

    // Add back the hash if there has been one
    query += hash;

    return query;
  }

  function openUrl(url) {
    window.open(url, '_blank');
  }

  function openWcmDisabled(url) {
    url = url.replace('editor.html/', '');
    url = url.replace('cf#/', '');
    url = replaceOrAddValue(url, 'wcmmode', 'disabled');

    openUrl(url);
  }

  function openWcmEdit(url) {
    var firstPart = url.match(/^[a-z]*:\/\/[a-z.:\-0-9]+\//i)[0],
      lastPart = url.substring(firstPart.length, url.length);

    if (lastPart.indexOf('editor.html/') === -1) {
      url = firstPart + 'editor.html/' + lastPart;
    } else {
      url = firstPart + lastPart;
    }

    url = url.replace('&wcmmode=disabled', '');
    url = url.replace('?wcmmode=disabled&', '?');
    url = url.replace('?wcmmode=disabled', '');

    openUrl(url);
  }

  function toggleMode(url) {
    syncStorage.get(['options'], function (items) {
      // Only toggle if option is checked
      if (!items.options.useKeyboardToggle) {
        return;
      }

      if (url.indexOf('editor.html/') !== -1 || url.indexOf('cf#/') !== -1) {
        openWcmDisabled(url);
      } else {
        openWcmEdit(url);
      }
    });
  }

  function updateSourceUrl(tabId) {
    syncStorage.get(['options'], function (items) {
      var url = items.options.sourceUrl;

      // Only toggle if option is checked
      if (!url || url.length <= 5) {
        return;
      }

      chrome.tabs.sendMessage(tabId, {
        task: 'update-source-url',
        data: url
      });
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
      status = items.tabs[tab.id].status || 'default';
    } else {
      status = 'default';
    }

    setIcon(status, tab.id);

    items.tabs[tab.id] = {
      status: status,
      url: tab.url
    };

    if (status === 'on' || (status === 'default' && getGlobalDefaultStatus() === 'defaultOn')) {
      addScript(tab.id);
    }

    syncStorage.set(items);
  }

  function shouldAddScript(tab) {
    syncStorage.get(['options', 'tabs'], function (items) {
      setGlobalDefaultStatus(items.options.reloadByDefault);

      if (isValidUrl(tab.url, items.options)) {
        updateTab(tab, items);
      }
    });
  }

  function updateTabStatus(tabId) {
    syncStorage.get(['tabs'], function (items) {
      if (items.tabs[tabId]) {
        var status = items.tabs[tabId].status;

        if (status === 'on' || (status === 'default' && getGlobalDefaultStatus() === 'defaultOn')) {
          status = 'off';
          removeScript(tabId);
        } else {
          status = 'on';
          addScript(tabId);
        }

        setIcon(status, tabId);

        items.tabs[tabId].status = status;
        syncStorage.set(items);
      }
    });
  }

  /*******************************/
  /** ALL EVENT LISTENERS BELOW **/
  /*******************************/

  chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
    if (changeInfo.status === 'complete') {
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
    // Doc: https://developer.chrome.com/extensions/browserAction#method-setPopup
    chrome.browserAction.setPopup({
      popup: POPUPS.global
    });
  });

  chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
    var url = message.url || (sender.tab && sender.tab.url);

    if (message.task === 'update-storage') {
      syncStorage.set(message.data);
    }

    if (message.task === 'clear-storage') {
      clearStorage();
    }

    if (message.task === 'toggle-mode') {
      toggleMode(url);
    }

    if (message.task === 'change-tab-status') {
      updateTabStatus(message.currentTab.id);
    }

    if (message.task === 'toggle-mode-disabled') {
      openWcmDisabled(url);
    }

    if (message.task === 'toggle-mode-edit') {
      openWcmEdit(url);
    }

    if (message.task === 'DOMContentLoaded') {
      updateSourceUrl(sender.tab.id);
    }
  });
}());
