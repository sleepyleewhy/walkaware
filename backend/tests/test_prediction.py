import numpy as np
import pytest
import cv2
import base64
import os

import backend.prediction as prediction


class FakeProbs:
    def __init__(self, top1, top1conf):
        self.top1 = top1
        self.top1conf = top1conf


class FakeResult:
    def __init__(self, top1, conf):
        self.probs = FakeProbs(top1, conf)


class FakeModel:
    def __init__(self, res):
        self._res = res

    def predict(self, source):
        # Ensure we received an image-like object from base64_to_image
        assert isinstance(source, np.ndarray)
        return [self._res]


@pytest.fixture(autouse=True)
def mock_image_decode(monkeypatch):
    # Avoid depending on OpenCV; return a 1x1 black image
    monkeypatch.setattr(prediction, "base64_to_image", lambda s: np.zeros((1, 1, 3), dtype=np.uint8))


def test_predict_true(monkeypatch):
    fake_res = FakeResult(top1=0, conf=0.95)
    monkeypatch.setattr(prediction, "get_model", lambda: FakeModel(fake_res))
    assert prediction.predictImageIsCrosswalk("data:image/jpeg;base64,AA==") is True


def test_predict_false_low_conf(monkeypatch):
    fake_res = FakeResult(top1=0, conf=0.5)
    monkeypatch.setattr(prediction, "get_model", lambda: FakeModel(fake_res))
    assert prediction.predictImageIsCrosswalk("data:image/jpeg;base64,AA==") is False


def test_predict_false_wrong_class(monkeypatch):
    fake_res = FakeResult(top1=1, conf=0.99)
    monkeypatch.setattr(prediction, "get_model", lambda: FakeModel(fake_res))
    assert prediction.predictImageIsCrosswalk("data:image/jpeg;base64,AA==") is False


def test_base64_to_image_real_decode():
    # Create a small valid JPEG in-memory and ensure we can decode it back
    img = np.zeros((2, 2, 3), dtype=np.uint8)
    ok, buf = cv2.imencode(".jpg", img)
    assert ok
    b64 = base64.b64encode(buf.tobytes()).decode()
    data_url = "data:image/jpeg;base64," + b64

    # Use the real base64_to_image for this test: reload module to restore original function
    import importlib
    import backend.prediction as pred2
    importlib.reload(pred2)
    out = pred2.base64_to_image(data_url)
    assert isinstance(out, np.ndarray) and out.ndim == 3


def test_get_model_singleton_and_path(monkeypatch):
    calls = {"count": 0, "path": None}

    class FakeYOLO:
        def __init__(self, path):
            calls["count"] += 1
            calls["path"] = path
        def predict(self, source=None):
            return []

    monkeypatch.setattr(prediction, "YOLO", FakeYOLO)
    monkeypatch.setattr(prediction, "_model", None)

    m1 = prediction.get_model()
    m2 = prediction.get_model()
    assert m1 is m2
    assert calls["count"] == 1
    assert os.path.basename(calls["path"]) == "best.pt"
