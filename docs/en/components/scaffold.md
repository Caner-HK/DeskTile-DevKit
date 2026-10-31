# Scaffold

[Documentation home](/en/) / [Design and components](/en/components/)

Scaffold owns the app bar, current page and navigation entry. Business pages own their content and events. Keep the current page, title and selected navigation item in one state source.

<!-- page-outline -->
[[toc]]

## Integration

JavaScript uses `scaffold.js` and `navigation.js`; Native uses `<desktile/scaffold_view.hpp>`. The reading templates include complete reading/settings pages. [Navigation](navigation.md) explains hidden, icons-only and expanded states, content placement and transitions.

## Lifecycle

Load page content on entry, cancel page-scoped requests on departure and release application-scoped resources on exit. Persist reading position and preferences with explicit save-error handling.

## Events

Let Scaffold consume app-bar/navigation events first, then forward remaining events to the current page. Reacquire component handles after rebuilding and validate request ownership before touching a page from an asynchronous callback. See [JavaScript API](../api/javascript.md) and `sdk-bundle/examples/scaffold-js` / `scaffold-native`.
