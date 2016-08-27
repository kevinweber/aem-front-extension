/*global chrome, aemProductivityTools */
(function () {
  'use strict';

  var storage,
    currentTab;

  function initOptions() {
    document.getElementById('browsersync-status').checked = storage.options.browserSync.isDisabled;
  }

  function loadCurrentTab() {
    chrome.tabs.query({
      active: true,
      lastFocusedWindow: true
    }, function (tabs) {
      currentTab = tabs[0];
    });
  }

  function loadStorage() {
    chrome.storage.sync.get(null, function (obj) {
      storage = obj;

      initOptions();
    });
  }

  function setBrowserSyncStatus() {
    chrome.storage.sync.get('options', function (storage) {
      var status = document.getElementById('browsersync-status').checked;

      storage.options.browserSync.isDisabled = status;

      chrome.runtime.sendMessage({
        task: "update-storage",
        data: storage
      });
    });
  }

  /*
   * A very basic solution to add or replace a property and its value to a URL
   * Source: https://gist.github.com/kevinweber/58a1b1bdcbab109018dc01a619f9b730
   */
  function replaceOrAddValue(query, variable, value) {
    var findVariable = variable + "=",
      variableIndex = query.indexOf(findVariable),
      queryFirstPart,
      queryLastPart;

    // Check if value exists already. "-1" means it doesn't exist yet.
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

    return query;
  }

  function openUrl(url) {
    window.open(url, '_blank');
  }

  function openWcmDisabled() {
    var url = currentTab.url;

    url = url.replace('editor.html/', '');
    url = url.replace('cf#/', '');
    url = replaceOrAddValue(url, "wcmmode", "disabled");

    openUrl(url);
  }

  function openWcmEdit() {
    var url = currentTab.url,
      firstPart = url.match(/^[a-z]*:\/\/[a-z.:\-0-9]+\//i)[0],
      lastPart = url.substring(firstPart.length, url.length);

    if (lastPart.indexOf("editor.html/") === -1) {
      url = firstPart + "editor.html/" + lastPart;
    } else {
      url = firstPart + lastPart;
    }

    url = url.replace('&wcmmode=disabled', '');
    url = url.replace('?wcmmode=disabled&', '?');
    url = url.replace('?wcmmode=disabled', '');

    openUrl(url);
  }

  function clearStorage() {
    chrome.runtime.sendMessage({
      task: "clear-storage"
    });
  }

  function initEvents() {
    document.getElementById('browsersync-status')
      .addEventListener('change', setBrowserSyncStatus);

    document.getElementById('wcm-disabled')
      .addEventListener('click', openWcmDisabled);

    document.getElementById('wcm-edit')
      .addEventListener('click', openWcmEdit);

    document.getElementById('clear-storage')
      .addEventListener('click', clearStorage);
  }

  function init() {
    document.addEventListener('DOMContentLoaded', function () {
      loadCurrentTab();
      loadStorage();
    });
    initEvents();
  }

  init();
}());