# image_face_recognitions.py
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from pathlib import Path
from deepface import DeepFace
import cv2
import numpy as np
import logging
from typing import List
import sys, os
import contextlib

router = APIRouter()

logging.basicConfig(level=logging.INFO)
BASE_STORAGE_PATH = Path("/Users/pongthanat/Pictures/face_database")  # images path
BASE_STORAGE_PATH.mkdir(parents=True, exist_ok=True)
SOURCE_PATH = Path("/Users/pongthanat/Pictures/test-my-class-mate/users")
ALLOWED_EXTENSIONS = {"jpg", "jpeg", "png"}
MODEL_NAME = "VGG-Face"
DETECTOR = "retinaface" # or mtcnn, retinaface

@contextlib.contextmanager
def suppress_tf_logs():
    """Suppress stdout/stderr temporarily to hide DeepFace/TensorFlow logs."""
    with open(os.devnull, "w") as fnull:
        old_stdout, old_stderr = sys.stdout, sys.stderr
        sys.stdout, sys.stderr = fnull, fnull
        try:
            yield
        finally:
            sys.stdout, sys.stderr = old_stdout, old_stderr

def read_image_from_upload(file: UploadFile):
    file.file.seek(0)
    file_content = file.file.read()
    
    if not file_content:
        raise HTTPException(
            status_code=400,
            detail={"code": "ERR000", "message": "Uploaded file is empty or null"}
        )

    image_np = np.frombuffer(file_content, np.uint8)
    image = cv2.imdecode(image_np, cv2.IMREAD_COLOR)

    if image is None or image.size == 0:
        raise HTTPException(
            status_code=400,
            detail={"code": "ERR001", "message": "Cannot decode image"}
        )
    return image


@router.post("/face-recognition/store")
async def post_store_face_image(
    user_id: str = Form(...),
    user_name: str = Form(...),
    files: List[UploadFile] = File(...)
):
    MAX_FILES = 4
    if not files:
        raise HTTPException(
            status_code=400, 
            detail={"code": "ERR002", "message": "No files uploaded"})
    if len(files) > MAX_FILES:
        raise HTTPException(
            status_code=400,
            detail={"code": "ERR003", "message": f"Maximum {MAX_FILES} files allowed, received {len(files)}"}
        )
    
    user_folder_name = f"{user_id}_{user_name}"
    user_path = BASE_STORAGE_PATH / user_folder_name
    user_path.mkdir(parents=True, exist_ok=True)

    # delete old files
    for old_file in user_path.glob("*.jpg"):
        try:
            old_file.unlink()
            logging.info(f"Removed old face image: {old_file}")
        except Exception as e:
            raise HTTPException(
            status_code=500,
            detail={"code": "ERR001", "message": f"Could not remove file {old_file}: {e}"}
            )   

    saved_files = []

    for idx, file in enumerate(files, start=1):
        image = read_image_from_upload(file)

        with suppress_tf_logs():
            faces = DeepFace.extract_faces(image, detector_backend=DETECTOR, enforce_detection=False, align=True)

        if not faces:
            raise HTTPException(
                status_code=400,
                detail={"code": "ERR004", "message": f"No face detected in image: {file.filename}"}
            )

        face_img = faces[0]["face"]

        filename = user_path / f"{user_name}{idx}.jpg"

        cv2.imwrite(str(filename), face_img)
        logging.info(f"Stored face image for {user_folder_name} at {filename}")
        saved_files.append(str(filename))

    if not saved_files:
        raise HTTPException(
            status_code=422, 
            detail={"code": "ERR005", "message": "No valid face images found in uploaded files"})

    return {"status": "success", "saved_files": saved_files}

