import os
import sys


# =========================================================
# LOCATE BACKEND FOLDER
# =========================================================

BACKEND_DIR = os.path.abspath(
    os.path.join(
        os.path.dirname(__file__),
        "..",
        "backend"
    )
)


# =========================================================
# ADD BACKEND TO PYTHON PATH
# =========================================================

if BACKEND_DIR not in sys.path:

    sys.path.insert(
        0,
        BACKEND_DIR
    )


# =========================================================
# IMPORT FLASK APP
# =========================================================

from app import app