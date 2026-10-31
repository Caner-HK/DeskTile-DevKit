import ftplib
import hashlib
import importlib.util
import json
import os
from pathlib import Path
import socket
import socketserver
import subprocess
import sys
import tempfile
import threading
import unittest

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('transfer', ROOT / 'lib/file-transfer.py')
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class MemoryFTP:
    def __init__(self):
        self.files = {}
        self.corrupt = False
        self.fail = False

    def voidcmd(self, command): pass

    def sendcmd(self, command):
        if command[5:] not in self.files:
            raise ftplib.error_perm('550 Path unavailable')
        return '250 Listing'

    def storbinary(self, command, stream, blocksize, callback):
        data = stream.read()
        self.files[command[5:]] = data
        callback(data)

    def size(self, name): return len(self.files[name])

    def retrbinary(self, command, callback, blocksize):
        callback(b'bad' if self.corrupt else self.files[command[5:]])
        if self.fail:
            raise OSError('Connection lost')

    def rename(self, source, target):
        if target in self.files:
            raise ftplib.error_perm('550 Destination exists')
        self.files[target] = self.files.pop(source)

    def delete(self, name): self.files.pop(name, None)


class Handler(socketserver.StreamRequestHandler):
    def reply(self, value):
        self.wfile.write((value + '\r\n').encode())
        self.wfile.flush()

    def handle(self):
        listener = None
        self.reply('220 Test file server')
        try:
            while line := self.rfile.readline():
                verb, _, arg = line.decode().strip().partition(' ')
                files = self.server.files
                if verb == 'USER': self.reply('331 Password required')
                elif verb == 'PASS': self.reply('230 Logged in' if arg == 'test-password' else '530 Login incorrect')
                elif verb == 'TYPE': self.reply('200 Binary')
                elif verb == 'MLST': self.reply('250 Listing' if arg in files else '550 Path unavailable')
                elif verb == 'SIZE': self.reply('213 ' + str(len(files[arg])))
                elif verb == 'PASV':
                    listener = socket.socket()
                    listener.bind(('127.0.0.1', 0))
                    listener.listen(1)
                    listener.settimeout(5)
                    port = listener.getsockname()[1]
                    self.reply(f'227 Entering Passive Mode (127,0,0,1,{port//256},{port%256})')
                elif verb in ('STOR', 'RETR'):
                    self.reply('150 Opening data')
                    connection, _ = listener.accept()
                    with connection:
                        if verb == 'STOR':
                            data = bytearray()
                            while block := connection.recv(8192): data.extend(block)
                            files[arg] = bytes(data)
                        else: connection.sendall(files[arg])
                    listener.close()
                    listener = None
                    self.reply('226 Complete')
                elif verb == 'RNFR':
                    source = arg
                    self.reply('350 Ready')
                elif verb == 'RNTO':
                    if arg in files: self.reply('550 Destination exists')
                    else:
                        files[arg] = files.pop(source)
                        self.reply('250 Renamed')
                elif verb == 'DELE':
                    files.pop(arg, None)
                    self.reply('250 Deleted')
                elif verb == 'QUIT':
                    self.reply('221 Bye')
                    break
                else: self.reply('502 Unknown command')
        finally:
            if listener: listener.close()


class Tests(unittest.TestCase):
    def test_paths(self):
        for value in ('../secret', '/a/../b', 'a\\b', 'a\nDELE b', 'C:/a', '/', 'a//b'):
            with self.assertRaises(ValueError): module.remote_path(value)
        self.assertEqual(module.remote_path('Downloads/旅行.txt'), '/Downloads/旅行.txt')

    def test_atomic_and_conflicts(self):
        ftp = MemoryFTP()
        with tempfile.TemporaryDirectory() as directory:
            source = Path(directory) / 'source'
            source.write_bytes(b'hello')
            module.transfer(ftp, 'push', source, '/Downloads/test')
            self.assertEqual(ftp.files, {'/Downloads/test': b'hello'})
            with self.assertRaises(FileExistsError): module.transfer(ftp, 'push', source, '/Downloads/test')
            target = Path(directory) / 'result'
            module.transfer(ftp, 'pull', '/Downloads/test', target)
            self.assertEqual(target.read_bytes(), b'hello')
            with self.assertRaises(FileExistsError): module.transfer(ftp, 'pull', '/Downloads/test', target)

    def test_corruption_and_interruption(self):
        ftp = MemoryFTP()
        with tempfile.TemporaryDirectory() as directory:
            source = Path(directory) / 'source'
            source.write_bytes(b'hello')
            ftp.corrupt = True
            with self.assertRaises(OSError): module.transfer(ftp, 'push', source, '/Downloads/test')
            self.assertEqual(ftp.files, {})
            ftp.corrupt = False
            ftp.fail = True
            ftp.files['/Downloads/test'] = b'hello'
            target = Path(directory) / 'result'
            with self.assertRaises(OSError): module.transfer(ftp, 'pull', '/Downloads/test', target)
            self.assertFalse(target.exists())
            self.assertEqual(list(Path(directory).iterdir()), [source])

    def test_cli_real_socket_roundtrip(self):
        with socketserver.TCPServer(('127.0.0.1', 0), Handler) as server, tempfile.TemporaryDirectory() as directory:
            server.files = {}
            thread = threading.Thread(target=server.serve_forever, daemon=True)
            thread.start()
            try:
                source = Path(directory) / 'source.txt'
                source.write_bytes(('读取测试\n' * 2500).encode())
                target = Path(directory) / 'result.txt'
                env = dict(os.environ, DESKTILE_FTP_PASSWORD='test-password', DESKTILE_PYTHON=sys.executable)
                def run(mode, first, second):
                    result = subprocess.run(['node', str(ROOT / 'bin/desktile.js'), mode, str(first), str(second),
                        '--host', '127.0.0.1', '--port', str(server.server_address[1]), '--json'], env=env,
                        capture_output=True, text=True, encoding='utf-8', timeout=15)
                    self.assertEqual(result.returncode, 0, result.stderr)
                    return json.loads(result.stdout)['result']
                sent = run('push', source, '/Downloads/旅行.txt')
                received = run('pull', '/Downloads/旅行.txt', target)
                self.assertEqual(source.read_bytes(), target.read_bytes())
                self.assertEqual(sent['sha256'], received['sha256'])
                self.assertEqual(sent['sha256'], hashlib.sha256(source.read_bytes()).hexdigest())
                self.assertEqual(list(server.files), ['/Downloads/旅行.txt'])
            finally:
                server.shutdown()
                thread.join()


if __name__ == '__main__': unittest.main()
