from fastapi import APIRouter, Form, File, UploadFile, HTTPException
import numpy as np
import cv2
from deepface import DeepFace
import pgvector.psycopg2
from psycopg2 import connect
from collections import defaultdict
import statistics
import logging
import sys, os
import contextlib

router = APIRouter()

logging.basicConfig(level=logging.INFO)
MODEL_NAME = "Facenet512"  # Change to "ArcFace" for comparison
EUCLIDEAN_THRESHOLD = 23.56 # Need to adjust to match with Model https://github.com/serengil/deepface/blob/master/deepface/config/threshold.py (Facenet512=23.56, ArcFace=4.15)
ALLOWED_EXTENSIONS = {"jpg", "jpeg", "png"}
DETECTOR = "mtcnn" # or mtcnn, retinaface

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
    return conn

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

@router.post("/face-register")
async def post_face_register(user_id: str = Form(...), files: list[UploadFile] = File(...)):
    logging.info(f"start post_face_register, user_id: {user_id}")
    if len(files) > 4:
        raise HTTPException(status_code=400, detail={"code": "ERR001", "message": "Maximum 4 images allowed"})

    embeddings = []

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
                            enforce_detection=False
                        )[0]["embedding"]
                    )

                # Convert NumPy array to Python list (vector type)
                embedding_list = embedding.tolist()

                cur.execute(
                    "INSERT INTO identities (user_id, file_name, embedding) VALUES (%s, %s, %s)",
                    (user_id, file.filename, embedding_list)
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

@router.post("/face-recognition")
async def post_face_recognition(file: UploadFile = File(...)):
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
                enforce_detection=False
            )[0]["embedding"]
        )

    # 2. Extract embedding
    target_embedding = embedding.tolist()  # convert to Python list (512-d)

    # 3. Threshold for Euclidean distance
    conn = get_db_conn()
    try:
        with conn.cursor() as cur:
            cur.execute(
                f"""
                    SELECT *
                    FROM (
                        SELECT user_id, embedding <-> '{str(target_embedding)}' as distance
                        FROM identities i
                    ) a
                    WHERE distance < {EUCLIDEAN_THRESHOLD}
                    ORDER BY distance asc
                    LIMIT 100
                """
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
        user_id = row[0]
        distance = row[-1]
        user_distances[user_id].append(distance)

    # ChatGPT 1 
    # # 5. find best user
    best_user = None
    best_distance = float("inf")
    exact_match = 0.0

    for user_id, distances in user_distances.items():
        if exact_match in distances:
            best_user = user_id
            best_distance = 0.0
            break

        stat_dist = statistics.median(distances)

        if stat_dist < best_distance:
            best_distance = stat_dist
            best_user = user_id
        elif stat_dist == best_distance:
            if min(distances) < best_distance:
                best_user = user_id
                best_distance = min(distances)

    if best_user is None or best_distance > EUCLIDEAN_THRESHOLD:
        raise HTTPException(
            status_code=404,
            detail={
                "code": "ERR004",
                "message": f"Closest face distance exceeds threshold: {best_distance:.4f}"
            }
        )

    logging.info(f"post_face_register, best_user: {best_user}, distance: {best_distance}")
    return {"status": "success", "user_id": best_user, "distance": best_distance, "threshold": EUCLIDEAN_THRESHOLD}

    # ChatGPT 2
    # 5. Analyze confidence per user
    # HIGH_CONFIDENCE_THRESHOLD = 5.0
    # MEDIUM_CONFIDENCE_THRESHOLD = 15.0

    # users_analysis = {}
    # for user_id, distances in user_distances.items():
    #     min_distance = min(distances)
    #     avg_distance = sum(distances) / len(distances)
    #     count = len(distances)
    #     high_conf_count = sum(1 for d in distances if d <= HIGH_CONFIDENCE_THRESHOLD)
    #     medium_conf_count = sum(1 for d in distances if d <= MEDIUM_CONFIDENCE_THRESHOLD)

    #     # เก็บเฉพาะ user ที่มี high/medium confidence ≥ 1
    #     if high_conf_count >= 1 or medium_conf_count >= 1:
    #         users_analysis[user_id] = {
    #             "min_distance": min_distance,
    #             "avg_distance": avg_distance,
    #             "count": count,
    #             "high_conf_count": high_conf_count,
    #             "medium_conf_count": medium_conf_count
    #         }
    #         logging.info(f"User {user_id}: {users_analysis[user_id]}")

    # # 6. เลือก user ที่ดีที่สุด
    # if not users_analysis:
    #     raise HTTPException(
    #         status_code=404,
    #         detail={"code": "ERR004", "message": "No suitable match found"}
    #     )

    # # priority: exact match > high confidence > medium confidence > min distance
    # best_user = None
    # best_data = None

    # # 1. exact match (min_distance = 0.0)
    # exact_matches = {uid: data for uid, data in users_analysis.items() if data["min_distance"] == 0.0}
    # if exact_matches:
    #     # เลือก exact match ที่มี count มากที่สุด
    #     best_user = max(exact_matches.keys(), key=lambda uid: exact_matches[uid]["count"])
    #     best_data = exact_matches[best_user]
    #     logging.info(f"Found exact match: User {best_user}")
    # else:
    #     # 2. high confidence
    #     high_conf_users = {uid: data for uid, data in users_analysis.items() if data["high_conf_count"] > 0}
    #     if high_conf_users:
    #         best_user = min(high_conf_users.keys(), key=lambda uid: (-high_conf_users[uid]["high_conf_count"], high_conf_users[uid]["min_distance"]))
    #         best_data = high_conf_users[best_user]
    #         logging.info(f"Selected high confidence user: {best_user}")
    #     else:
    #         # 3. medium confidence
    #         medium_conf_users = {uid: data for uid, data in users_analysis.items() if data["medium_conf_count"] > 0}
    #         if medium_conf_users:
    #             best_user = min(medium_conf_users.keys(), key=lambda uid: (-medium_conf_users[uid]["medium_conf_count"], medium_conf_users[uid]["min_distance"]))
    #             best_data = medium_conf_users[best_user]
    #             logging.info(f"Selected medium confidence user: {best_user}")
    #         else:
    #             # fallback: user ที่มี min_distance ต่ำสุด
    #             best_user = min(users_analysis.keys(), key=lambda uid: users_analysis[uid]["min_distance"])
    #             best_data = users_analysis[best_user]
    #             logging.info(f"Selected user by min distance: {best_user}")

    # return {
    #     "status": "success",
    #     "threshold": EUCLIDEAN_THRESHOLD,
    #     "user": {
    #         "user_id": best_user,
    #         **best_data
    #     }
    # }