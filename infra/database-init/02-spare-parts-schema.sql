-- EV91 Platform Database Setup Script
-- This script initializes the spare_parts schema with required configurations

-- Set search path to spare_parts schema
SET search_path TO spare_parts;

-- Enable required extensions for spare_parts schema
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" SCHEMA spare_parts;
CREATE EXTENSION IF NOT EXISTS "pgcrypto" SCHEMA spare_parts;
CREATE EXTENSION IF NOT EXISTS "pg_trgm" SCHEMA spare_parts;

-- Create custom types for spare parts domain
DO $$
BEGIN
    -- Supplier status enum
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'supplier_status_enum') THEN
        CREATE TYPE spare_parts.supplier_status_enum AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED', 'BLACKLISTED');
    END IF;
    
    -- Part condition enum
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'part_condition_enum') THEN
        CREATE TYPE spare_parts.part_condition_enum AS ENUM ('NEW', 'REFURBISHED', 'USED', 'DAMAGED', 'DEFECTIVE');
    END IF;
    
    -- Stock movement type enum
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'movement_type_enum') THEN
        CREATE TYPE spare_parts.movement_type_enum AS ENUM ('IN', 'OUT', 'TRANSFER', 'ADJUSTMENT', 'DAMAGED', 'RETURN', 'LOSS', 'FOUND');
    END IF;
    
    -- Purchase order status enum
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'po_status_enum') THEN
        CREATE TYPE spare_parts.po_status_enum AS ENUM ('DRAFT', 'SENT', 'CONFIRMED', 'PARTIAL', 'DELIVERED', 'CANCELLED', 'REJECTED');
    END IF;
    
    -- Payment terms enum
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_terms_enum') THEN
        CREATE TYPE spare_parts.payment_terms_enum AS ENUM ('COD', 'NET_15', 'NET_30', 'NET_45', 'NET_60', 'ADVANCE', 'CREDIT');
    END IF;
    
    -- Quality grade enum
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'quality_grade_enum') THEN
        CREATE TYPE spare_parts.quality_grade_enum AS ENUM ('A', 'B', 'C', 'REJECT');
    END IF;
END $$;

-- Create indexes for better performance
DO $$
BEGIN
    -- Check if we're in the right schema context
    IF current_schema() = 'spare_parts' THEN
        RAISE NOTICE 'Setting up spare_parts schema indexes and triggers...';
        
        -- Note: Actual table indexes will be created by Prisma migrations
        -- This script just sets up the foundational elements
        
        RAISE NOTICE 'Spare parts schema setup completed successfully';
    END IF;
END $$;

-- Create audit functions for tracking changes
CREATE OR REPLACE FUNCTION spare_parts.update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create function to generate internal codes
CREATE OR REPLACE FUNCTION spare_parts.generate_internal_code(prefix TEXT)
RETURNS TEXT AS $$
DECLARE
    next_number INTEGER;
    formatted_number TEXT;
BEGIN
    -- This is a simple implementation - in production, you might want a more sophisticated system
    SELECT COALESCE(MAX(CAST(SUBSTRING(internal_code FROM LENGTH(prefix) + 2) AS INTEGER)), 0) + 1
    INTO next_number
    FROM spare_parts.spare_parts 
    WHERE internal_code LIKE prefix || '-%';
    
    formatted_number := LPAD(next_number::TEXT, 6, '0');
    RETURN prefix || '-' || formatted_number;
END;
$$ LANGUAGE plpgsql;

-- Create function to calculate stock value
CREATE OR REPLACE FUNCTION spare_parts.calculate_stock_value(part_id TEXT, store_id TEXT)
RETURNS DECIMAL AS $$
DECLARE
    stock_count INTEGER;
    unit_cost DECIMAL;
    total_value DECIMAL;
BEGIN
    -- Get current stock
    SELECT current_stock INTO stock_count
    FROM spare_parts.inventory_levels 
    WHERE spare_part_id = part_id AND store_id = store_id;
    
    -- Get latest cost price
    SELECT cost_price INTO unit_cost
    FROM spare_parts.spare_parts 
    WHERE id = part_id;
    
    -- Calculate total value
    total_value := COALESCE(stock_count, 0) * COALESCE(unit_cost, 0);
    
    RETURN total_value;
END;
$$ LANGUAGE plpgsql;

-- Create function to check low stock
CREATE OR REPLACE FUNCTION spare_parts.check_low_stock()
RETURNS TABLE(
    part_id TEXT,
    part_name TEXT,
    current_stock INTEGER,
    minimum_stock INTEGER,
    store_id TEXT,
    store_name TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        sp.id,
        sp.name,
        il.current_stock,
        il.minimum_stock,
        il.store_id,
        il.store_name
    FROM spare_parts.inventory_levels il
    JOIN spare_parts.spare_parts sp ON il.spare_part_id = sp.id
    WHERE il.current_stock <= il.minimum_stock
    AND sp.is_active = true
    ORDER BY (il.current_stock::FLOAT / NULLIF(il.minimum_stock, 0)) ASC;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions to application roles
DO $$
BEGIN
    -- Grant usage on custom types
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'ev91_app') THEN
        GRANT USAGE ON TYPE spare_parts.supplier_status_enum TO ev91_app;
        GRANT USAGE ON TYPE spare_parts.part_condition_enum TO ev91_app;
        GRANT USAGE ON TYPE spare_parts.movement_type_enum TO ev91_app;
        GRANT USAGE ON TYPE spare_parts.po_status_enum TO ev91_app;
        GRANT USAGE ON TYPE spare_parts.payment_terms_enum TO ev91_app;
        GRANT USAGE ON TYPE spare_parts.quality_grade_enum TO ev91_app;
        
        -- Grant execute on functions
        GRANT EXECUTE ON FUNCTION spare_parts.update_modified_column() TO ev91_app;
        GRANT EXECUTE ON FUNCTION spare_parts.generate_internal_code(TEXT) TO ev91_app;
        GRANT EXECUTE ON FUNCTION spare_parts.calculate_stock_value(TEXT, TEXT) TO ev91_app;
        GRANT EXECUTE ON FUNCTION spare_parts.check_low_stock() TO ev91_app;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'ev91_readonly') THEN
        GRANT EXECUTE ON FUNCTION spare_parts.calculate_stock_value(TEXT, TEXT) TO ev91_readonly;
        GRANT EXECUTE ON FUNCTION spare_parts.check_low_stock() TO ev91_readonly;
    END IF;
END $$;

-- Log completion
DO $$
BEGIN
    RAISE NOTICE 'Spare Parts schema initialization completed at %', CURRENT_TIMESTAMP;
    RAISE NOTICE 'Schema: spare_parts';
    RAISE NOTICE 'Custom types, functions, and permissions have been set up';
END $$;
