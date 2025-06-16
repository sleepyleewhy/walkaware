import base64
import numpy as np
import cv2

from ultralytics import YOLO

model = YOLO("best.pt")


def base64_to_image(base64_string):
    base = base64_string.split(",")[1]
    img_bytes = base64.b64decode(base)
    img_array = np.frombuffer(img_bytes, dtype=np.uint8)
    img = cv2.imdecode(img_array, cv2.IMREAD_COLOR)
    return img


def predictImageIsCrosswalk(base64_string):
    img = base64_to_image(base64_string)
    results = model.predict(source=img)
    if (results[0].probs.top1 == 0 and results[0].probs.top1conf > 0.9):
        return True
    else:
        return False
        
