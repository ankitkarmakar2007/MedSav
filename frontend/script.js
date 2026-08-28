/* ==========================================
   MEDIFIND PROTOTYPE JAVASCRIPT
========================================== */

/* =====================================================
   API BASE URL
===================================================== */

const API_BASE_URL =
    (
        window.location.hostname === "localhost" ||
        window.location.hostname === "127.0.0.1"
    )
        ? "http://127.0.0.1:5000"
        : "";
/* ==========================================
   DUMMY MEDICINE DATA
========================================== */

let medicines = [];


/* ==========================================
   SEARCH ELEMENTS
========================================== */

const searchInput =
    document.getElementById("medicine-search");

const nearbyButton =
    document.getElementById("nearby-btn");

const searchButton =
    document.getElementById("search-btn");

const searchMessage =
    document.getElementById("search-message");

const selectedMedicine =
    document.getElementById("selected-medicine");

/* =====================================================
   USER LOCATION
===================================================== */

let userLatitude = null;
let userLongitude = null;

let userLocationReady = false;

/* =====================================================
   GET USER'S CURRENT LOCATION
===================================================== */

function getUserLocation() {

    return new Promise(
        function (resolve, reject) {

            if (
                !navigator.geolocation
            ) {

                console.error(
                    "MediFind: Geolocation is not supported by this browser."
                );

                reject(
                    new Error(
                        "Geolocation is not supported."
                    )
                );

                return;
            }


            navigator.geolocation.getCurrentPosition(

                function (position) {

                    userLatitude =
                        position.coords.latitude;


                    userLongitude =
                        position.coords.longitude;


                    userLocationReady =
                        true;


                    console.log(
                        "MediFind: User location:",
                        userLatitude,
                        userLongitude
                    );


                    resolve({
                        lat:
                            userLatitude,

                        lng:
                            userLongitude
                    });

                },


                function (error) {

                    console.error(
                        "MediFind: Unable to get user location:",
                        error
                    );


                    userLocationReady =
                        false;


                    reject(
                        error
                    );

                },


                {
                    enableHighAccuracy: true,

                    timeout: 10000,

                    maximumAge: 30000
                }

            );

        }
    );
}

/* =========================================================
   UPDATE MAP TO USER LOCATION
========================================================= */

function updateMapToUserLocation() {

    if (
        !medifindMap ||
        userLatitude === null ||
        userLongitude === null
    ) {

        return;
    }


    const userPosition =
        {
            lat:
                userLatitude,

            lng:
                userLongitude
        };


    medifindMap.setCenter(
        userPosition
    );


    /*
       Zoom closer to the user.
    */

    medifindMap.setZoom(
        14
    );


    createUserLocationMarker();


    console.log(
        "MediFind: Map centered on user location."
    );

}

/* =====================================================
   REQUEST LOCATION ON PAGE LOAD
===================================================== */

getUserLocation()
    .then(
        function (location) {

            console.log(
                "MediFind: Location ready:",
                location
            );
            updateMapToUserLocation();
        }
    )
    .catch(
        function () {

            console.warn(
                "MediFind: User location permission was not granted."
            );

        }
    );


/* ==========================================
   SEARCH MEDICINE
========================================== */

/* ==========================================
   SEARCH BUTTON
========================================== */

if (searchButton) {

    searchButton.addEventListener(
        "click",
        function () {

            searchMedicine();

        }
    );

}


/* ==========================================
   ENTER KEY SEARCH
========================================== */

if (searchInput) {

    searchInput.addEventListener(
        "keydown",
        function (event) {

            if (event.key === "Enter") {

                event.preventDefault();

                searchMedicine();

            }

        }
    );

}


async function searchMedicine() {

        /* =====================================================
       MAKE SURE USER LOCATION IS AVAILABLE
    ===================================================== */

    if (!userLocationReady) {

        try {

            await getUserLocation();

        }

        catch (error) {

            console.warn(
                "MediFind: User location unavailable. Using fallback location."
            );

        }
    }

    /* =====================================================
       CHECK SEARCH INPUT
    ===================================================== */

    if (!searchInput) {

        console.error(
            "MediFind: Search input not found."
        );

        return;
    }


    /* =====================================================
       GET SEARCH QUERY
    ===================================================== */

    const query =
        searchInput.value
            .trim()
            .toLowerCase();


    /* =====================================================
       EMPTY SEARCH
    ===================================================== */

    if (query === "") {

        if (searchMessage) {

            searchMessage.textContent =
                "Please enter a medicine name.";

            searchMessage.style.color =
                "";
        }

        return;
    }


    /* =====================================================
       GET MEDICINES FROM FIREBASE
    ===================================================== */

    const medicineList =
        window.medicinesData || [];


    console.log(
        "MediFind: Searching for:",
        query
    );


    console.log(
        "MediFind: Available medicines:",
        medicineList
    );


    /* =====================================================
       CHECK IF FIREBASE DATA IS LOADED
    ===================================================== */

    if (
        !Array.isArray(medicineList) ||
        medicineList.length === 0
    ) {

        console.error(
            "MediFind: No medicines loaded into window.medicinesData."
        );


        if (searchMessage) {

            searchMessage.textContent =
                "Medicine data is still loading. Please try again.";

            searchMessage.style.color =
                "#d07a4f";
        }

        return;
    }


    /* =====================================================
       FIND MEDICINE
       
       PRIORITY:
       
       1. Exact branded name
       2. Partial branded name
       3. Exact generic name
       4. Partial generic name
       5. Composition
    ===================================================== */

    let foundMedicine = null;


    /* =====================================================
       1. EXACT BRANDED NAME
    ===================================================== */

    foundMedicine =
        medicineList.find(
            function (medicine) {

                const medicineName =
                    String(
                        medicine.name || ""
                    )
                    .toLowerCase()
                    .trim();


                return (
                    medicineName &&
                    medicineName === query
                );
            }
        );


    /* =====================================================
       2. PARTIAL BRANDED NAME
    ===================================================== */

    if (!foundMedicine) {

        foundMedicine =
            medicineList.find(
                function (medicine) {

                    const medicineName =
                        String(
                            medicine.name || ""
                        )
                        .toLowerCase()
                        .trim();


                    return (
                        medicineName &&
                        medicineName.includes(
                            query
                        )
                    );
                }
            );
    }


    /* =====================================================
       3. EXACT GENERIC NAME
    ===================================================== */

    if (!foundMedicine) {

        foundMedicine =
            medicineList.find(
                function (medicine) {

                    const genericName =
                        String(
                            medicine.generic_name || ""
                        )
                        .toLowerCase()
                        .trim();


                    return (
                        genericName &&
                        genericName === query
                    );
                }
            );
    }


    /* =====================================================
       4. PARTIAL GENERIC NAME
    ===================================================== */

    if (!foundMedicine) {

        foundMedicine =
            medicineList.find(
                function (medicine) {

                    const genericName =
                        String(
                            medicine.generic_name || ""
                        )
                        .toLowerCase()
                        .trim();


                    return (
                        genericName &&
                        genericName.includes(
                            query
                        )
                    );
                }
            );
    }


    /* =====================================================
       5. COMPOSITION
    ===================================================== */

    if (!foundMedicine) {

        foundMedicine =
            medicineList.find(
                function (medicine) {

                    const composition =
                        String(
                            medicine.composition || ""
                        )
                        .toLowerCase()
                        .trim();


                    return (
                        composition &&
                        composition.includes(
                            query
                        )
                    );
                }
            );
    }


    /* =====================================================
       MEDICINE FOUND
    ===================================================== */

    if (foundMedicine) {

        console.log(
            "✅ MediFind: Medicine found:",
            foundMedicine
        );


        /* =================================================
           NORMALIZED FIELDS
        ================================================= */

        const searchedQuery =
            query
                .toLowerCase()
                .trim();


        const brandedMedicineName =
            String(
                foundMedicine.name || ""
            )
            .toLowerCase()
            .trim();


        const genericMedicineName =
            String(
                foundMedicine.generic_name || ""
            )
            .toLowerCase()
            .trim();


        const compositionName =
            String(
                foundMedicine.composition || ""
            )
            .toLowerCase()
            .trim();


        /* =================================================
           DETERMINE SEARCH TYPE
           
           false = branded medicine search
           true  = generic/composition search
        ================================================= */

        let isAlternative = false;


        /* -------------------------------------------------
           GENERIC NAME SEARCH
        ------------------------------------------------- */

        if (
            genericMedicineName &&
            (
                searchedQuery ===
                    genericMedicineName

                ||

                genericMedicineName.includes(
                    searchedQuery
                )
            )
        ) {

            isAlternative = true;
        }


        /* -------------------------------------------------
           COMPOSITION SEARCH
        ------------------------------------------------- */

        if (
            !isAlternative &&
            compositionName &&
            (
                searchedQuery ===
                    compositionName

                ||

                compositionName.includes(
                    searchedQuery
                )
            )
        ) {

            isAlternative = true;
        }


        /* -------------------------------------------------
           BRAND NAME TAKES PRIORITY
           
           If the query matches the brand,
           always treat it as a branded search.
        ------------------------------------------------- */

        if (
            brandedMedicineName &&
            (
                searchedQuery ===
                    brandedMedicineName

                ||

                brandedMedicineName.includes(
                    searchedQuery
                )
            )
        ) {

            isAlternative = false;
        }


        /* =================================================
           DETERMINE DISPLAY NAME
           
           BRAND SEARCH:
           → foundMedicine.name
           
           GENERIC SEARCH:
           → foundMedicine.generic_name
        ================================================= */

        const displayMedicineName =
            isAlternative

                ? String(
                    foundMedicine.generic_name ||
                    foundMedicine.name ||
                    searchedQuery
                ).trim()

                : String(
                    foundMedicine.name ||
                    searchedQuery
                ).trim();


        console.log(
            "MediFind: Display medicine name:",
            displayMedicineName
        );


        console.log(
            "MediFind: Is generic/alternative search:",
            isAlternative
        );


        /* =================================================
           UPDATE MAIN SELECTED MEDICINE
        ================================================= */

        if (selectedMedicine) {

            selectedMedicine.textContent =
                displayMedicineName;
        }


        /* =================================================
           UPDATE MAP CARD TITLE
        ================================================= */

        const selectedMedicineElement =
            document.getElementById(
                "selected-medicine"
            );


        if (selectedMedicineElement) {

            selectedMedicineElement.textContent =
                displayMedicineName;
        }


        /* =================================================
           UPDATE SEARCH MESSAGE
        ================================================= */

        if (searchMessage) {

            searchMessage.textContent =
                "Medicine found.";

            searchMessage.style.color =
                "#079d99";
        }


        /* =================================================
           UPDATE SMART ALTERNATIVE SECTION
        ================================================= */

        displayMedicineComparison(
            foundMedicine
        );


        /* =================================================
           PHARMACY SEARCH KEY
           
           IMPORTANT:
           This value is ONLY for finding pharmacy
           prices and stock.

           It is NOT the display name.
        ================================================= */

        const pharmacyMedicineName =
            String(
                foundMedicine.composition ||
                foundMedicine.generic_name ||
                foundMedicine.name ||
                ""
            ).trim();


        console.log(
            "MediFind: Pharmacy search key:",
            pharmacyMedicineName
        );


        /* =================================================
           UPDATE MAP PHARMACY PRICES
           
           Branded search:
           → branded_price
           
           Generic search:
           → generic_price
        ================================================= */

        updateMapPriceCard(
            pharmacyMedicineName,
            isAlternative
        );


        /* =================================================
           UPDATE PHARMACY RESULT CARDS
        ================================================= */

        renderPharmacyResults(
            pharmacyMedicineName,
            isAlternative
        );


        /* =================================================
           UPDATE MAP MARKERS
        ================================================= */

        searchNearbyPharmacies(
            pharmacyMedicineName,
            foundMedicine.pharmacies
        );


        /* =================================================
           FINAL DISPLAY NAME
           
           This is just a final safety update.
        ================================================= */

        const finalMapName =
            document.getElementById(
                "selected-medicine"
            );


        if (finalMapName) {

            finalMapName.textContent =
                displayMedicineName;
        }


        console.log(
            "MediFind: Search completed successfully."
        );

    }


    /* =====================================================
       MEDICINE NOT FOUND
    ===================================================== */

    else {

        console.log(
            "❌ MediFind: Medicine not found:",
            query
        );


        /* =================================================
           UPDATE SELECTED MEDICINE
        ================================================= */

        if (selectedMedicine) {

            selectedMedicine.textContent =
                searchInput.value.trim();
        }


        /* =================================================
           UPDATE MAP CARD TITLE
        ================================================= */

        const selectedMedicineElement =
            document.getElementById(
                "selected-medicine"
            );


        if (selectedMedicineElement) {

            selectedMedicineElement.textContent =
                searchInput.value.trim();
        }


        /* =================================================
           UPDATE SEARCH MESSAGE
        ================================================= */

        if (searchMessage) {

            searchMessage.textContent =
                "Medicine not found in our database.";

            searchMessage.style.color =
                "#d07a4f";
        }


        /* =================================================
           CLEAR PHARMACY RESULTS
        ================================================= */

        const resultsList =
            document.getElementById(
                "pharmacy-results-list"
            );


        if (resultsList) {

            resultsList.innerHTML =
                "";
        }


        console.warn(
            "MediFind: No medicine found for:",
            query
        );
    }

}

