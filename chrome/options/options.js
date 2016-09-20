/*global chrome, aemProductivityTools */
(function () {
  'use strict';

  chrome.runtime.sendMessage({
    event: "popup-opened"
  });

  var IDS = {
      defaultStatus: 'browsersync-default-status'
    },
    storage,
    currentTab;

  function loadCurrentTab() {
    chrome.tabs.query({
      active: true,
      lastFocusedWindow: true
    }, function (tabs) {
      currentTab = tabs[0];
    });
  }

  function loadOptions() {
    chrome.storage.sync.get('options', function (items) {
      if (!items.options) {
        return;
      }

      var value = items.options.reloadByDefault,
        selector;

      switch (value) {
      case true:
        value = "on";
        break;
      case false:
        value = "off";
        break;
      }

      selector = '#' + IDS.defaultStatus + ' option[value="' + value + '"]';
      document.querySelector(selector).setAttribute('selected', 'selected');
    });
  }

  function setBrowserSyncStatus() {
    chrome.storage.sync.get('options', function (storage) {
      var select = document.getElementById(IDS.defaultStatus),
        status;

      status = select.options[select.selectedIndex].value;

      switch (status) {
      case "on":
        status = true;
        break;
      case "off":
        status = false;
        break;
      }

      storage.options.reloadByDefault = status;

      chrome.runtime.sendMessage({
        task: "update-storage",
        data: storage
      });
    });
  }

  function clearStorage() {
    chrome.runtime.sendMessage({
      task: "clear-storage"
    });
  }

  function openWcmDisabled() {
    chrome.runtime.sendMessage({
      task: "toggle-mode-disabled",
      url: currentTab.url
    });
  }

  function openWcmEdit() {
    chrome.runtime.sendMessage({
      task: "toggle-mode-edit",
      url: currentTab.url
    });
  }

  function initEvents() {
    document.getElementById(IDS.defaultStatus)
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
      loadOptions();
    });
    initEvents();
  }

  init();
}());
