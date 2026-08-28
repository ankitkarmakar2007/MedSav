# Smart Medicine Availability & Price Comparison Platform — API

A REST API connecting **patients**, **pharmacies**, and **healthcare providers**.

- Patients search a medicine and see availability, price, quantity, expiry, and
  distance across nearby registered pharmacies.
- Patients can compare prices for one medicine across every pharmacy stocking it.
- A **Near-Expiry Medicine Recommendation** engine matches a patient's required
  quantity and treatment duration against stock, and recommends the cheapest
  pharmacy whose batch still safely outlasts the treatment — helping pharmacies
  clear near-expiry stock instead of writing it off.
- Doctors/hospitals can pull a pharmacy's near-expiry stock list to guide patients.

Built with **Flask + SQLite** (no external services needed) so it runs anywhere
with just Python installed.

## Setup

```bash
pip install -r requirements.txt
python database.py     # creates medicine_platform.db and loads sample data
python app.py           # starts the API on http://localhost:5000
```

Re-running `database.py` is safe — it only seeds data if the pharmacies table
is empty. Delete `medicine_platform.db` to reset from scratch.

## Data model

| Table       | Purpose                                                              |
|-------------|-----------------------------------------------------------------------|
| pharmacies  | Registered pharmacy: name, address, phone, lat/lng                   |
| medicines   | Medicine catalog: name, generic name, manufacturer, category, strength |
| inventory   | Per-pharmacy stock: medicine, batch, price, quantity, expiry_date    |
| providers   | Doctors / hospitals (for the provider-facing view)                   |

## Endpoints

### Pharmacies
- `POST /api/pharmacies` — register a pharmacy
  `{ "name", "address", "phone", "latitude", "longitude" }`
- `GET /api/pharmacies` — list registered pharmacies

### Medicines
- `POST /api/medicines` — add a medicine to the catalog
  `{ "name", "generic_name", "manufacturer", "category", "strength" }`
- `GET /api/medicines?q=para` — search/list catalog

### Inventory (pharmacy stock management)
- `POST /api/inventory` — add stock
  `{ "pharmacy_id", "medicine_id", "price", "quantity", "expiry_date": "YYYY-MM-DD", "batch_no" }`
- `PUT /api/inventory/<id>` — update price / quantity / expiry / batch
- `DELETE /api/inventory/<id>` — remove a stock entry

### Patient search & comparison
- `GET /api/search?medicine=paracetamol&lat=20.35&lng=85.82&radius_km=10&sort_by=price`
  Returns matching medicine listings with price, quantity, expiry, and distance
  across nearby pharmacies. `sort_by` = `price` (default) | `distance` | `expiry`.

- `GET /api/compare/<medicine_id>`
  Full price comparison table for one exact medicine across every pharmacy
  that stocks it, sorted lowest price first.

### Near-expiry recommendation engine
- `GET /api/recommendations/near-expiry?medicine_id=1&quantity=10&duration_days=30&lat=20.35&lng=85.82`

  For a given medicine, required quantity, and treatment duration, this:
  1. Filters to offers with enough **quantity** in stock.
  2. Filters to offers whose **expiry is still far enough out** to safely
     cover the whole treatment (`expiry_days_remaining >= duration_days`).
  3. Among those safe offers, ranks by **smallest safety margin** (closest to
     expiry while still safe) then by **lowest price** — so a pharmacy with
     stock expiring in 40 days, against a 30-day course, is recommended over
     one expiring in 400 days, at the best price among near-expiry options.
  4. Also returns `excluded_too_soon_to_expire_safely` and
     `excluded_insufficient_stock` for transparency, plus
     `cheapest_eligible_alternative` if it differs from the top pick.

### Doctor / hospital view
- `GET /api/pharmacies/<pharmacy_id>/near-expiry-stock?threshold_days=60`
  All stock at a pharmacy expiring within `threshold_days`, soonest first —
  lets providers proactively steer patients toward it.

### Misc
- `GET /api/health` — health check
- `GET /` — lists all routes

## Example: the scenario from the spec

Medicine expires in 40 days, patient needs a 30-day supply:

```bash
curl "http://localhost:5000/api/recommendations/near-expiry?medicine_id=1&quantity=10&duration_days=30"
```

The seeded data reproduces this exactly — a Paracetamol batch at 40 days to
expiry, priced lower than the far-from-expiry batches, comes back as
`recommended`, while a batch with only 20 days left (too soon for a 30-day
course) is correctly excluded.

## Notes on extending this for production

- Swap SQLite for Postgres/MySQL as volume grows — the SQL is close to
  portable already (raw `sqlite3` calls in `database.py`/`app.py`).
- Add auth (pharmacy login, patient accounts, provider roles) — currently
  fully open for prototyping.
- Add input validation with a schema library (e.g. `pydantic` or
  `marshmallow`) once the API surface grows.
- Add pagination to `/api/search` and `/api/compare` for large catalogs.
- Consider a background job that flags/notifies pharmacies when stock crosses
  a near-expiry threshold, rather than only exposing it via GET.
  