/* ==========================================
   NEARBY BUTTON
========================================== */

if (nearbyButton) {

    nearbyButton.addEventListener(
        "click",
        async function () {

            /* ==========================================
               CHECK USER LOCATION
            ========================================== */

            if (!userLocationReady) {

                if (searchMessage) {

                    searchMessage.textContent =
                        "📍 Getting your location...";

                }


                try {

                    await getUserLocation();

                }

                catch (error) {

                    console.error(
                        "MediFind: Could not get user location:",
                        error
                    );


                    if (searchMessage) {

                        searchMessage.textContent =
                            "Unable to access your location.";

                    }

                    return;
                }

            }


            /* ==========================================
               CHECK CURRENT MEDICINE
            ========================================== */

            const currentMedicineName =
                searchInput
                    ? searchInput.value.trim()
                    : "";


            if (!currentMedicineName) {

                if (searchMessage) {

                    searchMessage.textContent =
                        "Please search for a medicine first.";

                }

                return;
            }


            /* ==========================================
               FIND CURRENT MEDICINE IN FIREBASE
            ========================================== */

            const medicineList =
                window.medicinesData || [];


            const currentMedicine =
                medicineList.find(
                    function (medicine) {

                        const name =
                            String(
                                medicine.name || ""
                            )
                            .toLowerCase()
                            .trim();


                        const generic =
                            String(
                                medicine.generic_name || ""
                            )
                            .toLowerCase()
                            .trim();


                        const query =
                            currentMedicineName
                                .toLowerCase()
                                .trim();


                        return (
                            name === query ||
                            generic === query
                        );

                    }
                );


            if (!currentMedicine) {

                if (searchMessage) {

                    searchMessage.textContent =
                        "Medicine not found in our database.";

                }

                return;
            }


            /* ==========================================
               GET PHARMACIES
            ========================================== */

            const pharmacies =
                currentMedicine.pharmacies;


            if (
                !pharmacies ||
                typeof pharmacies !== "object"
            ) {

                if (searchMessage) {

                    searchMessage.textContent =
                        "No pharmacy data available.";

                }

                return;
            }


            /* ==========================================
               SHOW MESSAGE
            ========================================== */

            if (searchMessage) {

                searchMessage.textContent =
                    "📍 Finding pharmacies near your location...";

            }


            /* ==========================================
               USE FIREBASE PHARMACY DATA
            ========================================== */

            searchNearbyPharmacies(
                currentMedicineName,
                pharmacies
            );


            /* ==========================================
               COUNT PHARMACIES WITHIN 5 KM
            ========================================== */

            let nearbyCount = 0;


            Object.entries(
                pharmacies
            ).forEach(
                function (
                    [pharmacyName, pharmacyData]
                ) {

                    const distance =
                        getPharmacyDistance(
                            pharmacyName,
                            pharmacyData
                        );


                    if (
                        distance !== null &&
                        distance <= 5
                    ) {

                        nearbyCount++;

                    }

                }
            );


            /* ==========================================
               UPDATE MESSAGE
            ========================================== */

            if (searchMessage) {

                searchMessage.textContent =
                    nearbyCount +
                    (
                        nearbyCount === 1
                            ? " pharmacy found within 5 km."
                            : " pharmacies found within 5 km."
                    );

            }


        }
    );

}


/* ==========================================
   ENTER AS PATIENT
========================================== */

const patientButton =
    document.querySelector(
        ".enter-btn:not(.pharmacy-enter)"
    );


if (patientButton) {

    patientButton.addEventListener(
        "click",
        function () {

            alert(
                "Patient mode selected.\n\n" +
                "In the final website, this will open the patient dashboard."
            );

        }
    );

}


/* ==========================================
   ENTER AS PHARMACY
========================================== */

const pharmacyButton =
    document.querySelector(
        ".pharmacy-enter"
    );


if (pharmacyButton) {

    pharmacyButton.addEventListener(
        "click",
        function () {

            alert(
                "Pharmacy mode selected.\n\n" +
                "In the final website, this will open the pharmacy dashboard."
            );

        }
    );

}


/* ==========================================
   GET STARTED
========================================== */

const getStartedButton =
    document.querySelector(
        ".get-started-btn"
    );


if (getStartedButton) {

    getStartedButton.addEventListener(
        "click",
        function () {

            const discover =
                document.getElementById(
                    "discover"
                );


            if (discover) {

                discover.scrollIntoView({
                    behavior: "smooth"
                });

            }

        }
    );

}


/* ==========================================
   SIGN IN
========================================== */

const signInButton =
    document.querySelector(
        ".signin-btn"
    );


if (signInButton) {

    signInButton.addEventListener(
        "click",
        function () {

            alert(
                "Sign in page will be connected later."
            );

        }
    );

}


/* ==========================================
   PHARMACY CTA
========================================== */

const pharmacyCTA =
    document.querySelector(
        ".pharmacy-cta"
    );


if (pharmacyCTA) {

    pharmacyCTA.addEventListener(
        "click",
        function () {

            alert(
                "Pharmacy registration will be added in the final version."
            );

        }
    );

}


/* ==========================================
   RECOMMENDATION CARD CLICK
========================================== */

const pharmacyCards =
    document.querySelectorAll(
        ".pharmacy-card"
    );


pharmacyCards.forEach(
    function (card) {

        card.addEventListener(
            "click",
            function () {

                pharmacyCards.forEach(
                    function (item) {

                        item.style.transform =
                            "";

                    }
                );


                card.style.transform =
                    "translateY(-8px)";

            }
        );

    }
);


