/*global chrome, aemProductivityTools */
(function () {
  'use strict';

  var IDS = {
    identifier: 'aem-front-extension',
    browserSyncScript: 'aem-front-script',
    blockScript: 'aem-front-block-reload',
    unblockScript: 'aem-front-allow-reload'
  };

  var DEFAULTS = {
    scriptSource: 'http://HOST:3000/browser-sync/browser-sync-client.js?v=2.17.5'
  };

  var scriptSource;

  function getSourceUrl() {
    return renderScriptSource(scriptSource) || renderScriptSource(DEFAULTS.scriptSource);
  }

  function renderScriptSource(source) {
    if (source && source.indexOf('HOST') > -1) {
      source = source.replace('HOST', location.hostname);
    }

    return source;
  }

  function updateSourceUrl(url) {
    var scriptTag = document.getElementById(IDS.browserSyncScript);

    if (scriptTag) {
      scriptTag.setAttribute('src', renderScriptSource(url));
    } else {
      scriptSource = renderScriptSource(url);
    }
  }

  function keydown(event) {
    if (event.metaKey === true && event.which === 69) { // 69 = 'e'
      chrome.runtime.sendMessage({
        task: 'toggle-mode'
      });
    }
  }

  /**
   * By injecting a unique code snippet, websites can see that the user is using this extension, and customize the UX
   */
  function injectIdentifier(version) {
    var element = document.createElement('div');

    element.setAttribute('id', IDS.identifier);
    element.setAttribute('data-version', version);
    element.style.display = 'none';

    document.body.appendChild(element);

    //    console.debug('Identifier element injected.');
  }

  function allowReload() {
    var script,
      blockScript = document.getElementById(IDS.blockScript);

    if (blockScript) {
      blockScript.remove();

      script = document.createElement('script');

      script.setAttribute('id', IDS.unblockScript);
      script.text = 'window.onbeforeunload = null';

      document.body.appendChild(script);
    }
  }

  /**
   * This is a hacky workaround. Issue:
   * We can't simply block or close BrowserSync's websocket to prevent it from reloading the page.
   * Instead, we trigger an alert that allows the user to cancel the reload manually.
   *
   * (We can execute '___browserSync___.socket.io.close()' in the Chrome Dev Tools command line and it will close the connection. However, this variable is not accessible from this JavaScript file. Or is it?)
   */
  function blockReload() {
    var script,
      unblockScript = document.getElementById(IDS.unblockScript);

    if (unblockScript) {
      unblockScript.remove();
    }

    script = document.createElement('script');

    script.setAttribute('id', IDS.blockScript);
    script.text = 'window.onbeforeunload = function() { return "Are you sure you want to reload this page?"; }';

    document.body.appendChild(script);
  }

  function addScriptBrowserSync() {
    var script;

    if (!document.getElementById(IDS.browserSyncScript)) {
      script = document.createElement('script');

      script.setAttribute('id', IDS.browserSyncScript);
      script.setAttribute('async', 'true');
      script.setAttribute('src', getSourceUrl());

      document.body.appendChild(script);
    }

    allowReload();
    //    console.debug('BrowserSync script injected.');
  }

  function removeScriptBrowserSync() {
    var script = document.getElementById(IDS.browserSyncScript);

    if (script) {
      // Removing the script tag doesn't prevent the page from reloading!
      // We remove it anyhow so that users don't get confused if the page doesn't reload despite the script tag is visible.
      script.remove();

      blockReload();
    }
  }

  /*******************************/
  /** ALL EVENT LISTENERS BELOW **/
  /*******************************/

  chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
    switch (message.task) {
    case 'add-script':
      addScriptBrowserSync();
      break;
    case 'remove-script':
      removeScriptBrowserSync();
      break;
    case 'update-source-url':
      updateSourceUrl(message.data);
      break;
    }
  });

  document.addEventListener('keydown', keydown);

  document.addEventListener('DOMContentLoaded', function () {
    injectIdentifier(chrome.runtime.getManifest().version);

    chrome.runtime.sendMessage({
      task: 'DOMContentLoaded'
    });
  });
}());
