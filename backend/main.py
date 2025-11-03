from fastapi import FastAPI
from contextlib import asynccontextmanager
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from app.prune import register_prune
from sockets import sio_app
import app.handlers

@asynccontextmanager
async def lifespan(app: FastAPI):
    register_prune(app)
    yield

app = FastAPI(lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

@app.get("/test")
async def get_test():
    return FileResponse("test_handlers.html")

app.mount('/', app=sio_app)
