FROM ultralytics/ultralytics:latest-cpu

WORKDIR /app

RUN pip install --upgrade pip

COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

CMD [ "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000" ]

EXPOSE 8000