/* ==========================================
   NAVBAR ACTIVE STATE
========================================== */

const navLinks =
    document.querySelectorAll(
        ".navbar a"
    );


navLinks.forEach(
    function (link) {

        link.addEventListener(
            "click",
            function () {

                navLinks.forEach(
                    function (item) {

                        item.classList.remove(
                            "active"
                        );

                    }
                );


                link.classList.add(
                    "active"
                );

            }
        );

    }
);


/* ==========================================
   MOBILE MENU
========================================== */

const menuButton =
    document.getElementById(
        "menu-btn"
    );


if (menuButton) {

    menuButton.addEventListener(
        "click",
        function () {

            const navbar =
                document.querySelector(
                    ".navbar"
                );


            if (!navbar) {
                return;
            }


            if (
                navbar.style.display ===
                "flex"
            ) {

                navbar.style.display =
                    "none";

            }

            else {

                navbar.style.display =
                    "flex";

                navbar.style.position =
                    "absolute";

                navbar.style.top =
                    "82px";

                navbar.style.left =
                    "0";

                navbar.style.right =
                    "0";

                navbar.style.background =
                    "white";

                navbar.style.padding =
                    "20px";

                navbar.style.flexDirection =
                    "column";

                navbar.style.gap =
                    "15px";

                navbar.style.boxShadow =
                    "0 10px 20px rgba(0,0,0,0.08)";

            }

        }
    );

}


/* ==========================================
   FUEL / TRAVEL COST CALCULATION
========================================== */

const mileageInput =
    document.getElementById(
        "mileage"
    );

const fuelPriceInput =
    document.getElementById(
        "fuel-price"
    );


function calculateTravelCost() {

    if (
        !mileageInput ||
        !fuelPriceInput
    ) {

        return;

    }


    const mileage =
        parseFloat(
            mileageInput.value
        );


    const fuelPrice =
        parseFloat(
            fuelPriceInput.value
        );


    if (
        !mileage ||
        mileage <= 0 ||
        !fuelPrice ||
        fuelPrice <= 0
    ) {

        return;

    }


    const pharmacyCards =
        document.querySelectorAll(
            ".pharmacy-card"
        );


    pharmacyCards.forEach(
        function (card) {

            const medicinePrice =
                parseFloat(
                    card.dataset.price
                );


            const distance =
                parseFloat(
                    card.dataset.distance
                );


            if (
                Number.isNaN(
                    medicinePrice
                ) ||
                Number.isNaN(
                    distance
                )
            ) {

                return;

            }


            const roundTripDistance =
                distance * 2;


            const fuelConsumed =
                roundTripDistance /
                mileage;


            const travelCost =
                fuelConsumed *
                fuelPrice;


            const effectiveCost =
                medicinePrice +
                travelCost;


            const fuelCostElement =
                card.querySelector(
                    ".fuel-cost"
                );


            const totalCostElement =
                card.querySelector(
                    ".total-cost"
                );


            if (fuelCostElement) {

                fuelCostElement.textContent =
                    "₹" +
                    travelCost.toFixed(2);

            }


            if (totalCostElement) {

                totalCostElement.textContent =
                    "₹" +
                    effectiveCost.toFixed(2);

            }

        }
    );


    findBestDecision();

}

/* ==========================================
   TREATMENT DURATION
========================================== */

let selectedDuration = 30;

/* ==========================================
   FIND BEST DECISION
========================================== */

function findBestDecision() {

    const pharmacyCards =
        document.querySelectorAll(
            ".pharmacy-card"
        );


    let bestCard = null;

    let lowestCost = Infinity;


    pharmacyCards.forEach(
        function (card) {

            const expiry =
                parseFloat(
                    card.dataset.expiry
                );


            const totalCostElement =
                card.querySelector(
                    ".total-cost"
                );


            if (!totalCostElement) {
                return;
            }


            const totalCost =
                parseFloat(
                    totalCostElement
                        .textContent
                        .replace("₹", "")
                );


            if (expiry >= selectedDuration) {

                if (
                    totalCost <
                    lowestCost
                ) {

                    lowestCost =
                        totalCost;

                    bestCard =
                        card;

                }

            }

        }
    );


    pharmacyCards.forEach(
        function (card) {

            const oldDecision =
                card.querySelector(
                    ".best-decision"
                );


            if (oldDecision) {

                oldDecision.remove();

            }

        }
    );


    if (bestCard) {

        const decision =
            document.createElement(
                "div"
            );


        decision.className =
            "best-decision";


        decision.innerHTML =
            "✓ BEST OPTION";


        bestCard.appendChild(
            decision
        );

    }

}

/* ==========================================
   TREATMENT DURATION POPUP
========================================== */

const durationButton =
    document.getElementById(
        "duration-button"
    );

const durationModal =
    document.getElementById(
        "duration-modal"
    );

const durationOverlay =
    document.getElementById(
        "duration-modal-overlay"
    );

const durationClose =
    document.getElementById(
        "duration-close"
    );

const durationInput =
    document.getElementById(
        "duration-input"
    );

const durationApply =
    document.getElementById(
        "duration-apply"
    );


/* ==========================================
   OPEN POPUP
========================================== */

if (durationButton) {

    durationButton.addEventListener(
        "click",
        function () {

            durationInput.value =
                selectedDuration;

            durationModal.style.display =
                "flex";

            durationInput.focus();

        }
    );

}


/* ==========================================
   CLOSE POPUP
========================================== */

function closeDurationModal() {

    if (durationModal) {

        durationModal.style.display =
            "none";

    }

}


if (durationClose) {

    durationClose.addEventListener(
        "click",
        closeDurationModal
    );

}


if (durationOverlay) {

    durationOverlay.addEventListener(
        "click",
        closeDurationModal
    );

}


/* ==========================================
   APPLY DURATION
========================================== */

if (durationApply) {

    durationApply.addEventListener(
        "click",
        function () {

            const enteredDays =
                parseInt(
                    durationInput.value,
                    10
                );


            /* ------------------------------
               VALIDATION
            ------------------------------ */

            if (
                Number.isNaN(
                    enteredDays
                ) ||
                enteredDays <= 0
            ) {

                alert(
                    "Please enter a valid number of days."
                );

                return;

            }


            /* ------------------------------
               SAVE DURATION
            ------------------------------ */

            selectedDuration =
                enteredDays;


            /* ------------------------------
               UPDATE BUTTON TEXT
            ------------------------------ */

            durationButton.textContent =
                enteredDays +
                "-day supply";


            /* ------------------------------
               CLOSE POPUP
            ------------------------------ */

            closeDurationModal();


            /* ------------------------------
               RECALCULATE RECOMMENDATION
            ------------------------------ */

            findBestDecision();

        }
    );

}


/* ==========================================
   ENTER KEY INSIDE POPUP
========================================== */

if (durationInput) {

    durationInput.addEventListener(
        "keydown",
        function (event) {

            if (
                event.key === "Enter"
            ) {

                event.preventDefault();

                durationApply.click();

            }

        }
    );

}

/* ==========================================
   UPDATE WHEN MILEAGE CHANGES
========================================== */

if (mileageInput) {

    mileageInput.addEventListener(
        "input",
        calculateTravelCost
    );

}


/* ==========================================
   UPDATE WHEN FUEL PRICE CHANGES
========================================== */

if (fuelPriceInput) {

    fuelPriceInput.addEventListener(
        "input",
        calculateTravelCost
    );

}


/* ==========================================
   CALCULATE ON PAGE LOAD
========================================== */

if (
    mileageInput &&
    fuelPriceInput
) {

    calculateTravelCost();

}


/* ==========================================
   PRESCRIPTION UI
========================================== */

function updatePrescriptionStatus(
    prescriptionRequired,
    medicine = null
) {

    const prescriptionBox =
        document.getElementById(
            "prescription-box"
        );

    const prescriptionTitle =
        document.getElementById(
            "prescription-title"
        );

    const prescriptionMessage =
        document.getElementById(
            "prescription-message"
        );

    const callDoctorButton =
        document.getElementById(
            "call-doctor-btn"
        );


    /* =====================================================
       MEDICINES THAT DO NOT REQUIRE PRESCRIPTION
    ===================================================== */

    const nonPrescriptionMedicines = [

        "amaryl 2",

        "glimepiride 2 mg - jan aushadhi",

        "telmikind 40",

        "telmisartan 40 mg - jan aushadhi"

    ];


    /* =====================================================
       NORMALIZE TEXT
    ===================================================== */

    function normalizeMedicineName(
        value
    ) {

        return String(
            value || ""
        )
            .toLowerCase()
            .replace(
                /–/g,
                "-"
            )
            .replace(
                /\s+/g,
                " "
            )
            .trim();

    }


    /* =====================================================
       CHECK MEDICINE NAME + GENERIC NAME
    ===================================================== */

    let medicineIsNonPrescription =
        false;


    if (medicine) {

        const medicineName =
            normalizeMedicineName(
                medicine.name
            );

        const genericName =
            normalizeMedicineName(
                medicine.generic_name
            );


        medicineIsNonPrescription =
            nonPrescriptionMedicines.includes(
                medicineName
            ) ||

            nonPrescriptionMedicines.includes(
                genericName
            );

    }


    /* =====================================================
       ALSO CHECK WHAT USER SEARCHED
       This handles direct searches.
    ===================================================== */

    const searchedName =
        normalizeMedicineName(
            searchInput
                ? searchInput.value
                : ""
        );


    if (
        nonPrescriptionMedicines.includes(
            searchedName
        )
    ) {

        medicineIsNonPrescription =
            true;

    }


    /* =====================================================
       HARD OVERRIDE
    ===================================================== */

    if (
        medicineIsNonPrescription
    ) {

        prescriptionRequired =
            false;


        console.log(
            "MediFind: Prescription override → NOT REQUIRED"
        );

    }


    /* =====================================================
       CHECK HTML ELEMENTS
    ===================================================== */

    if (
        !prescriptionBox ||
        !prescriptionTitle ||
        !prescriptionMessage
    ) {

        console.error(
            "MediFind: Prescription UI elements not found."
        );

        return;

    }


    /* =====================================================
       PRESCRIPTION REQUIRED
    ===================================================== */

    if (
        prescriptionRequired === true
    ) {

        prescriptionBox.style.display =
            "block";


        prescriptionBox.classList.remove(
            "prescription-not-required"
        );


        prescriptionTitle.textContent =
            "Prescription Required";


        prescriptionMessage.textContent =
            "This medicine requires a valid prescription before it can be purchased.";


        if (callDoctorButton) {

            callDoctorButton.style.display =
                "block";

        }

    }


    /* =====================================================
       PRESCRIPTION NOT REQUIRED
    ===================================================== */

    else {

        prescriptionBox.style.display =
            "block";


        prescriptionBox.classList.add(
            "prescription-not-required"
        );


        prescriptionTitle.textContent =
            "Prescription Not Required";


        prescriptionMessage.textContent =
            "This medicine can be purchased without a prescription.";


        if (callDoctorButton) {

            callDoctorButton.style.display =
                "none";

        }

    }

}


