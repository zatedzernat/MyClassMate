from fastapi import APIRouter, Form, File, UploadFile, HTTPException
import numpy as np
import cv2
from deepface import DeepFace
from pgvector.psycopg2 import register_vector
from pgvector import Vector
from psycopg2 import connect
from collections import defaultdict
import statistics
import logging
import sys, os
import contextlib
from numpy.linalg import norm
from typing import List, Dict
import shutil

# ---------------- CONFIG ---------------- #
MODEL_NAME = "Facenet512"       # หรือ "ArcFace"
ALLOWED_EXTENSIONS = {"jpg", "jpeg", "png"}
DETECTOR = "mtcnn"              # หรือ retinaface
EUCLIDEAN_THRESHOLD = 1.04      # อ้างอิงจาก DeepFace (https://github.com/serengil/deepface/blob/master/deepface/config/threshold.py)
CONFIDENCE_MARGIN = 0.05        # ใช้สำหรับ confidence margin rule
TOP_K_VOTE = 5                  # fix k = 3,5,7 to prevent tie-break

ENFORCE_DETECTION = True        # บังคับให้ต้องเจอหน้าในรูป (True=เข้มงวด, False=ผ่อนผัน)
ENABLE_ANTI_SPOOFING = False     # เปิด/ปิด การตรวจสอบ anti-spoofing
SAVE_IMAGE_FILES = True         # จะ save รูปไหม
IMAGE_SAVE_DIR = os.path.join(os.path.dirname(__file__), "..", "storage", "upload")

# Router
router = APIRouter()

# Logging
logger = logging.getLogger("face_recognition")
logger.setLevel(logging.DEBUG) # เปลี่ยนเป็น logging.DEBUG ได้
handler = logging.StreamHandler(sys.stdout)
formatter = logging.Formatter("[%(asctime)s] %(levelname)s: %(message)s")
handler.setFormatter(formatter)
if not logger.handlers:
    logger.addHandler(handler)
logger.propagate = False

# ---------------- UTILS ---------------- #
@contextlib.contextmanager
def suppress_tf_logs():
    """Suppress DeepFace/TensorFlow logs (stdout/stderr)."""
    with open(os.devnull, "w") as fnull:
        old_stdout, old_stderr = sys.stdout, sys.stderr
        sys.stdout, sys.stderr = fnull, fnull
        try:
            yield
        finally:
            sys.stdout, sys.stderr = old_stdout, old_stderr

def get_db_conn():
    conn = connect(
        dbname="postgres",
        user="postgres",
        password="password",
        host="localhost",
        port="5432",
        options="-c search_path=myclassmate"
    )
    register_vector(conn)  # register pgvector type
    return conn


def normalize_embedding(embedding: np.ndarray) -> np.ndarray:
    """Normalize vector safely (prevent division by zero)."""
    n = norm(embedding)
    return embedding / n if n > 0 else embedding


def validate_extension(filename: str):
    ext = filename.rsplit(".", 1)[-1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail={"code": "ERR002", "message": f"ประเภทไฟล์ไม่ถูกต้อง '{ext}' ประเภทที่อนุญาต: {ALLOWED_EXTENSIONS}"}
        )
    
def get_face_embedding(image) -> np.ndarray:
    """Extract normalized embedding from an image using DeepFace with configurable anti-spoofing."""
    try:
        with suppress_tf_logs():
            faces = DeepFace.extract_faces(image, detector_backend=DETECTOR, enforce_detection=ENFORCE_DETECTION, anti_spoofing=ENABLE_ANTI_SPOOFING)
        if not faces:
            logger.error("No face detected in uploaded image")
            raise HTTPException(status_code=400, detail={"code": "ERR003", "message": "ไม่พบใบหน้าในภาพ กรุณาใช้ภาพที่มีใบหน้าเด่นชัด"})
        
        face_data = faces[0]
        
        # Check if face passed anti-spoofing test (only if anti-spoofing is enabled)
        if ENABLE_ANTI_SPOOFING and "is_real" in face_data and not face_data["is_real"]:
            logger.error("Anti-spoofing detected fake face")
            raise HTTPException(
                status_code=400, 
                detail={"code": "ERR006", "message": "ตรวจพบการปลอมแปลงใบหน้า (anti-spoofing) กรุณาใช้ภาพจริง"}
            )
        
        face_img = face_data["face"]

        with suppress_tf_logs():
            embedding = np.array(
                DeepFace.represent(face_img, model_name=MODEL_NAME, detector_backend="skip", enforce_detection=False)[0]["embedding"]
            )
        return normalize_embedding(embedding)
    except HTTPException:
        # Re-raise HTTPException as-is
        raise
    except Exception as e:
        logger.error(f"DeepFace error: {e}")
        raise HTTPException(status_code=500, detail={"code": "ERR005", "message": "ไม่สามารถประมวลผลภาพใบหน้าได้"})
    
def save_uploaded_file(user_id: str, file: UploadFile, image_bytes: bytes) -> str:
    """Save uploaded image to disk and return saved path."""
    user_dir = os.path.join(IMAGE_SAVE_DIR, str(user_id))
    os.makedirs(user_dir, exist_ok=True)

    save_path = os.path.join(user_dir, file.filename)
    with open(save_path, "wb") as f:
        f.write(image_bytes)

    logger.info(f"[face-register] Saved file: {save_path}")
    return save_path

