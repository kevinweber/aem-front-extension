/*global chrome */
String.prototype.replaceOriginal = String.prototype.replace;
String.prototype.replace = function () {
  var string = this;

  if (string.indexOf(arguments[0]) !== -1) {
    string = string.replaceOriginal(arguments[0], arguments[1]);
  }

  return string;
};


var aemProductivityTools = aemProductivityTools || {};

aemProductivityTools = (function () {
  'use strict';

  var extension = {};

  extension.defaults = {
    "STATIC": {
      // Using this value we'll be able to fix issues that might occur with future updates of this extension.
      // We can increase this number for a big change, and then check for the stored version and provide fallbacks.
      "version": 1
    },
    "browserSync": {
      "isDisabled": false
    }
  };

  extension.clearStorage = function () {
    chrome.storage.sync.clear();
    console.log('Storage cleared.');
    console.table(storage);
  };

  extension.updateStorage = function (data) {
    chrome.storage.sync.set(data, function () {});
  };

  return extension;
}());