/* ==========================================
   SHOW ALTERNATIVE MEDICINE
========================================== */

function showAlternative(medicineName) {

    if (!medicineName) {
        return;
    }


    /* ==========================================
       FIND MEDICINE FROM FIREBASE DATA
    ========================================== */

    const medicineKey =
        medicineName
            .toLowerCase()
            .trim();


    let medicine = null;


    if (Array.isArray(medicines)) {

        medicine =
            medicines.find(function (item) {

                return (
                    item.name &&
                    item.name
                        .toLowerCase()
                        .trim() === medicineKey
                );

            });

    }


    console.log(
        "Showing alternative for:",
        medicineName
    );

    console.log(
        "Matched Firebase medicine:",
        medicine
    );


    /* ==========================================
       ALTERNATIVE SECTION
    ========================================== */

    const section =
        document.getElementById(
            "alternative-section"
        );


    if (!medicine) {

        console.warn(
            "Medicine not found in Firebase:",
            medicineName
        );

        if (section) {

            section.style.display =
                "none";

        }

        return;
    }


    if (section) {

        section.style.display =
            "block";

    }


    /* ==========================================
       ORIGINAL MEDICINE
    ========================================== */

    const originalName =
        document.getElementById(
            "original-medicine-name"
        );


    if (originalName) {

        originalName.textContent =
            medicine.name;

    }


    const originalComposition =
        document.getElementById(
            "original-composition"
        );


    if (originalComposition) {

        originalComposition.textContent =
            medicine.composition;

    }


    const originalCompany =
        document.getElementById(
            "original-company"
        );


    if (originalCompany) {

        originalCompany.textContent =
            "Branded Medicine";

    }


    const originalPrice =
        document.getElementById(
            "original-price"
        );


    if (originalPrice) {

        originalPrice.textContent =
            "₹" +
            medicine.branded_price;

    }


    /* ==========================================
       ALTERNATIVE MEDICINE
    ========================================== */

    const alternativeName =
        document.getElementById(
            "alternative-medicine-name"
        );


    if (alternativeName) {

        alternativeName.textContent =
            medicine.generic_name;

    }


    const alternativeComposition =
        document.getElementById(
            "alternative-composition"
        );


    if (alternativeComposition) {

        alternativeComposition.textContent =
            medicine.composition;

    }


    const alternativeCompany =
        document.getElementById(
            "alternative-company"
        );


    if (alternativeCompany) {

        alternativeCompany.textContent =
            medicine.source ||
            "Jan Aushadhi";

    }


    const alternativePrice =
        document.getElementById(
            "alternative-price"
        );


    if (alternativePrice) {

        alternativePrice.textContent =
            "₹" +
            medicine.generic_price;

    }


    /* ==========================================
       SAVING
    ========================================== */

    const saving =
        medicine.branded_price -
        medicine.generic_price;


    const savingPercent =
        Math.round(
            (
                saving /
                medicine.branded_price
            ) * 100
        );


    /* Total saving */

    const totalSaving =
        document.getElementById(
            "total-saving"
        );


    if (totalSaving) {

        totalSaving.textContent =
            "₹" +
            saving.toFixed(0);

    }


    /* Saving percentage */

    const savingPercentElement =
        document.getElementById(
            "saving-percent"
        );


    if (savingPercentElement) {

        savingPercentElement.textContent =
            savingPercent +
            "%";

    }


    /* ==========================================
       COMPOSITION STATUS
    ========================================== */

    const compositionStatus =
        document.getElementById(
            "composition-status"
        );


    if (compositionStatus) {

        compositionStatus.textContent =
            "Same active composition";

    }


    /* ==========================================
       SAFETY INFORMATION
    ========================================== */

    const safetyStatus =
        document.getElementById(
            "safety-status"
        );


    if (safetyStatus) {

        safetyStatus.textContent =
            "Review required";

    }


    /* ==========================================
       DOCTOR GUIDANCE
    ========================================== */

    const doctorStatus =
        document.getElementById(
            "doctor-status"
        );


    if (doctorStatus) {

        doctorStatus.textContent =
            "Consult doctor/pharmacist";

    }


    /* ==========================================
       PRESCRIPTION
    ========================================== */

        /* ==========================================
       UPDATE PRESCRIPTION STATUS
    ========================================== */

    updatePrescriptionStatus(
        medicine.prescriptionRequired === true,
        medicine
    );


    /* ==========================================
       RE-RENDER LUCIDE ICONS
    ========================================== */

    if (typeof lucide !== "undefined") {
        lucide.createIcons();
    }





    /* ==========================================
       REFRESH LUCIDE ICONS
    ========================================== */

    if (
        typeof lucide !== "undefined"
    ) {

        lucide.createIcons();

    }


    console.log(
        "Alternative displayed successfully:",
        medicine.generic_name
    );

}


/* ==========================================
   FIND ALTERNATIVE NEARBY
========================================== */

function searchAlternative() {

    const alternativeMedicineElement =
        document.getElementById(
            "alternative-medicine-name"
        );


    if (!alternativeMedicineElement) {

        console.error(
            "Alternative medicine element not found."
        );

        return;
    }


    const medicineName =
        alternativeMedicineElement.textContent.trim();


    if (!medicineName) {

        console.error(
            "Alternative medicine name is empty."
        );

        return;
    }


    console.log(
        "Searching nearby for:",
        medicineName
    );


    /*
     ==========================================
     PUT GENERIC MEDICINE INTO SEARCH BOX
     ==========================================
    */

    const searchInputElement =
        document.getElementById(
            "medicine-search"
        );


    if (searchInputElement) {

        searchInputElement.value =
            medicineName;

    }


    /*
     ==========================================
     FIND THE MAP
     ==========================================
    */

    const mapSection =
        document.getElementById(
            "map-section"
        );


    if (mapSection) {

        mapSection.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });

    }


    /* =========================================================
   SEARCH NEARBY PHARMACIES
    ========================================================= */

/* =========================================================
   UPDATE MAP PHARMACY PRICES
========================================================= */

/* =========================================================
   UPDATE MAP PHARMACY PRICES FROM BACKEND
========================================================= */

/* =========================================================
   UPDATE MAP PHARMACY PRICES
   Gets prices from Flask backend
========================================================= */

