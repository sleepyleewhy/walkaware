from fastapi import FastAPI
from contextlib import asynccontextmanager
from fastapi.middleware.cors import CORSMiddleware
from backend.app.prune import register_prune
from sockets import sio_app

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

app.mount('/', app=sio_app)  # Consider using a subpath like '/ws'
