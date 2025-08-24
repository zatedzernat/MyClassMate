from fastapi import APIRouter, UploadFile, HTTPException
from pathlib import Path
from io import BytesIO
from .face_recognitions import post_face_recognition
import logging

router = APIRouter()
logging.basicConfig(level=logging.INFO)

@router.post("/test/face-recognition-valdation")
async def post_test_face_recognition():
    folder_path = Path("/Users/pongthanat/Pictures/test-my-class-mate/users/")
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
                result = await post_face_recognition(upload_file)
            except HTTPException as e:
                errors.append({"file": file_path.name, "error": e.detail})
                continue

        # Compare
        logging.info(
                f"post_test_face_recognition, file: {file_path.name}, "
                f"expected_user_id: {expected_user_id}, result_user_id: {result['user_id']}"
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