function searchNearbyPharmacies(
    medicineName,
    pharmacies
) {

    console.log(
        "MediFind: searching Firebase pharmacies for:",
        medicineName
    );


    /* =====================================================
       CHECK FIREBASE PHARMACY DATA
    ===================================================== */

    if (
        !pharmacies ||
        typeof pharmacies !== "object"
    ) {

        console.warn(
            "MediFind: No Firebase pharmacy data available."
        );

        return;
    }


    /* =====================================================
       CHECK MAP
    ===================================================== */

    if (!medifindMap) {

        console.warn(
            "MediFind: Map is not ready."
        );

        return;
    }


    /* =====================================================
       REMOVE OLD FIREBASE MARKERS
    ===================================================== */

    if (
        Array.isArray(
            window.firebasePharmacyMarkers
        )
    ) {

        window.firebasePharmacyMarkers.forEach(
            function (marker) {

                marker.setMap(
                    null
                );

            }
        );

    }


    window.firebasePharmacyMarkers = [];


    /* =====================================================
       FIND PHARMACIES WITH VALID DATA
    ===================================================== */

    const availablePharmacies =
        Object.entries(
            pharmacies
        )
        .filter(
            function (
                [pharmacyName, pharmacyData]
            ) {

                if (
                    !pharmacyData ||
                    typeof pharmacyData !== "object"
                ) {

                    return false;
                }


                const lat =
                    Number(
                        pharmacyData.lat
                    );


                const lng =
                    Number(
                        pharmacyData.lng
                    );


                return (
                    !Number.isNaN(lat) &&
                    !Number.isNaN(lng)
                );

            }
        );


    console.log(
        "MediFind: Firebase pharmacies available:",
        availablePharmacies
    );


    /* =====================================================
       CREATE MAP BOUNDS
    ===================================================== */

    const bounds =
        new google.maps.LatLngBounds();


    /* =====================================================
       CREATE MARKERS
    ===================================================== */

    availablePharmacies.forEach(
        function (
            [pharmacyName, pharmacyData]
        ) {

            const lat =
                Number(
                    pharmacyData.lat
                );


            const lng =
                Number(
                    pharmacyData.lng
                );


            const marker =
                new google.maps.Marker({

                    map:
                        medifindMap,

                    position: {
                        lat:
                            lat,

                        lng:
                            lng
                    },

                    title:
                        pharmacyName

                });


            /* -----------------------------------------
               INFO WINDOW
            ----------------------------------------- */

            const infoWindow =
                new google.maps.InfoWindow({

                    content: `

                        <div
                            style="
                                min-width:200px;
                                padding:8px;
                                font-family:Arial,sans-serif;
                            "
                        >

                            <strong
                                style="
                                    display:block;
                                    color:#18304a;
                                    font-size:15px;
                                    margin-bottom:8px;
                                "
                            >
                                ${pharmacyName}
                            </strong>

                            <span
                                style="
                                    color:#079d99;
                                    font-size:13px;
                                "
                            >
                                Pharmacy
                            </span>

                        </div>

                    `

                });


            marker.addListener(
                "click",
                function () {

                    infoWindow.open({

                        map:
                            medifindMap,

                        anchor:
                            marker

                    });

                }
            );


            window.firebasePharmacyMarkers.push(
                marker
            );


            bounds.extend({

                lat:
                    lat,

                lng:
                    lng

            });

        }
    );


    /* =====================================================
       FIT MAP TO FIREBASE PHARMACIES
    ===================================================== */

    if (
        availablePharmacies.length > 0
    ) {

        medifindMap.fitBounds(
            bounds
        );

    }


    /* =====================================================
       SCROLL TO MAP
    ===================================================== */

    const mapContainer =
        document.querySelector(
            ".map-background"
        );


    if (mapContainer) {

        mapContainer.scrollIntoView({

            behavior:
                "smooth",

            block:
                "center"

        });

    }


    console.log(
        "MediFind:",
        availablePharmacies.length,
        "Firebase pharmacies shown for",
        medicineName
    );

}

}


async function updateMapPriceCard(
    medicineName,
    isAlternative = false
) {

    console.log(
        "MediFind: updating map prices for:",
        medicineName,
        "| Alternative:",
        isAlternative
    );





    /* =====================================================
       GET MAP PRICE ELEMENTS
    ===================================================== */

    const apolloElement =
        document.getElementById("map-apollo-price");

    const cityElement =
        document.getElementById("map-city-price");

    const healthPointElement =
        document.getElementById("map-healthpoint-price");


    /* =====================================================
       RESET OLD PRICES
    ===================================================== */

    if (apolloElement) {
        apolloElement.textContent = "₹--";
    }

    if (cityElement) {
        cityElement.textContent = "₹--";
    }

    if (healthPointElement) {
        healthPointElement.textContent = "₹--";
    }


    /* =====================================================
       CHECK MEDICINE NAME
    ===================================================== */

    if (!medicineName) {

        console.warn(
            "MediFind: no medicine name provided."
        );

        return;
    }


    try {

        /* =================================================
           CREATE SEARCH PARAMETERS
        ================================================= */

        const params =
            new URLSearchParams({

                medicine:
                    String(medicineName).trim(),

                lat:
                    userLatitude !== null
                        ? String(userLatitude)
                        : "20.2961",

                lng:
                    userLongitude !== null
                        ? String(userLongitude)
                        : "85.8245",

                radius_km:
                    "10",

                sort_by:
                    "price"

            });


        /* =================================================
           API URL
        ================================================= */

        const url =
            `${API_BASE_URL}/api/search?` +
            params.toString();


        console.log(
            "MediFind: requesting:",
            url
        );


        /* =================================================
           CALL BACKEND
        ================================================= */

        const response =
            await fetch(url);


        if (!response.ok) {

            throw new Error(
                "Backend returned HTTP " +
                response.status
            );
        }


        /* =================================================
           CONVERT RESPONSE TO JSON
        ================================================= */

        const data =
            await response.json();


        console.log(
            "MediFind: backend response:",
            data
        );


        /* =================================================
           CHECK RESULTS
        ================================================= */

        if (
            !data ||
            !Array.isArray(data.results) ||
            data.results.length === 0
        ) {

            console.warn(
                "MediFind: no medicine results found."
            );

            return;
        }


        /* =================================================
           GET FIRST MATCHING MEDICINE
        ================================================= */

        const medicine =
            data.results[0];


        console.log(
            "MediFind: matched medicine:",
            medicine
        );


        /* =================================================
           DETERMINE PRICE TYPE
           
           NORMAL MEDICINE:
           branded_price

           ALTERNATIVE MEDICINE:
           generic_price
        ================================================= */

        const priceType =
            isAlternative
                ? "generic_price"
                : "branded_price";


        console.log(
            "MediFind: selected price type:",
            priceType
        );


        /* =================================================
           GET PHARMACIES
        ================================================= */

        const pharmacies =
            medicine.pharmacies;


        if (
            !pharmacies ||
            typeof pharmacies !== "object"
        ) {

            console.warn(
                "MediFind: no pharmacy data found."
            );

            return;
        }


        console.log(
            "MediFind: pharmacy data:",
            pharmacies
        );


        /* =================================================
           FORMAT PRICE
        ================================================= */

        function formatPrice(price) {

            if (
                price === undefined ||
                price === null ||
                price === ""
            ) {

                return "₹--";
            }


            const numericPrice =
                Number(price);


            if (
                Number.isNaN(
                    numericPrice
                )
            ) {

                return "₹--";
            }


            return (
                "₹" +
                (
                    Number.isInteger(
                        numericPrice
                    )

                        ? numericPrice

                        : numericPrice.toFixed(2)
                )
            );
        }


        /* =================================================
           GET PRICE FROM PHARMACY
        ================================================= */

        function getPharmacyPrice(
            pharmacyName
        ) {

            const pharmacy =
                pharmacies[
                    pharmacyName
                ];


            if (!pharmacy) {

                console.warn(
                    "MediFind: pharmacy not found:",
                    pharmacyName
                );

                return "₹--";
            }


            const price =
                pharmacy[
                    priceType
                ];


            console.log(
                "MediFind:",
                pharmacyName,
                "→",
                priceType,
                "→",
                price
            );


            return formatPrice(
                price
            );
        }


        /* =================================================
           UPDATE APOLLO
        ================================================= */

        if (apolloElement) {

            apolloElement.textContent =
                getPharmacyPrice(
                    "Apollo Pharmacy"
                );
        }


        /* =================================================
           UPDATE CITY MEDICALS
        ================================================= */

        if (cityElement) {

            cityElement.textContent =
                getPharmacyPrice(
                    "City Medicals"
                );
        }


        /* =================================================
           UPDATE HEALTHPOINT
        ================================================= */

        if (healthPointElement) {

            healthPointElement.textContent =
                getPharmacyPrice(
                    "HealthPoint"
                );
        }


        /* =================================================
           FINISHED
        ================================================= */

        console.log(
            "MediFind: map card updated successfully."
        );

    }


    catch (error) {

        console.error(
            "MediFind: map price request failed:",
            error
        );


        /* =============================================
           RESET PRICES IF BACKEND FAILS
        ============================================= */

        if (apolloElement) {
            apolloElement.textContent = "₹--";
        }

        if (cityElement) {
            cityElement.textContent = "₹--";
        }

        if (healthPointElement) {
            healthPointElement.textContent = "₹--";
        }

    }

}
/* =========================================================
   RENDER PHARMACY RESULT CARDS
========================================================= */

/* =========================================================
   DYNAMIC SMART RECOMMENDATION CARDS
   Pharmacy names + prices come from Firebase
========================================================= */

