from typing import Dict, List, Optional
from pydantic import BaseModel, ConfigDict


class KPIMetric(BaseModel):
    value: float
    previous: float
    change: float


class RevenueDay(BaseModel):
    date: str
    revenue: int


class OrderStatusCount(BaseModel):
    status: str
    count: int


class TopProduct(BaseModel):
    id: str
    name: str
    orders_count: int
    revenue: int


class AnalyticsResponse(BaseModel):
    range: str
    kpis: Dict[str, KPIMetric]
    revenueByDay: List[RevenueDay]
    ordersByStatus: List[OrderStatusCount]
    topProducts: List[TopProduct]

    model_config = ConfigDict(from_attributes=True)
