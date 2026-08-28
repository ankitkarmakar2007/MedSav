import os
import json

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


# ---------------------------------------------------------
# LOCAL DEVELOPMENT
# ---------------------------------------------------------
# If firebase-key.json exists, use it locally.
# ---------------------------------------------------------

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


# ---------------------------------------------------------
# PRODUCTION / VERCEL
# ---------------------------------------------------------
# If the local JSON file is not available,
# use FIREBASE_SERVICE_ACCOUNT.
# ---------------------------------------------------------

if firebase_credentials is None:

    firebase_service_account = os.getenv(
        "FIREBASE_SERVICE_ACCOUNT"
    )


    if not firebase_service_account:

        raise RuntimeError(
            "Firebase credentials not found."
        )


    try:

        firebase_credentials = json.loads(
            firebase_service_account
        )

    except json.JSONDecodeError as error:

        raise RuntimeError(
            "FIREBASE_SERVICE_ACCOUNT contains invalid JSON."
        ) from error


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