import os
import json
import base64

from dotenv import load_dotenv

import firebase_admin
from firebase_admin import credentials, firestore


# =========================================================
# LOAD ENVIRONMENT VARIABLES
# =========================================================

load_dotenv()


# =========================================================
# FIREBASE CREDENTIALS
# =========================================================

firebase_credentials = None


# =========================================================
# PRODUCTION / VERCEL
# =========================================================
# Vercel stores the Firebase service-account JSON as
# a Base64 string to avoid private-key formatting issues.
# =========================================================

firebase_service_account_b64 = os.getenv(
    "FIREBASE_SERVICE_ACCOUNT_B64"
)


if firebase_service_account_b64:

    try:

        decoded_json = base64.b64decode(
            firebase_service_account_b64
        ).decode(
            "utf-8"
        )

        firebase_credentials = json.loads(
            decoded_json
        )

    except Exception as error:

        raise RuntimeError(
            "FIREBASE_SERVICE_ACCOUNT_B64 is invalid."
        ) from error


# =========================================================
# LOCAL DEVELOPMENT FALLBACK
# =========================================================

if firebase_credentials is None:

    firebase_key_file = os.path.join(
        os.path.dirname(__file__),
        "firebase-key.json"
    )


    if os.path.exists(firebase_key_file):

        with open(
            firebase_key_file,
            "r",
            encoding="utf-8"
        ) as file:

            firebase_credentials = json.load(
                file
            )


# =========================================================
# CHECK CREDENTIALS
# =========================================================

if firebase_credentials is None:

    raise RuntimeError(
        "Firebase credentials not found."
    )


# =========================================================
# INITIALIZE FIREBASE
# =========================================================

if not firebase_admin._apps:

    cred = credentials.Certificate(
        firebase_credentials
    )

    firebase_admin.initialize_app(
        cred
    )


# =========================================================
# FIRESTORE
# =========================================================

db = firestore.client()


# =========================================================
# GET MEDICINES
# =========================================================

def get_medicines():

    medicines_ref = db.collection(
        "medicines"
    )

    medicines = medicines_ref.stream()

    medicine_list = []


    for medicine in medicines:

        data = medicine.to_dict()

        data["id"] = medicine.id

        medicine_list.append(
            data
        )


    return medicine_list