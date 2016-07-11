/*global chrome, aemProductivityTools */
(function () {
  'use strict';

  var storage,
    defaults = aemProductivityTools.defaults;

  function initOptions() {
    if (!storage || !storage.browserSync || typeof storage.browserSync.isDisabled === 'undefined') {
      return;
    }

    document.getElementById('browsersync-status').checked = storage.browserSync.isDisabled;
  }

  function loadStorage() {
    chrome.storage.sync.get(defaults, function (obj) {
      storage = obj;

      initOptions();
    });
  }

  function updateStorage(data) {
    chrome.storage.sync.set(data, function () {});
  }

  function setBrowserSyncStatus() {
    var status = document.getElementById('browsersync-status').checked;

    storage.browserSync.isDisabled = status;
    updateStorage(storage);
  }

  function initEvents() {
    document.getElementById('browsersync-status')
      .addEventListener('change', setBrowserSyncStatus);
  }

  function init() {
    document.addEventListener('DOMContentLoaded', loadStorage);
    initEvents();
  }

  init();
}());