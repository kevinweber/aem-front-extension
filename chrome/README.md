# AEM Front Chrome Extension

This extension works together with the [AEM Front npm module npm](https://www.npmjs.com/package/aem-front). It makes work for AEM developers easier by removing the necessity for the painful manual reload of pages. (A page reload is necessary whenever code changes got deployed into the AEM instance, and not – opposed to static websites – when a HTML or similar file has been saved.)

## Usage:
- A **double-click on the extension's icon** (next to Chrome's search bar) opens the options panel where you can choose if pages should be reloaded automatically by default or not. New tabs always use the global default.
- A **single click** overrides the global default for the current tab. For example: If the option "Reload pages by default" is selected in the popup, and you single-click on the extension's icon for a newly opened tab, this tab will be set to "don't reload".
- Keyboard shortcut `cmd + e`: Switch between WCM Mode "disabled" and "edit". Use the shortcut  to automatically open "disabled" if you're on an "edit" page, and the other way around.
