var aemProductivityTools = aemProductivityTools || {};

aemProductivityTools.defaults = (function () {
  'use strict';

  var defaults = {
    "STATIC": {
      // Using this value we'll be able to fix issues that might occur with future updates of this extension.
      // We can increase this number for a big change, and then check for the stored version and provide fallbacks.
      "version": 1
    },
    "browserSync": {
      "isDisabled": false
    }
  };

  return defaults;
}());