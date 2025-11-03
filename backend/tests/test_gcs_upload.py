import base64
import os
import types
import pytest

import backend.app.gcs_upload as gcs


class FakeBlob:
    def __init__(self, name, records):
        self.name = name
        self.records = records

    def upload_from_string(self, raw, content_type=None):
        self.records.append((self.name, raw, content_type))


class FakeBucket:
    def __init__(self, name, records):
        self.name = name
        self.records = records

    def blob(self, name):
        return FakeBlob(name, self.records)


class FakeClient:
    def __init__(self, records):
        self.records = records

    def bucket(self, name):
        return FakeBucket(name, self.records)


def test_parse_data_url_variants():
    raw = b"abc"
    data_url = "data:image/png;base64," + base64.b64encode(raw).decode()
    out, mime, ext = gcs._parse_data_url(data_url)
    assert out == raw and mime == "image/png" and ext == "png"

    b64 = base64.b64encode(raw).decode()
    out2, mime2, ext2 = gcs._parse_data_url("prefix," + b64)
    assert out2 == raw and mime2 == "image/jpeg" and ext2 == "jpg"

    out3, mime3, ext3 = gcs._parse_data_url("data:image/webp;base64," + b64)
    assert out3 == base64.b64decode(b64) and mime3 == "image/webp" and ext3 == "webp"
    out4, mime4, ext4 = gcs._parse_data_url("data:image/gif;base64," + b64)
    assert out4 == base64.b64decode(b64) and mime4 == "image/gif" and ext4 == "gif"

    bad = "data:image/jpeg;base64,abc="  # invalid padding/characters
    out5, mime5, ext5 = gcs._parse_data_url(bad)
    assert isinstance(out5, (bytes, bytearray)) and mime5 == "image/jpeg" and ext5 in ("jpg", "jpeg")


@pytest.mark.asyncio
async def test_async_upload(monkeypatch):
    records = []
    monkeypatch.setenv("GCS_BUCKET", "test-bucket")
    monkeypatch.setattr(gcs, "GCS_BUCKET", os.getenv("GCS_BUCKET"))

    # Patch storage.Client
    monkeypatch.setattr(gcs, "storage", types.SimpleNamespace(Client=lambda: FakeClient(records)))

    raw = b"xyz"
    data_url = "data:image/jpeg;base64," + base64.b64encode(raw).decode()
    uri = await gcs.async_upload_image_base64_to_gcs(data_url, is_crosswalk=True)
    assert uri is not None and uri.startswith("gs://test-bucket/")
    assert records and records[0][1] == raw and records[0][2] == "image/jpeg"

    # PNG branch ensures extension logic
    records.clear()
    png_data_url = "data:image/png;base64," + base64.b64encode(b"xyz2").decode()
    uri2 = await gcs.async_upload_image_base64_to_gcs(png_data_url, is_crosswalk=False)
    assert uri2 is not None and records[0][2] == "image/png"
    assert records[0][0].endswith(".png")


@pytest.mark.asyncio
async def test_async_upload_bucket_missing(monkeypatch):
    monkeypatch.setattr(gcs, "GCS_BUCKET", "")
    uri = await gcs.async_upload_image_base64_to_gcs("data:image/jpeg;base64,AA==", is_crosswalk=False)
    assert uri is None


@pytest.mark.asyncio
async def test_async_upload_storage_exception(monkeypatch):
    monkeypatch.setattr(gcs, "GCS_BUCKET", "test-bucket")
    class Boom:
        def Client(self):
            raise RuntimeError("boom")
    monkeypatch.setattr(gcs, "storage", Boom())
    uri = await gcs.async_upload_image_base64_to_gcs("data:image/jpeg;base64,AA==", is_crosswalk=True)
    assert uri is None
