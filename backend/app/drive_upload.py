from __future__ import annotations

import asyncio
import base64
import io
import os
import re
import time
import uuid
from typing import Optional

import google.auth
from googleapiclient.discovery import build
from googleapiclient.http import MediaIoBaseUpload

DRIVE_FOLDER_CROSSWALK_ID = os.getenv(
    "CROSSWALK_DRIVE_FOLDER_ID",
    "1kJhEIAJeVav8cE4zU_693oXzsS4o6-ad",
)
DRIVE_FOLDER_NO_CROSSWALK_ID = os.getenv(
    "NO_CROSSWALK_DRIVE_FOLDER_ID",
    "1azjqiol_rJUgnyXllnxWVqeCjYLQ-edL",
)

_drive_service = None


def _get_drive_service():
    global _drive_service
    if _drive_service is not None:
        return _drive_service

    creds, _ = google.auth.default(scopes=["https://www.googleapis.com/auth/drive"])
    _drive_service = build("drive", "v3", credentials=creds, cache_discovery=False)
    return _drive_service


_DATA_URL_RE = re.compile(r"^data:(?P<mime>[^;]+);base64,(?P<data>.+)$")


def _parse_data_url(data_url: str) -> tuple[bytes, str, str]:

    match = _DATA_URL_RE.match(data_url)
    if match:
        mime = match.group("mime")
        b64 = match.group("data")
    else:
        try:
            b64 = data_url.split(",", 1)[1]
        except Exception:
            b64 = data_url
        mime = "image/jpeg"

    try:
        raw = base64.b64decode(b64, validate=True)
    except Exception:
        raw = base64.b64decode(b64)

    if "/png" in mime:
        ext = "png"
    elif "/webp" in mime:
        ext = "webp"
    elif "/gif" in mime:
        ext = "gif"
    else:
        mime = "image/jpeg"
        ext = "jpg"

    return raw, mime, ext


def _upload_bytes_to_drive(raw: bytes, mime_type: str, folder_id: str, filename: str) -> Optional[dict]:
    try:
        service = _get_drive_service()
        media = MediaIoBaseUpload(io.BytesIO(raw), mimetype=mime_type, resumable=False)
        file_metadata = {"name": filename, "parents": [folder_id]}
        created = (
            service.files()
            .create(body=file_metadata, media_body=media, fields="id, webViewLink")
            .execute()
        )
        return created
    except Exception:
        return None


async def async_upload_image_base64_to_drive(
    data_url: str,
    folder_id: str,
    filename: Optional[str] = None,
) -> Optional[dict]:
    raw, mime, ext = _parse_data_url(data_url)
    if not filename:
        filename = f"{uuid.uuid4()}.{ext}"
    elif not os.path.splitext(filename)[1]:
        filename = f"{filename}.{ext}"

    return await asyncio.to_thread(_upload_bytes_to_drive, raw, mime, folder_id, filename)


def upload_file_to_drive(local_path: str, folder_id: str) -> Optional[dict]:
    try:
        with open(local_path, "rb") as f:
            raw = f.read()
        _, mime, ext = _parse_data_url(f"data:image/{os.path.splitext(local_path)[1][1:]}*;base64,")
        filename = os.path.basename(local_path)
        return _upload_bytes_to_drive(raw, mime, folder_id, filename)
    except Exception:
        return None
