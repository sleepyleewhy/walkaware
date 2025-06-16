FROM ultralytics/ultralytics:latest-cpu

WORKDIR /app

RUN pip install --upgrade pip \
    && pip install --no-cache-dir \
    fastapi \
    uvicorn \
    python-socketio

COPY . .

CMD [ "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000" ]

EXPOSE 8000