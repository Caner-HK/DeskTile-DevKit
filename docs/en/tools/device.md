# Device workflow

[Documentation home](/en/) / [Development tools](/en/tools/)

<!-- page-outline -->
[[toc]]

## SD installation

End device SD access before moving the card to the computer. Select its root containing `desktile`:

```powershell
desktile deploy .\dist\com.example.myapp.dtapp --sd E:\
```

DevKit validates and copies the package to `desktile/user/Packages`. Safely eject, return the SD and install through Settings → Applications → Install application.

## Install from the computer

Enable USB debugging input and output. Release any monitor using the same port. Choose **Install on Device**, or:

```powershell
desktile install .\dist\com.example.myapp.dtapp --port COM4
```

The tool checks the local package and transfers chunks into SD staging at `desktile/install/.devkit`. The device checks length and transfer CRC, then invokes the system installer for structure, resource integrity, SDK and version checks. Native packages additionally require the Native-install setting and on-device risk confirmation.

Success returns `complete`; an existing identical version returns `already-installed`. Downgrades, corrupt packages, storage failures and cancellation have separate results. Updates preserve private data through the system's existing rules.

The limit is 16 MiB at 115200 baud. Progress reports sent bytes and percentage. Ctrl+C ends the host operation; more than 15 seconds of transfer inactivity closes and removes incomplete staging. Once an install commit begins, the system completes its transaction. This requires System firmware with DevKit protocol 1.

## Device performance

Choose **Device Performance**, select a port and click Start. Once per second the panel reads free internal RAM/PSRAM, rendering CPU time and scroll/dialog buffer use. It retains 120 samples on the computer. Rendering CPU milliseconds per second includes partial redraws and differs from display scan rate, network latency or total application CPU.

Stop or close the panel to end collection. Each sample request renews a three-second device lease, so unexpected host exit also stops extra timing. Device state and counters occupy 24 bytes. Free memory reads existing counters.

```powershell
desktile profile --port COM4 --seconds 60
```

## File transfers

Start the FTP server in the device File app and connect both devices to the same LAN. Use the address, port and account shown there. `push` and `pull` transfer individual files. Remote `/` maps to `desktile/user`, so `/Downloads/demo.txt` appears in the File app's Downloads directory.

Set the password for the current PowerShell session:

```powershell
$credential = Get-Credential -UserName desktile -Message 'File app FTP account'
$env:DESKTILE_FTP_PASSWORD = $credential.GetNetworkCredential().Password
desktile push .\demo.txt /Downloads/demo.txt --host 192.168.1.20 --user $credential.UserName
desktile pull /Downloads/demo.txt .\downloaded-demo.txt --host 192.168.1.20 --user $credential.UserName
Remove-Item Env:DESKTILE_FTP_PASSWORD
```

The default port is `2121`; override it with `--port`. The destination directory must exist. Existing destination files produce an error; choose a new name. Uploads use a temporary file and SHA-256 readback verification before commit. Downloads use a local temporary file and verify the length before commit. Results include byte count and SHA-256. FTP uses a plaintext LAN connection intended for trusted development networks; stop the File app server when finished.

USB `install` installs application packages; file `push` and `pull` use the network connection described above.

## Serial workflow

The developer page controls input and output separately; enabling input requires on-device confirmation. Ports are exclusive at 115200 baud. Install `pyserial`, list ports with `desktile devices`, and capture logs with `desktile monitor --port COM4 --log-file serial.log`. Ctrl+C releases the port. Logs rotate at 5 MiB, keeping the current and previous file. The extension saves project logs to `.desktile/serial.log`.

`desktile run . --port COM4` sends a launch request for the current installed package. Verify its result on the device. The complete [serial command reference](serial.md) lists parameters and page requirements.

## Verification

Check localized names, themes, permission denial/re-authorization, exit/reopen, continued tasks, persisted data and clear-data behavior. Use device touch and scroll tests in addition to local layout checks.
