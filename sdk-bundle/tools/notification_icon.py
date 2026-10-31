"""Validate the dedicated notification asset, independently of tile icons."""
import struct

def validate_notification_icon(root, declaration):
    if not isinstance(declaration, dict) or set(declaration) != {'path', 'mode'}:
        raise ValueError('icons.notification requires path and mode')
    mode = declaration['mode']
    if mode not in ('system', 'custom'):
        raise ValueError('notification mode must be system or custom')
    data = (root / declaration['path']).read_bytes()
    if len(data) < 12:
        raise ValueError('notification icon has an incomplete header')
    magic, w, h, encoding = struct.unpack('<4sHHB3x', data[:12])
    if magic != b'DTI1' or w != h or not 16 <= w <= 128 or data[9:12] != b'\0\0\0':
        raise ValueError('notification icon must be a square 16..128 pixel DTI1 image')
    n = w*h
    if mode == 'system':
        if encoding != 3 or len(data) != 12+n or not any(data[12:]):
            raise ValueError('system notification icon must contain an alpha8 shape')
    elif encoding not in (0, 2) or len(data) != 12+2*n+((n+7)//8 if encoding == 2 else 0):
        raise ValueError('custom notification icon must contain RGB565 pixels with optional transparency')
    elif encoding == 2 and not any(data[12:12+(n+7)//8]):
        raise ValueError('custom notification icon is entirely transparent')
