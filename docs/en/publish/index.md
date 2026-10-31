# Publish an application

[Documentation home](/en/)

<!-- page-outline -->
[[toc]]

## Manifest

Choose a stable reverse-domain package ID. Set the author, localized names, version and increasing `version_code`. Declare only required permissions, entries, icons and SDK target 1.0. Include all declared resources with matching filename case. Notification icons may use system or custom colors.

## Build and sign

Create and validate a development package:

```sh
desktile build .
desktile check dist/com.example.myapp.dtapp
```

Signed builds require a supported P-256 private-key PEM and Python `cryptography`:

```sh
desktile build . --signing-key /secure/path/application-key.pem
```

Keep signing keys outside application sources and installers. A signature identifies the signing key; device trust configuration determines acceptance.

## Verification and updates

Test first installation, upgrade, uninstall/reinstall and permissions on target firmware. Include notification clicks, persistent tasks, offline and storage-full cases used by the app. Keep the installer, version, SDK version and test record together.

Distribute the `.dtapp`, supported device models, SDK requirements and release notes. Preserve the package ID, increment `version_code` for releases, and maintain data migrations. Install the final artifact through the [device workflow](../tools/device.md).