@router.post("/face-recognition/store-2")
async def post_store_face_image_2(
    user_id: str = Form(...),
    user_name: str = Form(...)
):

    user_folder_name = f"{user_id}_{user_name}"
    user_path = BASE_STORAGE_PATH / user_folder_name
    user_path.mkdir(parents=True, exist_ok=True)

    # delete old files
    for old_file in user_path.glob("*.jpg"):
        try:
            old_file.unlink()
            logging.info(f"Removed old face image: {old_file}")
        except Exception as e:
            raise HTTPException(
            status_code=500,
            detail={"code": "ERR001", "message": f"Could not remove file {old_file}: {e}"}
            )   

    allowed_extensions = ["png", "jpg", "jpeg", "JPG", "JPEG"]
    candidate_files = []
    for ext in allowed_extensions:
        candidate_files.extend(SOURCE_PATH.glob(f"{user_id}-{user_name}-*.{ext}"))

    candidate_files = [f for f in candidate_files if "test" not in f.stem]

    if not candidate_files:
        raise HTTPException(
            status_code=400,
            detail={"code": "ERR006", "message": f"No files found for pattern {pattern}"}
        )

    def extract_index(path: Path):
        try:
            return int(path.stem.split("-")[-1])
        except Exception:
            return float("inf")

    candidate_files.sort(key=extract_index)

    saved_files = []
    for idx, file_path in enumerate(candidate_files, start=1):
        image = cv2.imread(str(file_path))
        if image is None:
            raise HTTPException(
            status_code=400,
            detail={"code": "ERR001", "message": "Cannot decode image"}
            )

        with suppress_tf_logs():
            faces = DeepFace.extract_faces(img_path=image, detector_backend=DETECTOR, enforce_detection=False, align=True)

        if not faces:
            raise HTTPException(
            status_code=400,
            detail={"code": "ERR004", "message": f"No face detected in image: {file.filename}"}
            )

        face_img = faces[0]["face"]

        filename = user_path / f"{user_name}{idx}.jpg"
        cv2.imwrite(str(filename), face_img)
        logging.info(f"Stored face image for {user_folder_name} at {filename}")
        saved_files.append(str(filename))

    if not saved_files:
        raise HTTPException(
            status_code=422, 
            detail={"code": "ERR005", "message": "No valid face images found in uploaded files"})

    return {"status": "success", "saved_files": saved_files}

@router.post("/face-recognition/find")
async def post_find_similar_face(file: UploadFile = File(...)):
    image = read_image_from_upload(file)

    with suppress_tf_logs():
        faces = DeepFace.extract_faces(image, detector_backend=DETECTOR, enforce_detection=False, align=True)

    if not faces:
        raise HTTPException(
            status_code=400,
            detail={"code": "ERR004", "message": f"No face detected in image: {file.filename}"}
        )

    face_img = faces[0]["face"]

    image_paths: List[str] = [str(p) for p in BASE_STORAGE_PATH.glob("**/*.jpg")]
    if not image_paths:
        raise HTTPException(
            status_code=404,
            detail={"code": "ERR006", "message": "No images in database"}
        )

    temp_file = "/tmp/query_face.jpg"
    cv2.imwrite(temp_file, face_img)

    try:
        results = DeepFace.find(
            img_path=temp_file,
            db_path=str(BASE_STORAGE_PATH),
            model_name=MODEL_NAME,
            enforce_detection=False,
            align=True
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail={"code": "ERR007", "message": f"DeepFace find error: {e}"}
        )

    if not results or len(results) == 0 or results[0].empty:
        raise HTTPException(
            status_code=422,
            detail={"code": "ERR008", "message": "No similar face found"}
        )

    best_match_df = results[0]
    best_match = best_match_df.iloc[0]
    confidence = best_match.get("confidence", None)

    identity_path = Path(best_match["identity"])
    folder_name = identity_path.parent.name
    try:
        match_user_id = int(folder_name.split("_")[0])
    except Exception:
        raise HTTPException(
            status_code=500,
            detail={"code": "ERR009", "message": f"Cannot extract user_id from folder name: {folder_name}"}
        )

    logging.info(f"post_find_similar_face, Found closest match: {best_match['identity']} (user_id: {match_user_id}) with confidence: {confidence}")

    return {
    "status": "success",
    "closest_match_user_id": int(match_user_id),
    "confidence": float(confidence) if confidence is not None else None
}