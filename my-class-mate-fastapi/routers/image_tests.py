from fastapi import APIRouter, UploadFile, HTTPException
from pathlib import Path
from io import BytesIO
from .image_face_recognitions import post_find_similar_face
import logging

router = APIRouter()
logging.basicConfig(level=logging.INFO)

DATA_PATH = "/Users/pongthanat/Pictures/test-my-class-mate/users/"

@router.post("/test/image-face-recognition-validation")
async def post_test_image_face_recognition():
    folder_path = Path(DATA_PATH)
    if not folder_path.exists():
        raise HTTPException(status_code=400, detail=f"Folder not found: {folder_path}")

    files = list(folder_path.glob("*.[jJpP][pPnN][gG]"))
    if not files:
        raise HTTPException(status_code=400, detail=f"No image files found in {folder_path}")
    
    def extract_user_id(file_path: Path):
        try:
            return int(file_path.name.split("-")[0])
        except Exception:
            return float("inf")

    files.sort(key=extract_user_id)

    errors = []

    for file_path in files:
        try:
            expected_user_id = int(file_path.name.split("-")[0])
        except Exception:
            errors.append({"file": file_path.name, "error": "Cannot extract user_id from filename"})
            continue

        with open(file_path, "rb") as f:
            upload_file = UploadFile(filename=file_path.name, file=BytesIO(f.read()))
            try:
                result = await post_find_similar_face(upload_file)
            except HTTPException as e:
                errors.append({"file": file_path.name, "error": e.detail})
                continue

        if not all(k in result for k in ("status", "user_id", "confidence")):
            errors.append({"file": file_path.name, "error": f"Invalid response format: {result}"})
            continue

        match_status = "Correct ✅" if result["user_id"] == expected_user_id else "Wrong ❌"

        logging.info(
            f"post_test_image_face_recognition, file: {file_path.name}, "
            f"user_id expected: {expected_user_id}, result: {result['user_id']} "
            f"- {match_status}, confidence={result['confidence']}"
        )

        if result["user_id"] != expected_user_id:
            errors.append({
                "file": file_path.name,
                "error": f"Expected user_id: {expected_user_id}, got: {result['user_id']}"
            })

    if errors:
        raise HTTPException(status_code=422, detail=errors)

    return {"status": "success", "message": "All images passed recognition test"}