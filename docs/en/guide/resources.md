# Resources and languages

[Documentation home](/en/) / [Application development](/en/guide/project.md)

Package assets, private settings and user-selected files have different ownership and APIs.

<!-- page-outline -->
[[toc]]

## Icons

Application, tile and notification icons have distinct roles. Declare each resource in the manifest, check its pixel dimensions, transparency and theme behavior. Notification icons support system coloring or retained image colors; see [notifications](../services/notifications.md).

## Text and fonts

Prefer native font tiers. Manage specialized application fonts as resources and check their actual language coverage. Provide text for empty, error, disabled and completed states as well as ordinary content.

## Localization

Use the same keys across language files. Keep parameterized sentences as complete messages so translations can reorder words.

```js
const language = DeskTile.createI18n("locales/catalog.json");
const title = language.t("title");
```

The catalog declares supported and default languages. The framework resolves application and system language, then reads the appropriate message file. Refresh text when language changes. Split large business datasets by language and load them when needed.

## Reading resources

`resourceText` reads text, `resourceJson` parses JSON and `resourceRead` returns bytes. Use `resourceSize` and `resourceReadRange` for large resources. Paths are relative to the package and must match filename case. Build checks validate references and structure; device checks cover glyphs, truncation, wrapping and touch areas.