# ---------------- ROUTES ---------------- #
@router.post("/face-register")
async def post_face_register(user_id: str = Form(...), files: List[UploadFile] = File(...)):
    logger.info(f"[face-register] user_id={user_id}, files={len(files)}")

    if len(files) > 4:
        raise HTTPException(status_code=400, detail={"code": "ERR001", "message": "อัพโหลดได้สูงสุด 4 รูปเท่านั้น"})

    for file in files:
        validate_extension(file.filename)

    saved_files = []
    saved_paths = []

    conn = get_db_conn()
    try:
        with conn.cursor() as cur:
            # --- Step 1: ลบข้อมูลเก่าใน DB ---
            cur.execute("DELETE FROM identities WHERE user_id = %s", (user_id,))

            # --- Step 2: ลบไฟล์เก่าใน storage ---
            user_dir = os.path.join(IMAGE_SAVE_DIR, str(user_id))
            if os.path.exists(user_dir):
                shutil.rmtree(user_dir)   # ลบทั้งโฟลเดอร์ userId
                logger.info(f"[face-register] Deleted old files for user {user_id}")

            for idx, file in enumerate(files, start=1):
                image_bytes = await file.read()
                image_np = np.frombuffer(image_bytes, np.uint8)
                image = cv2.imdecode(image_np, cv2.IMREAD_COLOR)

                embedding = get_face_embedding(image)

                # กำหนดชื่อไฟล์ใหม่เป็น running no
                ext = file.filename.rsplit(".", 1)[-1].lower()
                new_filename = f"{idx}.{ext}"

                cur.execute(
                    "INSERT INTO identities (user_id, file_name, embedding) VALUES (%s, %s, %s)",
                    (user_id, new_filename, Vector(embedding.tolist()))
                )
                saved_files.append(new_filename)

                if SAVE_IMAGE_FILES:
                    user_dir = os.path.join(IMAGE_SAVE_DIR, str(user_id))
                    os.makedirs(user_dir, exist_ok=True)
                    save_path = os.path.join(user_dir, new_filename)
                    with open(save_path, "wb") as f:
                        f.write(image_bytes)
                    logger.info(f"[face-register] Saved file: {save_path}")

        conn.commit()
    finally:
        conn.close()

    return {
        "status": "Success",
        "user_id": user_id,
        "num_faces_registered": len(saved_files),
        "files": saved_files
    }

@router.post("/face-recognition")
async def post_face_recognition(file: UploadFile = File(...)):
    logger.info(f"[face-recognition] start")

    image_bytes = await file.read()
    image_np = np.frombuffer(image_bytes, np.uint8)
    image = cv2.imdecode(image_np, cv2.IMREAD_COLOR)

    embedding = get_face_embedding(image)
    target_embedding = Vector(embedding.tolist())

    conn = get_db_conn()
    try:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT user_id, file_name, embedding <-> %s AS distance
                FROM identities
                ORDER BY distance ASC
                LIMIT 200
                """,
                (target_embedding,)
            )
            results = cur.fetchall()
    finally:
        conn.close()

    if not results:
        raise HTTPException(status_code=404, detail={"code": "ERR004", "message": "ไม่พบใบหน้าในฐานข้อมูล"})

    # Group distances per user
    user_distances: Dict[int, List[float]] = defaultdict(list)
    for user_id, file_name, distance in results:
        logger.debug(f"row: user_id={user_id}, file={file_name}, distance={distance:.4f}")
        user_distances[user_id].append(distance)

    # Rule 1: Exact match
    for user_id, distances in user_distances.items():
        if min(distances) <= 1e-6:
            logger.info(f"[face-recognition] Exact match: {user_id}")
            return {
                "status": "Success", 
                "user_id": user_id, 
                "file_name": file_name,
                "distance": 0.0, 
                "threshold": EUCLIDEAN_THRESHOLD}

    # Rule 2: Top-K majority
    top_k = results[:TOP_K_VOTE]
    user_counts = defaultdict(int)
    topk_distances = defaultdict(list)
    for user_id, file_name, distance in top_k:
        user_counts[user_id] += 1
        topk_distances[user_id].append(distance)

    majority_user = max(user_counts.items(), key=lambda x: x[1])[0]
    tied_users = [u for u, c in user_counts.items() if c == user_counts[majority_user]]

    if len(tied_users) > 1:
        majority_user = min(tied_users, key=lambda u: statistics.median(topk_distances[u]))

    best_user = majority_user
    best_distance = statistics.median(topk_distances[best_user])

    # Rule 3: Threshold check
    if best_distance > EUCLIDEAN_THRESHOLD:
        raise HTTPException(status_code=404, detail={"code": "ERR004", "message": f"ระยะห่างที่ดีที่สุด {best_distance:.4f} เกินกว่าขีดจำกัด"})

    # Rule 4: Confidence margin
    sorted_all = sorted([(uid, statistics.median(dists)) for uid, dists in user_distances.items()], key=lambda x: x[1])
    if len(sorted_all) > 1:
        _, second_distance = sorted_all[1]
        margin_ratio = (second_distance - best_distance) / max(best_distance, 1e-6)
        if margin_ratio < CONFIDENCE_MARGIN and user_counts[best_user] <= 1:
            raise HTTPException(status_code=404, detail={"code": "ERR004", "message": f"ไม่พบการจับคู่ที่เชื่อถือได้ (ดีที่สุด={best_distance:.4f}, รอง={second_distance:.4f})"})

    logger.info(f"[face-recognition] SUCCESS: user={best_user}, distance={best_distance:.4f}")
    return {
        "status": "Success", 
        "user_id": best_user, 
        "file_name": file_name,
        "distance": best_distance, 
        "threshold": EUCLIDEAN_THRESHOLD
    }