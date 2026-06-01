from decimal import Decimal

from fastapi import HTTPException, status
from sqlalchemy.orm import Session, joinedload

from app.models import Customer, Order, OrderItem, Product
from app.schemas.order import OrderCreate, OrderResponse, OrderItemResponse


class InsufficientStockError(Exception):
    def __init__(self, product_name: str, sku: str, requested: int, available: int):
        self.product_name = product_name
        self.sku = sku
        self.requested = requested
        self.available = available
        super().__init__(
            f"Insufficient stock for '{product_name}' (SKU: {sku}). "
            f"Requested: {requested}, Available: {available}"
        )


def create_order(db: Session, payload: OrderCreate) -> OrderResponse:
    customer = db.query(Customer).filter(Customer.id == payload.customer_id).first()
    if not customer:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Customer not found")

    try:
        return _create_order_transaction(db, payload, customer)
    except InsufficientStockError:
        db.rollback()
        raise


def _create_order_transaction(db: Session, payload: OrderCreate, customer: Customer) -> OrderResponse:
    product_ids = [item.product_id for item in payload.items]
    if len(product_ids) != len(set(product_ids)):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Duplicate products in the same order are not allowed. Combine quantities instead.",
        )

    products = {
        p.id: p
        for p in db.query(Product).filter(Product.id.in_(product_ids)).with_for_update().all()
    }

    if len(products) != len(product_ids):
        missing = set(product_ids) - set(products.keys())
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Product(s) not found: {sorted(missing)}",
        )

    for item in payload.items:
        product = products[item.product_id]
        if product.stock_quantity < item.quantity:
            raise InsufficientStockError(
                product.name, product.sku, item.quantity, product.stock_quantity
            )

    order = Order(customer_id=customer.id, status="confirmed", total_amount=Decimal("0"))
    db.add(order)
    db.flush()

    total = Decimal("0")
    for item in payload.items:
        product = products[item.product_id]
        unit_price = Decimal(str(product.price))
        line_total = unit_price * item.quantity

        order_item = OrderItem(
            order_id=order.id,
            product_id=product.id,
            quantity=item.quantity,
            unit_price=unit_price,
            line_total=line_total,
        )
        db.add(order_item)
        product.stock_quantity -= item.quantity
        total += line_total

    order.total_amount = total
    db.commit()
    db.refresh(order)
    return _to_order_response(order)


def get_order(db: Session, order_id: int) -> OrderResponse:
    order = (
        db.query(Order)
        .options(
            joinedload(Order.items).joinedload(OrderItem.product),
            joinedload(Order.customer),
        )
        .filter(Order.id == order_id)
        .first()
    )
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")
    return _to_order_response(order)


def list_orders(db: Session, skip: int = 0, limit: int = 100) -> list[OrderResponse]:
    orders = (
        db.query(Order)
        .options(
            joinedload(Order.items).joinedload(OrderItem.product),
            joinedload(Order.customer),
        )
        .order_by(Order.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )
    return [_to_order_response(o) for o in orders]


def _to_order_response(order: Order) -> OrderResponse:
    return OrderResponse(
        id=order.id,
        customer_id=order.customer_id,
        customer_name=order.customer.name,
        status=order.status,
        total_amount=order.total_amount,
        items=[
            OrderItemResponse(
                id=oi.id,
                product_id=oi.product_id,
                product_name=oi.product.name,
                product_sku=oi.product.sku,
                quantity=oi.quantity,
                unit_price=oi.unit_price,
                line_total=oi.line_total,
            )
            for oi in order.items
        ],
        created_at=order.created_at,
        updated_at=order.updated_at,
    )
