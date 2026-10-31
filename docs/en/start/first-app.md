# Your first application

[Documentation home](/en/)

Create a reading application with a reading page, a settings page and a saved text-size preference.

<!-- page-outline -->
[[toc]]

## Create the project

Run **DeskTile DevKit: Create Application**. Choose JavaScript, enter a name, author and reverse-domain package ID such as `com.example.reader`. Choose the parent folder and enter the new project-folder name. The extension opens the generated project.

```sh
desktile new reader --id com.example.reader --name "Reader" --author "Example"
```

The project contains its manifest, document entry, JavaScript, language resources and icons. Edit `locales` and inspect `enter`, `onEvent` and `leave` in `src/main.js`.

## Build

Use **Build Application**, or:

```sh
desktile build reader
desktile check reader/dist/com.example.reader.dtapp
```

The installer is written to `dist`. Editor configuration, type helpers and previous build output are excluded from the application package.

## Install

Use **Install on Device** with USB debugging input/output enabled, or copy the installer to SD with **Copy Installer to SD Card**. SD installers are stored in `desktile/user/Packages`; install them through Settings → Applications → Install application. See the [device workflow](../tools/device.md) for prerequisites and results.

## Check interaction

Switch between reading and settings, change text size, exit and reopen. Confirm the preference survives. Check all three languages and both themes, then continue to [project structure](../guide/project.md).
