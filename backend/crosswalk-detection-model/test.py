from ultralytics import YOLO

model = YOLO("best.pt")

model.predict("test2.mp4", imgsz=640, save=True )