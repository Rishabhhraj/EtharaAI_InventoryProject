export interface Product {
  id: number;
  sku: string;
  name: string;
  description: string | null;
  price: string;
  stock_quantity: number;
  created_at: string;
  updated_at: string;
}

export interface Customer {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  address: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: number;
  product_id: number;
  product_name: string;
  product_sku: string;
  quantity: number;
  unit_price: string;
  line_total: string;
}

export interface Order {
  id: number;
  customer_id: number;
  customer_name: string;
  status: string;
  total_amount: string;
  items: OrderItem[];
  created_at: string;
  updated_at: string;
}

export interface InventoryItem {
  product_id: number;
  sku: string;
  name: string;
  stock_quantity: number;
  low_stock: boolean;
}
