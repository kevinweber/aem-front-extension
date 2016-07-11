/*global chrome, aemProductivityTools */
(function () {
  'use strict';

  var extension = aemProductivityTools,
    defaults = extension.defaults,
    storage;

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

  function setBrowserSyncStatus() {
    var status = document.getElementById('browsersync-status').checked;

    storage.browserSync.isDisabled = status;
    extension.updateStorage(storage);
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