function renderRecommendationCards(
    pharmacies,
    priceType
) {
    
        /* =====================================================
       GET PHARMACY DISTANCE
    ===================================================== */

/* =====================================================
   GET DISTANCE FROM USER TO FIREBASE PHARMACY
===================================================== */

function getPharmacyDistance(
    pharmacyName,
    pharmacyData
) {

    /* =================================================
       CHECK USER LOCATION
    ================================================= */

    if (
        !userLocationReady ||
        userLatitude === null ||
        userLongitude === null
    ) {

        return null;
    }


    /* =================================================
       CHECK FIREBASE PHARMACY DATA
    ================================================= */

    if (
        !pharmacyData ||
        typeof pharmacyData !== "object"
    ) {

        console.warn(
            "MediFind: Missing pharmacy data:",
            pharmacyName
        );

        return null;
    }


    /* =================================================
       GET COORDINATES FROM FIREBASE
    ================================================= */

    const pharmacyLat =
        Number(
            pharmacyData.lat
        );


    const pharmacyLng =
        Number(
            pharmacyData.lng
        );


    /* =================================================
       CHECK COORDINATES
    ================================================= */

    if (
        Number.isNaN(
            pharmacyLat
        ) ||
        Number.isNaN(
            pharmacyLng
        )
    ) {

        console.warn(
            "MediFind: Firebase coordinates missing or invalid:",
            pharmacyName
        );

        return null;
    }


    /* =================================================
       HAVERSINE DISTANCE
    ================================================= */

    const earthRadius =
        6371;


    const dLat =
        (
            pharmacyLat -
            userLatitude
        ) *
        Math.PI /
        180;


    const dLng =
        (
            pharmacyLng -
            userLongitude
        ) *
        Math.PI /
        180;


    const a =
        Math.sin(
            dLat / 2
        ) *
        Math.sin(
            dLat / 2
        )

        +

        Math.cos(
            userLatitude *
            Math.PI /
            180
        ) *

        Math.cos(
            pharmacyLat *
            Math.PI /
            180
        ) *

        Math.sin(
            dLng / 2
        ) *
        Math.sin(
            dLng / 2
        );


    const c =
        2 *
        Math.atan2(
            Math.sqrt(a),
            Math.sqrt(
                1 -
                a
            )
        );


    const distance =
        earthRadius *
        c;


    console.log(
        "MediFind: Distance to",
        pharmacyName,
        "→",
        distance.toFixed(2),
        "km"
    );


    return distance;

}

    const recommendationSection =
        document.querySelector(
            ".recommendation-section"
        );


    if (!recommendationSection) {

        console.error(
            "MediFind: Recommendation section not found."
        );

        return;
    }


    const needBox =
        recommendationSection.querySelector(
            ".need-box"
        );


    if (!needBox) {

        console.error(
            "MediFind: Need box not found."
        );

        return;
    }


    /* =====================================================
       REMOVE OLD DYNAMIC CARDS
    ===================================================== */

    recommendationSection
        .querySelectorAll(
            ".pharmacy-card"
        )
        .forEach(
            function (card) {

                card.remove();

            }
        );


    /* =====================================================
       CHECK PHARMACY DATA
    ===================================================== */

    if (
        !pharmacies ||
        typeof pharmacies !== "object"
    ) {

        console.warn(
            "MediFind: No pharmacy data available."
        );

        return;
    }


    /* =====================================================
       CREATE PHARMACY ARRAY
    ===================================================== */

    const pharmacyArray =
        Object.entries(
            pharmacies
        )
        .map(
            function (
                [pharmacyName, pharmacyData]
            ) {

                const price =
                    Number(
                        pharmacyData[
                            priceType
                        ]
                    );


                const stock =
                    Number(
                        pharmacyData.stock
                    );


                return {

                    name:
                        pharmacyName,

                    price:
                        price,

                    stock:
                        Number.isNaN(stock)
                            ? 0
                            : stock,

                    latitude:
                        Number(
                            pharmacyData.lat
                        ),

                    longitude:
                        Number(
                            pharmacyData.lng
                        ),

                    distance:
                        getPharmacyDistance(
                            pharmacyName,
                            pharmacyData
                        )

};
            }
        )
        .filter(
            function (pharmacy) {

                return (
                    !Number.isNaN(
                        pharmacy.price
                    )
                );

            }
        );


    /* =====================================================
       SORT CHEAPEST FIRST
    ===================================================== */

    pharmacyArray.sort(
        function (a, b) {

            return (
                a.price -
                b.price
            );

        }
    );


    /* =====================================================
       CREATE THE CARDS
    ===================================================== */

    const cardsHTML =
        pharmacyArray
            .slice(0, 3)
            .map(
                function (pharmacy) {

                    let stockText =
                        "In stock";


                    if (
                        pharmacy.stock <= 0
                    ) {

                        stockText =
                            "Out of stock";

                    }

                    else if (
                        pharmacy.stock <= 10
                    ) {

                        stockText =
                            `Only ${pharmacy.stock} left`;

                    }


                    const formattedPrice =
                        pharmacy.price
                            .toFixed(2)
                            .replace(
                                /\.00$/,
                                ""
                            );


                    return `

                        <div
                            class="pharmacy-card"
                            data-price="${pharmacy.price}"
                            data-distance="${pharmacy.distance !== null ? pharmacy.distance : 0}"
                        >

                            <h3>
                                ${pharmacy.name}
                            </h3>


                            <div class="price">
                                ₹${formattedPrice}
                            </div>


                            <div class="distance">
                                ${
                                    pharmacy.distance !== null
                                        ? `📍 ${pharmacy.distance.toFixed(1)} km away`
                                        : "📍 Distance unavailable"
                                }
                            </div>


                            <p>
                                ${stockText}
                            </p>


                            <div class="travel-cost">

                                Travel cost:

                                <strong class="fuel-cost">
                                    ₹0.00
                                </strong>

                            </div>


                            <div class="effective-cost">

                                <span class="effectivei">
                                    Effective cost:
                                </span>

                                <strong class="total-cost">
                                    ₹${formattedPrice}
                                </strong>

                            </div>


                            <div class="recommendation-status value">

                                Available

                            </div>

                        </div>

                    `;

                }
            )
            .join("");


    /* =====================================================
       INSERT CARDS AFTER "YOUR NEED"
    ===================================================== */

    needBox.insertAdjacentHTML(
        "afterend",
        cardsHTML
    );


    /* =====================================================
       RECALCULATE TRAVEL / EFFECTIVE COST
    ===================================================== */

    calculateTravelCost();


    console.log(
        "MediFind: Recommendation cards rendered:",
        pharmacyArray
    );

}

/* =========================================================
   RENDER PHARMACY RESULT CARDS
   Uses Firebase/Flask prices
========================================================= */

async function renderPharmacyResults(
    medicineName,
    isAlternative = false
) {

    console.log(
        "MediFind: rendering pharmacy cards for:",
        medicineName,
        "| Alternative:",
        isAlternative
    );


    const resultsList =
        document.getElementById(
            "pharmacy-results-list"
        );


    if (!resultsList) {

        console.error(
            "Pharmacy results container not found."
        );

        return;
    }


    /* ---------------------------------------------------------
       SHOW LOADING
    --------------------------------------------------------- */

    resultsList.innerHTML = `
        <p style="padding:20px;">
            Loading pharmacy prices...
        </p>
    `;


    try {

        /* -----------------------------------------------------
           CALL BACKEND
        ----------------------------------------------------- */

        const params =
            new URLSearchParams({

                medicine:
                    String(medicineName).trim(),

                lat:
                    userLatitude !== null
                        ? String(userLatitude)
                        : "20.2961",

                lng:
                    userLongitude !== null
                        ? String(userLongitude)
                        : "85.8245",

                radius_km:
                    "10",

                sort_by:
                    "price"

            });


        const response =
            await fetch(
                `${API_BASE_URL}/api/search?`+
                params.toString()
            );


        if (!response.ok) {

            throw new Error(
                "Backend returned HTTP " +
                response.status
            );

        }


        const data =
            await response.json();


        console.log(
            "MediFind: pharmacy card backend data:",
            data
        );


        /* -----------------------------------------------------
           GET FIRST MEDICINE RESULT
        ----------------------------------------------------- */

        if (
            !data ||
            !Array.isArray(data.results) ||
            data.results.length === 0
        ) {

            resultsList.innerHTML = `
                <p style="
                    padding:20px;
                    color:#d07a4f;
                ">
                    This medicine is currently not available
                    in the listed pharmacies.
                </p>
            `;

            return;
        }


        const medicine =
            data.results[0];


        const pharmacies =
            medicine.pharmacies;

        createFirebasePharmacyMarkers(
            pharmacies
        );


        if (
            !pharmacies ||
            typeof pharmacies !== "object"
        ) {

            resultsList.innerHTML = `
                <p style="padding:20px;">
                    No pharmacy data available.
                </p>
            `;

            return;
        }


        /* -----------------------------------------------------
           PRICE TYPE
        ----------------------------------------------------- */

        const priceType =
            isAlternative
                ? "generic_price"
                : "branded_price";

        /* =====================================================
        UPDATE SMART RECOMMENDATIONS
        ===================================================== */

        renderRecommendationCards(
            pharmacies,
            priceType
        );


        console.log(
            "MediFind: pharmacy card price type:",
            priceType
        );


        /* -----------------------------------------------------
           PHARMACY DETAILS
        ----------------------------------------------------- */

        const pharmacyAddresses = {

            "Apollo Pharmacy":
                "KIIT Road, Patia, Bhubaneswar",

            "City Medicals":
                "Nandan Kanan Road, Patia, Bhubaneswar",

            "HealthPoint":
                "Infocity Square, Patia, Bhubaneswar"

        };


        const pharmacyDistances = {

            "Apollo Pharmacy":
                "0.8 km",

            "City Medicals":
                "1.2 km",

            "HealthPoint":
                "1.7 km"

        };


        /* -----------------------------------------------------
           CREATE PHARMACY ARRAY
        ----------------------------------------------------- */

        const pharmacyArray =
            Object.entries(
                pharmacies
            );


        console.log(
            "MediFind: pharmacies:",
            pharmacyArray
        );


        /* -----------------------------------------------------
           RENDER CARDS
        ----------------------------------------------------- */

        resultsList.innerHTML =
            pharmacyArray
                .map(
                    function ([pharmacyName, pharmacyData], index) {

                        const price =
                            Number(
                                pharmacyData[
                                    priceType
                                ]
                            );


                        const stock =
                            Number(
                                pharmacyData.stock
                            );


                        if (
                            Number.isNaN(price)
                        ) {

                            return "";

                        }


                        /* -----------------------------------------
                           STOCK TEXT
                        ----------------------------------------- */

                        let stockText =
                            "In stock";


                        if (
                            !Number.isNaN(stock) &&
                            stock <= 10
                        ) {

                            stockText =
                                `Only ${stock} left`;

                        }


                        /* -----------------------------------------
                           BEST FIT
                        ----------------------------------------- */

                        const bestFit =
                            index === 0
                                ? `
                                    <span class="best-fit-badge">
                                        Best fit
                                    </span>
                                  `
                                : "";


                        /* -----------------------------------------
                           PRICE FORMAT
                        ----------------------------------------- */

                        const formattedPrice =
                            price
                                .toFixed(2)
                                .replace(
                                    /\.00$/,
                                    ""
                                );


                        /* -----------------------------------------
                           CARD
                        ----------------------------------------- */

                        return `

                            <div
                                class="
                                    pharmacy-result-row
                                    ${index === 0
                                        ? "best-result-row"
                                        : ""}
                                "
                            >

                                <!-- PHARMACY -->

                                <div class="result-store">

                                    <div
                                        class="
                                            result-store-icon
                                        "
                                    >
                                        <i
                                            data-lucide="store"
                                        ></i>
                                    </div>


                                    <div>

                                        <h3>

                                            ${pharmacyName}

                                            ${bestFit}

                                        </h3>


                                        <p
                                            class="
                                                result-address
                                            "
                                        >

                                            <i
                                                data-lucide="map-pin"
                                            ></i>

                                            ${
                                                pharmacyDistances[
                                                    pharmacyName
                                                ] || ""
                                            }

                                            ·

                                            ${
                                                pharmacyAddresses[
                                                    pharmacyName
                                                ] || ""
                                            }

                                        </p>


                                        <p
                                            class="
                                                result-stock
                                            "
                                        >

                                            <span></span>

                                            ${stockText}

                                        </p>

                                    </div>

                                </div>


                                <!-- EXPIRY -->

                                <div
                                    class="
                                        result-expiry
                                    "
                                >

                                    <span>
                                        EXPIRY
                                    </span>

                                    <strong>
                                        Suitable
                                    </strong>

                                    <small>
                                        Stock available
                                    </small>

                                </div>


                                <!-- PRICE -->

                                <div
                                    class="
                                        result-price
                                    "
                                >

                                    <span>
                                        PRICE
                                    </span>

                                    <strong>
                                        ₹${formattedPrice}
                                    </strong>

                                    <small>
                                        per strip
                                    </small>

                                </div>


                                <!-- BUTTON -->

                                <button
                                    class="
                                        view-pharmacy-btn
                                    "
                                    onclick="
                                        focusPharmacy(
                                            '${pharmacyName}',
                                            ${JSON.stringify(pharmacyData)}
                                        )
                                    "
                                >

                                    View pharmacy

                                    <i
                                        data-lucide="arrow-up-right"
                                    ></i>

                                </button>

                            </div>

                        `;

                    }
                )
                .join("");


        /* -----------------------------------------------------
           REFRESH ICONS
        ----------------------------------------------------- */

        if (
            typeof lucide !== "undefined"
        ) {

            lucide.createIcons();

        }


        console.log(
            "MediFind: pharmacy cards updated successfully."
        );

    }


    catch (error) {

        console.error(
            "MediFind: pharmacy card request failed:",
            error
        );


        resultsList.innerHTML = `
            <p style="
                padding:20px;
                color:#d07a4f;
            ">
                Unable to load pharmacy prices.
            </p>
        `;

    }

}
/* ==========================================
   CALL DOCTOR
========================================== */

