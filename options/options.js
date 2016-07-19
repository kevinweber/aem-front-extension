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
    chrome.storage.sync.get(null, function (obj) {
      storage = obj;

      initOptions();
    });
  }

  function setBrowserSyncStatus() {
    var status = document.getElementById('browsersync-status').checked;

    storage.browserSync.isDisabled = status;
    extension.updateStorage(storage);
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
    var url = storage.location.href;

    url = url.replace('editor.html/', '');
    url = url.replace('cf#/', '');
    url = replaceOrAddValue(url, "wcmmode", "disabled");

    openUrl(url);
  }

  function openWcmEdit() {
    var url = storage.location.origin + '/editor.html' + storage.location.pathname + storage.location.search;

    url = url.replace('&wcmmode=disabled', '');
    url = url.replace('?wcmmode=disabled&', '?');
    url = url.replace('?wcmmode=disabled', '');

    openUrl(url);
  }

  function initEvents() {
    document.getElementById('browsersync-status')
      .addEventListener('change', setBrowserSyncStatus);

    document.getElementById('wcm-disabled')
      .addEventListener('click', openWcmDisabled);

    document.getElementById('wcm-edit')
      .addEventListener('click', openWcmEdit);
  }

  function init() {
    document.addEventListener('DOMContentLoaded', loadStorage);
    initEvents();
  }

  init();
}());