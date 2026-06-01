from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Product


class InventoryItem(BaseModel):
    product_id: int
    sku: str
    name: str
    stock_quantity: int
    low_stock: bool


router = APIRouter(prefix="/inventory", tags=["inventory"])

LOW_STOCK_THRESHOLD = 10


@router.get("", response_model=list[InventoryItem])
def inventory_snapshot(db: Session = Depends(get_db)):
    products = db.query(Product).order_by(Product.name).all()
    return [
        InventoryItem(
            product_id=p.id,
            sku=p.sku,
            name=p.name,
            stock_quantity=p.stock_quantity,
            low_stock=p.stock_quantity <= LOW_STOCK_THRESHOLD,
        )
        for p in products
    ]