function callDoctor() {

    /*
       Replace this number with the
       actual doctor's phone number.
    */

    const doctorNumber =
        "tel:+919999999999";


    window.location.href =
        doctorNumber;

}


/* ==========================================
   INITIALIZE LUCIDE ICONS
========================================== */

if (
    typeof lucide !== "undefined"
) {

    lucide.createIcons();

}


/* ==========================================
   COMPARE ALL PHARMACIES
========================================== */

const compareAllButton =
    document.getElementById(
        "compare-all-btn"
    );


const pharmacyResultsSection =
    document.getElementById(
        "pharmacy-results-section"
    );


if (
    compareAllButton &&
    pharmacyResultsSection
) {

    compareAllButton.addEventListener(
        "click",
        function () {

            pharmacyResultsSection.classList.toggle(
                "active"
            );


            if (
                pharmacyResultsSection.classList.contains(
                    "active"
                )
            ) {

                compareAllButton.textContent =
                    "Hide results ↑";


                pharmacyResultsSection.scrollIntoView({
                    behavior: "smooth",
                    block: "start"
                });


                if (
                    typeof lucide !== "undefined"
                ) {

                    lucide.createIcons();

                }

            }

            else {

                compareAllButton.textContent =
                    "Compare all →";

            }

        }
    );

}


/* =========================================================
   GOOGLE MAPS
========================================================= */

/*
   PASTE YOUR GOOGLE MAPS API KEY BELOW.

   Example:

   const GOOGLE_MAPS_API_KEY =
       "gsk_xxxxxxxxxxxxxxxxx";

*/


let medifindMap = null;


/* =========================================================
   PHARMACY LOCATIONS
========================================================= */



/* =========================================================
   LOAD GOOGLE MAPS FROM JAVASCRIPT
========================================================= */

let googleMapsLoadingPromise = null;


function loadGoogleMapsScript() {

    if (
        window.google &&
        window.google.maps
    ) {

        return Promise.resolve();

    }


    if (
        googleMapsLoadingPromise
    ) {

        return googleMapsLoadingPromise;

    }


    googleMapsLoadingPromise =
        fetch(
            `${API_BASE_URL}/api/maps-key`
        )

        .then(
            function (response) {

                if (!response.ok) {

                    throw new Error(
                        "Unable to get Google Maps API key."
                    );

                }

                return response.json();

            }
        )

        .then(
            function (data) {

                if (
                    !data.success ||
                    !data.key
                ) {

                    throw new Error(
                        "Google Maps API key is unavailable."
                    );

                }


                return new Promise(
                    function (
                        resolve,
                        reject
                    ) {

                        const script =
                            document.createElement(
                                "script"
                            );


                        script.id =
                            "google-maps-script";


                        script.src =
                            "https://maps.googleapis.com/maps/api/js" +
                            "?key=" +
                            encodeURIComponent(
                                data.key
                            ) +
                            "&v=weekly";


                        script.async =
                            true;


                        script.defer =
                            true;


                        script.onload =
                            function () {

                                if (
                                    window.google &&
                                    window.google.maps
                                ) {

                                    resolve();

                                }

                                else {

                                    reject(
                                        new Error(
                                            "Google Maps loaded incorrectly."
                                        )
                                    );

                                }

                            };


                        script.onerror =
                            function () {

                                reject(
                                    new Error(
                                        "Google Maps failed to load."
                                    )
                                );

                            };


                        document.head.appendChild(
                            script
                        );

                    }
                );

            }
        );


    return googleMapsLoadingPromise;

}


/* =========================================================
   INITIALIZE GOOGLE MAP
========================================================= */

async function initMediFindMap() {

    console.log(
        "MediFind: starting Google Maps..."
    );


    const mapElement =
        document.getElementById(
            "google-map"
        );


    /*
       Make sure map container exists.
    */

    if (!mapElement) {

        console.error(
            "ERROR: #google-map was not found."
        );

        return;

    }


    /*
       Make sure the map has dimensions.
    */

    mapElement.style.width =
        "100%";


    mapElement.style.height =
        "100%";


    try {

        /*
           Load Google Maps.
        */

        await loadGoogleMapsScript();


        /*
           Create the actual map.
        */

        medifindMap =
            new google.maps.Map(
                mapElement,
                {

                    center: {
                        lat:
                            userLatitude !== null
                                ? userLatitude
                                : 20.2961,

                        lng:
                            userLongitude !== null
                                ? userLongitude
                                : 85.8245
                    },

                    zoom: 14,

                    mapTypeControl: false,

                    streetViewControl: false,

                    fullscreenControl: true,

                    zoomControl: true,

                    gestureHandling: "greedy"

                }
            );


        console.log(
            "MediFind: Google Map created successfully."
        );


        /*
           Add pharmacy markers.
        */

        createUserLocationMarker();

    }

    catch (error) {

        console.error(
            "===================================="
        );


        console.error(
            "GOOGLE MAPS ERROR:"
        );


        console.error(
            error
        );


        console.error(
            "===================================="
        );


        /*
           Show error inside map.
        */

        mapElement.innerHTML = `

            <div class="map-error-box">

                <strong>
                    Google Maps could not load
                </strong>

                <span>
                    Open F12 → Console to see
                    the exact Google Maps error.
                </span>

            </div>

        `;

    }

}


/* =========================================================
   CREATE USER LOCATION MARKER
========================================================= */

function createUserLocationMarker() {

    if (!medifindMap) {

        console.warn(
            "MediFind: Map is not ready for user marker."
        );

        return;
    }


    if (
        userLatitude === null ||
        userLongitude === null
    ) {

        console.warn(
            "MediFind: User location is not available."
        );

        return;
    }


    /* Remove old user marker if it exists */

    if (
        window.mediFindUserMarker
    ) {

        window.mediFindUserMarker.setMap(
            null
        );
    }


    /* Create user marker */

    window.mediFindUserMarker =
        new google.maps.Marker({

            map:
                medifindMap,

            position: {
                lat:
                    userLatitude,

                lng:
                    userLongitude
            },

            title:
                "Your Location",

            zIndex:
                1000,

            icon: {
                path:
                    google.maps.SymbolPath.CIRCLE,

                scale:
                    9,

                fillColor:
                    "#079d99",

                fillOpacity:
                    1,

                strokeColor:
                    "#ffffff",

                strokeWeight:
                    3
            }

        });


    console.log(
        "MediFind: User location marker created."
    );

}

