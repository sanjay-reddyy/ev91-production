-- Create the "orders" schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS orders;

-- Set the search path to use the "orders" schema
SET search_path TO orders;

-- Cities table
CREATE TABLE IF NOT EXISTS orders.cities (
  id TEXT PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  state TEXT NOT NULL,
  country TEXT NOT NULL DEFAULT 'India',
  timezone TEXT NOT NULL DEFAULT 'Asia/Kolkata',
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  pin_code_range TEXT,
  region_code TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_operational BOOLEAN NOT NULL DEFAULT true,
  launch_date TIMESTAMP,
  estimated_population INTEGER,
  market_potential TEXT,
  version INTEGER NOT NULL DEFAULT 1,
  last_modified_by TEXT,
  event_sequence INTEGER NOT NULL DEFAULT 0,
  last_sync_at TIMESTAMP NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL
);

-- Orders table
CREATE TABLE IF NOT EXISTS orders.orders (
  id TEXT PRIMARY KEY,
  order_number TEXT UNIQUE NOT NULL,
  client_id TEXT NOT NULL,
  client_name TEXT NOT NULL,
  client_code TEXT NOT NULL,
  store_id TEXT NOT NULL,
  store_name TEXT NOT NULL,
  store_code TEXT NOT NULL,
  store_address TEXT,
  city_id TEXT NOT NULL,
  city_name TEXT NOT NULL,
  rider_id TEXT,
  rider_name TEXT,
  rider_phone TEXT,
  order_type TEXT NOT NULL,
  order_source TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'NORMAL',
  status TEXT NOT NULL DEFAULT 'CREATED',
  status_reason TEXT,
  status_history TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL,
  assigned_at TIMESTAMP,
  picked_at TIMESTAMP,
  delivered_at TIMESTAMP,
  estimated_pickup_time TIMESTAMP,
  estimated_delivery_time TIMESTAMP,
  scheduled_for TIMESTAMP,
  customer_name TEXT,
  customer_phone TEXT,
  customer_email TEXT,
  pickup_address TEXT,
  pickup_latitude DOUBLE PRECISION,
  pickup_longitude DOUBLE PRECISION,
  delivery_address TEXT,
  delivery_latitude DOUBLE PRECISION,
  delivery_longitude DOUBLE PRECISION,
  distance DOUBLE PRECISION,
  payment_method TEXT NOT NULL,
  payment_status TEXT NOT NULL DEFAULT 'PENDING',
  order_value DOUBLE PRECISION NOT NULL,
  delivery_fee DOUBLE PRECISION NOT NULL DEFAULT 0,
  total_amount DOUBLE PRECISION NOT NULL,
  currency TEXT NOT NULL DEFAULT 'INR',
  vehicle_id TEXT,
  vehicle_type TEXT,
  battery_level INTEGER,
  battery_consumed INTEGER,
  item_count INTEGER NOT NULL DEFAULT 1,
  item_summary TEXT,
  special_instructions TEXT,
  rider_rating DOUBLE PRECISION,
  customer_rating DOUBLE PRECISION,
  rider_feedback TEXT,
  customer_feedback TEXT,
  tags TEXT,
  notes TEXT,
  cancelled_by TEXT,
  failure_reason TEXT,
  synced_with_rider BOOLEAN NOT NULL DEFAULT false,
  synced_with_client_store BOOLEAN NOT NULL DEFAULT false,
  last_sync_attempt TIMESTAMP,
  FOREIGN KEY (city_id) REFERENCES orders.cities(id)
);

-- Order Items table
CREATE TABLE IF NOT EXISTS orders.order_items (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  sku TEXT,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price DOUBLE PRECISION NOT NULL,
  total_price DOUBLE PRECISION NOT NULL,
  status TEXT NOT NULL DEFAULT 'ORDERED',
  notes TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL,
  FOREIGN KEY (order_id) REFERENCES orders.orders(id) ON DELETE CASCADE
);

-- Order Status Updates table
CREATE TABLE IF NOT EXISTS orders.order_status_updates (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL,
  from_status TEXT NOT NULL,
  to_status TEXT NOT NULL,
  reason TEXT,
  notes TEXT,
  updated_by TEXT,
  updated_by_name TEXT,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  FOREIGN KEY (order_id) REFERENCES orders.orders(id) ON DELETE CASCADE
);

-- Order Tracking table
CREATE TABLE IF NOT EXISTS orders.order_tracking (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL UNIQUE,
  current_location TEXT,
  current_latitude DOUBLE PRECISION,
  current_longitude DOUBLE PRECISION,
  last_updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  estimated_arrival TIMESTAMP,
  delay_minutes INTEGER DEFAULT 0,
  delay_reason TEXT,
  location_history TEXT,
  checkpoints TEXT,
  public_tracking_id TEXT UNIQUE,
  public_tracking_url TEXT,
  FOREIGN KEY (order_id) REFERENCES orders.orders(id) ON DELETE CASCADE
);

-- Order Payments table
CREATE TABLE IF NOT EXISTS orders.order_payments (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL UNIQUE,
  payment_method TEXT NOT NULL,
  payment_status TEXT NOT NULL DEFAULT 'PENDING',
  amount DOUBLE PRECISION NOT NULL,
  currency TEXT NOT NULL DEFAULT 'INR',
  transaction_id TEXT,
  payment_gateway TEXT,
  payment_url TEXT,
  gateway_response TEXT,
  paid_at TIMESTAMP,
  payment_due_by TIMESTAMP,
  payer_name TEXT,
  payer_phone TEXT,
  payer_email TEXT,
  is_refunded BOOLEAN NOT NULL DEFAULT false,
  refund_amount DOUBLE PRECISION,
  refund_reason TEXT,
  refunded_at TIMESTAMP,
  refund_transaction_id TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL,
  FOREIGN KEY (order_id) REFERENCES orders.orders(id) ON DELETE CASCADE
);

-- Order Events table
CREATE TABLE IF NOT EXISTS orders.order_events (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL,
  order_number TEXT NOT NULL,
  event_type TEXT NOT NULL,
  event_data TEXT NOT NULL,
  target_service TEXT NOT NULL,
  process_status TEXT NOT NULL DEFAULT 'PENDING',
  process_attempts INTEGER NOT NULL DEFAULT 0,
  last_attempt_at TIMESTAMP,
  processed_at TIMESTAMP,
  error_details TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL
);

-- City Event Log table
CREATE TABLE IF NOT EXISTS orders.city_event_log (
  id TEXT PRIMARY KEY,
  city_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  event_data TEXT NOT NULL,
  processed BOOLEAN NOT NULL DEFAULT false,
  processed_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_orders_composite ON orders.orders(client_id, store_id, rider_id, status);
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders.orders(order_number);
CREATE INDEX IF NOT EXISTS idx_order_events_order_status ON orders.order_events(order_id, process_status);
CREATE INDEX IF NOT EXISTS idx_order_events_service_status ON orders.order_events(target_service, process_status);
CREATE INDEX IF NOT EXISTS idx_city_event_log_processed ON orders.city_event_log(processed);
