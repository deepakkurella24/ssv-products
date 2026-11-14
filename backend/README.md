# SSV (Sri Samruddhi Vanam) FastAPI Backend

Production-ready REST API backend for the SSV Storefront and Admin Dashboard built with FastAPI, SQLAlchemy 2.0, Pydantic v2, and Firebase Authentication.

---

## Architecture Overview

- **Framework**: FastAPI (Python 3.12+)
- **ORM**: SQLAlchemy 2.0 (DeclarativeBase, Mapped types)
- **Database**: PostgreSQL (UUID v4 canonical primary keys)
- **Authentication**: Firebase Authentication & Firebase Admin SDK (`firebase-admin`)
- **Validation**: Pydantic v2 Schemas
- **Image Storage**: Direct client-to-Cloudinary HTTPS uploads (no backend multipart file upload routes)
- **Payments**: Cash on Delivery (`cod`) only

---

## Directory Structure

```text
backend/
├── app/
│   ├── core/
│   │   ├── config.py         # Pydantic BaseSettings, environment configuration
│   │   ├── database.py       # SQLAlchemy engine & SessionLocal
│   │   └── firebase.py       # Firebase Admin initialization & token verification
│   ├── dependencies/
│   │   ├── auth.py           # Current user resolution, admin guard
│   │   └── db.py             # Database session generator (get_db)
│   ├── models/
│   │   ├── base.py           # DeclarativeBase with created_at, updated_at
│   │   ├── user.py           # User model with UUID PK and separate firebase_uid
│   │   ├── category.py       # Hierarchical Category model
│   │   ├── product.py        # Product and ProductVariant models
│   │   ├── review.py         # Product review model
│   │   ├── cart.py           # CartItem model (user-scoped)
│   │   ├── address.py        # Customer address model
│   │   ├── order.py          # Order model with immutable JSON snapshots
│   │   ├── custom_request.py # Custom bulk order inquiries
│   │   ├── coupon.py         # Promotional coupon model
│   │   └── __init__.py       # Model registry for Base.metadata
│   ├── schemas/              # Pydantic v2 validation models
│   │   ├── user.py
│   │   ├── category.py
│   │   ├── product.py
│   │   ├── review.py
│   │   ├── cart.py
│   │   ├── address.py
│   │   ├── order.py
│   │   ├── custom_request.py
│   │   ├── coupon.py
│   │   └── analytics.py
│   ├── routers/              # RESTful API routers
│   │   ├── auth.py           # GET /me
│   │   ├── categories.py     # /categories/*
│   │   ├── products.py       # /products/* and reviews
│   │   ├── cart.py           # /cart/*
│   │   ├── addresses.py      # /addresses/*
│   │   ├── order.py          # /order/*
│   │   ├── custom_requests.py# /custom-requests/*
│   │   └── admin.py          # /admin/* (counts, orders, products, categories, coupons, analytics)
│   └── services/
│       ├── order_service.py  # Cart-to-order checkout and custom request order bridge
│       └── analytics_service.py # Revenue, AOV, order trends, and top products
├── main.py                   # FastAPI instance, CORS, router registrations
├── seed.py                   # Idempotent database taxonomy & product seeder
├── requirements.txt          # Python dependencies
├── .env.example              # Sample environment configuration
└── README.md
```

---

## Setup & Getting Started

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

### 2. Configure Environment

Copy `.env.example` to `.env` and fill in your database credentials and Firebase service account:

```bash
cp .env.example .env
```

```ini
DATABASE_URL=postgresql://ssv_user:password@localhost:5432/ssv_db
CORS_ORIGINS=["http://localhost:3000","http://localhost:5173"]
ADMIN_EMAIL=admin@ssv.test
FIREBASE_CREDENTIALS_PATH=./firebase-credentials.json
```

### 3. Seed Catalog Data

Run the idempotent database seed script to populate categories, products, variants, and coupons:

```bash
python seed.py
```

### 4. Run the Development Server

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

- **Health Check**: `GET http://localhost:8000/health`
- **Interactive Swagger Docs**: `GET http://localhost:8000/docs`
- **ReDoc Specifications**: `GET http://localhost:8000/redoc`

---

## Core Invariants & Business Rules

1. **UUID v4 Primary Keys**: All entities use canonical UUID v4 strings for primary and foreign keys. The `User` model stores the Firebase UID in a separate indexed `firebase_uid` column.
2. **Authoritative Checkout**: `POST /order/` does not trust client prices or items; it reads active `CartItem` rows from the database, validates availability, computes prices, applies coupons, and snapshots the items and delivery address.
3. **Cash on Delivery (`cod`)**: Payment is recorded by administrators. Orders cannot transition to `delivered` status unless `amount_paid >= total`.
4. **Custom Order Bridging**: When an admin confirms a custom bulk request via `POST /admin/custom-requests/{id}/confirm`, an order is automatically created in the `orders` table.
5. **No Delivery Charges**: Delivery charges are zero; prices include all shipping.
6. **No Spice Level**: `spice_level` has been completely deprecated from models, schemas, and endpoints.
