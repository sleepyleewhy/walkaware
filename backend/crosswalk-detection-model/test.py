from ultralytics import YOLO

model = YOLO("best.pt")

model.predict("test.mp4", imgsz=224, save=True )