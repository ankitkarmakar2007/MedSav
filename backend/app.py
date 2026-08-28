from flask import Flask, jsonify, request
from flask_cors import CORS

from dotenv import load_dotenv

import os

from database import get_medicines


# =========================================================
# LOAD ENVIRONMENT VARIABLES
# =========================================================

load_dotenv()


# =========================================================
# CREATE FLASK APP
# ========================================================= 

app = Flask(__name__)

CORS(app)


# =========================================================
# HOME
# =========================================================

@app.route("/")
def home():

    return "MedSav Backend is running!"


# =========================================================
# TEST FIREBASE
# =========================================================

@app.route("/test-firebase")
def test_firebase():

    return jsonify({
        "success": True,
        "message": "Firebase connected successfully!"
    })

# =========================================================
# GOOGLE MAPS API KEY
# =========================================================

@app.route("/api/maps-key")
def maps_key():

    key = os.getenv(
        "GOOGLE_MAPS_API_KEY"
    )

    if not key:

        return jsonify({
            "success": False,
            "message": "Google Maps API key is not configured."
        }), 500

    return jsonify({
        "success": True,
        "key": key
    })

# =========================================================
# GET ALL MEDICINES
# =========================================================

@app.route("/api/medicines")
def medicines():

    data = get_medicines()

    return jsonify({
        "success": True,
        "medicines": data
    })


# =========================================================
# SEARCH MEDICINE
# =========================================================

@app.route("/api/search")
def search_medicine():

    # -----------------------------------------------------
    # GET SEARCHED MEDICINE
    # -----------------------------------------------------

    medicine_query = request.args.get(
        "medicine",
        ""
    ).strip().lower()


    if not medicine_query:

        return jsonify({
            "success": False,
            "message": "Medicine name is required.",
            "results": []
        }), 400


    print(
        "MediFind: searching Firebase for:",
        medicine_query
    )


    # -----------------------------------------------------
    # GET ALL MEDICINES FROM FIREBASE
    # -----------------------------------------------------

    medicines_data = get_medicines()


    if not medicines_data:

        return jsonify({
            "success": True,
            "results": []
        })


    # -----------------------------------------------------
    # FIND MATCHING MEDICINES
    # -----------------------------------------------------

    results = []


    for medicine in medicines_data:

        if not isinstance(
            medicine,
            dict
        ):
            continue


        # ---------------------------------------------
        # MEDICINE NAME
        # ---------------------------------------------

        name = str(
            medicine.get(
                "name",
                ""
            )
        ).strip().lower()


        # ---------------------------------------------
        # GENERIC NAME
        # ---------------------------------------------

        generic_name = str(
            medicine.get(
                "generic_name",
                ""
            )
        ).strip().lower()


        # ---------------------------------------------
        # COMPOSITION
        # ---------------------------------------------

        composition = str(
            medicine.get(
                "composition",
                ""
            )
        ).strip().lower()


        # ---------------------------------------------
        # CHECK MATCH
        # ---------------------------------------------

        is_match = (

            medicine_query == name

            or

            medicine_query in name

            or

            name in medicine_query

            or

            medicine_query == generic_name

            or

            medicine_query in generic_name

            or

            generic_name in medicine_query

            or

            medicine_query == composition

            or

            medicine_query in composition

            or

            composition in medicine_query

        )


        if is_match:

            results.append(
                medicine
            )


    # -----------------------------------------------------
    # RETURN RESULTS
    # -----------------------------------------------------

    print(
        "MediFind: matching medicines:",
        len(results)
    )


    return jsonify({

        "success": True,

        "results": results

    })


# =========================================================
# START SERVER
# =========================================================


print("\nREGISTERED ROUTES:")
print(app.url_map)

if __name__ == "__main__":

    app.run(

        debug=True,

        host="0.0.0.0",

        port=5000

    )

