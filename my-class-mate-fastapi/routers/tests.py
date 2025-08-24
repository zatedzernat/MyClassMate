from fastapi import APIRouter, UploadFile, HTTPException
from pathlib import Path
from io import BytesIO
from .db_face_recognitions import (
    post_face_recognition_1,
    # post_face_recognition_2,
    # post_face_recognition_3,
    # post_face_recognition_4
)
import logging

router = APIRouter()
logging.basicConfig(level=logging.INFO)

DATA_PATH = "/Users/pongthanat/Pictures/test-my-class-mate/users/"

METHOD_MAP = {
    1: post_face_recognition_1,
    # 2: post_face_recognition_2,
    # 3: post_face_recognition_3,
    # 4: post_face_recognition_4
}

@router.post("/test/face-recognition-validation/{method_number}")
async def post_test_face_recognition(method_number: int):
    if method_number not in METHOD_MAP:
        raise HTTPException(status_code=400, detail=f"Invalid method_number: {method_number}, must be 1-4")
    
    folder_path = Path(DATA_PATH)
    if not folder_path.exists():
        raise HTTPException(status_code=400, detail=f"Folder not found: {folder_path}")

    files = list(folder_path.glob("*.[jJpP][pPnN][gG]"))
    if not files:
        raise HTTPException(status_code=400, detail=f"No image files found in {folder_path}")
    
    # Sort files by userId (number) extracted from filename
    def extract_user_id(file_path: Path):
        try:
            return int(file_path.name.split("-")[0])
        except Exception:
            return float('inf')

    files.sort(key=extract_user_id)

    errors = []

    face_recognition_func = METHOD_MAP[method_number]

    for file_path in files:
        # Extract expected user_id from filename
        try:
            user_id_str = file_path.name.split("-")[0]
            expected_user_id = int(user_id_str)
        except Exception:
            errors.append({"file": file_path.name, "error": "Cannot extract user_id from filename"})
            continue

        # Create UploadFile for internal method
        with open(file_path, "rb") as f:
            upload_file = UploadFile(filename=file_path.name, file=BytesIO(f.read()))
            try:
                result = await face_recognition_func(upload_file)
            except HTTPException as e:
                errors.append({"file": file_path.name, "error": e.detail})
                continue

        # Compare
        match_status = "Correct ✅" if result["user_id"] == expected_user_id else "Wrong ❌"

        logging.info(
            f"post_test_face_recognition, file: {file_path.name}, "
            f"expected_user_id: {expected_user_id}, result_user_id: {result['user_id']} - {match_status}"
        )
        if result["user_id"] != expected_user_id:
            errors.append({
                "file": file_path.name,
                "error": f"Expected user_id: {expected_user_id}, got: {result['user_id']}"
            })
        # returned_user_id = result.get("user", {}).get("user_id")
        # if returned_user_id != expected_user_id:
        #     errors.append({
        #         "file": file_path.name,
        #         "error": f"Expected user_id: {expected_user_id}, got: {returned_user_id}"
        #     })

    if errors:
        raise HTTPException(status_code=422, detail=errors)

    return {"status": "success", "message": "All files passed recognition test"}