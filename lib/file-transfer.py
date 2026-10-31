"""Transfer a single user file through the device File app's FTP server."""
import argparse
import ftplib
import hashlib
import json
import os
from pathlib import Path
import tempfile
import uuid


def remote_path(value):
    if not value or any(ord(c) < 32 or c in '\\:' or ord(c) == 127 for c in value):
        raise ValueError('Use a path relative to the device user directory.')
    parts = value.lstrip('/').split('/')
    if any(p in ('', '.', '..') for p in parts):
        raise ValueError('The remote path must name a file inside the user directory.')
    if len(value.encode('utf-8')) > 220:
        raise ValueError('The remote path is too long.')
    return '/' + '/'.join(parts)


def exists(ftp, remote):
    try:
        ftp.sendcmd('MLST ' + remote)
        return True
    except ftplib.error_perm as error:
        if str(error).startswith('550'):
            return False
        raise


def transfer(ftp, mode, source, destination):
    ftp.voidcmd('TYPE I')
    digest = hashlib.sha256()
    count = 0
    if mode == 'push':
        remote = remote_path(destination)
        if exists(ftp, remote):
            raise FileExistsError('The device destination already exists: ' + remote)
        local = Path(source)
        # The unique temporary name also protects the final name on interruption.
        temporary = remote.rsplit('/', 1)[0] + '/.dt-' + uuid.uuid4().hex
        committed = False
        try:
            with local.open('rb') as stream:
                expected = os.fstat(stream.fileno()).st_size
                def sent(block):
                    nonlocal count
                    count += len(block)
                    digest.update(block)
                ftp.storbinary('STOR ' + temporary, stream, blocksize=8192, callback=sent)
            if count != expected or ftp.size(temporary) != count:
                raise IOError('The uploaded file length does not match.')
            verify = hashlib.sha256()
            ftp.retrbinary('RETR ' + temporary, verify.update, blocksize=8192)
            if verify.digest() != digest.digest():
                raise IOError('The uploaded file checksum does not match.')
            if exists(ftp, remote):
                raise FileExistsError('The device destination appeared during transfer.')
            # Device RNTO rejects an existing destination and commits atomically.
            ftp.rename(temporary, remote)
            committed = True
        finally:
            if not committed:
                try:
                    ftp.delete(temporary)
                except (OSError, ftplib.Error):
                    pass
    else:
        remote = remote_path(source)
        local = Path(destination).absolute()
        if local.exists() or local.is_symlink():
            raise FileExistsError('The local destination already exists: ' + str(local))
        expected = ftp.size(remote)
        fd, temporary = tempfile.mkstemp(prefix='.desktile-', dir=local.parent)
        try:
            with os.fdopen(fd, 'wb') as stream:
                def received(block):
                    nonlocal count
                    stream.write(block)
                    digest.update(block)
                    count += len(block)
                ftp.retrbinary('RETR ' + remote, received, blocksize=8192)
                if count != expected:
                    raise IOError('The downloaded file length does not match.')
                stream.flush()
                os.fsync(stream.fileno())
            # A hard link publishes without replacing a destination created meanwhile.
            os.link(temporary, local)
        finally:
            os.unlink(temporary)
    return dict(operation=mode, bytes=count, sha256=digest.hexdigest(), remote=remote,
                local=str(local), transport='ftp')


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('mode', choices=['push', 'pull'])
    parser.add_argument('source')
    parser.add_argument('destination')
    parser.add_argument('--host', required=True)
    parser.add_argument('--port', type=int, default=2121)
    parser.add_argument('--user', default='desktile')
    args = parser.parse_args()
    if not 1 <= args.port <= 65535:
        raise ValueError('Port must be between 1 and 65535.')
    password = os.environ.get('DESKTILE_FTP_PASSWORD')
    if not password:
        raise ValueError('Set DESKTILE_FTP_PASSWORD to the password shown in the File app server settings.')
    # Validate paths before opening a connection.
    remote_path(args.destination if args.mode == 'push' else args.source)
    with ftplib.FTP(timeout=20, encoding='utf-8') as ftp:
        ftp.connect(args.host, args.port)
        ftp.login(args.user, password)
        result = transfer(ftp, args.mode, args.source, args.destination)
    print(json.dumps(result, ensure_ascii=False))


if __name__ == '__main__':
    try:
        main()
    except (OSError, ftplib.Error, ValueError) as error:
        raise SystemExit(str(error))
