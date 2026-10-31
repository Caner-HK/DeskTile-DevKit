"""Serial DevKit protocol client. DTR/RTS remain inactive throughout."""
import argparse
import base64
import json
import os
import sys
import time
import zlib


def emit(value):
    print(json.dumps(value, ensure_ascii=False), flush=True)


class Protocol:
    def __init__(self, connection):
        self.connection = connection
        self.buffer = bytearray()

    def send(self, command):
        data = command.encode("ascii")
        if len(data) > 63 or b"\n" in data or b"\r" in data:
            raise ValueError("Invalid device command")
        self.connection.write(data + b"\n")
        self.connection.flush()

    def receive(self, expected, timeout=10):
        deadline = time.monotonic() + timeout
        while time.monotonic() < deadline:
            block = self.connection.read(max(1, min(4096, self.connection.in_waiting)))
            if block:
                self.buffer.extend(block)
                if len(self.buffer) > 65536:
                    raise RuntimeError("Device response exceeds the protocol buffer")
            while b"\n" in self.buffer:
                line, _, remainder = self.buffer.partition(b"\n")
                self.buffer = bytearray(remainder)
                marker = line.find(b"[DevKit] ")
                if marker < 0:
                    continue
                try:
                    message = json.loads(line[marker + 9:])
                except (ValueError, UnicodeError):
                    continue
                if isinstance(message, dict) and message.get("type") == expected:
                    return message
        raise TimeoutError("No DevKit response. Check USB debugging input/output and the installed firmware.")

    def request(self, command, expected="transfer", timeout=10):
        self.send(command)
        return self.receive(expected, timeout)


def install(protocol, filename):
    size = os.path.getsize(filename)
    hello = protocol.request("dev hello", "hello")
    if hello.get("protocol") != 1 or hello.get("chunk") != 32:
        raise RuntimeError("Unsupported device installation protocol")
    if not 0 < size <= hello.get("maximum", 0):
        raise ValueError("Installer must be between 1 byte and 16 MiB")
    with open(filename, "rb") as source:
        crc = 0
        while block := source.read(65536):
            crc = zlib.crc32(block, crc)
        source.seek(0)
        response = protocol.request(f"dev begin {size} {crc:08x}")
        if response.get("status") != "ready" or response.get("offset") != 0:
            raise RuntimeError("Device cannot start transfer: " + str(response.get("status")))
        offset, last_progress = 0, -1
        while block := source.read(32):
            response = protocol.request(f"dev put {offset} " + base64.b64encode(block).decode("ascii"))
            offset += len(block)
            if response.get("status") != "ready" or response.get("offset") != offset:
                raise RuntimeError("Transfer rejected: " + str(response.get("status")))
            progress = offset * 100 // size
            if progress != last_progress:
                emit({"type": "upload", "bytes": offset, "total": size, "percent": progress})
                last_progress = progress
        response = protocol.request("dev commit")
        deadline = time.monotonic() + 300
        previous = None
        while time.monotonic() < deadline:
            status = response.get("status")
            if status != previous:
                emit(response)
                previous = status
            if status in ("complete", "already-installed"):
                return response
            if status not in ("verifying", "confirmation-required", "installing"):
                raise RuntimeError("Installation did not complete: " + str(status))
            time.sleep(0.5)
            response = protocol.request("dev status")
        raise TimeoutError("Installation confirmation timed out")


def profile(protocol, seconds):
    protocol.request("dev hello", "hello")
    until = time.monotonic() + seconds if seconds else float("inf")
    while time.monotonic() < until:
        started = time.monotonic()
        emit(protocol.request("dev metrics", "metrics", 3))
        time.sleep(max(0, 1 - (time.monotonic() - started)))


def main():
    import serial
    parser = argparse.ArgumentParser()
    parser.add_argument("mode", choices=("install", "profile"))
    parser.add_argument("port")
    parser.add_argument("--package")
    parser.add_argument("--seconds", type=int, default=0)
    args = parser.parse_args()
    if args.seconds < 0:
        parser.error("seconds must be non-negative")
    connection = serial.Serial(port=None, baudrate=115200, timeout=0.05, write_timeout=2)
    connection.dtr = False
    connection.rts = False
    connection.port = args.port
    connection.open()
    with connection:
        connection.reset_input_buffer()
        protocol = Protocol(connection)
        try:
            if args.mode == "install":
                if not args.package:
                    parser.error("--package is required")
                install(protocol, args.package)
            else:
                profile(protocol, args.seconds)
        finally:
            # Termination of the host process is also covered by the device's
            # 15 s transfer timeout and 3 s metrics lease.
            try:
                protocol.send("dev abort" if args.mode == "install" else "dev metrics-stop")
            except Exception:
                pass


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        sys.exit(130)
    except Exception as error:
        emit({"type": "error", "message": str(error)})
        sys.exit(1)
