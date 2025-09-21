from fastapi import APIRouter, Form, File, UploadFile, HTTPException
import numpy as np
import cv2
from deepface import DeepFace
import pgvector.psycopg2
from pgvector.psycopg2 import register_vector
from pgvector import Vector
from psycopg2 import connect
from collections import defaultdict
import statistics
import logging
import sys, os
import contextlib
from numpy.linalg import norm

router = APIRouter()

logging.basicConfig(level=logging.INFO)
MODEL_NAME = "Facenet512"  # Change to "ArcFace" for comparison
EUCLIDEAN_THRESHOLD = 1.04 # Need to adjust to match with Model https://github.com/serengil/deepface/blob/master/deepface/config/threshold.py
ALLOWED_EXTENSIONS = {"jpg", "jpeg", "png"}
DETECTOR = "mtcnn" # or mtcnn, retinaface

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

def get_db_conn():
    conn = connect(
        dbname="postgres",
        user="postgres",
        password="password",
        host="localhost",
        port="5432",
        options="-c search_path=myclassmate"
    )
    pgvector.psycopg2.register_vector(conn)  # register vector type
    register_vector(conn) # register vector type
    return conn

@router.post("/face-register")
async def post_face_register(user_id: str = Form(...), files: list[UploadFile] = File(...)):
    logging.info(f"start post_face_register, user_id: {user_id}")
    if len(files) > 4:
        raise HTTPException(status_code=400, detail={"code": "ERR001", "message": "Maximum 4 images allowed"})

    for file in files:
        ext = file.filename.rsplit(".", 1)[-1].lower()
        if ext not in ALLOWED_EXTENSIONS:
            raise HTTPException(
                status_code=400,
                detail={"code": "ERR002", "message": f"Invalid file extension '{ext}'. Only jpg/jpeg/png allowed."}
            )

    conn = get_db_conn()
    try:
        with conn.cursor() as cur:
            # step 1. delete old files
            cur.execute("DELETE FROM identities WHERE user_id = %s", (user_id,))

            # step 2. Loop foreach file and insert to db
            for file in files:
                image_bytes = await file.read()
                image_np = np.frombuffer(image_bytes, np.uint8)
                image = cv2.imdecode(image_np, cv2.IMREAD_COLOR)

                # Extract faces from image
                with suppress_tf_logs():
                    faces = DeepFace.extract_faces(
                        image,
                        detector_backend=DETECTOR,
                        enforce_detection=False
                    )

                    if not faces:
                        raise HTTPException(
                            status_code=400,
                            detail={"code": "ERR005", "message": f"No face detected in {file.filename}"}
                        )

                    face_img = faces[0]["face"]

                    embedding = np.array(
                        DeepFace.represent(
                            face_img,
                            model_name=MODEL_NAME,
                            detector_backend="skip",
                            enforce_detection=False
                        )[0]["embedding"]
                    )
                embedding = embedding / norm(embedding)

                # Convert NumPy array to Python list (vector type)
                embedding_list = embedding.tolist()

                cur.execute(
                    "INSERT INTO identities (user_id, file_name, embedding) VALUES (%s, %s, %s)",
                    (user_id, file.filename, Vector(embedding_list))
                )
        conn.commit()
    finally:
        conn.close()

    return {
        "status": "success",
        "user_id": user_id,
        "num_faces_registered": len(files),
        "files": [file.filename for file in files]
    }

@router.post("/face-recognition-1")
async def post_face_recognition_1(file: UploadFile = File(...)):
    logging.info(f"start post_face_recognition")
    # 1. Read file
    image_bytes = await file.read()
    image_np = np.frombuffer(image_bytes, np.uint8)
    image = cv2.imdecode(image_np, cv2.IMREAD_COLOR)

    # Extract faces from image
    with suppress_tf_logs():
        faces = DeepFace.extract_faces(
            image,
            detector_backend=DETECTOR,
            enforce_detection=False
        )

        if not faces:
            raise HTTPException(
                status_code=400,
                detail={"code": "ERR005", "message": f"No face detected in {file.filename}"}
            )

        face_img = faces[0]["face"]

        embedding = np.array(
            DeepFace.represent(
                face_img,
                model_name=MODEL_NAME,
                detector_backend="skip",
                enforce_detection=False
            )[0]["embedding"]
        )

    # 2. Extract embedding
    embedding = embedding / norm(embedding)
    target_embedding = Vector(embedding.tolist())  # convert to Python list (512-d)

    # 3. Threshold for Euclidean distance
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
        raise HTTPException(
            status_code=404,
            detail={"code": "ERR003", "message": f"No face found within threshold: {EUCLIDEAN_THRESHOLD}"}
        )

    # 4. รวม distance ต่อ user
    user_distances = defaultdict(list)
    for row in results:
        logging.info(f"post_face_recognition, row: {row}")
        user_id, file_name, distance = row[0], row[1], row[2]
        user_distances[user_id].append(distance)
    
    # --- RULE 1: Exact match check (min == 0.0) ---
    for user_id, distances in user_distances.items():
        if min(distances) <= 1e-6:
            logging.info(f"Exact match found: {user_id}")
            return {
                "status": "success",
                "user_id": user_id,
                "distance": 0.0,
                "threshold": EUCLIDEAN_THRESHOLD
            }

    # --- RULE 2: Top-K majority vote ---
    K = 5
    top_k = results[:K]
    user_counts = defaultdict(int)
    topk_distances = defaultdict(list)

    for user_id, file_name, distance in top_k:
        user_counts[user_id] += 1
        topk_distances[user_id].append(distance)

    majority_user = max(user_counts.items(), key=lambda x: x[1])[0]
    tied_users = [u for u, c in user_counts.items() if c == user_counts[majority_user]]

    if len(tied_users) > 1:
        # tie → median ตัดสิน
        majority_user = min(tied_users, key=lambda u: statistics.median(topk_distances[u]))

    best_user = majority_user
    best_distance = statistics.median(topk_distances[best_user])

    # --- RULE 3: threshold check ---
    if best_distance > EUCLIDEAN_THRESHOLD:
        raise HTTPException(
            status_code=404,
            detail={
                "code": "ERR004",
                "message": f"Closest face distance exceeds threshold: {best_distance:.4f}"
            }
        )
    
    # --- RULE 4: Confidence margin check ---
    sorted_all = sorted(
        [(uid, statistics.median(dists)) for uid, dists in user_distances.items()],
        key=lambda x: x[1]
    )

    if len(sorted_all) > 1:
        _, second_distance = sorted_all[1]
        margin_ratio = (second_distance - best_distance) / max(best_distance, 1e-6)

        if margin_ratio < 0.05:
            if user_counts[best_user] <= 1:
                # ไม่มี majority → reject
                raise HTTPException(
                    status_code=400,
                    detail={
                        "code": "ERR004",
                        "message": f"No confident match (best={best_distance:.4f}, second={second_distance:.4f})"
                    }
                )
            else:
                logging.info(f"Margin close but majority vote favors {best_user}")

    # --- SUCCESS ---
    logging.info(f"post_face_recognition, best_user: {best_user}, distance: {best_distance}")
    return {
        "status": "success",
        "user_id": best_user,
        "distance": best_distance,
        "threshold": EUCLIDEAN_THRESHOLD
    }