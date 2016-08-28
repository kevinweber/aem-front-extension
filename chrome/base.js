/*global chrome */

String.prototype.replaceOriginal = String.prototype.replace;
String.prototype.replace = function () {
  var string = this;

  if (string.indexOf(arguments[0]) !== -1) {
    string = string.replaceOriginal(arguments[0], arguments[1]);
  }

  return string;
};

Element.prototype.remove = function () {
  this.parentElement.removeChild(this);
};