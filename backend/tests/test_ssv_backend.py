import os
import sys
import uuid
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, select
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

# Ensure backend root is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.core.database import Base
from app.dependencies.auth import get_current_user, get_current_user_claims, require_admin
from app.dependencies.db import get_db
import main

# Test database: In-memory SQLite with StaticPool so all connections share the same DB
TEST_DATABASE_URL = "sqlite:///:memory:"
test_engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)


@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    Base.metadata.create_all(bind=test_engine)
    yield
    Base.metadata.drop_all(bind=test_engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


main.app.dependency_overrides[get_db] = override_get_db

# Dummy users for testing
customer_user_id = "test-customer-uuid"
customer_firebase_uid = "firebase-customer-123"

admin_user_id = "test-admin-uuid"
admin_firebase_uid = "firebase-admin-999"


def get_mock_customer():
    from app.models.user import User

    db = TestingSessionLocal()
    try:
        user = db.scalar(
            select(User).where(User.firebase_uid == customer_firebase_uid)
        )
        if not user:
            user = User(
                id=customer_user_id,
                firebase_uid=customer_firebase_uid,
                email="customer@ssv.test",
                name="Priya Customer",
                role="customer",
            )
            db.add(user)
            db.commit()
            db.refresh(user)
        return user
    finally:
        db.close()


def get_mock_admin():
    from app.models.user import User

    db = TestingSessionLocal()
    try:
        user = db.scalar(
            select(User).where(User.firebase_uid == admin_firebase_uid)
        )
        if not user:
            user = User(
                id=admin_user_id,
                firebase_uid=admin_firebase_uid,
                email="admin@ssv.test",
                name="SSV Admin",
                role="admin",
            )
            db.add(user)
            db.commit()
            db.refresh(user)
        return user
    finally:
        db.close()


client = TestClient(main.app)


def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok", "version": "2.0.0"}


def test_categories_and_products_flow():
    # Setup admin auth override
    main.app.dependency_overrides[get_current_user] = get_mock_admin
    main.app.dependency_overrides[require_admin] = get_mock_admin

    # 1. Admin creates root category
    cat_payload = {
        "name": "Cold Pressed Oils",
        "slug": "cold-pressed-oils",
        "description": "Pure oils",
        "image_url": "https://res.cloudinary.com/ssv/oils.jpg",
        "display_order": 1,
    }
    cat_res = client.post("/admin/categories", json=cat_payload)
    assert cat_res.status_code == 201
    parent_cat = cat_res.json()
    parent_cat_id = parent_cat["id"]

    # 2. Admin creates subcategory
    sub_payload = {
        "name": "Sesame Oil",
        "slug": "sesame-oil",
        "parent_id": parent_cat_id,
        "description": "Sesame variant",
        "display_order": 1,
    }
    sub_res = client.post("/admin/categories", json=sub_payload)
    assert sub_res.status_code == 201
    sub_cat_id = sub_res.json()["id"]

    # 3. Admin creates product with variants
    prod_payload = {
        "name": "Cold Pressed Sesame Oil",
        "slug": "cold-pressed-sesame-oil",
        "category_id": parent_cat_id,
        "subcategory_id": sub_cat_id,
        "image_url": "https://res.cloudinary.com/ssv/sesame.jpg",
        "gallery": [
            "https://res.cloudinary.com/ssv/gallery1.jpg",
            "https://res.cloudinary.com/ssv/gallery2.jpg",
        ],
        "badge": "Bestseller",
        "shelf_life_months": 12,
        "description": "Golden sesame oil aroma",
        "story": "Direct from farm",
        "ingredients": ["Sesame seeds"],
        "available": True,
        "variants": [
            {"label": "500 ml", "weight_g": 460, "price": 340, "available": True},
            {"label": "1 L", "weight_g": 920, "price": 640, "available": True},
        ],
    }
    prod_res = client.post("/admin/products", json=prod_payload)
    assert prod_res.status_code == 201
    prod_data = prod_res.json()
    product_id = prod_data["id"]
    variant_1l_id = prod_data["variants"][1]["id"]

    # 4. Public storefront GET /products/
    main.app.dependency_overrides.pop(get_current_user, None)
    main.app.dependency_overrides.pop(require_admin, None)

    public_prods = client.get("/products/")
    assert public_prods.status_code == 200
    p_json = public_prods.json()
    assert p_json["total"] >= 1
    assert any(p["id"] == product_id for p in p_json["products"])

    # 5. Public storefront GET /products/{slug}
    p_detail = client.get(f"/products/cold-pressed-sesame-oil")
    assert p_detail.status_code == 200
    assert p_detail.json()["id"] == product_id
    assert len(p_detail.json()["gallery"]) == 2


def test_customer_cart_and_order_flow():
    # Setup customer auth override
    main.app.dependency_overrides[get_current_user] = get_mock_customer

    # 1. Get product variant
    public_prods = client.get("/products/").json()
    product = public_prods["products"][0]
    prod_id = product["id"]
    variant_id = product["variants"][0]["id"]
    variant_price = product["variants"][0]["price"]

    # 2. Add to cart
    cart_res = client.post(
        "/cart/items",
        json={"product_id": prod_id, "variant_id": variant_id, "quantity": 2},
    )
    assert cart_res.status_code == 201
    cart_item_id = cart_res.json()["id"]

    # 3. Get cart and check subtotal
    cart_get = client.get("/cart/")
    assert cart_get.status_code == 200
    assert cart_get.json()["subtotal"] == variant_price * 2

    # 4. Create an address
    addr_res = client.post(
        "/addresses/",
        json={
            "name": "Priya Sharma",
            "phone": "9876543210",
            "door_no": "12/4",
            "street": "Temple Street",
            "city": "Coimbatore",
            "state": "Tamil Nadu",
            "pincode": "641001",
        },
    )
    assert addr_res.status_code == 201
    addr_id = addr_res.json()["id"]
    assert addr_res.json()["is_default"] is True

    # 5. Create promotional coupon as admin
    main.app.dependency_overrides[get_current_user] = get_mock_admin
    main.app.dependency_overrides[require_admin] = get_mock_admin
    client.post(
        "/admin/coupons",
        json={
            "code": "DISCOUNT50",
            "type": "FIXED",
            "value": 50,
            "min_order": 100,
            "active": True,
        },
    )

    # 6. Place order as customer with coupon
    main.app.dependency_overrides[get_current_user] = get_mock_customer
    main.app.dependency_overrides.pop(require_admin, None)

    order_res = client.post(
        "/order/",
        json={
            "address_id": addr_id,
            "payment_method": "cod",
            "coupon_code": "DISCOUNT50",
        },
    )
    assert order_res.status_code == 201
    order_data = order_res.json()
    order_id = order_data["id"]
    assert order_data["subtotal"] == variant_price * 2
    assert order_data["coupon_discount"] == 50
    assert order_data["total"] == (variant_price * 2) - 50
    assert order_data["payment_method"] == "cod"
    assert order_data["amount_paid"] == 0
    assert order_data["status"] == "pending"

    # Cart should now be empty
    cart_after = client.get("/cart/").json()
    assert len(cart_after["cart_items"]) == 0
    assert cart_after["subtotal"] == 0

    # 7. Customer cancels order test
    cancel_res = client.patch(f"/order/{order_id}/cancel")
    assert cancel_res.status_code == 200
    assert cancel_res.json()["status"] == "cancelled"


def test_admin_order_payment_enforcement():
    main.app.dependency_overrides[get_current_user] = get_mock_customer

    # Add item to cart and re-order
    prods = client.get("/products/").json()["products"]
    prod_id = prods[0]["id"]
    var_id = prods[0]["variants"][0]["id"]
    client.post(
        "/cart/items", json={"product_id": prod_id, "variant_id": var_id, "quantity": 1}
    )

    addrs = client.get("/addresses/").json()
    addr_id = addrs[0]["id"]

    order_res = client.post(
        "/order/", json={"address_id": addr_id, "payment_method": "cod"}
    )
    assert order_res.status_code == 201
    order_id = order_res.json()["id"]
    order_total = order_res.json()["total"]

    # Switch to Admin
    main.app.dependency_overrides[get_current_user] = get_mock_admin
    main.app.dependency_overrides[require_admin] = get_mock_admin

    # Admin attempts to set delivered with amount_paid = 0 -> MUST FAIL 400
    fail_res = client.patch(
        f"/admin/order/{order_id}",
        json={"status": "delivered"},
    )
    assert fail_res.status_code == 400
    assert "payment" in fail_res.json()["detail"].lower()

    # Admin sets full payment and status delivered simultaneously -> MUST SUCCEED 200
    success_res = client.patch(
        f"/admin/order/{order_id}",
        json={"amount_paid": order_total, "status": "delivered"},
    )
    assert success_res.status_code == 200
    assert success_res.json()["status"] == "delivered"
    assert success_res.json()["amount_paid"] == order_total
    assert success_res.json()["delivered_at"] is not None


def test_custom_request_confirm_order_bridge():
    main.app.dependency_overrides[get_current_user] = get_mock_customer

    # 1. Customer creates custom request
    cr_res = client.post(
        "/custom-requests/",
        json={
            "name": "Priya Sharma",
            "contact": "priya@ssv.test",
            "mobile": "9876543210",
            "preferred_product": "Bulk Wood Pressed Groundnut Oil",
            "quantity_kg": "25",
            "customization_text": "Need 5 tins for wedding",
        },
    )
    assert cr_res.status_code == 201
    cr_id = cr_res.json()["id"]

    # 2. Customer lists own requests - admin_notes should be omitted
    my_cr = client.get("/custom-requests/me").json()
    assert any(r["id"] == cr_id for r in my_cr)
    assert "admin_notes" not in my_cr[0]

    # 3. Admin confirms request -> creates order
    main.app.dependency_overrides[get_current_user] = get_mock_admin
    main.app.dependency_overrides[require_admin] = get_mock_admin

    # Get customer address
    cust_addrs = client.get(f"/admin/custom-requests/{cr_id}/addresses").json()
    addr_id = cust_addrs[0]["id"]

    confirm_res = client.post(
        f"/admin/custom-requests/{cr_id}/confirm",
        json={"price": 4500, "address_id": addr_id, "notes": "Negotiated via phone"},
    )
    assert confirm_res.status_code == 201
    created_order = confirm_res.json()
    assert created_order["total"] == 4500
    assert created_order["source_request_id"] == cr_id
    assert created_order["status"] == "confirmed"

    # Duplicate confirmation must fail
    dup_res = client.post(
        f"/admin/custom-requests/{cr_id}/confirm",
        json={"price": 4500, "address_id": addr_id},
    )
    assert dup_res.status_code == 400


def test_analytics_endpoint():
    main.app.dependency_overrides[get_current_user] = get_mock_admin
    main.app.dependency_overrides[require_admin] = get_mock_admin

    res = client.get("/admin/analytics?range=30d")
    assert res.status_code == 200
    data = res.json()
    assert "kpis" in data
    assert "revenue" in data["kpis"]
    assert "orders" in data["kpis"]
    assert "revenueByDay" in data
    assert "ordersByStatus" in data
    assert "topProducts" in data


def test_review_verified_buyer_guard():
    # Customer tries to review a product they haven't bought yet
    main.app.dependency_overrides[get_current_user] = get_mock_customer

    # Create an unpurchased product
    main.app.dependency_overrides[require_admin] = get_mock_admin
    cat_id = client.get("/categories/").json()[0]["id"]
    unbought_prod = client.post(
        "/admin/products",
        json={
            "name": "Unpurchased Honey",
            "category_id": cat_id,
            "description": "Honey not yet bought",
            "image_url": "https://res.cloudinary.com/ssv/honey.jpg",
            "variants": [{"label": "500g", "weight_g": 500, "price": 400}],
        },
    ).json()
    unbought_id = unbought_prod["id"]

    # Customer attempts to review -> 403 Forbidden
    main.app.dependency_overrides.pop(require_admin, None)
    rev_fail = client.post(
        f"/products/{unbought_id}/reviews",
        json={
            "user_name": "Priya",
            "rating": 5,
            "comment": "Nice product even though I didn't buy it",
            "images": ["https://res.cloudinary.com/ssv/review-photo.jpg"],
        },
    )
    assert rev_fail.status_code == 403

    # Now customer reviews the Sesame Oil product that was ordered and marked delivered
    purchased_prod = client.get("/products/cold-pressed-sesame-oil").json()
    purchased_prod_id = purchased_prod["id"]
    rev_ok = client.post(
        f"/products/{purchased_prod_id}/reviews",
        json={
            "user_name": "Priya Sharma",
            "rating": 5,
            "title": "Authentic and pure",
            "comment": "Wonderful traditional oil for cooking.",
            "variant_label": "1 L",
            "images": [
                "https://res.cloudinary.com/ssv/review-photo-1.jpg",
                "https://res.cloudinary.com/ssv/review-photo-2.jpg",
            ],
        },
    )
    assert rev_ok.status_code == 201
    assert rev_ok.json()["verified_buyer"] is True
    assert len(rev_ok.json()["images"]) == 2

    # Check reviews listing returns flat array
    rev_list = client.get(f"/products/{purchased_prod_id}/reviews").json()
    assert isinstance(rev_list, list)
    assert len(rev_list) >= 1
    assert rev_list[0]["rating"] == 5
    assert len(rev_list[0]["images"]) == 2

    review_without_images = client.post(
        f"/products/{purchased_prod_id}/reviews",
        json={
            "user_name": "Priya Sharma",
            "rating": 4,
            "comment": "A review without attached photos.",
        },
    )
    assert review_without_images.status_code == 201
    assert review_without_images.json()["images"] == []

    too_many_images = client.post(
        f"/products/{purchased_prod_id}/reviews",
        json={
            "user_name": "Priya Sharma",
            "rating": 5,
            "comment": "Too many photos in this review.",
            "images": [
                "https://res.cloudinary.com/ssv/review-1.jpg",
                "https://res.cloudinary.com/ssv/review-2.jpg",
                "https://res.cloudinary.com/ssv/review-3.jpg",
            ],
        },
    )
    assert too_many_images.status_code == 422

    insecure_image = client.post(
        f"/products/{purchased_prod_id}/reviews",
        json={
            "user_name": "Priya Sharma",
            "rating": 5,
            "comment": "Image URL must use HTTPS.",
            "images": ["http://example.com/review.jpg"],
        },
    )
    assert insecure_image.status_code == 422


def test_coupon_guard_and_toggle():
    main.app.dependency_overrides[get_current_user] = get_mock_admin
    main.app.dependency_overrides[require_admin] = get_mock_admin

    # Create coupon
    cp_res = client.post(
        "/admin/coupons",
        json={
            "code": "SUMMER20",
            "type": "PERCENT",
            "value": 20,
            "active": True,
        },
    )
    assert cp_res.status_code == 201
    cp_id = cp_res.json()["id"]

    # Toggle coupon
    tog_res = client.patch(f"/admin/coupons/{cp_id}/toggle", json={"active": False})
    assert tog_res.status_code == 200
    assert tog_res.json()["active"] is False

    # Delete unused coupon -> should succeed 204
    del_res = client.delete(f"/admin/coupons/{cp_id}")
    assert del_res.status_code == 204

    # Delete coupon that has usages (e.g. DISCOUNT50 from order test) -> should fail 400
    all_cps = client.get("/admin/coupons").json()
    used_cp = next((c for c in all_cps if c["used_count"] > 0), None)
    if used_cp:
        del_fail = client.delete(f"/admin/coupons/{used_cp['id']}")
        assert del_fail.status_code == 400


def test_product_delete_guard_on_historical_orders():
    main.app.dependency_overrides[get_current_user] = get_mock_admin
    main.app.dependency_overrides[require_admin] = get_mock_admin

    # Attempt to delete Sesame Oil which exists in active orders -> must return 409
    purchased_prod = client.get("/products/cold-pressed-sesame-oil").json()
    ordered_prod_id = purchased_prod["id"]

    del_fail = client.delete(f"/admin/products/{ordered_prod_id}")
    assert del_fail.status_code == 409
    assert "historical orders" in del_fail.json()["detail"].lower()


def test_user_role_sync_from_claims():
    from app.dependencies.auth import get_current_user
    from app.models.user import User

    db = TestingSessionLocal()
    try:
        # 1. User created with customer claim
        customer_claims = {
            "uid": "sync-test-uid-1",
            "email": "synctest1@ssv.test",
            "name": "Sync User",
            "role": "customer",
        }
        user = get_current_user(claims=customer_claims, db=db)
        assert user.role == "customer"

        # 2. User promoted to admin in Firebase claims
        admin_claims = {
            "uid": "sync-test-uid-1",
            "email": "synctest1@ssv.test",
            "name": "Sync User",
            "role": "admin",
        }
        updated_user = get_current_user(claims=admin_claims, db=db)
        assert updated_user.role == "admin"

        # Verify DB persisted role update
        db_user = db.scalar(select(User).where(User.firebase_uid == "sync-test-uid-1"))
        assert db_user.role == "admin"
    finally:
        db.close()