/* =========================================================
   CREATE PHARMACY MARKERS
========================================================= */

/* =====================================================
   CREATE PHARMACY MARKERS FROM FIREBASE DATA
===================================================== */

function createFirebasePharmacyMarkers(
    pharmacies
) {

    if (!medifindMap) {

        console.error(
            "MediFind: Map is not ready."
        );

        return;
    }


    if (
        !pharmacies ||
        typeof pharmacies !== "object"
    ) {

        console.warn(
            "MediFind: No Firebase pharmacy data."
        );

        return;
    }


    /* =================================================
       REMOVE PREVIOUS FIREBASE MARKERS
    ================================================= */

    if (
        Array.isArray(
            window.firebasePharmacyMarkers
        )
    ) {

        window.firebasePharmacyMarkers.forEach(
            function (marker) {

                marker.setMap(
                    null
                );

            }
        );

    }


    window.firebasePharmacyMarkers = [];


    /* =================================================
       CREATE NEW MARKERS
    ================================================= */

    Object.entries(
        pharmacies
    )
    .forEach(
        function (
            [pharmacyName, pharmacyData]
        ) {

            const lat =
                Number(
                    pharmacyData.lat
                );


            const lng =
                Number(
                    pharmacyData.lng
                );


            if (
                Number.isNaN(lat) ||
                Number.isNaN(lng)
            ) {

                console.warn(
                    "MediFind: Invalid Firebase coordinates:",
                    pharmacyName
                );

                return;
            }


            /* -----------------------------------------
               CREATE MARKER
            ----------------------------------------- */

            const marker =
                new google.maps.Marker({

                    map:
                        medifindMap,

                    position: {
                        lat:
                            lat,

                        lng:
                            lng
                    },

                    title:
                        pharmacyName

                });


            /* -----------------------------------------
               CREATE INFO WINDOW
            ----------------------------------------- */

            const infoWindow =
                new google.maps.InfoWindow({

                    content: `

                        <div
                            style="
                                min-width:200px;
                                padding:8px;
                                font-family:Arial,sans-serif;
                            "
                        >

                            <strong
                                style="
                                    display:block;
                                    color:#18304a;
                                    font-size:15px;
                                    margin-bottom:8px;
                                "
                            >
                                ${pharmacyName}
                            </strong>


                            <span
                                style="
                                    color:#079d99;
                                    font-size:13px;
                                "
                            >
                                Pharmacy
                            </span>

                        </div>

                    `

                });


            /* -----------------------------------------
               MARKER CLICK
            ----------------------------------------- */

            marker.addListener(
                "click",
                function () {

                    infoWindow.open({
                        map:
                            medifindMap,

                        anchor:
                            marker

                    });

                }
            );


            window.firebasePharmacyMarkers.push(
                marker
            );

        }
    );


    console.log(
        "MediFind: Firebase pharmacy markers created."
    );

}



/* =========================================================
   FOCUS PHARMACY USING FIREBASE LOCATION
========================================================= */

function focusPharmacy(
    pharmacyName,
    pharmacyData
) {

    if (!medifindMap) {

        console.warn(
            "MediFind: Map is not ready."
        );

        return;
    }


    if (
        !pharmacyData ||
        typeof pharmacyData !== "object"
    ) {

        console.warn(
            "MediFind: Pharmacy data not available:",
            pharmacyName
        );

        return;
    }


    const lat =
        Number(
            pharmacyData.lat
        );


    const lng =
        Number(
            pharmacyData.lng
        );


    if (
        Number.isNaN(lat) ||
        Number.isNaN(lng)
    ) {

        console.warn(
            "MediFind: Firebase coordinates missing:",
            pharmacyName
        );

        return;
    }


    const position = {
        lat:
            lat,

        lng:
            lng
    };


    medifindMap.setCenter(
        position
    );


    medifindMap.setZoom(
        16
    );


    console.log(
        "MediFind: Focused on Firebase pharmacy:",
        pharmacyName
    );

}

/* =========================================================
   START GOOGLE MAP
========================================================= */

function startMediFindMap() {

    console.log(
        "MediFind: map startup..."
    );


    initMediFindMap();

}


/* =========================================================
   WAIT FOR PAGE
========================================================= */

if (
    document.readyState ===
    "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        startMediFindMap
    );

}

else {

    startMediFindMap();

}

fetch(`${API_BASE_URL}/test-firebase`)
    .then(response => response.json())
    .then(data => {
        console.log(data);
    })
    .catch(error => {
        console.error("Backend connection failed:", error);
    });

async function loadMedicines() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/medicines`);

        const data = await response.json();

        console.log("Medicines received from backend:", data);

        if (data.success) {
            console.log("Medicine list:", data.medicines);
        }

    } catch (error) {
        console.error("Error loading medicines:", error);
    }
}

loadMedicines();

function displayMedicines(medicines) {

    if (!medicines || medicines.length === 0) {
        console.log("No medicines available.");
        return;
    }

    console.log("Displaying medicines:", medicines);

    // Store medicines globally so other functions can use them
    window.medicinesData = medicines;

    // Display the first medicine by default
    displayMedicineComparison(medicines[0]);
}

function displayMedicineComparison(medicine) {

    if (!medicine) {
        return;
    }

    // ORIGINAL MEDICINE
    const originalName =
        document.getElementById("original-medicine-name");

    const originalComposition =
        document.getElementById("original-composition");

    const originalPrice =
        document.getElementById("original-price");

    const originalCompany =
        document.getElementById("original-company");


    // ALTERNATIVE MEDICINE
    const alternativeName =
        document.getElementById("alternative-medicine-name");

    const alternativeComposition =
        document.getElementById("alternative-composition");

    const alternativePrice =
        document.getElementById("alternative-price");

    const alternativeCompany =
        document.getElementById("alternative-company");

    const savingPercent =
        document.getElementById("saving-percent");


    // Fill ORIGINAL medicine
    if (originalName) {
        originalName.textContent = medicine.name || "";
    }

    if (originalComposition) {
        originalComposition.textContent =
            medicine.composition || "";
    }

    if (originalPrice) {
        originalPrice.textContent =
            `₹${medicine.branded_price}`;
    }

    if (originalCompany) {
        originalCompany.textContent =
            "Patent Brand";
    }


    // Fill ALTERNATIVE medicine
    if (alternativeName) {
        alternativeName.textContent =
            medicine.generic_name || "";
    }

    if (alternativeComposition) {
        alternativeComposition.textContent =
            medicine.composition || "";
    }

    if (alternativePrice) {
        alternativePrice.textContent =
            `₹${medicine.generic_price}`;
    }

    if (alternativeCompany) {
        alternativeCompany.textContent =
            medicine.source || "Jan Aushadhi";
    }


// Calculate savings
if (
    medicine.branded_price != null &&
    medicine.generic_price != null
) 
{

    // Actual money saved
    const saving =
        Number(medicine.branded_price) -
        Number(medicine.generic_price);

    // Saving percentage
    const savingPercentValue =
        (
            saving /
            Number(medicine.branded_price)
        ) * 100;


    // Update total saving at bottom
    const totalSaving =
        document.getElementById("total-saving");

    if (totalSaving) {
        totalSaving.textContent =
            `₹${saving.toFixed(0)}`;
    }


    // Update saving percentage on alternative card
    if (savingPercent) {
        savingPercent.textContent =
            `${Math.round(savingPercentValue)}%`;
    }
}


    /* ==========================================
        UPDATE PRESCRIPTION STATUS
        ========================================== */

        updatePrescriptionStatus(
            medicine.prescriptionRequired === true,
            medicine
        );


        /* ==========================================
        RE-RENDER LUCIDE ICONS
        ========================================== */

        if (typeof lucide !== "undefined") {
            lucide.createIcons();
        }

}

async function loadMedicinesFromBackend() {

    try {

        const response =
            await fetch(
                `${API_BASE_URL}/api/medicines`
            );


        if (!response.ok) {

            throw new Error(
                "Failed to fetch medicines"
            );

        }


        const data =
            await response.json();


        console.log(
            "Medicines received from backend:",
            data
        );


        if (
            data.success &&
            Array.isArray(data.medicines)
        ) {

            console.log(
                "Medicine List:",
                data.medicines
            );


            /*
             ==========================================
             STORE FIREBASE MEDICINES GLOBALLY
             ==========================================
            */

            window.medicinesData =
                data.medicines;


            /*
             ==========================================
             DISPLAY FIRST MEDICINE
             ==========================================
            */

            if (
                window.medicinesData.length > 0
            ) {

                displayMedicineComparison(
                    window.medicinesData[0]
                );

            }


            /*
             ==========================================
             SHOW THAT DATA IS READY
             ==========================================
            */

            console.log(
                "✅ Medicines loaded successfully:",
                window.medicinesData.length
            );

        }

        else {

            console.error(
                "❌ Backend returned invalid medicine data."
            );

            window.medicinesData = [];

        }

    }

    catch (error) {

        console.error(
            "❌ Error loading medicines:",
            error
        );

        window.medicinesData = [];

    }

}


/*
 ==========================================
 LOAD MEDICINES
 ==========================================
*/

loadMedicinesFromBackend();