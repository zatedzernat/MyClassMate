from fastapi import FastAPI, Request
import time
import logging

from .routers import tests, face_recognitions

app = FastAPI(title = "FastAPI My Class Mate Service",
              description = "Backend Service using for Face Recognition Part in My Class Mate Application",
              version = "0.0.1")

logging.basicConfig(level=logging.INFO)

@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    response.headers["X-Process-Time"] = str(process_time)
    return response

@app.get("/")
async def root():
    return {"message": "Hello My Class Mate Service!"}

app.include_router(
    tests.router,
    prefix="/myclassmate/v1",
    tags=["tests"],
    responses={404: {"message": "Not found"}},
)

app.include_router(
    face_recognitions.router,
    prefix="/myclassmate/v1",
    tags=["face_recognitions"],
    responses={404: {"message": "Not found"}},
)