# Splash screen

[Documentation home](/en/) / [Application development](/en/guide/project.md)

The system owns the launch screen background, status bar, loading indicator and completion. JavaScript and Native packages declare the same optional icon.

<!-- page-outline -->
[[toc]]

## Manifest

Merge this fragment into `manifest.json`:

```json
{
  "icons": {
    "application": "assets/application.dti",
    "tile": "assets/tile.dti",
    "splash": "assets/splash.dti"
  }
}
```

Paths are package-relative and assets must be included. A declared missing file fails packaging validation.

## Icon and layout

Provide a square DTI, preferably **96 × 96 px**. Alpha-mask resources use the current accent; colored formats preserve image colors. Keep suitable transparent padding in the icon. On an 800 × 480 screen its bounds are `x=352, y=176, w=96, h=96`, with the loading indicator below. The system composes the complete screen.

If loading fails, the system tries the application icon and then the default icon. Omitting `icons.splash` skips this application splash path.

## Timing

The system tracks launch time by application ID and version. First launches and launches without a measurement show Splash. A previous launch below 200 ms can cause the next one to skip it; system paths that force a splash still show it. The in-memory history holds eight applications and resets after reboot.

The host manages the splash lifetime. Network and other asynchronous work after entry should use loading state inside the application page.

## Verification

Build, install and open from the device desktop. Check the icon, both themes and the handoff to the first frame. Repeat exits and launches to check the fast-launch behavior. Local preview displays application pages; the device desktop owns launch timing and Splash.
