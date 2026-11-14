from collections import defaultdict
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.custom_request import CustomRequest
from app.models.order import Order


def calculate_pct_change(current: float, previous: float) -> float:
    if previous == 0:
        return 100.0 if current > 0 else 0.0
    return round(((current - previous) / previous) * 100.0, 1)


def get_analytics_data(range_param: str, db: Session) -> Dict[str, Any]:
    now = datetime.now(timezone.utc)
    range_norm = (range_param or "30d").lower().strip()

    if range_norm == "today":
        current_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        previous_start = current_start - timedelta(days=1)
        previous_end = current_start
    elif range_norm == "7d":
        current_start = now - timedelta(days=7)
        previous_start = now - timedelta(days=14)
        previous_end = current_start
    elif range_norm == "month":
        current_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        # Previous month start
        if current_start.month == 1:
            previous_start = current_start.replace(year=current_start.year - 1, month=12)
        else:
            previous_start = current_start.replace(month=current_start.month - 1)
        previous_end = current_start
    else:  # default "30d"
        range_norm = "30d"
        current_start = now - timedelta(days=30)
        previous_start = now - timedelta(days=60)
        previous_end = current_start

    # Current period orders
    curr_orders = list(
        db.scalars(
            select(Order)
            .where(Order.placed_at >= current_start)
            .where(Order.status != "cancelled")
        ).all()
    )

    # Previous period orders
    prev_orders = list(
        db.scalars(
            select(Order)
            .where(Order.placed_at >= previous_start, Order.placed_at < previous_end)
            .where(Order.status != "cancelled")
        ).all()
    )

    # Current period custom requests
    curr_requests_count = db.scalar(
        select(func.count(CustomRequest.id)).where(CustomRequest.created_at >= current_start)
    ) or 0

    # Previous period custom requests
    prev_requests_count = db.scalar(
        select(func.count(CustomRequest.id)).where(
            CustomRequest.created_at >= previous_start,
            CustomRequest.created_at < previous_end,
        )
    ) or 0

    # KPI 1: Revenue
    curr_revenue = sum(o.total for o in curr_orders)
    prev_revenue = sum(o.total for o in prev_orders)
    revenue_change = calculate_pct_change(curr_revenue, prev_revenue)

    # KPI 2: Order Counts
    curr_order_count = len(curr_orders)
    prev_order_count = len(prev_orders)
    order_change = calculate_pct_change(curr_order_count, prev_order_count)

    # KPI 3: Average Order Value (AOV)
    curr_aov = round(curr_revenue / curr_order_count) if curr_order_count > 0 else 0
    prev_aov = round(prev_revenue / prev_order_count) if prev_order_count > 0 else 0
    aov_change = calculate_pct_change(curr_aov, prev_aov)

    # KPI 4: Custom Requests
    requests_change = calculate_pct_change(curr_requests_count, prev_requests_count)

    # Revenue by Day
    day_revenue_map: Dict[str, int] = defaultdict(int)
    # Sort orders chronologically
    sorted_curr_orders = sorted(curr_orders, key=lambda o: o.placed_at)
    for o in sorted_curr_orders:
        # Cross-platform day string e.g. "1 Nov"
        if hasattr(o.placed_at, "strftime"):
            day_str = f"{o.placed_at.day} {o.placed_at.strftime('%b')}"
        else:
            day_str = str(o.placed_at)[:10]
        day_revenue_map[day_str] += o.total

    revenue_by_day = [
        {"date": d, "revenue": rev} for d, rev in day_revenue_map.items()
    ]

    # Orders By Status (across all orders in database or current period)
    all_orders = list(db.scalars(select(Order)).all())
    status_counts: Dict[str, int] = defaultdict(int)
    for o in all_orders:
        status_counts[o.status] += 1

    status_priority = ["delivered", "out_for_delivery", "preparing", "confirmed", "pending", "cancelled"]
    orders_by_status = []
    for st in status_priority:
        if st in status_counts:
            orders_by_status.append({"status": st, "count": status_counts[st]})
    # Add any other statuses
    for st, count in status_counts.items():
        if st not in status_priority:
            orders_by_status.append({"status": st, "count": count})

    # Top Products
    product_stats: Dict[str, Dict[str, Any]] = {}
    for o in curr_orders:
        items = o.items or []
        for it in items:
            p_id = it.get("product_id") or it.get("name", "Custom Item")
            name = it.get("name", "Product")
            qty = it.get("qty", 1)
            price = it.get("price", 0)
            rev = price * qty

            if p_id not in product_stats:
                product_stats[p_id] = {
                    "id": p_id,
                    "name": name,
                    "orders_count": 0,
                    "revenue": 0,
                }
            product_stats[p_id]["orders_count"] += qty
            product_stats[p_id]["revenue"] += rev

    top_products = sorted(
        product_stats.values(), key=lambda p: (p["revenue"], p["orders_count"]), reverse=True
    )[:5]

    return {
        "range": range_norm,
        "kpis": {
            "revenue": {
                "value": float(curr_revenue),
                "previous": float(prev_revenue),
                "change": revenue_change,
            },
            "orders": {
                "value": float(curr_order_count),
                "previous": float(prev_order_count),
                "change": order_change,
            },
            "average_order_value": {
                "value": float(curr_aov),
                "previous": float(prev_aov),
                "change": aov_change,
            },
            "custom_requests": {
                "value": float(curr_requests_count),
                "previous": float(prev_requests_count),
                "change": requests_change,
            },
        },
        "revenueByDay": revenue_by_day,
        "ordersByStatus": orders_by_status,
        "topProducts": top_products,
    }
