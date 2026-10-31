/// <reference path="../../sdk/javascript/desktile.d.ts" />
import type {BluetoothNextEvent, BluetoothStatus} from '../../sdk/javascript/platform';

const encoded = DeskTile.utf8Encode("保存设置");
DeskTile.storageWrite("settings", encoded.buffer);

function consumeBluetooth(connection: number, status: BluetoothStatus, event: BluetoothNextEvent): number[] {
  const requests = [
    DeskTile.bluetooth.attach(connection),
    DeskTile.bluetooth.discoverServices(connection, '180f'),
    DeskTile.bluetooth.discoverCharacteristics(connection, '180f', null),
    DeskTile.bluetooth.discoverDescriptors(connection, '180f', '2a19', '2902'),
    DeskTile.bluetooth.readUuid(connection, '180f', '2a19'),
    DeskTile.bluetooth.subscribe(connection, '180f', '2a19'),
    DeskTile.bluetooth.unsubscribe(connection, '180f', '2a19'),
    DeskTile.bluetooth.pair(connection),
    DeskTile.bluetooth.pairingReply(connection, 'confirm', 1, 123456, true),
    DeskTile.bluetooth.detach(connection)
  ];
  if (status.uuidGatt && event.event === 'characteristics' && event.complete) {
    requests.push(DeskTile.bluetooth.nextEvent());
  }
  // @ts-expect-error A pairing action must come from the documented action union.
  DeskTile.bluetooth.pairingReply(connection, 'automatic', 1, 123456, true);
  // @ts-expect-error GATT UUIDs are strings, not attribute handles.
  DeskTile.bluetooth.readUuid(connection, 0x180f, 0x2a19);
  return requests;
}
DeskTile.registerMenu([{action: 101, label: 'Settings', type: 2}, {action: 102, label: 'Remember', type: 3, checked: 1}]);
// @ts-expect-error Only button/toggle and the disabled flag are supported.
DeskTile.registerMenu([{action: 101, label: 'Invalid', type: 4}]);
